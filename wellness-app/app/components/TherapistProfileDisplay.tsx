'use client';

import React from 'react';
import { Card, Descriptions, Tag, Space, Typography, Divider } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  IdcardOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  StarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { formatTimeRange } from '../utils/timeUtils';

const { Title, Text } = Typography;

interface TherapistProfileDisplayProps {
  profile: any;
}

const TherapistProfileDisplay: React.FC<TherapistProfileDisplayProps> = ({ profile }) => {
  console.log('TherapistProfileDisplay received profile:', {
    hasProfile: !!profile,
    fullName: profile?.fullName,
    weeklyAvailability: profile?.weeklyAvailability,
    weeklyAvailabilityCount: profile?.weeklyAvailability ? profile.weeklyAvailability.length : 0
  });
  // Format location display
  const getLocationDisplay = () => {
    if (!profile.location) return 'Not specified';
    const parts = [];
    if (profile.location.city) parts.push(profile.location.city);
    if (profile.location.state) parts.push(profile.location.state);
    if (profile.location.country) parts.push(profile.location.country);
    return parts.length > 0 ? parts.join(', ') : 'Not specified';
  };

  // Format skills display
  const getSkillsDisplay = () => {
    if (!profile.skills || profile.skills.length === 0) return 'None specified';
    return profile.skills.map((skill: string, index: number) => (
      <Tag key={index} color="blue">{skill}</Tag>
    ));
  };

  // Format certifications display
  const getCertificationsDisplay = () => {
    if (!profile.certifications || profile.certifications.length === 0) return 'None specified';
    return profile.certifications.map((cert: string, index: number) => (
      <Tag key={index} color="green">{cert}</Tag>
    ));
  };

  // Format availability display
  const getAvailabilityDisplay = () => {
    if (!profile.weeklyAvailability || profile.weeklyAvailability.length === 0) {
      return 'No availability set';
    }

    return (
      <Space orientation="vertical" size="small">
        {profile.weeklyAvailability.map((slot: any, index: number) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClockCircleOutlined />
            <Text strong>{slot.day}:</Text>
            {slot.available ? (
              <Text>{(() => { console.log(`${slot.day} availability data:`, { startTime: slot.startTime, endTime: slot.endTime }); return formatTimeRange(slot.startTime, slot.endTime); })()}</Text>
            ) : (
              <Text type="secondary">Not Available</Text>
            )}
          </div>
        ))}
      </Space>
    );
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Professional Information Section */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserOutlined />
            <span>Professional Information</span>
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        <Descriptions column={1} layout="vertical" size="middle">
          <Descriptions.Item label="Full Name">
            <Text strong>{profile.fullName || 'Not specified'}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Professional Title">
            <Text>{profile.professionalTitle || 'Not specified'}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Years of Experience">
            <Text>{profile.experience !== undefined ? `${profile.experience} years` : 'Not specified'}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="License Number">
            <Text>{profile.licenseNumber || 'Not specified'}</Text>
          </Descriptions.Item>
        </Descriptions>
        
        {profile.bio && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <Text strong>Bio:</Text>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">{profile.bio}</Text>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Contact Information Section */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MailOutlined />
            <span>Contact Information</span>
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        <Descriptions column={1} layout="vertical" size="middle">
          <Descriptions.Item label="Email">
            <Text>{profile.email || 'Not specified'}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Phone Number">
            <Text>{profile.phoneNumber || 'Not specified'}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Location">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EnvironmentOutlined />
              <Text>{getLocationDisplay()}</Text>
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Skills & Certifications Section */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StarOutlined />
            <span>Skills & Certifications</span>
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Skills:</Text>
          <div>
            {getSkillsDisplay()}
          </div>
        </div>
        
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Certifications:</Text>
          <div>
            {getCertificationsDisplay()}
          </div>
        </div>
      </Card>

      {/* Availability Section */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClockCircleOutlined />
            <span>Weekly Availability</span>
          </div>
        }
      >
        {getAvailabilityDisplay()}
      </Card>
    </div>
  );
};

export default TherapistProfileDisplay;