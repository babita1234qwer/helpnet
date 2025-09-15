import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../authslice';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';

const signupSchema = z.object({
  name: z.string().min(1, 'First name is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .regex(/^[A-Z]/, 'Password must start with a capital letter')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must include uppercase, lowercase, number, and special character'
    ),
});

function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const submitteddata = async (data) => {
    try {
      const resultAction = await dispatch(registerUser(data));
      if (registerUser.rejected.match(resultAction)) {
        setError('root', {
          type: 'manual',
          message: resultAction.payload || 'Signup failed',
        });
      }
    } catch (error) {
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
          <span className="inline-block animate-bounce">🚀</span> CodeCrack
        </h1>
        <h2 className="text-lg text-gray-400 mb-6 font-semibold text-center">
          Create your account
        </h2>

        {errors.root && (
          <div className="text-red-500 text-sm mb-4 text-center">
            {errors.root.message}
          </div>
        )}

        <form className="w-full" onSubmit={handleSubmit(submitteddata)}>
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1" htmlFor="username">Username</label>
            <input
              {...register('name')}
              type="text"
              id="username"
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

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-400 text-white py-2 rounded-md font-semibold transition duration-150"
          >
            Sign Up
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