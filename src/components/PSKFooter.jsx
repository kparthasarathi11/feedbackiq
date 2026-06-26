export default function PSKFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
          <span className="text-white text-[8px] font-semibold tracking-tight">PSK</span>
        </div>
        <span className="text-xs text-gray-400">
          Built by <span className="text-gray-600 font-medium">Partha Sarathi Komati</span>
        </span>
      </div>
      <a
        href="https://linkedin.com/in/partha-sarathi-komati"
        target="_blank"
        rel="noreferrer"
        className="text-xs text-gray-400 hover:text-brand transition-colors"
      >
        linkedin.com/in/partha-sarathi-komati
      </a>
    </footer>
  )
}
