import { exportToExcel } from '@/lib/functions';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';

export default function ExportExcel({
  header,
  data,
  fileName,
}: {
  header: string[];
  data: string[][];
  fileName?: string;
}) {
  const [loading, setLoading] = useState(false);
  async function handleExport() {
    setLoading(true);
    try {
      await exportToExcel(header, data, fileName);
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button disabled={loading} variant={'outline'} onClick={() => handleExport()}>
      {loading ? <Spinner className="text-white" /> : <Download />} Export
    </Button>
  );
}
