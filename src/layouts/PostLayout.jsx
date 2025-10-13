import { Card, CardContent } from "@/components/ui/card";
import StepProgress from "@/components/PostComponents/StepProgress";
import {
  FileText,
  MapPin,
  Home,
  Coins,
  User,
  Image,
  CheckCircle,
} from "lucide-react";

const steps = [
  "หัวข้อ",
  "ที่ตั้ง",
  "รายละเอียด",
  "ราคา",
  "ข้อมูลผู้ขาย",
  "อัปโหลดรูป",
  "สรุปข้อมูล",
];

const stepIcons = [
  <FileText className="w-4 h-4" />,
  <MapPin className="w-4 h-4" />,
  <Home className="w-4 h-4" />,
  <Coins className="w-4 h-4" />,
  <User className="w-4 h-4" />,
  <Image className="w-4 h-4" />,
  <CheckCircle className="w-4 h-4" />,
];

const PostLayout = ({ currentStep, children }) => {
  return (
    <div className="bg-[#ecf0f1] min-h-screen py-10">
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <StepProgress current={currentStep} steps={steps} icons={stepIcons} />
        <Card>
          <CardContent className="p-6">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostLayout;
