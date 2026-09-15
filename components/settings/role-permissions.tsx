import { GearIcon } from '@radix-ui/react-icons';
import { Calendar, CreditCard, DollarSign, Info, Shield, User, Users } from 'lucide-react';
import CardStatus from '../card-status';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { TabsContent } from '../ui/tabs';

const RolePersmission = ({ rolePermissions }: { rolePermissions: any }) => {
  return (
    <TabsContent value="Role Permission" className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-[18px] font normal">Role Permissions</h1>
        <p className="text-xs text-muted-foreground">View permissions associated with your role.</p>
      </div>

      <Card className="bg-info-bg/40 p-3 border-info-text/30">
        <CardContent className="p-0">
          <div className="flex gap-4 items-start">
            <Info size={14} className="text-info-text" />
            <div className="font-normal space-y-1">
              <Label className="text-info-text text-[14px] leading-none">
                Current Role: Super Admin
              </Label>
              <p className="text-muted-foreground text-xs">
                These permissions apply to your account
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex justify-between bg-[#1A1A1A] border border-[#3A3A3A] rounded-[10px] p-4">
          <div className="flex items-center gap-2">
            <Users className="text-gray-400" size={16} />
            <h1 className="text-[#E5E7EB] text-sm">Manage Users</h1>
          </div>
          <CardStatus value={rolePermissions.manage_users ? 'enabled' : 'disabled'} />
        </div>
        <div className="flex justify-between bg-[#1A1A1A] border border-[#3A3A3A] rounded-[10px] p-4">
          <div className="flex items-center gap-2">
            <User className="text-gray-400 " size={16} />
            <h1 className="text-[#E5E7EB] text-sm">Manage Players</h1>
          </div>
          <CardStatus value={rolePermissions.manage_players ? 'enabled' : 'disabled'} />
        </div>
        <div className="flex justify-between bg-[#1A1A1A] border border-[#3A3A3A] rounded-[10px] p-4">
          <div className="flex items-center gap-2">
            <Shield className="text-gray-400 " size={16} />
            <h1 className="text-[#E5E7EB] text-sm">Manage Coaches </h1>
          </div>
          <CardStatus value={rolePermissions.manage_coaches ? 'enabled' : 'disabled'} />
        </div>
        <div className="flex justify-between bg-[#1A1A1A] border border-[#3A3A3A] rounded-[10px] p-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-400 " size={16} />
            <h1 className="text-[#E5E7EB] text-sm">Manage Sessions</h1>
          </div>
          <CardStatus value={rolePermissions.manage_sessions ? 'enabled' : 'disabled'} />
        </div>
        <div className="flex justify-between bg-[#1A1A1A] border border-[#3A3A3A] rounded-[10px] p-4">
          <div className="flex items-center gap-2">
            <CreditCard className="text-gray-400" size={16} />
            <h1 className="text-[#E5E7EB] text-sm">Manage Payments</h1>
          </div>
          <CardStatus value={rolePermissions.manage_payments ? 'enabled' : 'disabled'} />
        </div>
        <div className="flex justify-between bg-[#1A1A1A] border border-[#3A3A3A] rounded-[10px] p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="text-gray-400 " size={16} />
            <h1 className="text-[#E5E7EB] text-sm">Manage Promotions</h1>
          </div>
          <CardStatus value={rolePermissions.manage_promotions ? 'enabled' : 'disabled'} />
        </div>
        <div className="flex justify-between bg-[#1A1A1A] border border-[#3A3A3A] rounded-[10px] p-4">
          <div className="flex items-center gap-2">
            <GearIcon className="text-gray-400 h-4 w-4" />
            <h1 className="text-[#E5E7EB] text-sm">System Settings</h1>
          </div>
          <CardStatus value={rolePermissions.system_settings ? 'enabled' : 'disabled'} />
        </div>
        <div className="flex justify-between bg-[#1A1A1A] border border-[#3A3A3A] rounded-[10px] p-4">
          <div className="flex items-center gap-2">
            <GearIcon className="text-gray-400 h-4 w-4" />
            <h1 className="text-[#E5E7EB] text-sm">View Reports</h1>
          </div>
          <CardStatus value={rolePermissions.view_reports ? 'enabled' : 'disabled'} />
        </div>
      </div>
    </TabsContent>
  );
};

export default RolePersmission;
