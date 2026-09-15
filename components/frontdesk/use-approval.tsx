import { useAuth } from '@/contexts/auth-context';
import axios from '@/lib/axios';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useApproval() {
  const [approvals, setApprovals] = useState([]);
  const [approvalCount, setApprovalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/front-desk`);
      const needApproval = response.data?.filter((item: any) => item.status === 'waiting')?.length;
      setApprovalCount(needApproval);
      setApprovals(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setApprovals([]);
      return;
    }

    fetchMessages();

    const unsub = onSnapshot(doc(db, 'frontdesk', 'admin'), () => fetchMessages());

    return () => {
      unsub();
      setLoading(true);
    };
  }, [user]);

  return { approvals, loading, approvalCount };
}
