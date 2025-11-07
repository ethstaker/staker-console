import { Dialog, DialogProps, Paper, styled } from "@mui/material";

interface StyledPaperProps {
  wide?: boolean;
  isFullscreen?: boolean;
}

const StyledPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "wide" && prop !== "isFullscreen",
})<StyledPaperProps>(({ theme, wide = false, isFullscreen = false }) => ({
  background: theme.palette.background.default,
  borderRadius: isFullscreen ? 0 : "0.5rem",
  maxHeight: isFullscreen ? "100vh" : "85vh",
  width: isFullscreen ? "100vw" : wide ? "800px" : "600px",
  height: isFullscreen ? "100vh" : "auto",
}));

interface BaseDialogProps extends DialogProps {
  wide?: boolean;
  isFullscreen?: boolean;
}

export const BaseDialog = ({
  children,
  wide = false,
  isFullscreen = false,
  ...props
}: BaseDialogProps) => {
  return (
    <Dialog
      {...props}
      onClose={(event, reason) => {
        if (reason && ["backdropClick", "escapeKeyDown"].includes(reason)) {
          return;
        }

        if (props.onClose) {
          props.onClose(event, reason);
        }
      }}
      maxWidth={false}
      fullWidth={false}
      fullScreen={isFullscreen}
      PaperComponent={StyledPaper}
      PaperProps={{ wide, isFullscreen }}
    >
      {children}
    </Dialog>
  );
};
