# 🚀 Vercel Deployment Guide

## 📋 Prerequisites
1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Telegram Bot Token** - From [@BotFather](https://t.me/BotFather)
3. **Turso Database** - Account at [turso.tech](https://turso.tech)

## 🔧 Step-by-Step Deployment

### 1. **Install Vercel CLI**
```bash
npm install -g vercel
```

### 2. **Login to Vercel**
```bash
vercel login
```

### 3. **Set up Environment Variables**
Create a `.env` file with:
```env
BOT_TOKEN=your_telegram_bot_token_here
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token_here
```

### 4. **Set up Database**
```bash
npm run db:migrate
```

### 5. **Deploy to Vercel**
```bash
# Preview deployment
npm run deploy:preview

# Production deployment
npm run deploy
```

### 6. **Set Telegram Webhook**
After deployment, set the webhook:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-app.vercel.app/api"}'
```

## 🔍 Troubleshooting

### Common Issues & Solutions

#### ❌ **"Function timeout"**
- **Cause**: Function taking too long (>30s)
- **Fix**: Increase `maxDuration` in `vercel.json`

#### ❌ **"Database connection failed"**
- **Cause**: Wrong Turso credentials
- **Fix**: Check `.env` variables

#### ❌ **"Bot token invalid"**
- **Cause**: Wrong or expired bot token
- **Fix**: Get new token from @BotFather

#### ❌ **"Webhook not set"**
- **Cause**: Telegram not receiving updates
- **Fix**: Set webhook manually with curl command

#### ❌ **"CORS errors"**
- **Cause**: Missing CORS headers
- **Fix**: Already included in webhook handler

## 📊 Environment Variables in Vercel

Go to your Vercel dashboard → Project Settings → Environment Variables:

| Variable | Value | Description |
|----------|--------|-------------|
| `BOT_TOKEN` | Your Telegram bot token | From @BotFather |
| `TURSO_DATABASE_URL` | Your Turso DB URL | From Turso dashboard |
| `TURSO_AUTH_TOKEN` | Your Turso auth token | From Turso dashboard |
| `NODE_ENV` | `production` | Set automatically |

## 🔄 Local Development

### Run locally:
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run database migration
npm run db:migrate

# Start local development
npm run dev
```

### Test webhook locally:
```bash
# Install ngrok for webhook testing
npm install -g ngrok

# Start ngrok
ngrok http 3000

# Use ngrok URL for webhook
```

## 📱 Testing the Bot

1. **Start the bot**: Send `/start` to your bot
2. **Test user features**: Search shops, browse menus
3. **Test admin features**: Add shops, manage menus
4. **Check logs**: Vercel dashboard → Functions → Logs

## 🛠️ Advanced Configuration

### Custom Domain
1. Go to Vercel dashboard → Project → Settings
2. Add custom domain
3. Update webhook URL with new domain

### SSL Certificate
- Automatically handled by Vercel
- No manual configuration needed

### Monitoring
- Vercel Analytics for performance
- Custom logging in bot code
- Error tracking in dashboard

## 📞 Support

If deployment fails:
1. Check Vercel logs
2. Verify environment variables
3. Test database connection
4. Check Telegram bot token

## 🎉 Success Checklist

- [ ] Bot responds to `/start`
- [ ] Environment variables set
- [ ] Database connected
- [ ] Webhook configured
- [ ] All features working
- [ ] Error handling tested

---

**🚀 Your Myanmar Foodie & Nightlife Bot is now live!**
