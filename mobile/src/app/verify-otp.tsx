import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { OtpInput } from "react-native-otp-entry";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { authClient } from "@/lib/auth/auth-client";
import { useInvalidateSession } from "@/lib/auth/use-session";
import { StarField } from "./sign-in";
import { ChevronLeft } from "lucide-react-native";

export default function VerifyOTP() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const invalidateSession = useInvalidateSession();

  const handleVerify = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.emailOtp({
        email: email?.trim() || "",
        otp,
      });
      if (result.error) {
        setError(result.error.message || "Invalid code");
        setLoading(false);
      } else {
        await invalidateSession();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0E1A" }}>
      <StarField />
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity
          testID="back-button"
          onPress={() => router.back()}
          style={{ padding: 20 }}
        >
          <ChevronLeft size={28} color="#8B92A5" />
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Animated.View entering={FadeInUp.duration(800)}>
            <Text
              style={{
                fontFamily: "Orbitron_700Bold",
                fontSize: 24,
                color: "#FFFFFF",
                textAlign: "center",
              }}
            >
              Enter Code
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#8B92A5",
                textAlign: "center",
                marginTop: 8,
                marginBottom: 40,
              }}
            >
              We sent a verification code to{"\n"}
              <Text style={{ color: "#38FEDC" }}>{email}</Text>
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(200)}>
            <OtpInput
              numberOfDigits={6}
              onFilled={handleVerify}
              type="numeric"
              focusColor="#C51111"
              theme={{
                containerStyle: { gap: 8 },
                pinCodeContainerStyle: {
                  backgroundColor: "#151929",
                  borderColor: "#1E2340",
                  borderRadius: 12,
                  width: 48,
                  height: 56,
                },
                pinCodeTextStyle: {
                  color: "#FFFFFF",
                  fontSize: 20,
                  fontFamily: "Orbitron_700Bold",
                },
                focusedPinCodeContainerStyle: {
                  borderColor: "#C51111",
                },
              }}
            />

            {error ? (
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  color: "#C51111",
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                {error}
              </Text>
            ) : null}

            {loading ? (
              <ActivityIndicator color="#C51111" style={{ marginTop: 24 }} />
            ) : null}
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}
