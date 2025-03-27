
import React from 'react';
import AuthForm from '@/components/AuthForm';

interface AuthScreenProps {
  onLogin: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="w-full h-screen md:h-[90vh] md:max-w-md md:rounded-xl overflow-hidden">
        <div className="p-6 flex flex-col h-full">
          <div className="mb-6 text-center">
           
          </div>
          <div className="flex-1">
            <AuthForm onLogin={onLogin} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
