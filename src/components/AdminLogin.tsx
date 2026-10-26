import React, { useState } from 'react';
import { X, Shield, User, Lock, Eye, EyeOff } from 'lucide-react';
import { Admin } from '../types';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (admin: Admin) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '', general: '' });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Admin credentials (hidden from UI)
  const adminCredentials = {
    username: 'Mounika',
    password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '',
    admin: {
      id: 'admin_001',
      username: 'Mounika',
      password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '',
      name: 'Mounika - Restaurant Owner',
      email: 'mounika@spicegarden.com',
      role: 'owner' as const,
      lastLoginDate: new Date()
    }
  };

  const validateForm = () => {
    const newErrors = { username: '', password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '', general: '' };
    
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return !newErrors.username && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({ username: '', password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '', general: '' });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (username === adminCredentials.username && password === adminCredentials.password) {
      onLogin(adminCredentials.admin);
      setUsername('');
      setPassword('');
    } else {
      setErrors({ username: '', password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '', general: 'Invalid username or password' });
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Admin Access</h2>
              <p className="text-slate-300 mt-2">Restaurant Management Portal</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter admin username"
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="h-4 w-4 inline mr-2" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 shadow-lg hover:shadow-xl'
              } text-white`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-6 pb-6 text-center text-sm text-gray-500">
            Secure access to restaurant management system
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;