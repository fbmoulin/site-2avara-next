-- Reversal of 20261116_rls_public_tables.sql. Emergency use only.
-- WARNING: this restores the previous state (Supabase default grants to anon/authenticated and RLS off),
-- which makes contact messages, appointments and demands readable again with the public anon key.
-- Take a backup and record the reason before running it. No data is read or changed.
BEGIN;
GRANT ALL ON public.contact_messages, public.appointments, public.demands, public.articles, public.news TO anon, authenticated;
ALTER TABLE public.contact_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.news DISABLE ROW LEVEL SECURITY;
COMMIT;
