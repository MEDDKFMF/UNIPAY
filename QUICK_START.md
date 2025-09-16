# Quick Start Guide - Windows

## 🚀 **Option 1: Docker (Recommended)**

The easiest way to get started is using Docker:

```bash
# 1. Start the database and Redis
docker-compose up -d db redis

# 2. Start the full application
docker-compose up
```

This will start:
- PostgreSQL database on port 5432
- Redis on port 6379
- Django backend on port 8000
- React frontend on port 3000

## 🛠 **Option 2: Local Development (If Docker fails)**

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (install from https://www.postgresql.org/download/windows/)

### Step 1: Database Setup
```bash
# Create database
createdb invoice_platform
```

### Step 2: Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies (try this first)
pip install -r requirements-dev.txt

# If that fails, try installing Pillow separately
pip install --only-binary=all Pillow==10.1.0
pip install -r requirements-dev.txt

# Set environment variables
set DEBUG=True
set SECRET_KEY=dev-secret-key
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/invoice_platform

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```

### Step 3: Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend server
npm start
```

## 🔧 **Troubleshooting**

### Pillow Installation Issues
If you get compilation errors with Pillow:

1. **Try pre-compiled wheels:**
   ```bash
   pip install --only-binary=all Pillow==10.1.0
   ```

2. **Use conda (if available):**
   ```bash
   conda install pillow
   ```

3. **Install Visual Studio Build Tools:**
   - Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Install with C++ build tools

### Database Connection Issues
1. Make sure PostgreSQL is running
2. Check if the database exists: `createdb invoice_platform`
3. Verify connection: `psql -d invoice_platform`

### Port Conflicts
If ports are already in use:
- Backend: Change port in `python manage.py runserver 8001`
- Frontend: Change port in `npm start -- --port 3001`

## 🌐 **Access the Application**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

## 📝 **Default Credentials**

- **Username**: admin
- **Password**: (you set this during setup)

## 🎯 **Next Steps**

1. **Create your first invoice:**
   - Go to http://localhost:3000
   - Login with admin credentials
   - Navigate to Invoices → Create Invoice

2. **Add a client:**
   - Go to Clients → Create Client
   - Fill in client details

3. **Test the API:**
   - Visit http://localhost:8000/api/auth/login/
   - Use the browsable API interface

## 🐛 **Common Issues**

### "Module not found" errors
```bash
# Make sure you're in the virtual environment
venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements-dev.txt
```

### "Database connection failed"
```bash
# Check if PostgreSQL is running
# On Windows, check Services app for "postgresql-x64-15"

# Create database if it doesn't exist
createdb invoice_platform
```

### "npm install" fails
```bash
# Clear npm cache
npm cache clean --force

# Try with legacy peer deps
npm install --legacy-peer-deps
```

## 📞 **Need Help?**

1. Check the main README.md for detailed documentation
2. Look at the error messages carefully
3. Try the Docker approach if local setup fails
4. Make sure all prerequisites are installed

## 🚀 **Production Deployment**

For production deployment:
1. Set `DEBUG=False`
2. Use proper environment variables
3. Set up SSL certificates
4. Configure production database
5. Use Docker Compose production configuration 