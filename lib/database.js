const { createClient } = require('@libsql/client');
require('dotenv').config();

class Database {
    constructor() {
        this.client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });
    }

    // User operations
    async getUser(telegramId) {
        const result = await this.client.execute({
            sql: 'SELECT * FROM users WHERE telegram_id = ?',
            args: [telegramId]
        });
        return result.rows[0] || null;
    }

    async createUser(telegramId, username, firstName, lastName) {
        // Check if user already exists
        const existingUser = await this.getUser(telegramId);
        
        if (!existingUser) {
            // Only insert if user doesn't exist
            await this.client.execute({
                sql: 'INSERT INTO users (telegram_id, username, first_name, last_name) VALUES (?, ?, ?, ?)',
                args: [telegramId, username, firstName, lastName]
            });
        } else {
            // Update only user info, preserve role
            await this.client.execute({
                sql: 'UPDATE users SET username = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
                args: [username, firstName, lastName, telegramId]
            });
        }
    }

    async updateUserRole(telegramId, role) {
        await this.client.execute({
            sql: 'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
            args: [role, telegramId]
        });
    }

    // Shop operations
    async getShop(shopId) {
        const result = await this.client.execute({
            sql: 'SELECT s.*, u.username as owner_username FROM shops s JOIN users u ON s.owner_id = u.telegram_id WHERE s.id = ?',
            args: [shopId]
        });
        return result.rows[0] || null;
    }

    async getShopsByStatus(status = 'approved') {
        const result = await this.client.execute({
            sql: 'SELECT s.*, u.username as owner_username FROM shops s JOIN users u ON s.owner_id = u.telegram_id WHERE s.status = ? ORDER BY s.created_at DESC',
            args: [status]
        });
        return result.rows;
    }

    async getShopsByTownship(township) {
        const result = await this.client.execute({
            sql: 'SELECT s.*, u.username as owner_username FROM shops s JOIN users u ON s.owner_id = u.telegram_id WHERE s.township = ? AND s.status = ? ORDER BY s.created_at DESC',
            args: [township, 'approved']
        });
        return result.rows;
    }

    async getShopsByVibe(vibe) {
        const result = await this.client.execute({
            sql: 'SELECT s.*, u.username as owner_username FROM shops s JOIN users u ON s.owner_id = u.telegram_id WHERE s.vibe = ? AND s.status = ? ORDER BY s.created_at DESC',
            args: [vibe, 'approved']
        });
        return result.rows;
    }

    async createShop(name, description, township, vibe, mapUrl, ownerId) {
        const result = await this.client.execute({
            sql: 'INSERT INTO shops (name, description, township, vibe, map_url, owner_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
            args: [name, description, township, vibe, mapUrl, ownerId]
        });
        return result.rows[0].id;
    }

    async updateShopStatus(shopId, status) {
        await this.client.execute({
            sql: 'UPDATE shops SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            args: [status, shopId]
        });
    }

    async getShopsByOwner(ownerId) {
        const result = await this.client.execute({
            sql: 'SELECT * FROM shops WHERE owner_id = ? ORDER BY created_at DESC',
            args: [ownerId]
        });
        return result.rows;
    }

    // Menu operations
    async getMenuItems(shopId) {
        const result = await this.client.execute({
            sql: 'SELECT * FROM menus WHERE shop_id = ? AND available = 1 ORDER BY category, item_name',
            args: [shopId]
        });
        return result.rows;
    }

    async addMenuItem(shopId, itemName, description, price, photoId, category) {
        await this.client.execute({
            sql: 'INSERT INTO menus (shop_id, item_name, description, price, photo_id, category) VALUES (?, ?, ?, ?, ?, ?)',
            args: [shopId, itemName, description, price, photoId, category]
        });
    }

    async updateMenuItem(menuId, itemName, description, price, photoId, category) {
        await this.client.execute({
            sql: 'UPDATE menus SET item_name = ?, description = ?, price = ?, photo_id = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            args: [itemName, description, price, photoId, category, menuId]
        });
    }

    async deleteMenuItem(menuId) {
        await this.client.execute({
            sql: 'DELETE FROM menus WHERE id = ?',
            args: [menuId]
        });
    }

    // Review operations
    async addReview(shopId, userId, rating, comment) {
        await this.client.execute({
            sql: 'INSERT OR REPLACE INTO reviews (shop_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
            args: [shopId, userId, rating, comment]
        });
    }

    async getShopReviews(shopId) {
        const result = await this.client.execute({
            sql: 'SELECT r.*, u.username, u.first_name FROM reviews r JOIN users u ON r.user_id = u.telegram_id WHERE r.shop_id = ? ORDER BY r.created_at DESC',
            args: [shopId]
        });
        return result.rows;
    }

    async getShopAverageRating(shopId) {
        const result = await this.client.execute({
            sql: 'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE shop_id = ?',
            args: [shopId]
        });
        return result.rows[0];
    }

    // Favorites operations
    async addToFavorites(userId, shopId) {
        await this.client.execute({
            sql: 'INSERT OR IGNORE INTO user_favorites (user_id, shop_id) VALUES (?, ?)',
            args: [userId, shopId]
        });
    }

    async removeFromFavorites(userId, shopId) {
        await this.client.execute({
            sql: 'DELETE FROM user_favorites WHERE user_id = ? AND shop_id = ?',
            args: [userId, shopId]
        });
    }

    async getUserFavorites(userId) {
        const result = await this.client.execute({
            sql: 'SELECT s.*, uf.created_at as favorited_at FROM shops s JOIN user_favorites uf ON s.id = uf.shop_id WHERE uf.user_id = ? AND s.status = ? ORDER BY uf.created_at DESC',
            args: [userId, 'approved']
        });
        return result.rows;
    }
}

module.exports = new Database();
