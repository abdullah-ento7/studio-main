
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutGrid,
  Pencil,
  PlusCircle,
  Briefcase,
  Home,
  UserCog,
  CheckSquare,
} from 'lucide-react';
import Header from './header';
import GeneralTab from './general-tab';
import ExpensesTab from './expenses-tab';
import EditTab from './edit-tab';
import FinancialsTab from './financials-tab';
import DashboardTab from './dashboard-tab';
import AdminTab from './admin-tab';
import ApprovalsTab from './approvals-tab';
import { useAuth } from '@/context/auth-context';

export default function MainLayout() {
    const { loggedInUser } = useAuth();

    if (!loggedInUser) {
        // This should ideally not happen if the page is protected, but it's a good safeguard.
        return null; 
    }

    const { permissions } = loggedInUser;
    
    // Determine the default tab based on the first available permission
    const getDefaultTab = () => {
        if (permissions.dashboard) return 'dashboard';
        if (permissions.general) return 'general';
        if (permissions.expenses) return 'expenses';
        if (permissions.financials) return 'financials';
        if (permissions.edit) return 'edit';
        if (permissions.admin) return 'approvals';
        if (permissions.admin) return 'admin';
        return ''; // Should have a fallback if no permissions
    }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs defaultValue={getDefaultTab()} className="w-full">
          <TabsList>
             {permissions.dashboard && (
                <TabsTrigger value="dashboard">
                    <Home className="mr-2" />
                    Dashboard
                </TabsTrigger>
             )}
            {permissions.general && (
                <TabsTrigger value="general">
                    <LayoutGrid className="mr-2" />
                    General
                </TabsTrigger>
            )}
            {permissions.expenses && (
                <TabsTrigger value="expenses">
                    <PlusCircle className="mr-2" />
                    Expenses
                </TabsTrigger>
            )}
            {permissions.financials && (
                <TabsTrigger value="financials">
                    <Briefcase className="mr-2" />
                    Financials
                </TabsTrigger>
            )}
            {permissions.edit && (
                <TabsTrigger value="edit">
                    <Pencil className="mr-2" />
                    Edit
                </TabsTrigger>
            )}
            {permissions.admin && (
                <TabsTrigger value="approvals">
                    <CheckSquare className="mr-2" />
                    Approvals
                </TabsTrigger>
            )}
            {permissions.admin && (
                <TabsTrigger value="admin">
                    <UserCog className="mr-2" />
                    Admin
                </TabsTrigger>
            )}
          </TabsList>
          
          {permissions.dashboard && (
            <TabsContent value="dashboard" className="mt-4">
                <DashboardTab />
            </TabsContent>
          )}
          {permissions.general && (
            <TabsContent value="general" className="mt-4">
                <GeneralTab />
            </TabsContent>
          )}
          {permissions.expenses && (
             <TabsContent value="expenses" className="mt-4">
                <ExpensesTab />
            </TabsContent>
          )}
          {permissions.financials && (
            <TabsContent value="financials" className="mt-4">
                <FinancialsTab />
            </TabsContent>
          )}
          {permissions.edit && (
            <TabsContent value="edit" className="mt-4">
                <EditTab />
            </TabsContent>
          )}
          {permissions.admin && (
            <TabsContent value="approvals" className="mt-4">
                <ApprovalsTab />
            </TabsContent>
          )}
          {permissions.admin && (
            <TabsContent value="admin" className="mt-4">
                <AdminTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
