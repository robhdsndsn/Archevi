import { Upload, Sparkles, MessageSquare, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload your documents',
    description:
      'PDFs, scanned images, or type directly. Bulk upload with ZIP files or scan with your phone camera.',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'AI processes everything',
    description:
      'Automatic OCR, categorization, tagging, and expiry date detection. No manual organization needed.',
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'Ask questions naturally',
    description:
      '"When does my car insurance expire?" "What did the doctor recommend?" Get answers instantly.',
  },
  {
    number: '04',
    icon: CheckCircle2,
    title: 'Get cited answers',
    description:
      'Every response shows exactly which documents were used. Click through to see the source.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            How Archevi works
          </h2>
          <p className="text-lg text-muted-foreground">
            From document chaos to searchable knowledge in four simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="absolute left-0 right-0 top-24 hidden h-0.5 bg-border lg:block" />

          <div className="grid gap-8 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Step card */}
                <div className="rounded-xl border bg-background p-6 shadow-sm">
                  {/* Step number */}
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-4xl font-bold text-primary/20">
                      {step.number}
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <step.icon className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                {/* Arrow (except last) */}
                {index < steps.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 lg:block">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                      fill="none"
                      className="text-primary"
                    >
                      <path
                        d="M12 8l8 8-8 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
