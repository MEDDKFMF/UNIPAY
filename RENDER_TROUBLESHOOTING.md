# 🚨 Render Deployment Troubleshooting Guide

## 🔍 **Issues Fixed in Your Configuration**

### ✅ **Fixed Issues:**
1. **Redis Configuration**: Removed localhost Redis URLs that don't work on Render
2. **Dockerfile Optimization**: Added health checks, non-root user, better error handling
3. **Frontend Build**: Simplified build command to prevent failures
4. **Environment Variables**: Added missing required variables
5. **Celery Workers**: Temporarily removed (require Redis service)

## 🚀 **Step-by-Step Deployment Process**

### **Step 1: Deploy Backend First**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Use the updated `render.yaml` configuration
5. **Wait for backend to deploy successfully**

### **Step 2: Test Backend**
```bash
# Test if backend is running
curl https://unipay-1gus.onrender.com/api/

# Should return JSON response or API documentation
```

### **Step 3: Deploy Frontend**
1. After backend is running, deploy frontend
2. Frontend will automatically use the backend URL

### **Step 4: Run Database Migrations**
1. Go to your backend service on Render
2. Click **"Shell"** tab
3. Run these commands:
```bash
python manage.py migrate
python manage.py createsuperuser
```

## 🔧 **Common Issues & Solutions**

### **Issue 1: Build Failures**

**Symptoms:**
- Service fails to start
- Build logs show errors

**Solutions:**
```bash
# Check build logs in Render dashboard
# Look for specific error messages

# Common fixes:
# 1. Update requirements.txt
# 2. Check Python version compatibility
# 3. Verify all dependencies are included
```

### **Issue 2: Database Connection Errors**

**Symptoms:**
- 500 Internal Server Error
- Database connection timeout

**Solutions:**
```bash
# Verify database credentials in render.yaml
# Check if database is running
# Ensure DB_SSL=True is set
```

### **Issue 3: Static Files Not Loading**

**Symptoms:**
- CSS/JS files return 404
- Page loads but looks broken

**Solutions:**
```bash
# Check if WhiteNoise is in requirements.txt
# Verify STATIC_ROOT and STATIC_URL settings
# Run collectstatic command
```

### **Issue 4: CORS Errors**

**Symptoms:**
- Frontend can't connect to backend
- Browser console shows CORS errors

**Solutions:**
```bash
# Update FRONTEND_URL in backend environment variables
# Check CORS_ALLOWED_ORIGINS in Django settings
# Ensure frontend URL is correct
```

### **Issue 5: Memory Issues**

**Symptoms:**
- Service crashes with memory errors
- Build fails due to memory limits

**Solutions:**
```bash
# Optimize Dockerfile (already done)
# Reduce build complexity
# Consider upgrading to paid plan
```

## 📊 **Monitoring Your Deployment**

### **Check Service Health:**
1. **Backend Health**: `https://unipay-1gus.onrender.com/api/`
2. **Frontend Health**: `https://unipay-frontend-c9ss.onrender.com`
3. **Admin Panel**: `https://unipay-1gus.onrender.com/admin/`

### **Monitor Logs:**
1. Go to your service on Render
2. Click **"Logs"** tab
3. Look for error messages
4. Check build logs for issues

### **Common Log Messages:**
```bash
# Good signs:
"Starting gunicorn"
"Database connection successful"
"Static files collected"

# Bad signs:
"Database connection failed"
"Module not found"
"Permission denied"
"Memory limit exceeded"
```

## 🛠️ **Manual Deployment Steps**

If `render.yaml` doesn't work, deploy manually:

### **Backend Manual Deployment:**
1. **Service Type**: Web Service
2. **Environment**: Docker
3. **Dockerfile Path**: `./Dockerfile`
4. **Root Directory**: `./`
5. **Build Command**: (leave empty - handled by Dockerfile)
6. **Start Command**: (leave empty - handled by Dockerfile)

### **Frontend Manual Deployment:**
1. **Service Type**: Static Site
2. **Root Directory**: `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Publish Directory**: `build`

## 🔐 **Environment Variables Checklist**

### **Backend Required Variables:**
```env
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=unipay-1gus.onrender.com,*.onrender.com
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=unipay_klgt
DB_USER=unipay_klgt_user
DB_PASSWORD=your-db-password
DB_SSL=True
FRONTEND_URL=https://unipay-frontend-c9ss.onrender.com
WEASYPRINT_BASE_URL=https://unipay-1gus.onrender.com
```

### **Frontend Required Variables:**
```env
REACT_APP_API_URL=https://unipay-1gus.onrender.com
REACT_APP_BASE_URL=https://unipay-frontend-c9ss.onrender.com
NODE_ENV=production
```

## 🚨 **Emergency Fixes**

### **If Backend Won't Start:**
1. Check logs for specific errors
2. Verify all environment variables are set
3. Test database connection
4. Check if all dependencies are installed

### **If Frontend Won't Build:**
1. Check Node.js version compatibility
2. Verify all npm packages are in package.json
3. Check for syntax errors in React code
4. Ensure build command is correct

### **If Database Connection Fails:**
1. Verify database credentials
2. Check if database is running
3. Ensure SSL is enabled
4. Test connection from local machine

## 📞 **Getting Help**

### **Debug Steps:**
1. **Check Render Logs**: Most issues are visible in logs
2. **Test Locally**: Reproduce issues locally first
3. **Check Dependencies**: Ensure all packages are compatible
4. **Verify Configuration**: Double-check all settings

### **Useful Commands:**
```bash
# Test backend API
curl https://unipay-1gus.onrender.com/api/

# Check if service is running
curl -I https://unipay-1gus.onrender.com/

# Test database connection (in Render shell)
python manage.py dbshell
```

## 🎯 **Success Indicators**

Your deployment is successful when:
- ✅ Backend responds to API calls
- ✅ Frontend loads without errors
- ✅ Database migrations run successfully
- ✅ Admin panel is accessible
- ✅ No errors in service logs

## 🔄 **Next Steps After Successful Deployment**

1. **Create Admin User**: Use the shell to create superuser
2. **Test All Features**: Login, create invoices, test payments
3. **Configure Email**: Set up email notifications
4. **Add Redis Service**: For background tasks (optional)
5. **Set up Monitoring**: Configure alerts and monitoring

Remember: Deploy backend first, then frontend, then test everything!
