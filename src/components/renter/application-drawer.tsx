"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/utils";
import type { RenterProfile } from "@/types";

const schema = z.object({
  monthly_income: z.coerce.number().min(1),
  employment_status: z.string().min(1),
  employer_name: z.string().optional(),
  credit_score_range: z.string().min(1),
  move_in_date: z.string().min(1),
  has_pets: z.boolean(),
  pet_details: z.string().optional(),
  additional_notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ApplicationDrawerProps {
  listingId: string;
  listingTitle: string;
  rentAmount: number;
  renterProfile: RenterProfile | null;
}

export function ApplicationDrawer({
  listingId,
  listingTitle,
  rentAmount,
  renterProfile,
}: ApplicationDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      monthly_income: renterProfile?.monthly_income ?? 0,
      employment_status: renterProfile?.employment_status ?? "",
      employer_name: renterProfile?.employer_name ?? "",
      credit_score_range: renterProfile?.credit_score_range ?? "",
      has_pets: renterProfile?.has_pets ?? false,
      pet_details: renterProfile?.pet_details ?? "",
    },
  });

  const hasPets = watch("has_pets");

  async function onSubmit(data: FormData) {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("applications").insert({
      listing_id: listingId,
      renter_id: user.id,
      status: "submitted",
      ...data,
    });

    if (error) {
      toast({ title: "Error submitting application", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Update renter profile with latest info
    await supabase.from("renter_profiles").upsert({
      user_id: user.id,
      monthly_income: data.monthly_income,
      employment_status: data.employment_status,
      employer_name: data.employer_name,
      credit_score_range: data.credit_score_range,
      has_pets: data.has_pets,
      pet_details: data.pet_details,
    });

    toast({ title: "Application submitted!", description: "The landlord will review your application.", variant: "success" });
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Apply now</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {listingTitle}</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 rounded-lg bg-secondary text-sm">
          Rent: <span className="font-semibold">{formatCurrency(rentAmount)}/mo</span>
          {" · "}Income needed: <span className="font-semibold">{formatCurrency(rentAmount * 3)}/mo</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Monthly income</Label>
              <Input type="number" placeholder="5000" {...register("monthly_income")} />
              {errors.monthly_income && <p className="text-xs text-destructive">{errors.monthly_income.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Credit score range</Label>
              <Select onValueChange={(v) => setValue("credit_score_range", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300-579">300–579 (Poor)</SelectItem>
                  <SelectItem value="580-669">580–669 (Fair)</SelectItem>
                  <SelectItem value="670-739">670–739 (Good)</SelectItem>
                  <SelectItem value="740-799">740–799 (Very Good)</SelectItem>
                  <SelectItem value="800+">800+ (Exceptional)</SelectItem>
                </SelectContent>
              </Select>
              {errors.credit_score_range && <p className="text-xs text-destructive">{errors.credit_score_range.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Employment status</Label>
              <Select onValueChange={(v) => setValue("employment_status", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed_full_time">Employed (full-time)</SelectItem>
                  <SelectItem value="employed_part_time">Employed (part-time)</SelectItem>
                  <SelectItem value="self_employed">Self-employed</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                </SelectContent>
              </Select>
              {errors.employment_status && <p className="text-xs text-destructive">{errors.employment_status.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Employer / source of income</Label>
              <Input placeholder="Acme Corp" {...register("employer_name")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Desired move-in date</Label>
            <Input type="date" {...register("move_in_date")} />
            {errors.move_in_date && <p className="text-xs text-destructive">{errors.move_in_date.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                {...register("has_pets")}
                className="rounded"
              />
              I have pets
            </label>
            {hasPets && (
              <Input placeholder="Describe your pets (type, size, count)" {...register("pet_details")} />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Additional notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              placeholder="Anything else you'd like the landlord to know?"
              rows={3}
              {...register("additional_notes")}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
