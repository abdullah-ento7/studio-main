
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
    refreshUsers: () => Promise<void>;
    refreshBills: () => Promise<void>;
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

    const refreshUsers = async () => {
        const { data: usersData, error: usersError } = await supabase.from('users').select('*');
        if (usersError) {
            console.error('Error fetching users:', usersError);
        } else {
            setUsers(usersData as User[]);
        }
    };
    
    const refreshBills = async () => {
        const { data: billsData, error: billsError } = await supabase.from('bills').select('*');
        if (billsError) {
            console.error('Error fetching bills:', billsError);
        } else {
            setSavedBills(billsData as Bill[]);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const [
                driversRes,
                vehiclesRes,
                customersRes,
                citiesRes,
                suppliersRes,
                tripsRes,
                expensesRes,
                ownersRes,
                usersRes,
                billsRes
            ] = await Promise.all([
                supabase.from('drivers').select('*'),
                supabase.from('vehicles').select('*'),
                supabase.from('customers').select('*'),
                supabase.from('cities').select('*'),
                supabase.from('suppliers').select('*'),
                supabase.from('trips').select('*'),
                supabase.from('expenses').select('*'),
                supabase.from('owners').select('*'),
                supabase.from('users').select('*'),
                supabase.from('bills').select('*')
            ]);

            if (driversRes.error) console.error('Error fetching drivers:', driversRes.error); else setDrivers(driversRes.data as Driver[]);
            if (vehiclesRes.error) console.error('Error fetching vehicles:', vehiclesRes.error); else setVehicles(vehiclesRes.data as Vehicle[]);
            if (customersRes.error) console.error('Error fetching customers:', customersRes.error); else setCustomers(customersRes.data as Customer[]);
            if (citiesRes.error) console.error('Error fetching cities:', citiesRes.error); else setCities(citiesRes.data as City[]);
            if (suppliersRes.error) console.error('Error fetching suppliers:', suppliersRes.error); else setSuppliers(suppliersRes.data as Supplier[]);
            if (tripsRes.error) console.error('Error fetching trips:', tripsRes.error); else setTrips(tripsRes.data as Trip[]);
            if (expensesRes.error) console.error('Error fetching expenses:', expensesRes.error); else setExpenses(expensesRes.data as Expense[]);
            if (ownersRes.error) console.error('Error fetching owners:', ownersRes.error); else setOwners(ownersRes.data as Owner[]);
            if (usersRes.error) console.error('Error fetching users:', usersRes.error); else setUsers(usersRes.data as User[]);
            if (billsRes.error) console.error('Error fetching bills:', billsRes.error); else setSavedBills(billsRes.data as Bill[]);
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
        refreshUsers,
        refreshBills,
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
