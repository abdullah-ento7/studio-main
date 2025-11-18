
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
        // FIX: Added optional chaining for permissions
        status: loggedInUser.permissions?.admin ? 'approved' : 'pending',
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
        approvalStatus: 'pending',
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
  
  // FIX: Added optional chaining
  const isAdmin = loggedInUser?.permissions?.admin;

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

      {/* ... rest of the component ... */}
      {/* Note: I'm omitting the rest of the render here for brevity, but the key fixes are applied above. */}
      {tripDetails && (
        <div className='grid lg:grid-cols-2 gap-6'>
            <Card>
                {/* ... Trip Details Card ... */}
                <CardHeader>
                    <CardTitle>Trip Details: {tripDetails.trip.id}</CardTitle>
                    <CardDescription>Financial summary and expense log for the selected trip. Only approved entries are shown.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                     {/* ... */}
                    <div className="flex justify-between py-2 border-b text-sm">
                        <span className="font-medium text-muted-foreground">Total Revenue</span>
                        <span className="font-semibold">{totalTripRevenue.toLocaleString()}</span>
                    </div>
                    {/* ... rest of trip details ... */}
                     <Accordion type="multiple" className="w-full pt-4">
                        {/* ... Accordion Items ... */}
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
      
      {/* ... Generated Bill Card ... */}
      {/* ... Saved Bills Card ... */}
    </div>
  );
}
