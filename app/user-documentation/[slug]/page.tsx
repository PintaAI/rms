import { notFound } from "next/navigation";
import { readDocFile, getAllDocFiles, getTableOfContents } from "@/lib/markdown";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TableOfContents } from "@/components/table-of-contents";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const docs = await getAllDocFiles();
  return docs.map((doc) => ({
    slug: doc.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const doc = await readDocFile(slug);
  
  if (!doc) {
    return {
      title: "Dokumentasi Tidak Ditemukan",
    };
  }
  
  return {
    title: `${doc.title} - Panduan Pengguna RMS`,
    description: `Panduan pengguna RMS: ${doc.title}`,
  };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = await readDocFile(slug);

  if (!doc) {
    notFound();
  }

  const toc = getTableOfContents(doc.content);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <MarkdownRenderer content={doc.content} />
        </div>

        {/* Table of Contents Sidebar */}
        <TableOfContents items={toc} />
      </div>
    </div>
  );
}
