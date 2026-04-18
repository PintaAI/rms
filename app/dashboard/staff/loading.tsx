export default function StaffLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
      <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-xl font-semibold">Loading dashboard...</h2>
      <p className="text-sm text-muted-foreground mt-2">Fetching services data</p>
    </div>
  )
}