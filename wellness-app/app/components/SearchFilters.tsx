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

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await getFilterOptions();
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
        
        {/* Location Filter */}
        <Col xs={24} md={8}>
          <Typography.Text strong>Location</Typography.Text>
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