import UpdateServiceApp from "@/app/component-ui/OrderUpdateService";
import { COMPONENT_LIST, SERVICE_LIST } from "@/app/data/data-service";
import { getServicesByID } from "@/app/lib/server-function";
import { ComponentListProps, ServiceListProps } from "@/app/types/interface";

export default async function Page(props: { params: Promise<{ id: string }> }) {

    const params = await props.params;
    const serviceID = params.id;

    const LISTSERVICE:ServiceListProps[] = SERVICE_LIST
    const LISTPARTS:ComponentListProps[] = COMPONENT_LIST

    const service:any = await getServicesByID(serviceID)
    console.log(service)
    
    return (
        <div>
            <UpdateServiceApp service={service} serviceList={LISTSERVICE} partsList={LISTPARTS} />
             
        </div>
    );
}