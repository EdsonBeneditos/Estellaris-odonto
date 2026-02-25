import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Financeiro() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <DollarSign className="h-6 w-6 text-primary" /> Financeiro
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">R$ 0,00</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">R$ 0,00</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
            <Receipt className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">R$ 0,00</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">R$ 0,00</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-display">Histórico Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <DollarSign className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground text-sm">O módulo financeiro completo será implementado em breve.</p>
            <p className="text-xs text-muted-foreground/60">Controle de receitas, despesas, cobranças e relatórios.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
