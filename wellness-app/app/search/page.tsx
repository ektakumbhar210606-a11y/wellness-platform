'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Row, Col, Typography, Spin, Empty, Button, Pagination } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import ClientNavbar from '../components/ClientNavbar';
import { searchBusinesses, BusinessSearchParams, ISearchedBusiness } from '../services/businessSearchService';
import CustomerBusinessCard from '../components/CustomerBusinessCard';
import SearchFilters from '../components/SearchFilters';
import { getCountryName } from '../utils/locationData';

const { Content } = Layout;
const { Title, Text } = Typography;

const SearchPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<ISearchedBusiness[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtersVisible, setFiltersVisible] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useState<BusinessSearchParams>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });

  // Load businesses based on search params
  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const response = await searchBusinesses(searchParams);
      
      if (response.success) {
        setBusinesses(response.data.businesses);
        setPagination({
          current: response.data.pagination.currentPage,
          pageSize: response.data.pagination.itemsPerPage,
          total: response.data.pagination.totalItems
        });
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadBusinesses();
  }, []);

  // Log current search parameters for debugging
  useEffect(() => {
    console.log('Current search params:', searchParams);
    console.log('Business count:', businesses.length);
  }, [searchParams, businesses]);

  // Handle search param changes
  useEffect(() => {
    loadBusinesses();
  }, [JSON.stringify(searchParams)]);

  // Handle pagination change
  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({
      ...prev,
      page
    }));
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: BusinessSearchParams) => {
    console.log('Filter change received:', newFilters);
    setSearchParams(prev => {
      const updatedParams = {
        ...prev,
        ...newFilters,
        page: 1 // Reset to first page when filters change
      };
      
      // Remove undefined values to properly clear filters
      Object.keys(updatedParams).forEach(key => {
        if (updatedParams[key as keyof BusinessSearchParams] === undefined) {
          delete updatedParams[key as keyof BusinessSearchParams];
        }
      });
      
      console.log('Updated search params:', updatedParams);
      return updatedParams;
    });
  };

  // Handle search term change
  const handleSearch = (searchTerm: string) => {
    setSearchParams(prev => ({
      ...prev,
      search: searchTerm,
      page: 1 // Reset to first page when search changes
    }));
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <ClientNavbar />
      
      <Content style={{ padding: '20px', marginTop: 64 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
                Discover Businesses Near You
              </Title>
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
                Find the perfect wellness services tailored to your needs
              </Text>
            </Col>
            
            {/* Search Bar */}
            <Col xs={24}>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '16px', 
                borderRadius: '8px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '16px'
              }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} md={16}>
                    <input
                      type="text"
                      placeholder="Search for businesses, services, or locations..."
                      value={searchParams.search || ''}
                      onChange={(e) => handleSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        fontSize: '16px'
                      }}
                    />
                  </Col>
                  <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                    <Button 
                      icon={<FilterOutlined />} 
                      onClick={() => setFiltersVisible(!filtersVisible)}
                    >
                      Filters
                    </Button>
                  </Col>
                </Row>
                
                {/* Filters Section */}
                {filtersVisible && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                    <SearchFilters 
                      onFilterChange={handleFilterChange} 
                      currentFilters={searchParams}
                    />
                  </div>
                )}
              </div>
            </Col>
            
            {/* Results Section */}
            <Col xs={24}>
              <Row gutter={[16, 16]}>
                {loading ? (
                  <Col xs={24} style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                  </Col>
                ) : businesses.length > 0 ? (
                  <>
                    <Col xs={24}>
                      <Text strong>
                        {pagination.total} business{pagination.total !== 1 ? 'es' : ''} found
                      </Text>
                    </Col>
                    
                    {businesses.map((business) => (
                      <Col key={business._id} xs={24} sm={12} lg={8} xl={6}>
                        <CustomerBusinessCard 
                          business={business} 
                          onViewServices={(businessId) => {
                            // Navigate to services page for this business
                            router.push(`/business/${businessId}/services`);
                          }}
                        />
                      </Col>
                    ))}
                    
                    {/* Pagination */}
                    <Col xs={24} style={{ textAlign: 'center', marginTop: '24px' }}>
                      <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                      />
                    </Col>
                  </>
                ) : (
                  <Col xs={24} style={{ textAlign: 'center', padding: '40px' }}>
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No businesses found matching your criteria"
                    />
                  </Col>
                )}
              </Row>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default SearchPage;