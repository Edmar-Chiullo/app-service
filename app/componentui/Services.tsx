'use client';

import { Activity, useState } from 'react';
import { OSListProps } from '../types/interface';
import { OrderService } from './OrderService';
import OrderUpdateServiceApp from './OrderUpdateService';
import OrderCreateService from './CreateOrderService';

interface CompState {
  status: boolean,
  component: string
}

export default function OSList({ service, query }: { service: OSListProps[] | any[], query: string }) {
  const [isOrderServise, setIsOrderService] = useState<boolean>(true)
  const [isCrieteServise, setIsCreateService] = useState<boolean>(false)
  const [isUpdateServise, setIsUpdateService] = useState<boolean>(false)

  function toggleService({...value}:CompState) {
    switch(value.component) {
      case 'serView':
        setIsOrderService(true)
        setIsCreateService(false)  
        setIsUpdateService(false)
        break
      case 'creService':
        setIsCreateService(true)
        setIsOrderService(false)
        break
      case 'upService': 
        setIsUpdateService(true)
        setIsOrderService(false)
        break      
      default:
        return
    }
  }
  
  return (
    <>
      <Activity mode={isOrderServise ? "visible" : "hidden"}>
        <OrderService service={service} toggle={toggleService}/>
      </Activity>
      <Activity mode={isCrieteServise ? "visible" : "hidden"}>
        <OrderCreateService toggle={toggleService}/>
      </Activity>
      <Activity mode={isUpdateServise ? "visible" : "hidden"}>
        <OrderUpdateServiceApp toggle={toggleService} query={query}/>
      </Activity>
    </>
  );
}