"use server";

import { db } from "@/db";
import { availability } from "@/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updatePropertyIndex } from "@/services/indexer"; 

export async function toggleBlockDatesAction(
  propertyId: number,
  startDateStr: string, // <-- Accepting String "YYYY-MM-DD"
  endDateStr: string,   // <-- Accepting String "YYYY-MM-DD"
  shouldBlock: boolean 
) {
  try {
    // 1. CALCULATE EXCLUSIVE END DATE (For Database)
    // The user selected "10 to 12" (inclusive). They want the night of the 12th blocked.
    // The database treats 'endDate' as the "Check-out" morning.
    // So we need to save: Start: 10, End: 13.
    
    // We use 'new Date(str)' which defaults to UTC midnight for YYYY-MM-DD strings.
    // This is safe because we only do math, not timezone conversion.
    const endObj = new Date(endDateStr); 
    endObj.setDate(endObj.getDate() + 1);
    
    const finalEndStr = endObj.toISOString().split("T")[0]; // "2024-08-13"

    // 2. CLEANUP: Remove overlapping blocks
    await db.delete(availability).where(
      and(
        eq(availability.propertyId, propertyId),
        or(
          and(gte(availability.startDate, startDateStr), lte(availability.startDate, finalEndStr)),
          and(gte(availability.endDate, startDateStr), lte(availability.endDate, finalEndStr)),
          and(lte(availability.startDate, startDateStr), gte(availability.endDate, finalEndStr))
        )
      )
    );

    // 3. INSERT: Save the block
    if (shouldBlock) {
      await db.insert(availability).values({
        propertyId,
        startDate: startDateStr,
        endDate: finalEndStr,
        isBlocked: true,
        source: "manual",
      });
    }

    // 4. RE-INDEX: Update homepage visibility
    try { await updatePropertyIndex(propertyId); } catch (e) { console.error(e); }

    revalidatePath(`/admin/properties/${propertyId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Availability Action Error:", error);
    return { success: false, error: "Database error." };
  }
}