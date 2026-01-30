"use client";

import { useState, useEffect, useId } from "react";
import { upload } from "@vercel/blob/client";
import { addImageAction, deleteImageAction, reorderImagesAction } from "@/actions/admin/image-actions";
import { useDropzone } from "react-dropzone";
import { DndContext, closestCenter, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor } from "@dnd-kit/core";
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Loader2, Trash2, GripVertical, ImagePlus } from "lucide-react";
import Image from "next/image";

// TİP TANIMLAMASI
type PropertyImage = {
  id: string;
  url: string;
  order: number | null;
  isMain: boolean | null;
};

export default function ImageManager({ 
  propertyId, 
  initialImages 
}: { 
  propertyId: number; 
  initialImages: PropertyImage[] 
}) {
  const [images, setImages] = useState(initialImages.sort((a, b) => (a.order || 0) - (b.order || 0)));
  const [uploading, setUploading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // HYDRATION ÇÖZÜMÜ 1: Mounted State
  const [mounted, setMounted] = useState(false);
  const dndContextId = useId(); // HYDRATION ÇÖZÜMÜ 2: Sabit ID

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor)
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    disabled: uploading,
    onDrop: async (acceptedFiles) => {
      setUploading(true);
      for (const file of acceptedFiles) {
        try {
          // BENZERSİZ İSİM ÇÖZÜMÜ: Timestamp + Rastgele Sayı + Dosya Adı
          // Örn: 1723456789-99-villa-havuz.jpg
          const uniqueName = `${Date.now()}-${Math.floor(Math.random() * 100)}-${file.name.replace(/\s+/g, '-')}`;

          const newBlob = await upload(uniqueName, file, {
            access: 'public',
            handleUploadUrl: '/api/upload',
          });

          await addImageAction(propertyId, newBlob.url);
          
          setImages(prev => [...prev, { id: "temp-" + Date.now(), url: newBlob.url, order: prev.length, isMain: false }]);

        } catch (err) {
          console.error("Yükleme başarısız:", err);
          alert("Resim yüklenirken hata oluştu.");
        }
      }
      setUploading(false);
      window.location.reload(); 
    }
  });

  const handleDelete = async (id: string, url: string) => {
    if(!confirm("Bu resmi silmek istediğine emin misin?")) return;
    setImages(images.filter(img => img.id !== id));
    await deleteImageAction(id, url, propertyId);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    // Eğer bir yere bırakılmadıysa veya aynı yerdeyse işlem yapma
    if (!over || active.id === over.id) return;

    // 1. Yeni sıralamayı mevcut 'images' state'i üzerinden hesapla
    const oldIndex = images.findIndex((i) => i.id === active.id);
    const newIndex = images.findIndex((i) => i.id === over.id);
    
    // arrayMove ile diziyi kaydır
    const reorderedList = arrayMove(images, oldIndex, newIndex);

    // 2. KRİTİK ADIM: Dizideki her elemanın 'order' ve 'isMain' bilgisini güncelle
    // Böylece 0. indexe gelen resim "order: 0" olur ve Kapak etiketi ona geçer.
    const updatedList = reorderedList.map((img, idx) => ({
      ...img,
      order: idx,      // Yeni sırasını ata
      isMain: idx === 0 // Sadece ilk sıradaki main olsun
    }));

    // 3. State'i Güncelle (Optimistik)
    // Artık callback içinde değil, doğrudan yeni listeyi veriyoruz.
    setImages(updatedList);

    // 4. Sunucuya Gönder (State güncellemesinin DIŞINDA)
    // Sadece ID ve yeni Order bilgisini gönderiyoruz
    const updates = updatedList.map(({ id, order }) => ({ id, order }));
    
    try {
      await reorderImagesAction(propertyId, updates);
    } catch (error) {
      console.error("Sıralama sunucuda güncellenemedi", error);
      // Hata olursa eski haline döndürmek için buraya logic eklenebilir
    }
  };

  return (
    <div className="space-y-6">
      {/* DROP AREA */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"}
          ${uploading ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="animate-spin text-neutral-400 mb-4" size={40} />
        ) : (
          <div className="bg-neutral-100 p-4 rounded-full mb-4 text-neutral-400">
             <ImagePlus size={32} />
          </div>
        )}
        <p className="font-bold text-neutral-600 text-lg">
          {uploading ? "Fotoğraflar Yükleniyor..." : "Fotoğrafları buraya sürükleyin"}
        </p>
        <p className="text-neutral-400 text-sm mt-1">veya seçmek için tıklayın</p>
      </div>

      {/* DND CONTEXT - Sadece Client tarafında render edilir (Hydration hatası biter) */}
      {mounted ? (
        <DndContext 
          id={dndContextId}
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragStart={(e) => setActiveId(e.active.id as string)} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img) => (
                <SortableImageItem key={img.id} image={img} onDelete={() => handleDelete(img.id, img.url)} />
              ))}
            </div>
          </SortableContext>
          
          <DragOverlay>
             {activeId ? <div className="w-full h-full bg-black/20 rounded-2xl" /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* Yüklenirken gösterilecek iskelet (Hydration sırasında burası görünür) */
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img) => (
            <div key={img.id} className="aspect-square bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}

function SortableImageItem({ image, onDelete }: { image: PropertyImage, onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative aspect-square bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
      <Image 
        src={image.url} 
        alt="Villa Photo" 
        fill 
        className="object-cover" 
        sizes="(max-width: 768px) 50vw, 20vw"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-start justify-between p-2 opacity-0 group-hover:opacity-100">
        <button {...attributes} {...listeners} className="bg-white/90 p-2 rounded-xl cursor-grab active:cursor-grabbing hover:bg-white shadow-sm text-neutral-600">
          <GripVertical size={16} />
        </button>
        <button onClick={onDelete} className="bg-white/90 p-2 rounded-xl hover:bg-red-50 hover:text-red-600 shadow-sm text-neutral-600 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
      {image.order === 0 && (
         <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">
            KAPAK
         </div>
      )}
    </div>
  );
}