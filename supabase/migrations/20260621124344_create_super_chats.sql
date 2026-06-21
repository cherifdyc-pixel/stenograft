-- Super Chats : paiements Stripe confirmés
CREATE TABLE IF NOT EXISTS public.super_chats (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  live_id           text        NOT NULL,
  montant           integer     NOT NULL CHECK (montant IN (2, 5, 10, 20, 50, 100)),
  couleur           text        NOT NULL DEFAULT '#C9A24B',
  message           text        NOT NULL DEFAULT '',
  stripe_payment_id text        NOT NULL UNIQUE,
  status            text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Index pour requêtes par live
CREATE INDEX IF NOT EXISTS super_chats_live_id_idx ON public.super_chats (live_id, created_at DESC);

-- RLS
ALTER TABLE public.super_chats ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les super chats d'un live
CREATE POLICY "super_chats_select" ON public.super_chats
  FOR SELECT USING (true);

-- Seul le service role (webhook) peut écrire — les clients n'insèrent jamais directement
-- (pas de policy INSERT/UPDATE pour les utilisateurs authentifiés)
