import { CircleCheckBig, CircleX, Info } from 'lucide-react';

const CardStatus = ({ text = '' }: { text: string }) => {
  const Valid = () => <CircleCheckBig size={14} />;
  const Expired = () => <Info size={14} />;
  const NoCard = () => <CircleX size={14} />;
  const Error = () => <Info size={14} />;

  const colors =
    text === 'Active'
      ? 'bg-success-bg text-success-text'
      : text === 'Expired'
        ? 'bg-warning-bg text-warning-text'
        : text === 'No Card'
          ? 'bg-ghost-bg text-ghost-text'
          : 'bg-danger-bg text-danger-text';

  return (
    <div className={`w-25 py-1 justify-center rounded-full flex items-center gap-2 ${colors}`}>
      {text === 'Active' ? (
        <Valid />
      ) : text === 'Expired' ? (
        <Expired />
      ) : text === 'No Card' ? (
        <NoCard />
      ) : (
        <Error />
      )}{' '}
      <div className="text-xs">{text}</div>
    </div>
  );
};

export default CardStatus;
