import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App.tsx";

const datasetPublisherGazetteerWidgetRoot = document.getElementById(
  "gazetteer-widget-root",
);

if (datasetPublisherGazetteerWidgetRoot) {
  createRoot(datasetPublisherGazetteerWidgetRoot).render(
    <StrictMode>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </StrictMode>,
  );
}
