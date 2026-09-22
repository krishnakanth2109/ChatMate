import { Expo } from 'expo-server-sdk';

// Initialize the Expo SDK globally
export const expo = new Expo();

/**
 * Sends a push notification to a user's Expo push token.
 * 
 * @param {string} pushToken - The recipient's Expo push token.
 * @param {string} title - The title of the notification.
 * @param {string} body - The body message of the notification.
 * @param {object} data - Extra data payload to send with the notification.
 */
export const sendPushNotification = async (pushToken, title, body, data = {}) => {
  // Check that all your push tokens appear to be valid Expo push tokens
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  const messages = [{
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  }];

  const chunks = expo.chunkPushNotifications(messages);

  for (let chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      // console.log('Push notification sent successfully:', ticketChunk);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
};
