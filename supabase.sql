

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "drivers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "routes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON "users";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "users";
DROP POLICY IF EXISTS "Allow admin to update user status" ON "users";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "drivers";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "vehicles";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "customers";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "routes";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "suppliers";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "trips";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "expenses";

-- Create policies for "users"
CREATE POLICY "Enable read access for authenticated users" ON "users"
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin to update user status" ON "users"
    FOR UPDATE
    USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' )
    WITH CHECK ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

-- Create policies for other tables to only allow access to authenticated users
CREATE POLICY "Enable all access for authenticated users" ON "drivers"
    FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON "vehicles"
    FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON "customers"
    FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON "routes"
    FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON "suppliers"
    FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON "trips"
    FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON "expenses"
    FOR ALL
    USING (auth.role() = 'authenticated');
