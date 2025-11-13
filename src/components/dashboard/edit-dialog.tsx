
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useEffect, useState } from 'react';

interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  type: string;
  onSave: (item: any) => void;
  FormComponent: React.ComponentType<any>;
}

export default function EditDialog({
  isOpen,
  onClose,
  item,
  type,
  onSave,
  FormComponent,
}: EditDialogProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [isDiscardAlertOpen, setIsDiscardAlertOpen] = useState(false);
  
  useEffect(() => {
    // Reset dirty state when dialog is opened with a new item
    setIsDirty(false);
  }, [isOpen, item]);

  const handleClose = () => {
    if (isDirty) {
        setIsDiscardAlertOpen(true);
    } else {
        onClose();
    }
  }

  const handleSave = (updatedItem: any) => {
    onSave(updatedItem);
    setIsDirty(false);
  }

  const handleCancelInForm = () => {
    handleClose();
  }

  const handleDiscard = () => {
    onClose();
    setIsDiscardAlertOpen(false);
    setIsDirty(false);
  }

  if (!isOpen) return null;

  const formProps = {
    isDialog: true,
    [type]: item,
    onSave: handleSave,
    onDirtyChange: setIsDirty,
    onCancel: handleCancelInForm
  };

  const title = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <FormComponent {...formProps} />
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
                <AlertDialogAction onClick={handleDiscard}>Discard</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
