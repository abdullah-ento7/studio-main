
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Trip, City, Customer, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from '@/context/auth-context';

interface CompleteTripDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  cities: City[];
  customers: Customer[];
  onComplete: (tripId: string, endDate: Date, endCityId: string) => void;
}

export default function CompleteTripDialog({
  isOpen,
  onClose,
  trip,
  cities,
  customers,
  onComplete,
}: CompleteTripDialogProps) {
  const { toast } = useToast();
  const { user: loggedInUser } = useAuth();
  const [endDate, setEndDate] = useState<Date>();
  const [endCityId, setEndCityId] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [isDiscardAlertOpen, setIsDiscardAlertOpen] = useState(false);
  
  const isAdmin = loggedInUser?.permissions?.admin;

  const handleDirty = () => setIsDirty(true);

  const handleClose = () => {
    if (isDirty) {
        setIsDiscardAlertOpen(true);
    } else {
        onClose();
    }
  }

  const handleComplete = () => {
    if (!endDate || !endCityId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a closing date and city.',
        variant: 'destructive',
      });
      return;
    }
    onComplete(trip.id, endDate, endCityId);
    setIsDirty(false);
  };

  if (!isOpen) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Complete Trip: {trip.id}</DialogTitle>
          <DialogDescription>
            Provide the final details to mark this trip as completed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="end-date">Closing Date</Label>
                    <DatePicker date={endDate} setDate={(d) => { setEndDate(d); handleDirty(); }} disablePast={!isAdmin} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end-city">Closing City</Label>
                    <Select value={endCityId} onValueChange={(val) => { setEndCityId(val); handleDirty(); }}>
                        <SelectTrigger id="end-city">
                            <SelectValue placeholder="Select closing city" />
                        </SelectTrigger>
                        <SelectContent>
                            {cities.map(city => (
                                <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          
            <div>
                <h4 className="font-medium mb-2">Shipments on this Trip</h4>
                {trip.shipments.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {trip.shipments.map(shipment => {
                        const customer = customers.find(c => c.id === shipment.customerId);
                        const fromCity = cities.find(c => c.id === shipment.fromCityId);
                        const toCity = cities.find(c => c.id === shipment.toCityId);
                        return (
                        <li key={shipment.id}>
                            <strong>{customer?.name || 'Unknown Customer'}</strong>: {fromCity?.name || 'N/A'} to {toCity?.name || 'N/A'}
                        </li>
                        );
                    })}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No customer shipments were on this trip.</p>
                )}
            </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleComplete}>
            <CheckCircle className="mr-2" />
            Complete Trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <AlertDialog open={isDiscardAlertOpen} onOpenChange={setIsDiscardAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
                <AlertDialogDescription>
                    You have unsaved changes. Are you sure you want to discard them?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Continue Editing</AlertDialogCancel>
                <AlertDialogAction onClick={() => { onClose(); setIsDirty(false); }}>Discard</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
