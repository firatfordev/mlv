"use client";

import { useState } from "react";
import { togglePropertyPromotionAction } from "@/actions/admin/promotion-actions";
import { Tag, Layers, Check, Loader2 } from "lucide-react";

type Promotion = {
  id: number;
  name: string;
  value: string;
  type: "percentage" | "fixed_amount"; // Enum tipini buraya yazdık
  isStackable: boolean | null;
};

export default function PromoManager({ 
  propertyId, 
  allPromotions, 
  activeIds 
}: { 
  propertyId: number; 
  allPromotions: Promotion[];
  activeIds: number[];
}) {
  const [actives, setActives] = useState<number[]>(activeIds);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleToggle = async (promoId: number) => {
    const isActive = actives.includes(promoId);
    setLoadingId(promoId);

    // Optimistik
    if (isActive) {
      setActives(prev => prev.filter(id => id !== promoId));
    } else {
      setActives(prev => [...prev, promoId]);
    }

    await togglePropertyPromotionAction(propertyId, promoId, isActive);
    setLoadingId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {allPromotions.map((promo) => {
        const isActive = actives.includes(promo.id);

        return (
          <div 
            key={promo.id}
            onClick={() => handleToggle(promo.id)}
            className={`
              cursor-pointer select-none p-4 rounded-2xl border flex items-center justify-between transition-all
              ${isActive 
                ? "bg-green-50 border-green-200 shadow-sm" 
                : "bg-white border-neutral-100 hover:border-neutral-300"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isActive ? "bg-green-200 text-green-700" : "bg-neutral-100 text-neutral-400"}`}>
                {promo.isStackable ? <Layers size={20} /> : <Tag size={20} />}
              </div>
              <div>
                <h4 className={`font-bold text-sm ${isActive ? "text-green-900" : "text-neutral-700"}`}>
                  {promo.name}
                </h4>
                <div className="flex gap-2 mt-0.5">
                   <span className="text-[10px] font-bold bg-white/50 px-1.5 py-0.5 rounded text-neutral-500">
                     {promo.type === 'percentage' ? `%${promo.value}` : `${promo.value}€`}
                   </span>
                   {promo.isStackable && <span className="text-[10px] font-bold text-green-600">Stackable</span>}
                </div>
              </div>
            </div>

            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${isActive ? "bg-green-500 border-green-500 text-white" : "border-neutral-200"}`}>
              {loadingId === promo.id ? (
                <Loader2 size={12} className="animate-spin" />
              ) : isActive && (
                <Check size={14} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}