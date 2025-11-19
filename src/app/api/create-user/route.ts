import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 });
  }

  // Validate username: 6 alphabetic characters
  if (!/^[a-zA-Z]{6}$/.test(username)) {
    return NextResponse.json({ message: 'Username must be 6 alphabetic characters.' }, { status: 400 });
  }

  // Validate password: 6 numeric characters
  if (!/^[0-9]{6}$/.test(password)) {
    return NextResponse.json({ message: 'Password must be 6 numeric characters.' }, { status: 400 });
  }

  const email = `${username}@jtn.com.pk`;

  try {
    // Check if the user already exists in the auth schema
    const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    if (listUsersError) {
      console.error('Error listing users:', listUsersError.message);
      return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return NextResponse.json({ message: 'Username is already taken.' }, { status: 409 });
    }

    // Determine the role and status for the new user
    const isFirstUser = users.length === 0;
    const userRole = isFirstUser ? 'admin' : 'user';
    const userStatus = isFirstUser ? 'approved' : 'pending';

    // Create the user in the auth schema
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm the email
      user_metadata: {
        username,
        role: userRole,
        status: userStatus,
        permissions: { admin: userRole === 'admin' },
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError.message);
      return NextResponse.json({ message: authError.message }, { status: 500 });
    }

    if (!authData.user) {
        return NextResponse.json({ message: 'Failed to create user.' }, { status: 500 });
    }

    // Insert the user profile into the public.users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        username,
        role: userRole,
        status: userStatus,
        permissions: { admin: userRole === 'admin' },
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError.message);
      // If profile insertion fails, we should probably delete the auth user to avoid orphaned users
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ message: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
