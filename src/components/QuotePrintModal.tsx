import React, { useState } from 'react';
import { 
  Printer, 
  Send, 
  Copy, 
  Check, 
  X, 
  QrCode, 
  ShieldCheck, 
  Building2, 
  Car, 
  User, 
  Calendar, 
  Clock 
} from 'lucide-react';
import { Quote, WorkshopProfile } from '../types';
import { formatCurrencyBRL, getDamageLevelLabel, getPaintTypeMultiplier } from '../utils/calculator';
import { generateWhatsAppMessage, openWhatsAppDirect } from '../utils/whatsapp';

interface QuotePrintModalProps {
  quote: Quote;
  workshop: WorkshopProfile;
  onClose: () => void;
}

export const QuotePrintModal: React.FC<QuotePrintModalProps> = ({
  quote,
  workshop,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const paintInfo = getPaintTypeMultiplier(quote.veiculo.tipoPintura);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(workshop.chavePix);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyFormattedText = () => {
    const text = generateWhatsAppMessage(quote, workshop);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const text = generateWhatsAppMessage(quote, workshop);
    openWhatsAppDirect(quote.cliente.telefone, text);
  };

  return (
    <div id="modal-impressao-orcamento" className="fixed inset-0 z-50 overflow-y-auto bg-[#0A0A0C]/90 backdrop-blur-md p-4 sm:p-6 flex justify-center items-start print:p-0 print:bg-white">
      <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-4 print:border-none print:shadow-none print:m-0 print:rounded-none">
        
        {/* Modal Non-Print Top Toolbar */}
        <div className="p-4 bg-[#121E2B] border-b border-[#1E3349] text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-blue-400">Visualização de Orçamento / PDF</span>
            <span className="text-xs text-slate-400">({quote.numero})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-[#0066FF] hover:bg-[#1A73E8] text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Gerar PDF</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopyFormattedText}
              className="px-3 py-1.5 rounded-xl bg-[#0A0A0C] hover:bg-[#162536] text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-[#223952] cursor-pointer"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#0A0A0C] hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-[#223952] transition-colors cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Canvas (White Timbrado) */}
        <div className="p-8 sm:p-10 space-y-6 text-slate-900 font-sans">
          
          {/* Header with Workshop Logo & Details */}
          <div className="flex flex-wrap items-center justify-between gap-6 border-b-2 border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              {workshop.logotipoUrl ? (
                <img
                  src={workshop.logotipoUrl}
                  alt={workshop.nomeOficina}
                  className="h-16 max-w-[180px] object-contain rounded"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center font-black">
                  <span className="text-xs uppercase tracking-wider text-blue-400">AUTO</span>
                  <span className="text-sm text-yellow-400">GOLD</span>
                </div>
              )}

              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {workshop.nomeOficina}
                </h1>
                {workshop.razaoSocial && (
                  <p className="text-xs text-slate-600 font-medium">{workshop.razaoSocial}</p>
                )}
                {workshop.cnpj && (
                  <p className="text-xs text-slate-600">CNPJ: {workshop.cnpj}</p>
                )}
                <p className="text-xs text-slate-600">
                  {workshop.endereco} - {workshop.cidadeUf}
                </p>
                <p className="text-xs font-semibold text-slate-800">
                  WhatsApp: {workshop.telefoneWhatsApp} {workshop.telefoneFixo ? `| Fixo: ${workshop.telefoneFixo}` : ''}
                </p>
              </div>
            </div>

            {/* Document Number & Dates */}
            <div className="text-right bg-slate-100 p-4 rounded-xl border border-slate-300">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Orçamento de Funilaria e Pintura
              </span>
              <span className="block text-lg font-black text-slate-900 font-mono">
                {quote.numero}
              </span>
              <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                <p>
                  <strong>Emissão:</strong> {new Date(quote.dataCriacao).toLocaleDateString('pt-BR')}
                </p>
                <p>
                  <strong>Validade:</strong> {new Date(quote.dataValidade).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Client & Vehicle Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Client info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block mb-1 border-b border-slate-200 pb-1">
                Dados do Cliente
              </span>
              <p>
                <strong className="text-slate-700">Nome:</strong>{' '}
                <span className="font-bold text-slate-900 text-sm">{quote.cliente.nome}</span>
              </p>
              <p>
                <strong className="text-slate-700">WhatsApp/Telefone:</strong> {quote.cliente.telefone}
              </p>
              {quote.cliente.documento && (
                <p>
                  <strong className="text-slate-700">CPF / CNPJ:</strong> {quote.cliente.documento}
                </p>
              )}
            </div>

            {/* Vehicle info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block mb-1 border-b border-slate-200 pb-1">
                Identificação do Veículo
              </span>
              <p>
                <strong className="text-slate-700">Veículo:</strong>{' '}
                <span className="font-bold text-slate-900 text-sm">{quote.veiculo.marca} {quote.veiculo.modelo}</span>
              </p>
              <div className="flex items-center gap-3">
                <p>
                  <strong className="text-slate-700">Placa:</strong>{' '}
                  <span className="font-mono font-bold px-1.5 py-0.5 bg-slate-200 rounded text-slate-900">
                    {quote.veiculo.placa}
                  </span>
                </p>
                <p>
                  <strong className="text-slate-700">Ano:</strong> {quote.veiculo.ano}
                </p>
              </div>
              <p>
                <strong className="text-slate-700">Cor / Acabamento:</strong> {quote.veiculo.cor || 'Padrão'} ({paintInfo.label})
              </p>
            </div>
          </div>

          {/* Table of Services & Items */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Peça / Componente</th>
                  <th className="py-3 px-4">Grau de Avaria / Serviço</th>
                  <th className="py-3 px-4">Mão de Obra</th>
                  <th className="py-3 px-4">Insumos Frac.</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quote.itens.map((item, idx) => {
                  const avariaInfo = getDamageLevelLabel(item.avaria);

                  return (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-3 px-4 font-bold text-slate-700">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{item.nomePeca}</span>
                        {item.observacoes && (
                          <span className="text-[11px] text-slate-500 italic">{item.observacoes}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{avariaInfo.label}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {formatCurrencyBRL(item.valorMaoDeObraFunilaria + item.valorMaoDeObraPintura)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {formatCurrencyBRL(item.valorInsumosFracionados)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatCurrencyBRL(item.valorTotalItem)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Summary & Pix Signal Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left: 50% Signal Pix Box (7 cols) */}
            <div className="md:col-span-7 bg-slate-900 text-white p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-yellow-400" />
                  Condição de Entrada: Sinal de 50% via Pix
                </span>
                <span className="text-xs text-slate-400">Garantia de Vaga</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Valor do Sinal (50%):</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {formatCurrencyBRL(quote.valorSinal50)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Saldo na Entrega (50%):</span>
                  <span className="text-lg font-bold text-slate-200">
                    {formatCurrencyBRL(quote.valorRestante50)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-800 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Chave Pix ({workshop.tipoChavePix.toUpperCase()}):</span>
                  <button
                    onClick={handleCopyPix}
                    className="print:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-[10px] font-bold text-white cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey ? 'Copiado!' : 'Copiar Pix'}</span>
                  </button>
                </div>
                <p className="font-mono text-yellow-400 font-bold text-sm select-all break-all">
                  {workshop.chavePix}
                </p>
                <p className="text-[11px] text-slate-400">
                  Favorecido: <strong>{workshop.titularPix}</strong>
                </p>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                * O início da desmontagem, reparação e pedido de insumos inicia-se após a confirmação do sinal.
              </p>
            </div>

            {/* Right: Totals Box (5 cols) */}
            <div className="md:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-300 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Serviços & Insumos:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrencyBRL(quote.subtotalMaoDeObra + quote.subtotalInsumosFracionados + quote.subtotalPecasReposicao + quote.valorLucro)}
                </span>
              </div>

              {quote.desconto > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Desconto Aplicado:</span>
                  <span>-{formatCurrencyBRL(quote.desconto)}</span>
                </div>
              )}

              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline">
                <span className="font-black text-slate-900 text-sm uppercase">VALOR TOTAL:</span>
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrencyBRL(quote.valorTotal)}
                </span>
              </div>

              <div className="pt-2 text-[11px] text-slate-600 space-y-1">
                <p>
                  <strong>Prazo de Execução:</strong> {quote.prazoExecucaoDias} dias úteis
                </p>
                <p>
                  <strong>Garantia:</strong> {workshop.textoGarantia}
                </p>
              </div>
            </div>
          </div>

          {/* Observations & Signatures */}
          <div className="pt-4 border-t border-slate-200 text-xs space-y-4">
            {quote.observacoesGerais && (
              <div>
                <strong className="text-slate-800">Observações Gerais:</strong>
                <p className="text-slate-600 mt-0.5">{quote.observacoesGerais}</p>
              </div>
            )}

            {/* Signature lines */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-700">
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold">{workshop.nomeOficina}</p>
                <p className="text-[10px] text-slate-500">Responsável Técnico / Funilaria</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold">{quote.cliente.nome}</p>
                <p className="text-[10px] text-slate-500">Aceite do Cliente e Aprovação do Orçamento</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
