
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
import { Save } from 'lucide-react';
import { DatePicker } from '../ui/date-picker';
import { useEffect, useState } from 'react';
import { Driver } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface DriverFormProps {
  driver?: Driver;
  onSave?: (driver: Driver) => void;
  isDialog?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  onCancel?: () => void;
}

export default function DriverForm({ driver, onSave, isDialog = false, onDirtyChange, onCancel }: DriverFormProps) {
  const [joiningDate, setJoiningDate] = useState<Date | undefined>(driver?.joiningDate ? new Date(driver.joiningDate) : undefined);
  const [licenseExpiryDate, setLicenseExpiryDate] = useState<Date | undefined>(driver?.licenseExpiryDate ? new Date(driver.licenseExpiryDate) : undefined);
  const [formKey, setFormKey] = useState(Date.now());

  useEffect(() => {
    if (driver) {
      if(driver.joiningDate) setJoiningDate(new Date(driver.joiningDate));
      if(driver.licenseExpiryDate) setLicenseExpiryDate(new Date(driver.licenseExpiryDate));
    } else {
        setJoiningDate(undefined);
        setLicenseExpiryDate(undefined);
    }
  }, [driver]);

  useEffect(() => {
    if (!onSave) {
        setFormKey(Date.now());
        setJoiningDate(undefined);
        setLicenseExpiryDate(undefined);
    }
  }, [onSave]);

  const handleFormChange = () => {
    if (onDirtyChange) {
      onDirtyChange(true);
    }
  };

  const handleDateChange = (setter: React.Dispatch<React.SetStateAction<Date | undefined>>) => (date: Date | undefined) => {
    handleFormChange();
    setter(date);
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const formValues = Object.fromEntries(formData.entries()) as any;
    
    const driverId = driver?.id || `D${Date.now()}`;

    const newDriverData: Driver = {
      id: driverId,
      name: formValues['driver-name'],
      contact: formValues['driver-contact'],
      licenseNumber: formValues['driver-license'],
      licenseExpiryDate: licenseExpiryDate?.toISOString().split('T')[0] || '',
      joiningDate: joiningDate?.toISOString().split('T')[0] || '',
      salary: parseFloat(formValues['driver-salary']),
      status: driver ? formValues['driver-status'] : 'active',
    };

    if (onSave) {
        onSave(newDriverData);

        if (!driver) { // If it's a new driver form (not editing)
            (event.target as HTMLFormElement).reset();
            setJoiningDate(undefined);
            setLicenseExpiryDate(undefined);
            setFormKey(Date.now());
        }
    }
  };

  const CardWrapper = isDialog ? 'div' : Card;
  const contentClass = isDialog ? 'pt-6' : '';

  return (
    <CardWrapper>
      <form onSubmit={handleSubmit} key={formKey} onChange={handleFormChange} onFocus={handleFormChange}>
        {!isDialog && (
          <CardHeader>
            <CardTitle>{driver ? 'Edit Driver' : 'Register Driver'}</CardTitle>
            <CardDescription>
              {driver ? 'Update the details of an existing driver.' : 'Add a new driver to the system.'}
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={`space-y-6 ${contentClass}`}>
            <fieldset className="border p-4 rounded-md">
                <legend className="text-lg font-medium px-2">Driver Details</legend>
                <div className="grid gap-4 sm:grid-cols-2 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="driver-name">Name</Label>
                        <Input id="driver-name" name="driver-name" placeholder="Enter driver's name" defaultValue={driver?.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="driver-contact">Contact</Label>
                        <Input id="driver-contact" name="driver-contact" type="tel" placeholder="Enter contact number" defaultValue={driver?.contact} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="driver-license">License Number</Label>
                        <Input id="driver-license" name="driver-license" placeholder="Enter license number" defaultValue={driver?.licenseNumber} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="driver-license-expiry">License Expiry Date</Label>
                        <DatePicker date={licenseExpiryDate} setDate={handleDateChange(setLicenseExpiryDate)} />
                        </div>
                    <div className="space-y-2">
                        <Label htmlFor="driver-joining-date">Joining Date</Label>
                        <DatePicker date={joiningDate} setDate={handleDateChange(setJoiningDate)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="driver-salary">Salary</Label>
                        <Input id="driver-salary" name="driver-salary" type="number" placeholder="Enter salary amount" defaultValue={driver?.salary} required />
                    </div>
                    {driver && (
                        <div className="space-y-2">
                        <Label htmlFor="driver-status">Status</Label>
                        <Select name="driver-status" defaultValue={driver.status} onValueChange={handleFormChange}>
                            <SelectTrigger id="driver-status">
                            <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                    )}
                </div>
            </fieldset>
        </CardContent>
        <CardFooter>
            {isDialog && <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>}
            <Button type="submit" className="ml-auto">
                <Save className="mr-2" />
                {driver ? 'Save Changes' : 'Save Driver'}
            </Button>
        </CardFooter>
      </form>
    </CardWrapper>
  );
}
