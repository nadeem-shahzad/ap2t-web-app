"use client";
import { useAuth } from "@/contexts/auth-context";
import axios from "@/lib/axios";
import { BookedSession, SessionCoach } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  DollarSign,
  Eye,
  Image,
  MapPin,
  Plus,
  Tag,
  Users,
} from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
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



export const sessionSchema = z.object({
  name: z.string().min(2, "Session name is required"),
  description: z.string().min(2, "Description is required"),
  type: z.enum(["camp", "clinic"], {
    message: "Type is required",
  }),
  age_limit: z.string().min(1, "Age limit is required"),
  session_type: z.string().min(1, "Session type is required"),
  coach_id: z.number().nullable(),
  location: z.string().min(2, "Location is required"),
  date: z.date({ error: "Start date is required" }).nullable(),
  end_date: z.date({ error: "End date is required" }).nullable(),
  start_time: z.string().min(1, "Start time required"),
  end_time: z.string().min(1, "End time required"),
  price: z.coerce.number<number>().optional(),
  is_daily_payment: z.boolean(),
  pricing_mode: z.enum(["single", "variants"]),
  variants: z.array(z.object({
    hour: z.coerce.number<number>().int().positive(),
    price: z.coerce.number<number>().positive("Variant price is required"),
  })),
  max_players: z.coerce.number<number>().min(1, "Max players required"),
  apply_promotion: z.boolean(),
  image: z.string(),
  promotion_start: z.date().nullable(),
  promotion_end: z.date().nullable(),
  promotion_price: z.coerce.number<number>(),
  show_storefront: z.boolean(),
})
  .superRefine((data, ctx) => {
    if (data.pricing_mode === "single" && (!data.price || data.price <= 0)) {
      ctx.addIssue({
        path: ["price"],
        code: z.ZodIssueCode.custom,
        message: "Price must be greater than 0",
      });
    }

    if (data.pricing_mode === "variants" && data.variants.length === 0) {
      ctx.addIssue({
        path: ["variants"],
        code: z.ZodIssueCode.custom,
        message: "Set valid start and end times to create variants",
      });
    }

    if (data.date && data.end_date && moment(data.end_date).isBefore(moment(data.date))) {
      ctx.addIssue({
        path: ["end_date"],
        code: z.ZodIssueCode.custom,
        message: "End date must be after start date",
      });
    }


    if (data.apply_promotion) {
      if (!data.promotion_start) {
        ctx.addIssue({
          path: ["promotion_start"],
          code: z.ZodIssueCode.custom,
          message: "Promotion start date is required",
        });
      }
      if (!data.promotion_end) {
        ctx.addIssue({
          path: ["promotion_end"],
          code: z.ZodIssueCode.custom,
          message: "Promotion end date is required",
        });
      }
      if (data.apply_promotion && (!data.promotion_price || data.promotion_price <= 0)) {
        ctx.addIssue({
          path: ["promotion_price"],
          code: z.ZodIssueCode.custom,
          message: "Promotion price must be greater than 0",
        });
      }

      if (!data.image) {
        ctx.addIssue({
          path: ["image"],
          code: z.ZodIssueCode.custom,
          message: "Image URL is required",
        });
      }
      if (
        data.promotion_start &&
        data.promotion_end &&
        moment(data.promotion_end).isBefore(moment(data.promotion_start))
      ) {
        ctx.addIssue({
          path: ["promotion_end"],
          code: z.ZodIssueCode.custom,
          message: "Promotion end must be after start",
        });
      }
    }
  });

type SessionSchemaValues = z.infer<typeof sessionSchema>;

export function CreateSessionDialog({
  onRefresh,
  coach_id = null,
  coach_name = null,
  promotion = false,

}: {
  coach_name?: string | null;
  coach_id?: string | null;
  onRefresh: () => Promise<void>;
  promotion?: boolean;

}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [all_sessions, setAllSessions] = useState<SessionCoach[]>([])
  const [notAvailableSessions, setNotAvailableSessions] = useState<
    BookedSession[]
  >([]);
  const [booked, setBooked] = useState(false);
  const [coachSchedule, setCoachSchedule] = useState<{ string: string } | {}>({})
  const [blocked, setBlocked] = useState(false)
  const [blockedHours, setBlockedHours] = useState<any[]>([])
  const [coach_Name, setCoach_name] = useState<string | null>(null);
  const { isAdmin } = useAuth()
  const [sessionLoading, setSessionLoading] = useState(false)

  const form = useForm<SessionSchemaValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "camp",
      age_limit: "",
      session_type: "",
      coach_id: coach_id ? Number(coach_id) : null,
      location: "",
      start_time: "",
      end_time: "",
      price: 0,
      is_daily_payment: false,
      pricing_mode: "single",
      variants: [],
      max_players: 1,
      show_storefront: false,
      date: null,
      end_date: null,
      promotion_price: 0,
      image: "",
      promotion_start: null,
      promotion_end: null,
      apply_promotion: promotion ?? false
    },
  });

  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  useEffect(() => {
    if (coach_id) {
      form.setValue("coach_id", Number(coach_id));
    }

    if (coach_name) {
      setCoach_name(coach_name);
    }
  }, [coach_id, coach_name, form]);

  const applyPromotion = form.watch("apply_promotion");
  const image = form.watch("image");
  const selectedCoachId = form.watch("coach_id");
  const startTime = form.watch("start_time");
  const endTime = form.watch("end_time");
  const pricingMode = form.watch("pricing_mode");

  const getAvailableDurations = () => {
    const start = to24Hour(startTime);
    const end = to24Hour(endTime);
    if (!start || !end) return [];

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    const totalMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
    const totalHours = Math.floor(totalMinutes / 60);

    return Array.from({ length: Math.max(0, totalHours) }, (_, index) => index + 1);
  };

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


  function getCoachBookedSessions(coachId: number | null): BookedSession[] {
    if (!all_sessions || all_sessions.length === 0 || !coachId) return [];

    return all_sessions
      .filter(
        (session) =>
          (session.status === "upcoming" || session.status === "ongoing") &&
          Number(coachId) === Number(session.coach_id),
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


  function to24Hour(timeStr: string): string {
    if (!timeStr) return "";

    if (!timeStr.includes("AM") && !timeStr.includes("PM")) return timeStr;

    const [time, suffix] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (suffix === "PM" && hours !== 12) hours += 12;
    if (suffix === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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

    if (!selectedDate || !selectedEndDate || !selectedStartTime || !selectedEndTime)
      return [];

    const coachSessions = getCoachBookedSessions(selectedCoachId);
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


    const sessionConflicts = coachSessions.filter((session) => {
      const sessionStartStr = toDateOnly(session.date);
      const sessionEndStr = toDateOnly(session.end_date);

      const dateOverlap =
        sessionStartStr <= selEndStr && sessionEndStr >= selStartStr;

      const sessionStart24 = to24Hour(session.start_time);
      const sessionEnd24 = to24Hour(session.end_time);
      const timeOverlap = sessionStart24 < newEnd && sessionEnd24 > newStart;

      return dateOverlap && timeOverlap;
    });

    setNotAvailableSessions(sessionConflicts);
    setBooked(sessionConflicts.length > 0);

    return sessionConflicts;
  };
  function getBlockedConflict(values: SessionSchemaValues) {
    if (!coachSchedule) return []
    const conflicts = Object.entries(coachSchedule).filter(
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


  async function CreateSession(values: SessionSchemaValues) {
    setLoading(true);
    try {

      const sessionConflicts = getSessionsConflicts({
        date: values.date,
        end_date: values.end_date,
        start_time: values.start_time,
        end_time: values.end_time,
      })
      const hasSessionConflict = sessionConflicts.length > 0;
      const blockedConflict = getBlockedConflict(values)
      const hasBlockedConflict = blockedConflict.length > 0
      if (hasSessionConflict) {
        toast.error("Can't create session because coach is already booked at this time and date")
        setLoading(false)
        return
      }

      if (hasBlockedConflict) {
        toast.error("Can't create session because coach has blocked his scedule.")
        setLoading(false)
        return
      }

      const res = await axios.post("/admin/sessions", {
        ...values,
        byAdmin: isAdmin
      });
      toast.success("Session Created!")
      await onRefresh();
      form.reset();
      setOpen(false);
    } finally {
      setLoading(false);
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
    setCoach_name(null);
    setNotAvailableSessions([]);
    setBooked(false);
    setCoachSchedule({})
    setBlocked(false)
    setBlockedHours([])
    setAllSessions([])
    setSessionLoading(false)
    form.reset()
  }

  return (
    <>
      <Button onClick={() => setOpen(!open)} className="gap-2 text-sm">
        <Plus /> {promotion ? "Add New Promotion" : "Create New Session"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={handleClose}
      >
        <DialogContent className="bg-[#252525] border border-[#3A3A3A] sm:max-w-4xl p-0">
          <DialogHeader className="border-b border-[#3A3A3A] p-4">
            <DialogTitle className="text-[#F3F4F6] font-semibold text-lg">
              {promotion ? "Add New Promotion" : "Create New Session"}
            </DialogTitle>
            <p className="text-muted-foreground">
              {promotion
                ? "Auto-syncs with Square and appears on online store"
                : "Fill in the details to create a new training session"}
            </p>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(CreateSession, (error) => {
            console.log(error)
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

                        {!coach_id &&
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
                        }
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
                            onChange={(value) => {
                              field.onChange(value);
                            }}
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
                            onChange={(value) => {
                              field.onChange(value);
                            }}
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
                            onChange={(value) => {
                              field.onChange(value);

                            }}
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
                            onChange={(value) => {
                              field.onChange(value);
                            }}
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
                  <Controller
                    name="is_daily_payment"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label className="text-sm text-[#99A1AF]">
                          Payment Type <RequiredStar />
                        </Label>
                        <Select
                          value={field.value ? "daily" : "one-time"}
                          onValueChange={(value) => field.onChange(value === "daily")}
                        >
                          <SelectTrigger className="w-full dark:bg-[#1A1A1A] rounded-sm">
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                          <SelectContent className="!bg-[#1A1A1A]">
                            <SelectGroup>
                              <SelectLabel>Payment Type</SelectLabel>
                              <SelectItem value="one-time">One-time payment</SelectItem>
                              <SelectItem value="daily">Daily payment</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {field.value
                            ? "Players are charged for each attended day."
                            : "Players are charged once when they enroll."}
                        </p>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
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
                        <p className="text-xs text-muted-foreground">
                          Enter a price for every available duration.
                        </p>
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
                      <p className="text-sm text-amber-500">
                        Set the start and end times to generate variants.
                      </p>
                    ) : getAvailableDurations().length === 0 ? (
                      <p className="text-sm text-red-500">
                        End time must be at least one hour after start time.
                      </p>
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
                                <Input
                                  {...field}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={field.value ?? ""}
                                  placeholder="0.00"
                                />
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
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
                  {!promotion && (
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
                  )}
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

                    <div className="flex items-start gap-3 px-4 py-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-[10px] w-full">
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

            <div className="p-4">
              <div className="flex gap-4 flex-wrap">
                <DialogClose className="text-[13px] font-medium leading-none px-4 py-2 bg-black text-white border-border rounded-md hover:opacity-70 cursor-pointer flex flex-1 items-center justify-center">
                  Cancel
                </DialogClose>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 text-[13px]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="text-black" />
                      Creating...
                    </span>
                  ) : promotion ? (
                    "Create Promotion"
                  ) : (
                    "Create Session"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}


