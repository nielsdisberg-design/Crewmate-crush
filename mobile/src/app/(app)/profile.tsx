import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import {
  LogOut,
  Shield,
  MapPin,
  Gamepad2,
  Flame,
} from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { api } from "@/lib/api/api";
import { authClient } from "@/lib/auth/auth-client";
import { useSession, useInvalidateSession } from "@/lib/auth/use-session";
import { CREWMATE_COLORS, MAPS, PLAY_STYLES, ROLES } from "@/lib/types";
import type { Profile } from "@/lib/types";
import { CrewmateSvg } from "@/components/CrewmateSvg";

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const invalidateSession = useInvalidateSession();

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api.get<Profile | null>("/api/profiles/me"),
  });

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

            {/* Sign Out */}
            <TouchableOpacity
              testID="sign-out-button"
              onPress={handleSignOut}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 40,
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
