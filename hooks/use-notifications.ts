import { useAuth } from '@/contexts/auth-context';
import axios from '@/lib/axios';
import { db } from '@/lib/firebase';
import { NotificationType } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unRead, setUnread] = useState(0);
  const { user } = useAuth();

  async function fetchData() {
    if (!user?.id) return;

    try {
      const response = await axios.get(`/notification?user=${user.id}`);
      const un_Read = response.data?.filter((item: NotificationType) => !item.read)?.length;
      setUnread(un_Read);
      setNotifications(response.data);
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    if (!user?.id) return;

    fetchData();

    const unsub = onSnapshot(doc(db, 'notifications', `not-${user.id}`), () => fetchData());

    return () => {
      unsub();
    };
  }, [user]);

  return { notifications, unRead };
}
