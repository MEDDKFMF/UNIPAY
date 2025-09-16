import React from 'react';

const baseClasses =
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50';

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  purple: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
  ghost: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
};

function Button({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  ...rest
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${className}`}
      {...rest}
    >
      {Icon ? <Icon className="w-4 h-4 mr-2" /> : null}
      <span>{loading ? 'Please wait...' : children}</span>
    </button>
  );
}

export default Button;


