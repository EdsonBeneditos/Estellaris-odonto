import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, List, LayoutGrid, Clock, Trash2, User } from "lucide-react";
import { formatCPF } from "@/lib/validators";
import { useNavigate } from "react-router-dom";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths,
  isSameDay, isToday, parseISO, isBefore, startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface PatientLookup {
  id: string;
  nome_completo: string;
  telefone: string | null;
  cpf: string;
}

export default function Agenda() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [listView, setListView] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newTimeStart, setNewTimeStart] = useState("08:00");
  const [newTimeEnd, setNewTimeEnd] = useState("08:30");
  const [newName, setNewName] = useState("");
  const [newTreatment, setNewTreatment] = useState("");
  const [newCpf, setNewCpf] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [cpfLookedUp, setCpfLookedUp] = useState(false);
  const [fillingSlotId, setFillingSlotId] = useState<string | null>(null);

  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingTimeValue, setEditingTimeValue] = useState("");

  const today = useMemo(() => startOfDay(new Date()), []);

  const isPastDate = (date: Date) => isBefore(startOfDay(date), today);

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

  const daysInMonth = useMemo(() => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }), [currentMonth]);
  const firstDayOffset = getDay(startOfMonth(currentMonth));
  const totalCells = firstDayOffset + daysInMonth.length;
  const totalRows = Math.ceil(totalCells / 7);

  const getApptsForDate = (date: Date) => appointments.filter(a => isSameDay(parseISO(a.appointment_date), date));

  const getDayStatus = (date: Date): "none" | "has_slots" | "full" => {
    const dayAppts = getApptsForDate(date);
    if (dayAppts.length === 0) return "none";
    const allLinked = dayAppts.every(a => a.patient_id !== null);
    return allLinked ? "full" : "has_slots";
  };

  const openDay = (date: Date) => {
    setSelectedDate(date);
    setDayDialogOpen(true);
  };




  const openNewAppointment = (prefillTime?: string, slotId?: string) => {
    setNewTimeStart(prefillTime ?? "08:00");
    setNewTimeEnd(prefillTime ? (() => { const [h,m] = prefillTime.split(":").map(Number); const e = h*60+m+30; return `${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`; })() : "08:30");
    setNewName("");
    setNewTreatment("");
    setNewCpf("");
    setNewPhone("");
    setCpfLookedUp(false);
    setFillingSlotId(slotId ?? null);
    setNewDialogOpen(true);
  };

  const createEmptySlot = async () => {
    if (!selectedDate || !profile?.organization_id) return;
    if (isPastDate(selectedDate)) {
      toast({ title: "Não é possível criar slots em datas passadas", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("appointments").insert({
      organization_id: profile.organization_id,
      patient_name: "— Horário Vago —",
      treatment_type: "Avaliação",
      appointment_date: format(selectedDate, "yyyy-MM-dd"),
      appointment_time: "08:00",
      duration_minutes: 30,
      created_by: profile.id,
    });
    if (!error) {
      toast({ title: "Slot criado!" });
      fetchAppointments();
    }
  };

  const handleTimeSave = async (id: string) => {
    if (!editingTimeValue) { setEditingTimeId(null); return; }
    const { error } = await supabase
      .from("appointments")
      .update({ appointment_time: editingTimeValue })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao salvar horário", variant: "destructive" });
    } else {
      toast({ title: "Horário atualizado!" });
      fetchAppointments();
    }
    setEditingTimeId(null);
  };

  const lookupCpf = useCallback(async (cpf: string) => {
    const clean = cpf.replace(/\D/g, "");
    if (clean.length !== 11 || !profile?.organization_id) return;
    const { data } = await supabase
      .from("patients")
      .select("id, nome_completo, telefone, cpf")
      .eq("cpf", clean)
      .eq("organization_id", profile.organization_id)
      .limit(1);
    if (data?.length) {
      const p = data[0] as PatientLookup;
      setNewName(p.nome_completo);
      setNewPhone(p.telefone ?? "");
      setCpfLookedUp(true);
      toast({ title: `Paciente encontrado: ${p.nome_completo}` });
    }
  }, [profile?.organization_id, toast]);

  useEffect(() => {
    const clean = newCpf.replace(/\D/g, "");
    if (clean.length === 11 && !cpfLookedUp) {
      lookupCpf(newCpf);
    }
  }, [newCpf, cpfLookedUp, lookupCpf]);

  const handleCpfChange = (val: string) => {
    const formatted = formatCPF(val);
    setNewCpf(formatted);
    setCpfLookedUp(false);
  };

  const handleSaveAppointment = async () => {
    if (!newName || !newTreatment || !selectedDate || !profile?.organization_id) return;
    if (isPastDate(selectedDate)) {
      toast({ title: "Não é possível agendar em datas passadas", variant: "destructive" });
      return;
    }
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

    if (fillingSlotId) {
      const { error } = await supabase.from("appointments").update({
        patient_name: newName,
        treatment_type: newTreatment,
        appointment_time: newTimeStart,
        duration_minutes: calcDuration(newTimeStart, newTimeEnd),
        cpf: cpfClean || null,
        patient_id: patientId,
        status: "scheduled",
      }).eq("id", fillingSlotId);
      setSaving(false);
      if (error) {
        toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Paciente vinculado ao slot!" });
        setNewDialogOpen(false);
        setFillingSlotId(null);
        fetchAppointments();
      }
    } else {
      const { error } = await supabase.from("appointments").insert({
        organization_id: profile.organization_id,
        patient_name: newName,
        treatment_type: newTreatment,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        appointment_time: newTimeStart,
        duration_minutes: calcDuration(newTimeStart, newTimeEnd),
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
    }
  };

  const handleDeleteAppt = async (id: string) => {
    await supabase.from("appointments").delete().eq("id", id);
    fetchAppointments();
  };

  const [hoverPatient, setHoverPatient] = useState<PatientLookup | null>(null);
  const [hoverApptId, setHoverApptId] = useState<string | null>(null);

  const fetchHoverPatient = async (appt: Appointment) => {
    if (!appt.patient_id || hoverApptId === appt.id) return;
    setHoverApptId(appt.id);
    const { data } = await supabase.from("patients").select("id, nome_completo, telefone, cpf").eq("id", appt.patient_id).single();
    if (data) setHoverPatient(data as PatientLookup);
  };

  const dayAppts = selectedDate ? getApptsForDate(selectedDate) : [];
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const listDays = daysInMonth.filter(d => getApptsForDate(d).length > 0);
  const rowHeightClass = totalRows <= 5 ? "h-[calc((100vh-260px)/6)]" : "h-[calc((100vh-260px)/7)]";

  const selectedDateIsPast = selectedDate ? isPastDate(selectedDate) : false;

  const renderPatientPopover = (appt: Appointment) => (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="text-xs text-primary underline-offset-2 hover:underline flex-1 text-left truncate"
          onMouseEnter={() => fetchHoverPatient(appt)}
        >
          {appt.patient_name}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" side="top">
        {hoverPatient && hoverApptId === appt.id ? (
          <div className="space-y-2 text-xs">
            <p className="font-semibold text-foreground">{hoverPatient.nome_completo}</p>
            {hoverPatient.telefone && <p className="text-muted-foreground">📞 {hoverPatient.telefone}</p>}
            <p className="text-muted-foreground">CPF: {formatCPF(hoverPatient.cpf)}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-[11px] h-7 mt-1"
              onClick={() => navigate(`/pacientes`)}
            >
              <User className="h-3 w-3" /> Ver Perfil
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        )}
      </PopoverContent>
    </Popover>
  );

  const renderTimeCell = (appt: Appointment) => {
    if (editingTimeId === appt.id) {
      return (
        <Input
          type="time"
          value={editingTimeValue}
          onChange={e => setEditingTimeValue(e.target.value)}
          onBlur={() => handleTimeSave(appt.id)}
          onKeyDown={e => e.key === "Enter" && handleTimeSave(appt.id)}
          className="h-6 w-20 text-[11px] px-1"
          autoFocus
        />
      );
    }
    return (
      <button
        className="text-xs font-medium w-12 text-left hover:text-primary transition-colors cursor-text"
        onClick={() => { setEditingTimeId(appt.id); setEditingTimeValue(appt.appointment_time?.slice(0, 5) ?? "08:00"); }}
        title="Clique para editar horário"
      >
        {appt.appointment_time?.slice(0, 5)}
      </button>
    );
  };

  return (
    <div className="space-y-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" /> Agenda
        </h1>
      <div className="flex items-center gap-3">
          <button
            onClick={() => setListView(v => !v)}
            className="text-xs text-primary hover:underline underline-offset-2 font-medium"
          >
            {listView ? "Voltar ao calendário" : "Lista de pacientes marcados"}
          </button>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <Switch checked={listView} onCheckedChange={setListView} className="scale-90" />
            <List className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}><ChevronLeft className="h-5 w-5" /></Button>
        <h2 className="text-base font-display font-semibold capitalize">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</h2>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}><ChevronRight className="h-5 w-5" /></Button>
      </div>

      {!listView ? (
        <Card className="border-border/50 shadow-sm flex-1">
          <CardContent className="p-2">
            <div className="grid grid-cols-7">
              {weekdays.map(d => (
                <div key={d} className={`text-center text-[10px] font-medium text-muted-foreground ${rowHeightClass} flex items-center justify-center`}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e-${i}`} className={rowHeightClass} />)}
              {daysInMonth.map(day => {
                const status = getDayStatus(day);
                const todayFlag = isToday(day);
                const past = isPastDate(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => openDay(day)}
                    className={`${rowHeightClass} aspect-square rounded flex flex-col items-center justify-center gap-0.5 text-xs transition-all
                      ${todayFlag ? "ring-1 ring-primary font-bold" : ""}
                      ${past ? "opacity-50" : ""}
                      bg-card hover:bg-muted/50`}
                  >
                    <span className={todayFlag ? "text-primary" : "text-foreground"}>{format(day, "d")}</span>
                    {status === "has_slots" && <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--tooth-in-progress))]" />}
                    {status === "full" && <div className="h-1.5 w-1.5 rounded-full bg-destructive" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 space-y-4">
            {listDays.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nenhum agendamento neste mês.</p>}
            {listDays.map(day => (
              <div key={day.toISOString()}>
                <p className="text-xs font-semibold text-muted-foreground mb-2 capitalize">
                  {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                <div className="space-y-1.5">
                  {getApptsForDate(day).map(appt => (
                    <div key={appt.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 group">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {renderTimeCell(appt)}
                      {appt.patient_id ? renderPatientPopover(appt) : (
                        <button
                          className="text-xs text-muted-foreground italic flex-1 text-left hover:text-primary transition-colors cursor-pointer"
                          onClick={() => openNewAppointment(appt.appointment_time?.slice(0, 5), appt.id)}
                          title="Clique para vincular paciente"
                        >
                          {appt.patient_name}
                        </button>
                      )}
                      <Badge variant="secondary" className="ml-auto text-[10px]">{appt.treatment_type}</Badge>
                      <button onClick={() => handleDeleteAppt(appt.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
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
        <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[hsl(var(--tooth-in-progress))]" /> Dia e horário disponível / Horário agendado</span>
        <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-destructive" /> Horários ocupados</span>
      </div>

      {/* ========== DAY DETAIL DIALOG ========== */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] p-0">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="font-display capitalize">
              {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
            <DialogDescription>Slots de atendimento do dia.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh] px-5 pb-5">
            <div className="space-y-1.5">
              {dayAppts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum slot criado.</p>
              )}
              {dayAppts.map(appt => (
                <div key={appt.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm group">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {renderTimeCell(appt)}
                  {appt.patient_id ? renderPatientPopover(appt) : (
                    <button
                      className="text-xs flex-1 text-left text-muted-foreground italic hover:text-primary transition-colors cursor-pointer"
                      onClick={() => openNewAppointment(appt.appointment_time?.slice(0, 5), appt.id)}
                      title="Clique para vincular paciente"
                    >
                      {appt.patient_name}
                    </button>
                  )}
                  <Badge variant="secondary" className="text-[10px]">{appt.treatment_type}</Badge>
                  <button onClick={() => handleDeleteAppt(appt.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={createEmptySlot}
                disabled={selectedDateIsPast}
                title={selectedDateIsPast ? "Não é possível criar slots em datas passadas" : undefined}
              >
                <Plus className="h-3.5 w-3.5" /> Slot Vago
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => openNewAppointment()}
                disabled={selectedDateIsPast}
                title={selectedDateIsPast ? "Não é possível agendar em datas passadas" : undefined}
              >
                <Plus className="h-3.5 w-3.5" /> Novo Agendamento
              </Button>
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
              {selectedDate && format(selectedDate, "dd/MM/yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Início *</Label>
                <Input type="time" value={newTimeStart} onChange={e => setNewTimeStart(e.target.value)} className="h-8 text-xs [&::-webkit-calendar-picker-indicator]:dark:invert" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Fim *</Label>
                <Input type="time" value={newTimeEnd} onChange={e => setNewTimeEnd(e.target.value)} className="h-8 text-xs [&::-webkit-calendar-picker-indicator]:dark:invert" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">CPF (preenche automaticamente)</Label>
              <Input
                placeholder="000.000.000-00"
                value={newCpf}
                onChange={e => handleCpfChange(e.target.value)}
                className="h-8 text-xs"
              />
              {cpfLookedUp && <p className="text-[10px] text-accent">✓ Paciente vinculado</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Nome do Cliente *</Label>
              <Input placeholder="Nome completo" value={newName} onChange={e => setNewName(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Telefone</Label>
              <Input placeholder="(00) 00000-0000" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Tipo de Tratamento *</Label>
              <Select value={newTreatment} onValueChange={setNewTreatment}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {TREATMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
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

function calcDuration(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? diff : 30;
}
