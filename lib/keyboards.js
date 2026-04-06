const { Markup } = require('telegraf');

// Main menu keyboards based on user role
const keyboards = {
    // User keyboard
    user: Markup.keyboard([
        ['🔍 ဆိုင်ရှာရန်', '🎲 Surprise Me'],
        ['⭐ Saved', '📊 အကြိုက်ဆုံးများ']
    ]).resize(),

    // Shop Admin keyboard
    shopAdmin: Markup.keyboard([
        ['🔍 ဆိုင်ရှာရန်', '🎲 Surprise Me'],
        ['➕ Menu အသစ်ထည့်ရန်', '🏪 ဆိုင်အသစ်ထည့်ရန်'],
        ['📝 ဆိုင်အချက်အလက်ပြင်ရန်', '📊 ဆိုင်စာရင်းကြည့်ရန်'],
        ['⭐ Saved']
    ]).resize(),

    // Bot Admin keyboard
    botAdmin: Markup.keyboard([
        ['📩 Pending Shops', '👥 User စာရင်း'],
        ['🏪 ဆိုင်အသစ်ထည့်ရန်', '🏙️ မြို့နယ်အသစ်ထည့်ရန်'],
        ['⚙️ Settings', '📊 Statistics'],
        ['🔍 ဆိုင်ရှာရန်', '🎲 Surprise Me']
    ]).resize(),

    // Shop search options
    shopSearch: Markup.keyboard([
        ['🏙️ မြို့နယ်အလိုက်ရှာရန်', '🎭 Vibe အလိုက်ရှာရန်'],
        ['🔙 ပင်မစာမျက်နှာသို့']
    ]).resize(),

    // Township options (Extended Myanmar townships)
    townships: Markup.keyboard([
        ['ဗဟန်းသီး', 'လမ်းမတော်', 'ဒဂုံ'],
        ['ကျောက်မြောင်း', 'တောင်ဥက္ကလာပ', 'မရမ်းကုန်း'],
        ['လသာ', 'ဗိုလ်တထောင်', 'ကမာရွတ်'],
        ['အင်းစိန်', 'မင်္ဂလာဒုံ', 'သင်္ဃန်းကျွန်း'],
        ['တာမွေ', 'ဒလမြို့နယ်', 'သန်လျင်'],
        ['ကိုကိုး', 'ကျောက်တံတား', 'တိုက်ကြီး'],
        ['လှည်းကူး', 'မှော်ဘီ', 'တညင်းကုန်း'],
        ['ရွာသာအေး', 'ရန်ကုန်တိုင်းဒေသကြီး', 'အခြားမြို့နယ်များ', '🔙 နောက်သို့']
    ]).resize(),

    // Vibe options
    vibes: Markup.keyboard([
        ['🏙️ Rooftop', '🤫 Quiet'],
        ['👨‍👩‍👧‍👦 Family-friendly', '🌃 Nightlife'],
        ['☕ Cozy Cafe', '🍻 Party'],
        ['🔙 နောက်သို့']
    ]).resize(),

    // Rating keyboard
    rating: Markup.inlineKeyboard([
        [Markup.button.callback('⭐', 'rating_1'), Markup.button.callback('⭐⭐', 'rating_2')],
        [Markup.button.callback('⭐⭐⭐', 'rating_3'), Markup.button.callback('⭐⭐⭐⭐', 'rating_4')],
        [Markup.button.callback('⭐⭐⭐⭐⭐', 'rating_5')]
    ]),

    // Shop management for admin
    shopManagement: (shopId) => Markup.inlineKeyboard([
        [Markup.button.callback('✅ Approve', `approve_shop_${shopId}`), Markup.button.callback('❌ Reject', `reject_shop_${shopId}`)],
        [Markup.button.callback('📝 Details', `shop_details_${shopId}`)]
    ]),

    // Menu item actions
    menuItemActions: (menuId) => Markup.inlineKeyboard([
        [Markup.button.callback('✏️ Edit', `edit_menu_${menuId}`), Markup.button.callback('🗑️ Delete', `delete_menu_${menuId}`)]
    ]),

    // Add to favorites
    favoriteActions: (shopId) => Markup.inlineKeyboard([
        [Markup.button.callback('❤️ Add to Favorites', `add_fav_${shopId}`)],
        [Markup.button.callback('⭐ Rate Shop', `rate_${shopId}`)]
    ]),

    // Back button
    back: Markup.keyboard([
        ['🔙 နောက်သို့']
    ]).resize()
};

module.exports = keyboards;
