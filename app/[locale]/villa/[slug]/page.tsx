import { getVillaBySlug } from "@/services/front/property-service";
import { db } from "@/db";
import { availability } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import BookingWidget from "@/components/front/BookingWidget";
import { MapPin, Users, Bed, Bath, Wifi, Waves, Wind } from "lucide-react";

export default async function VillaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const villa = await getVillaBySlug(slug);

  if (!villa) notFound();

  // 1. DOLU TARİHLERİ ÇEK (Takvimde gri yapmak için)
  const blockedRanges = await db.query.availability.findMany({
    where: and(
      eq(availability.propertyId, villa.id),
      eq(availability.isBlocked, true),
      gte(availability.endDate, new Date().toISOString().split('T')[0])
    )
  });

  // Range'leri tek tek günlere çevir (Datepicker array bekler)
  const blockedDates: Date[] = [];
  blockedRanges.forEach(range => {
    let current = new Date(range.startDate);
    const end = new Date(range.endDate);
    while (current <= end) {
      blockedDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  });

  // Dil verileri (Basitlik için TR)
  const title = (villa.title as any).tr;
  const desc = (villa.description as any).tr;
  const locationName = (villa.location?.name as any)?.tr;

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* 1. GALERİ (Basit Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[500px] rounded-[32px] overflow-hidden mb-8">
        {villa.images.slice(0, 5).map((img, i) => (
          <div key={img.id} className={`relative ${i === 0 ? "md:col-span-2 md:row-span-2" : "col-span-1"}`}>
            <Image src={img.url} alt="Villa" fill className="object-cover hover:scale-105 transition-transform duration-700" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* SOL: DETAYLAR */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black text-neutral-900">{title}</h1>
                <p className="text-lg text-neutral-500 mt-2 flex items-center gap-2 font-bold">
                  <MapPin size={18} className="text-blue-500" /> {locationName}
                </p>
              </div>
              {/* Host/Avatar eklenebilir */}
            </div>

            <div className="flex gap-6 mt-6 py-6 border-y border-neutral-100">
               <div className="flex items-center gap-2"><Users /> <span className="font-bold">{villa.capacity} Kişi</span></div>
               <div className="flex items-center gap-2"><Bed /> <span className="font-bold">{villa.bedrooms} Yatak O.</span></div>
               <div className="flex items-center gap-2"><Bath /> <span className="font-bold">{villa.bathrooms} Banyo</span></div>
            </div>
          </div>

          {/* AÇIKLAMA */}
          <div className="prose prose-neutral max-w-none">
            <h3 className="text-xl font-bold mb-4">Villa Hakkında</h3>
            <p className="text-neutral-600 leading-relaxed whitespace-pre-line">{desc}</p>
          </div>

          {/* ÖZELLİKLER */}
          <div>
            <h3 className="text-xl font-bold mb-6">Öne Çıkan Özellikler</h3>
            <div className="grid grid-cols-2 gap-4">
              {villa.features.map(f => (
                <div key={f.featureId} className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-50">
                  {/* İkon haritası buraya eklenebilir, şimdilik statik ikon */}
                  <Waves size={20} className="text-neutral-400" />
                  <span className="font-bold text-neutral-700">{(f.feature.label as any).tr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ: REZERVASYON WIDGET */}
        <div className="lg:col-span-1">
          <BookingWidget 
            propertyId={villa.id} 
            basePrice={villa.prices[0]?.price || "Sorunuz"} // Varsayılan bir fiyat göster
            currency={villa.baseCurrency || "EUR"}
            blockedDates={blockedDates}
          />
        </div>
      </div>
    </main>
  );
}