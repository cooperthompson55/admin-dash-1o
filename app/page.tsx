"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { BookingsTable } from "@/components/bookings-table"
import { TopNavigation } from "@/components/top-navigation"
import { Loader2, RefreshCw, Bell, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRelativeTime } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { updateBookings, type BookingUpdate } from "./actions"

// Define types
type Booking = {
  id: string
  status: string
  payment_status?: string
  agent_name: string
  agent_company: string
  agent_email: string
  agent_phone: number
  address: string | Address
  property_size: string
  property_status: string
  preferred_date: string
  created_at: string
  total_amount: number
  services: string | Service[]
  notes: string
  user_id: string | null
}

type Address = {
  city: string
  street: string
  street2?: string
  zipCode: string
  province: string
}

type Service = {
  name: string
  count: number
  price: number
  total: number
}

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Polling interval in milliseconds (30 seconds for more frequent checks)
const POLLING_INTERVAL = 30 * 1000

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newBookingsCount, setNewBookingsCount] = useState(0)
  const previousBookingCount = useRef(0)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const [pendingChanges, setPendingChanges] = useState<BookingUpdate[]>([])
  const [saving, setSaving] = useState(false)

  // Function to fetch all bookings
  const fetchBookings = useCallback(
    async (isManualRefresh = false, silent = false) => {
      try {
        if (isManualRefresh) {
          setRefreshing(true)
        } else if (!lastUpdated && !silent) {
          setLoading(true)
        }

        if (!silent) setError(null)

        console.log("Fetching bookings...", new Date().toISOString())

        const { data, error: supabaseError } = await supabase
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false }) // Order by newest first

        if (supabaseError) {
          console.error("Error fetching bookings:", supabaseError)
          if (!silent) setError("Failed to load bookings. Please try again.")
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
      } catch (err) {
        console.error("Error fetching bookings:", err)
        if (!silent) setError("An unexpected error occurred. Please try again.")
      } finally {
        if (!silent) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [lastUpdated, toast],
  )

  // Function to schedule the next poll
  const schedulePoll = useCallback(() => {
    // Clear any existing timeout
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
    }

    // Schedule the next poll
    pollTimeoutRef.current = setTimeout(async () => {
      console.log("Polling for new bookings...", new Date().toISOString())
      const newData = await fetchBookings(false, true)

      if (newData && (!bookings.length || JSON.stringify(newData) !== JSON.stringify(bookings))) {
        console.log("New data detected, updating UI")
        setBookings(newData)
        setLastUpdated(new Date())
      } else {
        console.log("No changes detected")
      }

      // Schedule the next poll
      schedulePoll()
    }, POLLING_INTERVAL)
  }, [bookings, fetchBookings])

  // Initial data fetch and set up polling
  useEffect(() => {
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

  // Handle status changes
  const handleStatusChange = (bookingId: string, field: "status" | "payment_status", value: string) => {
    // Check if we already have a pending change for this booking
    const existingChangeIndex = pendingChanges.findIndex((change: BookingUpdate) => change.id === bookingId)

    if (existingChangeIndex >= 0) {
      // Update the existing change
      const updatedChanges = [...pendingChanges]
      updatedChanges[existingChangeIndex] = {
        ...updatedChanges[existingChangeIndex],
        [field]: value,
      }
      setPendingChanges(updatedChanges)
    } else {
      // Add a new change
      setPendingChanges([
        ...pendingChanges,
        {
          id: bookingId,
          [field]: value,
        },
      ])
    }
  }

  // Handle save changes
  const handleSaveChanges = async () => {
    if (pendingChanges.length === 0) return

    setSaving(true)
    try {
      const result = await updateBookings(pendingChanges)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        })
        setPendingChanges([]) // Clear pending changes after successful save
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <TopNavigation />
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Bookings Overview</h1>
          <div className="flex items-center space-x-3 mt-2 md:mt-0">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <span>{bookings.length} bookings</span>
              {lastUpdated && (
                <span className="ml-2 text-gray-400 dark:text-gray-500">
                  · Updated {formatRelativeTime(lastUpdated.toISOString())}
                </span>
              )}
            </div>

            {newBookingsCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                className="text-xs h-8 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-900/30 dark:hover:text-green-300"
              >
                <Bell className="h-3 w-3 mr-1" />
                {newBookingsCount} new booking{newBookingsCount > 1 ? "s" : ""}
              </Button>
            )}

            {/* Save button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveChanges}
              disabled={pendingChanges.length === 0 || saving}
              className={`text-xs h-8 ${
                pendingChanges.length > 0
                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-900/30 dark:hover:text-green-300"
                  : ""
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Save {pendingChanges.length > 0 ? `(${pendingChanges.length})` : ""}
                </>
              )}
            </Button>

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

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
            {error}
            <Button
              variant="link"
              size="sm"
              onClick={handleManualRefresh}
              className="text-red-700 dark:text-red-400 underline ml-2"
            >
              Try again
            </Button>
          </div>
        ) : loading && !lastUpdated ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-600" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading bookings...</span>
          </div>
        ) : (
          <BookingsTable bookings={bookings} onStatusChange={handleStatusChange} pendingChanges={pendingChanges} />
        )}
      </main>
    </div>
  )
}
