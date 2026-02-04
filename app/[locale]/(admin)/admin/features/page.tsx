import { db } from "@/db";
import { features } from "@/db/schema";
import { createFeatureAction, deleteFeatureAction } from "@/actions/admin/system-actions";
import { desc } from "drizzle-orm";
import { CheckCircle2, Plus, Trash2, Star, Coffee } from "lucide-react";

export default async function FeaturesPage() {
  const allFeatures = await db.query.features.findMany({
    orderBy: [desc(features.category), desc(features.id)],
  });

  // LOGIC: Split items based on your category enum
  const featureCategories = ['pool', 'outdoor', 'entertainment'];
  const amenityCategories = ['kitchen', 'other'];

  const featuresList = allFeatures.filter(f => featureCategories.includes(f.category || 'other'));
  const amenitiesList = allFeatures.filter(f => amenityCategories.includes(f.category || 'other'));

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-black text-neutral-900 mb-8 flex items-center gap-3">
        <CheckCircle2 className="text-emerald-500" size={32} /> Features & Amenities
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- CREATE FORM --- */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-900 text-white p-6 rounded-[24px] shadow-xl sticky top-6">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-neutral-700 pb-4">
              <Plus size={18} className="text-emerald-400" /> Create New Item
            </h2>
            
            <form action={createFeatureAction} className="space-y-4">
              
              {/* Labels */}
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Labels</label>
                 <div className="grid grid-cols-2 gap-2">
                    <input name="label_tr" placeholder="Name (TR)" className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors" required />
                    <input name="label_en" placeholder="Name (EN)" className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors" required />
                 </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Category</label>
                <select name="category" className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 mt-1">
                  <optgroup label="Key Features (Highlightable)">
                    <option value="pool">Pool & Spa</option>
                    <option value="outdoor">Outdoor & View</option>
                    <option value="entertainment">Entertainment & Tech</option>
                  </optgroup>
                  <optgroup label="Standard Amenities">
                    <option value="kitchen">Kitchen</option>
                    <option value="other">General / Comfort</option>
                  </optgroup>
                </select>
              </div>

              {/* Technical */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                   <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Key (Slug)</label>
                   <input name="key" placeholder="Auto-generated" className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-xl text-xs font-mono outline-none focus:border-emerald-500" />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Icon</label>
                   <input name="icon" placeholder="Lucide Name" className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-xl text-xs outline-none focus:border-emerald-500" />
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20">
                Create Item
              </button>
            </form>
          </div>
        </div>

        {/* --- LIST --- */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Features */}
          <div>
            <h3 className="font-bold text-xl text-neutral-900 mb-4 flex items-center gap-2">
               <Star className="fill-orange-400 text-orange-400" size={24} /> Key Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {featuresList.map((feat) => (
                <FeatureCard key={feat.id} item={feat} type="feature" />
              ))}
              {featuresList.length === 0 && <p className="text-sm text-neutral-400 italic">No key features yet.</p>}
            </div>
          </div>

          {/* Section 2: Amenities */}
          <div>
            <h3 className="font-bold text-xl text-neutral-900 mb-4 flex items-center gap-2">
               <Coffee className="text-neutral-500" size={24} /> Standard Amenities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {amenitiesList.map((feat) => (
                <FeatureCard key={feat.id} item={feat} type="amenity" />
              ))}
               {amenitiesList.length === 0 && <p className="text-sm text-neutral-400 italic">No amenities yet.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function FeatureCard({ item, type }: { item: any, type: 'feature' | 'amenity' }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-neutral-100 flex items-center justify-between group hover:border-neutral-300 transition-colors">
      <div className="flex items-center gap-3">
         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 ${type === 'feature' ? 'bg-orange-50 text-orange-600' : 'bg-neutral-50'}`}>
            <span className="text-[10px] font-bold">{item.icon?.substring(0,2) || "?"}</span>
         </div>
         <div>
            <h3 className="font-bold text-neutral-800 text-sm">
               {(item.label as any).tr}
            </h3>
            <div className="flex gap-2 text-[10px] text-neutral-400 font-mono mt-0.5">
               <span className="bg-neutral-100 px-1.5 py-0.5 rounded uppercase">{item.category}</span>
            </div>
         </div>
      </div>

      <form action={deleteFeatureAction.bind(null, item.id)}>
        <button className="p-2 text-neutral-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
          <Trash2 size={16} />
        </button>
      </form>
    </div>
  );
}