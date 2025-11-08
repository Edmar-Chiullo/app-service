import { ItemOS, OrdemServico, Peca, Servico } from '../types/interface';

export const MOCKED_OS_RECORDS: (OrdemServico & { id: string })[] = [
  {
    id: 'os-12345',
    placa: 'XYZ7890',
    nomeCliente: 'Ana Silva',
    cpfCliente: '111.111.111-11',
    dataAbertura: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 dias atrás
    status: 'Finalizada',
    itens: [
      { id: 'i1', descricao: 'Troca de Óleo e Filtro', tipo: 'servico', quantidade: 1, valor_unitario: 80.00 },
      { id: 'i2', descricao: 'Filtro de Óleo', tipo: 'peca', quantidade: 1, valor_unitario: 35.50 },
    ] as ItemOS[],
  },
  {
    id: 'os-67890',
    placa: 'JHF5678',
    nomeCliente: 'Carlos Souza',
    cpfCliente: '222.222.222-22',
    dataAbertura: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 dia atrás
    status: 'Aberta',
    itens: [
      { id: 'i3', descricao: 'Reparo de Motor de Partida', tipo: 'servico', quantidade: 1, valor_unitario: 150.00 },
      { id: 'i4', descricao: 'Bateria Automotiva', tipo: 'peca', quantidade: 1, valor_unitario: 450.00 },
      { id: 'i5', descricao: 'Diagnóstico Eletrônico', tipo: 'servico', quantidade: 1, valor_unitario: 50.00 },
    ] as ItemOS[],
  },
  {
    id: 'os-98765',
    placa: 'KMN1011',
    nomeCliente: 'Beatriz Costa',
    cpfCliente: '333.333.333-33',
    dataAbertura: Date.now(),
    status: 'Aberta',
    itens: [] as ItemOS[]
  },
];

export const MOCKED_CATALOG_SERVICES: Servico[] = [
  { id: 's1', nome: 'Troca de Óleo e Filtro', codigo: 'SERV-002', tipo: 'servico', tempo_estimado_minutos: 45 },
  { id: 's2', nome: 'Alinhamento e Balanceamento', codigo: 'SERV-003', tipo: 'servico', tempo_estimado_minutos: 90 },
  { id: 's3', nome: 'Diagnóstico Eletrônico', codigo: 'ELE-001', tipo: 'servico', tempo_estimado_minutos: 60 },
];

export const MOCKED_CATALOG_PARTS: Peca[] = [
  { id: 'p1', nome: 'Filtro de Óleo', codigo: 'FO-04', tipo: 'peca', unidade_medida: 'un', codigo_fabrica: 'FO-04' },
  { id: 'p2', nome: 'Pastilha de Freio (Jogo)', codigo: 'PF-01', tipo: 'peca', unidade_medida: 'un', codigo_fabrica: 'PF-01' },
];