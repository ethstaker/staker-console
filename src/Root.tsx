import { ThemeProvider } from "@mui/material/styles";
import { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { RecoilRoot } from "recoil";

import theme from "./theme";

const container = document.getElementById("app-root") as HTMLElement;
const root = createRoot(container);

function render(App: ComponentType) {
  root.render(
    <RecoilRoot>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </RecoilRoot>,
  );
}

export default render;
