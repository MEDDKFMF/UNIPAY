# 🚀 Complete Deployment Guide for Invoice Platform

This guide will help you deploy both the backend (Django + PostgreSQL) and frontend (React) to Render.

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Domain Names**: Choose your subdomain names (e.g., `invoice-platform-backend`, `invoice-platform-frontend`)

## 🗄️ Step 1: Deploy PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `invoice-platform-db`
   - **Plan**: Free (or upgrade for production)
   - **Database**: `invoice_platform`
   - **User**: `invoice_platform_user`
4. Click **"Create Database"**
5. **Save the connection details** - you'll need them for the backend

## 🔧 Step 2: Deploy Backend (Django + PostgreSQL)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

### Basic Settings:
- **Name**: `invoice-platform-backend`
- **Environment**: `Python 3`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)

### Build & Deploy:
- **Build Command**: 
  ```bash
  pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput
  ```
- **Start Command**: 
  ```bash
  gunicorn core.wsgi:application
  ```

### Environment Variables:
Add these environment variables in the Render dashboard:

```env
# Django Settings
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=invoice-platform-backend.onrender.com

# Database (from your PostgreSQL service)
DB_HOST=your-db-host
DB_PORT=your-db-port
DB_NAME=invoice_platform
DB_USER=invoice_platform_user
DB_PASSWORD=your-db-password
DB_SSL=True

# Frontend URL (update after deploying frontend)
FRONTEND_URL=https://invoice-platform-frontend.onrender.com

# Redis (optional, for background tasks)
REDIS_URL=redis://localhost:6379/0

# Email Settings (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# Payment Gateways (optional)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Twilio (optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

4. Click **"Create Web Service"**
5. Wait for deployment to complete
6. **Note your backend URL**: `https://invoice-platform-backend.onrender.com`

## ⚛️ Step 3: Deploy Frontend (React)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository
4. Configure the service:

### Basic Settings:
- **Name**: `invoice-platform-frontend`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `build`

### Environment Variables:
Add these environment variables:

```env
# API Configuration
REACT_APP_API_URL=https://invoice-platform-backend.onrender.com/api
REACT_APP_BASE_URL=https://invoice-platform-backend.onrender.com
```

4. Click **"Create Static Site"**
5. Wait for deployment to complete
6. **Note your frontend URL**: `https://invoice-platform-frontend.onrender.com`

## 🔄 Step 4: Update Backend CORS Settings

1. Go to your backend service on Render
2. Go to **"Environment"** tab
3. Update the `FRONTEND_URL` variable to your frontend URL:
   ```
   FRONTEND_URL=https://invoice-platform-frontend.onrender.com
   ```
4. Click **"Save Changes"**
5. The service will automatically redeploy

## 🧪 Step 5: Test Your Deployment

### Test Backend:
1. Visit: `https://invoice-platform-backend.onrender.com/api/`
2. You should see the API documentation or a JSON response

### Test Frontend:
1. Visit: `https://invoice-platform-frontend.onrender.com`
2. Try to register a new account
3. Test the login functionality

### Test Database Connection:
1. Go to your backend service logs
2. Look for any database connection errors
3. If there are errors, check your database credentials

## 🔐 Step 6: Create Admin User

1. Go to your backend service on Render
2. Go to **"Shell"** tab
3. Run these commands:
   ```bash
   python manage.py shell
   ```
   ```python
   from accounts.models import User
   User.objects.create_superuser(
       username='admin',
       email='admin@example.com',
       password='admin123',
       first_name='Admin',
       last_name='User'
   )
   print('Admin user created: admin/admin123')
   exit()
   ```

## 🚨 Troubleshooting

### Common Issues:

#### 1. **Database Connection Error**
- Check your database credentials
- Ensure the database is running
- Verify the `DB_SSL=True` setting

#### 2. **CORS Error**
- Update `FRONTEND_URL` in backend environment variables
- Check that the frontend URL is correct

#### 3. **Static Files Error**
- Ensure `whitenoise` is in requirements.txt
- Check that `collectstatic` is running in build command

#### 4. **Build Failures**
- Check the build logs for specific errors
- Ensure all dependencies are in requirements.txt
- Verify the build command is correct

#### 5. **Frontend Not Loading**
- Check that `REACT_APP_API_URL` is correct
- Verify the backend is running and accessible
- Check browser console for errors

### Debugging Steps:

1. **Check Logs**: Go to your service → "Logs" tab
2. **Test API**: Use Postman or curl to test endpoints
3. **Check Environment Variables**: Ensure all required variables are set
4. **Database Access**: Test database connection separately

## 📈 Production Optimizations

### Backend Optimizations:
1. **Upgrade to Paid Plan**: For better performance
2. **Enable Redis**: For caching and background tasks
3. **Set up Monitoring**: Use Render's monitoring features
4. **Configure CDN**: For static file delivery

### Frontend Optimizations:
1. **Enable Gzip**: For better compression
2. **Set up CDN**: For faster loading
3. **Configure Caching**: For better performance

## 🔒 Security Considerations

1. **Use Strong Passwords**: For all accounts and services
2. **Enable HTTPS**: Render provides this by default
3. **Regular Updates**: Keep dependencies updated
4. **Environment Variables**: Never commit secrets to code
5. **Database Security**: Use strong database passwords

## 📊 Monitoring & Maintenance

1. **Check Logs Regularly**: Monitor for errors
2. **Update Dependencies**: Keep packages updated
3. **Monitor Performance**: Use Render's metrics
4. **Backup Database**: Regular backups recommended
5. **Test Deployments**: Test before major updates

## 🆘 Support

If you encounter issues:

1. **Check Render Documentation**: [docs.render.com](https://docs.render.com)
2. **Review Logs**: Look for specific error messages
3. **Test Locally**: Reproduce issues locally first
4. **Community Support**: Check Render's community forums

## 🎉 Success!

Once deployed, you'll have:
- ✅ **Backend API**: Running on PostgreSQL
- ✅ **Frontend App**: Accessible via web
- ✅ **Database**: Persistent data storage
- ✅ **HTTPS**: Secure connections
- ✅ **Auto-deploy**: Updates from GitHub

Your Invoice Platform is now live and ready to use! 🚀
