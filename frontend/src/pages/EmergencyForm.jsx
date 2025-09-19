
import { useState } from 'react';
import OpenStreetMap from './OpenStreetMap';
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Divider
} from "@heroui/react";

const EmergencyForm = () => {
  const [formData, setFormData] = useState({
    emergencyType: '',
    description: '',
    longitude: '',
    latitude: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleLocationSelect = (location) => {
    setFormData({
      ...formData,
      latitude: location.lat.toString(),
      longitude: location.lng.toString(),
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const response = await fetch('/api/emergencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({
          emergencyType: '',
          description: '',
          longitude: '',
          latitude: '',
        });
      } else {
        setSubmitError(data.message || 'Failed to create emergency');
      }
    } catch (error) {
      setSubmitError('Error connecting to server');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="w-full">
        <CardHeader className="flex flex-col items-start px-6 pt-6">
          <h1 className="text-2xl font-bold">Report an Emergency</h1>
          <p className="text-gray-600">Fill out the form below to report an emergency situation</p>
        </CardHeader>
        <Divider />
        <CardBody>
          {submitSuccess ? (
            
             <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
  <p className="font-semibold">Emergency reported successfully!</p>
  <p>Help is on the way. Thank you for your report.</p>
   <Button 
                color="primary" 
                variant="flat" 
                className="mt-2"
                onClick={() => setSubmitSuccess(false)}
              >
                Report Another Emergency
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Emergency Type</label>
                <Select
                  name="emergencyType"
                  value={formData.emergencyType}
                  onChange={handleChange}
                  placeholder="Select emergency type"
                  className="w-full"
                >
                  <SelectItem key="medical" value="medical">Medical Emergency</SelectItem>
                  <SelectItem key="fire" value="fire">Fire</SelectItem>
                  <SelectItem key="accident" value="accident">Accident</SelectItem>
                  <SelectItem key="crime" value="crime">Crime</SelectItem>
                  <SelectItem key="natural" value="natural">Natural Disaster</SelectItem>
                  <SelectItem key="other" value="other">Other</SelectItem>
                </Select>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Description</label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide details about the emergency"
                  className="w-full"
                  minRows={3}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Location</label>
                <div className="mb-2 text-sm text-gray-500">
                  Click on the map to mark the emergency location
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <OpenStreetMap onLocationSelect={handleLocationSelect} />
                </div>
                {formData.latitude && formData.longitude && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: Latitude: {formData.latitude}, Longitude: {formData.longitude}
                  </div>
                )}
              </div>
              
              {submitError && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
                  {submitError}
                </div>
              )}
              
              <Button
                type="submit"
                color="primary"
                isLoading={isSubmitting}
                disabled={!formData.emergencyType || !formData.description || !formData.latitude || !formData.longitude}
                className="w-full"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Emergency Report'}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default EmergencyForm;