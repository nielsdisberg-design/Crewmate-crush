import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Heart,
  MapPin,
  Shield,
  Gamepad2,
  Flame,
  Crown,
  Lock,
  Zap,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api/api";
import { CREWMATE_COLORS, MAPS, PLAY_STYLES, ROLES } from "@/lib/types";
import type { Profile, SwipeResult } from "@/lib/types";
import { CrewmateSvg } from "@/components/CrewmateSvg";
import {
  isRevenueCatEnabled,
  hasEntitlement,
} from "@/lib/revenuecatClient";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.3;

const INTERESTS = [
  "Crewmate",
  "Impostor",
  "Reactor",
  "Electrical",
  "Admin",
  "Navigation",
  "MedBay",
  "Cams",
] as const;

type Interest = (typeof INTERESTS)[number];

// Map interest chip labels to favoriteRole IDs
const INTEREST_TO_ROLE: Record<Interest, string | null> = {
  Crewmate: "crewmate",
  Impostor: "impostor",
  Reactor: null,
  Electrical: null,
  Admin: null,
  Navigation: null,
  MedBay: null,
  Cams: null,
};

type SwipeStatus = {
  likesUsed: number;
  likesRemaining: number;
  limit: number;
  resetsAt: string | null;
};

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

function LikeCounterBar({
  swipeStatus,
  onGoUnlimited,
}: {
  swipeStatus: SwipeStatus | undefined;
  onGoUnlimited: () => void;
}) {
  const countdown = useCountdown(swipeStatus?.resetsAt ?? null);
  const isExhausted = swipeStatus ? swipeStatus.likesRemaining === 0 : false;
  const used = swipeStatus?.likesUsed ?? 0;
  const limit = swipeStatus?.limit ?? 10;
  const progress = limit > 0 ? Math.min(used / limit, 1) : 0;

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 10,
        backgroundColor: "#151929",
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: isExhausted ? "#C51111" : "#1E2340",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Heart
            size={14}
            color={isExhausted ? "#555" : "#C51111"}
            fill={isExhausted ? "#555" : "#C51111"}
          />
          {isExhausted && countdown ? (
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 13,
                color: "#8B92A5",
              }}
            >
              Resets in{" "}
              <Text style={{ color: "#38FEDC" }}>{countdown}</Text>
            </Text>
          ) : (
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 13,
                color: "#FFFFFF",
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  color: isExhausted ? "#555" : "#C51111",
                }}
              >
                {used}
              </Text>
              <Text style={{ color: "#8B92A5" }}> / {limit} likes today</Text>
            </Text>
          )}
        </View>
        <Pressable onPress={onGoUnlimited} testID="go-unlimited-button">
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 12,
              color: "#38FEDC",
            }}
          >
            Go Unlimited →
          </Text>
        </Pressable>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 4,
          backgroundColor: "#0F1225",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 4,
            width: `${progress * 100}%`,
            backgroundColor: isExhausted ? "#555" : "#C51111",
            borderRadius: 2,
          }}
        />
      </View>
    </View>
  );
}

function LimitReachedModal({
  visible,
  resetsAt,
  onClose,
  onUpgrade,
}: {
  visible: boolean;
  resetsAt: string | null;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  const countdown = useCountdown(resetsAt);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.8)",
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
        }}
      >
        <View
          style={{
            backgroundColor: "#151929",
            borderRadius: 24,
            padding: 28,
            width: "100%",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#C51111",
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "rgba(197,17,17,0.15)",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Heart size={28} color="#C51111" fill="#C51111" />
          </View>
          <Text
            style={{
              fontFamily: "Orbitron_700Bold",
              fontSize: 18,
              color: "#FFFFFF",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Like Limit Reached
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#8B92A5",
              textAlign: "center",
              marginBottom: 8,
              lineHeight: 20,
            }}
          >
            You've used all 10 likes for today.
          </Text>
          {countdown ? (
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                color: "#38FEDC",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Resets in {countdown}
            </Text>
          ) : (
            <View style={{ marginBottom: 24 }} />
          )}
          <Pressable
            onPress={onUpgrade}
            testID="limit-upgrade-button"
            style={{ width: "100%", marginBottom: 12 }}
          >
            <LinearGradient
              colors={["#C51111", "#8B0000"]}
              style={{
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Crown size={16} color="#FFFFFF" fill="#FFFFFF" />
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 15,
                    color: "#FFFFFF",
                  }}
                >
                  Upgrade to Premium
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={onClose} testID="limit-close-button">
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 14,
                color: "#3D4460",
                paddingVertical: 8,
              }}
            >
              Wait for reset
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  const colorObj = CREWMATE_COLORS.find(
    (c) => c.id === profile.crewmateColor
  );
  const colorHex = colorObj?.hex || "#C51111";
  const mapObj = MAPS.find((m) => m.id === profile.favoriteMap);
  const roleObj = ROLES.find((r) => r.id === profile.favoriteRole);
  const styleObj = PLAY_STYLES.find((p) => p.id === profile.playStyle);

  const firstPhoto = profile.photos && profile.photos.length > 0
    ? profile.photos.sort((a, b) => a.position - b.position)[0]
    : null;

  return (
    <View
      style={{
        backgroundColor: "#151929",
        borderRadius: 24,
        overflow: "hidden",
        flex: 1,
      }}
    >
      {/* Card header — photo if available, otherwise gradient + crewmate */}
      {firstPhoto ? (
        <View style={{ height: 240, position: "relative" }}>
          <Image
            source={{ uri: firstPhoto.url }}
            style={{ width: "100%", height: 240 }}
            resizeMode="cover"
          />
          {/* Dark gradient overlay at bottom for readability */}
          <LinearGradient
            colors={["transparent", "rgba(11,14,26,0.85)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 100,
            }}
          />
          {/* Crewmate SVG overlaid on photo bottom */}
          <View
            style={{
              position: "absolute",
              bottom: 8,
              right: 16,
              opacity: 0.7,
            }}
          >
            <CrewmateSvg color={colorHex} size={48} />
          </View>
        </View>
      ) : (
        <LinearGradient
          colors={[colorHex, "#0B0E1A"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            height: 200,
            justifyContent: "center",
            alignItems: "center",
            paddingTop: 20,
          }}
        >
          <CrewmateSvg color={colorHex} size={100} />
        </LinearGradient>
      )}

      <View style={{ padding: 24 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontFamily: "Orbitron_700Bold",
              fontSize: 26,
              color: "#FFFFFF",
            }}
          >
            {profile.displayName}
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 18,
              color: "#8B92A5",
            }}
          >
            {profile.age}
          </Text>
        </View>

        {profile.gameUsername ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginBottom: 8,
            }}
          >
            <Gamepad2 size={13} color="#8B92A5" />
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 13,
                color: "#8B92A5",
              }}
            >
              Game username:{" "}
              <Text style={{ fontFamily: "Inter_500Medium" }}>
                {profile.gameUsername}
              </Text>
            </Text>
          </View>
        ) : null}

        {profile.bio ? (
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "#8B92A5",
              marginBottom: 20,
              lineHeight: 20,
            }}
          >
            {profile.bio}
          </Text>
        ) : null}

        {/* Stats Grid */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#0F1225",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <Shield size={14} color="#38FEDC" />
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 11,
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
                  fontSize: 15,
                  color: "#FFFFFF",
                }}
              >
                {roleObj?.label || "Crewmate"}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#0F1225",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <MapPin size={14} color="#38FEDC" />
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 11,
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
                  fontSize: 15,
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
                backgroundColor: "#0F1225",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <Gamepad2 size={14} color="#38FEDC" />
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 11,
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
                  fontSize: 15,
                  color: "#FFFFFF",
                }}
              >
                {styleObj?.emoji} {styleObj?.label || "Detective"}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#0F1225",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <Flame size={14} color="#C51111" />
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 11,
                    color: "#8B92A5",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Sus
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", gap: 3, marginTop: 2 }}
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        i < profile.susLevel ? "#C51111" : "#1E2340",
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function DiscoverScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchPopup, setMatchPopup] = useState<Profile | null>(null);
  const [activeInterest, setActiveInterest] = useState<Interest | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [rcEnabled] = useState(() => isRevenueCatEnabled());
  const [limitModalVisible, setLimitModalVisible] = useState(false);

  // Check premium status on mount
  useEffect(() => {
    if (!rcEnabled) return;
    hasEntitlement("premium").then((result) => {
      if (result.ok) setIsPremium(result.data);
    });
  }, [rcEnabled]);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["discover-profiles"],
    queryFn: () => api.get<Profile[]>("/api/profiles/discover"),
  });

  // Fetch swipe status only for non-premium users
  const { data: swipeStatus } = useQuery({
    queryKey: ["swipe-status"],
    queryFn: () =>
      api.get<SwipeStatus>("/api/swipes/status"),
    enabled: !isPremium,
  });

  const { mutate: swipeMutate } = useMutation({
    mutationFn: ({
      swipedId,
      direction,
      isPremium: premium,
    }: {
      swipedId: string;
      direction: string;
      isPremium: boolean;
    }) =>
      api.post<SwipeResult>("/api/swipes", { swipedId, direction, isPremium: premium }),
    onSuccess: (data) => {
      if (data?.isMatch && profiles) {
        const matchedProfile = profiles[currentIndex];
        setMatchPopup(matchedProfile);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["swipe-status"] });
    },
    onError: (error: any) => {
      // Handle 429 limit reached
      if (error?.status === 429 || error?.message?.includes("429")) {
        setLimitModalVisible(true);
        queryClient.invalidateQueries({ queryKey: ["swipe-status"] });
      }
    },
  });

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (!profiles || currentIndex >= profiles.length) return;
      const profile = profiles[currentIndex];

      // Block right swipe when limit is reached for non-premium users
      if (direction === "right" && !isPremium && swipeStatus?.likesRemaining === 0) {
        setLimitModalVisible(true);
        // Reset card position
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
        return;
      }

      swipeMutate({
        swipedId: profile.userId,
        direction,
        isPremium,
      });
      setCurrentIndex((prev) => prev + 1);
      translateX.value = 0;
      translateY.value = 0;
      rotation.value = 0;
    },
    [profiles, currentIndex, swipeMutate, isPremium, swipeStatus, translateX, translateY, rotation]
  );

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
      rotation.value = event.translationX * 0.05;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(width * 1.5, { duration: 300 });
        runOnJS(handleSwipe)("right");
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-width * 1.5, { duration: 300 });
        runOnJS(handleSwipe)("left");
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateZ: `${rotation.value}deg` },
    ],
  }));

  // Filter profiles by active interest (client-side)
  const filteredProfiles = React.useMemo(() => {
    if (!profiles) return [];
    if (!activeInterest) return profiles;
    const roleId = INTEREST_TO_ROLE[activeInterest];
    if (roleId) {
      return profiles.filter((p) => p.favoriteRole === roleId);
    }
    // For non-role interests, show all (they map to tasks/rooms not in profile data)
    return profiles;
  }, [profiles, activeInterest]);

  const currentProfile = filteredProfiles[currentIndex];

  const isLimitReached = !isPremium && swipeStatus?.likesRemaining === 0;

  const handleInterestChipPress = (interest: Interest) => {
    if (!rcEnabled) return;
    if (!isPremium) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push("/(app)/paywall");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex(0);
    setActiveInterest((prev) => (prev === interest ? null : interest));
  };

  if (isLoading) {
    return (
      <View
        testID="discover-loading"
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
    <View testID="discover-screen" style={{ flex: 1, backgroundColor: "#0B0E1A" }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "Orbitron_700Bold",
              fontSize: 22,
              color: "#FFFFFF",
            }}
          >
            Discover
          </Text>
        </View>

        {/* Like Counter Bar — only for non-premium when RC is enabled */}
        {!isPremium && rcEnabled ? (
          <LikeCounterBar
            swipeStatus={swipeStatus}
            onGoUnlimited={() => router.push("/(app)/paywall")}
          />
        ) : null}

        {/* Interest Filter Bar */}
        <View style={{ marginBottom: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              marginBottom: 8,
              gap: 6,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 11,
                color: "#8B92A5",
                textTransform: "uppercase",
                letterSpacing: 1.2,
              }}
            >
              Filter by Interest
            </Text>
            {rcEnabled && !isPremium ? (
              <Crown size={13} color="#C51111" fill="#C51111" />
            ) : null}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            style={{ flexGrow: 0 }}
          >
            {INTERESTS.map((interest) => {
              const isActive = activeInterest === interest;
              const isLocked = rcEnabled && !isPremium;
              return (
                <Pressable
                  key={interest}
                  testID={`interest-chip-${interest.toLowerCase()}`}
                  onPress={() => handleInterestChipPress(interest)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isActive ? "#38FEDC" : "#151929",
                    borderWidth: 1.5,
                    borderColor: isActive ? "#38FEDC" : isLocked ? "#2A1A1A" : "#1E2340",
                    opacity: isLocked ? 0.75 : 1,
                  }}
                >
                  {isLocked ? <Lock size={11} color="#C51111" /> : null}
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 13,
                      color: isActive ? "#0B0E1A" : isLocked ? "#8B92A5" : "#FFFFFF",
                    }}
                  >
                    {interest}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Card */}
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {currentProfile ? (
            <GestureDetector gesture={gesture}>
              <Animated.View
                style={[{ flex: 1, marginBottom: 12 }, cardStyle]}
              >
                <ProfileCard profile={currentProfile} />
              </Animated.View>
            </GestureDetector>
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CrewmateSvg color="#3D4460" size={80} />
              <Text
                style={{
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 18,
                  color: "#8B92A5",
                  marginTop: 24,
                }}
              >
                No more crewmates
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  color: "#3D4460",
                  marginTop: 8,
                  textAlign: "center",
                  paddingHorizontal: 40,
                }}
              >
                {activeInterest
                  ? `No crewmates match "${activeInterest}" — try a different filter`
                  : "Check back later for new players"}
              </Text>
              {activeInterest ? (
                <Pressable
                  onPress={() => {
                    setActiveInterest(null);
                    setCurrentIndex(0);
                  }}
                  style={{
                    marginTop: 16,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: "#151929",
                    borderWidth: 1,
                    borderColor: "#1E2340",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 13,
                      color: "#38FEDC",
                    }}
                  >
                    Clear Filter
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {currentProfile ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 32,
              paddingBottom: 16,
            }}
          >
            <TouchableOpacity
              testID="skip-button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                translateX.value = withTiming(-width * 1.5, {
                  duration: 300,
                });
                setTimeout(() => handleSwipe("left"), 100);
              }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#151929",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: "#1E2340",
              }}
            >
              <X size={28} color="#8B92A5" />
            </TouchableOpacity>
            <TouchableOpacity
              testID="like-button"
              onPress={() => {
                if (isLimitReached) {
                  setLimitModalVisible(true);
                  return;
                }
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                translateX.value = withTiming(width * 1.5, {
                  duration: 300,
                });
                setTimeout(() => handleSwipe("right"), 100);
              }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                justifyContent: "center",
                alignItems: "center",
                opacity: isLimitReached ? 0.4 : 1,
              }}
            >
              <LinearGradient
                colors={isLimitReached ? ["#333", "#222"] : ["#C51111", "#8B0000"]}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Heart size={28} color="#FFFFFF" fill="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : null}
      </SafeAreaView>

      {/* Match Popup */}
      {matchPopup ? (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <Text
            style={{
              fontFamily: "Orbitron_700Bold",
              fontSize: 32,
              color: "#50EF39",
              marginBottom: 8,
            }}
          >
            IT'S A MATCH!
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              color: "#8B92A5",
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            You and {matchPopup.displayName} both swiped right. Time to
            start a task together!
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 24,
              marginBottom: 40,
            }}
          >
            <CrewmateSvg color="#C51111" size={80} />
            <CrewmateSvg
              color={
                CREWMATE_COLORS.find(
                  (c) => c.id === matchPopup.crewmateColor
                )?.hex || "#38FEDC"
              }
              size={80}
            />
          </View>
          <TouchableOpacity
            testID="keep-playing-button"
            onPress={() => {
              setMatchPopup(null);
              queryClient.invalidateQueries({
                queryKey: ["matches"],
              });
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#50EF39", "#2DAD20"]}
              style={{
                borderRadius: 16,
                paddingHorizontal: 48,
                paddingVertical: 18,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 16,
                  color: "#0B0E1A",
                }}
              >
                Keep Playing
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      {/* Limit Reached Modal */}
      <LimitReachedModal
        visible={limitModalVisible}
        resetsAt={swipeStatus?.resetsAt ?? null}
        onClose={() => setLimitModalVisible(false)}
        onUpgrade={() => {
          setLimitModalVisible(false);
          router.push("/(app)/paywall");
        }}
      />
    </View>
  );
}
