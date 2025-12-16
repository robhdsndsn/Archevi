'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { BlocksContent } from '@/lib/types/strapi';

interface RichTextRendererProps {
  content: BlocksContent;
  className?: string;
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';

/**
 * React component to render Strapi Blocks content
 * Provides better styling and image optimization compared to HTML string rendering
 */
export function RichTextRenderer({ content, className }: RichTextRendererProps) {
  if (!content || !Array.isArray(content)) {
    return null;
  }

  return (
    <div className={cn('prose prose-lg max-w-none dark:prose-invert', className)}>
      {content.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

function renderBlock(block: BlocksContent[number], index: number) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p key={index} className="mb-4">
          {renderChildren(block.children)}
        </p>
      );

    case 'heading': {
      const level = block.level || 2;
      const headingClasses: Record<number, string> = {
        1: 'text-4xl font-bold mt-8 mb-4',
        2: 'text-3xl font-bold mt-8 mb-4',
        3: 'text-2xl font-semibold mt-6 mb-3',
        4: 'text-xl font-semibold mt-6 mb-3',
        5: 'text-lg font-semibold mt-4 mb-2',
        6: 'text-base font-semibold mt-4 mb-2',
      };
      const className = headingClasses[level];
      const children = renderChildren(block.children);

      if (level === 1) return <h1 key={index} className={className}>{children}</h1>;
      if (level === 2) return <h2 key={index} className={className}>{children}</h2>;
      if (level === 3) return <h3 key={index} className={className}>{children}</h3>;
      if (level === 4) return <h4 key={index} className={className}>{children}</h4>;
      if (level === 5) return <h5 key={index} className={className}>{children}</h5>;
      return <h6 key={index} className={className}>{children}</h6>;
    }

    case 'list':
      const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
      return (
        <ListTag
          key={index}
          className={cn(
            'mb-4 pl-6',
            block.format === 'ordered' ? 'list-decimal' : 'list-disc'
          )}
        >
          {block.children?.map((item, itemIndex) => (
            <li key={itemIndex} className="mb-1">
              {renderChildren(item.children as BlocksContent[number]['children'])}
            </li>
          ))}
        </ListTag>
      );

    case 'quote':
      return (
        <blockquote
          key={index}
          className="border-l-4 border-primary pl-4 italic my-6 text-muted-foreground"
        >
          {renderChildren(block.children)}
        </blockquote>
      );

    case 'code':
      return (
        <pre
          key={index}
          className="bg-muted rounded-lg p-4 overflow-x-auto my-6 text-sm"
        >
          <code className="text-foreground">
            {block.children?.map((child) => child.text).join('')}
          </code>
        </pre>
      );

    case 'image':
      if (block.image) {
        const imageUrl = block.image.url.startsWith('http')
          ? block.image.url
          : `${STRAPI_URL}${block.image.url}`;
        return (
          <figure key={index} className="my-8">
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt={block.image.alternativeText || ''}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
            {block.image.alternativeText && (
              <figcaption className="text-center text-sm text-muted-foreground mt-2">
                {block.image.alternativeText}
              </figcaption>
            )}
          </figure>
        );
      }
      return null;

    default:
      // Fallback for unknown block types
      if (block.children) {
        return (
          <div key={index} className="mb-4">
            {renderChildren(block.children)}
          </div>
        );
      }
      return null;
  }
}

function renderChildren(children?: BlocksContent[number]['children']) {
  if (!children) return null;

  return children.map((child, index) => {
    if (child.type === 'text' && child.text) {
      let content: React.ReactNode = child.text;

      if (child.code) {
        content = (
          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
            {content}
          </code>
        );
      }
      if (child.bold) {
        content = <strong className="font-semibold">{content}</strong>;
      }
      if (child.italic) {
        content = <em>{content}</em>;
      }
      if (child.underline) {
        content = <u>{content}</u>;
      }
      if (child.strikethrough) {
        content = <s>{content}</s>;
      }

      return <span key={index}>{content}</span>;
    }

    if (child.type === 'link' && child.url) {
      return (
        <a
          key={index}
          href={child.url}
          className="text-primary hover:underline"
          target={child.url.startsWith('http') ? '_blank' : undefined}
          rel={child.url.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {child.children?.map((c, i) => (
            <span key={i}>{c.text}</span>
          ))}
        </a>
      );
    }

    return null;
  });
}
