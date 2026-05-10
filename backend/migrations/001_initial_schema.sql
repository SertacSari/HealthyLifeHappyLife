-- ENS492 HealthyLifeHappyLife - Initial Database Schema
-- Migration 001: Core tables for MVP

BEGIN;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  goal_calories INTEGER DEFAULT 2000,
  goal_workouts_per_week INTEGER DEFAULT 3,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(140) NOT NULL,
  calories INTEGER NOT NULL CHECK (calories > 0),
  protein INTEGER DEFAULT 0 CHECK (protein >= 0),
  carbs INTEGER DEFAULT 0 CHECK (carbs >= 0),
  fats INTEGER DEFAULT 0 CHECK (fats >= 0),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(140) NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  calories_burned INTEGER DEFAULT 0 CHECK (calories_burned >= 0),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  reminder_time TIME DEFAULT '20:00',
  frequency VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekdays', 'custom')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows table (social)
CREATE TABLE IF NOT EXISTS follows (
  follower_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_user_id, following_user_id),
  CHECK (follower_user_id != following_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMIT;
