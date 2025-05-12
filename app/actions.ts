"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function updateBookingStatus(bookingId: string, field: "status" | "payment_status", value: string) {
  try {
    const { error } = await supabase
      .from("bookings")
      .update({ [field]: value })
      .eq("id", bookingId)

    if (error) {
      console.error(`Error updating ${field}:`, error)
      return { success: false, error: error.message }
    }

    // Revalidate the page to show updated data
    revalidatePath("/")
    return { success: true }
  } catch (err: any) {
    console.error(`Error in updateBookingStatus:`, err)
    return { success: false, error: err.message || "An unknown error occurred" }
  }
}
