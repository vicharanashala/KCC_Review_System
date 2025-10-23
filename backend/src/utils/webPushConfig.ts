import webPush from 'web-push';

webPush.setVapidDetails(
  'mailto:lpulga167@gmail.com', // change this to your email
  process.env.VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export default webPush;
