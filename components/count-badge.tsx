const CountBadge = ({ count }: { count?: number | null }) => {
  const safeCount = count ?? 0;

  if (safeCount <= 0) return null;

  const display = safeCount > 99 ? '99+' : safeCount;

  return (
    <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold text-white bg-red-500 rounded-full">
      {display}
    </span>
  );
};

export default CountBadge;
