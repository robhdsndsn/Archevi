'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { signup, login, buildAppRedirectUrl, getSignInUrl } from '@/lib/auth';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  familyName: string;
  acceptTerms: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  familyName?: string;
  acceptTerms?: string;
  general?: string;
}

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', check: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', check: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', check: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', check: (p: string) => /\d/.test(p) },
];

function SignupFormInner({ planFromUrl }: { planFromUrl: string | null }) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    familyName: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return PASSWORD_REQUIREMENTS.every((req) => req.check(password));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password does not meet requirements';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.familyName) {
      newErrors.familyName = 'Family name is required';
    } else if (formData.familyName.length < 2) {
      newErrors.familyName = 'Family name must be at least 2 characters';
    } else if (formData.familyName.length > 50) {
      newErrors.familyName = 'Family name must be less than 50 characters';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Step 1: Create account and tenant using the new auth_signup endpoint
      const signupResult = await signup({
        email: formData.email,
        password: formData.password,
        familyName: formData.familyName,
        plan: planFromUrl || 'trial',
      });

      if (!signupResult.success) {
        throw new Error(signupResult.error || 'Failed to create account');
      }

      // Step 2: Login to get auth tokens
      const loginResult = await login(formData.email, formData.password);

      if (!loginResult.success) {
        // Account created but login failed - redirect to sign in
        window.location.href = `${getSignInUrl()}?email=${encodeURIComponent(formData.email)}&new=true`;
        return;
      }

      // Step 3: Redirect to dashboard with tokens in URL fragment
      if (loginResult.access_token && loginResult.refresh_token) {
        const redirectUrl = buildAppRedirectUrl(
          loginResult.access_token,
          loginResult.refresh_token
        );
        window.location.href = redirectUrl;
      } else {
        // No tokens, redirect to login
        window.location.href = `${getSignInUrl()}?email=${encodeURIComponent(formData.email)}&new=true`;
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'An error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const getPlanBadge = () => {
    switch (planFromUrl) {
      case 'starter':
        return <Badge variant="outline">Starter Plan</Badge>;
      case 'family':
        return <Badge>Family Plan</Badge>;
      default:
        return <Badge variant="secondary">14-day Free Trial</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mb-2 flex justify-center">{getPlanBadge()}</div>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Start your free trial and organize your family documents with AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.general}
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={errors.email ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Family Name */}
          <div className="space-y-2">
            <Label htmlFor="familyName">Family Name</Label>
            <Input
              id="familyName"
              type="text"
              placeholder="The Hudson Family"
              value={formData.familyName}
              onChange={(e) => handleChange('familyName', e.target.value)}
              className={errors.familyName ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {errors.familyName && (
              <p className="text-sm text-destructive">{errors.familyName}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This will be your organization name in Archevi
            </p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {/* Password requirements */}
            <div className="mt-2 space-y-1">
              {PASSWORD_REQUIREMENTS.map((req) => {
                const met = req.check(formData.password);
                return (
                  <div
                    key={req.id}
                    className={`flex items-center gap-2 text-xs ${
                      formData.password
                        ? met
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {formData.password && met ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {req.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className={
                  errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'
                }
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Terms */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) =>
                handleChange('acceptTerms', checked === true)
              }
              disabled={isLoading}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className={`text-sm ${
                  errors.acceptTerms ? 'text-destructive' : ''
                }`}
              >
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-destructive">{errors.acceptTerms}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a
            href={getSignInUrl()}
            className="text-primary hover:underline"
          >
            Sign in
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}

function SignupFormWithParams() {
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get('plan');
  return <SignupFormInner planFromUrl={planFromUrl} />;
}

export function SignupForm() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    }>
      <SignupFormWithParams />
    </Suspense>
  );
}
