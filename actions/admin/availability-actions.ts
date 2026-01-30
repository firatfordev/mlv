"use server";

import { db } from "@/db";
import { availability } from "@/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updatePropertyIndex } from "@/services/indexer"; 

export async function toggleBlockDatesAction(
  propertyId: number,
  startDate: Date,
  endDate: Date,
  shouldBlock: boolean 
) {
  try {
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // 1. CLEANUP: Delete any overlapping blocks to keep data clean
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

    // 2. INSERT: Block if requested
    if (shouldBlock) {
      await db.insert(availability).values({
        propertyId,
        startDate: startStr,
        endDate: endStr,
        isBlocked: true,
        source: "manual",
      });
    }

    // 3. RE-INDEX: Update homepage data
    try { await updatePropertyIndex(propertyId); } catch (e) { console.error(e); }

    revalidatePath(`/admin/properties/${propertyId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Availability Action Error:", error);
    return { success: false, error: "Database error." };
  }
}