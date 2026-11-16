/*
# Add background column to characters

Adds a `background` text column to the `characters` table to store
the character's chosen background (Солдат, Преступник, etc.).
Nullable for backward compatibility with existing characters.
*/

ALTER TABLE characters ADD COLUMN IF NOT EXISTS background text;
