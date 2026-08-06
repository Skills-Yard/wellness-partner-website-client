import React from "react";

export function PhoneIconIllustration() {
  return (
    <div className="h-24 w-24 rounded-full bg-[#FDF3E7] flex items-center justify-center mb-6 shadow-sm">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 6C10 5.44772 10.4477 5 11 5H18.3923C18.9715 5 19.4706 5.39765 19.6056 5.96077L21.5056 14.4608C21.6248 14.9645 21.3869 15.484 20.9359 15.7241L17.1641 17.7241C19.3327 22.4895 23.5105 26.6673 28.2759 28.8359L30.2759 25.0641C30.516 24.6131 31.0355 24.3752 31.5392 24.4944L40.0392 26.3944C40.6023 26.5294 41 27.0285 41 27.6077V35C41 35.5523 40.5523 36 40 36H38C22.536 36 10 23.464 10 8V6Z"
          fill="#F5A623"
        />
        <path
          d="M10 6C10 5.44772 10.4477 5 11 5H18.3923C18.9715 5 19.4706 5.39765 19.6056 5.96077L21.5056 14.4608C21.6248 14.9645 21.3869 15.484 20.9359 15.7241L17.1641 17.7241C19.3327 22.4895 23.5105 26.6673 28.2759 28.8359L30.2759 25.0641C30.516 24.6131 31.0355 24.3752 31.5392 24.4944L40.0392 26.3944C40.6023 26.5294 41 27.0285 41 27.6077V35C41 35.5523 40.5523 36 40 36H38C22.536 36 10 23.464 10 8V6Z"
          stroke="#D4891E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function OtpIconIllustration() {
  return (
    <div className="h-24 w-24 rounded-full bg-[#FDF3E7] flex items-center justify-center mb-6 shadow-sm">
      <div className="relative">
        <svg
          width="34"
          height="44"
          viewBox="0 0 34 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="1.5"
            y="1.5"
            width="31"
            height="41"
            rx="5"
            fill="white"
            stroke="#CCCCCC"
            strokeWidth="1.5"
          />
          <rect x="13" y="37" width="8" height="2.5" rx="1.25" fill="#CCCCCC" />
          <rect x="10" y="7" width="14" height="20" rx="2" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="1" />
        </svg>
        <div className="absolute -top-3 -right-5">
          <div className="bg-amber-400 rounded-xl px-2.5 py-1.5 shadow-md">
            <div className="flex gap-0.5 items-center">
              <div className="h-1 w-1 rounded-full bg-white" />
              <div className="h-1 w-1 rounded-full bg-white" />
              <div className="h-1 w-1 rounded-full bg-white" />
            </div>
          </div>
          <div
            className="ml-2 w-0 h-0"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "6px solid #FBBF24",
            }}
          />
        </div>
      </div>
    </div>
  );
}
