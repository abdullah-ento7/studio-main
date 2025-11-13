
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
import { materialsAndServices, MaterialOrService, Supplier } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { useState, useEffect, ChangeEvent } from 'react';

interface SupplierFormProps {
  supplier?: Supplier;
  onSave?: (supplier: Supplier) => void;
  isDialog?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  onCancel?: () => void;
}

export default function SupplierForm({ supplier, onSave, isDialog = false, onDirtyChange, onCancel }: SupplierFormProps) {
  const [selectedServices, setSelectedServices] = useState<MaterialOrService[]>([]);
  const [formKey, setFormKey] = useState(Date.now());
  const [cnic, setCnic] = useState('');

  useEffect(() => {
    if (supplier) {
      if (supplier.service) setSelectedServices(supplier.service);
      if (supplier.cnic) setCnic(supplier.cnic);
    }
  }, [supplier]);

  useEffect(() => {
    if(!onSave) {
        setFormKey(Date.now());
        setSelectedServices([]);
        setCnic('');
    }
  }, [onSave])

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

  const handleCheckboxChange = (service: MaterialOrService, checked: boolean | 'indeterminate') => {
    handleFormChange();
    if (checked) {
      setSelectedServices((prev) => [...prev, service]);
    } else {
      setSelectedServices((prev) => prev.filter((s) => s !== service));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const formValues = Object.fromEntries(formData.entries()) as any;

    const newSupplierData: Supplier = {
      id: supplier?.id || `S${Date.now()}`,
      name: formValues['supplier-name'],
      contact: formValues['supplier-contact'],
      cnic: formValues['supplier-cnic'],
      email: formValues['supplier-email'],
      service: selectedServices,
    };

    if (onSave) {
      onSave(newSupplierData);
      if(!supplier) {
        (event.target as HTMLFormElement).reset();
        setSelectedServices([]);
        setCnic('');
      }
    }
  };

  const CardWrapper = isDialog ? 'div' : Card;
  const contentClass = isDialog ? 'pt-6' : '';

  return (
    <CardWrapper>
      <form onSubmit={handleSubmit} key={formKey} onChange={handleFormChange}>
        {!isDialog && (
          <CardHeader>
            <CardTitle>{supplier ? 'Edit' : 'Register'} Supplier</CardTitle>
            <CardDescription>{supplier ? 'Update supplier details.' : 'Add a new supplier to the system.'}</CardDescription>
          </CardHeader>
        )}
        <CardContent className={`grid gap-6 sm:grid-cols-2 ${contentClass}`}>
          <div className="space-y-2">
            <Label htmlFor="supplier-name">Name</Label>
            <Input
              id="supplier-name"
              name="supplier-name"
              placeholder="Enter supplier's name"
              defaultValue={supplier?.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-contact">Contact</Label>
            <Input
              id="supplier-contact"
              name="supplier-contact"
              type="tel"
              placeholder="Enter contact number"
              defaultValue={supplier?.contact}
              required
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="supplier-cnic">CNIC</Label>
            <Input id="supplier-cnic" name="supplier-cnic" value={cnic} onChange={handleCnicChange} placeholder="00000-0000000-0" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-email">Email (Optional)</Label>
            <Input id="supplier-email" name="supplier-email" type="email" placeholder="Enter email address" defaultValue={supplier?.email} />
          </div>
          <div className="space-y-4 sm:col-span-2">
            <Label>Main Materials/Services</Label>
            <div className="grid grid-cols-2 gap-4 rounded-md border p-4 sm:grid-cols-3 md:grid-cols-4">
              {materialsAndServices.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Checkbox
                    id={`service-${item}`}
                    onCheckedChange={(checked) => handleCheckboxChange(item, checked)}
                    checked={selectedServices.includes(item)}
                  />
                  <Label htmlFor={`service-${item}`} className="font-normal capitalize">
                    {item}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
            {isDialog && <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>}
            <Button type="submit" className="ml-auto">
                <Save className="mr-2" />
                {supplier ? 'Save Changes' : 'Save Supplier'}
            </Button>
        </CardFooter>
      </form>
    </CardWrapper>
  );
}
