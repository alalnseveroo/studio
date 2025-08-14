
"use client"

import { useState } from "react"
import { notFound, useParams } from "next/navigation"
import { assistentes } from "@/lib/assistants-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Star,
  MapPin,
  CheckCircle,
  Users,
  Clock,
  Award,
  Briefcase,
  MessageSquare,
  FileSpreadsheet,
  Calendar,
  Mail,
  Database,
  BarChart3,
  Globe,
  type LucideIcon,
} from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { PublicChatModal } from "@/components/public-chat-modal"

const iconMap: { [key: string]: LucideIcon } = {
  Calendar,
  FileSpreadsheet,
  Mail,
  Database,
  BarChart3,
  Globe,
  Briefcase,
};

export default function AssistantProfilePage() {
  const params = useParams()
  const { slug } = params
  const assistente = assistentes.find((a) => a.slug === slug)

  const [selectedAssistant, setSelectedAssistant] = useState<typeof assistentes[0] | null>(null);

  if (!assistente) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full bg-white overflow-hidden">
          <div className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <Badge
                className={`${
                  assistente.disponibilidade === "Disponível"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-orange-50 text-orange-700 border-orange-200"
                } font-medium`}
                variant="outline"
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    assistente.disponibilidade === "Disponível" ? "bg-green-500 animate-pulse" : "bg-orange-500 animate-pulse"
                  }`}
                />
                {assistente.disponibilidade}
              </Badge>
            </div>

            <Tabs defaultValue="overview" className="w-full mb-4">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="overview" className="text-xs">
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="services" className="text-xs">
                  Serviços
                </TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs">
                  Avaliações
                </TabsTrigger>
                <TabsTrigger value="credentials" className="text-xs">
                  Credenciais
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <div className="flex flex-col sm:flex-row items-start sm:space-x-6 mb-6">
                  <Avatar className="w-24 h-24 border-2 border-gray-100 mb-4 sm:mb-0">
                    <AvatarImage src={assistente.foto || "/placeholder.svg"} alt={assistente.nome} />
                    <AvatarFallback className="bg-black text-white font-semibold text-2xl">
                      {assistente.nome.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="font-bold text-black text-2xl">{assistente.nome}</h1>
                      {assistente.verificada && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                    <p className="text-gray-600 text-base mb-2">{assistente.titulo}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1.5" />
                      {assistente.localizacao}
                    </div>
                  </div>
                </div>

                <TabsContent value="overview" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Star className="w-5 h-5 text-yellow-500 mr-1" />
                        <span className="font-bold text-black text-lg">{assistente.avaliacaoMedia}</span>
                      </div>
                      <p className="text-sm text-gray-500">Avaliação</p>
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="w-5 h-5 text-blue-500 mr-1" />
                        <span className="font-bold text-black text-lg">{assistente.clientesAtendidos}</span>
                      </div>
                      <p className="text-sm text-gray-500">Clientes</p>
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Clock className="w-5 h-5 text-green-500 mr-1" />
                        <span className="font-bold text-black text-lg">{assistente.tempoResposta}</span>
                      </div>
                      <p className="text-sm text-gray-500">Resposta</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-base text-gray-700 leading-relaxed">{assistente.apresentacao}</p>
                    <div className="flex flex-wrap gap-2">
                      {assistente.especialidades.map((especialidade, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-sm border-black text-black bg-transparent hover:bg-black hover:text-white transition-colors"
                        >
                          {especialidade}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="services" className="space-y-6 mt-0">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-black flex items-center text-lg">
                      <Briefcase className="w-5 h-5 mr-2" />
                      Serviços Prestados
                    </h4>
                    <div className="space-y-2">
                      {assistente.servicos?.map((servico, index) => (
                        <div key={index} className="text-base text-gray-600 flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                          {servico}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-black text-lg">Ferramentas Utilizadas</h4>
                    <div className="flex flex-wrap gap-2">
                      {assistente.ferramentas?.map((ferramenta, index) => {
                        const IconComponent = iconMap[ferramenta.icone];
                        return (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-base border-gray-300 text-gray-700 bg-gray-50 flex items-center gap-2 py-1 px-3"
                          >
                            {IconComponent && <IconComponent className="w-4 h-4" />}
                            {ferramenta.nome}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    {assistente.depoimentos?.map((depoimento, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center mb-2">
                          <MessageSquare className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="font-semibold text-black text-base">{depoimento.cliente}</span>
                        </div>
                        <p className="text-base text-gray-600 italic">"{depoimento.texto}"</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="credentials" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-black mb-3 flex items-center text-lg">
                        <Award className="w-5 h-5 mr-2" />
                        Certificações e Qualificações
                      </h4>
                      <div className="space-y-2">
                        {assistente.certificacoes?.map((cert, index) => (
                          <div key={index} className="flex items-center text-base text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                            {cert}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <h4 className="font-semibold text-black mb-2">Experiência Consolidada</h4>
                      <div className="text-base">
                        <span className="text-gray-500">Total de horas dedicadas:</span>
                        <div className="font-bold text-black text-xl">{assistente.horasTrabalho}h</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <div className="pt-6 border-t">
            <Button 
              onClick={() => setSelectedAssistant(assistente)}
              size="lg"
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center text-base"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Iniciar uma Conversa
            </Button>
          </div>
        </div>

        <AnimatePresence>
            {selectedAssistant && (
                <PublicChatModal 
                    assistant={selectedAssistant}
                    onClose={() => setSelectedAssistant(null)}
                />
            )}
        </AnimatePresence>
      </main>
    </div>
  )
}
