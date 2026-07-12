// App.jsx
import AppRouter from "./routes/AppRouter";
import { Toaster } from "@/components/ui/toaster";

const App = () => {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
};

export default App;
