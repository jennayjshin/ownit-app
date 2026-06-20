import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import { createRoot } from "react-dom/client";

import config from "../granite.config.ts";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <TDSMobileAITProvider brandPrimaryColor={config.brand.primaryColor}>
    <App />
  </TDSMobileAITProvider>,
);
