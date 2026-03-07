import { Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAccount } from "wagmi";

import { useGoogleAnalytics } from "@/context/GoogleAnalyticsContext";
import { useValidators } from "@/hooks/useValidators";

const GA_ADDRESS_STORAGE = "ethstaker_storedAddress";
const GA_CONSENT_STORAGE = "ethstaker_gaConsent";

export const GoogleAnalytics = () => {
  const { address, isConnected } = useAccount();
  const {
    analyticsStartAction,
    setAnalyticsStartAction,
    analyticsCompleteAction,
    setAnalyticsCompleteAction,
  } = useGoogleAnalytics();
  const location = useLocation();
  const {
    data: { validatorCount },
  } = useValidators();
  // default to false to prevent component flash if it
  // takes a moment to retrieve response from local storage
  const [consentGiven, setConsentGiven] = useState<boolean | undefined>(false);
  const [storedAddresses, setStoredAddresses] = useState<
    `0x${string}`[] | undefined
  >(undefined);

  useEffect(() => {
    const storedConsent = localStorage.getItem(GA_CONSENT_STORAGE);
    if (storedConsent === "true") {
      setConsentGiven(true);
    } else if (storedConsent === "false") {
      setConsentGiven(false);
    } else {
      setConsentGiven(undefined);
    }

    // Will be stored as a comma delimited string
    const addresses = localStorage.getItem(GA_ADDRESS_STORAGE);
    setStoredAddresses(
      (addresses ? addresses.split(",") : []) as `0x${string}`[],
    );
  }, []);

  useEffect(() => {
    if (!consentGiven || !analyticsStartAction) {
      return;
    }

    sendEvent("flow_start", analyticsStartAction);
    setAnalyticsStartAction(null);
  }, [analyticsStartAction, consentGiven]);

  useEffect(() => {
    if (
      !consentGiven ||
      !address ||
      !isConnected ||
      !validatorCount ||
      !storedAddresses
    ) {
      return;
    }

    if (!storedAddresses.includes(address)) {
      sendValidatorCount(address, validatorCount);
    }
  }, [address, consentGiven, isConnected, validatorCount]);

  useEffect(() => {
    if (!consentGiven || !analyticsCompleteAction) {
      return;
    }

    sendEvent("flow_complete", analyticsCompleteAction);
    setAnalyticsCompleteAction(null);
  }, [analyticsCompleteAction, consentGiven]);

  const sendPageView = () => {
    if (typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", "page_view", {
      page_path: location.pathname,
      page_title: document.title,
    });
  };

  const sendEvent = (event: string, flow: string) => {
    if (typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", event, {
      flow_name: flow,
    });
  };

  const sendValidatorCount = (newAddress: `0x${string}`, count: number) => {
    if (typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", "validator_count", {
      count,
    });

    const newAddresses = [...(storedAddresses || []), newAddress];
    setStoredAddresses(newAddresses);
    localStorage.setItem(GA_ADDRESS_STORAGE, newAddresses.join(","));
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
    localStorage.setItem(GA_CONSENT_STORAGE, consent);
    setConsentGiven(consent === "true");
  };

  if (!import.meta.env.VITE_GA_MEASUREMENT_ID || consentGiven !== undefined) {
    return;
  }

  return (
    <Box className="fixed bottom-10 z-50 left-1/2 transform -translate-x-1/2 max-w-[700px]">
      <Box className="flex flex-col gap-4 items-center p-4 bg-secondaryBackground">
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
