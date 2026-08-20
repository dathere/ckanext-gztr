import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const datasetPublisherGazetteerWidgetRoot = document.getElementById(
  "gazetteer-widget-root",
);

if (datasetPublisherGazetteerWidgetRoot) {
  createRoot(datasetPublisherGazetteerWidgetRoot).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
