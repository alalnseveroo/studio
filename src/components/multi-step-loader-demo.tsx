"use client";
import React, { useState } from "react";
import { MultiStepLoader as Loader } from "@/components/ui/multi-step-loader";
import { XSquare } from "lucide-react";

const loadingStates = [
  {
    text: "Comprando um condomínio",
  },
  {
    text: "Viajando em um voo",
  },
  {
    text: "Encontrando Tyler Durden",
  },
  {
    text: "Ele faz sabão",
  },
  {
    text: "Nós vamos a um bar",
  },
  {
    text: "Começar uma briga",
  },
  {
    text: "Nós gostamos disso",
  },
  {
    text: "Bem-vindo ao F**** C***",
  },
];

export default function MultiStepLoaderDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="w-full h-screen flex items-end justify-end p-4">
      {/* Core Loader Modal */}
      <Loader loadingStates={loadingStates} loading={loading} duration={2000} />

      {/* The buttons are for demo only, remove it in your actual code ⬇️ */}
      <button
        onClick={() => setLoading(true)}
        className="bg-[#39C3EF] hover:bg-[#39C3EF]/90 text-black mx-auto text-sm md:text-base transition font-medium duration-200 h-10 rounded-lg px-8 flex items-center justify-center"
        style={{
          boxShadow:
            "0px -1px 0px 0px #ffffff40 inset, 0px 1px 0px 0px #ffffff40 inset",
        }}
      >
        Click to load
      </button>

      {loading && (
        <button
          className="fixed top-4 right-4 text-black dark:text-white z-[120]"
          onClick={() => setLoading(false)}
        >
          <XSquare className="h-10 w-10" />
        </button>
      )}
    </div>
  );
}