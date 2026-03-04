import "../../global.css";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  useFonts,
  Orbitron_700Bold,
  Orbitron_400Regular,
} from "@expo-google-fonts/orbitron";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useSession } from "@/lib/auth/use-session";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const spaceTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0B0E1A",
    card: "#151929",
    text: "#FFFFFF",
    border: "#1E2340",
    primary: "#C51111",
  },
};

function RootLayoutNav() {
  const { data: session, isLoading } = useSession();

  if (isLoading) return null;

  return (
    <ThemeProvider value={spaceTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0B0E1A" },
          animation: "fade",
        }}
      >
        <Stack.Protected guard={!!session?.user}>
          <Stack.Screen name="(app)" />
          <Stack.Screen
            name="paywall"
            options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="settings"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!session?.user}>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="verify-otp" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    Orbitron_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      setReady(true);
    }
  }, [fontsLoaded]);

  if (!ready) return null;

  return (
    <View
      style={{ flex: 1, backgroundColor: "#0B0E1A" }}
      onLayout={() => ready && SplashScreen.hideAsync()}
    >
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <RootLayoutNav />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </View>
  );
}
