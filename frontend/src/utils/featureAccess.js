// Feature-based access control utility
export const checkFeatureAccess = (user, featureName) => {
  // Platform admins have access to everything
  if (user.role === 'platform_admin') {
    return true;
  }

  // Check if user has an active subscription
  if (!user.subscription || !user.subscription.plan) {
    return false;
  }

  const plan = user.subscription.plan;
  const features = plan.features || [];

  // Check if the feature is included in the plan
  return features.includes(featureName);
};

// Check multiple features at once
export const checkMultipleFeatures = (user, featureNames) => {
  return featureNames.every(feature => checkFeatureAccess(user, feature));
};

// Get user's plan limits
export const getUserLimits = (user) => {
  if (!user.subscription || !user.subscription.plan) {
    return {
      invoices_per_month: 0,
      export_formats: [],
      priority_support: false,
      api_access: false
    };
  }

  const plan = user.subscription.plan;
  return {
    invoices_per_month: plan.limits?.invoices_per_month || 0,
    export_formats: plan.limits?.export_formats || ['PDF'],
    priority_support: plan.features?.includes('Priority support') || false,
    api_access: plan.features?.includes('API access') || false
  };
};

// Feature definitions for different plans
export const FEATURE_DEFINITIONS = {
  'unlimited_invoices': 'Unlimited invoices',
  'priority_support': 'Priority support',
  'api_access': 'API access',
  'advanced_export': 'Advanced export options',
  'custom_branding': 'Custom branding',
  'team_collaboration': 'Team collaboration',
  'white_label': 'White-label solution'
};
