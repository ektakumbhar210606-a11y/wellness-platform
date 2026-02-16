/**
 * Currency formatter utility for the wellness platform
 * Formats prices with hardcoded Indian Rupee symbol (₹)
 */

interface CurrencyConfig {
  locale: string;
  currency: string;
  currencySymbol: string;
}

// Currency configuration mapping countries to their respective currencies
const CURRENCY_CONFIG: Record<string, CurrencyConfig> = {
  'USA': {
    locale: 'en-US',
    currency: 'USD',
    currencySymbol: '$',
  },
  'India': {
    locale: 'en-IN',
    currency: 'INR',
    currencySymbol: '₹',
  },
  // Add more countries as needed
  'default': {
    locale: 'en-IN',
    currency: 'INR',
    currencySymbol: '₹',
  }
};

/**
 * Gets the currency configuration for a given country
 * @param country - The country name
 * @returns Currency configuration object
 */
export const getCurrencyConfig = (country: string): CurrencyConfig => {
  return CURRENCY_CONFIG[country] || CURRENCY_CONFIG['default'];
};

/**
 * Formats a price value based on the business's selected country
 * @param price - The numeric price value to format
 * @param country - The country name for determining currency format
 * @returns Formatted price string with appropriate currency symbol
 */
export const formatCurrency = (price: number, country: string): string => {
  const currencyConfig = getCurrencyConfig(country);
  
  // Use Intl.NumberFormat for proper currency formatting
  try {
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: currencyConfig.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch (error) {
    // Fallback to basic formatting if Intl fails
    console.warn(`Intl.NumberFormat failed for locale ${currencyConfig.locale}:`, error);
    return `${currencyConfig.currencySymbol}${price.toFixed(2)}`;
  }
};

/**
 * Gets the currency symbol for a given country
 * @param country - The country name
 * @returns Currency symbol string
 */
export const getCurrencySymbol = (country: string): string => {
  return getCurrencyConfig(country).currencySymbol;
};

/**
 * Gets the currency code for a given country
 * @param country - The country name
 * @returns Currency code string
 */
export const getCurrencyCode = (country: string): string => {
  return getCurrencyConfig(country).currency;
};