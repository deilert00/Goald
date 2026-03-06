import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Constants.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function scheduleMonthlyReminder(goalName: string): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '💰 Time to deposit!',
      body: `Don't forget your monthly contribution to "${goalName}"`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      repeats: true,
      day: 1,
      hour: 9,
      minute: 0,
    },
  });
  return id;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

type NotificationType = 'milestone' | 'completion';

async function hasNotificationBeenSent(
  userId: string,
  goalId: string,
  type: NotificationType,
  milestone?: number
): Promise<boolean> {
  const constraints = [
    where('userId', '==', userId),
    where('goalId', '==', goalId),
    where('type', '==', type),
  ];

  if (typeof milestone === 'number') {
    constraints.push(where('milestone', '==', milestone));
  }

  const q = query(collection(db, 'notifications'), ...constraints);
  const snap = await getDocs(q);
  return !snap.empty;
}

async function recordNotification(
  userId: string,
  goalId: string,
  goalName: string,
  type: NotificationType,
  title: string,
  body: string,
  milestone?: number
): Promise<void> {
  await addDoc(collection(db, 'notifications'), {
    userId,
    goalId,
    goalName,
    type,
    title,
    body,
    ...(typeof milestone === 'number' ? { milestone } : {}),
    sentAt: serverTimestamp(),
  });
}

async function sendImmediateLocalNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

export async function sendMilestoneNotification(
  userId: string,
  goalId: string,
  goalName: string,
  milestone: number
): Promise<void> {
  const alreadySent = await hasNotificationBeenSent(userId, goalId, 'milestone', milestone);
  if (alreadySent) return;

  const title = `🎯 ${milestone}% Milestone Reached`;
  const body = `"${goalName}" just hit ${milestone}%. Keep the momentum going.`;

  await sendImmediateLocalNotification(title, body);
  await recordNotification(userId, goalId, goalName, 'milestone', title, body, milestone);
}

export async function sendGoalCompletedNotification(
  userId: string,
  goalId: string,
  goalName: string
): Promise<void> {
  const alreadySent = await hasNotificationBeenSent(userId, goalId, 'completion');
  if (alreadySent) return;

  const title = '🏆 Goal Complete!';
  const body = `Amazing work. You completed "${goalName}".`;

  await sendImmediateLocalNotification(title, body);
  await recordNotification(userId, goalId, goalName, 'completion', title, body);
}
