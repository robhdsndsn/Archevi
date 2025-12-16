import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SystemHealth } from './system-health';

// Mock the windmill API
vi.mock('@/api/windmill', () => ({
  windmillAdmin: {
    getSystemHealth: vi.fn(),
  },
}));

// Import the mock after defining it
import { windmillAdmin } from '@/api/windmill';

describe('SystemHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock response - returns an array of ServiceHealth
    vi.mocked(windmillAdmin.getSystemHealth).mockResolvedValue([
      {
        name: 'Windmill',
        status: 'healthy',
        latency: 45,
        lastCheck: new Date().toISOString(),
        details: 'All workers operational',
      },
    ]);
  });

  it('renders the component with title after loading', async () => {
    render(<SystemHealth />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('System Health')).toBeInTheDocument();
    });
  });

  it('displays static services after loading', async () => {
    render(<SystemHealth />);

    // Wait for loading to finish and services to render
    await waitFor(() => {
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      expect(screen.getByText('Cohere API')).toBeInTheDocument();
      expect(screen.getByText('Groq API')).toBeInTheDocument();
    });
  });

  it('displays Windmill service after loading', async () => {
    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('Windmill')).toBeInTheDocument();
    });
  });

  it('shows healthy status badges', async () => {
    render(<SystemHealth />);

    await waitFor(() => {
      // Look for healthy status badges
      const healthyBadges = screen.getAllByText('Healthy');
      expect(healthyBadges.length).toBeGreaterThan(0);
    });
  });

  it('calls getSystemHealth on mount', async () => {
    render(<SystemHealth />);

    await waitFor(() => {
      expect(windmillAdmin.getSystemHealth).toHaveBeenCalledTimes(1);
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(windmillAdmin.getSystemHealth).mockRejectedValue(new Error('Network error'));

    render(<SystemHealth />);

    // Should not crash, static services should still be visible
    await waitFor(() => {
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    });
  });

  it('displays unhealthy status when service is down', async () => {
    vi.mocked(windmillAdmin.getSystemHealth).mockResolvedValue([
      {
        name: 'Windmill',
        status: 'unhealthy',
        latency: 0,
        lastCheck: new Date().toISOString(),
        details: 'Service unavailable',
      },
    ]);

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('Unhealthy')).toBeInTheDocument();
    });
  });
});
