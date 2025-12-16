"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { renderBlocksToHTML } from '@/lib/strapi-client';
import type { FAQ, FAQCategory } from '@/lib/types/strapi';

interface FAQListProps {
  faqsByCategory: Record<string, FAQ[]>;
}

const categoryLabels: Record<string, string> = {
  'Getting Started': 'Getting Started',
  Messaging: 'Messaging',
  Account: 'Account',
  Privacy: 'Privacy',
  Technical: 'Technical',
  general: 'General',
};

export function FAQList({ faqsByCategory }: FAQListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const categories = Object.keys(faqsByCategory);

  // Filter FAQs based on search query
  const filterFAQs = (faqs: FAQ[]) => {
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        renderBlocksToHTML(faq.answer).toLowerCase().includes(query)
    );
  };

  // Get all filtered FAQs across categories for search mode
  const getAllFilteredFAQs = () => {
    const allFaqs: FAQ[] = [];
    categories.forEach((category) => {
      allFaqs.push(...filterFAQs(faqsByCategory[category]));
    });
    return allFaqs;
  };

  const filteredAll = searchQuery.trim() ? getAllFilteredFAQs() : null;

  if (categories.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold mb-2">No FAQs yet</h3>
        <p className="text-muted-foreground">Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Search Results Mode */}
      {filteredAll && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            {filteredAll.length} result{filteredAll.length !== 1 ? 's' : ''} for "{searchQuery}"
          </p>
          {filteredAll.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredAll.map((faq, index) => (
                <AccordionItem key={faq.documentId} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{
                        __html: renderBlocksToHTML(faq.answer),
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground">
              No FAQs match your search. Try different keywords.
            </p>
          )}
        </div>
      )}

      {/* Category Tabs Mode */}
      {!filteredAll && (
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-transparent justify-start mb-6">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {categoryLabels[category] || category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <Accordion type="single" collapsible className="w-full">
                {faqsByCategory[category].map((faq, index) => (
                  <AccordionItem key={faq.documentId} value={`faq-${category}-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert"
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
    </div>
  );
}
