export async function registerPushService(userId: string) {
  console.log("register push service called")
  const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY; 

  // Register service worker
  const register = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

  // Ask for permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return alert('Please enable notifications');

  // Subscribe to push service
  const existingSubscription = await register.pushManager.getSubscription();
if (existingSubscription) {
  await existingSubscription.unsubscribe();
}
  const subscription = await register.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
  });

  // Send to backend
  await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, subscription }),
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
