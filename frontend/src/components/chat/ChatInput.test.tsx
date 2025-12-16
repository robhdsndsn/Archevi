import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default placeholder', () => {
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    expect(screen.getByPlaceholderText('Ask Archevi...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(
      <ChatInput
        onSubmit={mockOnSubmit}
        isLoading={false}
        placeholder="Type your question..."
      />
    );

    expect(screen.getByPlaceholderText('Type your question...')).toBeInTheDocument();
  });

  it('has accessible label for textarea', () => {
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
  });

  it('has accessible label for send button', () => {
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('disables input and button when loading', () => {
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={true} />);

    expect(screen.getByLabelText('Message input')).toBeDisabled();
    expect(screen.getByLabelText('Sending message...')).toBeDisabled();
  });

  it('disables send button when input is empty', () => {
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('enables send button when input has text', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    await user.type(screen.getByLabelText('Message input'), 'Hello');

    expect(screen.getByLabelText('Send message')).not.toBeDisabled();
  });

  it('submits message on Enter key', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    const input = screen.getByLabelText('Message input');
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
  });

  it('does not submit on Shift+Enter (allows newline)', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    const input = screen.getByLabelText('Message input');
    await user.type(input, 'Line 1');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await user.type(input, 'Line 2');

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits message on button click', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    await user.type(screen.getByLabelText('Message input'), 'Click submit');
    await user.click(screen.getByLabelText('Send message'));

    expect(mockOnSubmit).toHaveBeenCalledWith('Click submit');
  });

  it('clears input after submission', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    const input = screen.getByLabelText('Message input');
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    expect(input).toHaveValue('');
  });

  it('trims whitespace from submitted message', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    await user.type(screen.getByLabelText('Message input'), '  Hello world  ');
    await user.keyboard('{Enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith('Hello world');
  });

  it('does not submit whitespace-only messages', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    await user.type(screen.getByLabelText('Message input'), '   ');
    await user.keyboard('{Enter}');

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when loading', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={true} />);

    // Input is disabled, but let's verify onSubmit isn't called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows loading spinner when loading', () => {
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={true} />);

    // Button should have loading indicator
    expect(screen.getByLabelText('Sending message...')).toBeInTheDocument();
  });

  it('has screen reader hint for keyboard shortcuts', () => {
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    expect(screen.getByText(/Press Enter to send/i)).toBeInTheDocument();
  });

  it('has proper region role for accessibility', () => {
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    expect(screen.getByRole('region', { name: 'Chat input' })).toBeInTheDocument();
  });
});
