import { Quote, WorkshopProfile } from '../types';
import { formatCurrencyBRL, getDamageLevelLabel, getPaintTypeMultiplier } from './calculator';

export function generateWhatsAppMessage(quote: Quote, workshop: WorkshopProfile): string {
  const paintInfo = getPaintTypeMultiplier(quote.veiculo.tipoPintura);

  let itensTexto = '';
  quote.itens.forEach((item, index) => {
    const avariaInfo = getDamageLevelLabel(item.avaria);
    itensTexto += `\n*${index + 1}. ${item.nomePeca}*\n`;
    itensTexto += `   • Serviço/Avaria: ${avariaInfo.label}\n`;
    if (item.observacoes) {
      itensTexto += `   • Obs: ${item.observacoes}\n`;
    }
    itensTexto += `   • Subtotal Item: ${formatCurrencyBRL(item.valorTotalItem)}\n`;
  });

  const message = `*ORÇAMENTO DE FUNILARIA & PINTURA - ${workshop.nomeOficina.toUpperCase()}*
📄 *Orçamento Nº:* ${quote.numero}
📅 *Data:* ${new Date(quote.dataCriacao).toLocaleDateString('pt-BR')}
⏳ *Validade:* ${new Date(quote.dataValidade).toLocaleDateString('pt-BR')}

👤 *CLIENTE:* ${quote.cliente.nome}
📱 *Telefone:* ${quote.cliente.telefone}

🚗 *DADOS DO VEÍCULO:*
• *Modelo:* ${quote.veiculo.marca} ${quote.veiculo.modelo}
• *Placa:* ${quote.veiculo.placa} | *Ano:* ${quote.veiculo.ano}
• *Cor / Acabamento:* ${quote.veiculo.cor} (${paintInfo.label})

🛠️ *ITENS E SERVIÇOS DISCRIMINADOS:*${itensTexto}

💰 *RESUMO FINANCEIRO:*
• Subtotal Serviços & Insumos: ${formatCurrencyBRL(quote.subtotalMaoDeObra + quote.subtotalInsumosFracionados + quote.subtotalPecasReposicao + quote.valorLucro)}
${quote.desconto > 0 ? `• Desconto Especial: -${formatCurrencyBRL(quote.desconto)}\n` : ''}• *VALOR TOTAL DO SERVIÇO: ${formatCurrencyBRL(quote.valorTotal)}*

💳 *CONDIÇÕES DE PAGAMENTO (SINAL 50%):*
• *Sinal de Entrada (50%):* ${formatCurrencyBRL(quote.valorSinal50)}
• *Saldo Restante na Entrega:* ${formatCurrencyBRL(quote.valorRestante50)}
• *Prazo Estimado de Execução:* ${quote.prazoExecucaoDias} dias úteis

🔑 *CHAVE PIX PARA O SINAL (50%):*
• *Chave:* \`${workshop.chavePix}\` (${workshop.tipoChavePix.toUpperCase()})
• *Favorecido:* ${workshop.titularPix}

🛡️ *Garantia:* ${workshop.textoGarantia}

📍 *Local:* ${workshop.endereco} - ${workshop.cidadeUf}
📞 *Dúvidas/Atendimento:* ${workshop.telefoneWhatsApp}

_Para confirmar e agendar a entrada do veículo, basta responder a esta mensagem e efetuar o sinal via Pix._`;

  return message;
}

export function openWhatsAppDirect(phone: string, text: string): void {
  // Limpa caracteres especiais do telefone
  const cleanPhone = phone.replace(/\D/g, '');
  const internationalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${internationalPhone}?text=${encodedText}`;
  window.open(url, '_blank');
}
