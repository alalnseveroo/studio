# Checklist de Verificação de Funcionalidades

Este checklist deve ser verificado manualmente antes de cada entrega de código para garantir que as funcionalidades essenciais do sistema não foram quebradas (regressão).

## ✅ Módulo de Autenticação e Perfil
- [ ] O usuário consegue inserir o e-mail na página inicial e ser redirecionado para `/verify-otp`?
- [ ] O sistema envia o e-mail com o código OTP de 6 dígitos?
- [ ] O usuário consegue fazer login com o OTP correto?
- [ ] O sistema redireciona para o `/dashboard` após o login bem-sucedido?
- [ ] O sistema impede o acesso a rotas do dashboard para usuários não logados?
- [ ] A página de "Configurações de Perfil" (`/dashboard/settings/profile`) carrega os dados do usuário, se existentes?
- [ ] O usuário consegue preencher todas as etapas do perfil e salvá-lo com sucesso?
- [ ] A assinatura desenhada é salva corretamente?

## ✅ Módulo de Clientes
- [ ] O usuário consegue abrir o modal "Adicionar Cliente" na página `/dashboard/clientes`?
- [ ] O formulário de criação de cliente (PF e PJ) valida os campos corretamente?
- [ ] Um novo cliente é criado e aparece na lista após o salvamento?
- [ ] Um e-mail de "Boas-vindas ao Portal" é enviado para o cliente após a criação?
- [ ] A lista de clientes em `/dashboard/clientes` exibe os dados corretamente, incluindo status e avatar?
- [ ] A página de detalhes do cliente (`/dashboard/clientes/[id]`) carrega todas as informações (Info, Endereço, Financeiro)?
- [ ] É possível editar e salvar cada aba (Info, Endereço, Financeiro) individualmente?
- [ ] A busca por CNPJ e CEP nos formulários funciona e preenche os campos?

## ✅ Módulo de Propostas
- [ ] O usuário consegue acessar a página para criar uma "Nova Proposta"?
- [ ] O formulário de criação de proposta valida e salva os dados corretamente?
- [ ] A proposta recém-criada aparece na lista em `/dashboard/propostas`?
- [ ] A página de detalhes da proposta (`/dashboard/propostas/[id]`) exibe todas as informações salvas?

## ✅ Módulo de Contratos
- [ ] O usuário consegue abrir o modal "Gerar Contrato" e selecionar um cliente e uma proposta?
- [ ] O contrato é gerado com o status "Rascunho" e aparece na lista?
- [ ] O texto do contrato gerado na página de detalhes (`/dashboard/contratos/[id]`) contém as informações corretas do cliente e da proposta?
- [ ] O **provedor** (usuário logado) consegue solicitar o OTP de assinatura e receber o e-mail?
- [ ] O **provedor** consegue assinar o contrato com o OTP correto? O status muda para "Aguardando Cliente"?
- [ ] Uma notificação por e-mail é enviada ao cliente quando o provedor assina?
- [ ] A página de assinatura do **cliente** (`/portal/[id]/contrato/[contractId]`) carrega o contrato para visualização com o layout correto?
- [ ] O **cliente** consegue desenhar a assinatura, solicitar o OTP e recebê-lo por e-mail?
- [ ] O **cliente** consegue assinar com o OTP correto? O status do contrato muda para "Finalizado"?
- [ ] O QR Code para pagamento da primeira parcela é exibido corretamente para o cliente após a assinatura?

## ✅ Módulo de Cobranças e Portal do Cliente
- [ ] A página de cobranças (`/dashboard/cobrancas`) exibe os dados das cobranças pendentes e pagas sem erros?
- [ ] O usuário consegue marcar uma cobrança como "paga" manualmente?
- [ ] O usuário consegue anexar um PDF de Nota Fiscal a uma cobrança?
- [ ] O Portal do Cliente (`/portal/[id]`) carrega as informações corretas do cliente, contratos e faturas?
- [ ] O cliente consegue visualizar as faturas no portal e clicar para pagar (gerando o QR Code)?
- [ ] O chat entre o provedor (no dashboard) e o cliente (no portal) funciona em tempo real?
