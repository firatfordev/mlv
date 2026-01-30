import Image from "next/image";
import Link from "next/link";
import { Users, Bed, Bath, MapPin, CalendarDays } from "lucide-react";

// Types
type VillaCardProps = {
  data: {
    slug: string;
    title: any; // JSONB
    location: any; // JSONB
    currency: string | null;
    image: string | null;
    tags: string[] | null;
    capacity: number;
    bedrooms: number;
    bathrooms: number;
    minPrice: string | null; // Bu artık "Paket Fiyatı"
    lowestDailyPrice: string | null; // Bu "Başlayan Fiyat"
    nextDate: string | null;
    nextEndDate: string | null; // Yeni
  }
};

export default function VillaCard({ data }: VillaCardProps) {
  // Para birimi sembolü
  const currencySymbol = data.currency === "TRY" ? "₺" : data.currency === "USD" ? "$" : "€";
  
  // JSONB dil kontrolü (Basitlik için TR alıyoruz, useLocale ile dinamik yapılabilir)
  const title = (data.title as any)?.tr || "Villa";
  const locName = (data.location as any)?.tr || "Konum Yok";

  return (
    <Link href={`/villa/${data.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-neutral-100 mb-4">
        {/* RESİM */}
        {data.image ? (
          <Image 
            src={data.image} 
            alt={title} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-300">Resim Yok</div>
        )}

        {/* PROMOSYON ETİKETLERİ (Sol Üst) */}
        {data.tags && data.tags.length > 0 && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {data.tags.map((tag, i) => (
              <span key={i} className="bg-white/90 backdrop-blur text-black text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* MÜSAİTLİK TARİHİ (Sağ Üst - Eğer fiyat yoksa bu belirir) */}
        {!data.minPrice && data.nextDate && (
           <div className="absolute top-4 right-4 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
             <CalendarDays size={12} /> {new Date(data.nextDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
           </div>
        )}
      </div>

      {/* İÇERİK */}
      <div className="space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-neutral-900 leading-tight group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-1 text-xs font-bold text-neutral-500">
             <MapPin size={12} /> {locName}
          </div>
        </div>

        {/* ÖZELLİKLER */}
        <div className="flex items-center gap-3 text-sm text-neutral-500 py-1">
          <span className="flex items-center gap-1"><Users size={14} /> {data.capacity}</span>
          <span className="flex items-center gap-1"><Bed size={14} /> {data.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath size={14} /> {data.bathrooms}</span>
        </div>

       {/* FİYAT ALANI (Akıllı Gösterim) */}
        <div className="pt-2 border-t border-dashed mt-2">
            
            {/* Durum 1: Akıllı Paket Bulunduysa */}
            {data.minPrice && data.nextDate ? (
              <div>
                <div className="text-[10px] uppercase font-bold text-neutral-400">
                    {new Date(data.nextDate).getDate()} - {new Date(data.nextEndDate!).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} Fırsatı
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-xl font-black text-rose-600">
                     {currencySymbol}{Math.round(Number(data.minPrice))}
                   </span>
                   <span className="text-xs text-neutral-500 font-medium line-through decoration-rose-300">
                      {/* İndirim öncesi fiyatı da buraya eklenebilir */}qwqw
                   </span>
                </div>
              </div>
            ) : data.lowestDailyPrice ? (
              // Durum 2: Paket yok ama "Başlayan Fiyat" var
              <div>
                 <div className="text-[10px] uppercase font-bold text-neutral-400">Gecelik Başlayan</div>
                 <span className="text-xl font-black text-neutral-900">
                    {currencySymbol}{Math.round(Number(data.lowestDailyPrice))}
                 </span>
              </div>
            ) : (
              <span className="text-sm font-bold text-neutral-400">Fiyat Sorunuz</span>
            )}

        </div>
      </div>
    </Link>
  );
}