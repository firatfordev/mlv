import { db } from "@/db";
import { dailyPrices, propertyPromotions, properties } from "@/db/schema";
import { and, eq, gte, lt } from "drizzle-orm";

export async function calculatePriceForRange(
  propertyId: number, 
  startDate: Date, 
  endDate: Date,
  couponCode?: string 
) {
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  const today = new Date();

  // 1. GET PRICES
  const prices = await db.query.dailyPrices.findMany({
    where: and(
      eq(dailyPrices.propertyId, propertyId),
      gte(dailyPrices.date, startStr),
      lt(dailyPrices.date, endStr)
    )
  });

  if (prices.length === 0) return null;

  // 2. GET SETTINGS
  const villa = await db.query.properties.findFirst({
    where: eq(properties.id, propertyId),
    columns: {
      cleaningFee: true,
      minStayForCleaning: true,
      depositFee: true,
      baseCurrency: true,
    }
  });

  if (!villa) return null;

  // --- CALCULATION ---
  const duration = prices.length;
  let basePrice = prices.reduce((sum, p) => sum + Number(p.price), 0);

  // 3. GET PROMOS
  const rawPromos = await db.query.propertyPromotions.findMany({
    where: eq(propertyPromotions.propertyId, propertyId),
    with: { promotion: true }
  });

  const validPromos = rawPromos
    .map(p => p.promotion)
    .filter(p => {
      if (!p || !p.isActive) return false;

      // Code Check
      if (p.code && !couponCode) return false;
      if (p.code && couponCode && p.code.toUpperCase() !== couponCode.toUpperCase()) return false;

      // Early Bird
      if (p.advanceBookingDays) {
        const diffTime = Math.abs(startDate.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays < p.advanceBookingDays) return false;
      }

      // Min Stay
      const minStay = Number(p.minStay) || 0;
      if (minStay > 0 && duration < minStay) return false;

      // Date Ranges
      if (p.travelWindowStart && new Date(p.travelWindowStart) > startDate) return false;
      if (p.travelWindowEnd && new Date(p.travelWindowEnd) < endDate) return false;

      return true;
    });

  // 4. APPLY DISCOUNTS
  let totalDiscount = 0;
  let appliedPromotions: { name: string; amount: number }[] = [];
  
  // Helper: Calculate discount amount based on type
  const calculateAmount = (promo: typeof validPromos[0]) => {
    if (!promo) return 0;
    const val = Number(promo.value);

    if (promo.type === 'percentage') {
      return basePrice * (val / 100);
    } 
    else if (promo.type === 'fixed_amount') {
      return val;
    }
    // --- NEW LOGIC FOR FREE DAYS ---
    else if (promo.type === 'free_days') {
      // 1. Get all daily prices
      const dailyAmounts = prices.map(p => Number(p.price));
      
      // 2. Sort lowest to highest
      dailyAmounts.sort((a, b) => a - b);
      
      // 3. Take the lowest X days (where X is promo value, e.g., 1)
      const freeDaysCount = Math.floor(val);
      const freeAmounts = dailyAmounts.slice(0, freeDaysCount);
      
      // 4. Sum them up (This is the discount amount)
      return freeAmounts.reduce((sum, curr) => sum + curr, 0);
    }
    return 0;
  };

  // A. Non-Stackable
  const nonStackables = validPromos.filter(p => !p?.isStackable);
  let bestDiscount = 0;
  let bestPromo = null;

  for (const promo of nonStackables) {
    if(!promo) continue;
    const amount = calculateAmount(promo);
    if (amount > bestDiscount) {
      bestDiscount = amount;
      bestPromo = promo;
    }
  }

  if (bestPromo) {
    totalDiscount += bestDiscount;
    appliedPromotions.push({ name: bestPromo.name, amount: bestDiscount });
  }

  // B. Stackable
  const stackables = validPromos.filter(p => p?.isStackable);
  for (const promo of stackables) {
    if(!promo) continue;
    const amount = calculateAmount(promo);
    totalDiscount += amount;
    appliedPromotions.push({ name: promo.name, amount: amount });
  }

  // 5. FINALIZE
  let cleaningFee = 0;
  if (villa.minStayForCleaning && duration < villa.minStayForCleaning) {
    cleaningFee = Number(villa.cleaningFee) || 0;
  }

  const priceAfterDiscount = Math.max(0, basePrice - totalDiscount);
  const totalPrice = priceAfterDiscount + cleaningFee;

  return {
    currency: villa.baseCurrency || "EUR",
    duration,
    basePrice,
    cleaningFee,
    totalDiscount,
    appliedPromotions,
    finalPrice: totalPrice,
    depositFee: Number(villa.depositFee) || 0,
    originalPrice: basePrice + cleaningFee 
  };
}