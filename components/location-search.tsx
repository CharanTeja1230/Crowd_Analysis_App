"use client"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

import { hyderabadLocations } from "@/lib/locations"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

type LocationSearchProps = {
  currentLocation: string
  onLocationChange: (location: string) => void
  className?: string
}

export function LocationSearch({ currentLocation, onLocationChange, className }: LocationSearchProps) {
  const [open, setOpen] = useState(false)
  const [recentLocations, setRecentLocations] = useState<string[]>([])
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load recent locations from localStorage
    const storedLocations = localStorage.getItem("recentLocations")
    if (storedLocations) {
      setRecentLocations(JSON.parse(storedLocations))
    }

    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const selectLocation = (location: string) => {
    onLocationChange(location)

    // Update recent locations
    const newRecent = [location, ...recentLocations.filter((loc) => loc !== location)].slice(0, 5)

    setRecentLocations(newRecent)
    localStorage.setItem("recentLocations", JSON.stringify(newRecent))
    setOpen(false)

    // Update URL
    router.push(`/?location=${encodeURIComponent(location.toLowerCase())}`)
  }

  return (
    <>
      <div className={cn("relative flex items-center", className)}>
        <Button
          variant="outline"
          size="sm"
          className="relative h-10 w-full justify-start text-muted-foreground rounded-md border shadow-sm px-4 py-2"
          onClick={() => setOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>{currentLocation || "Search locations..."}</span>
          <kbd className="pointer-events-none absolute right-2 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search Hyderabad locations..." ref={searchInputRef} />
        <CommandList>
          <CommandEmpty>No locations found.</CommandEmpty>
          {recentLocations.length > 0 && (
            <CommandGroup heading="Recent">
              {recentLocations.map((location) => (
                <CommandItem key={`recent-${location}`} onSelect={() => selectLocation(location)}>
                  {location}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandGroup heading="All Locations">
            {hyderabadLocations.map((location) => (
              <CommandItem key={location} onSelect={() => selectLocation(location)}>
                {location}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
