import { Upload, Warning } from "@mui/icons-material";
import { Box, Typography, Button, Alert, Link } from "@mui/material";
import clsx from "clsx";
import React, { useState, useRef, useEffect } from "react";
import { useChainId, useSwitchChain } from "wagmi";

import { getChainName, Network } from "@/config/networks";
import { DepositData } from "@/types";
import { ChainMismatchError, verifyDepositFile } from "@/utils/deposit";

interface DepositUploadProps {
  onFileUploaded: (data: DepositData[], fileName: string) => void;
}

export const DepositUpload: React.FC<DepositUploadProps> = ({
  onFileUploaded,
}) => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [errorChain, setErrorChain] = useState<number>(0);
  const [uploadedFile, setUploadedFile] = useState<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chainId && uploadedFile) {
      processFile(uploadedFile);
    }
  }, [chainId, uploadedFile]);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError("");
    setErrorChain(0);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as DepositData[];

      verifyDepositFile(data, chainId);

      onFileUploaded(data, file.name);
    } catch (err) {
      if (err instanceof ChainMismatchError) {
        setErrorChain(err.chainId);
      } else {
        const message =
          err instanceof Error ? err.message : "Failed to process file";
        setError(message);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadedFile(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/json") {
      setUploadedFile(file);
    } else {
      setUploadedFile(undefined);
      setError("Please upload a JSON file");
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const changeNetwork = (chainId: number) => {
    if (Network.Hoodi === chainId && import.meta.env.VITE_HOODI_APP_URL) {
      window.location.href = import.meta.env.VITE_HOODI_APP_URL;
    } else if (
      Network.Mainnet === chainId &&
      import.meta.env.VITE_MAINNET_APP_URL
    ) {
      window.location.href = import.meta.env.VITE_MAINNET_APP_URL;
    } else {
      switchChain(
        { chainId: chainId },
        {
          onSuccess: () => {
            setErrorChain(0);
          },
        },
      );
    }
  };

  return (
    <Box className="flex min-h-[400px] flex-col items-center justify-center">
      {(errorChain > 0 || error) && (
        <Alert
          className="my-6 rounded-xl bg-error/50 text-white"
          severity="error"
          variant="filled"
          icon={<Warning />}
        >
          {errorChain > 0 ? (
            <Typography>
              The provided deposit file is expecting {getChainName(errorChain)}.{" "}
              <Link
                className="cursor-pointer"
                onClick={() => changeNetwork(errorChain)}
              >
                Click here
              </Link>{" "}
              to change networks.
            </Typography>
          ) : (
            error
          )}
        </Alert>
      )}
      <Box
        className={clsx(
          "flex h-[300px] w-[600px] cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed",
          isDragOver ? "border-primary" : "border-divider",
          isDragOver ? "bg-primary/5" : "bg-transparent",
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        sx={{
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            borderColor: "#606060",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          },
        }}
      >
        <Upload className="mb-4 text-5xl text-primary" />
        <Typography variant="h6" className="mb-2 font-semibold text-white">
          Upload Deposit Data
        </Typography>
        <Typography className="mb-4 max-w-[400px] text-center text-secondaryText">
          Upload your deposit data JSON file. If you need help generating this,
          please view our step-by-step guide.
        </Typography>

        <Box className="flex justify-center">
          <Button color="primary" variant="contained" disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Choose File"}
          </Button>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </Box>
    </Box>
  );
};
