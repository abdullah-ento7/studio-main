
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Vehicle, Chamber, RoutePermit } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { DatePicker } from '../ui/date-picker';

interface VehicleFormProps {
  vehicle?: Partial<Vehicle>;
  onSave?: (vehicle: Vehicle) => void;
  isDialog?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  onCancel?: () => void;
}

export default function VehicleForm({ vehicle, onSave, isDialog = false, onDirtyChange, onCancel }: VehicleFormProps) {
  const [formKey, setFormKey] = useState(Date.now());
  const [localVehicle, setLocalVehicle] = useState<Partial<Vehicle>>({
      chamberCount: 1,
      chambers: Array.from({ length: 4 }, (_, i) => ({ id: `CH_NEW_${i}`, referenceDip: 0, productDip: 0})),
      ...vehicle
  });

  useEffect(() => {
    // Ensure chambers are initialized if not present
    const initialChambers = Array.from({ length: 4 }, (_, i) => ({ id: `CH_NEW_${i}`, referenceDip: 0, productDip: 0}));
    setLocalVehicle(v => ({ 
        chamberCount: 1, 
        ...v, 
        ...vehicle, 
        chambers: vehicle?.chambers || initialChambers 
    }));
    setFormKey(Date.now());
  }, [vehicle]);

  const handleFormChange = (update: Partial<Vehicle>) => {
    if (onDirtyChange) {
      onDirtyChange(true);
    }
    setLocalVehicle(prev => ({ ...prev, ...update }));
  };
  
  const handleDateChange = (field: keyof Vehicle, date: Date | undefined) => {
    handleFormChange({ [field]: date?.toISOString().split('T')[0] });
  }

  const handlePermitDateChange = (field: keyof RoutePermit, date: Date | undefined) => {
    handleFormChange({ routePermits: { ...localVehicle?.routePermits, [field]: date?.toISOString().split('T')[0] } });
  }

  const handleChamberChange = (chamberId: string, field: 'referenceDip' | 'productDip', value: string) => {
     if (!localVehicle) return;
     const updatedChambers = localVehicle.chambers?.map(c => 
        c.id === chamberId ? { ...c, [field]: parseFloat(value) || 0 } : c
     );
     handleFormChange({ chambers: updatedChambers });
  }


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onSave || !localVehicle) return;

    // Use a FormData to gather all input values
    const formData = new FormData(event.currentTarget);
    const formValues = Object.fromEntries(formData.entries());

    const finalVehicleData: Vehicle = {
        ...localVehicle,
        id: localVehicle.id || `V${Date.now()}`,
        registrationNumber: formValues.registrationNumber as string,
        model: formValues.model as string,
        type: formValues.type as Vehicle['type'],
        brandName: formValues.brandName as string,
        brandStatus: formValues.brandStatus as Vehicle['brandStatus'],
        engineNo: formValues.engineNo as string,
        engineHp: Number(formValues.engineHp),
        makerName: formValues.makerName as string,
        engineCC: Number(formValues.engineCC),
        motorRegAuth: formValues.motorRegAuth as string,
        chassisNo: formValues.chassisNo as string,
        prevRegMark: formValues.prevRegMark as string,
        yearOfManuf: Number(formValues.yearOfManuf),
        ograCompliant: formValues.ograCompliant as string,
        calibChartNo: formValues.calibChartNo as string,
        calibAuth: formValues.calibAuth as string,
        explosiveCertNo: formValues.explosiveCertNo as string,
        tlRemarks: formValues.tlRemarks as string,
        capacity: formValues.capacity as string,
        documents: formValues.documents as string,
        status: (formValues.status as Vehicle['status']) || 'active',
        // Dates and other complex objects are already in localVehicle state
        calibDate: localVehicle.calibDate,
        calibExpiry: localVehicle.calibExpiry,
        tokenExpiry: localVehicle.tokenExpiry,
        fitnessDate: localVehicle.fitnessDate,
        fitnessExpiry: localVehicle.fitnessExpiry,
        explosiveApprDate: localVehicle.explosiveApprDate,
        explosiveExpiryDate: localVehicle.explosiveExpiryDate,
        chkExemptDate: localVehicle.chkExemptDate,
        routePermits: localVehicle.routePermits,
        // Tank Lorry specific
        chamberCount: localVehicle.type === 'Tank Lorry' ? localVehicle.chamberCount : undefined,
        totalCapacityLiters: localVehicle.type === 'Tank Lorry' ? Number(formValues.totalCapacityLiters) : undefined,
        chambers: localVehicle.type === 'Tank Lorry' ? localVehicle.chambers?.slice(0, localVehicle.chamberCount) : undefined,

    } as Vehicle;

    onSave(finalVehicleData);

    if (!vehicle) { // If creating new, not editing
        setLocalVehicle({ chamberCount: 1, chambers: Array.from({ length: 4 }, (_, i) => ({ id: `CH_NEW_${i}`, referenceDip: 0, productDip: 0})) });
        setFormKey(Date.now());
    }
  };

  const CardWrapper = isDialog ? 'div' : 'div';

  if (!localVehicle && isDialog && !onSave) {
    return (
        <CardWrapper>
            <CardContent><p>No vehicle data to display.</p></CardContent>
        </CardWrapper>
    )
  }

  return (
    <CardWrapper>
      <form onSubmit={handleSubmit} key={formKey} onChange={() => onDirtyChange && onDirtyChange(true)}>
        <CardContent className="grid gap-y-6 pt-6">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="vehicle-reg" className="required">Registration Number</Label>
                    <Input id="vehicle-reg" name="registrationNumber" defaultValue={localVehicle?.registrationNumber} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-model" className="required">Model</Label>
                    <Input id="vehicle-model" name="model" defaultValue={localVehicle?.model} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-type" className="required">Type</Label>
                    <Select name="type" value={localVehicle?.type} onValueChange={(v) => handleFormChange({ type: v as Vehicle['type'] })} required>
                        <SelectTrigger><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Truck">Truck</SelectItem>
                            <SelectItem value="Van">Van</SelectItem>
                            <SelectItem value="Bus">Bus</SelectItem>
                            <SelectItem value="Car">Car</SelectItem>
                            <SelectItem value="Oil Tanker">Oil Tanker</SelectItem>
                            <SelectItem value="Tank Lorry">Tank Lorry</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-brandName" className="required">Brand Name</Label>
                    <Input id="vehicle-brandName" name="brandName" defaultValue={localVehicle?.brandName} required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-brandStatus">Brand Status</Label>
                    <Select name="brandStatus" value={localVehicle?.brandStatus} onValueChange={(v) => handleFormChange({ brandStatus: v as Vehicle['brandStatus'] })}>
                        <SelectTrigger><SelectValue placeholder="Select status"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Transfers">Transfers</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="vehicle-engineNo" className="required">Engine No.</Label>
                    <Input id="vehicle-engineNo" name="engineNo" defaultValue={localVehicle?.engineNo} required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-engineHp">Engine Cap. HP</Label>
                    <Input id="vehicle-engineHp" name="engineHp" type="number" defaultValue={localVehicle?.engineHp} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-makerName">Maker Name</Label>
                    <Input id="vehicle-makerName" name="makerName" defaultValue={localVehicle?.makerName} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-engineCC">Engine Cap. CC</Label>
                    <Input id="vehicle-engineCC" name="engineCC" type="number" defaultValue={localVehicle?.engineCC} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-motorRegAuth">Motor Reg Auth.</Label>
                    <Input id="vehicle-motorRegAuth" name="motorRegAuth" defaultValue={localVehicle?.motorRegAuth} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-chassisNo" className="required">Chassis No.</Label>
                    <Input id="vehicle-chassisNo" name="chassisNo" defaultValue={localVehicle?.chassisNo} required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-prevRegMark">Prev. Reg. Mark</Label>
                    <Input id="vehicle-prevRegMark" name="prevRegMark" defaultValue={localVehicle?.prevRegMark} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-yearOfManuf" className="required">Year of Manuf.</Label>
                    <Input id="vehicle-yearOfManuf" name="yearOfManuf" type="number" defaultValue={localVehicle?.yearOfManuf} required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-ograCompliant">OGRA Compliant</Label>
                    <Input id="vehicle-ograCompliant" name="ograCompliant" defaultValue={localVehicle?.ograCompliant} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-calibChartNo" className="required">Calib. Chart #</Label>
                    <Input id="vehicle-calibChartNo" name="calibChartNo" defaultValue={localVehicle?.calibChartNo} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-calibAuth" className="required">Calibration Auth</Label>
                    <Input id="vehicle-calibAuth" name="calibAuth" defaultValue={localVehicle?.calibAuth} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-calibDate" className="required">Calib. Date</Label>
                    <DatePicker date={localVehicle?.calibDate ? new Date(localVehicle.calibDate) : undefined} setDate={(date) => handleDateChange('calibDate', date)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-calibExpiry" className="required">Calib. Expiry</Label>
                    <DatePicker date={localVehicle?.calibExpiry ? new Date(localVehicle.calibExpiry) : undefined} setDate={(date) => handleDateChange('calibExpiry', date)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-tokenExpiry" className="required">Token Expiry</Label>
                    <DatePicker date={localVehicle?.tokenExpiry ? new Date(localVehicle.tokenExpiry) : undefined} setDate={(date) => handleDateChange('tokenExpiry', date)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-fitnessDate" className="required">Fitness Date</Label>
                    <DatePicker date={localVehicle?.fitnessDate ? new Date(localVehicle.fitnessDate) : undefined} setDate={(date) => handleDateChange('fitnessDate', date)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-fitnessExpiry" className="required">Fitness Expiry</Label>
                    <DatePicker date={localVehicle?.fitnessExpiry ? new Date(localVehicle.fitnessExpiry) : undefined} setDate={(date) => handleDateChange('fitnessExpiry', date)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-explosiveCertNo" className="required">Explosive Cert#</Label>
                    <Input id="vehicle-explosiveCertNo" name="explosiveCertNo" defaultValue={localVehicle?.explosiveCertNo} required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-explosiveApprDate" className="required">Explosive Appr.</Label>
                    <DatePicker date={localVehicle?.explosiveApprDate ? new Date(localVehicle.explosiveApprDate) : undefined} setDate={(date) => handleDateChange('explosiveApprDate', date)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-explosiveExpiryDate" className="required">Explosive Expiry</Label>
                    <DatePicker date={localVehicle?.explosiveExpiryDate ? new Date(localVehicle.explosiveExpiryDate) : undefined} setDate={(date) => handleDateChange('explosiveExpiryDate', date)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-chkExemptDate">Chk Exempt Date</Label>
                    <DatePicker date={localVehicle?.chkExemptDate ? new Date(localVehicle.chkExemptDate) : undefined} setDate={(date) => handleDateChange('chkExemptDate', date)} />
                </div>
                <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="vehicle-tlRemarks" className="required">TL Remarks</Label>
                    <Textarea id="vehicle-tlRemarks" name="tlRemarks" defaultValue={localVehicle?.tlRemarks} required />
                </div>
            </div>
            
            {localVehicle?.type === 'Tank Lorry' && (
                <div className="border-t pt-4 mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="vehicle-chamberCount" className="required">Chambers Detail</Label>
                        <Select value={String(localVehicle.chamberCount)} onValueChange={(val) => handleFormChange({ chamberCount: Number(val) })}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Chamber</SelectItem>
                                <SelectItem value="2">2 Chambers</SelectItem>
                                <SelectItem value="3">3 Chambers</SelectItem>
                                <SelectItem value="4">4 Chambers</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vehicle-totalCapacityLiters" className="required">Total Capacity (Liters)</Label>
                        <Input id="vehicle-totalCapacityLiters" name="totalCapacityLiters" type="number" defaultValue={localVehicle.totalCapacityLiters} required />
                    </div>
                    <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                        {Array.from({ length: localVehicle.chamberCount || 0 }).map((_, i) => (
                            <div key={localVehicle.chambers?.[i]?.id || i} className="border p-2 rounded-md space-y-2">
                                <h5 className="font-semibold text-sm">Chamber {i+1}</h5>
                                <div className="space-y-2">
                                    <Label>Reference Dip (mm)</Label>
                                    <Input type="number" defaultValue={localVehicle.chambers?.[i]?.referenceDip || ''} onChange={(e) => handleChamberChange(localVehicle.chambers?.[i]?.id!, 'referenceDip', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Product Dip (mm)</Label>
                                    <Input type="number" defaultValue={localVehicle.chambers?.[i]?.productDip || ''} onChange={(e) => handleChamberChange(localVehicle.chambers?.[i]?.id!, 'productDip', e.target.value)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="border-t pt-4 mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="vehicle-capacity">Capacity (Tons)</Label>
                    <Input id="vehicle-capacity" name="capacity" type="number" defaultValue={localVehicle?.capacity} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicle-documents">Documents & Instruments</Label>
                    <Textarea id="vehicle-documents" name="documents" defaultValue={localVehicle?.documents} />
                </div>
            </div>

            <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">Route Permits</h4>
                <div className="grid gap-4 md:grid-cols-5">
                    <div>
                        <Label>Punjab</Label>
                        <Input name="punjabPermitNo" placeholder="Permit No." className="mb-2" defaultValue={localVehicle?.routePermits?.punjabPermitNo || ''} onChange={(e) => handleFormChange({ routePermits: {...localVehicle.routePermits, punjabPermitNo: e.target.value} })}/>
                        <DatePicker date={localVehicle?.routePermits?.punjabPermitExpiry ? new Date(localVehicle.routePermits.punjabPermitExpiry) : undefined} setDate={(date) => handlePermitDateChange('punjabPermitExpiry', date)} />
                    </div>
                    <div>
                        <Label>Sindh</Label>
                        <Input name="sindhPermitNo" placeholder="Permit No." className="mb-2" defaultValue={localVehicle?.routePermits?.sindhPermitNo || ''} onChange={(e) => handleFormChange({ routePermits: {...localVehicle.routePermits, sindhPermitNo: e.target.value} })}/>
                        <DatePicker date={localVehicle?.routePermits?.sindhPermitExpiry ? new Date(localVehicle.routePermits.sindhPermitExpiry) : undefined} setDate={(date) => handlePermitDateChange('sindhPermitExpiry', date)} />
                    </div>
                    <div>
                        <Label>KPK</Label>
                        <Input name="kpkPermitNo" placeholder="Permit No." className="mb-2" defaultValue={localVehicle?.routePermits?.kpkPermitNo || ''} onChange={(e) => handleFormChange({ routePermits: {...localVehicle.routePermits, kpkPermitNo: e.target.value} })}/>
                        <DatePicker date={localVehicle?.routePermits?.kpkPermitExpiry ? new Date(localVehicle.routePermits.kpkPermitExpiry) : undefined} setDate={(date) => handlePermitDateChange('kpkPermitExpiry', date)} />
                    </div>
                    <div>
                        <Label>Balochistan</Label>
                        <Input name="balochistanPermitNo" placeholder="Permit No." className="mb-2" defaultValue={localVehicle?.routePermits?.balochistanPermitNo || ''} onChange={(e) => handleFormChange({ routePermits: {...localVehicle.routePermits, balochistanPermitNo: e.target.value} })}/>
                        <DatePicker date={localVehicle?.routePermits?.balochistanPermitExpiry ? new Date(localVehicle.routePermits.balochistanPermitExpiry) : undefined} setDate={(date) => handlePermitDateChange('balochistanPermitExpiry', date)} />
                    </div>
                    <div>
                        <Label>Gilgit</Label>
                        <Input name="gilgitPermitNo" placeholder="Permit No." className="mb-2" defaultValue={localVehicle?.routePermits?.gilgitPermitNo || ''} onChange={(e) => handleFormChange({ routePermits: {...localVehicle.routePermits, gilgitPermitNo: e.target.value} })}/>
                        <DatePicker date={localVehicle?.routePermits?.gilgitPermitExpiry ? new Date(localVehicle.routePermits.gilgitPermitExpiry) : undefined} setDate={(date) => handlePermitDateChange('gilgitPermitExpiry', date)} />
                    </div>
                </div>
            </div>

             {isDialog && (
                <div className="border-t pt-4 mt-4 grid gap-4 md:grid-cols-2">
                    <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="vehicle-status">Status</Label>
                        <Select name="status" value={localVehicle?.status} onValueChange={(v) => handleFormChange({ status: v as Vehicle['status'] })} required>
                            <SelectTrigger id="vehicle-status"><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
             )}
        </CardContent>
        {isDialog && (
            <CardFooter>
                <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
                <Button type="submit" className="ml-auto">
                    <Save className="mr-2" />
                    Save Changes
                </Button>
            </CardFooter>
        )}
      </form>
    </CardWrapper>
  );
}
