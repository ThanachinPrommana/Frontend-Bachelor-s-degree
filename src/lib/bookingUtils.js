// src/lib/bookingUtils.js
export const fmtDateTimeTH = (iso) =>
  iso
    ? new Date(iso).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

export const maskEmail = (email = "") => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const parts = domain.split(".");
  const maskedName =
    name.length <= 2 ? name[0] + "*" : name.slice(0, 2) + "***";
  const maskedDomain =
    parts.length >= 2
      ? parts[0].slice(0, 1) + "***." + parts.slice(1).join(".")
      : domain;
  return `${maskedName}@${maskedDomain}`;
};
