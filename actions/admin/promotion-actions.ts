"use server";

import { db } from "@/db";
import { promotions, propertyPromotions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// 1. YENİ KAMPANYA OLUŞTUR (Global)
export async function createPromotionAction(formData: FormData) {
  const getStr = (key: string) => formData.get(key) as string;
  const getNum = (key: string) => Number(formData.get(key)) || 0;
  // Tarih boş gelirse null yap (Postgres boş string sevmez)
  const getDate = (key: string) => {
    const val = formData.get(key) as string;
    return val ? val : null;
  };

  try {
    await db.insert(promotions).values({
      name: getStr("name"),
      type: getStr("type") as "percentage" | "fixed_amount",
      value: getStr("value"),
      
      // NEW FIELDS
      code: getStr("code") || null, // Boşsa null gönder
      minStay: getNum("min_stay") || null,
      advanceBookingDays: getNum("advance_booking_days") || null,
      
      // Existing fields
      bookingWindowStart: getDate("booking_start"),
      bookingWindowEnd: getDate("booking_end"),
      travelWindowStart: getDate("travel_start"),
      travelWindowEnd: getDate("travel_end"),

      isStackable: formData.get("is_stackable") === "on",
      isActive: true,
    });

    revalidatePath("/admin/promotions");
    return { success: true };
  } catch (error) {
    console.error("Promo Create Error:", error);
    return { success: false, error: "Kampanya oluşturulamadı." };
  }
}

// 2. KAMPANYA SİL
export async function deletePromotionAction(id: number) {
  try {
    await db.delete(promotions).where(eq(promotions.id, id));
    revalidatePath("/admin/promotions");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 3. VİLLAYA KAMPANYA ATA / KALDIR (Toggle)
export async function togglePropertyPromotionAction(propertyId: number, promotionId: number, currentState: boolean) {
  try {
    if (currentState) {
      // Varsa kaldır
      await db.delete(propertyPromotions)
        .where(and(
          eq(propertyPromotions.propertyId, propertyId),
          eq(propertyPromotions.promotionId, promotionId)
        ));
    } else {
      // Yoksa ekle
      await db.insert(propertyPromotions).values({
        propertyId,
        promotionId
      });
    }

    revalidatePath(`/admin/properties/${propertyId}/edit`);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}