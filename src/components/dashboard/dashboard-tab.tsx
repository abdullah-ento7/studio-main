
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Truck, MapPin, TrendingUp, TrendingDown, Repeat, ArrowRightLeft } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useData } from '@/context/data-context';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getShipmentFare } from '@/lib/utils';


export default function DashboardTab() {
  const { drivers, vehicles, cities, trips, expenses } = useData();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeVehicles = vehicles.filter(v => v.status === 'active');
  const activeDrivers = drivers.filter(d => d.status === 'active');

  const tripsLast30Days = trips.filter(t => {
      const tripDate = new Date(t.startDate);
      return tripDate >= thirtyDaysAgo;
  }).length;
  
  const revenueLast30Days = trips
      .filter(t => new Date(t.startDate) >= thirtyDaysAgo && (t.status === 'completed' || t.status === 'active'))
      .reduce((acc, trip) => {
          return acc + (trip.shipments.reduce((sAcc, shipment) => sAcc + getShipmentFare(shipment), 0)); 
      }, 0);

  const expenseLast30Days = expenses
      .filter(e => new Date(e.date) >= thirtyDaysAgo && e.status === 'approved')
      .reduce((acc, curr) => acc + curr.amount, 0);
      
  const profitLast30Days = revenueLast30Days - expenseLast30Days;

  const monthlyProfitData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = d.toLocaleString('default', { month: 'short' });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    
    const monthRevenue = trips
        .filter(t => {
            if (t.status !== 'completed' && t.status !== 'active') return false;
            const tripDate = new Date(t.startDate);
            return tripDate >= monthStart && tripDate <= monthEnd;
        })
        .reduce((acc, trip) => {
             return acc + (trip.shipments.reduce((sAcc, shipment) => sAcc + getShipmentFare(shipment), 0));
        }, 0);
      
    const monthExpense = expenses
      .filter(e => {
          const expenseDate = new Date(e.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd && e.status === 'approved';
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    const net = monthRevenue - monthExpense;

    return { 
        month, 
        profit: net > 0 ? net : 0, 
        loss: net < 0 ? Math.abs(net) : 0 
    };
  }).reverse();

  const expenseByCategoryData = Object.entries(
    expenses
      .filter(e => e.status === 'approved')
      .reduce((acc, curr) => {
        if(curr.category) {
            const categoryName = curr.category.charAt(0).toUpperCase() + curr.category.slice(1);
            acc[categoryName] = (acc[categoryName] || 0) + curr.amount;
        }
        return acc;
      }, {} as Record<string, number>)
  ).map(([name, value], index) => ({
    name,
    value,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`
  }));

  const statCards = [
      { title: 'Total Vehicles', value: vehicles.length, active: activeVehicles.length, icon: Truck, color: 'text-blue-500', details: activeVehicles.map(v => `${v.registrationNumber} (${v.model})`) },
      { title: 'Total Drivers', value: drivers.length, active: activeDrivers.length, icon: Users, color: 'text-green-500', details: activeDrivers.map(d => d.name) },
      { title: 'Total Cities', value: cities.length, icon: MapPin, color: 'text-orange-500', details: cities.map(r => r.name) },
      { title: 'Total Trips (30 Days)', value: tripsLast30Days, icon: Repeat, color: 'text-indigo-500' },
      { title: 'Revenue (30 Days)', value: `PKR ${revenueLast30Days.toLocaleString()}`, icon: TrendingUp, color: 'text-lime-500' },
      { title: 'Expense (30 Days)', value: `PKR ${expenseLast30Days.toLocaleString()}`, icon: TrendingDown, color: 'text-red-500' },
      { title: 'Profit (30 Days)', value: `PKR ${profitLast30Days.toLocaleString()}`, icon: ArrowRightLeft, color: 'text-amber-500' },
  ];
  
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
            <CardHeader>
                <CardTitle>Monthly Profit & Loss</CardTitle>
                <CardDescription>Last 6 months performance</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyProfitData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                    }}
                    formatter={(value) => `PKR ${Number(value).toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="profit" fill="hsl(var(--accent))" name="Profit" />
                    <Bar
                    dataKey="loss"
                    fill="hsl(var(--destructive))"
                    name="Loss"
                    />
                    <Line type="monotone" dataKey="profit" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Profit Trend" />
                    <Line type="monotone" dataKey="loss" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Loss Trend" />
                </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>Breakdown of current operational expenses (approved only)</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                    data={expenseByCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    >
                    {expenseByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    </Pie>
                    <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                    }}
                    formatter={(value) => `PKR ${Number(value).toLocaleString()}`}
                    />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>
        </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  active?: number;
  icon: React.ElementType;
  color: string;
  details?: string[];
}

function StatCard({ title, value, active, icon: Icon, color, details }: StatCardProps) {
  const cardContent = (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="text-2xl font-bold">{value}</div>
        {active !== undefined && (
          <p className="text-xs text-muted-foreground">{active} Active</p>
        )}
      </CardContent>
    </Card>
  );

  if (details && details.length > 0) {
    return (
      <Popover>
        <PopoverTrigger asChild><div className="cursor-pointer">{cardContent}</div></PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Active {title.replace('Total ', '')}</h4>
              <ul className="text-sm text-muted-foreground list-disc pl-5">
                {details.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return cardContent;
}
