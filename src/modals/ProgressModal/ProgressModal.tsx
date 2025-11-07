import { Close } from "@mui/icons-material";
import {
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
} from "@mui/material";
import React from "react";

import { BaseDialog } from "@/modals/BaseDialog";

interface ProgressModalProps {
  children: React.ReactNode;
  success: boolean;
  open: boolean;
  onClose: () => void;
  title: string;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  children,
  success,
  open,
  onClose,
  title,
}) => {
  return (
    <BaseDialog open={open} onClose={onClose}>
      <DialogContent className="p-0">
        <Box className="p-0">
          <Box className="mb-4 flex items-center justify-between border-b border-b-[#404040] px-6 py-4">
            <Box className="flex-1" />
            <Typography variant="h5" className="font-semibold text-white">
              {title}
            </Typography>
            <Box className="flex flex-1 justify-end">
              <IconButton className="text-secondaryText" onClick={onClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          {children}

          <Box className="mt-4 flex justify-center border-t border-t-[#404040] px-6 py-4">
            <Button variant="contained" onClick={onClose} disabled={!success}>
              Finish
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </BaseDialog>
  );
};
