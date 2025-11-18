
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import type { Expense, Supplier, ExpenseCategory, User } from '@/lib/types';
import { expenseCategories } from '@/lib/types';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';

interface EditExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense;
  onSave: (expense: Expense) => void;
  suppliers: Supplier[];
}

export default function EditExpenseDialog({ isOpen, onClose, expense, onSave, suppliers }: EditExpenseDialogProps) {
  const { loggedInUser } = useAuth();
  const isAdmin = loggedInUser?.permissions?.admin;

  const [date, setDate] = React.useState<Date | undefined>(new Date(expense.date));
  const [category, setCategory] = React.useState<ExpenseCategory>(expense.category);
  const [amount, setAmount] = React.useState(expense.amount.toString());
  const [description, setDescription] = React.useState(expense.description);
  const [supplierId, setSupplierId] = React.useState(expense.supplierId);
  const [isDirty, setIsDirty] = React.useState(false);
  const [isDiscardAlertOpen, setIsDiscardAlertOpen] = React.useState(false);

  React.useEffect(() => {
    setDate(new Date(expense.date));
    setCategory(expense.category);
    setAmount(expense.amount.toString());
    setDescription(expense.description);
    setSupplierId(expense.supplierId);
    setIsDirty(false);
  }, [expense, isOpen]);

  if (!isOpen) return null;

  const handleDirty = () => setIsDirty(true);

  const handleClose = () => {
    if (isDirty) {
        setIsDiscardAlertOpen(true);
    } else {
        onClose();
    }
  }

  const handleSave = () => {
    onSave({
      ...expense,
      date: date?.toISOString() || new Date().toISOString(),
      category,
      amount: parseFloat(amount) || 0,
      description,
      supplierId: supplierId || undefined,
    });
  };


  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit Expense: {expense.id}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4" onChange={handleDirty}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense-date">Date</Label>
              <DatePicker date={date} setDate={(d) => { setDate(d); handleDirty(); }} disablePast={!isAdmin} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select value={category} onValueChange={(value) => { setCategory(value as ExpenseCategory); handleDirty(); }}>
                <SelectTrigger id="expense-category">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(cat => <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount</Label>
              <Input id="expense-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            {category === 'maintenance' && (
              <div className="space-y-2">
                <Label htmlFor="expense-supplier">Supplier</Label>
                <Select value={supplierId} onValueChange={(val) => {setSupplierId(val); handleDirty()}}>
                  <SelectTrigger id="expense-supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.filter(s => s.service.includes('maintenance') || s.service.includes('spare parts')).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-description">Description</Label>
            <Textarea id="expense-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
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
                <AlertDialogAction onClick={onClose}>Discard</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
