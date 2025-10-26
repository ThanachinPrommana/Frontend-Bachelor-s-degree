// File: src/components/booking/SlipButton.jsx

import { Button } from "@/components/ui/button";

export default function SlipButton({ url }) {
  // ถ้าไม่มี URL ให้แสดงเป็นขีด
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return <span className="text-muted-foreground">—</span>;
  }
  
  // ถ้ามี URL ให้แสดงเป็นปุ่มที่กดแล้วเปลี่ยนหน้าไปยัง URL นั้น
  return (
    <Button
      variant="outline"
      size="sm"
      asChild
    >
      {/* (สำคัญ) ลบ target="_blank" และ rel="..." ออก */}
      <a href={url}> 
        ดูสลิป
      </a>
    </Button>
  );
}