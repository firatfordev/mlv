"use server";

import { db } from "@/db";
import { propertyImages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { del } from '@vercel/blob';

// 1. YENİ RESİM KAYDET
export async function addImageAction(propertyId: number, url: string) {
  try {
    // Mevcut resim sayısını bul (Sıraya sona eklemek için)
    const existing = await db.query.propertyImages.findMany({
      where: eq(propertyImages.propertyId, propertyId)
    });

    await db.insert(propertyImages).values({
      propertyId,
      url,
      order: existing.length, // Sona ekle
      isMain: existing.length === 0, // İlk resimse ana resim yap
    });

    revalidatePath(`/admin/properties/${propertyId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Resim ekleme hatası:", error);
    return { success: false };
  }
}

// 2. RESİM SİL
export async function deleteImageAction(imageId: string, imageUrl: string, propertyId: number) {
  try {
    // A. Veritabanından sil
    await db.delete(propertyImages).where(eq(propertyImages.id, imageId));
    
    // B. Vercel Blob'dan sil (Fatura şişmesin)
    await del(imageUrl);

    revalidatePath(`/admin/properties/${propertyId}/edit`);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 3. SIRALAMAYI GÜNCELLE (Drag & Drop Sonrası)
export async function reorderImagesAction(propertyId: number, updates: { id: string; order: number }[]) {
  try {
    // Tüm güncellemeleri paralel yap (Promise.all)
    await Promise.all(
      updates.map(update => 
        db.update(propertyImages)
          .set({ order: update.order })
          .where(eq(propertyImages.id, update.id))
      )
    );
    
    // İlk sıradakini "isMain: true" yap, diğerlerini false (Opsiyonel ama iyi pratik)
    // Bu kısmı basit tutmak için şimdilik atlıyorum, manuel seçim de yaptırabiliriz.

    revalidatePath(`/admin/properties/${propertyId}/edit`);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}