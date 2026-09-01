


import axios from '@/lib/axios';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';


export function useApproval(id: number | undefined, session_id: number | undefined, sessionDate?: string) {

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)


  async function fetchData() {
     if (!id || !session_id) return
    setLoading(true)

    try {
      const params = new URLSearchParams({ user_id: String(id), session_id: String(session_id) });
      if (sessionDate) params.set("session_date", sessionDate);
      const response = await axios.get(`/frontdesk/actions?${params.toString()}`)
      if (response.data?.status === 'accepted') {
        setLoading(false)
      }
      if (response.data?.status === 'rejected') {
        setLoading(false)
        setError(true)
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (!id || !session_id) return

    fetchData();

    const unsub = onSnapshot(
      doc(db, 'frontdesk', "user"),
      () => fetchData()
    );

    return () => {
      unsub()
      setLoading(true)
    }

  }, [id, session_id, sessionDate]);

  return { loading, error };
}
