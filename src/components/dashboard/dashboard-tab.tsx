
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {statCards.map((card, index) => (
            <StatCard key={index} {...card} />
            ))}
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
            <Card className="lg:col-span-3 bg-white/50 dark:bg-black/50 backdrop-blur-xl border-white/20 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Monthly Profit & Loss</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">Last 6 months performance</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={monthlyProfitData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--muted-foreground), 0.2)" />
                        <XAxis 
                            dataKey="month" 
                            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                            tickLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis 
                            tickFormatter={(value) => `PKR ${Number(value) / 1000}k`} 
                            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                            tickLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                                color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value) => `PKR ${Number(value).toLocaleString()}`}
                        />
                        <Legend wrapperStyle={{ fontSize: '14px' }} />
                        <Bar dataKey="profit" fill="hsl(var(--primary))" name="Profit" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="loss" fill="hsl(var(--destructive))" name="Loss" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="profit" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Profit Trend" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="lg:col-span-2 bg-white/50 dark:bg-black/50 backdrop-blur-xl border-white/20 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Expenses by Category</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">Breakdown of approved expenses</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                        <Pie
                        data={expenseByCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                        {expenseByCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"/>
                        ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                                color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value, name) => [`PKR ${Number(value).toLocaleString()}`, name]}
                        />
                        <Legend 
                            formatter={(value, entry) => <span className="text-foreground/80">{value}</span>} 
                        />
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
    const card = (
        <Card className="relative overflow-hidden group bg-white/50 dark:bg-black/50 backdrop-blur-xl border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
            <div className={`absolute top-0 right-0 -m-4 h-24 w-24 rounded-full ${color.replace('text-', 'bg-').replace('-500', '/20')} opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-foreground/80">{title}</CardTitle>
                <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground">{value}</div>
                {active !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">{active} Active</p>
                )}
            </CardContent>
        </Card>
    );

  if (details && details.length > 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="cursor-pointer h-full">{card}</div>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-white/80 dark:bg-black/80 backdrop-blur-md border-white/30">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Active {title.replace('Total ', '')}</h4>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                {details.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return card;
}
