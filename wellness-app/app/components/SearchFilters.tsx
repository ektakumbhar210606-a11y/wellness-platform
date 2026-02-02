import React, { useState, useEffect } from 'react';
import { Select, Slider, Row, Col, Typography, Rate, Divider } from 'antd';
import { SearchOutlined, StarFilled } from '@ant-design/icons';
import { getFilterOptions } from '../services/businessSearchService';
import { BusinessSearchParams } from '../services/businessSearchService';
import { 
  getAllCountries, 
  getStatesForCountry, 
  getCitiesForState, 
  getCountryCode,
  getCountryName
} from '../utils/locationData';

const { Option } = Select;
const { Title } = Typography;

interface SearchFiltersProps {
  onFilterChange: (filters: BusinessSearchParams) => void;
  currentFilters: BusinessSearchParams;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onFilterChange, currentFilters }) => {
  const [filterOptions, setFilterOptions] = useState({
    locations: [] as string[],
    states: [] as string[],
    cities: [] as string[],
    serviceTypes: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(currentFilters.country ? getCountryName(currentFilters.country) : '');
  const [selectedState, setSelectedState] = useState(currentFilters.state || '');
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // Load basic filter options (service types, locations)
        const options = await getFilterOptions();
        setFilterOptions({
          locations: options.locations || [],
          states: options.states || [],
          cities: options.cities || [],
          serviceTypes: options.serviceTypes || []
        });
      } catch (error) {
        console.error('Error loading filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFilterOptions();
  }, []);

  // Update available states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const states = getStatesForCountry(selectedCountry);
      setAvailableStates(states);
      
      // If current state is not in available states, clear it
      if (selectedState && !states.includes(selectedState)) {
        setSelectedState('');
        const newFilters = { ...currentFilters };
        delete newFilters.state;
        delete newFilters.city;
        onFilterChange(newFilters);
      }
    } else {
      setAvailableStates([]);
      setSelectedState('');
      setAvailableCities([]);
      
      // Clear state and city from filters
      const newFilters = { ...currentFilters };
      delete newFilters.country;
      delete newFilters.state;
      delete newFilters.city;
      onFilterChange(newFilters);
    }
  }, [selectedCountry]);

  // Update available cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const cities = getCitiesForState(selectedCountry, selectedState);
      setAvailableCities(cities);
      
      // If current city is not in available cities, clear it
      if (currentFilters.city && !cities.includes(currentFilters.city)) {
        const newFilters = { ...currentFilters };
        delete newFilters.city;
        onFilterChange(newFilters);
      }
    } else {
      setAvailableCities([]);
      
      // Clear city from filters
      if (currentFilters.city) {
        const newFilters = { ...currentFilters };
        delete newFilters.city;
        onFilterChange(newFilters);
      }
    }
  }, [selectedCountry, selectedState]);

  // Handle filter changes


  const handleCountryChange = (value: string) => {
    console.log('Selected country:', value);
    setSelectedCountry(value);
    setSelectedState(''); // Clear state selection when country changes
    
    // When country changes, update the filters
    if (value) {
      // Convert country name to code for API compatibility
      const countryCode = getCountryCode(value);
      const newFilters = { ...currentFilters, country: countryCode, state: undefined, city: undefined };
      delete newFilters.state; // Remove state from filters
      delete newFilters.city; // Remove city from filters
      onFilterChange(newFilters);
    } else {
      // If country is cleared, clear country, state, and city
      const newFilters = { ...currentFilters };
      delete newFilters.country;
      delete newFilters.state;
      delete newFilters.city;
      onFilterChange(newFilters);
    }
  };

  const handleStateChange = (value: string) => {
    console.log('Selected state:', value);
    setSelectedState(value);
    
    // When state changes, update the filters
    if (value && selectedCountry) {
      // Update filters to include the selected state and clear city
      const newFilters = { ...currentFilters, state: value, city: undefined };
      delete newFilters.city; // Remove city from filters
      onFilterChange(newFilters);
    } else if (!value) {
      // If state is cleared, clear state and city
      const newFilters = { ...currentFilters };
      delete newFilters.state;
      delete newFilters.city;
      onFilterChange(newFilters);
    }
  };

  const handleCityChange = (value: string) => {
    console.log('Selected city:', value);
    onFilterChange({ ...currentFilters, city: value });
  };

  const handleServiceTypeChange = (value: string[]) => {
    onFilterChange({ ...currentFilters, serviceType: value.join(',') });
  };

  // Handle rating change (using slider)
  const handleMinRatingChange = (value: number | undefined) => {
    if (value === undefined) {
      const { minRating, ...rest } = currentFilters;
      onFilterChange(rest);
    } else {
      onFilterChange({ ...currentFilters, minRating: value });
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    console.log('Clearing all filters');
    // Reset local state
    setSelectedCountry('');
    setSelectedState('');
    setAvailableStates([]);
    setAvailableCities([]);
    
    // Reset filtered options to show all available options
    setFilterOptions({
      locations: [],
      states: [],
      cities: [],
      serviceTypes: []
    });
    
    // Clear all filter values from currentFilters and reset to default search parameters
    const clearedFilters: BusinessSearchParams = {
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      // Explicitly clear all filter fields
      search: undefined,
      location: undefined,
      country: undefined,
      state: undefined,
      city: undefined,
      serviceType: undefined,
      minRating: undefined
    };
    
    onFilterChange(clearedFilters);
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Title level={5} style={{ margin: 0 }}>Filters</Title>
          <Divider style={{ margin: '8px 0' }} />
        </Col>
        
        {/* Country Filter */}
        <Col xs={24} md={6}>
          <Typography.Text strong>Country</Typography.Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select country"
            value={selectedCountry}
            onChange={handleCountryChange}
            loading={loading}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {getAllCountries().map(country => (
              <Option key={country} value={country}>{country}</Option>
            ))}
          </Select>
        </Col>
        
        {/* State/Province Filter */}
        <Col xs={24} md={6}>
          <Typography.Text strong>State/Province</Typography.Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select state"
            value={selectedState}
            onChange={handleStateChange}
            loading={loading}
            disabled={!selectedCountry}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {availableStates.map(state => (
              <Option key={state} value={state}>{state}</Option>
            ))}
          </Select>
        </Col>
        
        {/* City Filter */}
        <Col xs={24} md={6}>
          <Typography.Text strong>City</Typography.Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select city"
            value={currentFilters.city}
            onChange={handleCityChange}
            loading={loading}
            disabled={!selectedState}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {availableCities.map(city => (
              <Option key={city} value={city}>{city}</Option>
            ))}
          </Select>
        </Col>
        

        
        {/* Service Type Filter */}
        <Col xs={24} md={8}>
          <Typography.Text strong>Service Type</Typography.Text>
          <Select
            mode="multiple"
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select service types"
            value={currentFilters.serviceType ? currentFilters.serviceType.split(',') : []}
            onChange={handleServiceTypeChange}
            loading={loading}
          >
            {filterOptions.serviceTypes.map(type => (
              <Option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</Option>
            ))}
          </Select>
        </Col>
        
        {/* Rating Filter */}
        <Col xs={24} md={8}>
          <Typography.Text strong>Minimum Rating</Typography.Text>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
            <Slider
              min={0}
              max={5}
              step={0.5}
              defaultValue={0}
              value={currentFilters.minRating ?? 0}
              onChange={handleMinRatingChange}
              tooltip={{ formatter: (value) => value ? `${value} stars` : 'Any rating' }}
              style={{ flex: 1, marginRight: 12 }}
            />
            <Rate 
              value={currentFilters.minRating ?? 0} 
              character={<StarFilled />}
              allowHalf
              style={{ fontSize: '16px' }}
            />
          </div>
        </Col>
      </Row>
      
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <button 
          onClick={handleClearFilters}
          style={{
            padding: '4px 16px',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: 'white'
          }}
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;