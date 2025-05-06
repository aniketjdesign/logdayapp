import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import splashImage from '../assets/images/splash.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Handle window resize to detect desktop vs mobile
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect to login page if on desktop
  useEffect(() => {
    if (isDesktop) {
      navigate('/login', { replace: true });
    }
  }, [isDesktop, navigate]);

  // Add and remove the splash-screen-active class to the body
  useEffect(() => {
    // Add class when component mounts
    document.body.classList.add('splash-screen-active');
    
    // Add style tag to override the body padding
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @supports(padding-top: env(safe-area-inset-top)) {
        body.splash-screen-active {
          padding-top: 0 !important;
          overflow: hidden !important;
        }
      }
    `;
    document.head.appendChild(styleTag);
    
    // Remove class and style tag when component unmounts
    return () => {
      document.body.classList.remove('splash-screen-active');
      document.head.removeChild(styleTag);
    };
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  // Only render the mobile version since desktop will be redirected
  return (
    <div className="max-h-screen flex flex-col relative overflow-hidden bg-gray-900 overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={splashImage} 
          alt="Fitness background" 
          className="w-full h-[70vh] rounded-b-4xl overflow-hidden"
        />
        <div className="absolute inset-0"></div>
      </div>
      
      {/* Content */}
      <div 
        className={`relative z-10 flex flex-col items-center justify-between h-screen pt-4 pb-20 px-6`}
      >
       
        
        {/* Bottom Buttons */}
        <div 
          className={`w-full max-w-md space-y-3 mt-auto safe-area-inset-bottom text-[15px]`}
        >
          <div className="text-center">
            <h2 className="text-xl leading-tight text-white tracking-tight mb-4">Clean workout tracking, clear results.</h2>
          </div>
          <button
            onClick={handleSignup}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 flex items-center justify-center"
          >
            Join for free
          </button>
          
          <button
            onClick={handleLogin}
            className="w-full py-2 px-4 bg-blue-50 hover:bg-blue-200 text-blue-800 rounded-xl transition-colors border border-blue-100 duration-200 flex items-center justify-center"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};
