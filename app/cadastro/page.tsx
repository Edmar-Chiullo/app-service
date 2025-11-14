import OSList from "../component-ui/Services";
import { SERVICE_LIST } from "../data/data-service";
import { getServicesByID } from "../lib/server-function";
import { ServiceListProps } from "../types/interface";

export default async function CreateServicePage(props: {searchParams?: Promise<{query?: string; page?: string;}>}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';
    
    const termoLower = query.toLowerCase();
    const LISTSERVICE:ServiceListProps[] = SERVICE_LIST
    

    const resultados = LISTSERVICE.filter(item => {
        const nomeLower = item.name.toLowerCase();
        const idLower = item.id.toString().toUpperCase();
        return nomeLower.includes(termoLower) || idLower.includes(termoLower);
    });
    
    const services:any = await getServicesByID(query)

    return (
        <div>
            <OSList service={Object.values(services)} query={query} />
        </div>
    );
}