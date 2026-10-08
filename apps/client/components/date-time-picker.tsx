"use client"

import { format, parseISO } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

type DateTimeType = {
  date: string | undefined;
  time: string | undefined;
};

export function DateTimePicker({
  value,
  onChange,
  size = "default",
}: {
  value: DateTimeType;
  onChange: (value: DateTimeType) => void;
  size?: "sm" | "default" | "lg";
}) {
  const isSm = size === "sm";

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger render={
          <Button
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal border-border/70 bg-background/80 hover:bg-background data-[empty=true]:text-muted-foreground",
              isSm ? "h-8 rounded-lg text-xs px-2.5" : "h-9 rounded-xl text-sm px-3"
            )}
          />
        }>
          <CalendarIcon className={cn("text-muted-foreground shrink-0", isSm ? "size-3.5 mr-1.5" : "size-4 mr-2")} />
          <span className="truncate">{value.date || "Pick date"}</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-border/70">
          <Calendar
            mode="single"
            selected={value.date ? parseISO(value.date) : undefined}
            onSelect={(date) => onChange({
              ...value,
              date: date ? format(date, "yyyy-MM-dd") : undefined
            })}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        size={size}
        value={value.time}
        onChange={(e) => onChange({ ...value, time: e.target.value })}
        className={cn("shrink-0", isSm ? "w-24 text-xs" : "w-32 text-sm")}
      />
    </div>
  )
}