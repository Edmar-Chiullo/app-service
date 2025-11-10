'use client';
import React, { useState, useMemo } from 'react';
import { useRouter} from 'next/navigation';
import { ItemOS, OrdemServico, Peca, Servico } from '../types/interface';
import { MOCKED_CATALOG_PARTS, MOCKED_CATALOG_SERVICES } from '../data/data-service';
import { ToastContainer, toast } from 'react-toastify';
import { db }  from '../data/firebase-data';
import { ref, set } from "firebase/database";
import { formatDate } from '../utils/utils';

interface CompState {
  status: boolean,
  component: string
}

// --- Componente Principal ---
export default function OrderCreateService({ toggle }: {toggle: (status: CompState)=> void}) {
  
  // Estado para armazenar o Catálogo (será substituído pelo fetch do RTDB)
  const [catalogoServicos, setCatalogoServicos] = useState<Servico[]>(MOCKED_CATALOG_SERVICES);
  const [catalogoPecas, setCatalogoPecas] = useState<Peca[]>(MOCKED_CATALOG_PARTS);

  // Estado da Ordem de Serviço
  const [os, setOs] = useState<OrdemServico>({
    placa: '',
    ano: '',
    marca: '',
    modelo: '',
    nomeCliente: '',
    cpfCliente: '',
    dataAbertura: Date.now(),
    dataFechamento: 'none',
    status: 'Aberta',
    itens: [],
  });

  // Estado do formulário de adição de item
  const [addItemForm, setAddItemForm] = useState({
    tipoItem: 'servico' as 'servico' | 'peca',
    itemSelecionadoId: '',
    quantidade: 1,
    valorUnitario: 0,
  });

  // Cálculo dos totais
  const { totalServicos, totalPecas, totalGeral } = useMemo(() => {
    let totalServicos = 0;
    let totalPecas = 0;

    os.itens.forEach(item => {
      const totalItem = item.quantidade * item.valor_unitario;
      if (item.tipo === 'servico') {
        totalServicos += totalItem;
      } else {
        totalPecas += totalItem;
      }
    });

    return {
      totalServicos: totalServicos,
      totalPecas: totalPecas,
      totalGeral: totalServicos + totalPecas,
    };
  }, [os.itens]);

  // Função para adicionar item à OS
  const handleAddItemToOS = (e: React.FormEvent) => {
    e.preventDefault();

    const catalogoAtual = addItemForm.tipoItem === 'servico' ? catalogoServicos : catalogoPecas;
    const itemEncontrado = catalogoAtual.find(item => item.id === addItemForm.itemSelecionadoId);

    if (!itemEncontrado || addItemForm.quantidade <= 0 || addItemForm.valorUnitario <= 0) {
      toast.error('Selecione um item válido, quantidade e valor unitário maiores que zero.',
        { position: "top-right", autoClose: 3000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined }
      );
      return;
    }

    const novoItemOS: ItemOS = {
      id: Math.random().toString(36).substring(2, 9), // ID único para o item na OS
      descricao: itemEncontrado.nome,
      tipo: addItemForm.tipoItem,
      quantidade: addItemForm.quantidade,
      valor_unitario: addItemForm.valorUnitario,
    };

    setOs(prevOs => ({
      ...prevOs,
      itens: [...prevOs.itens, novoItemOS],
    }));

    // Resetar o formulário de adição
    setAddItemForm({
      tipoItem: addItemForm.tipoItem,
      itemSelecionadoId: '',
      quantidade: 1,
      valorUnitario: 0,
    });
  };

  // Função para remover item da OS
  const handleRemoveItem = (id: string) => {
    setOs(prevOs => ({
      ...prevOs,
      itens: prevOs.itens.filter(item => item.id !== id),
    }));
  };

  // Função para salvar a OS (Placeholder para conexão RTDB)
  const handleSaveOS = () => {
    set(ref(db, `orderService/${formatDate(os.dataAbertura as number).replace(/\//g, '')}/${os.placa}`), {
      placa: os.placa,
      ano: os.ano,
      marca: os.marca,
      modelo: os.modelo,
      nomeCliente: os.nomeCliente,
      cpfCliente: os.cpfCliente,
      dataAbertura: os.dataAbertura,
      status: os.status,
      itens: os.itens
    });

    if (os.placa && os.nomeCliente) {
      toast.success(`Ordem de Serviço (para o veículo: ${os.placa}) salva com sucesso!`,
        { position: "top-right", autoClose: 3000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined }
      );
    } else {
      toast.error('Preencha a Placa, Nome do Cliente e adicione pelo menos 1 item antes de salvar.',
        { position: "top-right", autoClose: 3000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined }
      );
    }

    // Resetar a OS após salvar
    setOs({
      placa: '',
      ano: '',
      marca: '',
      modelo: '',
      nomeCliente: '',
      cpfCliente: '',
      dataAbertura: Date.now(),
      dataFechamento: 'none',
      status: 'Aberta',
      itens: [],
    });

    toggle({component: 'serView', status: true})
  };

  // Retorna a lista de itens do catálogo baseado no tipo selecionado
  const itensCatalogo = addItemForm.tipoItem === 'servico' ? catalogoServicos : catalogoPecas;

  // Renderiza a tabela de itens na OS
  const renderOsItemsTable = () => (
    <div className="overflow-x-auto shadow-md rounded-xl">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-indigo-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Descrição</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Tipo</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-700 uppercase tracking-wider">Qtd</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-700 uppercase tracking-wider">Vl. Unitário</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-700 uppercase tracking-wider">Total</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {os.itens.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-4 text-gray-500 italic">Nenhum serviço ou peça adicionada.</td>
            </tr>
          ) : (
            os.itens.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-500">{item.descricao}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full  ${item.tipo === 'servico' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {item.tipo === 'servico' ? 'Serviço' : 'Peça'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">{item.quantidade}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">R$ {item.valor_unitario.toFixed(2).replace('.', ',')}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-right text-gray-500">R$ {(item.quantidade * item.valor_unitario).toFixed(2).replace('.', ',')}</td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 transition duration-150">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <ToastContainer />
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-indigo-700">
          Abertura e Detalhes da Ordem de Serviço (OS)
        </h1>
        <p className="text-gray-500 mt-1">Status: <span className="font-bold text-green-600">{os.status}</span></p>
      </header>

      <main className="space-y-8">
        {/* --- 1. DETALHES GERAIS DA OS / CLIENTE --- */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-indigo-500">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dados do Cliente e Veículo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Placa do Veículo</label>
              <input
                type="text"
                value={os.placa}
                onChange={(e) => setOs(p => ({ ...p, placa: e.target.value.toUpperCase() }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 uppercase text-gray-500"
                placeholder="Ex: ABC1234"
                maxLength={7}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome do Cliente</label>
              <input
                type="text"
                value={os.nomeCliente}
                onChange={(e) => setOs(p => ({ ...p, nomeCliente: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-500"
                placeholder="João da Silva"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CPF do Cliente (Opcional)</label>
              <input
                type="text"
                value={os.cpfCliente}
                onChange={(e) => setOs(p => ({ ...p, cpfCliente: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-500"
                placeholder="123.456.789-00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ano do Veículo</label>
              <input
                type="text"
                value={os.ano}
                onChange={(e) => setOs(p => ({ ...p, ano: e.target.value.toUpperCase() }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 uppercase text-gray-500"
                placeholder="Ex: 2025"
                maxLength={7}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Marca do Veículo</label>
              <input
                type="text"
                value={os.marca}
                onChange={(e) => setOs(p => ({ ...p, marca: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-500"
                placeholder="Ex: Volkswagen"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Modelo do Veículo</label>
              <input
                type="text"
                value={os.modelo}
                onChange={(e) => setOs(p => ({ ...p, modelo: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-500"
                placeholder="Ex: VW Gol"
                required
              />
            </div>
          </div>
          
        </div>

        {/* --- 2. ADICIONAR ITENS (SERVIÇOS/PEÇAS) --- */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-500">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Adicionar Itens à OS</h2>
          <form onSubmit={handleAddItemToOS} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
            {/* Tipo de Item (Serviço/Peça) */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select
                value={addItemForm.tipoItem}
                onChange={(e) => setAddItemForm(p => ({ ...p, tipoItem: e.target.value as 'servico' | 'peca', itemSelecionadoId: '' }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              >
                <option value="servico">Serviço</option>
                <option value="peca">Peça</option>
              </select>
            </div>

            {/* Seleção do Item do Catálogo */}
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Item do Catálogo</label>
              <select
                value={addItemForm.itemSelecionadoId}
                onChange={(e) => setAddItemForm(p => ({ ...p, itemSelecionadoId: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-500"
                required
              >
                <option value="">Selecione um item...</option>
                {itensCatalogo.map(item => (
                  <option key={item.id} value={item.id}>{item.nome} ({item.codigo})</option>
                ))}
              </select>
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Qtd</label>
              <input
                type="number"
                value={addItemForm.quantidade}
                onChange={(e) => setAddItemForm(p => ({ ...p, quantidade: Math.max(1, parseInt(e.target.value) || 0) }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-right text-gray-500"
                min="1"
                required
              />
            </div>

            {/* Valor Unitário */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Vl. Unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                value={addItemForm.valorUnitario || ''}
                onChange={(e) => setAddItemForm(p => ({ ...p, valorUnitario: parseFloat(e.target.value) || 0}))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-right text-gray-500"
                min="0.01"
                required
              />
            </div>
            
            {/* Botão Adicionar */}
            <div className="col-span-1 sm:col-span-1">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150 shadow-md transform hover:scale-[1.02]"
              >
                Adicionar
              </button>
            </div>
          </form>
        </div>
                
        {/* --- 3. LISTA DE ITENS DA OS E TOTAIS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Itens da Ordem</h2>
            {renderOsItemsTable()}
          </div>
          
          {/* TOTAIS */}
          <div className="lg:col-span-1">
            <div className="bg-indigo-50 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-indigo-700 mb-4">Resumo Financeiro</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total Serviços:</span>
                  <span className="font-medium">R$ {totalServicos.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total Peças:</span>
                  <span className="font-medium">R$ {totalPecas.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="border-t border-indigo-200 pt-4 flex justify-between items-center text-2xl font-extrabold text-indigo-800">
                  <span>TOTAL GERAL:</span>
                  <span>R$ {totalGeral.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
            
            {/* BOTÃO DE AÇÃO PRINCIPAL */}
            <div className="mt-6">
              <button
                onClick={handleSaveOS}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-3 px-4 rounded-lg transition duration-150 shadow-xl transform hover:scale-[1.01]"
              >
                Salvar Ordem de Serviço
              </button>
              <p className="text-xs text-center text-gray-400 mt-2">Pronto para conectar ao seu RTDB.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
