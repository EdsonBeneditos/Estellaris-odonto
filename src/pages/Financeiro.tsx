import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown, Receipt, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORIES = ["Consulta", "Procedimento", "Material", "Aluguel", "Salário", "Impostos", "Manutenção", "Geral", "Outros"];

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  transaction_date: string;
  created_at: string;
}

export default function Financeiro() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"income" | "expense">("income");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Geral");
  const [txDate, setTxDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  const fetchTransactions = async () => {
    if (!profile?.organization_id) return;
    setLoading(true);
    const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date()), "yyyy-MM-dd");
    const { data } = await supabase
      .from("financial_transactions")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .gte("transaction_date", start)
      .lte("transaction_date", end)
      .order("transaction_date", { ascending: false });
    setTransactions((data as Transaction[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, [profile?.organization_id]);

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  const openDialog = (type: "income" | "expense") => {
    setDialogType(type);
    setDesc("");
    setAmount("");
    setCategory("Geral");
    setTxDate(format(new Date(), "yyyy-MM-dd"));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!desc || !amount || !profile?.organization_id) return;
    setSaving(true);
    const { error } = await supabase.from("financial_transactions").insert({
      organization_id: profile.organization_id,
      description: desc,
      amount: parseFloat(amount),
      type: dialogType,
      category,
      transaction_date: txDate,
      created_by: profile.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: dialogType === "income" ? "Entrada registrada!" : "Despesa registrada!" });
      setDialogOpen(false);
      fetchTransactions();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("financial_transactions").delete().eq("id", id);
    fetchTransactions();
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" /> Financeiro
        </h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => openDialog("income")} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Nova Entrada
          </Button>
          <Button size="sm" variant="destructive" onClick={() => openDialog("expense")} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Nova Despesa
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent><p className="text-2xl font-display font-bold">{fmt(totals.income)}</p></CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><p className="text-2xl font-display font-bold">{fmt(totals.expense)}</p></CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
            <Receipt className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent><p className="text-2xl font-display font-bold">R$ 0,00</p></CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><p className={`text-2xl font-display font-bold ${totals.net < 0 ? "text-destructive" : ""}`}>{fmt(totals.net)}</p></CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-display">
            Movimentações — {format(new Date(), "MMMM yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground text-sm">Nenhuma movimentação neste mês.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs">{format(new Date(tx.transaction_date + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-sm font-medium">{tx.description}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{tx.category}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={tx.type === "income" ? "default" : "destructive"} className="text-[10px]">
                        {tx.type === "income" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold text-sm ${tx.type === "income" ? "text-accent" : "text-destructive"}`}>
                      {tx.type === "income" ? "+" : "-"}{fmt(Number(tx.amount))}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => handleDelete(tx.id)} className="opacity-50 hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              {dialogType === "income" ? "Nova Entrada" : "Nova Despesa"}
            </DialogTitle>
            <DialogDescription>Registre a movimentação financeira.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Descrição *</Label>
              <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Consulta paciente X" className="h-8 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Data</Label>
                <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={!desc || !amount || saving} onClick={handleSave}>
              {saving ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
