"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { BookingsTable } from "@/components/bookings-table"
import { TopNavigation } from "@/components/top-navigation"
import { Loader2, RefreshCw, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRelativeTime } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Polling interval in milliseconds (30 seconds for more frequent checks)
const POLLING_INTERVAL = 30 * 1000

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newBookingsCount, setNewBookingsCount] = useState(0)
  const previousBookingCount = useRef(0)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Replace the entire fetchBookings function with this improved version that includes retry logic and better error handling:

  const fetchBookings = useCallback(
    async (isManualRefresh = false, silent = false, retryCount = 0) => {
      try {
        if (isManualRefresh) {
          setRefreshing(true)
        } else if (!lastUpdated && !silent) {
          setLoading(true)
        }

        if (!silent) setError(null)

        console.log("Fetching bookings...", new Date().toISOString())

        // Check if Supabase client is properly initialized
        if (!supabaseUrl || !supabaseAnonKey) {
          console.error("Supabase URL or key is missing")
          if (!silent) setError("Database configuration is incomplete. Please check your environment variables.")
          return
        }

        // Add a timeout to the fetch operation
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 10000))

        const fetchPromise = supabase.from("bookings").select("*").order("created_at", { ascending: false })

        // Race between fetch and timeout
        const { data, error: supabaseError } = (await Promise.race([fetchPromise, timeoutPromise])) as any

        if (supabaseError) {
          console.error("Error fetching bookings:", supabaseError)
          if (!silent) setError(`Failed to load bookings: ${supabaseError.message || "Unknown error"}`)
          return
        }

        // Check if we have new bookings
        if (previousBookingCount.current > 0 && data && data.length > previousBookingCount.current) {
          const newCount = data.length - previousBookingCount.current
          setNewBookingsCount(newCount)

          // Show notification
          toast({
            title: `${newCount} New Booking${newCount > 1 ? "s" : ""}`,
            description: "New bookings have been received",
            variant: "default",
          })

          console.log(`${newCount} new bookings detected!`)
        }

        // Update the previous count
        previousBookingCount.current = data ? data.length : 0

        if (!silent) {
          setBookings(data || [])
          setLastUpdated(new Date())
        }

        return data
      } catch (err: any) {
        console.error("Error fetching bookings:", err)

        // Implement retry logic (up to 3 retries)
        if (retryCount < 3 && !silent) {
          console.log(`Retrying fetch (attempt ${retryCount + 1})...`)
          // Wait for a short delay before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)))
          return fetchBookings(isManualRefresh, silent, retryCount + 1)
        }

        // If we've exhausted retries or it's a silent fetch, show error
        if (!silent) {
          setError(
            `Connection error: ${err.message || "Failed to connect to the database"}. Please check your network connection and try again.`,
          )
        }
      } finally {
        if (!silent) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [lastUpdated, toast],
  )

  // Define schedulePoll within the component scope
  const schedulePoll = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
    }
    pollTimeoutRef.current = setTimeout(() => {
      fetchBookings(false, true) // Silent refresh
      schedulePoll()
    }, POLLING_INTERVAL)
  }, [fetchBookings])

  // Replace the initial useEffect with this improved version:

  useEffect(() => {
    // Check if Supabase is properly configured
    if (!supabaseUrl || !supabaseAnonKey) {
      setError("Database configuration is incomplete. Please check your environment variables.")
      setLoading(false)
      return
    }

    // Fetch data immediately on page load
    fetchBookings()

    // Set up visibility change detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Tab is now visible, fetching fresh data")
        fetchBookings()
      }
    }

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Start polling
    schedulePoll()

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }
    }
  }, [fetchBookings, schedulePoll])

  // Handle manual refresh
  const handleManualRefresh = () => {
    fetchBookings(true)
    setNewBookingsCount(0)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNavigation />
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold">Bookings Overview</h1>
          <div className="flex items-center space-x-3 mt-2 md:mt-0">
            <div className="flex items-center text-sm text-gray-500">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <span>{bookings.length} bookings</span>
              {lastUpdated && (
                <span className="ml-2 text-gray-400">· Updated {formatRelativeTime(lastUpdated.toISOString())}</span>
              )}
            </div>

            {newBookingsCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                className="text-xs h-8 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
              >
                <Bell className="h-3 w-3 mr-1" />
                {newBookingsCount} new booking{newBookingsCount > 1 ? "s" : ""}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="text-xs h-8"
            >
              {refreshing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Replace the error section in the return statement with this improved version: */}

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex flex-col space-y-2">
              <div className="font-medium">Error loading bookings</div>
              <p>{error}</p>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  className="text-red-700 border-red-300 hover:bg-red-50"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        ) : loading && !lastUpdated ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading bookings...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-500 mb-4">No bookings found</div>
            <p className="text-sm text-gray-400 mb-4">
              This could be because the bookings table is empty or hasn't been created yet.
            </p>
            <Button variant="outline" size="sm" onClick={handleManualRefresh}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        ) : (
          <BookingsTable bookings={bookings} />
        )}

        {/* Add this debug section at the bottom of the component to help with troubleshooting: */}

        {/* Debug info - remove in production */}
        <div className="mt-8 text-xs text-gray-400 border-t pt-4">
          <p>Debug: Last poll attempt: {new Date().toLocaleTimeString()}</p>
          <p>Polling interval: {POLLING_INTERVAL / 1000} seconds</p>
          <p>Supabase URL configured: {supabaseUrl ? "Yes" : "No"}</p>
          <p>Supabase Key configured: {supabaseAnonKey ? "Yes (length: " + supabaseAnonKey.length + ")" : "No"}</p>
          <p>Browser: {navigator.userAgent}</p>
        </div>
      </main>
    </div>
  )
}
