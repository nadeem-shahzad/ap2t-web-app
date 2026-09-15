import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function TriggerFirebaseApprovals(to: string) {
  await setDoc(doc(db, 'frontdesk', to), {
    updated: serverTimestamp(),
  });
}

export async function TriggerFirebaseForNotifications(id: string | number | null) {
  if (id) {
    await setDoc(doc(db, 'notifications', `not-${id.toString()}`), {
      updated: serverTimestamp(),
    });
  }
}
