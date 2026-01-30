import { db } from "@/db";
import { dailyPrices, propertyPromotions, promotions } from "@/db/schema";
import { and, eq, gte, lt } from "drizzle-orm";

export async function calculatePriceForRange(
  propertyId: number, 
  startDate: Date, 
  endDate: Date
) {
  // Normalize Dates (Strip time to avoid timezone bugs)
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // 1. GET DAILY PRICES
  // We fetch prices where date >= start AND date < end (Checkout day is not priced)
  const prices = await db.query.dailyPrices.findMany({
    where: and(
      eq(dailyPrices.propertyId, propertyId),
      gte(dailyPrices.date, startStr),
      lt(dailyPrices.date, endStr)
    )
  });

  // Validation: Ensure we found prices for every night
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (prices.length < daysDiff) {
    return null; // Missing prices for some days
  }

  // Sum Base Price
  let totalPrice = prices.reduce((sum, p) => sum + Number(p.price), 0);
  const currency = prices[0]?.currency || "EUR";

  // 2. CHECK PROMOTIONS
  const activePromos = await db
    .select({
      id: promotions.id,
      name: promotions.name,
      type: promotions.type,
      value: promotions.value,
      minStay: promotions.minStay,
      start: promotions.bookingWindowStart,
      end: promotions.bookingWindowEnd,
    })
    .from(propertyPromotions)
    .innerJoin(promotions, eq(propertyPromotions.promotionId, promotions.id))
    .where(and(
      eq(propertyPromotions.propertyId, propertyId),
      eq(promotions.isActive, true)
    ));

  const appliedPromotions: { name: string; amount: number }[] = [];

  // 3. APPLY PROMOTIONS
  for (const promo of activePromos) {
    let isValid = true;

    // Condition: Min Stay
    if (promo.minStay && daysDiff < promo.minStay) isValid = false;

    // Condition: Booking Window
    const todayStr = new Date().toISOString().split('T')[0];
    if (promo.start && todayStr < promo.start) isValid = false;
    if (promo.end && todayStr > promo.end) isValid = false;

    if (isValid) {
      let discountAmount = 0;
      const val = Number(promo.value);

      if (promo.type === "percentage") {
        discountAmount = totalPrice * (val / 100);
      } else if (promo.type === "fixed_amount") {
        discountAmount = val;
      }

      totalPrice -= discountAmount;
      appliedPromotions.push({ name: promo.name, amount: discountAmount });
    }
  }

  if (totalPrice < 0) totalPrice = 0;

  return {
    originalPrice: prices.reduce((sum, p) => sum + Number(p.price), 0),
    finalPrice: totalPrice,
    currency,
    appliedPromotions
  };
}