import axios from '@/lib/axios';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Spinner } from '../ui/spinner';

type SelectProps = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
};

export default function SelectPosition({
  value,
  onChange,
  placeholder = 'Select',
  required = false,
}: SelectProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    try {
      const response = await axios.get(`/admin/configuration?position_list=true`);
      setData(response.data);
    } finally {
      setLoading(false);
    }
  }

  return loading ? (
    <Spinner />
  ) : (
    <Select required={required} value={value} onValueChange={onChange}>
      <SelectTrigger id="position" className="dark:bg-[#1A1A1A] w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {data.map((item, i) => (
          <SelectItem key={i} value={item}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
