import { Box } from "@mui/material";
import { PropsWithChildren, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = ({ children }: PropsWithChildren) => {
  const scrollRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  return (
    <Box ref={scrollRef} className="min-h-0 flex-1 flex-col overflow-auto">
      {children}
    </Box>
  );
};
