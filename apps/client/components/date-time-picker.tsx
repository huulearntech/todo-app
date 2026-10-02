"use client"

import { format, parseISO } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

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

export function DateTimePicker({ value, onChange }: {
  value: DateTimeType;
  onChange: (value: DateTimeType) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger render={
          <Button variant="outline"
            className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
          />
        }>
          <CalendarIcon />
          {value.date || "Pick start date"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
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
        value={value.time}
        onChange={(e) => onChange({ ...value, time: e.target.value })}
      />
    </div>
  )
}