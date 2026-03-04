import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { authClient } from "@/lib/auth/auth-client";
import { CrewmateSvg } from "@/components/CrewmateSvg";

const { width } = Dimensions.get("window");

const STAR_DATA = Array.from({ length: 40 }, (_, i) => ({
  key: String(i),
  left: (i * 97 + 13) % width,
  top: (i * 53 + 7) % 300,
  size: ((i * 31) % 3) + 1,
  opacity: ((i * 47) % 7) / 10 + 0.3,
}));

function StarField() {
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300 }}>
      {STAR_DATA.map((star) => (
        <View
          key={star.key}
          style={{
            position: "absolute",
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: "#FFFFFF",
            opacity: star.opacity,
          }}
        />
      ))}
    </View>
  );
}

export { StarField };

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "sign-in",
      });
      if (result.error) {
        setError(result.error.message || "Failed to send code");
      } else {
        router.push({
          pathname: "/verify-otp" as any,
          params: { email: email.trim().toLowerCase() },
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0E1A" }}>
      <StarField />
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{ flex: 1, justifyContent: "center", paddingHorizontal: 32 }}
        >
          <Animated.View
            entering={FadeInUp.duration(800)}
            style={{ alignItems: "center", marginBottom: 40 }}
          >
            <View
              style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}
            >
              <CrewmateSvg color="#C51111" size={60} />
              <CrewmateSvg color="#38FEDC" size={60} />
            </View>
            <Text
              style={{
                fontFamily: "Orbitron_700Bold",
                fontSize: 36,
                color: "#FFFFFF",
                textAlign: "center",
              }}
            >
              CrewMate
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 16,
                color: "#8B92A5",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Find your player two
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(200)}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 13,
                color: "#8B92A5",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}
            >
              Email Address
            </Text>
            <TextInput
              testID="email-input"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="crewmate@example.com"
              placeholderTextColor="#3D4460"
              style={{
                backgroundColor: "#151929",
                borderRadius: 16,
                padding: 18,
                fontSize: 16,
                color: "#FFFFFF",
                fontFamily: "Inter_400Regular",
                borderWidth: 1,
                borderColor: "#1E2340",
              }}
            />

            {error ? (
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  color: "#C51111",
                  marginTop: 12,
                }}
              >
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              testID="send-code-button"
              onPress={handleSendOTP}
              disabled={loading}
              activeOpacity={0.8}
              style={{ marginTop: 24 }}
            >
              <LinearGradient
                colors={["#C51111", "#8B0000"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  padding: 18,
                  alignItems: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 16,
                      color: "#FFFFFF",
                    }}
                  >
                    Send Code
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}
