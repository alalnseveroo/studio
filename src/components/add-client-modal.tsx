
"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, CreditCard, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Proposta, Cliente } from "@/lib/types"
import { getProposals } from "@/lib/actions/propostas"

type OptionKey = "card1" | "card2" | null

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded: (newClient: Cliente) => void
}

export function AddClientModal({ isOpen, onClose, onClientAdded }: AddClientModalProps) {
  const [selected, setSelected] = React.useState<OptionKey>(null)
  const [proposals, setProposals] = React.useState<Proposta[]>([])

  // Card 1: tipo de documento
  const [docType, setDocType] = React.useState<string | undefined>(undefined)
  // Card 2: plano
  const [plano, setPlano] = React.useState<string | undefined>(undefined)

  const canContinue = (selected === "card1" && !!docType) || (selected === "card2" && !!plano)

  React.useEffect(() => {
    if (isOpen) {
        async function fetchProposalsData() {
            const { data } = await getProposals();
            if (data) {
                setProposals(data);
            }
        }
        fetchProposalsData();
        // Reset state when modal opens
        setSelected(null);
        setDocType(undefined);
        setPlano(undefined);
    }
  }, [isOpen]);

  const handleContinue = () => {
    // Aqui você adicionará a lógica para onde cada caminho leva.
    // Por exemplo:
    // if (selected === 'card1') {
    //   router.push('/dashboard/contratos/novo');
    // } else if (selected === 'card2') {
    //   router.push('/dashboard/cobrancas/nova');
    // }
    console.log("Continuar com:", { selected, docType, plano });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-white">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle className="text-lg">Escolha o fluxo</DialogTitle>
          <DialogDescription className="mt-1 text-sm">
            Selecione uma das opções abaixo para continuar seu processo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 p-6">
          <CardOption
            icon={<IconBadge variant="contract" />}
            title="Criar ou Renovar Contrato"
            description="Para gerar um documento: seja uma proposta para um novo cliente ou um aditivo de renovação para um cliente existente na sua base."
            checked={selected === "card1"}
            dimmed={selected === "card2"}
            onClick={() => setSelected("card1")}
          >
            <div
              className="mt-3 space-y-2"
              onClick={(e) => e.stopPropagation()}
              onPointerDownCapture={(e) => e.stopPropagation()}
            >
              <Label htmlFor="docType" className="text-xs text-muted-foreground">
                Tipo de Documento
              </Label>
              <Select value={docType} onValueChange={setDocType} disabled={selected !== 'card1'}>
                <SelectTrigger id="docType" className="w-full">
                  <SelectValue placeholder="Selecione o tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nova">Nova proposta/contrato</SelectItem>
                  <SelectItem value="renovacao">Renovação de contrato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardOption>

          <CardOption
            icon={<IconBadge variant="billing" />}
            title="Automatizar Cobrança Ativa"
            description="Para clientes que já têm um acordo definido e você quer configurar a cobrança automática imediatamente, sem gerar um novo documento."
            checked={selected === "card2"}
            dimmed={selected === "card1"}
            onClick={() => setSelected("card2")}
          >
            <div
              className="mt-3 space-y-2"
              onClick={(e) => e.stopPropagation()}
              onPointerDownCapture={(e) => e.stopPropagation()}
            >
              <Label htmlFor="plano" className="text-xs text-muted-foreground">
                Plano do Cliente
              </Label>
              <Select value={plano} onValueChange={setPlano} disabled={selected !== 'card2'}>
                <SelectTrigger id="plano" className="w-full">
                  <SelectValue placeholder="Selecione uma Proposta Pré-Definida" />
                </SelectTrigger>
                <SelectContent>
                  {proposals.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardOption>
        </div>

        <DialogFooter className="w-full flex flex-row items-center justify-between border-t px-6 py-4 gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            disabled={!canContinue}
            onClick={handleContinue}
            className="bg-emerald-600 text-white hover:bg-emerald-600/90"
          >
            Selecionar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CardOption({
  icon,
  title,
  description,
  checked,
  dimmed,
  onClick,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  dimmed?: boolean
  onClick?: () => void
  children?: React.ReactNode
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.()
        }
      }}
      aria-pressed={checked}
      className={cn(
        "group relative w-full rounded-2xl border bg-white p-5 md:p-6 text-left shadow-sm transition-all h-full",
        checked ? "border-emerald-500" : "border-gray-200",
        dimmed ? "opacity-75" : "hover:-translate-y-0.5 hover:shadow-md",
        "outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-emerald-500",
      )}
    >
      <div className="pointer-events-none absolute right-4 top-4">
        <AnimatedCheckbox checked={checked} ariaLabel={`Selecionar ${title}`} />
      </div>

      <div className="flex items-start gap-4">
        <div className="shrink-0 pt-0.5">{icon}</div>
        <div className="min-w-0 w-full">
          <h3 className="text-base font-semibold leading-snug">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

function IconBadge({ variant }: { variant: "contract" | "billing" }) {
  const Icon = variant === "contract" ? FileText : CreditCard
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm",
        "bg-gradient-to-br from-emerald-50 to-white border-emerald-100",
      )}
    >
      <Icon className="h-5 w-5 text-emerald-600" />
    </div>
  )
}

function AnimatedCheckbox({ checked, ariaLabel }: { checked: boolean; ariaLabel?: string }) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white",
        checked ? "border-emerald-600" : "border-gray-300",
        "transition-colors",
      )}
    >
      <AnimatePresence initial={false}>
        {checked && (
          <motion.span
            key="fill"
            className="absolute inset-0 m-[2px] rounded-full bg-emerald-600"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {checked && (
          <motion.span
            key="check"
            className="relative z-10 text-white"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut", delay: 0.06 }}
          >
            <Check className="h-3.5 w-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
