import { Breadcrumb } from "../ui/breadcrumb";
import { Link } from "react-router";
import { HousePlus } from "lucide-react";

const Home = () => {
  return (
    <Breadcrumb>
      <Link to="/">
        <HousePlus />
      </Link>
    </Breadcrumb>
  );
};
export default Home;
