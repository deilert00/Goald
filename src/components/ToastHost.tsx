import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { subscribeToToasts, ToastMessage } from '../services/toastService';

type LiveToast = ToastMessage & { opacity: Animated.Value; translateY: Animated.Value };

export default function ToastHost() {
  const [toasts, setToasts] = useState<LiveToast[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const unsubscribe = subscribeToToasts((message) => {
      const liveToast: LiveToast = {
        ...message,
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(-12),
      };

      setToasts((prev) => [liveToast, ...prev].slice(0, 3));

      Animated.parallel([
        Animated.timing(liveToast.opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(liveToast.translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      timers.current[message.id] = setTimeout(() => {
        Animated.parallel([
          Animated.timing(liveToast.opacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(liveToast.translateY, {
            toValue: -8,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setToasts((prev) => prev.filter((toast) => toast.id !== message.id));
        });
      }, message.durationMs);
    });

    return () => {
      unsubscribe();
      Object.values(timers.current).forEach((timer) => clearTimeout(timer));
      timers.current = {};
    };
  }, []);

  const toastTypeStyles = useMemo(
    () => ({
      success: styles.toastSuccess,
      error: styles.toastError,
      info: styles.toastInfo,
    }),
    []
  );

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      {toasts.map((toast) => (
        <Animated.View
          key={toast.id}
          style={[
            styles.toast,
            toastTypeStyles[toast.type],
            {
              opacity: toast.opacity,
              transform: [{ translateY: toast.translateY }],
            },
          ]}
        >
          <Text style={styles.toastText}>{toast.text}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 58,
    left: 14,
    right: 14,
    zIndex: 999,
  },
  toast: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },
  toastSuccess: {
    backgroundColor: '#E8F7E9',
    borderColor: '#83C787',
  },
  toastError: {
    backgroundColor: '#FCECEC',
    borderColor: '#E38A8A',
  },
  toastInfo: {
    backgroundColor: '#E9F2FB',
    borderColor: '#86ABD2',
  },
  toastText: {
    color: '#1E2C1F',
    fontSize: 13,
    fontWeight: '600',
  },
});
