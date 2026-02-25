import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { validateCPF, formatCPF, formatPhone, validatePhone, validateEmail } from "@/lib/validators";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Patient {
  id: string;
  nome_completo: string;
  cpf: string;
  telefone: string | null;
  data_nascimento: string | null;
  created_at: string | null;
}

export default function Patients() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome_completo: "", cpf: "", telefone: "", email: "", data_nascimento: "" });
  const [saving, setSaving] = useState(false);

  const loadPatients = async () => {
    const { data } = await supabase.from("patients").select("*").order("nome_completo");
    if (data) setPatients(data);
  };

  useEffect(() => { loadPatients(); }, []);

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
      data_nascimento: form.data_nascimento || null,
      organization_id: profile?.organization_id,
    });

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Paciente cadastrado!" });
      setForm({ nome_completo: "", cpf: "", telefone: "", email: "", data_nascimento: "" });
      setOpen(false);
      loadPatients();
    }
    setSaving(false);
  };

  const filtered = patients.filter(
    (p) => p.nome_completo.toLowerCase().includes(search.toLowerCase()) || p.cpf.includes(search.replace(/\D/g, ""))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Pacientes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Paciente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Cadastrar Paciente</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input value={form.nome_completo} onChange={(e) => setForm({ ...form, nome_completo: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>CPF *</Label>
                <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" required />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="paciente@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? "Salvando..." : "Cadastrar"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Buscar por nome ou CPF..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum paciente encontrado</TableCell></TableRow>
              ) : filtered.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/prontuario?cpf=${p.cpf}`)}>
                  <TableCell className="font-medium">{p.nome_completo}</TableCell>
                  <TableCell>{formatCPF(p.cpf)}</TableCell>
                  <TableCell>{p.telefone ?? "—"}</TableCell>
                  <TableCell>{p.data_nascimento ? new Date(p.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/prontuario?cpf=${p.cpf}`); }}>
                      Prontuário
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
