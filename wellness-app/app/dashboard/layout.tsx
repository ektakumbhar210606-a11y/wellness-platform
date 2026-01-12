'use client';

import React from 'react';
import { Layout } from 'antd';
import ClientNavbar from '../components/ClientNavbar';

const { Content } = Layout;

const DashboardLayout = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <ClientNavbar />
      <Content style={{ padding: '20px', marginTop: '64px' }}>
        {children}
      </Content>
    </Layout>
  );
};

export default DashboardLayout;