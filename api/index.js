const { Telegraf, session } = require('telegraf');
const database = require('../lib/database');
const handlers = require('../lib/handlers');
const keyboards = require('../lib/keyboards');
require('dotenv').config();

if (!process.env.BOT_TOKEN) {
    console.error('❌ Error: BOT_TOKEN is not defined in .env file');
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Session middleware
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

// Bot Commands
bot.start(async (ctx) => await handlers.start(ctx));
bot.command('make_shop', async (ctx) => await handlers.makeShopAdmin(ctx));
bot.command('make_admin', async (ctx) => await handlers.makeBotAdmin(ctx));

// Main Menu Hears
bot.hears('🔍 ဆိုင်ရှာရန်', async (ctx) => await handlers.shopSearch(ctx));
bot.hears('🎲 Surprise Me', async (ctx) => await handlers.surpriseMe(ctx));
bot.hears(['⭐ Saved', '📊 အကြိုက်ဆုံးများ'], async (ctx) => await handlers.viewFavorites(ctx));
bot.hears('🏙️ မြို့နယ်အလိုက်ရှာရန်', async (ctx) => await handlers.searchByTownship(ctx));
bot.hears('🎭 Vibe အလိုက်ရှာရန်', async (ctx) => await handlers.searchByVibe(ctx));

// Township & Vibe Selections
const townships = ['ဗဟန်းသီး', 'လမ်းမတော်', 'ဒဂုံ', 'ကျောက်မြောင်း', 'တောင်ဥက္ကလာပ', 'မရမ်းကုန်း', 'လသာ', 'ဗိုလ်တထောင်', 'ကမာရွတ်', 'အင်းစိန်', 'မင်္ဂလာဒုံ', 'သင်္ဃန်းကျွန်း', 'တာမွေ', 'ဒလမြို့နယ်', 'သန်လျင်', 'ကိုကိုး', 'ကျောက်တံတား', 'တိုက်ကြီး', 'လှည်းကူး', 'မှော်ဘီ', 'တညင်းကုန်း', 'ရွာသာအေး', 'ရန်ကုန်တိုင်းဒေသကြီး', 'အခြားမြို့နယ်များ'];
bot.hears(townships, async (ctx) => await handlers.handleTownshipSelection(ctx));

const vibes = ['🏙️ Rooftop', '🤫 Quiet', '👨‍👩‍👧‍👦 Family-friendly', '🌃 Nightlife', '☕ Cozy Cafe', '🍻 Party'];
bot.hears(vibes, async (ctx) => await handlers.handleVibeSelection(ctx));

// Shop Admin Hears
bot.hears('🏪 ဆိုင်အသစ်ထည့်ရန်', async (ctx) => await handlers.startShopCreation(ctx));
bot.hears('➕ Menu အသစ်ထည့်ရန်', async (ctx) => {
    const shops = await database.getShopsByOwner(ctx.from.id);
    if (shops.length === 0) return ctx.reply('❌ သင့်ဆိုင်မရှိပါ။');
    ctx.session.addingMenu = true;
    ctx.session.menuStep = 'name';
    ctx.session.menuData = { shop_id: shops[0].id };
    await ctx.reply('📝 *မီနူးအသစ်ထည့်ရန်*\n\nဟင်းလျာအမည်ကို ရိုက်ထည့်ပါ:');
});

bot.hears('📊 ဆိုင်စာရင်းကြည့်ရန်', async (ctx) => {
    const shops = await database.getShopsByOwner(ctx.from.id);
    if (shops.length === 0) return ctx.reply('❌ သင့်ဆိုင်မရှိပါ။');
    let message = `📊 *သင့်ဆိုင်များ*\n\n`;
    for (const shop of shops) {
        message += `🏪 *${shop.name}*\n📍 ${shop.township}\n📊 Status: ${shop.status}\n\n`;
    }
    await ctx.replyWithMarkdown(message);
});

// Bot Admin Hears
bot.hears('📩 Pending Shops', async (ctx) => await handlers.viewPendingShops(ctx));
bot.hears('👥 User စာရင်း', async (ctx) => await handlers.viewUserList(ctx));
bot.hears('📊 Statistics', async (ctx) => await handlers.statistics(ctx));
bot.hears(['🔙 နောက်သို့', '🔙 ပင်မစာမျက်နှာသို့'], async (ctx) => await handlers.start(ctx));

// Text Message Handler
bot.on('text', async (ctx) => {
    if (ctx.session.addingShop) return await handlers.handleShopCreation(ctx);
    if (ctx.session.addingMenu) return await handlers.handleMenuCreation(ctx);
});

// Photo Handler for Menu
bot.on('photo', async (ctx) => {
    if (ctx.session.menuStep === 'photo') {
        const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        await database.addMenuItem(
            ctx.session.menuData.shop_id,
            ctx.session.menuData.item_name,
            ctx.session.menuData.description,
            ctx.session.menuData.price,
            photoId
        );
        await ctx.reply(`✅ "${ctx.session.menuData.item_name}" ကို မီနူးထဲ ထည့်ပြီးပါပြီ!`);
        ctx.session.addingMenu = false;
        ctx.session.menuStep = null;
    }
});

// Callback Query Handler
bot.on('callback_query', async (ctx) => {
    const action = ctx.callbackQuery.data;
    if (action.startsWith('add_fav_')) {
        const shopId = parseInt(action.split('_')[2]);
        await database.addToFavorites(ctx.from.id, shopId);
        await ctx.answerCbQuery('❤️ အကြိုက်ဆုံးများထဲ ထည့်ပြီးပါပြီ!');
    } else if (action.startsWith('rate_')) {
        const shopId = parseInt(action.split('_')[1]);
        ctx.session.ratingShopId = shopId;
        await ctx.reply('⭐ ကြယ်ပွင့်များကို ရွေးချယ်ပါ:', keyboards.rating);
    } else if (action.startsWith('rating_')) {
        const rating = parseInt(action.split('_')[1]);
        if (ctx.session.ratingShopId) {
            await database.addReview(ctx.session.ratingShopId, ctx.from.id, rating, null);
            await ctx.answerCbQuery(`${rating} ကြယ်ပွင့် ပေးပြီးပါပြီ!`);
            await ctx.editMessageText(`⭐ ${rating} ကြယ်ပွင့် ပေးခဲ့ပါသည်! ကျေးဇူးတင်ပါသည်!`);
        }
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
    } else if (action.startsWith('delete_menu_')) {
        const menuId = parseInt(action.split('_')[2]);
        await database.deleteMenuItem(menuId);
        await ctx.answerCbQuery('🗑️ Menu item ကို ဖျက်ပြီးပါပြီ!');
    }
    await ctx.answerCbQuery();
});

// Vercel Webhook Export
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
        }
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Error');
    }
};

// Local development
if (require.main === module) {
    bot.launch().then(() => console.log('🤖 Bot started locally...'));
}
