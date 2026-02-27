import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, List, LayoutGrid, Clock, User } from "lucide-react";
import { formatCPF } from "@/lib/validators";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths,
  isSameDay, isSameMonth, isToday, parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "13:00", "13:30", "14:00",
  "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
  "17:30", "18:00",
];

const TREATMENT_TYPES = [
  "Avaliação", "Limpeza", "Restauração", "Canal", "Extração",
  "Implante", "Coroa", "Ortodontia", "Clareamento", "Prótese", "Outros",
];

interface Appointment {
  id: string;
  patient_name: string;
  treatment_type: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: string;
  cpf: string | null;
  patient_id: string | null;
  notes: string | null;
}

export default function Agenda() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [listView, setListView] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Day detail dialog
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);

  // New appointment dialog
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [newName, setNewName] = useState("");
  const [newTreatment, setNewTreatment] = useState("");
  const [newCpf, setNewCpf] = useState("");
  const [saving, setSaving] = useState(false);

  // Hover popover patient
  const [hoveredAppt, setHoveredAppt] = useState<Appointment | null>(null);
  const [hoveredPatient, setHoveredPatient] = useState<{ nome_completo: string; telefone: string | null; email: string | null } | null>(null);

  const fetchAppointments = async () => {
    if (!profile?.organization_id) return;
    setLoading(true);
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .gte("appointment_date", start)
      .lte("appointment_date", end)
      .order("appointment_time");
    setAppointments((data as Appointment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, [currentMonth, profile?.organization_id]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOffset = getDay(startOfMonth(currentMonth));

  const getApptsForDate = (date: Date) =>
    appointments.filter(a => isSameDay(parseISO(a.appointment_date), date));

  const getDayStatus = (date: Date): "none" | "has_slots" | "full" => {
    const dayAppts = getApptsForDate(date);
    if (dayAppts.length === 0) return "none";
    if (dayAppts.length >= TIME_SLOTS.length) return "full";
    return "has_slots";
  };

  const openDay = (date: Date) => {
    setSelectedDate(date);
    setDayDialogOpen(true);
  };

  const openNewAppointment = (time: string) => {
    setNewTime(time);
    setNewName("");
    setNewTreatment("");
    setNewCpf("");
    setNewDialogOpen(true);
  };

  const handleSaveAppointment = async () => {
    if (!newName || !newTreatment || !selectedDate || !profile?.organization_id) return;
    setSaving(true);

    let patientId: string | null = null;
    const cpfClean = newCpf.replace(/\D/g, "");
    if (cpfClean.length === 11) {
      const { data: patients } = await supabase
        .from("patients")
        .select("id")
        .eq("cpf", cpfClean)
        .eq("organization_id", profile.organization_id)
        .limit(1);
      if (patients?.length) patientId = patients[0].id;
    }

    const { error } = await supabase.from("appointments").insert({
      organization_id: profile.organization_id,
      patient_name: newName,
      treatment_type: newTreatment,
      appointment_date: format(selectedDate, "yyyy-MM-dd"),
      appointment_time: newTime,
      cpf: cpfClean || null,
      patient_id: patientId,
      created_by: profile.id,
    });

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Consulta agendada!" });
      setNewDialogOpen(false);
      fetchAppointments();
    }
  };

  const fetchPatientHover = async (appt: Appointment) => {
    if (!appt.patient_id) return;
    setHoveredAppt(appt);
    const { data } = await supabase
      .from("patients")
      .select("nome_completo, telefone, email")
      .eq("id", appt.patient_id)
      .single();
    setHoveredPatient(data);
  };

  const dayAppts = selectedDate ? getApptsForDate(selectedDate) : [];
  const bookedTimes = dayAppts.map(a => a.appointment_time?.slice(0, 5));

  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // List view: group by date
  const listDays = daysInMonth.filter(d => getApptsForDate(d).length > 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" /> Agenda
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <Switch checked={listView} onCheckedChange={setListView} className="scale-90" />
            <List className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-display font-semibold capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {!listView ? (
        /* ========== CALENDAR GRID ========== */
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekdays.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map(day => {
                const status = getDayStatus(day);
                const today = isToday(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => openDay(day)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 text-sm transition-all border
                      ${today ? "border-primary font-bold" : "border-transparent"}
                      bg-card hover:bg-muted/50
                    `}
                  >
                    <span className={today ? "text-primary" : "text-foreground"}>{format(day, "d")}</span>
                    {status === "has_slots" && <div className="h-2 w-2 rounded-full bg-[hsl(45,90%,50%)]" />}
                    {status === "full" && <div className="h-2 w-2 rounded-full bg-destructive" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ========== LIST VIEW ========== */
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 space-y-4">
            {listDays.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">Nenhum agendamento neste mês.</p>
            )}
            {listDays.map(day => (
              <div key={day.toISOString()}>
                <p className="text-xs font-semibold text-muted-foreground mb-2 capitalize">
                  {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                <div className="space-y-1.5">
                  {getApptsForDate(day).map(appt => (
                    <div key={appt.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium w-12">{appt.appointment_time?.slice(0, 5)}</span>
                      {appt.patient_id ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className="text-xs text-primary underline-offset-2 hover:underline"
                              onMouseEnter={() => fetchPatientHover(appt)}
                            >
                              {appt.patient_name}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-3">
                            {hoveredPatient && hoveredAppt?.id === appt.id ? (
                              <div className="space-y-1 text-xs">
                                <p className="font-semibold">{hoveredPatient.nome_completo}</p>
                                {hoveredPatient.telefone && <p className="text-muted-foreground">{hoveredPatient.telefone}</p>}
                                {hoveredPatient.email && <p className="text-muted-foreground">{hoveredPatient.email}</p>}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Carregando...</p>
                            )}
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-xs">{appt.patient_name}</span>
                      )}
                      <Badge variant="secondary" className="ml-auto text-[10px]">{appt.treatment_type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[hsl(45,90%,50%)]" /> Horários marcados</span>
        <span className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-destructive" /> Agenda lotada</span>
      </div>

      {/* ========== DAY DETAIL DIALOG ========== */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] p-0">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="font-display capitalize">
              {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
            <DialogDescription>Selecione um horário para agendar.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh] px-5 pb-5">
            <div className="space-y-1.5">
              {TIME_SLOTS.map(time => {
                const appt = dayAppts.find(a => a.appointment_time?.slice(0, 5) === time);
                const booked = !!appt;
                return (
                  <button
                    key={time}
                    onClick={() => !booked && openNewAppointment(time)}
                    disabled={booked}
                    className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-all
                      ${booked
                        ? "bg-muted/50 border-border cursor-default"
                        : "border-border hover:border-primary hover:bg-primary/5 cursor-pointer"
                      }`}
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium w-12">{time}</span>
                    {booked ? (
                      <span className="text-xs text-muted-foreground flex-1 text-left">
                        {appt.patient_name} — <span className="text-accent">{appt.treatment_type}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 flex-1 text-left">Disponível</span>
                    )}
                    {!booked && <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ========== NEW APPOINTMENT DIALOG ========== */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Novo Agendamento</DialogTitle>
            <DialogDescription>
              {selectedDate && format(selectedDate, "dd/MM/yyyy")} às {newTime}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Cliente *</Label>
              <Input placeholder="Nome completo" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de Tratamento *</Label>
              <Select value={newTreatment} onValueChange={setNewTreatment}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {TREATMENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CPF (opcional)</Label>
              <Input
                placeholder="000.000.000-00"
                value={newCpf}
                onChange={e => setNewCpf(formatCPF(e.target.value))}
              />
              <p className="text-[10px] text-muted-foreground">Se preenchido, vincula ao cadastro do paciente.</p>
            </div>
            <Button className="w-full" disabled={!newName || !newTreatment || saving} onClick={handleSaveAppointment}>
              {saving ? "Salvando..." : "Agendar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
