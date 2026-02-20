'use client';

import { useState, useEffect } from 'react';


interface EarningRecord {
  _id: string;
  bookingId: string;
  amount: number;
  status: 'pending' | 'paid';
  paidAt?: Date;
  bookingDate: Date;
  serviceName: string;
  customerName: string;
}

const TherapistEarnings = () => {
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/therapist/earnings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch earnings');
      }

      const { data } = await response.json();
      setEarnings(data);
    } catch (err: any) {
      console.error('Error fetching earnings:', err);
      setError(err.message || 'An error occurred while fetching earnings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Earnings</h2>
        <p>Loading earnings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Earnings</h2>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Calculate totals
  const totalEarned = earnings
    .filter(e => e.status === 'paid')
    .reduce((sum, earning) => sum + earning.amount, 0);
  
  const pendingAmount = earnings
    .filter(e => e.status === 'pending')
    .reduce((sum, earning) => sum + earning.amount, 0);

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Earnings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="text-lg font-semibold">Total Earned</h3>
          <p className="text-2xl font-bold text-green-600">₹{totalEarned.toFixed(2)}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded">
          <h3 className="text-lg font-semibold">Pending</h3>
          <p className="text-2xl font-bold text-orange-600">₹{pendingAmount.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-lg font-semibold">Total Bookings</h3>
          <p className="text-2xl font-bold text-gray-600">{earnings.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booking Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paid Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {earnings.length > 0 ? (
              earnings.map((earning) => (
                <tr key={earning._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {earning.serviceName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {earning.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(earning.bookingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    ₹{earning.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      earning.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {earning.paidAt ? new Date(earning.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No earnings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TherapistEarnings;