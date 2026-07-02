-- Sécurise les policies INSERT trop permissives (audit sécurité 02/07/2026)
--
-- #1 live_messages : la policy WITH CHECK (true) permettait à tout utilisateur
--    d'insérer un message type 'super_chat' avec un montant arbitraire, donc
--    d'afficher un faux Super Chat sans payer. Les vrais Super Chats sont insérés
--    par /api/stripe/webhook avec la service_role key, qui contourne la RLS —
--    le client ne doit donc jamais pouvoir écrire type 'super_chat'/'system'.
--
-- #2 sondages : la policy WITH CHECK (true) permettait de créer un sondage rattaché
--    au graft de n'importe qui. On restreint la création au propriétaire du graft.

-- ── #1 live_messages ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "live_messages_insert" ON live_messages;

CREATE POLICY "live_messages_insert" ON live_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND type   = 'message'
    AND amount = 0
  );

-- ── #2 sondages ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "sondages_insert" ON sondages;

CREATE POLICY "sondages_insert" ON sondages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM grafts g
      WHERE g.id = graft_id
        AND g.user_id = auth.uid()
    )
  );
