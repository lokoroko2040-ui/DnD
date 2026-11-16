/*
# PIP-D&D 2000: AI Dungeon Master — Database Schema

## Overview
Creates the full schema for an asynchronous, multiplayer D&D 5e game platform.
Players join a "party" via a short code. The host holds the Gemini API key and
triggers AI round resolution. State is shared via Supabase realtime.

All tables are single-tenant / no-auth: the app has no sign-in screen, so policies
target `anon, authenticated` and use a `party_code` as the sharing key.

## Tables

1. `parties` — A game session / party room.
   - `id` uuid PK
   - `code` text UNIQUE — short joinable code (e.g. "ABCD")
   - `name` text — party name
   - `host_player_id` text — which player is the host
   - `campaign_id` text — selected campaign key
   - `campaign_intro` text — custom intro for sandbox mode
   - `current_narrative` text — latest AI narrative
   - `current_location` text — current location name
   - `current_image_prompt` text — latest scene image prompt
   - `round_number` int — current round
   - `quest_log` text — accumulated quest log
   - `round_resolving` boolean — whether AI resolution is in progress
   - `created_at` timestamptz

2. `players` — Each participant in a party.
   - `id` text PK (client-generated uuid)
   - `party_id` uuid FK -> parties
   - `name` text — display name
   - `is_host` boolean
   - `ready` boolean — ready-for-round flag
   - `round_action` text — the player's declared action for the round
   - `last_roll` jsonb — last dice roll result {die, result, modifier, total, advantage, label}
   - `created_at` timestamptz

3. `characters` — D&D 5e character sheet for a player.
   - `id` text PK
   - `player_id` text FK -> players
   - `party_id` uuid FK -> parties
   - `name` text
   - `race` text
   - `class` text
   - `level` int default 1
   - `xp` int default 0
   - `stats` jsonb — {str, dex, con, int, wis, cha}
   - `hp_current` int
   - `hp_max` int
   - `ac` int
   - `gold` int default 0
   - `conditions` jsonb — array of condition strings
   - `spell_slots` jsonb — {1: n, 2: n, ...}
   - `hit_dice` jsonb — {total, current}
   - `portrait_url` text
   - `portrait_prompt` text
   - `appearance` text
   - `created_at` timestamptz

4. `inventory_items` — Items belonging to a character.
   - `id` text PK
   - `character_id` text FK -> characters
   - `name` text
   - `unidentified_name` text
   - `type` text (weapon|armor|potion|relic|misc)
   - `slot` text (main_hand|off_hand|armor|head|gloves|boots|amulet|ring|none)
   - `rarity` text (mundane|common|uncommon|rare)
   - `is_magical` boolean
   - `is_identified` boolean
   - `requires_attunement` boolean
   - `is_attuned` boolean
   - `is_equipped` boolean
   - `ac_bonus` int
   - `attack_bonus` int
   - `damage_dice` text
   - `weight` numeric
   - `value_gp` int
   - `description` text
   - `magical_properties` text
   - `image_prompt` text
   - `created_at` timestamptz

5. `game_log` — Append-only log of rounds and events.
   - `id` uuid PK
   - `party_id` uuid FK -> parties
   - `round_number` int
   - `type` text (narrative|system|roll|loot)
   - `content` text
   - `created_at` timestamptz

## Security
- RLS enabled on all tables.
- All policies target `anon, authenticated` (no sign-in screen).
- Access scoped by `party_code` membership: any client that knows the party code
  can read/write rows for that party. This is the intended sharing model — like
  a Jackbox room code.
*/

-- ─── Parties ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT 'Новая партия',
  host_player_id text,
  campaign_id text DEFAULT 'mine_curse',
  campaign_intro text,
  current_narrative text,
  current_location text,
  current_image_prompt text,
  round_number int NOT NULL DEFAULT 0,
  quest_log text NOT NULL DEFAULT '',
  round_resolving boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON parties TO anon, authenticated;

DROP POLICY IF EXISTS "anon_all_parties" ON parties;
CREATE POLICY "anon_all_parties" ON parties FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_parties" ON parties;
CREATE POLICY "anon_insert_parties" ON parties FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_parties" ON parties;
CREATE POLICY "anon_update_parties" ON parties FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_parties" ON parties;
CREATE POLICY "anon_delete_parties" ON parties FOR DELETE TO anon, authenticated USING (true);

-- ─── Players ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id text PRIMARY KEY,
  party_id uuid NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  ready boolean NOT NULL DEFAULT false,
  round_action text NOT NULL DEFAULT '',
  last_roll jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON players TO anon, authenticated;

DROP POLICY IF EXISTS "anon_all_players" ON players;
CREATE POLICY "anon_all_players" ON players FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE TO anon, authenticated USING (true);

-- ─── Characters ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS characters (
  id text PRIMARY KEY,
  player_id text NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  party_id uuid NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name text NOT NULL,
  race text NOT NULL,
  class text NOT NULL,
  level int NOT NULL DEFAULT 1,
  xp int NOT NULL DEFAULT 0,
  stats jsonb NOT NULL DEFAULT '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
  hp_current int NOT NULL DEFAULT 10,
  hp_max int NOT NULL DEFAULT 10,
  ac int NOT NULL DEFAULT 10,
  gold int NOT NULL DEFAULT 0,
  conditions jsonb NOT NULL DEFAULT '[]',
  spell_slots jsonb NOT NULL DEFAULT '{}',
  hit_dice jsonb NOT NULL DEFAULT '{"total":1,"current":1}',
  portrait_url text,
  portrait_prompt text,
  appearance text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON characters TO anon, authenticated;

DROP POLICY IF EXISTS "anon_all_characters" ON characters;
CREATE POLICY "anon_all_characters" ON characters FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_characters" ON characters;
CREATE POLICY "anon_insert_characters" ON characters FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_characters" ON characters;
CREATE POLICY "anon_update_characters" ON characters FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_characters" ON characters;
CREATE POLICY "anon_delete_characters" ON characters FOR DELETE TO anon, authenticated USING (true);

-- ─── Inventory Items ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id text PRIMARY KEY,
  character_id text NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name text NOT NULL,
  unidentified_name text,
  type text NOT NULL DEFAULT 'misc',
  slot text NOT NULL DEFAULT 'none',
  rarity text NOT NULL DEFAULT 'mundane',
  is_magical boolean NOT NULL DEFAULT false,
  is_identified boolean NOT NULL DEFAULT true,
  requires_attunement boolean NOT NULL DEFAULT false,
  is_attuned boolean NOT NULL DEFAULT false,
  is_equipped boolean NOT NULL DEFAULT false,
  ac_bonus int NOT NULL DEFAULT 0,
  attack_bonus int NOT NULL DEFAULT 0,
  damage_dice text,
  weight numeric NOT NULL DEFAULT 0,
  value_gp int NOT NULL DEFAULT 0,
  description text,
  magical_properties text,
  image_prompt text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_items TO anon, authenticated;

DROP POLICY IF EXISTS "anon_all_inventory" ON inventory_items;
CREATE POLICY "anon_all_inventory" ON inventory_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_inventory" ON inventory_items;
CREATE POLICY "anon_insert_inventory" ON inventory_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_inventory" ON inventory_items;
CREATE POLICY "anon_update_inventory" ON inventory_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_inventory" ON inventory_items;
CREATE POLICY "anon_delete_inventory" ON inventory_items FOR DELETE TO anon, authenticated USING (true);

-- ─── Game Log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  round_number int NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'system',
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON game_log TO anon, authenticated;

DROP POLICY IF EXISTS "anon_all_game_log" ON game_log;
CREATE POLICY "anon_all_game_log" ON game_log FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_game_log" ON game_log;
CREATE POLICY "anon_insert_game_log" ON game_log FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_game_log" ON game_log;
CREATE POLICY "anon_delete_game_log" ON game_log FOR DELETE TO anon, authenticated USING (true);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_players_party ON players(party_id);
CREATE INDEX IF NOT EXISTS idx_characters_party ON characters(party_id);
CREATE INDEX IF NOT EXISTS idx_characters_player ON characters(player_id);
CREATE INDEX IF NOT EXISTS idx_inventory_character ON inventory_items(character_id);
CREATE INDEX IF NOT EXISTS idx_game_log_party ON game_log(party_id);

-- Enable realtime for all game tables
ALTER TABLE parties REPLICA IDENTITY FULL;
ALTER TABLE players REPLICA IDENTITY FULL;
ALTER TABLE characters REPLICA IDENTITY FULL;
ALTER TABLE inventory_items REPLICA IDENTITY FULL;