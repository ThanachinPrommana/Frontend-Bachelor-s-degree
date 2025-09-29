const Buttons = ({ onClick, text, color, className, ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg text-white ${color} ${className}`}
      {...props} // <-- KEY FIX: เพิ่มบรรทัดนี้เพื่อส่งต่อ props ทั้งหมด
    >
      {text}
    </button>
  );
};

export default Buttons;