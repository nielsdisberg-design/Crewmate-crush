import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Pressable,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  LogOut,
  Shield,
  MapPin,
  Gamepad2,
  Flame,
  Crown,
  Plus,
  Lock,
  X,
  Camera,
  Settings,
} from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/lib/api/api";
import { authClient } from "@/lib/auth/auth-client";
import { useSession, useInvalidateSession } from "@/lib/auth/use-session";
import { CREWMATE_COLORS, MAPS, PLAY_STYLES, ROLES } from "@/lib/types";
import type { Profile } from "@/lib/types";
import { CrewmateSvg } from "@/components/CrewmateSvg";
import { isRevenueCatEnabled, hasEntitlement } from "@/lib/revenuecatClient";
import { uploadFile } from "@/lib/upload";

interface ProfilePhoto {
  id: string;
  profileId: string;
  url: string;
  fileId: string;
  position: number;
  createdAt: string;
}

const { width } = Dimensions.get("window");
const PHOTO_GRID_PADDING = 24;
const PHOTO_GAP = 8;
const PHOTO_COLS = 3;
const PHOTO_SIZE =
  (width - PHOTO_GRID_PADDING * 2 - PHOTO_GAP * (PHOTO_COLS - 1)) / PHOTO_COLS;

const FREE_LIMIT = 2;
const PREMIUM_LIMIT = 6;

function PhotoGrid({
  isPremium,
  profileId,
}: {
  isPremium: boolean;
  profileId: string | undefined;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  const { data: photos, isLoading: photosLoading } = useQuery({
    queryKey: ["my-photos"],
    queryFn: () => api.get<ProfilePhoto[]>("/api/profiles/me/photos"),
    enabled: !!profileId,
  });

  const photoLimit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;
  const totalSlots = PREMIUM_LIMIT;

  const addMutation = useMutation({
    mutationFn: (vars: { url: string; fileId: string; position: number }) =>
      api.post<ProfilePhoto>("/api/profiles/me/photos", vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-photos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (photo: ProfilePhoto) => {
      await api.delete<{ success: boolean }>(
        `/api/profiles/me/photos/${photo.id}`
      );
      // Also delete from file storage
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;
      await fetch(`${BACKEND_URL}/api/files/${photo.fileId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-photos"] });
    },
  });

  const handlePickImage = async (position: number) => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!result.granted) {
      Alert.alert(
        "Permission Required",
        "Camera roll access is needed to add photos."
      );
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (picked.canceled || !picked.assets[0]) return;

    const asset = picked.assets[0];
    const filename = asset.fileName || `photo_${Date.now()}.jpg`;
    const mimeType = asset.mimeType || "image/jpeg";

    setUploadingSlot(position);
    try {
      const { id: fileId, url } = await uploadFile(asset.uri, filename, mimeType);
      await addMutation.mutateAsync({ url, fileId, position });
    } catch (err) {
      Alert.alert("Upload Failed", "Could not upload photo. Please try again.");
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleDeletePhoto = (photo: ProfilePhoto) => {
    Alert.alert("Remove Photo", "Remove this photo from your profile?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => deleteMutation.mutate(photo),
      },
    ]);
  };

  // Build a position→photo map
  const photosByPosition = new Map<number, ProfilePhoto>();
  (photos || []).forEach((p) => photosByPosition.set(p.position, p));

  const slots = Array.from({ length: totalSlots }, (_, i) => i);
  const photoCount = (photos || []).length;

  if (photosLoading) {
    return (
      <View
        style={{
          marginTop: 28,
          backgroundColor: "#151929",
          borderRadius: 20,
          padding: 20,
          alignItems: "center",
          justifyContent: "center",
          height: 120,
        }}
      >
        <ActivityIndicator size="small" color="#38FEDC" />
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      testID="photo-grid-section"
      style={{
        marginTop: 28,
        backgroundColor: "#151929",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "#1E2340",
      }}
    >
      {/* Section header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Camera size={16} color="#38FEDC" />
          <Text
            style={{
              fontFamily: "Orbitron_700Bold",
              fontSize: 14,
              color: "#FFFFFF",
              letterSpacing: 0.5,
            }}
          >
            My Photos
          </Text>
        </View>
        <View
          style={{
            backgroundColor: isPremium
              ? "rgba(56,254,220,0.15)"
              : "rgba(197,17,17,0.15)",
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: isPremium
              ? "rgba(56,254,220,0.3)"
              : "rgba(197,17,17,0.3)",
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 12,
              color: isPremium ? "#38FEDC" : "#C51111",
            }}
          >
            {photoCount}/{photoLimit}
          </Text>
        </View>
      </View>

      {/* Photo grid */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: PHOTO_GAP,
        }}
      >
        {slots.map((i) => {
          const photo = photosByPosition.get(i);
          const isLocked = !isPremium && i >= FREE_LIMIT;
          const isUploading = uploadingSlot === i;
          const isDeleting = deleteMutation.isPending && photo !== undefined;

          if (photo) {
            // Filled slot
            return (
              <View
                key={i}
                testID={`photo-slot-filled-${i}`}
                style={{
                  width: PHOTO_SIZE,
                  height: PHOTO_SIZE,
                  borderRadius: 14,
                  overflow: "hidden",
                  borderWidth: 1.5,
                  borderColor: "rgba(56,254,220,0.2)",
                }}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
                  resizeMode="cover"
                />
                {/* Delete button */}
                <Pressable
                  testID={`delete-photo-${i}`}
                  onPress={() => handleDeletePhoto(photo)}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: "#C51111",
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#C51111",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <X size={12} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>
            );
          }

          if (isLocked) {
            // Locked slot (premium only)
            return (
              <Pressable
                key={i}
                testID={`photo-slot-locked-${i}`}
                onPress={() => router.push("/(app)/paywall")}
                style={{
                  width: PHOTO_SIZE,
                  height: PHOTO_SIZE,
                  borderRadius: 14,
                  backgroundColor: "#0D1020",
                  borderWidth: 1.5,
                  borderColor: "rgba(197,17,17,0.2)",
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: 0.6,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "rgba(197,17,17,0.15)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <Lock size={14} color="#C51111" />
                </View>
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 10,
                    color: "#C51111",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Premium
                </Text>
              </Pressable>
            );
          }

          // Empty add slot (within limit)
          return (
            <Pressable
              key={i}
              testID={`photo-slot-add-${i}`}
              onPress={() => !isUploading && handlePickImage(i)}
              style={{
                width: PHOTO_SIZE,
                height: PHOTO_SIZE,
                borderRadius: 14,
                backgroundColor: "#0D1020",
                borderWidth: 1.5,
                borderColor: "rgba(56,254,220,0.25)",
                borderStyle: "dashed",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#38FEDC" />
              ) : (
                <>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: "rgba(56,254,220,0.12)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 6,
                      shadowColor: "#38FEDC",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                    }}
                  >
                    <Plus size={16} color="#38FEDC" />
                  </View>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 10,
                      color: "#38FEDC",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Add Photo
                  </Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>

      {!isPremium ? (
        <Pressable
          onPress={() => router.push("/(app)/paywall")}
          style={{ marginTop: 14, alignItems: "center" }}
        >
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 12,
              color: "#8B92A5",
            }}
          >
            Unlock{" "}
            <Text style={{ color: "#C51111" }}>6 photo slots</Text> with
            Premium
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

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
            {/* Settings button — top-right corner */}
            <Pressable
              testID="profile-settings-button"
              onPress={() => router.push("/(app)/settings")}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(11,14,26,0.6)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.15)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Settings size={20} color="#FFFFFF" />
            </Pressable>
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

            {profile?.gameUsername ? (
              <Animated.View
                entering={FadeIn.duration(500)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: "rgba(56,254,220,0.08)",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: "rgba(56,254,220,0.2)",
                }}
              >
                <Gamepad2 size={13} color="#38FEDC" />
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                    color: "#38FEDC",
                  }}
                >
                  Game username:{" "}
                  <Text style={{ fontFamily: "Inter_700Bold" }}>
                    {profile.gameUsername}
                  </Text>
                </Text>
              </Animated.View>
            ) : null}

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

            {/* Photo Grid */}
            <PhotoGrid isPremium={isPremium} profileId={profile?.id} />

            {/* Go Premium Banner — only shown if NOT premium and RC is enabled */}
            {rcEnabled && !isPremium ? (
              <Animated.View
                entering={FadeIn.duration(600)}
                testID="go-premium-banner"
                style={{ marginTop: 24 }}
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
