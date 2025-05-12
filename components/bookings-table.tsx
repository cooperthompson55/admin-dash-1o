"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import { ChevronUp, ChevronDown, Phone, Mail, MapPin, Clock } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { RelativeTime } from "@/components/relative-time"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BookingUpdate } from "@/app/actions"

// Define types based on the provided schema
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

type Booking = {
  id: string
  created_at: string
  property_size: string
  services: string | Service[] // Can be JSON string or array
  total_amount: number
  address: string | Address // Can be JSON string or object
  notes: string
  preferred_date: string
  property_status: string
  status: string
  payment_status?: string
  user_id: string | null
  agent_name: string
  agent_email: string
  agent_phone: number
  agent_company: string
}

type SortField = "preferred_date" | "created_at"
type SortDirection = "asc" | "desc"

interface BookingsTableProps {
  bookings: Booking[]
  onStatusChange: (bookingId: string, field: "status" | "payment_status", value: string) => void
  pendingChanges: BookingUpdate[]
}

export function BookingsTable({ bookings, onStatusChange, pendingChanges }: BookingsTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at") // Default sort by created_at
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc") // Default sort direction is descending (newest first)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      // If switching to created_at, default to desc (newest first)
      // If switching to preferred_date, default to asc (soonest first)
      setSortDirection(field === "created_at" ? "desc" : "asc")
    }
  }

  const toggleRowExpand = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id)
  }

  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = new Date(a[sortField]).getTime()
    const dateB = new Date(b[sortField]).getTime()

    return sortDirection === "asc" ? dateA - dateB : dateB - dateA
  })

  // Parse address - handles both string and object
  const parseAddress = (addressData: string | Address | null | undefined): Address => {
    if (!addressData) {
      return { city: "", street: "", zipCode: "", province: "" }
    }

    if (typeof addressData === "object") {
      return addressData as Address
    }

    try {
      return JSON.parse(addressData as string)
    } catch (e) {
      return { city: "", street: "", zipCode: "", province: "" }
    }
  }

  // Parse services - handles both string and array
  const parseServices = (servicesData: string | Service[] | null | undefined): Service[] => {
    if (!servicesData) {
      return []
    }

    if (Array.isArray(servicesData)) {
      return servicesData
    }

    try {
      return JSON.parse(servicesData as string)
    } catch (e) {
      return []
    }
  }

  // Format address for display
  const formatAddress = (addressData: string | Address | null | undefined): string => {
    const address = parseAddress(addressData)
    return `${address.street || ""}${address.street2 ? `, ${address.street2}` : ""}${
      address.street ? ", " : ""
    }${address.city || ""}${address.city ? ", " : ""}${address.province || ""} ${address.zipCode || ""}`
  }

  // Mobile card view for bookings
  if (isMobile) {
    return (
      <div className="space-y-4">
        {sortedBookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
            No bookings found
          </div>
        ) : (
          sortedBookings.map((booking) => (
            <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{booking.agent_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{booking.agent_company}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              </div>

              <div className="p-4 space-y-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{formatAddress(booking.address)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Date: </span>
                    <span className="text-gray-700 dark:text-gray-300">{formatDate(booking.preferred_date)}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(booking.total_amount)}
                  </div>
                </div>
              </div>

              <div className="p-4 flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <RelativeTime date={booking.created_at} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => toggleRowExpand(booking.id)}
                >
                  {expandedRowId === booking.id ? "Hide Details" : "View Details"}
                  <span className="ml-1">
                    {expandedRowId === booking.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                </Button>
              </div>

              {expandedRowId === booking.id && (
                <div className="border-t border-gray-100 dark:border-gray-700">
                  <ExpandedBookingDetails
                    booking={booking}
                    onStatusChange={onStatusChange}
                    pendingChanges={pendingChanges}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    )
  }

  // Desktop table view
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableHead className="text-gray-700 dark:text-gray-300">Agent Name</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Property Address</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                <div className="flex items-center space-x-1">
                  <span>Preferred Date</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleSort("preferred_date")}
                  >
                    {sortField === "preferred_date" && sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Total Amount</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleSort("created_at")}>
                    {sortField === "created_at" && sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              sortedBookings.map((booking, index) => (
                <>
                  <TableRow
                    key={booking.id}
                    className={index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800/50" : "bg-white dark:bg-gray-800"}
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      <div>{booking.agent_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{booking.agent_company}</div>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      <div>{formatAddress(booking.address)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Size: {booking.property_size} | Status: {booking.property_status}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      {formatDate(booking.preferred_date)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-white">
                      {formatCurrency(booking.total_amount)}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      <RelativeTime date={booking.created_at} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleRowExpand(booking.id)}
                      >
                        {expandedRowId === booking.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRowId === booking.id && (
                    <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                      <TableCell colSpan={7} className="p-0">
                        <ExpandedBookingDetails
                          booking={booking}
                          onStatusChange={onStatusChange}
                          pendingChanges={pendingChanges}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Update the StatusBadge function to handle payment status
function StatusBadge({ status, type = "status" }: { status: string; type?: "status" | "payment" }) {
  const getStatusColor = (status: string, type: "status" | "payment") => {
    if (type === "payment") {
      switch (status.toLowerCase()) {
        case "paid":
          return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        case "not paid":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        case "refunded":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        case "partial":
          return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
      }
    } else {
      switch (status.toLowerCase()) {
        case "confirmed":
          return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        case "pending":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        case "cancelled":
          return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        case "completed":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
      }
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status, type)}`}
    >
      {status}
    </span>
  )
}

function ExpandedBookingDetails({
  booking,
  onStatusChange,
  pendingChanges,
}: {
  booking: Booking
  onStatusChange: (bookingId: string, field: "status" | "payment_status", value: string) => void
  pendingChanges: BookingUpdate[]
}) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Parse address - handles both string and object
  const parseAddress = (addressData: string | Address | null | undefined): Address => {
    if (!addressData) {
      return { city: "", street: "", zipCode: "", province: "" }
    }

    if (typeof addressData === "object") {
      return addressData as Address
    }

    try {
      return JSON.parse(addressData as string)
    } catch (e) {
      return { city: "", street: "", zipCode: "", province: "" }
    }
  }

  // Parse services - handles both string and array
  const parseServices = (servicesData: string | Service[] | null | undefined): Service[] => {
    if (!servicesData) {
      return []
    }

    if (Array.isArray(servicesData)) {
      return servicesData
    }

    try {
      return JSON.parse(servicesData as string)
    } catch (e) {
      return []
    }
  }

  const address = parseAddress(booking.address)
  const services = parseServices(booking.services)

  // Find if this booking has pending changes
  const pendingChange = pendingChanges.find((change) => change.id === booking.id)

  // Get the current status values (from pending changes if they exist, otherwise from the booking)
  const currentStatus = pendingChange?.status || booking.status
  const currentPaymentStatus = pendingChange?.payment_status || "Not Paid" // Default value if not set

  return (
    <div
      className={`p-4 ${isMobile ? "p-3" : "p-6"} bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700`}
    >
      <div className={`grid grid-cols-1 ${isMobile ? "gap-4" : "md:grid-cols-2 gap-8"}`}>
        {/* Left Column: Client & Services Info */}
        <div className="space-y-4">
          {/* Client Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-3">Client Info</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Full Name</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.agent_name || "N/A"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Email</span>
                <a
                  href={`mailto:${booking.agent_email}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  {booking.agent_email || "N/A"}
                </a>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Phone</span>
                <a
                  href={`tel:${booking.agent_phone}`}
                  className="text-sm flex items-center text-gray-700 dark:text-gray-300"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  {booking.agent_phone || "N/A"}
                </a>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Company</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{booking.agent_company || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Services Booked */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-3">Services Booked</h3>
            {services && services.length > 0 ? (
              <ul className="space-y-2">
                {services.map((service, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {service.name} {service.count > 1 ? `(x${service.count})` : ""}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(service.price)}
                    </span>
                  </li>
                ))}
                <li className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(booking.total_amount)}
                  </span>
                </li>
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No services listed</p>
            )}
          </div>
        </div>

        {/* Right Column: Property & Booking Info */}
        <div className="space-y-4">
          {/* Property Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-3">Property Info</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Full Address</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {address.street ? (
                    <>
                      {address.street}
                      {address.street2 ? `, ${address.street2}` : ""}
                      <br />
                      {address.city}, {address.province} {address.zipCode}
                    </>
                  ) : (
                    "Address not available"
                  )}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Property Size</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{booking.property_size || "Not specified"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Occupancy Status</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{booking.property_status || "Not specified"}</p>
              </div>
              {booking.notes && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Notes</span>
                  <p className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-700 dark:text-gray-300">
                    {booking.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Metadata */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-3">Booking Metadata</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Preferred Date</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {formatDate(booking.preferred_date) || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Created</span>
                <p className="text-sm flex items-center text-gray-700 dark:text-gray-300">
                  <Clock className="h-3 w-3 mr-1" />
                  <RelativeTime date={booking.created_at} />
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Payment Status</span>
                <div className="mt-1">
                  <Select
                    value={currentPaymentStatus}
                    onValueChange={(value) => onStatusChange(booking.id, "payment_status", value)}
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Paid">Not Paid</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Refunded">Refunded</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Job Status</span>
                <div className="mt-1">
                  <Select value={currentStatus} onValueChange={(value) => onStatusChange(booking.id, "status", value)}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
