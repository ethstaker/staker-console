import { Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const GA_LOCAL_STORAGE = "ethstaker_gaConsent";

export const GoogleAnalytics = () => {
  const location = useLocation();
  // default to false to prevent component flash if it
  // takes a moment to retrieve response from local storage
  const [consentGiven, setConsentGiven] = useState<boolean | undefined>(false);

  useEffect(() => {
    const storedConsent = localStorage.getItem(GA_LOCAL_STORAGE);
    if (storedConsent === "true") {
      setConsentGiven(true);
    } else if (storedConsent === "false") {
      setConsentGiven(false);
    } else {
      setConsentGiven(undefined);
    }
  }, []);

  const sendPageView = () => {
    if (typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", "page_view", {
      page_path: location.pathname,
      page_title: document.title,
    });
  };

  useEffect(() => {
    if (consentGiven && typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      });

      sendPageView();
    }
  }, [consentGiven]);

  useEffect(() => {
    if (!consentGiven) {
      return;
    }

    sendPageView();
  }, [location]);

  const onUserConsent = (consent: string) => {
    localStorage.setItem(GA_LOCAL_STORAGE, consent);
    setConsentGiven(consent === "true");
  };

  if (!import.meta.env.VITE_GA_MEASUREMENT_ID || consentGiven !== undefined) {
    return;
  }

  return (
    <Box className="fixed bottom-10 z-50 flex justify-center w-full">
      <Box className="max-w-[700px] flex flex-col gap-4 items-center p-4 bg-secondaryBackground">
        <Typography>
          This site uses Google Analytics to track interactions anonymously
        </Typography>
        <Box className="flex flex-row justify-between gap-10 items-center">
          <Button
            color="secondary"
            variant="outlined"
            onClick={() => onUserConsent("false")}
          >
            Reject
          </Button>
          <Button
            color="primary"
            variant="contained"
            onClick={() => onUserConsent("true")}
          >
            Allow
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
