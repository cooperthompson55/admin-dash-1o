"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function updateBookingStatus(bookingId: string, field: "status" | "payment_status", value: string) {
  console.log(`Updating booking ${bookingId}: Setting ${field} to "${value}"`)

  try {
    // Validate inputs
    if (!bookingId) {
      console.error("Missing bookingId in updateBookingStatus")
      return { success: false, error: "Missing booking ID" }
    }

    if (!field || !["status", "payment_status"].includes(field)) {
      console.error(`Invalid field "${field}" in updateBookingStatus`)
      return { success: false, error: "Invalid field name" }
    }

    if (!value) {
      console.error("Missing value in updateBookingStatus")
      return { success: false, error: "Missing status value" }
    }

    // Create the update object - only update the specific field
    const updateData = { [field]: value }
    console.log("Update data:", updateData)

    // Perform the update
    const { data, error } = await supabase.from("bookings").update(updateData).eq("id", bookingId).select()

    if (error) {
      console.error(`Error updating ${field}:`, error)
      return {
        success: false,
        error: error.message,
        details: {
          code: error.code,
          hint: error.hint,
          details: error.details,
        },
      }
    }

    console.log(`Successfully updated ${field} for booking ${bookingId}:`, data)

    // Revalidate the page to show updated data
    revalidatePath("/")
    return { success: true, data }
  } catch (err: any) {
    console.error(`Unexpected error in updateBookingStatus:`, err)
    return {
      success: false,
      error: err.message || "An unknown error occurred",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    }
  }
}
