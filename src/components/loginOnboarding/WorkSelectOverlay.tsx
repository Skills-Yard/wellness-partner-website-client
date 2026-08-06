import React from "react";
import { ArrowLeft, Search } from "lucide-react";

interface WorkSelectOverlayProps {
  filteredProfessions: string[];
  profession: string;
  workSearch: string;
  setWorkSearch: (value: string) => void;
  setProfession: (value: string) => void;
  onClose: () => void;
}

export default function WorkSelectOverlay({
  filteredProfessions,
  profession,
  workSearch,
  setWorkSearch,
  setProfession,
  onClose,
}: WorkSelectOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <div className="flex items-center px-4 py-4 border-b border-stone-100">
        <button
          onClick={onClose}
          className="mr-3 p-1.5 hover:bg-stone-50 rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-stone-700" />
        </button>
        <h2 className="text-sm font-bold text-stone-800">Select Profession</h2>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-2.5 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
          <Search className="h-4 w-4 text-stone-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search profession"
            value={workSearch}
            onChange={(e) => setWorkSearch(e.target.value)}
            className="w-full text-sm outline-none text-stone-800 bg-transparent"
            autoFocus
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredProfessions.map((p, idx) => (
          <label
            key={idx}
            className="flex items-center justify-between py-3.5 border-b border-stone-100 cursor-pointer active:bg-stone-50"
          >
            <span className="text-sm text-stone-700">{p}</span>
            <div
              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                profession === p ? "border-amber-500" : "border-stone-300"
              }`}
            >
              {profession === p && <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />}
            </div>
            <input
              type="radio"
              name="profession"
              value={p}
              checked={profession === p}
              onChange={() => {
                setProfession(p);
                onClose();
              }}
              className="hidden"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
