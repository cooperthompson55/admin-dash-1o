"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export type BookingUpdate = {
  id: string
  status?: string
  payment_status?: string
}

export async function updateBookings(updates: BookingUpdate[]) {
  try {
    // Process each update as a separate operation
    const updatePromises = updates.map(async (update) => {
      const { id, ...updateData } = update

      const { error } = await supabase.from("bookings").update(updateData).eq("id", id)

      if (error) {
        console.error(`Error updating booking ${id}:`, error)
        throw error
      }

      return id
    })

    // Wait for all updates to complete
    await Promise.all(updatePromises)

    // Revalidate the page to show updated data
    revalidatePath("/")

    return { success: true, message: `Successfully updated ${updates.length} booking(s)` }
  } catch (error) {
    console.error("Error updating bookings:", error)
    return { success: false, message: "Failed to update bookings. Please try again." }
  }
}
