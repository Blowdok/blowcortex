-- Extensions Postgres requises par BlowCortex.
-- Exécuté automatiquement par l'image Postgres au premier démarrage.

-- pgcrypto : utilisé pour des fonctions de chiffrement et la génération d'UUID
-- (alternative à `uuid-ossp` recommandée par les versions récentes).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- citext : recherche d'emails et identifiants insensibles à la casse.
CREATE EXTENSION IF NOT EXISTS citext;
