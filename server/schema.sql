-- Heritage Sites Database Schema

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT,
  email TEXT,
  avatar_url TEXT
);

CREATE TABLE IF NOT EXISTS sites (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cave', 'temple', 'mountain')),
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  coordinates_lat DOUBLE PRECISION,
  coordinates_lng DOUBLE PRECISION,
  main_religion TEXT,
  founded_period TEXT,
  heritage_status TEXT,
  brief_intro TEXT,
  is_active_site BOOLEAN NOT NULL DEFAULT false,
  cover_image_url TEXT,
  thumbnail_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_relations (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  related_site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_events (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  year_or_period TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS site_media (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  is_cover_candidate BOOLEAN NOT NULL DEFAULT false,
  source_type TEXT NOT NULL CHECK (source_type IN ('official', 'my_photo', 'friend_photo', 'web_reference')),
  description TEXT
);

CREATE TABLE IF NOT EXISTS news_links (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_name TEXT,
  url TEXT NOT NULL,
  published_date TEXT,
  summary TEXT
);

CREATE TABLE IF NOT EXISTS checkins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visited_date TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkin_photos (
  id SERIAL PRIMARY KEY,
  checkin_id INTEGER NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS site_tags (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(site_id, tag_id)
);
