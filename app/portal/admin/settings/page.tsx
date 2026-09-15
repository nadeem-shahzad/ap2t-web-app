'use client';
import NotificationPreference from '@/components/settings/notification-preference';
import ProfileInfo from '@/components/settings/profile-info';
import Review from '@/components/settings/review';
import RolePersmission from '@/components/settings/role-permissions';
import Security from '@/components/settings/security';
import SquareIntegration from '@/components/settings/square-integration';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { useIsMobile } from '@/hooks/use-mobile';
import axios from '@/lib/axios';
import { NotificationSetting, ProfileInfoProps, SquareIntegrationState } from '@/lib/types';
import { Scrollbar } from '@radix-ui/react-scroll-area';
import {
  Calendar,
  CreditCard,
  DollarSign,
  Info,
  MessageCircle,
  MessageSquare,
  Star,
} from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { FaBell, FaCreditCard, FaLock, FaUser } from 'react-icons/fa';
import { FaFloppyDisk } from 'react-icons/fa6';
import { RiShieldKeyholeLine } from 'react-icons/ri';
import { toast } from 'sonner';

export default function Page() {
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const [savingChanges, setSavingChanges] = useState(false);
  const [tab, setTab] = useState('Profile info');
  const [profileInfo, setProfileInfo] = useState<ProfileInfoProps>({
    first_name: '',
    last_name: '',
    email: '',
    phone_no: '',
    location: '',
    birth_date: undefined,
  });

  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>();
  const [squareIntegration, setSquareIntegration] = useState<SquareIntegrationState>({
    mode: 'test',

    credentials: {
      test: {
        merchantId: '',
        locationId: '',
        apiKey: '',
      },
      live: {
        merchantId: '',
        locationId: '',
        apiKey: '',
      },
    },
  });
  const [notificationInfo, setNotificationInfo] = useState<NotificationSetting[]>([
    {
      title: 'New Booking',
      description: 'Get notified when a new session is booked',
      value: false,
      icon: <Calendar className="text-muted-foreground" size={20} />,
    },

    {
      title: 'Payment Received',
      description: 'Alerts for successful payments',
      value: false,
      icon: <DollarSign className="text-muted-foreground" size={20} />,
    },

    {
      title: 'Session Cancellation',
      description: 'Alerts when sessions are cancelled',
      value: false,
      icon: <Info className="text-muted-foreground" size={20} />,
    },

    {
      title: 'Promotion Purchase',
      description: 'When customers buy promotional packages',
      value: false,
      icon: <CreditCard className="text-muted-foreground" size={20} />,
    },

    {
      title: 'Email Notifications',
      description: 'Receive updates via email',
      value: false,
      icon: <MessageSquare className="text-muted-foreground" size={20} />,
    },

    {
      title: 'SMS Notifications',
      description: 'Receive updates via text message',
      value: false,
      icon: <MessageCircle className="text-muted-foreground" size={20} />,
    },

    // {
    //   title: "Push Notifications",
    //   description: "Browser push notifications",
    //   value: false,
    //   icon: <Bell className="text-muted-foreground" size={20} />,
    // },
  ]);
  const [rolePermissions, setRolePermissions] = useState({
    manage_users: true,
    manage_players: true,
    manage_coaches: true,
    manage_sessions: true,
    manage_payments: true,
    manage_promotions: true,
    system_settings: true,
    view_reports: true,
  });

  useEffect(() => {
    fetchData();
    fetchSquare();
  }, [user]);

  async function fetchSquare() {
    const res = await axios.get(`/square`);
    const settings = res.data;

    setSquareIntegration({
      mode: settings.mode ? 'test' : 'live',

      credentials: {
        test: {
          merchantId: settings?.test_merchant_id || '',
          locationId: settings?.test_location_id || '',
          apiKey: settings?.test_api_key || '',
        },
        live: {
          merchantId: settings?.live_merchant_id || '',
          locationId: settings?.live_location_id || '',
          apiKey: settings?.live_api_key || '',
        },
      },
    });
  }

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const res = await axios.get(`/settings?user_id=${user.id}`);
      const result = res.data;

      setProfileInfo({
        first_name: result.user?.first_name || '',
        last_name: result.user?.last_name || '',
        email: result.user?.email || '',
        phone_no: result.user?.phone_no || '',
        location: result.user?.location || '',
        birth_date: result.user?.birth_date || undefined,
      });
      setProfileImage(result.user?.picture || null);
      const settings = result?.settings ?? null;

      setRolePermissions({
        manage_users: settings.manage_users ?? false,
        manage_coaches: settings.manage_coaches ?? false,
        manage_players: settings.manage_players ?? false,
        manage_payments: settings.manage_payments ?? false,
        manage_promotions: settings.manage_promotions ?? false,
        manage_sessions: settings.manage_sessions ?? false,
        system_settings: settings.system_settings ?? false,
        view_reports: settings.view_report ?? false,
      });

      setNotificationInfo([
        {
          title: 'New Booking',
          description: 'Get notified when a new session is booked',
          value: settings?.new_booking ?? false,
          icon: <Calendar className="text-muted-foreground" size={20} />,
        },
        {
          title: 'Payment Received',
          description: 'Alerts for successful payments',
          value: settings?.payment_receive ?? false,
          icon: <DollarSign className="text-muted-foreground" size={20} />,
        },
        {
          title: 'Session Cancellation',
          description: 'Alerts when sessions are cancelled',
          value: settings?.session_cancel ?? false,
          icon: <Info className="text-muted-foreground" size={20} />,
        },
        {
          title: 'Promotion Purchase',
          description: 'When customers buy promotional packages',
          value: settings?.promotion_purchase ?? false,
          icon: <CreditCard className="text-muted-foreground" size={20} />,
        },
        {
          title: 'Email Notifications',
          description: 'Receive updates via email',
          value: settings?.email_notification ?? false,
          icon: <MessageSquare className="text-muted-foreground" size={20} />,
        },
        {
          title: 'SMS Notifications',
          description: 'Receive updates via text message',
          value: settings?.sms_notification ?? false,
          icon: <MessageCircle className="text-muted-foreground" size={20} />,
        },
        // {
        //   title: "Push Notifications",
        //   description: "Browser push notifications",
        //   value: settings?.push_notification ?? false,
        //   icon: <Bell className="text-muted-foreground" size={20} />,
        // },
      ]);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    setSavingChanges(true);

    try {
      const payload = {
        id: user?.id,
        new_booking: notificationInfo[0].value,
        payment_receive: notificationInfo[1].value,
        session_cancel: notificationInfo[2].value,
        promotion_purchase: notificationInfo[3].value,
        email_notification: notificationInfo[4].value,
        sms_notification: notificationInfo[5].value,
        // push_notification: notificationInfo[6].value,
      };

      const squarePayload = {
        live_merchant_id: squareIntegration.credentials.live.merchantId,
        live_location_id: squareIntegration.credentials.live.locationId,
        live_api_key: squareIntegration.credentials.live.apiKey,
        test_merchant_id: squareIntegration.credentials.test.merchantId,
        test_location_id: squareIntegration.credentials.test.locationId,
        test_api_key: squareIntegration.credentials.test.apiKey,
        mode: squareIntegration.mode === 'test',
      };
      await axios.put(`/user`, {
        id: user?.id,
        ...profileInfo,
      });

      await axios.put('/admin/settings', payload);
      await axios.put(`/square`, squarePayload);

      toast.success('Settings saved...');
    } finally {
      setSavingChanges(false);
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
                  value="Notification Preference"
                  className="dark:data-[state=active]:bg-[#CBFD0026] dark:data-[state=active]:text-primary dark:data-[state=active]:border-b-primary rounded-none h-9 px-4 text-[12px] leading-tight tracking-tight"
                >
                  <div className="flex gap-2 items-center py-2">
                    <FaBell />
                    Notification Preference
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="Role Permission"
                  className="dark:data-[state=active]:bg-[#CBFD0026] dark:data-[state=active]:text-primary dark:data-[state=active]:border-b-primary rounded-none h-9 px-4 text-[12px] leading-tight tracking-tight"
                >
                  <div className="flex gap-2 items-center py-2">
                    <RiShieldKeyholeLine />
                    Role Permission
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="Square Integration"
                  className="dark:data-[state=active]:bg-[#CBFD0026] dark:data-[state=active]:text-primary dark:data-[state=active]:border-b-primary rounded-none h-9 px-4 text-[12px] leading-tight tracking-tight"
                >
                  <div className="flex gap-2 items-center py-2">
                    <FaCreditCard />
                    Square Integration
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
                <TabsTrigger
                  value="Review"
                  className="dark:data-[state=active]:bg-[#CBFD0026] dark:data-[state=active]:text-primary dark:data-[state=active]:border-b-primary rounded-none h-9 px-4 text-[12px] leading-tight tracking-tight"
                >
                  <div className="flex gap-2 items-center py-2">
                    <Star />
                    Review
                  </div>
                </TabsTrigger>
              </TabsList>
              <Scrollbar orientation="horizontal" />
            </ScrollArea>
            <Separator />
            <CardContent className="p-4">
              <ProfileInfo
                profileInfo={profileInfo}
                setProfileInfo={setProfileInfo}
                profileImage={profileImage}
                setProfileImage={setProfileImage}
              />
              <NotificationPreference
                notificationInfo={notificationInfo}
                setNotificationInfo={setNotificationInfo}
              />
              <RolePersmission rolePermissions={rolePermissions} />
              <SquareIntegration
                squareIntegration={squareIntegration}
                setSquareIntegration={setSquareIntegration}
              />
              <Security />
              <Review />
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
