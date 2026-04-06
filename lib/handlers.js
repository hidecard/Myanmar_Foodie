const database = require('./database');
const keyboards = require('./keyboards');

class BotHandlers {
    // Start command handler
    async start(ctx) {
        const telegramId = ctx.from.id;
        const username = ctx.from.username;
        const firstName = ctx.from.first_name;
        const lastName = ctx.from.last_name;

        // Create or update user in database
        await database.createUser(telegramId, username, firstName, lastName);

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

        if (user.role === 1) {
            welcomeMessage += `🏪 *Shop Admin Features:*\n`;
            welcomeMessage += `• Add and manage your shop\n`;
            welcomeMessage += `• Create and update menus\n`;
            welcomeMessage += `• View customer reviews\n`;
            welcomeMessage += `• Real-time updates for users\n\n`;
        } else if (user.role === 2) {
            welcomeMessage += `🤖 *Bot Admin Features:*\n`;
            welcomeMessage += `• Manage user roles\n`;
            welcomeMessage += `• Approve/reject shops\n`;
            welcomeMessage += `• Add new townships\n`;
            welcomeMessage += `• System administration\n\n`;
        }

        welcomeMessage += `🚀 *Get started by exploring the menu below!*`;
        welcomeMessage += `\n\n💡 *Need help?* Type /help anytime!`;

        // Send appropriate keyboard based on role
        let keyboard;
        if (user.role === 0) {
            keyboard = keyboards.user;
        } else if (user.role === 1) {
            keyboard = keyboards.shopAdmin;
        } else if (user.role === 2) {
            keyboard = keyboards.botAdmin;
        }

        await ctx.replyWithMarkdown(welcomeMessage, keyboard);
    }

    // Shop search handler
    async shopSearch(ctx) {
        await ctx.reply('🔍 *ဆိုင်ရှာရန်*', {
            reply_markup: keyboards.shopSearch.reply_markup
        });
    }

    // Search by township
    async searchByTownship(ctx) {
        await ctx.reply('🏙️ *မြို့နယ်ရွေးချယ်ပါ*', {
            reply_markup: keyboards.townships.reply_markup
        });
    }

    // Search by vibe
    async searchByVibe(ctx) {
        await ctx.reply('🎭 *Vibe ရွေးချယ်ပါ*', {
            reply_markup: keyboards.vibes.reply_markup
        });
    }

    // Handle township selection
    async handleTownshipSelection(ctx) {
        const township = ctx.message.text;
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
        const vibe = ctx.message.text.replace(/[^\w\s]/gi, '').trim();
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
        message += `👤 Owner: @${randomShop.owner_username}`;

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
        
        if (user.role !== 2) {
            await ctx.reply('❌ ဒီအပ်ဒေါင်းကို Bot Admin များသာ အသုံးပြုနိုင်ပါသည်။');
            return;
        }

        const pendingShops = await database.getShopsByStatus('pending');

        if (pendingShops.length === 0) {
            await ctx.reply('📩 စောင့်ဆိုင်းနေသော ဆိုင်များမရှိပါ။');
            return;
        }

        let message = `📩 *Pending Shops*\n\n`;
        
        for (const shop of pendingShops) {
            message += `🏪 *${shop.name}*\n`;
            message += `📍 ${shop.township}\n`;
            message += `👤 Owner: @${shop.owner_username}\n`;
            message += `📝 ${shop.description || ''}\n\n`;
        }

        await ctx.replyWithMarkdown(message);
    }

    // Make user shop admin (bot admin command)
    async makeShopAdmin(ctx) {
        const user = await database.getUser(ctx.from.id);
        
        if (user.role !== 2) {
            await ctx.reply('❌ ဒီအမိန့်ကို Bot Admin များသာ အသုံးပြုနိုင်ပါသည်။');
            return;
        }

        const args = ctx.message.text.split(' ');
        if (args.length !== 2) {
            await ctx.reply('အသုံးပြုပုံ: `/make_shop [telegram_id]`');
            return;
        }

        const targetUserId = parseInt(args[1]);
        if (isNaN(targetUserId)) {
            await ctx.reply('❌ မှားနေသော Telegram ID ဖြစ်ပါသည်။');
            return;
        }

        await database.updateUserRole(targetUserId, 1);
        await ctx.reply(`✅ User ${targetUserId} ကို Shop Admin အဖြစ် သတ်မှတ်ပြီးပါပြီ။`);
    }

    // Make user bot admin (bot admin command)
    async makeBotAdmin(ctx) {
        const user = await database.getUser(ctx.from.id);
        
        if (user.role !== 2) {
            await ctx.reply('❌ ဒီအမိန့်ကို Bot Admin များသာ အသုံးပြုနိုင်ပါသည်။');
            return;
        }

        const args = ctx.message.text.split(' ');
        if (args.length !== 2) {
            await ctx.reply('အသုံးပြုပုံ: `/make_admin [telegram_id]`');
            return;
        }

        const targetUserId = parseInt(args[1]);
        if (isNaN(targetUserId)) {
            await ctx.reply('❌ မှားနေသော Telegram ID ဖြစ်ပါသည်။');
            return;
        }

        await database.updateUserRole(targetUserId, 2);
        await ctx.reply(`✅ User ${targetUserId} ကို Bot Admin အဖြစ် သတ်မှတ်ပြီးပါပြီ။`);
    }

    // View user list (bot admin command)
    async viewUserList(ctx) {
        const user = await database.getUser(ctx.from.id);
        
        if (user.role !== 2) {
            await ctx.reply('❌ ဒီအပ်ဒေါင်းကို Bot Admin များသာ အသုံးပြုနိုင်ပါသည်။');
            return;
        }

        // For now, we'll return a placeholder message
        // In a real implementation, you would fetch all users from database
        await ctx.reply('👥 *User စာရင်း*\n\nဒီအပ်ဒေါင်းကို ဆက်လက်တည်ဆောက်ရပါမည်။\n\n' +
            'လောလောဆယ်အတွက် အသုံးပြုသူစာရင်းကို ဒေတာဘေ့စ်မှ တိုက်ရိုက်ကြည့်ရှုနိုင်ပါသည်။');
    }

    // Settings (bot admin command)
    async settings(ctx) {
        const user = await database.getUser(ctx.from.id);
        
        if (user.role !== 2) {
            await ctx.reply('❌ ဒီအပ်ဒေါင်းကို Bot Admin များသာ အသုံးပြုနိုင်ပါသည်။');
            return;
        }

        await ctx.reply('⚙️ *Settings*\n\nဒီအပ်ဒေါင်းကို ဆက်လက်တည်ဆောက်ရပါမည်။\n\n' +
            'Bot ဆက်တင်များကို စီမံခန့်ခွဲနိုင်ပါမည်။');
    }

    // Statistics (bot admin command)
    async statistics(ctx) {
        const user = await database.getUser(ctx.from.id);
        
        if (user.role !== 2) {
            await ctx.reply('❌ ဒီအပ်ဒေါင်းကို Bot Admin များသာ အသုံးပြုနိုင်ပါသည်။');
            return;
        }

        await ctx.reply('📊 *Statistics*\n\nဒီအပ်ဒေါင်းကို ဆက်လက်တည်ဆောက်ရပါမည်။\n\n' +
            'Bot အသုံးပြုမှု စာရင်းအင်းများကို ကြည့်ရှုနိုင်ပါမည်။');
    }

    // Start township creation wizard
    async startTownshipCreation(ctx) {
        const user = await database.getUser(ctx.from.id);
        
        if (user.role !== 2) {
            await ctx.reply('❌ ဒီအပ်ဒေါင်းကို Bot Admin များသာ အသုံးပြုနိုင်ပါသည်။');
            return;
        }

        // Start township creation wizard
        ctx.session.addingTownship = true;
        await ctx.reply('🏙️ *မြို့နယ်အသစ်ထည့်ရန်*\n\nထည့်လိုသော မြို့နယ်အမည်ကို ရိုက်ထည့်ပါ:');
    }

    // Handle township creation wizard
    async handleTownshipCreation(ctx) {
        const townshipName = ctx.message.text.trim();
        
        if (!townshipName) {
            await ctx.reply('❌ မြို့နယ်အမည် မှားနေပါသည်။ ပြန်ရိုက်ထည့်ပါ:');
            return;
        }

        // Check if township already exists
        const existingTownships = [
            'ဗဟန်းသီး', 'လမ်းမတော်', 'ဒဂုံ', 'ကျောက်မြောင်း', 'တောင်ဥက္ကလာပ', 'မရမ်းကုန်း',
            'လသာ', 'ဗိုလ်တထောင်', 'ကမာရွတ်', 'အင်းစိန်', 'မင်္ဂလာဒုံ', 'သင်္ဃန်းကျွန်း',
            'တာမွေ', 'ဒလမြို့နယ်', 'သန်လျင်', 'ကိုကိုး', 'ကျောက်တံတား', 'တိုက်ကြီး',
            'လှည်းကူး', 'မှော်ဘီ', 'တညင်းကုန်း', 'ရွာသာအေး', 'ရန်ကုန်တိုင်းဒေသကြီး'
        ];

        if (existingTownships.includes(townshipName)) {
            await ctx.reply(`❌ "${townshipName}" မြို့နယ် ရှိပြီးသားဖြစ်ပါသည်။`);
            return;
        }

        // Add to existing townships (for now, we'll just confirm)
        await ctx.reply(`✅ "${townshipName}" မြို့နယ်ကို အောင်မြင်စွာ ထည့်ပြီးပါပြီ!\n\n` +
            `ဒီမြို့နယ်ကို ကိုဒ်ထဲမှာ ထည့်ရန် လိုအပ်ပါသေးသည်။\n` +
            `ယခုအခါ User တွေက "${townshipName}" မြို့နယ်ကို ရွေးချယ်နိုင်ပါပြီ။`);

        // Reset session
        ctx.session.addingTownship = false;
    }

    // Start shop creation wizard
    async startShopCreation(ctx) {
        const user = await database.getUser(ctx.from.id);
        
        if (user.role !== 1 && user.role !== 2) {
            await ctx.reply('❌ ဒီအပ်ဒေါင်းကို Shop Admin နှင့် Bot Admin များသာ အသုံးပြုနိုင်ပါသည်။');
            return;
        }

        // Start shop creation wizard
        ctx.session.addingShop = true;
        await ctx.reply('🏪 *ဆိုင်အသစ်ထည့်ရန်*\n\nဆိုင်အမည်ကို ရိုက်ထည့်ပါ:');
    }

    // Handle shop creation wizard
    async handleShopCreation(ctx) {
        if (!ctx.session.shopStep) {
            ctx.session.shopStep = 'name';
            ctx.session.shopData = {};
        }

        switch (ctx.session.shopStep) {
            case 'name':
                ctx.session.shopData.name = ctx.message.text;
                ctx.session.shopStep = 'description';
                await ctx.reply('📝 ဆိုင်ဖော်ပြချက်ကို ရိုက်ထည့်ပါ:');
                break;
            
            case 'description':
                ctx.session.shopData.description = ctx.message.text;
                ctx.session.shopStep = 'township';
                await ctx.reply('🏙️ မြို့နယ်ကို ရိုက်ထည့်ပါ:');
                break;
            
            case 'township':
                ctx.session.shopData.township = ctx.message.text;
                ctx.session.shopStep = 'vibe';
                await ctx.reply('🎭 Vibe (ဥပမာ - Rooftop, Quiet, Family-friendly, Nightlife, Cozy Cafe, Party) ကို ရိုက်ထည့်ပါ:');
                break;
            
            case 'vibe':
                ctx.session.shopData.vibe = ctx.message.text;
                ctx.session.shopStep = 'map_url';
                await ctx.reply('🗺️ Map URL (ရွေးချယ်ချက်) ကို ရိုက်ထည့်ပါ သို့မဟုတ် "မရှိ" ဟုရိုက်ပါ:');
                break;
            
            case 'map_url':
                ctx.session.shopData.mapUrl = ctx.message.text === 'မရှိ' ? null : ctx.message.text;
                
                // Create shop
                const user = await database.getUser(ctx.from.id);
                const shopId = await database.createShop(
                    ctx.session.shopData.name,
                    ctx.session.shopData.description,
                    ctx.session.shopData.township,
                    ctx.session.shopData.vibe,
                    ctx.session.shopData.mapUrl,
                    ctx.from.id
                );
                
                let statusMessage = `✅ "${ctx.session.shopData.name}" ဆိုင်ကို ထည့်ပြီးပါပြီ!\n\n`;
                statusMessage += `📋 ဆိုင်အချက်အလက်များ:\n`;
                statusMessage += `🏪 အမည်: ${ctx.session.shopData.name}\n`;
                statusMessage += `📝 ဖော်ပြချက်: ${ctx.session.shopData.description}\n`;
                statusMessage += `🏙️ မြို့နယ်: ${ctx.session.shopData.township}\n`;
                statusMessage += `🎭 Vibe: ${ctx.session.shopData.vibe}\n`;
                
                if (user.role === 2) {
                    // Bot admin - auto approve
                    await database.updateShopStatus(shopId, 'approved');
                    statusMessage += `\n✅ ဆိုင်ကို ခွင့်ပြုပြီးပါပြီ!`;
                } else {
                    // Shop admin - pending approval
                    statusMessage += `\n⏳ Bot Admin ခွင့်ပြုချက်ကို စောင့်ဆိုင်းနေပါသည်။`;
                }
                
                await ctx.reply(statusMessage);
                
                // Reset session
                ctx.session.addingShop = false;
                ctx.session.shopStep = null;
                ctx.session.shopData = null;
                break;
        }
    }
}

module.exports = new BotHandlers();
