"use client";
import { useAuth } from "@/contexts/auth-context";
import axios from "@/lib/axios";
import { BookedSession, SessionCoach, SessionType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  DollarSign,
  Eye,
  Image,
  MapPin,
  SquarePen,
  Tag,
  Trash2,
  Users
} from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import ConfirmationDialog from "../alert-dialog";
import AppCalendar from "../app-calendar";
import SelectSessionType from "../players/select-session-type";
import { RequiredStar } from "../required-star";
import { TimePickerFixed } from "../time-picker-fixed";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Field, FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Spinner } from "../ui/spinner";
import { AssignCoachDialog } from "./assign-coach-dialog";
import { sessionSchema, } from "./create-session-dialog";


interface EditSessionDialogProps {
  sessionId?: number;
  sessionData?: SessionType & {
    coach_first_name?: string;
    coach_last_name?: string;
    variants?: Array<{ hour: number; price: number | string }>;
  };
  onSuccess?: () => void;
  coach_id?: string | null;
  promotion?: boolean;
}


type SessionSchemaValues = z.infer<typeof sessionSchema>;

export function EditSessionDialog({
  sessionId,
  sessionData,
  onSuccess,
  coach_id = null,
  promotion = false,
}: EditSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<null | number>(null);
  const [coach_Name, setCoach_name] = useState<string | null>(null);
  const [notAvailableSessions, setNotAvailableSessions] = useState<BookedSession[]>([]);
  const [booked, setBooked] = useState(false);
  const [coachSchedule, setCoachSchedule] = useState<Record<string, string>>({})
  const [blocked, setBlocked] = useState(false)
  const [blockedHours, setBlockedHours] = useState<any[]>([])
  const router = useRouter();
  const { isAdmin } = useAuth()
  const [all_sessions, setAllSessions] = useState<SessionCoach[]>([])
  const [sessionLoading, setSessionLoading] = useState(false)

  function to24Hour(timeStr: string): string {
    if (!timeStr) return "";
    if (!timeStr.includes("AM") && !timeStr.includes("PM")) return timeStr;
    const [time, suffix] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (suffix === "PM" && hours !== 12) hours += 12;
    if (suffix === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function getCoachBookedSessions(coachId: number | null): BookedSession[] {
    if (!all_sessions || all_sessions.length === 0 || !coachId) return [];
    return all_sessions
      .filter(
        (session) =>
          (session.status === "upcoming" || session.status === "ongoing") &&
          Number(coachId) === Number(session.coach_id) &&
          Number(session.id) !== Number(sessionId),
      )
      .map((session) => {
        const { start_time, end_time } = session;
        return {
          name: session.name,
          date: session.date,
          end_date: session.end_date,
          start_time,
          end_time,
        };
      });
  }

  function getSessionsConflicts(
    overrides: {
      start_time: string;
      end_time: string;
      date: Date | null;
      end_date: Date | null;
    } = {
        start_time: "",
        end_time: "",
        date: null,
        end_date: null
      },
  ): BookedSession[] {
    const selectedDate = overrides.date ?? form.getValues("date");
    const selectedEndDate = overrides.end_date ?? form.getValues("end_date");
    const selectedStartTime = overrides.start_time ?? form.getValues("start_time");
    const selectedEndTime = overrides.end_time ?? form.getValues("end_time");

    if (!selectedDate || !selectedEndDate || !selectedStartTime || !selectedEndTime) return [];

    const coachSessions = getCoachBookedSessions(form.getValues("coach_id"));
    const newStart = to24Hour(selectedStartTime);
    const newEnd = to24Hour(selectedEndTime);

    const toDateOnly = (d: Date | string) => {
      if (typeof d === "string") return d.slice(0, 10);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const selStartStr = toDateOnly(selectedDate);
    const selEndStr = toDateOnly(selectedEndDate);

    const conflicts = coachSessions.filter((session) => {
      const sessionStartStr = toDateOnly(session.date);
      const sessionEndStr = toDateOnly(session.end_date);
      const dateOverlap = sessionStartStr <= selEndStr && sessionEndStr >= selStartStr;
      const sessionStart24 = to24Hour(session.start_time);
      const sessionEnd24 = to24Hour(session.end_time);
      const timeOverlap = sessionStart24 < newEnd && sessionEnd24 > newStart;
      return dateOverlap && timeOverlap;
    });

    setNotAvailableSessions(conflicts);
    setBooked(conflicts.length > 0);
    return conflicts
  };
  function getBlockedConflict(values: SessionSchemaValues) {
    const conflicts = Object.entries(coachSchedule || {}).filter(
      ([blockedDateTime, status]) => {
        if (status !== "blocked") return false;


        const [blockedDateStr, blockedTimePart] = blockedDateTime.split("_");

        const selStartStr = moment(values.date).format("YYYY-MM-DD");
        const selEndStr = moment(values.end_date).format("YYYY-MM-DD");

        if (blockedDateStr < selStartStr || blockedDateStr > selEndStr) return false;


        const blockedTime24 = to24Hour(blockedTimePart);
        const newStart = to24Hour(values.start_time);
        const newEnd = to24Hour(values.end_time);

        return blockedTime24 >= newStart && blockedTime24 < newEnd;
      }
    );

    setBlocked(conflicts.length > 0);
    setBlockedHours(conflicts);
    return conflicts;
  }


  const form = useForm<SessionSchemaValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: "",
      description: "",
      type: undefined,
      age_limit: "",
      session_type: "",
      coach_id: coach_id ? Number(coach_id) : null,
      location: "",
      start_time: "",
      end_time: "",
      price: 0,
      pricing_mode: "single",
      variants: [],
      max_players: 0,
      apply_promotion: promotion,
      show_storefront: false,
      date: null,
      end_date: null,
      promotion_price: 0,
      image: "",
      promotion_start: null,
      promotion_end: null,
    },
  });

  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const applyPromotion = form.watch("apply_promotion");
  const image = form.watch("image");
  const selectedCoachId = form.watch("coach_id");
  const startTime = form.watch("start_time");
  const endTime = form.watch("end_time");
  const pricingMode = form.watch("pricing_mode");

  useEffect(() => {
    if (pricingMode !== "variants") return;

    const start = to24Hour(startTime);
    const end = to24Hour(endTime);
    if (!start || !end) {
      replaceVariants([]);
      return;
    }

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    const totalHours = Math.floor(
      (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60,
    );
    const previousPrices = new Map(
      form.getValues("variants").map((variant) => [variant.hour, variant.price]),
    );

    replaceVariants(
      Array.from({ length: Math.max(0, totalHours) }, (_, index) => index + 1)
        .map((hour) => ({ hour, price: previousPrices.get(hour) ?? 0 })),
    );
  }, [pricingMode, startTime, endTime, form, replaceVariants]);

  useEffect(() => {
    if (open && sessionData) {
      console.log(sessionData)
      form.reset({
        name: sessionData.name,
        description: sessionData.description,
        type: sessionData.type as "camp" | "clinic",
        age_limit: sessionData.age_limit,
        session_type: sessionData.session_type,
        coach_id: sessionData.coach_id,
        location: sessionData.location,
        date: sessionData?.date ? new Date(sessionData?.date) : null,
        end_date: sessionData.end_date ? new Date(sessionData.end_date) : null,
        start_time: sessionData.start_time,
        end_time: sessionData.end_time,
        price: Number(sessionData.price),
        pricing_mode: sessionData.variants?.length ? "variants" : "single",
        variants: sessionData.variants?.map((variant) => ({
          hour: Number(variant.hour),
          price: Number(variant.price),
        })) ?? [],
        max_players: Number(sessionData.max_players),
        apply_promotion: sessionData.apply_promotion,
        image: sessionData.image,
        promotion_price: Number(sessionData.promotion_price),
        promotion_start: sessionData.promotion_start
          ? new Date(sessionData.promotion_start)
          : null,
        promotion_end: sessionData.promotion_end
          ? new Date(sessionData.promotion_end)
          : null,
        show_storefront: (sessionData.show_storefront as boolean) ?? false,
      });
      setCoach_name(`${sessionData?.coach_first_name} ${sessionData?.coach_last_name}`)
      setCoachSchedule(sessionData?.coach_schedule_preference ?? {})
    }
  }, [open, sessionData]);

  useEffect(() => {
    if (coach_id) {
      form.setValue("coach_id", Number(coach_id));
    }
    setCoach_name(`${sessionData?.coach_first_name} ${sessionData?.coach_last_name}`);
  }, [coach_id, form]);

  async function editSession(values: SessionSchemaValues) {
    if (!sessionId) {
      toast.error("Session ID is required");
      return;
    }

    try {

      const sessionConflicts = getSessionsConflicts({
        date: values.date,
        end_date: values.end_date,
        start_time: values.start_time,
        end_time: values.end_time,
      });

      const hasSessionConflict = sessionConflicts.length > 0;
      setLoading(true);
      const blockedConflict = getBlockedConflict(values)
      const hasBlockedConflict = blockedConflict.length > 0
      if (hasSessionConflict) {
        toast.error("Can't update session because coach is already booked at this time and date")
        setLoading(false)
        return
      }
      if (hasBlockedConflict) {
        toast.error("Can't update session because coach has blocked his scedule.")
        setLoading(false)
        return
      }

      await axios.put(`/admin/sessions`, { ...values, id: sessionId, byAdmin: isAdmin });

      toast.success("Session updated successfully");
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  async function deleteSession() {
    if (!sessionId) {
      toast.error("Session ID is required");
      return;
    }

    setDeleteLoading(true);

    try {
      await axios.delete(`/admin/sessions/${sessionId}?byAdmin=${isAdmin}`);
      toast.success("Session deleted successfully");
      setDeleteLoading(false);
      setSelectedSession(null);
      handleClose();
      if (promotion) {
        router.replace("/portal/admin/promotions");
      } else {
        router.replace("/portal/admin/sessions");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  async function handleGetSessions(coachID: number) {
    if (!coachID) return
    setSessionLoading(true)

    try {
      const result = await axios.get(`/coach/${coachID}/sessions`);
      setAllSessions(result.data)

    } finally {
      setSessionLoading(false)
    }
  }

  function handleClose() {

    setOpen(false)

    setLoading(false);
    setDeleteLoading(false);
    setSelectedSession(null);
    setCoach_name(null);
    setNotAvailableSessions([]);
    setBooked(false);
    setCoachSchedule({})
    setBlocked(false)
    setBlockedHours([])
    setAllSessions([])
    setSessionLoading(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(!open)} variant={"outline"}>
        <SquarePen className="w-5 h-5" />
        {!promotion && "Edit"}
      </Button>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-[#252525] border border-[#3A3A3A] sm:max-w-4xl p-0 gap-0">
          <DialogHeader className="border-b border-[#3A3A3A] p-4">
            <DialogTitle className="text-[#F3F4F6] font-semibold text-lg">
              Edit {promotion ? "Promotion" : "Session"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(editSession, (e)=>{
            console.log(e)
          })}>
            <ScrollArea className=" py-1 space-y-4 px-2 h-[calc(100vh-250px)]">
              <div className="space-y-2 px-2 pb-2">
                <div className="flex gap-2 text-md ">
                  <Tag className="text-primary w-4 w-4" />
                  <h1 className="text-[#F3F4F6]">Basic Information</h1>
                </div>
                <div className="space-y-2">
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label className="text-sm text-[#99A1AF]">
                          Session Name <RequiredStar />
                        </Label>
                        <Input
                          {...field}
                          id={field.name}
                          aria-invalid={fieldState.invalid}
                          placeholder="Advance Skill Training"
                          autoComplete="off"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Controller
                    name="description"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label className="text-sm text-[#99A1AF]">
                          Description <RequiredStar />
                        </Label>
                        <Input
                          {...field}
                          id={field.name}
                          aria-invalid={fieldState.invalid}
                          placeholder=""
                          autoComplete="off"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Controller
                      name="type"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Label className="text-sm text-[#99A1AF]">
                            Type <RequiredStar />
                          </Label>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full dark:bg-[#1A1A1A]">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={"camp"}>Camp</SelectItem>
                              <SelectItem value={"clinic"}>Clinic</SelectItem>
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Controller
                      name="age_limit"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Label className="text-sm text-[#99A1AF]">
                            Age Limit <RequiredStar />
                          </Label>
                          <Input
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            placeholder="18-24"
                            autoComplete="off"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Controller
                      name="session_type"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Label className="text-sm text-[#99A1AF]">
                            Session Type <RequiredStar />
                          </Label>
                          <SelectSessionType
                            placeholder="Select session type"
                            value={field.value}
                            onChange={field.onChange}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Assigned Coach *
                    </Label>

                    {sessionLoading ? <Spinner /> :

                      <div className="flex gap-4 items-center">
                        {selectedCoachId && coach_Name && (
                          <p className="mt-1 text-sm text-ghost-text">
                            Selected Coach: {coach_Name}
                          </p>
                        )}
                        {(
                          <AssignCoachDialog
                            placeholder={coach_Name ? "Change Coach" : "Select Coach"}
                            onSelect={(coach) => {
                              form.setValue("coach_id", coach?.id, {
                                shouldValidate: true,
                              });
                              setCoach_name(
                                `${coach?.first_name} ${coach?.last_name}`,
                              );
                              setCoachSchedule(coach?.schedule)
                              handleGetSessions(coach?.id)
                            }}

                          />
                        )}
                      </div>
                    }
                  </div>
                </div>

                <div className="flex gap-2 text-md ">
                  <Calendar className="text-primary w-4 w-4" />
                  <h1 className="text-[#F3F4F6]">Schedule</h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Controller
                      name="date"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Label className="text-sm text-[#99A1AF]">
                            Start Date <RequiredStar />
                          </Label>
                          <AppCalendar
                            className="h-9"
                            date={
                              field.value ? new Date(field.value) : undefined
                            }
                            onChange={field.onChange}
                            required
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Controller
                      name="end_date"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Label className="text-sm text-[#99A1AF]">
                            End Date <RequiredStar />
                          </Label>
                          <AppCalendar
                            className="h-9"
                            date={
                              field.value ? new Date(field.value) : undefined
                            }
                            onChange={field.onChange}
                            required
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Controller
                      name="start_time"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Label className="text-sm text-[#99A1AF]">
                            Start Time <RequiredStar />
                          </Label>
                          <TimePickerFixed
                            className="h-9"
                            value={field.value}
                            onChange={field.onChange}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Controller
                      name="end_time"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Label className="text-sm text-[#99A1AF]">
                            End Time <RequiredStar />
                          </Label>
                          <TimePickerFixed
                            className="h-9"
                            value={field.value}
                            onChange={field.onChange}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </div>

                {booked && notAvailableSessions.length > 0 && (
                  <p className="text-sm text-red-500">
                    Coach is booked on session {notAvailableSessions[0].name} at{" "}
                    {moment(notAvailableSessions[0].date).format("YYYY-MM-DD")} till{" "}
                    {moment(notAvailableSessions[0].end_date).format("YYYY-MM-DD")} at time{" "}
                    {notAvailableSessions[0].start_time} till{" "}
                    {notAvailableSessions[0].end_time}
                  </p>
                )}
                {blocked && blockedHours.length > 0 && (
                  <p className="text-sm text-red-500">
                    Coach has blocked their schedule on:{" "}
                    {blockedHours.map(([blockedDateTime]) => {
                      const [date, time] = blockedDateTime.split("_");
                      return `${date} at ${time}`;
                    }).join(", ")}
                  </p>
                )}

                <div className="flex gap-2 text-md ">
                  <MapPin className="text-primary w-4 w-4" />
                  <h1 className="text-[#F3F4F6]">Location & Pricing</h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Controller
                      name="location"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Label className="text-sm text-[#99A1AF]">
                            Location <RequiredStar />
                          </Label>
                          <Input
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            placeholder=""
                            autoComplete="off"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  {pricingMode === "single" && (
                    <div className="space-y-2">
                      <Controller
                        name="price"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Label className="text-sm text-[#99A1AF]">
                              Price <RequiredStar />
                            </Label>
                            <Input
                              {...field}
                              id={field.name}
                              aria-invalid={fieldState.invalid}
                              placeholder=""
                              autoComplete="off"
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </div>
                  )}
                </div>

                {pricingMode === "single" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (applyPromotion) {
                        toast.error("Promotional sessions cannot have variants.");
                        return;
                      }
                      form.setValue("pricing_mode", "variants", { shouldValidate: true });
                    }}
                    className="mt-2"
                  >
                    Convert to variants
                  </Button>
                ) : (
                  <div className="mt-2 space-y-3 rounded-md border border-[#3A3A3A] bg-[#1A1A1A] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[#F3F4F6]">Session variants</p>
                        <p className="text-xs text-muted-foreground">Enter a price for every available duration.</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          form.setValue("pricing_mode", "single", { shouldValidate: true });
                          replaceVariants([]);
                          form.clearErrors("variants");
                        }}
                      >
                        Back to single session
                      </Button>
                    </div>

                    {!startTime || !endTime ? (
                      <p className="text-sm text-amber-500">Set the start and end times to generate variants.</p>
                    ) : variantFields.length === 0 ? (
                      <p className="text-sm text-red-500">End time must be at least one hour after start time.</p>
                    ) : (
                      <div className="space-y-3">
                        {variantFields.map((variant, index) => (
                          <Controller
                            key={variant.id}
                            name={`variants.${index}.price`}
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <Label className="text-sm text-[#99A1AF]">
                                  {variant.hour} {variant.hour === 1 ? "hour" : "hours"} price <RequiredStar />
                                </Label>
                                <Input {...field} type="number" min="0" step="0.01" value={field.value ?? ""} placeholder="0.00" />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </Field>
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 text-md ">
                  <Users className="text-primary w-4 w-4" />
                  <h1 className="text-[#F3F4F6]">Capacity & Promotions</h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Controller
                      name="max_players"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Label className="text-sm text-[#99A1AF]">
                            Max Players <RequiredStar />
                          </Label>
                          <Input
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            placeholder=""
                            autoComplete="off"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Controller
                      name="apply_promotion"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Label className="text-sm text-[#99A1AF]">
                            Apply Promotion (Optional)
                          </Label>
                          <Select
                            value={String(field.value)}
                            onValueChange={(val) => {
                              if (val === "true" && pricingMode === "variants") {
                                toast.error("Sessions with variants cannot be made promotional.");
                                return;
                              }
                              field.onChange(val === "true");
                            }}
                          >
                            <SelectTrigger className="w-full dark:bg-[#1A1A1A] rounded-sm">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>

                            <SelectContent className="!bg-[#1A1A1A]">
                              <SelectGroup>
                                <SelectLabel>Select</SelectLabel>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </div>

                {applyPromotion && (
                  <>
                    <div className="flex gap-2 text-md items-center">
                      <Image className="text-primary" size={16} />
                      <h1 className="text-[#F3F4F6]">Promotional Flyer</h1>
                    </div>
                    <div className="space-y-2">
                      <Controller
                        name="image"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Label className="text-sm text-[#99A1AF]">
                              Image Url <RequiredStar />
                            </Label>
                            <Input
                              {...field}
                              id={field.name}
                              aria-invalid={fieldState.invalid}
                              placeholder=""
                              autoComplete="off"
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </div>

                    <div className="bg-[#1A1A1A] border border-border rounded-[10px] p-4 space-y-2">
                      <h1 className="text-[#99A1AF]">Preview:</h1>

                      {image ? (
                        <img
                          src={image}
                          className="w-full h-50 object-contain"
                        />
                      ) : (
                        <div className="w-full h-50" />
                      )}
                    </div>

                    <div className="flex gap-2 text-md items-center">
                      <Calendar className="text-primary" size={16} />
                      <h1 className="text-[#F3F4F6]">Promotion Duration</h1>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Controller
                          name="promotion_start"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <Label className="text-sm text-[#99A1AF]">
                                Start Date <RequiredStar />
                              </Label>
                              <AppCalendar
                                className="h-9"
                                date={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onChange={field.onChange}
                                required
                              />
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Controller
                          name="promotion_end"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <Label className="text-sm text-[#99A1AF]">
                                End Date <RequiredStar />
                              </Label>
                              <AppCalendar
                                className="h-9"
                                date={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onChange={field.onChange}
                                required
                              />
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 text-md items-center">
                      <DollarSign className="text-primary" size={16} />
                      <h1 className="text-[#F3F4F6]">Price</h1>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Controller
                          name="promotion_price"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <Label className="text-sm text-[#99A1AF]">
                                Promotion Price <RequiredStar />
                              </Label>
                              <Input
                                {...field}
                                id={field.name}
                                aria-invalid={fieldState.invalid}
                                placeholder=""
                                autoComplete="off"
                              />
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 text-md items-center">
                      <Eye className="text-primary" size={16} />
                      <h1 className="text-[#F3F4F6]">Storefront Display</h1>
                    </div>

                    <div className="flex items-center gap-4 px-8 bg-[#1A1A1A] border border-[#3A3A3A] rounded-[10px] p-2">
                      <Controller
                        name="show_storefront"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <>
                            <div className="pt-1 flex-none">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </div>

                            <div className="flex-1">
                              <label className="text-sm font-medium text-[#D1D5DC]">
                                Show on Online Storefront
                              </label>

                              <p className="text-sm text-[#6A7282]">
                                Display promotional card with image, title,
                                price
                              </p>

                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </div>
                          </>
                        )}
                      />
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
            <Separator />

            <div className="p-4 flex flex-wrap gap-4 justify-between">
              <Button
                variant={"destructive"}
                type="button"
                onClick={() =>
                  setSelectedSession(sessionId ? Number(sessionId) : null)
                }
              >
                <Trash2 /> Delete
              </Button>
              <div className="flex gap-4 flex-wrap">
                <DialogClose className="text-[13px] font-medium h-8 px-4 py-2 has-[>svg]:px-3 bg-black text-white border-border rounded-md hover:opacity-70 cursor-pointer flex flex-1 items-center justify-center">
                  Cancel
                </DialogClose>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 text-[13px]"
                >
                  {loading && <Spinner className="text-black" />}
                  Save
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        loading={deleteLoading}
        open={!!selectedSession}
        onPressCancel={() => setSelectedSession(null)}
        onPressYes={async () => await deleteSession()}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove this item from the system"}
      />
    </>
  );
}
