"use client";

import { useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { tr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { format, eachDayOfInterval } from "date-fns";
import { updatePriceCalendarAction } from "@/actions/admin/price-actions";
import { toggleBlockDatesAction } from "@/actions/admin/availability-actions";
import { Loader2, Save, Ban, Unlock, Euro, CalendarOff, RotateCcw } from "lucide-react";

// Register Turkish locale
registerLocale("tr", tr);

type PriceCalendarProps = {
  propertyId: number;
  existingPrices: Record<string, number>;
  blockedRanges: { start: string; end: string }[];
};

export default function PriceCalendar({
  propertyId,
  existingPrices,
  blockedRanges,
}: PriceCalendarProps) {
  // Use React-Datepicker state (Start/End)
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const [prices, setPrices] = useState(existingPrices);
  const [mode, setMode] = useState<"price" | "block">("price");
  const [priceInput, setPriceInput] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // --- RANGE SELECTION ---
  const onChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  // --- SAVE PRICE ---
  const handleSavePrice = async () => {
    if (!startDate || !endDate || !priceInput) return;
    setLoading(true);

    const newPricesBatch: { date: string; price: number }[] = [];
    const tempPrices = { ...prices };
    const val = parseFloat(priceInput);
    
    // Generate all days in interval
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    days.forEach((day) => {
      const k = format(day, "yyyy-MM-dd");
      newPricesBatch.push({ date: k, price: val });
      tempPrices[k] = val;
    });

    const res = await updatePriceCalendarAction(propertyId, newPricesBatch);
    if (res.success) {
      setPrices(tempPrices);
      setStartDate(null);
      setEndDate(null);
      setPriceInput("");
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
  };

  // --- BLOCK DATES ---
  const handleBlockToggle = async (shouldBlock: boolean) => {
    if (!startDate || !endDate) return;
    setLoading(true);

    // Convert to String immediately to avoid Timezone shifts
    const startStr = format(startDate, "yyyy-MM-dd");
    const endStr = format(endDate, "yyyy-MM-dd");

    const res = await toggleBlockDatesAction(propertyId, startStr, endStr, shouldBlock);
    
    if (res.success) {
      setStartDate(null);
      setEndDate(null);
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
  };

  // --- CUSTOM DAY RENDERER ---
  // This is the magic part that fixes the visibility issue
  const renderDayContents = (day: number, date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const price = prices[dateKey];
    
    // Check if blocked (inclusive start, exclusive end logic handled by data prep)
    // But since we fixed the logic to save Strings properly, simple comparison works:
    const isBlocked = blockedRanges.some(b => dateKey >= b.start && dateKey < b.end);

    return (
      <div className="flex flex-col items-center justify-center h-full w-full relative pb-1">
        {/* Day Number */}
        <span className={`text-sm font-semibold z-10 ${isBlocked ? "line-through text-neutral-400" : "text-neutral-700"}`}>
            {day}
        </span>
        
        {/* Content Layer: Price or Block Icon */}
        <div className="absolute bottom-1 left-0 right-0 flex justify-center">
            {isBlocked ? (
                 <Ban size={10} className="text-rose-400" />
            ) : price ? (
                <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1 rounded-sm shadow-sm leading-tight">
                    {price}
                </span>
            ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT: CALENDAR */}
      <div className="lg:col-span-7 bg-white p-6 rounded-[32px] border border-neutral-100 shadow-sm flex flex-col items-center">
        
        <div className="flex bg-neutral-100 p-1 rounded-xl mb-6 w-full max-w-sm">
            <button onClick={() => setMode("price")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === "price" ? "bg-white shadow text-emerald-700" : "text-neutral-500 hover:text-neutral-700"}`}>
                <Euro size={16}/> Set Price
            </button>
            <button onClick={() => setMode("block")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === "block" ? "bg-white shadow text-rose-600" : "text-neutral-500 hover:text-neutral-700"}`}>
                <CalendarOff size={16}/> Block Dates
            </button>
        </div>

        {/* Custom Styling for the Calendar Box */}
        <style>{`
            .react-datepicker { font-family: inherit; border: none; box-shadow: none; }
            .react-datepicker__header { bg-white; border-bottom: none; background-color: white; }
            .react-datepicker__day-name { color: #a3a3a3; font-weight: bold; width: 3rem; }
            .react-datepicker__day { width: 3.5rem; height: 3.5rem; border-radius: 0.75rem; margin: 0.2rem; transition: all 0.2s; border: 1px solid transparent; }
            .react-datepicker__day:hover { background-color: #f5f5f5; border-color: #e5e5e5; }
            .react-datepicker__day--selected { background-color: #f43f5e !important; color: white !important; }
            .react-datepicker__day--in-range { background-color: #ffe4e6 !important; color: #881337; }
            .react-datepicker__day--keyboard-selected { background-color: transparent; }
        `}</style>
        
        <DatePicker
            selected={startDate}
            onChange={onChange}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            inline
            locale="tr"
            renderDayContents={renderDayContents} // <--- The Fix
            calendarClassName="!border-none"
            minDate={new Date()}
        />
      </div>

      {/* RIGHT: ACTION PANEL */}
      <div className="lg:col-span-5 bg-neutral-900 text-white p-8 rounded-[32px] h-fit shadow-xl">
        {mode === "price" ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-400"><Euro size={20}/> Set Price</h3>
                <div className="relative mb-4">
                  <input type="number" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} placeholder="0" className="w-full bg-neutral-800 p-4 rounded-xl text-3xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"/>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">€</span>
                </div>
                <button onClick={handleSavePrice} disabled={loading || !startDate} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors">
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} Save Price
                </button>
            </div>
        ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                 <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-rose-400"><CalendarOff size={20}/> Availability</h3>
                <p className="text-sm text-neutral-400 mb-6 leading-relaxed">Select dates to close or open.</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleBlockToggle(true)} disabled={loading || !startDate} className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-colors">
                        {loading ? <Loader2 className="animate-spin" /> : <Ban size={24} />} Block
                    </button>
                    <button onClick={() => handleBlockToggle(false)} disabled={loading || !startDate} className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-colors">
                        {loading ? <Loader2 className="animate-spin" /> : <Unlock size={24} />} Open
                    </button>
                </div>
            </div>
        )}

        {startDate && (
          <div className="mt-6 pt-6 border-t border-neutral-800 text-center animate-in fade-in">
             <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">Selected Range</p>
             <p className="text-white text-lg font-bold">
                {format(startDate, "d MMM", { locale: tr })} 
                {endDate && ` - ${format(endDate, "d MMM", { locale: tr })}`}
             </p>
             <button onClick={() => { setStartDate(null); setEndDate(null); }} className="mt-3 text-xs text-neutral-500 hover:text-white flex items-center justify-center gap-1 mx-auto transition-colors"><RotateCcw size={12}/> Clear</button>
          </div>
        )}
      </div>
    </div>
  );
}