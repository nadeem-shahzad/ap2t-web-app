import { NotificationSetting } from '@/lib/types';
import { Switch } from '../ui/switch';
import { TabsContent } from '../ui/tabs';

const NotificationPreference = ({
  notificationInfo,
  setNotificationInfo,
}: {
  notificationInfo: NotificationSetting[];
  setNotificationInfo: (val: any) => void;
}) => {
  return (
    <TabsContent value="Notification Preference" className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-[18px] font normal">Notification Preferences</h1>
        <p className="text-xs text-muted-foreground">
          Configure how and when you receive notifications.
        </p>
      </div>

      <div className="space-y-2">
        <h1 className="text-lg font-semibold text-[#F3F4F6]">Activity Notifications</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {notificationInfo.map((item: NotificationSetting, i: number) => (
            <div
              key={i}
              className="flex justify-between items-center py-3 px-4 bg-[#1A1A1A] border border-border rounded-lg"
            >
              <div className="flex items-center gap-4">
                {item.icon}
                <div className="space-y-0">
                  <h1 className="text-[14px] text-[#F3F4F6]">{item.title}</h1>
                  <p className="text-xs text-[#99A1AF]">{item.description}</p>
                </div>
              </div>

              <Switch
                className="mr-2"
                checked={item.value}
                onCheckedChange={(val) =>
                  setNotificationInfo((prevState: any) => {
                    const newState = [...prevState];
                    newState[i].value = val;
                    return newState;
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>
    </TabsContent>
  );
};

export default NotificationPreference;
