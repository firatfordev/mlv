import { getPropertiesByFilter } from "@/services/front/property-service";
import VillaCard from "@/components/front/VillaCard";
import { Search, TrendingUp, ThumbsUp, Grid } from "lucide-react";

export default async function HomePage() {
  // Verileri paralel çek (Waterfall olmasın, daha hızlı yüklenir)
  const [promotedVillas, recommendedVillas, allVillas] = await Promise.all([
    getPropertiesByFilter("promoted", 8),    // Öne Çıkan 8 tane
    getPropertiesByFilter("recommended", 8), // Tavsiye edilen 8 tane
    getPropertiesByFilter("all", 20)         // Genel liste
  ]);

  return (
    <main className="pb-20 space-y-16">
      {/* HERO SECTION (Aynı kalsın) */}
      <section className="...">...</section>

      {/* 1. SECTION: ÖNE ÇIKANLAR (PROMOTED) */}
      {promotedVillas.length > 0 && (
        <section className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><TrendingUp size={20}/></div>
            <h2 className="text-2xl font-bold text-neutral-900">Öne Çıkan Villalar</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {promotedVillas.map((villa) => (
              // @ts-ignore
              <VillaCard key={villa.id} data={villa} />
            ))}
          </div>
        </section>
      )}

      {/* 2. SECTION: SİZİN İÇİN SEÇTİKLERİMİZ (RECOMMENDED) */}
      {recommendedVillas.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 bg-blue-50/50 py-12 rounded-[48px]">
          <div className="flex items-center gap-2 mb-8">
             <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><ThumbsUp size={20}/></div>
             <div>
               <h2 className="text-2xl font-bold text-neutral-900">Sizin İçin Seçtiklerimiz</h2>
               <p className="text-neutral-500 text-sm">Editörlerimiz tarafından özenle seçilen, yüksek puanlı villalar.</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendedVillas.map((villa) => (
              // @ts-ignore
              <VillaCard key={villa.id} data={villa} />
            ))}
          </div>
        </section>
      )}

      {/* 3. SECTION: TÜM VİLLALAR */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-8">
           <div className="p-2 bg-neutral-100 text-neutral-700 rounded-lg"><Grid size={20}/></div>
           <h2 className="text-2xl font-bold text-neutral-900">Tüm Villaları Keşfedin</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {allVillas.map((villa) => (
            // @ts-ignore
            <VillaCard key={villa.id} data={villa} />
          ))}
        </div>
      </section>

    </main>
  );
}