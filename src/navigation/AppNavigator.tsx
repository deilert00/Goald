import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import LandingScreen from '../screens/auth/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import AppTabs from './AppTabs';
import CreateGoalScreen from '../screens/goals/CreateGoalScreen';
import GoalDetailScreen from '../screens/goals/GoalDetailScreen';
import DepositScreen from '../screens/goals/DepositScreen';
import EditGoalScreen from '../screens/goals/EditGoalScreen';
import CelebrationScreen from '../screens/CelebrationScreen';

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  AppTabs: undefined;
  CreateGoal: undefined;
  GoalDetail: { goalId: string };
  EditGoal: { goalId: string };
  Deposit: { goalId: string };
  Celebration: { goalId: string; goalName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="AppTabs" component={AppTabs} />
            <Stack.Screen
              name="CreateGoal"
              component={CreateGoalScreen}
              options={{ headerShown: true, title: 'New Goal', presentation: 'modal' }}
            />
            <Stack.Screen
              name="GoalDetail"
              component={GoalDetailScreen}
              options={{ headerShown: true, title: 'Goal Details' }}
            />
            <Stack.Screen
              name="EditGoal"
              component={EditGoalScreen}
              options={{ headerShown: true, title: 'Edit Goal', presentation: 'modal' }}
            />
            <Stack.Screen
              name="Deposit"
              component={DepositScreen}
              options={{ headerShown: true, title: 'Add Deposit', presentation: 'modal' }}
            />
            <Stack.Screen
              name="Celebration"
              component={CelebrationScreen}
              options={{ headerShown: false, presentation: 'fullScreenModal' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
