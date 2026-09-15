import { Search } from 'lucide-react';
import { Input } from './ui/input';

export default function InputWithIcon({
  value,
  onChange,
  className,
  placeholder,
}: {
  value?: any;
  onChange?: (e: any) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-[12px] border border-[#3A3A3A] px-3 shadow-sm  bg-[#1A1A1A] ${className}`}
    >
      <Search className="h-4 w-4 text-gray-400" />
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border-none bg-transparent p-0 text-sm placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent `}
      />
    </div>
  );
}
