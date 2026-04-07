const express = require('express');
const cors = require('cors');
const database = require('../lib/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Middleware to check admin role
const isAdmin = async (req, res, next) => {
    const telegramId = req.headers['x-telegram-id'];
    if (!telegramId) {
        return res.status(401).json({ error: 'Unauthorized: Missing X-Telegram-ID' });
    }
    
    try {
        const user = await database.getUser(parseInt(telegramId));
        if (user && user.role === 2) {
            next();
        } else {
            res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Dashboard Stats
app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
        const userCount = await database.getUserCount();
        const shopCount = await database.getShopCount();
        const activeUsers = await database.getActiveUsers(24);
        
        res.json({
            users: userCount,
            shops: shopCount,
            active_24h: activeUsers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pending Shops
app.get('/api/admin/pending-shops', isAdmin, async (req, res) => {
    try {
        const shops = await database.getShopsByStatus('pending');
        res.json(shops);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve Shop
app.post('/api/admin/approve-shop/:id', isAdmin, async (req, res) => {
    try {
        await database.updateShopStatus(parseInt(req.params.id), 'approved');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('<h1>Myanmar Foodie Admin API</h1><p>Status: Running</p>');
});

app.listen(PORT, () => {
    console.log(`🚀 Admin server running on http://localhost:${PORT}`);
});
