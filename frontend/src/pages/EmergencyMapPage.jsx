import { useState, useEffect } from 'react';
import EmergencyMap from './EmergencyMap';
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Spinner,
  Button
} from "@heroui/react";

const EmergencyMapPage = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        setLoading(true);
        
        // This will now be proxied to your backend
        const response = await fetch('/emergencies/all', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const errorText = await response.text();
          console.error('Expected JSON but got:', errorText);
          throw new Error('Invalid response format from server');
        }
        
        const data = await response.json();
        console.log('API response data:', data);
        setEmergencies(data.data || []);
      } catch (err) {
        setError(err.message || 'Error connecting to server');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencies();
  }, []);

  const filteredEmergencies = filter === 'all' 
    ? emergencies 
    : emergencies.filter(e => e.emergencyType === filter);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full mb-8">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Emergency Map</h1>
            <p className="text-gray-600">View active emergencies on the map</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant={filter === 'all' ? 'solid' : 'flat'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'medical' ? 'solid' : 'flat'}
              onClick={() => setFilter('medical')}
            >
              Medical
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'fire' ? 'solid' : 'flat'}
              onClick={() => setFilter('fire')}
            >
              Fire
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'accident' ? 'solid' : 'flat'}
              onClick={() => setFilter('accident')}
            >
              Accident
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'crime' ? 'solid' : 'flat'}
              onClick={() => setFilter('crime')}
            >
              Crime
            </Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
              <p>{error}</p>
              <p className="text-sm mt-2">Please check your internet connection and try again.</p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-gray-700">Showing {filteredEmergencies.length} emergencies</p>
              </div>
              <EmergencyMap emergencies={filteredEmergencies} />
            </div>
          )}
        </CardBody>
      </Card>
      
      {filteredEmergencies.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <h2 className="text-xl font-semibold">Emergency List</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmergencies.map(emergency => (
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

export default EmergencyMapPage;