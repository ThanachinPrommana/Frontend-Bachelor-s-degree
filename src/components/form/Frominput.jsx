// src/components/form/Frominput.jsx
const Frominput = ({
  label,
  type = "text",
  name,
  defaultValue = "",
  error,
  register, // react-hook-form's register
  registerOptions, // เพิ่ม: ส่ง options ให้ register ได้ เช่น pattern, required ฯลฯ
  onChange, // เพิ่ม: onChange เสริม (จะถูก compose รวมกับ RHF)
  className = "",
  ...rest
}) => {
  // ถ้ามี register+name จะได้อ็อบเจ็กต์ { onChange, onBlur, ref, name }
  const reg = register && name ? register(name, registerOptions) : {};

  // รวม onChange ของ RHF + ของผู้ใช้
  const handleChange = (e) => {
    if (typeof reg.onChange === "function") reg.onChange(e);
    if (typeof onChange === "function") onChange(e);
  };

  // กัน defaultValue กับ type=file (React ไม่ให้)
  const inputProps = {
    type,
    name,
    ...(type !== "file" ? { defaultValue } : {}),
    ...rest,
    // ⭐️ ใส่ของ RHF ก่อน แล้ว override onChange รวมของเรา
    ...reg,
    onChange: handleChange,
    ref: reg?.ref,
    "aria-invalid": !!error || undefined,
    className: `input w-full h-10 border p-2 rounded-xl ${className}`,
  };

  return (
    <div>
      {label && <label className="text-base mb-1 block">{label}</label>}
      <input {...inputProps} />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Frominput;
