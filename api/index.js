const { Telegraf, Markup, session } = require('telegraf');
const database = require('../lib/database');
const handlers = require('../lib/handlers');
const keyboards = require('../lib/keyboards');
require('dotenv').config();

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Add session middleware with memory storage
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
    const user = await database.getUser(ctx.from.id);
    
    let helpMessage = `🤖 *Myanmar Foodie & Nightlife Bot Help*\n\n`;
    helpMessage += `🌟 *For Everyone:*\n`;
    helpMessage += `🔍 **ဆိုင်ရှာရန်** - မြို့နယ် သို့မဟုတ် Vibe အလိုက် ဆိုင်များရှာပါ\n`;
    helpMessage += `🎲 **Surprise Me** - ကျွန်ုပ်တို့က ဆိုင်တစ်ခုကို အကြိုက်တွေ့အောင် ရွေးပေးပါမည်\n`;
    helpMessage += `⭐ **Saved** - သင့်ရဲ့ အကြိုက်ဆုံးဆိုင်များ\n`;
    helpMessage += `📊 **အကြိုက်ဆုံးများ** - သင့်ရဲ့ အကြိုက်ဆုံးများ\n\n`;

    if (user.role === 1 || user.role === 2) {
        helpMessage += `🏪 *Shop Admin Commands:*\n`;
        helpMessage += `➕ **Menu အသစ်ထည့်ရန်** - ဆိုင်မှာ မီနူးအသစ်ထည့်ပါ\n`;
        helpMessage += `🏪 **ဆိုင်အသစ်ထည့်ရန်** - ဆိုင်အသစ်ဖန်တီးပါ\n`;
        helpMessage += `📝 **ဆိုင်အချက်အလက်ပြင်ရန်** - ဆိုင်အချက်အလက်များ ပြုပြင်ပါ\n`;
        helpMessage += `📊 **ဆိုင်စာရင်းကြည့်ရန်** - သင့်ဆိုင်ရဲ့ စာရင်းကြည့်ပါ\n\n`;
    }

    if (user.role === 2) {
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

// Bot admin commands
bot.command('make_shop', async (ctx) => {
    await handlers.makeShopAdmin(ctx);
});

bot.command('make_admin', async (ctx) => {
    await handlers.makeBotAdmin(ctx);
});

// Main menu handlers
bot.hears('🔍 ဆိုင်ရှာရန်', async (ctx) => {
    await handlers.shopSearch(ctx);
});

bot.hears('🎲 Surprise Me', async (ctx) => {
    await handlers.surpriseMe(ctx);
});

bot.hears('⭐ Saved', async (ctx) => {
    await handlers.viewFavorites(ctx);
});

bot.hears('📊 အကြိုက်ဆုံးများ', async (ctx) => {
    await handlers.viewFavorites(ctx);
});

// Shop search handlers
bot.hears('🏙️ မြို့နယ်အလိုက်ရှာရန်', async (ctx) => {
    await handlers.searchByTownship(ctx);
});

bot.hears('🎭 Vibe အလိုက်ရှာရန်', async (ctx) => {
    await handlers.searchByVibe(ctx);
});

// Township handlers
bot.hears(['ဗဟန်းသီး', 'လမ်းမတော်', 'ဒဂုံ', 'ကျောက်မြောင်း', 'တောင်ဥက္ကလာပ', 'မရမ်းကုန်း', 'လသာ', 'ဗိုလ်တထောင်', 'ကမာရွတ်', 'အင်းစိန်', 'မင်္ဂလာဒုံ', 'သင်္ဃန်းကျွန်း', 'တာမွေ', 'ဒလမြို့နယ်', 'သန်လျင်', 'ကိုကိုး', 'ကျောက်တံတား', 'တိုက်ကြီး', 'လှည်းကူး', 'မှော်ဘီ', 'တညင်းကုန်း', 'ရွာသာအေး', 'ရန်ကုန်တိုင်းဒေသကြီး'], async (ctx) => {
    await handlers.handleTownshipSelection(ctx);
});

// Vibe handlers
bot.hears(['Rooftop', 'Quiet', 'Family-friendly', 'Nightlife', 'Cozy Cafe', 'Party'], async (ctx) => {
    await handlers.handleVibeSelection(ctx);
});

// Shop admin handlers
bot.hears('🏪 ဆိုင်အသစ်ထည့်ရန်', async (ctx) => {
    await handlers.startShopCreation(ctx);
});

bot.hears('➕ Menu အသစ်ထည့်ရန်', async (ctx) => {
    const user = await database.getUser(ctx.from.id);
    
    if (user.role !== 1) {
        await ctx.reply('❌ ဒီအပ်ဒေါင်းကို Shop Admin များသာ အသုံးပြုနိုင်ပါသည်။');
        return;
    }

    const shops = await database.getShopsByOwner(ctx.from.id);
    
    if (shops.length === 0) {
        await ctx.reply('❌ သင့်ဆိုင်မရှိပါ။ ဆိုင်အသစ်တစ်ခုဖန်တီးရန် Bot Admin ကိုဆက်သွယ်ပါ။');
        return;
    }

    // Start menu addition wizard
    ctx.session.addingMenu = true;
    await ctx.reply('📝 *မီနူးအသစ်ထည့်ရန်*\n\nဟင်းလျာအမည်ကို ရိုက်ထည့်ပါ:');
});

bot.hears('📊 ဆိုင်စာရင်းကြည့်ရန်', async (ctx) => {
    const user = await database.getUser(ctx.from.id);
    
    if (user.role !== 1) {
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
        const reviewCount = rating.review_count || 0;
        
        message += `🏪 *${shop.name}*\n`;
        message += `📍 ${shop.township}\n`;
        message += `📊 Status: ${shop.status}\n`;
        message += `⭐ ${avgRating} (${reviewCount} သုံးသပ်ချက်)\n\n`;
    }

    await ctx.replyWithMarkdown(message);
});

// Bot admin handlers
bot.hears('🏙️ မြို့နယ်အသစ်ထည့်ရန်', async (ctx) => {
    await handlers.startTownshipCreation(ctx);
});

bot.hears('📩 Pending Shops', async (ctx) => {
    await handlers.viewPendingShops(ctx);
});

bot.hears('👥 User စာရင်း', async (ctx) => {
    await handlers.viewUserList(ctx);
});

bot.hears('⚙️ Settings', async (ctx) => {
    await handlers.settings(ctx);
});

bot.hears('📊 Statistics', async (ctx) => {
    await handlers.statistics(ctx);
});

// Bot admin menu and shop handlers
bot.hears('➕ Menu အသစ်ထည့်ရန်', async (ctx) => {
    await handlers.addMenu(ctx);
});

bot.hears('📊 ဆိုင်စာရင်းကြည့်ရန်', async (ctx) => {
    await handlers.viewMyShops(ctx);
});

// Navigation handlers
bot.hears('🔙 နောက်သို့', async (ctx) => {
    await handlers.start(ctx);
});

bot.hears('🔙 ပင်မစာမျက်နှာသို့', async (ctx) => {
    await handlers.start(ctx);
});

// Handle text messages for menu, shop, and township addition wizards
bot.on('text', async (ctx) => {
    // Handle township creation wizard
    if (ctx.session && ctx.session.addingTownship) {
        await handlers.handleTownshipCreation(ctx);
        return;
    }

    // Handle shop creation wizard
    if (ctx.session && ctx.session.addingShop) {
        await handlers.handleShopCreation(ctx);
        return;
    }

    // Handle menu creation wizard
    if (ctx.session && ctx.session.menuStep) {
        await handlers.handleMenuCreation(ctx);
        return;
    }

    // Handle general search
    await handlers.handleSearch(ctx);
});

// Handle photo messages for menu addition
bot.on('photo', async (ctx) => {
    if (ctx.session && ctx.session.menuStep === 'photo') {
        ctx.session.menuData.photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        
        // Save menu item
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
        
        // Reset session
        ctx.session.menuStep = null;
        ctx.session.menuData = null;
    }
});

// Callback query handlers
bot.on('callback_query', async (ctx) => {
    const action = ctx.callbackQuery.data;

    if (action.startsWith('add_fav_')) {
        const shopId = parseInt(action.split('_')[2]);
        await database.addToFavorites(ctx.from.id, shopId);
        await ctx.answerCbQuery('❤️ အကြိုက်ဆုံးများထဲ ထည့်ပြီးပါပြီ!');
        await ctx.editMessageText('❤️ ဆိုင်ကို သင့်ရဲ့ အကြိုက်ဆုံးများထဲ ထည့်ပြီးပါပြီ!');
    }

    if (action.startsWith('rate_')) {
        const shopId = parseInt(action.split('_')[1]);
        ctx.session.ratingShopId = shopId;
        await ctx.reply('⭐ ကြယ်ပွင့်များကို ရွေးချယ်ပါ:', keyboards.rating);
    }

    if (action.startsWith('rating_')) {
        const rating = parseInt(action.split('_')[1]);
        const shopId = ctx.session.ratingShopId;
        
        if (shopId) {
            await database.addReview(shopId, ctx.from.id, rating, null);
            await ctx.answerCbQuery(`${rating} ကြယ်ပွင့် ပေးပြီးပါပြီ!`);
            await ctx.editMessageText(`⭐ ${rating} ကြယ်ပွင့် ပေးခဲ့ပါသည်! ကျေးဇူးတင်ပါသည်!`);
        }
        
        ctx.session.ratingShopId = null;
    }

    if (action.startsWith('approve_shop_')) {
        const shopId = parseInt(action.split('_')[2]);
        const user = await database.getUser(ctx.from.id);
        
        if (user.role === 2) {
            await database.updateShopStatus(shopId, 'approved');
            await ctx.answerCbQuery('✅ ဆိုင်ကို ခွင့်ပြုပြီးပါပြီ!');
            await ctx.editMessageText('✅ ဆိုင်ကို ခွင့်ပြုပြီးပါပြီ!');
        }
    }

    if (action.startsWith('reject_shop_')) {
        const shopId = parseInt(action.split('_')[2]);
        const user = await database.getUser(ctx.from.id);
        
        if (user.role === 2) {
            await database.updateShopStatus(shopId, 'rejected');
            await ctx.answerCbQuery('❌ ဆိုင်ကို ငြင်းပယ်ပြီးပါပြီ!');
            await ctx.editMessageText('❌ ဆိုင်ကို ငြင်းပယ်ပြီးပါပြီ!');
        }
    }
});

// Error handling
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('❌ တစ်ခုခုမှားယွင်းနေပါသည်။ ကျေးဇူးပြုပြီး နောက်မှ ထပ်စမ်းကြည့်ပါ။');
});

// Vercel webhook handler
module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
        
        // Verify webhook secret if needed
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
        }
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error');
    }
};

// For local development
if (require.main === module) {
    bot.launch();
    console.log('🤖 Bot started locally...');
}
