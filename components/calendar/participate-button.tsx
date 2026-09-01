import { useState } from "react";
import axios from "@/lib/axios";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

type SessionVariant = { id: number; hour: number; price: string | number };

const ParticipateButton = ({
  player_id,
  session_id,
  onSuccess,
  variants = [],
  session_date,
  label = "Participate",
  buttonVariant,
}: {
  player_id?: string | null;
  session_id: string | number;
  onSuccess: () => Promise<void>;
  variants?: SessionVariant[];
  session_date?: string;
  label?: string;
  buttonVariant?: "default" | "outline";
}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [loadingVariantId, setLoadingVariantId] = useState<number | null>(null);

  async function handleEnroll(variantId?: number) {
    try {
      setLoading(true);
      setLoadingVariantId(variantId ?? null);
      await axios.post(`/admin/sessions/${session_id}/participants`, {
        player_id,
        ...(variantId !== undefined ? { variant_id: variantId } : {}),
        ...(session_date ? { session_date } : {}),
      });
      await onSuccess();
      setOpen(false);
    } finally {
      setLoading(false);
      setLoadingVariantId(null);
    }
  }

  return (
    <>
      <Button
        onClick={() => (variants.length > 0 ? setOpen(true) : handleEnroll())}
        disabled={loading}
        variant={buttonVariant}
      >
        {loading && <Spinner className="text-black" />}
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#252525] border-[#3A3A3A] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select session duration</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Choose the option you want to reserve.
          </p>
          <div className="space-y-2">
            {variants.map((variant) => (
              <Button
                key={variant.id}
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleEnroll(variant.id)}
                disabled={loading}
              >
                <span>{variant.hour} {variant.hour === 1 ? "hour" : "hours"}</span>
                {loadingVariantId === variant.id ? (
                  <Spinner className="text-white" />
                ) : (
                  <span>${Number(variant.price).toFixed(2)}</span>
                )}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ParticipateButton;
