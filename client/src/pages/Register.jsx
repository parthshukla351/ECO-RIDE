import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FaLeaf, FaEye, FaEyeSlash, FaUser, FaEnvelope, FaPhone, FaLock, FaCar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const watchRole = watch('role', '');

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');

    try {
      const result = await registerUser(data);

      if (result.success) {
        toast.success('Registration successful! Please verify your email.');
        navigate('/verify-otp', { state: { userId: result.userId } });
      } else {
        setApiError(result.message || 'Registration failed. Please try again.');
        toast.error(result.message || 'Registration failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Server error occurred';
      setApiError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-600 text-white p-3 rounded-2xl">
              <FaLeaf className="text-4xl" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">EcoRide AI</h1>
          <p className="text-emerald-600 font-medium mt-2">Green Mobility Platform</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">Create your account</h2>
          <p className="text-center text-gray-500 mb-8">Join the eco-friendly movement</p>

          {apiError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm border border-red-100">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-sm text-gray-600 font-medium">Full Name</label>
              <div className="relative mt-1">
                <FaUser className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  {...register('name', { required: 'Full name is required' })}
                  type="text"
                  className="w-full pl-11 py-3 border border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-emerald-500 outline-none"
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Email Address</label>
              <div className="relative mt-1">
                <FaEnvelope className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                  })}
                  type="email"
                  className="w-full pl-11 py-3 border border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-emerald-500 outline-none"
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Phone Number</label>
              <div className="relative mt-1">
                <FaPhone className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  {...register('phone', { 
                    required: 'Phone number is required',
                    pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digits' }
                  })}
                  type="tel"
                  className="w-full pl-11 py-3 border border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-emerald-500 outline-none"
                  placeholder="9876543210"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Gender</label>
              <select
                {...register('gender', { required: 'Please select gender' })}
                className="w-full mt-1 py-3 border border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-emerald-500 outline-none px-4"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
            </div>

            {/* Role Selection */}
            <div>
              <label className="text-sm text-gray-600 font-medium">I want to join as</label>
              <div className="flex gap-4 mt-2">
                <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 border-2 rounded-2xl cursor-pointer transition-all ${
                  watchRole === 'passenger' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    value="passenger"
                    {...register('role', { required: 'Please select a role' })}
                    className="sr-only"
                  />
                  <FaUser className="text-lg" />
                  <span className="font-medium">Passenger</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 border-2 rounded-2xl cursor-pointer transition-all ${
                  watchRole === 'driver' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    value="driver"
                    {...register('role', { required: 'Please select a role' })}
                    className="sr-only"
                  />
                  <FaCar className="text-lg" />
                  <span className="font-medium">Driver</span>
                </label>
              </div>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Password</label>
              <div className="relative mt-1">
                <FaLock className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' }
                  })}
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-emerald-500 outline-none"
                  placeholder="Create password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-500"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-2xl transition-all mt-6 flex items-center justify-center gap-2 text-lg shadow-md"
            >
              {loading ? 'Creating Account...' : 'Create Eco Account 🌱'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;