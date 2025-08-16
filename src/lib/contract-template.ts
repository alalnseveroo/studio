
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Profile, Cliente, Proposta, Contrato, SignatureData } from './types';

interface TemplateData {
  contratada: Profile;
  contratante: Cliente;
  proposta: Proposta;
  contract: Contrato | null; 
}

function getContratanteInfo(contratante: Cliente): string {
    if (contratante.person_type === 'cnpj') {
        return `
            <h3>CONTRATANTE:</h3>
            <p>
              <strong>${contratante.company_name || '[Nome da Empresa Contratante]'}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ/ME sob o nº <strong>${contratante.cnpj || '[Número do CNPJ]'}</strong>, com sede na ${contratante.address || '[Endereço completo com CEP, Cidade e Estado]'}, neste ato representada por <strong>${contratante.representative_name || '[Nome do Representante Legal]'}</strong>, portador(a) da cédula de identidade RG nº <strong>${contratante.representative_rg || '[Número do RG]'}</strong> e inscrito(a) no CPF/ME sob o nº <strong>${contratante.representative_cpf || '[Número do CPF]'}</strong>.
            </p>
        `;
    }
    return `
        <h3>CONTRATANTE:</h3>
        <p>
            <strong>${contratante.full_name || '[Nome Completo do Cliente]'}</strong>, ${contratante.nationality || '[Nacionalidade]'}, ${contratante.civil_status || '[Estado Civil]'}, ${contratante.profession || '[Profissão]'}, portador(a) da cédula de identidade RG nº <strong>${contratante.rg || '[Número do RG]'}</strong> e inscrito(a) no CPF/ME sob o nº <strong>${contratante.cpf || '[Número do CPF]'}</strong>, residente e domiciliado(a) na ${contratante.address || '[Endereço completo com CEP, Cidade e Estado]'}.
        </p>
    `;
}

function getContratadaInfo(contratada: Profile): string {
    if (contratada.person_type === 'cnpj') {
        return `
            <h3>CONTRATADA:</h3>
            <p>
                <strong>${contratada.company_name || '[Nome da sua Empresa ou seu Nome Completo como MEI]'}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ/ME sob o nº <strong>${contratada.cnpj || '[Número do seu CNPJ]'}</strong>, com sede na ${contratada.address || '[Seu endereço completo com CEP, Cidade e Estado]'}, neste ato representada por si.
            </p>
        `;
    }
    return `
        <h3>CONTRATADA:</h3>
        <p>
            <strong>${contratada.full_name || '[Seu Nome Completo]'}</strong>, ${contratada.nationality || '[Nacionalidade]'}, ${contratada.civil_status || '[Estado Civil]'}, ${contratada.profession || '[Profissão/Assistente Virtual]'}, portador(a) da cédula de identidade RG nº <strong>${contratada.rg || '[Seu número de RG]'}</strong> e inscrita no CPF/ME sob o nº <strong>${contratada.cpf || '[Seu número de CPF]'}</strong>, residente e domiciliado(a) na ${contratada.address || '[Seu endereço completo com CEP, Cidade e Estado]'}.
        </p>
    `;
}

function getServicesList(services: string[]): string {
    if (!services || services.length === 0) {
        return '<p>Nenhum serviço selecionado.</p>';
    }
    return services.map(service => `<p>${service}</p>`).join('');
}

function getRemunerationInfo(proposta: Proposta): string {
    let remunerationText = '';
    const value = proposta.value ? `R$ ${Number(proposta.value).toFixed(2)}` : '[Valor]';
    const valueInWords = proposta.value_in_words || '[Valor por Extenso]';

    switch (proposta.payment_type) {
        case 'fixed':
            remunerationText = `Opção A (Valor Fixo Mensal): <strong>${value} (${valueInWords})</strong> mensais.`;
            break;
        case 'hourly':
             remunerationText = `Opção B (Valor por Hora): <strong>${value} (${valueInWords})</strong> por hora de serviço efetivamente trabalhada.`;
            break;
        case 'project':
            remunerationText = `Opção C (Valor por Projeto): <strong>${value} (${valueInWords})</strong> pelo projeto específico.`;
            break;
        default:
             remunerationText = 'Forma de remuneração não especificada.';
    }
    
    return `
        <p>4.1. Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor de: ${remunerationText}</p>
        <p>4.2. O pagamento deverá ser realizado até o <strong>${proposta.payment_day || '[Dia]'}º dia útil</strong> de cada mês subsequente à prestação dos serviços.</p>
        <p>4.3. O pagamento será efetuado por meio de <strong>${proposta.payment_method || '[Método de Pagamento]'}</strong>.</p>
        <p>4.4. O não pagamento na data estipulada implicará em multa de 2% (dois por cento) sobre o valor devido, acrescido de juros de mora de 1% (um por cento) ao mês, calculados pro rata die.</p>
    `;
}

function getPrazoInfo(proposta: Proposta): string {
    let text;
    if (proposta.contract_duration_type === 'definite') {
        const startDate = proposta.start_date ? format(new Date(proposta.start_date), 'dd/MM/yyyy') : '[Data de Início]';
        const endDate = proposta.end_date ? format(new Date(proposta.end_date), 'dd/MM/yyyy') : '[Data de Término]';
        text = `O presente contrato vigorará por prazo determinado, pelo período de <strong>${proposta.contract_duration_months || '[Número]'} meses</strong>, com início em <strong>${startDate}</strong> e término em <strong>${endDate}</strong>, podendo ser prorrogado mediante acordo entre as partes.`;
    } else { // indefinite
        const startDate = proposta.start_date ? format(new Date(proposta.start_date), 'dd/MM/yyyy') : '[Data de Início]';
        text = `O presente contrato vigorará por prazo indeterminado, a partir de <strong>${startDate}</strong>, podendo ser rescindido por qualquer uma das partes conforme a Cláusula 9ª.`;
    }
    return `<p>5.1. ${text}</p>`;
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
        <div style="margin-top: 40px; page-break-inside: avoid; text-align: center;">
            <div style="height: 60px; width: 250px; margin: 10px auto; border-bottom: 1px solid #333;"></div>
            <p style="margin: 0; font-weight: bold;">${signerName}</p>
            <p style="margin: 0;">CPF/CNPJ: ${signerDocument}</p>
            <p style="margin-top: 10px; font-style: italic; color: #888;">(Aguardando assinatura digital)</p>
        </div>
        `;
    }

    return `
        <div style="margin-top: 40px; border: 1px solid #eee; padding: 15px; border-radius: 8px; text-align: center; page-break-inside: avoid;">
            <p style="margin: 0; font-weight: bold;">${title} (ASSINADO DIGITALMENTE)</p>
            <div style="margin-top: 10px; padding: 10px; background-color: #f9f9f9; border-radius: 4px; display: inline-block;">
                <img src="${signatureImageUrl}" alt="Assinatura de ${signerName}" style="height: 60px; object-fit: contain;"/>
            </div>
            <p style="margin: 5px 0 0 0; font-weight: bold;">${signerName}</p>
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
    const jurisdiction = `${proposta.jurisdiction_city || '[Cidade]'}/${proposta.jurisdiction_state || '[UF]'}`;

    return `
        <h1 style="text-align: center;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSISTENTE VIRTUAL</h1>
        
        <h2>IDENTIFICAÇÃO DAS PARTES</h2>
        ${getContratanteInfo(contratante)}
        ${getContratadaInfo(contratada)}
        <p>As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.</p>
        
        <h2>CLÁUSULA 1ª - DO OBJETO DO CONTRATO</h2>
        <p>1.1. O objeto do presente contrato é a prestação de serviços de Assistente Virtual pela CONTRATADA à CONTRATANTE, englobando as seguintes atividades:</p>
        ${getServicesList(proposta.services)}
        <p><strong>Parágrafo Único:</strong> Quaisquer serviços não especificados nesta cláusula serão considerados "serviços extras" e necessitarão de um aditivo contratual ou de uma nova proposta comercial, com valores e prazos negociados à parte.</p>

        <h2>CLÁUSULA 2ª - DAS OBRIGAÇÕES DA CONTRATADA</h2>
        <p>2.1. Prestar os serviços descritos na Cláusula 1ª com zelo, diligência e qualidade técnica, utilizando as melhores práticas de mercado.</p>
        <p>2.2. Utilizar seus próprios equipamentos (computador, software, internet) para a execução dos serviços, salvo quando acordado de forma diferente.</p>
        <p>2.3. Manter sigilo absoluto sobre todas as informações, dados, senhas e documentos da CONTRATANTE a que tiver acesso em decorrência deste contrato.</p>
        <p>2.4. Informar à CONTRATANTE sobre o andamento dos trabalhos, através de relatórios semanais ou sempre que solicitado.</p>
        <p>2.5. Cumprir os prazos acordados com a CONTRATANTE para a entrega das tarefas.</p>
        <p>2.6. Emitir e enviar os devidos documentos de cobrança (Nota Fiscal ou Recibo de Pagamento Autônomo - RPA) referentes aos serviços prestados.</p>

        <h2>CLÁUSULA 3ª - DAS OBRIGAÇÕES DA CONTRATANTE</h2>
        <p>3.1. Fornecer à CONTRATADA todas as informações, documentos, acessos e senhas necessários para a correta execução dos serviços.</p>
        <p>3.2. Efetuar o pagamento dos valores acordados na forma e prazo estipulados na Cláusula 4ª.</p>
        <p>3.3. Disponibilizar um canal de comunicação claro e um ponto de contato principal para alinhamentos, solicitações e aprovações.</p>
        <p>3.4. Analisar e aprovar os materiais e trabalhos enviados pela CONTRATADA dentro de um prazo razoável, a fim de não comprometer o cronograma das atividades.</p>

        <h2>CLÁUSULA 4ª - DA REMUNERAÇÃO E FORMA DE PAGAMENTO</h2>
        ${getRemunerationInfo(proposta)}

        <h2>CLÁUSULA 5ª - DO PRAZO</h2>
        ${getPrazoInfo(proposta)}

        <h2>CLÁUSULA 6ª - DA CONFIDENCIALIDADE E PROTEÇÃO DE DADOS (LGPD)</h2>
        <p>6.1. A CONTRATADA se compromete a manter em absoluto sigilo e confidencialidade todas as informações comerciais, técnicas, financeiras, bem como quaisquer dados pessoais de clientes, fornecedores ou da própria CONTRATANTE, a que venha a ter acesso.</p>
        <p>6.2. Esta obrigação de sigilo se estende mesmo após o término ou rescisão do presente contrato, por um período de 5 (cinco) anos.</p>
        <p>6.3. Em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), a CONTRATADA tratará os dados pessoais a que tiver acesso estritamente para os fins do objeto deste contrato, não podendo utilizá-los para qualquer outra finalidade.</p>
        
        <h2>CLÁUSULA 7ª - DA PROPRIEDADE INTELECTUAL</h2>
        <p>7.1. Todos os documentos, planilhas, textos, artes e demais materiais criados pela CONTRATADA no exercício do objeto deste contrato ("trabalho final") serão de propriedade exclusiva da CONTRATANTE após a quitação integral dos pagamentos correspondentes.</p>
        <p>7.2. Ferramentas, metodologias e processos de trabalho pré-existentes da CONTRATADA não são transferidos para a CONTRATANTE.</p>
        
        <h2>CLÁUSULA 8ª - DA INEXISTÊNCIA DE VÍNCULO EMPREGATÍCIO</h2>
        <p>8.1. O presente contrato é de natureza estritamente civil de prestação de serviços, regido pelo Código Civil, não havendo qualquer tipo de vínculo empregatício entre a CONTRATANTE e a CONTRATADA.</p>
        <p>8.2. Fica expressamente estabelecido que não há relação de subordinação, pessoalidade ou habitualidade nos moldes da Consolidação das Leis do Trabalho (CLT), cabendo à CONTRATADA total autonomia na execução dos serviços, desde que atendidos os prazos e a qualidade acordados.</p>

        <h2>CLÁUSULA 9ª - DA RESCISÃO</h2>
        <p>9.1. O presente contrato poderá ser rescindido de pleno direito, independentemente de notificação judicial ou extrajudicial, nas seguintes hipóteses:</p>
        <p>a) Infração de qualquer uma das cláusulas contratuais por qualquer das partes;</p>
        <p>b) Pedido de recuperação judicial ou decretação de falência de qualquer uma das partes.</p>
        <p>9.2. Caso o contrato seja de prazo indeterminado, qualquer uma das partes poderá rescindi-lo sem justo motivo, mediante comunicação por escrito à outra parte com antecedência mínima de 30 (trinta) dias.</p>
        <p>9.3. O não cumprimento do aviso prévio estipulado no item 9.2 implicará no pagamento de multa compensatória no valor correspondente a 1 (um) mês dos serviços contratados.</p>

        <h2>CLÁUSULA 10ª - DAS DISPOSIÇÕES GERAIS</h2>
        <p>10.1. Qualquer alteração nas condições deste contrato só terá validade se realizada por meio de um Termo Aditivo, devidamente assinado por ambas as partes.</p>
        <p>10.2. A tolerância de uma das partes com relação ao descumprimento de qualquer obrigação pela outra parte não será considerada novação, renúncia ou alteração do que foi pactuado.</p>
        
        <h2>CLÁUSULA 11ª - DO FORO</h2>
        <p>11.1. Para dirimir quaisquer controvérsias oriundas do presente contrato, as partes elegem o foro da Comarca de <strong>${jurisdiction}</strong>, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
        
        <p style="text-align: center; margin-top: 30px;">E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em formato eletrônico.</p>
        <p style="text-align: center;">${proposta.jurisdiction_city || '[Local]'}, ${today}.</p>
        
        <div id="assinaturas" style="margin-top: 50px; display: flex; justify-content: space-around; flex-wrap: wrap;">
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
