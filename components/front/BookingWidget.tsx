"use client";

import { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { tr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { Loader2, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
registerLocale("tr", tr);

type BookingWidgetProps = {
  propertyId: number;
  basePrice: string; // "Gecelik 500€" göstermek için
  currency: string;
  blockedDates: Date[]; // Server Component'ten gelecek
};

export default function BookingWidget({ propertyId, basePrice, currency, blockedDates }: BookingWidgetProps) {
  const router = useRouter();
  
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const [calculation, setCalculation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function formatMoney(amount: number, currency: string) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  }
  // Tarih değişince fiyat hesapla
  useEffect(() => {
    if (startDate && endDate) {
      calculateTotal();
    } else {
      setCalculation(null);
    }
  }, [startDate, endDate]);

  const calculateTotal = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);

    // Tarihleri YYYY-MM-DD formatına çevir (Timezone sorunu yaşamamak için)
    // Not: Date objesini ISO string'e çevirirken saat farkına dikkat edilmeli.
    // Basitlik için yerel tarihi string yapıyoruz:
    const startStr = startDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const endStr = endDate.toLocaleDateString('en-CA');

    try {
      const res = await fetch(`/api/calculate-price?propertyId=${propertyId}&start=${startStr}&end=${endStr}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      setCalculation(data);

    } catch (err: any) {
      setError(err.message);
      setCalculation(null);
    } finally {
      setLoading(false);
    }
  };

 const handleBooking = () => {
    if (!startDate || !endDate || !calculation) return;
    
    // TARİH FORMATLAMA (DÜZELTME)
    // ISO string kullanırsak "T21:00:00Z" gibi saat farkları URL'e girer ve gün kayması olur.
    // Manuel olarak YYYY-MM-DD formatına çeviriyoruz:
    const startYear = startDate.getFullYear();
    const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
    const startDay = String(startDate.getDate()).padStart(2, '0');
    const startStr = `${startYear}-${startMonth}-${startDay}`;

    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const endStr = `${endYear}-${endMonth}-${endDay}`;

    const q = new URLSearchParams({
      propertyId: propertyId.toString(),
      start: startStr,
      end: endStr,
    });
    
    // YÖNLENDİRME DÜZELTMESİ:
    // /checkout yerine /book sayfasına gidiyoruz (Önce bilgi girişi)
    router.push(`/book?${q.toString()}`);
  };

  return (
    <div className="bg-white p-6 rounded-[32px] border border-neutral-200 shadow-xl sticky top-24">
      {/* ÜST BİLGİ */}
      <div className="mb-6">
        <span className="text-2xl font-black text-neutral-900">{basePrice} {currency}</span>
        <span className="text-neutral-500 font-medium text-sm"> / gece</span>
      </div>

      {/* TARİH SEÇİCİ */}
      <div className="relative z-50 mb-4">
        <style>{`
          .react-datepicker-wrapper { width: 100%; }
          .react-datepicker__input-container input { 
            width: 100%; padding: 16px; border-radius: 16px; 
            border: 1px solid #e5e5e5; font-weight: bold; outline: none;
          }
          .react-datepicker__day--disabled { opacity: 0.2; text-decoration: line-through; }
        `}</style>
        
        <DatePicker
          selected={startDate}
          onChange={(dates) => {
            const [start, end] = dates;
            setStartDate(start);
            setEndDate(end);
          }}
          startDate={startDate}
          endDate={endDate}
          excludeDates={blockedDates}  // <-- DÜZELTME: 'excludes' yerine 'excludeDates'
          selectsRange
          minDate={new Date()}
          locale="tr"
          dateFormat="dd MMM yyyy"
          placeholderText="Giriş - Çıkış Tarihi"
          className="focus:border-blue-500 transition-colors"
        />
      </div>

      {/* HESAPLAMA SONUCU */}
      {/* HESAPLAMA DETAYLARI */}
      {calculation && (
        <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* 1. Konaklama Tutarı */}
          <div className="flex justify-between text-neutral-600 text-sm">
            <span>{calculation.duration} Gece x Konaklama</span>
            <span>{formatMoney(calculation.basePrice, calculation.currency)}</span>
          </div>

          {/* 2. İndirimler (Varsa) */}
          {calculation.totalDiscount > 0 && (
            <div className="bg-green-50 p-3 rounded-xl border border-green-100 space-y-2">
              {calculation.appliedPromotions.map((promo: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs text-green-700 font-bold items-center">
                  <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {promo.name}</span>
                  <span>-{formatMoney(promo.amount, calculation.currency)}</span>
                </div>
              ))}
            </div>
          )}

          {/* 3. Temizlik Ücreti (Varsa) */}
          {calculation.cleaningFee > 0 ? (
            <div className="flex justify-between text-neutral-600 text-sm">
              <span className="flex items-center gap-1 cursor-help" title="Kısa konaklamalarda alınır.">
                Temizlik Ücreti <Info size={12} className="text-neutral-400" />
              </span>
              <span>{formatMoney(calculation.cleaningFee, calculation.currency)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-green-600 text-xs font-bold px-2">
              <span>Temizlik Ücreti</span>
              <span>Ücretsiz</span>
            </div>
          )}

          <div className="border-t border-dashed my-2"></div>

          {/* 4. GENEL TOPLAM (Ödenecek Tutar) */}
          <div className="flex justify-between items-end">
            <span className="font-bold text-neutral-900">Toplam Tutar</span>
            <span className="text-2xl font-black text-neutral-900 leading-none">
              {formatMoney(calculation.finalPrice, calculation.currency)}
            </span>
          </div>

          {/* 5. HASAR DEPOZİTOSU (Girişte Ödenir) */}
          {calculation.depositFee > 0 && (
            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-start gap-3 mt-4">
              <Info size={16} className="text-orange-500 shrink-0 mt-0.5" />
              <div className="text-xs text-orange-800">
                <span className="font-bold block mb-1">Hasar Depozitosu: {formatMoney(calculation.depositFee, calculation.currency)}</span>
                Bu tutar <b className="underline">girişte nakit</b> olarak alınır ve çıkışta hasar yoksa iade edilir. Toplama dahil değildir.
              </div>
            </div>
          )}

        </div>
      )}

      {/* BUTON */}
      <button
        onClick={handleBooking}
        disabled={!calculation || loading}
        className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-rose-900/20 active:scale-95"
      >
        REZERVASYON YAP
      </button>
      
      <p className="text-center text-xs text-neutral-400 mt-4 font-medium">
        Henüz ödeme alınmayacak.
      </p>
    </div>
  );
}