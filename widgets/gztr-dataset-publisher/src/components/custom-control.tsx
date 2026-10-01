import type { PropsWithChildren, ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type CustomControlProps = {
  position: keyof typeof controlPositions;
};

const controlPositions = {
  topLeft: ".maplibregl-ctrl-top-left",
  topRight: ".maplibregl-ctrl-top-right",
  bottomLeft: ".maplibregl-ctrl-bottom-left",
  bottomRight: ".maplibregl-ctrl-bottom-right",
};

export const CustomControl = ({
  position,
  children,
}: PropsWithChildren<CustomControlProps>) => {
  const [groupContainer, setGroupContainer] = useState<HTMLDivElement | null>(
    null,
  );

  useEffect(() => {
    const parentElement = document.querySelector(
      `#form-map ${controlPositions[position]}`,
    );
    const groupDiv = document.createElement("div");

    if (parentElement) {
      groupDiv.classList.add("maplibregl-ctrl", "maplibregl-ctrl-group");

      setGroupContainer(groupDiv);
      parentElement.appendChild(groupDiv);
    }

    return () => {
      if (parentElement) {
        parentElement.removeChild(groupDiv);
      }
    };
  }, [position]);

  if (!groupContainer) return null;

  return createPortal(children, groupContainer);
};

type DefaultButtonProps = {
  title: string;
  onClick: () => void;
  icon: () => ReactNode;
};

const DefaultButton = ({ title, onClick, icon }: DefaultButtonProps) => {
  return (
    <Button variant="ghost" aria-label={title} title={title} onClick={onClick}>
      {icon()}
    </Button>
  );
};

CustomControl.DefaultButton = DefaultButton;
