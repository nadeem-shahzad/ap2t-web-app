import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { TabsContent } from '../ui/tabs';
import { LocalInput } from './button-and-switch';

const Security = () => {
  const { user } = useAuth();
  const [securityInfo, setSecurityInfo] = useState({
    oldPass: '',
    newPass: '',
    confirmNewPass: '',
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const handlePasswordUpdate = async () => {
    if (!securityInfo.newPass || !securityInfo.confirmNewPass) {
      return;
    }
    if (securityInfo.newPass !== securityInfo.confirmNewPass) {
      toast.error('Passwords do not match');
      return;
    }

    const fbuser = auth.currentUser;
    if (fbuser && user?.email) {
      setPasswordLoading(true);
      const credential = EmailAuthProvider.credential(user.email, securityInfo.oldPass);

      reauthenticateWithCredential(fbuser, credential)
        .then(async () => {
          await updatePassword(fbuser, securityInfo.newPass);
          setSecurityInfo({ confirmNewPass: '', newPass: '', oldPass: '' });
          toast.success('Password changed...');
        })
        .catch((error) => {
          toast.error(error?.message || 'Error changing password');
          console.log(error);
        })
        .finally(() => {
          setPasswordLoading(false);
        });
    }
  };

  return (
    <TabsContent value="Security" className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="space-y-1">
          <h1 className="text-[18px] font normal">Security</h1>
          <p className="text-xs text-muted-foreground">
            Keep your account secure with extra Authentication.
          </p>
        </div>
        <Button onClick={handlePasswordUpdate} disabled={passwordLoading}>
          {passwordLoading && <Spinner className="text-black" />}Save Password
        </Button>
      </div>
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LocalSwitch
                  title="Two-Factor Authentication"
                  description="Add an extra layer of protection to your account."
                  value={securityInfo.twoFactorAuth}
                  onChange={(val) =>
                    setSecurityInfo((prevState) => ({
                      ...prevState,
                      twoFactorAuth: val,
                    }))
                  }
                /> */}

      {/* <LocalSwitch
                  title="Login Alert Notification"
                  description="Get notified when your account is accessed from a new device."
                  value={securityInfo.loginAlert}
                  onChange={(val) =>
                    setSecurityInfo((prevState) => ({
                      ...prevState,
                      loginAlert: val,
                    }))
                  }
                />
              </div> */}

      <div className="space-y-4">
        <h1 className="text-[18px] font normal">Password Management</h1>
        <div className="grid grid-cols-2">
          <LocalInput
            title="Old Password"
            value={securityInfo.oldPass}
            onChange={(e) =>
              setSecurityInfo((prev) => ({
                ...prev,
                oldPass: e,
              }))
            }
            placeholder="*********"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LocalInput
            title="New Password"
            value={securityInfo.newPass}
            onChange={(e) =>
              setSecurityInfo((prev) => ({
                ...prev,
                newPass: e,
              }))
            }
            placeholder="*********"
          />

          <LocalInput
            title="Confirm New Password"
            value={securityInfo.confirmNewPass}
            onChange={(e) =>
              setSecurityInfo((prev) => ({
                ...prev,
                confirmNewPass: e,
              }))
            }
            placeholder="*********"
          />
        </div>
      </div>
    </TabsContent>
  );
};

export default Security;
