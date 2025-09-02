import { useEffect, useState } from "react";
import Iconselect from "@/components/Iconselect";
import Searchbar from "@/components/form/Searchbar";
import Buttons from "@/components/Buttons";
import Cards from "@/components/Cards";
import { Link } from "react-router";
import Credit from "@/components/Credit";
import mockHouses from "@/data/mockHouses";
import { FaBalanceScale, FaMoneyBillWave } from "react-icons/fa";
import LoanCalculator from "@/components/form/LoanCalculator";
import { AnimatePresence, motion } from "framer-motion";

const Home = () => {
  const videos = [""];

  const [showLoanPopup, setShowLoanPopup] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const [imagedata, setImage] = useState(mockHouses);
  const [searchFilter, setSearch] = useState("");

  useEffect(() => {
    if (videos.length > 0) {
      const randomIndex = Math.floor(Math.random() * videos.length);
      setSelectedVideo(videos[randomIndex]);
    }
    console.log("imagedata state:", imagedata);
  }, [videos]);

  const handleSearch = () => {
    const filtered = mockHouses.filter((house) =>
      house.name.toLowerCase().includes(searchFilter.toLowerCase())
    );
    console.log("Filtered results:", filtered);
    setImage(filtered);
  };
  return (
    <div className="w-full">
      {/* Background Video Section */}

      <div className="relative flex items-center justify-center h-150">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          src="/video/16919716-uhd_3840_2160_30fps.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="relative bg-white bg-opacity-80 p-6 rounded-2xl shadow-lg w-150 max-w-4xl mx-4 sm:mx-8 lg:mx-16">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-3 sm:space-y-0 sm:space-x-3">
            <Iconselect />
            <div className="flex w-full h-full justify-between">
              <Link to="/compare" className="flex">
                <Buttons
                  text={
                    <div className="flex items-center space-x-4">
                      <FaBalanceScale />
                      <span>Compare</span>
                    </div>
                  }
                  color="bg-blue-600"
                />
              </Link>

              <Buttons text="Ai Search" color="bg-blue-600" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-4">
            <Searchbar
              value={searchFilter}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Buttons
              text="Search"
              color="bg-black"
              lenghbutton="p-7.5"
              onClick={handleSearch}
            />
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <div className="p-4 sm:p-8 lg:p-20 mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-5">
          <h1 className="text-red-500 text-3xl mb-4 sm:mb-0">Hot</h1>
          <h1 className="text-blue-800 text-sm">Order</h1>
        </div>
        <Cards data={imagedata} />
        <Link to="Profile" />
      </div>

      {/* Credit Section */}

      <Credit />
      <button
        onClick={() => setShowLoanPopup((prev) => !prev)}
        className="fixed bottom-6 right-6 bg-white border shadow-lg rounded-full p-4 hover:bg-blue-50 transition z-40"
      >
        <FaMoneyBillWave size={24} className="text-green-600" />
      </button>

      {/* Popup LoanCalculator + Animation */}
      <AnimatePresence>
        {showLoanPopup && (
          <motion.div
            key="loan-popup"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 right-6 z-50 bg-white p-6 rounded-xl shadow-2xl w-[90%] max-w-xl"
          >
            <button
              className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-4xl"
              onClick={() => setShowLoanPopup(false)}
            ></button>
            <LoanCalculator />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
