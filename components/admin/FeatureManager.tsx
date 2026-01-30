"use client";

import { useState } from "react";
import { toggleFeatureAction, toggleHighlightAction } from "@/actions/admin/feature-actions";
import { 
  Waves, ThermometerSun, Bath, ChefHat, Utensils, Wifi, Tv, Wind, Sunset, ShieldCheck, 
  CheckCircle2, Circle, Star, Loader2 
} from "lucide-react";

// Seed dosyasındaki ikon isimlerini bileşenlerle eşleştiriyoruz
const ICON_MAP: Record<string, any> = {
  "Waves": Waves,
  "ThermometerSun": ThermometerSun,
  "Bath": Bath,
  "ChefHat": ChefHat,
  "Utensils": Utensils,
  "Wifi": Wifi,
  "Tv": Tv,
  "Wind": Wind,
  "Sunset": Sunset,
  "ShieldCheck": ShieldCheck,
};

// TİP TANIMLAMALARI
type MasterFeature = {
  id: number;
  label: any; 
  category: string | null; // <-- BURAYA | null EKLEDİK
  icon: string | null;     // <-- BURAYA | null EKLEDİK
};

type ActiveFeature = {
  featureId: number;
  isHighlighted: boolean;
};

export default function FeatureManager({ 
  propertyId, 
  masterFeatures, 
  activeFeatures 
}: { 
  propertyId: number; 
  masterFeatures: MasterFeature[];
  activeFeatures: ActiveFeature[];
}) {
  // State'i local olarak yönetelim (Optimistik UI için)
  const [actives, setActives] = useState<ActiveFeature[]>(activeFeatures);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Gruplama Fonksiyonu (Kategorilere ayır)
  const groupedFeatures = masterFeatures.reduce((acc, feat) => {
    const cat = feat.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(feat);
    return acc;
  }, {} as Record<string, MasterFeature[]>);

  // Kategori Başlıkları (İsteğe bağlı çeviri)
  const categoryLabels: Record<string, string> = {
    pool: "Havuz & Spa",
    kitchen: "Mutfak",
    entertainment: "Eğlence",
    outdoor: "Dış Mekan",
    other: "Diğer Özellikler"
  };

  // 1. ÖZELLİK AÇ/KAPA HANDLER
  const handleToggle = async (featId: number) => {
    const existing = actives.find(a => a.featureId === featId);
    setLoadingId(featId);

    // Optimistik Update (Arayüz hemen değişsin)
    if (existing) {
      setActives(prev => prev.filter(a => a.featureId !== featId));
    } else {
      setActives(prev => [...prev, { featureId: featId, isHighlighted: false }]);
    }

    // Server Action
    await toggleFeatureAction(propertyId, featId, !!existing);
    setLoadingId(null);
  };

  // 2. HIGHLIGHT HANDLER
  const handleHighlight = async (e: React.MouseEvent, featId: number) => {
    e.stopPropagation(); // Parent click tetiklenmesin
    const existing = actives.find(a => a.featureId === featId);
    if (!existing) return; // Seçili olmayan şeye yıldız verilemez

    // Optimistik Update
    setActives(prev => prev.map(a => 
      a.featureId === featId ? { ...a, isHighlighted: !a.isHighlighted } : a
    ));

    await toggleHighlightAction(propertyId, featId, existing.isHighlighted);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {Object.entries(groupedFeatures).map(([category, features]) => (
        <div key={category} className="bg-white p-6 rounded-[32px] border border-neutral-100 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2 capitalize">
            {categoryLabels[category] || category}
            <span className="text-xs bg-neutral-100 text-neutral-400 px-2 py-1 rounded-full">{features.length}</span>
          </h3>
          
          <div className="space-y-3">
            {features.map((feat) => {
              const active = actives.find(a => a.featureId === feat.id);
              const isSelected = !!active;
              const IconComponent = feat.icon ? ICON_MAP[feat.icon] : Circle;

              return (
                <div 
                  key={feat.id}
                  onClick={() => handleToggle(feat.id)}
                  className={`
                    group flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all select-none
                    ${isSelected 
                      ? "bg-neutral-900 border-neutral-900 text-white shadow-lg" 
                      : "bg-white border-neutral-100 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isSelected ? "bg-white/20" : "bg-neutral-100 text-neutral-400"}`}>
                      {loadingId === feat.id ? <Loader2 size={18} className="animate-spin" /> : <IconComponent size={18} />}
                    </div>
                    <span className="font-bold text-sm">{(feat.label as any).tr}</span>
                  </div>

                  {/* Highlight Star Button */}
                  {isSelected && (
                    <button
                      onClick={(e) => handleHighlight(e, feat.id)}
                      className={`
                        p-2 rounded-full transition-all hover:scale-110 active:scale-95
                        ${active.isHighlighted ? "text-yellow-400 bg-white/20" : "text-neutral-600 hover:text-yellow-400"}
                      `}
                      title="Öne Çıkan Özellik Yap"
                    >
                      <Star size={18} fill={active.isHighlighted ? "currentColor" : "none"} />
                    </button>
                  )}
                  
                  {!isSelected && (
                    <div className="w-5 h-5 rounded-full border-2 border-neutral-200 group-hover:border-neutral-400" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}