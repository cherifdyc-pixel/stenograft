-- Coerce les nouvelles colonnes à leur valeur par défaut si NULL
-- (protège contre les INSERT positionnels de handle_new_user qui passent NULL explicitement)
CREATE OR REPLACE FUNCTION public.coalesce_profile_defaults()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.onboarding_completed := COALESCE(NEW.onboarding_completed, false);
  NEW.interests             := COALESCE(NEW.interests, '{}');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_defaults ON public.profiles;
CREATE TRIGGER trg_profile_defaults
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.coalesce_profile_defaults();
