
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { FileDown, Printer, Receipt, DollarSign, Save, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Driver, Vehicle, Customer, Trip, Expense, Supplier, TripPayment, Shipment, User, Bill } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '../icons';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { MultiSelectCombobox } from '../ui/multi-select-combobox';
import { useData } from '@/context/data-context';
import { Badge } from '../ui/badge';
import { getShipmentFare } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

export default function BillingTab() {
  const { drivers, vehicles, customers, trips, setTrips, expenses, suppliers, cities, savedBills, setSavedBills } = useData();
  const { loggedInUser } = useAuth();
  const { toast } = useToast();

  const [billFor, setBillFor] = React.useState<'trip' | 'customer' | 'supplier' | 'driver'>();
  const [selectedItemId, setSelectedItemId] = React.useState<string>();
  const [selectedTripIds, setSelectedTripIds] = React.useState<string[]>([]);
  const [fromDate, setFromDate] = React.useState<Date>();
  const [toDate, setToDate] = React.useState<Date>();
  
  const [generatedBill, setGeneratedBill] = React.useState<Bill | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');


  const [relevantTrips, setRelevantTrips] = React.useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = React.useState<string>();
  const [tripDetails, setTripDetails] = React.useState<{trip: Trip, expenses: Expense[]} | null>(null);
  const [customerFinancials, setCustomerFinancials] = React.useState<{totalBilled: number, totalPaid: number, balance: number} | null>(null);

  const [paymentAmount, setPaymentAmount] = React.useState('');
  const [paymentDate, setPaymentDate] = React.useState<Date | undefined>(new Date());
  const [paymentDescription, setPaymentDescription] = React.useState('');
  const [paymentType, setPaymentType] = React.useState<'settlement' | 'advance'>('settlement');


  const dateFilteredTripOptions = React.useMemo(() => {
    let completedTrips = trips.filter(t => t.status === 'completed');
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      from.setHours(0,0,0,0);
      const to = new Date(toDate);
      to.setHours(23,59,59,999);
      completedTrips = completedTrips.filter(t => {
        const tripEndDate = t.endDate ? new Date(t.endDate) : null;
        if (!tripEndDate) return false;
        tripEndDate.setHours(0,0,0,0);
        return tripEndDate >= from && tripEndDate <= to;
      });
    }
    return completedTrips.map(t => ({ value: t.id, label: `${t.id} (${t.routeName})` }));
  }, [trips, fromDate, toDate]);

  React.useEffect(() => {
    if (selectedItemId && (billFor === 'customer' || billFor === 'driver' || billFor === 'supplier')) {
        let filteredTrips: Trip[] = [];
        const completedTrips = trips.filter(t => t.status === 'completed');
        const approvedExpenses = expenses.filter(e => e.status === 'approved');

        if(billFor === 'customer') {
            const customerTrips = trips.filter(t => t.shipments.some(s => s.customerId === selectedItemId));
            filteredTrips = customerTrips.filter(t => t.status === 'completed');
            
            // Calculate customer financials
            let totalBilled = 0;
            let totalPaid = 0;
            customerTrips.forEach(trip => {
                trip.shipments.filter(s => s.customerId === selectedItemId).forEach(shipment => {
                    totalBilled += getShipmentFare(shipment);
                });
                trip.payments?.filter(p => p.status === 'approved').forEach(p => {
                    totalPaid += p.amount;
                });
            });
            setCustomerFinancials({totalBilled, totalPaid, balance: totalBilled - totalPaid});

        } else if (billFor === 'driver') {
            filteredTrips = completedTrips.filter(t => t.driverId === selectedItemId);
            setCustomerFinancials(null);
        } else if (billFor === 'supplier') {
            const supplierExpenses = approvedExpenses.filter(e => e.supplierId === selectedItemId);
            const tripIdsWithSupplierExpenses = [...new Set(supplierExpenses.map(e => e.tripId))];
            filteredTrips = completedTrips.filter(t => tripIdsWithSupplierExpenses.includes(t.id));
            setCustomerFinancials(null);
        }

        setRelevantTrips(filteredTrips);
        setSelectedTripId(undefined);
        setTripDetails(null);
    } else {
        setRelevantTrips([]);
        setCustomerFinancials(null);
    }
  }, [selectedItemId, billFor, trips, expenses, vehicles]);


  React.useEffect(() => {
    if (selectedTripId) {
        const trip = trips.find(t => t.id === selectedTripId);
        if (trip) {
            const tripExpenses = expenses.filter(e => e.tripId === selectedTripId && e.status === 'approved');
            setTripDetails({ trip, expenses: tripExpenses });
        }
    } else {
        setTripDetails(null);
    }
  }, [selectedTripId, trips, expenses]);

  const handleAddPayment = () => {
    if (!tripDetails || !paymentAmount || !paymentDate || !loggedInUser) {
        toast({ title: 'Missing Payment Info', description: 'Please provide amount and date.', variant: 'destructive'});
        return;
    }

    const newPayment: TripPayment = {
        id: `PAY${Date.now()}`,
        amount: parseFloat(paymentAmount),
        date: paymentDate.toISOString(),
        description: paymentType === 'advance' ? 'Advance Payment' : paymentDescription,
        createdBy: loggedInUser.username,
        status: loggedInUser.permissions.admin ? 'approved' : 'pending',
    };

    const updatedTrip: Trip = {
        ...tripDetails.trip,
        payments: [...(tripDetails.trip.payments || []), newPayment],
    };

    setTrips(prevTrips => prevTrips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    
    toast({ title: 'Payment Submitted', description: 'Your payment has been submitted for approval.'});
    setPaymentAmount('');
    setPaymentDescription('');
    setPaymentDate(new Date());
    setPaymentType('settlement');
  }

  const handleGenerateBill = () => {
    const isTripWiseMulti = billFor === 'trip' && selectedTripIds.length > 0;
    
    if (!billFor || (!selectedItemId && !isTripWiseMulti) || !loggedInUser) {
      toast({
        title: 'Missing Information',
        description: 'Please select bill type and item(s).',
        variant: 'destructive',
      });
      return;
    }

    if(isTripWiseMulti && (!fromDate || !toDate)) {
        toast({
            title: 'Missing Date Range',
            description: 'Please select a date range for trip-wise billing.',
            variant: 'destructive',
        });
        return;
    }

    const approvedExpenses = expenses.filter(e => e.status === 'approved');

    let revenueItems: { description: string; amount: number }[] = [];
    let expenseItems: { description: string; amount: number }[] = [];
    let billItem: any;
    let billItems: any[] = [];
    let payments: TripPayment[] = [];
    
    const effectiveFromDate = fromDate || new Date(0);
    const effectiveToDate = toDate || new Date();


    const dateFilteredTrips = trips.filter(t => {
        const tripEndDate = t.endDate ? new Date(t.endDate) : new Date();
        return tripEndDate >= effectiveFromDate && tripEndDate <= effectiveToDate;
    });

    switch (billFor) {
        case 'trip': {
            const selectedTrips = trips.filter(t => selectedTripIds.includes(t.id) && t.status === 'completed');
            if (selectedTrips.length === 0) return;
            
            billItem = { name: `Multiple Trips (${selectedTripIds.join(', ')})`};
            billItems = selectedTrips;

            selectedTrips.forEach(trip => {
                trip.shipments.forEach((shipment) => {
                    const customer = customers.find(c => c.id === shipment.customerId);
                    revenueItems.push({
                        description: `Fare for ${customer?.name || 'N/A'} (Trip ${trip.id})`,
                        amount: getShipmentFare(shipment)
                    });
                });
                approvedExpenses.filter(e => e.tripId === trip.id).forEach(exp => {
                    expenseItems.push({
                        description: `${exp.category}: ${exp.description || 'N/A'} (Trip ${trip.id})`,
                        amount: exp.amount
                    });
                });
                payments.push(...(trip.payments?.filter(p => p.status === 'approved') || []));
            });
            break;
        }
        case 'customer': {
            const customer = customers.find(c => c.id === selectedItemId);
            if (!customer) return;
            billItem = customer;

            const customerTrips = dateFilteredTrips.filter(t => 
                t.shipments.some(s => s.customerId === selectedItemId)
            );
            
            billItems = customerTrips;

            customerTrips.forEach(trip => {
                 trip.shipments.filter(s => s.customerId === selectedItemId).forEach(shipment => {
                    revenueItems.push({
                        description: `Fare for Trip ${trip.id} (${trip.routeName})`,
                        amount: getShipmentFare(shipment)
                    });
                 });
                 // DO NOT include trip expenses for customer bills
                 // expenseItems.push(...approvedExpenses.filter(e => e.tripId === trip.id));
                 payments.push(...(trip.payments?.filter(p => p.status === 'approved') || []));
            });
            break;
        }
        case 'supplier': {
            const supplier = suppliers.find(s => s.id === selectedItemId);
            if (!supplier) return;
            billItem = supplier;

            const supplierExpenses = approvedExpenses.filter(e => 
                e.supplierId === selectedItemId && dateFilteredTrips.some(t => t.id === e.tripId)
            );
            
            billItems = supplierExpenses.map(exp => trips.find(t => t.id === exp.tripId)).filter(Boolean) as Trip[];

            supplierExpenses.forEach(exp => {
                const vehicle = vehicles.find(v => v.id === exp.expenseForId);
                // For suppliers, their "revenue" is the expense from our perspective.
                revenueItems.push({
                    description: `Service/Material for Vehicle ${vehicle?.registrationNumber} on Trip ${exp.tripId} (${new Date(exp.date).toLocaleDateString()}): ${exp.description}`,
                    amount: exp.amount,
                })
            })
            // Payments made to the supplier would be handled separately,
            // for now, we show what is owed to them.
            break;
        }
        case 'driver': {
            const driver = drivers.find(d => d.id === selectedItemId);
            if (!driver) return;
            billItem = driver;

            const driverTrips = dateFilteredTrips.filter(t => t.driverId === selectedItemId);
            billItems = driverTrips;
            
            revenueItems.push({
                description: `Salary for the period`,
                amount: driver.salary 
            });
            
            // Get all expenses for trips this driver has been on in the period
            const driverTripIds = driverTrips.map(t => t.id);
            const driverTripExpenses = approvedExpenses.filter(e => driverTripIds.includes(e.tripId));

            driverTripExpenses.forEach(exp => {
                expenseItems.push({
                    description: `Expense for Trip ${exp.tripId}: ${exp.description || exp.category}`,
                    amount: exp.amount
                });
            });

            // Include any payments made to the driver during these trips
            driverTrips.forEach(trip => {
                payments.push(...(trip.payments?.filter(p => p.status === 'approved') || []));
            });
            break;
        }
    }
    
    const totalRevenue = revenueItems.reduce((acc, item) => acc + item.amount, 0);
    const totalExpenses = expenseItems.reduce((acc, item) => acc + item.amount, 0);
    const paidAmount = payments.reduce((acc, p) => acc + p.amount, 0);
    
    // For customer/driver, balance is what they owe us or what we owe them
    // For supplier, balance is what we owe them
    // For trip, it's the net profit/loss
    const balance = totalRevenue - totalExpenses - paidAmount;

    let status: Bill['status'] = 'Unpaid';
    if (balance <= 0) {
        status = 'Paid';
    } else if (paidAmount > 0 && balance > 0) {
        status = 'Partial';
    }


    const newBill: Bill = {
        id: `INV-${Date.now()}`,
        billFor: billFor!,
        item: billItem,
        items: billItems.length > 0 ? billItems : undefined,
        fromDate: effectiveFromDate,
        toDate: effectiveToDate,
        revenue: revenueItems,
        expenses: expenseItems,
        totalAmount: totalRevenue,
        creditAmount: paidAmount, // Amount paid to us or by us
        debitAmount: totalExpenses, // Expenses or deductions
        change: balance, // Final balance
        payments,
        status,
        generatedBy: loggedInUser.username,
        generationDate: new Date(),
    };

    setGeneratedBill(newBill);
  };
  
  const handlePrint = () => {
    const printContents = document.getElementById('bill-to-print')?.innerHTML;
    if (printContents) {
        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow?.document.write('<html><head><title>Print Bill</title>');
        // You might need to link your stylesheet here if it's external
        printWindow?.document.write('<link rel="stylesheet" href="/globals.css" type="text/css" />'); // Adjust path as needed
        printWindow?.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; } #bill-header-actions, #bill-footer-actions { display: none; } }</style>');
        printWindow?.document.write('</head><body style="background-color: white;">');
        printWindow?.document.write(printContents);
        printWindow?.document.write('</body></html>');
        printWindow?.document.close();
        
        setTimeout(() => {
            printWindow?.focus();
            printWindow?.print();
            printWindow?.close();
        }, 500);
    }
  }

  const handleSaveBill = () => {
    if (generatedBill) {
        setSavedBills(prev => [generatedBill, ...prev]);
        toast({
            title: "Bill Saved",
            description: `Bill ${generatedBill.id} has been saved.`
        });
        setGeneratedBill(null); // Clear the generated bill after saving
    }
  }
  
  const filteredSavedBills = savedBills.filter(bill => {
    const query = searchQuery.toLowerCase();
    return (
        bill.id.toLowerCase().includes(query) ||
        bill.item.name.toLowerCase().includes(query) ||
        bill.status.toLowerCase().includes(query) ||
        bill.change.toString().includes(query) ||
        new Date(bill.fromDate).toLocaleDateString().includes(query)
    );
  });

  const billForHasTrips = billFor === 'customer' || billFor === 'driver' || billFor === 'supplier';

  const calculateTripRevenue = (trip: Trip | null): number => {
    if (!trip) return 0;
    return trip.shipments.reduce((acc, s) => acc + getShipmentFare(s), 0);
  }

  const totalTripRevenue = calculateTripRevenue(tripDetails?.trip || null);
  const totalTripExpenses = tripDetails?.expenses.reduce((acc, exp) => acc + exp.amount, 0) || 0;
  const totalTripPayments = tripDetails?.trip.payments?.filter(p => p.status === 'approved').reduce((acc, p) => acc + p.amount, 0) || 0;
  const tripBalance = totalTripRevenue - totalTripExpenses - totalTripPayments;

  React.useEffect(() => {
    setGeneratedBill(null);
    setSelectedItemId(undefined);
    setRelevantTrips([]);
    setSelectedTripId(undefined);
    setTripDetails(null);
    setCustomerFinancials(null);
    setSelectedTripIds([]);
  }, [billFor]);
  
  const selectionOptions = {
    customer: customers.map(c => ({ value: c.id, label: c.name })),
    driver: drivers.map(d => ({ value: d.id, label: d.name })),
    supplier: suppliers.map(s => ({ value: s.id, label: s.name })),
  };

  const isAdmin = loggedInUser?.permissions.admin;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing &amp; Payments</CardTitle>
          <CardDescription>
            Generate bills and manage payments for trips, customers, suppliers, and drivers.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
                <div className="space-y-2">
                    <Label htmlFor="bill-for">Bill/Payment For</Label>
                    <Select onValueChange={(val) => setBillFor(val as 'trip' | 'customer' | 'supplier' | 'driver')}>
                        <SelectTrigger id="bill-for">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="trip">Trip Wise Bill</SelectItem>
                            <SelectItem value="customer">Customer Wise</SelectItem>
                            <SelectItem value="supplier">Supplier Wise</SelectItem>
                            <SelectItem value="driver">Driver Wise</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {billFor && (
                <>
                    <div className="space-y-2">
                        <Label>From</Label>
                        <DatePicker date={fromDate} setDate={setFromDate} disablePast={!isAdmin}/>
                    </div>
                    <div className="space-y-2">
                        <Label>To</Label>
                        <DatePicker date={toDate} setDate={setToDate} disablePast={!isAdmin}/>
                    </div>
                </>
                )}
                
                {billFor === 'trip' ? (
                    <div className="space-y-2">
                        <Label>Select Completed Trip(s)</Label>
                        <MultiSelectCombobox
                            options={dateFilteredTripOptions}
                            onSelectionChange={setSelectedTripIds}
                            placeholder="Select trips..."
                        />
                    </div>
                ) : billFor && (
                    <div className="space-y-2">
                        <Label htmlFor="item-select">Select Item</Label>
                        <Select onValueChange={setSelectedItemId} value={selectedItemId}>
                            <SelectTrigger id="item-select">
                                <SelectValue placeholder={`Select a ${billFor}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {(selectionOptions[billFor as Exclude<keyof typeof selectionOptions, 'trip'>] || []).map(item => (
                                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                
                {billForHasTrips && relevantTrips.length > 0 && (
                    <div className="space-y-2 lg:col-start-1">
                        <Label>Select Completed Trip</Label>
                        <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                           <SelectTrigger><SelectValue placeholder="Select a trip" /></SelectTrigger>
                           <SelectContent>
                                {relevantTrips.map(trip => (
                                    <SelectItem key={trip.id} value={trip.id}>{trip.id} ({trip.routeName})</SelectItem>
                                ))}
                           </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
             {customerFinancials && (
                <Card className="mt-4 bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Customer Financial Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Billed</p>
                            <p className="font-bold text-lg">{customerFinancials.totalBilled.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Paid</p>
                            <p className="font-bold text-lg text-green-600">{customerFinancials.totalPaid.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Balance</p>
                            <p className={`font-bold text-lg ${customerFinancials.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{customerFinancials.balance.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
             )}
        </CardContent>
        <CardFooter>
            <Button onClick={handleGenerateBill} className="ml-auto" disabled={!billFor || (!selectedItemId && selectedTripIds.length === 0)}>
                <Receipt className="mr-2" />
                Generate Bill
            </Button>
        </CardFooter>
      </Card>

      {tripDetails && (
        <div className='grid lg:grid-cols-2 gap-6'>
            <Card>
                <CardHeader>
                    <CardTitle>Trip Details: {tripDetails.trip.id}</CardTitle>
                    <CardDescription>Financial summary and expense log for the selected trip. Only approved entries are shown.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                     <div className="flex justify-between py-2 border-b text-sm">
                        <span className="font-medium text-muted-foreground">Total Revenue</span>
                        <span className="font-semibold">{totalTripRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b text-sm">
                        <span className="font-medium text-muted-foreground">Total Expenses</span>
                        <span className="font-semibold text-red-600">({totalTripExpenses.toLocaleString()})</span>
                    </div>
                     <div className="flex justify-between py-2 border-b text-sm">
                        <span className="font-medium text-muted-foreground">Paid Amount</span>
                        <span className="font-semibold text-green-600">{totalTripPayments.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-base mt-2">
                        <span>Balance</span>
                        <span className={tripBalance >= 0 ? 'text-green-700' : 'text-red-700'}>
                            PKR {tripBalance.toLocaleString()}
                        </span>
                    </div>

                    <Accordion type="multiple" className="w-full pt-4">
                        <AccordionItem value="expenses">
                            <AccordionTrigger>View Expenses</AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead className='text-right'>Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {tripDetails.expenses.map(exp => (
                                            <TableRow key={exp.id}><TableCell>{exp.category}</TableCell><TableCell>{exp.description}</TableCell><TableCell className='text-right'>{exp.amount.toLocaleString()}</TableCell></TableRow>
                                        ))}
                                         {tripDetails.expenses.length === 0 && <TableRow><TableCell colSpan={3} className='text-center'>No approved expenses recorded.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="payments">
                            <AccordionTrigger>View Payments</AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead><TableHead className='text-right'>Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {tripDetails.trip.payments?.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                                                <TableCell>{p.description}</TableCell>
                                                <TableCell><Badge variant={p.status === 'approved' ? 'secondary' : 'default'} className="capitalize">{p.status}</Badge></TableCell>
                                                <TableCell className='text-right'>{p.amount.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                        {(!tripDetails.trip.payments || tripDetails.trip.payments.length === 0) && <TableRow><TableCell colSpan={4} className='text-center'>No payments recorded.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Settle Payment</CardTitle>
                    <CardDescription>Record a new payment for this trip. It will require admin approval.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-amount">Amount</Label>
                            <Input id="payment-amount" type="number" placeholder="Enter amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-type">Payment Type</Label>
                             <Select value={paymentType} onValueChange={(v) => setPaymentType(v as 'settlement' | 'advance')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="settlement">Settlement</SelectItem>
                                    <SelectItem value="advance">Advance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="payment-date">Payment Date</Label>
                        <DatePicker date={paymentDate} setDate={setPaymentDate} disablePast={!isAdmin} />
                    </div>
                    {paymentType === 'settlement' && (
                        <div className="space-y-2">
                            <Label htmlFor="payment-desc">Description (Optional)</Label>
                            <Textarea id="payment-desc" placeholder="e.g., Cash payment from customer" value={paymentDescription} onChange={e => setPaymentDescription(e.target.value)} />
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleAddPayment} className='ml-auto'>
                        <DollarSign className='mr-2' /> Add Payment
                    </Button>
                </CardFooter>
            </Card>
        </div>
      )}
      
      {generatedBill && (
        <Card>
            <CardHeader>
                <div id="bill-header-actions" className="flex justify-between items-start">
                    <div>
                        <CardTitle>Generated Bill</CardTitle>
                        <CardDescription>Review the bill details below and choose an action. Only approved entries are included.</CardDescription>
                    </div>
                    <div className='flex gap-2'>
                        <Button variant="outline" onClick={handleSaveBill}>
                            <Save className="mr-2" /> Save Bill
                        </Button>
                        <Button variant="default" onClick={handlePrint}>
                            <Printer className="mr-2" /> Print Bill
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent id="bill-to-print" className="p-0">
                <div className="p-8 border m-6 rounded-lg bg-white text-black">
                    <header className="flex justify-between items-center pb-4 border-b mb-8">
                        <div className="flex items-center gap-2">
                            <Logo className="h-8 w-8 text-primary" />
                            <h1 className="text-2xl font-bold text-gray-800 font-headline">
                            Jugnoo Transport Network
                            </h1>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-bold uppercase text-gray-700">Invoice</h2>
                            <p className="text-sm text-gray-500">Bill ID: {generatedBill.id}</p>
                        </div>
                    </header>
                    
                    <section className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Bill To:</h3>
                            <p className="font-bold">{generatedBill.item.name}</p>
                            {generatedBill.item.contact && <p>{generatedBill.item.contact}</p>}
                            {generatedBill.item.address && <p>{generatedBill.item.address}</p>}
                            {generatedBill.item.email && <p>{generatedBill.item.email}</p>}
                        </div>
                         <div className="text-right">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Details:</h3>
                            <p><span className="font-semibold">Generation Date:</span> {generatedBill.generationDate.toLocaleString()}</p>
                            <p><span className="font-semibold">Generated By:</span> <span className="capitalize">{generatedBill.generatedBy}</span></p>
                            <p><span className="font-semibold">Bill Period:</span> {generatedBill.fromDate.toLocaleDateString()} - {generatedBill.toDate.toLocaleDateString()}</p>
                        </div>
                    </section>
                    
                    {generatedBill.items && generatedBill.items.length > 0 && (
                        <section className="mb-4">
                            <h4 className="font-semibold text-gray-600">Included Trips:</h4>
                            <ul className="list-disc list-inside text-sm text-gray-500">
                                {generatedBill.items.map((trip: Trip) => (
                                    <li key={trip.id}>{trip.id} ({trip.routeName}) - {new Date(trip.startDate).toLocaleDateString()}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="mb-8">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-100">
                                    <TableHead className="w-12">Sr. no</TableHead>
                                    <TableHead className="w-[60%]">Description</TableHead>
                                    <TableHead className="text-right">Amount (PKR)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {generatedBill.revenue.map((item, i) => (
                                    <TableRow key={`rev-${i}`}>
                                        <TableCell>{i + 1}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-right">{item.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                                {generatedBill.expenses.map((item, i) => (
                                    <TableRow key={`exp-${i}`} className="text-red-600">
                                        <TableCell>{generatedBill.revenue.length + i + 1}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-right">({item.amount.toLocaleString()})</TableCell>
                                    </TableRow>
                                ))}
                                {generatedBill.revenue.length === 0 && generatedBill.expenses.length === 0 && (
                                     <TableRow>
                                         <TableCell colSpan={3} className="text-center h-24">No items to display</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </section>

                     <section className="flex justify-end mb-8">
                         <div className="w-full md:w-1/2 lg:w-2/5 space-y-2">
                            <div className="flex justify-between py-2 border-b">
                                <span className="font-semibold text-gray-600">Total Amount:</span>
                                <span className="font-semibold">{generatedBill.totalAmount.toLocaleString()}</span>
                            </div>
                             <div className="flex justify-between py-2 border-b text-green-600">
                                <span className="font-semibold">Credit Amount:</span>
                                <span className="font-semibold">{generatedBill.creditAmount.toLocaleString()}</span>
                            </div>
                             <div className="flex justify-between py-2 border-b text-red-600">
                                <span className="font-semibold">Debit Amount:</span>
                                <span className="font-semibold">({generatedBill.debitAmount.toLocaleString()})</span>
                            </div>
                            <div className="flex justify-between py-2 text-lg bg-gray-100 px-2 rounded">
                                <span className="font-bold text-gray-800">Change:</span>
                                <span className="font-bold">PKR {generatedBill.change.toLocaleString()}</span>
                            </div>
                        </div>
                    </section>

                     <footer className="text-center pt-4 border-t">
                         <p className="text-sm text-gray-500">Thanks for your trust</p>
                    </footer>
                </div>
            </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
            <CardTitle>Saved Bills</CardTitle>
            <CardDescription>Search and review previously saved bills.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search bills by ID, name, status, etc."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
             <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Bill ID</TableHead>
                            <TableHead>Bill To</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Balance Due (PKR)</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSavedBills.length > 0 ? (
                            filteredSavedBills.map(bill => (
                                <TableRow key={bill.id}>
                                    <TableCell className="font-medium">{bill.id}</TableCell>
                                    <TableCell>{bill.item.name}</TableCell>
                                    <TableCell>{new Date(bill.fromDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={bill.status === 'Paid' ? 'secondary' : bill.status === 'Partial' ? 'default' : 'destructive'}>
                                            {bill.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{bill.change.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => setGeneratedBill(bill)}>View</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No saved bills match your search.
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

    
