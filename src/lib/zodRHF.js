/**
 * ตรวจ subset ของฟอร์มด้วย zod แล้ว map error เข้า react-hook-form
 * ไม่เปลี่ยน UI เดิม — แค่เรียกก่อน navigate เท่านั้น
 */
export function validateStep(form, schema, fields) {
  const values = form.getValues();
  const subset = Array.isArray(fields) && fields.length
    ? fields.reduce((acc, k) => {
        acc[k] = values[k];
        return acc;
      }, {})
    : values;

  const parsed = schema.safeParse(subset);
  if (!parsed.success) {
    form.clearErrors();
    parsed.error.issues.forEach((iss) => {
      const path = iss.path.join(".");
      if (!path) return;
      form.setError(path, {
        type: "zod",
        message: iss.message,
      });
    });
    return false;
  }
  return true;
}
