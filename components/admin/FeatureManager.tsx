"use client";

import { useState } from "react";
import { toggleFeatureAction } from "@/actions/admin/feature-actions";
import { Star, Check, Loader2, Sparkles, Coffee } from "lucide-react";
import { useRouter } from "next/navigation";

type FeatureManagerProps = {
  propertyId: number;
  masterFeatures: any[]; // The list from DB
  activeFeatures: { featureId: number; isHighlighted: boolean }[];
};

export default function FeatureManager({ propertyId, masterFeatures, activeFeatures }: FeatureManagerProps) {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  // Split Logic
  const featureCategories = ['pool', 'outdoor', 'entertainment'];
  const amenityCategories = ['kitchen', 'other'];

  const featuresList = masterFeatures.filter(f => featureCategories.includes(f.category));
  const amenitiesList = masterFeatures.filter(f => amenityCategories.includes(f.category));

  // --- ACTION ---
  const handleToggle = async (featureId: number, currentHighlight: boolean, isHighlightToggle: boolean) => {
    // Prevent double clicks
    if (loadingIds.includes(featureId)) return;
    setLoadingIds(prev => [...prev, featureId]);

    const isActive = activeFeatures.some(f => f.featureId === featureId);
    
    // Logic:
    // 1. If clicking Highlight Star -> Toggle Highlight (Feature must be active first)
    // 2. If clicking Box -> Toggle Active (If removing, remove highlight too)
    
    let shouldBeActive = isActive;
    let shouldBeHighlighted = currentHighlight;

    if (isHighlightToggle) {
        if (!isActive) shouldBeActive = true; // Auto-activate if highlighting
        shouldBeHighlighted = !currentHighlight;
    } else {
        shouldBeActive = !isActive;
        if (!shouldBeActive) shouldBeHighlighted = false; // Reset highlight if removing
    }

    await toggleFeatureAction(propertyId, featureId, shouldBeActive, shouldBeHighlighted);
    
    router.refresh();
    setLoadingIds(prev => prev.filter(id => id !== featureId));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      
      {/* COLUMN 1: KEY FEATURES (With Highlight Option) */}
      <div className="bg-white p-6 rounded-[24px] border border-neutral-200">
         <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-neutral-800">
            <Sparkles className="text-orange-500 fill-orange-500" size={20} /> Key Features
         </h3>
         <div className="space-y-2">
            {featuresList.map(feat => {
               const activeState = activeFeatures.find(f => f.featureId === feat.id);
               const isActive = !!activeState;
               const isHighlighted = activeState?.isHighlighted || false;
               const isLoading = loadingIds.includes(feat.id);

               return (
                 <div key={feat.id} className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${isActive ? 'bg-orange-50 border-orange-200' : 'bg-white border-neutral-100 hover:border-neutral-300'}`}>
                    
                    {/* Main Toggle Area */}
                    <div 
                        onClick={() => handleToggle(feat.id, isHighlighted, false)}
                        className="flex items-center gap-3 cursor-pointer flex-1 select-none"
                    >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isActive ? 'bg-orange-500 border-orange-500 text-white' : 'border-neutral-300 bg-white'}`}>
                           {isActive && <Check size={14} strokeWidth={3} />}
                        </div>
                        <span className={`text-sm font-bold ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`}>
                           {(feat.label as any).tr}
                        </span>
                    </div>

                    {/* Highlight Star Toggle */}
                    <button 
                       onClick={() => handleToggle(feat.id, isHighlighted, true)}
                       disabled={isLoading}
                       className={`p-2 rounded-full transition-all ${isHighlighted ? 'text-orange-500 bg-white shadow-sm' : 'text-neutral-200 hover:text-orange-300'}`}
                       title="Highlight on card"
                    >
                       {isLoading ? <Loader2 size={18} className="animate-spin text-neutral-400" /> : <Star size={18} className={isHighlighted ? "fill-orange-500" : ""} />}
                    </button>
                 </div>
               );
            })}
            {featuresList.length === 0 && <p className="text-sm text-neutral-400 p-2">Create features in Admin -- Features.</p>}
         </div>
      </div>

      {/* COLUMN 2: AMENITIES (Simple List) */}
      <div className="bg-white p-6 rounded-[24px] border border-neutral-200">
         <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-neutral-800">
            <Coffee className="text-neutral-500" size={20} /> Amenities
         </h3>
         <div className="grid grid-cols-2 gap-2">
            {amenitiesList.map(feat => {
               const activeState = activeFeatures.find(f => f.featureId === feat.id);
               const isActive = !!activeState;
               const isLoading = loadingIds.includes(feat.id);

               return (
                 <div 
                    key={feat.id} 
                    onClick={() => handleToggle(feat.id, false, false)}
                    className={`cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-all select-none ${isActive ? 'bg-neutral-100 border-neutral-300' : 'bg-white border-neutral-100 hover:border-neutral-300'}`}
                 >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isActive ? 'bg-neutral-800 border-neutral-800 text-white' : 'border-neutral-300 bg-white'}`}>
                       {isActive && (isLoading ? <Loader2 size={12} className="animate-spin"/> : <Check size={14} strokeWidth={3} />)}
                    </div>
                    <span className={`text-sm font-bold ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`}>
                       {(feat.label as any).tr}
                    </span>
                 </div>
               );
            })}
             {amenitiesList.length === 0 && <p className="text-sm text-neutral-400 p-2 col-span-2">Create amenities in Admin -- Features.</p>}
         </div>
      </div>

    </div>
  );
}