import { DialogContent, DialogTitle } from '../ui/dialog';

type Props = {
  session: string;
  coach: string;
  time: string;
  start: string;
  end: string;
};
export default function ShowCalenderSessionDialog({ session, coach, time, start, end }: Props) {
  return (
    <DialogContent className="min-w-2xl">
      <DialogTitle>Session detail</DialogTitle>
      <div className="space-y-2">
        <h1>{session}</h1>
        <div className="flex gap-2 text-ghost-text text-sm">
          <p>by: {coach}</p>
          <p>
            from: {start} to {end}
          </p>
          <p>at: {time}</p>
        </div>
      </div>
    </DialogContent>
  );
}
