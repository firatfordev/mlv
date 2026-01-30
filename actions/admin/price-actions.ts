"use server";

import { db } from "@/db";
import { dailyPrices } from "@/db/schema";
import { updatePropertyIndex } from "@/services/indexer"; // Önceki adımda yazdığımız servis
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updatePriceCalendarAction(
  propertyId: number,
  prices: { date: string; price: number }[]
) {
  try {
    if (prices.length === 0) return { success: true };

    // 1. Toplu Ekleme / Güncelleme (Upsert)
    // Postgres'in gücünü kullanıyoruz: Conflict durumunda fiyatı güncelle.
    await db
      .insert(dailyPrices)
      .values(
        prices.map((p) => ({
          propertyId,
          date: p.date, // YYYY-MM-DD
          price: p.price.toString(),
          currency: "EUR", // Şimdilik EUR sabit, dilersen parametre olarak alabilirsin
        }))
      )
      .onConflictDoUpdate({
        target: [dailyPrices.propertyId, dailyPrices.date], // Bu ikili unique olmalı (index'te tanımlı)
        set: { price: sql`excluded.price` },
      });

    // 2. KRİTİK ADIM: İndeksleyiciyi Çalıştır
    // Fiyat değiştiği an, arama sonuçlarındaki "En ucuz fiyat" ve "Toplam tutar" güncellenmeli.
    await updatePropertyIndex(propertyId);

    revalidatePath(`/admin/properties/${propertyId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Takvim Güncelleme Hatası:", error);
    return { success: false, error: "Fiyatlar kaydedilemedi." };
  }
}