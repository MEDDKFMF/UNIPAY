
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  CreditCard, 
  Globe, 
  Shield, 
  Zap, 
  Users, 
  BarChart3,
  Check,
  ArrowRight,
  Star,
  Play
} from 'lucide-react';

const LandingPage = () => {
  const [userCurrency, setUserCurrency] = useState({ symbol: '$', code: 'USD', name: 'US Dollar' });
  const [locationDetected, setLocationDetected] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Currency mapping by country
  const currencyMap = {
    'KE': { symbol: 'KSh', code: 'KES', name: 'Kenyan Shilling' },
    'US': { symbol: '$', code: 'USD', name: 'US Dollar' },
    'GB': { symbol: '£', code: 'GBP', name: 'British Pound' },
    'EU': { symbol: '€', code: 'EUR', name: 'Euro' },
    'CA': { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
    'AU': { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
    'IN': { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
    'NG': { symbol: '₦', code: 'NGN', name: 'Nigerian Naira' },
    'GH': { symbol: 'GH₵', code: 'GHS', name: 'Ghanaian Cedi' },
    'ZA': { symbol: 'R', code: 'ZAR', name: 'South African Rand' },
    'UG': { symbol: 'USh', code: 'UGX', name: 'Ugandan Shilling' },
    'TZ': { symbol: 'TSh', code: 'TZS', name: 'Tanzanian Shilling' },
  };

  // Fetch plans from admin API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        console.log('Fetching plans from API...');
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/payments/plans/public/`);
        const data = await response.json();
        console.log('Plans API response:', data);
        
        // Handle both array and paginated response
        const plansData = data.results || data;
        const plansArray = Array.isArray(plansData) ? plansData : [];
        console.log('Processed plans:', plansArray);
        
        setPlans(plansArray);
      } catch (error) {
        console.error('Error fetching plans:', error);
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Detect user location and set currency
  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        // First try to get location from browser
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              // Use reverse geocoding to get country
              try {
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                );
                const data = await response.json();
                const countryCode = data.countryCode;
                
                if (currencyMap[countryCode]) {
                  setUserCurrency(currencyMap[countryCode]);
                }
                setLocationDetected(true);
              } catch (error) {
                console.log('Could not detect location, using default currency');
                setLocationDetected(true);
              }
            },
            (error) => {
              console.log('Location access denied, using default currency');
              setLocationDetected(true);
            }
          );
        } else {
          setLocationDetected(true);
        }
      } catch (error) {
        console.log('Error detecting location:', error);
        setLocationDetected(true);
      }
    };

    detectUserLocation();
  }, []);

  // Format price based on detected currency
  const formatPrice = (amount, planCurrency = 'USD') => {
    // If plan currency matches user currency, show original price
    if (planCurrency === userCurrency.code) {
      return `${userCurrency.symbol}${amount}`;
    }
    
    // Convert from plan currency to user currency
    if (userCurrency.code === 'KES') {
      return `${userCurrency.symbol}${(amount * 160).toLocaleString()}`; // Approximate KES rate
    } else if (userCurrency.code === 'NGN') {
      return `${userCurrency.symbol}${(amount * 1600).toLocaleString()}`; // Approximate NGN rate
    } else if (userCurrency.code === 'GHS') {
      return `${userCurrency.symbol}${(amount * 13.5).toLocaleString()}`; // Approximate GHS rate
    } else if (userCurrency.code === 'ZAR') {
      return `${userCurrency.symbol}${(amount * 19).toLocaleString()}`; // Approximate ZAR rate
    } else if (userCurrency.code === 'UGX') {
      return `${userCurrency.symbol}${(amount * 3800).toLocaleString()}`; // Approximate UGX rate
    } else if (userCurrency.code === 'TZS') {
      return `${userCurrency.symbol}${(amount * 2600).toLocaleString()}`; // Approximate TZS rate
    } else {
      return `${userCurrency.symbol}${amount}`;
    }
  };

  const features = [
    {
      icon: FileText,
      title: 'Smart Invoicing',
      description: 'Create professional invoices in seconds with our intuitive interface and real-time currency conversion.'
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Accept payments globally with Stripe integration and multiple payment methods.'
    },
    {
      icon: Globe,
      title: 'Multi-Currency',
      description: 'Support for 70+ currencies with real-time exchange rates and automatic conversion.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with JWT authentication and encrypted data transmission.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built with modern React and Django for optimal performance and user experience.'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track your business metrics with beautiful charts and real-time insights.'
    }
  ];

  // Transform API plans to display format
  const pricingPlans = plans.map((plan, index) => {
    console.log('Processing plan:', plan);
    return {
      id: plan.id,
      name: plan.name,
      price: locationDetected ? formatPrice(plan.price, plan.currency) : `${plan.currency}${plan.price}`,
      period: `/${plan.interval}`,
      description: plan.description || 'Professional invoicing solution',
      features: [
        'Unlimited invoices',
        'Multi-currency support',
        'Professional templates',
        'Client management',
        'Payment tracking',
        'Export options'
      ],
      popular: index === 1, // Make middle plan popular
      originalPrice: plan.price,
      originalCurrency: plan.currency
    };
  });
  
  console.log('Final pricingPlans:', pricingPlans);



  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">UniPay</span>
            </div>
                         <div className="hidden md:flex items-center space-x-8">
               <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
               <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
             </div>
                                    <div className="flex items-center space-x-4">
                          {locationDetected && (
                            <select
                              value={userCurrency.code}
                              onChange={(e) => {
                                const selectedCurrency = Object.values(currencyMap).find(c => c.code === e.target.value);
                                if (selectedCurrency) {
                                  setUserCurrency(selectedCurrency);
                                }
                              }}
                              className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {Object.values(currencyMap).map((currency) => (
                                <option key={currency.code} value={currency.code}>
                                  {currency.symbol} {currency.code}
                                </option>
                              ))}
                            </select>
                          )}
                          <Link
                            to="/login"
                            className="text-gray-600 hover:text-gray-900 font-medium"
                          >
                            Sign In
                          </Link>
                          <Link
                            to="/register"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                          >
                            Get Started
                          </Link>
                        </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Global Invoicing
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
                                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                          Create professional invoices, accept global payments, and manage your business with real-time currency conversion. 
                          Built for the modern world.
                        </p>
                        {locationDetected && userCurrency.code !== 'USD' && (
                          <div className="flex items-center justify-center mb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-full px-4 py-2 flex items-center space-x-2">
                              <Globe className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-700">
                                Prices shown in {userCurrency.name} ({userCurrency.code})
                              </span>
                            </div>
                          </div>
                        )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                 Get Started
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </Link>
              <button className="flex items-center justify-center px-8 py-4 border border-gray-300 rounded-xl text-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to succeed globally
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From real-time currency conversion to professional invoicing, UniPay has all the tools you need.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your business needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plansLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white rounded-2xl p-8 border-2 border-gray-100 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-6"></div>
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ))
            ) : plans.length > 0 ? (
              pricingPlans.map((plan, index) => (
              <div key={index} className={`bg-white rounded-2xl p-8 border-2 ${
                plan.popular ? 'border-blue-600 shadow-xl' : 'border-gray-100'
              }`}>
                {plan.popular && (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium px-4 py-2 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                  {plan.originalCurrency !== userCurrency.code && (
                    <div className="text-sm text-gray-500 mt-1">
                      Originally {plan.originalCurrency}{plan.originalPrice}/{plan.interval}
                    </div>
                  )}
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`w-full block text-center py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))
            ) : (
              // No plans available
              <div className="col-span-3 text-center py-12">
                <div className="text-gray-500">
                  <p className="text-lg">No pricing plans available at the moment.</p>
                  <p className="text-sm mt-2">Please check back later or contact support.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      



      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">UniPay</span>
              </div>
              <p className="text-gray-400">
                Global invoicing and payment solutions for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} UniPay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 