const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('../lib/database');
require('dotenv').config();

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Simple authentication middleware (for demo purposes)
const authMiddleware = (req, res, next) => {
    // In production, implement proper JWT authentication
    const telegramId = req.headers['x-telegram-id'] || req.headers['X-Telegram-ID'];
    
    console.log('Auth attempt - Telegram ID:', telegramId);
    console.log('All headers:', Object.keys(req.headers));
    
    if (!telegramId) {
        console.log('No telegram ID found in headers');
        return res.status(401).json({ error: 'Unauthorized - No Telegram ID provided' });
    }
    
    // Check if user is admin or shop admin
    database.getUser(parseInt(telegramId)).then(user => {
        console.log('User found:', user);
        
        if (!user) {
            console.log('User not found in database');
            return res.status(403).json({ error: 'Access denied - User not found' });
        }
        
        if (user.role !== 1 && user.role !== 2) {
            console.log('User role not sufficient:', user.role);
            return res.status(403).json({ error: 'Access denied - Insufficient permissions' });
        }
        
        console.log('Authentication successful for user:', user.username);
        req.user = user;
        next();
    }).catch(err => {
        console.error('Database error in auth:', err);
        res.status(500).json({ error: 'Database error during authentication' });
    });
};

// Apply auth to all admin routes
app.use('/api/admin', authMiddleware);

// Dashboard statistics
app.get('/api/admin/stats', async (req, res) => {
    try {
        // Get total users
        const usersResult = await database.client.execute('SELECT COUNT(*) as count FROM users');
        const totalUsers = usersResult.rows[0].count;
        
        // Get total shops
        const shopsResult = await database.client.execute('SELECT COUNT(*) as count FROM shops');
        const totalShops = shopsResult.rows[0].count;
        
        // Get pending shops
        const pendingResult = await database.client.execute('SELECT COUNT(*) as count FROM shops WHERE status = \'pending\'');
        const pendingShops = pendingResult.rows[0].count;
        
        // Get total reviews
        const reviewsResult = await database.client.execute('SELECT COUNT(*) as count FROM reviews');
        const totalReviews = reviewsResult.rows[0].count;
        
        res.json({
            totalUsers,
            totalShops,
            pendingShops,
            totalReviews
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all users
app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await database.client.execute(`
            SELECT telegram_id, username, first_name, last_name, role, created_at, updated_at
            FROM users 
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update user role
app.put('/api/admin/users/:telegramId/role', async (req, res) => {
    try {
        const { telegramId } = req.params;
        const { role } = req.body;
        
        if (req.user.role !== 2) {
            return res.status(403).json({ error: 'Only Bot Admin can change roles' });
        }
        
        await database.updateUserRole(parseInt(telegramId), parseInt(role));
        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all shops
app.get('/api/admin/shops', async (req, res) => {
    try {
        const result = await database.client.execute(`
            SELECT s.*, u.username as owner_username 
            FROM shops s 
            JOIN users u ON s.owner_id = u.telegram_id 
            ORDER BY s.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get pending shops
app.get('/api/admin/shops/pending', async (req, res) => {
    try {
        const result = await database.client.execute(`
            SELECT s.*, u.username as owner_username 
            FROM shops s 
            JOIN users u ON s.owner_id = u.telegram_id 
            WHERE s.status = 'pending' 
            ORDER BY s.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve shop
app.put('/api/admin/shops/:shopId/approve', async (req, res) => {
    try {
        const { shopId } = req.params;
        await database.updateShopStatus(parseInt(shopId), 'approved');
        res.json({ message: 'Shop approved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reject shop
app.put('/api/admin/shops/:shopId/reject', async (req, res) => {
    try {
        const { shopId } = req.params;
        await database.updateShopStatus(parseInt(shopId), 'rejected');
        res.json({ message: 'Shop rejected successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete shop
app.delete('/api/admin/shops/:shopId', async (req, res) => {
    try {
        const { shopId } = req.params;
        
        // Delete related records first (menus, reviews, favorites)
        await database.client.execute('DELETE FROM menus WHERE shop_id = ?', [parseInt(shopId)]);
        await database.client.execute('DELETE FROM reviews WHERE shop_id = ?', [parseInt(shopId)]);
        await database.client.execute('DELETE FROM user_favorites WHERE shop_id = ?', [parseInt(shopId)]);
        
        // Delete shop
        await database.client.execute('DELETE FROM shops WHERE id = ?', [parseInt(shopId)]);
        
        res.json({ message: 'Shop deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get recent reviews
app.get('/api/admin/reviews', async (req, res) => {
    try {
        const result = await database.client.execute(`
            SELECT r.*, s.name as shop_name, u.username as user_name, u.first_name 
            FROM reviews r 
            JOIN shops s ON r.shop_id = s.id 
            JOIN users u ON r.user_id = u.telegram_id 
            ORDER BY r.created_at DESC 
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new shop
app.post('/api/admin/shops', async (req, res) => {
    try {
        const { name, description, township, vibe, mapUrl, ownerId } = req.body;
        
        if (!name || !township || !ownerId) {
            return res.status(400).json({ error: 'Name, township, and owner ID are required' });
        }
        
        const shopId = await database.createShop(
            name,
            description,
            township,
            vibe,
            mapUrl,
            parseInt(ownerId)
        );
        
        res.json({ message: 'Shop created successfully', shopId });
    } catch (error) {
        console.error('Error creating shop:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get menu items for a shop
app.get('/api/admin/shops/:shopId/menu', async (req, res) => {
    try {
        const { shopId } = req.params;
        const menuItems = await database.getMenuItems(parseInt(shopId));
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add menu item to shop
app.post('/api/admin/shops/:shopId/menu', async (req, res) => {
    try {
        const { shopId } = req.params;
        const { itemName, description, price, photoId, category } = req.body;
        
        if (!itemName || !price) {
            return res.status(400).json({ error: 'Item name and price are required' });
        }
        
        await database.addMenuItem(
            parseInt(shopId),
            itemName,
            description,
            parseInt(price),
            photoId,
            category
        );
        
        res.json({ message: 'Menu item added successfully' });
    } catch (error) {
        console.error('Error adding menu item:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update menu item
app.put('/api/admin/menu/:menuId', async (req, res) => {
    try {
        const { menuId } = req.params;
        const { itemName, description, price, photoId, category } = req.body;
        
        await database.updateMenuItem(
            parseInt(menuId),
            itemName,
            description,
            parseInt(price),
            photoId,
            category
        );
        
        res.json({ message: 'Menu item updated successfully' });
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete menu item
app.delete('/api/admin/menu/:menuId', async (req, res) => {
    try {
        const { menuId } = req.params;
        await database.deleteMenuItem(parseInt(menuId));
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new user
app.post('/api/admin/users', async (req, res) => {
    try {
        if (req.user.role !== 2) {
            return res.status(403).json({ error: 'Only Bot Admin can create users' });
        }
        
        const { telegramId, username, firstName, lastName, role } = req.body;
        
        if (!telegramId || !username) {
            return res.status(400).json({ error: 'Telegram ID and username are required' });
        }
        
        await database.createUser(
            parseInt(telegramId),
            username,
            firstName || '',
            lastName || ''
        );
        
        if (role && [0, 1, 2].includes(parseInt(role))) {
            await database.updateUserRole(parseInt(telegramId), parseInt(role));
        }
        
        res.json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user statistics
app.get('/api/admin/users/:telegramId/stats', async (req, res) => {
    try {
        const { telegramId } = req.params;
        
        // Get user's shops
        const shops = await database.getShopsByOwner(parseInt(telegramId));
        
        // Get user's reviews
        const reviewsResult = await database.client.execute(
            'SELECT COUNT(*) as count FROM reviews WHERE user_id = ?',
            [parseInt(telegramId)]
        );
        
        // Get user's favorites
        const favoritesResult = await database.client.execute(
            'SELECT COUNT(*) as count FROM user_favorites WHERE user_id = ?',
            [parseInt(telegramId)]
        );
        
        res.json({
            shopsCount: shops.length,
            reviewsCount: reviewsResult.rows[0].count,
            favoritesCount: favoritesResult.rows[0].count,
            shops: shops
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get shop statistics
app.get('/api/admin/shops/:shopId/stats', async (req, res) => {
    try {
        const { shopId } = req.params;
        
        // Get average rating
        const ratingResult = await database.getShopAverageRating(parseInt(shopId));
        
        // Get menu items count
        const menuResult = await database.client.execute(
            'SELECT COUNT(*) as count FROM menus WHERE shop_id = ? AND available = 1',
            [parseInt(shopId)]
        );
        
        // Get reviews count
        const reviewResult = await database.client.execute(
            'SELECT COUNT(*) as count FROM reviews WHERE shop_id = ?',
            [parseInt(shopId)]
        );
        
        res.json({
            averageRating: ratingResult.avg_rating || 0,
            totalReviews: reviewResult.rows[0].count,
            menuItems: menuResult.rows[0].count
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve the dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Admin Dashboard running on http://localhost:${PORT}`);
    console.log(`📊 Admin Panel: http://localhost:${PORT}`);
    console.log(`🔐 Make sure to set X-Telegram-ID header for authentication`);
});

module.exports = app;
