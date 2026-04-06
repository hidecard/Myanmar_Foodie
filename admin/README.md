# Myanmar Foodie Bot - Admin Dashboard

A comprehensive web dashboard for managing the Myanmar Foodie & Nightlife Telegram Bot.

## Features

### 🎯 Dashboard Overview
- Real-time statistics (users, shops, reviews)
- Recent activity feed
- Quick access to all management features

### 👥 User Management
- View all registered users
- Change user roles (User, Shop Admin, Bot Admin)
- Search and filter users
- User activity tracking

### 🏪 Shop Management
- View all shops with details
- Approve/reject pending shops
- Edit shop information
- Delete shops with cascading data cleanup
- Shop statistics and analytics

### ⭐ Review Management
- View all user reviews
- Monitor shop ratings
- Review moderation tools

### ⚙️ Settings
- Bot configuration management
- Township management
- System settings

## Getting Started

### Prerequisites
- Node.js 14+ installed
- Database configured and running
- Admin access to the bot

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the admin dashboard:**
   ```bash
   # Production mode
   npm run admin
   
   # Development mode (with auto-reload)
   npm run dev:admin
   ```

3. **Access the dashboard:**
   Open your browser and navigate to: `http://localhost:3001`

### Authentication

For security, the dashboard requires authentication. Currently, it uses a simple header-based authentication:

- Set the `X-Telegram-ID` header to your Telegram ID
- Only users with role 1 (Shop Admin) or 2 (Bot Admin) can access

**Example using curl:**
```bash
curl -H "X-Telegram-ID: 7398914587" http://localhost:3001/api/admin/stats
```

## API Endpoints

### Authentication Required
All admin endpoints require authentication via the `X-Telegram-ID` header.

### Dashboard Statistics
```
GET /api/admin/stats
```
Returns dashboard statistics including total users, shops, pending shops, and reviews.

### User Management
```
GET /api/admin/users                    # Get all users
PUT /api/admin/users/:id/role           # Update user role
```

### Shop Management
```
GET /api/admin/shops                    # Get all shops
GET /api/admin/shops/pending           # Get pending shops
PUT /api/admin/shops/:id/approve       # Approve shop
PUT /api/admin/shops/:id/reject        # Reject shop
DELETE /api/admin/shops/:id             # Delete shop
GET /api/admin/shops/:id/stats         # Get shop statistics
```

### Reviews
```
GET /api/admin/reviews                  # Get recent reviews
```

## Role Permissions

### Bot Admin (Role 2)
- Full access to all features
- Can change user roles
- Can approve/reject shops
- Can delete shops
- Can manage settings

### Shop Admin (Role 1)
- Can view their own shops
- Can manage their shop menus
- Cannot change user roles
- Cannot approve/reject other shops
- Limited access to dashboard

## Security Features

- Role-based access control
- Input validation and sanitization
- SQL injection prevention
- CORS protection
- Authentication middleware

## Development

### File Structure
```
admin/
├── dashboard.html      # Frontend dashboard
├── server.js          # Backend API server
└── README.md          # This file
```

### Environment Variables
Make sure your `.env` file contains:
```
TURSO_DATABASE_URL=your_database_url
TURSO_AUTH_TOKEN=your_auth_token
ADMIN_PORT=3001
```

### Customization
- Modify `dashboard.html` to change the UI
- Update `server.js` to add new API endpoints
- Extend the database schema for additional features

## Production Deployment

### Using Vercel
The admin dashboard can be deployed alongside the main bot:

1. Update `vercel.json` to include admin routes
2. Set environment variables in Vercel dashboard
3. Deploy using `npm run deploy`

### Using Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "run", "admin"]
```

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Make sure you're setting the `X-Telegram-ID` header
   - Verify your user has admin role in the database

2. **Database Connection Error**
   - Check your `.env` file for correct database credentials
   - Ensure the database is accessible

3. **Port Already in Use**
   - Change the `ADMIN_PORT` environment variable
   - Or stop the process using the port

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=admin:* npm run admin
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

---

**Note:** This admin dashboard is designed for internal use by bot administrators. Ensure proper security measures are in place when deploying to production.
