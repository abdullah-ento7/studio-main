
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
import { Textarea } from '../ui/textarea';
import { Customer } from '@/lib/types';
import { useEffect, useState } from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface CustomerFormProps {
  customer?: Customer;
  onSave?: (customer: Customer) => void;
  isDialog?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  onCancel?: () => void;
}

export default function CustomerForm({ customer, onSave, isDialog = false, onDirtyChange, onCancel }: CustomerFormProps) {
    const [formKey, setFormKey] = useState(Date.now());
    const [customerType, setCustomerType] = useState<'person' | 'company'>(customer?.type || 'person');

    useEffect(() => {
        if (!onSave) {
            setFormKey(Date.now());
        }
        if (customer?.type) {
            setCustomerType(customer.type);
        }
    }, [onSave, customer]);

    const handleFormChange = () => {
        if (onDirtyChange) {
          onDirtyChange(true);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.target as HTMLFormElement);
      const formValues = Object.fromEntries(formData.entries()) as any;
      
      const newCustomerData: Customer = {
          id: customer?.id || `C${Date.now()}`,
          type: customerType,
          name: formValues['customer-name'],
          contact: formValues['customer-contact'],
          address: formValues['customer-address'],
          email: formValues['customer-email'],
          companyName: formValues['company-name'],
          companyRegNo: formValues['company-reg-no'],
          companyOwner: formValues['company-owner'],
          memberSince: customer?.memberSince || new Date().toISOString().split('T')[0],
      };

      if (onSave) {
        onSave(newCustomerData);
        if (!customer) {
            (event.target as HTMLFormElement).reset();
            setCustomerType('person');
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
            <CardTitle>{customer ? 'Edit' : 'Register'} Customer</CardTitle>
            <CardDescription>{customer ? 'Update customer details.' : 'Add a new customer to the system.'}</CardDescription>
            </CardHeader>
        )}
        <CardContent className={`grid gap-6 sm:grid-cols-2 ${contentClass}`}>
            <div className="sm:col-span-2 space-y-2">
                <Label>Customer Type</Label>
                <RadioGroup defaultValue={customerType} onValueChange={(v) => {
                    setCustomerType(v as 'person' | 'company');
                    handleFormChange();
                }} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="person" id="person" />
                        <Label htmlFor="person">Person</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="company" id="company" />
                        <Label htmlFor="company">Company</Label>
                    </div>
                </RadioGroup>
            </div>

            {customerType === 'company' && (
                <>
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input id="company-name" name="company-name" placeholder="Enter company name" defaultValue={customer?.companyName} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company-reg-no">Registration Number</Label>
                        <Input id="company-reg-no" name="company-reg-no" placeholder="Enter company registration no." defaultValue={customer?.companyRegNo} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company-owner">Owner</Label>
                        <Input id="company-owner" name="company-owner" placeholder="Enter owner's name" defaultValue={customer?.companyOwner} />
                    </div>
                </>
            )}
            
            <div className="space-y-2">
            <Label htmlFor="customer-name">{customerType === 'person' ? 'Name' : 'Contact Person Name'}</Label>
            <Input id="customer-name" name="customer-name" placeholder={customerType === 'person' ? "Enter customer's name" : "Enter contact person's name"} defaultValue={customer?.name} required />
            </div>
            <div className="space-y-2">
            <Label htmlFor="customer-contact">Contact</Label>
            <Input id="customer-contact" name="customer-contact" type="tel" placeholder="Enter contact number" defaultValue={customer?.contact} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="customer-email">Email (Optional)</Label>
            <Input id="customer-email" name="customer-email" type="email" placeholder="Enter email address" defaultValue={customer?.email} />
            </div>
            <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="customer-address">Address</Label>
            <Textarea id="customer-address" name="customer-address" placeholder="Enter full address" defaultValue={customer?.address} required />
            </div>
        </CardContent>
        <CardFooter>
            {isDialog && <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>}
            <Button type="submit" className="ml-auto">
                <Save className="mr-2" />
                {customer ? 'Save Changes' : 'Save Customer'}
            </Button>
        </CardFooter>
      </form>
    </CardWrapper>
  );
}
