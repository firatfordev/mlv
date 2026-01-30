"use server";

import { db } from "@/db";
import { availability } from "@/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updatePropertyIndex } from "@/services/indexer"; // İndeksleyiciyi çağırıyoruz

export async function toggleBlockDatesAction(
  propertyId: number,
  startDate: Date,
  endDate: Date,
  shouldBlock: boolean // True = Kapat, False = Aç
) {
  try {
    // Tarihleri string formatına (YYYY-MM-DD) çevir
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // 1. TEMİZLİK: Bu aralıkla çakışan eski blokajları sil
    // (Böylece üst üste blokaj binmez, temiz kalır)
    await db.delete(availability).where(
      and(
        eq(availability.propertyId, propertyId),
        or(
          and(gte(availability.startDate, startStr), lte(availability.startDate, endStr)),
          and(gte(availability.endDate, startStr), lte(availability.endDate, endStr)),
          and(lte(availability.startDate, startStr), gte(availability.endDate, endStr))
        )
      )
    );

    // 2. EKLEME: Eğer "Kapat" dediysek yeni blok ekle
    if (shouldBlock) {
      await db.insert(availability).values({
        propertyId,
        startDate: startStr,
        endDate: endStr,
        isBlocked: true,
        source: "manual", // Elle kapatıldı
      });
    }

    // 3. İNDEKSLEME: Müsaitlik değiştiği için ana sayfayı güncelle
    try {
        await updatePropertyIndex(propertyId);
    } catch (e) {
        console.error("İndeksleme hatası:", e);
    }

    revalidatePath(`/admin/properties/${propertyId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Bloklama Hatası:", error);
    return { success: false, error: "Veritabanı işlemi başarısız." };
  }
}