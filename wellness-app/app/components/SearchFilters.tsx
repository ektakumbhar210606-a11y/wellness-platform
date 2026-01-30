import React, { useState, useEffect } from 'react';
import { Select, Slider, Row, Col, Typography, Rate, Divider } from 'antd';
import { SearchOutlined, StarFilled } from '@ant-design/icons';
import { getFilterOptions } from '../services/businessSearchService';
import { BusinessSearchParams } from '../services/businessSearchService';

const { Option } = Select;
const { Title } = Typography;

interface SearchFiltersProps {
  onFilterChange: (filters: BusinessSearchParams) => void;
  currentFilters: BusinessSearchParams;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onFilterChange, currentFilters }) => {
  const [filterOptions, setFilterOptions] = useState({
    locations: [] as string[],
    countries: [] as string[],
    states: [] as string[],
    cities: [] as string[],
    serviceTypes: [] as string[]
  });
  const [filteredStates, setFilteredStates] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  
  // Function to get cities for a specific country
  const getFilteredCities = (country: string, allCities: string[]): string[] => {
    if (!country) return allCities;
    
    // For now, return all cities since we need to update the backend to support this feature
    // In the future, we can implement a separate API endpoint to get cities by country
    return allCities;
  };

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await getFilterOptions();
        setFilterOptions(options);
        
        // Set initial country if one is already selected
        if (currentFilters.country) {
          setSelectedCountry(currentFilters.country);
          // Set filtered states to the states available for this country
          setFilteredStates(options.states);
          // Set filtered cities to the cities available for this country
          setFilteredCities(options.cities);
          
          // Set initial state if one is already selected
          if (currentFilters.state) {
            setSelectedState(currentFilters.state);
          }
        } else {
          // If no country selected, show all states and cities
          setFilteredStates(options.states);
          setFilteredCities(options.cities);
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFilterOptions();
  }, []);

  // Handle filter changes
  const handleLocationChange = (value: string[]) => {
    onFilterChange({ ...currentFilters, location: value.join(',') });
  };

  const handleCountryChange = async (value: string) => {
    setSelectedCountry(value);
    setSelectedState(''); // Clear state selection when country changes
    
    // When country changes, update the state and city dropdown options
    if (value) {
      // Update filters to include the selected country and clear state/city
      const newFilters = { ...currentFilters, country: value, state: undefined, city: undefined };
      delete newFilters.state; // Remove state from filters
      delete newFilters.city; // Remove city from filters
      onFilterChange(newFilters);
      
      // Reload filter options to get states and cities specific to this country
      try {
        const options = await getFilterOptions();
        setFilterOptions(options);
        setFilteredStates(options.states);
        setFilteredCities(options.cities);
      } catch (error) {
        console.error('Error reloading filter options:', error);
        setFilteredStates(filterOptions.states); // Fallback to all states
        setFilteredCities(filterOptions.cities); // Fallback to all cities
      }
    } else {
      // If country is cleared, clear country, state, and city
      const newFilters = { ...currentFilters };
      delete newFilters.country;
      delete newFilters.state;
      delete newFilters.city;
      onFilterChange(newFilters);
      
      // Reload filter options to get all states and cities again
      try {
        const options = await getFilterOptions();
        setFilterOptions(options);
        setFilteredStates(options.states);
        setFilteredCities(options.cities);
      } catch (error) {
        console.error('Error reloading filter options:', error);
        setFilteredStates(filterOptions.states); // Fallback to all states
        setFilteredCities(filterOptions.cities); // Fallback to all cities
      }
    }
  };

  const handleStateChange = async (value: string) => {
    setSelectedState(value);
    
    // When state changes, update the city dropdown options
    if (value && selectedCountry) {
      // Update filters to include the selected state and clear city
      const newFilters = { ...currentFilters, state: value, city: undefined };
      delete newFilters.city; // Remove city from filters
      onFilterChange(newFilters);
      
      // Reload filter options to get cities specific to this state
      try {
        const options = await getFilterOptions();
        setFilterOptions(options);
        setFilteredCities(options.cities);
      } catch (error) {
        console.error('Error reloading filter options:', error);
        setFilteredCities(filterOptions.cities); // Fallback to all cities
      }
    } else if (!value) {
      // If state is cleared, clear state and city
      const newFilters = { ...currentFilters };
      delete newFilters.state;
      delete newFilters.city;
      onFilterChange(newFilters);
      
      // Reload filter options to get all cities for the selected country
      try {
        const options = await getFilterOptions();
        setFilterOptions(options);
        setFilteredCities(options.cities);
      } catch (error) {
        console.error('Error reloading filter options:', error);
        setFilteredCities(filterOptions.cities); // Fallback to all cities
      }
    }
  };

  const handleCityChange = (value: string) => {
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
    setSelectedCountry('');
    setSelectedState('');
    setFilteredStates(filterOptions.states);
    setFilteredCities(filterOptions.cities);
    onFilterChange({
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Title level={5} style={{ margin: 0 }}>Filters</Title>
          <Divider style={{ margin: '8px 0' }} />
        </Col>
        
        {/* Country Filter */}
        <Col xs={24} md={4}>
          <Typography.Text strong>Country</Typography.Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select country"
            value={currentFilters.country || undefined}
            onChange={handleCountryChange}
            loading={loading}
            allowClear
          >
            {filterOptions.countries.map(country => (
              <Option key={country} value={country}>{country}</Option>
            ))}
          </Select>
        </Col>
        
        {/* State/Province Filter */}
        <Col xs={24} md={4}>
          <Typography.Text strong>State/Province</Typography.Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select state/province"
            value={currentFilters.state || undefined}
            onChange={handleStateChange}
            loading={loading}
            allowClear
            disabled={!selectedCountry}
          >
            {filteredStates.map(state => (
              <Option key={state} value={state}>{state}</Option>
            ))}
          </Select>
        </Col>
        
        {/* City Filter */}
        <Col xs={24} md={4}>
          <Typography.Text strong>City</Typography.Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select city"
            value={currentFilters.city || undefined}
            onChange={handleCityChange}
            loading={loading}
            allowClear
            disabled={!selectedState}
          >
            {filteredCities.map(city => (
              <Option key={city} value={city}>{city}</Option>
            ))}
          </Select>
        </Col>
        
        {/* Service Type Filter */}
        <Col xs={24} md={4}>
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
        <Col xs={24} md={4}>
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