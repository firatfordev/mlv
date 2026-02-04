"use server";

import { db } from "@/db";
import { locations, features } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- LOCATION ACTIONS ---

export async function createLocationAction(formData: FormData) {
  try {
    const parentId = formData.get("parentId") ? Number(formData.get("parentId")) : null;
    const nameTr = formData.get("name_tr") as string;
    const nameEn = formData.get("name_en") as string;
    
    // Auto-generate slug if empty
    let slug = formData.get("slug") as string;
    if (!slug) {
      // Simple slugify: lowercase, replace spaces with dashes, remove non-chars
      slug = nameEn.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    }

    await db.insert(locations).values({
      parentId,
      slug,
      name: { tr: nameTr, en: nameEn },
      type: formData.get("type") as string || "district",
      isFeatured: formData.get("isFeatured") === "on",
    });

    revalidatePath("/admin/locations");
    return { success: true };
  } catch (error) {
    console.error("Create Location Error:", error);
    return { success: false, error: "Could not create location. Slug might be duplicate." };
  }
}

export async function deleteLocationAction(id: number) {
  try {
    await db.delete(locations).where(eq(locations.id, id));
    revalidatePath("/admin/locations");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Cannot delete. Location might have properties or children." };
  }
}

// --- FEATURE / AMENITY ACTIONS ---

export async function createFeatureAction(formData: FormData) {
  try {
    const labelTr = formData.get("label_tr") as string;
    const labelEn = formData.get("label_en") as string;
    const category = formData.get("category") as any;
    
    // Auto key generation
    let key = formData.get("key") as string;
    if (!key) {
      key = labelEn.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^\w_]/g, "");
    }

    await db.insert(features).values({
      key,
      category,
      label: { tr: labelTr, en: labelEn },
      icon: formData.get("icon") as string || "Check", // Default icon
      isFilterable: true,
    });

    revalidatePath("/admin/features");
    return { success: true };
  } catch (error) {
    console.error("Create Feature Error:", error);
    return { success: false, error: "Could not create feature. Key might be duplicate." };
  }
}

export async function deleteFeatureAction(id: number) {
  try {
    await db.delete(features).where(eq(features.id, id));
    revalidatePath("/admin/features");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error deleting feature." };
  }
}