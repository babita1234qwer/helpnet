import { useState, useEffect } from 'react';
import EmergencyMap from './EmergencyMap';
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Spinner
} from "@heroui/react";

const EmergenciesPage = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/emergencies/active', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setEmergencies(data.data || []);
        } else {
          setError('Failed to fetch emergencies');
        }
      } catch (err) {
        setError('Error connecting to server');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencies();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full mb-8">
        <CardHeader>
          <h1 className="text-2xl font-bold">Active Emergencies</h1>
          <p className="text-gray-600">View and respond to current emergencies in your area</p>
        </CardHeader>
        <Divider />
        <CardBody>
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          ) : emergencies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No active emergencies at this time</p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-gray-700">Showing {emergencies.length} active emergencies</p>
              </div>
              <EmergencyMap emergencies={emergencies} />
            </div>
          )}
        </CardBody>
      </Card>
      
      {emergencies.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <h2 className="text-xl font-semibold">Emergency List</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencies.map(emergency => (
                <Card key={emergency._id} isPressable className="hover:shadow-md transition-shadow">
                  <CardBody>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg">{emergency.emergencyType.toUpperCase()}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        emergency.status === 'active' ? 'bg-red-100 text-red-800' : 
                        emergency.status === 'responding' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {emergency.status}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-600">{emergency.description}</p>
                    <p className="mt-2 text-sm text-gray-500">
                      {emergency.location?.address || 'Location not specified'}
                    </p>
                    <div className="mt-4">
   
<a href={`/emergency/${emergency._id}`} className="text-blue-600 hover:text-blue-800">
  View Details →
</a>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default EmergenciesPage;