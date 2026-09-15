import { useAuth } from '@/contexts/auth-context';
import axios from '@/lib/axios';
import { storage } from '@/lib/firebase';
import { joinNames } from '@/lib/functions';
import { uploadProfileImage } from '@/lib/upload-profile-image';
import { deleteObject, ref } from 'firebase/storage';
import { Loader2, MapPin, MessageSquare, Phone, Plus, User } from 'lucide-react';
import { memo, useRef, useState } from 'react';
import { FaUser } from 'react-icons/fa6';
import AppCalendar from '../app-calendar';
import RenderAvatar from '../render-avatar';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { TabsContent } from '../ui/tabs';
import { LocalInput } from './button-and-switch';
import { ProfileInfoProps } from '@/lib/types';

const ProfileInfo = ({
  profileInfo,
  setProfileInfo,
  profileImage,
  setProfileImage,
}: {
  profileInfo: ProfileInfoProps;
  setProfileInfo: (val: any) => void;
  profileImage: string | null | undefined;
  setProfileImage: (val: string | null | undefined) => void;
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);

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

  return (
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
            img={user?.picture}
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
              <Button variant="link" className="p-0 font-normal" onClick={handleDeleteImage}>
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
          placeholder="Admin User"
          onChange={(e) =>
            setProfileInfo((prev: ProfileInfoProps) => ({
              ...prev,
              first_name: e,
            }))
          }
        />

        <LocalInput
          title="Last Name"
          Icon={<FaUser className="h-4 w-4 text-gray-400" />}
          value={profileInfo.last_name}
          placeholder="Admin User"
          onChange={(e) =>
            setProfileInfo((prev: ProfileInfoProps) => ({
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
          placeholder="email@example.com"
          onChange={(e) =>
            setProfileInfo((prev: ProfileInfoProps) => ({
              ...prev,
              email: e,
            }))
          }
        />

        <LocalInput
          title="Phone Number"
          Icon={<Phone className="h-5 w-5 text-gray-400" />}
          value={profileInfo.phone_no}
          placeholder="+91 3948392"
          onChange={(e) =>
            setProfileInfo((prev: ProfileInfoProps) => ({
              ...prev,
              phoneNo: e,
            }))
          }
        />

        <LocalInput
          title="Location"
          Icon={<MapPin className="h-4 w-4 text-gray-400" />}
          value={profileInfo.location}
          placeholder="********"
          onChange={(e) =>
            setProfileInfo((prev: ProfileInfoProps) => ({
              ...prev,
              password: e,
            }))
          }
        />
        <div className="space-y-2">
          <Label className="text-xs text-muted">Birth Date</Label>
          <AppCalendar
            className="h-12"
            date={profileInfo.birth_date}
            onChange={(date) =>
              setProfileInfo((prevState: ProfileInfoProps) => ({
                ...prevState,
                birth_date: date,
              }))
            }
          />
        </div>
      </div>
    </TabsContent>
  );
};

export default memo(ProfileInfo);
