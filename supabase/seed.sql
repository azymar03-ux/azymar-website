-- Default Games Seeding for AZYMAR

insert into public.games (id, title, genre, rating, plays, badge, color, emoji, is_uploaded, visible)
values
  (1, 'City Racer', 'Racing', 4.8, '2.1M', 'HOT', '#FF6B35', '🏎️', false, true),
  (2, 'Merge Tactics', 'Action', 4.6, '1.4M', 'TRENDING', '#7C3AED', '⚔️', false, true),
  (3, 'Klondike', 'Puzzle', 4.5, '3.2M', null, '#059669', '🃏', false, true),
  (4, 'Granny 2', 'Horror', 4.7, '5.8M', 'HOT', '#DC2626', '👻', false, true),
  (5, 'Merge Dale', 'Casual', 4.4, '890K', 'NEW', '#D97706', '🌿', false, true),
  (6, 'Bathroom Escape', 'Casual', 4.3, '720K', null, '#0891B2', '🚪', false, true),
  (7, 'Space Arena', 'Action', 4.9, '4.1M', 'TRENDING', '#7C3AED', '🚀', false, true),
  (8, 'Idle Farm', 'Simulation', 4.2, '650K', 'NEW', '#16A34A', '🌾', false, true),
  (9, 'Neon Drift', 'Racing', 4.7, '1.8M', 'HOT', '#DB2777', '🌊', false, true)
on conflict (id) do update set
  title = excluded.title,
  genre = excluded.genre,
  rating = excluded.rating,
  plays = excluded.plays,
  badge = excluded.badge,
  color = excluded.color,
  emoji = excluded.emoji;
