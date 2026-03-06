import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import DashboardScreen from '../screens/goals/DashboardScreen';
import BadgesScreen from '../screens/BadgesScreen';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          const icon = route.name === 'Dashboard' ? '🏠' : '🏅';
          return <Text style={{ fontSize: focused ? 26 : 22 }}>{icon}</Text>;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Badges" component={BadgesScreen} />
    </Tab.Navigator>
  );
}
