"use server";

import { db } from "@/db";
import { propertyFeatures } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// 1. ÖZELLİĞİ AÇ/KAPAT (Toggle)
export async function toggleFeatureAction(propertyId: number, featureId: number, currentState: boolean) {
  try {
    if (currentState) {
      // Zaten varsa SİL (Uncheck)
      await db.delete(propertyFeatures)
        .where(and(
          eq(propertyFeatures.propertyId, propertyId),
          eq(propertyFeatures.featureId, featureId)
        ));
    } else {
      // Yoksa EKLE (Check)
      await db.insert(propertyFeatures).values({
        propertyId,
        featureId,
        isHighlighted: false // Varsayılan öne çıkmasın
      });
    }

    revalidatePath(`/admin/properties/${propertyId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Feature Toggle Error:", error);
    return { success: false };
  }
}

// 2. ÖNE ÇIKARMA DURUMUNU DEĞİŞTİR (Highlight Toggle)
export async function toggleHighlightAction(propertyId: number, featureId: number, currentHighlight: boolean) {
  try {
    await db.update(propertyFeatures)
      .set({ isHighlighted: !currentHighlight })
      .where(and(
        eq(propertyFeatures.propertyId, propertyId),
        eq(propertyFeatures.featureId, featureId)
      ));

    revalidatePath(`/admin/properties/${propertyId}/edit`);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}