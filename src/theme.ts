import { alpha, createTheme } from "@mui/material/styles";

export const tailwindColors = {
  primary: "#627EEA",
  primaryDark: "#145A3D",
  secondary: "#F8F9FA",
  background: "#1E2128",
  divider: "#2A2A2A",
  secondaryBackground: "#333743",
  secondaryText: "#B3B3B3",
  white: "#FFFFFF",
  blue: "#03a9f4",
  success: "#59D98E",
  error: "#ef4444",
  warning: "#F8C425",
};

const theme = createTheme({
  palette: {
    primary: {
      main: tailwindColors.primary,
    },
    secondary: {
      main: tailwindColors.secondary,
    },
    background: {
      default: tailwindColors.background,
      paper: tailwindColors.secondaryBackground,
    },
    divider: tailwindColors.divider,
    error: {
      main: tailwindColors.error,
    },
    success: {
      main: tailwindColors.success,
    },
    warning: {
      main: tailwindColors.warning,
    },
    text: {
      primary: tailwindColors.white,
      secondary: tailwindColors.secondaryText,
    },
    action: {
      disabled: alpha(tailwindColors.white, 0.4),
      disabledBackground: alpha(tailwindColors.primary, 0.3),
    },
  },
  components: {
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&.MuiAutocomplete-clearIndicator": {
            color: tailwindColors.white,
          },
        },
      },
    },
  },
  typography: {
    fontSize: 16,
    htmlFontSize: 16,
    body1: {
      fontSize: "1rem",
      lineHeight: "1.6rem",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: "1.45rem",
    },
    h1: {
      fontSize: "2.5rem",
      lineHeight: "1.2rem",
    },
  },
});

export default theme;
