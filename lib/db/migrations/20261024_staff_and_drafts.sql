BEGIN;
ALTER TABLE public.hearing_schedules ADD COLUMN IF NOT EXISTS published_hearings jsonb;
ALTER TABLE public.hearing_schedules ADD COLUMN IF NOT EXISTS published_at timestamptz;
CREATE TABLE IF NOT EXISTS public.staff_users (
  id uuid PRIMARY KEY,
  email varchar(255) NOT NULL,
  role varchar(20) NOT NULL CHECK (role IN ('assessor', 'estagiario')),
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS staff_email_idx ON public.staff_users(email);
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_users FROM anon, authenticated;
COMMIT;
