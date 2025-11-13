
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { FileDown, Users, Truck, MapPin, Building2, Briefcase, GanttChartSquare } from 'lucide-react';
import type { Driver, Vehicle, Customer, City, Trip, Supplier, Expense, Shipment } from '@/lib/types';
import { useData } from '@/context/data-context';
import { getShipmentFare } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

export default function ReportTab() {
  const { drivers, vehicles, cities, customers, trips, suppliers, expenses } = useData();
  const { loggedInUser } = useAuth();
  const { toast } = useToast();
  const [fromDate, setFromDate] = React.useState<Date>();
  const [toDate, setToDate] = React.useState<Date>();

  const isAdmin = loggedInUser?.permissions.admin;

  const handleGenerateReport = (reportType: string, selectedItemId?: string, selectedItemLabel?: string) => {
    if (!fromDate || !toDate) {
      toast({
        title: 'Missing Date Range',
        description: 'Please select both "From" and "To" dates.',
        variant: 'destructive'
      });
      return;
    }
    
    const dateFilteredTrips = trips.filter(trip => {
        const tripDate = new Date(trip.startDate);
        return tripDate >= fromDate && tripDate <= toDate;
    });

    let reportContent = '';
    let hasData = false;
    let finalReportType = reportType;

    switch(reportType) {
        case 'Vehicle Wise Report':
            const vehicleTrips = dateFilteredTrips.filter(t => t.vehicleId === selectedItemId);
            if (vehicleTrips.length > 0) {
                hasData = true;
                const vehicle = vehicles.find(v => v.id === selectedItemId);
                finalReportType = `Freight Detail From ${formatDate(fromDate)} To ${formatDate(toDate)} For ${vehicle?.registrationNumber || ''}`;
                reportContent = generateVehicleReport(vehicleTrips, cities, getShipmentFare);
            }
            break;
        case 'Trip Wise Report':
            const singleTrip = trips.find(t => t.id === selectedItemId);
            // Trip wise report is not strictly date bound, so we check if the trip exists
            if (singleTrip) {
                hasData = true;
                finalReportType = `Freight Detail For Trip ${singleTrip.id}`;
                reportContent = generateVehicleReport([singleTrip], cities, getShipmentFare);
            }
            break;
        case 'Driver Wise Report':
            const driverTrips = dateFilteredTrips.filter(t => t.driverId === selectedItemId);
            if(driverTrips.length > 0) {
                hasData = true;
                reportContent = generateDriverReport(driverTrips, expenses);
            }
            break;
        case 'Customer Wise Report':
            const customerTrips = dateFilteredTrips.filter(t => t.shipments.some(s => s.customerId === selectedItemId));
            if (customerTrips.length > 0) {
                hasData = true;
                reportContent = generateCustomerReport(customerTrips, selectedItemId!, vehicles, trips);
            }
            break;
        case 'Supplier Wise Report':
            const supplierExpenses = expenses.filter(e => e.supplierId === selectedItemId && new Date(e.date) >= fromDate && new Date(e.date) <= toDate);
            if (supplierExpenses.length > 0) {
                hasData = true;
                reportContent = generateSupplierReport(supplierExpenses, trips);
            }
            break;
        case 'City Wise Report':
             const cityTrips = dateFilteredTrips.filter(t => t.route.includes(selectedItemId!));
             if (cityTrips.length > 0) {
                 hasData = true;
                 reportContent = generateCityReport(cityTrips, selectedItemId!);
             }
             break;
    }

    if (!hasData) {
        toast({
            title: 'No Data Found',
            description: 'No records were found for the selected criteria and date range. Please try different dates.',
            variant: 'destructive'
        });
        return;
    }

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
        toast({
            title: 'Popup Blocked',
            description: 'Please allow popups for this site to generate reports.',
            variant: 'destructive'
        });
        return;
    }

    reportWindow.document.write(`
        <html>
            <head>
                <title>${reportType} Report</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 20px; line-height: 1.4; font-size: 10px; }
                    h1 { font-size: 14px; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 9px; }
                    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                    th { background-color: #f7f7f7; font-weight: 600; text-align: center; }
                    .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11px;}
                    .footer-info { display: flex; justify-content: space-between; margin-top: 20px; font-size: 11px; }
                    .total-row td { font-weight: bold; background-color: #f0f0f0; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print</button>
                <h1>${finalReportType}</h1>
                ${reportContent}
                <div class="footer-info">
                    <span>Freight Vehicle Wise</span>
                    <span>Report Date: ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}</span>
                    <span>Page 1 of 1</span>
                </div>
            </body>
        </html>
    `);
    reportWindow.document.close();
  };

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).format(new Date(date)).replace(/ /g, '-');
  };

  const generateVehicleReport = (vehicleTrips: Trip[], allCities: City[], fareCalculator: (s: Shipment) => number): string => {
    if(vehicleTrips.length === 0) return '<p class="no-data">No trips found for this vehicle in the selected period.</p>';
    
    let totalQty = 0;
    let totalGrossFreight = 0;
    let totalRateDiff = 0;
    let totalShortageQty = 0;
    let totalShortageAmount = 0;
    let totalOtherCharges = 0;
    let totalComm = 0;
    let totalWht = 0;
    let totalNetFreight = 0;

    const tableRows = vehicleTrips.flatMap(trip => 
        trip.shipments.map(shipment => {
            const netFreight = fareCalculator(shipment);
            totalQty += shipment.quantity || 0;
            totalGrossFreight += shipment.fare || 0;
            totalRateDiff += shipment.rateDiff || 0;
            totalShortageQty += shipment.shortageQty || 0;
            totalShortageAmount += shipment.shortageAmount || 0;
            totalOtherCharges += shipment.otherCharges || 0;
            totalComm += shipment.commission || 0;
            totalWht += shipment.wht || 0;
            totalNetFreight += netFreight;

            return `
                <tr>
                    <td class="text-center">${formatDate(shipment.freightDate)}</td>
                    <td class="text-center">${formatDate(shipment.loadingDate)}</td>
                    <td class="text-center">${formatDate(shipment.decantingDate)}</td>
                    <td class="text-center">${allCities.find(c => c.id === shipment.fromCityId)?.name}</td>
                    <td class="text-center">${allCities.find(c => c.id === shipment.toCityId)?.name}</td>
                    <td class="text-center">${shipment.shipmentNo || ''}</td>
                    <td class="text-center">${shipment.saleOrderNo || ''}</td>
                    <td class="text-center">${shipment.deliveryNo || ''}</td>
                    <td class="text-center">${shipment.productName || ''}</td>
                    <td class="text-right">${(shipment.quantity || 0).toLocaleString()}</td>
                    <td class="text-right">${shipment.ratePerUnit?.toLocaleString() || '0'}</td>
                    <td class="text-center">${shipment.unit || ''}</td>
                    <td class="text-right">${(shipment.fare || 0).toLocaleString()}</td>
                    <td class="text-right">${(shipment.rateDiff || 0).toLocaleString()}</td>
                    <td class="text-right">${(shipment.shortageQty || 0).toLocaleString()}</td>
                    <td class="text-right">${(shipment.shortageAmount || 0).toLocaleString()}</td>
                    <td class="text-center">${shipment.tokenNo || ''}</td>
                    <td class="text-right">${(shipment.advancePenalty || 0).toLocaleString()}</td>
                    <td class="text-right">${(shipment.penaltyTrackerCharges || 0).toLocaleString()}</td>
                    <td class="text-right">${(shipment.otherCharges || 0).toLocaleString()}</td>
                    <td class="text-right">${(shipment.commission || 0).toLocaleString()}</td>
                    <td class="text-right">${(shipment.wht || 0).toLocaleString()}</td>
                    <td class="text-right">${netFreight.toLocaleString()}</td>
                </tr>
            `;
        }).join('')
    ).join('');

    return `
        <table>
            <thead>
                <tr>
                    <th>Freight Date</th><th>Loading Date</th><th>Decanting Date</th><th>Supply Source</th><th>Destination</th>
                    <th>Shipment No</th><th>Sale Order No</th><th>Delivery No</th><th>Product Name</th><th>Qty</th>
                    <th>Rate</th><th>Unit</th><th>Gross Freight</th><th>Rate Diff</th>
                    <th colspan="2">Shortage</th><th>Token No</th><th>Advance Penalty</th><th>Penalty Tracker Charges</th><th>Other Charges</th>
                    <th>Comm</th><th>WHT</th><th>Net Freight Amount</th>
                </tr>
                <tr>
                    <th colspan="14"></th>
                    <th>Qty</th><th>Amount</th>
                    <th colspan="7"></th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
                <tr class="total-row">
                    <td colspan="9" class="text-right"><strong>PRIMARY Total:</strong></td>
                    <td class="text-right"><strong>${totalQty.toLocaleString()}</strong></td>
                    <td colspan="2"></td>
                    <td class="text-right"><strong>${totalGrossFreight.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>${totalRateDiff.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>(${Math.abs(totalShortageQty).toLocaleString()})</strong></td>
                    <td class="text-right"><strong>${totalShortageAmount.toLocaleString()}</strong></td>
                    <td colspan="3"></td>
                    <td class="text-right"><strong>${totalOtherCharges.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>${totalComm.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>${totalWht.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>${totalNetFreight.toLocaleString()}</strong></td>
                </tr>
                 <tr class="total-row">
                    <td colspan="19" class="text-right"><strong>4%</strong></td>
                    <td class="text-right"><strong>2%</strong></td>
                    <td colspan="2"></td>
                 </tr>
                 <tr class="total-row">
                    <td colspan="9" class="text-right"><strong>P-6730 Total:</strong></td>
                    <td class="text-right"><strong>${totalQty.toLocaleString()}</strong></td>
                    <td colspan="2"></td>
                    <td class="text-right"><strong>${totalGrossFreight.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>${totalRateDiff.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>(${Math.abs(totalShortageQty).toLocaleString()})</strong></td>
                    <td class="text-right"><strong>${totalShortageAmount.toLocaleString()}</strong></td>
                    <td colspan="3"></td>
                    <td class="text-right"><strong>${totalOtherCharges.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>${totalComm.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>${totalWht.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>${totalNetFreight.toLocaleString()}</strong></td>
                </tr>
                 <tr class="total-row">
                    <td colspan="9" class="text-right"><strong>Net Total:</strong></td>
                    <td class="text-right"><strong>${totalQty.toLocaleString()}</strong></td>
                    <td colspan="2"></td>
                    <td class="text-right"><strong>${totalGrossFreight.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>${totalRateDiff.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>(${Math.abs(totalShortageQty).toLocaleString()})</strong></td>
                    <td class="text-right"><strong>${totalShortageAmount.toLocaleString()}</strong></td>
                    <td colspan="3"></td>
                    <td class="text-right"><strong>${totalOtherCharges.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>${totalComm.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>${totalWht.toLocaleString()}</strong></td>
                    <td class="text-right"><strong>${totalNetFreight.toLocaleString()}</strong></td>
                </tr>
            </tbody>
        </table>
    `;
  }
  
  const generateDriverReport = (driverTrips: Trip[], allExpenses: Expense[]): string => {
        if(driverTrips.length === 0) return '<p class="no-data">No trips found for this driver in the selected period.</p>';
        let totalDeductions = 0;
        let reportHtml = '<h2>Trips Undertaken</h2>';

        driverTrips.forEach(trip => {
            const driverExpenses = allExpenses.filter(e => e.tripId === trip.id && e.expenseFor === 'driver');
            const tripDeductions = driverExpenses.reduce((acc, e) => acc + e.amount, 0);
            totalDeductions += tripDeductions;
            reportHtml += `
                <p><strong>Trip:</strong> ${trip.id} (${trip.routeName}) | <strong>Date:</strong> ${formatDate(trip.startDate)}</p>
                <ul>
                    ${driverExpenses.length > 0 ? driverExpenses.map(e => `<li>${e.category}: ${e.description} - PKR ${e.amount.toLocaleString()}</li>`).join('') : '<li>No expenses recorded for driver on this trip.</li>'}
                </ul>
            `;
        });
        
        return reportHtml + `<div class="summary">
                                <h2>Summary</h2>
                                <p><strong>Total Deductions:</strong> PKR ${totalDeductions.toLocaleString()}</p>
                             </div>`;
  }

  const generateCustomerReport = (customerTrips: Trip[], customerId: string, allVehicles: Vehicle[], allTrips: Trip[]): string => {
      if(customerTrips.length === 0) return '<p class="no-data">No transactions found for this customer in the selected period.</p>';
      
      let totalFare = 0;
      let totalPaid = 0;
      let reportHtml = `
        <table>
            <thead><tr><th>Trip ID</th><th>Route</th><th>Date</th><th>Shipment Details</th><th>Fare (PKR)</th></tr></thead>
            <tbody>
      `;
      
      customerTrips.forEach(trip => {
          trip.shipments.filter(s => s.customerId === customerId).forEach(shipment => {
              const fare = getShipmentFare(shipment);
              totalFare += fare;
              reportHtml += `<tr>
                <td>${trip.id}</td>
                <td>${trip.routeName}</td>
                <td>${formatDate(trip.startDate)}</td>
                <td>${shipment.description || 'N/A'}</td>
                <td>${fare.toLocaleString()}</td>
              </tr>`;
          });
          trip.payments?.filter(p => p.status === 'approved').forEach(p => totalPaid += p.amount);
      });

      reportHtml += '</tbody></table>';

      return reportHtml + `<div class="summary">
                                <h2>Financial Summary</h2>
                                <p><strong>Total Billed Amount:</strong> PKR ${totalFare.toLocaleString()}</p>
                                <p><strong>Total Amount Paid:</strong> PKR ${totalPaid.toLocaleString()}</p>
                                <p><strong>Balance Due:</strong> PKR ${(totalFare - totalPaid).toLocaleString()}</p>
                           </div>`;
  }

  const generateSupplierReport = (supplierExpenses: Expense[], allTrips: Trip[]): string => {
       if(supplierExpenses.length === 0) return '<p class="no-data">No transactions found for this supplier in the selected period.</p>';
       
       let totalAmount = 0;
       let reportHtml = `
            <table>
                <thead><tr><th>Date</th><th>Trip ID</th><th>Vehicle</th><th>Description</th><th>Amount (PKR)</th></tr></thead>
                <tbody>
       `;

       supplierExpenses.forEach(exp => {
           totalAmount += exp.amount;
           const trip = allTrips.find(t => t.id === exp.tripId);
           reportHtml += `<tr>
                <td>${formatDate(exp.date)}</td>
                <td>${exp.tripId}</td>
                <td>${trip?.vehicleReg || 'N/A'}</td>
                <td>${exp.description}</td>
                <td>${exp.amount.toLocaleString()}</td>
            </tr>`;
       });
       
       reportHtml += '</tbody></table>';

       return reportHtml + `<div class="summary">
                                <h2>Summary</h2>
                                <p><strong>Total Amount Owed to Supplier:</strong> PKR ${totalAmount.toLocaleString()}</p>
                           </div>`;
  }

  const generateCityReport = (cityTrips: Trip[], cityId: string): string => {
        if(cityTrips.length === 0) return '<p class="no-data">No trips found involving this city in the selected period.</p>';
        
        let tripsOriginated = 0;
        let tripsTerminated = 0;
        let reportHtml = `
            <table>
                <thead><tr><th>Trip ID</th><th>Route</th><th>Date</th><th>Role</th></tr></thead>
                <tbody>
        `;
        cityTrips.forEach(trip => {
            const role = trip.route[0] === cityId ? 'Origin' : trip.route[trip.route.length - 1] === cityId ? 'Destination' : 'Transit';
            if (role === 'Origin') tripsOriginated++;
            if (role === 'Destination') tripsTerminated++;
            reportHtml += `<tr>
                <td>${trip.id}</td>
                <td>${trip.routeName}</td>
                <td>${formatDate(trip.startDate)}</td>
                <td>${role}</td>
            </tr>`;
        });
        reportHtml += '</tbody></table>';

        return reportHtml + `<div class="summary">
                                <h2>City Activity Summary</h2>
                                <p><strong>Trips Originated:</strong> ${tripsOriginated}</p>
                                <p><strong>Trips Terminated:</strong> ${tripsTerminated}</p>
                            </div>`;
  }


  return (
    <div className="grid gap-6">
       <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>
            Select a report type and date range to generate a detailed report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <ReportAccordionItem
              value="vehicle"
              title="Vehicle Wise Report"
              icon={Truck}
              items={vehicles.map(v => ({ value: v.id, label: `${v.registrationNumber} (${v.model})` }))}
              onGenerate={handleGenerateReport}
              fromDate={fromDate}
              toDate={toDate}
              setFromDate={setFromDate}
              setToDate={setToDate}
              isAdmin={isAdmin}
            />
             <ReportAccordionItem
              value="trip"
              title="Trip Wise Report"
              icon={GanttChartSquare}
              items={trips.map(t => ({ value: t.id, label: `${t.id} (${t.routeName})` }))}
              onGenerate={handleGenerateReport}
              fromDate={fromDate}
              toDate={toDate}
              setFromDate={setFromDate}
              setToDate={setToDate}
              isAdmin={isAdmin}
            />
            <ReportAccordionItem
              value="driver"
              title="Driver Wise Report"
              icon={Users}
              items={drivers.map(d => ({ value: d.id, label: d.name }))}
              onGenerate={handleGenerateReport}
              fromDate={fromDate}
              toDate={toDate}
              setFromDate={setFromDate}
              setToDate={setToDate}
              isAdmin={isAdmin}
            />
             <ReportAccordionItem
              value="customer"
              title="Customer Wise Report"
              icon={Building2}
              items={customers.map(c => ({ value: c.id, label: c.name }))}
              onGenerate={handleGenerateReport}
              fromDate={fromDate}
              toDate={toDate}
              setFromDate={setFromDate}
              setToDate={setToDate}
              isAdmin={isAdmin}
            />
            <ReportAccordionItem
              value="supplier"
              title="Supplier Wise Report"
              icon={Briefcase}
              items={suppliers.map(s => ({ value: s.id, label: s.name }))}
              onGenerate={handleGenerateReport}
              fromDate={fromDate}
              toDate={toDate}
              setFromDate={setFromDate}
              setToDate={setToDate}
              isAdmin={isAdmin}
            />
            <ReportAccordionItem
              value="city"
              title="City Wise Report"
              icon={MapPin}
              items={cities.map(r => ({ value: r.id, label: r.name }))}
              onGenerate={handleGenerateReport}
              fromDate={fromDate}
              toDate={toDate}
              setFromDate={setFromDate}
              setToDate={setToDate}
              isAdmin={isAdmin}
            />
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}


interface ReportAccordionItemProps {
    value: string;
    title: string;
    icon: React.ElementType;
    items: { value: string; label: string }[];
    onGenerate: (reportType: string, selectedItemId?: string, selectedItemLabel?: string) => void;
    fromDate: Date | undefined;
    toDate: Date | undefined;
    setFromDate: (date: Date | undefined) => void;
    setToDate: (date: Date | undefined) => void;
    isAdmin?: boolean;
}

function ReportAccordionItem({ value, title, icon: Icon, items, onGenerate, fromDate, toDate, setFromDate, setToDate, isAdmin }: ReportAccordionItemProps) {
    const [selectedItemId, setSelectedItemId] = React.useState<string>();
    const [selectedItemLabel, setSelectedItemLabel] = React.useState<string>();
    
    return (
        <AccordionItem value={value}>
            <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {title}
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 bg-muted/20 rounded-b-md">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor={`${value}-select`}>Select Item</Label>
                        <Select onValueChange={(val) => {
                            const selected = items.find(i => i.value === val);
                            setSelectedItemId(selected?.value);
                            setSelectedItemLabel(selected?.label);
                        }}>
                            <SelectTrigger id={`${value}-select`}>
                                <SelectValue placeholder={`Select a ${value}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {items.map(item => (
                                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>From</Label>
                        <DatePicker date={fromDate} setDate={setFromDate} disablePast={!isAdmin} />
                    </div>
                    <div className="space-y-2">
                        <Label>To</Label>
                        <DatePicker date={toDate} setDate={setToDate} disablePast={!isAdmin} />
                    </div>
                    <Button onClick={() => onGenerate(title, selectedItemId, selectedItemLabel)} className="w-full lg:w-auto" disabled={!selectedItemId}>
                        <FileDown className="mr-2" />
                        Generate Report
                    </Button>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
