"use client"

import { useState } from "react"
import { supabase, supabaseUrl, supabaseAnonKey } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [schemaInfo, setSchemaInfo] = useState<any>(null)

  const testConnection = async () => {
    setIsLoading(true)
    setError(null)
    setTestResult(null)
    setSchemaInfo(null)

    try {
      const { count, error } = await supabase.from("bookings").select("count", { count: "exact", head: true })

      if (error) {
        console.error("Test connection error:", error)
        setError(error.message)
      } else {
        setTestResult({ count })

        // Get schema information
        try {
          // Get a sample booking to see available columns
          const { data: sampleBooking, error: sampleError } = await supabase
            .from("bookings")
            .select("*")
            .limit(1)
            .single()

          if (sampleError) {
            console.error("Error fetching sample booking:", sampleError)
          } else if (sampleBooking) {
            setSchemaInfo({
              columns: Object.keys(sampleBooking),
              sample: sampleBooking,
            })
          }
        } catch (schemaErr) {
          console.error("Error fetching schema info:", schemaErr)
        }
      }
    } catch (err: any) {
      console.error("Test connection exception:", err)
      setError(err.message || "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isVisible) {
    return (
      <div className="mt-8 text-center">
        <Button variant="outline" size="sm" onClick={() => setIsVisible(true)} className="text-xs text-gray-500">
          Show Debug Panel
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-8 p-4 border rounded-lg bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">Debug Panel</h3>
        <Button variant="outline" size="sm" onClick={() => setIsVisible(false)} className="text-xs">
          Hide
        </Button>
      </div>

      <div className="space-y-2 text-xs text-gray-600">
        <p>Supabase URL configured: {supabaseUrl ? "Yes" : "No"}</p>
        <p>Supabase Key configured: {supabaseAnonKey ? "Yes (length: " + supabaseAnonKey.length + ")" : "No"}</p>
        <p>Browser: {navigator.userAgent}</p>

        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={testConnection} disabled={isLoading} className="text-xs h-7">
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Database Connection"
            )}
          </Button>
        </div>

        {error && <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}

        {testResult && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-700">
            Connection successful! Found {testResult.count} bookings.
          </div>
        )}

        {schemaInfo && (
          <div className="mt-4">
            <h4 className="font-medium mb-1">Database Schema Information:</h4>
            <div className="p-2 bg-white border rounded overflow-auto max-h-40">
              <p className="mb-1">Available columns:</p>
              <ul className="list-disc pl-4 mb-2">
                {schemaInfo.columns.map((column: string) => (
                  <li key={column}>{column}</li>
                ))}
              </ul>
              <details>
                <summary className="cursor-pointer text-blue-600">View sample booking data</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-gray-50">
                  {JSON.stringify(schemaInfo.sample, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
