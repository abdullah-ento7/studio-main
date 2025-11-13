
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Driver, Vehicle, Customer, City, Supplier, Trip, Expense, Owner, User, Bill } from "@/lib/types";

// By setting the initial data to empty arrays, we ensure that on the next load,
// any data stored in localStorage will be overwritten with a clean slate.
const initialDrivers: Driver[] = [];
const initialVehicles: Vehicle[] = [];
const initialCustomers: Customer[] = [];
const initialCities: City[] = [];
const initialSuppliers: Supplier[] = [];
const initialTrips: Trip[] = [];
const initialExpenses: Expense[] = [];
const initialOwners: Owner[] = [];

// In a real app, users would come from a database / auth provider
const initialUsers: User[] = [
    { id: 'U1', username: 'admin', password: '123456', permissions: { dashboard: true, general: true, expenses: true, financials: true, edit: true, admin: true } },
    { id: 'U2', username: 'manager', password: '222', permissions: { dashboard: true, general: true, expenses: true, financials: true, edit: true, admin: false } },
    { id: 'U3', username: 'dataentry', password: '333', permissions: { dashboard: false, general: true, expenses: true, financials: false, edit: false, admin: false } },
];

// Helper function to get initial state from localStorage or fallback
const getInitialState = <T>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') {
        return fallback;
    }
    try {
        const item = window.localStorage.getItem(key);
        // On first load after this change, the fallback (empty array) will be used.
        // Subsequent loads will use the data from localStorage.
        return item ? JSON.parse(item) : fallback;
    } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return fallback;
    }
};


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
    const [drivers, setDrivers] = useState<Driver[]>(() => getInitialState('drivers', initialDrivers));
    const [vehicles, setVehicles] = useState<Vehicle[]>(() => getInitialState('vehicles', initialVehicles));
    const [customers, setCustomers] = useState<Customer[]>(() => getInitialState('customers', initialCustomers));
    const [cities, setCities] = useState<City[]>(() => getInitialState('cities', initialCities));
    const [suppliers, setSuppliers] = useState<Supplier[]>(() => getInitialState('suppliers', initialSuppliers));
    const [trips, setTrips] = useState<Trip[]>(() => getInitialState('trips', initialTrips));
    const [expenses, setExpenses] = useState<Expense[]>(() => getInitialState('expenses', initialExpenses));
    const [owners, setOwners] = useState<Owner[]>(() => getInitialState('owners', initialOwners));
    const [users, setUsers] = useState<User[]>(() => getInitialState('users', initialUsers));
    const [savedBills, setSavedBills] = useState<Bill[]>(() => getInitialState('savedBills', []));

    // Effects to persist state to localStorage
    useEffect(() => { localStorage.setItem('drivers', JSON.stringify(drivers)); }, [drivers]);
    useEffect(() => { localStorage.setItem('vehicles', JSON.stringify(vehicles)); }, [vehicles]);
    useEffect(() => { localStorage.setItem('customers', JSON.stringify(customers)); }, [customers]);
    useEffect(() => { localStorage.setItem('cities', JSON.stringify(cities)); }, [cities]);
    useEffect(() => { localStorage.setItem('suppliers', JSON.stringify(suppliers)); }, [suppliers]);
    useEffect(() => { localStorage.setItem('trips', JSON.stringify(trips)); }, [trips]);
    useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
    useEffect(() => { localStorage.setItem('owners', JSON.stringify(owners)); }, [owners]);
    useEffect(() => { localStorage.setItem('users', JSON.stringify(users)); }, [users]);
    useEffect(() => { localStorage.setItem('savedBills', JSON.stringify(savedBills)); }, [savedBills]);

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
