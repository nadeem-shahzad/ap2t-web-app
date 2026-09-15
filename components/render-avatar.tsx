import { GetProfileImage } from '@/lib/functions';
import { memo, useEffect, useState } from 'react';
import getInitials from './parents/get-initials';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Spinner } from './ui/spinner';

const RenderAvatar = ({
  img = '',
  fallback = 'NA',
  className = '',
  fallbackClassName = '',
}: {
  img: string | undefined | null;
  fallback: string;
  className?: string;
  fallbackClassName?: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [localImage, setLocalImage] = useState('');

  useEffect(() => {
    async function fetchImage() {
      setLoading(true);
      if (img?.startsWith('http')) {
        setLocalImage(img);
      } else {
        const imgResult = await GetProfileImage(img);
        setLocalImage(imgResult);
      }

      setLoading(false);
    }

    if (img) {
      fetchImage();
    }
  }, [img]);

  return loading ? (
    <Spinner />
  ) : (
    <Avatar className={`${className}`}>
      <AvatarImage className="object-cover" src={localImage} />
      <AvatarFallback className={`bg-primary text-black ${fallbackClassName}`}>
        {getInitials(fallback)}
      </AvatarFallback>
    </Avatar>
  );
};

export default memo(RenderAvatar);
