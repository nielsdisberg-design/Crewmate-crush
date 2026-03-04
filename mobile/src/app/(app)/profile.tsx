import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  LogOut,
  Shield,
  MapPin,
  Gamepad2,
  Flame,
  Crown,
} from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { api } from "@/lib/api/api";
import { authClient } from "@/lib/auth/auth-client";
import { useSession, useInvalidateSession } from "@/lib/auth/use-session";
import { CREWMATE_COLORS, MAPS, PLAY_STYLES, ROLES } from "@/lib/types";
import type { Profile } from "@/lib/types";
import { CrewmateSvg } from "@/components/CrewmateSvg";
import { isRevenueCatEnabled, hasEntitlement } from "@/lib/revenuecatClient";

export default function ProfileScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const invalidateSession = useInvalidateSession();

  const [isPremium, setIsPremium] = useState(false);
  const [rcEnabled] = useState(() => isRevenueCatEnabled());

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api.get<Profile | null>("/api/profiles/me"),
  });

  useEffect(() => {
    if (!rcEnabled) return;
    hasEntitlement("premium").then((result) => {
      if (result.ok) setIsPremium(result.data);
    });
  }, [rcEnabled]);

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to eject?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Eject",
        style: "destructive",
        onPress: async () => {
          await authClient.signOut();
          await invalidateSession();
        },
      },
    ]);
  };

  const colorHex =
    CREWMATE_COLORS.find((c) => c.id === profile?.crewmateColor)?.hex ||
    "#C51111";
  const mapObj = MAPS.find((m) => m.id === profile?.favoriteMap);
  const roleObj = ROLES.find((r) => r.id === profile?.favoriteRole);
  const styleObj = PLAY_STYLES.find((p) => p.id === profile?.playStyle);

  return (
    <View
      testID="profile-screen"
      style={{ flex: 1, backgroundColor: "#0B0E1A" }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header with crewmate */}
          <LinearGradient
            colors={[colorHex, "#0B0E1A"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              paddingTop: 24,
              paddingBottom: 40,
              alignItems: "center",
            }}
          >
            <Animated.View entering={FadeIn.duration(800)}>
              <CrewmateSvg color={colorHex} size={120} />
            </Animated.View>
          </LinearGradient>

          <View style={{ paddingHorizontal: 24, marginTop: -20 }}>
            {/* Name + Premium badge (if premium) */}
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 28,
                  color: "#FFFFFF",
                  textAlign: "center",
                }}
              >
                {profile?.displayName ||
                  session?.user?.name ||
                  "Crewmate"}
              </Text>

              {/* Premium Member badge — shown if user is premium */}
              {rcEnabled && isPremium ? (
                <Animated.View
                  entering={FadeIn.duration(600)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: "#38FEDC",
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    marginTop: 10,
                  }}
                >
                  <Crown size={13} color="#0B0E1A" fill="#0B0E1A" />
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 12,
                      color: "#0B0E1A",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Premium Member
                  </Text>
                </Animated.View>
              ) : null}
            </View>

            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#8B92A5",
                textAlign: "center",
                marginTop: 4,
              }}
            >
              {session?.user?.email}
            </Text>

            {profile?.bio ? (
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  color: "#8B92A5",
                  textAlign: "center",
                  marginTop: 12,
                  lineHeight: 20,
                }}
              >
                {profile.bio}
              </Text>
            ) : null}

            {/* Stats */}
            <View style={{ marginTop: 28, gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#151929",
                    borderRadius: 16,
                    padding: 18,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <Shield size={16} color="#38FEDC" />
                    <Text
                      style={{
                        fontFamily: "Inter_500Medium",
                        fontSize: 12,
                        color: "#8B92A5",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Role
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 17,
                      color: "#FFFFFF",
                    }}
                  >
                    {roleObj?.label || "Crewmate"}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#151929",
                    borderRadius: 16,
                    padding: 18,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <MapPin size={16} color="#38FEDC" />
                    <Text
                      style={{
                        fontFamily: "Inter_500Medium",
                        fontSize: 12,
                        color: "#8B92A5",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Map
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 17,
                      color: "#FFFFFF",
                    }}
                  >
                    {mapObj?.label || "The Skeld"}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#151929",
                    borderRadius: 16,
                    padding: 18,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <Gamepad2 size={16} color="#38FEDC" />
                    <Text
                      style={{
                        fontFamily: "Inter_500Medium",
                        fontSize: 12,
                        color: "#8B92A5",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Style
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 17,
                      color: "#FFFFFF",
                    }}
                  >
                    {styleObj?.emoji} {styleObj?.label}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#151929",
                    borderRadius: 16,
                    padding: 18,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <Flame size={16} color="#C51111" />
                    <Text
                      style={{
                        fontFamily: "Inter_500Medium",
                        fontSize: 12,
                        color: "#8B92A5",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Sus Level
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 4,
                      marginTop: 4,
                    }}
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <View
                        key={i}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor:
                            i < (profile?.susLevel || 0)
                              ? "#C51111"
                              : "#1E2340",
                        }}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Go Premium Banner — only shown if NOT premium and RC is enabled */}
            {rcEnabled && !isPremium ? (
              <Animated.View
                entering={FadeIn.duration(600)}
                testID="go-premium-banner"
                style={{ marginTop: 32 }}
              >
                <LinearGradient
                  colors={["#2A0808", "#1A0505", "#0B0E1A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 20,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: "rgba(197,17,17,0.4)",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: "rgba(197,17,17,0.2)",
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(197,17,17,0.4)",
                      }}
                    >
                      <Crown size={18} color="#C51111" fill="#C51111" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "Orbitron_700Bold",
                          fontSize: 14,
                          color: "#FFFFFF",
                          letterSpacing: 0.5,
                        }}
                      >
                        Unlock Premium Features
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter_400Regular",
                          fontSize: 12,
                          color: "#8B92A5",
                          marginTop: 2,
                        }}
                      >
                        Filters, unlimited swipes & more
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    testID="view-plans-button"
                    onPress={() => router.push("/(app)/paywall")}
                    style={{
                      marginTop: 4,
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <LinearGradient
                      colors={["#C51111", "#8B0000"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingVertical: 13,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <Crown size={15} color="#FFFFFF" fill="#FFFFFF" />
                      <Text
                        style={{
                          fontFamily: "Inter_700Bold",
                          fontSize: 14,
                          color: "#FFFFFF",
                        }}
                      >
                        View Plans
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </LinearGradient>
              </Animated.View>
            ) : null}

            {/* Sign Out */}
            <TouchableOpacity
              testID="sign-out-button"
              onPress={handleSignOut}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: rcEnabled && !isPremium ? 16 : 40,
                padding: 18,
                borderRadius: 16,
                backgroundColor: "#151929",
                borderWidth: 1,
                borderColor: "#1E2340",
              }}
            >
              <LogOut size={18} color="#C51111" />
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 15,
                  color: "#C51111",
                }}
              >
                Eject (Sign Out)
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
