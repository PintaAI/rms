import { getAllDocFiles } from "@/lib/markdown";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export default async function UserDocumentationPage() {
  const docs = await getAllDocFiles();
  
  // Find index.md for intro content
  const indexDoc = docs.find((doc) => doc.slug === "index");

  return (
    <div className="space-y-8">
      {/* Introduction from index.md */}
      {indexDoc && (
        <section>
          <MarkdownRenderer content={indexDoc.content} />
        </section>
      )}
    </div>
  );
}
