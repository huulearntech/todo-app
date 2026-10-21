"use client";

import { useState } from "react";
import { useUpdateGoals } from "@/features/productivity/hooks/use-update-goals";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export interface EditGoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDailyTarget: number;
  defaultWeeklyTarget: number;
}

function EditGoalsForm({
  defaultDailyTarget,
  defaultWeeklyTarget,
  onClose,
}: {
  defaultDailyTarget: number;
  defaultWeeklyTarget: number;
  onClose: () => void;
}) {
  const [dailyInput, setDailyInput] = useState<number>(defaultDailyTarget);
  const [weeklyInput, setWeeklyInput] = useState<number>(defaultWeeklyTarget);
  const updateGoalMutation = useUpdateGoals();

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    if (dailyInput < 1 || weeklyInput < 1) return;
    updateGoalMutation.mutate(
      {
        dailyGoal: dailyInput,
        weeklyGoal: weeklyInput,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Productivity Goals</DialogTitle>
        <DialogDescription>
          Customize your daily and weekly task completion targets. Updates take effect immediately for the current period while protecting your past streak history.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSaveGoals} className="flex flex-col gap-4 py-3">
        <FieldGroup className="gap-3.5">
          <Field className="space-y-1.5">
            <FieldLabel htmlFor="daily-goal-input" className="text-xs font-semibold text-foreground">
              Daily Goal (tasks / day)
            </FieldLabel>
            <Input
              id="daily-goal-input"
              type="number"
              min={1}
              max={100}
              value={dailyInput}
              onChange={(e) => setDailyInput(parseInt(e.target.value, 10) || 1)}
              required
            />
          </Field>

          <Field className="space-y-1.5">
            <FieldLabel htmlFor="weekly-goal-input" className="text-xs font-semibold text-foreground">
              Weekly Goal (tasks / week)
            </FieldLabel>
            <Input
              id="weekly-goal-input"
              type="number"
              min={1}
              max={500}
              value={weeklyInput}
              onChange={(e) => setWeeklyInput(parseInt(e.target.value, 10) || 1)}
              required
            />
          </Field>
        </FieldGroup>

        <DialogFooter className="mt-2 pt-3 border-t border-border/40 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl h-9 px-4 text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateGoalMutation.isPending}
            className="rounded-xl h-9 px-4 text-xs font-semibold shadow-xs"
          >
            {updateGoalMutation.isPending ? "Saving..." : "Save Goals"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function EditGoalsDialog({
  open,
  onOpenChange,
  defaultDailyTarget,
  defaultWeeklyTarget,
}: EditGoalsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <EditGoalsForm
            defaultDailyTarget={defaultDailyTarget}
            defaultWeeklyTarget={defaultWeeklyTarget}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
