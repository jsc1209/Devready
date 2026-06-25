import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#6C63FF",
      light: "#8B85FF",
      dark: "#544DCC",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#5B5FEF",
    },
    background: {
      default: "#F7F8FA",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1A1A2E",
      secondary: "#6B7280",
    },
  },
  typography: {
    fontFamily: [
      "Pretendard",
      "-apple-system",
      "system-ui",
      "Roboto",
      "sans-serif",
    ].join(","),
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
});

export default theme;
