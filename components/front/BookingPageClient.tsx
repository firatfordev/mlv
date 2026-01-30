"use client";

import { useState } from "react";
import ReservationForm from "./ReservationForm";
import Image from "next/image";
import { MapPin, Star, Tag, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { applyCouponAction } from "@/actions/front/booking-actions";

type Props = {
  villa: any;
  initialPriceData: any;
  startDate: string;
  endDate: string;
};

export default function BookingPageClient({ villa, initialPriceData, startDate, endDate }: Props) {
  // Fiyat verisi artık State içinde (Değişebilir)
  const [priceData, setPriceData] = useState(initialPriceData);
  
  // Kupon State'leri
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Tarih Formatlayıcı
  const formatDate = (d: string) => new Date(d).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', year: 'numeric' });

  // KUPON UYGULA BUTONU
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponLoading(true);
    setCouponMessage(null);

    const res = await applyCouponAction(villa.id, startDate, endDate, couponCode);

    if (res.success && res.priceData) {
      // Fiyatı güncelle
      setPriceData(res.priceData);
      
      // İndirim uygulandı mı kontrol et
      // (Eski fiyattan düşük mü veya appliedPromotions içinde var mı?)
      const isDiscounted = res.priceData.finalPrice < initialPriceData.finalPrice;
      
      if (isDiscounted) {
        setCouponMessage({ type: 'success', text: 'Kupon başarıyla uygulandı!' });
      } else {
        setCouponMessage({ type: 'error', text: 'Kupon koşulları bu rezervasyon için geçerli değil.' });
      }
    } else {
      setCouponMessage({ type: 'error', text: res.error || 'Hata oluştu' });
    }
    setCouponLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* SOL: FORM (Güncel fiyat verisini props olarak alır) */}
      <div className="lg:col-span-2">
        <ReservationForm 
          propertyId={villa.id}
          startDate={startDate}
          endDate={endDate}
          maxGuests={villa.capacity}
          priceData={priceData} // <-- DİNAMİK VERİ
        />
      </div>

      {/* SAĞ: ÖZET KARTI & KUPON ALANI */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm sticky top-10">
          
          {/* Villa Bilgisi */}
          <div className="flex gap-4 mb-6 border-b pb-6">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
              {villa.images[0] && (
                <Image src={villa.images[0].url} fill className="object-cover" alt="Villa" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 leading-tight">{(villa.title as any).tr}</h4>
              <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                <MapPin size={12} /> {(villa.location?.name as any).tr}
              </div>
            </div>
          </div>

          {/* Tarihler */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center text-sm">
               <span className="text-neutral-500">Giriş</span>
               <span className="font-bold">{formatDate(startDate)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
               <span className="text-neutral-500">Çıkış</span>
               <span className="font-bold">{formatDate(endDate)}</span>
            </div>
          </div>

          {/* FİYAT DÖKÜMÜ (Dinamik) */}
          <div className="bg-neutral-50 p-4 rounded-xl space-y-2 mb-4 transition-all duration-300">
            <h5 className="font-bold text-sm mb-2">Fiyat Detayı</h5>
            
            <div className="flex justify-between text-xs text-neutral-600">
              <span>{priceData.duration} Gece x Konaklama</span>
              <span>{priceData.basePrice} {priceData.currency}</span>
            </div>

            {/* İndirimler Listesi */}
            {priceData.appliedPromotions.length > 0 && (
               <div className="space-y-1 pt-1">
                 {priceData.appliedPromotions.map((promo: any, idx: number) => (
                   <div key={idx} className="flex justify-between text-xs text-green-600 font-bold">
                     <span className="flex items-center gap-1"><Tag size={10} /> {promo.name}</span>
                     <span>-{promo.amount} {priceData.currency}</span>
                   </div>
                 ))}
               </div>
            )}

            {priceData.cleaningFee > 0 && (
               <div className="flex justify-between text-xs text-neutral-600">
                 <span>Temizlik Ücreti</span>
                 <span>{priceData.cleaningFee} {priceData.currency}</span>
               </div>
            )}

            <div className="border-t border-dashed border-neutral-300 pt-3 mt-2 flex justify-between font-black text-lg text-neutral-900">
               <span>Toplam</span>
               <span className="text-blue-600">{priceData.finalPrice} {priceData.currency}</span>
            </div>
          </div>

          {/* KUPON ALANI (Aktif) */}
          <div className="mt-6 pt-4 border-t border-neutral-200">
              <label className="text-xs font-bold text-neutral-500 uppercase ml-1 block mb-2">Promosyon Kodu</label>
              <div className="flex gap-2">
                  <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="KODU GİRİN" 
                      className="flex-1 bg-white border border-neutral-300 p-2 rounded-lg text-sm uppercase outline-none focus:border-blue-500 font-bold"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode}
                    className="bg-neutral-900 disabled:bg-neutral-400 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center gap-2"
                  >
                      {couponLoading ? <Loader2 size={14} className="animate-spin" /> : "UYGULA"}
                  </button>
              </div>

              {/* Mesaj Alanı */}
              {couponMessage && (
                <div className={`mt-3 text-xs font-bold flex items-center gap-2 p-2 rounded-lg ${couponMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                   {couponMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                   {couponMessage.text}
                </div>
              )}
          </div>

        </div>
      </div>

    </div>
  );
}