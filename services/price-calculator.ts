import { db } from "@/db";
import { dailyPrices, propertyPromotions, properties } from "@/db/schema";
import { and, eq, gte, lt } from "drizzle-orm"; // DİKKAT: 'lte' yerine 'lt' kullanıyoruz

export async function calculatePriceForRange(
  propertyId: number, 
  startDate: Date, 
  endDate: Date,
  couponCode?: string // <-- YENİ PARAMETRE (Opsiyonel)
) {
  // Tarihleri string formatına (YYYY-MM-DD) çevir
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  const today = new Date();

  // 1. GÜNLÜK FİYATLARI ÇEK
  // ÖNEMLİ DÜZELTME: 'lt(dailyPrices.date, endStr)'
  // Çıkış günü (endStr) fiyata dahil EDİLMEZ. Sadece gece sayısı kadar fiyat çekilir.
  const prices = await db.query.dailyPrices.findMany({
    where: and(
      eq(dailyPrices.propertyId, propertyId),
      gte(dailyPrices.date, startStr),
      lt(dailyPrices.date, endStr) 
    )
  });

  // Eğer takvimde fiyat girilmemişse hesap yapamayız
  if (prices.length === 0) return null;

  // 2. Villanın Temel Ayarlarını Çek
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

  // --- HESAPLAMA ---

  // Gece Sayısı (Prices array uzunluğu bize gece sayısını verir)
  const duration = prices.length;
  
  // Ham Toplam
  let basePrice = prices.reduce((sum, p) => sum + Number(p.price), 0);

  // 3. PROMOSYONLARI ÇEK
  const rawPromos = await db.query.propertyPromotions.findMany({
    where: eq(propertyPromotions.propertyId, propertyId),
    with: { promotion: true }
  });
  
  // Debug için: Promosyonları konsola yazdır (Server terminalinde görünür)
  // console.log("Bulunan Promosyon Sayısı:", rawPromos.length);

  const validPromos = rawPromos
    .map(p => p.promotion)
    .filter(p => {
      if (!p || !p.isActive) return false;

      // 1. Promosyonun kodu var ama kullanıcı kod göndermediyse -> GEÇERSİZ
      if (p.code && !couponCode) return false;

      // 2. Promosyonun kodu var, kullanıcı kod gönderdi ama EŞLEŞMİYOR -> GEÇERSİZ
      if (p.code && couponCode && p.code.toUpperCase() !== couponCode.toUpperCase()) return false;

      // Erken Rezervasyon Kontrolü
      if (p.advanceBookingDays) {
        // Bugünden giriş tarihine kaç gün var?
        const diffTime = Math.abs(startDate.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // Eğer giriş tarihine kalan gün sayısı, istenen günden AZ ise indirim YOK.
        if (diffDays < p.advanceBookingDays) return false;
      }
      const minStay = Number(p.minStay) || 0;
      if (minStay > 0 && duration < minStay) return false;
      // Seyahat Tarihi Kontrolü (Travel Window) - Null kontrolü ile
      // Eğer Travel Start varsa VE bizim giriş tarihimiz ondan önceyse -> GEÇERSİZ
      if (p.travelWindowStart && new Date(p.travelWindowStart) > startDate) return false;
      
      // Eğer Travel End varsa VE bizim çıkış tarihimiz ondan sonraysa -> GEÇERSİZ
      if (p.travelWindowEnd && new Date(p.travelWindowEnd) < endDate) return false;

      return true;
    });

  // 4. İNDİRİM UYGULA (Mantık Aynı)
  let totalDiscount = 0;
  let appliedPromotions: { name: string; amount: number }[] = [];
  
  // A. Stackable Olmayanlar (En iyisi)
  const nonStackables = validPromos.filter(p => !p?.isStackable);
  let bestDiscount = 0;
  let bestPromo = null;

  for (const promo of nonStackables) {
    if(!promo) continue;
    const amount = promo.type === 'percentage' 
      ? basePrice * (Number(promo.value) / 100)
      : Number(promo.value);
    
    if (amount > bestDiscount) {
      bestDiscount = amount;
      bestPromo = promo;
    }
  }

  if (bestPromo) {
    totalDiscount += bestDiscount;
    appliedPromotions.push({ name: bestPromo.name, amount: bestDiscount });
  }

  // B. Stackable Olanlar (Hepsi)
  const stackables = validPromos.filter(p => p?.isStackable);
  
  for (const promo of stackables) {
    if(!promo) continue;
    const amount = promo.type === 'percentage'
      ? basePrice * (Number(promo.value) / 100)
      : Number(promo.value);
    
    totalDiscount += amount;
    appliedPromotions.push({ name: promo.name, amount: amount });
  }

  // 5. TEMİZLİK ÜCRETİ
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
    depositFee: Number(villa.depositFee) || 0
  };
}