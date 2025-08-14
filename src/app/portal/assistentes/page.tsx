
"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
} from "lucide-react"
import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { PublicChatModal } from "@/components/public-chat-modal"
import { assistentes } from "@/lib/assistants-data"
import Link from 'next/link'

export default function HomePage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<typeof assistentes[0] | null>(null);

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

      {/* Cards Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {assistentes.map((assistente) => (
            <Card
              key={assistente.id}
              className={`group hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white overflow-hidden h-fit ${
                hoveredCard !== null && hoveredCard !== assistente.id ? "blur-sm opacity-50" : ""
              }`}
              onMouseEnter={() => setHoveredCard(assistente.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="pb-4">
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
                        assistente.disponibilidade === "Disponível"
                          ? "bg-green-500 animate-pulse"
                          : "bg-orange-500 animate-pulse"
                      }`}
                    />
                    {assistente.disponibilidade}
                  </Badge>
                  <Button variant="link" size="sm" asChild>
                    <Link href={`/assistente/${assistente.slug}`}>Ver Perfil</Link>
                  </Button>
                </div>

                <Tabs defaultValue="overview" className="w-full mb-4">
                  <TabsList className="grid w-full grid-cols-4">
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

                  <div className="mt-4">
                    <div className="flex items-start space-x-4 mb-4">
                      <Avatar className="w-16 h-16 border-2 border-gray-100">
                        <AvatarImage src={assistente.foto || "/placeholder.svg"} alt={assistente.nome} />
                        <AvatarFallback className="bg-black text-white font-semibold">
                          {assistente.nome
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-black text-lg">{assistente.nome}</h3>
                          {assistente.verificada && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{assistente.titulo}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="w-3 h-3 mr-1" />
                          {assistente.localizacao}
                        </div>
                      </div>
                    </div>

                    <TabsContent value="overview" className="space-y-4 mt-0">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="font-bold text-black">{assistente.avaliacaoMedia}</span>
                          </div>
                          <p className="text-xs text-gray-500">Avaliação</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Users className="w-4 h-4 text-blue-500 mr-1" />
                            <span className="font-bold text-black">{assistente.clientesAtendidos}</span>
                          </div>
                          <p className="text-xs text-gray-500">Clientes</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Clock className="w-4 h-4 text-green-500 mr-1" />
                            <span className="font-bold text-black">{assistente.tempoResposta}</span>
                          </div>
                          <p className="text-xs text-gray-500">Resposta</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm text-gray-700">{assistente.apresentacao}</p>
                        <div className="flex flex-wrap gap-2">
                          {assistente.especialidades.map((especialidade, index) => (
                            /* Tags pretas com borda preta e fundo transparente */
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs border-black text-black bg-transparent hover:bg-black hover:text-white transition-colors"
                            >
                              {especialidade}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="services" className="space-y-4 mt-0">
                      <div className="space-y-3">
                        <h4 className="font-medium text-black flex items-center">
                          <Briefcase className="w-4 h-4 mr-2" />
                          Serviços Prestados
                        </h4>
                        <div className="space-y-2">
                          {assistente.servicos?.map((servico, index) => (
                            <div key={index} className="text-sm text-gray-600 flex items-center">
                              <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                              {servico}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-black">Ferramentas Utilizadas</h4>
                        <div className="flex flex-wrap gap-2">
                          {assistente.ferramentas?.map((ferramenta, index) => {
                            const IconComponent = ferramenta.icone
                            return (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs border-gray-300 text-gray-700 bg-gray-50 flex items-center gap-1"
                              >
                                <IconComponent className="w-3 h-3" />
                                {ferramenta.nome}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="reviews" className="space-y-4 mt-0">
                      <div className="space-y-3">
                        {assistente.depoimentos?.map((depoimento, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center mb-2">
                              <MessageSquare className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="font-medium text-black text-sm">{depoimento.cliente}</span>
                            </div>
                            <p className="text-sm text-gray-600 italic">"{depoimento.texto}"</p>
                          </div>
                        ))}
                      </div>

                      <div className="text-center">
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="font-bold text-green-700 text-2xl">{assistente.avaliacaoMedia}</div>
                          <div className="text-sm text-green-600">Nota Média das Avaliações</div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="credentials" className="space-y-4 mt-0">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-black mb-2 flex items-center">
                            <Award className="w-4 h-4 mr-2" />
                            Certificações
                          </h4>
                          <div className="space-y-2">
                            {assistente.certificacoes?.map((cert, index) => (
                              <div key={index} className="flex items-center text-sm text-gray-600">
                                <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                                {cert}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="font-medium text-black mb-2">Experiência</h4>
                          <div className="text-sm">
                            <span className="text-gray-500">Horas trabalhadas:</span>
                            <div className="font-semibold text-black">{assistente.horasTrabalho}h</div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardHeader>

              <CardContent className="pt-0">
                <Button 
                  onClick={() => setSelectedAssistant(assistente)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-black font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center text-sm border border-gray-200"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Abrir conversa
                </Button>
              </CardContent>
            </Card>
          ))}
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
