"use client";
import React, { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(true);

  // Garante que o loader seja exibido por tempo suficiente para a animação.
  useEffect(() => {
    const timer = setTimeout(() => {
        // Você pode ajustar a duração mínima aqui se necessário
    }, 2000); // Duração mínima de 2 segundos

    return () => clearTimeout(timer);
  }, []);


  return (
    <div className="w-full h-screen flex items-end justify-end p-4">
      {/* Core Loader Modal */}
      <Loader loadingStates={loadingStates} loading={loading} duration={2000} />
    </div>
  );
}
