// src/components/booking/SlipButton.jsx
import { Button } from "@/components/ui/button";
import { Image as ImageIcon } from "lucide-react";

export default function SlipButton({ url, onOpen }) {
  return url ? (
    <Button variant="outline" size="sm" onClick={() => onOpen(url)}>
      <ImageIcon className="w-4 h-4 mr-2" />
      ดูสลิป
    </Button>
  ) : (
    <span className="text-muted-foreground">ไม่มี</span>
  );
}
