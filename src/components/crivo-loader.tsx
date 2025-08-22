"use client";

interface CrivoLoaderProps {
  isAnimating: boolean;
}

export function CrivoLoader({ isAnimating }: CrivoLoaderProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm">
        <div className={`text-3xl font-bold text-primary ${isAnimating ? 'animate-pulse' : ''}`}>
          C
        </div>
      </div>
    </div>
  );
}
