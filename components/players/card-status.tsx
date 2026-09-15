import { Info, TrendingDown, TrendingUp } from 'lucide-react';

interface CardStatusProps {
  value: number;
}

const CardStatus = ({ value }: CardStatusProps) => {
  // Determine colors based on value type
  let colors = '';
  let Icon = Info; // Default icon

  // Number logic
  if (value > 90) {
    colors = 'bg-success-bg text-success-text';
    Icon = TrendingUp;
  } else if (value >= 80 && value <= 90) {
    colors = 'bg-warning-bg text-warning-text';
  } else {
    colors = 'bg-danger-bg text-danger-text';
    Icon = TrendingDown;
  }

  return (
    <div className={`w-25 py-1 justify-center rounded-full flex items-center gap-2 ${colors}`}>
      <Icon size={14} className="text-current" />
      <div className="text-xs">{value}</div>
    </div>
  );
};

export default CardStatus;
