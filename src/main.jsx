import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { FormProvider } from "./context/FormContext";
import { CompareProvider } from "./context/CompareContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_test_51R6USEEHWiwlX27ITAS8FPSrge8gvKXeRe12WMaZl79xFCVeea2cpExdBdNgrD8IbaX7ZnGCtiXCFBmsuEjYwlrY00E1uHNRCr")

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CompareProvider>
      <FormProvider>
        <App />
      </FormProvider>
    </CompareProvider>
  </StrictMode>,
);
