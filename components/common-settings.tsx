'use client';
import AppCalendar from '@/components/app-calendar';
import RenderAvatar from '@/components/render-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';
import axios from '@/lib/axios';
import { auth, storage } from '@/lib/firebase';
import { joinNames } from '@/lib/functions';
import { uploadProfileImage } from '@/lib/upload-profile-image';
import { Scrollbar } from '@radix-ui/react-scroll-area';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { deleteObject, ref } from 'firebase/storage';
import { Loader2, MapPin, MessageSquare, Phone, Plus, User } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { FaLock, FaUser } from 'react-icons/fa';
import { FaFloppyDisk } from 'react-icons/fa6';
import { toast } from 'sonner';

export default function CommonSettings() {
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const [savingChanges, setSavingChanges] = useState(false);
  const [tab, setTab] = useState('Profile info');
  const [profileImage, setProfileImage] = useState<string | null>();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profileInfo, setProfileInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_no: '',
    location: '',
    birth_date: undefined,
  });
  const { user } = useAuth();
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [securityInfo, setSecurityInfo] = useState({
    oldPass: '',
    newPass: '',
    confirmNewPass: '',
  });

  const debouncedUserId = useDebounce(user?.id, 1000);

  useEffect(() => {
    if (!debouncedUserId) return;
    fetchData();
  }, [debouncedUserId]);

  const fetchData = async () => {
    if (!debouncedUserId) return;

    try {
      setLoading(true);

      const res = await axios.get(`/settings?user_id=${debouncedUserId}`);
      const result = res.data;
      setProfileInfo({
        first_name: result.user?.first_name || '',
        last_name: result?.user?.last_name || '',
        email: result.user?.email || '',
        phone_no: result.user?.phone_no || '',
        location: result.user?.location || '',
        birth_date: result.user?.birth_date || undefined,
      });
      setProfileImage(result.user?.picture || null);
      const settings = result.settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    setSavingChanges(true);
    try {
      await axios.put(`/user`, {
        id: user?.id,
        ...profileInfo,
      });
      toast.success('Settings saved...');
    } finally {
      setSavingChanges(false);
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    try {
      const path = `ap2t/user/picture/${user.id}.png`;

      await uploadProfileImage(file, path);

      await axios.put('/user', {
        id: user.id,
        picture: path,
      });
      setProfileImage(path);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!user?.id) return;

    try {
      const storageRef = ref(storage, `ap2t/user/picture/${user.id}.png`);
      await deleteObject(storageRef);

      await axios.put('/user', {
        id: user.id,
        picture: null,
      });

      setProfileImage(null);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!securityInfo.newPass || !securityInfo.confirmNewPass) {
      toast.error('New password or confirm password not added.');
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
    <div className="flex flex-col w-full gap-4">
      <Header>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button disabled={savingChanges} onClick={() => updateSettings()}>
            {savingChanges ? (
              <>
                <Spinner className="text-black" />
                Saving...
              </>
            ) : (
              <>
                <FaFloppyDisk className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </Header>
      {loading ? (
        <Skeleton className="h-[300px] w-full bg-secondary rounded-sm" />
      ) : (
        <Card className="bg-[#282828] p-0 overflow-hidden">
          <Tabs value={tab} onValueChange={setTab} className="gap-0">
            <ScrollArea className={`overflow-x-auto ${isMobile && 'max-w-[calc(100vw-64px)]'}`}>
              <TabsList className="bg-transparent relative flex p-0 ">
                <TabsTrigger
                  value="Profile info"
                  className="dark:data-[state=active]:bg-[#CBFD0026] dark:data-[state=active]:text-primary dark:data-[state=active]:border-b-primary rounded-none rounded-tl-xl h-9 px-4 text-[12px] leading-tight tracking-tight"
                >
                  <div className="flex gap-2 items-center py-2">
                    <FaUser />
                    Profile Info
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="Security"
                  className="dark:data-[state=active]:bg-[#CBFD0026] dark:data-[state=active]:text-primary dark:data-[state=active]:border-b-primary rounded-none h-9 px-4 text-[12px] leading-tight tracking-tight"
                >
                  <div className="flex gap-2 items-center py-2">
                    <FaLock />
                    Security
                  </div>
                </TabsTrigger>
              </TabsList>
              <Scrollbar orientation="horizontal" />
            </ScrollArea>
            <Separator />
            <CardContent className="p-4">
              <TabsContent value="Profile info" className="space-y-4">
                <div className="space-y-1">
                  <h1 className="text-[18px] font normal">Profile Information</h1>
                  <p className="text-xs text-muted-foreground">
                    Manage your personal details and keep your contact
                  </p>
                </div>

                <div className="flex items-center gap-8">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />

                  <div className="relative w-24 h-24">
                    <RenderAvatar
                      img={profileImage}
                      fallback={joinNames([user?.first_name, user?.last_name])}
                      className="w-full h-full bg-[#1A1A1A]"
                      fallbackClassName="bg-[#1A1A1A] text-white"
                    />

                    <button
                      onClick={handleSelectFile}
                      className="absolute bottom-0 right-0 bg-primary p-2 rounded-full"
                    >
                      {uploading ? (
                        <Loader2 size={14} className="animate-spin text-black" />
                      ) : profileImage ? (
                        <User size={14} className="text-black" />
                      ) : (
                        <Plus size={14} className="text-black" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h1 className="text-md font-semibold">
                      {user?.first_name} {user?.last_name}
                    </h1>
                    <p className="text-sm text-muted-foreground">{user?.role}</p>

                    <div className="flex gap-2">
                      {profileImage && (
                        <Button
                          variant="link"
                          className="p-0 font-normal"
                          onClick={handleDeleteImage}
                        >
                          Delete
                        </Button>
                      )}

                      <Button variant="link" className="p-0 font-normal" onClick={handleSelectFile}>
                        Update
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <LocalInput
                    title="First Name"
                    Icon={<FaUser className="h-4 w-4 text-gray-400" />}
                    value={profileInfo.first_name}
                    placeholder="First  Name"
                    onChange={(e) =>
                      setProfileInfo((prev) => ({
                        ...prev,
                        first_name: e,
                      }))
                    }
                  />

                  <LocalInput
                    title="Last Name"
                    Icon={<FaUser className="h-4 w-4 text-gray-400" />}
                    value={profileInfo.last_name}
                    placeholder="Last name"
                    onChange={(e) =>
                      setProfileInfo((prev) => ({
                        ...prev,
                        last_name: e,
                      }))
                    }
                  />

                  <LocalInput
                    disabled
                    title="Email"
                    Icon={<MessageSquare className="h-4 w-4 text-gray-400" />}
                    value={profileInfo.email}
                    placeholder="Email"
                    onChange={(e) =>
                      setProfileInfo((prev) => ({
                        ...prev,
                        email: e,
                      }))
                    }
                  />

                  <LocalInput
                    title="Phone Number"
                    Icon={<Phone className="h-5 w-5 text-gray-400" />}
                    value={profileInfo.phone_no}
                    placeholder="+1XXXXXXX"
                    onChange={(e) =>
                      setProfileInfo((prev) => ({
                        ...prev,
                        phone_no: e,
                      }))
                    }
                  />

                  <LocalInput
                    title="Location"
                    Icon={<MapPin className="h-4 w-4 text-gray-400" />}
                    value={profileInfo.location}
                    placeholder="Location"
                    onChange={(e) =>
                      setProfileInfo((prev) => ({
                        ...prev,
                        location: e,
                      }))
                    }
                  />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted">Birth Date</Label>
                    <AppCalendar
                      className="h-12"
                      date={profileInfo.birth_date}
                      onChange={(date) =>
                        setProfileInfo((prevState) => ({
                          ...prevState,
                          birth_date: date,
                        }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>

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
            </CardContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}

const Header = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex w-full gap-4 justify-between flex-wrap items-center">
      <div className="space-y-1">
        <p className="text-xl">Settings</p>
        <span className="text-xs text-muted-foreground flex items-center">
          <span>Manage your account, preferences and integration</span>
        </span>
      </div>

      {children}
    </div>
  );
};

const LocalInput = ({
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
