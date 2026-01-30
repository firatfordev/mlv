import { db } from "@/db";
import { properties, propertySearchIndex, propertyImages, locations } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function getListedProperties() {
  return await db
    .select({
      id: properties.id,
      slug: properties.slug,
      title: properties.title,
      location: locations.name,
      
      // --- CORRECT MAPPING ---
      lowestDailyPrice: propertySearchIndex.minPrice, 
      calculatedPrice: propertySearchIndex.calculatedPrice,
      
      nextAvailableDate: propertySearchIndex.nextAvailableDate,
      nextAvailableGap: propertySearchIndex.nextAvailableGap, // Critical!
      
      currency: propertySearchIndex.calculatedCurrency,
      tags: propertySearchIndex.activePromoTags,
      
      image: sql<string>`(SELECT url FROM property_images WHERE property_id = ${properties.id} ORDER BY "order" ASC LIMIT 1)`,
      capacity: properties.capacity,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms
    })
    .from(properties)
    .innerJoin(propertySearchIndex, eq(properties.id, propertySearchIndex.propertyId))
    .leftJoin(locations, eq(properties.locationId, locations.id))
    .where(eq(properties.isActive, true))
    .orderBy(desc(properties.rank));
}

export async function getPropertiesByFilter(filterType: "promoted" | "recommended" | "all", limit: number = 20) {
  return await db
    .select({
      id: properties.id,
      slug: properties.slug,
      title: properties.title,
      location: locations.name,
      
      lowestDailyPrice: propertySearchIndex.minPrice,
      calculatedPrice: propertySearchIndex.calculatedPrice,
      nextAvailableDate: propertySearchIndex.nextAvailableDate,
      nextAvailableGap: propertySearchIndex.nextAvailableGap,
      
      currency: propertySearchIndex.calculatedCurrency,
      tags: propertySearchIndex.activePromoTags,
      
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
        eq(properties.isActive, true),
        filterType === "promoted" ? eq(properties.isPromoted, true) : undefined,
        filterType === "recommended" ? eq(properties.isRecommended, true) : undefined
      )
    )
    .orderBy(desc(properties.rank))
    .limit(limit);
}

export async function getVillaBySlug(slug: string) {
  const villa = await db.query.properties.findFirst({
    where: eq(properties.slug, slug),
    with: {
      location: true,
      images: { orderBy: (t, { asc }) => [asc(t.order)] },
      prices: { limit: 1, orderBy: (t, { desc }) => [desc(t.date)] },
      features: { with: { feature: true } },
    }
  });
  return villa;
}