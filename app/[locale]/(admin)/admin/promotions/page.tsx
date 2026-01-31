import { db } from "@/db";
import { promotions } from "@/db/schema";
import { createPromotionAction, deletePromotionAction } from "@/actions/admin/promotion-actions";
import { desc } from "drizzle-orm";
import { Tag, Calendar, Layers, Trash2, Plus, Clock, Ticket, Gift, AlertCircle } from "lucide-react";

export default async function PromotionsPage() {
  const promoList = await db.query.promotions.findMany({
    orderBy: [desc(promotions.id)],
  });

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Kampanya Motoru</h1>
          <p className="text-neutral-500 mt-1">İndirim kurallarını ve kupon kodlarını yönetin.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT: RULE BUILDER FORM --- */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-900 text-white p-6 rounded-[32px] sticky top-10 shadow-2xl">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-neutral-700 pb-4">
              <Plus size={20} className="text-blue-400" /> Yeni Kural Tanımla
            </h2>
            
            <form action={createPromotionAction} className="space-y-5">
              
              {/* 1. BASIC INFO */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Kampanya Adı</label>
                  <input name="name" placeholder="Örn: 7 Kal 6 Öde" className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-xl mt-1 outline-none focus:border-blue-500 transition-colors" required />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">İndirim Tipi</label>
                    <select name="type" className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-xl mt-1 outline-none text-sm font-medium">
                      <option value="percentage">Yüzde (%)</option>
                      <option value="fixed_amount">Tutar (€)</option>
                      <option value="free_days">Bedava Gün (Stay X Pay Y)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Değer</label>
                    <input name="value" type="number" step="0.1" placeholder="10" className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-xl mt-1 outline-none" required />
                  </div>
                </div>
                
                {/* Helper Text for Free Days */}
                <div className="text-[10px] text-neutral-400 bg-neutral-800 p-2 rounded-lg flex items-start gap-2">
                   <AlertCircle size={12} className="shrink-0 mt-0.5" />
                   <span><b>Bedava Gün için:</b> Değer kısmına kaç günün ücretsiz olacağını yazın (Örn: 1). Min Gece kısmına toplam süreyi yazın (Örn: 7).</span>
                </div>
              </div>

              {/* 2. CONDITIONS */}
              <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50 space-y-4">
                 <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={12} /> Koşullar (Opsiyonel)
                 </p>
                 
                 {/* Promo Code */}
                 <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Kupon Kodu</label>
                    <div className="relative mt-1">
                      <Ticket className="absolute left-3 top-3 text-neutral-500" size={16} />
                      <input name="code" placeholder="Boş ise otomatik uygulanır" className="w-full bg-neutral-800 border border-neutral-700 p-3 pl-10 rounded-xl outline-none focus:border-blue-500 text-sm" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Min. Gece</label>
                      <input name="min_stay" type="number" placeholder="Yok" className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-xl mt-1 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Erken Rez.</label>
                      <input name="advance_booking_days" type="number" placeholder="Gün Önce" className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-xl mt-1 outline-none text-sm" />
                    </div>
                 </div>
              </div>

              {/* 3. STACKABLE */}
              <div className="flex items-center gap-3 bg-neutral-800 p-3 rounded-xl border border-neutral-700">
                 <input type="checkbox" name="is_stackable" id="stack" className="w-5 h-5 accent-green-500 rounded" />
                 <label htmlFor="stack" className="text-sm font-medium cursor-pointer select-none">
                    <span className="block text-white">Birleştirilebilir (Stackable)</span>
                    <span className="block text-[10px] text-neutral-400">Başka indirim varsa bu da eklenir</span>
                 </label>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                KURALI OLUŞTUR
              </button>
            </form>
          </div>
        </div>

        {/* --- RIGHT: PROMOTION LIST --- */}
        <div className="lg:col-span-2 space-y-4">
          {promoList.map((promo) => (
            <div key={promo.id} className="bg-white p-6 rounded-[24px] border border-neutral-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-blue-200 transition-colors">
              
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-2xl ${promo.type === 'free_days' ? 'bg-orange-100 text-orange-600' : promo.code ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                  {promo.type === 'free_days' ? <Gift size={24} /> : promo.code ? <Ticket size={24} /> : <Tag size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-neutral-900 flex items-center gap-2">
                    {promo.name}
                    {promo.code && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-mono tracking-wider border border-purple-200">{promo.code}</span>}
                  </h3>
                  
                  {/* TAGS */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge color="bg-neutral-100 text-neutral-600">
                      {promo.type === 'percentage' && `%${promo.value} İndirim`}
                      {promo.type === 'fixed_amount' && `-${promo.value}€ İndirim`}
                      {promo.type === 'free_days' && `${promo.value} Gün Ücretsiz`}
                    </Badge>
                    
                    {promo.isStackable && <Badge color="bg-green-100 text-green-700 border-green-200">Stackable</Badge>}
                    
                    {promo.minStay && <Badge color="bg-orange-50 text-orange-600">Min {promo.minStay} Gece</Badge>}
                    
                    {promo.advanceBookingDays && <Badge color="bg-blue-50 text-blue-600">{promo.advanceBookingDays} Gün Önce</Badge>}
                  </div>
                </div>
              </div>

              <form action={deletePromotionAction.bind(null, promo.id)}>
                 <button className="p-3 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Sil">
                    <Trash2 size={20} />
                 </button>
              </form>

            </div>
          ))}
          
          {promoList.length === 0 && (
             <div className="text-center py-20 opacity-50">Kayıtlı promosyon yok.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode, color: string }) {
  return <span className={`text-[10px] font-bold px-2.5 py-1 rounded border border-transparent ${color}`}>{children}</span>
}