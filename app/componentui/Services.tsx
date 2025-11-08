'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { formatDate } from '../utils/utils';
import { DataSnapshot, onChildChanged, ref, update } from 'firebase/database';
import { db } from '../data/firebase-data';

// TIPAGEM DE DADOS
interface OSListProps {
  id: string;
  cpfCliente: string;
  dataAbertura: number;
  itens: Array<{
    id: string;
    descricao: string;
    valor_unitario: number;
    quantidade: number;
  }>;
  nomeCliente: string;
  placa: string;
  status: 'Aberta' | 'Finalizada' | 'Cancelada';
  service: string; // Isso parece ser o ID/Path do serviço ou o conjunto de dados completo
}

// Interface auxiliar para o snapshot do Firebase
interface OsItem extends OSListProps {
    [key: string]: any;
}

// Opções de Status
type FilterStatus = 'Todos' | 'Aberta' | 'Finalizada' | 'Cancelada';

export default function OSList({ service }: { service: OSListProps[] | any[] }) {
  // Estado inicializado com a prop 'service'
  const [osList, setOsList] = useState<OSListProps[]>(service || []);
  
  // Usamos useSearchParams para obter os valores atuais dos filtros na URL
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Obtém os filtros da URL
  const currentQuery = searchParams.get('query')?.toString() || '';
  const currentStatus = searchParams.get('status')?.toString() as FilterStatus || 'Todos';

  const statusOptions = ['Aberta', 'Finalizada', 'Cancelada'];

  // 1. Sincroniza o estado local 'osList' com a prop 'service'
  useEffect(() => {
    // Isso é crucial para garantir que os dados iniciais sejam carregados corretamente.
    if (service && service.length > 0) {
      setOsList(service);
    }
  }, [service]);
  
// ----------------------------------------------------------------------
// 2. LÓGICA DE FILTRAGEM (USANDO useMemo)
// ----------------------------------------------------------------------

  // A lista filtrada é calculada apenas quando 'osList', 'currentQuery' ou 'currentStatus' mudam.
  const filteredOsList = useMemo(() => {
    let list = osList;

    // A. Filtro por Termo de Busca (Placa ou Cliente)
    if (currentQuery) {
      const termo = currentQuery.toLowerCase();
      list = list.filter(
        (os) => 
          os.placa.toLowerCase().includes(termo) || 
          os.nomeCliente.toLowerCase().includes(termo)
      );
    }

    // B. Filtro por Status
    if (currentStatus && currentStatus !== 'Todos') {
      list = list.filter((os) => os.status === currentStatus);
    }

    return list;
  }, [osList, currentQuery, currentStatus]);


// ----------------------------------------------------------------------
// 3. FUNÇÕES DE BUSCA E FILTRO (MANIPULAÇÃO DA URL)
// ----------------------------------------------------------------------

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1'); // Volta para a primeira página ao buscar
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  const handleStatusFilterChange = (status: FilterStatus) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (status && status !== 'Todos') {
      params.set('status', status); // Usa 'status' como chave para o filtro
    } else {
      params.delete('status');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  const handleStatusDetail = (status: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (status && status !== 'Todos') {
      params.set('status', status); // Usa 'status' como chave para o filtro
    } else {
      params.delete('status');
    }
    replace(`${pathname}?${params.toString()}`);
  }

// ----------------------------------------------------------------------
// 4. LÓGICA DO FIREBASE (onChildChanged)
// ----------------------------------------------------------------------

  useEffect(() => {
    // Verifica se 'service' é um array e se tem dados para evitar erros de tipagem/lógica.
    if (!Array.isArray(service) || service.length === 0) return;

    // Assumindo que a data é a do primeiro item para montar o path de hoje.
    // É mais seguro usar uma data fixa ou o path base se for buscar todos os dados.
    const initialDate = service[0]?.dataAbertura || Date.now();
    const formattedDate = formatDate(initialDate).replace(/\//g, '');
    
    // Supondo que você está ouvindo todas as alterações de OSs de um determinado dia.
    const dbPath = `orderService/${formattedDate}/`;
    const dbRef = ref(db, dbPath);

    const unsubscribeChange = onChildChanged(dbRef, (snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
            const value: OsItem = snapshot.val();
            // A chave do Firebase é o ID, que você parece estar tratando como 'placa' no seu código.
            // Para maior segurança, o ID (key) do snapshot deve ser usado, mas mantive a lógica de 'placa' para a correção do estado.
            
            if (value && value.placa) {
                setOsList((prev) => {
                  const updatedList = prev.map((item) => {
                      // Usa a placa como chave de atualização
                      if (item.placa === value.placa) {
                          // Retorna o valor atualizado do Firebase
                          return value as OSListProps; 
                      }
                      return item;
                  });
                  return updatedList;
                });
            }
        }
    });

    return () => {
        unsubscribeChange();
    };
  }, [service]); // Depende da prop 'service' para inicializar o listener

// ----------------------------------------------------------------------
// 5. ATUALIZAÇÃO DO STATUS (FIREBASE E ESTADO)
// ----------------------------------------------------------------------

  const updateStatus = async ({ status, placa }: { status: string, placa: string }) => {
    // 1. Encontra a OS no estado para pegar a 'dataAbertura' correta
    const osToUpdate = osList.find(os => os.placa === placa);

    if (!osToUpdate) {
        console.error('OS não encontrada para a placa:', placa);
        return;
    }

    const path = `orderService/${formatDate(osToUpdate.dataAbertura).replace(/\//g, '')}/${placa}`;
    
    try {
        // 2. Atualiza o Firebase
        await update(ref(db, path), {
            status: status
        });

        // 3. O 'onChildChanged' do Firebase se encarregará de atualizar o estado `osList`.
        // Você pode remover a atualização manual do estado `setOsList` que estava aqui,
        // pois o useEffect fará a sincronização, garantindo que o estado reflita o DB.
        
        // Se a atualização do Firebase falhar, a UI não é atualizada.
        return { success: true, message: 'Status atualizado com sucesso!' };

    } catch (erro) {
        console.error('Falha ao atualizar o status no Firebase:', erro);
        return {
            success: false,
            message: 'Falha ao gravar o status!'
        };
    }
  }

// ----------------------------------------------------------------------
// 6. FUNÇÕES AUXILIARES E RENDERIZAÇÃO
// ----------------------------------------------------------------------

  const calculateTotal = (itens: OSListProps['itens']) => {
    const total = itens.reduce((acc, item) => acc + item.valor_unitario * item.quantidade, 0);
    return `R$ ${total.toFixed(2).replace('.', ',')}`;
  }
  
  // Função de estilo adaptada (removida do escopo do componente para evitar re-render desnecessário)
  // Foi mantida localmente para referência, mas o ideal é importá-la do seu utils.
  const getStatusStyleLocal = (status: 'Aberta' | 'Finalizada' | 'Cancelada') => {
    switch (status) {
      case 'Aberta':
        return 'bg-blue-100 text-blue-800 border-blue-500'; 
      case 'Finalizada':
        return 'bg-green-100 text-green-800 border-green-500';
      case 'Cancelada':
        return 'bg-red-100 text-red-800 border-red-500';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      {/* ... (Header e Botão de Nova OS - Não alterado) ... */}
      <header className="mb-8 flex justify-between items-center flex-wrap gap-4">
         <h1 className="text-3xl font-extrabold text-indigo-700">
           Ordens de Serviço
         </h1>
         <button
           onClick={() => router.push('/cadastro/create-service')}
           className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150 shadow-md flex items-center gap-2"
         >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
           Nova OS
         </button>
      </header>
      
      {/* Filtros e Busca */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Buscar por Placa ou Cliente</label>
          <input
            type="text"
            defaultValue={currentQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-500"
            placeholder="Ex: ABC1234 ou Ana Silva"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={currentStatus} // Usa o valor da URL
            onChange={(e) => handleStatusFilterChange(e.target.value as FilterStatus)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-500"
          >
            <option value="Todos">Todos</option>
            <option value="Aberta">Aberta</option>
            <option value="Finalizada">Finalizada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Tabela de Listagem */}
      <div className="overflow-x-auto shadow-xl rounded-xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-indigo-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">OS ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Placa</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">CPF Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Data Abertura</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredOsList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-500 italic">
                      Nenhuma Ordem de Serviço encontrada.
                  </td>
                </tr>
              ) : ( 
                filteredOsList.map((os: OSListProps) => ( 	 	 	 	 
                  <tr key={os.placa} className="hover:bg-gray-50 transition duration-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{os.itens[0]?.id.toUpperCase()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">{os.placa}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{os.nomeCliente}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{os.cpfCliente}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{formatDate(os.dataAbertura)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-right text-gray-600">{calculateTotal(os.itens)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <select 
                        value={os.status} 
                        onChange={(e) => updateStatus({status: e.target.value, placa: os.placa})} 
                        className={`px-3 py-1 inline-flex text-md leading-5 font-semibold rounded-full hover:cursor-pointer border ${getStatusStyleLocal(os.status)}`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                            onClick={() => handleStatusDetail(os.itens[0]?.id)}
                            className="text-indigo-600 hover:text-indigo-900 transition duration-150 font-semibold hover:cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Ver Detalhes
                        </button>
                    </td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}