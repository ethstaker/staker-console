import { Box } from "@mui/material";
import { ReactNode, useCallback, useState } from "react";

interface CopyToClipboardProps {
  children: ReactNode;
  text: string;
}

export const CopyToClipboard = ({ children, text }: CopyToClipboardProps) => {
  const [copySuccessful, setCopySuccessful] = useState<boolean>(false);
  const isSupported = !!navigator?.clipboard;

  const handleCopy = useCallback(async () => {
    if (!isSupported) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccessful(true);
      const timer = setTimeout(() => setCopySuccessful(false), 1500);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error("Failed to copy: ", e);
    }
  }, [text, isSupported]);

  return (
    <Box
      className={isSupported && "cursor-pointer relative"}
      onClick={handleCopy}
    >
      {children}

      {copySuccessful && (
        <Box className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-lg font-semibold">
          Copied Successfully
        </Box>
      )}
    </Box>
  );
};
