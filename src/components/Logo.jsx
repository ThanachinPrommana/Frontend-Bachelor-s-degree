import YuuyenLogo from "@/assets/Yuuyen.jpg";

const LogoCircle = () => {
  return (
    <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shadow-md bg-white">
      <img
        src={YuuyenLogo}
        alt="Yuuyen Logo"
        className="object-cover w-full h-full"
      />
    </div>
  );
};

export default LogoCircle;
