import { ReactNode } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

export const LocalSwitch = ({
  value,
  title,
  description,
  onChange,
}: {
  title: string;
  description?: string | undefined;
  value: boolean;
  onChange: (val: boolean) => void;
}) => {
  return (
    <div className="flex justify-between items-center py-2 px-4 bg-[#1A1A1A] border border-border rounded-[10px]">
      <div className="flex items-center gap-4">
        <div className="space-y-0">
          <h1 className="text-sm text-[#E5E7EB]">{title}</h1>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>

      <Switch className="mr-2" checked={value} onCheckedChange={onChange} />
    </div>
  );
};

export const LocalInput = ({
  Icon,
  title,
  placeholder = 'Type here...',
  value,
  onChange,
  disabled = false,
}: {
  placeholder: string;
  Icon?: ReactNode;
  title: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) => {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-normal tracking-wide text-[#D1D1D1]">{title}</Label>
      <div
        className={`flex items-center gap-2 py-2 rounded-[12px] border border-[#3A3A3A] px-3 shadow-sm  bg-[#18181B]`}
      >
        {Icon}
        <Input
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`border-none bg-transparent p-0 text-md placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent `}
        />
      </div>
    </div>
  );
};
