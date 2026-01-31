"use server";

import { db } from "@/db";
import { promotions, propertyPromotions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// 1. CREATE PROMOTION (Updated Type)
export async function createPromotionAction(formData: FormData) {
  const getStr = (key: string) => formData.get(key) as string;
  const getNum = (key: string) => Number(formData.get(key)) || 0;
  
  const getDate = (key: string) => {
    const val = formData.get(key) as string;
    return val ? val : null;
  };

  try {
    await db.insert(promotions).values({
      name: getStr("name"),
      // Allow 'free_days' in the type cast
      type: getStr("type") as "percentage" | "fixed_amount" | "free_days",
      value: getStr("value"),
      
      code: getStr("code") || null,
      minStay: getNum("min_stay") || null,
      advanceBookingDays: getNum("advance_booking_days") || null,
      
      bookingWindowStart: getDate("booking_start"),
      bookingWindowEnd: getDate("booking_end"),
      travelWindowStart: getDate("travel_start"),
      travelWindowEnd: getDate("travel_end"),

      isStackable: formData.get("is_stackable") === "on",
      isActive: true,
    });

    revalidatePath("/admin/promotions"); // Assuming you use this page, otherwise just current path
    return { success: true };
  } catch (error) {
    console.error("Promo Create Error:", error);
    return { success: false, error: "Kampanya oluşturulamadı." };
  }
}

// 2. DELETE PROMOTION (Unchanged)
export async function deletePromotionAction(id: number) {
  try {
    await db.delete(promotions).where(eq(promotions.id, id));
    revalidatePath("/admin/promotions");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 3. TOGGLE PROMOTION (Your Exact Logic)
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