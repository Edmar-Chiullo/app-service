export interface ItemCatalogoBase {
  id: string;
  nome: string;
  codigo: string;
}

export interface Servico extends ItemCatalogoBase {
  tipo: 'servico';
  tempo_estimado_minutos: number;
}

export interface Peca extends ItemCatalogoBase {
  tipo: 'peca';
  unidade_medida: string;
  codigo_fabrica: string;
}

export interface ItemOS {
  id: string | number;
  descricao: string;
  tipo: 'servico' | 'peca';
  quantidade: number;
  valor_unitario: number;
}

export interface OrdemServico {
  id: string | number;
  modelo: string | number;
  nomeCliente: string;
  dataAbertura: number | string;
  dataFechamento: number | 'none' | string;
  status: 'Aberta' | 'Finalizada' | 'Cancelada';
  itens: ItemOS[];
}

// TIPAGEM DE DADOS
export interface OSListProps {
  id: string | number;
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
  ano?: string;
  marca?: string;
  modelo?: string;
  status: 'Aberta' | 'Finalizada' | 'Cancelada';
  service: string; // Isso parece ser o ID/Path do serviço ou o conjunto de dados completo
}

// Interface auxiliar para o snapshot do Firebase
export interface OsItem extends OSListProps {
    [key: string]: any;
}

// Opções de Status
export type FilterStatus = 'Todos' | 'Aberta' | 'Finalizada' | 'Cancelada';

export interface ServiceListProps {
  id: string | number
  name: string
}

export interface ComponentListProps {
  id: string | number
  name: string
}