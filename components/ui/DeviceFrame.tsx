import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Kindle-style frame image; `screen` is its screen opening, as percentages of the image.
const FRAME = {
  src: "/device-frame-clean.png",
  width: 1288,
  height: 814,
  screen: { left: "8.307%", top: "8.968%", width: "83.385%", height: "81.941%" },
};

type DeviceFrameProps = {
  children: ReactNode;
  className?: string;
  /** Classes and styles for the screen area (background, text colour, font). */
  screenClassName?: string;
  screenStyle?: CSSProperties;
};

/** Shows its children on a device: the frame sits behind, the screen is placed over its opening. */
export default function DeviceFrame({ children, className, screenClassName, screenStyle }: DeviceFrameProps) {
  return (
    <div className={cn("relative", className)}>
      <Image
        src={FRAME.src}
        alt=""
        width={FRAME.width}
        height={FRAME.height}
        className="pointer-events-none h-auto w-full select-none"
      />
      <div className={cn("absolute flex flex-col", screenClassName)} style={{ ...FRAME.screen, ...screenStyle }}>
        {children}
      </div>
    </div>
  );
}
