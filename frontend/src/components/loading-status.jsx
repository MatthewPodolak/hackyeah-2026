export default function LoadingStatus({ label = "Wczytywanie…", className, children }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
