// src/components/profile/DetailRow.jsx
import { Copy } from "lucide-react";

export default function DetailRow({ label, value }) {
  const isStringLike = typeof value === "string" || typeof value === "number";
  const textValue = isStringLike ? String(value) : null;
  const isCopyable =
    isStringLike && textValue.trim() !== "" && textValue !== "-";

  return (
    <div className="group flex items-start justify-between gap-3 rounded-md p-2 hover:bg-gray-50 transition">
      <span className="text-[13px] text-gray-500">{label}</span>

      <div className="flex items-center gap-2">
        {/* ถ้าเป็น string/number ให้แสดงเป็นข้อความปกติ, ถ้าเป็น ReactNode ก็เรนเดอร์ตรงๆ */}
        {isStringLike ? (
          <span
            className="text-sm font-medium text-gray-900 truncate max-w-[16rem]"
            title={textValue}
          >
            {textValue || "-"}
          </span>
        ) : (
          <span className="text-sm font-medium text-gray-900">
            {value ?? "-"}
          </span>
        )}

        {isCopyable && (
          <button
            type="button"
            title="คัดลอก"
            onClick={() => navigator.clipboard?.writeText(textValue)}
            className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-gray-200"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}
