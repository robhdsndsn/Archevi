import { configureAxe, toHaveNoViolations } from 'vitest-axe';
import { expect } from 'vitest';

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations);

// Configure axe for WCAG 2.1 AA compliance
export const axe = configureAxe({
  rules: {
    // WCAG 2.1 AA rules
    'color-contrast': { enabled: true },
    'label': { enabled: true },
    'button-name': { enabled: true },
    'image-alt': { enabled: true },
    'link-name': { enabled: true },
    'document-title': { enabled: true },
    'html-has-lang': { enabled: true },
    'meta-viewport': { enabled: true },
    'region': { enabled: true },
  },
});

/**
 * Check if a rendered element has any accessibility violations
 * Usage:
 *   const { container } = render(<Component />);
 *   await checkA11y(container);
 */
export async function checkA11y(container: Element, options?: { exclude?: string[] }) {
  const results = await axe(container);

  // Filter out excluded rules if specified
  if (options?.exclude) {
    results.violations = results.violations.filter(
      (violation) => !options.exclude?.includes(violation.id)
    );
  }

  expect(results).toHaveNoViolations();
}

/**
 * Get accessibility issues without failing the test
 * Useful for generating reports
 */
export async function getA11yIssues(container: Element) {
  const results = await axe(container);
  return {
    violations: results.violations,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    inapplicable: results.inapplicable.length,
  };
}
