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
              "s-path", // Alterado para s-path para clareza
              isAnimating && "s-path--animating"
            )}
            d="M30 12.5C30 8.35786 26.6421 5 22.5 5C17.201 5 12.5 9.47715 12.5 15C12.5 20.5228 17.201 25 22.5 25C26.6421 25 30 28.3579 30 32.5"
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
