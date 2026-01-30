import Image from "next/image";
import Link from "next/link";
import { Users, Bed, Bath, MapPin, CalendarDays } from "lucide-react";

type VillaCardProps = {
  data: {
    slug: string;
    title: any;
    location: any;
    currency: string | null;
    image: string | null;
    tags: string[] | null;
    capacity: number;
    bedrooms: number;
    bathrooms: number;
    
    // Updated Props from Property Service
    lowestDailyPrice: string | null; // Daily "Starts From"
    calculatedPrice: string | null;  // Total "Smart Deal"
    nextAvailableDate: string | null;
    nextAvailableGap: number | null; // Duration (e.g., 5 days)
  }
};

export default function VillaCard({ data }: VillaCardProps) {
  const getLoc = (val: any) => (typeof val === 'object' && val?.tr ? val.tr : val);
  const title = getLoc(data.title) || "Villa";
  const locName = data.location ? getLoc(data.location.name) : "";
  
  // Choose currency (Deal currency > Default currency > EUR)
  const currencyCode = data.currency || "EUR";
  const currencySymbol = currencyCode === "TRY" ? "₺" : currencyCode === "USD" ? "$" : "€";

  // --- SMART DATE LOGIC ---
  let dateLabel = "";
  let hasSmartDeal = false;

  // Logic: We need a Date + Gap + Package Price to show the deal
  if (data.nextAvailableDate && data.nextAvailableGap && data.calculatedPrice) {
    const startDate = new Date(data.nextAvailableDate);
    
    if (!isNaN(startDate.getTime())) {
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + data.nextAvailableGap);
      
      hasSmartDeal = true;
      dateLabel = `${startDate.getDate()} - ${endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} Fırsatı`;
    }
  }

  return (
    <Link href={`/villa/${data.slug}`} className="group block bg-white rounded-[24px] border border-neutral-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
      
      {/* IMAGE SECTION */}
      <div className="relative aspect-[4/3] bg-neutral-100 mb-4">
        {data.image ? (
          <Image 
            src={data.image} 
            alt={String(title)} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-300">Resim Yok</div>
        )}

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {data.tags.map((tag, i) => (
              <span key={i} className="bg-white/90 backdrop-blur text-black text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Fallback Date Badge (Shows if we have date but logic failed to make a deal) */}
        {!hasSmartDeal && data.nextAvailableDate && (
           <div className="absolute top-4 right-4 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
             <CalendarDays size={12} /> {new Date(data.nextAvailableDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
           </div>
        )}
      </div>

      {/* INFO SECTION */}
      <div className="px-5 pb-5 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-neutral-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
            {String(title)}
          </h3>
          <div className="flex items-center gap-1 text-xs font-bold text-neutral-500 whitespace-nowrap">
             <MapPin size={12} /> {locName}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-neutral-500 py-1">
          <span className="flex items-center gap-1"><Users size={14} /> {data.capacity}</span>
          <span className="flex items-center gap-1"><Bed size={14} /> {data.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath size={14} /> {data.bathrooms}</span>
        </div>

        {/* PRICING SECTION */}
        <div className="pt-2 border-t border-dashed mt-2">
            {hasSmartDeal ? (
              // CASE 1: Smart Deal Found (Shows Date Range + Total Price)
              <div className="animate-in fade-in">
                <div className="text-[10px] uppercase font-bold text-blue-600 mb-0.5">
                    {dateLabel}
                </div>
                <div className="flex items-baseline gap-1">
                   <span className="text-xl font-black text-rose-600">
                     {currencySymbol}{Math.round(Number(data.calculatedPrice))}
                   </span>
                   <span className="text-xs text-neutral-400 font-medium">
                     / {data.nextAvailableGap} gece
                   </span>
                </div>
              </div>
            ) : data.lowestDailyPrice ? (
              // CASE 2: No Deal, Show "Starts From" (Daily)
              <div>
                 <div className="text-[10px] uppercase font-bold text-neutral-400">Gecelik Başlayan</div>
                 <span className="text-xl font-black text-neutral-900">
                    {currencySymbol}{Math.round(Number(data.lowestDailyPrice))}
                 </span>
              </div>
            ) : (
              // CASE 3: No Pricing
              <span className="text-sm font-bold text-neutral-400">Fiyat Sorunuz</span>
            )}
        </div>
      </div>
    </Link>
  );
}