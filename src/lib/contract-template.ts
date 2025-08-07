import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Profile, Cliente, Proposta, Contrato, SignatureData } from './types';

interface TemplateData {
  contratada: Profile;
  contratante: Cliente;
  proposta: Proposta;
  contract: Contrato | null; // Adicionado para acessar dados da assinatura
}

function getContratanteInfo(contratante: Cliente): string {
    if (contratante.person_type === 'cnpj') {
        return `
<strong>CONTRATANTE:</strong><br>
${contratante.company_name || '[Nome da Empresa Contratante]'}, pessoa jurídica de direito privado, inscrita no CNPJ/ME sob o nº ${contratante.cnpj || '[Número do CNPJ]'}, com sede na ${contratante.address || '[Endereço completo com CEP, Cidade e Estado]'}, neste ato representada por ${contratante.representative_name || '[Nome do Representante Legal]'}, portador(a) da cédula de identidade RG nº ${contratante.representative_rg || '[Número do RG]'} e inscrito(a) no CPF/ME sob o nº ${contratante.representative_cpf || '[Número do CPF]'}.
`;
    }
    return `
<strong>CONTRATANTE:</strong><br>
${contratante.full_name || '[Nome Completo do Cliente]'}, ${contratante.nationality || '[Nacionalidade]'}, ${contratante.civil_status || '[Estado Civil]'}, ${contratante.profession || '[Profissão]'}, portador(a) da cédula de identidade RG nº ${contratante.rg || '[Número do RG]'} e inscrito(a) no CPF/ME sob o nº ${contratante.cpf || '[Número do CPF]'}, residente e domiciliado(a) na ${contratante.address || '[Endereço completo com CEP, Cidade e Estado]'}.
`;
}

function getContratadaInfo(contratada: Profile): string {
    if (contratada.person_type === 'cnpj') {
        return `
<strong>CONTRATADA:</strong><br>
${contratada.company_name || '[Nome da sua Empresa ou seu Nome Completo como MEI]'}, pessoa jurídica de direito privado, inscrita no CNPJ/ME sob o nº ${contratada.cnpj || '[Número do seu CNPJ]'}, com sede na ${contratada.address || '[Seu endereço completo com CEP, Cidade e Estado]'}, neste ato representada por si.
`;
    }
    return `
<strong>CONTRATADA:</strong><br>
${contratada.full_name || '[Seu Nome Completo]'}, ${contratada.nationality || '[Nacionalidade]'}, ${contratada.civil_status || '[Estado Civil]'}, ${contratada.profession || '[Profissão/Assistente Virtual]'}, portador(a) da cédula de identidade RG nº ${contratada.rg || '[Seu número de RG]'} e inscrita no CPF/ME sob o nº ${contratada.cpf || '[Seu número de CPF]'}, residente e domiciliado(a) na ${contratada.address || '[Seu endereço completo com CEP, Cidade e Estado]'}.
`;
}

function getServicesList(services: string[]): string {
    if (!services || services.length === 0) {
        return '<li>Nenhum serviço selecionado.</li>';
    }
    return services.map(service => `<li>${service}</li>`).join('');
}

function getRemunerationInfo(proposta: Proposta): string {
    let text = '';
    const value = proposta.value ? `R$ ${Number(proposta.value).toFixed(2)}` : '[Valor]';
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
    
    text += `<br>4.2. O pagamento deverá ser realizado até o ${proposta.payment_day || '[Dia]'}º dia útil de cada mês.`;
    text += `<br>4.3. O pagamento será efetuado por meio de ${proposta.payment_method || '[Método de Pagamento]'}.`;
    
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

function getSignatureBlock(
    title: string,
    signerName: string,
    signerDocument: string,
    signatureMetadata: SignatureData | null,
    signatureImageUrl: string | null
): string {
    if (!signatureMetadata || !signatureImageUrl) {
        return `
        <div style="margin-top: 20px; text-align: center;">
            <div style="height: 60px; width: 250px; margin: 10px auto; border-bottom: 1px solid #333;"></div>
            <p style="margin: 0;">${signerName}</p>
            <p style="margin: 0;">CPF/CNPJ: ${signerDocument}</p>
            <p style="margin-top: 10px; font-style: italic; color: #888;">(Aguardando assinatura digital)</p>
        </div>
        `;
    }

    return `
        <div style="margin-top: 20px; border: 1px solid #eee; padding: 15px; border-radius: 8px; text-align: center;">
            <strong>${title} (ASSINADO DIGITALMENTE)</strong><br>
            <div style="margin-top: 10px; padding: 10px; background-color: #f9f9f9; border-radius: 4px; display: inline-block;">
                <img src="${signatureImageUrl}" alt="Assinatura de ${signerName}" style="height: 60px; object-fit: contain;"/>
            </div>
            <p style="margin: 5px 0 0 0;">${signerName}</p>
            <p style="margin: 0 0 10px 0;">CPF/CNPJ: ${signerDocument}</p>
            <small style="color: #555; display: block; font-size: 0.75em;">
                Assinado em: ${format(new Date(signatureMetadata.signed_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}<br>
                Endereço IP: ${signatureMetadata.ip_address}
            </small>
        </div>
    `;
}

export function getContractTemplate(data: TemplateData): string {
    const { contratada, contratante, proposta, contract } = data;
    const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

    return `
<h1 style="text-align: center; font-size: 1.2em;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSISTENTE VIRTUAL</h1>

<h3>CLÁUSULA 1ª - IDENTIFICAÇÃO DAS PARTES</h3>
<p>${getContratanteInfo(contratante)}</p>
<p>${getContratadaInfo(contratada)}</p>
<p>As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.</p>
<hr>

<h3>CLÁUSULA 2ª - DO OBJETO DO CONTRATO</h3>
<p>2.1. O objeto do presente contrato é a prestação de serviços de Assistente Virtual pela CONTRATADA à CONTRATANTE, englobando as seguintes atividades:</p>
<ul>${getServicesList(proposta.services)}</ul>
<hr>

<h3>CLÁUSULA 3ª - DAS OBRIGAÇÕES</h3>
<p><strong>3.1. Obrigações da CONTRATADA:</strong> Prestar os serviços com zelo, manter sigilo absoluto sobre as informações, cumprir os prazos e emitir documentos de cobrança.</p>
<p><strong>3.2. Obrigações da CONTRATANTE:</strong> Fornecer as informações necessárias, efetuar os pagamentos e disponibilizar um canal de comunicação.</p>
<hr>

<h3>CLÁUSULA 4ª - DA REMUNERAÇÃO E FORMA DE PAGAMENTO</h3>
<p>4.1. Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA: <br>${getRemunerationInfo(proposta)}</p>
<hr>

<h3>CLÁUSULA 5ª - DO PRAZO</h3>
<p>5.1. ${getPrazoInfo(proposta)}</p>
<hr>

<h3>CLÁUSULA 6ª - CONFIDENCIALIDADE E DEMAIS CLÁUSULAS</h3>
<p>6.1. Ambas as partes comprometem-se a manter sigilo absoluto sobre as informações trocadas. Este contrato é de natureza civil, não configurando vínculo empregatício. A rescisão pode ocorrer por infração contratual ou, em contratos de prazo indeterminado, mediante aviso prévio de 30 dias.</p>
<hr>

<h3>CLÁUSULA 7ª - DO FORO</h3>
<p>7.1. As partes elegem o foro da Comarca de ${proposta.jurisdiction_city || '[Cidade]'}/${proposta.jurisdiction_state || '[UF]'} para dirimir quaisquer controvérsias.</p>
<br>
<p style="text-align: center;">${proposta.jurisdiction_city || '[Local]'}, ${today}.</p>
<br>
<br>

<div id="assinaturas" style="display: flex; justify-content: space-around; flex-wrap: wrap;">
    ${getSignatureBlock(
        'CONTRATANTE',
        contratante.full_name || contratante.company_name || '',
        contratante.cpf || contratante.cnpj || '',
        contract?.client_signature_data || null,
        contract?.client_signature_image_url || null
    )}
    ${getSignatureBlock(
        'CONTRATADA',
        contratada.full_name || contratada.company_name || '',
        contratada.cpf || contratada.cnpj || '',
        contract?.provider_signature_data || null,
        contract?.provider_signature_image_url || null
    )}
</div>
`;
}
