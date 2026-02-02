import { HomeIcon } from "lucide-react";
import { useCallback } from "react";
import { useMap } from "react-map-gl/maplibre";

import { CustomControl } from "@/components/custom-control";

export const HomeControl = () => {
  const { current: map } = useMap();

  const zoomToHome = useCallback(() => {
    if (!map) return;

    map.fitBounds(
      [
        [-106.018066, 34.307144],
        [-106.018066, 34.307144],
      ],
      { zoom: 5 },
    );
  }, [map]);

  return (
    <CustomControl position="topRight">
      <CustomControl.DefaultButton
        title="Zoom to New Mexico"
        icon={() => <HomeIcon className="mx-auto" />}
        onClick={() => {
          zoomToHome();
        }}
      />
    </CustomControl>
  );
};
