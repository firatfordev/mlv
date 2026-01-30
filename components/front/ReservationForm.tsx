"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, User, Mail, Phone, FileText, MapPin, Users } from "lucide-react";
import { createBookingAction } from "@/actions/front/booking-actions";
import { useRouter } from "next/navigation";

type ReservationFormProps = {
  propertyId: number;
  startDate: string;
  endDate: string;
  maxGuests: number;
  priceData: any;
};

export default function ReservationForm({ propertyId, startDate, endDate, maxGuests, priceData }: ReservationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Kişi sayısını takip ediyoruz ki ona göre input açalım
  const [guestCount, setGuestCount] = useState(1);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    
    const result = await createBookingAction(formData, {
      propertyId,
      startDate,
      endDate,
      totalPrice: priceData.finalPrice,
      currency: priceData.currency,
      priceData: priceData
    });

    if (result.success) {
      router.push(`/checkout/${result.bookingId}`);
    } else {
      alert("Hata: " + result.error);
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-8">
      
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2 border-b pb-4">
          <User size={20} className="text-blue-600" /> Misafir Bilgileri
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* --- ANA MİSAFİR --- */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500 uppercase ml-1">İletişim Kurulacak Kişi</label>
            <input name="guest_name" required className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl outline-none focus:border-blue-500 font-bold text-neutral-800" placeholder="Ad Soyad" />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Kişi Sayısı</label>
            <div className="relative">
               <Users className="absolute left-3 top-3.5 text-neutral-400" size={18} />
               <select 
                name="guest_count" 
                className="w-full bg-neutral-50 border border-neutral-200 p-3 pl-10 rounded-xl outline-none focus:border-blue-500 appearance-none font-bold text-neutral-800" 
                required
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
              >
                {Array.from({ length: maxGuests }).map((_, i) => (
                  <option key={i} value={i + 1}>{i + 1} Misafir</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500 uppercase ml-1">E-Posta</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-neutral-400" size={18} />
              <input name="guest_email" type="email" required className="w-full bg-neutral-50 border border-neutral-200 p-3 pl-10 rounded-xl outline-none focus:border-blue-500" placeholder="ornek@email.com" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Telefon</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 text-neutral-400" size={18} />
              <input name="guest_phone" type="tel" required className="w-full bg-neutral-50 border border-neutral-200 p-3 pl-10 rounded-xl outline-none focus:border-blue-500" placeholder="0555 555 55 55" />
            </div>
          </div>
        </div>

        {/* --- DİNAMİK YAN MİSAFİRLER --- */}
        {guestCount > 1 && (
          <div className="mt-6 pt-6 border-t border-dashed border-neutral-200">
            <h4 className="text-sm font-bold text-neutral-700 mb-3 flex items-center gap-2">
               <Users size={16} /> Diğer Misafirler
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: guestCount - 1 }).map((_, i) => (
                <div key={i}>
                  <input 
                    name={`other_guest_${i}`} // Server Action'da bu isimle yakalayacağız
                    required 
                    className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl outline-none focus:border-blue-500 text-sm" 
                    placeholder={`${i + 2}. Misafir Adı Soyadı`} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 space-y-1">
            <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Adres (Fatura & Sözleşme İçin)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 text-neutral-400" size={18} />
              <textarea name="guest_address" required rows={2} className="w-full bg-neutral-50 border border-neutral-200 p-3 pl-10 rounded-xl outline-none focus:border-blue-500" placeholder="Tam adresiniz..." />
            </div>
        </div>
        
        <div className="mt-4 space-y-1">
           <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Notunuz (Opsiyonel)</label>
           <textarea name="guest_note" rows={2} className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl outline-none focus:border-blue-500" placeholder="Ev sahibine iletmek istedikleriniz..." />
        </div>
      </div>

      {/* SÖZLEŞMELER */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-blue-600" /> Sözleşmeler
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
            <input type="checkbox" name="terms" id="terms" required className="w-5 h-5 mt-0.5 accent-blue-600" />
            <label htmlFor="terms" className="text-sm text-neutral-700 cursor-pointer">
              <span className="font-bold">Genel Kurallar ve İptal Şartları</span>'nı okudum, onaylıyorum.
            </label>
          </div>
          <div className="flex items-start gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
            <input type="checkbox" name="contract" id="contract" required className="w-5 h-5 mt-0.5 accent-blue-600" />
            <label htmlFor="contract" className="text-sm text-neutral-700 cursor-pointer">
              <span className="text-blue-600 font-bold underline">Mesafeli Satış Sözleşmesi</span>'ni okudum ve onaylıyorum.
            </label>
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" /> : "ÖDEMEYE GEÇ"}
      </button>

    </form>
  );
}