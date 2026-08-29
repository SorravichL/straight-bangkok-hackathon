type BoxProps = {
  children: React.ReactNode
  className?: string
}

export default function Box({ children, className = "" }: BoxProps) {
  return (
    <div
      className={`bg-white border border-black rounded-sm px-2 text-black font-display shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}
