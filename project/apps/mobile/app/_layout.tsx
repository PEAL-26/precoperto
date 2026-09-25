import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ActivityIndicator, View } from 'react-native';
import { styles } from '@/lib/styles';

function RootNavigator() {
  const { loading } = useAuth();
  if (loading)
    return (
      <View style={styles.screen}>
        <ActivityIndicator size="large" color="#19734A" style={{ marginTop: 120 }} />
      </View>
    );
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f4f8f4' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="products/[cuid]" />
      <Stack.Screen name="store/[cuid]" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
