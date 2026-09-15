'use client';

import PageTable from '@/components/app-table';
import ExportExcel from '@/components/export-excel';
import InputWithIcon from '@/components/input-with-icon';
import { PARENT_COLUMNS } from '@/components/parents/columns';
import { CreateParent } from '@/components/parents/create-parent';
import Header from '@/components/parents/header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { useDebounce } from '@/hooks/use-debounce';
import axios from '@/lib/axios';
import { ParentData } from '@/lib/types';
import { Filter } from 'lucide-react';
import moment from 'moment';
import { useEffect, useState } from 'react';

export default function Page() {
  const [filter, setFilter] = useState(false);
  const [parents, setParents] = useState<ParentData[] | []>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  // const [paymentStatusSearch,setPaymentStatusSearch]=useState("")
  const [zipCodeSearch, setZipCodeSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  // const debouncedPayment = useDebounce(paymentStatusSearch, 300);
  const debouncedZip = useDebounce(zipCodeSearch, 300);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    const result = await axios.get('/admin/users?role=parent');
    const parentsmapped = result.data.map((p: any) => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      joining_date: p.created_at ? moment(new Date(p.created_at)).format('YYYY-MM-DD') : 'N/A',
      email: p.email,
      number: p.phone_no,
      location: p.location || 'N/A',
      children: String(p.children_count || 0),
      card_status: p.card_status || 'N/A',
      total_spent: String(p.total_spent || 0),
      last_spent: String(p.last_spent || 0),
      last_transaction_date: p.last_transaction_date
        ? moment(new Date(p.last_transaction_date)).format('YYYY-MM-DD')
        : 'N/A',
      zip_code: p.zip_code,
    }));
    setParents(parentsmapped);
    setLoading(false);
  }

  const filteredData = parents.filter((item) => {
    const text = `${item.name} ${item.email} ${item.number}`.toLowerCase();
    const zip = `${item.zip_code ?? ''}`.toLowerCase();

    const searchWords = debouncedSearch?.toLowerCase().trim().split(/\s+/).filter(Boolean); // remove empty strings

    const matchesSearch =
      !searchWords?.length || searchWords.every((word: string) => text.includes(word));

    const matchesZip = !debouncedZip || zip.includes(debouncedZip.toLowerCase());

    return matchesSearch && matchesZip;
  });

  return (
    <div className="flex flex-col w-full gap-6">
      <Header totalParents={parents.length}>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <ExportExcel
            header={[
              'Parent',
              'Joining Date',
              'Email',
              'Contact',
              'Location',
              'children',
              'Card Status',
              'Total Spent',
              'Last Spent',
              'Last Transaction Date',
            ]}
            fileName="parents_data.xlsx"
            data={parents.map((item) => [
              item?.name || '',
              item?.joining_date || '',
              item?.email || '',
              item?.number || '',
              item?.location || '',
              item?.children || '',
              item?.card_status || '',
              item?.total_spent || '',
              item?.last_spent || '',
              item?.last_transaction_date || '',
            ])}
          />

          <CreateParent
            onRefresh={async () => {
              await fetchData();
            }}
          />
        </div>
      </Header>

      <div className="flex flex-col gap-4 rounded-[14px] bg-#252525 border border-[#3A3A3A] p-4 bg-[#252525]">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="w-full">
            <InputWithIcon
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
            />
          </div>

          <Button onClick={() => setFilter(!filter)}>
            <Filter /> Filters
          </Button>
        </div>

        {filter && (
          <div className="flex flex-col w-full gap-4">
            <Separator />
            <div className="flex flex-col sm:flex-row w-full gap-4">
              {/* <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground">Payment Status</Label>
                <InputWithIcon value={paymentStatusSearch} onChange={(e)=> setPaymentStatusSearch(e.target.value)} placeholder="Search By Payment Status..." />

              </div> */}

              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground">Zip Code</Label>
                <InputWithIcon
                  value={zipCodeSearch}
                  onChange={(e) => setZipCodeSearch(e.target.value)}
                  placeholder="Search By Zip Code..."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <PageTable
        loading={loading}
        columns={PARENT_COLUMNS}
        data={filteredData || []}
        onRowClick={() => {}}
      />
    </div>
  );
}
