import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const publicSearchWidgetDiv = document.getElementById("gztr-search-widget-root");

if (publicSearchWidgetDiv) {
  const config = publicSearchWidgetDiv.getAttribute("data-config");
  const publicSearchWidgetConfig = config ? JSON.parse(config)["public_search_widget"] : {};
  createRoot(publicSearchWidgetDiv).render(
    <StrictMode>
      <App config={publicSearchWidgetConfig} />
    </StrictMode>,
  );
}
