'use client';

import React, { useState } from 'react';
import { Form, Select, Switch, TimePicker, Card, Space, Divider, Button, InputNumber } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = TimePicker;

interface DayAvailability {
  day: string;
  available: boolean;
  startTime?: string;
  endTime?: string;
}

interface WeeklyAvailabilityProps {
  initialAvailability?: DayAvailability[];
  onChange?: (availability: DayAvailability[]) => void;
}

const WeeklyAvailability: React.FC<WeeklyAvailabilityProps> = ({ 
  initialAvailability = [], 
  onChange 
}) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [availability, setAvailability] = useState<DayAvailability[]>(() => {
    // Initialize with default values for each day
    return daysOfWeek.map(day => {
      const existing = initialAvailability.find(a => a.day === day);
      return {
        day,
        available: existing?.available ?? false,
        startTime: existing?.startTime,
        endTime: existing?.endTime,
      };
    });
  });

  const handleDayChange = (dayIndex: number, field: keyof DayAvailability, value: any) => {
    const updatedAvailability = [...availability];
    updatedAvailability[dayIndex] = {
      ...updatedAvailability[dayIndex],
      [field]: value,
    };
    
    setAvailability(updatedAvailability);
    
    if (onChange) {
      onChange(updatedAvailability);
    }
  };

  const handleTimeRangeChange = (dayIndex: number, time: any, timeString: [string, string]) => {
    const [startTime, endTime] = timeString;
    
    const updatedAvailability = [...availability];
    updatedAvailability[dayIndex] = {
      ...updatedAvailability[dayIndex],
      startTime,
      endTime,
    };
    
    setAvailability(updatedAvailability);
    
    if (onChange) {
      onChange(updatedAvailability);
    }
  };

  return (
    <div>
      <Card title="Weekly Availability" style={{ marginBottom: 16 }}>
        <p>Set your availability for each day of the week:</p>
        
        {availability.map((dayAvail, index) => (
          <Card 
            key={dayAvail.day} 
            size="small" 
            title={dayAvail.day}
            style={{ marginBottom: 12 }}
            extra={
              <Switch
                checked={dayAvail.available}
                onChange={(checked) => handleDayChange(index, 'available', checked)}
                checkedChildren="Available"
                unCheckedChildren="Off"
              />
            }
          >
            {dayAvail.available && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item label="Working Hours">
                  <RangePicker
                    format="HH:mm"
                    minuteStep={15}
                    defaultValue={dayAvail.startTime && dayAvail.endTime ? 
                      [dayjs(dayAvail.startTime, 'HH:mm'), dayjs(dayAvail.endTime, 'HH:mm')] : 
                      undefined
                    }
                    onChange={handleTimeRangeChange.bind(null, index)}
                    placeholder={['Start time', 'End time']}
                  />
                </Form.Item>
                
                <Form.Item label="Break Duration (minutes)">
                  <InputNumber min={0} max={120} placeholder="Break minutes" />
                </Form.Item>
              </Space>
            )}
          </Card>
        ))}
      </Card>
    </div>
  );
};

// Using Day.js instead of moment as Next.js projects typically use Day.js
import { Dayjs } from 'dayjs';

export default WeeklyAvailability;