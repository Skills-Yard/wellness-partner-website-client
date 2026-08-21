// Serves the Firebase Messaging service worker at the root scope
// (`/firebase-messaging-sw.js`) with the public Firebase Web config embedded
// server-side, since a static file under public/ can't read process.env at
// request time. These NEXT_PUBLIC_* values are safe to expose — they're
// public client identifiers, not secrets (mirrors the Firebase Admin SDK
// credentials used server-side in the backend, which stay out of the
// browser entirely). Registering this worker, requesting permission, and
// fetching a token are all skipped client-side whenever any of these are
// unset — see src/lib/firebase/config.ts.
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const script = `
importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config)});

// Only background (tab not focused / closed) messages land here — a foreground
// message is handled in-app instead, via onMessage() in src/lib/firebase/messaging.ts,
// which raises the same native notification itself (through this SW's registration),
// so it isn't shown twice.
const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;

messaging?.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};

  self.registration.showNotification(title ?? "Eezit Partner", {
    body: body ?? "",
    icon: "/favicon.ico",
    data: payload.data ?? {},
  });
});

// There's no per-booking route in this app (a single-page dashboard that
// switches panels via in-memory state, not URLs), so a click just focuses/opens
// the dashboard itself — whatever prompted the push (a new on-demand offer, a
// booking update) gets picked up once the app is focused, either by the
// foreground listener re-running or by the incoming-broadcasts poll.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((client) => client.url === url);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
`.trimStart();

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
