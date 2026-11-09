import type { ReactElement, SVGAttributes } from "react";

/** Decorative 24px stroke icons of the lightbox (original drawings). */
function Icon({
  children,
  ...props
}: SVGAttributes<SVGSVGElement> & { children: ReactElement | ReactElement[] }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ZoomInIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
  </Icon>
);

export const ZoomOutIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5M8 11h6" />
  </Icon>
);

export const RotateClockwiseIcon = () => (
  <Icon>
    <path d="M19.5 12A7.5 7.5 0 1 1 17.3 6.7M19.5 4v4.5H15" />
  </Icon>
);

export const RotateCounterClockwiseIcon = () => (
  <Icon>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v4.5H9" />
  </Icon>
);

export const PlayIcon = (props: SVGAttributes<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
  </Icon>
);

export const PauseIcon = (props: SVGAttributes<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M8.5 5.5v13M15.5 5.5v13" strokeWidth="2.6" />
  </Icon>
);

export const EnterFullscreenIcon = (props: SVGAttributes<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
  </Icon>
);

export const ExitFullscreenIcon = (props: SVGAttributes<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M9 4v5H4M15 4v5h5M20 15h-5v5M4 15h5v5" />
  </Icon>
);

export const DownloadIcon = () => (
  <Icon>
    <path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />
  </Icon>
);

export const ShareIcon = () => (
  <Icon>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" />
  </Icon>
);

export const CaptionsIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M7 15h4M14 15h3M7 11.5h10" />
  </Icon>
);

export const ThumbnailsIcon = () => (
  <Icon>
    <rect x="3" y="3.5" width="18" height="12" rx="2" />
    <path d="M3.5 20h3M10.5 20h3M17.5 20h3" />
  </Icon>
);

export const CloseIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const PrevIcon = () => (
  <Icon>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const NextIcon = () => (
  <Icon>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

/** The play badge over a video's thumbnail. */
export const VideoBadgeIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.32" />
    <path d="M10 8.3v7.4l6-3.7z" fill="currentColor" />
  </svg>
);
