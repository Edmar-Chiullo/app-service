import OrderUpdateServiceApp from "@/app/componentui/OrderUpdateService";
import OSList from "@/app/componentui/Services";
import { getServices } from "@/app/lib/server-function";


export default async function CreateServicePage(props: {searchParams?: Promise<{query?: string; page?: string;}>}) {
        const searchParams = await props.searchParams;
        const query = searchParams?.query || '';
        const currentPage = Number(searchParams?.page) || 1;
    
        const services:any = await getServices(query)
        console.log((await props.searchParams)?.query)
    
    return (
        <div>
            <OrderUpdateServiceApp />
        </div>
    );
}