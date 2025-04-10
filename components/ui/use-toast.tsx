type ToastVariant = "default" | "destructive" | "success"

interface ToastProps {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastState extends ToastProps {
  id: string
  visible: boolean
}

// Create a simple toast system
export function toast({ title, description, variant = "default", duration = 3000 }: ToastProps) {
  // Create a unique ID for this toast
  const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  // Create a new toast element
  const toastContainer = document.getElementById("toast-container")

  if (!toastContainer) {
    // Create toast container if it doesn't exist
    const container = document.createElement("div")
    container.id = "toast-container"
    container.className = "fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md"
    document.body.appendChild(container)
  }

  // Create toast element
  const toastElement = document.createElement("div")
  toastElement.id = id
  toastElement.className = `
    animate-in slide-in-from-right-full 
    rounded-md p-4 shadow-md 
    ${
      variant === "destructive"
        ? "bg-destructive text-destructive-foreground"
        : variant === "success"
          ? "bg-green-600 text-white"
          : "bg-background border"
    }
  `

  // Create title
  const titleElement = document.createElement("div")
  titleElement.className = "font-medium"
  titleElement.textContent = title
  toastElement.appendChild(titleElement)

  // Create description if provided
  if (description) {
    const descElement = document.createElement("div")
    descElement.className = "text-sm mt-1"
    descElement.textContent = description
    toastElement.appendChild(descElement)
  }

  // Add to container
  document.getElementById("toast-container")?.appendChild(toastElement)

  // Remove after duration
  setTimeout(() => {
    toastElement.classList.add("animate-out", "slide-out-to-right-full")
    setTimeout(() => {
      toastElement.remove()
    }, 300)
  }, duration)

  return {
    id,
    dismiss: () => {
      toastElement.classList.add("animate-out", "slide-out-to-right-full")
      setTimeout(() => {
        toastElement.remove()
      }, 300)
    },
  }
}
