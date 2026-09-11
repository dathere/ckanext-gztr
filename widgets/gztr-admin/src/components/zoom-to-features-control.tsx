import { ScanSearchIcon } from "lucide-react";
import { useCallback } from "react";
import { useMap } from "react-map-gl/maplibre";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CustomControl } from "@/components/custom-control";
import type { Geoman } from "@geoman-io/maplibre-geoman-free";

export const ZoomToFeaturesControl = ({ gm }: { gm: Geoman | undefined }) => {
  const { current: map } = useMap();

  const zoomToFeatures = useCallback(() => {
    if (!map) return;
    gm?.toggleMode("helper", "zoom_to_features");
    gm?.toggleMode("helper", "zoom_to_features");
  }, [gm, map]);

  return (
    <CustomControl position="topRight">
      <Tooltip>
        <TooltipTrigger>
          <CustomControl.DefaultButton
            title="Zoom to selected features"
            icon={() => <ScanSearchIcon className="mx-auto" />}
            onClick={() => {
              zoomToFeatures();
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="mb-0">Zoom to your selected/drawn features</p>
        </TooltipContent>
      </Tooltip>
    </CustomControl>
  );
};
