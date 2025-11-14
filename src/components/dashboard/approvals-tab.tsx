
'use client';

import React from 'react';
import { useData } from '@/context/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DataTable from './data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Expense } from '@/lib/types';
import { ArrowUpDown, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ApprovalsTab() {
  const dataContext = useData();

  if (!dataContext) {
    return <div>Loading...</div>;
  }

  const { expenses, setExpenses, trips, drivers, vehicles } = dataContext;

  const pendingExpenses = expenses.filter(e => e.status === 'pending');

  const handleApproval = (expenseId: string, newStatus: 'approved' | 'rejected') => {
    setExpenses(expenses.map(e => 
      e.id === expenseId ? { ...e, status: newStatus } : e
    ));
    toast({ title: `Expense ${newStatus}`, description: `The expense has been ${newStatus}.` });
  };

  const columns: ColumnDef<Expense>[] = [
    {
        accessorKey: "date",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
        accessorKey: "tripId",
        header: "Trip",
        cell: ({ row }) => {
            const trip = trips.find(t => t.id === row.original.tripId);
            return trip ? `${trip.vehicleReg} - ${trip.routeName}` : 'N/A';
        }
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    {
        accessorKey: "description",
        header: "Description",
    },
    {
        accessorKey: "amount",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Amount
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"));
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PKR", // Adjust currency as needed
            }).format(amount);
            return <div className="text-right font-medium">{formatted}</div>;
        },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleApproval(row.original.id, 'approved')}><Check className="h-4 w-4 text-green-500" /></Button>
          <Button variant="outline" size="sm" onClick={() => handleApproval(row.original.id, 'rejected')}><X className="h-4 w-4 text-red-500" /></Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Approvals</CardTitle>
        <CardDescription>Review and approve or reject pending expenses.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={pendingExpenses} />
      </CardContent>
    </Card>
  );
}
