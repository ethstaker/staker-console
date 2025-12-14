import { Box } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { Fragment, useEffect, useState } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import "@/index.css";

import { ErrorSplash } from "@/components/ErrorSplash";
import ContextProvider from "@/context";
import { withErrorHandler } from "@/error-handling";
import Routes from "@/routes";
import Footer from "@/sections/Footer";
import Header from "@/sections/Header";
import Sidebar from "@/sections/Sidebar";

import { ScrollToTop } from "./components/ScrollToTop/ScrollToTop";

const protectedRoutes = [
  "/deposit",
  "/topup",
  "/upgrade",
  "/consolidate",
  "/withdraw",
  "/exit",
];

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, isConnecting } = useAccount();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [redirectRoute, setRedirectRoute] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isConnected && protectedRoutes.includes(redirectRoute)) {
      setRedirectRoute("");
      navigate(redirectRoute, { replace: true });
    }
  }, [isConnected, redirectRoute]);

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/dashboard", { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    const isProtectedRoute = protectedRoutes.includes(location.pathname);

    if (!isConnected && isProtectedRoute) {
      setRedirectRoute(location.pathname);
      navigate("/dashboard", { replace: true });
    }
  }, [isConnecting, isConnected, location.pathname, navigate]);

  if (isConnecting || !isInitialized) {
    return null;
  }

  const isDashboardNoWallet =
    location.pathname === "/dashboard" && !isConnected;

  return (
    <Box id="root" className="flex h-dvh overflow-hidden">
      <Sidebar />
      <Box className="flex h-full grow flex-col overflow-hidden justify-between">
        <Header />
        <ScrollToTop>
          <Box className="h-full flex flex-col">
            <Box className="flex grow justify-center bg-[#171717]">
              <Box className="w-full max-w-[1400px] p-6">
                <Routes />
              </Box>
            </Box>
            {!isDashboardNoWallet && <Footer />}
          </Box>
        </ScrollToTop>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Fragment>
      <CssBaseline />
      <ContextProvider cookies={null}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ContextProvider>
    </Fragment>
  );
}

export default withErrorHandler(App, ErrorSplash);
