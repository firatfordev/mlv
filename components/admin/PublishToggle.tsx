"use client";

import { useState } from "react";
import { togglePropertyStatusAction } from "@/actions/admin/property-actions";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function PublishToggle({ 
  propertyId, 
  isActive 
}: { 
  propertyId: number; 
  isActive: boolean;
}) {
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    // Optimistik Update (Hemen arayüzü değiştir)
    setActive(!active);

    const res = await togglePropertyStatusAction(propertyId, active);
    
    if (!res.success) {
      // Hata olursa geri al
      setActive(active);
      alert("Durum güncellenemedi!");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        flex items-center gap-3 px-5 py-3 rounded-full font-bold transition-all shadow-sm active:scale-95
        ${active 
          ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200" 
          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border border-neutral-200"
        }
      `}
    >
      {loading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : active ? (
        <Eye size={20} />
      ) : (
        <EyeOff size={20} />
      )}
      
      <div className="text-left flex flex-col leading-none">
        <span className="text-sm">{active ? "YAYINDA" : "TASLAK"}</span>
        <span className="text-[10px] opacity-70 font-normal">
          {active ? "Müşteriler görebiliyor" : "Gizli mod"}
        </span>
      </div>
    </button>
  );
}