
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trip, City, Customer, Vehicle, User } from '@/lib/types';
import TripForm from './trip-form';
import { useState } from 'react';
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

interface EditTripDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onSave: (trip: Trip) => void;
  cities: City[];
  customers: Customer[];
  vehicles: Vehicle[];
}

export default function EditTripDialog({
  isOpen,
  onClose,
  trip,
  onSave,
  cities,
  customers,
  vehicles,
}: EditTripDialogProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [isDiscardAlertOpen, setIsDiscardAlertOpen] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isDirty) {
        setIsDiscardAlertOpen(true);
    } else {
        onClose();
        setIsDirty(false);
    }
  }

  const handleSave = (updatedTrip: Trip) => {
    onSave(updatedTrip);
    setIsDirty(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Edit Trip: {trip.id}</DialogTitle>
          </DialogHeader>
          <TripForm
            isDialog={true}
            trip={trip}
            onSave={handleSave}
            cities={cities}
            customers={customers}
            vehicles={vehicles}
            onDirtyChange={setIsDirty}
            onCancel={handleClose}
          />
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
                <AlertDialogAction onClick={() => {
                    onClose();
                    setIsDirty(false);
                }}>Discard</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
