"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import { ChevronUp, ChevronDown, Phone, Mail, MapPin, Clock } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { RelativeTime } from "@/components/relative-time"

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
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  const [sortField, setSortField] = useState<SortField>("preferred_date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
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
          <div className="bg-white rounded-lg p-6 text-center text-gray-500">No bookings found</div>
        ) : (
          sortedBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{booking.agent_name}</h3>
                    <p className="text-sm text-gray-500">{booking.agent_company}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              </div>

              <div className="p-4 space-y-3 border-b border-gray-100">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{formatAddress(booking.address)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-500">Date: </span>
                    {formatDate(booking.preferred_date)}
                  </div>
                  <div className="text-sm font-medium">{formatCurrency(booking.total_amount)}</div>
                </div>
              </div>

              <div className="p-4 flex justify-between items-center">
                <div className="text-xs text-gray-500 flex items-center">
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
                <div className="border-t border-gray-100">
                  <ExpandedBookingDetails booking={booking} />
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent Name</TableHead>
              <TableHead>Property Address</TableHead>
              <TableHead>
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
              <TableHead>Status</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>
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
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              sortedBookings.map((booking, index) => (
                <>
                  <TableRow key={booking.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <TableCell className="font-medium">
                      <div>{booking.agent_name}</div>
                      <div className="text-xs text-gray-500">{booking.agent_company}</div>
                    </TableCell>
                    <TableCell>
                      <div>{formatAddress(booking.address)}</div>
                      <div className="text-xs text-gray-500">
                        Size: {booking.property_size} | Status: {booking.property_status}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(booking.preferred_date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell>{formatCurrency(booking.total_amount)}</TableCell>
                    <TableCell>
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
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={7} className="p-0">
                        <ExpandedBookingDetails booking={booking} />
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

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}
    >
      {status}
    </span>
  )
}

function ExpandedBookingDetails({ booking }: { booking: Booking }) {
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

  return (
    <div className={`p-4 ${isMobile ? "p-3" : "p-6"} bg-gray-50 border-t border-gray-200`}>
      <div className={`grid grid-cols-1 ${isMobile ? "gap-4" : "md:grid-cols-2 gap-8"}`}>
        {/* Left Column: Client & Services Info */}
        <div className="space-y-4">
          {/* Client Info */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Client Info</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 block">Full Name</span>
                <p className="text-sm font-medium">{booking.agent_name || "N/A"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Email</span>
                <a
                  href={`mailto:${booking.agent_email}`}
                  className="text-sm text-blue-600 hover:underline flex items-center"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  {booking.agent_email || "N/A"}
                </a>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Phone</span>
                <a href={`tel:${booking.agent_phone}`} className="text-sm flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {booking.agent_phone || "N/A"}
                </a>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Company</span>
                <p className="text-sm">{booking.agent_company || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Services Booked */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Services Booked</h3>
            {services && services.length > 0 ? (
              <ul className="space-y-2">
                {services.map((service, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm">
                      {service.name} {service.count > 1 ? `(x${service.count})` : ""}
                    </span>
                    <span className="text-sm font-medium">{formatCurrency(service.price)}</span>
                  </li>
                ))}
                <li className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-sm font-bold">{formatCurrency(booking.total_amount)}</span>
                </li>
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No services listed</p>
            )}
          </div>
        </div>

        {/* Right Column: Property & Booking Info */}
        <div className="space-y-4">
          {/* Property Info */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Property Info</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 block">Full Address</span>
                <p className="text-sm">
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
                <span className="text-xs text-gray-500 block">Property Size</span>
                <p className="text-sm">{booking.property_size || "Not specified"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Occupancy Status</span>
                <p className="text-sm">{booking.property_status || "Not specified"}</p>
              </div>
              {booking.notes && (
                <div>
                  <span className="text-xs text-gray-500 block">Notes</span>
                  <p className="text-sm bg-gray-50 p-2 rounded">{booking.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Metadata */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Booking Metadata</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 block">Preferred Date</span>
                <p className="text-sm">{formatDate(booking.preferred_date) || "Not specified"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Created</span>
                <p className="text-sm flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <RelativeTime date={booking.created_at} />
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Payment Status</span>
                <p className="text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Not Paid
                  </span>
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Job Status</span>
                <StatusBadge status={booking.status} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
