import OSList from "../componentui/Services";
import { getServices } from "../lib/server-function";

export default async function CreateServicePage(props: {searchParams?: Promise<{query?: string; page?: string;}>}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';
    const currentPage = Number(searchParams?.page) || 1;

    const services:any = await getServices(query)
    return (
        <div>
            <OSList service={services} />
        </div>
    );
}