"use client";

import { useState } from "react";
import { togglePropertyPromotionAction, createPromotionAction, deletePromotionAction } from "@/actions/admin/promotion-actions";
import { Tag, Layers, Check, Loader2, Plus, X, Gift, Trash2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

type Promotion = {
  id: number;
  name: string;
  value: string;
  type: "percentage" | "fixed_amount" | "free_days"; // Updated Type
  isStackable: boolean | null;
  minStay: number | null;
  code: string | null;
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
  const router = useRouter();
  const [actives, setActives] = useState<number[]>(activeIds);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Toggle Action (Your existing logic)
  const handleToggle = async (promoId: number) => {
    const isActive = actives.includes(promoId);
    setLoadingId(promoId);

    // Optimistic Update
    if (isActive) {
      setActives(prev => prev.filter(id => id !== promoId));
    } else {
      setActives(prev => [...prev, promoId]);
    }

    await togglePropertyPromotionAction(propertyId, promoId, isActive);
    setLoadingId(null);
    router.refresh();
  };

  // Delete Action
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Don't trigger toggle
    if(!confirm("Delete this promotion globally?")) return;
    await deletePromotionAction(id);
    router.refresh();
  };

  // Create Form Action
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const res = await createPromotionAction(formData);
    if(res.success) {
      setIsCreating(false);
      router.refresh();
    } else {
      alert("Error creating promotion");
    }
    setCreateLoading(false);
  };

  return (
    <div>
      {/* Header & Create Button */}
      <div className="flex justify-between items-center mb-4">
         <h3 className="font-bold text-lg text-neutral-800">Active Promotions</h3>
         <button 
           onClick={() => setIsCreating(!isCreating)}
           className="text-xs font-bold bg-neutral-900 text-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-neutral-700"
         >
           {isCreating ? <X size={14}/> : <Plus size={14}/>}
           {isCreating ? "Cancel" : "New Promo"}
         </button>
      </div>

      {/* CREATE FORM */}
      {isCreating && (
        <form onSubmit={handleCreate} className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-6 animate-in fade-in slide-in-from-top-2">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input name="name" placeholder="Name (e.g. Stay 7 Pay 6)" className="p-2 rounded border font-bold" required />
              <div className="flex gap-2">
                 <select name="type" className="p-2 rounded border bg-white flex-1" required>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (€)</option>
                    <option value="free_days">Free Days (Stay X Pay Y)</option>
                 </select>
                 <input name="value" type="number" step="0.1" placeholder="Val" className="p-2 rounded border w-20" required />
              </div>
              <input name="min_stay" type="number" placeholder="Min Stay (Days)" className="p-2 rounded border" />
              <input name="code" placeholder="Coupon Code (Optional)" className="p-2 rounded border uppercase" />
           </div>
           <button disabled={createLoading} className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg flex justify-center items-center gap-2">
             {createLoading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save Promotion
           </button>
        </form>
      )}

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allPromotions.map((promo) => {
          const isActive = actives.includes(promo.id);

          return (
            <div 
              key={promo.id}
              onClick={() => handleToggle(promo.id)}
              className={`
                cursor-pointer select-none p-4 rounded-2xl border flex items-center justify-between transition-all group
                ${isActive 
                  ? "bg-green-50 border-green-200 shadow-sm" 
                  : "bg-white border-neutral-100 hover:border-neutral-300"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isActive ? "bg-green-200 text-green-700" : "bg-neutral-100 text-neutral-400"}`}>
                  {promo.type === 'free_days' ? <Gift size={20}/> : promo.isStackable ? <Layers size={20} /> : <Tag size={20} />}
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isActive ? "text-green-900" : "text-neutral-700"}`}>
                    {promo.name}
                  </h4>
                  <div className="flex gap-2 mt-0.5">
                     <span className="text-[10px] font-bold bg-white/50 px-1.5 py-0.5 rounded text-neutral-500">
                       {promo.type === 'percentage' && `%${promo.value}`}
                       {promo.type === 'fixed_amount' && `${promo.value}€`}
                       {promo.type === 'free_days' && `${promo.value} Day Free`}
                     </span>
                     {promo.minStay && <span className="text-[10px] text-neutral-400 font-bold">Min {promo.minStay}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${isActive ? "bg-green-500 border-green-500 text-white" : "border-neutral-200"}`}>
                  {loadingId === promo.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : isActive && (
                    <Check size={14} />
                  )}
                </div>
                {/* Delete Button (Only visible on hover or if managing) */}
                <button onClick={(e) => handleDelete(e, promo.id)} className="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                   <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}