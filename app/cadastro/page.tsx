import OSList from "../componentui/Services";
import { getServices } from "../lib/server-function";

export default async function CreateServicePage(props: {searchParams?: Promise<{query?: string; page?: string;}>}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';

    const services:any = await getServices(query)
    return (
        <div>
            <OSList service={services} query={query} />
        </div>
    );
}