"use client";

// components/habits/create-habit-dialog.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import { Flame, Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories, useCreateHabit } from "@/hooks/use-habits";

// ─── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    description: z.string().max(500).optional(),
    habit_type: z.enum(["binary", "measurable", "time_based"]),
    frequency: z.enum(["daily", "weekly", "custom"]),
    target_value: z.number().positive().optional(),
    unit: z.string().max(30).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    category: z.string().optional(),
  })
  .refine(
    (d) =>
      d.habit_type === "binary" ||
      (d.target_value !== undefined && d.target_value > 0),
    {
      message: "Target value is required for measurable and time-based habits",
      path: ["target_value"],
    }
  );

type FormData = z.infer<typeof schema>;

// ─── Preset colours ────────────────────────────────────────────────────────────

const PALETTE = [
  "#E8400C", // NGP forge
  "#2D9CDB", // blue
  "#27AE60", // green
  "#9B51E0", // violet
  "#F2994A", // amber
  "#EB5757", // red
  "#219653", // teal
  "#BB6BD9", // purple
];

const HABIT_TYPE_LABELS: Record<string, { label: string; hint: string }> = {
  binary: {
    label: "Binary",
    hint: "Did it or not — simple yes/no completion",
  },
  measurable: {
    label: "Measurable",
    hint: "Track a quantity (e.g. 5km, 8 glasses)",
  },
  time_based: {
    label: "Time-based",
    hint: "Track duration (e.g. 30 minutes of reading)",
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────

interface CreateHabitDialogProps {
  trigger?: React.ReactNode;
}

export function CreateHabitDialog({ trigger }: CreateHabitDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: categories = [] } = useCategories();
  const createHabit = useCreateHabit();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      habit_type: "binary",
      frequency: "daily",
      color: "#E8400C",
    },
  });

  const habitType = watch("habit_type");
  const selectedColor = watch("color");

  const onSubmit = async (data: FormData) => {
    await createHabit.mutateAsync(data);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2 bg-forge hover:bg-forge-dark text-white">
            <Plus className="h-4 w-4" />
            New Habit
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg bg-card-dark border-border-dark text-ngp-text">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-ngp-text">
            <Flame className="h-5 w-5 text-forge" />
            Create a New Habit
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-ngp-muted text-xs uppercase tracking-wider">
              Habit Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g. Morning Run"
              {...register("name")}
              className="bg-ngp-dark border-border-dark text-ngp-text placeholder:text-ngp-muted/50 focus:border-forge/60"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-ngp-muted text-xs uppercase tracking-wider">
              Description
            </Label>
            <Input
              id="description"
              placeholder="Optional context or motivation"
              {...register("description")}
              className="bg-ngp-dark border-border-dark text-ngp-text placeholder:text-ngp-muted/50 focus:border-forge/60"
            />
          </div>

          {/* Habit Type */}
          <div className="space-y-1.5">
            <Label className="text-ngp-muted text-xs uppercase tracking-wider">
              Habit Type *
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(["binary", "measurable", "time_based"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue("habit_type", type)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    habitType === type
                      ? "border-forge/60 bg-forge/10 text-forge"
                      : "border-border-dark bg-ngp-dark text-ngp-muted hover:border-border-dark2"
                  }`}
                >
                  <div className="text-xs font-semibold">
                    {HABIT_TYPE_LABELS[type].label}
                  </div>
                  <div className="mt-1 text-[10px] leading-tight opacity-75">
                    {HABIT_TYPE_LABELS[type].hint}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target value (measurable / time_based only) */}
          {habitType !== "binary" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="target_value" className="text-ngp-muted text-xs uppercase tracking-wider">
                  Target *
                </Label>
                <Input
                  id="target_value"
                  type="number"
                  min={1}
                  placeholder={habitType === "time_based" ? "30" : "5"}
                  {...register("target_value", {
                    valueAsNumber: true,
                  })}
                  className="bg-ngp-dark border-border-dark text-ngp-text placeholder:text-ngp-muted/50 focus:border-forge/60"
                />
                {errors.target_value && (
                  <p className="text-xs text-red-400">
                    {errors.target_value.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit" className="text-ngp-muted text-xs uppercase tracking-wider">
                  Unit
                </Label>
                <Input
                  id="unit"
                  placeholder={habitType === "time_based" ? "min" : "km"}
                  {...register("unit")}
                  className="bg-ngp-dark border-border-dark text-ngp-text placeholder:text-ngp-muted/50 focus:border-forge/60"
                />
              </div>
            </div>
          )}

          {/* Frequency + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-ngp-muted text-xs uppercase tracking-wider">
                Frequency
              </Label>
              <Select
                defaultValue="daily"
                onValueChange={(v) =>
                  setValue("frequency", v as "daily" | "weekly" | "custom")
                }
              >
                <SelectTrigger className="bg-ngp-dark border-border-dark text-ngp-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card-dark border-border-dark text-ngp-text">
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {categories.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-ngp-muted text-xs uppercase tracking-wider">
                  Category
                </Label>
                <Select onValueChange={(v) => setValue("category", v)}>
                  <SelectTrigger className="bg-ngp-dark border-border-dark text-ngp-text">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-card-dark border-border-dark text-ngp-text">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Colour picker */}
          <div className="space-y-1.5">
            <Label className="text-ngp-muted text-xs uppercase tracking-wider">
              Colour
            </Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("color", c)}
                  style={{ background: c }}
                  className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                    selectedColor === c
                      ? "ring-2 ring-white ring-offset-2 ring-offset-card-dark scale-110"
                      : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border-dark">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { reset(); setOpen(false); }}
              className="text-ngp-muted hover:text-ngp-text"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createHabit.isPending}
              className="bg-forge hover:bg-forge-dark text-white gap-2"
            >
              {createHabit.isPending ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Habit
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}