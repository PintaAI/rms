export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kelola Toko</h1>
        <p className="text-muted-foreground">Manage all your stores.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-lg border animate-pulse bg-muted/50"
          />
        ))}
      </div>
    </div>
  );
}