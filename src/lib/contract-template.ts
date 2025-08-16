
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
<p><strong>CONTRATANTE:</strong></p>
<p><strong>${contratante.company_name || '[Nome da Empresa Contratante]'}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ/ME sob o nº <strong>${contratante.cnpj || '[Número do CNPJ]'}</strong>, com sede na ${contratante.address || '[Endereço completo com CEP, Cidade e Estado]'}.</p>
<p>Neste ato representada por <strong>${contratante.representative_name || '[Nome do Representante Legal]'}</strong>, portador(a) da cédula de identidade RG nº <strong>${contratante.representative_rg || '[Número do RG]'}</strong> e inscrito(a) no CPF/ME sob o nº <strong>${contratante.representative_cpf || '[Número do CPF]'}</strong>.</p>
`;
    }
    return `
<p><strong>CONTRATANTE:</strong></p>
<p><strong>${contratante.full_name || '[Nome Completo do Cliente]'}</strong>, ${contratante.nationality || '[Nacionalidade]'}, ${contratante.civil_status || '[Estado Civil]'}, ${contratante.profession || '[Profissão]'}, portador(a) da cédula de identidade RG nº <strong>${contratante.rg || '[Número do RG]'}</strong> e inscrito(a) no CPF/ME sob o nº <strong>${contratante.cpf || '[Número do CPF]'}</strong>, residente e domiciliado(a) na ${contratante.address || '[Endereço completo com CEP, Cidade e Estado]'}.</p>
`;
}

function getContratadaInfo(contratada: Profile): string {
    if (contratada.person_type === 'cnpj') {
        return `
<p><strong>CONTRATADA:</strong></p>
<p><strong>${contratada.company_name || '[Nome da sua Empresa ou seu Nome Completo como MEI]'}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ/ME sob o nº <strong>${contratada.cnpj || '[Número do seu CNPJ]'}</strong>, com sede na ${contratada.address || '[Seu endereço completo com CEP, Cidade e Estado]'}.</p>
`;
    }
    return `
<p><strong>CONTRATADA:</strong></p>
<p><strong>${contratada.full_name || '[Seu Nome Completo]'}</strong>, ${contratada.nationality || '[Nacionalidade]'}, ${contratada.civil_status || '[Estado Civil]'}, ${contratada.profession || '[Profissão/Assistente Virtual]'}, portador(a) da cédula de identidade RG nº <strong>${contratada.rg || '[Seu número de RG]'}</strong> e inscrita no CPF/ME sob o nº <strong>${contratada.cpf || '[Seu número de CPF]'}</strong>, residente e domiciliado(a) na ${contratada.address || '[Seu endereço completo com CEP, Cidade e Estado]'}.</p>
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
            text = `Opção A (Valor Fixo Mensal): <strong>${value} (${valueInWords})</strong> mensais.`;
            break;
        case 'hourly':
             text = `Opção B (Valor por Hora): <strong>${value} (${valueInWords})</strong> por hora de serviço efetivamente trabalhada.`;
            break;
        case 'project':
            text = `Opção C (Valor por Projeto): <strong>${value} (${valueInWords})</strong> pelo projeto específico.`;
            break;
        default:
             text = 'Forma de remuneração não especificada.';
    }
    
    const paymentDayText = `<p>4.2. O pagamento deverá ser realizado até o <strong>${proposta.payment_day || '[Dia]'}º dia útil</strong> de cada mês.</p>`;
    const paymentMethodText = `<p>4.3. O pagamento será efetuado por meio de <strong>${proposta.payment_method || '[Método de Pagamento]'}</strong>.</p>`;
    
    return `<p>4.1. Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA: ${text}</p>${paymentDayText}${paymentMethodText}`;
}

function getPrazoInfo(proposta: Proposta): string {
    if (proposta.contract_duration_type === 'definite') {
        const startDate = proposta.start_date ? format(new Date(proposta.start_date), 'dd/MM/yyyy') : '[Data de Início]';
        const endDate = proposta.end_date ? format(new Date(proposta.end_date), 'dd/MM/yyyy') : '[Data de Término]';
        return `O presente contrato vigorará por prazo determinado, pelo período de <strong>${proposta.contract_duration_months || '[Número]'} meses</strong>, com início em <strong>${startDate}</strong> e término em <strong>${endDate}</strong>.`;
    }
    const startDate = proposta.start_date ? format(new Date(proposta.start_date), 'dd/MM/yyyy') : '[Data de Início]';
    return `O presente contrato vigorará por prazo indeterminado, a partir de <strong>${startDate}</strong>.`;
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
            <p style="margin: 0;"><strong>${signerName}</strong></p>
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
            <p style="margin: 5px 0 0 0;"><strong>${signerName}</strong></p>
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
<h2 style="text-align: center;"><strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSISTENTE VIRTUAL</strong></h2>

<h3><strong>CLÁUSULA 1ª - IDENTIFICAÇÃO DAS PARTES</strong></h3>
${getContratanteInfo(contratante)}
${getContratadaInfo(contratada)}
<p>As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.</p>
<hr>

<h3><strong>CLÁUSULA 2ª - DO OBJETO DO CONTRATO</strong></h3>
<p>2.1. O objeto do presente contrato é a prestação de serviços de Assistente Virtual pela CONTRATADA à CONTRATANTE, englobando as seguintes atividades:</p>
<ul>${getServicesList(proposta.services)}</ul>
<hr>

<h3><strong>CLÁUSULA 3ª - DAS OBRIGAÇÕES</strong></h3>
<p><strong>3.1. Obrigações da CONTRATADA:</strong> Prestar os serviços com zelo, manter sigilo absoluto sobre as informações, cumprir os prazos e emitir documentos de cobrança.</p>
<p><strong>3.2. Obrigações da CONTRATANTE:</strong> Fornecer as informações necessárias, efetuar os pagamentos e disponibilizar um canal de comunicação.</p>
<hr>

<h3><strong>CLÁUSULA 4ª - DA REMUNERAÇÃO E FORMA DE PAGAMENTO</strong></h3>
${getRemunerationInfo(proposta)}
<hr>

<h3><strong>CLÁUSULA 5ª - DO PRAZO</strong></h3>
<p>5.1. ${getPrazoInfo(proposta)}</p>
<hr>

<h3><strong>CLÁUSULA 6ª - CONFIDENCIALIDADE E DEMAIS CLÁUSULAS</strong></h3>
<p>6.1. Ambas as partes comprometem-se a manter sigilo absoluto sobre as informações trocadas. Este contrato é de natureza civil, não configurando vínculo empregatício. A rescisão pode ocorrer por infração contratual ou, em contratos de prazo indeterminado, mediante aviso prévio de 30 dias.</p>
<hr>

<h3><strong>CLÁUSULA 7ª - DO FORO</strong></h3>
<p>7.1. As partes elegem o foro da Comarca de <strong>${proposta.jurisdiction_city || '[Cidade]'}/${proposta.jurisdiction_state || '[UF]'}</strong> para dirimir quaisquer controvérsias.</p>
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
