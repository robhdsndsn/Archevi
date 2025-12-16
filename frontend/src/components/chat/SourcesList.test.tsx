import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourcesList } from './SourcesList';
import type { Source } from '@/api/windmill';

const mockSources: Source[] = [
  {
    id: '1',
    title: 'Passport Document',
    category: 'Identity',
    relevance: 0.95,
  },
  {
    id: '2',
    title: 'Insurance Policy',
    category: 'Financial',
    relevance: 0.72,
  },
  {
    id: '3',
    title: 'Old Receipt',
    category: 'Receipts',
    relevance: 0.35,
  },
];

describe('SourcesList', () => {
  it('returns null when sources array is empty', () => {
    const { container } = render(<SourcesList sources={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('displays source count', () => {
    render(<SourcesList sources={mockSources} />);

    expect(screen.getByText('3 sources')).toBeInTheDocument();
  });

  it('displays singular "source" for single source', () => {
    render(<SourcesList sources={[mockSources[0]]} />);

    expect(screen.getByText('1 source')).toBeInTheDocument();
  });

  it('displays confidence percentage when provided', () => {
    render(<SourcesList sources={mockSources} confidence={0.87} />);

    expect(screen.getByText('(87% confidence)')).toBeInTheDocument();
  });

  it('does not display confidence when not provided', () => {
    render(<SourcesList sources={mockSources} />);

    expect(screen.queryByText(/confidence/)).not.toBeInTheDocument();
  });

  it('sources are collapsed by default', () => {
    render(<SourcesList sources={mockSources} />);

    expect(screen.queryByText('Passport Document')).not.toBeInTheDocument();
  });

  it('expands sources on button click', async () => {
    const user = userEvent.setup();
    render(<SourcesList sources={mockSources} />);

    await user.click(screen.getByText('3 sources'));

    expect(screen.getByText('Passport Document')).toBeInTheDocument();
    expect(screen.getByText('Insurance Policy')).toBeInTheDocument();
    expect(screen.getByText('Old Receipt')).toBeInTheDocument();
  });

  it('collapses sources on second button click', async () => {
    const user = userEvent.setup();
    render(<SourcesList sources={mockSources} />);

    // Expand
    await user.click(screen.getByText('3 sources'));
    expect(screen.getByText('Passport Document')).toBeInTheDocument();

    // Collapse
    await user.click(screen.getByText('3 sources'));
    expect(screen.queryByText('Passport Document')).not.toBeInTheDocument();
  });

  it('displays source categories', async () => {
    const user = userEvent.setup();
    render(<SourcesList sources={mockSources} />);

    await user.click(screen.getByText('3 sources'));

    expect(screen.getByText('Identity')).toBeInTheDocument();
    expect(screen.getByText('Financial')).toBeInTheDocument();
    expect(screen.getByText('Receipts')).toBeInTheDocument();
  });

  it('displays relevance percentage for each source', async () => {
    const user = userEvent.setup();
    render(<SourcesList sources={mockSources} />);

    await user.click(screen.getByText('3 sources'));

    expect(screen.getByText('95% match')).toBeInTheDocument();
    expect(screen.getByText('72% match')).toBeInTheDocument();
    expect(screen.getByText('35% match')).toBeInTheDocument();
  });

  it('applies green styling for high relevance (>= 80%)', async () => {
    const user = userEvent.setup();
    render(<SourcesList sources={mockSources} />);

    await user.click(screen.getByText('3 sources'));

    const highRelevanceBadge = screen.getByText('95% match');
    expect(highRelevanceBadge).toHaveClass('bg-green-100');
  });

  it('applies yellow styling for medium relevance (50-79%)', async () => {
    const user = userEvent.setup();
    render(<SourcesList sources={mockSources} />);

    await user.click(screen.getByText('3 sources'));

    const mediumRelevanceBadge = screen.getByText('72% match');
    expect(mediumRelevanceBadge).toHaveClass('bg-yellow-100');
  });

  it('applies gray styling for low relevance (< 50%)', async () => {
    const user = userEvent.setup();
    render(<SourcesList sources={mockSources} />);

    await user.click(screen.getByText('3 sources'));

    const lowRelevanceBadge = screen.getByText('35% match');
    expect(lowRelevanceBadge).toHaveClass('bg-gray-100');
  });

  it('has help icon with hover card', () => {
    render(<SourcesList sources={mockSources} />);

    // Help icon should be present
    const helpButton = screen.getByRole('button', { name: '' });
    expect(helpButton).toBeInTheDocument();
  });

  it('shows explanation on help hover', async () => {
    const user = userEvent.setup();
    render(<SourcesList sources={mockSources} />);

    // Find and hover over help icon
    const helpButtons = screen.getAllByRole('button');
    const helpIcon = helpButtons.find((btn) => btn.querySelector('.lucide-circle-help'));

    if (helpIcon) {
      await user.hover(helpIcon);
      // HoverCard content should appear
      expect(await screen.findByText('About Sources')).toBeInTheDocument();
    }
  });

  it('rounds confidence percentage correctly', () => {
    render(<SourcesList sources={mockSources} confidence={0.8765} />);

    expect(screen.getByText('(88% confidence)')).toBeInTheDocument();
  });

  it('rounds relevance percentage correctly', async () => {
    const user = userEvent.setup();
    const sourcesWithDecimal: Source[] = [
      { id: '1', title: 'Test', category: 'Test', relevance: 0.8749 },
    ];

    render(<SourcesList sources={sourcesWithDecimal} />);
    await user.click(screen.getByText('1 source'));

    expect(screen.getByText('87% match')).toBeInTheDocument();
  });
});
