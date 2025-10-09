// src/components/booking/StatusBadge.jsx
export default function StatusBadge({ status }) {
  const s = (status || "").toUpperCase();
  const map = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-200 text-gray-700",
    COMPLETED: "bg-purple-100 text-purple-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        map[s] || "bg-muted"
      }`}
    >
      {s || "-"}
    </span>
  );
}
