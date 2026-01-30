"use client";

import { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { tr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { Loader2, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { calculatePriceAction } from "@/actions/front/booking-actions"; // <-- IMPORT ACTION

registerLocale("tr", tr);

type BookingWidgetProps = {
  propertyId: number;
  basePrice: string; 
  currency: string;
  blockedDates: Date[];
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

    // Use Safe Date Strings
    const startStr = startDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const endStr = endDate.toLocaleDateString('en-CA');

    // --- NEW: CALL SERVER ACTION INSTEAD OF FETCH ---
    const res = await calculatePriceAction(propertyId, startStr, endStr);

    if (res.success) {
      setCalculation(res.data);
    } else {
      setError(res.error || "Hesaplama hatası");
      setCalculation(null);
    }
    setLoading(false);
  };

 const handleBooking = () => {
    if (!startDate || !endDate || !calculation) return;
    
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
    
    router.push(`/book?${q.toString()}`);
  };

  return (
    <div className="bg-white p-6 rounded-[32px] border border-neutral-200 shadow-xl sticky top-24">
      <div className="mb-6">
        <span className="text-2xl font-black text-neutral-900">{basePrice} {currency}</span>
        <span className="text-neutral-500 font-medium text-sm"> / gece</span>
      </div>

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
          excludeDates={blockedDates} 
          selectsRange
          minDate={new Date()}
          locale="tr"
          dateFormat="dd MMM yyyy"
          placeholderText="Giriş - Çıkış Tarihi"
          className="focus:border-blue-500 transition-colors"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {calculation && (
        <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between text-neutral-600 text-sm">
            <span>{calculation.duration} Gece x Konaklama</span>
            <span>{formatMoney(calculation.originalPrice, calculation.currency)}</span>
          </div>

          {/* DÜZELTME: Discount hesaplaması */}
          {calculation.originalPrice > calculation.finalPrice && (
            <div className="bg-green-50 p-3 rounded-xl border border-green-100 space-y-2">
              {calculation.appliedPromotions.map((promo: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs text-green-700 font-bold items-center">
                  <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {promo.name}</span>
                  <span>-{formatMoney(promo.amount, calculation.currency)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Temizlik Ücreti vs. eklenebilir, calculator'dan dönüyorsa */}
          
          <div className="border-t border-dashed my-2"></div>

          <div className="flex justify-between items-end">
            <span className="font-bold text-neutral-900">Toplam Tutar</span>
            <span className="text-2xl font-black text-neutral-900 leading-none">
              {formatMoney(calculation.finalPrice, calculation.currency)}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleBooking}
        disabled={!calculation || loading}
        className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-rose-900/20 active:scale-95 flex justify-center gap-2"
      >
        {loading && <Loader2 className="animate-spin" />} REZERVASYON YAP
      </button>
      
      <p className="text-center text-xs text-neutral-400 mt-4 font-medium">
        Henüz ödeme alınmayacak.
      </p>
    </div>
  );
}