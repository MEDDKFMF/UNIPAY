import React from 'react';
import { FeatureGuard, useFeatureAccess } from './FeatureGuard';

// Example of how to use feature access control
export const InvoiceCreationExample = ({ user }) => {
  const hasUnlimitedInvoices = useFeatureAccess(user, 'Unlimited invoices');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Invoice Creation</h2>
      
      {/* Basic invoice creation - available to all */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-medium mb-2">Create Invoice</h3>
        <p className="text-sm text-gray-600 mb-3">Basic invoice creation is available to all users.</p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Create Invoice
        </button>
      </div>

      {/* Advanced features - restricted by plan */}
      <FeatureGuard user={user} feature="Unlimited invoices">
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <h3 className="font-medium mb-2 text-green-800">Unlimited Invoices</h3>
          <p className="text-sm text-green-600 mb-3">You have unlimited invoice creation with your current plan.</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            Create Unlimited Invoices
          </button>
        </div>
      </FeatureGuard>

      {/* API access - restricted by plan */}
      <FeatureGuard user={user} feature="API access">
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium mb-2 text-blue-800">API Access</h3>
          <p className="text-sm text-blue-600 mb-3">Access our REST API for programmatic invoice creation.</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            View API Documentation
          </button>
        </div>
      </FeatureGuard>

      {/* Priority support - restricted by plan */}
      <FeatureGuard user={user} feature="Priority support">
        <div className="bg-white p-4 rounded-lg border border-purple-200">
          <h3 className="font-medium mb-2 text-purple-800">Priority Support</h3>
          <p className="text-sm text-purple-600 mb-3">You have access to priority customer support.</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded">
            Contact Priority Support
          </button>
        </div>
      </FeatureGuard>

      {/* Show current usage for limited plans */}
      {!hasUnlimitedInvoices && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-medium mb-2 text-yellow-800">Usage Limit</h3>
          <p className="text-sm text-yellow-700">
            You have used X of Y invoices this month. Upgrade to unlimited for unrestricted access.
          </p>
        </div>
      )}
    </div>
  );
};

