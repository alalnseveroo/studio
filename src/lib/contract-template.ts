import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Profile, Cliente, Proposta } from './types';

interface TemplateData {
  contratada: Profile;
  contratante: Cliente;
  proposta: Proposta;
}

function getContratanteInfo(contratante: Cliente): string {
    if (contratante.person_type === 'cnpj') {
        return `
**CONTRATANTE:**
${contratante.company_name || '[Nome da Empresa Contratante]'}, pessoa jurídica de direito privado, inscrita no CNPJ/ME sob o nº ${contratante.cnpj || '[Número do CNPJ]'}, com sede na ${contratante.address || '[Endereço completo com CEP, Cidade e Estado]'}, neste ato representada por ${contratante.representative_name || '[Nome do Representante Legal]'}, portador(a) da cédula de identidade RG nº ${contratante.representative_rg || '[Número do RG]'} e inscrito(a) no CPF/ME sob o nº ${contratante.representative_cpf || '[Número do CPF]'}.
`;
    }
    return `
**CONTRATANTE:**
${contratante.full_name || '[Nome Completo do Cliente]'}, ${contratante.nationality || '[Nacionalidade]'}, ${contratante.civil_status || '[Estado Civil]'}, ${contratante.profession || '[Profissão]'}, portador(a) da cédula de identidade RG nº ${contratante.rg || '[Número do RG]'} e inscrito(a) no CPF/ME sob o nº ${contratante.cpf || '[Número do CPF]'}, residente e domiciliado(a) na ${contratante.address || '[Endereço completo com CEP, Cidade e Estado]'}.
`;
}

function getContratadaInfo(contratada: Profile): string {
    if (contratada.person_type === 'cnpj') {
        return `
**CONTRATADA:**
${contratada.company_name || '[Nome da sua Empresa ou seu Nome Completo como MEI]'}, pessoa jurídica de direito privado, inscrita no CNPJ/ME sob o nº ${contratada.cnpj || '[Número do seu CNPJ]'}, com sede na ${contratada.address || '[Seu endereço completo com CEP, Cidade e Estado]'}, neste ato representada por si.
`;
    }
    return `
**CONTRATADA:**
${contratada.full_name || '[Seu Nome Completo]'}, ${contratada.nationality || '[Nacionalidade]'}, ${contratada.civil_status || '[Estado Civil]'}, ${contratada.profession || '[Profissão/Assistente Virtual]'}, portador(a) da cédula de identidade RG nº ${contratada.rg || '[Seu número de RG]'} e inscrita no CPF/ME sob o nº ${contratada.cpf || '[Seu número de CPF]'}, residente e domiciliado(a) na ${contratada.address || '[Seu endereço completo com CEP, Cidade e Estado]'}.
`;
}

function getServicesList(services: string[]): string {
    if (!services || services.length === 0) {
        return '- Nenhum serviço selecionado.';
    }
    return services.map(service => `- ${service}`).join('\n');
}

function getRemunerationInfo(proposta: Proposta): string {
    let text = '';
    const value = proposta.value ? `R$ ${proposta.value.toFixed(2)}` : '[Valor]';
    const valueInWords = proposta.value_in_words || '[Valor por Extenso]';

    switch (proposta.payment_type) {
        case 'fixed':
            text = `Opção A (Valor Fixo Mensal): ${value} (${valueInWords}) mensais.`;
            break;
        case 'hourly':
             text = `Opção B (Valor por Hora): ${value} (${valueInWords}) por hora de serviço efetivamente trabalhada.`;
            break;
        case 'project':
            text = `Opção C (Valor por Projeto): ${value} (${valueInWords}) pelo projeto específico.`;
            break;
        default:
             text = 'Forma de remuneração não especificada.';
    }
    
    text += `\n4.2. O pagamento deverá ser realizado até o ${proposta.payment_day || '[Dia]'}º dia útil de cada mês.`;
    text += `\n4.3. O pagamento será efetuado por meio de ${proposta.payment_method || '[Método de Pagamento]'}.`;
    
    return text;
}

function getPrazoInfo(proposta: Proposta): string {
    if (proposta.contract_duration_type === 'definite') {
        const startDate = proposta.start_date ? format(new Date(proposta.start_date), 'dd/MM/yyyy') : '[Data de Início]';
        const endDate = proposta.end_date ? format(new Date(proposta.end_date), 'dd/MM/yyyy') : '[Data de Término]';
        return `O presente contrato vigorará por prazo determinado, pelo período de ${proposta.contract_duration_months || '[Número]'} meses, com início em ${startDate} e término em ${endDate}.`;
    }
    const startDate = proposta.start_date ? format(new Date(proposta.start_date), 'dd/MM/yyyy') : '[Data de Início]';
    return `O presente contrato vigorará por prazo indeterminado, a partir de ${startDate}.`;
}

export function getContractTemplate(data: TemplateData): string {
    const { contratada, contratante, proposta } = data;
    const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

    return `
# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSISTENTE VIRTUAL

## IDENTIFICAÇÃO DAS PARTES
${getContratanteInfo(contratante)}
${getContratadaInfo(contratada)}
As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.

---

### CLÁUSULA 1ª - DO OBJETO DO CONTRATO
1.1. O objeto do presente contrato é a prestação de serviços de Assistente Virtual pela CONTRATADA à CONTRATANTE, englobando as seguintes atividades:
${getServicesList(proposta.services)}

---

### CLÁUSULA 2ª - DAS OBRIGAÇÕES DA CONTRATADA
2.1. Prestar os serviços descritos na Cláusula 1ª com zelo e diligência.
2.2. Manter sigilo absoluto sobre todas as informações da CONTRATANTE.
2.3. Cumprir os prazos acordados.
2.4. Emitir os devidos documentos de cobrança.

---

### CLÁUSULA 3ª - DAS OBRIGAÇÕES DA CONTRATANTE
3.1. Fornecer todas as informações e acessos necessários.
3.2. Efetuar o pagamento dos valores acordados.
3.3. Disponibilizar um canal de comunicação claro.

---

### CLÁUSULA 4ª - DA REMUNERAÇÃO E FORMA DE PAGAMENTO
4.1. Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA:
${getRemunerationInfo(proposta)}

---

### CLÁUSULA 5ª - DO PRAZO
5.1. ${getPrazoInfo(proposta)}

---

### CLÁUSULA 6ª - DA CONFIDENCIALIDADE E PROTEÇÃO DE DADOS (LGPD)
6.1. A CONTRATADA se compromete a manter em absoluto sigilo e confidencialidade todas as informações e dados a que venha a ter acesso.

---

### CLÁUSULA 7ª - DA PROPRIEDADE INTELECTUAL
7.1. Todo o trabalho final criado pela CONTRATADA será de propriedade exclusiva da CONTRATANTE após a quitação integral.

---

### CLÁUSULA 8ª - DA INEXISTÊNCIA DE VÍNCULO EMPREGATÍCIO
8.1. O presente contrato é de natureza estritamente civil, não havendo qualquer tipo de vínculo empregatício.

---

### CLÁUSULA 9ª - DA RESCISÃO
9.1. O contrato poderá ser rescindido por infração contratual.
9.2. Em contratos de prazo indeterminado, a rescisão pode ocorrer com aviso prévio de 30 dias.

---

### CLÁUSULA 10ª - DO FORO
10.1. As partes elegem o foro da Comarca de ${proposta.jurisdiction_city || '[Cidade]'}/${proposta.jurisdiction_state || '[UF]'}.

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento.

${proposta.jurisdiction_city || '[Local]'}, ${today}.

---

**Assinaturas Digitais:**

**CONTRATANTE:**
- Nome: ${contratante.full_name || contratante.company_name}
- CPF/CNPJ: ${contratante.cpf || contratante.cnpj}
- Assinatura: (Aguardando assinatura digital)

**CONTRATADA:**
- Nome: ${contratada.full_name || contratada.company_name}
- CPF/CNPJ: ${contratada.cpf || contratada.cnpj}
- Assinatura: (Aguardando assinatura digital)
`;
}