import { Metadata } from 'next';
import { assistentes } from "@/lib/assistants-data";
import { AssistantList } from '@/components/assistant-list';


export const metadata: Metadata = {
  title: 'Encontre Assistentes Virtuais Especializadas | Crivo',
  description: 'Explore uma lista de assistentes virtuais profissionais e verificadas para ajudar a impulsionar seu negócio. Encontre especialistas em gestão, marketing, finanças e mais.',
  keywords: ['assistente virtual', 'gestão de agenda', 'suporte administrativo', 'marketing digital', 'assistente remota'],
};


export default function AssistantsMarketplacePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-black mb-3">Assistentes Virtuais</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Profissionais especializadas e verificadas para impulsionar seu negócio
            </p>
          </div>
        </div>
      </header>

      {/* Grid de Cards renderizado por um Componente de Cliente */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <AssistantList assistants={assistentes} />
      </main>
    </div>
  )
}
