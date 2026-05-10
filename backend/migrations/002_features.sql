-- Migration 002: Food catalog, water tracking, body measurements, workout templates

BEGIN;

-- Food catalog (pre-loaded meals)
CREATE TABLE IF NOT EXISTS food_catalog (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  calories INTEGER NOT NULL,
  protein NUMERIC(6,1) DEFAULT 0,
  carbs NUMERIC(6,1) DEFAULT 0,
  fats NUMERIC(6,1) DEFAULT 0,
  serving_size VARCHAR(50) DEFAULT '1 porsiyon',
  is_custom BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Water logs
CREATE TABLE IF NOT EXISTS water_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Body measurements
CREATE TABLE IF NOT EXISTS body_measurements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,1),
  height_cm NUMERIC(5,1),
  note VARCHAR(200),
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout templates
CREATE TABLE IF NOT EXISTS workout_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  exercises JSONB NOT NULL DEFAULT '[]',
  estimated_duration INTEGER DEFAULT 45,
  estimated_calories INTEGER DEFAULT 300
);

-- User favorites
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_id INTEGER NOT NULL REFERENCES food_catalog(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, food_id)
);

-- Add water goal and height to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS water_goal_ml INTEGER DEFAULT 2500;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,1);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_food_catalog_name ON food_catalog USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_food_catalog_category ON food_catalog(category);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user ON body_measurements(user_id, measured_at);

COMMIT;
