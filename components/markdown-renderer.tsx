"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

/**
 * Extract text content from React children (handles nested elements)
 */
function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children.map(extractText).join("");
  }
  if (children && typeof children === "object" && "props" in children) {
    return extractText((children as React.ReactElement<{ children?: React.ReactNode }>).props.children);
  }
  return "";
}

/**
 * Convert heading text to a URL-friendly slug (same logic as getTableOfContents)
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, children, ...props }) => {
            const text = extractText(children);
            const id = text ? slugify(text) : undefined;
            return <h1 id={id} className="text-3xl font-bold mt-8 mb-4" {...props}>{children}</h1>;
          },
          h2: ({ node, children, ...props }) => {
            const text = extractText(children);
            const id = text ? slugify(text) : undefined;
            return <h2 id={id} className="text-2xl font-semibold mt-6 mb-3" {...props}>{children}</h2>;
          },
          h3: ({ node, children, ...props }) => {
            const text = extractText(children);
            const id = text ? slugify(text) : undefined;
            return <h3 id={id} className="text-xl font-semibold mt-4 mb-2" {...props}>{children}</h3>;
          },
          h4: ({ node, children, ...props }) => {
            const text = extractText(children);
            const id = text ? slugify(text) : undefined;
            return <h4 id={id} className="text-lg font-semibold mt-3 mb-1" {...props}>{children}</h4>;
          },
          p: ({ node, ...props }) => (
            <p className="text-muted-foreground mb-4 leading-relaxed" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-muted-foreground" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-primary hover:underline font-medium"
              target={props.href?.startsWith("http") ? "_blank" : undefined}
              rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/50 rounded-r"
              {...props}
            />
          ),
          code: ({ node, inline, ...props }: { node?: any; inline?: boolean } & any) =>
            inline ? (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary"
                {...props}
              />
            ) : (
              <code
                className="block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono"
                {...props}
              />
            ),
          pre: ({ node, ...props }) => (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              className="border px-4 py-2 bg-muted font-semibold text-left"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className="border px-4 py-2" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-muted-foreground/30" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
