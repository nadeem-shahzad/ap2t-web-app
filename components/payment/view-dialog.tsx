import { Calendar, Clock, CreditCard, DollarSign, File, ShieldCheck, User } from 'lucide-react';
import moment from 'moment';
import { GoDotFill } from 'react-icons/go';
import CardStatus from '../card-status';
import { DialogClose, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { PaymentItem } from '@/lib/types';

export function ViewDialog({ data }: { data: PaymentItem }) {
  return (
    <DialogContent className="bg-[#252525] border border-border p-0 sm:max-w-4xl">
      <DialogHeader className="border-b border-border p-4">
        <DialogTitle className="text-lg font-semibold text-[#F3F4F6]">Payment Details</DialogTitle>
        <p className="text-sm text-ghost-text">Transaction</p>
        <p className="text-sm text-ghost-text">{data.transaction_id}</p>
      </DialogHeader>
      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="px-6 py-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1A1A1A] border border-border p-4 space-y-1 rounded-[10px]">
              <div className="flex gap-2 items-center">
                <DollarSign className="text-primary h-4 w-4" />
                <p className="text-sm text-ghost-text">Amount</p>
              </div>
              <h1 className="text-xl text-[#F3F4F6] ml-2">${data.amount}</h1>
            </div>
            <div className="bg-[#1A1A1A] border border-border p-4 space-y-2 rounded-[10px]">
              <div className="flex gap-2 items-center">
                <ShieldCheck className="text-primary h-4 w-4" />
                <p className="text-sm text-ghost-text">Status</p>
              </div>
              <CardStatus value={data.status} className="w-20" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-normal text-[#E5E7EB]">Payment Information</h1>

            <div className="space-y-3">
              <div className="bg-[#1A1A1A] border border-border rounded-[10px] flex justify-between p-4">
                <div className="flex gap-2 text-[#99A1AF]">
                  <User />
                  <h1>Parent/Guardian</h1>
                </div>
                <h1 className="text-[#E5E7EB]">{data.parent_name}</h1>
              </div>
              <div className="bg-[#1A1A1A] border border-border rounded-[10px] flex justify-between p-4">
                <div className="flex gap-2 text-[#99A1AF]">
                  <User />
                  <h1>Player</h1>
                </div>
                <h1 className="text-[#E5E7EB]">{data.player_name}</h1>
              </div>
              <div className="bg-[#1A1A1A] border border-border rounded-[10px] flex justify-between p-4">
                <div className="flex gap-2 text-[#99A1AF]">
                  <File />
                  <h1>Session</h1>
                </div>
                <h1 className="text-[#E5E7EB]">{data.session_name}</h1>
              </div>
              <div className="bg-[#1A1A1A] border border-border rounded-[10px] flex justify-between p-4">
                <div className="flex gap-2 text-[#99A1AF]">
                  <Calendar />
                  <h1>Date</h1>
                </div>
                <h1 className="text-[#E5E7EB]">
                  {data.created_at && moment(new Date(data.created_at)).format('YYYY-MM-DD')}
                </h1>
              </div>
              <div className="bg-[#1A1A1A] border border-border rounded-[10px] flex justify-between p-4">
                <div className="flex gap-2 text-[#99A1AF]">
                  <Clock />
                  <h1>Time</h1>
                </div>
                <h1 className="text-[#E5E7EB]">
                  {data.created_at && moment(new Date(data.created_at)).format('hh:mm A')}
                </h1>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-lg text-[#E5E7EB]">Payment Method</h1>
            <div className="bg-[#1A1A1A] border border-border rounded-[10px] flex justify-between p-4">
              <div className="flex gap-2 items-center">
                <div className="bg-info-bg text-info-text p-2 rounded-[10px]">
                  <CreditCard />
                </div>
                <div className="space-y-0">
                  <h1 className="text-[#E5E7EB]">{data.method || 'N/A'}</h1>
                  {/* <p className="text-xs text-[#99A1AF]">{data.methodDetail}</p> */}
                </div>
              </div>
              {data?.method !== 'Cash' && (
                <div className="space-y-0">
                  <p className="text-xs text-ghost-text">Processed via</p>
                  <h1 className="text-[#E5E7EB]">Square</h1>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-lg text-[#E5E7EB]">Payment Information</h1>

            <div className="space-y-1">
              <div className="bg-[#1A1A1A] border border-border rounded-[10px] flex p-4 gap-2">
                <GoDotFill className="text-active-text" />
                <h1 className="text-[#D1D5DC]">Duplicate charge prevention verified</h1>
              </div>
              <div className="bg-[#1A1A1A] border border-border rounded-[10px] flex p-4 gap-2">
                <GoDotFill className="text-active-text" />
                <h1 className="text-[#D1D5DC]">PCI DSS compliant via Square</h1>
              </div>
              <div className="bg-[#1A1A1A] border border-border rounded-[10px] flex p-4 gap-2">
                <GoDotFill className="text-active-text" />
                <h1 className="text-[#D1D5DC]">Card securely stored in Square vault</h1>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-[#3A3A3A]">
        <div className="flex justify-end gap-4  ">
          <DialogClose className="text-[12px] font-medium tracking-wider leading-none h-10 px-4 py-2 bg-primary text-black rounded-md hover:opacity-70 cursor-pointer flex  items-center justify-center">
            Close
          </DialogClose>
        </div>
      </div>
    </DialogContent>
  );
}
