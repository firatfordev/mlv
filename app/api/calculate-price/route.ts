import { NextResponse } from "next/server";
import { calculatePriceForRange } from "@/services/price-calculator"; // İlk adımda yazmıştık
import { db } from "@/db";
import { availability } from "@/db/schema";
import { and, eq, lte, gte, or } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = Number(searchParams.get("propertyId"));
  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");

  if (!propertyId || !startStr || !endStr) {
    return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
  }

  // 1. MÜSAİTLİK KONTROLÜ (Çifte Kontrol)
  // Seçilen aralıkta herhangi bir blokaj var mı?
  const conflict = await db.query.availability.findFirst({
    where: and(
      eq(availability.propertyId, propertyId),
      eq(availability.isBlocked, true),
      // Tarih aralıklarının kesişimi (Overlapping Logic)
      or(
        and(gte(availability.startDate, startStr), lte(availability.startDate, endStr)),
        and(gte(availability.endDate, startStr), lte(availability.endDate, endStr)),
        and(lte(availability.startDate, startStr), gte(availability.endDate, endStr))
      )
    )
  });

  if (conflict) {
    return NextResponse.json({ error: "Seçilen tarihler dolu." }, { status: 409 });
  }

  // 2. FİYAT HESAPLA
  const result = await calculatePriceForRange(
    propertyId, 
    new Date(startStr), 
    new Date(endStr)
  );

  if (!result) {
    return NextResponse.json({ error: "Bu tarihler için fiyat girilmemiş." }, { status: 404 });
  }

  return NextResponse.json(result);
}