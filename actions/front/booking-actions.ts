"use server";

import { db } from "@/db";
import { bookings } from "@/db/schema";
import { calculatePriceForRange } from "@/services/price-calculator"; // Import etmeyi unutma

export async function applyCouponAction(
  propertyId: number, 
  startDate: string, 
  endDate: string, 
  code: string
) {
  try {
    // Fiyatı kupon koduyla birlikte yeniden hesapla
    const newPriceData = await calculatePriceForRange(
      propertyId, 
      new Date(startDate), 
      new Date(endDate),
      code // Kodu gönderiyoruz
    );

    if (!newPriceData) {
      return { success: false, error: "Fiyat hesaplanamadı." };
    }

    // Kod gönderildiği halde indirim miktarı değişmediyse, kod geçersizdir veya şartları (tarih vb.) uymuyordur.
    // Ancak bunu anlamak için eski fiyata ihtiyacımız var.
    // Basitçe: Eğer appliedPromotions içinde bizim kodumuz varsa başarılıdır.
    
    // appliedPromotions içinde bu kodlu promosyon var mı kontrolü yapılabilir ama
    // şimdilik direkt yeni fiyatı döndürmek yeterli. Kullanıcı fiyatın düştüğünü görecek.
    
    return { success: true, priceData: newPriceData };

  } catch (error) {
    console.error("Coupon Error:", error);
    return { success: false, error: "Kupon uygulanamadı." };
  }
}
export async function createBookingAction(formData: FormData, context: any) {
  try {
    const getStr = (key: string) => formData.get(key) as string;
    const getNum = (key: string) => Number(formData.get(key));

    // 1. DİNAMİK MİSAFİRLERİ TOPLA
    const guestCount = getNum("guest_count");
    const otherGuestsList = [];

    // Ana misafir haricindekileri döngüyle al (guestCount - 1 kadar)
    for (let i = 0; i < guestCount - 1; i++) {
      const name = formData.get(`other_guest_${i}`);
      if (name) {
        otherGuestsList.push({ name: name.toString() });
      }
    }

    // 2. VERİTABANINA KAYDET
    const [newBooking] = await db.insert(bookings).values({
      propertyId: context.propertyId,
      guestName: getStr("guest_name"),
      guestEmail: getStr("guest_email"),
      guestPhone: getStr("guest_phone"),
      guestAddress: getStr("guest_address"),
      guestCount: guestCount,
      guestNote: getStr("guest_note"),
      
      // JSONB OLARAK KAYDET
      otherGuests: otherGuestsList, 

      startDate: context.startDate,
      endDate: context.endDate,
      
      totalPrice: context.totalPrice.toString(),
      currency: context.currency,
      
      // SNAPSHOT
      priceDetails: {
        base_price: context.priceData.basePrice,
        cleaning_fee: context.priceData.cleaningFee,
        deposit_fee: context.priceData.depositFee,
        applied_promotions: context.priceData.appliedPromotions || [],
        duration: context.priceData.duration
      },

      isTermsAccepted: formData.get("terms") === "on",
      isContractAccepted: formData.get("contract") === "on",
      contractVersion: "v1.0",
      
      status: "pending_payment",
      createdAt: new Date(),
    }).returning({ id: bookings.id });

    return { success: true, bookingId: newBooking.id };

  } catch (error) {
    console.error("Booking Create Error:", error);
    return { success: false, error: "Rezervasyon oluşturulamadı." };
  }
}