import { ThemeProvider } from "@mui/material/styles";
import { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { RecoilRoot } from "recoil";

import theme from "./theme";

const container = document.getElementById("app-root") as HTMLElement;
const root = createRoot(container);

function render(App: ComponentType) {
  root.render(
    <RecoilRoot>
      <HelmetProvider>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </HelmetProvider>
    </RecoilRoot>,
  );
}

export default render;
