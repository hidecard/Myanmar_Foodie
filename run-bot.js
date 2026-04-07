const { Telegraf, session } = require('telegraf');
const database = require('./lib/database');
const handlers = require('./lib/handlers');
const keyboards = require('./lib/keyboards');
require('dotenv').config();

if (!process.env.BOT_TOKEN) {
    console.error('❌ Error: BOT_TOKEN is not defined in .env file');
    process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Add session middleware
bot.use(session({
    defaultSession: () => ({
        addingMenu: false,
        addingShop: false,
        addingTownship: false,
        menuStep: null,
        menuData: null,
        shopStep: null,
        shopData: null,
        ratingShopId: null
    })
}));

// Middleware to check user role
bot.use(async (ctx, next) => {
    if (ctx.from) {
        const telegramId = ctx.from.id;
        const user = await database.getUser(telegramId);
        
        if (!user) {
            await database.createUser(
                ctx.from.id,
                ctx.from.username,
                ctx.from.first_name,
                ctx.from.last_name
            );
        }
    }
    return next();
});

// Re-use handlers from api/index.js logic
bot.start(async (ctx) => await handlers.start(ctx));
bot.help(async (ctx) => {
    const user = await database.getUser(ctx.from.id);
    let helpMessage = `🤖 *Myanmar Foodie & Nightlife Bot Help*\n\n`;
    helpMessage += `🌟 *For Everyone:*\n`;
    helpMessage += `🔍 **ဆိုင်ရှာရန်** - မြို့နယ် သို့မဟုတ် Vibe အလိုက် ဆိုင်များရှာပါ\n`;
    helpMessage += `🎲 **Surprise Me** - ကျွန်ုပ်တို့က ဆိုင်တစ်ခုကို အကြိုက်တွေ့အောင် ရွေးပေးပါမည်\n`;
    helpMessage += `⭐ **Saved** - သင့်ရဲ့ အကြိုက်ဆုံးဆိုင်များ\n`;
    helpMessage += `📊 **အကြိုက်ဆုံးများ** - သင့်ရဲ့ အကြိုက်ဆုံးများ\n\n`;

    if (user && (user.role === 1 || user.role === 2)) {
        helpMessage += `🏪 *Shop Admin Commands:*\n`;
        helpMessage += `➕ **Menu အသစ်ထည့်ရန်** - ဆိုင်မှာ မီနူးအသစ်ထည့်ပါ\n`;
        helpMessage += `🏪 **ဆိုင်အသစ်ထည့်ရန်** - ဆိုင်အသစ်ဖန်တီးပါ\n`;
        helpMessage += `📝 **ဆိုင်အချက်အလက်ပြင်ရန်** - ဆိုင်အချက်အလက်များ ပြုပြင်ပါ\n`;
        helpMessage += `📊 **ဆိုင်စာရင်းကြည့်ရန်** - သင့်ဆိုင်ရဲ့ စာရင်းကြည့်ပါ\n\n`;
    }

    if (user && user.role === 2) {
        helpMessage += `🤖 *Bot Admin Commands:*\n`;
        helpMessage += `/make_shop [user_id] - User ကို Shop Admin လုပ်ပါ\n`;
        helpMessage += `/make_admin [user_id] - User ကို Bot Admin လုပ်ပါ\n`;
        helpMessage += `🏙️ **မြို့နယ်အသစ်ထည့်ရန်** - မြို့နယ်အသစ်များထည့်ပါ\n`;
        helpMessage += `📩 **Pending Shops** - စောင့်ဆိုင်းနေသော ဆိုင်များကြည့်ပါ\n`;
        helpMessage += `👥 **User စာရင်း** - အသုံးပြုသူစာရင်းကြည့်ပါ\n\n`;
    }

    helpMessage += `💡 **Tips:**\n`;
    helpMessage += `• Use /start anytime to return to main menu\n`;
    helpMessage += `• All changes are saved automatically\n`;
    helpMessage += `• Bot works 24/7 for your convenience!`;

    await ctx.replyWithMarkdown(helpMessage);
});

bot.command('make_shop', async (ctx) => await handlers.makeShopAdmin(ctx));
bot.command('make_admin', async (ctx) => await handlers.makeBotAdmin(ctx));

bot.hears('🔍 ဆိုင်ရှာရန်', async (ctx) => await handlers.shopSearch(ctx));
bot.hears('🎲 Surprise Me', async (ctx) => await handlers.surpriseMe(ctx));
bot.hears(['⭐ Saved', '📊 အကြိုက်ဆုံးများ'], async (ctx) => await handlers.viewFavorites(ctx));
bot.hears('🏙️ မြို့နယ်အလိုက်ရှာရန်', async (ctx) => await handlers.searchByTownship(ctx));
bot.hears('🎭 Vibe အလိုက်ရှာရန်', async (ctx) => await handlers.searchByVibe(ctx));

bot.hears(['ဗဟန်းသီး', 'လမ်းမတော်', 'ဒဂုံ', 'ကျောက်မြောင်း', 'တောင်ဥက္ကလာပ', 'မရမ်းကုန်း', 'လသာ', 'ဗိုလ်တထောင်', 'ကမာရွတ်', 'အင်းစိန်', 'မင်္ဂလာဒုံ', 'သင်္ဃန်းကျွန်း', 'တာမွေ', 'ဒလမြို့နယ်', 'သန်လျင်', 'ကိုကိုး', 'ကျောက်တံတား', 'တိုက်ကြီး', 'လှည်းကူး', 'မှော်ဘီ', 'တညင်းကုန်း', 'ရွာသာအေး', 'ရန်ကုန်တိုင်းဒေသကြီး', 'အခြားမြို့နယ်များ'], async (ctx) => {
    await handlers.handleTownshipSelection(ctx);
});

bot.hears(['🏙️ Rooftop', '🤫 Quiet', '👨‍👩‍👧‍👦 Family-friendly', '🌃 Nightlife', '☕ Cozy Cafe', '🍻 Party'], async (ctx) => {
    await handlers.handleVibeSelection(ctx);
});

bot.hears('🏪 ဆိုင်အသစ်ထည့်ရန်', async (ctx) => await handlers.startShopCreation(ctx));
bot.hears('➕ Menu အသစ်ထည့်ရန်', async (ctx) => {
    const user = await database.getUser(ctx.from.id);
    if (user.role !== 1 && user.role !== 2) {
        await ctx.reply('❌ ဒီအပ်ဒေါင်းကို Shop Admin များသာ အသုံးပြုနိုင်ပါသည်။');
        return;
    }
    const shops = await database.getShopsByOwner(ctx.from.id);
    if (shops.length === 0) {
        await ctx.reply('❌ သင့်ဆိုင်မရှိပါ။');
        return;
    }
    ctx.session.addingMenu = true;
    ctx.session.menuStep = 'name';
    ctx.session.menuData = { shop_id: shops[0].id };
    await ctx.reply('📝 *မီနူးအသစ်ထည့်ရန်*\n\nဟင်းလျာအမည်ကို ရိုက်ထည့်ပါ:');
});

bot.hears('📊 ဆိုင်စာရင်းကြည့်ရန်', async (ctx) => {
    const user = await database.getUser(ctx.from.id);
    if (user.role !== 1 && user.role !== 2) {
        await ctx.reply('❌ ဒီအပ်ဒေါင်းကို Shop Admin များသာ အသုံးပြုနိုင်ပါသည်။');
        return;
    }
    const shops = await database.getShopsByOwner(ctx.from.id);
    if (shops.length === 0) {
        await ctx.reply('❌ သင့်ဆိုင်မရှိပါ။');
        return;
    }
    let message = `📊 *သင့်ဆိုင်များ*\n\n`;
    for (const shop of shops) {
        const rating = await database.getShopAverageRating(shop.id);
        const avgRating = rating.avg_rating ? parseFloat(rating.avg_rating).toFixed(1) : 'N/A';
        message += `🏪 *${shop.name}*\n📍 ${shop.township}\n📊 Status: ${shop.status}\n⭐ ${avgRating}\n\n`;
    }
    await ctx.replyWithMarkdown(message);
});

bot.hears('🏙️ မြို့နယ်အသစ်ထည့်ရန်', async (ctx) => await handlers.startTownshipCreation(ctx));
bot.hears('📩 Pending Shops', async (ctx) => await handlers.viewPendingShops(ctx));
bot.hears('👥 User စာရင်း', async (ctx) => await handlers.viewUserList(ctx));
bot.hears('⚙️ Settings', async (ctx) => await handlers.settings(ctx));
bot.hears('📊 Statistics', async (ctx) => await handlers.statistics(ctx));
bot.hears(['🔙 နောက်သို့', '🔙 ပင်မစာမျက်နှာသို့'], async (ctx) => await handlers.start(ctx));

bot.on('text', async (ctx) => {
    if (ctx.session.addingTownship) return await handlers.handleTownshipCreation(ctx);
    if (ctx.session.addingShop) return await handlers.handleShopCreation(ctx);
    if (ctx.session.addingMenu) return await handlers.handleMenuCreation(ctx);
    await handlers.handleSearch(ctx);
});

bot.on('photo', async (ctx) => {
    if (ctx.session.menuStep === 'photo') {
        ctx.session.menuData.photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        try {
            await database.addMenuItem(
                ctx.session.menuData.shop_id,
                ctx.session.menuData.item_name,
                ctx.session.menuData.description,
                ctx.session.menuData.price,
                ctx.session.menuData.photoId,
                ctx.session.menuData.category
            );
            await ctx.reply(`✅ "${ctx.session.menuData.item_name}" ကို မီနူးထဲ ထည့်ပြီးပါပြီ!`);
        } catch (error) {
            console.error('Error adding menu item:', error);
            await ctx.reply('❌ Menu item ထည့်ရာတွင်အမှားဖြစ်ပါသည်။');
        }
        ctx.session.addingMenu = false;
        ctx.session.menuStep = null;
        ctx.session.menuData = null;
    }
});

bot.on('callback_query', async (ctx) => {
    const action = ctx.callbackQuery.data;
    if (action.startsWith('add_fav_')) {
        const shopId = parseInt(action.split('_')[2]);
        await database.addToFavorites(ctx.from.id, shopId);
        await ctx.answerCbQuery('❤️ အကြိုက်ဆုံးများထဲ ထည့်ပြီးပါပြီ!');
        await ctx.editMessageText('❤️ ဆိုင်ကို သင့်ရဲ့ အကြိုက်ဆုံးများထဲ ထည့်ပြီးပါပြီ!');
    } else if (action.startsWith('rate_')) {
        const shopId = parseInt(action.split('_')[1]);
        ctx.session.ratingShopId = shopId;
        await ctx.reply('⭐ ကြယ်ပွင့်များကို ရွေးချယ်ပါ:', keyboards.rating);
    } else if (action.startsWith('rating_')) {
        const rating = parseInt(action.split('_')[1]);
        const shopId = ctx.session.ratingShopId;
        if (shopId) {
            await database.addReview(shopId, ctx.from.id, rating, null);
            await ctx.answerCbQuery(`${rating} ကြယ်ပွင့် ပေးပြီးပါပြီ!`);
            await ctx.editMessageText(`⭐ ${rating} ကြယ်ပွင့် ပေးခဲ့ပါသည်! ကျေးဇူးတင်ပါသည်!`);
        }
        ctx.session.ratingShopId = null;
    } else if (action.startsWith('approve_shop_')) {
        const shopId = parseInt(action.split('_')[2]);
        await database.updateShopStatus(shopId, 'approved');
        await ctx.answerCbQuery('✅ ဆိုင်ကို ခွင့်ပြုပြီးပါပြီ!');
        await ctx.editMessageText('✅ ဆိုင်ကို ခွင့်ပြုပြီးပါပြီ!');
    } else if (action.startsWith('reject_shop_')) {
        const shopId = parseInt(action.split('_')[2]);
        await database.updateShopStatus(shopId, 'rejected');
        await ctx.answerCbQuery('❌ ဆိုင်ကို ငြင်းပယ်ပြီးပါပြီ!');
        await ctx.editMessageText('❌ ဆိုင်ကို ငြင်းပယ်ပြီးပါပြီ!');
    } else if (action.startsWith('shop_details_')) {
        const shopId = parseInt(action.split('_')[2]);
        const shop = await database.getShop(shopId);
        if (shop) {
            let message = `🏪 *${shop.name}*\n\n📍 ${shop.township}\n🎭 ${shop.vibe || 'N/A'}\n📝 ${shop.description || ''}\n`;
            if (shop.map_url) message += `🗺️ [Google Maps](${shop.map_url})\n`;
            await ctx.replyWithMarkdown(message, keyboards.favoriteActions(shopId));
        }
        await ctx.answerCbQuery();
    } else if (action.startsWith('delete_menu_')) {
        const menuId = parseInt(action.split('_')[2]);
        await database.deleteMenuItem(menuId);
        await ctx.answerCbQuery('🗑️ Menu item ကို ဖျက်ပြီးပါပြီ!');
        await ctx.editMessageText('🗑️ Menu item ကို ဖျက်ပြီးပါပြီ!');
    }
});

bot.launch().then(() => {
    console.log('🤖 Local Bot started successfully!');
}).catch(err => {
    console.error('❌ Failed to launch bot:', err);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
