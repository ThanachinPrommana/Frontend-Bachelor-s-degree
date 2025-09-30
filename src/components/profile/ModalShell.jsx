export default function ModalShell({
  title,
  description,
  icon,
  onClose,
  children,
  stepper,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-[95vw] sm:w-[90vw] max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#2c3e50] via-[#3b4b63] to-[#2c3e50] text-white shrink-0">
          {icon}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{title}</h3>
            {description ? (
              <p className="text-xs text-white/80">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-1 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            ✕
          </button>
        </div>

        {stepper}

        <div className="p-6 overflow-y-auto min-w-0" data-modal-scroll-body>
          {children}
        </div>
      </div>
    </div>
  );
}
