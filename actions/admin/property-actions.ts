// Villa güncelleme aksiyonunun son satırı:
// await updatePropertyIndex(villaId);

"use server";

import { db } from "@/db";
import { properties, propertySearchIndex } from "@/db/schema"; // Yeni şema importları
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { eq } from "drizzle-orm";

export async function togglePropertyStatusAction(propertyId: number, currentStatus: boolean) {
  try {
    await db.update(properties)
      .set({ isActive: !currentStatus }) // Durumu tersine çevir
      .where(eq(properties.id, propertyId));

    revalidatePath(`/admin/properties/${propertyId}/edit`);
    return { success: true, newStatus: !currentStatus };
  } catch (error) {
    console.error("Status update error:", error);
    return { success: false };
  }
}
export async function togglePropertyFlagAction(
  propertyId: number, 
  field: "isPromoted" | "isRecommended", 
  currentState: boolean
) {
  try {
    // Dinamik update sorgusu
    await db.update(properties)
      .set({ [field]: !currentState })
      .where(eq(properties.id, propertyId));

    revalidatePath(`/admin/properties/${propertyId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Flag update error:", error);
    return { success: false };
  }
}
export async function createPropertyAction(formData: FormData) {
  // 1. Helper: Formdan gelen verileri güvenli tiplere çevir
  const getStr = (key: string) => formData.get(key) as string;
  const getNum = (key: string) => Number(formData.get(key)) || 0;
  const getBool = (key: string) => formData.get(key) === "on" || formData.get(key) === "true";

  // 2. Slug Oluştur (Otomatik)
  const rawTitleTR = getStr("title_tr");
  const generatedSlug = slugify(rawTitleTR, { lower: true, strict: true, locale: "tr" }) + "-" + Date.now().toString().slice(-4);

  // 3. Veritabanı Objesini Hazırla
  const newProperty = {
    // Zorunlu Alanlar
    slug: generatedSlug,
    refCode: getStr("ref_code") || `V-${Math.floor(Math.random() * 10000)}`,
    locationId: getNum("location_id"),

    // i18n (JSONB) Alanları Birleştiriyoruz
    title: {
      tr: getStr("title_tr"),
      en: getStr("title_en"),
    },
    description: {
      tr: getStr("desc_tr"),
      en: getStr("desc_en"),
    },

    // Kapasite & Fiziksel
    capacity: getNum("capacity"),
    bedrooms: getNum("bedrooms"),
    bathrooms: getNum("bathrooms"),
    
    // Kurallar & Finans
    baseCurrency: getStr("base_currency") || "EUR",
    defaultMinStay: getNum("default_min_stay"),
    cleaningFee: getStr("cleaning_fee"), // Numeric string olarak gider
    depositFee: getStr("deposit_fee"),
    minStayForCleaning: getNum("min_stay_for_cleaning"),
    
    // Check-in/out
    checkInTime: getStr("check_in_time") || "16:00",
    checkOutTime: getStr("check_out_time") || "10:00",

    // Durumlar
    isActive: false, // Varsayılan pasif olsun, her şeyi girince açarsın
    isInstantBook: getBool("is_instant_book"),
  };

  let insertedId = 0;

  try {
    // 4. Kaydet
    const result = await db.insert(properties).values(newProperty).returning({ id: properties.id });
    insertedId = result[0].id;

    // 5. Search Index Tablosunda Boş Bir Satır Aç (Indexer servisi sonra dolduracak)
    await db.insert(propertySearchIndex).values({
      propertyId: insertedId,
      lastUpdated: new Date(),
    });

  } catch (error) {
    console.error("Villa Ekleme Hatası:", error);
    return { success: false, error: "Veritabanı hatası oluştu." };
  }

  // 6. Yönlendirme
  revalidatePath("/admin/properties");
  redirect(`/admin/properties/${insertedId}/edit`); // Detayları girmek için edit sayfasına atıyoruz
}
