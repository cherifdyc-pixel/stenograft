-- Champs pour le nouvel onboarding dashboard
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}';

-- Les utilisateurs qui ont déjà complété l'ancien onboarding ne le verront plus
UPDATE profiles SET onboarding_completed = true WHERE onboarded = true;
