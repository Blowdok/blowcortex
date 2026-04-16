-- Migration manuelle : impose l'append-only sur audit_log au niveau base.
-- À appliquer après la première migration Drizzle qui crée la table.
-- Bloque toute UPDATE ou DELETE par un trigger BEFORE qui lève une exception.

CREATE OR REPLACE FUNCTION enforce_audit_log_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log est append-only : opération % interdite', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION enforce_audit_log_append_only();

DROP TRIGGER IF EXISTS audit_log_no_delete ON audit_log;
CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION enforce_audit_log_append_only();
