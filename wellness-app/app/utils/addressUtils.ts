/**
 * Utility functions for address formatting
 */

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Format address components into a clean, readable string
 * @param address - Address object containing street, city, state, zipCode, country
 * @param includeCountry - Whether to include country in the formatted address (default: false)
 * @returns Formatted address string
 */
export function formatAddress(address: Address, includeCountry: boolean = false): string {
  if (!address) return '';
  
  const parts: string[] = [];
  
  // Process street - remove any city/state names that might be duplicated in the street
  let street = '';
  if (address.street?.trim()) {
    street = address.street.trim();
    
    // Remove city name from street if it's duplicated
    if (address.city?.trim()) {
      const cityTrimmed = address.city.trim();
      // Create a more precise regex to avoid partial matches
      const cityRegex = new RegExp(`\b${cityTrimmed}\b`, 'gi');
      street = street.replace(cityRegex, '');
    }
    
    // Remove state name from street if it's duplicated
    if (address.state?.trim()) {
      const stateTrimmed = address.state.trim();
      const stateRegex = new RegExp(`\b${stateTrimmed}\b`, 'gi');
      street = street.replace(stateRegex, '');
    }
    
    // Clean up any remaining commas, extra spaces, and standalone punctuation
    street = street
      .replace(/[\s,]+$/, '') // Remove trailing commas/spaces
      .replace(/^[\s,]+/, '') // Remove leading commas/spaces
      .replace(/[\s,]+/g, ' ') // Replace multiple spaces/commas with single space
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    // Handle common address formatting issues
    street = street
      .replace(/\s*,\s*/g, ', ') // Ensure proper comma spacing
      .replace(/\s{2,}/g, ' ') // Remove multiple spaces
      .trim();
    
    if (street) {
      parts.push(street);
    }
  }
  
  // Add city if present and not empty
  if (address.city?.trim()) {
    parts.push(address.city.trim());
  }
  
  // Add state if present and not empty
  if (address.state?.trim()) {
    parts.push(address.state.trim());
  }
  
  // Add zip code if present and not empty
  if (address.zipCode?.trim()) {
    parts.push(address.zipCode.trim());
  }
  
  // Add country if requested and present
  if (includeCountry && address.country?.trim()) {
    parts.push(address.country.trim());
  }
  
  return parts.filter(part => part.length > 0).join(', ');
}

/**
 * Format address for display in a compact form (city, state only)
 * @param address - Address object
 * @returns Compact address string (e.g., "Ahmedabad, Gujarat")
 */
export function formatCompactAddress(address: Address): string {
  if (!address) return '';
  
  const parts: string[] = [];
  
  if (address.city?.trim()) {
    parts.push(address.city.trim());
  }
  
  if (address.state?.trim()) {
    parts.push(address.state.trim());
  }
  
  return parts.join(', ');
}