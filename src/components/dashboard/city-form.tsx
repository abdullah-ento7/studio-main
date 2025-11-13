
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
import { useState, useEffect } from 'react';
import { City } from '@/lib/types';

interface CityFormProps {
  city?: City;
  onSave?: (city: City) => void;
  isDialog?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  onCancel?: () => void;
}

export default function CityForm({ city, onSave, isDialog = false, onDirtyChange, onCancel }: CityFormProps) {
    const [formKey, setFormKey] = useState(Date.now());

    useEffect(() => {
        if (!onSave) {
            setFormKey(Date.now());
        }
    }, [onSave]);

    const handleFormChange = () => {
        if (onDirtyChange) {
          onDirtyChange(true);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.target as HTMLFormElement);
      const formValues = Object.fromEntries(formData.entries()) as any;
      
      const newCityData: City = {
        id: city?.id || `C${Date.now()}`,
        name: formValues['city-name'],
      };

      if (onSave) {
        onSave(newCityData);
        if (!city) {
            (event.target as HTMLFormElement).reset();
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
                <CardTitle>{city ? 'Edit' : 'Add'} Destination</CardTitle>
                <CardDescription>{city ? 'Update destination name.' : 'Add a new destination to the system.'}</CardDescription>
            </CardHeader>
            )}
            <CardContent className={`grid gap-4 sm:grid-cols-2 ${contentClass}`}>
                <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="city-name">Destination Name</Label>
                <Input id="city-name" name="city-name" placeholder="e.g., Lahore" defaultValue={city?.name} required />
                </div>
            </CardContent>
            <CardFooter>
                {isDialog && <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>}
                <Button type="submit" className="ml-auto">
                    <Save className="mr-2" />
                    {city ? 'Save Changes' : 'Save Destination'}
                </Button>
            </CardFooter>
      </form>
    </CardWrapper>
  );
}
