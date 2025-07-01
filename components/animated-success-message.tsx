import { CheckCircle } from "lucide-react"

interface AnimatedSuccessMessageProps {
  show: boolean
  message: string
  isVisible: boolean
}

export function AnimatedSuccessMessage({ show, message, isVisible }: AnimatedSuccessMessageProps) {
  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 transition-all duration-300 transform ${
          isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"
        }`}
      >
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium">{message}</span>
      </div>
    </div>
  )
}
