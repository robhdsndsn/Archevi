import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Is there really a free trial?',
    answer:
      'Yes! All plans include a 14-day free trial with full access to all features. No credit card required to start. If you decide not to continue, your account will simply be downgraded.',
  },
  {
    question: 'What happens after my trial ends?',
    answer:
      'After your trial, you can choose to subscribe to a paid plan to continue using Archevi. If you don\'t subscribe, your account will be paused, but your data will be retained for 30 days so you can come back anytime.',
  },
  {
    question: 'Can I change plans later?',
    answer:
      'Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll get immediate access to new features. When downgrading, changes take effect at the end of your billing cycle.',
  },
  {
    question: 'What counts as an "AI query"?',
    answer:
      'An AI query is counted each time you ask a question using our natural language search feature. Document uploads, browsing, and standard searches don\'t count toward your query limit.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes, security is our top priority. All data is encrypted at rest and in transit. We use enterprise-grade security measures and are committed to PIPEDA compliance. Your documents are never used to train AI models.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'We offer a full refund within 30 days of your first payment if you\'re not satisfied with Archevi. Just contact our support team, and we\'ll process your refund, no questions asked.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor Stripe. For Family Office plans, we also offer invoicing and bank transfers.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period, and you won\'t be charged again.',
  },
];

export function PricingFAQ() {
  return (
    <div className="bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">
          Pricing FAQ
        </h2>
        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
