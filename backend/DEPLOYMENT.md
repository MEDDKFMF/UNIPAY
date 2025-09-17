# Deployment Guide for Render

This guide will help you deploy the Invoice Platform backend to Render with PostgreSQL.

## Prerequisites

1. A Render account (free tier available)
2. A GitHub repository with your code
3. Environment variables configured

## Step 1: Prepare Your Repository

1. Make sure all files are committed and pushed to your GitHub repository
2. Ensure the `requirements.txt` includes all necessary dependencies
3. Verify the `render.yaml` configuration file is in the root of your backend directory

## Step 2: Create PostgreSQL Database on Render

1. Go to your Render dashboard
2. Click "New +" and select "PostgreSQL"
3. Choose the "Free" plan
4. Name your database (e.g., `invoice-platform-db`)
5. Click "Create Database"
6. Note down the database credentials

## Step 3: Create Redis Instance (Optional but Recommended)

1. Go to your Render dashboard
2. Click "New +" and select "Redis"
3. Choose the "Free" plan
4. Name your Redis instance (e.g., `invoice-platform-redis`)
5. Click "Create Redis"

## Step 4: Deploy the Backend Service

1. Go to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `invoice-platform-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
   - **Start Command**: `gunicorn core.wsgi:application`

## Step 5: Configure Environment Variables

In your Render service settings, add these environment variables:

### Required Variables:
```
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=your-backend-url.com
DB_HOST=your-db-host
DB_PORT=your-db-port
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=True
FRONTEND_URL=https://your-frontend-url.com
REDIS_URL=your-redis-url
```

### Optional Variables (for full functionality):
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

## Step 6: Deploy and Test

1. Click "Create Web Service"
2. Wait for the deployment to complete
3. Test your API endpoints
4. Check the logs for any errors

## Step 7: Update Frontend Configuration

Update your frontend to use the new backend URL:

```javascript
// In your frontend services, update the base URL
const API_BASE_URL = 'https://your-backend-url.com/api';
```

## Database Migrations

The deployment script automatically runs migrations, but you can also run them manually:

```bash
python manage.py migrate
```

## Creating a Superuser

To create an admin user, you can:

1. Use the Render shell:
   ```bash
   python manage.py shell
   ```
   Then create a user:
   ```python
   from accounts.models import User
   User.objects.create_superuser('admin', 'admin@example.com', 'password')
   ```

2. Or use the deployment script which creates a default admin user

## Troubleshooting

### Common Issues:

1. **Database Connection Error**: Check your database credentials and ensure the database is accessible
2. **Static Files Error**: Ensure `collectstatic` is running and `whitenoise` is configured
3. **CORS Error**: Update `CORS_ALLOWED_ORIGINS` with your frontend URL
4. **Environment Variables**: Double-check all required variables are set

### Logs:

Check the Render logs for detailed error information:
1. Go to your service dashboard
2. Click on "Logs" tab
3. Look for error messages and stack traces

## Production Considerations

1. **Security**: Use strong secret keys and secure passwords
2. **HTTPS**: Render provides HTTPS by default
3. **Monitoring**: Set up monitoring and alerts
4. **Backups**: Regular database backups are recommended
5. **Scaling**: Upgrade to paid plans for better performance

## Support

If you encounter issues:
1. Check the Render documentation
2. Review the Django logs
3. Verify all environment variables are set correctly
4. Test locally with the same configuration
