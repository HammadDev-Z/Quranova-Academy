const paths = {
  home: "M3 11.5L12 4l9 7.5M5 10v10h5v-6h4v6h5V10",
  calendar: "M7 3v3M17 3v3M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM4 9h16M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01",
  "calendar-clock": "M7 3v3M17 3v3M5 5h14a1 1 0 011 1v5M4 9h16M4 6v13a1 1 0 001 1h6M17 22a5 5 0 100-10 5 5 0 000 10zM17 14.5V17l1.5 1",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20a7.5 7.5 0 0115 0",
  document: "M7 3h7l5 5v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v5h5M9 13h6M9 17h4",
  monitor: "M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM9 20h6M12 16v4",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  refresh: "M20 11a8 8 0 00-14.9-3M4 4v4h4M4 13a8 8 0 0014.9 3M20 20v-4h-4",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  "chevron-right": "M9 6l6 6-6 6",
  "chevron-down": "M6 9l6 6 6-6",
  "arrow-up": "M12 19V5M5 12l7-7 7 7",
  "arrow-down": "M12 5v14M19 12l-7 7-7-7",
  swap: "M7 7h13l-3-3M17 17H4l3 3",
  check: "M5 12l5 5L20 7",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  notes: "M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1zM9 8h6M9 12h6M9 16h3",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  chat: "M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H9l-5 4V6a1 1 0 011-1z",
  logout: "M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l5-5-5-5M15 12H3",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "more" ? 3.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[name]} />
    </svg>
  );
}

/** Green seal with a check, shown next to a verified (active) teacher's name. */
export function VerifiedSeal({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Verified teacher" role="img">
      <path
        d="M12 1.8l2.3 1.5 2.7-.1 1.2 2.4 2.3 1.4-.1 2.7 1.5 2.3-1.5 2.3.1 2.7-2.3 1.4-1.2 2.4-2.7-.1L12 22.2l-2.3-1.5-2.7.1-1.2-2.4-2.3-1.4.1-2.7L2.1 12l1.5-2.3-.1-2.7 2.3-1.4L7 3.2l2.7.1L12 1.8z"
        fill="#86efac"
      />
      <path d="M8.2 12.2l2.6 2.6 5-5.2" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
