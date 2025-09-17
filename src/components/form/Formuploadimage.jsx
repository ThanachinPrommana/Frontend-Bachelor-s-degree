import { useForm } from "react-hook-form";
import { useState } from "react";
import { updateImage } from "@/api/user";
import { Loader2 } from "lucide-react";

const Formuploadimage = ({ onUploadSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [uploading, setUploading] = useState(false);

  const onSubmit = async (data) => {
    if (!data.image || data.image.length === 0) {
      console.log("ไม่มีรูปภาพใหม่ ไม่ต้องอัปโหลด");
      return;
    }

    const formData = new FormData();
    formData.append("image", data.image[0]);

    try {
      setUploading(true);
      const result = await updateImage(formData);
      console.log('ข้อมูลที่ได้รับจาก API:', result);
      if (onUploadSuccess) {
        onUploadSuccess({ url: result.user.image });
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("อัปโหลดล้มเหลว");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col justify-center space-y-3">
        <label className="font-semibold block mb-1">Upload Image</label>
        <input
          type="file"
          accept="image/*"
          {...register("image")}
          disabled={uploading}
          className="cursor-pointer"
        />

        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 bg-[#2C3E50] text-white rounded hover:bg-[#1a252f] max-w-30 flex justify-center items-center"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit"}
        </button>

        {uploading && <p className="text-sm text-gray-500">กำลังอัปโหลด...</p>}
      </div>
    </form>
  );
};

export default Formuploadimage;
