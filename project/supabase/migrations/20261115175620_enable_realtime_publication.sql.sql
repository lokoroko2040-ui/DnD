/*
# Enable Realtime on Game Tables

Adds all game tables to the `supabase_realtime` publication so that
`supabase.channel(...).on('postgres_changes', ...)` receives live updates
when any player modifies party state, characters, inventory, etc.

Without this, the realtime subscriptions in the frontend are silent —
changes only appear after a manual page reload.
*/

ALTER PUBLICATION supabase_realtime ADD TABLE parties;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE characters;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE game_log;
