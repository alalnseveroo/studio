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

const assistentes = [
  {
    id: 1,
    nome: "Ana Carolina Silva",
    titulo: "Especialista em Gestão Médica",
    foto: "/placeholder.svg?height=80&width=80",
    localizacao: "São Paulo, SP",
    disponibilidade: "Disponível",
    avaliacaoMedia: 4.9,
    clientesAtendidos: 47,
    horasTrabalho: 1240,
    especialidades: ["Gestão de Agenda", "Faturamento Médico", "Atendimento ao Paciente"],
    verificada: true,
    tempoResposta: "2h",
    apresentacao:
      "Especialista em gestão médica com 5+ anos de experiência. Transformo consultórios em operações eficientes e organizadas.",
    servicos: [
      "Gestão de agenda médica",
      "Faturamento e cobrança",
      "Atendimento ao paciente",
      "Relatórios gerenciais",
      "Controle de estoque médico",
    ],
    ferramentas: [
      { nome: "Google Agenda", icone: Calendar },
      { nome: "Excel", icone: FileSpreadsheet },
      { nome: "Gmail", icone: Mail },
      { nome: "Sistema Médico", icone: Database },
    ],
    depoimentos: [
      { cliente: "Dr. Carlos Mendes", texto: "Ana revolucionou meu consultório. Organização impecável!" },
      { cliente: "Dra. Maria Santos", texto: "Profissional excepcional, recomendo sem hesitar." },
    ],
    certificacoes: ["Gestão em Saúde - FGV", "Atendimento ao Cliente - Sebrae", "Excel Avançado - Microsoft"],
  },
  {
    id: 2,
    nome: "Mariana Santos",
    titulo: "E-commerce & Marketing Digital",
    foto: "/placeholder.svg?height=80&width=80",
    localizacao: "Rio de Janeiro, RJ",
    disponibilidade: "Vagas Limitadas",
    avaliacaoMedia: 4.8,
    clientesAtendidos: 32,
    horasTrabalho: 980,
    especialidades: ["Marketing Digital", "Redes Sociais", "E-commerce"],
    verificada: true,
    tempoResposta: "1h",
    apresentacao:
      "Especialista em e-commerce e marketing digital. Ajudo empresas a crescerem online com estratégias eficazes.",
    servicos: [
      "Gestão de redes sociais",
      "Criação de campanhas publicitárias",
      "Otimização de e-commerce",
      "Análise de métricas",
      "Criação de conteúdo",
    ],
    ferramentas: [
      { nome: "Google Analytics", icone: BarChart3 },
      { nome: "Facebook Ads", icone: Globe },
      { nome: "Planilhas", icone: FileSpreadsheet },
      { nome: "Canva", icone: Briefcase },
    ],
    depoimentos: [
      { cliente: "João Silva", texto: "Mariana aumentou nossas vendas em 150% em 6 meses!" },
      { cliente: "Loja Fashion", texto: "Profissional incrível, resultados surpreendentes." },
    ],
    certificacoes: ["Google Ads Certified", "Facebook Blueprint", "E-commerce Specialist"],
  },
  {
    id: 3,
    nome: "Juliana Oliveira",
    titulo: "Gestão Administrativa & Financeira",
    foto: "/placeholder.svg?height=80&width=80",
    localizacao: "Belo Horizonte, MG",
    disponibilidade: "Disponível",
    avaliacaoMedia: 5.0,
    clientesAtendidos: 28,
    horasTrabalho: 850,
    especialidades: ["Gestão Financeira", "Controle de Estoque", "Relatórios"],
    verificada: true,
    tempoResposta: "3h",
    apresentacao:
      "Experienciada em gestão administrativa e financeira. Auxilio na otimização de processos e aumento de produtividade.",
    servicos: [
      "Gestão financeira",
      "Controle de estoque",
      "Relatórios gerenciais",
      "Planejamento estratégico",
      "Análise de dados",
    ],
    ferramentas: [
      { nome: "Excel", icone: FileSpreadsheet },
      { nome: "Google Sheets", icone: Database },
      { nome: "Outlook", icone: Mail },
      { nome: "ERP", icone: Briefcase },
    ],
    depoimentos: [
      {
        cliente: "Empresa XYZ",
        texto: "Juliana é uma verdadeira especialista. Nosso fluxo financeiro ficou muito mais eficiente!",
      },
      { cliente: "Departamento Financeiro", texto: "Profissional confiável e dedicada." },
    ],
    certificacoes: [
      "Certificado em Gestão Financeira - IFMG",
      "Contabilidade Digital - Sebrae",
      "Excel Profissional - Microsoft",
    ],
  },
  {
    id: 4,
    nome: "Camila Rodriguez",
    titulo: "Assistente Jurídica & Compliance",
    foto: "/placeholder.svg?height=80&width=80",
    localizacao: "Curitiba, PR",
    disponibilidade: "Disponível",
    avaliacaoMedia: 4.9,
    clientesAtendidos: 19,
    horasTrabalho: 720,
    especialidades: ["Processos Jurídicos", "Compliance", "Documentação"],
    verificada: true,
    tempoResposta: "4h",
    apresentacao:
      "Assistente jurídica especializada em compliance e processos legais. Garanto segurança e conformidade para seus negócios.",
    servicos: ["Assistência jurídica", "Compliance", "Documentação", "Análise de riscos", "Regulamentações"],
    ferramentas: [
      { nome: "Word", icone: FileSpreadsheet },
      { nome: "Outlook", icone: Mail },
      { nome: "Sistema Jurídico", icone: Database },
      { nome: "Google Docs", icone: Briefcase },
    ],
    depoimentos: [
      { cliente: "Advogado João", texto: "Camila é uma mão na roda. Nosso compliance ficou muito mais robusto!" },
      { cliente: "Departamento Jurídico", texto: "Profissional altamente competente e confiável." },
    ],
    certificacoes: ["Advogado - UFPR", "Compliance em Negócios - FGV", "Direito Empresarial - UNICAMP"],
  },
  {
    id: 5,
    nome: "Fernanda Costa",
    titulo: "Recursos Humanos & Recrutamento",
    foto: "/placeholder.svg?height=80&width=80",
    localizacao: "Porto Alegre, RS",
    disponibilidade: "Vagas Limitadas",
    avaliacaoMedia: 4.7,
    clientesAtendidos: 35,
    horasTrabalho: 1100,
    especialidades: ["Recrutamento", "Gestão de Pessoas", "Treinamentos"],
    verificada: true,
    tempoResposta: "2h",
    apresentacao: "Especializada em recursos humanos e recrutamento. Auxilio na contratação e gestão de talentos.",
    servicos: ["Recrutamento", "Gestão de pessoas", "Treinamentos", "Análise de desempenho", "Planejamento de RH"],
    ferramentas: [
      { nome: "LinkedIn", icone: Globe },
      { nome: "Excel", icone: FileSpreadsheet },
      { nome: "Google Forms", icone: Briefcase },
      { nome: "Sistema RH", icone: Database },
    ],
    depoimentos: [
      {
        cliente: "HR Manager",
        texto: "Fernanda é incrível. Nosso processo de recrutamento ficou muito mais eficiente!",
      },
      { cliente: "Departamento de RH", texto: "Profissional dedicada e altamente competente." },
    ],
    certificacoes: ["Certificado em RH - UFRGS", "Recrutamento e Seleção - Sebrae", "Excel Avançado - Microsoft"],
  },
  {
    id: 6,
    nome: "Beatriz Almeida",
    titulo: "Consultórios Odontológicos",
    foto: "/placeholder.svg?height=80&width=80",
    localizacao: "Brasília, DF",
    disponibilidade: "Disponível",
    avaliacaoMedia: 4.8,
    clientesAtendidos: 23,
    horasTrabalho: 690,
    especialidades: ["Agendamento", "Gestão de Tratamentos", "Pacientes"],
    verificada: true,
    tempoResposta: "1h",
    apresentacao:
      "Assistente especializada em consultórios odontológicos. Auxilio na gestão eficiente e organizada de clínicas.",
    servicos: [
      "Agendamento odontológico",
      "Gestão de tratamentos",
      "Atendimento ao paciente",
      "Relatórios",
      "Controle de estoque odontológico",
    ],
    ferramentas: [
      { nome: "Google Agenda", icone: Calendar },
      { nome: "Excel", icone: FileSpreadsheet },
      { nome: "Gmail", icone: Mail },
      { nome: "Sistema Odontológico", icone: Database },
    ],
    depoimentos: [
      {
        cliente: "Dentista Carlos",
        texto: "Beatriz é uma profissional excelente. Nosso consultório ficou muito mais organizado!",
      },
      { cliente: "Clínica Odontológica", texto: "Profissional confiável e dedicada." },
    ],
    certificacoes: [
      "Gestão em Odontologia - UNB",
      "Atendimento ao Paciente - Sebrae",
      "Excel Profissional - Microsoft",
    ],
  },
]

export default function HomePage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

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
                <Button className="w-full bg-gray-100 hover:bg-gray-200 text-black font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center text-sm border border-gray-200">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Abrir conversa
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
