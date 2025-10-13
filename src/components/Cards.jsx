import { Link } from "react-router-dom";

const Cards = ({ data, onImageClick }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return (
    <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 item">
      {data.map((item) => (
        <Link to={`/deposit/${item.id}`} key={item.id}>
          <div
            className="overflow-hidden cursor-pointer relative rounded-xl"
            onClick={() => onImageClick && onImageClick(item.id)}
          >
            <img
              // (แก้ไข) ใช้ item.image ที่ถูกเตรียมไว้ให้แล้ว
              src={item.image}
              // (แก้ไข) ใช้ item.name
              alt={item.name}
              className="w-full h-50 object-cover"
            />
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center p-2">
              <p className="text-white text-lg font-semibold text-center break-words">
                {/* (แก้ไข) ใช้ item.name */}
                {item.name}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default Cards;