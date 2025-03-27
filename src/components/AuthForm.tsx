import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import FormInput from "@/components/FormInput";
import AuthButton from "@/components/AuthButton";
import AuthToggle from "@/components/AuthToggle";
import Logo from "@/components/Logo";
import { Mail, Lock, User, ArrowRight, Github } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, resetPassword , signInWithProvider } from '@/services/auth';

type AuthMode = 'signin' | 'signup';

interface AuthFormProps {
  onLogin?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Form errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

    
  // Social sign-in handler
  const handleSocialSignIn = async (provider: 'google' | 'github') => {
    setLoading(true);
    try {
      await signInWithProvider(provider);
      // The user will be redirected to the provider's auth page
      // No need to call onLogin() here as it will happen after redirect back
    } catch (error) {
      console.error(`${provider} authentication error:`, error);
    } finally {
      setLoading(false);
    }
  };
  // Email validation
  const validateEmail = () => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };
  
  // Password validation
  const validatePassword = () => {
    if (!password && !forgotPassword) {
      setPasswordError('Password is required');
      return false;
    }
    
    if (mode === 'signup' && password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    
    setPasswordError('');
    return true;
  };
  
  // Name validation
  const validateName = () => {
    if (mode === 'signup' && !name) {
      setNameError('Name is required');
      return false;
    }
    
    setNameError('');
    return true;
  };
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (forgotPassword) {
      if (!validateEmail()) return;
      
      setLoading(true);
      const { error } = await resetPassword(email);
      setLoading(false);
      
      if (!error) {
        // Reset form for sign-in after password reset request
        setForgotPassword(false);
      }
      return;
    }
    
    // Validate all fields
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isNameValid = validateName();
    
    if (!isEmailValid || !isPasswordValid || (mode === 'signup' && !isNameValid)) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (mode === 'signin') {
        const { user, session, error } = await signInWithEmail(email, password);
        
        if (!error && (user || session)) {
          if (onLogin) {
            onLogin();
          }
        }
      } else {
        const { user, session, error } = await signUpWithEmail(email, password, name);
        
        if (!error && session) {
          // Automatically log in if session is available
          if (onLogin) {
            onLogin();
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Switch between sign-in and sign-up modes
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setForgotPassword(false);
    // Clear form errors when switching modes
    setEmailError('');
    setPasswordError('');
    setNameError('');
  };
  
  return (
    <div className="w-full max-w-md  text-white-900 dark:text-gray-100 p-6 rounded-lg shadow-lg">
      <div className="mb-6 text-center">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <h1 className="text-xl font-semibold mb-2 animate-fade-in">
          {forgotPassword 
            ? 'Reset your password'
            : mode === 'signin' 
              ? 'Welcome back' 
              : 'Create your account'}
        </h1>
        <p className="text-sm text-muted-foreground dark:text-gray-400 animate-fade-in">
          {forgotPassword
            ? 'Enter your email and we\'ll send you a reset link'
            : mode === 'signin' 
              ? 'Sign in to access TuesdaY AI' 
              : 'Join TuesdaY AI and start your journey'}
        </p>
      </div>
      
      {!forgotPassword && (
        <div className="mb-6">
          <AuthToggle value={mode} onChange={switchMode} />
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && !forgotPassword && (
          <FormInput
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={validateName}
            error={nameError}
            icon={<User size={18} />}
            data-autofocus
          />
        )}
        
        <FormInput
          label="Email Address"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={validateEmail}
          error={emailError}
          icon={<Mail size={18} />}
          data-autofocus={mode === 'signin' || forgotPassword}
        />
        
        {!forgotPassword && (
          <FormInput
            label="Password"
            type="password"
            placeholder={mode === 'signup' ? "Create a password" : "Enter your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={validatePassword}
            error={passwordError}
            icon={<Lock size={18} />}
          />
        )}
        
        {mode === 'signin' && !forgotPassword && (
          <div className="flex justify-end">
            <button 
              type="button" 
              className="text-sm text-primary hover:text-primary/80 transition-colors"
              onClick={() => setForgotPassword(true)}
            >
              Forgot password?
            </button>
          </div>
        )}
        
        <div className="pt-2">
          <AuthButton type="submit" loading={loading}>
            <span className="flex items-center gap-2">
              {forgotPassword 
                ? 'Send reset link'
                : mode === 'signin' 
                  ? 'Sign in' 
                  : 'Create account'}
              <ArrowRight size={16} />
            </span>
          </AuthButton>
        </div>
      </form>
      
      {forgotPassword && (
        <div className="mt-6 pt-4  ">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setForgotPassword(false)}
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Back to sign in
            </button>
          </div>
        </div>
      )}
      
      {!forgotPassword && (
        <div className="mt-6 pt-4  dark:border-gray-700">
          {/* Social sign-in buttons */}
          <div className="mb-4">
            <p className="text-sm text-center text-muted-foreground dark:text-gray-400 mb-4">
              Or continue with
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSocialSignIn('google')}
                className="flex items-center justify-center space-x-2 dark:bg-gray-950 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all border border-gray-700"
              >
                <img src="https://i.ibb.co/0ZWCLbZ/google-logo-icon-169090.png" alt="Google" className="w-5 h-5" />
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialSignIn('github')}
                className="flex items-center justify-center space-x-2 dark:bg-gray-950 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all border border-gray-700"
              >
                <Github size={20} />
                <span>GitHub</span>
              </button>
            </div>
          </div>
          
          <div className="flex justify-center">
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthForm;