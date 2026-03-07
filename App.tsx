import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import ToastHost from './src/components/ToastHost';
import { initializeGlobalErrorTracking } from './src/services/errorTrackingService';

export default function App() {
  useEffect(() => {
    initializeGlobalErrorTracking();
  }, []);

  return (
    <>
      <AppNavigator />
      <ToastHost />
      <StatusBar style="auto" />
    </>
  );
}
