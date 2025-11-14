-- Drop existing triggers
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_jobs ON public.jobs;

-- Drop and recreate the function with proper search_path
DROP FUNCTION IF EXISTS public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_jobs
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();