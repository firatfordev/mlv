import { db } from "@/db";
import { dailyPrices, properties, propertySearchIndex, availability } from "@/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import { calculatePriceForRange } from "./price-calculator";

export async function updatePropertyIndex(propertyId: number) {
  try {
    // 1. AYARLARI ÇEK
    const villa = await db.query.properties.findFirst({
      where: eq(properties.id, propertyId),
      columns: { defaultMinStay: true }
    });
    const minStay = villa?.defaultMinStay || 5;

    // 2. EN DÜŞÜK FİYATI BUL (Gelecek herhangi bir gün için)
    const minPriceResult = await db
      .select({ minPrice: sql<number>`MIN(${dailyPrices.price})` })
      .from(dailyPrices)
      .where(and(
        eq(dailyPrices.propertyId, propertyId),
        gte(dailyPrices.date, new Date().toISOString().split('T')[0])
      ));
    
    const lowestDaily = minPriceResult[0]?.minPrice || 0;

    // 3. AKILLI ALGORİTMA: FİYATI GİRİLMİŞ İLK MÜSAİT ARALIĞI BUL
    // Sadece "Fiyatı Olan" günleri çekiyoruz. Fiyat yoksa zaten satamayız.
    const validPrices = await db.query.dailyPrices.findMany({
      where: and(
        eq(dailyPrices.propertyId, propertyId),
        gte(dailyPrices.date, new Date().toISOString().split('T')[0]) // Bugünden sonrası
      ),
      orderBy: (t, { asc }) => [asc(t.date)],
      limit: 365 // 1 yıllık tarama yeterli
    });

    // Dolu günleri çek (Availability)
    const blockedRanges = await db.query.availability.findMany({
      where: and(
        eq(availability.propertyId, propertyId),
        eq(availability.isBlocked, true),
        gte(availability.endDate, new Date().toISOString().split('T')[0])
      )
    });

    let foundStart: Date | null = null;
    let foundEnd: Date | null = null;

    // Fiyatları tarihe göre sıralı elimize aldık.
    // Peş peşe 'minStay' kadar gün var mı diye bakacağız.
    
    // Veriyi hızlı kontrol için Set'e atalım: "2024-07-20" -> Var
    const priceMap = new Set(validPrices.map(p => p.date));

    // İlk günden başla, taranacak son güne kadar git
    if (validPrices.length >= minStay) {
      for (const priceRow of validPrices) {
        const potentialStart = new Date(priceRow.date);
        
        let sequenceIsValid = true;
        
        // Bu günden itibaren minStay kadar ileri git
        // 1. Hepsinin fiyatı var mı?
        // 2. Hiçbiri bloklu mu?
        for (let i = 0; i < minStay; i++) {
          const d = new Date(potentialStart);
          d.setDate(d.getDate() + i);
          const dStr = d.toISOString().split('T')[0];

          // Kontrol 1: Fiyatı var mı?
          if (!priceMap.has(dStr)) {
            sequenceIsValid = false;
            break;
          }

          // Kontrol 2: Bloklu mu?
          const isBlocked = blockedRanges.some(block => {
            return dStr >= block.startDate && dStr < block.endDate; // Basit tarih karşılaştırması
          });

          if (isBlocked) {
            sequenceIsValid = false;
            break;
          }
        }

        if (sequenceIsValid) {
          // BINGO! Fiyatı olan ve Boş olan ilk aralığı bulduk.
          foundStart = potentialStart;
          const endD = new Date(potentialStart);
          endD.setDate(endD.getDate() + minStay);
          foundEnd = endD;
          break; // Döngüyü kır, ilk fırsatı yakaladık.
        }
      }
    }

    // 4. BULUNAN ARALIK İÇİN NET FİYAT HESAPLA
    let calculation = null;
    if (foundStart && foundEnd) {
      calculation = await calculatePriceForRange(propertyId, foundStart, foundEnd);
    }

    // 5. KAYDET (Senin Schema'na Birebir Uygun)
    const dataToSave = {
      propertyId,
      minPrice: lowestDaily.toString(), // "Starts From"
      
      calculatedPrice: calculation ? calculation.finalPrice.toString() : null,
      calculatedCurrency: calculation ? calculation.currency : "EUR",
      
      nextAvailableDate: foundStart ? foundStart.toISOString().split('T')[0] : null,
      nextAvailableGap: minStay, // Senin şemanda gap (süre) var, end_date yok.
      
      activePromoTags: calculation ? calculation.appliedPromotions.map(p => p.name) : [], // JSONB değilse string array hatası verebilir, şemanda jsonb ise düzeltiriz.
      lastUpdated: new Date()
    };

    await db.insert(propertySearchIndex).values(dataToSave)
      .onConflictDoUpdate({
        target: propertySearchIndex.propertyId,
        set: dataToSave
      });

    console.log(`Indexer: Villa ${propertyId} OK. Fiyat: ${lowestDaily}, Paket: ${calculation?.finalPrice}`);

  } catch (error) {
    console.error(`Indexer Hatası (${propertyId}):`, error);
  }
}