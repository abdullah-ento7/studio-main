
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
  BarChart,
  FileCheck2,
} from 'lucide-react';
import Header from './header';
import GeneralTab from './general-tab';
import ExpensesTab from './expenses-tab';
import EditTab from './edit-tab';
import ReportsTab from './reports-tab';
import BillingTab from './billing-tab';
import DashboardTab from './dashboard-tab';
import AdminTab from './admin-tab';
import ApprovalsTab from './approvals-tab';
import { useAuth } from '@/context/auth-context';

export default function MainLayout() {
    const { user: loggedInUser } = useAuth();

    if (!loggedInUser) {
        return null;
    }

    const { permissions } = loggedInUser;
    
    const getDefaultTab = () => {
        if (permissions?.dashboard) return 'dashboard';
        if (permissions?.general) return 'general';
        if (permissions?.expenses) return 'expenses';
        if (permissions?.reports) return 'reports';
        if (permissions?.billing) return 'billing';
        if (permissions?.edit) return 'edit';
        if (permissions?.admin) return 'admin';
        return '';
    }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs defaultValue={getDefaultTab()} className="w-full">
          <TabsList className="grid w-full grid-cols-1 h-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-9">
             {permissions?.dashboard && (
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    <Home className="mr-2" />
                    Dashboard
                </TabsTrigger>
             )}
            {permissions?.general && (
                <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    <LayoutGrid className="mr-2" />
                    General
                </TabsTrigger>
            )}
            {permissions?.expenses && (
                <TabsTrigger value="expenses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    <PlusCircle className="mr-2" />
                    Expenses
                </TabsTrigger>
            )}
            {permissions?.reports && (
                <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    <BarChart className="mr-2" />
                    Reports
                </TabsTrigger>
            )}
            {permissions?.billing && (
                <TabsTrigger value="billing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    <FileCheck2 className="mr-2" />
                    Billing
                </TabsTrigger>
            )}
            {permissions?.edit && (
                <TabsTrigger value="edit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    <Pencil className="mr-2" />
                    Edit
                </TabsTrigger>
            )}
            {permissions?.admin && (
                <>
                    <TabsTrigger value="admin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                        <UserCog className="mr-2" />
                        Admin
                    </TabsTrigger>
                    <TabsTrigger value="approvals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                        <CheckSquare className="mr-2" />
                        Approvals
                    </TabsTrigger>
                </>
            )}
          </TabsList>
          
          {permissions?.dashboard && (
            <TabsContent value="dashboard" className="mt-4">
                <DashboardTab />
            </TabsContent>
          )}
          {permissions?.general && (
            <TabsContent value="general" className="mt-4">
                <GeneralTab />
            </TabsContent>
          )}
          {permissions?.expenses && (
             <TabsContent value="expenses" className="mt-4">
                <ExpensesTab />
            </TabsContent>
          )}
          {permissions?.reports && (
            <TabsContent value="reports" className="mt-4">
                <ReportsTab />
            </TabsContent>
          )}
          {permissions?.billing && (
            <TabsContent value="billing" className="mt-4">
                <BillingTab />
            </TabsContent>
          )}
          {permissions?.edit && (
            <TabsContent value="edit" className="mt-4">
                <EditTab />
            </TabsContent>
          )}
          {permissions?.admin && (
            <>
                <TabsContent value="admin" className="mt-4">
                    <AdminTab />
                </TabsContent>
                <TabsContent value="approvals" className="mt-4">
                    <ApprovalsTab />
                </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}
