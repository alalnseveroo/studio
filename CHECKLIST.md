# Checklist de Verificação de Funcionalidades

Este checklist deve ser verificado manualmente antes de cada entrega de código para garantir que as funcionalidades essenciais do sistema não foram quebradas (regressão).

## ✅ Módulo de Autenticação e Perfil
- [ ] O usuário consegue fazer login com e-mail e OTP?
- [ ] O sistema redireciona corretamente para o dashboard após o login?
- [ ] A página de "Configurações de Perfil" carrega e salva as informações corretamente?

## ✅ Módulo de Clientes
- [ ] O usuário consegue criar um novo cliente?
- [ ] A lista de clientes é exibida corretamente na página `/dashboard/clientes`?
- [ ] É possível navegar para a página de detalhes de um cliente e editar suas informações?

## ✅ Módulo de Propostas
- [ ] O usuário consegue criar um novo modelo de proposta?
- [ ] As propostas existentes são listadas corretamente?

## ✅ Módulo de Contratos
- [ ] O usuário consegue gerar um novo contrato para um cliente usando uma proposta?
- [ ] A lista de contratos é exibida corretamente?
- [ ] A página de assinatura do **provedor** (usuário logado) carrega e permite a assinatura?
- [ ] A página de assinatura do **cliente** (no portal) carrega o contrato para visualização e permite o fluxo de assinatura?

## ✅ Módulo de Cobranças e Portal do Cliente
- [ ] A página de cobranças exibe os dados sem erros?
- [ ] O Portal do Cliente (`/portal/[id]`) carrega as informações do cliente, contratos e cobranças corretamente?
