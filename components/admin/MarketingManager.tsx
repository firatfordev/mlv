"use client";

import { useState } from "react";
import { togglePropertyFlagAction } from "@/actions/admin/property-actions";
import { TrendingUp, ThumbsUp, Loader2 } from "lucide-react";

type Props = {
  propertyId: number;
  isPromoted: boolean;
  isRecommended: boolean;
};

export default function MarketingManager({ propertyId, isPromoted, isRecommended }: Props) {
  const [promoted, setPromoted] = useState(isPromoted);
  const [recommended, setRecommended] = useState(isRecommended);
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (field: "isPromoted" | "isRecommended", currentVal: boolean, setFn: any) => {
    setLoading(field);
    
    // Optimistik Update
    setFn(!currentVal);
    
    const res = await togglePropertyFlagAction(propertyId, field, currentVal);
    if(!res.success) setFn(currentVal); // Hata varsa geri al
    
    setLoading(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* 1. ÖNE ÇIKANLAR (PROMOTED) */}
      <div 
        onClick={() => handleToggle("isPromoted", promoted, setPromoted)}
        className={`
          cursor-pointer select-none p-4 rounded-2xl border flex items-center justify-between transition-all
          ${promoted ? "bg-purple-50 border-purple-200" : "bg-white border-neutral-100 hover:border-neutral-300"}
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${promoted ? "bg-purple-200 text-purple-700" : "bg-neutral-100 text-neutral-400"}`}>
            <TrendingUp size={20} />
          </div>
          <div>
            <h4 className={`font-bold text-sm ${promoted ? "text-purple-900" : "text-neutral-700"}`}>Öne Çıkanlar</h4>
            <p className="text-[10px] text-neutral-500">Ana sayfada en üstte listelenir</p>
          </div>
        </div>
        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${promoted ? "bg-purple-600" : "bg-neutral-200"}`}>
          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${promoted ? "translate-x-4" : ""}`} />
        </div>
      </div>

      {/* 2. TAVSİYE EDİLENLER (RECOMMENDED) */}
      <div 
        onClick={() => handleToggle("isRecommended", recommended, setRecommended)}
        className={`
          cursor-pointer select-none p-4 rounded-2xl border flex items-center justify-between transition-all
          ${recommended ? "bg-blue-50 border-blue-200" : "bg-white border-neutral-100 hover:border-neutral-300"}
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${recommended ? "bg-blue-200 text-blue-700" : "bg-neutral-100 text-neutral-400"}`}>
            <ThumbsUp size={20} />
          </div>
          <div>
            <h4 className={`font-bold text-sm ${recommended ? "text-blue-900" : "text-neutral-700"}`}>Tavsiye Edilen</h4>
            <p className="text-[10px] text-neutral-500">Editörün seçimi listesinde görünür</p>
          </div>
        </div>
        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${recommended ? "bg-blue-600" : "bg-neutral-200"}`}>
          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${recommended ? "translate-x-4" : ""}`} />
        </div>
      </div>

    </div>
  );
}