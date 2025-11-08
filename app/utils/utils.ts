import { ItemOS, OrdemServico } from "../types/interface";

// Função auxiliar para calcular o total de uma OS (reuso de lógica)
export const calculateTotal = (itens: ItemOS[]): number => {
    return itens.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0);
};

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
