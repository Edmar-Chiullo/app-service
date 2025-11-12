import { child, get, ref } from 'firebase/database';
import { db } from '../data/firebase-data';
import { formatDate } from '../utils/utils';

export async function getServices(query: string) {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `orderService/${formatDate(Date.now()).replace(/\//g, '')}/`));
  if (snapshot.exists()) {
    const osList = Object.values(snapshot.val());
     
      return osList;
  } else {
    return false
  }
}

export async function getServicesByID(query: string) {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `orderService/${formatDate(Date.now()).replace(/\//g, '')}/${query}`));
  if (snapshot.exists()) {
    const osList = snapshot.val();
     
    return osList;
  } else {
    return false
  }
}
