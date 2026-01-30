"use client";

import { useState } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { tr } from "date-fns/locale";
import { format, eachDayOfInterval, startOfDay, isWithinInterval } from "date-fns";
import { updatePriceCalendarAction } from "@/actions/admin/price-actions";
import { toggleBlockDatesAction } from "@/actions/admin/availability-actions";
import { Loader2, Save, Ban, Unlock, Euro, CalendarOff, RotateCcw } from "lucide-react";
import "react-day-picker/dist/style.css";

type PriceCalendarProps = {
  propertyId: number;
  existingPrices: Record<string, number>;
  blockedRanges: { start: Date; end: Date }[];
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

  // --- ACTIONS ---

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

  const handleBlockToggle = async (shouldBlock: boolean) => {
    if (!range?.from || !range?.to) return;
    setLoading(true);
    const res = await toggleBlockDatesAction(propertyId, range.from, range.to, shouldBlock);
    if (res.success) {
      setRange(undefined);
      // Data refreshes via server action revalidation
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
  };

  // --- CUSTOM RENDERING ---

  const isBlocked = (date: Date) => {
    return blockedRanges.some(b => 
      isWithinInterval(date, { start: b.start, end: b.end })
    );
  };

  // This component replaces the default "Day" content
  function CustomDayContent(props: any) {
    const { date } = props;
    const dateKey = format(date, "yyyy-MM-dd");
    const price = prices[dateKey];
    const blocked = isBlocked(date);

    return (
      <div className={`
        relative w-full h-full flex flex-col items-center justify-start pt-1
        ${blocked ? "opacity-50" : ""}
      `}>
        {/* Day Number */}
        <span className={`text-sm font-medium z-10 ${blocked ? "line-through text-neutral-400" : "text-neutral-700"}`}>
            {date.getDate()}
        </span>

        {/* Content Layer */}
        <div className="mt-0.5 flex items-center justify-center">
            {blocked ? (
                // BLOCKED INDICATOR
                <Ban size={14} className="text-rose-400" />
            ) : price ? (
                // PRICE TAG
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 rounded shadow-sm">
                    {price}
                </span>
            ) : (
                // SPACER
                <span className="h-4 block"></span>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT: CALENDAR */}
      <div className="lg:col-span-7 bg-white p-6 rounded-[32px] border border-neutral-100 shadow-sm flex flex-col items-center">
        
        {/* Mode Toggles */}
        <div className="flex bg-neutral-100 p-1 rounded-xl mb-6 w-full max-w-sm">
            <button 
                onClick={() => setMode("price")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${mode === "price" ? "bg-white shadow text-emerald-700" : "text-neutral-500 hover:text-neutral-700"}`}
            >
                <Euro size={16}/> Set Price
            </button>
            <button 
                onClick={() => setMode("block")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${mode === "block" ? "bg-white shadow text-rose-600" : "text-neutral-500 hover:text-neutral-700"}`}
            >
                <CalendarOff size={16}/> Block Dates
            </button>
        </div>

        <style>{`
          .rdp { margin: 0; }
          /* Force larger cells to fit content */
          .rdp-day { height: 56px; width: 56px; border-radius: 12px; }
          .rdp-day_selected { border: 2px solid #f43f5e; }
        `}</style>
        
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          locale={tr}
          disabled={{ before: startOfDay(new Date()) }}
          // INJECT CUSTOM CONTENT HERE
          components={{ DayContent: CustomDayContent } as any}
        />
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="lg:col-span-5 bg-neutral-900 text-white p-8 rounded-[32px] h-fit shadow-xl">
        
        {mode === "price" ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-400">
                    <Euro size={20}/> Price Setting
                </h3>
                <div className="relative mb-4">
                  <input
                      type="number"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      placeholder="0"
                      className="w-full bg-neutral-800 p-4 rounded-xl text-3xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">€</span>
                </div>
                <button
                  onClick={handleSavePrice}
                  disabled={loading || !range?.from}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  Save Price
                </button>
            </div>
        ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                 <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-rose-400">
                    <CalendarOff size={20}/> Availability
                </h3>
                <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                    Select dates to block (close) or unblock (open).
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleBlockToggle(true)}
                        disabled={loading || !range?.from}
                        className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-colors"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Ban size={24} />}
                        Block
                    </button>
                    <button
                        onClick={() => handleBlockToggle(false)}
                        disabled={loading || !range?.from}
                        className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-colors"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Unlock size={24} />}
                        Open
                    </button>
                </div>
            </div>
        )}

        {range?.from && (
          <div className="mt-6 pt-6 border-t border-neutral-800 text-center animate-in fade-in">
             <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">Selected Range</p>
             <p className="text-white text-lg font-bold">
                {format(range.from, "d MMM", { locale: tr })} 
                {range.to && ` - ${format(range.to, "d MMM", { locale: tr })}`}
             </p>
             <button 
                onClick={() => setRange(undefined)}
                className="mt-3 text-xs text-neutral-500 hover:text-white flex items-center justify-center gap-1 mx-auto transition-colors"
            >
                <RotateCcw size={12}/> Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}