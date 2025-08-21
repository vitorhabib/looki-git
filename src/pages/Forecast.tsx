import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ProjectionChart } from "@/components/dashboard/projection-chart";
import { TrendingUp } from "lucide-react";

export default function Forecast() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Projeções</h1>
          <p className="text-muted-foreground">Análise e projeção do fluxo de caixa</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <ProjectionChart />
        </div>
      </div>
    </DashboardLayout>
  );
}