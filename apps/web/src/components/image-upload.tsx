"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { errMsg, ghostBtn } from "@/components/campus-ui";

const MAX_SIDE = 1800;

/** Shrinks big photos in the browser (keeps them well under the server's 2.5 MB cap) and returns a base64 string. */
async function prepare(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) throw new Error("Choose a PNG, JPG, WEBP or GIF image.");
  const asDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("Could not read the file."));
      r.readAsDataURL(blob);
    });
  if (file.type === "image/gif" || file.size < 600 * 1024) return asDataUrl(file);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.85));
  if (!blob) return asDataUrl(file);
  return asDataUrl(blob);
}

/** "Upload image" button: sends the picture to the API and hands back its public URL. */
export function ImageUploadButton({ onUploaded, label = "Upload image" }: { onUploaded: (url: string) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const data = await prepare(file);
      const r = await api.post<{ url: string }>("/media", { data });
      onUploaded(r.url);
    } catch (e) {
      setError(e instanceof Error && !(e as any).status ? e.message : errMsg(e, "Upload failed"));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" className={ghostBtn} disabled={busy} onClick={() => input.current?.click()}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} {busy ? "Uploading…" : label}
      </button>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
