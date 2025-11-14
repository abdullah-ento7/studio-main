
'use client';

import { useRef, useState, useEffect } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, HelpCircle, PlusCircle, Trash2, Send, Lock } from 'lucide-react';
import {
  type Trip,
  type Vehicle,
  type Expense,
  type Supplier,
  expenseCategories,
  User,
  type MaintenanceDetail,
  type TyreDetail,
  type InstrumentDetail,
  City,
} from '@/lib/types';
import { DatePicker } from '../ui/date-picker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { MultiSelectCombobox } from '../ui/multi-select-combobox';

type VehicleExpenseItem = {
  id: number;
  category: typeof expenseCategories[number] | '';
  amount: string;
  description: string;
  supplierId: string;
  maintenanceDetail?: MaintenanceDetail;
  challanCityId?: string;
};

interface TripExpenseState {
  tripId: string;
  driverFood: string;
  driverMedical: string;
  vehicleExpenses: VehicleExpenseItem[];
}


export default function ExpensesTab() {
  const { trips, vehicles, suppliers, setExpenses, expenses, cities } = useData();
  const { loggedInUser } = useAuth();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tripExpenses, setTripExpenses] = useState<TripExpenseState[]>([]);
  const [isDayClosed, setIsDayClosed] = useState(false);
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  
  const activeTrips = trips.filter(t => t.status === 'active');
  const activeTripOptions = activeTrips.map(t => ({ value: t.id, label: `${t.id} (${t.vehicleReg})`}));

  const isAdmin = loggedInUser?.permissions.admin;

  // Effect to load and setup expenses for the selected date and trips
  useEffect(() => {
    if (!selectedDate) {
      setTripExpenses([]);
      setIsDayClosed(false);
      return;
    }

    const dateStr = selectedDate.toLocaleDateString('en-CA');
    const expensesForDay = expenses.filter(e => new Date(e.date).toLocaleDateString('en-CA') === dateStr);
    
    const dayIsLocked = expensesForDay.length > 0 && expensesForDay.every(e => e.status !== 'draft');
    setIsDayClosed(dayIsLocked);

    const tripsToDisplay = trips.filter(t => selectedTripIds.includes(t.id));
    
    const initialTripExpenses: TripExpenseState[] = tripsToDisplay.map(trip => {
        const tripExps = expensesForDay.filter(e => e.tripId === trip.id);
        
        const foodExp = tripExps.find(e => e.category === 'food' && e.expenseFor === 'driver');
        const medExp = tripExps.find(e => e.category === 'maintenance' && e.expenseFor === 'driver');
        
        const vehExps = tripExps.filter(e => e.expenseFor === 'vehicle');

        return {
            tripId: trip.id,
            driverFood: foodExp?.amount.toString() || '',
            driverMedical: medExp?.amount.toString() || '',
            vehicleExpenses: vehExps.length > 0 ? vehExps.map((e,i) => ({
                id: e.id ? Date.now() + i : Date.now() + i, // use existing id if available
                category: e.category,
                amount: e.amount.toString(),
                description: e.description,
                supplierId: e.supplierId || '',
                maintenanceDetail: e.maintenanceDetail,
                challanCityId: e.challanCityId,
            })) : [{ id: Date.now(), category: '', amount: '', description: '', supplierId: '' }]
        }
    });

    setTripExpenses(initialTripExpenses);

  }, [selectedDate, selectedTripIds, trips, expenses]);

  const handleTripExpenseChange = (tripId: string, field: keyof Omit<TripExpenseState, 'tripId' | 'vehicleExpenses'>, value: string) => {
    setTripExpenses(prev => prev.map(te => te.tripId === tripId ? { ...te, [field]: value } : te));
  }

  const handleAddVehicleExpense = (tripId: string) => {
    setTripExpenses(prev => prev.map(te => te.tripId === tripId ? { ...te, vehicleExpenses: [...te.vehicleExpenses, { id: Date.now(), category: '', amount: '', description: '', supplierId: '' }] } : te));
  }

  const handleRemoveVehicleExpense = (tripId: string, id: number) => {
    setTripExpenses(prev => prev.map(te => te.tripId === tripId ? { ...te, vehicleExpenses: te.vehicleExpenses.filter(exp => exp.id !== id) } : te));
  }

  const handleVehicleExpenseChange = (tripId: string, id: number, field: keyof Omit<VehicleExpenseItem, 'id' | 'maintenanceDetail'>, value: string) => {
    setTripExpenses(prev => prev.map(te => {
      if (te.tripId === tripId) {
        return {
          ...te,
          vehicleExpenses: te.vehicleExpenses.map(exp => {
            if (exp.id === id) {
              const updatedExp = { ...exp, [field]: value };
              if (field === 'category' && value !== 'maintenance') {
                delete updatedExp.maintenanceDetail;
              }
              if (field === 'category' && value === 'maintenance') {
                updatedExp.maintenanceDetail = { type: 'other', instruments: [{ id: `I${Date.now()}`, name: '', price: 0 }], laborCost: 0 };
              }
               if (field === 'category' && value !== 'challan') {
                delete updatedExp.challanCityId;
              }
              return updatedExp;
            }
            return exp;
          })
        }
      }
      return te;
    }));
  }

  const handleMaintenanceDetailChange = (tripId: string, expenseId: number, field: keyof MaintenanceDetail, value: any) => {
     setTripExpenses(prev => prev.map(te => te.tripId === tripId ? {
         ...te,
         vehicleExpenses: te.vehicleExpenses.map(exp => exp.id === expenseId ? {
             ...exp,
             maintenanceDetail: { ...exp.maintenanceDetail!, [field]: value }
         } : exp)
     } : te));
  }
  
  const handleInstrumentChange = (tripId: string, expenseId: number, instrumentId: string, field: keyof InstrumentDetail, value: string | number) => {
    setTripExpenses(prev => prev.map(te => te.tripId === tripId ? {
        ...te,
        vehicleExpenses: te.vehicleExpenses.map(exp => exp.id === expenseId ? {
            ...exp,
            maintenanceDetail: {
                ...exp.maintenanceDetail!,
                instruments: exp.maintenanceDetail!.instruments?.map(inst => 
                    inst.id === instrumentId ? { ...inst, [field]: value } : inst
                )
            }
        } : exp)
    } : te));
  }

  const handleAddInstrument = (tripId: string, expenseId: number) => {
    setTripExpenses(prev => prev.map(te => te.tripId === tripId ? {
        ...te,
        vehicleExpenses: te.vehicleExpenses.map(exp => exp.id === expenseId ? {
            ...exp,
            maintenanceDetail: {
                ...exp.maintenanceDetail!,
                instruments: [...(exp.maintenanceDetail!.instruments || []), { id: `I${Date.now()}`, name: '', price: 0 }]
            }
        } : exp)
    } : te));
  }

  const handleRemoveInstrument = (tripId: string, expenseId: number, instrumentId: string) => {
      setTripExpenses(prev => prev.map(te => te.tripId === tripId ? {
          ...te,
          vehicleExpenses: te.vehicleExpenses.map(exp => exp.id === expenseId ? {
              ...exp,
              maintenanceDetail: {
                  ...exp.maintenanceDetail!,
                  instruments: exp.maintenanceDetail!.instruments?.filter(inst => inst.id !== instrumentId)
              }
          } : exp)
      } : te));
  }
  

  const generateExpenses = (status: 'draft' | 'pending'): Expense[] => {
    if (!selectedDate || !loggedInUser) return [];

    const date = selectedDate.toISOString();
    let allNewExpenses: Expense[] = [];

    tripExpenses.forEach(te => {
      const trip = trips.find(t => t.id === te.tripId);
      if (!trip) return;

      const commonData = {
          tripId: te.tripId,
          date,
          createdBy: loggedInUser.username,
          status,
      }

      if (parseFloat(te.driverFood) > 0) {
        allNewExpenses.push({ ...commonData, id: `EXP${Date.now()}-food`, category: 'food', amount: parseFloat(te.driverFood), description: 'Driver food allowance', expenseFor: 'driver', expenseForId: trip.driverId });
      }
      if (parseFloat(te.driverMedical) > 0) {
        allNewExpenses.push({ ...commonData, id: `EXP${Date.now()}-med`, category: 'maintenance', amount: parseFloat(te.driverMedical), description: 'Driver medical expense', expenseFor: 'driver', expenseForId: trip.driverId });
      }

      te.vehicleExpenses.forEach((ve, i) => {
        let totalAmount = parseFloat(ve.amount);
        if(ve.category === 'maintenance' && ve.maintenanceDetail?.type === 'other') {
            const instrumentsTotal = ve.maintenanceDetail.instruments?.reduce((sum, item) => sum + Number(item.price), 0) || 0;
            const labor = Number(ve.maintenanceDetail.laborCost) || 0;
            totalAmount = instrumentsTotal + labor;
        }

        if (ve.category && totalAmount > 0) {
          allNewExpenses.push({ ...commonData, id: `EXP${Date.now()}-veh-${i}`, category: ve.category, amount: totalAmount, description: ve.description, supplierId: ve.supplierId || undefined, expenseFor: 'vehicle', expenseForId: trip.vehicleId, maintenanceDetail: ve.maintenanceDetail, challanCityId: ve.challanCityId });
        }
      });
    });

    return allNewExpenses;
  }
  
  const handleSaveOrSubmit = (status: 'draft' | 'pending') => {
    if (!selectedDate) {
        toast({ title: "No Date Selected", description: "Please select a date to log expenses for.", variant: "destructive" });
        return;
    }
    const newExpenses = generateExpenses(status);
    
    if (newExpenses.length === 0) {
        toast({ title: "No expenses entered", description: "Please fill in at least one expense field.", variant: "destructive" });
        return;
    }

    const dateStr = selectedDate.toLocaleDateString('en-CA');
    
    setExpenses(prev => {
        const otherExpenses = prev.filter(e => new Date(e.date).toLocaleDateString('en-CA') !== dateStr);
        const expensesForDay = prev.filter(e => new Date(e.date).toLocaleDateString('en-CA') === dateStr);
        const otherTripExpensesForDay = expensesForDay.filter(e => !selectedTripIds.includes(e.tripId));
        return [...otherExpenses, ...otherTripExpensesForDay, ...newExpenses];
    });

    toast({
      title: status === 'draft' ? 'Expenses Saved!' : 'Expenses Submitted!',
      description: status === 'draft' ? 'Your entries for this date have been saved as a draft.' : 'Your expenses have been submitted for approval.',
      className: 'bg-accent text-accent-foreground',
    });
    
    if (status === 'pending') {
        setIsDayClosed(true);
    }
  }
  
  const totalTodaysExpenses = tripExpenses.reduce((total, te) => {
      const driverTotal = parseFloat(te.driverFood || '0') + parseFloat(te.driverMedical || '0');
      const vehicleTotal = te.vehicleExpenses.reduce((vTotal, ve) => {
        let expenseAmount = parseFloat(ve.amount || '0');
        if (ve.category === 'maintenance' && ve.maintenanceDetail?.type === 'other') {
            const instrumentsTotal = ve.maintenanceDetail.instruments?.reduce((sum, item) => sum + Number(item.price), 0) || 0;
            const labor = Number(ve.maintenanceDetail.laborCost) || 0;
            expenseAmount = instrumentsTotal + labor;
        }
        return vTotal + expenseAmount;
      }, 0);
      return total + driverTotal + vehicleTotal;
  }, 0);


  const getTripFromId = (tripId: string) => trips.find(t => t.id === tripId);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Daily Expense Ledger</CardTitle>
            <CardDescription>
                Select a date and one or more active trips to log expenses. Save as a draft or submit for approval.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex-1 space-y-2">
                    <Label htmlFor="expense-date">Select Expense Date</Label>
                    <DatePicker date={selectedDate} setDate={setSelectedDate} disablePast={!isAdmin && isDayClosed} />
                </div>
                 <div className="flex-1 space-y-2">
                    <Label htmlFor="trip-select">Select Active Trip(s)</Label>
                    <MultiSelectCombobox 
                        options={activeTripOptions}
                        onSelectionChange={setSelectedTripIds}
                        placeholder="Select trips..."
                    />
                </div>
                <div className="flex-1 text-center sm:text-right">
                    <p className="text-sm text-muted-foreground">Total Expenses for {selectedDate?.toLocaleDateString()}</p>
                    <p className="text-3xl font-bold">PKR {totalTodaysExpenses.toLocaleString()}</p>
                </div>
            </div>

            {isDayClosed && (
                <div className="text-center p-6 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                    <Lock className="mx-auto h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    <h3 className="mt-2 text-lg font-semibold">Day Closed</h3>
                    <p className="text-sm text-muted-foreground">
                        {isAdmin ? "This day's expenses have been submitted. You can still make changes as an admin." : "This day's entries have been submitted and are locked. Contact an admin to make changes."}
                    </p>
                </div>
            )}
            
            {selectedDate && tripExpenses.length > 0 && (
                <Accordion type="multiple" defaultValue={tripExpenses.map(t=>t.tripId)} className="w-full">
                    {tripExpenses.map((te) => {
                        const trip = getTripFromId(te.tripId);
                        if (!trip) return null;
                        return (
                            <AccordionItem value={trip.id} key={trip.id}>
                                <AccordionTrigger className='text-lg font-semibold'>
                                    Trip: {trip.id} ({trip.vehicleReg})
                                </AccordionTrigger>
                                <AccordionContent className="p-2 space-y-4">
                                    {/* Trip Overview */}
                                    <div className="text-sm p-4 border rounded-md bg-background">
                                        <p><strong>Driver:</strong> {trip.driverName}</p>
                                        <p><strong>Route:</strong> {trip.routeName}</p>
                                        <p><strong>Customers:</strong> {trip.customerNames.join(', ')}</p>
                                        <div><strong>Shipments:</strong>
                                            <ul className="list-disc list-inside mt-1">
                                                {trip.shipments.map(s => <li key={s.id}>{s.productName} ({s.quantity} {s.unit || ''})</li>)}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Expense Form */}
                                    <fieldset className="rounded-lg border p-4 space-y-6" disabled={isDayClosed && !isAdmin}>
                                        {/* Driver Expenses */}
                                        <div>
                                          <legend className="text-md font-medium mb-4">Driver Expenses</legend>
                                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <div className="space-y-2">
                                              <Label>Food</Label>
                                              <Input type="number" placeholder="e.g., 500" value={te.driverFood} onChange={e => handleTripExpenseChange(trip.id, 'driverFood', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Medical</Label>
                                              <Input type="number" placeholder="e.g., 200" value={te.driverMedical} onChange={e => handleTripExpenseChange(trip.id, 'driverMedical', e.target.value)} />
                                            </div>
                                          </div>
                                        </div>

                                        {/* Vehicle Expenses */}
                                        <div className="border-t pt-6">
                                          <legend className="text-md font-medium mb-4">Vehicle Expenses</legend>
                                          <div className="space-y-4">
                                            {te.vehicleExpenses.map((exp, index) => {
                                                const maintenanceAmount = exp.category === 'maintenance' && exp.maintenanceDetail?.type === 'other'
                                                    ? (exp.maintenanceDetail.instruments?.reduce((s, i) => s + Number(i.price), 0) || 0) + Number(exp.maintenanceDetail.laborCost || 0)
                                                    : exp.amount;

                                                return (
                                              <div key={exp.id} className="grid grid-cols-1 gap-4 items-start border-b pb-4 last:border-0">
                                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                                                    <div className="space-y-2 sm:col-span-3">
                                                    {index === 0 && <Label>Category</Label>}
                                                    <Select value={exp.category} onValueChange={(value) => handleVehicleExpenseChange(trip.id, exp.id, 'category', value)}>
                                                        <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                                        <SelectContent>
                                                        {expenseCategories.map(cat => <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    </div>

                                                    <div className="space-y-2 sm:col-span-2">
                                                    {index === 0 && <Label>Amount</Label>}
                                                    <Input type="number" placeholder="e.g. 5000" value={maintenanceAmount} onChange={(e) => handleVehicleExpenseChange(trip.id, exp.id, 'amount', e.target.value)} disabled={exp.category === 'maintenance' && exp.maintenanceDetail?.type === 'other'}/>
                                                    </div>
                                                    
                                                    {exp.category !== 'fuel' && exp.category !== 'toll tax' && exp.category !== 'parking rent' && exp.category !== 'challan' && exp.category !== 'loading/unloading charges' && (
                                                    <div className="space-y-2 sm:col-span-3">
                                                        {index === 0 && <Label>Supplier</Label>}
                                                        <Select value={exp.supplierId} onValueChange={(value) => handleVehicleExpenseChange(trip.id, exp.id, 'supplierId', value)}>
                                                        <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                                                        <SelectContent>
                                                            {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                                        </SelectContent>
                                                        </Select>
                                                    </div>
                                                    )}

                                                     {exp.category === 'challan' && (
                                                      <div className="space-y-2 sm:col-span-2">
                                                        {index === 0 && <Label>City</Label>}
                                                        <Select value={exp.challanCityId} onValueChange={(value) => handleVehicleExpenseChange(trip.id, exp.id, 'challanCityId', value)}>
                                                          <SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger>
                                                          <SelectContent>
                                                            {cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                          </SelectContent>
                                                        </Select>
                                                      </div>
                                                    )}

                                                    <div className="space-y-2 sm:col-span-3">
                                                        {index === 0 && <Label>Description</Label>}
                                                        <Input placeholder="Add a description" value={exp.description} onChange={(e) => handleVehicleExpenseChange(trip.id, exp.id, 'description', e.target.value)} />
                                                    </div>

                                                    <div className="sm:col-span-1">
                                                    {te.vehicleExpenses.length > 1 && (
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveVehicleExpense(trip.id, exp.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    )}
                                                    </div>
                                                </div>
                                                {/* Maintenance Details */}
                                                {exp.category === 'maintenance' && (
                                                    <div className="p-4 mt-2 border bg-muted/50 rounded-md">
                                                         <div className="space-y-2 mb-4">
                                                             <Label>Maintenance Type</Label>
                                                             <Select value={exp.maintenanceDetail?.type || 'other'} onValueChange={v => handleMaintenanceDetailChange(trip.id, exp.id, 'type', v)}>
                                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="tyre">Tyre Replacement</SelectItem>
                                                                    <SelectItem value="other">Other Maintenance</SelectItem>
                                                                </SelectContent>
                                                             </Select>
                                                         </div>
                                                         {exp.maintenanceDetail?.type === 'tyre' && (
                                                            <div className="grid sm:grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label>New Tyre No</Label>
                                                                    <Input value={exp.maintenanceDetail.tyre?.newTyreNo || ''} onChange={e => handleMaintenanceDetailChange(trip.id, exp.id, 'tyre', {...exp.maintenanceDetail?.tyre, newTyreNo: e.target.value})} />
                                                                </div>
                                                                 <div className="space-y-2">
                                                                    <Label>Old Tyre No</Label>
                                                                    <Input value={exp.maintenanceDetail.tyre?.oldTyreNo || ''} onChange={e => handleMaintenanceDetailChange(trip.id, exp.id, 'tyre', {...exp.maintenanceDetail?.tyre, oldTyreNo: e.target.value})} />
                                                                </div>
                                                            </div>
                                                         )}
                                                          {exp.maintenanceDetail?.type === 'other' && (
                                                            <div className="space-y-4">
                                                                {exp.maintenanceDetail.instruments?.map((inst) => (
                                                                    <div key={inst.id} className="flex gap-2 items-end">
                                                                        <div className="flex-grow space-y-2">
                                                                            <Label>Instrument</Label>
                                                                            <Input placeholder="e.g. Filter" value={inst.name} onChange={e => handleInstrumentChange(trip.id, exp.id, inst.id, 'name', e.target.value)} />
                                                                        </div>
                                                                        <div className="flex-grow space-y-2">
                                                                            <Label>Price</Label>
                                                                            <Input type="number" placeholder="e.g. 1500" value={inst.price} onChange={e => handleInstrumentChange(trip.id, exp.id, inst.id, 'price', Number(e.target.value))} />
                                                                        </div>
                                                                        {(exp.maintenanceDetail?.instruments?.length || 0) > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInstrument(trip.id, exp.id, inst.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
                                                                    </div>
                                                                ))}
                                                                <Button type="button" variant="outline" size="sm" onClick={() => handleAddInstrument(trip.id, exp.id)}><PlusCircle className="mr-2"/>Add Instrument</Button>
                                                                <div className="space-y-2">
                                                                    <Label>Labor Cost</Label>
                                                                    <Input type="number" placeholder="e.g. 1000" value={exp.maintenanceDetail.laborCost} onChange={e => handleMaintenanceDetailChange(trip.id, exp.id, 'laborCost', Number(e.target.value))}/>
                                                                </div>
                                                            </div>
                                                         )}
                                                    </div>
                                                )}
                                              </div>
                                            )})}
                                            <Button type="button" variant="outline" size="sm" onClick={() => handleAddVehicleExpense(trip.id)} className="mt-2">
                                                <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle Expense
                                            </Button>
                                          </div>
                                        </div>
                                    </fieldset>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            )}
            
             {selectedDate && tripExpenses.length === 0 && selectedTripIds.length > 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No expenses logged for the selected trips on this date. Add new expenses using the forms above.</p>
                </div>
            )}
             {selectedTripIds.length === 0 && (
                 <div className="text-center py-12 text-muted-foreground">
                    <p>Please select one or more trips to log expenses.</p>
                </div>
             )}
        </CardContent>
        {selectedDate && tripExpenses.length > 0 && !isDayClosed &&(
            <CardFooter className="justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleSaveOrSubmit('draft')}>
                    <Save className="mr-2" />
                    Save as Draft
                </Button>
                <Button type="button" onClick={() => handleSaveOrSubmit('pending')}>
                    <Send className="mr-2" />
                    Submit for Approval
                </Button>
            </CardFooter>
        )}
         {selectedDate && isAdmin && isDayClosed && (
            <CardFooter className="justify-end gap-2">
                <Button type="button" variant="destructive" onClick={() => handleSaveOrSubmit('pending')}>
                    <Lock className="mr-2" />
                    Force Resubmit (Admin)
                </Button>
            </CardFooter>
        )}
    </Card>
  );
}
