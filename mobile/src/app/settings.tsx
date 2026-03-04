import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, Lock } from "lucide-react-native";
import Slider from "@react-native-community/slider";
import { api } from "@/lib/api/api";
import { CREWMATE_COLORS, MAPS, PLAY_STYLES, ROLES } from "@/lib/types";
import type { Profile } from "@/lib/types";

const GENDER_OPTIONS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "non-binary", label: "Non-binary" },
  { id: "other", label: "Other" },
];

const LOOKING_FOR_OPTIONS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "non-binary", label: "Non-binary" },
  { id: "other", label: "Other" },
  { id: "anyone", label: "Anyone" },
];

interface FormState {
  bio: string;
  gameUsername: string;
  gender: string;
  lookingFor: string;
  crewmateColor: string;
  favoriteRole: string;
  favoriteMap: string;
  playStyle: string;
  susLevel: number;
}

function profileToForm(profile: Profile): FormState {
  return {
    bio: profile.bio || "",
    gameUsername: profile.gameUsername || "",
    gender: profile.gender || "",
    lookingFor: profile.lookingFor || "",
    crewmateColor: profile.crewmateColor || "red",
    favoriteRole: profile.favoriteRole || "crewmate",
    favoriteMap: profile.favoriteMap || "the-skeld",
    playStyle: profile.playStyle || "detective",
    susLevel: profile.susLevel ?? 5,
  };
}

function formsAreEqual(a: FormState, b: FormState): boolean {
  return (
    a.bio === b.bio &&
    a.gameUsername === b.gameUsername &&
    a.gender === b.gender &&
    a.lookingFor === b.lookingFor &&
    a.crewmateColor === b.crewmateColor &&
    a.favoriteRole === b.favoriteRole &&
    a.favoriteMap === b.favoriteMap &&
    a.playStyle === b.playStyle &&
    a.susLevel === b.susLevel
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontFamily: "Inter_600SemiBold",
        fontSize: 11,
        color: "#8B92A5",
        textTransform: "uppercase",
        letterSpacing: 1.4,
        marginBottom: 10,
        marginTop: 28,
        paddingHorizontal: 4,
      }}
    >
      {title}
    </Text>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  helperText,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
  helperText?: string;
  testID?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontFamily: "Inter_500Medium",
          fontSize: 12,
          color: "#8B92A5",
          marginBottom: 6,
          paddingHorizontal: 2,
        }}
      >
        {label}
      </Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#3D4460"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType || "default"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: "#151929",
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: focused ? "#38FEDC" : "#1E2340",
          color: "#FFFFFF",
          fontFamily: "Inter_400Regular",
          fontSize: 15,
          paddingHorizontal: 16,
          paddingVertical: 12,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
      {helperText ? (
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 11,
            color: "#3D4460",
            marginTop: 5,
            paddingHorizontal: 2,
          }}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

function ButtonGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontFamily: "Inter_500Medium",
          fontSize: 12,
          color: "#8B92A5",
          marginBottom: 8,
          paddingHorizontal: 2,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: isSelected ? "#38FEDC" : "#1E2340",
                backgroundColor: isSelected
                  ? "rgba(56,254,220,0.1)"
                  : "#151929",
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                  color: isSelected ? "#38FEDC" : "#8B92A5",
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ColorPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontFamily: "Inter_500Medium",
          fontSize: 12,
          color: "#8B92A5",
          marginBottom: 8,
          paddingHorizontal: 2,
        }}
      >
        Crewmate Color
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
        style={{ flexGrow: 0 }}
      >
        {CREWMATE_COLORS.map((color) => {
          const isSelected = selected === color.id;
          return (
            <Pressable
              key={color.id}
              onPress={() => onSelect(color.id)}
              style={{
                alignItems: "center",
                gap: 5,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: color.hex,
                  borderWidth: isSelected ? 3 : 1.5,
                  borderColor: isSelected ? "#38FEDC" : "rgba(255,255,255,0.1)",
                  shadowColor: isSelected ? "#38FEDC" : "transparent",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isSelected ? 0.6 : 0,
                  shadowRadius: 6,
                  elevation: isSelected ? 4 : 0,
                }}
              />
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 10,
                  color: isSelected ? "#38FEDC" : "#3D4460",
                }}
              >
                {color.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ChipRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { id: string; label: string; emoji?: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontFamily: "Inter_500Medium",
          fontSize: 12,
          color: "#8B92A5",
          marginBottom: 8,
          paddingHorizontal: 2,
        }}
      >
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        style={{ flexGrow: 0 }}
      >
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: isSelected ? "#38FEDC" : "#1E2340",
                backgroundColor: isSelected
                  ? "rgba(56,254,220,0.1)"
                  : "#151929",
              }}
            >
              {opt.emoji ? (
                <Text style={{ fontSize: 14 }}>{opt.emoji}</Text>
              ) : null}
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                  color: isSelected ? "#38FEDC" : "#8B92A5",
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ToastModal({
  visible,
  message,
}: {
  visible: boolean;
  message: string;
}) {
  if (!visible) return null;
  return (
    <View
      style={{
        position: "absolute",
        bottom: 100,
        left: 32,
        right: 32,
        backgroundColor: "#151929",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: "#38FEDC",
        alignItems: "center",
        shadowColor: "#38FEDC",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
      }}
    >
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: 14,
          color: "#38FEDC",
        }}
      >
        {message}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [savedForm, setSavedForm] = useState<FormState | null>(null);
  const [toast, setToast] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile | null>("/api/profiles/me"),
  });

  useEffect(() => {
    if (profile) {
      const initialForm = profileToForm(profile);
      setForm(initialForm);
      setSavedForm(initialForm);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Profile>) =>
      api.post<Profile>("/api/profiles/me", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      if (form) setSavedForm(form);
      setToast(true);
      setTimeout(() => {
        setToast(false);
        router.back();
      }, 1200);
    },
  });

  const hasChanges =
    form !== null && savedForm !== null && !formsAreEqual(form, savedForm);

  const handleSave = () => {
    if (!form || !hasChanges) return;
    saveMutation.mutate({
      bio: form.bio,
      gameUsername: form.gameUsername || null,
      gender: form.gender,
      lookingFor: form.lookingFor,
      crewmateColor: form.crewmateColor,
      favoriteRole: form.favoriteRole,
      favoriteMap: form.favoriteMap,
      playStyle: form.playStyle,
      susLevel: form.susLevel,
    });
  };

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: val } : prev));
  };

  if (isLoading || !form) {
    return (
      <View
        testID="settings-loading"
        style={{
          flex: 1,
          backgroundColor: "#0B0E1A",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#38FEDC" />
      </View>
    );
  }

  return (
    <View testID="settings-screen" style={{ flex: 1, backgroundColor: "#0B0E1A" }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#1E2340",
          }}
        >
          <Pressable
            testID="settings-back-button"
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#151929",
              borderWidth: 1,
              borderColor: "#1E2340",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </Pressable>
          <Text
            style={{
              fontFamily: "Orbitron_700Bold",
              fontSize: 17,
              color: "#FFFFFF",
              letterSpacing: 0.5,
            }}
          >
            Settings
          </Text>
          <Pressable
            testID="settings-save-button"
            onPress={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <ActivityIndicator size="small" color="#38FEDC" />
            ) : (
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 16,
                  color: hasChanges ? "#38FEDC" : "#3D4460",
                }}
              >
                Save
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* PROFILE section */}
          <SectionHeader title="PROFILE" />

          <View
            style={{
              backgroundColor: "#151929",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#1E2340",
            }}
          >
            {/* Read-only locked rows */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 10,
                paddingHorizontal: 2,
                marginBottom: 4,
                borderBottomWidth: 1,
                borderBottomColor: "#0F1225",
              }}
            >
              <View>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 12,
                    color: "#8B92A5",
                    marginBottom: 2,
                  }}
                >
                  Display Name
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 15,
                    color: "#FFFFFF",
                  }}
                >
                  {profile?.displayName || "—"}
                </Text>
              </View>
              <Lock size={16} color="#3D4460" />
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 10,
                paddingHorizontal: 2,
                marginBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#0F1225",
              }}
            >
              <View>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 12,
                    color: "#8B92A5",
                    marginBottom: 2,
                  }}
                >
                  Age
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 15,
                    color: "#FFFFFF",
                  }}
                >
                  {profile?.age != null ? String(profile.age) : "—"}
                </Text>
              </View>
              <Lock size={16} color="#3D4460" />
            </View>

            <InputField
              testID="settings-bio"
              label="Bio"
              value={form.bio}
              onChangeText={(t) => setField("bio", t)}
              placeholder="Tell other crewmates about yourself..."
              multiline
            />
            <InputField
              testID="settings-game-username"
              label="Game Username"
              value={form.gameUsername}
              onChangeText={(t) => setField("gameUsername", t)}
              placeholder="Your Among Us username (optional)"
              helperText="Shown on your profile as 'Game username'"
            />
          </View>

          {/* PREFERENCES section */}
          <SectionHeader title="PREFERENCES" />

          <View
            style={{
              backgroundColor: "#151929",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#1E2340",
            }}
          >
            <ButtonGroup
              label="Gender"
              options={GENDER_OPTIONS}
              selected={form.gender}
              onSelect={(id) => setField("gender", id)}
            />
            <ButtonGroup
              label="Looking For"
              options={LOOKING_FOR_OPTIONS}
              selected={form.lookingFor}
              onSelect={(id) => setField("lookingFor", id)}
            />
            <ColorPicker
              selected={form.crewmateColor}
              onSelect={(id) => setField("crewmateColor", id)}
            />
          </View>

          {/* GAME STYLE section */}
          <SectionHeader title="GAME STYLE" />

          <View
            style={{
              backgroundColor: "#151929",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#1E2340",
            }}
          >
            <ChipRow
              label="Favorite Role"
              options={[...ROLES]}
              selected={form.favoriteRole}
              onSelect={(id) => setField("favoriteRole", id)}
            />
            <ChipRow
              label="Favorite Map"
              options={[...MAPS]}
              selected={form.favoriteMap}
              onSelect={(id) => setField("favoriteMap", id)}
            />
            <ChipRow
              label="Play Style"
              options={[...PLAY_STYLES]}
              selected={form.playStyle}
              onSelect={(id) => setField("playStyle", id)}
            />

            {/* Sus Level slider */}
            <View style={{ marginBottom: 6 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  paddingHorizontal: 2,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 12,
                    color: "#8B92A5",
                  }}
                >
                  Sus Level
                </Text>
                <View
                  style={{
                    backgroundColor: "rgba(197,17,17,0.15)",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderWidth: 1,
                    borderColor: "rgba(197,17,17,0.3)",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Orbitron_700Bold",
                      fontSize: 14,
                      color: "#C51111",
                    }}
                  >
                    {form.susLevel}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 4, marginBottom: 10 }}>
                {Array.from({ length: 10 }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor:
                        i < form.susLevel ? "#C51111" : "#1E2340",
                    }}
                  />
                ))}
              </View>
              <Slider
                testID="settings-sus-slider"
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={form.susLevel}
                onValueChange={(v) => setField("susLevel", Math.round(v))}
                minimumTrackTintColor="#C51111"
                maximumTrackTintColor="#1E2340"
                thumbTintColor="#C51111"
                style={{ marginHorizontal: -4 }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 2,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 11,
                    color: "#3D4460",
                  }}
                >
                  Not Sus
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 11,
                    color: "#3D4460",
                  }}
                >
                  Very Sus
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <ToastModal visible={toast} message="Profile saved!" />
    </View>
  );
}
