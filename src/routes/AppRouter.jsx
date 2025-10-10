import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

// Layouts
import Layout from "../layouts/Layout";
import LayoutAdmin from "../layouts/LayoutAdmin";
import Layout_Buyer from "@/layouts/Layout_Buyer";
import Layout_Seller from "@/layouts/Layout_Seller";

// Guards
import RequireBuyerAuth from "@/components/Auth/RequireBuyerAuth";
import RequireSeller from "@/components/Auth/RequireSeller";

// Public Pages
import Home from "../pages/Home";
import Support from "../pages/Support";
import Compare from "@/pages/Compare";

// Profile Pages
import ProfileTypeSelector from "@/pages/Profile/ProfileTypeSelector";
import ProfileSeller from "@/pages/Profile/Seller/ProfileSeller";
import ProfileBuyer from "@/pages/Profile/Buyer/ProfileBuyer";
import BuyerNoti from "@/pages/Profile/Buyer/BuyerNoti";

// Post for Sale Layout
import PostForSaleLayout from "@/pages/Post_for_sale/PostForSaleLayout";

// Post for Sale Pages
import PostTitle from "@/pages/Post_for_sale/PostTitle";
import PostLocation from "@/pages/Post_for_sale/PostLocation";
import PostDetail from "@/pages/Post_for_sale/PostDetail";
import PostPrice from "@/pages/Post_for_sale/PostPrice";
import PostInform from "@/pages/Post_for_sale/PostInform";
import PostUpload from "@/pages/Post_for_sale/PostUpload";
import PostConfirm from "@/pages/Post_for_sale/PostConfirm";

// Auth Pages
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import ForgotPassword from "@/pages/Auth/Forgotpassword";
import Resetpassword from "@/pages/Auth/Resetpassword";
import VerifyEmail from "@/pages/Auth/VerifyEmail";

// Deposit & Payment
import Deposit from "@/pages/Deposit";
import Deposit_doc from "@/pages/Deposit_doc";
import Payment from "@/pages/Payment";

// Admin Pages - Posts of Seller
import Approval from "@/pages/admin/Posts of Seller/Approval";
import AcceptPost from "@/pages/admin/Posts of Seller/AcceptPost";
import RejectPost from "@/pages/admin/Posts of Seller/RejectPost";

// Admin Pages - User Account
import BuyerId from "@/pages/admin/User account/BuyerId";
import VerificationSeller from "@/pages/admin/User account/VerificationSeller";
import VerifiedSeller from "@/pages/admin/User account/VerifiedSeller";
import RejectSeller from "@/pages/admin/User account/RejectSeller";

// Admin Pages - Payment Management
import PayDeposit from "@/pages/admin/Payment/PayDeposit";
import PayBank from "@/pages/admin/Payment/PayBank";
import DescriptionReport from "@/pages/admin/DescriptionReport";
import { PostFormProvider } from "@/pages/Post_for_sale/PostFormProvider";
import { AuthProvider } from "@/context/AuthContext";
import RegisterSeller from "@/pages/Auth/RegisterSeller";

import NotFound from "@/pages/NotFound";
import ContractForm from "@/pages/ContractForm";
import DepositPaymentPage from "@/pages/Profile/Payment/DepositPaymentPage";
import PaymentStatusPage from "@/pages/Profile/Payment/PaymentStatusPage";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe('pk_test_51R6USEEHWiwlX27ITAS8FPSrge8gvKXeRe12WMaZl79xFCVeea2cpExdBdNgrD8IbaX7ZnGCtiXCFBmsuEjYwlrY00E1uHNRCr');

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 🌐 Public Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/support" element={<Support />} />
            <Route path="/noti" element={<BuyerNoti />} />
            <Route path="*" element={<NotFound />} />

            {/* Profile Selection */}
            <Route
              path="/profileTypeSelector"
              element={<ProfileTypeSelector />}
            />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/resetpassword" element={<Resetpassword />} />
            <Route path="/verifyemail" element={<VerifyEmail />} />

            {/* Deposit & Payment */}
            <Route path="/deposit/:id" element={<Deposit />} />
            <Route path="/deposit_doc" element={<Deposit_doc />} />
            <Route path="/payment" element={<Payment />} />
          </Route>

          {/* 👤 Buyer Routes (Protected) */}
          <Route path="/buyer" element={<RequireBuyerAuth />}>
            <Route element={<Layout_Buyer />}>
              <Route index element={<Home />} />
              <Route path="profile" element={<ProfileBuyer />} />
              <Route path="support" element={<Support />} />
              <Route path="payment" element={<Payment />} />
              <Route path="deposit/:id" element={<Deposit />} />
              <Route path="register/seller" element={<RegisterSeller />} />
              <Route path="contract" element={<ContractForm />} />
              {/* ----- (เพิ่ม) Routes สำหรับ Stripe Payment ----- */}
              <Route
                path="deposit-payment"
                element={<DepositPaymentPage />}
              />
              <Route
                path="payment-status"
                element={
                  <Elements stripe={stripePromise}>
                    <PaymentStatusPage />
                  </Elements>
                }
              />
              {/* ------------------------------------------- */}
            </Route>
          </Route>

          {/* 👤 Seller Routes (Protected) */}
          <Route path="/seller" element={<RequireSeller />}>
            <Route element={<Layout_Seller />}>
              <Route index element={<Home />} />
              <Route path="profile" element={<ProfileSeller />} />
              <Route path="support" element={<Support />} />
              <Route path="contract" element={<ContractForm />} />
              <Route path="payment" element={<Payment />} />
              {/* Post For Sale - Seller Access */}
              <Route
                element={
                  <PostFormProvider>
                    <Outlet />
                  </PostFormProvider>
                }
              >
                {/* ----- (เพิ่ม) Routes สำหรับ Stripe Payment ----- */}
                <Route
                  path="deposit-payment"
                  element={<DepositPaymentPage />}
                />
                <Route
                  path="payment-status"
                  element={
                    <Elements stripe={stripePromise}>
                      <PaymentStatusPage />
                    </Elements>
                  }
                />
                {/* ------------------------------------------- */}
                <Route path="post-for-sale" element={<PostForSaleLayout />}>
                  <Route path="title" element={<PostTitle />} />
                  <Route path="location" element={<PostLocation />} />
                  <Route path="detail" element={<PostDetail />} />
                  <Route path="price" element={<PostPrice />} />
                  <Route path="inform" element={<PostInform />} />
                  <Route path="upload" element={<PostUpload />} />
                  <Route path="confirm" element={<PostConfirm />} />
                </Route>
              </Route>
            </Route>
          </Route>

          {/* 🔐 Admin Routes */}
          <Route path="/admin" element={<LayoutAdmin />}>
            {/* Dashboard */}
            <Route index element={<Approval />} />
            <Route path="approval" element={<Approval />} />
            <Route path="accept-post" element={<AcceptPost />} />
            <Route path="reject-post" element={<RejectPost />} />

            {/* User Management */}
            <Route path="buyer-id" element={<BuyerId />} />
            <Route path="seller-id/verify" element={<VerificationSeller />} />
            <Route path="seller-id/verified" element={<VerifiedSeller />} />
            <Route path="seller-id/reject" element={<RejectSeller />} />

            {/* Payment Management */}
            <Route path="pay-deposit" element={<PayDeposit />} />
            <Route path="pay-bank" element={<PayBank />} />
            <Route path="description-report" element={<DescriptionReport />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
