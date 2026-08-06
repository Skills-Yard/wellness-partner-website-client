import React from "react";

interface EarningsPreviewStepProps {
  onNext: () => void;
}

export default function EarningsPreviewStep({ onNext }: EarningsPreviewStepProps) {
  return (
    <div
      className="flex flex-col flex-1 animate-in fade-in duration-300 overflow-y-auto"
      style={{ background: "linear-gradient(179.82deg, #FDF7F2 0.16%, #FFFFFF 121.94%)" }}
    >
      {/* Partner earnings grid image */}
      <div className="flex justify-center px-4 pt-5 pb-2">
        <img
          src="/images/wellness-partners.png"
          alt="Vellora Partners"
          className="w-full sm:w-[90%] rounded-2xl drop-shadow-md h-[300px]"
        />
      </div>

      {/* Money bag illustration */}
      <div className="flex justify-center pt-2 pb-1">
        <img
          src="/images/vellora-money-bag.png"
          alt="Vellora earnings illustration"
          className="w-36 h-25 object-contain"
        />
      </div>

      {/* Text block */}
      <div className="px-6 text-center flex-1 flex flex-col justify-center pb-2">
        <p className="text-xs text-stone-500 mb-1.5 font-medium tracking-wide">
          Before you move forward
        </p>
        <h2 className="text-[22px] font-extrabold text-stone-900 leading-tight mb-2">
          Know how much you<br />can earn with us
        </h2>
        <p className="text-sm text-stone-400">Real earnings from real partner like you</p>
      </div>

      {/* CTA button */}
      <div className="px-5 pb-10 pt-2 shrink-0">
        <button
          onClick={onNext}
          id="check-earnings-btn"
          className="w-full rounded-2xl py-4 font-bold text-base bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer transition-all active:scale-[0.98]"
        >
          Check your earnings
        </button>
      </div>
    </div>
  );
}
