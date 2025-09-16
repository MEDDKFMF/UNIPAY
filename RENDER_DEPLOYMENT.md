# 🚀 Render Deployment Guide for Unipay Invoice Platform

## 📋 Prerequisites
- GitHub repository: https://github.com/MEDDKFMF/unipay.git
- Render account (free tier available)
- PostgreSQL database credentials (already configured)

## 🗄️ Step 1: Create PostgreSQL Database on Render

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Click "New +" → "PostgreSQL"

2. **Database Configuration**
   - **Name**: `unipay-db`
   - **Database**: `unipay_klgt` (already created)
   - **User**: `unipay_klgt_user` (already created)
   - **Password**: `bbe0Q52W2qi01QlG246KD1yTKpqZXwSN` (already set)
   - **Region**: Singapore (or your preferred region)

3. **Note the Connection Details**
   - **Internal Database URL**: `postgresql://unipay_klgt_user:bbe0Q52W2qi01QlG246KD1yTKpqZXwSN@dpg-d347lmje5dus73epqak0-a/unipay_klgt`
   - **External Database URL**: `postgresql://unipay_klgt_user:bbe0Q52W2qi01QlG246KD1yTKpqZXwSN@dpg-d347lmje5dus73epqak0-a.singapore-postgres.render.com/unipay_klgt`

## 🔧 Step 2: Deploy Backend Service

1. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub repository: `MEDDKFMF/unipay`

2. **Service Configuration**
   - **Name**: `unipay-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn core.wsgi:application`

3. **Environment Variables**
   ```env
   DEBUG=False
   SECRET_KEY=your-super-secret-key-here
   ALLOWED_HOSTS=unipay-backend.onrender.com
   DB_HOST=dpg-d347lmje5dus73epqak0-a.singapore-postgres.render.com
   DB_PORT=5432
   DB_NAME=unipay_klgt
   DB_USER=unipay_klgt_user
   DB_PASSWORD=bbe0Q52W2qi01QlG246KD1yTKpqZXwSN
   DB_SSL=True
   FRONTEND_URL=https://unipay-frontend.onrender.com
   REDIS_URL=redis://localhost:6379/0
   CELERY_BROKER_URL=redis://localhost:6379/0
   CELERY_RESULT_BACKEND=redis://localhost:6379/0
   ```

4. **Advanced Settings**
   - **Auto-Deploy**: Yes
   - **Pull Request Previews**: Yes

## 🎨 Step 3: Deploy Frontend (Static Site)

1. **Create Static Site**
   - Click "New +" → "Static Site"
   - Connect GitHub repository: `MEDDKFMF/unipay`

2. **Build Configuration**
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

3. **Environment Variables**
   ```env
   REACT_APP_API_URL=https://unipay-backend.onrender.com/api
   REACT_APP_BASE_URL=https://unipay-backend.onrender.com
   ```

## 🔄 Step 4: Deploy Celery Worker (Optional)

1. **Create Background Worker**
   - Click "New +" → "Background Worker"
   - Connect GitHub repository: `MEDDKFMF/unipay`

2. **Worker Configuration**
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `celery -A core worker -l info`

3. **Environment Variables** (same as backend)

## 🔄 Step 5: Deploy Celery Beat (Optional)

1. **Create Background Worker for Beat**
   - Click "New +" → "Background Worker"
   - Connect GitHub repository: `MEDDKFMF/unipay`

2. **Beat Configuration**
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `celery -A core beat -l info`

3. **Environment Variables** (same as backend)

## 🚀 Step 6: Deploy and Test

1. **Deploy Backend First**
   - Wait for backend deployment to complete
   - Note the backend URL: `https://unipay-backend.onrender.com`

2. **Update Frontend Environment**
   - Update `REACT_APP_API_URL` with actual backend URL
   - Redeploy frontend

3. **Run Database Migrations**
   - Go to backend service logs
   - Run: `python manage.py migrate`
   - Create superuser: `python manage.py createsuperuser`

4. **Test the Application**
   - Frontend: `https://unipay-frontend.onrender.com`
   - Backend API: `https://unipay-backend.onrender.com/api/`
   - Admin Panel: `https://unipay-backend.onrender.com/admin/`

## 🔧 Step 7: Configure Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to service settings
   - Add your custom domain
   - Update DNS records as instructed

2. **Update Environment Variables**
   - Update `ALLOWED_HOSTS` and `FRONTEND_URL` with custom domain

## 📊 Step 8: Monitor and Maintain

1. **Monitor Services**
   - Check service health in Render dashboard
   - Monitor logs for errors
   - Set up alerts for downtime

2. **Database Management**
   - Regular backups (automatic on Render)
   - Monitor database performance
   - Scale if needed

3. **Security**
   - Keep dependencies updated
   - Monitor for security vulnerabilities
   - Use strong secret keys

## 🆘 Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check build logs for missing dependencies
   - Ensure all environment variables are set
   - Verify Python/Node.js versions

2. **Database Connection Issues**
   - Verify database credentials
   - Check SSL settings
   - Ensure database is running

3. **Frontend API Issues**
   - Verify `REACT_APP_API_URL` is correct
   - Check CORS settings in backend
   - Ensure backend is running

4. **Static Files Issues**
   - Check `STATIC_ROOT` and `STATIC_URL` settings
   - Ensure WhiteNoise is configured
   - Verify static files are collected

### Useful Commands:

```bash
# Check service status
curl https://unipay-backend.onrender.com/api/health/

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Check logs
# Go to Render dashboard → Service → Logs
```

## 🎉 Success!

Your Unipay Invoice Platform is now deployed on Render with:
- ✅ PostgreSQL database
- ✅ Django backend API
- ✅ React frontend
- ✅ Celery workers (optional)
- ✅ Production-ready configuration

**Access your application:**
- Frontend: `https://unipay-frontend.onrender.com`
- Backend API: `https://unipay-backend.onrender.com/api/`
- Admin Panel: `https://unipay-backend.onrender.com/admin/`

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

Remember to change the admin password and secret key in production! 🔐
