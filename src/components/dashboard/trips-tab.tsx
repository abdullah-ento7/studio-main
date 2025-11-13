
'use client';

import { useState, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Play, Ban, Save, ArrowRight, CheckCircle, Pencil, Archive, PlusCircle, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Trip, Customer, Driver, Vehicle, City, Shipment, Expense, OilDetail } from '@/lib/types';
import { shipmentUnits } from '@/lib/types';
import EditTripDialog from './edit-trip-dialog';
import CompleteTripDialog from './complete-trip-dialog';
import { useData } from '@/context/data-context';
import { Input } from '../ui/input';
import { useAuth } from '@/context/auth-context';

type TempShipment = Partial<Omit<Shipment, 'id'>> & { tempId: string; };
type CustomerShipments = {
    customerId: string;
    shipments: TempShipment[];
};

export default function TripsTabContent() {
  const { trips, setTrips, vehicles, drivers, cities, customers, expenses } = useData();
  const { loggedInUser } = useAuth();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>();
  const [selectedDriverId, setSelectedDriverId] = useState<string>();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completingTrip, setCompletingTrip] = useState<Trip | null>(null);

  const [customerShipments, setCustomerShipments] = useState<CustomerShipments[]>([]);
  
  const formRef = useRef<HTMLFormElement>(null);
  
  const [orderNumber, setOrderNumber] = useState('');
  const [sapNumber, setSapNumber] = useState('');
  const [tokenNumber, setTokenNumber] = useState('');


  const isAdmin = loggedInUser?.permissions.admin;

  const activeTrips = trips.filter(t => t.status === 'active');
  const savedTrips = trips.filter(t => t.status === 'saved');
  const pendingTrips = trips.filter(t => t.status === 'pending');
  const completedTrips = trips.filter(t => t.status === 'completed');


  const activeVehicleIds = activeTrips.map(t => t.vehicleId);
  const activeDriverIds = activeTrips.map(t => t.driverId);

  const availableVehicles = vehicles.filter(v => v.status === 'active' && !activeVehicleIds.includes(v.id));
  const availableDrivers = drivers.filter(d => d.status === 'active' && !activeDriverIds.includes(d.id));

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const isOilTanker = selectedVehicle?.type === 'Oil Tanker';


  const handleAddCustomer = () => {
    setCustomerShipments(prev => [...prev, { customerId: '', shipments: [{ tempId: `S_${Date.now()}` }] }]);
  };
  
  const handleRemoveCustomer = (index: number) => {
    setCustomerShipments(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleCustomerChange = (index: number, customerId: string) => {
      setCustomerShipments(prev => prev.map((cs, i) => i === index ? { ...cs, customerId } : cs));
  };
  
  const handleAddShipment = (customerIndex: number) => {
    setCustomerShipments(prev => prev.map((cs, i) => {
      if (i === customerIndex) {
        return { ...cs, shipments: [...cs.shipments, { tempId: `S_${Date.now()}` }] };
      }
      return cs;
    }));
  };
  
  const handleRemoveShipment = (customerIndex: number, shipmentTempId: string) => {
      setCustomerShipments(prev => prev.map((cs, i) => {
          if (i === customerIndex) {
              return { ...cs, shipments: cs.shipments.filter(s => s.tempId !== shipmentTempId) };
          }
          return cs;
      }));
  };

  const handleShipmentChange = (customerIndex: number, shipmentTempId: string, field: keyof TempShipment, value: any) => {
    setCustomerShipments(prev => prev.map((cs, i) => {
        if (i === customerIndex) {
            const updatedShipments = cs.shipments.map(s => {
                if (s.tempId === shipmentTempId) {
                    const updatedShipment = { ...s, [field]: value };
                    // Auto-calculate fare
                    if (field === 'quantity' || field === 'ratePerUnit') {
                        const quantity = field === 'quantity' ? parseFloat(value) : (updatedShipment.quantity || 0);
                        const ratePerUnit = field === 'ratePerUnit' ? parseFloat(value) : (updatedShipment.ratePerUnit || 0);
                        if (!isNaN(quantity) && !isNaN(ratePerUnit)) {
                            updatedShipment.fare = quantity * ratePerUnit;
                        }
                    }
                    return updatedShipment;
                }
                return s;
            });
            return { ...cs, shipments: updatedShipments };
        }
        return cs;
    }));
};
  
  const calculateTotalCustomerFare = (shipments: TempShipment[]): number => {
    return shipments.reduce((total, s) => total + (s.fare || 0), 0);
  };

  const handleSaveTrip = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    const driver = drivers.find(d => d.id === selectedDriverId);

    if (!vehicle || !driver || !startDate) {
        toast({
            title: 'Error',
            description: 'Please select a vehicle, a driver and a start date.',
            variant: 'destructive',
        });
        return;
    }
    
    if (customerShipments.length === 0 || customerShipments.some(cs => !cs.customerId || cs.shipments.length === 0)) {
        toast({ title: 'Error', description: 'Please add at least one customer with at least one shipment.', variant: 'destructive' });
        return;
    }
    
    const allFinalShipments: Shipment[] = [];
    let allRoutes: string[] = [];

    for (const cs of customerShipments) {
        if (cs.shipments.some(s => !s.fromCityId || !s.toCityId || !s.productName || !s.quantity || !s.ratePerUnit)) {
             toast({ title: 'Error', description: `Please fill all shipment details for customer ${customers.find(c => c.id === cs.customerId)?.name}.`, variant: 'destructive' });
             return;
        }

        cs.shipments.forEach((s, index) => {
            const fromCity = cities.find(c => c.id === s.fromCityId);
            const toCity = cities.find(c => c.id === s.toCityId);
            allRoutes.push(s.fromCityId!, s.toCityId!);
            allFinalShipments.push({
                id: `S${Date.now()}-${index}`,
                customerId: cs.customerId,
                fromCityId: s.fromCityId!,
                toCityId: s.toCityId!,
                description: s.description || `Shipment of ${s.productName}`,
                productName: s.productName!,
                quantity: s.quantity!,
                ratePerUnit: s.ratePerUnit!,
                fare: s.fare || 0,
            });
        });
    }

    const uniqueRoute = [...new Set(allRoutes)];
    
    const newTrip: Trip = {
        id: `T${Date.now()}`,
        vehicleId: vehicle.id,
        driverId: driver.id,
        vehicleReg: vehicle.registrationNumber,
        driverName: driver.name,
        routeName: uniqueRoute.map(id => cities.find(c=>c.id === id)?.name).join(' -> ') || 'N/A',
        route: uniqueRoute,
        customerNames: [...new Set(customerShipments.map(cs => customers.find(c => c.id === cs.customerId)?.name || ''))],
        shipments: allFinalShipments,
        startDate: startDate.toLocaleDateString('en-CA'),
        status: 'saved',
        orderNumber: isOilTanker ? orderNumber : undefined,
        sapNumber: isOilTanker ? sapNumber : undefined,
        tokenNumber: isOilTanker ? tokenNumber : undefined,
    };

    setTrips(prev => [newTrip, ...prev]);

    toast({
      title: 'Success',
      description: 'New trip has been saved. You can add more details via the Edit action.',
      className: 'bg-accent text-accent-foreground',
    });

    formRef.current?.reset();
    setStartDate(undefined);
    setSelectedVehicleId(undefined);
    setSelectedDriverId(undefined);
    setCustomerShipments([]);
    setOrderNumber('');
    setSapNumber('');
    setTokenNumber('');
  };

  const handleTripAction = (tripId: string, newStatus: 'pending' | 'active' | 'cancelled') => {
    const tripToUpdate = trips.find(t => t.id === tripId);
    if (!tripToUpdate) return;
  
    if (newStatus === 'active') {
      const vehicleIsActive = activeTrips.some(t => t.vehicleId === tripToUpdate.vehicleId);
      const driverIsActive = activeTrips.some(t => t.driverId === tripToUpdate.driverId);
  
      if (vehicleIsActive || driverIsActive) {
        toast({
          title: 'Resource Conflict',
          description: `${vehicleIsActive ? 'Vehicle' : ''}${vehicleIsActive && driverIsActive ? ' and ' : ''}${driverIsActive ? 'Driver' : ''} is already on an active trip.`,
          variant: 'destructive',
        });
        return;
      }
    }
    
    let description = '';
    switch (newStatus) {
      case 'pending': description = `Trip ${tripId} is now pending.`; break;
      case 'active': description = `Trip ${tripId} has been started.`; break;
      case 'cancelled': description = `Trip ${tripId} has been cancelled.`; break;
    }

    toast({
      title: 'Trip Updated',
      description: description,
      variant: newStatus === 'cancelled' ? 'destructive' : 'default',
    });
  
    setTrips(currentTrips => {
      return currentTrips.map(t => (t.id === tripId ? { ...t, status: newStatus } : t));
    });
  };

  const handleOpenCompleteDialog = (trip: Trip) => {
    const tripExpenses = expenses.filter(e => e.tripId === trip.id);
    if (tripExpenses.length === 0) {
        toast({
            title: 'Cannot Complete Trip',
            description: 'You must add at least one expense for this trip before completing it.',
            variant: 'destructive',
        });
        return;
    }
    setCompletingTrip(trip);
    setIsCompleteDialogOpen(true);
  };

  const handleCompleteTrip = (tripId: string, endDate: Date, endCityId: string) => {
    setTrips(currentTrips =>
      currentTrips.map(t =>
        t.id === tripId
          ? { ...t, status: 'completed', endDate: endDate.toLocaleDateString('en-CA'), endCityId: endCityId }
          : t
      )
    );
    toast({
      title: 'Trip Completed',
      description: `Trip ${tripId} has been marked as completed.`,
    });
    setIsCompleteDialogOpen(false);
    setCompletingTrip(null);
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedTrip = (updatedTrip: Trip) => {
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    toast({
      title: 'Trip Updated',
      description: `Trip ${updatedTrip.id} has been successfully updated.`,
      className: 'bg-accent text-accent-foreground',
    });
    setIsEditDialogOpen(false);
    setEditingTrip(null);
  };

  const savedTripActions = [
    { label: 'Add Details', icon: Pencil, handler: handleEditTrip },
    { label: 'Move to Pending', icon: ArrowRight, handler: (id: string) => handleTripAction(id, 'pending')},
    { label: 'Cancel Trip', icon: Ban, handler: (id: string) => handleTripAction(id, 'cancelled'), isDestructive: true },
  ]
  const pendingTripActions = [
    { label: 'Start Trip', icon: Play, handler: (id: string) => handleTripAction(id, 'active')},
    { label: 'Edit Trip', icon: Pencil, handler: handleEditTrip },
    { label: 'Cancel Trip', icon: Ban, handler: (id: string) => handleTripAction(id, 'cancelled'), isDestructive: true },
  ]
  const activeTripActions = [
    { label: 'Complete Trip', icon: CheckCircle, handler: handleOpenCompleteDialog},
    { label: 'Edit Trip', icon: Pencil, handler: handleEditTrip },
    { label: 'Cancel Trip', icon: Ban, handler: (id: string) => handleTripAction(id, 'cancelled'), isDestructive: true },
  ]
  
  const completedTripActions = [
    { label: 'View Details', icon: Pencil, handler: handleEditTrip },
  ]

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSaveTrip} ref={formRef}>
      <Card>
          <CardHeader>
            <CardTitle>Create New Trip</CardTitle>
            <CardDescription>
              Assign a vehicle, driver, and start date, then add customers and their shipments.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="trip-vehicle">Vehicle</Label>
                    <Select name="trip-vehicle" required onValueChange={setSelectedVehicleId} value={selectedVehicleId}>
                        <SelectTrigger id="trip-vehicle">
                        <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                        {availableVehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                            {v.registrationNumber} - {v.model} ({v.type})
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="trip-driver">Driver</Label>
                    <Select name="trip-driver" required onValueChange={setSelectedDriverId} value={selectedDriverId}>
                        <SelectTrigger id="trip-driver">
                        <SelectValue placeholder="Select a driver" />
                        </SelectTrigger>
                        <SelectContent>
                        {availableDrivers.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                            {d.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="trip-start-date">Start Date</Label>
                    <DatePicker date={startDate} setDate={setStartDate} disablePast={!isAdmin} />
                </div>
            </div>

            {isOilTanker && (
                <div className="grid gap-4 sm:grid-cols-3 border-t pt-6">
                    <div className="space-y-2">
                        <Label>Order Number</Label>
                        <Input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="e.g. PO-123" />
                    </div>
                    <div className="space-y-2">
                        <Label>SAP Number</Label>
                        <Input value={sapNumber} onChange={e => setSapNumber(e.target.value)} placeholder="e.g. SAP-456" />
                    </div>
                    <div className="space-y-2">
                        <Label>Token Number</Label>
                        <Input value={tokenNumber} onChange={e => setTokenNumber(e.target.value)} placeholder="e.g. TKN-789" />
                    </div>
                </div>
            )}
             
            <div className="space-y-4">
                <Label className='text-lg font-medium'>Shipment Details</Label>
                
                {customerShipments.map((cs, customerIndex) => (
                    <Card key={customerIndex} className="bg-muted/30">
                        <CardHeader className='flex-row items-center justify-between'>
                            <div className="w-1/2 space-y-2">
                                <Label>Customer</Label>
                                <Select value={cs.customerId} onValueChange={(val) => handleCustomerChange(customerIndex, val)}>
                                    <SelectTrigger><SelectValue placeholder="Select customer"/></SelectTrigger>
                                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCustomer(customerIndex)}>
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {cs.shipments.map((shipment, shipmentIndex) => (
                               <div key={shipment.tempId} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 border rounded-md relative bg-background">
                                   <div className="md:col-span-2 space-y-2">
                                       <Label>From</Label>
                                       <Select value={shipment.fromCityId} onValueChange={(val) => handleShipmentChange(customerIndex, shipment.tempId, 'fromCityId', val)}>
                                           <SelectTrigger><SelectValue placeholder="Origin"/></SelectTrigger>
                                           <SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                       </Select>
                                   </div>
                                   <div className="md:col-span-2 space-y-2">
                                       <Label>To</Label>
                                       <Select value={shipment.toCityId} onValueChange={(val) => handleShipmentChange(customerIndex, shipment.tempId, 'toCityId', val)}>
                                           <SelectTrigger><SelectValue placeholder="Destination"/></SelectTrigger>
                                           <SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                       </Select>
                                   </div>
                                   <div className="md:col-span-2 space-y-2">
                                       <Label>Product</Label>
                                       <Input value={shipment.productName || ''} onChange={(e) => handleShipmentChange(customerIndex, shipment.tempId, 'productName', e.target.value)} placeholder="e.g. Wheat" />
                                   </div>
                                    <div className="md:col-span-2 space-y-2">
                                       <Label>Quantity</Label>
                                       <Input type="number" value={shipment.quantity || ''} onChange={(e) => handleShipmentChange(customerIndex, shipment.tempId, 'quantity', e.target.value)} placeholder="e.g. 1000" />
                                   </div>
                                   <div className="md:col-span-2 space-y-2">
                                       <Label>Fare/Unit</Label>
                                       <Input type="number" value={shipment.ratePerUnit || ''} onChange={(e) => handleShipmentChange(customerIndex, shipment.tempId, 'ratePerUnit', e.target.value)} placeholder="e.g. 50" />
                                   </div>
                                    <div className="md:col-span-2 space-y-2 text-right">
                                       <Label className='block text-muted-foreground'>Total Fare</Label>
                                       <p className="font-semibold text-lg h-10 flex items-center justify-end">{(shipment.fare || 0).toLocaleString()}</p>
                                   </div>
                                   {cs.shipments.length > 1 && (
                                       <Button type="button" variant="ghost" size="icon" className="absolute -top-3 -right-3 bg-background rounded-full" onClick={() => handleRemoveShipment(customerIndex, shipment.tempId)}>
                                           <Trash2 className="h-4 w-4 text-destructive" />
                                       </Button>
                                   )}
                               </div>
                           ))}
                           <Button type="button" variant="outline" size="sm" onClick={() => handleAddShipment(customerIndex)}><PlusCircle className="mr-2"/>Add Shipment</Button>
                        </CardContent>
                        <CardFooter className="bg-muted/50 p-4 rounded-b-lg">
                            <div className="flex justify-end w-full items-center">
                                <p className="text-md font-semibold">Total Customer Fare: <span className="text-primary text-xl ml-2">PKR {calculateTotalCustomerFare(cs.shipments).toLocaleString()}</span></p>
                            </div>
                        </CardFooter>
                    </Card>
                ))}

                <Button type="button" variant="secondary" onClick={handleAddCustomer}><UserPlus className="mr-2"/>Add Customer</Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="ml-auto" disabled={customerShipments.length === 0}>
              <Save className="mr-2" />
              Save Trip
            </Button>
          </CardFooter>
      </Card>
        </form>

      <TripSection
        title="Saved Trips"
        description="Trips that are planned but not yet scheduled. Add details before moving to pending."
        trips={savedTrips}
        actions={savedTripActions}
        emptyMessage="No saved trips."
      />
       <TripSection
        title="Pending Trips"
        description="Trips that are scheduled and awaiting start."
        trips={pendingTrips}
        actions={pendingTripActions}
        emptyMessage="No pending trips."
      />
      <TripSection
        title="Active Trips"
        description="A list of all ongoing trips."
        trips={activeTrips}
        actions={activeTripActions}
        emptyMessage="No active trips."
      />
      <TripSection
        title="Closed & Completed Trips"
        description="Trips that have been successfully completed."
        trips={completedTrips}
        actions={completedTripActions}
        emptyMessage="No completed trips."
      />

      {editingTrip && (
        <EditTripDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          trip={editingTrip}
          onSave={handleSaveEditedTrip}
          cities={cities}
          customers={customers}
          vehicles={vehicles}
        />
      )}
      {completingTrip && (
        <CompleteTripDialog
            isOpen={isCompleteDialogOpen}
            onClose={() => setIsCompleteDialogOpen(false)}
            trip={completingTrip}
            cities={cities}
            customers={customers}
            onComplete={handleCompleteTrip}
        />
      )}
    </div>
  );
}


interface TripSectionProps {
  title: string;
  description: string;
  trips: Trip[];
  actions: { label: string, icon: React.ElementType, handler: (idOrTrip: string | Trip) => void, isDestructive?: boolean }[];
  emptyMessage: string;
}

function TripSection({ title, description, trips, actions, emptyMessage }: TripSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            {title === 'Closed & Completed Trips' && <Archive />}
            {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Customers</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.length > 0 ? (
                trips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>{trip.vehicleReg}</TableCell>
                    <TableCell>{trip.driverName}</TableCell>
                    <TableCell>{trip.routeName}</TableCell>
                    <TableCell>{trip.customerNames.join(', ')}</TableCell>
                    <TableCell>{trip.startDate}</TableCell>
                    <TableCell>{trip.endDate || 'N/A'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                          trip.status === 'active' ? 'bg-green-100 text-green-800'
                          : trip.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                          : trip.status === 'completed' ? 'bg-gray-100 text-gray-800'
                          : trip.status === 'cancelled' ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {trip.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {actions.length > 0 ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Trip Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {actions.map(action => (
                                <DropdownMenuItem 
                                key={action.label} 
                                onClick={() => action.handler(action.label.includes('Edit') || action.label.includes('Complete') || action.label.includes('Details') ? trip : trip.id)} 
                                className={action.isDestructive ? 'text-destructive' : ''}
                                >
                                    <action.icon className="mr-2" /> {action.label}
                                </DropdownMenuItem>
                            ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">No actions</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

    