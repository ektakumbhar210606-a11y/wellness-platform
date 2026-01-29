'use client';

import React, { useState } from 'react';
import { Select, Switch, TimePicker, Card, Space, Divider, Button, InputNumber } from 'antd';
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
  getCurrentAvailability?: (availability: DayAvailability[]) => void;
}

const WeeklyAvailability: React.FC<WeeklyAvailabilityProps> = ({ 
  initialAvailability = [], 
  onChange,
  getCurrentAvailability
}) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [availability, setAvailability] = useState<DayAvailability[]>(() => {
    // Initialize with default values for each day
    return daysOfWeek.map(day => {
      const existing = initialAvailability.find(a => a.day === day);
      return {
        day,
        available: existing ? (existing.available !== undefined ? existing.available : !!(existing.startTime && existing.endTime)) : false,
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
    
    // When availability changes, only send days that are available
    setAvailability(updatedAvailability);
    
    if (onChange) {
      // Filter to only send days that are available with start and end times
      const availableDays = updatedAvailability.filter(day => day.available === true && day.startTime && day.endTime);
      console.log('Sending availability data:', availableDays);
      onChange(availableDays);
    }
    
    if (getCurrentAvailability) {
      getCurrentAvailability(updatedAvailability);
    }
  };

  const handleTimeRangeChange = (dayIndex: number, time: any, timeString: [string, string]) => {
    const [startTime, endTime] = timeString;
    console.log(`Time range change for day ${dayIndex}: start=${startTime}, end=${endTime}`);
    console.log(`Day availability before update:`, availability[dayIndex]);
    
    const updatedAvailability = [...availability];
    updatedAvailability[dayIndex] = {
      ...updatedAvailability[dayIndex],
      startTime,
      endTime,
      available: true, // When setting time range, ensure the day is marked as available
    };
    console.log(`Day availability after update:`, updatedAvailability[dayIndex]);
    
    setAvailability(updatedAvailability);
    
    if (onChange) {
      // Filter to only send days that are available with start and end times
      const availableDays = updatedAvailability.filter(day => day.available === true && day.startTime && day.endTime);
      console.log('Sending availability data:', availableDays);
      onChange(availableDays);
    }
    
    if (getCurrentAvailability) {
      getCurrentAvailability(updatedAvailability);
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
              <Space vertical style={{ width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ marginBottom: 8 }}>Working Hours</label>
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
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
                  <label style={{ marginBottom: 8 }}>Break Duration (minutes)</label>
                  <InputNumber min={0} max={120} placeholder="Break minutes" />
                </div>
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