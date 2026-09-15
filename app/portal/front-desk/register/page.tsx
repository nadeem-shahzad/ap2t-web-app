'use client';

import AppCalendar from '@/components/app-calendar';
import GradientIcon from '@/components/landing/icon-container';
import { RequiredStar } from '@/components/required-star';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
  Stepper,
  StepperContent,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTrigger,
} from '@/components/ui/stepper';
import axios from '@/lib/axios';
import { DARKMODECARDSTYLE } from '@/lib/constants';
import { GetSquare } from '@/lib/square-creds';
import { File, FileWarning, Plus, User, Wallet } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import PageTable from '@/components/app-table';
import InputWithIcon from '@/components/input-with-icon';
import Header from '@/components/players/header';

import { useAuth } from '@/contexts/auth-context';

import { PLAYERS_COLUMNS_FD } from '@/components/frontdesk/columns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getYear, joinNames } from '@/lib/functions';
import { PlayerData } from '@/lib/types';
import { Filter } from 'lucide-react';
import moment from 'moment';

export default function Page() {
  const [filter, setFilter] = useState(false);
  const [players, setPlayers] = useState<PlayerData[] | []>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [coachSearch, setCoachSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [ageSearch, setAgeSearch] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  async function fetchData() {
    try {
      const result = await axios.get('/admin/users?role=player');
      if (result.data) {
        const mappedPlayers = result.data.map((p: any) => ({
          id: p.id,
          name: joinNames([p.first_name, p.last_name]),
          coach_name: joinNames([p?.coach_first_name, p?.coach_last_name]),
          age: getYear(p.birth_date),
          position: p.position || 'N/A',
          phone: p.phone_no,
          parent: joinNames([p?.parent_first_name, p?.parent_last_name]),
          last_session: p?.last_session || 'N/A',
          last_session_date: p?.last_session_date
            ? moment(new Date(p?.last_session_date)).format('YYYY-MM-DD')
            : 'N/A',
          attendance: String(p?.attendance_percent || 0),
          joining_date: p.created_at,
        }));
        setPlayers(mappedPlayers);
      }
    } catch (error) {
      console.error('Error fetching players', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredData = players.filter((item) => {
    const playerSearchText = `${item?.name} ${item?.parent} ${item?.position}`.toLowerCase();
    const coachSearchText = `${item?.coach_name ?? ''}`.toLowerCase();
    const typeSearchText = `${item?.last_session ?? ''}`.toLowerCase();
    const playerAge = Number(item?.age ?? 0);

    // Split search into words for more flexible matching
    const playerSearchWords = search?.toLowerCase().trim().split(/\s+/).filter(Boolean) || [];
    const coachSearchWords = coachSearch?.toLowerCase().trim().split(/\s+/).filter(Boolean) || [];
    const typeSearchWords = typeSearch?.toLowerCase().trim().split(/\s+/).filter(Boolean) || [];

    const matchesPlayer =
      !playerSearchWords.length ||
      playerSearchWords.every((word) => playerSearchText.includes(word));

    const matchesCoach =
      !coachSearchWords.length || coachSearchWords.every((word) => coachSearchText.includes(word));

    const matchesType =
      !typeSearchWords.length || typeSearchWords.every((word) => typeSearchText.includes(word));

    const matchesAge = !ageSearch || playerAge <= Number(ageSearch);

    return matchesPlayer && matchesCoach && matchesType && matchesAge;
  });

  return (
    <div className="flex flex-col w-full gap-6">
      <Header length={players.length}>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <RegistrationDialog
            onRefresh={async () => {
              await fetchData();
            }}
          />
        </div>
      </Header>

      <div className="flex flex-col gap-4 rounded-[14px] bg-#252525 border border-[#3A3A3A] p-4 bg-[#252525]">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="w-full">
            <InputWithIcon
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by player name, parent or position..."
            />
          </div>

          <Button onClick={() => setFilter(!filter)}>
            <Filter /> Filters
          </Button>
        </div>

        {filter && (
          <div className="flex flex-col w-full gap-4">
            <Separator />
            <div className="flex flex-col sm:flex-row w-full gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground font-normal">Coach</Label>
                <Input
                  value={coachSearch}
                  onChange={(e) => setCoachSearch(e.target.value)}
                  className="rounded-[8px] dark:bg-black"
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground font-normal">Session</Label>
                <Input
                  className="rounded-[8px] dark:bg-black"
                  value={typeSearch}
                  onChange={(e) => setTypeSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground font-normal">age</Label>
                <Input
                  className="rounded-[8px] dark:bg-black"
                  value={ageSearch}
                  onChange={(e) => setAgeSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <PageTable loading={loading} columns={PLAYERS_COLUMNS_FD} data={filteredData} />
    </div>
  );
}

export function RegistrationDialog({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [underAged, setUnderAged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selfPaid, setSelfPaid] = useState(false);

  const squareCardRef = useRef<any>(null);
  const squareInitializedRef = useRef(false);

  const [playerData, setPlayerData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    location: '',
    zip_code: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const [parentData, setParentData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    location: '',
    zip_code: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const [cardholderName, setCardholderName] = useState('');

  const [waiverData, setWaiverData] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const age = new Date().getFullYear() - new Date(playerData.birth_date).getFullYear();
    setUnderAged(age < 18);
  }, [playerData.birth_date]);

  useEffect(() => {
    if (currentStep !== 1) return;

    const initSquare = async () => {
      try {
        if (typeof (window as any).Square === 'undefined') {
          toast.error('Payment system failed to load. Please refresh.');
          return;
        }

        const { error, merchant, location } = await GetSquare();

        if (error) toast.error('Square configuration not found');

        const payments = (window as any).Square.payments(merchant!, location!);

        const card = await payments.card({
          style: DARKMODECARDSTYLE,
        });

        await card.attach('#square-card-container');
        squareCardRef.current = card;
        squareInitializedRef.current = true;
      } catch (err: any) {
        console.log(err);
        toast.error('Failed to load payment form: ' + err.message);
      }
    };
    initSquare();
  }, [currentStep]);

  const checkinfo = () => {
    if (currentStep !== 0) return;

    if (
      !playerData.first_name ||
      !playerData.last_name ||
      !playerData.birth_date ||
      !playerData.location ||
      !playerData.zip_code ||
      !playerData.email ||
      !playerData.password ||
      !playerData.confirm_password
    ) {
      toast.error('Please complete all player fields');
      return;
    }

    if (playerData.password !== playerData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (underAged && !selfPaid) {
      if (
        !parentData.first_name ||
        !parentData.last_name ||
        !parentData.birth_date ||
        !parentData.location ||
        !parentData.zip_code ||
        !parentData.email ||
        !parentData.password ||
        !parentData.confirm_password
      ) {
        toast.error('Please complete all parent fields');
        return;
      }

      if (parentData.password !== parentData.confirm_password) {
        toast.error('Parent passwords do not match');
        return;
      }
    }

    setCurrentStep(1);
  };

  const checkPayment = async () => {
    if (!cardholderName.trim()) {
      toast.error('Please enter the cardholder name');
      return;
    }

    if (!squareCardRef.current) {
      toast.error('Payment form not ready. Please wait a moment.');
      return;
    }

    try {
      setLoading(true);

      const result = await squareCardRef.current.tokenize();

      if (result.status !== 'OK') {
        const errorMsg = result.errors?.[0]?.message || 'Invalid card details';
        toast.error(errorMsg);
        return;
      }

      sessionStorage.setItem('sq_card_token_fd', result.token);
      setCurrentStep(2);
    } catch (err: any) {
      toast.error('Payment error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerData.email || !playerData.password) return;
    if (playerData.password !== playerData.confirm_password) return;
    if (!playerData.birth_date) {
      toast.error('Birth date is required');
      return;
    }
    if (underAged && !selfPaid) {
      if (!parentData.email || !parentData.password) {
        toast.error("Under aged players required parent's information");
        return;
      }
      if (parentData.password !== parentData.confirm_password) {
        toast.error("parent's password did not match");
        return;
      }
    }
    if (!waiverData) {
      toast.error('Please agree to the waiver');
      return;
    }

    const cardToken = sessionStorage.getItem('sq_card_token_fd');
    if (!cardToken) {
      toast.error('Payment info missing. Please go back and re-enter your card.');
      setCurrentStep(1);
      return;
    }

    const payload: any = {
      player: {
        first_name: playerData.first_name,
        last_name: playerData.last_name,
        email: playerData.email,
        zip_code: playerData.zip_code,
        password: playerData.password,
        birth_date: playerData.birth_date,
        location: playerData.location,
        role: 'player',
      },
      parent: {},
    };

    if (underAged && !selfPaid) {
      payload.parent = {
        first_name: parentData.first_name,
        last_name: parentData.last_name,
        zip_code: parentData.zip_code,
        email: parentData.email,
        password: parentData.password,
        birth_date: parentData.birth_date,
        location: parentData.location,
        role: 'parent',
        card_token: cardToken,
        cardholder_name: cardholderName,
      };
    } else {
      payload.player = {
        ...payload.player,
        card_token: cardToken,
        cardholder_name: cardholderName,
      };
    }

    try {
      setLoading(true);

      await axios.post('/user?special=true', payload);
      sessionStorage.removeItem('sq_card_token_fd');
      await onRefresh();
      toast.success('Player successfully registered');

      handleReset();
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  function handleReset() {
    setOpen(false);

    setUnderAged(false);
    setLoading(false);
    setSelfPaid(false);

    setPlayerData({
      first_name: '',
      last_name: '',
      birth_date: '',
      location: '',
      zip_code: '',
      email: '',
      password: '',
      confirm_password: '',
    });

    setParentData({
      first_name: '',
      last_name: '',
      birth_date: '',
      location: '',
      zip_code: '',
      email: '',
      password: '',
      confirm_password: '',
    });

    setCardholderName('');
    setWaiverData(false);
    setCurrentStep(0);
  }

  const steps = [
    {
      id: 'personal info',
      icon: <User />,
      step: 0,
      content: (
        <form className="bg-[#131313] p-6 rounded-[10px] w-full">
          <div className="space-y-6">
            <div className="border-b border-[#282828] pb-3">
              <h2 className="text-sm font-medium">Player Information</h2>
            </div>

            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
              <div className="flex-1">
                <Label className="text-sm">
                  First Name <RequiredStar />
                </Label>
                <Input
                  type="text"
                  placeholder="First Name"
                  className="w-full px-4"
                  value={playerData.first_name}
                  onChange={(e) =>
                    setPlayerData((prev) => ({ ...prev, first_name: e.target.value }))
                  }
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm">
                  Last Name <RequiredStar />
                </Label>
                <Input
                  type="text"
                  placeholder="Last Name"
                  className="w-full px-4"
                  value={playerData.last_name}
                  onChange={(e) =>
                    setPlayerData((prev) => ({ ...prev, last_name: e.target.value }))
                  }
                />
              </div>

              <div className="flex-1">
                <Label className="text-sm">
                  Birth Date <RequiredStar />
                </Label>
                <AppCalendar
                  date={playerData.birth_date ? new Date(playerData.birth_date) : undefined}
                  onChange={(date) => setPlayerData((prev) => ({ ...prev, birth_date: date }))}
                  required
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm">
                  Town / City <RequiredStar />
                </Label>
                <Input
                  type="text"
                  placeholder="New York"
                  className="w-full px-4"
                  value={playerData.location}
                  onChange={(e) => setPlayerData((prev) => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div className="flex-1">
                <Label className="text-sm">
                  Zip Code <RequiredStar />
                </Label>
                <Input
                  type="text"
                  placeholder="10001"
                  className="w-full px-4"
                  value={playerData.zip_code}
                  onChange={(e) => setPlayerData((prev) => ({ ...prev, zip_code: e.target.value }))}
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm">
                  Email <RequiredStar />
                </Label>
                <Input
                  type="email"
                  placeholder="johnsmith@gmail.com"
                  className="w-full px-4"
                  value={playerData.email}
                  onChange={(e) =>
                    setPlayerData((prev) => ({
                      ...prev,
                      email: e.target.value.trim().toLowerCase(),
                    }))
                  }
                />
              </div>

              <div className="flex-1">
                <Label className="text-sm">
                  Password <RequiredStar />
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4"
                  value={playerData.password}
                  onChange={(e) => setPlayerData((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm">
                  Confirm Password <RequiredStar />
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4"
                  value={playerData.confirm_password}
                  onChange={(e) =>
                    setPlayerData((prev) => ({ ...prev, confirm_password: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex p-1 gap-2 items-center">
              <Checkbox
                className="border-primary border-2 data-[state=checked]:border-white data-[state=checked]:bg-primary data-[state=checked]:text-black dark:data-[state=checked]:border-white dark:data-[state=checked]:bg-primary"
                checked={selfPaid}
                onCheckedChange={(checked) => setSelfPaid(checked === true)}
              />
              <p className="text-muted-foreground">I will pay my self</p>
            </div>

            {underAged && !selfPaid && (
              <>
                <Separator />
                <div className="border-b border-[#282828] pb-3">
                  <h2 className="text-sm font-medium">Parent Information</h2>
                </div>

                <div className="flex gap-4 grid grid-cols-1 sm:grid-cols-2">
                  <div className="flex-1">
                    <Label className="text-sm">
                      First Name <RequiredStar />
                    </Label>
                    <Input
                      type="text"
                      placeholder="First Name"
                      className="w-full px-4"
                      value={parentData.first_name}
                      onChange={(e) =>
                        setParentData((prev) => ({ ...prev, first_name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm">
                      Last Name <RequiredStar />
                    </Label>
                    <Input
                      type="text"
                      placeholder="Last Name"
                      className="w-full px-4"
                      value={parentData.last_name}
                      onChange={(e) =>
                        setParentData((prev) => ({ ...prev, last_name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="flex-1">
                    <Label className="text-sm">
                      Birth Date <RequiredStar />
                    </Label>
                    <AppCalendar
                      date={parentData.birth_date ? new Date(parentData.birth_date) : undefined}
                      onChange={(date) => setParentData((prev) => ({ ...prev, birth_date: date }))}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm">
                      Town / City <RequiredStar />
                    </Label>
                    <Input
                      type="text"
                      placeholder="New York"
                      className="w-full px-4"
                      value={parentData.location}
                      onChange={(e) =>
                        setParentData((prev) => ({ ...prev, location: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      Zip Code <RequiredStar />
                    </Label>
                    <Input
                      type="text"
                      placeholder="10001"
                      className="w-full px-4"
                      value={parentData.zip_code}
                      onChange={(e) =>
                        setParentData((prev) => ({ ...prev, zip_code: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">
                      Email <RequiredStar />
                    </Label>
                    <Input
                      type="email"
                      placeholder="johnsmith@gmail.com"
                      className="w-full px-4"
                      value={parentData.email}
                      onChange={(e) =>
                        setParentData((prev) => ({
                          ...prev,
                          email: e.target.value.trim().toLowerCase(),
                        }))
                      }
                    />
                  </div>

                  <div className="flex-1">
                    <Label className="text-sm">
                      Password <RequiredStar />
                    </Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4"
                      value={parentData.password}
                      onChange={(e) =>
                        setParentData((prev) => ({ ...prev, password: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm">
                      Confirm Password <RequiredStar />
                    </Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4"
                      value={parentData.confirm_password}
                      onChange={(e) =>
                        setParentData((prev) => ({
                          ...prev,
                          confirm_password: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-4">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  checkinfo();
                }}
                className="flex-1 bg-primary text-secondary"
              >
                Continue
              </Button>
            </div>
          </div>
        </form>
      ),
    },
    {
      id: 'payment',
      icon: <Wallet />,
      step: 1,
      content: (
        <div className="bg-[#131313] p-6 rounded-[10px] w-full">
          <div className="space-y-6">
            <div className="border-b border-[#282828] pb-3">
              <h2 className="text-sm font-medium">Payment Information</h2>
            </div>

            <div>
              <Label className="text-sm">
                Cardholder Name <RequiredStar />
              </Label>
              <Input
                type="text"
                placeholder="Joe Smith"
                className="w-full px-4"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm block mb-2">
                Card Details <RequiredStar />
              </Label>
              <div id="square-card-container" className="min-h-[100px] rounded-[6px] p-1" />
            </div>

            <div className="bg-[#CBFD0026] flex items-center gap-2 p-2 rounded-[5px]">
              <p className="text-xs text-muted-foreground">
                Note: Your card will be securely stored for membership payments. You will not be
                charged until you select a session.
              </p>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => setCurrentStep(0)} className="flex-1 bg-secondary text-white">
                Back
              </Button>
              <Button
                onClick={checkPayment}
                disabled={loading}
                className="flex-1 bg-primary text-secondary"
              >
                {loading ? <Spinner className="text-black" /> : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'waiver',
      icon: <File />,
      step: 2,
      content: (
        <form className="bg-[#131313] p-6 rounded-[10px] w-full">
          <div className="space-y-6">
            <div className="border-b border-[#282828] pb-3">
              <h2 className="text-sm font-medium">Waiver Agreement</h2>
            </div>

            <div className="p-10 bg-[#282828] rounded-[10px]">
              <article className="space-y-2">
                <h1>Liability Waiver and Release Form</h1>
                <p>
                  I, the undersigned, acknowledge that participation in sports and physical training
                  activities involves inherent risks, including but not limited to physical injury,
                  disability, or death.
                </p>
                <p>
                  I voluntarily agree to assume all risks associated with my participation in
                  programs offered by Advanced Physical and Technical Training. I hereby release,
                  waive, discharge, and covenant not to sue Advanced Physical and Technical
                  Training, its owners, employees, coaches, and affiliates from any and all
                  liability for any injury, loss, or damage to person or property.
                </p>
                <p>
                  I certify that I am in good physical condition and have no medical conditions that
                  would prevent me from participating in physical activities. I agree to follow all
                  safety guidelines and instructions provided by the coaching staff.
                </p>
                <p>
                  I understand that this waiver is binding upon my heirs, executors, administrators,
                  and assigns.
                </p>
              </article>
            </div>

            <div className="bg-[#CBFD0026] flex items-center gap-2 p-2 rounded-[5px]">
              <div className="flex p-1 gap-2 items-center">
                <Checkbox
                  className="border-primary border-2 data-[state=checked]:border-white data-[state=checked]:bg-primary data-[state=checked]:text-black dark:data-[state=checked]:border-white dark:data-[state=checked]:bg-primary"
                  checked={waiverData}
                  onCheckedChange={(checked) => setWaiverData(checked === true)}
                />
                <p className="text-muted-foreground">
                  I have read and agree to the terms of the Liability Waiver and Release Form. I
                  understand that by checking this box, I am electronically signing this agreement.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentStep(1);
                }}
                className="flex-1 bg-secondary text-white"
              >
                Back
              </Button>
              <Button
                onClick={signUp}
                disabled={loading}
                className="flex-1 bg-primary text-secondary"
              >
                {loading && <Spinner className="text-black" />} Sign Up
              </Button>
            </div>
          </div>
        </form>
      ),
    },
  ];

  return (
    <>
      <Button onClick={() => setOpen(!open)}>
        <Plus /> Register
      </Button>

      <Dialog open={open} onOpenChange={() => handleReset()}>
        <DialogOverlay />
        <DialogContent className="sm:max-w-[80dvw]">
          <DialogHeader>
            <DialogTitle>Register New Player</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[80dvh] p-4">
            <div className="flex flex-col w-full">
              <div className="flex flex-col gap-6 w-full">
                <div className="bg-[#CBFD0026] flex items-center gap-2 p-2 rounded-[5px]">
                  <FileWarning className="text-primary w-4 h-4" />
                  <p className="text-xs text-muted-foreground">
                    EVERY ACCOUNT NEEDS A CREDIT CARD ON FILE & TO SIGN A WAIVER
                  </p>
                </div>

                <Stepper value={currentStep} onValueChange={() => {}} className="space-y-8 w-full">
                  <StepperNav>
                    {steps.map((s) => (
                      <StepperItem key={s.id} step={s.step}>
                        <StepperTrigger>
                          <GradientIcon className={`${s.step <= currentStep && 'text-primary'}`}>
                            {s.icon}
                          </GradientIcon>
                        </StepperTrigger>
                        {steps.length > s.step && (
                          <StepperSeparator className="group-data-[state=completed]/step:bg-primary" />
                        )}
                      </StepperItem>
                    ))}
                  </StepperNav>
                  <StepperPanel className="text-sm">
                    {steps.map((s) => (
                      <StepperContent
                        key={s.step}
                        value={s.step}
                        className="flex items-center justify-center"
                      >
                        {s.content}
                      </StepperContent>
                    ))}
                  </StepperPanel>
                </Stepper>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
