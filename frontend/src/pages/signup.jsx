import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../authslice';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .regex(/^[A-Z]/, 'Password must start with a capital letter')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must include uppercase, lowercase, number, and special character'
    ),
  phone: z.string().optional(),
  skills: z.array(z.string()).optional(),
  notificationPreferences: z.object({
    push: z.boolean().default(true),
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    emergencyAlerts: z.boolean().default(true),
    responseUpdates: z.boolean().default(true),
    systemNotifications: z.boolean().default(true),
  }).optional(),
});

const skillOptions = [
  "first_aid",
  "cpr",
  "fire_safety",
  "search_rescue",
  "medical",
  "emergency_response",
  "other",
];

function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [notificationPrefs, setNotificationPrefs] = useState({
    push: true,
    email: true,
    sms: false,
    emergencyAlerts: true,
    responseUpdates: true,
    systemNotifications: true,
  });
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({ 
    resolver: zodResolver(signupSchema),
    defaultValues: {
      notificationPreferences: notificationPrefs,
      skills: selectedSkills,
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Get user location automatically
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Geolocation success:', position.coords);
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationLoading(false);
        },
        (error) => {
          console.log('Geolocation error:', error);
          setLocationError(error.message);
          setLocationLoading(false);
          // Don't set location if there's an error
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }
  }, []);

  const handleSkillToggle = (skill) => {
    const updatedSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    
    setSelectedSkills(updatedSkills);
    setValue('skills', updatedSkills);
  };

  const handleNotificationPrefChange = (pref) => {
    const updatedPrefs = {
      ...notificationPrefs,
      [pref]: !notificationPrefs[pref]
    };
    
    setNotificationPrefs(updatedPrefs);
    setValue('notificationPreferences', updatedPrefs);
  };

  const submitteddata = async (data) => {
    try {
      console.log('Location in registration:', location);
      
      // Format data to match backend schema
      const formattedData = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || '',
        skills: data.skills || [],
        notificationPreferences: data.notificationPreferences,
        // Only include location if it's valid and not [0,0]
        ...(location && 
           location.latitude !== 0 && 
           location.longitude !== 0 && {
          currentLocation: {
            type: "Point",
            coordinates: [location.longitude, location.latitude]
          }
        }),
        // Set default values for other fields
        isAuthenticated: false,
        lastUpdated: new Date(),
        availabilityStatus: true,
        trustScore: 3,
        responseHistory: [],
        certifications: [],
        deviceTokens: [],
      };

      console.log('Sending registration data:', formattedData);

      const resultAction = await dispatch(registerUser(formattedData));
      if (registerUser.rejected.match(resultAction)) {
        setError('root', {
          type: 'manual',
          message: resultAction.payload || 'Signup failed',
        });
      } else {
        // Redirect to dashboard after successful registration
        navigate('/');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('root', {
        type: 'manual',
        message: 'Something went wrong. Try again later.',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-900 px-4">
      <div className="bg-neutral-800 shadow-xl rounded-2xl p-10 w-full max-w-md border border-neutral-700">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 text-center">
          <span className="inline-block animate-bounce">🚀</span> Emergency Response
        </h1>
        <h2 className="text-lg text-gray-400 mb-6 font-semibold text-center">
          Create your responder account
        </h2>

        {errors.root && (
          <div className="text-red-500 text-sm mb-4 text-center">
            {typeof errors.root.message === 'string' ? errors.root.message : 'An error occurred'}
          </div>
        )}

        {/* Location status */}
        <div className="mb-4 p-3 bg-neutral-700 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Location Access</h3>
          {locationLoading && (
            <p className="text-blue-400 text-sm">Getting your location...</p>
          )}
          {locationError && (
            <p className="text-yellow-400 text-sm">Location access denied: {locationError}</p>
          )}
          {location && (
            <p className="text-green-400 text-sm">
              Location detected: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          )}
          {!location && !locationLoading && !locationError && (
            <p className="text-gray-400 text-sm">Location not available</p>
          )}
        </div>

        <form className="w-full" onSubmit={handleSubmit(submitteddata)}>
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1" htmlFor="name">Full Name</label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {errors.name && <span className="text-red-400 text-sm">{errors.name.message}</span>}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1" htmlFor="email">Email</label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {errors.email && <span className="text-red-400 text-sm">{errors.email.message}</span>}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1" htmlFor="phone">Phone (Optional)</label>
            <input
              {...register('phone')}
              type="tel"
              id="phone"
              className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {errors.phone && <span className="text-red-400 text-sm">{errors.phone.message}</span>}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1" htmlFor="password">Password</label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {errors.password && <span className="text-red-400 text-sm">{errors.password.message}</span>}

            <p className="text-xs text-gray-500 mt-1">
              Must start with a capital letter and include lowercase, number, and special character.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">Your Skills (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {skillOptions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    selectedSkills.includes(skill)
                      ? 'bg-orange-500 text-white'
                      : 'bg-neutral-700 text-gray-300'
                  }`}
                >
                  {skill.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-2">Notification Preferences</label>
            <div className="space-y-2">
              {Object.entries(notificationPrefs).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`pref-${key}`}
                    checked={value}
                    onChange={() => handleNotificationPrefChange(key)}
                    className="mr-2 h-4 w-4 text-orange-500 focus:ring-orange-400 border-neutral-600 rounded bg-neutral-700"
                  />
                  <label htmlFor={`pref-${key}`} className="text-sm text-gray-300">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white py-2 rounded-md font-semibold transition duration-150 disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-400 text-center">
          Already have an account?{' '}
          <span
            className="text-orange-400 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate('/login')}
          >
            Login
          </span>
        </div>
      </div>
    </div>
  );
}

export default Signup;