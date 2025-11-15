
'use client'

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import type { Trip, Expense } from '@/lib/types';
import { getShipmentFare } from '@/lib/utils';
import { Label } from '../ui/label';
import { MultiSelectCombobox } from '../ui/multi-select-combobox';

interface AccountSummary {
    totalRevenue: number;
    totalExpense: number;
    balance: number;
}

interface Transaction {
    date: string;
    description: string;
    debit: number;
    credit: number;
}

export default function AccountsTab() {
    const { customers, suppliers, trips, expenses, savedBills, owners, vehicles, refreshBills } = useData();
    const [accountType, setAccountType] = React.useState<'customer' | 'supplier' | 'vehicle'>();
    const [selectedAccountId, setSelectedAccountId] = React.useState<string>(); // For customer/supplier/owner
    const [selectedVehicleIds, setSelectedVehicleIds] = React.useState<string[]>([]);

    const [summary, setSummary] = React.useState<AccountSummary | null>(null);
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);

    React.useEffect(() => {
        let isSelectionInvalid = false;
        if (!accountType || !selectedAccountId) {
            isSelectionInvalid = true;
        }
        if(accountType === 'vehicle' && selectedVehicleIds.length === 0) {
            isSelectionInvalid = true;
        }

        if (isSelectionInvalid) {
            setSummary(null);
            setTransactions([]);
            return;
        }

        let totalRevenue = 0;
        let totalExpense = 0;
        const newTransactions: Transaction[] = [];

        if (accountType === 'customer') {
            let customerTrips = trips.filter(trip => trip.shipments.some(s => s.customerId === selectedAccountId));
            if(selectedVehicleIds.length > 0) {
                customerTrips = customerTrips.filter(trip => selectedVehicleIds.includes(trip.vehicleId));
            }
            
            customerTrips.forEach(trip => {
                trip.shipments.filter(s => s.customerId === selectedAccountId).forEach(shipment => {
                    const fare = getShipmentFare(shipment);
                    totalRevenue += fare;
                    newTransactions.push({
                        date: trip.endDate || trip.startDate,
                        description: `Freight for Trip ${trip.id} (${shipment.productName})`,
                        debit: fare,
                        credit: 0
                    });
                });
            });

            const customerPayments = trips.flatMap(trip => 
                trip.payments?.filter(p => p.status === 'approved' && customerTrips.some(ct => ct.id === trip.id)) || []
            );

            customerPayments.forEach(payment => {
                totalExpense += payment.amount; // A payment from customer is a credit to our account, but reduces their debit balance
                 newTransactions.push({
                    date: payment.date,
                    description: `Payment received - ${payment.description || 'Settlement'}`,
                    debit: 0,
                    credit: payment.amount
                });
            })

        } else if (accountType === 'supplier') {
            let supplierExpenses = expenses.filter(e => e.supplierId === selectedAccountId && e.status === 'approved');
            if(selectedVehicleIds.length > 0) {
                supplierExpenses = supplierExpenses.filter(e => e.expenseForId && selectedVehicleIds.includes(e.expenseForId));
            }
            
            supplierExpenses.forEach(expense => {
                totalRevenue += expense.amount; // what we owe them
                newTransactions.push({
                    date: expense.date,
                    description: `Service/Material for Trip ${expense.tripId}: ${expense.description}`,
                    debit: expense.amount, // This is a debit for the supplier (credit for us)
                    credit: 0
                });
            });
            
            const supplierBills = savedBills.filter(b => b.billFor === 'supplier' && b.item.id === selectedAccountId);
            supplierBills.forEach(bill => {
                bill.payments.forEach(p => {
                    totalExpense += p.amount; // Payment made reduces what we owe
                    newTransactions.push({
                        date: p.date,
                        description: `Payment made - ${p.description || 'Bill Settlement'}`,
                        debit: 0,
                        credit: p.amount
                    });
                });
            });

        } else if (accountType === 'vehicle') {
            const vehicleTrips = trips.filter(trip => selectedVehicleIds.includes(trip.vehicleId));
            const vehicleExpenses = expenses.filter(exp => exp.expenseForId && selectedVehicleIds.includes(exp.expenseForId) && exp.status === 'approved');
            
            vehicleTrips.forEach(trip => {
                trip.shipments.forEach(shipment => {
                    const fare = getShipmentFare(shipment);
                    totalRevenue += fare;
                    newTransactions.push({
                        date: trip.endDate || trip.startDate,
                        description: `Freight for Trip ${trip.id}`,
                        debit: fare,
                        credit: 0
                    });
                });
            });

            vehicleExpenses.forEach(expense => {
                totalExpense += expense.amount;
                newTransactions.push({
                    date: expense.date,
                    description: `Expense on Trip ${expense.tripId}: ${expense.description || expense.category}`,
                    debit: 0,
                    credit: expense.amount
                });
            });
        }

        setSummary({
            totalRevenue: totalRevenue,
            totalExpense: totalExpense,
            balance: totalRevenue - totalExpense
        });
        
        setTransactions(newTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    }, [selectedAccountId, selectedVehicleIds, accountType, trips, expenses, savedBills, refreshBills]);


    const handleAccountTypeChange = (v: 'customer' | 'supplier' | 'vehicle') => {
        setAccountType(v);
        setSelectedAccountId(undefined);
        setSelectedVehicleIds([]);
    }

    const selectionOptions = {
        customer: customers.map(c => ({ value: c.id, label: c.name })),
        supplier: suppliers.map(s => ({ value: s.id, label: s.name })),
        vehicle: owners.map(o => ({ value: o.id, label: o.name })),
    };
    
    const associatedVehicleOptions = React.useMemo(() => {
        if (!selectedAccountId || (accountType !== 'customer' && accountType !== 'supplier')) return [];
        
        let relevantTripIds: string[] = [];
        if (accountType === 'customer') {
            relevantTripIds = trips
                .filter(t => t.shipments.some(s => s.customerId === selectedAccountId))
                .map(t => t.id);
        } else if (accountType === 'supplier') {
            relevantTripIds = expenses
                .filter(e => e.supplierId === selectedAccountId)
                .map(e => e.tripId);
        }
        
        const vehicleIds = trips
            .filter(t => relevantTripIds.includes(t.id))
            .map(t => t.vehicleId);
        
        const uniqueVehicleIds = [...new Set(vehicleIds)];

        return vehicles
            .filter(v => uniqueVehicleIds.includes(v.id))
            .map(v => ({ value: v.id, label: v.registrationNumber }));
    }, [selectedAccountId, accountType, trips, expenses, vehicles]);


    const ownerVehicleOptions = React.useMemo(() => {
        if (accountType !== 'vehicle' || !selectedAccountId) return [];
        return vehicles
            .filter(v => v.ownerId === selectedAccountId)
            .map(v => ({ value: v.id, label: v.registrationNumber }));
    }, [accountType, selectedAccountId, vehicles]);

    const getSelectionPlaceholder = () => {
        if (!accountType) return 'Select account type first';
        if (accountType === 'vehicle') return 'Select an owner';
        return `Select a ${accountType}`;
    }

    const isSelectionComplete = accountType && selectedAccountId && (accountType !== 'vehicle' || selectedVehicleIds.length > 0);

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Account Ledgers</CardTitle>
                    <CardDescription>View financial summaries and transaction histories for customers, suppliers, and vehicles.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Account Type</Label>
                        <Select onValueChange={handleAccountTypeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="supplier">Supplier</SelectItem>
                                <SelectItem value="vehicle">Vehicle</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {accountType && (
                        <div className="space-y-2">
                            <Label>{accountType === 'vehicle' ? 'Select Owner' : 'Select Account'}</Label>
                            <Select onValueChange={(val) => {setSelectedAccountId(val); setSelectedVehicleIds([])}} value={selectedAccountId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={getSelectionPlaceholder()} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(selectionOptions[accountType] || []).map(item => (
                                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {accountType === 'vehicle' && selectedAccountId && (
                        <div className="space-y-2">
                            <Label>Select Vehicle(s)</Label>
                            <MultiSelectCombobox
                                options={ownerVehicleOptions}
                                onSelectionChange={setSelectedVehicleIds}
                                placeholder="Select vehicles..."
                            />
                        </div>
                    )}
                    {(accountType === 'customer' || accountType === 'supplier') && selectedAccountId && associatedVehicleOptions.length > 0 && (
                         <div className="space-y-2">
                            <Label>Filter by Vehicle(s)</Label>
                            <MultiSelectCombobox
                                options={associatedVehicleOptions}
                                onSelectionChange={setSelectedVehicleIds}
                                placeholder="All vehicles..."
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {summary && isSelectionComplete && (
                <Card>
                    <CardHeader>
                        <CardTitle>Financial Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4 text-center">
                         <div>
                            <p className="text-sm text-muted-foreground">{accountType === 'supplier' ? 'Total Owed' : 'Total Revenue/Billed'}</p>
                            <p className="font-bold text-lg">{summary.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{accountType === 'supplier' ? 'Total Paid' : 'Total Expenses/Paid'}</p>
                            <p className={`font-bold text-lg ${accountType === 'supplier' ? 'text-green-600' : 'text-red-600'}`}>
                                {summary.totalExpense.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Balance</p>
                            <p className={`font-bold text-lg ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.abs(summary.balance).toLocaleString()} {summary.balance >= 0 ? (accountType === 'supplier' ? 'Cr' : 'Dr') : (accountType === 'supplier' ? 'Dr' : 'Cr')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {transactions.length > 0 && isSelectionComplete && (
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Debit</TableHead>
                                        <TableHead className="text-right">Credit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((tx, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{tx.description}</TableCell>
                                            <TableCell className="text-right text-green-600">{tx.debit > 0 ? tx.debit.toLocaleString() : '-'}</TableCell>
                                            <TableCell className="text-right text-red-600">{tx.credit > 0 ? `(${tx.credit.toLocaleString()})` : '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
            
            {!isSelectionComplete && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>Please select an account type and an account to view details.</p>
                </div>
            )}
        </div>
    );
}
