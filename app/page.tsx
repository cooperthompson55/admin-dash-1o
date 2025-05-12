import { createClient } from "@supabase/supabase-js"
import { BookingsTable } from "@/components/bookings-table"
import { TopNavigation } from "@/components/top-navigation"

export default async function AdminDashboard() {
  // Use environment variables for Supabase connection
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )

  // Fetch bookings data
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .order("preferred_date", { ascending: true })

  if (error) {
    console.error("Error fetching bookings:", error)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNavigation />
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold">Bookings Overview</h1>
          <p className="text-sm text-gray-500 mt-1 md:mt-0">{bookings?.length || 0} bookings found</p>
        </div>
        <BookingsTable bookings={bookings || []} />
      </main>
    </div>
  )
}
