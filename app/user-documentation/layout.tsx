import { getAllDocFiles } from "@/lib/markdown";
import Link from "next/link";
import { RiFileTextLine, RiAdminLine, RiUserLine, RiToolsLine } from "@remixicon/react";
import { UserInfo } from "@/components/user-info";

// Icon mapping for different doc types
const docIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "getting-started": RiFileTextLine,
  "A-features-overview": RiFileTextLine,
  "Dashboard-admin": RiAdminLine,
  "Dashboard-staff": RiUserLine,
  "Dashboard-teknisi": RiToolsLine,
  "faq": RiFileTextLine,
};

export default async function UserDocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = await getAllDocFiles();
  
  // Exclude index.md from the list
  const docList = docs.filter((doc) => doc.slug !== "index");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto py-3 px-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <RiFileTextLine className="size-4" />
              </div>
              <h1 className="text-lg font-semibold">RMS User-Manual</h1>
            </Link>
            <UserInfo />
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="container mx-auto py-8 px-4">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Document Cards */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-3">
              <h2 className="text-lg font-semibold mb-4">Dokumentasi</h2>
              <nav className="space-y-2">
                {docList.map((doc) => {
                  const IconComponent = docIcons[doc.slug] || RiFileTextLine;
                  return (
                    <Link
                      key={doc.slug}
                      href={`/user-documentation/${doc.slug}`}
                      className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all duration-200"
                    >
                      <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <IconComponent className="size-4" />
                      </div>
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">
                        {doc.title}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            {children}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Panduan Pengguna RMS - Repair Management System</p>
          <p className="mt-2">Dibuat untuk membantu Anda menggunakan sistem dengan maksimal.</p>
        </div>
      </footer>
    </div>
  );
}
