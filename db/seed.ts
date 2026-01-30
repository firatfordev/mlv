import { db } from "./index";
import { locations, features } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🌱 Seeding işlemi başladı...");

  // --- 1. ÖNCEKİ VERİLERİ TEMİZLE (İsteğe bağlı, ID çakışmasını önler) ---
  console.log("🧹 Eski veriler temizleniyor...");
  await db.delete(features);
  await db.delete(locations);

  // --- 2. LOKASYONLARI EKLE (Hiyerarşik) ---
  console.log("📍 Lokasyonlar ekleniyor...");

  // A. Şehir: ANTALYA
  const antalya = await db.insert(locations).values({
    slug: "antalya-kiralik-villa",
    name: { tr: "Antalya", en: "Antalya" },
    type: "city",
    metaTitle: { tr: "Antalya Kiralık Villalar", en: "Antalya Villas for Rent" },
    metaDesc: { tr: "Antalya bölgesindeki en lüks villalar.", en: "Luxury villas in Antalya region." },
  }).returning({ id: locations.id });

  const antalyaId = antalya[0].id;

  // B. İlçe: KAŞ (Parent: Antalya)
  const kas = await db.insert(locations).values({
    parentId: antalyaId,
    slug: "kas-kiralik-villa",
    name: { tr: "Kaş", en: "Kas" },
    type: "district",
    metaTitle: { tr: "Kaş Kiralık Villalar", en: "Kas Villas for Rent" },
    metaDesc: { tr: "Kaş manzaralı lüks tatil villaları.", en: "Luxury holiday villas with Kas view." },
  }).returning({ id: locations.id });

  const kasId = kas[0].id;

  // C. Bölge: KALKAN (Parent: Kaş) -> Villaların çoğu buraya bağlanacak
  await db.insert(locations).values({
    parentId: kasId,
    slug: "kalkan-kiralik-villa",
    name: { tr: "Kalkan", en: "Kalkan" },
    type: "area",
    metaTitle: { tr: "Kalkan Kiralık Villalar", en: "Kalkan Villas for Rent" },
    metaDesc: { tr: "Kalkan İslamlar ve merkezdeki korunaklı villalar.", en: "Secluded villas in Kalkan center and Islamlar." },
    isFeatured: true, // Ana sayfada öne çıkar
  });

  // D. Bölge: FETHİYE (Bağımsız örnek)
  await db.insert(locations).values({
    slug: "fethiye-kiralik-villa",
    name: { tr: "Fethiye", en: "Fethiye" },
    type: "district",
    metaTitle: { tr: "Fethiye Kiralık Villalar", en: "Fethiye Villas" }, 
    metaDesc: { tr: "Fethiye Ölüdeniz ve Kayaköy villaları.", en: "Villas in Fethiye Oludeniz." },
  });

  // --- 3. ÖZELLİKLERİ EKLE (Filtreleme İçin) ---
  console.log("✨ Özellikler ekleniyor...");

  const featureList = [
    // Havuz & Spa
    { key: "private_pool", category: "pool", label: { tr: "Özel Havuz", en: "Private Pool" }, icon: "Waves" },
    { key: "heated_pool", category: "pool", label: { tr: "Isıtmalı Havuz", en: "Heated Pool" }, icon: "ThermometerSun" },
    { key: "jacuzzi", category: "pool", label: { tr: "Jakuzi", en: "Jacuzzi" }, icon: "Bath" },
    
    // Mutfak
    { key: "full_kitchen", category: "kitchen", label: { tr: "Tam Donanımlı Mutfak", en: "Full Kitchen" }, icon: "ChefHat" },
    { key: "dishwasher", category: "kitchen", label: { tr: "Bulaşık Makinesi", en: "Dishwasher" }, icon: "Utensils" },
    
    // Eğlence & Teknoloji
    { key: "wifi", category: "entertainment", label: { tr: "Yüksek Hızlı Wifi", en: "High Speed Wifi" }, icon: "Wifi" },
    { key: "smart_tv", category: "entertainment", label: { tr: "Smart TV / Netflix", en: "Smart TV" }, icon: "Tv" },
    
    // Konfor & Diğer
    { key: "ac", category: "other", label: { tr: "Klima", en: "Air Conditioning" }, icon: "Wind" },
    { key: "sea_view", category: "outdoor", label: { tr: "Deniz Manzaralı", en: "Sea View" }, icon: "Sunset" },
    { key: "conservative", category: "other", label: { tr: "Muhafazakar (Korunaklı)", en: "Conservative / Secluded" }, icon: "ShieldCheck" },
  ];

  // TypeScript hatası almamak için 'any' ile cast ediyoruz veya tip tanımlayabiliriz
  for (const feat of featureList) {
    await db.insert(features).values({
      key: feat.key,
      category: feat.category as any, 
      label: feat.label,
      icon: feat.icon,
      isFilterable: true,
    });
  }

  console.log("✅ Seeding başarıyla tamamlandı!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding hatası:", err);
  process.exit(1);
});