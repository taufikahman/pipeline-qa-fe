import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { registerUser } from '@/lib/api';

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Field errors
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [orgError, setOrgError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setFullNameError('');
    setEmailError('');
    setPasswordError('');
    setOrgError('');

    // Validation
    let isValid = true;

    if (!fullName.trim()) {
      setFullNameError('Full name is required');
      isValid = false;
    }

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    }

    if (!organizationName.trim()) {
      setOrgError('Organization name is required');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      await registerUser({
        email,
        password,
        full_name: fullName.trim(),
        organization_name: organizationName.trim(),
      });

      toast({
        title: 'Registration successful',
        description: 'Your account has been created. Please log in.',
      });

      navigate('/login');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: err.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white dark:bg-gray-700 shadow-lg p-2">
              <img
                src={`${import.meta.env.BASE_URL}logo.svg`}
                alt="QA Dashboard Logo"
                className="size-full object-contain"
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Create your account
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input */}
            <div>
              <Label htmlFor="fullName" className="sr-only">
                Full name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setFullNameError('');
                }}
                className={`h-12 ${fullNameError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {fullNameError && (
                <p className="text-sm text-red-600 mt-1">{fullNameError}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <Label htmlFor="email" className="sr-only">
                Work email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Work email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                className={`h-12 ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {emailError && (
                <p className="text-sm text-red-600 mt-1">{emailError}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <Label htmlFor="password" className="sr-only">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className={`h-12 pr-10 ${passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-600 mt-1">{passwordError}</p>
              )}
            </div>

            {/* Organization Name Input */}
            <div>
              <Label htmlFor="organizationName" className="sr-only">
                Organization name
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                <Input
                  id="organizationName"
                  type="text"
                  placeholder="Organization name"
                  value={organizationName}
                  onChange={(e) => {
                    setOrganizationName(e.target.value);
                    setOrgError('');
                  }}
                  className={`h-12 pl-10 ${orgError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
              </div>
              {orgError && (
                <p className="text-sm text-red-600 mt-1">{orgError}</p>
              )}
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </Button>

            {/* Terms text */}
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
              By signing up, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
