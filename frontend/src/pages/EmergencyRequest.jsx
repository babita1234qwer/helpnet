import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import axiosClient from '../utils/axiosclient';

const emergencySchema = z.object({
  emergencyType: z.string().min(1, 'Type is required'),
  emergencySubtype: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.string().min(1, 'Latitude is required'),
  longitude: z.string().min(1, 'Longitude is required'),
});

function EmergencyRequest() {
  const dispatch = useDispatch();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(emergencySchema) });

  const submitteddata = async (data) => {
    try {
      const payload = {
  emergencyType: data.emergencyType,
  emergencySubtype: data.emergencySubtype,
  description: data.description,
  longitude: parseFloat(data.longitude),
  latitude: parseFloat(data.latitude),
  location: {
    type: 'Point',
    coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
    address: data.address,
  },
};
      
      await axiosClient.post('/emergencies/create', payload);
      alert('Emergency submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Submission failed");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-neutral-900 px-4">
      <div className="bg-neutral-800 shadow-lg rounded-2xl p-10 w-full max-w-md border border-neutral-700">
        <h1 className="text-4xl font-bold text-white text-center mb-2">
          <span className="inline-block animate-bounce">🚨</span> Report
        </h1>
        <h2 className="text-lg text-gray-400 text-center mb-6">
          Please fill out the emergency details below.
        </h2>
        <form className="w-full" onSubmit={handleSubmit(submitteddata)}>
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1" htmlFor="emergencyType">Type</label>
            <select {...register('emergencyType')} id="emergencyType" className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded">
              <option value="">Select</option>
              <option value="fire">Fire</option>
              <option value="medical">Medical</option>
              <option value="security">Security</option>
              <option value="natural_disaster">Natural Disaster</option>
              <option value="other">Other</option>
            </select>
            {errors.emergencyType && <span className="text-red-400 text-sm">{errors.emergencyType.message}</span>}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1" htmlFor="emergencySubtype">Subtype</label>
            <input {...register('emergencySubtype')} id="emergencySubtype" className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded" />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1" htmlFor="description">Description</label>
            <textarea {...register('description')} id="description" className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded" />
            {errors.description && <span className="text-red-400 text-sm">{errors.description.message}</span>}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1" htmlFor="address">Address</label>
            <input {...register('address')} id="address" className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded" />
            {errors.address && <span className="text-red-400 text-sm">{errors.address.message}</span>}
          </div>

 
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1" htmlFor="longitude">Longitude</label>
            <input {...register('longitude')} id="longitude" className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded" />
            {errors.longitude && <span className="text-red-400 text-sm">{errors.longitude.message}</span>}
          </div>
                    <div className="mb-4">
                                  <label className="block text-sm text-gray-300 mb-1" htmlFor="latitude">Latitude</label>

            <input {...register('latitude')} id="longitude" className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded" />
            {errors.latitude && <span className="text-red-400 text-sm">{errors.latitude.message}</span>}
          </div>


          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-400 text-white py-2 rounded-md font-semibold transition duration-150"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default EmergencyRequest;
