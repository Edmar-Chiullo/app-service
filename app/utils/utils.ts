import { OrdemServico, OSListProps } from "../types/interface";

export const calculateTotal = (itens: OSListProps['itens']) => {
    const total = itens.reduce((acc, item) => acc + item.valor_unitario * item.quantidade, 0);
    return `R$ ${total.toFixed(2).replace('.', ',')}`;
  }

// Função utilitária para formatar a data
export const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

// Mapeamento de status para estilos Tailwind
export const getStatusStyle = (status: OrdemServico['status']) => {
    switch (status) {
        case 'Aberta': return 'bg-yellow-100 text-yellow-800';
        case 'Finalizada': return 'bg-green-100 text-green-800';
        case 'Cancelada': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

// Captura o dias da semana
export function rangeWeek() {
    const hoje = new Date();
    const primeiroDiaSemana = new Date(hoje);
    const date = hoje.getDay()
    primeiroDiaSemana.setDate(hoje.getDate() - date)

    return { primeiroDiaSemana: primeiroDiaSemana.getDay(), diaDeHoje: date}
}