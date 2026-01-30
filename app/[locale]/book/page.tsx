import { calculatePriceForRange } from "@/services/price-calculator";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import BookingPageClient from "@/components/front/BookingPageClient"; // <-- YENİ IMPORT

export default async function BookPage({ searchParams }: { searchParams: Promise<{ propertyId: string, start: string, end: string }> }) {
  const { propertyId, start, end } = await searchParams;

  if (!propertyId || !start || !end) redirect("/");

  // 1. VİLLAYI ÇEK
  const villa = await db.query.properties.findFirst({
    where: eq(properties.id, Number(propertyId)),
    with: {
      location: true,
      images: {
        limit: 1,
        orderBy: (t, { asc }) => [asc(t.order)]
      }
    }
  });

  if (!villa) notFound();

  // 2. BAŞLANGIÇ FİYATINI HESAPLA (Kuponsuz)
  const initialPriceData = await calculatePriceForRange(Number(propertyId), new Date(start), new Date(end));
  
  if (!initialPriceData) return <div className="p-10 text-center">Fiyat hesaplanamadı.</div>;

  return (
    <div className="bg-neutral-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl font-black text-neutral-900 mb-8 flex items-center gap-3">
          <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">1</span>
          Rezervasyon İsteği
        </h1>

        {/* Client Component'e verileri devrediyoruz */}
        <BookingPageClient 
          villa={villa}
          initialPriceData={initialPriceData}
          startDate={start}
          endDate={end}
        />
      </div>
    </div>
  );
}