"use server";

import { db } from "@/db";
import { bookings } from "@/db/schema";
import { calculatePriceForRange } from "@/services/price-calculator"; 

// --- NEW: Price Calculation Action (Replaces API Route) ---
export async function calculatePriceAction(
  propertyId: number, 
  startDateStr: string, 
  endDateStr: string
) {
  try {
    // Convert strings back to Date objects for the calculator
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    const data = await calculatePriceForRange(propertyId, start, end);

    if (!data) {
      return { success: false, error: "Fiyat hesaplanamadı (Müsaitlik veya fiyat eksik)." };
    }

    return { success: true, data };

  } catch (error) {
    console.error("Calculation Error:", error);
    return { success: false, error: "Hesaplama servisinde hata." };
  }
}

// --- EXISTING: Coupon Action ---
export async function applyCouponAction(
  propertyId: number, 
  startDate: string, 
  endDate: string, 
  code: string
) {
  try {
    const newPriceData = await calculatePriceForRange(
      propertyId, 
      new Date(startDate), 
      new Date(endDate),
      code 
    );

    if (!newPriceData) {
      return { success: false, error: "Fiyat hesaplanamadı." };
    }
    
    return { success: true, priceData: newPriceData };

  } catch (error) {
    console.error("Coupon Error:", error);
    return { success: false, error: "Kupon uygulanamadı." };
  }
}

// --- EXISTING: Create Booking ---
export async function createBookingAction(formData: FormData, context: any) {
  try {
    const getStr = (key: string) => formData.get(key) as string;
    const getNum = (key: string) => Number(formData.get(key));

    const guestCount = getNum("guest_count");
    const otherGuestsList = [];

    for (let i = 0; i < guestCount - 1; i++) {
      const name = formData.get(`other_guest_${i}`);
      if (name) {
        otherGuestsList.push({ name: name.toString() });
      }
    }

    const [newBooking] = await db.insert(bookings).values({
      propertyId: context.propertyId,
      guestName: getStr("guest_name"),
      guestEmail: getStr("guest_email"),
      guestPhone: getStr("guest_phone"),
      guestAddress: getStr("guest_address"),
      guestCount: guestCount,
      guestNote: getStr("guest_note"),
      otherGuests: otherGuestsList, 
      startDate: context.startDate,
      endDate: context.endDate,
      totalPrice: context.totalPrice.toString(),
      currency: context.currency,
      priceDetails: {
        base_price: context.priceData.basePrice,
        cleaning_fee: context.priceData.cleaningFee,
        deposit_fee: context.priceData.depositFee,
        applied_promotions: context.priceData.appliedPromotions || [],
        duration: context.priceData.duration
      },
      isTermsAccepted: formData.get("terms") === "on",
      isContractAccepted: formData.get("contract") === "on",
      contractVersion: "v1.0",
      status: "pending_payment",
      createdAt: new Date(),
    }).returning({ id: bookings.id });

    return { success: true, bookingId: newBooking.id };

  } catch (error) {
    console.error("Booking Create Error:", error);
    return { success: false, error: "Rezervasyon oluşturulamadı." };
  }
}