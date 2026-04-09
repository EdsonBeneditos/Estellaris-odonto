import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { validateCPF, formatCPF, formatPhone, validatePhone, validateEmail } from "@/lib/validators";
import { Plus, Search, Pencil, CalendarDays, FileHeart, Loader2, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, differenceInYears, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Patient {
  id: string;
  nome_completo: string;
  cpf: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  created_at: string | null;
  // Address fields
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
}

interface NextAppointment {
  appointment_date: string;
  appointment_time: string;
  treatment_type: string;
}

type FormData = {
  nome_completo: string;
  cpf: string;
  telefone: string;
  email: string;
  data_nascimento: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

const emptyForm: FormData = {
  nome_completo: "", cpf: "", telefone: "", email: "", data_nascimento: "",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
};

function formatCep(v: string) {
  const n = v.replace(/\D/g, "").slice(0, 8);
  return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n;
}

export default function Patients() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const numeroRef = useRef<HTMLInputElement>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormData>(emptyForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editCepLoading, setEditCepLoading] = useState(false);

  // Side panel (T11 preview)
  const [panelPatient, setPanelPatient] = useState<Patient | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [nextAppt, setNextAppt] = useState<NextAppointment | null>(null);
  const [loadingAppt, setLoadingAppt] = useState(false);

  const loadPatients = async () => {
    const { data } = await supabase.from("patients").select("*").order("nome_completo");
    if (data) setPatients(data as Patient[]);
  };

  useEffect(() => { loadPatients(); }, []);

  // ── CEP lookup ──────────────────────────────────────────────────────────────
  const lookupCep = async (
    cepRaw: string,
    setF: (f: (prev: FormData) => FormData) => void,
    setLoading: (v: boolean) => void,
    setError?: (v: string) => void,
  ) => {
    const cep = cepRaw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setLoading(true);
    if (setError) setError("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        if (setError) setError("CEP não encontrado.");
        setLoading(false);
        return;
      }
      setF(prev => ({
        ...prev,
        logradouro: data.logradouro ?? "",
        bairro: data.bairro ?? "",
        cidade: data.localidade ?? "",
        uf: data.uf ?? "",
      }));
      setTimeout(() => numeroRef.current?.focus(), 100);
    } catch {
      if (setError) setError("Erro ao buscar CEP.");
    }
    setLoading(false);
  };

  // ── Save new patient ────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCPF(form.cpf)) { toast({ title: "CPF inválido", variant: "destructive" }); return; }
    if (form.telefone && !validatePhone(form.telefone)) { toast({ title: "Telefone inválido", variant: "destructive" }); return; }
    if (form.email && !validateEmail(form.email)) { toast({ title: "E-mail inválido", variant: "destructive" }); return; }

    setSaving(true);
    const { error } = await supabase.from("patients").insert({
      nome_completo: form.nome_completo,
      cpf: form.cpf.replace(/\D/g, ""),
      telefone: form.telefone || null,
      email: form.email || null,
      data_nascimento: form.data_nascimento || null,
      organization_id: profile?.organization_id,
      cep: form.cep.replace(/\D/g, "") || null,
      logradouro: form.logradouro || null,
      numero: form.numero || null,
      complemento: form.complemento || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      uf: form.uf || null,
    } as any);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Paciente cadastrado!" });
      setForm(emptyForm);
      setOpen(false);
      loadPatients();
    }
    setSaving(false);
  };

  // ── Open edit ───────────────────────────────────────────────────────────────
  const openEdit = (p: Patient) => {
    setEditId(p.id);
    setEditForm({
      nome_completo: p.nome_completo,
      cpf: formatCPF(p.cpf),
      telefone: p.telefone ?? "",
      email: p.email ?? "",
      data_nascimento: p.data_nascimento ?? "",
      cep: p.cep ? formatCep(p.cep) : "",
      logradouro: p.logradouro ?? "",
      numero: p.numero ?? "",
      complemento: p.complemento ?? "",
      bairro: p.bairro ?? "",
      cidade: p.cidade ?? "",
      uf: p.uf ?? "",
    });
    setEditOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    if (!validateCPF(editForm.cpf)) { toast({ title: "CPF inválido", variant: "destructive" }); return; }
    if (editForm.telefone && !validatePhone(editForm.telefone)) { toast({ title: "Telefone inválido", variant: "destructive" }); return; }
    if (editForm.email && !validateEmail(editForm.email)) { toast({ title: "E-mail inválido", variant: "destructive" }); return; }

    setEditSaving(true);
    const { error } = await supabase.from("patients").update({
      nome_completo: editForm.nome_completo,
      cpf: editForm.cpf.replace(/\D/g, ""),
      telefone: editForm.telefone || null,
      email: editForm.email || null,
      data_nascimento: editForm.data_nascimento || null,
      cep: editForm.cep.replace(/\D/g, "") || null,
      logradouro: editForm.logradouro || null,
      numero: editForm.numero || null,
      complemento: editForm.complemento || null,
      bairro: editForm.bairro || null,
      cidade: editForm.cidade || null,
      uf: editForm.uf || null,
    } as any).eq("id", editId);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Paciente atualizado!" });
      setEditOpen(false);
      loadPatients();
    }
    setEditSaving(false);
  };

  // ── Side panel ──────────────────────────────────────────────────────────────
  const openPanel = async (p: Patient) => {
    setPanelPatient(p);
    setPanelOpen(true);
    setNextAppt(null);
    setLoadingAppt(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const { data } = await supabase
      .from("appointments")
      .select("appointment_date, appointment_time, treatment_type")
      .eq("patient_id", p.id)
      .gte("appointment_date", today)
      .neq("status", "cancelled")
      .order("appointment_date")
      .order("appointment_time")
      .limit(1);
    setNextAppt((data?.[0] as NextAppointment) ?? null);
    setLoadingAppt(false);
  };

  // ── Patient form renderer ────────────────────────────────────────────────────
  const renderForm = (
    f: FormData,
    setF: React.Dispatch<React.SetStateAction<FormData>>,
    onSubmit: (e: React.FormEvent) => void,
    isSaving: boolean,
    label: string,
    cepLoad: boolean,
    setCepLoad: (v: boolean) => void,
    cepErr?: string,
    setCepErr?: (v: string) => void,
  ) => (
    <form onSubmit={onSubmit} className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
      <div className="space-y-1.5">
        <Label className="text-xs">Nome Completo *</Label>
        <Input value={f.nome_completo} onChange={e => setF(p => ({ ...p, nome_completo: e.target.value }))} required className="h-8 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">CPF *</Label>
          <Input value={f.cpf} onChange={e => setF(p => ({ ...p, cpf: formatCPF(e.target.value) }))} placeholder="000.000.000-00" required className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Data de Nascimento</Label>
          <Input type="date" value={f.data_nascimento} onChange={e => setF(p => ({ ...p, data_nascimento: e.target.value }))} className="h-8 text-sm [&::-webkit-calendar-picker-indicator]:dark:invert" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Telefone</Label>
          <Input value={f.telefone} onChange={e => setF(p => ({ ...p, telefone: formatPhone(e.target.value) }))} placeholder="(00) 00000-0000" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">E-mail</Label>
          <Input type="email" value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} placeholder="paciente@email.com" className="h-8 text-sm" />
        </div>
      </div>

      <Separator />
      <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5" /> Endereço
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs">CEP</Label>
        <div className="flex gap-2">
          <Input
            value={f.cep}
            onChange={e => {
              const v = formatCep(e.target.value);
              setF(p => ({ ...p, cep: v }));
              if (v.replace(/\D/g, "").length === 8) {
                lookupCep(v, setF, setCepLoad, setCepErr);
              }
            }}
            placeholder="00000-000"
            maxLength={9}
            className="h-8 text-sm"
          />
          {cepLoad && <Loader2 className="h-4 w-4 animate-spin self-center shrink-0 text-muted-foreground" />}
        </div>
        {cepErr && <p className="text-[11px] text-destructive">{cepErr}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Logradouro</Label>
        <Input value={f.logradouro} onChange={e => setF(p => ({ ...p, logradouro: e.target.value }))} className="h-8 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Número</Label>
          <Input ref={numeroRef} value={f.numero} onChange={e => setF(p => ({ ...p, numero: e.target.value }))} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Complemento</Label>
          <Input value={f.complemento} onChange={e => setF(p => ({ ...p, complemento: e.target.value }))} className="h-8 text-sm" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Bairro</Label>
        <Input value={f.bairro} onChange={e => setF(p => ({ ...p, bairro: e.target.value }))} className="h-8 text-sm" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Cidade</Label>
          <Input value={f.cidade} onChange={e => setF(p => ({ ...p, cidade: e.target.value }))} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">UF</Label>
          <Input value={f.uf} onChange={e => setF(p => ({ ...p, uf: e.target.value.toUpperCase().slice(0, 2) }))} maxLength={2} className="h-8 text-sm" />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSaving}>{isSaving ? "Salvando..." : label}</Button>
    </form>
  );

  const filtered = patients.filter(
    p => p.nome_completo.toLowerCase().includes(search.toLowerCase()) || p.cpf.includes(search.replace(/\D/g, ""))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Pacientes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Paciente</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Cadastrar Paciente</DialogTitle></DialogHeader>
            {renderForm(form, setForm, handleSave, saving, "Cadastrar", cepLoading, setCepLoading, cepError, setCepError)}
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Buscar por nome ou CPF..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum paciente encontrado</TableCell></TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openPanel(p)}>
                  <TableCell className="font-medium">{p.nome_completo}</TableCell>
                  <TableCell>{formatCPF(p.cpf)}</TableCell>
                  <TableCell>{p.telefone ?? "—"}</TableCell>
                  <TableCell>{p.email ?? "—"}</TableCell>
                  <TableCell>{p.data_nascimento ? new Date(p.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEdit(p); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); navigate(`/prontuario?cpf=${p.cpf}`); }}>
                        Prontuário
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Editar Paciente</DialogTitle></DialogHeader>
          {renderForm(editForm, setEditForm, handleEditSave, editSaving, "Salvar Alterações", editCepLoading, setEditCepLoading)}
        </DialogContent>
      </Dialog>

      {/* Side panel (T11) */}
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent className="w-80 sm:w-96">
          {panelPatient && (
            <div
              className="space-y-5 mt-2"
              style={{ animation: "slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)" }}
            >
              <SheetHeader>
                <SheetTitle className="font-display text-lg leading-tight">
                  {panelPatient.nome_completo}
                </SheetTitle>
              </SheetHeader>

              {/* Info */}
              <div className="space-y-2 text-sm">
                {[
                  { label: "CPF", value: formatCPF(panelPatient.cpf) },
                  { label: "Telefone", value: panelPatient.telefone },
                  { label: "E-mail", value: panelPatient.email },
                  { label: "Nascimento", value: panelPatient.data_nascimento ? `${new Date(panelPatient.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR")} (${differenceInYears(new Date(), parseISO(panelPatient.data_nascimento))} anos)` : null },
                ].filter(i => i.value).map((item, idx) => (
                  <div key={idx} style={{ animationDelay: `${idx * 50}ms`, animation: "fadeInUp 0.3s ease both" }}>
                    <span className="text-muted-foreground text-xs">{item.label}: </span>
                    <span>{item.value}</span>
                  </div>
                ))}

                {/* Address */}
                {(panelPatient.logradouro || panelPatient.cidade) && (
                  <div style={{ animationDelay: "200ms", animation: "fadeInUp 0.3s ease both" }} className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      {[panelPatient.logradouro, panelPatient.numero, panelPatient.complemento, panelPatient.bairro, panelPatient.cidade, panelPatient.uf].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Next appointment */}
              <div style={{ animationDelay: "250ms", animation: "fadeInUp 0.3s ease both" }}>
                <p className="text-xs font-medium text-muted-foreground mb-2">Próxima consulta</p>
                {loadingAppt ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verificando...
                  </div>
                ) : nextAppt ? (
                  <div className="rounded-lg bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 space-y-1">
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wide">Próxima consulta</p>
                    <p className="text-base font-bold text-amber-900 dark:text-amber-300">
                      {format(parseISO(nextAppt.appointment_date), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {nextAppt.appointment_time?.slice(0, 5)} · {nextAppt.treatment_type}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhuma consulta agendada.</p>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-2" style={{ animationDelay: "300ms", animation: "fadeInUp 0.3s ease both" }}>
                <Button className="w-full gap-2" size="sm" onClick={() => { setPanelOpen(false); navigate(`/prontuario?cpf=${panelPatient.cpf}`); }}>
                  <FileHeart className="h-4 w-4" /> Ver Prontuário
                </Button>
                <Button variant="outline" className="w-full gap-2" size="sm" onClick={() => { setPanelOpen(false); navigate("/agenda"); }}>
                  <CalendarDays className="h-4 w-4" /> Agendar consulta
                </Button>
                <Button variant="ghost" className="w-full gap-2" size="sm" onClick={() => { setPanelOpen(false); openEdit(panelPatient); }}>
                  <Pencil className="h-4 w-4" /> Editar cadastro
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
