const { createClient } = require('@libsql/client');
require('dotenv').config();

class Database {
    constructor() {
        this.client = null;
    }
    
    async connect() {
        if (!this.client) {
            const { createClient } = require('@libsql/client');
            this.client = createClient({
                url: process.env.TURSO_DATABASE_URL,
                authToken: process.env.TURSO_AUTH_TOKEN,
            });
        }
    }
    
    async getClient() {
        if (!this.client) {
            await this.connect();
        }
        return this.client;
    }
    
    async execute(sql, args = []) {
        const client = await this.getClient();
        return await client.execute({ sql, args });
    }

    // User operations
    async getUser(telegramId) {
        const result = await this.execute(
            'SELECT * FROM users WHERE telegram_id = ?',
            [telegramId]
        );
        return result.rows[0] || null;
    }

    async createUser(telegramId, username, firstName, lastName) {
        // Check if user already exists
        const existingUser = await this.getUser(telegramId);
        
        if (!existingUser) {
            // Only insert if user doesn't exist
            await this.execute(
                'INSERT INTO users (telegram_id, username, first_name, last_name) VALUES (?, ?, ?, ?)',
                [telegramId, username, firstName, lastName]
            );
        } else {
            // Update only user info, preserve role
            await this.execute(
                'UPDATE users SET username = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
                [username, firstName, lastName, telegramId]
            );
        }
    }

    async updateUserRole(telegramId, role) {
        await this.execute(
            'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
            [role, telegramId]
        );
    }

    // Shop operations
    async getShop(shopId) {
        const result = await this.execute(
            'SELECT s.*, u.username as owner_username FROM shops s JOIN users u ON s.owner_id = u.telegram_id WHERE s.id = ?',
            [shopId]
        );
        return result.rows[0] || null;
    }

    async getShopsByStatus(status = 'approved') {
        const result = await this.execute(
            'SELECT s.*, u.username as owner_username FROM shops s JOIN users u ON s.owner_id = u.telegram_id WHERE s.status = ? ORDER BY s.created_at DESC',
            [status]
        );
        return result.rows;
    }

    async getShopsByTownship(township) {
        const result = await this.execute(
            'SELECT s.*, u.username as owner_username FROM shops s JOIN users u ON s.owner_id = u.telegram_id WHERE s.township = ? AND s.status = ? ORDER BY s.created_at DESC',
            [township, 'approved']
        );
        return result.rows;
    }

    async getShopsByVibe(vibe) {
        const result = await this.execute(
            'SELECT s.*, u.username as owner_username FROM shops s JOIN users u ON s.owner_id = u.telegram_id WHERE s.vibe = ? AND s.status = ? ORDER BY s.created_at DESC',
            [vibe, 'approved']
        );
        return result.rows;
    }

    async createShop(name, description, township, vibe, mapUrl, ownerId) {
        const result = await this.execute(
            'INSERT INTO shops (name, description, township, vibe, map_url, owner_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
            [name, description, township, vibe, mapUrl, ownerId]
        );
        return result.rows[0].id;
    }

    async updateShopStatus(shopId, status) {
        await this.client.execute({
            sql: 'UPDATE shops SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            args: [status, shopId]
        });
    }

    async getShopsByOwner(ownerId) {
        const result = await this.execute(
            'SELECT * FROM shops WHERE owner_id = ? ORDER BY created_at DESC',
            [ownerId]
        );
        return result.rows;
    }

    // Menu operations
    async getMenuItems(shopId) {
        const result = await this.execute(
            'SELECT * FROM menus WHERE shop_id = ? AND available = 1 ORDER BY category, item_name',
            [shopId]
        );
        return result.rows;
    }

    async addMenuItem(shopId, itemName, description, price, photoId, category) {
        await this.execute(
            'INSERT INTO menus (shop_id, item_name, description, price, photo_id, category) VALUES (?, ?, ?, ?, ?, ?)',
            [shopId, itemName, description, price, photoId, category]
        );
    }

    async updateMenuItem(menuId, itemName, description, price, photoId, category) {
        await this.execute(
            'UPDATE menus SET item_name = ?, description = ?, price = ?, photo_id = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [itemName, description, price, photoId, category, menuId]
        );
    }

    async deleteMenuItem(menuId) {
        await this.execute(
            'DELETE FROM menus WHERE id = ?',
            [menuId]
        );
    }

    // Review operations
    async addReview(shopId, userId, rating, comment) {
        await this.execute(
            'INSERT OR REPLACE INTO reviews (shop_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
            [shopId, userId, rating, comment]
        );
    }

    async getShopReviews(shopId) {
        const result = await this.execute(
            'SELECT r.*, u.username, u.first_name FROM reviews r JOIN users u ON r.user_id = u.telegram_id WHERE r.shop_id = ? ORDER BY r.created_at DESC',
            [shopId]
        );
        return result.rows;
    }

    async getShopAverageRating(shopId) {
        const result = await this.execute(
            'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE shop_id = ?',
            [shopId]
        );
        return result.rows[0];
    }

    // Favorites operations
    async addToFavorites(userId, shopId) {
        await this.execute(
            'INSERT OR IGNORE INTO user_favorites (user_id, shop_id) VALUES (?, ?)',
            [userId, shopId]
        );
    }

    async removeFromFavorites(userId, shopId) {
        await this.execute(
            'DELETE FROM user_favorites WHERE user_id = ? AND shop_id = ?',
            [userId, shopId]
        );
    }

    async getUserFavorites(userId) {
        const result = await this.execute(
            'SELECT s.*, uf.created_at as favorited_at FROM shops s JOIN user_favorites uf ON s.id = uf.shop_id WHERE uf.user_id = ? AND s.status = ? ORDER BY uf.created_at DESC',
            [userId, 'approved']
        );
        return result.rows;
    }

    // Get shops by status
    async getShopsByStatus(status) {
        const result = await this.execute(
            'SELECT * FROM shops WHERE status = ? ORDER BY created_at DESC',
            [status]
        );
        return result.rows;
    }

    // Get shops by vibe
    async getShopsByVibe(vibe) {
        const result = await this.execute(
            'SELECT * FROM shops WHERE vibe LIKE ? AND status = ? ORDER BY created_at DESC',
            [`%${vibe}%`, 'approved']
        );
        return result.rows;
    }

    // Get shop favoriters
    async getShopFavoriters(shopId) {
        const result = await this.execute(
            'SELECT u.* FROM users u JOIN user_favorites uf ON u.telegram_id = uf.user_id WHERE uf.shop_id = ?',
            [shopId]
        );
        return result.rows;
    }

    // Get user count
    async getUserCount() {
        const result = await this.execute(
            'SELECT COUNT(*) as count FROM users'
        );
        return result.rows[0].count;
    }

    // Get shop count
    async getShopCount() {
        const result = await this.execute(
            'SELECT COUNT(*) as count FROM shops'
        );
        return result.rows[0].count;
    }

    // Get active users (last 24 hours)
    async getActiveUsers(hours = 24) {
        const result = await this.execute(
            'SELECT COUNT(DISTINCT telegram_id) as count FROM users WHERE updated_at > datetime(\'now\', \'-\' || ? || \' hours\')',
            [hours]
        );
        return result.rows[0].count;
    }

    // Get popular shops
    async getPopularShops(limit = 10) {
        const result = await this.execute(`
            SELECT s.*, 
                   AVG(r.rating) as avg_rating,
                   COUNT(r.id) as review_count,
                   COUNT(uf.id) as favorite_count
            FROM shops s 
            LEFT JOIN reviews r ON s.id = r.shop_id 
            LEFT JOIN user_favorites uf ON s.id = uf.shop_id 
            WHERE s.status = ? 
            GROUP BY s.id 
            ORDER BY favorite_count DESC, avg_rating DESC 
            LIMIT ?
        `, ['approved', limit]);
        return result.rows;
    }

    // Log activity for monitoring
    async logActivity(logEntry) {
        await this.execute(
            'INSERT INTO activity_logs (user_id, username, action, metadata, timestamp) VALUES (?, ?, ?, ?, ?)',
            [logEntry.userId, logEntry.username, logEntry.action, JSON.stringify(logEntry.metadata), logEntry.timestamp]
        );
    }

    // Get shop views (placeholder for analytics)
    async getShopViews(shopId) {
        const result = await this.execute(
            'SELECT COUNT(*) as count FROM reviews WHERE shop_id = ?',
            [shopId]
        );
        return result.rows[0].count;
    }

    // Close database connection
    async close() {
        if (this.client) {
            await this.client.close();
        }
    }
}

module.exports = new Database();
