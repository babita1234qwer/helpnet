import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../authslice';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const submitteddata = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-neutral-900 px-4">
      <div className="bg-neutral-800 shadow-lg rounded-2xl p-10 w-full max-w-md border border-neutral-700">
        <h1 className="text-4xl font-bold text-white text-center mb-2">
          <span className="inline-block animate-bounce">🚀</span> CodeCrack
        </h1>
        <h2 className="text-lg text-gray-400 text-center mb-6">
          Welcome back! Please login to continue.
        </h2>
        <form className="w-full" onSubmit={handleSubmit(submitteddata)}>
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1" htmlFor="email">Email</label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
              autoComplete="email"
            />
            {errors.email&& <span className="text-red-400 text-sm">{errors.email.message}</span>}
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1" htmlFor="password">Password</label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="w-full px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
              autoComplete="current-password"
            />
            {errors.password && <span className="text-red-400 text-sm">{errors.password.message}</span>}
          </div>
          {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-400 text-white py-2 rounded-md font-semibold transition duration-150"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-6 text-sm text-gray-400 text-center">
          Don&apos;t have an account?{' '}
          <span
            className="text-orange-400 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate('/user/register')}
          >
            Sign up
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;