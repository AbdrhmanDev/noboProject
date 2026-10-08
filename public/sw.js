// Minimal service worker: satisfies the browser's desktop-install criteria (a registered SW with
// a fetch handler) without adding any offline/caching behavior -- every request still goes
// straight to the network, unchanged. Not a PWA offline mode, just what unlocks the native
// "Install app" prompt that gives NOBO a real desktop/Start-Menu icon and its own app window.
self.addEventListener("fetch", () => {});
