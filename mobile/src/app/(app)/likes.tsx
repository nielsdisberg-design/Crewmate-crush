import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Crown, Lock, Zap, Users } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api/api";
import { CREWMATE_COLORS } from "@/lib/types";
import type { LikedProfile, LikesResponse, RevealedProfile } from "@/lib/types";
import { CrewmateSvg } from "@/components/CrewmateSvg";
import { isRevenueCatEnabled, hasEntitlement } from "@/lib/revenuecatClient";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

function useCountdown(resetsAt: string | null): string | null {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!resetsAt) {
      setCountdown(null);
      return;
    }

    const update = () => {
      const ms = new Date(resetsAt).getTime() - Date.now();
      if (ms <= 0) {
        setCountdown("0m");
        return;
      }
      const totalMin = Math.floor(ms / 60000);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      setCountdown(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [resetsAt]);

  return countdown;
}

function PremiumProfileCard({
  profile,
  index,
}: {
  profile: LikedProfile;
  index: number;
}) {
  const colorObj = CREWMATE_COLORS.find((c) => c.id === profile.crewmateColor);
  const colorHex = colorObj?.hex || "#C51111";

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
      style={{
        width: CARD_WIDTH,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#151929",
        borderWidth: 1,
        borderColor: "#1E2340",
      }}
    >
      {/* Card image / crewmate */}
      {profile.photoUrl ? (
        <View style={{ height: CARD_WIDTH, position: "relative" }}>
          <Image
            source={{ uri: profile.photoUrl }}
            style={{ width: CARD_WIDTH, height: CARD_WIDTH }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(11,14,26,0.85)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: CARD_WIDTH * 0.5,
            }}
          />
        </View>
      ) : (
        <LinearGradient
          colors={[colorHex + "55", "#0B0E1A"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            height: CARD_WIDTH,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CrewmateSvg color={colorHex} size={CARD_WIDTH * 0.55} />
        </LinearGradient>
      )}

      {/* Card info */}
      <View style={{ padding: 12 }}>
        <Text
          style={{
            fontFamily: "Orbitron_700Bold",
            fontSize: 14,
            color: "#FFFFFF",
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {profile.displayName}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {profile.age !== null ? (
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: "#8B92A5",
              }}
            >
              {profile.age}
            </Text>
          ) : null}
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colorHex,
            }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

function BlurredProfileCard({
  profile,
  index,
  isRevealMode,
  onPress,
}: {
  profile: LikedProfile;
  index: number;
  isRevealMode: boolean;
  onPress: () => void;
}) {
  const colorObj = CREWMATE_COLORS.find((c) => c.id === profile.crewmateColor);
  const colorHex = colorObj?.hex || "#C51111";

  if (!profile.isBlurred) {
    // Show revealed profile normally
    return (
      <PremiumProfileCard profile={profile} index={index} />
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
      style={{
        width: CARD_WIDTH,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#151929",
        borderWidth: isRevealMode ? 2 : 1,
        borderColor: isRevealMode ? "#38FEDC" : "#1E2340",
      }}
    >
      <Pressable onPress={onPress} testID={`blurred-card-${profile.userId}`}>
        {/* Blurred visual */}
        <View style={{ height: CARD_WIDTH, position: "relative" }}>
          {/* Colored gradient as "blurred" bg */}
          <LinearGradient
            colors={[colorHex + "33", "#0B0E1A"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              width: CARD_WIDTH,
              height: CARD_WIDTH,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Ghostly crewmate at low opacity */}
            <View style={{ opacity: 0.15 }}>
              <CrewmateSvg color={colorHex} size={CARD_WIDTH * 0.55} />
            </View>
          </LinearGradient>

          {/* Dark frosted overlay */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(11,14,26,0.72)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isRevealMode ? (
              <View style={{ alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "rgba(56,254,220,0.2)",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 1.5,
                    borderColor: "#38FEDC",
                  }}
                >
                  <Zap size={20} color="#38FEDC" fill="#38FEDC" />
                </View>
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 11,
                    color: "#38FEDC",
                    textAlign: "center",
                  }}
                >
                  Tap to Reveal
                </Text>
              </View>
            ) : (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(197,17,17,0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1.5,
                  borderColor: "#C51111",
                }}
              >
                <Lock size={20} color="#C51111" />
              </View>
            )}
          </View>
        </View>

        {/* Card info */}
        <View style={{ padding: 12 }}>
          <Text
            style={{
              fontFamily: "Orbitron_700Bold",
              fontSize: 14,
              color: "#3D4460",
              marginBottom: 2,
            }}
          >
            ???
          </Text>
          <View
            style={{
              width: 40,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#1E2340",
            }}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function LikesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPremium, setIsPremium] = useState(false);
  const [rcEnabled] = useState(() => isRevenueCatEnabled());
  const [isRevealMode, setIsRevealMode] = useState(false);

  useEffect(() => {
    if (!rcEnabled) return;
    hasEntitlement("premium").then((result) => {
      if (result.ok) setIsPremium(result.data);
    });
  }, [rcEnabled]);

  const { data: likesData, isLoading } = useQuery({
    queryKey: ["likes", isPremium],
    queryFn: () =>
      api.get<LikesResponse>(`/api/likes?isPremium=${isPremium}`),
  });

  const revealCountdown = useCountdown(likesData?.nextRevealAt ?? null);

  const { mutate: revealMutate, isPending: isRevealing } = useMutation({
    mutationFn: (userId: string) =>
      api.post<RevealedProfile>(`/api/likes/reveal/${userId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["likes"] });
      setIsRevealMode(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleCardPress = (profile: LikedProfile) => {
    if (isPremium || !profile.isBlurred) return;

    if (isRevealMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      revealMutate(profile.userId);
      return;
    }

    if (likesData?.canReveal) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsRevealMode(true);
    } else {
      router.push("/(app)/paywall");
    }
  };

  const profiles = likesData?.profiles ?? [];
  const canReveal = likesData?.canReveal ?? false;

  if (isLoading) {
    return (
      <View
        testID="likes-loading"
        style={{
          flex: 1,
          backgroundColor: "#0B0E1A",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#C51111" />
      </View>
    );
  }

  return (
    <View testID="likes-screen" style={{ flex: 1, backgroundColor: "#0B0E1A" }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontFamily: "Orbitron_700Bold",
              fontSize: 22,
              color: "#FFFFFF",
            }}
          >
            Who Likes You
          </Text>
          {isPremium ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "rgba(197,17,17,0.15)",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#C51111",
              }}
            >
              <Crown size={12} color="#C51111" fill="#C51111" />
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 11,
                  color: "#C51111",
                }}
              >
                Premium
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/(app)/paywall")}
              testID="likes-upgrade-header-button"
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  backgroundColor: "rgba(56,254,220,0.1)",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "#38FEDC",
                }}
              >
                <Crown size={12} color="#38FEDC" />
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 11,
                    color: "#38FEDC",
                  }}
                >
                  Upgrade
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Reveal button — free users only */}
          {!isPremium && profiles.some((p) => p.isBlurred) ? (
            <View style={{ marginBottom: 16 }}>
              {canReveal && !isRevealMode ? (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setIsRevealMode(true);
                  }}
                  testID="reveal-button"
                >
                  <LinearGradient
                    colors={["#38FEDC", "#00C9A7"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 16,
                      paddingVertical: 14,
                      paddingHorizontal: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Zap size={18} color="#0B0E1A" fill="#0B0E1A" />
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 15,
                        color: "#0B0E1A",
                      }}
                    >
                      Reveal 1 Profile
                    </Text>
                  </LinearGradient>
                </Pressable>
              ) : isRevealMode ? (
                <View
                  style={{
                    backgroundColor: "rgba(56,254,220,0.08)",
                    borderRadius: 16,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderWidth: 1.5,
                    borderColor: "#38FEDC",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                      color: "#38FEDC",
                    }}
                  >
                    Tap a locked profile to reveal
                  </Text>
                  <Pressable
                    onPress={() => setIsRevealMode(false)}
                    testID="cancel-reveal-button"
                  >
                    <Text
                      style={{
                        fontFamily: "Inter_500Medium",
                        fontSize: 13,
                        color: "#8B92A5",
                      }}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: "#151929",
                    borderRadius: 16,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderWidth: 1,
                    borderColor: "#1E2340",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Zap size={16} color="#3D4460" />
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 13,
                      color: "#3D4460",
                    }}
                  >
                    Next reveal in{" "}
                    <Text style={{ color: "#38FEDC" }}>
                      {revealCountdown ?? "..."}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          {/* Profile count pill */}
          {profiles.length > 0 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 16,
              }}
            >
              <Heart size={14} color="#C51111" fill="#C51111" />
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                  color: "#8B92A5",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold" }}>
                  {profiles.length}
                </Text>{" "}
                {profiles.length === 1 ? "crewmate likes" : "crewmates like"}{" "}
                you
              </Text>
            </View>
          ) : null}

          {/* Grid */}
          {profiles.length > 0 ? (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              {profiles.map((profile, index) =>
                isPremium || !profile.isBlurred ? (
                  <PremiumProfileCard
                    key={profile.userId}
                    profile={profile}
                    index={index}
                  />
                ) : (
                  <BlurredProfileCard
                    key={profile.userId}
                    profile={profile}
                    index={index}
                    isRevealMode={isRevealMode}
                    onPress={() => handleCardPress(profile)}
                  />
                )
              )}
            </View>
          ) : (
            /* Empty state */
            <View
              style={{
                alignItems: "center",
                paddingTop: 64,
                paddingHorizontal: 32,
              }}
            >
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: "rgba(197,17,17,0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                  borderWidth: 1.5,
                  borderColor: "#1E2340",
                }}
              >
                <Users size={40} color="#3D4460" />
              </View>
              <Text
                style={{
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 16,
                  color: "#8B92A5",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                No likes yet
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  color: "#3D4460",
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Keep swiping to get noticed by other crewmates!
              </Text>
              <Pressable
                onPress={() => router.push("/(app)/index" as any)}
                style={{
                  marginTop: 20,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: "#151929",
                  borderWidth: 1,
                  borderColor: "#1E2340",
                }}
                testID="go-discover-button"
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                    color: "#38FEDC",
                  }}
                >
                  Go Discover
                </Text>
              </Pressable>
            </View>
          )}

          {/* Upgrade banner — free users only */}
          {!isPremium && rcEnabled ? (
            <Animated.View
              entering={FadeInDown.delay(400).duration(500)}
              style={{ marginTop: 24 }}
            >
              <LinearGradient
                colors={["#1A0A0A", "#0B0E1A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#C51111",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "rgba(197,17,17,0.15)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Crown size={20} color="#C51111" fill="#C51111" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "Orbitron_700Bold",
                        fontSize: 14,
                        color: "#FFFFFF",
                        marginBottom: 2,
                      }}
                    >
                      See everyone who likes you
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Inter_400Regular",
                        fontSize: 12,
                        color: "#8B92A5",
                      }}
                    >
                      Unlock unlimited likes + full visibility
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => router.push("/(app)/paywall")}
                  testID="likes-upgrade-banner-button"
                >
                  <LinearGradient
                    colors={["#C51111", "#8B0000"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 14,
                      paddingVertical: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 15,
                        color: "#FFFFFF",
                      }}
                    >
                      Go Premium — $4.99/mo
                    </Text>
                  </LinearGradient>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          ) : null}

          {/* Loading overlay when revealing */}
          {isRevealing ? (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(11,14,26,0.7)",
                borderRadius: 16,
              }}
            >
              <ActivityIndicator color="#38FEDC" />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
