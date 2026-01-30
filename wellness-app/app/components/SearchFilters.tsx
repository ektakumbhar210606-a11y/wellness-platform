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
    serviceTypes: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(currentFilters.country || '');
  const [selectedState, setSelectedState] = useState(currentFilters.state || '');

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // If a country is already selected in the filters, load country-specific options
        const options = currentFilters.country 
          ? await getFilterOptions({ country: currentFilters.country })
          : await getFilterOptions();
        setFilterOptions(options);
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
      
      // Reload filter options for this country
      try {
        const options = await getFilterOptions({ country: value });
        setFilterOptions(options);
      } catch (error) {
        console.error('Error reloading filter options:', error);
      }
    } else {
      // If country is cleared, clear country, state, and city
      const newFilters = { ...currentFilters };
      delete newFilters.country;
      delete newFilters.state;
      delete newFilters.city;
      onFilterChange(newFilters);
      
      // Reload filter options to get all locations again
      try {
        const options = await getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Error reloading filter options:', error);
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
      
      // Reload filter options for this country
      try {
        const options = await getFilterOptions({ country: selectedCountry });
        setFilterOptions(options);
      } catch (error) {
        console.error('Error reloading filter options:', error);
      }
    } else if (!value) {
      // If state is cleared, clear state and city
      const newFilters = { ...currentFilters };
      delete newFilters.state;
      delete newFilters.city;
      onFilterChange(newFilters);
      
      // Reload filter options for the selected country
      try {
        const options = selectedCountry 
          ? await getFilterOptions({ country: selectedCountry })
          : await getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Error reloading filter options:', error);
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
    // Reset local state
    setSelectedCountry('');
    setSelectedState('');
    
    // Reset filtered options to show all available options
    setFilterOptions({
      locations: [],
      serviceTypes: []
    });
    
    // Clear all filter values from currentFilters and reset to default search parameters
    // We need to explicitly clear all filter fields to ensure they're removed
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
          >
            <Option value="USA">United States</Option>
            <Option value="India">India</Option>
            <Option value="Canada">Canada</Option>
            <Option value="UK">United Kingdom</Option>
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
          >
            {selectedCountry === 'USA' && (
              <>
                <Option value="California">California</Option>
                <Option value="Florida">Florida</Option>
                <Option value="New York">New York</Option>
                <Option value="Texas">Texas</Option>
              </>
            )}
            {selectedCountry === 'India' && (
              <Option value="Maharashtra">Maharashtra</Option>
            )}
            {selectedCountry === 'Canada' && (
              <Option value="Ontario">Ontario</Option>
            )}
            {selectedCountry === 'UK' && (
              <Option value="England">England</Option>
            )}
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
          >
            {selectedCountry === 'USA' && selectedState === 'California' && (
              <Option value="Los Angeles">Los Angeles</Option>
            )}
            {selectedCountry === 'USA' && selectedState === 'Florida' && (
              <Option value="Miami">Miami</Option>
            )}
            {selectedCountry === 'USA' && selectedState === 'New York' && (
              <Option value="New York">New York</Option>
            )}
            {selectedCountry === 'USA' && selectedState === 'Texas' && (
              <Option value="Houston">Houston</Option>
            )}
            {selectedCountry === 'India' && selectedState === 'Maharashtra' && (
              <Option value="Mumbai">Mumbai</Option>
            )}
            {selectedCountry === 'Canada' && selectedState === 'Ontario' && (
              <Option value="Toronto">Toronto</Option>
            )}
            {selectedCountry === 'UK' && selectedState === 'England' && (
              <Option value="London">London</Option>
            )}
          </Select>
        </Col>
        
        {/* Location Filter (tags) */}
        <Col xs={24} md={6}>
          <Typography.Text strong>Location Tags</Typography.Text>
          <Select
            mode="tags"
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Enter cities, states, or zip codes"
            value={currentFilters.location ? currentFilters.location.split(',') : []}
            onChange={handleLocationChange}
            loading={loading}
          >
            {filterOptions.locations.map(location => (
              <Option key={location} value={location}>{location}</Option>
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