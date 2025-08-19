# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---

## Plano de Desenvolvimento Estratégico

Este documento descreve a estratégia que seguimos para o desenvolvimento e manutenção deste aplicativo, com o objetivo de aumentar a robustez, previsibilidade e qualidade do código.

### 1. Componentização e Responsabilidade Única

*   **Problema:** Partes do sistema interligadas de forma frágil, onde uma pequena alteração pode causar efeitos inesperados em várias páginas.
*   **Nossa Estratégia:** Focar em criar **componentes menores e mais independentes**. Cada componente terá uma única responsabilidade (ex: um para exibir dados, outro para o formulário de edição).
*   **Benefício:** Alterações futuras são isoladas, reduzindo drasticamente o risco de quebrar outras funcionalidades. A manutenção se torna mais segura e previsível.

### 2. Separação Clara de Lógica (Back-end vs. Front-end)

*   **Problema:** A lógica de busca de dados, manipulação e exibição por vezes se mistura, dificultando a depuração.
*   **Nossa Estratégia:** Priorizar uma separação estrita:
    *   **Ações do Servidor (`/lib/actions/*.ts`):** Exclusivamente para interagir com o banco de dados (buscar, criar, atualizar, deletar).
    *   **Componentes de Página (`/app/**/page.tsx`):** Responsáveis por chamar as ações, gerenciar o estado (carregando, erro) e passar os dados para os componentes de UI.
    *   **Componentes de UI (`/components/**`):** Apenas recebem dados e os exibem, sem lógica de negócio.
*   **Benefício:** Se um erro de "dados não encontrados" ocorrer, saberemos que o problema está na `action`, e não no componente de UI, agilizando a depuração.

### 3. Validação Rigorosa de Tipos (TypeScript)

*   **Problema:** Erros como "cannot read property of undefined" que ocorrem em tempo de execução.
*   **Nossa Estratégia:** Garantir que os tipos de dados em `src/lib/types.ts` reflitam exatamente a estrutura dos dados no banco. Campos que podem ser nulos serão explicitamente marcados.
*   **Benefício:** O próprio editor de código nos alertará sobre possíveis erros antes de rodarmos a aplicação, prevenindo uma classe inteira de bugs.

### 4. Testes Incrementais

*   **Problema:** Fazer grandes alterações de uma só vez aumenta o risco de introduzir bugs difíceis de rastrear.
*   **Nossa Estratégia:** Para solicitações complexas, adotar um plano em etapas (ex: "Primeiro, criamos o componente. Segundo, integramos à página").
*   **Benefício:** Permite validar cada pequena parte, garantindo que ela funcione perfeitamente antes de prosseguirmos. Se algo quebrar, a causa é imediatamente identificada.

### 5. Checklist de Verificação de Funcionalidades (Manual)

*   **Problema:** Uma nova funcionalidade ou correção de bug pode quebrar funcionalidades existentes (regressão).
*   **Nossa Estratégia:** Antes de finalizar qualquer alteração, seguir rigorosamente o `CHECKLIST.md` para verificar se as funcionalidades críticas do sistema continuam operando corretamente.
*   **Benefício:** Garante a estabilidade do núcleo da aplicação e aumenta a confiança a cada nova entrega.
