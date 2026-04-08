const database = require('./database');
const keyboards = require('./keyboards');

const handlers = {
    // Start command
    start: async (ctx) => {
        const telegramId = ctx.from.id;
        const user = await database.getUser(telegramId);
        
        let keyboard = keyboards.user;
        if (user) {
            if (user.role === 1) keyboard = keyboards.shopAdmin;
            if (user.role === 2) keyboard = keyboards.botAdmin;
        }

        await ctx.reply(`👋 မင်္ဂလာပါ ${ctx.from.first_name}!\n\nMyanmar Foodie & Nightlife Bot မှ ကြိုဆိုပါတယ်။ သင်နှစ်သက်ရာ ဆိုင်များကို ရှာဖွေနိုင်ပါသည်။`, keyboard);
    },

    // Shop Search
    shopSearch: async (ctx) => {
        await ctx.reply('🔍 ဆိုင်များကို ဘယ်လိုရှာဖွေချင်ပါသလဲ?', keyboards.shopSearch);
    },

    searchByTownship: async (ctx) => {
        await ctx.reply('🏙️ မြို့နယ်ကို ရွေးချယ်ပါ:', keyboards.townships);
    },

    searchByVibe: async (ctx) => {
        await ctx.reply('🎭 Vibe ကို ရွေးချယ်ပါ:', keyboards.vibes);
    },

    handleTownshipSelection: async (ctx) => {
        const township = ctx.message.text;
        if (township === '🔙 နောက်သို့') return handlers.shopSearch(ctx);
        
        const shops = await database.getShopsByTownship(township);
        if (shops.length === 0) {
            await ctx.reply(`😔 စိတ်မကောင်းပါဘူး၊ ${township} မှာ ဆိုင်စာရင်း မရှိသေးပါ။`);
            return;
        }

        await ctx.reply(`${township} ရှိ ဆိုင်များ:`);
        for (const shop of shops) {
            let message = `🏪 *${shop.name}*\n📍 ${shop.township}\n🎭 ${shop.vibe || 'N/A'}\n📝 ${shop.description || ''}`;
            await ctx.replyWithMarkdown(message, keyboards.favoriteActions(shop.id));
        }
    },

    handleVibeSelection: async (ctx) => {
        const vibeWithEmoji = ctx.message.text;
        if (vibeWithEmoji === '🔙 နောက်သို့') return handlers.shopSearch(ctx);
        
        // Extract text from emoji (e.g., "🏙️ Rooftop" -> "Rooftop")
        const vibe = vibeWithEmoji.replace(/[^\x00-\x7F]/g, "").trim();
        
        const shops = await database.getShopsByVibe(vibe);
        if (shops.length === 0) {
            await ctx.reply(`😔 စိတ်မကောင်းပါဘူး၊ ${vibe} vibe နဲ့ ဆိုင်စာရင်း မရှိသေးပါ။`);
            return;
        }

        await ctx.reply(`${vibeWithEmoji} ဆိုင်များ:`);
        for (const shop of shops) {
            let message = `🏪 *${shop.name}*\n📍 ${shop.township}\n🎭 ${shop.vibe || 'N/A'}\n📝 ${shop.description || ''}`;
            await ctx.replyWithMarkdown(message, keyboards.favoriteActions(shop.id));
        }
    },

    surpriseMe: async (ctx) => {
        const shops = await database.getAllShops();
        if (shops.length === 0) {
            await ctx.reply('😔 ဆိုင်စာရင်း မရှိသေးပါ။');
            return;
        }
        const randomShop = shops[Math.floor(Math.random() * shops.length)];
        let message = `🎲 *သင့်အတွက် အကြံပြုချက်:*\n\n🏪 *${randomShop.name}*\n📍 ${randomShop.township}\n🎭 ${randomShop.vibe || 'N/A'}\n📝 ${randomShop.description || ''}`;
        await ctx.replyWithMarkdown(message, keyboards.favoriteActions(randomShop.id));
    },

    viewFavorites: async (ctx) => {
        const favorites = await database.getFavorites(ctx.from.id);
        if (favorites.length === 0) {
            await ctx.reply('❤️ သင်သိမ်းဆည်းထားသော ဆိုင်များ မရှိသေးပါ။');
            return;
        }
        await ctx.reply('❤️ သင်နှစ်သက်သော ဆိုင်များ:');
        for (const fav of favorites) {
            let message = `🏪 *${fav.name}*\n📍 ${fav.township}\n🎭 ${fav.vibe || 'N/A'}`;
            await ctx.replyWithMarkdown(message, keyboards.favoriteActions(fav.id));
        }
    },

    // Shop Creation Wizard
    startShopCreation: async (ctx) => {
        ctx.session.addingShop = true;
        ctx.session.shopStep = 'name';
        ctx.session.shopData = {};
        await ctx.reply('🏪 *ဆိုင်အသစ်ထည့်ရန်*\n\nဆိုင်အမည်ကို ရိုက်ထည့်ပါ:', keyboards.back);
    },

    handleShopCreation: async (ctx) => {
        const text = ctx.message.text;
        if (text === '🔙 နောက်သို့') {
            ctx.session.addingShop = false;
            return handlers.start(ctx);
        }

        switch (ctx.session.shopStep) {
            case 'name':
                ctx.session.shopData.name = text;
                ctx.session.shopStep = 'township';
                await ctx.reply('🏙️ မြို့နယ်ကို ရိုက်ထည့်ပါ (သို့မဟုတ် ရွေးချယ်ပါ):', keyboards.townships);
                break;
            case 'township':
                ctx.session.shopData.township = text;
                ctx.session.shopStep = 'vibe';
                await ctx.reply('🎭 ဆိုင်ရဲ့ Vibe ကို ရွေးချယ်ပါ:', keyboards.vibes);
                break;
            case 'vibe':
                ctx.session.shopData.vibe = text.replace(/[^\x00-\x7F]/g, "").trim();
                ctx.session.shopStep = 'description';
                await ctx.reply('📝 ဆိုင်အကြောင်း အကျဉ်းချုပ် ရိုက်ထည့်ပါ:');
                break;
            case 'description':
                ctx.session.shopData.description = text;
                try {
                    await database.createShop(
                        ctx.session.shopData.name,
                        ctx.session.shopData.description,
                        ctx.session.shopData.township,
                        ctx.from.id,
                        ctx.session.shopData.vibe
                    );
                    await ctx.reply('✅ ဆိုင်အသစ်ကို စာရင်းသွင်းပြီးပါပြီ။ Admin မှ အတည်ပြုပေးရန် စောင့်ဆိုင်းပေးပါ။');
                } catch (error) {
                    console.error('Error creating shop:', error);
                    await ctx.reply('❌ ဆိုင်ထည့်ရာတွင် အမှားဖြစ်သွားပါသည်။');
                }
                ctx.session.addingShop = false;
                ctx.session.shopStep = null;
                await handlers.start(ctx);
                break;
        }
    },

    // Menu Creation Wizard
    handleMenuCreation: async (ctx) => {
        const text = ctx.message.text;
        if (text === '🔙 နောက်သို့') {
            ctx.session.addingMenu = false;
            return handlers.start(ctx);
        }

        switch (ctx.session.menuStep) {
            case 'name':
                ctx.session.menuData.item_name = text;
                ctx.session.menuStep = 'price';
                await ctx.reply('💰 ဈေးနှုန်းကို ရိုက်ထည့်ပါ:');
                break;
            case 'price':
                ctx.session.menuData.price = text;
                ctx.session.menuStep = 'description';
                await ctx.reply('📝 ဟင်းလျာအကြောင်း အကျဉ်းချုပ် ရိုက်ထည့်ပါ:');
                break;
            case 'description':
                ctx.session.menuData.description = text;
                ctx.session.menuStep = 'photo';
                await ctx.reply('📸 ဟင်းလျာဓာတ်ပုံ ပေးပို့ပါ:');
                break;
        }
    },

    // Admin Handlers
    viewPendingShops: async (ctx) => {
        const user = await database.getUser(ctx.from.id);
        if (user.role !== 2) return;

        const shops = await database.getShopsByStatus('pending');
        if (shops.length === 0) {
            await ctx.reply('📩 စောင့်ဆိုင်းနေသော ဆိုင်များ မရှိပါ။');
            return;
        }

        for (const shop of shops) {
            let message = `📩 *Pending Shop*\n\n🏪 *${shop.name}*\n📍 ${shop.township}\n👤 Owner ID: ${shop.owner_id}`;
            await ctx.replyWithMarkdown(message, keyboards.shopManagement(shop.id));
        }
    },

    viewUserList: async (ctx) => {
        const user = await database.getUser(ctx.from.id);
        if (user.role !== 2) return;

        const users = await database.getAllUsers();
        let message = `👥 *User စာရင်း (${users.length})*\n\n`;
        users.slice(0, 20).forEach(u => {
            message += `👤 ${u.first_name} (ID: ${u.telegram_id}) - Role: ${u.role}\n`;
        });
        await ctx.replyWithMarkdown(message);
    },

    makeShopAdmin: async (ctx) => {
        const user = await database.getUser(ctx.from.id);
        if (user.role !== 2) return;

        const targetId = parseInt(ctx.message.text.split(' ')[1]);
        if (!targetId) return ctx.reply('Usage: /make_shop [user_id]');

        await database.updateUserRole(targetId, 1);
        await ctx.reply(`✅ User ${targetId} ကို Shop Admin အဖြစ် ပြောင်းလဲပြီးပါပြီ။`);
    },

    makeBotAdmin: async (ctx) => {
        const user = await database.getUser(ctx.from.id);
        if (user.role !== 2) return;

        const targetId = parseInt(ctx.message.text.split(' ')[1]);
        if (!targetId) return ctx.reply('Usage: /make_admin [user_id]');

        await database.updateUserRole(targetId, 2);
        await ctx.reply(`✅ User ${targetId} ကို Bot Admin အဖြစ် ပြောင်းလဲပြီးပါပြီ။`);
    },

    statistics: async (ctx) => {
        const userCount = await database.getUserCount();
        const shopCount = await database.getShopCount();
        const stats = `📊 *Bot Statistics*\n\n👥 စုစုပေါင်း User: ${userCount}\n🏪 စုစုပေါင်း ဆိုင်: ${shopCount}`;
        await ctx.replyWithMarkdown(stats);
    }
};

module.exports = handlers;
