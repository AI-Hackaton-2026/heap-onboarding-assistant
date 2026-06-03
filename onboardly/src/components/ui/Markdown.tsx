// Token-styled GitHub-flavored Markdown renderer shared by course and chat
// content.

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const components = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="font-heading mt-8 mb-3 text-2xl font-semibold first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="font-heading mt-7 mb-2 text-xl font-semibold">{children}</h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="font-heading mt-6 mb-2 text-lg font-semibold">{children}</h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="text-foreground/90 mb-4 leading-7 last:mb-0">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-4 ml-5 list-disc space-y-1.5">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-4 ml-5 list-decimal space-y-1.5">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="text-foreground/90 leading-7">{children}</li>
  ),
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="bg-muted border-border mb-4 overflow-x-auto rounded-xl border p-4 text-sm">
      {children}
    </pre>
  ),
  code: ({
    className,
    children,
  }: {
    className?: string;
    children?: ReactNode;
  }) => {
    const isBlock = Boolean(className?.startsWith("language-"));
    return isBlock ? (
      <code className={cn("font-mono", className)}>{children}</code>
    ) : (
      <code className="bg-muted text-foreground rounded-md px-1.5 py-0.5 font-mono text-[0.875em]">
        {children}
      </code>
    );
  },
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="border-primary/40 text-muted-foreground my-4 border-l-4 pl-4 italic">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary font-medium hover:underline"
    >
      {children}
    </a>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="mb-4 overflow-x-auto rounded-xl border">
      <table className="border-border w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="border-border bg-muted border-b px-3 py-2 text-left font-medium">
      {children}
    </th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="border-border border-t px-3 py-2">{children}</td>
  ),
};

export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 text-sm", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
