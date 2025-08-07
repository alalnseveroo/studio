export default function ClientesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-lg bg-card p-4 shadow-sm sm:gap-6 sm:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Clientes</h1>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Você ainda não tem clientes
          </h3>
          <p className="text-sm text-muted-foreground">
            Comece a adicionar clientes para ver a lista aqui.
          </p>
        </div>
      </div>
    </div>
  )
}
