"use client"

import { useState } from "react"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateBookingStatus } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"

interface StatusOption {
  value: string
  label: string
  color: string
}

interface StatusDropdownProps {
  bookingId: string
  currentStatus: string
  statusType: "status" | "payment_status"
  options: StatusOption[]
}

export function StatusDropdown({ bookingId, currentStatus, statusType, options }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const { toast } = useToast()

  // Find the current option based on status
  const currentOption = options.find((option) => option.value.toLowerCase() === status.toLowerCase()) || options[0]

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) {
      setIsOpen(false)
      return
    }

    setIsUpdating(true)

    try {
      const result = await updateBookingStatus(bookingId, statusType, newStatus)

      if (result.success) {
        setStatus(newStatus)
        toast({
          title: "Status updated",
          description: `${statusType === "payment_status" ? "Payment status" : "Job status"} has been updated.`,
        })
      } else {
        toast({
          title: "Update failed",
          description: result.error || "Failed to update status. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "An error occurred while updating the status.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      {/* Current status display */}
      <Button
        variant="outline"
        size="sm"
        className={`w-full justify-between ${currentOption.color} text-xs h-7 px-2`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
      >
        {isUpdating ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Updating...
          </>
        ) : (
          <>
            {currentOption.label}
            <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
          </>
        )}
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1 max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                className={`
                  ${option.value.toLowerCase() === status.toLowerCase() ? "bg-gray-100" : ""}
                  text-left w-full px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between
                `}
                onClick={() => handleStatusChange(option.value)}
              >
                <span>{option.label}</span>
                {option.value.toLowerCase() === status.toLowerCase() && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
