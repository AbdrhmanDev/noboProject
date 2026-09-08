// Canonical, hardware-agnostic scan event. Every scan input mechanism (today: keyboard-wedge;
// later: a Serial scanner relayed through the Edge Agent) must normalize into this shape before
// it reaches POS business logic -- POS code must never branch on "was this a keyboard event" or
// "was this a Serial frame".
export type BarcodeScanSource = "KeyboardWedge" | "SerialScanner";

export type BarcodeScan = {
  value: string;
  // Keyboard-wedge input is just keystrokes -- the browser has no way to know the symbology
  // (EAN-13, Code128, ...) that produced them. Left as an explicit "Unknown" rather than omitted,
  // so a future source that *can* report symbology has a place to put it without a type change.
  symbology: "Unknown";
  source: BarcodeScanSource;
  // No per-device identity exists for a keyboard-wedge scan (it arrives as generic keydown
  // events, indistinguishable from any other keyboard). Populated only by future sources that
  // are bound to a registered PhysicalDevice (e.g. a Serial scanner).
  deviceId: string | null;
  scannedAtUtc: string;
};
