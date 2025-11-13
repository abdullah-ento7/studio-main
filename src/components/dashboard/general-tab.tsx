
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building, MapPin, Briefcase, UserSquare, Users, GanttChartSquare, BookUser } from 'lucide-react';
import DriverForm from './driver-form';
import OwnerForm from './owner-form';
import CustomerForm from './customer-form';
import CityForm from './city-form';
import SupplierForm from './supplier-form';
import { Driver, Vehicle, Customer, City, Supplier, Owner } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';
import TripsTabContent from './trips-tab';
import AccountsTab from './accounts-tab';
import DataTable from './data-table';
import { useState } from 'react';
import EditDialog from './edit-dialog';

export default function GeneralTab() {
  const { drivers, setDrivers, vehicles, setVehicles, customers, setCustomers, cities, setCities, suppliers, setSuppliers, owners, setOwners } = useData();
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const createSaveHandler = (setter: React.Dispatch<React.SetStateAction<any[]>>, type: string) => (newItem: any) => {
    setter(prev => [...prev, newItem]);
    toast({
        title: 'Success',
        description: `${type} registration saved.`,
        className: 'bg-accent text-accent-foreground',
    });
  }

  const handleDriverSave = (driver: Driver) => {
    setDrivers(prev => [...prev, driver]);
    toast({
        title: 'Success',
        description: `Driver registration saved.`,
        className: 'bg-accent text-accent-foreground',
    });
  }

  const handleOwnerSave = (owner: Owner, vehicles: Vehicle[]) => {
    setOwners(prev => [...prev, owner]);
    setVehicles(prev => [...prev, ...vehicles]);
    toast({
        title: 'Success',
        description: `Owner and vehicles registration saved.`,
        className: 'bg-accent text-accent-foreground',
    });
  }

  const handleCitySave = (newCity: City) => {
    const cityExists = cities.some(c => c.name.toLowerCase() === newCity.name.toLowerCase());
    if (cityExists) {
      toast({
        title: 'Error: Duplicate Destination',
        description: `The destination "${newCity.name}" already exists.`,
        variant: 'destructive',
      });
    } else {
      createSaveHandler(setCities, 'Destination')(newCity);
    }
  }
  
  const handleEdit = (item: any, type: string) => {
    setEditingItem(item);
    setEditingType(type);
    setIsDialogOpen(true);
  }
  
  const handleDelete = (item: City) => {
      setCities(prev => prev.filter(c => c.id !== item.id));
      toast({ 
          title: "Destination Deleted", 
          description: `Deleted destination: ${item.name}`, 
          variant: "destructive"
      });
  }

  const handleSave = (updatedItem: City) => {
    setCities(prev => prev.map(c => c.id === updatedItem.id ? updatedItem : c));
    toast({
        title: "Item Updated",
        description: `Updated city: ${updatedItem.name}`,
    });
    setIsDialogOpen(false);
  }

  const cityColumns = [
    { accessor: 'name' as const, header: 'Destination Name' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Registrations & Trips</CardTitle>
        <CardDescription>
          Manage all your master data and trips from one place.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="staff" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="staff"><Users className="mr-2 h-4 w-4" />Staff</TabsTrigger>
            <TabsTrigger value="owner"><UserSquare className="mr-2 h-4 w-4" />Owner & Vehicle</TabsTrigger>
            <TabsTrigger value="parties"><Building className="mr-2 h-4 w-4" />Parties</TabsTrigger>
            <TabsTrigger value="destination"><MapPin className="mr-2 h-4 w-4" />Destination</TabsTrigger>
            <TabsTrigger value="trips"><GanttChartSquare className="mr-2 h-4 w-4" />Trips</TabsTrigger>
            <TabsTrigger value="accounts"><BookUser className="mr-2 h-4 w-4" />Accounts</TabsTrigger>
          </TabsList>
          <TabsContent value="staff" className="mt-4">
            <DriverForm onSave={handleDriverSave} />
          </TabsContent>
          <TabsContent value="owner" className="mt-4">
            <OwnerForm onSave={handleOwnerSave} />
          </TabsContent>
          <TabsContent value="parties" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Party Registration</CardTitle>
                    <CardDescription>Register new customers and suppliers in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="customer">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="customer"><Building className="mr-2 h-4 w-4" />Customer</TabsTrigger>
                            <TabsTrigger value="supplier"><Briefcase className="mr-2 h-4 w-4" />Supplier</TabsTrigger>
                        </TabsList>
                        <TabsContent value="customer" className="mt-4">
                            <CustomerForm onSave={createSaveHandler(setCustomers, 'Customer')} />
                        </TabsContent>
                        <TabsContent value="supplier" className="mt-4">
                            <SupplierForm onSave={createSaveHandler(setSuppliers, 'Supplier')} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="destination" className="mt-4 grid gap-6 md:grid-cols-2">
            <CityForm onSave={handleCitySave} />
            <Card>
                <CardHeader>
                    <CardTitle>Existing Destinations</CardTitle>
                    <CardDescription>A list of all currently saved destinations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={cityColumns}
                        data={cities}
                    />
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="trips" className="mt-4">
            <TripsTabContent />
          </TabsContent>
          <TabsContent value="accounts" className="mt-4">
            <AccountsTab />
          </TabsContent>
        </Tabs>
      </CardContent>
      {editingItem && editingType === 'city' && (
        <EditDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            item={editingItem}
            type={editingType}
            onSave={handleSave}
            FormComponent={CityForm}
        />
      )}
    </Card>
  );
}
