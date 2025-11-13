
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Save, PlusCircle, Trash2 } from 'lucide-react';
import { useState, ChangeEvent } from 'react';
import { Owner, Vehicle } from '@/lib/types';
import VehicleForm from './vehicle-form';

interface OwnerFormProps {
  onSave?: (owner: Owner, vehicles: Vehicle[]) => void;
  isDialog?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  owner?: Owner;
  onCancel?: () => void;
}

export default function OwnerForm({ onSave, isDialog = false, onDirtyChange, owner, onCancel }: OwnerFormProps) {
  const [formKey, setFormKey] = useState(Date.now());
  
  const [vehicles, setVehicles] = useState<Partial<Vehicle>[]>([
      { id: `V_TEMP_${Date.now()}` }
  ]);
  const [cnic, setCnic] = useState(owner?.cnic || '');

  const handleFormChange = () => {
    if (onDirtyChange) {
      onDirtyChange(true);
    }
  };

  const handleCnicChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFormChange();
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    if (value.length > 13) {
      value = `${value.slice(0, 13)}-${value.slice(13)}`;
    }
    if (value.length > 15) {
        value = value.slice(0,15);
    }
    setCnic(value);
  }

  const addVehicle = () => {
    handleFormChange();
    setVehicles([...vehicles, { id: `V_TEMP_${Date.now()}` }]);
  };

  const removeVehicle = (id: string) => {
    handleFormChange();
    setVehicles(vehicles.filter(v => v.id !== id));
  };
  
  const handleVehicleSave = (updatedVehicle: Vehicle) => {
    setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  }


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    
    const ownerId = owner?.id || `O${Date.now()}`;
    const newOwnerData: Owner = {
      id: ownerId,
      name: formData.get('owner-name') as string,
      contact: formData.get('owner-contact') as string,
      email: formData.get('owner-email') as string,
      cnic: formData.get('owner-cnic') as string,
    };
    
    const finalVehicles = vehicles.map(v => ({
        ...v,
        id: v.id!.startsWith('V_TEMP_') ? `V${Date.now()}` : v.id!,
        ownerId: ownerId,
        status: 'active' as const,
    })) as Vehicle[];


    if (onSave) {
      onSave(newOwnerData, finalVehicles);
      // Reset form only if creating new
      if (!owner) {
        setFormKey(Date.now());
        setVehicles([{ id: `V_TEMP_${Date.now()}` }]);
        setCnic('');
      }
    }
  };
  
  const CardWrapper = isDialog ? 'div' : Card;
  const contentClass = isDialog ? 'pt-6' : '';

  return (
    <CardWrapper>
      <form onSubmit={handleSubmit} key={formKey} onChange={handleFormChange}>
        {!isDialog ? (
        <CardHeader>
          <CardTitle>Register Owner & Vehicles</CardTitle>
          <CardDescription>Add a new owner and their vehicles to the system.</CardDescription>
        </CardHeader>
        ) : (
        <CardHeader>
             <CardTitle>Edit Owner</CardTitle>
        </CardHeader>
        )}
        <CardContent className={`space-y-6 ${contentClass}`}>
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-medium px-2">Owner Details</legend>
            <div className="grid gap-4 sm:grid-cols-2 pt-4">
              <div className="space-y-2">
                <Label htmlFor="owner-name" className="required">Name</Label>
                <Input id="owner-name" name="owner-name" placeholder="Enter owner's name" defaultValue={owner?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-contact" className="required">Contact</Label>
                <Input id="owner-contact" name="owner-contact" type="tel" placeholder="Enter contact number" defaultValue={owner?.contact} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-cnic" className="required">CNIC</Label>
                <Input id="owner-cnic" name="owner-cnic" value={cnic} onChange={handleCnicChange} placeholder="00000-0000000-0" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-email">Email (Optional)</Label>
                <Input id="owner-email" name="owner-email" type="email" placeholder="Enter email address" defaultValue={owner?.email} />
              </div>
            </div>
          </fieldset>
          
          {!owner && (
            <fieldset className="border p-4 rounded-md">
                <legend className="text-lg font-medium px-2">Vehicle Details</legend>
                <div className="space-y-6 pt-4">
                {vehicles.map((vehicle, index) => (
                    <div key={vehicle.id} className="space-y-4 border-b pb-4 last:border-b-0">
                        <div className="flex justify-between items-center">
                            <h4 className="text-md font-semibold">Vehicle {index + 1}</h4>
                            {vehicles.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeVehicle(vehicle.id!)}>
                                <Trash2 className="text-destructive h-4 w-4" />
                            </Button>
                            )}
                        </div>
                        <VehicleForm 
                            vehicle={vehicle as Vehicle} 
                            onSave={handleVehicleSave} 
                            isDialog 
                            onDirtyChange={handleFormChange}
                        />
                    </div>
                ))}
                </div>
                <Button type="button" variant="outline" onClick={addVehicle} className="mt-4">
                <PlusCircle className="mr-2" /> Add Another Vehicle
                </Button>
            </fieldset>
          )}
        </CardContent>
        <CardFooter>
            {isDialog && <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>}
            <Button type="submit" className="ml-auto">
                <Save className="mr-2" />
                {owner ? 'Save Changes' : 'Save Owner & Vehicles' }
            </Button>
        </CardFooter>
      </form>
    </CardWrapper>
  );
}
