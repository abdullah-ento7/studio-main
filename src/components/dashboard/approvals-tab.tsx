
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/context/data-context';
import type { Expense, TripPayment, Trip } from '@/lib/types';
import { Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

export default function ApprovalsTab() {
  const { expenses, setExpenses, trips, setTrips } = useData();
  const { loggedInUser } = useAuth();
  const { toast } = useToast();

  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  
  const pendingPayments: (TripPayment & { tripId: string })[] = trips.flatMap(trip => 
    (trip.payments || [])
      .filter(p => p.status === 'pending')
      .map(p => ({ ...p, tripId: trip.id }))
  );

  const handleExpenseApproval = (expenseId: string, newStatus: 'approved' | 'rejected') => {
    setExpenses(prev =>
      prev.map(exp => (exp.id === expenseId ? { ...exp, status: newStatus } : exp))
    );
    toast({
      title: `Expense ${newStatus}`,
      description: `Expense ${expenseId} has been ${newStatus}.`,
    });
  };

  const handlePaymentApproval = (paymentId: string, tripId: string, newStatus: 'approved' | 'rejected') => {
    setTrips(prevTrips =>
      prevTrips.map(trip => {
        if (trip.id === tripId) {
          return {
            ...trip,
            payments: trip.payments?.map(p =>
              p.id === paymentId ? { ...p, status: newStatus } : p
            ),
          };
        }
        return trip;
      })
    );
     toast({
      title: `Payment ${newStatus}`,
      description: `Payment ${paymentId} has been ${newStatus}.`,
    });
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Expense Approvals</CardTitle>
          <CardDescription>Review and approve or reject expenses submitted by users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense ID</TableHead>
                  <TableHead>Trip ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingExpenses.length > 0 ? (
                  pendingExpenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.id}</TableCell>
                      <TableCell>{expense.tripId}</TableCell>
                      <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell>{expense.createdBy}</TableCell>
                      <TableCell className='capitalize'>{expense.category}</TableCell>
                      <TableCell>{expense.amount.toLocaleString()}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleExpenseApproval(expense.id, 'approved')}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleExpenseApproval(expense.id, 'rejected')}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No pending expenses.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Pending Payment Approvals</CardTitle>
          <CardDescription>Review and approve or reject payments recorded by users.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Trip ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.length > 0 ? (
                  pendingPayments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.id}</TableCell>
                      <TableCell>{payment.tripId}</TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell>{payment.createdBy}</TableCell>
                      <TableCell>{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handlePaymentApproval(payment.id, payment.tripId, 'approved')}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handlePaymentApproval(payment.id, payment.tripId, 'rejected')}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No pending payments.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
