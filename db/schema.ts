import { pgTable, serial, text, integer, numeric, boolean, timestamp, date, uuid, jsonb, uniqueIndex, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
// --- ENUMS ---
export const userRoleEnum = pgEnum('user_role', ['admin', 'editor', 'guest']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'awaiting_payment', 'confirmed', 'cancelled', 'completed']);
export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed_amount', 'free_days']);
export const featureCategoryEnum = pgEnum('feature_category', ['pool', 'kitchen', 'outdoor', 'entertainment', 'other']);

// --- 1. CORE SYSTEM ---
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  fullName: text("full_name"),
  role: userRoleEnum("role").default('guest'),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 2. HIERARCHICAL LOCATIONS ---
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id"), 
  slug: text("slug").unique().notNull(),
  name: jsonb("name").notNull(), 
  type: text("type").default('district'), 
  
  metaTitle: jsonb("meta_title"),
  metaDesc: jsonb("meta_desc"),
  faqSchema: jsonb("faq_schema"),
  isFeatured: boolean("is_featured").default(false),
});

// --- 3. FILTER FEATURES ---
export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(),
  label: jsonb("label").notNull(),
  category: featureCategoryEnum("category").default('other'),
  icon: text("icon"),
  isFilterable: boolean("is_filterable").default(true),
});

// --- 4. PROPERTIES (VILLAS) ---
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").references(() => locations.id),
  
  slug: text("slug").unique().notNull(),
  refCode: text("ref_code").unique().notNull(),
  
  title: jsonb("title").notNull(),
  description: jsonb("description"),
  
  isPromoted: boolean("is_promoted").default(false), // "Öne Çıkanlar" listesi için
  isRecommended: boolean("is_recommended").default(false), // "Sizin İçin Seçtiklerimiz" listesi için
  
  capacity: integer("capacity").notNull().default(2),
  bedrooms: integer("bedrooms").notNull().default(1),
  bathrooms: integer("bathrooms").notNull().default(1),
  
  baseCurrency: text("base_currency").default("EUR"),
  defaultMinStay: integer("default_min_stay").default(5),
  checkInTime: text("check_in_time").default("16:00"),
  checkOutTime: text("check_out_time").default("10:00"),
  
  cleaningFee: numeric("cleaning_fee", { precision: 10, scale: 2 }),
  depositFee: numeric("deposit_fee", { precision: 10, scale: 2 }),
  minStayForCleaning: integer("min_stay_for_cleaning").default(7),
  
  isActive: boolean("is_active").default(true),
  isInstantBook: boolean("is_instant_book").default(false),
  
  seoMeta: jsonb("seo_meta"),
  rank: integer("rank").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- 4.5 GALERİ & MEDYA (Eksik Parça) ---
export const propertyImages = pgTable("property_images", {
  id: uuid("id").defaultRandom().primaryKey(), // Action'da string ID kullandığımız için UUID
  propertyId: integer("property_id").references(() => properties.id, { onDelete: 'cascade' }),
  url: text("url").notNull(),
  order: integer("order").default(0), // Sürükle-bırak sırası için
  isMain: boolean("is_main").default(false), // Kapak fotoğrafı mı?
});

// --- 5. THE SPEED LAYER: SEARCH INDEX ---
export const propertySearchIndex = pgTable("property_search_index", {
  propertyId: integer("property_id").primaryKey().references(() => properties.id, { onDelete: 'cascade' }),
  
  minPrice: numeric("min_price"), 
  maxPrice: numeric("max_price"),
  avgRating: numeric("avg_rating"),
  reviewCount: integer("review_count").default(0),
  
  nextAvailableDate: date("next_available_date"),
  nextAvailableGap: integer("next_available_gap"),
  
  calculatedPrice: numeric("calculated_price"), 
  calculatedCurrency: text("calculated_currency"),
  
  activePromoTags: jsonb("active_promo_tags"),
  
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// --- 6. MANY-TO-MANY FEATURES (FIXED) ---
export const propertyFeatures = pgTable("property_features", {
  propertyId: integer("property_id").references(() => properties.id, { onDelete: 'cascade' }),
  featureId: integer("feature_id").references(() => features.id, { onDelete: 'cascade' }),
  isHighlighted: boolean("is_highlighted").default(false),
}, (t) => [
  // FIXED: Returning an Array [] instead of Object {}
  primaryKey({ columns: [t.propertyId, t.featureId] }),
]);

// --- 7. PRICING & AVAILABILITY (FIXED) ---
export const dailyPrices = pgTable("daily_prices", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: 'cascade' }),
  date: date("date").notNull(), 
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("EUR"),
  minStay: integer("min_stay"),
}, (t) => [
  // FIXED: Returning an Array [] removes the deprecation warning
  uniqueIndex("price_date_unique_idx").on(t.propertyId, t.date),
]);

export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: 'cascade' }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isBlocked: boolean("is_blocked").default(true),
  source: text("source"),
});

// --- 8. PROMOTIONS ---
// ... imports

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: discountTypeEnum("type").notNull(), // percentage, fixed_amount
  value: numeric("value").notNull(),
  
  // --- NEW: PROMO CODE ---
  // If this is filled, the user MUST type this code at checkout.
  // If null, it applies automatically (if other conditions met).
  code: text("code"), 

  // --- CONDITIONS (KURALLAR) ---
  minStay: integer("min_stay"), // Min. night count
  
  // "Check-in'den en az X gün önce rezerve edilmeli" (Early Bird)
  advanceBookingDays: integer("advance_booking_days"), 
  
  // Date Ranges (Already existed)
  bookingWindowStart: date("booking_window_start"),
  bookingWindowEnd: date("booking_window_end"),
  travelWindowStart: date("travel_start"),
  travelWindowEnd: date("travel_end"),

  isStackable: boolean("is_stackable").default(false),
  isActive: boolean("is_active").default(false),
});

// ... rest of the file

export const propertyPromotions = pgTable("property_promotions", {
  propertyId: integer("property_id").references(() => properties.id, { onDelete: 'cascade' }),
  promotionId: integer("promotion_id").references(() => promotions.id, { onDelete: 'cascade' }),
}, (t) => [
  // FIXED: Array Syntax
  primaryKey({ columns: [t.propertyId, t.promotionId] }),
]);

// --- 9. BOOKINGS ---
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(), // İlişki tanımı aşağıda zaten var
  
  // --- 1. MİSAFİR DETAYLARI (Sözleşme İçin Şart) ---
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone").notNull(),
  guestAddress: text("guest_address").notNull(), // Fatura/Sözleşme için yeni
  guestNote: text("guest_note"),
  
  // Toplam sayı ve Yan Misafirler (JSONB)
  // Örn: [{ name: "Ayşe Yılmaz", tc: "123..." }, { name: "Can Yılmaz" }]
  guestCount: integer("guest_count").notNull(),
  otherGuests: jsonb("other_guests"), 

  // --- 2. TARİH VE DURUM ---
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  // Status: 'pending_approval', 'pending_payment', 'confirmed', 'cancelled', 'completed'
  status: text("status").default("pending_payment"),
  
  // --- 3. FİYAT SNAPSHOT (En Kritik Bölüm) ---
  // Toplam Tutar (Ödeme alınan)
  totalPrice: numeric("total_price").notNull(),
  currency: text("currency").default("EUR"),

  // Fiyatın DNA'sı (JSONB): Temizlik, Depozito, Promosyonlar burada saklanır.
  // Şöyle bir veri tutacağız:
  // {
  //   "base_price": 5000,
  //   "cleaning_fee": 500,
  //   "deposit_fee": 200, (Girişte alınacak, toplama dahil değil)
  //   "applied_promotions": [
  //       { "name": "Erken Rez", "amount": 500, "type": "percentage" }
  //   ]
  // }
  priceDetails: jsonb("price_details"),

  // --- 4. YASAL ONAYLAR ---
  isTermsAccepted: boolean("is_terms_accepted").default(false), // Site kuralları
  isContractAccepted: boolean("is_contract_accepted").default(false), // Mesafeli Satış Sözleşmesi
  contractVersion: text("contract_version").default("v1.0"), // Hangi sözleşmeyi onayladı?

  // --- 5. LOGLAMA (Zaman Damgaları) ---
  createdAt: timestamp("created_at").defaultNow(), // Talep tarihi
  preApprovedAt: timestamp("pre_approved_at"),     // Yönetici onay tarihi (Opsiyonel)
  paymentDate: timestamp("payment_date"),          // Ödeme tarihi
  cancelledAt: timestamp("cancelled_at"),          // İptal tarihi
});

// --- RELATIONS ---
export const propertyRelations = relations(properties, ({ one, many }) => ({
  location: one(locations, { fields: [properties.locationId], references: [locations.id] }),
  searchIndex: one(propertySearchIndex, { fields: [properties.id], references: [propertySearchIndex.propertyId] }),
  images: many(propertyImages),
  features: many(propertyFeatures),
  prices: many(dailyPrices),
  promotions: many(propertyPromotions),
  bookings: many(bookings),
  availability: many(availability),
}));
export const propertyFeaturesRelations = relations(propertyFeatures, ({ one }) => ({
  property: one(properties, { fields: [propertyFeatures.propertyId], references: [properties.id] }),
  feature: one(features, { fields: [propertyFeatures.featureId], references: [features.id] }),
}));
export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, { fields: [propertyImages.propertyId], references: [properties.id] }),
}));
export const dailyPricesRelations = relations(dailyPrices, ({ one }) => ({
  property: one(properties, {
    fields: [dailyPrices.propertyId],
    references: [properties.id],
  }),
}));
export const propertyPromotionsRelations = relations(propertyPromotions, ({ one }) => ({
  property: one(properties, {
    fields: [propertyPromotions.propertyId],
    references: [properties.id],
  }),
  promotion: one(promotions, {
    fields: [propertyPromotions.promotionId],
    references: [promotions.id],
  }),
}));
export const searchIndexRelations = relations(propertySearchIndex, ({ one }) => ({
  property: one(properties, { fields: [propertySearchIndex.propertyId], references: [properties.id] }),
}));