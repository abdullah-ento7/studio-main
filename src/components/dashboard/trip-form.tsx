
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Trip, Customer, City, Shipment, Vehicle, OilType, User, OilDetail, ShipmentUnit } from '@/lib/types';
import { oilTypes, shipmentUnits } from '@/lib/types';
import { DatePicker } from '../ui/date-picker';
import { useAuth } from '@/context/auth-context';

interface TripFormProps {
  trip: Trip;
  onSave: (trip: Trip) => void;
  cities: City[];
  customers: Customer[];
  vehicles: Vehicle[];
  isDialog?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  onCancel?: () => void;
}

// Define CardWrapper as a proper component
const CardWrapper = ({ isDialog, children }: { isDialog: boolean, children: React.ReactNode }) => {
  if (isDialog) {
    return <div>{children}</div>;
  }
  return <Card>{children}</Card>;
};

export default function TripForm({ trip, onSave, cities, customers, vehicles, isDialog=false, onDirtyChange, onCancel }: TripFormProps) {
  const { toast } = useToast();
  const { loggedInUser } = useAuth();
  
  const [shipments, setShipments] = useState<Partial<Shipment>[]>(trip.shipments);
  
  const [orderNumber, setOrderNumber] = useState(trip.orderNumber || '');
  const [sapNumber, setSapNumber] = useState(trip.sapNumber || '');
  const [tokenNumber, setTokenNumber] = useState(trip.tokenNumber || '');

  const isAdmin = loggedInUser?.permissions.admin;

  const vehicle = vehicles.find(v => v.id === trip.vehicleId);
  const isOilTanker = vehicle?.type === 'Oil Tanker';

  useEffect(() => {
    setShipments(trip.shipments.length > 0 ? trip.shipments : [{ id: `S_NEW_${Date.now()}` }]);
    setOrderNumber(trip.orderNumber || '');
    setSapNumber(trip.sapNumber || '');
    setTokenNumber(trip.tokenNumber || '');
  }, [trip]);

  const handleDirty = () => {
    if (onDirtyChange) {
      onDirtyChange(true);
    }
  };

  const handleAddShipment = () => {
    handleDirty();
    setShipments(prev => [...prev, { id: `S_NEW_${Date.now()}` }]);
  };

  const handleRemoveShipment = (id?: string) => {
    if (!id) return;
    handleDirty();
    setShipments(prev => prev.filter(s => s.id !== id));
  };
  
  const handleShipmentChange = (id: string, field: keyof Shipment, value: any) => {
    handleDirty();
    setShipments(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
   
  const handleShipmentDateChange = (id: string, field: keyof Shipment, value: Date | undefined) => {
    handleDirty();
    setShipments(prev => prev.map(s => s.id === id ? { ...s, [field]: value?.toISOString() } : s));
  };

  const handleOilDetailChange = (shipmentId: string, oilDetailId: string, field: keyof OilDetail, value: any) => {
      handleDirty();
      setShipments(prev => prev.map(s => {
          if (s.id === shipmentId) {
              const updatedOilDetails = s.oilDetails?.map(od => {
                  if(od.id === oilDetailId) {
                      return { ...od, [field]: value };
                  }
                  return od;
              });
              return { ...s, oilDetails: updatedOilDetails };
          }
          return s;
      }));
  }

  const handleAddOilDetail = (shipmentId: string) => {
      handleDirty();
      setShipments(prev => prev.map(s => {
          if (s.id === shipmentId) {
              const newOilDetail: OilDetail = { id: `OD_${Date.now()}`, type: 'petrol', amount: 0 };
              const oilDetails = s.oilDetails ? [...s.oilDetails, newOilDetail] : [newOilDetail];
              return { ...s, oilDetails };
          }
          return s;
      }))
  }

   const handleRemoveOilDetail = (shipmentId: string, oilDetailId: string) => {
      handleDirty();
      setShipments(prev => prev.map(s => {
          if (s.id === shipmentId) {
              const updatedOilDetails = s.oilDetails?.filter(od => od.id !== oilDetailId);
              return { ...s, oilDetails: updatedOilDetails };
          }
          return s;
      }));
  }
  
  const handleSaveChanges = () => {
    if (shipments.some(s => !s.customerId || !s.fromCityId || !s.toCityId)) {
        toast({
            title: 'Error',
            description: 'Each shipment must have a customer, from city, and to city.',
            variant: 'destructive',
        });
        return;
    }

    const finalShipments: Shipment[] = shipments.map(s => ({
        ...s,
        id: s.id!.startsWith('S_NEW_') ? `S${Date.now()}` : s.id!,
        fare: s.fare || 0,
        fromCityId: s.fromCityId!,
        toCityId: s.toCityId!,
        customerId: s.customerId!,
        productName: s.productName || '', 
        quantity: s.quantity || 0, 
        unit: s.unit || 'Per Ton',
        ratePerUnit: s.ratePerUnit || 0,
    }));

    const route = finalShipments.length > 0 ? [finalShipments[0].fromCityId, ...finalShipments.map(s => s.toCityId)] : [];
    const uniqueRoute = [...new Set(route)];
    
    const routeName = uniqueRoute.map(id => cities.find(c => c.id === id)?.name).filter(Boolean).join(' -> ');
    const customerNames = [...new Set(finalShipments.map(s => customers.find(c => c.id === s.customerId)?.name || ''))];

    const updatedTrip: Trip = {
        ...trip,
        routeName: routeName,
        route: uniqueRoute,
        customerNames: customerNames,
        shipments: finalShipments,
        orderNumber: isOilTanker ? orderNumber : undefined,
        sapNumber: isOilTanker ? sapNumber : undefined,
        tokenNumber: isOilTanker ? tokenNumber : undefined,
    };
    
    onSave(updatedTrip);
  };

  return (
    <CardWrapper isDialog={isDialog}>
        <CardContent className="grid gap-6 pt-6">
            {isOilTanker && (
              <fieldset className="border p-4 rounded-md">
                  <legend className="text-lg font-medium px-2">Trip Header</legend>
                  <div className="grid gap-4 sm:grid-cols-3 pt-4">
                      <div className="space-y-2">
                          <Label>Order Number</Label>
                          <Input value={orderNumber} onChange={e => {handleDirty(); setOrderNumber(e.target.value)}} placeholder="e.g. PO-123" />
                      </div>
                      <div className="space-y-2">
                          <Label>SAP Number</Label>
                          <Input value={sapNumber} onChange={e => {handleDirty(); setSapNumber(e.target.value)}} placeholder="e.g. SAP-456" />
                      </div>
                      <div className="space-y-2">
                          <Label>Token Number</Label>
                          <Input value={tokenNumber} onChange={e => {handleDirty(); setTokenNumber(e.target.value)}} placeholder="e.g. TKN-789" />
                      </div>
                  </div>
              </fieldset>
            )}

            {shipments.map((shipment, index) => (
            <fieldset key={shipment.id} className="border p-4 rounded-md relative">
                <legend className="text-lg font-medium px-2">Shipment {index + 1}</legend>
                {shipments.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => handleRemoveShipment(shipment.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                )}

                 <div className="grid gap-4 sm:grid-cols-3 pt-4">
                    <div className="space-y-2">
                        <Label>Customer</Label>
                        <Select value={shipment.customerId} onValueChange={(v) => handleShipmentChange(shipment.id!, 'customerId', v)}>
                            <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                            <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Supply Source</Label>
                        <Select value={shipment.fromCityId} onValueChange={(v) => handleShipmentChange(shipment.id!, 'fromCityId', v)}>
                            <SelectTrigger><SelectValue placeholder="From" /></SelectTrigger>
                            <SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Destination</Label>
                        <Select value={shipment.toCityId} onValueChange={(v) => handleShipmentChange(shipment.id!, 'toCityId', v)}>
                            <SelectTrigger><SelectValue placeholder="To" /></SelectTrigger>
                            <SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2 sm:col-span-3">
                        <Label>Description</Label>
                        <Textarea value={shipment.description} onChange={e => handleShipmentChange(shipment.id!, 'description', e.target.value)} placeholder="Shipment description..."/>
                    </div>
                </div>
                
                 {isOilTanker && (
                    <div className="mt-4 border-t pt-4">
                        <h4 className="text-md font-medium mb-2">Oil Details</h4>
                         {shipment.oilDetails?.map((od) => (
                             <div key={od.id} className="flex gap-4 items-end mb-2">
                                <div className="space-y-2 flex-grow">
                                    <Label>Type</Label>
                                    <Select value={od.type} onValueChange={v => handleOilDetailChange(shipment.id!, od.id, 'type', v)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>{oilTypes.map(ot => <SelectItem key={ot} value={ot} className="capitalize">{ot}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 flex-grow">
                                    <Label>Amount (PKR)</Label>
                                    <Input type="number" value={od.amount} onChange={e => handleOilDetailChange(shipment.id!, od.id, 'amount', parseFloat(e.target.value) || 0)} />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOilDetail(shipment.id!, od.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                             </div>
                         ))}
                         <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => handleAddOilDetail(shipment.id!)}><PlusCircle className="mr-2"/>Add Oil Detail</Button>
                    </div>
                 )}

                <div className="mt-4 border-t pt-4">
                    <h4 className="text-md font-medium mb-2">Product Details</h4>
                     <div className="grid gap-4 sm:grid-cols-4 pt-4">
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Product Name</Label>
                            <Input value={shipment.productName || ''} onChange={e => handleShipmentChange(shipment.id!, 'productName', e.target.value)} placeholder="e.g., Wheat, Diesel"/>
                        </div>
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input type="number" value={shipment.quantity || ''} onChange={e => handleShipmentChange(shipment.id!, 'quantity', parseFloat(e.target.value) || 0)} placeholder="e.g. 1000"/>
                        </div>
                        <div className="space-y-2">
                            <Label>Unit</Label>
                            <Select value={shipment.unit} onValueChange={(v) => handleShipmentChange(shipment.id!, 'unit', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
                                <SelectContent>{shipmentUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                 <div className="mt-4 border-t pt-4">
                     <h4 className="text-md font-medium mb-2">Dates</h4>
                     <div className="grid gap-4 sm:grid-cols-3 pt-4">
                         <div className="space-y-2">
                             <Label>Freight Date</Label>
                             <DatePicker date={shipment.freightDate ? new Date(shipment.freightDate) : undefined} setDate={(d) => handleShipmentDateChange(shipment.id!, 'freightDate', d)} />
                         </div>
                         <div className="space-y-2">
                             <Label>Loading Date</Label>
                             <DatePicker date={shipment.loadingDate ? new Date(shipment.loadingDate) : undefined} setDate={(d) => handleShipmentDateChange(shipment.id!, 'loadingDate', d)} />
                         </div>
                         <div className="space-y-2">
                             <Label>Decanting Date</Label>
                             <DatePicker date={shipment.decantingDate ? new Date(shipment.decantingDate) : undefined} setDate={(d) => handleShipmentDateChange(shipment.id!, 'decantingDate', d)} />
                         </div>
                     </div>
                 </div>

                 <div className="mt-4 border-t pt-4">
                     <h4 className="text-md font-medium mb-2">Reference Numbers</h4>
                     <div className="grid gap-4 sm:grid-cols-4 pt-4">
                        <div className="space-y-2">
                             <Label>Shipment No</Label>
                             <Input value={shipment.shipmentNo || ''} onChange={e => handleShipmentChange(shipment.id!, 'shipmentNo', e.target.value)} />
                         </div>
                         <div className="space-y-2">
                             <Label>Sale Order No</Label>
                             <Input value={shipment.saleOrderNo || ''} onChange={e => handleShipmentChange(shipment.id!, 'saleOrderNo', e.target.value)} />
                         </div>
                         <div className="space-y-2">
                             <Label>Delivery No</Label>
                             <Input value={shipment.deliveryNo || ''} onChange={e => handleShipmentChange(shipment.id!, 'deliveryNo', e.target.value)} />
                         </div>
                         <div className="space-y-2">
                             <Label>Token No</Label>
                             <Input value={shipment.tokenNo || ''} onChange={e => handleShipmentChange(shipment.id!, 'tokenNo', e.target.value)} />
                         </div>
                     </div>
                 </div>

                <div className="mt-4 border-t pt-4">
                     <h4 className="text-md font-medium mb-2">Fare, Charges & Deductions</h4>
                      <div className="grid gap-4 sm:grid-cols-4 pt-4">
                        <div className="space-y-2">
                            <Label>Gross Freight</Label>
                            <Input type="number" value={shipment.fare || ''} onChange={e => handleShipmentChange(shipment.id!, 'fare', parseFloat(e.target.value) || 0)} placeholder="Total fare amount"/>
                        </div>
                        <div className="space-y-2">
                            <Label>Rate/Unit</Label>
                            <Input type="number" value={shipment.ratePerUnit || ''} onChange={e => handleShipmentChange(shipment.id!, 'ratePerUnit', parseFloat(e.target.value) || 0)} placeholder="e.g. 9.75"/>
                        </div>
                         <div className="space-y-2">
                            <Label>Rate Difference</Label>
                            <Input type="number" value={shipment.rateDiff || ''} onChange={e => handleShipmentChange(shipment.id!, 'rateDiff', parseFloat(e.target.value) || 0)} />
                        </div>
                         <div className="space-y-2">
                            <Label>Shortage Qty</Label>
                            <Input type="number" value={shipment.shortageQty || ''} onChange={e => handleShipmentChange(shipment.id!, 'shortageQty', parseFloat(e.target.value) || 0)} />
                        </div>
                         <div className="space-y-2">
                            <Label>Shortage Amount</Label>
                            <Input type="number" value={shipment.shortageAmount || ''} onChange={e => handleShipmentChange(shipment.id!, 'shortageAmount', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Commission</Label>
                            <Input type="number" value={shipment.commission || ''} onChange={e => handleShipmentChange(shipment.id!, 'commission', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-2">
                            <Label>WHT</Label>
                            <Input type="number" value={shipment.wht || ''} onChange={e => handleShipmentChange(shipment.id!, 'wht', parseFloat(e.target.value) || 0)} />
                        </div>
                         <div className="space-y-2">
                            <Label>Other Charges</Label>
                            <Input type="number" value={shipment.otherCharges || ''} onChange={e => handleShipmentChange(shipment.id!, 'otherCharges', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Advance Penalty</Label>
                            <Input type="number" value={shipment.advancePenalty || ''} onChange={e => handleShipmentChange(shipment.id!, 'advancePenalty', parseFloat(e.target.value) || 0)} />
                        </div>
                         <div className="space-y-2">
                            <Label>Penalty Tracker Charges</Label>
                            <Input type="number" value={shipment.penaltyTrackerCharges || ''} onChange={e => handleShipmentChange(shipment.id!, 'penaltyTrackerCharges', parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                </div>

            </fieldset>
            ))}
             <Button type="button" variant="outline" onClick={handleAddShipment}><PlusCircle className="mr-2"/>Add Another Shipment</Button>
        </CardContent>
        <CardFooter>
            {isDialog && <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>}
            <Button onClick={handleSaveChanges} className="ml-auto">
                <Save className="mr-2" />
                Save Changes
            </Button>
        </CardFooter>
    </CardWrapper>
  );
}

    
