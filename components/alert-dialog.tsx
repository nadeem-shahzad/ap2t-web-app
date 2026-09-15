import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ConfirmationProps } from '@/lib/types';
import { Spinner } from './ui/spinner';

const ConfirmationDialog = ({
  title,
  description,
  onPressYes,
  onPressCancel,
  open,
  loading,
  children = null,
  valid = true,
}: ConfirmationProps) => {
  return (
    <AlertDialog open={open}>
      {/* <AlertDialogTrigger >{children}</AlertDialogTrigger> */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onPressCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={!valid || loading} onClick={async () => await onPressYes()}>
            {loading && <Spinner className="text-black" />} Yes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialog;
