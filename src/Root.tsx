import { CssBaseline, GlobalStyles } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { RecoilRoot } from "recoil";

import theme from "./theme";

const container = document.getElementById("app-root") as HTMLElement;
const root = createRoot(container);

function render(App: ComponentType) {
  root.render(
    <RecoilRoot>
      <StyledEngineProvider enableCssLayer>
        <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </StyledEngineProvider>
    </RecoilRoot>,
  );
}

export default render;
