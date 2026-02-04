import { db } from "@/db";
import { locations } from "@/db/schema";
import { createLocationAction, deleteLocationAction } from "@/actions/admin/system-actions";
import { desc, asc } from "drizzle-orm";
import { MapPin, Plus, Trash2, CornerDownRight, Map } from "lucide-react";

export default async function LocationsPage() {
  // Fetch all locations to build the parent dropdown and list
  const allLocations = await db.query.locations.findMany({
    orderBy: [asc(locations.parentId), asc(locations.id)],
  });

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-black text-neutral-900 mb-8 flex items-center gap-3">
        <Map className="text-rose-500" size={32} /> Location Hierarchy
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- CREATE FORM --- */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-[24px] border border-neutral-200 shadow-xl sticky top-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Plus size={18} className="text-rose-500" /> Add New Location
            </h2>
            
            <form action={createLocationAction} className="space-y-4">
              
              {/* Names */}
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Location Name</label>
                 <div className="grid grid-cols-2 gap-2">
                    <input name="name_tr" placeholder="Turkish (e.g. İslamlar)" className="w-full bg-neutral-50 border p-3 rounded-xl text-sm font-bold outline-none focus:border-rose-500" required />
                    <input name="name_en" placeholder="English (e.g. Islamlar)" className="w-full bg-neutral-50 border p-3 rounded-xl text-sm font-bold outline-none focus:border-rose-500" required />
                 </div>
              </div>

              {/* Hierarchy Selection */}
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Parent Location</label>
                <select name="parentId" className="w-full bg-neutral-50 border p-3 rounded-xl text-sm font-bold text-neutral-600 outline-none focus:border-rose-500 mt-1">
                  <option value="">No Parent (Top Level City)</option>
                  {allLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      ↳ {(loc.name as any).tr} ({loc.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Selection (UPDATED) */}
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Location Level</label>
                <select name="type" className="w-full bg-neutral-50 border p-3 rounded-xl text-sm font-bold text-neutral-600 outline-none focus:border-rose-500 mt-1">
                  <option value="city">1. City (Şehir)</option>
                  <option value="district">2. District (İlçe)</option>
                  <option value="main_area">3. Main Area (Ana Bölge)</option> {/* NEW */}
                  <option value="area">4. Area (Mahalle/Köy)</option>
                  <option value="sub_area">5. Sub Area (Mevki)</option> {/* NEW */}
                </select>
              </div>

              {/* Slug */}
              <div>
                 <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Slug (URL)</label>
                 <input name="slug" placeholder="Auto-generated if empty" className="w-full bg-neutral-50 border p-3 rounded-xl text-xs font-mono outline-none focus:border-rose-500 mt-1" />
              </div>

              {/* Checkbox */}
              <div className="flex items-center gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <input type="checkbox" name="isFeatured" id="feat" className="w-4 h-4 rounded border-neutral-300 accent-rose-500" />
                <label htmlFor="feat" className="text-sm font-medium cursor-pointer select-none">Featured (Show on Home)</label>
              </div>

              <button type="submit" className="w-full bg-neutral-900 text-white font-bold py-3 rounded-xl hover:bg-neutral-800 transition-colors shadow-lg">
                Save Location
              </button>
            </form>
          </div>
        </div>

        {/* --- LIST --- */}
        <div className="lg:col-span-2 space-y-3">
          {allLocations.map((loc) => (
            <div key={loc.id} className="bg-white p-4 rounded-xl border border-neutral-100 flex items-center justify-between group hover:border-rose-200 transition-colors">
              <div className="flex items-center gap-3">
                 {/* Visual Indentation based on type logic isn't strictly enforced by DB, but we show parent relation */}
                 {loc.parentId ? <CornerDownRight className="text-neutral-300 ml-6" size={20} /> : <MapPin className="text-rose-500" size={20} />}
                 
                 <div>
                    <h3 className="font-bold text-neutral-800 flex items-center gap-2 text-lg">
                       {(loc.name as any).tr} 
                       <Badge type={loc.type} />
                       {loc.isFeatured && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold">Featured</span>}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono mt-1">
                       <span className="bg-neutral-50 px-1 rounded">/{loc.slug}</span>
                    </div>
                 </div>
              </div>

              <form action={deleteLocationAction.bind(null, loc.id)}>
                <button className="p-2 text-neutral-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Delete Location">
                  <Trash2 size={18} />
                </button>
              </form>
            </div>
          ))}
          {allLocations.length === 0 && <p className="text-neutral-400 text-center py-10">No locations found. Start by adding a City.</p>}
        </div>

      </div>
    </div>
  );
}

// Helper to color-code the types
function Badge({ type }: { type: string | null }) {
  let color = "bg-neutral-100 text-neutral-500";
  let label = type;

  switch(type) {
    case 'city': color = "bg-rose-100 text-rose-700"; label = "CITY"; break;
    case 'district': color = "bg-purple-100 text-purple-700"; label = "DISTRICT"; break;
    case 'main_area': color = "bg-blue-100 text-blue-700"; label = "MAIN AREA"; break;
    case 'area': color = "bg-emerald-100 text-emerald-700"; label = "AREA"; break;
    case 'sub_area': color = "bg-orange-100 text-orange-700"; label = "SUB AREA"; break;
  }

  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${color}`}>{label}</span>
}