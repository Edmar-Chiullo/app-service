import CreateService from "@/app/component-ui/CreateOrderService";
import { COMPONENT_LIST, SERVICE_LIST } from "@/app/data/data-service";
import { ComponentListProps, ServiceListProps } from "@/app/types/interface";

export default async function Page(props: {searchParams?: Promise<{query?: string; page?: string;}>}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';
    
    const termoLower = query.toLowerCase();

    const SERVICELIST:ServiceListProps[] = SERVICE_LIST
    const PARTSLIST: ComponentListProps[] = COMPONENT_LIST

    const resultados = SERVICELIST.filter(item => {
        
        const nomeLower = item.name.toLowerCase();
        const idLower = item.id.toString().toUpperCase();

        return nomeLower.includes(termoLower) || idLower.includes(termoLower);
    });

    console.log(resultados)



    return (
        <div>
            <CreateService serviceList={resultados} partsList={PARTSLIST} />
        </div>
    );
}