'use client';
import { DailyCheckins } from '@/components/admin-dashboard/daily-checkins-graph';
import { DashboardOverview } from '@/components/admin-dashboard/dashboard-overveiw';
import { PaymentAlerts } from '@/components/admin-dashboard/payment-alerts';
import { UpcomingSessions } from '@/components/admin-dashboard/upcoming-sessions-dashboard';
import { CompedDialog } from '@/components/payment/comped-dialog';
import { OverrideDialog } from '@/components/payment/override-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import axios from '@/lib/axios';
import { DashboardStats, PaymentRecord } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function Page() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardStats | undefined>();
  const [visible, setVisible] = useState<{ show: string; data: any }>({ show: '', data: null });

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    try {
      setLoading(true);
      const response = await axios.get('/admin/dashboard');
      setData(response.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col w-full gap-6">
      {loading ? (
        <Skeleton className="h-[200px] w-full bg-secondary rounded-sm" />
      ) : (
        <DashboardOverview data={data} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
        <div className="lg:col-span-2 flex flex-1">
          {loading ? (
            <Skeleton className="h-[400px] w-full bg-secondary rounded-sm" />
          ) : (
            <DailyCheckins data={data?.attendanceData || []} />
          )}
        </div>

        <div className="lg:col-span-1">
          {loading ? (
            <Skeleton className="h-[400px] w-full bg-secondary rounded-sm" />
          ) : (
            <PaymentAlerts
              data={data?.paymentAlerts || []}
              onClickOverride={(item) => setVisible({ show: 'comped', data: item })}
              onClickPaid={(item) => setVisible({ show: 'override', data: item })}
              onRefresh={async (val) => {
                await updateAlert(val);
                await fetchData();
              }}
            />
          )}
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[200px] w-full bg-secondary rounded-sm" />
      ) : (
        <UpcomingSessions sessions={data?.sessionsData || []} />
      )}
      <CompedDialog
        data={visible?.data}
        open={visible.show === 'comped'}
        onOpenChange={() => {
          setVisible((prevState) => ({ ...prevState, show: '' }));
        }}
        onRefresh={async () => {
          await updateAlert(visible?.data);
          await fetchData();
        }}
      />

      <OverrideDialog
        data={visible?.data}
        open={visible.show === 'override'}
        onOpenChange={() => {
          setVisible((prevState) => ({ ...prevState, show: '' }));
        }}
        onRefresh={async () => {
          await updateAlert(visible?.data);
          await fetchData();
        }}
      />
    </div>
  );
}

async function updateAlert(data: PaymentRecord) {
  if (!data?.id) return;

  await axios.post('/admin/payment-alert', {
    payment_id: data.id,
  });
}
