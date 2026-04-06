-- Myanmar Foodie & Nightlife Bot Database Schema
-- Created for Turso (LibSQL) Database

-- Users table - Store all telegram users and their roles
CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    role INTEGER DEFAULT 0, -- 0=User, 1=ShopAdmin, 2=BotAdmin
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Shops table - Store shop/restaurant information
CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    township TEXT NOT NULL,
    vibe TEXT, -- e.g., 'Rooftop', 'Quiet', 'Family-friendly', 'Nightlife'
    map_url TEXT,
    owner_id INTEGER NOT NULL, -- Foreign key to users table
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(telegram_id)
);

-- Menus table - Store menu items for each shop
CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- Price in MMK (Kyats)
    photo_id TEXT, -- Telegram file_id for menu item photo
    category TEXT, -- e.g., 'Main Course', 'Drink', 'Dessert'
    available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id)
);

-- Reviews table - Store user reviews and ratings
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id),
    FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

-- User favorites table - Store user's favorite shops
CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    shop_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(telegram_id),
    FOREIGN KEY (shop_id) REFERENCES shops(id),
    UNIQUE(user_id, shop_id) -- Prevent duplicates
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shops_township ON shops(township);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
CREATE INDEX IF NOT EXISTS idx_shops_vibe ON shops(vibe);
CREATE INDEX IF NOT EXISTS idx_menus_shop_id ON menus(shop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_shop_id ON reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);

-- Insert default bot admin (you can change this telegram_id)
INSERT OR IGNORE INTO users (telegram_id, username, role) 
VALUES (7398914587, 'hidecard1', 2);
