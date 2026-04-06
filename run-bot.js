const { Telegraf } = require('telegraf');
require('dotenv').config();

const database = require('./lib/database');
const handlers = require('./lib/handlers');
const keyboards = require('./lib/keyboards');

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Middleware to check user role and set appropriate keyboard
bot.use(async (ctx, next) => {
    if (ctx.message) {
        const telegramId = ctx.from.id;
        const user = await database.getUser(telegramId);
        
        if (!user) {
            // Create user if doesn't exist
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

// Start command
bot.start(async (ctx) => {
    await handlers.start(ctx);
});

// Help command
bot.help(async (ctx) => {
    await handlers.help(ctx);
});

// Bot admin commands
bot.command('make_shop', async (ctx) => {
    await handlers.makeShopAdmin(ctx);
});

bot.command('make_admin', async (ctx) => {
    await handlers.makeBotAdmin(ctx);
});

// Shop admin commands
bot.command('add_shop', async (ctx) => {
    await handlers.addShop(ctx);
});

bot.command('my_shops', async (ctx) => {
    await handlers.viewMyShops(ctx);
});

bot.command('add_menu', async (ctx) => {
    await handlers.addMenu(ctx);
});

// General commands
bot.command('search', async (ctx) => {
    await handlers.search(ctx);
});

bot.command('favorites', async (ctx) => {
    await handlers.viewFavorites(ctx);
});

bot.command('random', async (ctx) => {
    await handlers.randomRecommendation(ctx);
});

bot.command('review', async (ctx) => {
    await handlers.addReview(ctx);
});

// Bot admin specific commands (keyboard buttons)
bot.hears('👥 User စာရင်း', async (ctx) => {
    await handlers.viewUserList(ctx);
});

bot.hears('📩 Pending Shops', async (ctx) => {
    await handlers.viewPendingShops(ctx);
});

bot.hears('📊 Statistics', async (ctx) => {
    await handlers.statistics(ctx);
});

bot.hears('⚙️ Settings', async (ctx) => {
    await handlers.settings(ctx);
});

// Shop admin specific commands (keyboard buttons)
bot.hears('🏪 ဆိုင်ထည့်ရန်', async (ctx) => {
    await handlers.addShop(ctx);
});

bot.hears('📋 Menu ထည့်ရန်', async (ctx) => {
    await handlers.addMenu(ctx);
});

bot.hears('🏪 ကျွန်ုပ်ဆိုင်များ', async (ctx) => {
    await handlers.viewMyShops(ctx);
});

// General user commands (keyboard buttons)
bot.hears('🔍 ဆိုင်ရှာရန်', async (ctx) => {
    await handlers.search(ctx);
});

bot.hears('⭐ အကြိုက်ဆုံးများ', async (ctx) => {
    await handlers.viewFavorites(ctx);
});

bot.hears('🎲 ကျွန်ုပ်အတွက်အကြိုက်ဆုံး', async (ctx) => {
    await handlers.randomRecommendation(ctx);
});

bot.hears('⭐ သုံးသပ်ချက်ရေးရန်', async (ctx) => {
    await handlers.addReview(ctx);
});

// Handle text messages for search
bot.on('text', async (ctx) => {
    const user = await database.getUser(ctx.from.id);
    
    // Check if user is in a session (adding shop/menu)
    if (ctx.session && ctx.session.step) {
        await handlers.handleSession(ctx);
        return;
    }
    
    // Handle general search
    if (!ctx.message.text.startsWith('/')) {
        await handlers.handleSearch(ctx);
    }
});

// Error handling
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('❌ တစ်ခုခုမှားယွင်းနေပါသည်။ ကျေးဇူးပြုပြီး နောက်မှ ထပ်စမ်းကြည့်ပါ။');
});

// Start bot
console.log('🚀 Starting Myanmar Foodie Bot locally...');
bot.launch().then(() => {
    console.log('✅ Bot started successfully!');
    console.log('🤖 Bot Admin Commands:');
    console.log('   /make_shop [user_id] - Make user a Shop Admin');
    console.log('   /make_admin [user_id] - Make user a Bot Admin');
    console.log('📊 Your Telegram ID: 7398914587 (Bot Admin)');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
