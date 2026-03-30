import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  from: Date | undefined;
  to: Date | undefined;
  onFromChange: (date: Date | undefined) => void;
  onToChange: (date: Date | undefined) => void;
}

export function DateRangeFilter({ from, to, onFromChange, onToChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("gap-2 text-sm rounded-xl", !from && "text-muted-foreground")}>
            <CalendarIcon className="h-4 w-4" />
            {from ? format(from, "dd MMM yyyy", { locale: fr }) : "Date début"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xl" align="start">
          <Calendar mode="single" selected={from} onSelect={onFromChange} locale={fr} initialFocus />
        </PopoverContent>
      </Popover>
      <span className="text-muted-foreground text-sm">→</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("gap-2 text-sm rounded-xl", !to && "text-muted-foreground")}>
            <CalendarIcon className="h-4 w-4" />
            {to ? format(to, "dd MMM yyyy", { locale: fr }) : "Date fin"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xl" align="start">
          <Calendar mode="single" selected={to} onSelect={onToChange} locale={fr} initialFocus />
        </PopoverContent>
      </Popover>
      {(from || to) && (
        <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => { onFromChange(undefined); onToChange(undefined); }}>
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
