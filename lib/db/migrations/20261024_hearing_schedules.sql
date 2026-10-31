-- Apply to isolated Preview first. No real hearing data is seeded.
BEGIN;
CREATE TABLE IF NOT EXISTS public.hearing_schedules (
  week_start date PRIMARY KEY CHECK (extract(isodow FROM week_start) = 1),
  hearings jsonb NOT NULL CHECK (jsonb_typeof(hearings) = 'array'),
  is_published boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL
);
ALTER TABLE public.hearing_schedules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hearing_schedules FROM anon, authenticated;
COMMIT;
