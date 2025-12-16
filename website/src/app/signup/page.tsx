import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    'Create your Archevi account and start organizing your family documents with AI-powered search.',
  robots: {
    index: false, // Don't index signup page
  },
};

export default function SignupPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
      <SignupForm />
    </div>
  );
}
