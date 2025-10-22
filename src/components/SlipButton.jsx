// File: src/components/booking/SlipButton.jsx
import { Button } from "@/components/ui/button";

export default function SlipButton({ url }) {
  // (สำคัญ) เพิ่ม CONSOLE.LOG ตรงนี้
  console.log("SlipButton received url:", url);

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return <span className="text-muted-foreground">—</span>;
  }
  
  return (
    <Button variant="outline" size="sm" asChild>
      <a href={url} target="_blank" rel="noopener noreferrer">
        ดูสลิป
      </a>
    </Button>
  );
}