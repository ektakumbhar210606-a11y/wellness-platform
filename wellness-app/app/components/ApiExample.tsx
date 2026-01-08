'use client';

import React, { useState } from 'react';
import { Button, Card, Typography, Space, Input, message } from 'antd';
import { useApi, useGet, usePost, usePut, useDelete } from '../hooks/useApi';

const { Title, Text, Paragraph } = Typography;

const ApiExample: React.FC = () => {
  const [userId, setUserId] = useState<number | ''>(1);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Example using the generic useApi hook
  const [apiRequest, apiResponse] = useApi();

  // Example using the convenience GET hook
  const [fetchUser, userResponse] = useGet(`https://jsonplaceholder.typicode.com/users/${userId || 1}`);

  // Example using the convenience POST hook
  const [createUser, createResponse] = usePost('https://jsonplaceholder.typicode.com/users');

  // Example using the convenience PUT hook
  const [updateUser, updateResponse] = usePut(`https://jsonplaceholder.typicode.com/users/${userId || 1}`);

  // Example using the convenience DELETE hook
  const [deleteUser, deleteResponse] = useDelete(`https://jsonplaceholder.typicode.com/users/${userId || 1}`);

  const handleGetUser = async () => {
    if (!userId) {
      message.error('Please enter a user ID');
      return;
    }
    try {
      await fetchUser();
      message.success('User fetched successfully');
    } catch (error) {
      message.error('Failed to fetch user');
    }
  };

  const handleCreateUser = async () => {
    if (!userName || !userEmail) {
      message.error('Please enter both name and email');
      return;
    }
    try {
      await createUser({ name: userName, email: userEmail });
      message.success('User created successfully');
      setUserName('');
      setUserEmail('');
    } catch (error) {
      message.error('Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!userId || !userName || !userEmail) {
      message.error('Please enter user ID, name, and email');
      return;
    }
    try {
      await updateUser({ id: userId, name: userName, email: userEmail });
      message.success('User updated successfully');
    } catch (error) {
      message.error('Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!userId) {
      message.error('Please enter a user ID');
      return;
    }
    try {
      await deleteUser();
      message.success('User deleted successfully');
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>API Hook Examples</Title>
      <Paragraph>
        This component demonstrates how to use the custom API hooks for different HTTP methods.
      </Paragraph>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* GET Request Example */}
        <Card title="GET Request">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Input
                type="number"
                placeholder="User ID"
                value={userId === '' ? '' : userId}
                onChange={(e) => setUserId(e.target.value ? parseInt(e.target.value, 10) : '')}
                style={{ width: '200px' }}
              />
              <Button type="primary" onClick={handleGetUser}>
                Fetch User
              </Button>
            </Space>
            
            {userResponse.loading && <Text>Loading...</Text>}
            {userResponse.error && <Text type="danger">Error: {userResponse.error}</Text>}
            {userResponse.data && (
              <div>
                <Text strong>User Data:</Text>
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                  {JSON.stringify(userResponse.data, null, 2)}
                </pre>
              </div>
            )}
          </Space>
        </Card>

        {/* POST Request Example */}
        <Card title="POST Request">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Input
                placeholder="User Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                style={{ width: '200px' }}
              />
              <Input
                placeholder="User Email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                style={{ width: '200px' }}
              />
              <Button type="primary" onClick={handleCreateUser}>
                Create User
              </Button>
            </Space>
            
            {createResponse.loading && <Text>Loading...</Text>}
            {createResponse.error && <Text type="danger">Error: {createResponse.error}</Text>}
            {createResponse.data && (
              <div>
                <Text strong>Created User:</Text>
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                  {JSON.stringify(createResponse.data, null, 2)}
                </pre>
              </div>
            )}
          </Space>
        </Card>

        {/* PUT Request Example */}
        <Card title="PUT Request">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Input
                type="number"
                placeholder="User ID"
                value={userId === '' ? '' : userId}
                onChange={(e) => setUserId(e.target.value ? parseInt(e.target.value, 10) : '')}
                style={{ width: '100px' }}
              />
              <Input
                placeholder="User Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                style={{ width: '200px' }}
              />
              <Input
                placeholder="User Email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                style={{ width: '200px' }}
              />
              <Button type="primary" onClick={handleUpdateUser}>
                Update User
              </Button>
            </Space>
            
            {updateResponse.loading && <Text>Loading...</Text>}
            {updateResponse.error && <Text type="danger">Error: {updateResponse.error}</Text>}
            {updateResponse.data && (
              <div>
                <Text strong>Updated User:</Text>
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                  {JSON.stringify(updateResponse.data, null, 2)}
                </pre>
              </div>
            )}
          </Space>
        </Card>

        {/* DELETE Request Example */}
        <Card title="DELETE Request">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Input
                type="number"
                placeholder="User ID"
                value={userId === '' ? '' : userId}
                onChange={(e) => setUserId(e.target.value ? parseInt(e.target.value, 10) : '')}
                style={{ width: '200px' }}
              />
              <Button type="primary" danger onClick={handleDeleteUser}>
                Delete User
              </Button>
            </Space>
            
            {deleteResponse.loading && <Text>Loading...</Text>}
            {deleteResponse.error && <Text type="danger">Error: {deleteResponse.error}</Text>}
            {deleteResponse.data && (
              <Text type="success">User deleted successfully!</Text>
            )}
          </Space>
        </Card>

        {/* Generic API Request Example */}
        <Card title="Generic API Request">
          <Space>
            <Button 
              onClick={() => {
                apiRequest({
                  method: 'GET',
                  url: 'https://jsonplaceholder.typicode.com/posts/1',
                });
              }}
            >
              Generic GET Request
            </Button>
            
            <Button 
              onClick={() => {
                apiRequest({
                  method: 'POST',
                  url: 'https://jsonplaceholder.typicode.com/posts',
                  data: { title: 'Test Post', body: 'This is a test post', userId: 1 }
                });
              }}
            >
              Generic POST Request
            </Button>
          </Space>
          
          {apiResponse.loading && <Text>Loading...</Text>}
          {apiResponse.error && <Text type="danger">Error: {apiResponse.error}</Text>}
          {apiResponse.data && (
            <div>
              <Text strong>Response:</Text>
              <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                {JSON.stringify(apiResponse.data, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </Space>
    </div>
  );
};

export default ApiExample;