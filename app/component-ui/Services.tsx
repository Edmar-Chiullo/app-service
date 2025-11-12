'use client';

import { Activity, useEffect, useState } from 'react';
import { OsItem, OSListProps } from '../types/interface';
import { OrderService } from './OrderService';
import OrderUpdateServiceApp from './OrderUpdateService';
import OrderCreateService from './CreateOrderService';
import { formatDate } from '../utils/utils';
import { db } from '../data/firebase-data';
import { DataSnapshot, onChildAdded, onChildChanged, ref } from 'firebase/database';

interface CompState {
  status: boolean,
  component: string
}

export default function OSList({ service, query }: { service: OSListProps[] | any[], query: string }) {
  const [osList, setOsList] = useState<OSListProps[]>(service || []);
  const [isOrderServise, setIsOrderService] = useState<boolean>(true)
  const [isCrieteServise, setIsCreateService] = useState<boolean>(false)
  const [isUpdateServise, setIsUpdateService] = useState<boolean>(false)

  
  useEffect(() => {
    const initialDate = service[0]?.dataAbertura || Date.now();
    const formattedDate = formatDate(initialDate).replace(/\//g, '');
  
    const dbPath = `orderService/${formattedDate}/`;
    const dbRef = ref(db, dbPath);
  
    const unsubscribeAdd = onChildAdded(dbRef, (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const value: OsItem = snapshot.val();

        if (value && value.placa) {
            setOsList((prev) => {
              const updatedList = prev.map((item) => {
                  // Usa a placa como chave de atualização
                  if (item.placa === value.placa) {
                      // Retorna o valor atualizado do Firebase
                      return value as OSListProps; 
                  }
                  return item;
              });
              return updatedList;
            });
        }
      }
    });

    const unsubscribeChange = onChildChanged(dbRef, (snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
          const value: OsItem = snapshot.val();
          // A chave do Firebase é o ID, que você parece estar tratando como 'placa' no seu código.
          // Para maior segurança, o ID (key) do snapshot deve ser usado, mas mantive a lógica de 'placa' para a correção do estado.
          
          if (value && value.placa) {
            setOsList((prev) => {
              const updatedList = prev.map((item) => {
                  // Usa a placa como chave de atualização
                  if (item.placa === value.placa) {
                      // Retorna o valor atualizado do Firebase
                      return value as OSListProps; 
                  }
                  return item;
              });
              return updatedList;
            });
          }
        }
    });

    return () => {
        unsubscribeAdd()
        unsubscribeChange()
    };
  }, [])
  
  return (
    <>
      <Activity mode={isOrderServise ? "visible" : "hidden"}>
        <OrderService service={osList}/>
      </Activity>
    </>
  );
}