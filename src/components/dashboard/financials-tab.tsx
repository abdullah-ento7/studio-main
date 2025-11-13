
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, FileCheck2 } from 'lucide-react';
import BillingTab from './billing-tab';
import ReportTab from './report-tab';

export default function FinancialsTab() {

  return (
    <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports"><BarChart className="mr-2 h-4 w-4" />Reports</TabsTrigger>
            <TabsTrigger value="billing"><FileCheck2 className="mr-2 h-4 w-4" />Billing & Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="mt-4">
            <ReportTab />
        </TabsContent>
        <TabsContent value="billing" className="mt-4">
            <BillingTab />
        </TabsContent>
    </Tabs>
  );
}
