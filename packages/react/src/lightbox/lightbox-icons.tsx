import {
  altArrowLeftLinear,
  altArrowRightLinear,
  closeLinear,
  downloadMinimalisticLinear,
  fullScreenLinear,
  galleryWideLinear,
  magnifierZoomInLinear,
  magnifierZoomOutLinear,
  pauseLinear,
  playCircleLinear,
  playLinear,
  quitFullScreenLinear,
  shareLinear,
  subtitlesLinear,
  undoLeftRoundLinear,
  undoRightRoundLinear,
} from "@owlky/core";
import type { SVGAttributes } from "react";
import { Icon } from "../utils/icon.js";

/* Decorative 24px icons of the lightbox (Solar, ADR-0070 § 9). */

export const ZoomInIcon = () => <Icon icon={magnifierZoomInLinear} />;
export const ZoomOutIcon = () => <Icon icon={magnifierZoomOutLinear} />;
export const RotateClockwiseIcon = () => <Icon icon={undoRightRoundLinear} />;
export const RotateCounterClockwiseIcon = () => <Icon icon={undoLeftRoundLinear} />;
export const PlayIcon = (props: SVGAttributes<SVGSVGElement>) => (
  <Icon icon={playLinear} {...props} />
);
export const PauseIcon = (props: SVGAttributes<SVGSVGElement>) => (
  <Icon icon={pauseLinear} {...props} />
);
export const EnterFullscreenIcon = (props: SVGAttributes<SVGSVGElement>) => (
  <Icon icon={fullScreenLinear} {...props} />
);
export const ExitFullscreenIcon = (props: SVGAttributes<SVGSVGElement>) => (
  <Icon icon={quitFullScreenLinear} {...props} />
);
export const DownloadIcon = () => <Icon icon={downloadMinimalisticLinear} />;
export const ShareIcon = () => <Icon icon={shareLinear} />;
export const CaptionsIcon = () => <Icon icon={subtitlesLinear} />;
export const ThumbnailsIcon = () => <Icon icon={galleryWideLinear} />;
export const CloseIcon = () => <Icon icon={closeLinear} />;
export const PrevIcon = () => <Icon icon={altArrowLeftLinear} />;
export const NextIcon = () => <Icon icon={altArrowRightLinear} />;

/** The play badge over a video's thumbnail. */
export const VideoBadgeIcon = () => <Icon icon={playCircleLinear} />;
