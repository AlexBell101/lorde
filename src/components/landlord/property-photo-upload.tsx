"use client";

import { useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

interface PropertyPhotoUploadProps {
  propertyId: string;
  initialPhotos?: string[];
  onChange: (photos: string[]) => void;
}

export function PropertyPhotoUpload({
  propertyId,
  initialPhotos = [],
  onChange,
}: PropertyPhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function processFiles(files: File[]) {
    if (!files.length) return;

    const validFiles = files.filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast({ title: `${f.name} is not an image`, variant: "destructive" });
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast({ title: `${f.name} exceeds 10 MB`, variant: "destructive" });
        return false;
      }
      return true;
    });

    if (!validFiles.length) return;

    setUploading(true);
    const supabase = createClient();
    const newUrls: string[] = [];

    for (const file of validFiles) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("property-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) {
        toast({
          title: `Failed to upload ${file.name}`,
          description: error.message,
          variant: "destructive",
        });
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("property-photos")
        .getPublicUrl(path);

      newUrls.push(publicUrl);
    }

    const updated = [...photos, ...newUrls];
    setPhotos(updated);
    onChange(updated);
    setUploading(false);

    if (newUrls.length) {
      toast({
        title: `${newUrls.length} photo${newUrls.length > 1 ? "s" : ""} uploaded`,
        variant: "success",
      });
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    processFiles(Array.from(e.target.files ?? []));
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  }

  function removePhoto(index: number) {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    onChange(updated);
  }

  function movePhoto(from: number, to: number) {
    const updated = [...photos];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setPhotos(updated);
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-primary/5",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Uploading photos…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="w-6 h-6" />
            <span className="text-sm font-medium">Drop photos here or click to upload</span>
            <span className="text-xs">JPG, PNG, WEBP · Up to 10 MB each · Multiple allowed</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div
              key={url}
              className="relative group aspect-video rounded-lg overflow-hidden bg-muted border border-border"
            >
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Cover badge */}
              {i === 0 && (
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white font-medium">
                  Cover
                </div>
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                <X className="w-3 h-3" />
              </button>
              {/* Move left */}
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => movePhoto(i, i - 1)}
                  className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 text-[10px] font-bold"
                  title="Move left (set as cover)"
                >
                  ←
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="w-3.5 h-3.5 shrink-0" />
          <span>Photos are attached to the property and shown on all its listings. The first photo is the cover.</span>
        </div>
      )}

      {photos.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {photos.length} photo{photos.length !== 1 ? "s" : ""} · First photo is the cover · Hover a photo to reorder or remove
        </p>
      )}
    </div>
  );
}
