"use client";

import { useState } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { tr } from "date-fns/locale";
import { format, eachDayOfInterval, startOfDay } from "date-fns";
import { updatePriceCalendarAction } from "@/actions/admin/price-actions";
import { Loader2, Save, RotateCcw } from "lucide-react";
import "react-day-picker/dist/style.css";

// Veritabanından gelen mevcut fiyatların tipi
type ExistingPrices = Record<string, number>; 

export default function PriceCalendar({
  propertyId,
  existingPrices,
}: {
  propertyId: number;
  existingPrices: ExistingPrices;
}) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [priceInput, setPriceInput] = useState<string>("");
  const [prices, setPrices] = useState<ExistingPrices>(existingPrices);
  const [loading, setLoading] = useState(false);

  // Fiyatları Kaydet
  const handleSave = async () => {
    if (!range?.from || !range?.to || !priceInput) return;

    setLoading(true);
    const newPricesBatch: { date: string; price: number }[] = [];
    const tempPricesState = { ...prices };
    const priceVal = parseFloat(priceInput);

    // Seçili aralıktaki tüm günleri oluştur
    const days = eachDayOfInterval({ start: range.from, end: range.to });

    days.forEach((day) => {
      const dateKey = format(day, "yyyy-MM-dd");
      newPricesBatch.push({ date: dateKey, price: priceVal });
      tempPricesState[dateKey] = priceVal; // UI'ı hemen güncellemek için
    });

    // Server Action Çağır
    const res = await updatePriceCalendarAction(propertyId, newPricesBatch);

    if (res.success) {
      setPrices(tempPricesState);
      setRange(undefined); // Seçimi temizle
      setPriceInput("");   // Inputu temizle
    } else {
      alert("Hata: " + res.error);
    }
    setLoading(false);
  };

  // Takvimdeki günlerin görüntüsünü özelleştirme
  const modifiers = {
    hasPrice: (date: Date) => {
      const key = format(date, "yyyy-MM-dd");
      return !!prices[key];
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* SOL: Takvim Alanı */}
      <div className="lg:col-span-7 bg-white p-6 rounded-[32px] border border-neutral-100 shadow-sm flex justify-center">
        <style>{`
          .rdp { --rdp-accent-color: #f43f5e; margin: 0; }
          .rdp-day { border-radius: 8px; }
          .rdp-day_selected { font-weight: bold; }
          .has-price { position: relative; }
          .has-price::after {
            content: "•";
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            color: #10b981; /* Yeşil nokta */
            font-size: 16px;
            line-height: 10px;
          }
        `}</style>
        
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          locale={tr}
          disabled={{ before: startOfDay(new Date()) }} // Geçmişi kilitle
          modifiers={modifiers}
          modifiersClassNames={{ hasPrice: "has-price" }}
          footer={
            range?.from && range?.to ? (
              <p className="mt-4 text-center text-sm font-bold text-rose-500">
                {format(range.from, "d MMM", { locale: tr })} - {format(range.to, "d MMM", { locale: tr })} seçildi.
              </p>
            ) : (
              <p className="mt-4 text-center text-sm text-neutral-400">Tarih aralığı seçin.</p>
            )
          }
        />
      </div>

      {/* SAĞ: İşlem Paneli */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-neutral-900 text-white p-8 rounded-[32px] shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Fiyat Tanımla</h3>
            <span className="text-xs bg-neutral-800 px-3 py-1 rounded-full text-neutral-400">EUR (€)</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1">Gecelik Tutar</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="0"
                  className="w-full bg-neutral-800 border border-neutral-700 text-white text-3xl font-black p-4 rounded-2xl outline-none focus:border-rose-500 transition-all placeholder:text-neutral-700"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">€</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading || !range?.from || !range?.to || !priceInput}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:hover:bg-rose-600 text-white p-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {loading ? "Kaydediliyor..." : "Fiyatı Uygula"}
            </button>
            
            {range && (
              <button 
                onClick={() => { setRange(undefined); setPriceInput(""); }}
                className="w-full text-neutral-500 text-xs font-bold hover:text-white transition-colors flex items-center justify-center gap-1"
              >
                <RotateCcw size={12} /> Seçimi Temizle
              </button>
            )}
          </div>
        </div>

        {/* Bilgi Kartı */}
        <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100">
          <h4 className="font-bold text-orange-800 mb-2 text-sm">Nasıl Çalışır?</h4>
          <p className="text-xs text-orange-700/80 leading-relaxed">
            Takvimden bir tarih aralığı seçip fiyat girin. "Uygula" dediğinizde bu günler için fiyatlar veritabanına yazılır ve villanın arama motoru indeksi <b>anında</b> güncellenir.
          </p>
        </div>
      </div>
    </div>
  );
}