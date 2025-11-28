import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetPasswordPage } from './SetPasswordPage';

// Mock the windmill client
vi.mock('@/api/windmill/client', () => ({
  windmill: {
    setPassword: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { windmill } from '@/api/windmill/client';
import { toast } from 'sonner';

describe('SetPasswordPage', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset URL
    Object.defineProperty(window, 'location', {
      value: { search: '', pathname: '/' },
      writable: true,
    });
  });

  it('renders the form correctly', () => {
    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByText('Archevi')).toBeInTheDocument();
    expect(screen.getByText('Set your password')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument();
  });

  it('shows welcome message when invite token is present', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?token=abc123&email=test@example.com', pathname: '/' },
      writable: true,
    });

    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByText('Welcome to the family!')).toBeInTheDocument();
  });

  it('pre-fills email from URL parameter', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?token=abc123&email=invited@example.com', pathname: '/' },
      writable: true,
    });

    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/email/i)).toHaveValue('invited@example.com');
  });

  it('shows password strength indicators', async () => {
    const user = userEvent.setup();
    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const passwordInput = screen.getByLabelText(/new password/i);
    await user.type(passwordInput, 'Test1');

    // Check that strength indicators appear
    expect(screen.getByText('8+ characters')).toBeInTheDocument();
    expect(screen.getByText('Uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('Lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('Number')).toBeInTheDocument();
  });

  it('shows password match indicator', async () => {
    const user = userEvent.setup();
    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/new password/i), 'TestPass1');
    await user.type(screen.getByLabelText(/confirm password/i), 'TestPass1');

    expect(screen.getByText('Passwords match')).toBeInTheDocument();
  });

  it('shows mismatch indicator when passwords differ', async () => {
    const user = userEvent.setup();
    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/new password/i), 'TestPass1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Different1');

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('disables submit when password is weak', async () => {
    const user = userEvent.setup();
    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/new password/i), 'weak');
    await user.type(screen.getByLabelText(/confirm password/i), 'weak');

    expect(screen.getByRole('button', { name: /set password/i })).toBeDisabled();
  });

  it('enables submit with strong matching passwords', async () => {
    const user = userEvent.setup();
    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/new password/i), 'StrongPass1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass1');

    expect(screen.getByRole('button', { name: /set password/i })).not.toBeDisabled();
  });

  it('submits password successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(windmill.setPassword).mockResolvedValueOnce({
      success: true,
      message: 'Password set successfully',
    });

    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/new password/i), 'StrongPass1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass1');
    await user.click(screen.getByRole('button', { name: /set password/i }));

    await waitFor(() => {
      expect(windmill.setPassword).toHaveBeenCalledWith(
        'test@example.com',
        'StrongPass1',
        undefined
      );
      expect(toast.success).toHaveBeenCalledWith('Password set successfully!', expect.any(Object));
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('submits with invite token when present', async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, 'location', {
      value: { search: '?token=invite123&email=invited@example.com', pathname: '/' },
      writable: true,
    });

    vi.mocked(windmill.setPassword).mockResolvedValueOnce({
      success: true,
      message: 'Password set successfully',
    });

    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/new password/i), 'StrongPass1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass1');
    await user.click(screen.getByRole('button', { name: /set password/i }));

    await waitFor(() => {
      expect(windmill.setPassword).toHaveBeenCalledWith(
        'invited@example.com',
        'StrongPass1',
        'invite123'
      );
    });
  });

  it('displays error when password set fails', async () => {
    const user = userEvent.setup();
    vi.mocked(windmill.setPassword).mockResolvedValueOnce({
      success: false,
      error: 'Invalid invite token',
    });

    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/new password/i), 'StrongPass1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass1');
    await user.click(screen.getByRole('button', { name: /set password/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid invite token')).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('handles network errors', async () => {
    const user = userEvent.setup();
    vi.mocked(windmill.setPassword).mockRejectedValueOnce(new Error('Network error'));

    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/new password/i), 'StrongPass1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass1');
    await user.click(screen.getByRole('button', { name: /set password/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('calls onCancel when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: /back to sign in/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<SetPasswordPage onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const passwordInput = screen.getByLabelText(/new password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Find toggle button (icon button)
    const toggleButtons = screen.getAllByRole('button');
    const toggleButton = toggleButtons.find((btn) => btn.className.includes('absolute'));
    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });
});
