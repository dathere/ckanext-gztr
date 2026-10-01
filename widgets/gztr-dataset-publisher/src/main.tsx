import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App.tsx";

const datasetPublisherGazetteerRoot = document.getElementById(
  "dataset-publisher-gazetteer-root",
);

if (datasetPublisherGazetteerRoot) {
  const config = datasetPublisherGazetteerRoot.getAttribute("data-config");
  const datasetPublisherGazetteerConfig = config
    ? JSON.parse(config)["dataset_publisher_gazetteer"]
    : {};
  createRoot(datasetPublisherGazetteerRoot).render(
    <StrictMode>
      <TooltipProvider>
        <App config={datasetPublisherGazetteerConfig} />
      </TooltipProvider>
    </StrictMode>,
  );
}
