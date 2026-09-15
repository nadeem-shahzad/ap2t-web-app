import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import axios from '@/lib/axios';
import { Check, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';

interface User {
  id: number;
  name: string;
  email: string;
  parent: string;
  parent_email: string;
  age: number | 'N/A';
}

interface UserTableProps {
  data: User[];
  onClose: () => void;
}

const BulkEmail = ({ players }: { players: any }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(!open)}>
        <Send /> Send Bulk Emails
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Send Bulk Emails</DialogTitle>
          </DialogHeader>
          <UserTable data={players} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

function UserTable({ data, onClose }: UserTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAges, setSelectedAges] = useState<number[]>([]);
  const [subject, setSubject] = useState('');
  const isMobile = useIsMobile();

  const uniqueAges = useMemo(() => {
    return Array.from(
      new Set(data.map((u) => (typeof u.age === 'number' ? u.age : null)).filter(Boolean))
    ).sort((a, b) => a! - b!) as number[];
  }, [data]);

  const handleSelectAll = () => {
    if (selectedUsers.length === data.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(data.map((u) => u.id));
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const toggleAgeFilter = (age: number) => {
    setSelectedAges((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]
    );
  };

  const filteredData = data.filter((user) => {
    const matchesSearch = Object.values(user).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    );

    const matchesAge =
      selectedAges.length === 0 ||
      (typeof user.age === 'number' && selectedAges.includes(user.age));

    return matchesSearch && matchesAge;
  });

  const handleSendNotifications = async () => {
    if (selectedUsers.length === 0) return;
    setLoading(true);
    let emailPlayers: { email: string; parent_email: string | null; name: string }[] = [];
    selectedUsers.forEach((item) => {
      data.forEach((ep) => {
        if (ep.id === item) {
          emailPlayers.push({
            email: ep?.email,
            name: ep?.name,
            parent_email: ep?.parent_email,
          });
        }
      });
    });

    try {
      await axios.post(`/admin/bulk`, {
        emails: emailPlayers,
        msg,
        subject,
      });
      toast.success('Emails sent');
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  function handleClose() {
    setSelectedUsers([]);
    setSearch('');
    setMsg('');
    setLoading(false);
    setSelectedAges([]);
    onClose();
  }

  const content = (
    <div className="flex flex-col-reverse lg:flex-row gap-4">
      <div className="flex flex-col space-y-4 w-full h-full sm:min-w-[280px]">
        <div className="space-y-2">
          <Label>Enter Subject</Label>
          <Input
            placeholder="Search subject..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="flex flex-col flex-1 gap-2">
          <Label>Enter Message</Label>
          <Textarea
            placeholder="Type your message..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="min-h-24 h-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Filter Players</Label>
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Filter by Age</Label>
          <Select value="" onValueChange={(val) => toggleAgeFilter(Number(val))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Age" />
            </SelectTrigger>
            <SelectContent>
              {uniqueAges.map((age) => (
                <SelectItem key={age} value={age.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{age}</span>
                    {selectedAges.includes(age) && <Check className="ml-2 h-4 w-4 text-primary" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          variant="default"
          onClick={handleSendNotifications}
          disabled={selectedUsers.length === 0 || loading || !msg.trim()}
        >
          {loading ? 'Sending...' : 'Send Notification'}
        </Button>
      </div>

      <ScrollArea className="h-[50vh] sm:h-[70vh] w-full  sm:min-w-[300px] overflow-auto pr-2">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 justify-between">
            <Button variant="default" onClick={handleSelectAll}>
              {selectedUsers.length === data.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="sm:w-full w-[calc(100vw-100px)] overflow-x-auto ">
            <Table className="w-full min-w-[400px] ">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedUsers.length === data.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredData.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleSelectOne(user.id)}
                      />
                    </TableCell>
                    <TableCell>{user?.name}</TableCell>
                    <TableCell>{user?.parent}</TableCell>
                    <TableCell>{user?.age}</TableCell>
                    <TableCell>{user?.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return <ScrollArea className="h-[calc(100dvh-250px)] w-full">{content}</ScrollArea>;
  }

  return content;
}
export default BulkEmail;
