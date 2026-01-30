import { db } from "@/db";
import { availability, properties } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

/**
 * Bir villa için bugünden itibaren 'minStay' kuralına uyan İLK boş aralığı bulur.
 */
export async function findNextAvailableGap(propertyId: number, minStay: number = 5) {
  const today = new Date();
  const lookAheadDays = 365; // 1 yıl ileriye bak
  const futureLimit = new Date();
  futureLimit.setDate(today.getDate() + lookAheadDays);

  // 1. O villanın tüm BLOKAJLARINI çek (Dolu günler)
  const blockedRanges = await db.query.availability.findMany({
    where: and(
      eq(availability.propertyId, propertyId),
      eq(availability.isBlocked, true),
      gte(availability.endDate, today.toISOString().split('T')[0]), // Geçmiş blokajlar hariç
      lte(availability.startDate, futureLimit.toISOString().split('T')[0])
    ),
    orderBy: (t, { asc }) => [asc(t.startDate)],
  });

  // 2. Takvimdeki boşlukları tara
  // Basit algoritma: Bugünden başla, gün gün ilerle.
  // Eğer blokaja denk gelirsen, blokajın bitişine atla.
  // Eğer blokaj yoksa, ardışık 'minStay' kadar gün var mı kontrol et.
  
  let checkDate = new Date(today);
  
  while (checkDate < futureLimit) {
    // Bu tarih bir blokajın içinde mi?
    const blockingRange = blockedRanges.find(range => {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      return checkDate >= start && checkDate <= end;
    });

    if (blockingRange) {
      // Çarpışma var! Blokajın bitişinin bir sonraki gününe atla
      checkDate = new Date(blockingRange.endDate);
      checkDate.setDate(checkDate.getDate() + 1);
      continue;
    }

    // Buraya geldiysek 'checkDate' boş demektir.
    // Şimdi buradan itibaren 'minStay' kadar günün boş olup olmadığına bakalım.
    let isGapValid = true;
    let tempDate = new Date(checkDate);
    
    for (let i = 0; i < minStay; i++) {
       // Bu tempDate herhangi bir blokajla çakışıyor mu?
       const collision = blockedRanges.some(range => {
          const s = new Date(range.startDate);
          const e = new Date(range.endDate);
          return tempDate >= s && tempDate <= e;
       });
       
       if (collision) {
         isGapValid = false;
         break;
       }
       tempDate.setDate(tempDate.getDate() + 1);
    }

    if (isGapValid) {
      // BINGO! İlk boş aralığı bulduk.
      return {
        startDate: checkDate,
        endDate: tempDate, // minStay kadar sonrası
        gapLength: minStay // Şimdilik sadece minStay kadar hesaplıyoruz
      };
    }

    // Eğer valid değilse, bir sonraki güne geç
    checkDate.setDate(checkDate.getDate() + 1);
  }

  return null; // Hiç boşluk yok
}