import { db } from "@/db";
import { locations } from "@/db/schema";
import { createPropertyAction } from "@/actions/admin/property-actions";
import { Save, MapPin, Globe, Home, Banknote } from "lucide-react";

export default async function CreatePropertyPage() {
  // Lokasyonları çek (Dropdown için)
  const locationList = await db.query.locations.findMany({
    columns: { id: true, name: true, slug: true },
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Yeni Villa Ekle</h1>
        <p className="text-neutral-500 mt-2">Temel bilgileri girerek villayı sisteme kaydedin. Fotoğraflar ve detaylı fiyatlar bir sonraki adımda eklenecek.</p>
      </div>

      <form action={createPropertyAction} className="space-y-8 pb-32">
        
        {/* BÖLÜM 1: KİMLİK & LOKASYON */}
        <section className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MapPin size={20} /></div>
            <h2 className="text-lg font-bold">Lokasyon ve Kimlik</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Referans Kodu</label>
              <input name="ref_code" placeholder="Örn: V-101" className="w-full p-4 bg-neutral-50 border-none rounded-2xl font-bold focus:ring-2 ring-blue-500 outline-none transition-all" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Bölge Seçimi</label>
              <select name="location_id" className="w-full p-4 bg-neutral-50 border-none rounded-2xl font-bold focus:ring-2 ring-blue-500 outline-none cursor-pointer appearance-none">
                <option value="">Bölge Seçiniz...</option>
                {locationList.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {/* JSONB olduğu için 'tr' anahtarını okuyoruz, yoksa string olarak basar */}
                    {(loc.name as any).tr || "İsimsiz Bölge"} 
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* BÖLÜM 2: ÇOKLU DİL İÇERİK */}
        <section className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4 mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Globe size={20} /></div>
            <h2 className="text-lg font-bold">İçerik (TR / EN)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2"><span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded">TR</span></div>
              <input name="title_tr" placeholder="Villa Adı (Türkçe)" className="w-full p-4 bg-neutral-50 border-none rounded-2xl font-semibold outline-none focus:bg-white focus:ring-2 ring-neutral-200 transition-all" required />
              <textarea name="desc_tr" placeholder="Kısa Açıklama (Türkçe)" rows={3} className="w-full p-4 bg-neutral-50 border-none rounded-2xl font-medium outline-none focus:bg-white focus:ring-2 ring-neutral-200 transition-all" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2"><span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded">EN</span></div>
              <input name="title_en" placeholder="Villa Name (English)" className="w-full p-4 bg-neutral-50 border-none rounded-2xl font-semibold outline-none focus:bg-white focus:ring-2 ring-neutral-200 transition-all" />
              <textarea name="desc_en" placeholder="Short Description (English)" rows={3} className="w-full p-4 bg-neutral-50 border-none rounded-2xl font-medium outline-none focus:bg-white focus:ring-2 ring-neutral-200 transition-all" />
            </div>
          </div>
        </section>

        {/* BÖLÜM 3: KAPASİTE & ÖZELLİKLER */}
        <section className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4 mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Home size={20} /></div>
            <h2 className="text-lg font-bold">Kapasite & Detaylar</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <NumberInput label="Kişi Kapasitesi" name="capacity" def={4} />
            <NumberInput label="Yatak Odası" name="bedrooms" def={2} />
            <NumberInput label="Banyo Sayısı" name="bathrooms" def={2} />
          </div>
        </section>

        {/* BÖLÜM 4: FİNANS & KURALLAR */}
        <section className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4 mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Banknote size={20} /></div>
            <h2 className="text-lg font-bold">Fiyatlandırma Kuralları</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Para Birimi</label>
              <select name="base_currency" className="w-full p-4 bg-neutral-50 border-none rounded-2xl font-bold outline-none">
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="TRY">TRY (₺)</option>
              </select>
            </div>
            <NumberInput label="Min. Konaklama (Gece)" name="default_min_stay" def={5} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dashed">
            <div className="col-span-1">
               <NumberInput label="Temizlik Ücreti" name="cleaning_fee" def={0} placeholder="0.00" />
            </div>
            <div className="col-span-1">
               <NumberInput label="Hasar Depozitosu" name="deposit_fee" def={0} placeholder="0.00" />
            </div>
            <div className="col-span-1">
               <NumberInput label="Şu günden az ise temizlik al" name="min_stay_for_cleaning" def={7} />
            </div>
          </div>
        </section>

        {/* AKSİYON BUTONU */}
        <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t p-6 z-50 flex justify-center">
            <button type="submit" className="bg-black text-white px-12 py-4 rounded-full font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3">
              <Save size={20} />
              KAYDET VE DEVAM ET
            </button>
        </div>
      </form>
    </div>
  );
}

// Ufak bir yardımcı bileşen (Clean Code için)
function NumberInput({ label, name, def, placeholder }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider ml-2">{label}</label>
      <input 
        type="number" 
        name={name} 
        defaultValue={def} 
        placeholder={placeholder}
        className="w-full p-4 bg-neutral-50 border-none rounded-2xl font-bold text-neutral-900 outline-none focus:bg-white focus:ring-2 ring-neutral-200 transition-all" 
      />
    </div>
  );
}