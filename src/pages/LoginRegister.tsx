import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, Lock, Eye, EyeOff, User, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ForgotPasswordModal } from '@/components/ForgotPasswordModal';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/auth'; // <-- Make sure you have your supabase client or adjust the import

// Benefits content for each mode
const BENEFITS = {
  login: [
    'Secure access to your data cleaning tools',
    'Resume your cleaning jobs instantly',
    'Access your cleaning history and reports',
    'Personalized cleaning settings',
  ],
  register: [
    'Smart duplicate detection with fuzzy matching',
    'Automated data cleaning and standardization',
    'Export to multiple formats',
    'Free tier with up to 1,000 records/month',
  ],
};

export function LoginRegisterScreen(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, registerUser } = useAuth(); 
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  
  // -------------------------
  // 1) New state to handle "Resend" button logic
  // -------------------------
  const [showResend, setShowResend] = useState(false);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
  });

  // Basic form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check for session expired message
  useEffect(() => {
    const expired = searchParams.get('expired');
    if (expired === 'true') {
      setErrors((prev) => ({
        ...prev,
        general: 'Your session has expired. Please log in again.',
      }));
    }
  }, [searchParams]);

  // Handle mode toggle with animation
  const handleModeToggle = (): void => {
    if (isAnimating) return;
    setIsAnimating(true);
    setErrors({});
    setShowResend(false); // reset the resend button if toggling

    if (!prefersReducedMotion) {
      document.querySelector('.auth-form')?.classList.add('form-exit');
      document.querySelector('.info-content')?.classList.add('content-exit');

      setTimeout(() => {
        setIsLogin(!isLogin);
        // Reset form data
        setFormData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
          rememberMe: false,
        });

        setTimeout(() => {
          document.querySelector('.auth-form')?.classList.remove('form-exit');
          document.querySelector('.info-content')?.classList.remove('content-exit');
          setIsAnimating(false);
        }, 50);
      }, 200);
    } else {
      setIsLogin(!isLogin);
      setIsAnimating(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isLogin && !formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }

    // Adjusted password checks (as in your code):
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (
      formData.password.length < 8 ||
      !/[a-z]/.test(formData.password) ||
      !/[A-Z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password) ||
      !/[^A-Za-z0-9]/.test(formData.password)
    ) {
      newErrors.password =
        'Please create a password that is at least 8 characters long and includes lowercase letters, uppercase letters, numbers, and symbols.';
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------------
  // 2) handleResendVerification function
  // -------------------------
  async function handleResendVerification() {
    try {
      // Attempt to resend the verification email for the current 'signup' type
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email, // The email user tried to log in with
        options: {
          // Make sure this matches your verify route:
          emailRedirectTo: 'https://bustr.io/verifyemail', 
        },
      });

      if (error) {
        // Show error in "general" error area
        setErrors((prev) => ({
          ...prev,
          general: error.message || 'Error resending verification email.',
        }));
      } else {
        // Show success in "general"
        setErrors((prev) => ({
          ...prev,
          general: 'Verification email resent! Please check your inbox.',
        }));
        setShowResend(false); // Hide button if you want to after success
      }
    } catch (err) {
      // Fallback in case of unexpected error
      setErrors((prev) => ({
        ...prev,
        general: 'Error resending verification email.',
      }));
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isLogin) {
      // Login logic
      const response = await signIn({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (response.success) {
        // Logged in
        const from = (location.state as any)?.from || '/';
        navigate(from, { replace: true });
      } else {
        // Login failed
        // -------------------------
        // 3) If "Email not verified", show resend button
        // -------------------------
        if (response.error?.toLowerCase().includes('email not verified') ||
            response.error?.toLowerCase().includes('email not confirmed')) {
          setErrors((prev) => ({
            ...prev,
            general: 'Please verify your email before logging in.',
          }));
          setShowResend(true); // Display the "Resend Email" button
        } else {
          setErrors((prev) => ({
            ...prev,
            general: response.error || 'Login failed',
          }));
        }
      }

    } else {
      // Registration logic...
      const [firstName, ...lastNameParts] = formData.fullName.trim().split(' ');
      const lastName = lastNameParts.join(' ');

      const response = await registerUser({
        email: formData.email,
        password: formData.password,
        first_name: firstName,
        last_name: lastName || '',
      });

      if (response.success) {
        toast({
          title: 'Registration Successful',
          description: 'Please check your email to verify your account.',
        });
        setIsLogin(true);
      } else {
        setErrors((prev) => ({
          ...prev,
          general: response.error || 'Registration failed',
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword'): void => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <>
      {/* Add animation styles */}
      <style>
        {`
          @media (prefers-reduced-motion: no-preference) {
            .auth-form {
              transition: opacity 200ms ease-out, transform 200ms ease-out;
            }
            
            .form-exit {
              opacity: 0;
              transform: translateY(10px);
            }

            .info-content {
              transition: opacity 200ms ease-out, transform 200ms ease-out;
            }

            .content-exit {
              opacity: 0;
              transform: translateX(-10px);
            }

            .benefit-item {
              transition: opacity 200ms ease-out, transform 200ms ease-out;
              transition-delay: var(--delay);
            }

            .form-exit .benefit-item {
              opacity: 0;
              transform: translateX(-10px);
            }
          }
        `}
      </style>

      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left Column - Info Area */}
        <div className="relative w-full md:w-1/2 bg-white dark:bg-[#2A2A2A] p-8 md:p-12 lg:p-16">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-coral-500/10 to-teal-500/10"
            aria-hidden="true"
          />
          <div 
            className="absolute inset-0 bg-mesh-pattern opacity-[0.03] dark:opacity-[0.05]"
            aria-hidden="true"
          />
          <div className="relative z-10 max-w-xl mx-auto md:mx-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-coral-500">Bustr</h2>
            </div>

            <div className="space-y-6 info-content">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                {isLogin ? 'Welcome Back' : 'Get Started with Bustr'}
              </h1>
              
              <p className="text-lg md:text-xl text-text-light/60 dark:text-text-dark/60">
                {isLogin 
                  ? 'Access your data cleaning tools and reports'
                  : 'Clean and deduplicate your contact lists with ease'
                }
              </p>

              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold">
                  {isLogin ? 'Why log in?' : 'Why choose Bustr?'}
                </h3>
                <ul className="space-y-3">
                  {BENEFITS[isLogin ? 'login' : 'register'].map((benefit, index) => (
                    <li 
                      key={benefit}
                      className="benefit-item flex items-start gap-3"
                      style={{ '--delay': `${index * 50}ms` } as React.CSSProperties}
                    >
                      <CheckCircle2 className="h-5 w-5 text-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="text-text-light/80 dark:text-text-dark/80">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-coral-500">99.9%</div>
                    <div className="text-sm text-text-light/60 dark:text-text-dark/60">
                      Accuracy Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-coral-500">1M+</div>
                    <div className="text-sm text-text-light/60 dark:text-text-dark/60">
                      Records Cleaned
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-coral-500">5k+</div>
                    <div className="text-sm text-text-light/60 dark:text-text-dark/60">
                      Happy Users
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Right Column - Auth Form Area */}
        <div className="w-full md:w-1/2 bg-background-light dark:bg-background-dark p-8 md:p-12 lg:p-16">
          <div className="max-w-md mx-auto auth-form">
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {isLogin ? 'Log In' : 'Create an Account'}
              </h2>
              <p className="text-text-light/60 dark:text-text-dark/60 mt-2">
                {isLogin 
                  ? 'Welcome back! Please enter your details.'
                  : 'Get started with your free account.'
                }
              </p>
            </div>

            {/* Session Expired/Error */}
            {errors.general && (
              <div className="mt-4 p-3 bg-status-error/10 border border-status-error rounded-lg">
                <p className="flex items-center gap-2 text-sm text-status-error">
                  <AlertCircle className="h-4 w-4" />
                  {errors.general}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-8">
              {/* Full Name - Only for registration */}
              {!isLogin && (
                <div className="space-y-2">
                  <label 
                    htmlFor="fullName"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-text-light/40 dark:text-text-dark/40" />
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/40 dark:text-text-dark/40">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`pl-9 ${errors.fullName ? 'border-status-error focus:ring-status-error' : ''}`}
                      placeholder="Enter your full name"
                      required
                      aria-required="true"
                      aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    />
                  </div>
                  {errors.fullName && (
                    <div 
                      id="fullName-error" 
                      className="flex items-center gap-1 mt-1 text-sm text-status-error"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {errors.fullName}
                    </div>
                  )}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label 
                  htmlFor="email"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Mail className="h-4 w-4 text-text-light/40 dark:text-text-dark/40" />
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/40 dark:text-text-dark/40">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-9 ${errors.email ? 'border-status-error focus:ring-status-error' : ''}`}
                    placeholder="Enter your email"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <div 
                    id="email-error" 
                    className="flex items-center gap-1 mt-1 text-sm text-status-error"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label 
                  htmlFor="password"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Lock className="h-4 w-4 text-text-light/40 dark:text-text-dark/40" />
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/40 dark:text-text-dark/40">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-9 pr-10 ${errors.password ? 'border-status-error focus:ring-status-error' : ''}`}
                    placeholder="Enter your password"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('password')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light/40 dark:text-text-dark/40 hover:text-text-light dark:hover:text-text-dark transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div 
                    id="password-error" 
                    className="flex items-center gap-1 mt-1 text-sm text-status-error"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Confirm Password - Only for registration */}
              {!isLogin && (
                <div className="space-y-2">
                  <label 
                    htmlFor="confirmPassword"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4 text-text-light/40 dark:text-text-dark/40" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/40 dark:text-text-dark/40">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`pl-9 pr-10 ${errors.confirmPassword ? 'border-status-error focus:ring-status-error' : ''}`}
                      placeholder="Confirm your password"
                      required
                      aria-required="true"
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light/40 dark:text-text-dark/40 hover:text-text-light dark:hover:text-text-dark transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div 
                      id="confirm-password-error" 
                      className="flex items-center gap-1 mt-1 text-sm text-status-error"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
              )}

              {/* Remember Me & Forgot Password - Only show for login */}
              {isLogin && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-border-light dark:border-border-dark text-coral-500 focus:ring-coral-500"
                    />
                    <label htmlFor="rememberMe" className="ml-2 block">
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-coral-500 hover:text-coral-hover transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-coral-500 hover:bg-coral-hover text-white transition-colors group"
              >
                <span className="flex items-center justify-center gap-2">
                  {isLogin ? 'Log In' : 'Sign Up'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>

              {/* Conditionally show "Resend Verification" if user is unverified */}
              {isLogin && showResend && (
                <div className="mt-3 text-center">
                  <p className="text-sm">
                    Didn’t receive the verification link?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="text-teal-500 hover:text-teal-hover transition-colors font-medium mt-1"
                  >
                    Resend Verification Email
                  </button>
                </div>
              )}

              {/* Toggle between Login/Register */}
              <p className="text-center text-sm pt-2">
                {isLogin ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={handleModeToggle}
                      disabled={isAnimating}
                      className="text-coral-500 hover:text-coral-hover transition-colors font-medium disabled:opacity-50"
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={handleModeToggle}
                      disabled={isAnimating}
                      className="text-coral-500 hover:text-coral-hover transition-colors font-medium disabled:opacity-50"
                    >
                      Log In
                    </button>
                  </>
                )}
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </>
  );
}
