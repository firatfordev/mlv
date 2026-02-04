import { db } from "@/db";
import { locations } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

type VillaBreadcrumbProps = {
  locationId: number;
  villaTitle: any; // JSONB
};

// Helper to fetch the full hierarchy (Child -> Parent -> Grandparent)
async function getLocationHierarchy(startId: number) {
  const hierarchy = [];
  let currentId: number | null = startId;

  // Loop until we hit the top (max 5 levels to be safe)
  while (currentId) {
    const loc = await db.query.locations.findFirst({
      where: eq(locations.id, currentId),
    });

    if (!loc) break;
    hierarchy.unshift(loc); // Add to start of array (so it becomes Parent -> Child)
    currentId = loc.parentId;
  }
  
  return hierarchy;
}

export default async function VillaBreadcrumb({ locationId, villaTitle }: VillaBreadcrumbProps) {
  const path = await getLocationHierarchy(locationId);
  
  // Helper for Localization (Simple version)
  const getLoc = (val: any) => {
    // In a real server component, you might pass 'locale' prop or use a hook if it was client side.
    // For now, we default to TR or check if it's an object.
    return (typeof val === 'object' && val?.tr) ? val.tr : val;
  };

  return (
    <nav className="flex items-center text-xs md:text-sm text-neutral-500 font-medium mb-4 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
      
      {/* 1. HOME LINK */}
      <Link href="/" className="hover:text-rose-600 transition-colors flex items-center gap-1">
        <Home size={14} className="mb-0.5" />
        <span className="hidden md:inline">Anasayfa</span>
      </Link>

      <ChevronRight size={14} className="mx-2 text-neutral-300 shrink-0" />

      {/* 2. DYNAMIC LOCATION PATH */}
      {path.map((loc, index) => (
        <div key={loc.id} className="flex items-center">
          <Link 
            // In real app, this link goes to search filtered by this location
            href={`/search?location=${loc.slug}`} 
            className="hover:text-rose-600 transition-colors"
          >
            {getLoc(loc.name)}
          </Link>
          
          {/* Show separator unless it's the last location item AND there is no villa title coming */}
          <ChevronRight size={14} className="mx-2 text-neutral-300 shrink-0" />
        </div>
      ))}

      {/* 3. CURRENT VILLA (Not clickable) */}
      <span className="text-neutral-900 font-bold truncate max-w-[150px] md:max-w-none">
        {getLoc(villaTitle)}
      </span>

    </nav>
  );
}