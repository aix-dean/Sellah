"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

// Box component (replaces Chakra Box)
interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("", className)} {...props}>
      {children}
    </div>
  )
})
Box.displayName = "Box"

// Heading component (replaces Chakra Heading)
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  children: React.ReactNode
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size = "md", as = "h2", children, ...props }, ref) => {
    const Component = as

    const sizeClasses = {
      xs: "text-sm font-semibold",
      sm: "text-base font-semibold",
      md: "text-lg font-semibold",
      lg: "text-xl font-bold",
      xl: "text-2xl font-bold",
      "2xl": "text-3xl font-bold",
    }

    return (
      <Component ref={ref} className={cn(sizeClasses[size], className)} {...props}>
        {children}
      </Component>
    )
  },
)
Heading.displayName = "Heading"

// Text component (replaces Chakra Text)
interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: "xs" | "sm" | "md" | "lg"
  color?: "gray" | "red" | "blue" | "green" | "yellow"
  children: React.ReactNode
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size = "md", color, children, ...props }, ref) => {
    const sizeClasses = {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    }

    const colorClasses = {
      gray: "text-gray-600",
      red: "text-red-600",
      blue: "text-blue-600",
      green: "text-green-600",
      yellow: "text-yellow-600",
    }

    return (
      <p ref={ref} className={cn(sizeClasses[size], color && colorClasses[color], className)} {...props}>
        {children}
      </p>
    )
  },
)
Text.displayName = "Text"

// List component (replaces Chakra List)
interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  spacing?: number
  children: React.ReactNode
}

export const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, spacing = 2, children, ...props }, ref) => {
    const spacingClass = `space-y-${spacing}`

    return (
      <ul ref={ref} className={cn(spacingClass, className)} {...props}>
        {children}
      </ul>
    )
  },
)
List.displayName = "List"

// ListItem component (replaces Chakra ListItem)
interface ListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode
}

export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(({ className, children, ...props }, ref) => {
  return (
    <li ref={ref} className={cn("", className)} {...props}>
      {children}
    </li>
  )
})
ListItem.displayName = "ListItem"

// Divider component (replaces Chakra Divider)
interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical"
}

export const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => {
    return (
      <hr
        ref={ref}
        className={cn(
          orientation === "horizontal"
            ? "w-full border-t border-gray-200 my-4"
            : "h-full border-l border-gray-200 mx-4",
          className,
        )}
        {...props}
      />
    )
  },
)
Divider.displayName = "Divider"

// Spinner component (replaces Chakra Spinner)
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  color?: "blue" | "red" | "green" | "gray"
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", color = "blue", ...props }, ref) => {
    const sizeClasses = {
      xs: "w-3 h-3",
      sm: "w-4 h-4",
      md: "w-6 h-6",
      lg: "w-8 h-8",
      xl: "w-12 h-12",
    }

    const colorClasses = {
      blue: "text-blue-600",
      red: "text-red-600",
      green: "text-green-600",
      gray: "text-gray-600",
    }

    return (
      <div ref={ref} className={cn("flex items-center justify-center", className)} {...props}>
        <Loader2 className={cn("animate-spin", sizeClasses[size], colorClasses[color])} />
      </div>
    )
  },
)
Spinner.displayName = "Spinner"

// Custom Toast Hook (replaces Chakra useToast)
export const useCustomToast = () => {
  const showToast = (options: {
    title?: string
    description?: string
    status?: "success" | "error" | "warning" | "info"
    duration?: number
  }) => {
    // This would integrate with your existing toast system
    // For now, using console.log as placeholder
    console.log("Toast:", options)

    // You can integrate this with react-hot-toast, sonner, or your existing toast system
    // Example with react-hot-toast:
    // import toast from 'react-hot-toast'
    //
    // switch(options.status) {
    //   case 'success':
    //     toast.success(options.description || options.title || 'Success')
    //     break
    //   case 'error':
    //     toast.error(options.description || options.title || 'Error')
    //     break
    //   default:
    //     toast(options.description || options.title || 'Notification')
    // }
  }

  return showToast
}
