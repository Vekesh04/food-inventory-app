import React, { useState, useEffect } from 'react';
import { X, User, Phone, LogIn, ChefHat, Star, Utensils, Coffee, Pizza, Cake } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (name: string, mobile: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [errors, setErrors] = useState({ name: '', mobile: '' });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = { name: '', mobile: '' };
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(mobile.replace(/\s/g, ''))) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }
    
    setErrors(newErrors);
    return !newErrors.name && !newErrors.mobile;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({ name: '', mobile: '' });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    onLogin(name.trim(), mobile.trim());
    setName('');
    setMobile('');
    setErrors({ name: '', mobile: '' });
    setIsLoading(false);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setMobile(value);
    }
  };

  // Animated food icons data
  const foodIcons = [
    { Icon: ChefHat, delay: 0, size: 'w-8 h-8', color: 'text-orange-400' },
    { Icon: Utensils, delay: 0.5, size: 'w-6 h-6', color: 'text-red-400' },
    { Icon: Coffee, delay: 1, size: 'w-7 h-7', color: 'text-yellow-400' },
    { Icon: Pizza, delay: 1.5, size: 'w-9 h-9', color: 'text-green-400' },
    { Icon: Cake, delay: 2, size: 'w-6 h-6', color: 'text-pink-400' },
    { Icon: Star, delay: 2.5, size: 'w-5 h-5', color: 'text-blue-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Animated Background with Food Icons */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900 via-red-900 to-yellow-900">
        {/* Floating Food Icons */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large floating icons */}
          {Array.from({ length: 20 }).map((_, i) => {
            const IconData = foodIcons[i % foodIcons.length];
            const Icon = IconData.Icon;
            return (
              <div
                key={i}
                className={`absolute opacity-10 ${IconData.color}`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${IconData.delay + Math.random() * 3}s`,
                  animation: `float ${4 + Math.random() * 2}s ease-in-out infinite alternate`
                }}
              >
                <Icon className={`${IconData.size} transform rotate-${Math.floor(Math.random() * 4) * 90}`} />
              </div>
            );
          })}
          
          {/* Medium floating icons */}
          {Array.from({ length: 15 }).map((_, i) => {
            const IconData = foodIcons[i % foodIcons.length];
            const Icon = IconData.Icon;
            return (
              <div
                key={`medium-${i}`}
                className={`absolute opacity-15 ${IconData.color}`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${IconData.delay + Math.random() * 2}s`,
                  animation: `float ${3 + Math.random() * 2}s ease-in-out infinite alternate-reverse`
                }}
              >
                <Icon className={`w-4 h-4 transform rotate-${Math.floor(Math.random() * 8) * 45}`} />
              </div>
            );
          })}

          {/* Small floating icons */}
          {Array.from({ length: 25 }).map((_, i) => {
            const IconData = foodIcons[i % foodIcons.length];
            const Icon = IconData.Icon;
            return (
              <div
                key={`small-${i}`}
                className={`absolute opacity-20 ${IconData.color}`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 4}s`,
                  animation: `float ${2 + Math.random() * 1.5}s ease-in-out infinite`
                }}
              >
                <Icon className="w-3 h-3" />
              </div>
            );
          })}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 transform transition-all duration-500 hover:scale-[1.02]">
          {/* Header Section */}
          <div className="relative px-8 pt-12 pb-8 text-center">
            {/* Animated Logo */}
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500 rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-500 animate-bounce-subtle">
                <ChefHat className="h-12 w-12 text-white animate-pulse" />
                
                {/* Orbiting Food Icons */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                  <Utensils className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 text-orange-500" />
                </div>
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                  <Coffee className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                </div>
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '25s' }}>
                  <Pizza className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 text-yellow-500" />
                </div>
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }}>
                  <Cake className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>

            {/* Title with Gradient Text */}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-yellow-600 bg-clip-text text-transparent mb-2 animate-fade-in">
              Ciolake Food Inventory
            </h1>
            <p className="text-gray-600 mb-2 font-medium animate-slide-up">Authentic Indian Cuisine</p>
            
            {/* Subtitle with Icons */}
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center space-x-1 group">
                <Utensils className="h-4 w-4 text-orange-500 group-hover:scale-110 transition-transform" />
                <span>Fresh & Authentic</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
              <div className="flex items-center space-x-1 group">
                <Star className="h-4 w-4 text-yellow-500 fill-current group-hover:scale-110 transition-transform" />
                <span>Premium Quality</span>
              </div>
            </div>

            <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}></div>
          </div>

          {/* Form Section */}
          <div className="px-8 pb-8">
            <div className="text-center mb-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome Back!</h2>
              <p className="text-gray-600 text-sm">Please sign in to continue your culinary journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="animate-slide-up" style={{ animationDelay: '0.8s' }}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-2 text-orange-500" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm transform hover:scale-[1.02] ${
                      errors.name ? 'border-red-400 bg-red-50/50 shake' : 'border-gray-200 hover:border-orange-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-2 animate-slide-up">{errors.name}</p>}
                </div>

                <div className="animate-slide-up" style={{ animationDelay: '1s' }}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-2 text-orange-500" />
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={handleMobileChange}
                    className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm transform hover:scale-[1.02] ${
                      errors.mobile ? 'border-red-400 bg-red-50/50 shake' : 'border-gray-200 hover:border-orange-300'
                    }`}
                    placeholder="Enter 10-digit mobile number"
                  />
                  {errors.mobile && <p className="text-red-500 text-sm mt-2 animate-slide-up">{errors.mobile}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] animate-slide-up ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 hover:from-orange-600 hover:via-red-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl'
                }`}
                style={{ animationDelay: '1.2s' }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing you in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <LogIn className="h-5 w-5" />
                    <span>Start Your Food Journey</span>
                  </div>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-gray-500 animate-slide-up" style={{ animationDelay: '1.4s' }}>
              <p>By signing in, you agree to our delicious terms of service</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-in-out;
        }
        
        .animate-slide-up {
          animation: slideUp 0.8s ease-out;
        }
        
        .animate-bounce-subtle {
          animation: bounceSubtle 3s infinite;
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounceSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default LoginModal;