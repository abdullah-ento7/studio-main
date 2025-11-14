
'use client'

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DataTable from "./data-table"
import type { Driver, Vehicle, Customer, City, Supplier, Trip, Owner, Expense } from "@/lib/types";
import { useToast } from "@/hooks/use-toast"
import { User, Truck, Building, MapPin, Briefcase, GanttChartSquare, Users, Building2, Package, Pin, UserSquare, CreditCard, Search, Pencil, Trash2, PlusCircle, MoreHorizontal } from 'lucide-react';
import EditDialog from "./edit-dialog";
import DriverForm from "./driver-form";
import VehicleForm from "./vehicle-form";
import CustomerForm from "./customer-form";
import CityForm from "./city-form";
import SupplierForm from "./supplier-form";
import EditTripDialog from "./edit-trip-dialog";
import OwnerForm from "./owner-form";
import EditExpenseDialog from "./edit-expense-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { useData } from "@/context/data-context";
import { Input } from "../ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { ColumnDef } from "@tanstack/react-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";


type DataType = 'driver' | 'vehicle' | 'customer' | 'city' | 'supplier' | 'trip' | 'owner' | 'expense';

const formComponents: Record<DataType, React.ComponentType<any>> = {
    driver: DriverForm,
    vehicle: VehicleForm,
    customer: CustomerForm,
    city: CityForm,
    supplier: SupplierForm,
    trip: EditTripDialog, 
    owner: OwnerForm,
    expense: EditExpenseDialog,
};

export default function EditTab() {
    const {
        drivers, setDrivers,
        vehicles, setVehicles,
        customers, setCustomers,
        cities, setCities,
        suppliers, setSuppliers,
        trips, setTrips,
        owners, setOwners,
        expenses, setExpenses
    } = useData();

    const { toast } = useToast();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAddVehicleDialogOpen, setIsAddVehicleDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [editingType, setEditingType] = useState<DataType | null>(null);
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');

    const [driverSearch, setDriverSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [vehicleSearch, setVehicleSearch] = useState('');
    const [tripSearch, setTripSearch] = useState('');
    const [expenseSearch, setExpenseSearch] = useState('');
    const [citySearch, setCitySearch] = useState('');


    const handleEdit = (item: any, type: DataType) => {
        setEditingItem(item);
        setEditingType(type);
        setIsDialogOpen(true);
    }

    const handleDelete = (item: any, type: string) => {
        const itemName = item.name || item.registrationNumber || item.id;
        switch (type) {
            case 'drivers':
                setDrivers(prev => prev.filter(d => d.id !== item.id));
                break;
            case 'vehicles':
                setVehicles(prev => prev.filter(v => v.id !== item.id));
                break;
            case 'customers':
                setCustomers(prev => prev.filter(c => c.id !== item.id));
                break;
            case 'cities':
                setCities(prev => prev.filter(r => r.id !== item.id));
                break;
            case 'suppliers':
                setSuppliers(prev => prev.filter(s => s.id !== item.id));
                break;
            case 'trips':
                setTrips(prev => prev.filter(t => t.id !== item.id));
                break;
            case 'owners':
                setOwners(prev => prev.filter(o => o.id !== item.id));
                break;
            case 'expenses':
                setExpenses(prev => prev.filter(e => e.id !== item.id));
                break;
        }

        toast({ 
            title: "Item Deleted", 
            description: `Deleted ${type.slice(0, -1)}: ${itemName}`, 
            variant: "destructive"
        });
    }

    const handleSave = (updatedItem: any) => {
        if (!editingType) return;
        const itemName = updatedItem.name || updatedItem.registrationNumber || updatedItem.id;

        switch (editingType) {
            case 'driver':
                setDrivers(prev => prev.map(d => d.id === updatedItem.id ? updatedItem : d));
                break;
            case 'vehicle':
                setVehicles(prev => prev.map(v => v.id === updatedItem.id ? updatedItem : v));
                break;
            case 'customer':
                setCustomers(prev => prev.map(c => c.id === updatedItem.id ? updatedItem : c));
                break;
            case 'city':
                setCities(prev => prev.map(r => r.id === updatedItem.id ? updatedItem : r));
                break;
            case 'supplier':
                setSuppliers(prev => prev.map(s => s.id === updatedItem.id ? updatedItem : s));
                break;
            case 'trip':
                setTrips(prev => prev.map(t => t.id === updatedItem.id ? updatedItem : t));
                break;
            case 'owner':
                setOwners(prev => prev.map(o => o.id === updatedItem.id ? updatedItem : o));
                break;
            case 'expense':
                setExpenses(prev => prev.map(e => e.id === updatedItem.id ? updatedItem : e));
                break;
        }

        toast({
            title: "Item Updated",
            description: `Updated ${editingType}: ${itemName}`,
            className: 'bg-green-100 text-green-800',
        });
        setIsDialogOpen(false);
        setEditingItem(null);
        setEditingType(null);
    }
    
    const handleAddVehicle = (newVehicle: Vehicle) => {
        const vehicleWithId = {
            ...newVehicle,
            id: `V${Date.now()}`,
            ownerId: selectedOwnerId,
            status: 'active' as const,
        };
        setVehicles(prev => [...prev, vehicleWithId]);
        toast({
            title: "Vehicle Added",
            description: `Vehicle ${newVehicle.registrationNumber} has been added to the owner.`,
        });
        setIsAddVehicleDialogOpen(false);
    }

    const genericColumns = <T extends {id: string}>(onEdit: (item: T) => void, onDelete: (item: T) => void): ColumnDef<T>[] => [
        {
            id: 'actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    const ownerColumns: ColumnDef<Owner>[] = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'contact', header: 'Contact' },
        { accessorKey: 'cnic', header: 'CNIC' },
        ...genericColumns<Owner>((item) => handleEdit(item, 'owner'), (item) => handleDelete(item, 'owners')),
    ];

    const driverColumns: ColumnDef<Driver>[] = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'contact', header: 'Contact' },
        { accessorKey: 'licenseNumber', header: 'License No.' },
        { accessorKey: 'status', header: 'Status' },
        ...genericColumns<Driver>((item) => handleEdit(item, 'driver'), (item) => handleDelete(item, 'drivers')),
    ];
    
    const vehicleColumns: ColumnDef<Vehicle>[] = [
        { accessorKey: 'registrationNumber', header: 'Reg. Number' },
        { accessorKey: 'model', header: 'Model' },
        { accessorKey: 'type', header: 'Type' },
        { accessorKey: 'status', header: 'Status' },
        ...genericColumns<Vehicle>((item) => handleEdit(item, 'vehicle'), (item) => handleDelete(item, 'vehicles')),
    ];
    
    const customerColumns: ColumnDef<Customer>[] = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'contact', header: 'Contact' },
        { accessorKey: 'address', header: 'Address' },
        ...genericColumns<Customer>((item) => handleEdit(item, 'customer'), (item) => handleDelete(item, 'customers')),
    ];

    const cityColumns: ColumnDef<City>[] = [
        { accessorKey: 'name', header: 'City Name' },
        ...genericColumns<City>((item) => handleEdit(item, 'city'), (item) => handleDelete(item, 'cities')),
    ];

    const supplierColumns: ColumnDef<Supplier>[] = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'contact', header: 'Contact' },
        { accessorKey: 'service', header: 'Service' , cell: ({ row }) => row.original.service.join(', ')},
        ...genericColumns<Supplier>((item) => handleEdit(item, 'supplier'), (item) => handleDelete(item, 'suppliers')),
    ];

    const tripColumns: ColumnDef<Trip>[] = [
      { accessorKey: 'id', header: 'Trip ID' },
      { accessorKey: 'vehicleReg', header: 'Vehicle' },
      { accessorKey: 'driverName', header: 'Driver' },
      { accessorKey: 'routeName', header: 'Route' },
      { accessorKey: 'status', header: 'Status' },
      ...genericColumns<Trip>((item) => handleEdit(item, 'trip'), (item) => handleDelete(item, 'trips')),
    ];
    
    const filteredDrivers = drivers.filter(d => 
        d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
        d.contact.toLowerCase().includes(driverSearch.toLowerCase()) ||
        d.licenseNumber.toLowerCase().includes(driverSearch.toLowerCase())
    );

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.contact.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.address.toLowerCase().includes(customerSearch.toLowerCase())
    );
    
    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        s.contact.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        s.service.join(', ').toLowerCase().includes(supplierSearch.toLowerCase())
    );

    const filteredVehicles = vehicles.filter(v => 
        v.ownerId === selectedOwnerId &&
        (v.registrationNumber.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.type.toLowerCase().includes(vehicleSearch.toLowerCase()))
    );

    const filteredTrips = trips.filter(t =>
        t.id.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.vehicleReg.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.driverName.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.routeName.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.status.toLowerCase().includes(tripSearch.toLowerCase())
    );

    const expensesByTrip = expenses.reduce((acc, expense) => {
        if (!acc[expense.tripId]) {
          acc[expense.tripId] = [];
        }
        acc[expense.tripId].push(expense);
        return acc;
      }, {} as Record<string, Expense[]>);
    
    const filteredExpensesByTrip = Object.keys(expensesByTrip)
        .map(tripId => {
            const trip = trips.find(t => t.id === tripId);
            if (!trip) return null;
            
            const tripExpenses = expensesByTrip[tripId];
            const totalAmount = tripExpenses.reduce((sum, e) => sum + e.amount, 0);

            const passesFilter = tripId.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                trip.driverName.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                trip.routeName.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                totalAmount.toString().includes(expenseSearch.toLowerCase()) ||
                (tripExpenses[0]?.createdBy && tripExpenses[0].createdBy.toLowerCase().includes(expenseSearch.toLowerCase())) ||
                (tripExpenses[0]?.date && new Date(tripExpenses[0].date).toLocaleDateString().includes(expenseSearch.toLowerCase()));
            
            if (!passesFilter) return null;

            return {
                tripId,
                driverName: trip.driverName,
                fromCity: cities.find(c => c.id === trip.route[0])?.name || 'N/A',
                toCity: cities.find(c => c.id === trip.route[trip.route.length - 1])?.name || 'N/A',
                uploadedBy: tripExpenses[0]?.createdBy || 'N/A',
                date: tripExpenses[0]?.createdAt ? new Date(tripExpenses[0].createdAt).toLocaleString() : 'N/A',
                approvedBy: tripExpenses[0]?.approvedBy || 'N/A',
                submittedDate: tripExpenses[0]?.date ? new Date(tripExpenses[0].date).toLocaleDateString() : 'N/A',
                totalAmount,
                expenses: tripExpenses,
            };
        })
        .filter(Boolean) as any[];


    const filteredCities = cities.filter(c =>
        c.name.toLowerCase().includes(citySearch.toLowerCase())
    );

    const selectedOwner = owners.find(o => o.id === selectedOwnerId);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Data</CardTitle>
        <CardDescription>
          View and modify existing records in the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
      <Tabs defaultValue="staff" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="staff"><Users className="mr-2 h-4 w-4" />Staff</TabsTrigger>
            <TabsTrigger value="parties"><Building2 className="mr-2 h-4 w-4" />Parties</TabsTrigger>
            <TabsTrigger value="assets"><Truck className="mr-2 h-4 w-4" />Assets</TabsTrigger>
            <TabsTrigger value="logistics"><Package className="mr-2 h-4 w-4" />Logistics & Financials</TabsTrigger>
          </TabsList>
          
          <TabsContent value="staff" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Driver Records</CardTitle>
                    <CardDescription>Edit drivers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Search drivers..."
                            className="pl-10"
                            value={driverSearch}
                            onChange={(e) => setDriverSearch(e.target.value)}
                        />
                    </div>
                    <DataTable columns={driverColumns} data={filteredDrivers} />
                </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="parties" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Party Records</CardTitle>
                    <CardDescription>Edit customers and suppliers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="customers">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="customers"><Building className="mr-2 h-4 w-4" />Customers</TabsTrigger>
                            <TabsTrigger value="suppliers"><Briefcase className="mr-2 h-4 w-4" />Suppliers</TabsTrigger>
                        </TabsList>
                        <TabsContent value="customers" className="mt-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder="Search customers..."
                                    className="pl-10"
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                />
                            </div>
                            <DataTable columns={customerColumns} data={filteredCustomers} />
                        </TabsContent>
                        <TabsContent value="suppliers" className="mt-4 space-y-4">
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder="Search suppliers..."
                                    className="pl-10"
                                    value={supplierSearch}
                                    onChange={(e) => setSupplierSearch(e.target.value)}
                                />
                            </div>
                            <DataTable columns={supplierColumns} data={filteredSuppliers} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="mt-4">
             <Card>
                <CardHeader>
                    <CardTitle>Asset Records</CardTitle>
                    <CardDescription>Select an owner to view and manage their vehicles.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="max-w-sm space-y-2">
                        <Label htmlFor="owner-select">Select Owner</Label>
                        <Select onValueChange={setSelectedOwnerId} value={selectedOwnerId}>
                            <SelectTrigger id="owner-select">
                                <SelectValue placeholder="Select an owner" />
                            </SelectTrigger>
                            <SelectContent>
                                {owners.map(owner => (
                                    <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedOwner && (
                        <Card className="mt-4">
                             <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{selectedOwner.name}</CardTitle>
                                        <CardDescription>
                                            Contact: {selectedOwner.contact} | CNIC: {selectedOwner.cnic}
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(selectedOwner, 'owner')}>
                                        <Pencil className="mr-2 h-4 w-4"/> Edit Owner
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold">Vehicles</h4>
                                    <Dialog open={isAddVehicleDialogOpen} onOpenChange={setIsAddVehicleDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="default">
                                                <PlusCircle className="mr-2"/> Add New Vehicle
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[900px]">
                                            <DialogHeader>
                                                <DialogTitle>Add Vehicle to {selectedOwner.name}</DialogTitle>
                                            </DialogHeader>
                                            <VehicleForm onSave={handleAddVehicle} isDialog onCancel={() => setIsAddVehicleDialogOpen(false)}/>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search vehicles of this owner..."
                                        className="pl-10"
                                        value={vehicleSearch}
                                        onChange={(e) => setVehicleSearch(e.target.value)}
                                    />
                                </div>
                                <DataTable 
                                    columns={vehicleColumns} 
                                    data={filteredVehicles} 
                                />
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="logistics" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Logistics & Financials</CardTitle>
                    <CardDescription>Edit trips, destinations, and expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="trips">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="trips"><GanttChartSquare className="mr-2 h-4 w-4" />Trips</TabsTrigger>
                            <TabsTrigger value="expenses"><CreditCard className="mr-2 h-4 w-4" />Expenses</TabsTrigger>
                            <TabsTrigger value="cities"><Pin className="mr-2 h-4 w-4" />Destinations</TabsTrigger>
                        </TabsList>
                        <TabsContent value="trips" className="mt-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder="Search trips..."
                                    className="pl-10"
                                    value={tripSearch}
                                    onChange={(e) => setTripSearch(e.target.value)}
                                />
                            </div>
                            <DataTable columns={tripColumns} data={filteredTrips} />
                        </TabsContent>
                        <TabsContent value="expenses" className="mt-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder="Search expenses by trip, driver, route..."
                                    className="pl-10"
                                    value={expenseSearch}
                                    onChange={(e) => setExpenseSearch(e.target.value)}
                                />
                            </div>
                             <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Trip</TableHead>
                                            <TableHead>Driver</TableHead>
                                            <TableHead>From</TableHead>
                                            <TableHead>To</TableHead>
                                            <TableHead>Uploaded By</TableHead>
                                            <TableHead>Uploaded Time</TableHead>
                                            <TableHead>Approved By</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredExpensesByTrip.length > 0 ? (
                                            filteredExpensesByTrip.map(tripData => (
                                                <Accordion type="single" collapsible className="w-full" asChild key={tripData.tripId}>
                                                    <TableRow>
                                                        <TableCell colSpan={8}>
                                                            <AccordionItem value={tripData.tripId} className="border-0">
                                                                <AccordionTrigger className="w-full">
                                                                    <div className="grid grid-cols-8 text-left w-full">
                                                                        <span>{tripData.tripId}</span>
                                                                        <span>{tripData.driverName}</span>
                                                                        <span>{tripData.fromCity}</span>
                                                                        <span>{tripData.toCity}</span>
                                                                        <span>{tripData.uploadedBy}</span>
                                                                        <span>{tripData.date}</span>
                                                                        <span>{tripData.approvedBy}</span>
                                                                        <span>{tripData.submittedDate}</span>
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent>
                                                                    <div className="rounded-md border bg-muted/50">
                                                                        <Table>
                                                                            <TableHeader>
                                                                                <TableRow>
                                                                                    <TableHead>Category</TableHead>
                                                                                    <TableHead>Description</TableHead>
                                                                                    <TableHead>Status</TableHead>
                                                                                    <TableHead>Amount</TableHead>
                                                                                    <TableHead className="text-right">Actions</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                            {tripData.expenses.map((exp: Expense) => (
                                                                                <TableRow key={exp.id}>
                                                                                    <TableCell className="capitalize">{exp.category}</TableCell>
                                                                                    <TableCell>{exp.description}</TableCell>
                                                                                    <TableCell><Badge variant={exp.status === 'approved' ? 'secondary' : exp.status === 'rejected' ? 'destructive' : 'default'}>{exp.status}</Badge></TableCell>
                                                                                    <TableCell>{exp.amount.toLocaleString()}</TableCell>
                                                                                    <TableCell className="text-right">
                                                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(exp, 'expense')}><Pencil className="h-4 w-4"/></Button>
                                                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(exp, 'expenses')}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        </TableCell>
                                                    </TableRow>
                                                </Accordion>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-24 text-center">
                                                    No expenses match your search.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                        <TabsContent value="cities" className="mt-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder="Search destinations..."
                                    className="pl-10"
                                    value={citySearch}
                                    onChange={(e) => setCitySearch(e.target.value)}
                                />
                            </div>
                            <DataTable columns={cityColumns} data={filteredCities} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      {editingType && editingType !== 'trip' && editingType !== 'expense' && (
        <EditDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            item={editingItem}
            type={editingType}
            onSave={handleSave}
            FormComponent={formComponents[editingType]}
        />
      )}
      {editingType === 'trip' && editingItem && (
        <EditTripDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            trip={editingItem}
            onSave={handleSave}
            cities={cities}
            customers={customers}
            vehicles={vehicles}
        />
      )}
       {editingType === 'expense' && editingItem && (
        <EditExpenseDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            expense={editingItem}
            onSave={handleSave}
            suppliers={suppliers}
        />
      )}
    </Card>
  )
}
