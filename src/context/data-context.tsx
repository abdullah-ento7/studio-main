'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { fetchData } from '@/lib/data';
import type { Driver, Vehicle, Customer, City, Supplier, Trip, Expense, Owner, User, Bill } from "@/lib/types";

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

    const refreshData = async () => {
        const tables = ['drivers', 'vehicles', 'customers', 'cities', 'suppliers', 'trips', 'expenses', 'owners', 'users', 'bills'];
        const setters = [setDrivers, setVehicles, setCustomers, setCities, setSuppliers, setTrips, setExpenses, setOwners, setUsers, setSavedBills];

        for (let i = 0; i < tables.length; i++) {
            const { data, error } = await fetchData(tables[i]);
            if (error) {
                console.error(`Error fetching ${tables[i]}:`, error);
            } else {
                setters[i](data as any);
            }
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const refreshUsers = async () => {
        const { data, error } = await fetchData('users');
        if (error) console.error('Error fetching users:', error); else setUsers(data as User[]);
    };

    const refreshBills = async () => {
        const { data, error } = await fetchData('bills');
        if (error) console.error('Error fetching bills:', error); else setSavedBills(data as Bill[]);
    };

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
