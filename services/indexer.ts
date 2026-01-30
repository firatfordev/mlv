import { db } from "@/db";
import { dailyPrices, properties, propertySearchIndex, availability } from "@/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { calculatePriceForRange } from "./price-calculator";

export async function updatePropertyIndex(propertyId: number) {
  try {
    console.log(`[Indexer] Analyzing Villa ${propertyId}...`);

    // 1. SETTINGS
    const villa = await db.query.properties.findFirst({
      where: eq(properties.id, propertyId),
      columns: { defaultMinStay: true }
    });
    const minStay = villa?.defaultMinStay || 5;

    // 2. LOWEST DAILY PRICE (Starts From)
    const todayStr = new Date().toISOString().split('T')[0];
    const minPriceResult = await db
      .select({ minPrice: sql<number>`MIN(${dailyPrices.price})` })
      .from(dailyPrices)
      .where(and(
        eq(dailyPrices.propertyId, propertyId),
        gte(dailyPrices.date, todayStr)
      ));
    
    const lowestDaily = minPriceResult[0]?.minPrice || 0;

    // 3. SMART DEAL FINDER (First Valid Gap)
    const today = new Date();
    
    // Fetch Data (In Memory for Speed)
    const allPrices = await db.query.dailyPrices.findMany({
      where: and(
        eq(dailyPrices.propertyId, propertyId),
        gte(dailyPrices.date, todayStr)
      ),
      columns: { date: true }
    });
    const priceMap = new Set(allPrices.map(p => 
      typeof p.date === 'string' ? p.date : new Date(p.date).toISOString().split('T')[0]
    ));

    const allBlocks = await db.query.availability.findMany({
      where: and(
        eq(availability.propertyId, propertyId),
        eq(availability.isBlocked, true),
        gte(availability.endDate, todayStr)
      )
    });

    let foundStart: Date | null = null;
    let foundEnd: Date | null = null;

    // Scan next 365 days
    for (let i = 1; i <= 365; i++) {
        const checkStart = new Date(today);
        checkStart.setDate(today.getDate() + i);
        const checkStartStr = checkStart.toISOString().split('T')[0];

        if (!priceMap.has(checkStartStr)) continue;

        const checkEnd = new Date(checkStart);
        checkEnd.setDate(checkEnd.getDate() + minStay);
        
        // VALIDATION
        let isValid = true;
        // A) Price Check
        for (let d = 0; d < minStay; d++) {
            const cur = new Date(checkStart);
            cur.setDate(cur.getDate() + d);
            if (!priceMap.has(cur.toISOString().split('T')[0])) { isValid = false; break; }
        }
        if (!isValid) continue;

        // B) Block Check
        const isBlocked = allBlocks.some(block => {
            const bStart = new Date(block.startDate);
            const bEnd = new Date(block.endDate);
            return (checkStart < bEnd && checkEnd > bStart);
        });
        if (isBlocked) continue;

        // Found!
        foundStart = checkStart;
        foundEnd = checkEnd;
        break; 
    }

    // 4. CALCULATE PACKAGE
    let calculation = null;
    if (foundStart && foundEnd) {
        calculation = await calculatePriceForRange(propertyId, foundStart, foundEnd);
    }

    // 5. SAVE (Standardized Fields)
    const dataToSave = {
        propertyId,
        minPrice: lowestDaily.toString(),
        calculatedPrice: calculation ? calculation.finalPrice.toString() : null,
        calculatedCurrency: calculation ? calculation.currency : "EUR",
        nextAvailableDate: foundStart ? foundStart.toISOString().split('T')[0] : null,
        nextAvailableGap: minStay,
        activePromoTags: calculation ? calculation.appliedPromotions.map(p => p.name) : [],
        lastUpdated: new Date()
    };

    await db.insert(propertySearchIndex).values(dataToSave)
        .onConflictDoUpdate({ target: propertySearchIndex.propertyId, set: dataToSave });

    console.log(`[Indexer] Updated Villa ${propertyId}. Gap: ${minStay}, Price: ${dataToSave.calculatedPrice}`);

  } catch (error) {
    console.error(`[Indexer] Failed:`, error);
  }
}