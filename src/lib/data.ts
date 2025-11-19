import { supabase } from './supabaseClient';
import { unstable_noStore as noStore } from 'next/cache';
import { User, Trip, Customer, Vehicle, Owner, City, Expense, Bill, Supplier } from './types';

// Generic fetch function
async function fetchData<T>(table: string): Promise<{ data: T[] | null; error: any }> {
  noStore();
  const { data, error } = await supabase.from(table).select('*');
  return { data: data as T[] | null, error };
}

// Generic fetch by ID
async function fetchById<T>(table: string, id: string): Promise<{ data: T | null; error: any }> {
    noStore();
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    return { data: data as T | null, error };
}

// Generic create function
async function createRecord<T>(table: string, record: Partial<T>): Promise<{ data: T[] | null; error: any }> {
    const { data, error } = await supabase.from(table).insert([record]).select();
    return { data, error };
}

// Generic update function
async function updateRecord<T>(table: string, id: string, updates: Partial<T>): Promise<{ data: T[] | null; error: any }> {
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select();
    return { data, error };
}

// Generic delete function
async function deleteRecord(table: string, id: string): Promise<{ error: any }> {
    const { error } = await supabase.from(table).delete().eq('id', id);
    return { error };
}


export {
    fetchData,
    fetchById,
    createRecord,
    updateRecord,
    deleteRecord
}
