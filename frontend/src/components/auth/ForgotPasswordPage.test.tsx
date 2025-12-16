import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordPage } from './ForgotPasswordPage';

// Mock the windmill API
vi.mock('@/api/windmill', () => ({
  windmill: {
    requestPasswordReset: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

import { windmill } from '@/api/windmill';
import { toast } from 'sonner';

describe('ForgotPasswordPage', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the forgot password form', () => {
    render(<ForgotPasswordPage onBack={mockOnBack} />);

    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate reset link/i })).toBeInTheDocument();
  });

  it('has a back button that calls onBack', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage onBack={mockOnBack} />);

    const backButton = screen.getByRole('button', { name: /back to sign in/i });
    await user.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('shows error when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage onBack={mockOnBack} />);

    // Email input is empty, so button should be disabled
    const submitButton = screen.getByRole('button', { name: /generate reset link/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when email is entered', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage onBack={mockOnBack} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /generate reset link/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('submits email and shows success with reset link', async () => {
    const user = userEvent.setup();
    vi.mocked(windmill.requestPasswordReset).mockResolvedValue({
      success: true,
      reset_token: 'test-token-123',
    });

    render(<ForgotPasswordPage onBack={mockOnBack} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /generate reset link/i }));

    await waitFor(() => {
      expect(windmill.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Reset link generated!', expect.any(Object));
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    // Make the API call hang
    vi.mocked(windmill.requestPasswordReset).mockImplementation(
      () => new Promise(() => {})
    );

    render(<ForgotPasswordPage onBack={mockOnBack} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /generate reset link/i }));

    // Should show loading indicator
    await waitFor(() => {
      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    const user = userEvent.setup();
    vi.mocked(windmill.requestPasswordReset).mockRejectedValue(new Error('Network error'));

    render(<ForgotPasswordPage onBack={mockOnBack} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /generate reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('handles user not found without revealing it', async () => {
    const user = userEvent.setup();
    vi.mocked(windmill.requestPasswordReset).mockResolvedValue({
      success: true,
      message: 'If an account exists, instructions will be sent',
    });

    render(<ForgotPasswordPage onBack={mockOnBack} />);

    await user.type(screen.getByLabelText(/email/i), 'unknown@example.com');
    await user.click(screen.getByRole('button', { name: /generate reset link/i }));

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalled();
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  it('displays reset link when generated', async () => {
    const user = userEvent.setup();
    vi.mocked(windmill.requestPasswordReset).mockResolvedValue({
      success: true,
      reset_token: 'abc123',
    });

    render(<ForgotPasswordPage onBack={mockOnBack} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /generate reset link/i }));

    await waitFor(() => {
      // Should show the Reset Link Ready title
      expect(screen.getByText('Reset Link Ready')).toBeInTheDocument();
    });
  });

  it('shows copy link button after reset link generated', async () => {
    const user = userEvent.setup();
    vi.mocked(windmill.requestPasswordReset).mockResolvedValue({
      success: true,
      reset_token: 'abc123',
    });

    render(<ForgotPasswordPage onBack={mockOnBack} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /generate reset link/i }));

    await waitFor(() => {
      // Should show copy link button
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
      // Should also show the reset link input
      expect(screen.getByText('Reset Link')).toBeInTheDocument();
    });
  });

  it('shows archevi branding', () => {
    render(<ForgotPasswordPage onBack={mockOnBack} />);

    expect(screen.getByText('Archevi')).toBeInTheDocument();
    expect(screen.getByText('Family Archive')).toBeInTheDocument();
  });
});
