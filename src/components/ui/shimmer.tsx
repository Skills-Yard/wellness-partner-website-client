import React from "react";

/**
 * A skeleton block with a light sweeping highlight, rather than a flat
 * animate-pulse — pass sizing/shape via className (e.g. "h-4 w-24
 * rounded-full"). The sweep is one shared `animate-shimmer` keyframe
 * (globals.css), just a translateX, so many of these on screen at once
 * stays cheap.
 */
export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}
