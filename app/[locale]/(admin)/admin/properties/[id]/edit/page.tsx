import { db } from "@/db";
import { properties, dailyPrices, propertyImages, propertyFeatures, promotions, propertyPromotions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import PriceCalendar from "@/components/admin/PriceCalendar";
import { Settings, Calendar, TrendingUp, Tag } from "lucide-react";
import ImageManager from "@/components/admin/ImageManager";
import FeatureManager from "@/components/admin/FeatureManager";
import PromoManager from "@/components/admin/PromoManager";
import PublishToggle from "@/components/admin/PublishToggle";
import MarketingManager from "@/components/admin/MarketingManager";
export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const propertyId = parseInt(id);

  // 1. Villayı Çek
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, propertyId),
    with: {
      location: true, // Lokasyon adını göstermek istersen
    },
  });

  if (!property) notFound();

  // 2. Mevcut Fiyatları Çek (Client Component'e göndermek için objeye çevir)
  const rawPrices = await db.query.dailyPrices.findMany({
    where: eq(dailyPrices.propertyId, propertyId),
  });

   // { "2024-05-20": 150, "2024-05-21": 150 } formatına çevir
  const formattedPrices: Record<string, number> = {};
  rawPrices.forEach((p) => {
    formattedPrices[p.date] = Number(p.price);
  });

  const images = await db.query.propertyImages.findMany({
    where: eq(propertyImages.propertyId, propertyId),
    orderBy: (t, { asc }) => [asc(t.order)], // Sıralı gelsin
  });

  const masterFeatureList = await db.query.features.findMany({
    orderBy: (t, { asc }) => [asc(t.category), asc(t.id)],
  });

  // 2. Villanın Seçili Özellikleri
  const rawActiveFeatures = await db.query.propertyFeatures.findMany({
    where: eq(propertyFeatures.propertyId, propertyId),
  });

  // VERİ DÖNÜŞÜMÜ (Mapping)
  // Veritabanından gelen 'null' değerlerini güvenli hale getiriyoruz
  const formattedActiveFeatures = rawActiveFeatures.map(f => ({
    featureId: f.featureId!, // featureId kesin var
    isHighlighted: f.isHighlighted ?? false // Eğer null ise false kabul et
  }));

 
  // 1. Tüm Aktif Kampanyalar
  const allPromos = await db.query.promotions.findMany({
    where: eq(promotions.isActive, true),
  });

  // 2. Villada tanımlı olanlar
  const villaPromos = await db.query.propertyPromotions.findMany({
    where: eq(propertyPromotions.propertyId, propertyId),
  });
  const activePromoIds = villaPromos.map(p => p.promotionId!); // ID Listesi
  

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 pb-40">
      {/* BAŞLIK */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-10 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
            {(property.title as any).tr || "İsimsiz Villa"}
          </h1>
          <p className="text-neutral-500 mt-2 flex items-center gap-2">
            <span className="bg-neutral-100 px-2 py-1 rounded text-xs font-bold font-mono text-neutral-600">
              {property.refCode}
            </span>
            <span className="text-sm">Yönetim Paneli</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            {/* YENİ BUTON BURADA */}
            {/* property.isActive null gelebilir, boolean'a zorluyoruz (!!) */}
            <PublishToggle propertyId={propertyId} isActive={!!property.isActive} />
            
            {/* İstersen bir de "Sitede Gör" linki ekleyebilirsin */}
            <a 
              href={`/villa/${property.slug}`} 
              target="_blank" 
              className="px-4 py-3 bg-white border border-neutral-200 rounded-full text-neutral-600 font-bold text-sm hover:bg-neutral-50"
            >
              Önizle
            </a>
        </div>
      </div>

      <div className="space-y-12">
        {/* BÖLÜM 1: FİYAT TAKVİMİ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Fiyat Takvimi</h2>
              <p className="text-sm text-neutral-500">
                Müsaitlik ve günlük fiyatları buradan yönetin.
              </p>
            </div>
          </div>
          
          {/* CLIENT COMPONENT */}
          <PriceCalendar 
            propertyId={propertyId} 
            existingPrices={formattedPrices} 
          />
        </section>
        <section>
  <div className="flex items-center gap-3 mb-6">
    <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
      <TrendingUp size={24} />
    </div>
    <div>
      <h2 className="text-xl font-bold text-neutral-900">Vitrin Ayarları</h2>
      <p className="text-sm text-neutral-500">
        Bu villanın ana sayfada hangi listelerde görüneceğini seçin.
      </p>
    </div>
  </div>
  
  <MarketingManager 
    propertyId={propertyId} 
    isPromoted={property.isPromoted || false}
    isRecommended={property.isRecommended || false}
  />
</section>
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Settings size={24} /> {/* İkonu ImagePlus yapabilirsin */}
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Fotoğraf Galerisi</h2>
              <p className="text-sm text-neutral-500">
                Fotoğrafları sürükleyerek sıralayabilirsiniz. İlk fotoğraf <b>Kapak Fotoğrafı</b> olur.
              </p>
            </div>
          </div>
          
          {/* IMAGE MANAGER ÇAĞIR */}
          <ImageManager propertyId={propertyId} initialImages={images} />
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <Tag size={24} />
              tagsşze24
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Aktif Kampanyalar</h2>
              <p className="text-sm text-neutral-500">
                Bu villada geçerli olacak indirimleri seçin.
              </p>
            </div>
          </div>
          
          <PromoManager 
            propertyId={propertyId} 
            allPromotions={allPromos as any} // Tip uyuşmazlığı olursa 'any' geçici çözümdür, ama doğrusu type'ı eşlemektir
            activeIds={activePromoIds} 
          />
        </section>


        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Settings size={24} /> 
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Villa Özellikleri</h2>
              <p className="text-sm text-neutral-500">
                Villada bulunan imkanları işaretleyin. Önemli olanlara <b>Yıldız</b> vererek öne çıkarın.
              </p>
            </div>
          </div>
          
          {/* FEATURE MANAGER ÇAĞIR */}
          <FeatureManager 
            propertyId={propertyId} 
            masterFeatures={masterFeatureList} 
            activeFeatures={formattedActiveFeatures} // <-- formatted olanı veriyoruz
          />
        </section>

      </div>
    </div>
  );
}