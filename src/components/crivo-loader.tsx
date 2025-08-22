"use client";

import { cn } from "@/lib/utils";

interface CrivoLoaderProps {
  isAnimating: boolean;
}

export function CrivoLoader({ isAnimating }: CrivoLoaderProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative flex size-16 items-center justify-center rounded-full bg-black">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
           <path
            className={cn(
              "c-path",
              isAnimating && "c-path--animating"
            )}
            d="M29.9998 13.7502C29.9998 11.2374 28.9463 8.82903 27.0709 7.07107C25.1955 5.31311 22.652 4.375 19.9998 4.375C14.1778 4.375 9.9998 8.95202 9.9998 15V25C9.9998 30.078 14.1778 35.625 19.9998 35.625C22.652 35.625 25.1955 34.6869 27.0709 32.9289C28.9463 31.171 29.9998 28.7626 29.9998 26.25"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
