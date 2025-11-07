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

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnecting, isConnected } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/dashboard", { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    const protectedRoutes = [
      "/deposit",
      "/topup",
      "/upgrade",
      "/consolidate",
      "/withdraw",
      "/exit",
    ];
    const isProtectedRoute = protectedRoutes.includes(location.pathname);

    if (!isConnected && isProtectedRoute) {
      navigate("/dashboard", { replace: true });
    }
  }, [isConnected, location.pathname, navigate]);

  if (isConnecting || !isInitialized) {
    return null;
  }

  const isDashboardNoWallet =
    location.pathname === "/dashboard" && !isConnected;

  return (
    <Box id="root" className="flex h-dvh overflow-hidden">
      <Sidebar />
      <Box className="flex grow flex-col overflow-hidden">
        <Header />
        <ScrollToTop>
          <Routes />
          {!isDashboardNoWallet && <Footer />}
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
