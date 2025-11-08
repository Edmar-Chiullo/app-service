import { child, get, ref } from 'firebase/database';
import { MOCKED_OS_RECORDS } from '../data/data-service';
import { db } from '../data/firebase-data';
import { calculateTotal, formatDate } from '../utils/utils';

export async function getServices(query: string) {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `orderService/${formatDate(Date.now()).replace(/\//g, '')}/`));
  if (snapshot.exists()) {
    const osList = Object.values(snapshot.val());
      // const service = osList
      //   .map(os => ({...os, totalGeral: calculateTotal(os.itens)}))
      //   .filter(os => {
      //     const matchesSearch = os.placa.includes(query.toUpperCase()) || os.nomeCliente.toUpperCase().includes(query.toUpperCase());
      //     //const matchesStatus = query === 'Todos' || os.status === query;
      //     return matchesSearch //&& matchesStatus;
      //   })
      //   .sort((a, b) => b.dataAbertura - a.dataAbertura);
      // return service;
      return osList;
  } else {
    return false
  }
  // }).catch((error) => {
  //   console.error(error);
  // });
}
