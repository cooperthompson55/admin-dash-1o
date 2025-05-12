"use client"

import { useEffect, useState } from "react"
import { formatRelativeTime } from "@/lib/utils"

interface RelativeTimeProps {
  date: string
  className?: string
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [relativeTime, setRelativeTime] = useState(formatRelativeTime(date))

  useEffect(() => {
    // Update immediately
    setRelativeTime(formatRelativeTime(date))

    // Set up interval to update the relative time
    const intervalId = setInterval(() => {
      setRelativeTime(formatRelativeTime(date))
    }, 10000) // Update every 10 seconds

    return () => clearInterval(intervalId)
  }, [date])

  return <span className={className}>{relativeTime}</span>
}
