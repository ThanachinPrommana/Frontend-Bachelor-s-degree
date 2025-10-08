export default function Stepper({ steps = [], current = 0, onSelect }) {
  return (
    <div className="px-6 py-3 border-b bg-white/60 backdrop-blur-sm sticky top-0 z-10">
      <ol className="flex items-center gap-2 text-xs">
        {steps.map((label, idx) => {
          const active = idx === current;
          const done = idx < current;
          return (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelect?.(idx)}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                  active
                    ? "bg-[#2c3e50] text-white border-[#2c3e50]"
                    : done
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                <span className="font-semibold">{idx + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
              {idx !== steps.length - 1 && (
                <span className="text-gray-300">—</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
