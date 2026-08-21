"use client";

import React, { useRef, useState } from "react";
import { Loader2, RotateCcw, X, ZoomIn } from "lucide-react";

const VIEWPORT_SIZE = 280; // CSS px — the visible circular crop area
const OUTPUT_SIZE = 480; // px — the final square photo written to canvas
const MAX_ZOOM = 3;

interface ImageCropModalProps {
  file: File;
  onCancel: () => void;
  /** blob: what actually gets uploaded. previewUrl: a data URL for
   *  showing it instantly, without waiting on a round trip. */
  onCropped: (blob: Blob, previewUrl: string) => void;
}

/**
 * A plain canvas-based cropper — drag to pan, scroll or the slider to
 * zoom, no new dependency pulled in for this. Outputs a square JPEG (the
 * circular look everywhere in this app already comes from CSS
 * rounded-full + overflow-hidden on a square image, same as the initials
 * avatars, so there's no need for the file itself to be circular/have
 * transparency).
 */
export default function ImageCropModal({ file, onCancel, onCropped }: ImageCropModalProps) {
  const [imageUrl] = useState(() => URL.createObjectURL(file));
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  // Revoked explicitly at each real exit point below (cancel / after the
  // crop is drawn to canvas) instead of via a useEffect cleanup — a
  // cleanup keyed on this mount would also fire during React Strict
  // Mode's dev-only mount->cleanup->remount dance, revoking the URL out
  // from under the still-loading <img> and leaving nothing but this
  // modal's dark viewport background visible.
  const revoked = useRef(false);
  const revokeImage = () => {
    if (!revoked.current) {
      revoked.current = true;
      URL.revokeObjectURL(imageUrl);
    }
  };

  const handleCancel = () => {
    revokeImage();
    onCancel();
  };

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (img) setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  // "Cover" scaling — same idea as CSS object-fit: cover — so the circle is
  // always fully filled, then the user's zoom multiplies on top of that.
  const baseScale = naturalSize ? Math.max(VIEWPORT_SIZE / naturalSize.w, VIEWPORT_SIZE / naturalSize.h) : 1;
  const effectiveScale = baseScale * zoom;
  const displayW = naturalSize ? naturalSize.w * effectiveScale : VIEWPORT_SIZE;
  const displayH = naturalSize ? naturalSize.h * effectiveScale : VIEWPORT_SIZE;
  const left = (VIEWPORT_SIZE - displayW) / 2 + offset.x;
  const top = (VIEWPORT_SIZE - displayH) / 2 + offset.y;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.originX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.originY + (e.clientY - dragRef.current.startY),
    });
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom((prev) => Math.min(MAX_ZOOM, Math.max(1, prev - e.deltaY * 0.002)));
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirm = () => {
    if (!naturalSize || !imgRef.current) return;
    setProcessing(true);
    // Maps the visible circle back to source-image pixels: the viewport's
    // top-left, in the displayed image's own coordinate space, is
    // (-left, -top); dividing by effectiveScale converts that (and the
    // viewport's size) from displayed CSS px back to the original image's
    // pixel space.
    const srcX = -left / effectiveScale;
    const srcY = -top / effectiveScale;
    const srcSize = VIEWPORT_SIZE / effectiveScale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setProcessing(false);
      return;
    }
    ctx.drawImage(imgRef.current, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    canvas.toBlob(
      (blob) => {
        setProcessing(false);
        if (blob) onCropped(blob, canvas.toDataURL("image/jpeg", 0.9));
        // Safe now — the canvas already has the pixels it needs from the source image.
        revokeImage();
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <div className="fixed inset-0 z-100 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-extrabold text-stone-900">Adjust your photo</h2>
          <button onClick={handleCancel} className="p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer">
            <X className="h-4 w-4 text-stone-500" />
          </button>
        </div>

        <div
          className="relative mx-auto rounded-full overflow-hidden bg-stone-900 cursor-grab active:cursor-grabbing touch-none select-none"
          style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={handleWheel}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt=""
            onLoad={handleImageLoad}
            draggable={false}
            className="absolute pointer-events-none max-w-none"
            style={{ width: displayW, height: displayH, left, top }}
          />
        </div>
        <p className="text-center text-[11px] text-stone-400 mt-2">Drag to reposition, scroll to zoom</p>

        <div className="flex items-center gap-3 mt-4">
          <ZoomIn className="h-4 w-4 text-stone-400 shrink-0" />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#C9851A]"
          />
          <button
            onClick={handleReset}
            title="Reset"
            className="p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="h-4 w-4 text-stone-400" />
          </button>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!naturalSize || processing}
            className="flex-1 rounded-xl bg-[#C9851A] text-white py-2.5 text-sm font-bold hover:bg-[#B67714] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {processing && <Loader2 className="h-4 w-4 animate-spin" />}
            Use Photo
          </button>
        </div>
      </div>
    </div>
  );
}
