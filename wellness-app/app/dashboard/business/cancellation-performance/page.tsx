'use client';

import { useRouter } from 'next/navigation';
import { Typography, Breadcrumb, Space, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import TherapistCancellationPerformance from '@/app/components/business/TherapistCancellationPerformance';

const { Title, Text } = Typography;

const CancellationPerformancePage = () => {
  const router = useRouter();

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Header with Back Button */}
      <div style={{ marginBottom: '24px' }}>
        <Breadcrumb
          style={{ marginBottom: '16px' }}
          items={[
            {
              title: (
                <Button 
                  type="link" 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => router.push('/dashboard/business')}
                  style={{ padding: 0 }}
                >
                  Business Dashboard
                </Button>
              ),
            },
            {
              title: 'Cancellation Performance',
            },
          ]}
        />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Therapist Cancellation Performance
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Monitor and track therapist cancellation statistics and performance metrics
            </Text>
          </div>
        </div>
      </div>

      {/* Main Content - Only Cancellation Performance Component */}
      <TherapistCancellationPerformance />

      {/* Info Section */}
      <div style={{ marginTop: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
        <Title level={5} style={{ marginBottom: '8px' }}>About This Data</Title>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>
            <Text>Monthly cancellations reset on the 1st of every month automatically</Text>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <Text>Therapists with 3+ monthly cancellations may receive warnings</Text>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <Text>Bonus penalties are calculated based on cancellation frequency and customer impact</Text>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <Text>Total cancellations represent lifetime statistics (not reset monthly)</Text>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CancellationPerformancePage;
