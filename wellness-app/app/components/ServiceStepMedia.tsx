import React from 'react';
import { Upload, Button, Typography, Space } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { RcFile } from 'antd/es/upload';

const { Title, Text } = Typography;

interface ServiceStepMediaProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  current: number;
  totalSteps: number;
}

const ServiceStepMedia: React.FC<ServiceStepMediaProps> = ({ 
  formData, 
  setFormData, 
  onNext,
  onPrev,
  current,
  totalSteps
}) => {
  const handleUploadChange = (info: any) => {
    // Convert file list to the format we need
    const fileList = info.fileList.map((file: any) => ({
      uid: file.uid,
      name: file.name,
      status: file.status,
      url: file.url || file.thumbUrl,
      originFileObj: file.originFileObj,
    }));

    setFormData({
      ...formData,
      images: fileList,
    });
  };

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      alert('You can only upload image files!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      alert('Image must be smaller than 2MB!');
    }
    return isImage && isLt2M;
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <div>
      <Title level={4}>Service Media Upload</Title>
      <Text type="secondary">Upload images for your service (optional)</Text>
      
      <div className="mt-4">
        <Upload
          listType="picture-card"
          fileList={formData.images}
          onChange={handleUploadChange}
          beforeUpload={beforeUpload}
          multiple
          maxCount={5}
        >
          {formData.images.length >= 5 ? null : uploadButton}
        </Upload>
      </div>
      
      {formData.images && formData.images.length > 0 && (
        <div className="mt-4">
          <Text strong>Uploaded {formData.images.length} image(s)</Text>
        </div>
      )}
      
      {/* Navigation buttons */}
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button style={{ marginRight: 8 }} onClick={onPrev}>
          Previous
        </Button>
        {current < totalSteps - 1 && (
          <Button type="primary" onClick={onNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default ServiceStepMedia;