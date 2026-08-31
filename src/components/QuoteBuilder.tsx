import React, { useState } from 'react';
import { 
  Car, 
  User, 
  Plus, 
  Trash2, 
  Send, 
  Printer, 
  Save, 
  RotateCcw, 
  Check, 
  Clock, 
  DollarSign, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Percent,
  Layers,
  Wrench,
  Paintbrush
} from 'lucide-react';
import { 
  BodyPartItem, 
  ClientInfo, 
  DamageLevel, 
  MaterialInsumo, 
  PaintType, 
  Quote, 
  QuoteItem, 
  VehicleInfo, 
  WorkshopProfile 
} from '../types';
import { 
  calculateQuoteItem, 
  calculateQuoteTotals, 
  formatCurrencyBRL, 
  getDamageLevelLabel, 
  getPaintTypeMultiplier 
} from '../utils/calculator';
import { DEFAULT_BODY_PARTS } from '../data/defaultData';
import { generateWhatsAppMessage, openWhatsAppDirect } from '../utils/whatsapp';

interface QuoteBuilderProps {
  workshop: WorkshopProfile;
  materials: MaterialInsumo[];
  onSaveQuote: (quote: Quote) => void;
  onOpenPrintModal: (quote: Quote) => void;
  editingQuote?: Quote | null;
  onCancelEdit?: () => void;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({
  workshop,
  materials,
  onSaveQuote,
  onOpenPrintModal,
  editingQuote,
  onCancelEdit,
}) => {
  // Client Info State
  const [cliente, setCliente] = useState<ClientInfo>(
    editingQuote?.cliente || {
      nome: '',
      telefone: '',
      email: '',
      documento: '',
    }
  );

  // Vehicle Info State
  const [veiculo, setVeiculo] = useState<VehicleInfo>(
    editingQuote?.veiculo || {
      placa: '',
      marca: '',
      modelo: '',
      ano: new Date().getFullYear().toString(),
      cor: '',
      tipoPintura: 'metalica',
      km: '',
    }
  );

  // Items State
  const [itens, setItens] = useState<QuoteItem[]>(editingQuote?.itens || []);

  // Selected piece to add
  const [selectedPartId, setSelectedPartId] = useState<string>(DEFAULT_BODY_PARTS[0].id);
  const [selectedDamage, setSelectedDamage] = useState<DamageLevel>('media');
  const [itemObs, setItemObs] = useState<string>('');
  const [customPartCost, setCustomPartCost] = useState<number>(0);

  // Financial settings for this quote
  const [margemLucro, setMargemLucro] = useState<number>(
    editingQuote?.margemLucroAplicada ?? workshop.margemLucroPadrao
  );
  const [desconto, setDesconto] = useState<number>(editingQuote?.desconto || 0);
  const [prazoDias, setPrazoDias] = useState<number>(editingQuote?.prazoExecucaoDias || 3);
  const [obsGerais, setObsGerais] = useState<string>(
    editingQuote?.observacoesGerais || 'Veículo com verniz e peças originais. Serviço com garantia padrão da oficina.'
  );

  // UI state
  const [expandedItemDetails, setExpandedItemDetails] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  // Calculate live quote totals
  const totals = calculateQuoteTotals(itens, margemLucro, desconto);

  // Quick helper to add item
  const handleAddItem = () => {
    setErrorMsg('');
    const bodyPart = DEFAULT_BODY_PARTS.find((p) => p.id === selectedPartId);
    if (!bodyPart) return;

    const newItem = calculateQuoteItem({
      bodyPart,
      damageLevel: selectedDamage,
      paintType: veiculo.tipoPintura,
      materials,
      valorHoraFunilaria: workshop.valorHoraFunilaria,
      valorHoraPintura: workshop.valorHoraPintura,
      custoPecaReposicao: Number(customPartCost) || 0,
      observacoes: itemObs.trim(),
    });

    setItens([...itens, newItem]);
    setItemObs('');
    setCustomPartCost(0);
  };

  const handleRemoveItem = (id: string) => {
    setItens(itens.filter((item) => item.id !== id));
  };

  const toggleItemExpansion = (id: string) => {
    setExpandedItemDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const buildQuoteObject = (): Quote | null => {
    if (!cliente.nome.trim()) {
      setErrorMsg('Informe o nome do cliente para gerar o orçamento.');
      return null;
    }
    if (!veiculo.modelo.trim() || !veiculo.placa.trim()) {
      setErrorMsg('Informe o modelo e a placa do veículo.');
      return null;
    }
    if (itens.length === 0) {
      setErrorMsg('Adicione pelo menos 1 peça / avaria ao orçamento.');
      return null;
    }

    const quoteId = editingQuote?.id || `quote_${Date.now()}`;
    const quoteNumber = editingQuote?.numero || `ORC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dataCriacao = editingQuote?.dataCriacao || new Date().toISOString();
    const dataValidade = new Date(Date.now() + workshop.prazoValidadeDias * 86400000).toISOString();

    const quote: Quote = {
      id: quoteId,
      numero: quoteNumber,
      dataCriacao,
      dataValidade,
      status: editingQuote?.status || 'pendente',
      cliente,
      veiculo,
      itens,
      subtotalMaoDeObra: totals.subtotalMaoDeObra,
      subtotalInsumosFracionados: totals.subtotalInsumosFracionados,
      subtotalPecasReposicao: totals.subtotalPecasReposicao,
      margemLucroAplicada: margemLucro,
      valorLucro: totals.valorLucro,
      desconto,
      valorTotal: totals.valorTotal,
      valorSinal50: totals.valorSinal50,
      valorRestante50: totals.valorRestante50,
      prazoExecucaoDias: prazoDias,
      observacoesGerais: obsGerais,
    };

    return quote;
  };

  const handleSave = () => {
    const quote = buildQuoteObject();
    if (!quote) return;

    onSaveQuote(quote);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const handleSendWhatsApp = () => {
    const quote = buildQuoteObject();
    if (!quote) return;

    if (!cliente.telefone) {
      setErrorMsg('Informe o número de WhatsApp do cliente com DDD.');
      return;
    }

    const message = generateWhatsAppMessage(quote, workshop);
    openWhatsAppDirect(cliente.telefone, message);
    onSaveQuote(quote);
  };

  const handlePrint = () => {
    const quote = buildQuoteObject();
    if (!quote) return;

    onOpenPrintModal(quote);
  };

  const handleReset = () => {
    if (window.confirm('Deseja realmente limpar todos os campos do orçamento atual?')) {
      setCliente({ nome: '', telefone: '', email: '', documento: '' });
      setVeiculo({
        placa: '',
        marca: '',
        modelo: '',
        ano: new Date().getFullYear().toString(),
        cor: '',
        tipoPintura: 'metalica',
        km: '',
      });
      setItens([]);
      setDesconto(0);
      setItemObs('');
      setCustomPartCost(0);
    }
  };

  return (
    <div id="quote-builder-container" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Alert Error Header */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 flex items-center justify-between text-red-200 text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-white text-xs font-bold px-2 py-1">
            Fechar
          </button>
        </div>
      )}

      {savedFeedback && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 flex items-center gap-2.5 text-emerald-200 text-sm font-medium animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>Orçamento salvo com sucesso na aba de orçamentos!</span>
        </div>
      )}

      {/* Main Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Client, Vehicle, and Piece Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Client & Vehicle Card */}
          <div className="bg-[#121E2B] border border-[#1E3349] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E3349] pb-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-wider">
                <User className="w-4 h-4" />
                <span>1. Dados do Cliente e Veículo</span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#0A0A0C] text-slate-400 border border-[#1E3349]">
                {editingQuote ? `Editando ${editingQuote.numero}` : 'Novo Atendimento'}
              </span>
            </div>

            {/* Client Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo do Cliente *
                </label>
                <input
                  id="input-cliente-nome"
                  type="text"
                  required
                  value={cliente.nome}
                  onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                  placeholder="ex: João Silva"
                  className="w-full px-3.5 py-2.5 bg-[#0A0A0C] border border-[#223952] rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp / Celular com DDD *
                </label>
                <input
                  id="input-cliente-telefone"
                  type="text"
                  required
                  value={cliente.telefone}
                  onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3.5 py-2.5 bg-[#0A0A0C] border border-[#223952] rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                />
              </div>
            </div>

            {/* Vehicle Inputs */}
            <div className="pt-2 border-t border-[#162536] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Placa Mercosul Badge Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-blue-400" /> Placa *
                  </label>
                  <div className="relative">
                    <input
                      id="input-veiculo-placa"
                      type="text"
                      maxLength={8}
                      value={veiculo.placa}
                      onChange={(e) => setVeiculo({ ...veiculo, placa: e.target.value.toUpperCase() })}
                      placeholder="ABC1D23"
                      className="w-full pl-3 pr-2 py-2.5 bg-[#0A0A0C] border-2 border-blue-500/40 rounded-xl text-slate-100 font-mono font-bold tracking-widest text-sm focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Marca / Montadora
                  </label>
                  <input
                    id="input-veiculo-marca"
                    type="text"
                    value={veiculo.marca}
                    onChange={(e) => setVeiculo({ ...veiculo, marca: e.target.value })}
                    placeholder="ex: Toyota, VW, Fiat"
                    className="w-full px-3 py-2.5 bg-[#0A0A0C] border border-[#223952] rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Modelo do Veículo *
                  </label>
                  <input
                    id="input-veiculo-modelo"
                    type="text"
                    required
                    value={veiculo.modelo}
                    onChange={(e) => setVeiculo({ ...veiculo, modelo: e.target.value })}
                    placeholder="ex: Corolla XEi 2.0"
                    className="w-full px-3 py-2.5 bg-[#0A0A0C] border border-[#223952] rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ano / Modelo
                  </label>
                  <input
                    id="input-veiculo-ano"
                    type="text"
                    value={veiculo.ano}
                    onChange={(e) => setVeiculo({ ...veiculo, ano: e.target.value })}
                    placeholder="2023"
                    className="w-full px-3 py-2 bg-[#0A0A0C] border border-[#223952] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cor do Veículo
                  </label>
                  <input
                    id="input-veiculo-cor"
                    type="text"
                    value={veiculo.cor}
                    onChange={(e) => setVeiculo({ ...veiculo, cor: e.target.value })}
                    placeholder="ex: Prata Lunar, Preto Ninja"
                    className="w-full px-3 py-2 bg-[#0A0A0C] border border-[#223952] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo de Pintura
                  </label>
                  <select
                    id="select-tipo-pintura"
                    value={veiculo.tipoPintura}
                    onChange={(e) => setVeiculo({ ...veiculo, tipoPintura: e.target.value as PaintType })}
                    className="w-full px-3 py-2 bg-[#0A0A0C] border border-[#223952] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-[#0066FF] cursor-pointer"
                  >
                    <option value="solida">Sólida / Lisa (1.0x)</option>
                    <option value="metalica">Metálica (+15% tinta)</option>
                    <option value="perolizada">Perolizada (+30% camadas)</option>
                    <option value="tricote_especial">Tricote / Especial (+50%)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Piece & Damage Selector */}
          <div className="bg-[#121E2B] border border-[#1E3349] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E3349] pb-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-wider">
                <Wrench className="w-4 h-4" />
                <span>2. Seleção de Peça e Nível de Avaria</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Cálculo Fracionado Ativo
              </span>
            </div>

            {/* Body Part Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Escolha a Peça / Painel do Veículo
              </label>
              <select
                id="select-peca-veiculo"
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full px-3.5 py-3 bg-[#0A0A0C] border border-[#223952] rounded-xl text-slate-100 font-semibold text-sm focus:outline-none focus:border-[#0066FF] cursor-pointer"
              >
                {DEFAULT_BODY_PARTS.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.nome} (Área: {part.areaRelativa}x)
                  </option>
                ))}
              </select>
            </div>

            {/* Damage Level Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Nível de Avaria / Tipo de Trabalho
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(
                  [
                    'pequena',
                    'media',
                    'grande',
                    'troca',
                    'apenas_pintura',
                    'apenas_funilaria',
                  ] as DamageLevel[]
                ).map((lvl) => {
                  const info = getDamageLevelLabel(lvl);
                  const isSelected = selectedDamage === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedDamage(lvl)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 border-[#0066FF] text-white shadow-md shadow-blue-600/20 ring-1 ring-[#0066FF]'
                          : 'bg-[#0A0A0C] border-[#1E3349] text-slate-300 hover:bg-[#152332] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{info.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0066FF]" />}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                        {info.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Extra Options: New Part Cost & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custo de Peça Nova de Reposição (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                  <input
                    id="input-custo-peca-nova"
                    type="number"
                    min="0"
                    step="10"
                    value={customPartCost || ''}
                    onChange={(e) => setCustomPartCost(Number(e.target.value))}
                    placeholder="0,00 (deixe 0 se apenas recuperação)"
                    className="w-full pl-10 pr-3 py-2 bg-[#0A0A0C] border border-[#223952] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Se a oficina comprar a peça bruta</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações da Avaria (Opcional)
                </label>
                <input
                  id="input-obs-avaria"
                  type="text"
                  value={itemObs}
                  onChange={(e) => setItemObs(e.target.value)}
                  placeholder="ex: recuperação no vinco inferior"
                  className="w-full px-3 py-2 bg-[#0A0A0C] border border-[#223952] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-[#0066FF]"
                />
              </div>
            </div>

            {/* Button Add Item */}
            <button
              id="btn-adicionar-peca-orcamento"
              type="button"
              onClick={handleAddItem}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#0066FF] to-[#004DB3] hover:from-[#1A73E8] hover:to-[#0066FF] text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.99] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Peça com Cálculo Fracionado</span>
            </button>
          </div>

          {/* Section 3: List of Added Items with Material Breakdown */}
          <div className="bg-[#121E2B] border border-[#1E3349] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E3349] pb-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>3. Peças no Orçamento ({itens.length})</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Consumo detalhado em ml / g
              </span>
            </div>

            {itens.length === 0 ? (
              <div className="py-8 text-center text-slate-500 border border-dashed border-[#1E3349] rounded-xl">
                <Car className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                <p className="text-xs font-semibold text-slate-400">Nenhuma peça adicionada ainda.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Selecione uma peça e clique em "Adicionar Peça" acima.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {itens.map((item, index) => {
                  const avariaInfo = getDamageLevelLabel(item.avaria);
                  const isExpanded = expandedItemDetails[item.id];

                  return (
                    <div
                      key={item.id}
                      className="bg-[#0A0A0C] border border-[#1E3349] rounded-xl overflow-hidden shadow-sm"
                    >
                      {/* Item Main Summary Row */}
                      <div className="p-3.5 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <span className="font-bold text-sm text-slate-100 truncate">
                              {item.nomePeca}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#162536] text-blue-300 font-medium border border-blue-500/20 shrink-0">
                              {avariaInfo.label}
                            </span>
                          </div>

                          {item.observacoes && (
                            <p className="text-xs text-slate-400 mt-1 ml-7">
                              Obs: {item.observacoes}
                            </p>
                          )}

                          {/* Mini Cost Breakdown Pills */}
                          <div className="flex flex-wrap items-center gap-2 mt-2 ml-7 text-[11px] text-slate-400">
                            <span>
                              Mão de Obra:{' '}
                              <strong className="text-slate-200">
                                {formatCurrencyBRL(item.valorMaoDeObraFunilaria + item.valorMaoDeObraPintura)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Insumos Fracionados:{' '}
                              <strong className="text-emerald-400">
                                {formatCurrencyBRL(item.valorInsumosFracionados)}
                              </strong>
                            </span>
                            {item.custoPecaReposicao > 0 && (
                              <>
                                <span>•</span>
                                <span>
                                  Peça Nova:{' '}
                                  <strong className="text-amber-300">
                                    {formatCurrencyBRL(item.custoPecaReposicao)}
                                  </strong>
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right: Total Price & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className="text-xs text-slate-400 block text-[10px] uppercase">
                              Subtotal
                            </span>
                            <span className="font-black text-sm text-white">
                              {formatCurrencyBRL(item.valorTotalItem)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleItemExpansion(item.id)}
                            title="Ver detalhes dos insumos fracionados"
                            className="p-1.5 rounded-lg bg-[#162536] text-slate-400 hover:text-white border border-[#223952] transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remover item"
                            className="p-1.5 rounded-lg bg-red-950/60 text-red-400 hover:text-red-300 border border-red-800/80 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Material Fraction Details */}
                      {isExpanded && (
                        <div className="p-3.5 bg-[#0e1722] border-t border-[#1E3349] text-xs space-y-2 animate-in fade-in">
                          <p className="font-semibold text-blue-300 text-[11px] flex items-center gap-1">
                            <Paintbrush className="w-3 h-3" /> Memória de Cálculo de Insumos Fracionados:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            {item.detalhesInsumos.map((det, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-lg bg-[#0A0A0C] border border-[#1a2c3f] flex items-center justify-between"
                              >
                                <div className="truncate mr-2">
                                  <span className="text-slate-300 font-medium block truncate">
                                    {det.materialNome}
                                  </span>
                                  <span className="text-slate-500 text-[10px]">
                                    Consumo: {det.quantidadeGasta} {det.unidade}
                                  </span>
                                </div>
                                <span className="font-mono text-emerald-400 font-semibold shrink-0">
                                  {formatCurrencyBRL(det.custoFracionado)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Financial Summary, Signal 50%, Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Financial Card */}
          <div className="bg-[#121E2B] border border-[#1E3349] rounded-2xl p-5 shadow-2xl space-y-5 sticky top-24">
            <div className="flex items-center justify-between border-b border-[#1E3349] pb-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-wider">
                <DollarSign className="w-4 h-4" />
                <span>4. Fechamento Financeiro</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <Sparkles className="w-3 h-3" />
                <span>Sinal 50% Pix</span>
              </div>
            </div>

            {/* Direct Cost Subtotals */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Mão de Obra Total (Funilaria + Pintura):</span>
                <span className="font-semibold text-slate-200">{formatCurrencyBRL(totals.subtotalMaoDeObra)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Insumos Fracionados (ml/g exatos):</span>
                <span className="font-semibold text-emerald-400">{formatCurrencyBRL(totals.subtotalInsumosFracionados)}</span>
              </div>

              {totals.subtotalPecasReposicao > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Peças Novas de Reposição:</span>
                  <span className="font-semibold text-amber-300">{formatCurrencyBRL(totals.subtotalPecasReposicao)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#1E3349] flex justify-between text-slate-300 font-medium">
                <span>Custo Direto do Serviço:</span>
                <span>{formatCurrencyBRL(totals.baseCustoDireto)}</span>
              </div>
            </div>

            {/* Profit Margin & Discount Controls */}
            <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-[#1E3349] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-blue-400" /> Margem de Lucro da Oficina:
                </label>
                <div className="flex items-center gap-1 w-24">
                  <input
                    id="input-margem-lucro"
                    type="number"
                    min="0"
                    max="100"
                    value={margemLucro}
                    onChange={(e) => setMargemLucro(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-[#121E2B] border border-[#223952] rounded-lg text-slate-100 text-right font-bold text-xs focus:outline-none focus:border-[#0066FF]"
                  />
                  <span className="text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Desconto Comercial (R$):
                </label>
                <div className="flex items-center gap-1 w-28">
                  <span className="text-xs text-slate-400">R$</span>
                  <input
                    id="input-desconto"
                    type="number"
                    min="0"
                    value={desconto || ''}
                    onChange={(e) => setDesconto(Number(e.target.value))}
                    placeholder="0,00"
                    className="w-full px-2 py-1 bg-[#121E2B] border border-[#223952] rounded-lg text-slate-100 text-right font-bold text-xs focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>
            </div>

            {/* Grand Total Highlight Box */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#0F1B27] via-[#16293D] to-[#0F1B27] border-2 border-blue-500/40 shadow-xl space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-300">
                  VALOR TOTAL DO SERVIÇO
                </span>
                <span className="text-2xl font-black text-white tracking-tight">
                  {formatCurrencyBRL(totals.valorTotal)}
                </span>
              </div>

              {/* 50% Signal Condition Breakdown */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-500/30 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40">
                  <span className="block text-[10px] font-bold text-emerald-300 uppercase">
                    Sinal 50% (Entrada)
                  </span>
                  <span className="text-sm font-black text-emerald-100">
                    {formatCurrencyBRL(totals.valorSinal50)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0A0A0C]/90 border border-slate-700">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">
                    Saldo Restante (Entrega)
                  </span>
                  <span className="text-sm font-bold text-slate-200">
                    {formatCurrencyBRL(totals.valorRestante50)}
                  </span>
                </div>
              </div>

              {/* Chave Pix Quick Reference */}
              <div className="pt-2 text-[11px] text-slate-300 flex items-center justify-between border-t border-blue-500/20">
                <span className="text-slate-400">Chave Pix da Oficina:</span>
                <span className="font-mono text-yellow-400 font-bold truncate max-w-[180px]">
                  {workshop.chavePix}
                </span>
              </div>
            </div>

            {/* Execution Days & General Notes */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Prazo Estimado de Entrega:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-prazo-dias"
                    type="number"
                    min="1"
                    max="60"
                    value={prazoDias}
                    onChange={(e) => setPrazoDias(Number(e.target.value))}
                    className="w-14 px-2 py-1 bg-[#0A0A0C] border border-[#223952] rounded-lg text-slate-100 text-center font-bold"
                  />
                  <span className="text-slate-400">dias úteis</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Observações e Termos de Garantia
                </label>
                <textarea
                  id="textarea-obs-gerais"
                  rows={2}
                  value={obsGerais}
                  onChange={(e) => setObsGerais(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0C] border border-[#223952] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-[#0066FF] resize-none"
                />
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 pt-2">
              {/* WhatsApp Direct Send */}
              <button
                id="btn-enviar-whatsapp"
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-[0.99]"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Orçamento no WhatsApp</span>
              </button>

              {/* View / Print PDF Modal */}
              <button
                id="btn-imprimir-pdf"
                type="button"
                onClick={handlePrint}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#0066FF] to-[#004DB3] hover:from-[#1A73E8] hover:to-[#0066FF] text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Visualizar / Imprimir Orçamento Timbrado</span>
              </button>

              {/* Save Quote */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  id="btn-salvar-orcamento"
                  type="button"
                  onClick={handleSave}
                  className="py-2.5 px-3 bg-[#0A0A0C] hover:bg-[#162536] text-blue-300 hover:text-white border border-[#223952] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Registro</span>
                </button>

                <button
                  id="btn-limpar-campos"
                  type="button"
                  onClick={editingQuote ? onCancelEdit : handleReset}
                  className="py-2.5 px-3 bg-[#0A0A0C] hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-[#223952] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{editingQuote ? 'Cancelar Edição' : 'Limpar Tudo'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
