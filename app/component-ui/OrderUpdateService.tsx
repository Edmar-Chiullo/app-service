'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ComponentListProps, ItemOS, OrdemServico, ServiceListProps } from '../types/interface';
import { ToastContainer, toast } from 'react-toastify';
import { db }  from '../data/firebase-data';
import { ref, set } from "firebase/database";
import { formatDate } from '../utils/utils';
import { useDebouncedCallback } from 'use-debounce';

// --- Componente Principal ---
export default function UpdateServiceApp({ 
  service, 
  serviceList, 
  partsList 
}: {
    service: OrdemServico
    serviceList: ServiceListProps[],
    partsList: ComponentListProps[]
  }) {

  // Estado para armazenar o Catálogo (será substituído pelo fetch do RTDB)
  const [filteredItems, setFilteredItems] = useState<Array<ServiceListProps | ComponentListProps>>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [os, setOs] = useState<OrdemServico>(service);

  const pathname = usePathname();
  const router = useRouter();
  
  // Estado do formulário de adição de item
  const [addItemForm, setAddItemForm] = useState({
    tipoItem: 'servico' as 'servico' | 'peca',
    itemSelecionadoId: '', // ID do item selecionado no catálogo
    quantidade: 1,
    valorUnitario: 0,
  });

  // Retorna a lista de itens do catálogo baseado no tipo selecionado (lista completa)
  const itensCatalogoBase = useMemo(() => {
    return addItemForm.tipoItem === 'servico' ? serviceList : partsList;
  }, [service]);
  

  // Efeito para resetar/atualizar a lista filtrada sempre que o tipo de item mudar
  useEffect(() => {
    setFilteredItems(itensCatalogoBase);
    setSearchTerm(''); // Limpa o termo de busca ao trocar o tipo
    setAddItemForm(p => ({ ...p, itemSelecionadoId: '' })); // Limpa a seleção
  }, [addItemForm.tipoItem, itensCatalogoBase]);


  // 2. FUNÇÃO DE FILTRO COM DEBOUNCE (COM NORMALIZAÇÃO E LIMPEZA)
  const handleDebouncedSearch = useDebouncedCallback((term: string) => {
    // 1. Aplica Normalização e Limpeza no Termo de Busca
    const termoNormalizado = term
        .toLowerCase()
        .normalize("NFD") // Decompõe os caracteres (ex: 'á' vira 'a' + acento)
        .replace(/[\u0300-\u036f]/g, "") // Remove os acentos e diacríticos
        .replace(/[^\w\s]/g, ""); // Remove pontuação e outros caracteres não alfanuméricos

    if (!termoNormalizado) {
        setFilteredItems(itensCatalogoBase);
        return;
    }
    
    // Filtragem em múltiplos campos: nome e id
    const resultados = itensCatalogoBase.filter(item => {
        // 2. Aplica Normalização e Limpeza no Nome do Item
        const nomeNormalizado = item.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s]/g, "");

        // O ID geralmente não tem acentos, mas limpamos pontuação para consistência
        const idNormalizado = String(item.id)
            .toLowerCase()
            .replace(/[^\w\s]/g, "");

        // Verifica se o termo está contido no nome OU no ID
        return nomeNormalizado.includes(termoNormalizado) || idNormalizado.includes(termoNormalizado);
    });

    setFilteredItems(resultados);
  }, 100); // 300ms de atraso é um bom valor


  // Cálculo dos totais
  const { totalServicos, totalPecas, totalGeral } = useMemo(() => {
    let totalServicos = 0;
    let totalPecas = 0;
    os.itens.forEach((item:any) => {
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

    // Passo 1: Normalizar o termo de busca final para encontrar a correspondência
    const termoBuscaNormalizado = searchTerm
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, "");

    // Passo 2: Encontrar o item no catálogo COMPLETO usando o nome normalizado
    const itemEncontradoPeloNome = itensCatalogoBase.find(item => {
        const nomeItemNormalizado = item.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s]/g, "");
        
        // Verifica a correspondência exata
        return nomeItemNormalizado === termoBuscaNormalizado;
    });

    // Se o usuário digitou, mas não selecionou um item válido (ex: só parte do nome)
    if (!itemEncontradoPeloNome || addItemForm.quantidade <= 0 || addItemForm.valorUnitario <= 0) {
        toast.error('Selecione um item válido do catálogo, e certifique-se de que a quantidade e o valor unitário são maiores que zero.',
            { position: "top-right", autoClose: 3000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined }
        );
        return;
    }

    // Usamos as informações do item encontrado
    const novoItemOS: ItemOS = {
      id: Math.random().toString(36).substring(2, 9), // ID único para o item na OS
      descricao: itemEncontradoPeloNome.name,
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

    setSearchTerm(''); // Limpa o termo de busca após adicionar
    setFilteredItems(itensCatalogoBase); // Restaura a lista completa
  };

  // Função para remover item da OS
  const handleRemoveItem = (id: string) => {
    setOs(prevOs => ({
      ...prevOs,
      itens: prevOs.itens.filter((item:any) => item.id !== id),
    }));
  };

  // Função para salvar a OS (Placeholder para conexão RTDB)
  const handleSaveOS = () => {
 
    if (os.placa && os.nomeCliente && os.itens.length > 0) { // Adicionado check de itens
      toast.success(`Ordem de Serviço (para o veículo: ${os.placa}) salva com sucesso!`,
        { position: "top-right", autoClose: 3000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined }
      );
    } else {
      toast.error('Preencha a Placa, Nome do Cliente e adicione pelo menos 1 item antes de salvar.',
        { position: "top-right", autoClose: 3000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined }
      );
    }

   // ... (lógica de salvar)
    set(ref(db, `orderService/${formatDate(os.dataAbertura as number).replace(/\//g, '')}/${os.placa}`), {
      placa: os.placa,
      ano: os.ano,
      marca: os.marca,
      modelo: os.modelo,
      nomeCliente: os.nomeCliente,
      cpfCliente: os.cpfCliente,
      dataAbertura: os.dataAbertura,
      dataFechamento: os.dataFechamento,
      status: os.status,
      itens: os.itens
    });

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
    
    router.push(`/cadastro`)
  };

  // Renderiza a tabela de itens na OS (CORRIGIDO CONTRA ERRO DE HYDRATION)
  const renderOsItemsTable = () => (
    <div className="overflow-x-auto shadow-md rounded-xl">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-indigo-50"><tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Descrição</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Tipo</th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-700 uppercase tracking-wider">Qtd</th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-700 uppercase tracking-wider">Vl. Unitário</th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-700 uppercase tracking-wider">Total</th>
          <th className="px-4 py-3"></th>
        </tr></thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {os.itens.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-4 text-gray-500 italic">Nenhum serviço ou peça adicionada.</td></tr>
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
          Editar Ordem de Serviço (OS)
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
            
            {/* INPUT COM DEBOUNCE E DATALIST */}
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Item do Catálogo (Busca)</label>
              <input
                type="text"
                list="catalogo-datalist" // Conecta este input ao datalist
                value={searchTerm}
                // NO ONCHANGE: Atualiza o estado local e chama a função debounced
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  handleDebouncedSearch(value); // Dispara o debounce
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-500"
                placeholder="Digite para buscar..."
                required
              />
              
              {/* O DATALIST: Exibe as opções filtradas em tempo real */}
              <datalist id="catalogo-datalist">
                {filteredItems.map(item => (
                  <option key={item.id} value={item.name}>
                    {item.id} 
                  </option>
                ))}
              </datalist>
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