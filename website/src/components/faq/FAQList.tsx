'use client';

import { useState } from 'react';
import { Search, HelpCircle, MessageCircle, Shield, Settings, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { FAQ, FAQCategory } from '@/lib/types/strapi';
import { renderBlocksToHTML } from '@/lib/strapi-client';

interface FAQListProps {
  faqsByCategory: Record<string, FAQ[]>;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Getting Started': <HelpCircle className="h-4 w-4" />,
  'Messaging': <MessageCircle className="h-4 w-4" />,
  'Account': <Settings className="h-4 w-4" />,
  'Privacy': <Shield className="h-4 w-4" />,
  'Technical': <Settings className="h-4 w-4" />,
  'Billing': <CreditCard className="h-4 w-4" />,
};

const categoryOrder: string[] = [
  'Getting Started',
  'Account',
  'Messaging',
  'Privacy',
  'Technical',
  'Billing',
];

export function FAQList({ faqsByCategory }: FAQListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all FAQs in a flat array
  const allFaqs = Object.values(faqsByCategory).flat();

  // Filter FAQs based on search query
  const filteredFaqs = searchQuery
    ? allFaqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  // Sort categories by predefined order
  const sortedCategories = Object.keys(faqsByCategory).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div className="mx-auto max-w-3xl">
      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Search Results */}
      {filteredFaqs !== null ? (
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''}{' '}
            for &quot;{searchQuery}&quot;
          </h2>
          {filteredFaqs.length === 0 ? (
            <p className="text-muted-foreground">
              No questions found. Try a different search term.
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq) => (
                <AccordionItem key={faq.documentId} value={faq.documentId}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: renderBlocksToHTML(faq.answer),
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      ) : (
        /* Category Tabs */
        <Tabs defaultValue={sortedCategories[0]} className="w-full">
          <TabsList className="mb-6 flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            {sortedCategories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {categoryIcons[category]}
                <span className="ml-2">{category}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {sortedCategories.map((category) => (
            <TabsContent key={category} value={category}>
              <Accordion type="single" collapsible className="w-full">
                {faqsByCategory[category].map((faq) => (
                  <AccordionItem key={faq.documentId} value={faq.documentId}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: renderBlocksToHTML(faq.answer),
                        }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Contact CTA */}
      <div className="mt-12 rounded-lg border bg-muted/30 p-8 text-center">
        <h3 className="mb-2 text-xl font-semibold">Still have questions?</h3>
        <p className="mb-4 text-muted-foreground">
          Our support team is here to help you get started.
        </p>
        <Button asChild>
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
}
