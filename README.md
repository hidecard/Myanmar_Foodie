# 🍽️ Myanmar Foodie & Nightlife Telegram Bot

A modern Telegram bot built with Node.js, Telegraf.js, Turso database, and deployed on Vercel. Discover the best restaurants, cafes, and nightlife spots in Myanmar with role-based access for users, shop admins, and bot admins.

## 🚀 Features

### User Features
- 🔍 **Search shops by township or vibe** (Rooftop, Quiet, Family-friendly, Nightlife, etc.)
- 🎲 **Surprise Me** - Get random restaurant recommendations
- ⭐ **Save favorites** and manage personal preferences
- 📊 **View ratings and reviews** from other users
- 📱 **Browse menus** with photos and prices

### Shop Admin Features
- ➕ **Add menu items** with photos, descriptions, and prices
- 🏪 **Add new shops** with detailed information
- 📝 **Edit shop information** and details
- 📊 **View shop statistics** and customer reviews
- 🔄 **Real-time updates** - changes appear instantly for users

### Bot Admin Features
- 👥 **User management** - assign roles and permissions
- 📩 **Approve/reject shop registrations**
- 🏪 **Add new shops** with instant approval
- 🏙️ **Add new townships** for better location coverage
- ⚙️ **System settings** and monitoring
- 📊 **Advanced analytics** and insights

## 🛠 Tech Stack

- **Language**: Node.js (JavaScript/TypeScript ready)
- **Bot Framework**: Telegraf.js (Excellent middleware support)
- **Database**: Turso (LibSQL) - Edge database with low latency
- **Hosting**: Vercel (Serverless functions)
- **State Management**: Telegraf Sessions for multi-step workflows

## 📋 Database Schema

### Tables
- **users** - User accounts with roles (0=User, 1=ShopAdmin, 2=BotAdmin)
- **shops** - Restaurant/shop information with status management
- **menus** - Menu items with photos and pricing
- **reviews** - User ratings and feedback system
- **user_favorites** - Personal favorites management

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Telegram Bot Token (from @BotFather)
- Turso Database account
- Vercel account (for deployment)

### 2. Clone and Install
```bash
git clone <your-repo>
cd mm-shop
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
BOT_TOKEN=your_telegram_bot_token_here
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token_here
```

### 4. Database Setup
```bash
npm run db:migrate
```

### 5. Local Development
```bash
npm run dev
```

### 6. Deploy to Vercel
```bash
npm install -g vercel
vercel
```

## 📱 Bot Commands

### General Commands
- `/start` - Start the bot and get role-based menu
- `/help` - Show help information

### Bot Admin Commands
- `/make_shop [user_id]` - Promote user to Shop Admin
- `/make_admin [user_id]` - Promote user to Bot Admin

## 🎭 User Roles

### Regular User (Role 0)
- Search and discover shops
- View menus and ratings
- Save favorites
- Rate and review shops

### Shop Admin (Role 1)
- All user features +
- Manage shop information
- Add/edit menu items
- View shop analytics

### Bot Admin (Role 2)
- All shop admin features +
- User role management
- Shop approval system
- System administration

## 🏗️ Project Structure

```
mm-shop/
├── api/
│   └── index.js              # Main bot entry point (Vercel function)
├── lib/
│   ├── database.js           # Database operations
│   ├── handlers.js           # Bot command handlers
│   └── keyboards.js          # Telegram keyboards
├── database/
│   └── schema.sql            # Database schema
├── scripts/
│   └── migrate.js            # Database migration script
├── api/index.js              # Vercel webhook handler
├── package.json              # Dependencies and scripts
├── vercel.json               # Vercel configuration
└── README.md                 # This file
```

## 🔧 Configuration

### Telegram Bot Setup
1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Copy the bot token
3. Set the webhook to your Vercel URL: `https://your-app.vercel.app/api`

### Turso Database Setup
1. Create account at [Turso](https://turso.tech)
2. Create new database
3. Get database URL and auth token
4. Run migration script

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

## 🌟 Key Features Implementation

### Role-Based UI
The bot automatically detects user roles and displays appropriate keyboards:
- **User UI**: Search, favorites, discovery
- **Shop Admin UI**: Menu management, shop analytics
- **Bot Admin UI**: User management, shop approval

### Real-Time Updates
- Shop admins can update menu items instantly
- Changes reflect immediately for all users
- No cache delays or manual refresh needed

### Photo Management
- Uses Telegram's native file_id system
- No external storage required
- Fast and efficient photo delivery

### Input Validation
- Price validation for menu items
- Telegram ID validation for admin commands
- Proper error handling and user feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Join our [Telegram community](https://t.me/your-community)

---

**Built with ❤️ for Myanmar's food and nightlife community**
