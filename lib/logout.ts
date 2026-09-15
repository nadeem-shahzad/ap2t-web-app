import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { auth } from './firebase';

export async function handleLogout(cond = true) {
  await signOut(auth);
  if (cond) toast.success('Logout successfull');
}
