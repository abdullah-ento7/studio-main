
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Driver, Vehicle, Customer, City, Supplier, Trip, Expense, Owner, User, Bill } from "@/lib/types";
import { supabase } from '@/lib/supabaseClient';

interface DataContextProps {
    drivers: Driver[];
    setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
    vehicles: Vehicle[];
    setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    cities: City[];
    setCities: React.Dispatch<React.SetStateAction<City[]>>;
    suppliers: Supplier[];
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
    trips: Trip[];
    setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    owners: Owner[];
    setOwners: React.Dispatch<React.SetStateAction<Owner[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    savedBills: Bill[];
    setSavedBills: React.Dispatch<React.SetStateAction<Bill[]>>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [owners, setOwners] = useState<Owner[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [savedBills, setSavedBills] = useState<Bill[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const { data: drivers, error: driversError } = await supabase.from('drivers').select('*');
            if (driversError) console.error('Error fetching drivers:', driversError); else setDrivers(drivers as Driver[]);

            const { data: vehicles, error: vehiclesError } = await supabase.from('vehicles').select('*');
            if (vehiclesError) console.error('Error fetching vehicles:', vehiclesError); else setVehicles(vehicles as Vehicle[]);

            const { data: customers, error: customersError } = await supabase.from('customers').select('*');
            if (customersError) console.error('Error fetching customers:', customersError); else setCustomers(customers as Customer[]);

            const { data: cities, error: citiesError } = await supabase.from('cities').select('*');
            if (citiesError) console.error('Error fetching cities:', citiesError); else setCities(cities as City[]);

            const { data: suppliers, error: suppliersError } = await supabase.from('suppliers').select('*');
            if (suppliersError) console.error('Error fetching suppliers:', suppliersError); else setSuppliers(suppliers as Supplier[]);

            const { data: trips, error: tripsError } = await supabase.from('trips').select('*');
            if (tripsError) console.error('Error fetching trips:', tripsError); else setTrips(trips as Trip[]);

            const { data: expenses, error: expensesError } = await supabase.from('expenses').select('*');
            if (expensesError) console.error('Error fetching expenses:', expensesError); else setExpenses(expenses as Expense[]);

            const { data: owners, error: ownersError } = await supabase.from('owners').select('*');
            if (ownersError) console.error('Error fetching owners:', ownersError); else setOwners(owners as Owner[]);

            const { data: usersData, error: usersError } = await supabase.from('users').select('*');
            if (usersError) {
                console.error('Error fetching users:', usersError);
                setUsers([]);
            } else {
                const adminUser: User = {
                    id: '0',
                    username: 'adminr',
                    password: '123456',
                    status: 'approved',
                    permissions: {
                        dashboard: true,
                        general: true,
                        expenses: true,
                        financials: true,
                        edit: true,
                        admin: true,
                    },
                };
                setUsers([...(usersData as User[]), adminUser]);
            }
        };

        fetchData();
    }, []);

    const value = {
        drivers, setDrivers,
        vehicles, setVehicles,
        customers, setCustomers,
        cities, setCities,
        suppliers, setSuppliers,
        trips, setTrips,
        expenses, setExpenses,
        owners, setOwners,
        users, setUsers,
        savedBills, setSavedBills,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
