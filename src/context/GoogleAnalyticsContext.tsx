import { createContext, ReactNode, useState, useContext } from "react";

import { AnalyticsFlow } from "@/types";

const GoogleAnalyticsContext = createContext<{
  analyticsStartAction: AnalyticsFlow | null;
  setAnalyticsStartAction: (item: AnalyticsFlow | null) => void;
  analyticsCompleteAction: AnalyticsFlow | null;
  setAnalyticsCompleteAction: (item: AnalyticsFlow | null) => void;
}>({
  analyticsStartAction: null,
  setAnalyticsStartAction: () => {},
  analyticsCompleteAction: null,
  setAnalyticsCompleteAction: () => {},
});

// Used to allow components to send GA events as needed
export const GoogleAnalyticsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [analyticsStartAction, setAnalyticsStartAction] =
    useState<AnalyticsFlow | null>(null);
  const [analyticsCompleteAction, setAnalyticsCompleteAction] =
    useState<AnalyticsFlow | null>(null);

  return (
    <GoogleAnalyticsContext.Provider
      value={{
        analyticsStartAction,
        setAnalyticsStartAction,
        analyticsCompleteAction,
        setAnalyticsCompleteAction,
      }}
    >
      {children}
    </GoogleAnalyticsContext.Provider>
  );
};

export const useGoogleAnalytics = () => useContext(GoogleAnalyticsContext);
