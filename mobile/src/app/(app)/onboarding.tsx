import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { CREWMATE_COLORS, MAPS, PLAY_STYLES, ROLES } from "@/lib/types";
import { CrewmateSvg } from "@/components/CrewmateSvg";
import * as Haptics from "expo-haptics";

const TOTAL_STEPS = 5;

interface FormState {
  displayName: string;
  age: string;
  gender: string;
  lookingFor: string;
  crewmateColor: string;
  favoriteRole: string;
  favoriteMap: string;
  playStyle: string;
  bio: string;
  susLevel: number;
}

function OptionButton({
  label,
  selected,
  onPress,
  emoji,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  emoji?: string;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      activeOpacity={0.7}
      style={{
        backgroundColor: selected ? "#1E2340" : "#0F1225",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1.5,
        borderColor: selected ? "#C51111" : "#1E2340",
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: 15,
          color: selected ? "#FFFFFF" : "#8B92A5",
          textAlign: "center",
        }}
      >
        {emoji ? `${emoji} ` : null}
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function Onboarding() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    displayName: "",
    age: "",
    gender: "",
    lookingFor: "",
    crewmateColor: "red",
    favoriteRole: "crewmate",
    favoriteMap: "the-skeld",
    playStyle: "detective",
    bio: "",
    susLevel: 5,
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/api/profiles/me", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });

  const updateField = (key: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      mutation.mutate({
        ...form,
        age: parseInt(form.age) || 18,
        susLevel: form.susLevel,
      });
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const selectedColor =
    CREWMATE_COLORS.find((c) => c.id === form.crewmateColor)?.hex || "#C51111";

  const genderOptions = ["Male", "Female", "Non-binary", "Other"];
  const lookingForOptions = ["Male", "Female", "Non-binary", "Everyone"];

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <Text
              style={{
                fontFamily: "Orbitron_700Bold",
                fontSize: 22,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              Who are you?
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#8B92A5",
                marginBottom: 32,
              }}
            >
              Tell us your display name and age
            </Text>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: "#8B92A5",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              Display Name
            </Text>
            <TextInput
              testID="display-name-input"
              value={form.displayName}
              onChangeText={(v) => updateField("displayName", v)}
              placeholder="Your crewmate name"
              placeholderTextColor="#3D4460"
              style={{
                backgroundColor: "#151929",
                borderRadius: 14,
                padding: 16,
                fontSize: 16,
                color: "#FFFFFF",
                fontFamily: "Inter_400Regular",
                borderWidth: 1,
                borderColor: "#1E2340",
                marginBottom: 20,
              }}
            />
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: "#8B92A5",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              Age
            </Text>
            <TextInput
              testID="age-input"
              value={form.age}
              onChangeText={(v) => updateField("age", v)}
              placeholder="18"
              placeholderTextColor="#3D4460"
              keyboardType="number-pad"
              style={{
                backgroundColor: "#151929",
                borderRadius: 14,
                padding: 16,
                fontSize: 16,
                color: "#FFFFFF",
                fontFamily: "Inter_400Regular",
                borderWidth: 1,
                borderColor: "#1E2340",
              }}
            />
          </View>
        );
      case 1:
        return (
          <View>
            <Text
              style={{
                fontFamily: "Orbitron_700Bold",
                fontSize: 22,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              Preferences
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#8B92A5",
                marginBottom: 24,
              }}
            >
              Who are you looking for?
            </Text>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: "#8B92A5",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 12,
              }}
            >
              I am
            </Text>
            {genderOptions.map((g) => (
              <OptionButton
                key={g}
                label={g}
                selected={form.gender === g}
                onPress={() => updateField("gender", g)}
              />
            ))}
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: "#8B92A5",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 12,
                marginTop: 20,
              }}
            >
              Looking for
            </Text>
            {lookingForOptions.map((l) => (
              <OptionButton
                key={l}
                label={l}
                selected={form.lookingFor === l}
                onPress={() => updateField("lookingFor", l)}
              />
            ))}
          </View>
        );
      case 2:
        return (
          <View>
            <Text
              style={{
                fontFamily: "Orbitron_700Bold",
                fontSize: 22,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              Your Color
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#8B92A5",
                marginBottom: 24,
              }}
            >
              Choose your crewmate color
            </Text>
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <CrewmateSvg color={selectedColor} size={120} />
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                justifyContent: "center",
              }}
            >
              {CREWMATE_COLORS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  testID={`color-${c.id}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateField("crewmateColor", c.id);
                  }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: c.hex,
                    borderWidth: form.crewmateColor === c.id ? 3 : 0,
                    borderColor: "#FFFFFF",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {form.crewmateColor === c.id ? (
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View>
            <Text
              style={{
                fontFamily: "Orbitron_700Bold",
                fontSize: 22,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              Play Style
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#8B92A5",
                marginBottom: 24,
              }}
            >
              How do you play Among Us?
            </Text>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: "#8B92A5",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 12,
              }}
            >
              Favorite Role
            </Text>
            {ROLES.map((r) => (
              <OptionButton
                key={r.id}
                label={r.label}
                selected={form.favoriteRole === r.id}
                onPress={() => updateField("favoriteRole", r.id)}
              />
            ))}
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: "#8B92A5",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 12,
                marginTop: 20,
              }}
            >
              Favorite Map
            </Text>
            {MAPS.map((m) => (
              <OptionButton
                key={m.id}
                label={m.label}
                selected={form.favoriteMap === m.id}
                onPress={() => updateField("favoriteMap", m.id)}
              />
            ))}
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: "#8B92A5",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 12,
                marginTop: 20,
              }}
            >
              Play Style
            </Text>
            {PLAY_STYLES.map((p) => (
              <OptionButton
                key={p.id}
                label={p.label}
                emoji={p.emoji}
                selected={form.playStyle === p.id}
                onPress={() => updateField("playStyle", p.id)}
              />
            ))}
          </View>
        );
      case 4:
        return (
          <View>
            <Text
              style={{
                fontFamily: "Orbitron_700Bold",
                fontSize: 22,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              Almost done!
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#8B92A5",
                marginBottom: 24,
              }}
            >
              Add a bio and set your sus level
            </Text>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: "#8B92A5",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              Bio
            </Text>
            <TextInput
              testID="bio-input"
              value={form.bio}
              onChangeText={(v) => updateField("bio", v)}
              placeholder="Tell other crewmates about yourself..."
              placeholderTextColor="#3D4460"
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: "#151929",
                borderRadius: 14,
                padding: 16,
                fontSize: 15,
                color: "#FFFFFF",
                fontFamily: "Inter_400Regular",
                borderWidth: 1,
                borderColor: "#1E2340",
                minHeight: 120,
                textAlignVertical: "top",
                marginBottom: 24,
              }}
            />
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: "#8B92A5",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 12,
              }}
            >
              Sus Level: {form.susLevel}/10
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 6,
                justifyContent: "center",
              }}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <TouchableOpacity
                  key={i}
                  testID={`sus-level-${i + 1}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateField("susLevel", i + 1);
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor:
                      i < form.susLevel ? "#C51111" : "#1E2340",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                />
              ))}
            </View>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: "#8B92A5",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              How sus are you? (1 = innocent, 10 = definite impostor)
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return form.displayName.trim().length > 0 && form.age.length > 0;
      case 1:
        return form.gender.length > 0 && form.lookingFor.length > 0;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0E1A" }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Progress bar */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: i <= step ? "#C51111" : "#1E2340",
                }}
              />
            ))}
          </View>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              color: "#8B92A5",
              marginTop: 12,
            }}
          >
            Step {step + 1} of {TOTAL_STEPS}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingTop: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>

        {/* Bottom buttons */}
        <View style={{ padding: 24, flexDirection: "row", gap: 12 }}>
          {step > 0 ? (
            <TouchableOpacity
              testID="back-button"
              onPress={prevStep}
              style={{
                flex: 1,
                padding: 18,
                borderRadius: 16,
                backgroundColor: "#151929",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#1E2340",
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 16,
                  color: "#8B92A5",
                }}
              >
                Back
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            testID="next-button"
            onPress={nextStep}
            disabled={!canProceed() || mutation.isPending}
            activeOpacity={0.8}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={
                canProceed()
                  ? ["#C51111", "#8B0000"]
                  : ["#1E2340", "#1E2340"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 18,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 16,
                  color: canProceed() ? "#FFFFFF" : "#3D4460",
                }}
              >
                {step === TOTAL_STEPS - 1
                  ? mutation.isPending
                    ? "Saving..."
                    : "Launch Profile"
                  : "Next"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
