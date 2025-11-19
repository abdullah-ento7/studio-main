import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    const { username, password } = await request.json();

    if (!username || !password) {
        return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 });
    }

    const email = `${username}@jtn.com.pk`;

    try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (signInError) {
            return NextResponse.json({ message: 'Invalid username or password.' }, { status: 401 });
        }

        return NextResponse.json({ session: data.session });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
    }
}
