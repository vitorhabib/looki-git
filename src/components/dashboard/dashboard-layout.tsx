'use client';

import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./dashboard-header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className={cn(
            "flex-1 overflow-auto p-6 bg-gradient-to-br from-background to-muted/20",
            className
          )}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}