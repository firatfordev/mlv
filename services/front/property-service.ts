import { db } from "@/db";
import { properties, propertySearchIndex, propertyImages, locations } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// 1. ANA SAYFA / LİSTELEME İÇİN VİLLALARI ÇEK
// Bu fonksiyon "property_search_index" tablosunu kullanır.
export async function getListedProperties() {
  const list = await db
    .select({
      id: properties.id,
      slug: properties.slug,
      title: properties.title,
      location: locations.name,
      // Hız Tablosundan Gelen Veriler:
      minPrice: propertySearchIndex.calculatedPrice, // İndeksleyici buraya "Şimdiki Fiyatı" yazmıştı
      currency: propertySearchIndex.calculatedCurrency,
      tags: propertySearchIndex.activePromoTags,
      nextDate: propertySearchIndex.nextAvailableDate,
      // Görsel (Kapak Fotoğrafı)
      image: sql<string>`(SELECT url FROM property_images WHERE property_id = ${properties.id} ORDER BY "order" ASC LIMIT 1)`,
      // Özellikler (Kapasite)
      capacity: properties.capacity,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms
    })
    .from(properties)
    .innerJoin(propertySearchIndex, eq(properties.id, propertySearchIndex.propertyId))
    .leftJoin(locations, eq(properties.locationId, locations.id))
    .where(eq(properties.isActive, true)) // Sadece aktifler
    .orderBy(desc(properties.rank)); // Veya fiyata göre sırala

  return list;
}

export async function getPropertiesByFilter(filterType: "promoted" | "recommended" | "all", limit: number = 20) {
  
  // Temel sorgu oluşturucu
  const query = db
    .select({
      id: properties.id,
      slug: properties.slug,
      title: properties.title,
      location: locations.name,
      minPrice: propertySearchIndex.calculatedPrice,
      currency: propertySearchIndex.calculatedCurrency,
      tags: propertySearchIndex.activePromoTags,
      nextDate: propertySearchIndex.nextAvailableDate,
      image: sql<string>`(SELECT url FROM property_images WHERE property_id = ${properties.id} ORDER BY "order" ASC LIMIT 1)`,
      capacity: properties.capacity,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms
    })
    .from(properties)
    .innerJoin(propertySearchIndex, eq(properties.id, propertySearchIndex.propertyId))
    .leftJoin(locations, eq(properties.locationId, locations.id))
    .where(
      and(
        eq(properties.isActive, true), // Her zaman sadece aktifler
        // Filtre Mantığı:
        filterType === "promoted" ? eq(properties.isPromoted, true) : undefined,
        filterType === "recommended" ? eq(properties.isRecommended, true) : undefined
      )
    )
    .orderBy(desc(properties.rank)) // veya random()
    .limit(limit);

  return await query;
}

// 2. DETAY SAYFASI İÇİN TEK VİLLA ÇEK
export async function getVillaBySlug(slug: string) {
  const villa = await db.query.properties.findFirst({
    where: eq(properties.slug, slug),
    with: {
      location: true,
      images: {
        orderBy: (t, { asc }) => [asc(t.order)]
      },
      // BURAYI GÜNCELLE: Fiyatları da çek (Limit 1 yeterli, sadece referans için)
      prices: {
        limit: 1, 
        orderBy: (t, { desc }) => [desc(t.date)] // En son girilen fiyatı alalım
      },
      features: {
        with: {
          feature: true
        }
      },
    }
  });

  return villa;
}