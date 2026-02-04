"use server";

import { db } from "@/db";
import { propertyFeatures } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleFeatureAction(
  propertyId: number, 
  featureId: number, 
  shouldBeActive: boolean, 
  shouldBeHighlighted: boolean
) {
  try {
    // 1. Remove existing relation (cleanup)
    await db.delete(propertyFeatures)
      .where(and(
        eq(propertyFeatures.propertyId, propertyId),
        eq(propertyFeatures.featureId, featureId)
      ));

    // 2. If active, insert new relation with highlight status
    if (shouldBeActive) {
      await db.insert(propertyFeatures).values({
        propertyId,
        featureId,
        isHighlighted: shouldBeHighlighted
      });
    }

    revalidatePath(`/admin/properties/${propertyId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Toggle Feature Error:", error);
    return { success: false };
  }
}