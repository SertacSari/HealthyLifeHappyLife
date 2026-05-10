import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }
  
  token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function scheduleWaterReminder() {
  // Cancel all existing to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule a local notification that triggers every 2 hours
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Su İçme Vakti! 💧",
      body: "Günlük su hedefine ulaşmak için bir bardak su içmeyi unutma.",
      sound: true,
    },
    trigger: {
      seconds: 60 * 60 * 2, // Every 2 hours
      repeats: true,
    },
  });
}
