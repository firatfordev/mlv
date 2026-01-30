"use client";

import { useState } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { tr } from "date-fns/locale";
import { format, eachDayOfInterval, startOfDay } from "date-fns";
import { updatePriceCalendarAction } from "@/actions/admin/price-actions";
import { toggleBlockDatesAction } from "@/actions/admin/availability-actions";
import { Loader2, Save, Ban, Unlock, Euro, CalendarOff, RotateCcw } from "lucide-react";
import "react-day-picker/dist/style.css";

type PriceCalendarProps = {
  propertyId: number;
  existingPrices: Record<string, number>;
  blockedRanges: { start: string; end: string }[]; // STRING TYPE
};

export default function PriceCalendar({
  propertyId,
  existingPrices,
  blockedRanges,
}: PriceCalendarProps) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [prices, setPrices] = useState(existingPrices);
  const [mode, setMode] = useState<"price" | "block">("price");
  const [priceInput, setPriceInput] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // SAVE PRICE
  const handleSavePrice = async () => {
    if (!range?.from || !range?.to || !priceInput) return;
    setLoading(true);

    const newPricesBatch: { date: string; price: number }[] = [];
    const tempPrices = { ...prices };
    const val = parseFloat(priceInput);
    const days = eachDayOfInterval({ start: range.from, end: range.to });

    days.forEach((day) => {
      const k = format(day, "yyyy-MM-dd");
      newPricesBatch.push({ date: k, price: val });
      tempPrices[k] = val;
    });

    const res = await updatePriceCalendarAction(propertyId, newPricesBatch);
    if (res.success) {
      setPrices(tempPrices);
      setRange(undefined);
      setPriceInput("");
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
  };

  // BLOCK DATES
  const handleBlockToggle = async (shouldBlock: boolean) => {
    if (!range?.from || !range?.to) return;
    setLoading(true);
    const res = await toggleBlockDatesAction(propertyId, range.from, range.to, shouldBlock);
    if (res.success) {
      setRange(undefined);
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
  };

  // CHECK BLOCK (String Comparison)
  const isBlocked = (date: Date) => {
    const k = format(date, "yyyy-MM-dd");
    return blockedRanges.some(b => k >= b.start && k <= b.end);
  };

  // RENDER CELL
  function CustomDayContent(props: any) {
    const { date } = props;
    const dateKey = format(date, "yyyy-MM-dd");
    const price = prices[dateKey];
    const blocked = isBlocked(date);

    return (
      <div className={`flex flex-col items-center justify-center h-full w-full rounded-md border border-transparent 
        ${blocked ? "bg-neutral-100 opacity-60 cursor-not-allowed" : "hover:border-rose-100"}`}>
        <span className={`text-sm font-medium ${blocked ? "text-neutral-400 line-through" : "text-neutral-700"}`}>
            {date.getDate()}
        </span>
        {blocked ? (
           <Ban size={14} className="text-rose-400 mt-1" />
        ) : price ? (
           <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded shadow-sm mt-1">
             {price}€
           </span>
        ) : (
           <span className="h-[22px]"></span> 
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT: Calendar */}
      <div className="lg:col-span-7 bg-white p-6 rounded-[32px] border border-neutral-100 shadow-sm flex flex-col items-center">
        <div className="flex bg-neutral-100 p-1 rounded-xl mb-6 w-full max-w-sm">
            <button onClick={() => setMode("price")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === "price" ? "bg-white shadow text-emerald-700" : "text-neutral-500 hover:text-neutral-700"}`}>
                <Euro size={16}/> Price
            </button>
            <button onClick={() => setMode("block")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === "block" ? "bg-white shadow text-rose-600" : "text-neutral-500 hover:text-neutral-700"}`}>
                <CalendarOff size={16}/> Block
            </button>
        </div>
        <style>{`.rdp { margin: 0; } .rdp-day { height: 60px; width: 60px; }`}</style>
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          locale={tr}
          disabled={{ before: startOfDay(new Date()) }}
          components={{ DayContent: CustomDayContent } as any}
        />
      </div>

      {/* RIGHT: Actions */}
      <div className="lg:col-span-5 bg-neutral-900 text-white p-8 rounded-[32px] h-fit shadow-xl">
        {mode === "price" ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-400"><Euro size={20}/> Set Price</h3>
                <div className="relative mb-4">
                  <input type="number" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} placeholder="0" className="w-full bg-neutral-800 p-4 rounded-xl text-3xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"/>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">€</span>
                </div>
                <button onClick={handleSavePrice} disabled={loading || !range?.from} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors">
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} Save Price
                </button>
            </div>
        ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                 <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-rose-400"><CalendarOff size={20}/> Manage Availability</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleBlockToggle(true)} disabled={loading || !range?.from} className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : <Ban size={24} />} Block
                    </button>
                    <button onClick={() => handleBlockToggle(false)} disabled={loading || !range?.from} className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : <Unlock size={24} />} Open
                    </button>
                </div>
            </div>
        )}
        {range?.from && (
          <div className="mt-6 pt-6 border-t border-neutral-800 text-center animate-in fade-in">
             <p className="text-white text-lg font-bold">{format(range.from, "d MMM", { locale: tr })} {range.to && ` - ${format(range.to, "d MMM", { locale: tr })}`}</p>
             <button onClick={() => setRange(undefined)} className="mt-3 text-xs text-neutral-500 hover:text-white flex items-center justify-center gap-1 mx-auto"><RotateCcw size={12}/> Clear</button>
          </div>
        )}
      </div>
    </div>
  );
}