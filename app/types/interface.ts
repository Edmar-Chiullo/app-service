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
  id: string;
  descricao: string;
  tipo: 'servico' | 'peca';
  quantidade: number;
  valor_unitario: number;
}

export interface OrdemServico {
  placa: string;
  nomeCliente: string;
  cpfCliente: string;
  dataAbertura: number;
  dataFechamento: number | 'none';
  status: 'Aberta' | 'Finalizada' | 'Cancelada';
  itens: ItemOS[];
}