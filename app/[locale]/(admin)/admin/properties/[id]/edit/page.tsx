import { db } from "@/db";
import { properties, dailyPrices, availability, propertyImages, propertyFeatures, promotions, propertyPromotions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

  // 1. Villa Verisi
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, propertyId),
    with: { location: true },
  });
  if (!property) notFound();

  // 2. Fiyatları Çek ve Hazırla
  const rawPrices = await db.query.dailyPrices.findMany({
    where: eq(dailyPrices.propertyId, propertyId),
  });

  const formattedPrices: Record<string, number> = {};
  rawPrices.forEach((p) => {
    // Tarih string formatını garantiye al (YYYY-MM-DD)
    const dStr = typeof p.date === 'string' ? p.date : new Date(p.date).toISOString().split('T')[0];
    formattedPrices[dStr] = Number(p.price);
  });

  // 3. BLOKLU TARİHLERİ ÇEK (Yeni)
  const rawBlocks = await db.query.availability.findMany({
    where: and(
        eq(availability.propertyId, propertyId),
        eq(availability.isBlocked, true)
    )
  });
  
  // Takvimin anlayacağı formata çevir (Date objesi)
  const blockedRanges = rawBlocks.map(b => ({
    start: new Date(b.startDate),
    end: new Date(b.endDate)
  }));

  // Diğer veriler (Resim, Özellik, Promosyon vb.)
  const images = await db.query.propertyImages.findMany({
    where: eq(propertyImages.propertyId, propertyId),
    orderBy: (t, { asc }) => [asc(t.order)],
  });

  const masterFeatureList = await db.query.features.findMany({
    orderBy: (t, { asc }) => [asc(t.category), asc(t.id)],
  });

  const rawActiveFeatures = await db.query.propertyFeatures.findMany({
    where: eq(propertyFeatures.propertyId, propertyId),
  });
  const formattedActiveFeatures = rawActiveFeatures.map(f => ({
    featureId: f.featureId!,
    isHighlighted: f.isHighlighted ?? false
  }));

  const allPromos = await db.query.promotions.findMany({
    where: eq(promotions.isActive, true),
  });
  const villaPromos = await db.query.propertyPromotions.findMany({
    where: eq(propertyPromotions.propertyId, propertyId),
  });
  const activePromoIds = villaPromos.map(p => p.promotionId!);


  return (
    <div className="max-w-6xl mx-auto py-10 px-6 pb-40">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-10 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
            {(property.title as any).tr || "Villa"}
          </h1>
          <p className="text-neutral-500 mt-2 flex items-center gap-2">
            <span className="bg-neutral-100 px-2 py-1 rounded text-xs font-bold font-mono text-neutral-600">
              {property.refCode}
            </span>
            <span className="text-sm">Admin Panel</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <PublishToggle propertyId={propertyId} isActive={!!property.isActive} />
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
        
        {/* BÖLÜM 1: FİYAT VE MÜSAİTLİK */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Fiyat & Müsaitlik</h2>
              <p className="text-sm text-neutral-500">
                Takvim üzerinden günlük fiyatları girin veya tarihleri kapatın.
              </p>
            </div>
          </div>
          
          {/* YENİ TAKVİM */}
          <PriceCalendar 
            propertyId={propertyId} 
            existingPrices={formattedPrices} 
            blockedRanges={blockedRanges}
          />
        </section>

        {/* BÖLÜM 2: VİTRİN */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Vitrin Ayarları</h2>
              <p className="text-sm text-neutral-500">
                Ana sayfada görünürlüğü yönetin.
              </p>
            </div>
          </div>
          <MarketingManager 
            propertyId={propertyId} 
            isPromoted={property.isPromoted || false}
            isRecommended={property.isRecommended || false}
          />
        </section>

        {/* BÖLÜM 3: GALERİ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Settings size={24} /> 
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Galeri</h2>
              <p className="text-sm text-neutral-500">
                Fotoğrafları sürükleyip bırakarak sıralayabilirsiniz.
              </p>
            </div>
          </div>
          <ImageManager propertyId={propertyId} initialImages={images} />
        </section>

        {/* BÖLÜM 4: KAMPANYALAR */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <Tag size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Aktif Kampanyalar</h2>
              <p className="text-sm text-neutral-500">
                Villada geçerli olacak indirimleri seçin.
              </p>
            </div>
          </div>
          <PromoManager 
            propertyId={propertyId} 
            allPromotions={allPromos as any}
            activeIds={activePromoIds} 
          />
        </section>

        {/* BÖLÜM 5: ÖZELLİKLER */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Settings size={24} /> 
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Özellikler</h2>
              <p className="text-sm text-neutral-500">
                Villanın sahip olduğu imkanları işaretleyin.
              </p>
            </div>
          </div>
          <FeatureManager 
            propertyId={propertyId} 
            masterFeatures={masterFeatureList} 
            activeFeatures={formattedActiveFeatures}
          />
        </section>

      </div>
    </div>
  );
}