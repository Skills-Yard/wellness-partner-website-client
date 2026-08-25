import { getFirebaseApp, firebaseVapidKey, isFirebaseConfigured } from "./config";

const SW_URL = "/firebase-messaging-sw.js";

const canUsePush = () =>
  typeof window !== "undefined" &&
  isFirebaseConfigured &&
  "serviceWorker" in navigator &&
  "Notification" in window;

async function getMessagingInstance() {
  const { getMessaging, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) return null;
  return getMessaging(getFirebaseApp());
}

async function registerServiceWorker() {
  return navigator.serviceWorker.getRegistration(SW_URL).then(
    (existing) => existing ?? navigator.serviceWorker.register(SW_URL),
  );
}

/** Prompts the browser's native permission dialog and, once granted, returns
 *  a fresh FCM token. Call this from a user gesture (e.g. a "Notify me"
 *  button or right after login) — browsers may ignore/auto-dismiss a prompt
 *  that isn't tied to one. Returns null if unsupported, misconfigured, or
 *  the user denies/dismisses the prompt. */
export async function requestPushPermissionAndToken(): Promise<string | null> {
  if (!canUsePush()) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const [messaging, registration] = await Promise.all([
      getMessagingInstance(),
      registerServiceWorker(),
    ]);
    if (!messaging) return null;

    const { getToken } = await import("firebase/messaging");
    return await getToken(messaging, {
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: registration,
    });
  } catch (error) {
    console.error("Failed to obtain FCM token:", error);
    return null;
  }
}

/** Silent variant for app load: returns the current token only if permission
 *  was already granted in an earlier visit — never shows a prompt. Used to
 *  keep a rotated/expired token in sync with the backend without surprising
 *  a returning partner with a permission dialog. */
export async function getExistingPushToken(): Promise<string | null> {
  if (!canUsePush() || Notification.permission !== "granted") return null;

  try {
    const [messaging, registration] = await Promise.all([
      getMessagingInstance(),
      registerServiceWorker(),
    ]);
    if (!messaging) return null;

    const { getToken } = await import("firebase/messaging");
    return await getToken(messaging, {
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: registration,
    });
  } catch (error) {
    console.error("Failed to refresh FCM token:", error);
    return null;
  }
}

/** Raises the same native OS/browser notification a backgrounded tab would
 *  get, reusing the service worker's registration so it also gets the SW's
 *  notificationclick handling. A toast easy to miss while focused elsewhere
 *  in the dashboard, so foreground pushes get this too — no-op if permission
 *  isn't granted. */
async function showForegroundNotification(title: string, body: string) {
  if (Notification.permission !== "granted") return;

  try {
    const registration = await registerServiceWorker();
    await registration.showNotification(title, {
      body,
      icon: "/favicon.ico",
    });
  } catch (error) {
    console.error("Failed to show foreground notification:", error);
  }
}

/** Fires when the service worker relays a background push it just displayed
 *  (see the SW's onBackgroundMessage). The worker can't call the API itself —
 *  it has no access to the token in page memory — so an open tab acks on its
 *  behalf. Returns a no-op unsubscribe where service workers aren't available
 *  so callers can always call it. */
export function onServiceWorkerDelivery(
  callback: (notificationId: string) => void,
): () => void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }

  const handler = (event: MessageEvent) => {
    if (event.data?.type === "PUSH_DELIVERED" && event.data.notificationId) {
      callback(event.data.notificationId as string);
    }
  };

  navigator.serviceWorker.addEventListener("message", handler);
  return () => navigator.serviceWorker.removeEventListener("message", handler);
}

/** Fires for a push that arrives while the tab is open and focused — the
 *  service worker's onBackgroundMessage never sees these. `data` is the raw
 *  FCM data payload (e.g. `{ bookingId }` for a booking-related push —
 *  callers key off this to tell an on-demand broadcast offer apart from a
 *  purely informational push). Returns a no-op unsubscribe when push isn't
 *  available so callers can always call it. */
export async function onForegroundPushMessage(
  callback: (title: string, body: string, data: Record<string, string>) => void,
): Promise<() => void> {
  if (!canUsePush()) return () => {};

  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  const { onMessage } = await import("firebase/messaging");
  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "Eezit Partner";
    const body = payload.notification?.body ?? "";
    const data = payload.data ?? {};

    callback(title, body, data);
    void showForegroundNotification(title, body);
  });
}
