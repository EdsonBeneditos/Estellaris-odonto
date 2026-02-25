import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Building2, Users, Database } from "lucide-react";
import { Navigate } from "react-router-dom";

interface OrgRow {
  id: string;
  nome_clinica: string;
  cnpj: string | null;
  plano: string | null;
  created_at: string | null;
}

export default function SystemAdmin() {
  const { isSuperAdmin, loading } = useAuth();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    if (!isSuperAdmin) return;

    const load = async () => {
      const { data: orgData } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
      if (orgData) setOrgs(orgData);

      const { count: pCount } = await supabase.from("patients").select("*", { count: "exact", head: true });
      setPatientCount(pCount ?? 0);

      const { count: rCount } = await supabase.from("medical_records").select("*", { count: "exact", head: true });
      setRecordCount(rCount ?? 0);
    };
    load();
  }, [isSuperAdmin]);

  if (loading) return null;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-display font-bold">Configurações do Sistema</h1>
        <Badge variant="outline" className="text-xs border-primary text-primary">Super Admin</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clínicas</CardTitle>
            <Building2 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{orgs.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pacientes (total)</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{patientCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prontuários</CardTitle>
            <Database className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{recordCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-display">Todas as Clínicas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma clínica cadastrada</TableCell></TableRow>
              ) : orgs.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.nome_clinica}</TableCell>
                  <TableCell>{o.cnpj ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{o.plano ?? "free"}</Badge></TableCell>
                  <TableCell>{o.created_at ? new Date(o.created_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
