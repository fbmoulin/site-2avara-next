-- SPEC-PORTAL-001 R1.1. Applied to production on 20/11/2026 (after the two 20261024 migrations).
-- Blocks reads/writes through the public Supabase REST API (anon key) on the five legacy tables.
-- The application reaches these tables only from the server (Drizzle/postgres-js, role postgres),
-- which bypasses RLS, so no policy is created. service_role is not changed.
-- Reversal: 20261116_rls_public_tables_rollback.sql. No data is read or changed.
BEGIN;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_messages, public.appointments, public.demands, public.articles, public.news FROM anon, authenticated;
COMMIT;
