import { DashIcon } from '@radix-ui/react-icons';
import { CircleCheckBig, CircleX, Clock, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { ReactNode } from 'react';
import { GoDotFill } from 'react-icons/go';

export const typeClasses = {
  success: 'bg-success-bg text-success-text border-success-text/32',
  warning: 'bg-warning-bg text-warning-text border-warning-text/32',
  danger: 'bg-danger-bg text-danger-text border-danger-text/32',
  info: 'bg-info-bg text-info-text border-info-text/32',
  active: 'bg-active-bg text-active-text border-active-text/32',
  other: 'bg-other-bg text-other-text border-other-text/32',
  ghost: 'bg-ghost-bg text-ghost-text border-ghost-text/32',
  alternative: 'bg-alternative-bg text-alternative-text border-alternative-text/32',
  paid: 'bg-active-bg text-active-text border-active-text/32',
  comped: 'bg-other-bg text-other-text border-other-text/32',
  completed: 'bg-success-bg text-success-text border-success-text/32',
  refunded: 'bg-alternative-bg text-alternative-text border-alternative-text/32',
  failed: 'bg-danger-bg text-danger-text border-danger-text/32',
  upcoming: 'bg-info-bg text-info-text border-info-text/32',
  pending: 'bg-warning-bg text-warning-text border-warning-text/32',
  inactive: 'bg-ghost-bg text-ghost-text border-ghost-text/32',
  enabled: 'bg-success-bg text-success-text border-success-text/32',
  disabled: 'bg-warning-bg text-warning-text border-warning-text/32',
  connected: 'bg-alternative-bg text-alternative-text border-alternative-text/32',
  disconnected: 'bg-warning-bg text-warning-text border-warning-text/32',
};

export const IconType = {
  active: <CircleCheckBig size={14} />,
  failed: <CircleX size={14} />,
  upcoming: <Clock size={14} />,
  expired: <Info size={14} />,
  no_card: <CircleX size={14} />,
  error: <Info size={14} />,
  attended: <CircleCheckBig size={14} />,
  connected: <GoDotFill size={14} />,
  completed: <CircleCheckBig size={14} />,
  disconnected: <CircleX size={14} />,
  comped: <CircleCheckBig size={14} />,
};

interface CardStatusProps {
  value: number | string | undefined;
  icon?: boolean;
  className?: string;
}

const CardStatus = ({ value, icon = false, className = '' }: CardStatusProps) => {
  if (value === undefined || value === null) return null;

  let str: string = '';
  let localIcon: null | ReactNode = null;
  let localType = typeClasses.other;

  const numericValue = typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value;

  if (typeof numericValue === 'number') {
    str = String(numericValue);

    localIcon =
      numericValue > 90 ? (
        <TrendingUp size={14} />
      ) : numericValue >= 80 ? (
        <DashIcon />
      ) : (
        <TrendingDown size={14} />
      );

    localType =
      numericValue > 90
        ? typeClasses.success
        : numericValue >= 80
          ? typeClasses.warning
          : typeClasses.danger;
  } else if (typeof value === 'string') {
    str = value.charAt(0).toUpperCase() + value.slice(1);

    localIcon = IconType[value as keyof typeof IconType] ?? null;
    localType = typeClasses[value as keyof typeof typeClasses] ?? typeClasses.other;
  }

  return (
    <div
      className={`px-2 py-1 justify-center rounded-full flex items-center gap-2 ${localType} ${className}`}
    >
      {icon && localIcon}
      <p className="text-xs leading-none tracking-normal">{str}</p>
    </div>
  );
};

export default CardStatus;
