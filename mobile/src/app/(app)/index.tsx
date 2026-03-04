import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api/api";
import { CREWMATE_COLORS, MAPS, PLAY_STYLES, ROLES } from "@/lib/types";
import type { Profile, SwipeResult } from "@/lib/types";
import { CrewmateSvg } from "@/components/CrewmateSvg";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.3;

function ProfileCard({ profile }: { profile: Profile }) {
  const colorObj = CREWMATE_COLORS.find(
    (c) => c.id === profile.crewmateColor
  );
  const colorHex = colorObj?.hex || "#C51111";
  const mapObj = MAPS.find((m) => m.id === profile.favoriteMap);
  const roleObj = ROLES.find((r) => r.id === profile.favoriteRole);
  const styleObj = PLAY_STYLES.find((p) => p.id === profile.playStyle);

  return (
    <View
      style={{
        backgroundColor: "#151929",
        borderRadius: 24,
        overflow: "hidden",
        flex: 1,
      }}
    >
      {/* Color header */}
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchPopup, setMatchPopup] = useState<Profile | null>(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["discover-profiles"],
    queryFn: () => api.get<Profile[]>("/api/profiles/discover"),
  });

  const { mutate: swipeMutate } = useMutation({
    mutationFn: ({
      swipedId,
      direction,
    }: {
      swipedId: string;
      direction: string;
    }) => api.post<SwipeResult>("/api/swipes", { swipedId, direction }),
    onSuccess: (data) => {
      if (data?.isMatch && profiles) {
        const matchedProfile = profiles[currentIndex];
        setMatchPopup(matchedProfile);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

      swipeMutate({
        swipedId: profile.userId,
        direction,
      });
      setCurrentIndex((prev) => prev + 1);
      translateX.value = 0;
      translateY.value = 0;
      rotation.value = 0;
    },
    [profiles, currentIndex, swipeMutate, translateX, translateY, rotation]
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

  const currentProfile = profiles?.[currentIndex];

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
                }}
              >
                Check back later for new players
              </Text>
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
              }}
            >
              <LinearGradient
                colors={["#C51111", "#8B0000"]}
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
    </View>
  );
}
