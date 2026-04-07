const database = require('./database');
const keyboards = require('./keyboards');

class BotHandlers {
    // Start command handler
    async start(ctx) {
        const telegramId = ctx.from.id;
        const firstName = ctx.from.first_name;

        // Get user info with role
        const user = await database.getUser(telegramId);

        // Enhanced welcome message
        let welcomeMessage = `🍽️ *Welcome to Myanmar Foodie & Nightlife Bot!* 🎉\n\n`;
        welcomeMessage += `Hello ${firstName}! 👋\n\n`;
        welcomeMessage += `🌟 *Discover the best dining experiences in Myanmar!*\n\n`;
        welcomeMessage += `🔍 **What you can do:**\n`;
        welcomeMessage += `• Search restaurants by township or vibe\n`;
        welcomeMessage += `• Browse menus with photos & prices\n`;
        welcomeMessage += `• Save your favorite spots\n`;
        welcomeMessage += `• Rate and review places\n`;
        welcomeMessage += `• Get surprise recommendations\n\n`;

        if (user && user.role === 1) {
            welcomeMessage += `🏪 *Shop Admin Features:*\n`;
            welcomeMessage += `• Add and manage your shop\n`;
            welcomeMessage += `• Create and update menus\n`;
            welcomeMessage += `• View customer reviews\n`;
            welcomeMessage += `• Real-time updates for users\n\n`;
        } else if (user && user.role === 2) {
            welcomeMessage += `🤖 *Bot Admin Features:*\n`;
            welcomeMessage += `• Manage user roles\n`;
            welcomeMessage += `• Approve/reject shops\n`;
            welcomeMessage += `• Add new townships\n`;
            welcomeMessage += `• System administration\n\n`;
        }

        welcomeMessage += `🚀 *Get started by exploring the menu below!*`;
        welcomeMessage += `\n\n💡 *Need help?* Type /help anytime!`;

        // Send appropriate keyboard based on role
        let keyboard = keyboards.user;
        if (user) {
            if (user.role === 1) keyboard = keyboards.shopAdmin;
            else if (user.role === 2) keyboard = keyboards.botAdmin;
        }

        await ctx.replyWithMarkdown(welcomeMessage, keyboard);
    }

    // Shop search handler
    async shopSearch(ctx) {
        await ctx.reply('🔍 *ဆိုင်ရှာရန်*', keyboards.shopSearch);
    }

    // Search by township
    async searchByTownship(ctx) {
        await ctx.reply('🏙️ *မြို့နယ်ရွေးချယ်ပါ*', keyboards.townships);
    }

    // Search by vibe
    async searchByVibe(ctx) {
        await ctx.reply('🎭 *Vibe ရွေးချယ်ပါ*', keyboards.vibes);
    }

    // Handle township selection
    async handleTownshipSelection(ctx) {
        const township = ctx.message.text;
        if (township === '🔙 နောက်သို့') {
            return this.shopSearch(ctx);
        }
        
        const shops = await database.getShopsByTownship(township);

        if (shops.length === 0) {
            await ctx.reply(`❌ ${township} မြို့နယ်တွင် ဆိုင်များမတွေ့ပါ။`);
            return;
        }

        let message = `📍 *${township} မြို့နယ်ရှိ ဆိုင်များ*\n\n`;
        
        for (const shop of shops) {
            const rating = await database.getShopAverageRating(shop.id);
            const avgRating = rating.avg_rating ? parseFloat(rating.avg_rating).toFixed(1) : 'N/A';
            const reviewCount = rating.review_count || 0;
            
            message += `🏪 *${shop.name}*\n`;
            message += `📍 ${shop.township}\n`;
            message += `🎭 ${shop.vibe || 'N/A'}\n`;
            message += `⭐ ${avgRating} (${reviewCount} သုံးသပ်ချက်)\n`;
            message += `📝 ${shop.description || ''}\n\n`;
        }

        await ctx.replyWithMarkdown(message);
    }

    // Handle vibe selection
    async handleVibeSelection(ctx) {
        const originalText = ctx.message.text;
        if (originalText === '🔙 နောက်သို့') {
            return this.shopSearch(ctx);
        }

        // Remove emojis and trim to get the plain vibe name
        const vibe = originalText.replace(/[^\w\s-]/gi, '').trim();
        const shops = await database.getShopsByVibe(vibe);

        if (shops.length === 0) {
            await ctx.reply(`❌ "${vibe}" အမျိုးအစားဖြင့် ဆိုင်များမတွေ့ပါ။`);
            return;
        }

        let message = `🎭 *${vibe} အမျိုးအစားဆိုင်များ*\n\n`;
        
        for (const shop of shops) {
            const rating = await database.getShopAverageRating(shop.id);
            const avgRating = rating.avg_rating ? parseFloat(rating.avg_rating).toFixed(1) : 'N/A';
            const reviewCount = rating.review_count || 0;
            
            message += `🏪 *${shop.name}*\n`;
            message += `📍 ${shop.township}\n`;
            message += `⭐ ${avgRating} (${reviewCount} သုံးသပ်ချက်)\n`;
            message += `📝 ${shop.description || ''}\n\n`;
        }

        await ctx.replyWithMarkdown(message);
    }

    // Surprise me - random shop
    async surpriseMe(ctx) {
        const shops = await database.getShopsByStatus('approved');
        
        if (shops.length === 0) {
            await ctx.reply('❌ လက်ရှိတွင် ဆိုင်များမရှိပါ။');
            return;
        }

        const randomShop = shops[Math.floor(Math.random() * shops.length)];
        const rating = await database.getShopAverageRating(randomShop.id);
        const avgRating = rating.avg_rating ? parseFloat(rating.avg_rating).toFixed(1) : 'N/A';
        const reviewCount = rating.review_count || 0;

        let message = `🎲 *Surprise Shop!*\n\n`;
        message += `🏪 *${randomShop.name}*\n`;
        message += `📍 ${randomShop.township}\n`;
        message += `🎭 ${randomShop.vibe || 'N/A'}\n`;
        message += `⭐ ${avgRating} (${reviewCount} သုံးသပ်ချက်)\n`;
        message += `📝 ${randomShop.description || ''}\n\n`;

        await ctx.replyWithMarkdown(message, keyboards.favoriteActions(randomShop.id));
    }

    // View user favorites
    async viewFavorites(ctx) {
        const telegramId = ctx.from.id;
        const favorites = await database.getUserFavorites(telegramId);

        if (favorites.length === 0) {
            await ctx.reply('❤️ သင့်ရဲ့ အကြိုက်ဆုံးဆိုင်များ မရှိပါ။');
            return;
        }

        let message = `❤️ *သင့်ရဲ့ အကြိုက်ဆုံးဆိုင်များ*\n\n`;
        
        for (const shop of favorites) {
            const rating = await database.getShopAverageRating(shop.id);
            const avgRating = rating.avg_rating ? parseFloat(rating.avg_rating).toFixed(1) : 'N/A';
            const reviewCount = rating.review_count || 0;
            
            message += `🏪 *${shop.name}*\n`;
            message += `📍 ${shop.township}\n`;
            message += `⭐ ${avgRating} (${reviewCount} သုံးသပ်ချက်)\n\n`;
        }

        await ctx.replyWithMarkdown(message);
    }

    // Bot admin - view pending shops
    async viewPendingShops(ctx) {
        const user = await database.getUser(ctx.from.id);
        
        if (!user || user.role !== 2) {
            await ctx.reply('❌ ဒီအပ်ဒေါင်းကို Bot Admin များသာ အသုံးပြုနိုင်ပါသည်။');
            return;
        }

        const pendingShops = await database.getShopsByStatus('pending');

        if (pendingShops.length === 0) {
            await ctx.reply('📩 စောင့်ဆိုင်းနေသော ဆိုင်များမရှိပါ။');
            return;
        }

        for (const shop of pendingShops) {
            let message = `📩 *Pending Shop*\n\n`;
            message += `🏪 *${shop.name}*\n`;
            message += `📍 ${shop.township}\n`;
            message += `🎭 ${shop.vibe || 'N/A'}\n`;
            message += `📝 ${shop.description || ''}\n`;
            
            await ctx.replyWithMarkdown(message, keyboards.shopManagement(shop.id));
        }
    }

    // Make user shop admin
    async makeShopAdmin(ctx) {
        const user = await database.getUser(ctx.from.id);
        if (!user || user.role !== 2) return;

        const args = ctx.message.text.split(' ');
        if (args.length !== 2) {
            await ctx.reply('အသုံးပြုပုံ: `/make_shop [telegram_id]`');
            return;
        }

        const targetUserId = parseInt(args[1]);
        await database.updateUserRole(targetUserId, 1);
        await ctx.reply(`✅ User ${targetUserId} ကို Shop Admin အဖြစ် သတ်မှတ်ပြီးပါပြီ။`);
    }

    // Make user bot admin
    async makeBotAdmin(ctx) {
        const user = await database.getUser(ctx.from.id);
        if (!user || user.role !== 2) return;

        const args = ctx.message.text.split(' ');
        if (args.length !== 2) {
            await ctx.reply('အသုံးပြုပုံ: `/make_admin [telegram_id]`');
            return;
        }

        const targetUserId = parseInt(args[1]);
        await database.updateUserRole(targetUserId, 2);
        await ctx.reply(`✅ User ${targetUserId} ကို Bot Admin အဖြစ် သတ်မှတ်ပြီးပါပြီ။`);
    }

    // View user list
    async viewUserList(ctx) {
        const user = await database.getUser(ctx.from.id);
        if (!user || user.role !== 2) return;

        const count = await database.getUserCount();
        await ctx.reply(`👥 *User စာရင်း*\n\nစုစုပေါင်းအသုံးပြုသူ: ${count} ဦး\n\nအသေးစိတ်စာရင်းကို Admin Dashboard တွင် ကြည့်ရှုနိုင်ပါသည်။`);
    }

    // Statistics
    async statistics(ctx) {
        const user = await database.getUser(ctx.from.id);
        if (!user || user.role !== 2) return;

        const userCount = await database.getUserCount();
        const shopCount = await database.getShopCount();
        const activeUsers = await database.getActiveUsers(24);

        let message = `📊 *System Statistics*\n\n`;
        message += `👥 Total Users: ${userCount}\n`;
        message += `🏪 Total Shops: ${shopCount}\n`;
        message += `📱 Active Users (24h): ${activeUsers}\n`;

        await ctx.replyWithMarkdown(message);
    }

    // Settings
    async settings(ctx) {
        const user = await database.getUser(ctx.from.id);
        if (!user || user.role !== 2) return;

        await ctx.reply('⚙️ *Settings*\n\nBot configuration settings are managed via environment variables.');
    }

    // Start township creation wizard
    async startTownshipCreation(ctx) {
        const user = await database.getUser(ctx.from.id);
        if (!user || user.role !== 2) return;

        ctx.session.addingTownship = true;
        await ctx.reply('🏙️ *မြို့နယ်အသစ်ထည့်ရန်*\n\nထည့်လိုသော မြို့နယ်အမည်ကို ရိုက်ထည့်ပါ:');
    }

    // Handle township creation wizard
    async handleTownshipCreation(ctx) {
        const townshipName = ctx.message.text.trim();
        await ctx.reply(`✅ "${townshipName}" မြို့နယ်ကို အောင်မြင်စွာ ထည့်ပြီးပါပြီ!\n\n(Note: This is a simulation, in production this would update the database and keyboard)`);
        ctx.session.addingTownship = false;
    }

    // Start shop creation wizard
    async startShopCreation(ctx) {
        ctx.session.addingShop = true;
        ctx.session.shopStep = 'name';
        ctx.session.shopData = {};
        await ctx.reply('🏪 *ဆိုင်အသစ်ထည့်ရန်*\n\nဆိုင်အမည်ကို ရိုက်ထည့်ပါ:');
    }

    // Handle shop creation wizard
    async handleShopCreation(ctx) {
        const text = ctx.message.text;
        
        switch (ctx.session.shopStep) {
            case 'name':
                ctx.session.shopData.name = text;
                ctx.session.shopStep = 'description';
                await ctx.reply('📝 ဆိုင်ဖော်ပြချက်ကို ရိုက်ထည့်ပါ:');
                break;
            case 'description':
                ctx.session.shopData.description = text;
                ctx.session.shopStep = 'township';
                await ctx.reply('🏙️ မြို့နယ်ကို ရိုက်ထည့်ပါ:', keyboards.townships);
                break;
            case 'township':
                ctx.session.shopData.township = text;
                ctx.session.shopStep = 'vibe';
                await ctx.reply('🎭 Vibe (ဥပမာ - Rooftop, Quiet, Family-friendly, Nightlife, Cozy Cafe, Party) ကို ရိုက်ထည့်ပါ:', keyboards.vibes);
                break;
            case 'vibe':
                ctx.session.shopData.vibe = text.replace(/[^\w\s-]/gi, '').trim();
                ctx.session.shopStep = 'map_url';
                await ctx.reply('🗺️ Map URL (ရွေးချယ်ချက်) ကို ရိုက်ထည့်ပါ သို့မဟုတ် "မရှိ" ဟုရိုက်ပါ:');
                break;
            case 'map_url':
                ctx.session.shopData.mapUrl = text === 'မရှိ' ? null : text;
                
                const shopId = await database.createShop(
                    ctx.session.shopData.name,
                    ctx.session.shopData.description,
                    ctx.session.shopData.township,
                    ctx.session.shopData.vibe,
                    ctx.session.shopData.mapUrl,
                    ctx.from.id
                );
                
                await ctx.reply(`✅ "${ctx.session.shopData.name}" ဆိုင်ကို ထည့်ပြီးပါပြီ! ⏳ Bot Admin ခွင့်ပြုချက်ကို စောင့်ဆိုင်းနေပါသည်။`);
                ctx.session.addingShop = false;
                ctx.session.shopStep = null;
                break;
        }
    }

    // Handle menu creation wizard
    async handleMenuCreation(ctx) {
        const text = ctx.message.text;
        
        switch (ctx.session.menuStep) {
            case 'name':
                ctx.session.menuData.item_name = text;
                ctx.session.menuStep = 'description';
                await ctx.reply('📝 ဟင်းလျာဖော်ပြချက်ကို ရိုက်ထည့်ပါ:');
                break;
            case 'description':
                ctx.session.menuData.description = text;
                ctx.session.menuStep = 'price';
                await ctx.reply('💰 ဈေးနှုန်း (MMK) ကို ရိုက်ထည့်ပါ:');
                break;
            case 'price':
                const price = parseInt(text);
                if (isNaN(price)) {
                    await ctx.reply('❌ ဈေးနှုန်းကို ဂဏန်းဖြင့်သာ ရိုက်ထည့်ပါ:');
                    return;
                }
                ctx.session.menuData.price = price;
                ctx.session.menuStep = 'category';
                await ctx.reply('📂 အမျိုးအစား (ဥပမာ - Main Course, Drink, Dessert) ကို ရိုက်ထည့်ပါ:');
                break;
            case 'category':
                ctx.session.menuData.category = text;
                ctx.session.menuStep = 'photo';
                await ctx.reply('📸 ဟင်းလျာဓာတ်ပုံကို ပေးပို့ပါ:');
                break;
        }
    }

    // Handle general search
    async handleSearch(ctx) {
        const query = ctx.message.text;
        if (!query || query.length < 2) return;

        // Simple search logic
        const result = await database.execute(
            "SELECT * FROM shops WHERE (name LIKE ? OR description LIKE ?) AND status = 'approved' LIMIT 5",
            [`%${query}%`, `%${query}%`]
        );

        if (result.rows.length === 0) return;

        let message = `🔍 *ရှာဖွေမှုရလဒ်များ: "${query}"*\n\n`;
        for (const shop of result.rows) {
            message += `🏪 *${shop.name}* (${shop.township})\n`;
        }
        await ctx.replyWithMarkdown(message);
    }
}

module.exports = new BotHandlers();
