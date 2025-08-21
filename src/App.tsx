import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OrgSelect from "./pages/OrgSelect";
import Clients from "./pages/Clients";
import ClientForm from "./pages/ClientForm";
import ClientDetail from "./pages/ClientDetail";
import Invoices from "./pages/Invoices";

import InvoiceDetail from "./pages/InvoiceDetail";
import Expenses from "./pages/Expenses";
import Categories from "./pages/Categories";
import Forecast from "./pages/Forecast";

import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import MasterAdmin from "./pages/MasterAdmin";
import Notifications from "./pages/Notifications";

import PublicCheckout from "./pages/PublicCheckout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/org-select" element={<ProtectedRoute requiresOrganization={false}><OrgSelect /></ProtectedRoute>} />
          <Route path="/org/:slug" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/org/:slug/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/org/:slug/clients/new" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
          <Route path="/org/:slug/clients/:id/edit" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
          <Route path="/org/:slug/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
          <Route path="/org/:slug/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />

          <Route path="/org/:slug/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
          <Route path="/org/:slug/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/org/:slug/expenses/new" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/org/:slug/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/org/:slug/forecast" element={<ProtectedRoute><Forecast /></ProtectedRoute>} />
          <Route path="/org/:slug/billing" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
          <Route path="/org/:slug/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/org/:slug/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/org/:slug/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/master-admin" element={<ProtectedRoute requiresOrganization={false}><MasterAdmin /></ProtectedRoute>} />

          {/* Routes without org slug for direct access */}
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/clients/new" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
          <Route path="/clients/:id/edit" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
          <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />

          <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/expenses/new" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/forecast" element={<ProtectedRoute><Forecast /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/pagar/:invoiceId" element={<PublicCheckout />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
