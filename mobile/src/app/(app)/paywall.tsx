import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
  SlideInDown,
} from "react-native-reanimated";
import { Crown, Check, X, Star, Zap } from "lucide-react-native";
import type { PurchasesPackage } from "react-native-purchases";
import {
  isRevenueCatEnabled,
  getOfferings,
  purchasePackage,
  restorePurchases,
} from "@/lib/revenuecatClient";
import { CrewmateSvg } from "@/components/CrewmateSvg";

const { width } = Dimensions.get("window");

const FEATURES = [
  "Search by interests & game style",
  "Unlimited swipes",
  "See who liked you",
  "Priority matching",
];

type ToastState = { visible: boolean; message: string; isError: boolean };

export default function PaywallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ canDismiss?: string }>();
  const canDismiss = params.canDismiss === "true";

  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [lifetimePackage, setLifetimePackage] = useState<PurchasesPackage | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<"monthly" | "lifetime">("lifetime");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "", isError: false });

  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(30);
  const cardsOpacity = useSharedValue(0);
  const cardsTranslateY = useSharedValue(40);
  const ctaOpacity = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));
  const cardsStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
    transform: [{ translateY: cardsTranslateY.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 16 });
    cardsOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    cardsTranslateY.value = withDelay(200, withSpring(0, { damping: 14 }));
    ctaOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
  }, []);

  useEffect(() => {
    if (!isRevenueCatEnabled()) return;
    getOfferings().then((result) => {
      if (result.ok && result.data.current) {
        const pkgs = result.data.current.availablePackages;
        const monthly = pkgs.find((p) => p.identifier === "$rc_monthly") ?? null;
        const lifetime = pkgs.find((p) => p.identifier === "$rc_lifetime") ?? null;
        setMonthlyPackage(monthly);
        setLifetimePackage(lifetime);
      }
    });
  }, []);

  const showToast = useCallback((message: string, isError = false) => {
    setToast({ visible: true, message, isError });
    setTimeout(() => {
      setToast({ visible: false, message: "", isError: false });
    }, 2500);
  }, []);

  const handlePurchase = async () => {
    if (!isRevenueCatEnabled()) {
      showToast("Payments not configured", true);
      return;
    }
    const pkg = selectedPkg === "monthly" ? monthlyPackage : lifetimePackage;
    if (!pkg) {
      showToast("Package unavailable", true);
      return;
    }
    setIsPurchasing(true);
    const result = await purchasePackage(pkg);
    setIsPurchasing(false);
    if (result.ok) {
      showToast("Welcome to Premium! Among Us, but better.");
      setTimeout(() => {
        router.back();
      }, 1800);
    } else if (result.reason !== "sdk_error") {
      // sdk_error covers user cancellation — don't show error for that
    } else {
      showToast("Purchase failed. Please try again.", true);
    }
  };

  const handleRestore = async () => {
    if (!isRevenueCatEnabled()) return;
    setIsRestoring(true);
    const result = await restorePurchases();
    setIsRestoring(false);
    if (result.ok) {
      showToast("Purchases restored!");
      setTimeout(() => router.back(), 1500);
    } else {
      showToast("No purchases found to restore.", true);
    }
  };

  const monthlyPrice = monthlyPackage?.product?.priceString ?? "$4.99";
  const lifetimePrice = lifetimePackage?.product?.priceString ?? "$99.99";

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0E1A" }} testID="paywall-screen">
      {/* Stars background */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        {STAR_POSITIONS.map((star, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              backgroundColor: "rgba(255,255,255," + star.opacity + ")",
            }}
          />
        ))}
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* Close button */}
        {canDismiss ? (
          <Pressable
            testID="paywall-close-button"
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: 16,
              right: 20,
              zIndex: 10,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.1)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <X size={18} color="#8B92A5" />
          </Pressable>
        ) : null}

        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero / Crewmate Section */}
          <Animated.View style={[headerStyle, { alignItems: "center", paddingTop: 48, paddingBottom: 8 }]}>
            {/* Glowing aura */}
            <View style={{ position: "relative", alignItems: "center", justifyContent: "center" }}>
              <View
                style={{
                  position: "absolute",
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: "rgba(197,17,17,0.18)",
                  transform: [{ scaleX: 1.5 }],
                }}
              />
              <View
                style={{
                  position: "absolute",
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: "rgba(197,17,17,0.28)",
                }}
              />
              <CrewmateSvg color="#C51111" size={100} />
            </View>

            {/* Crown badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(197,17,17,0.2)",
                borderWidth: 1,
                borderColor: "rgba(197,17,17,0.5)",
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 6,
                marginTop: 20,
                marginBottom: 16,
              }}
            >
              <Crown size={14} color="#C51111" fill="#C51111" />
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 12,
                  color: "#C51111",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Premium
              </Text>
            </View>

            <Text
              style={{
                fontFamily: "Orbitron_700Bold",
                fontSize: 30,
                color: "#FFFFFF",
                textAlign: "center",
                marginBottom: 10,
                letterSpacing: 1,
              }}
            >
              Go Premium
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 15,
                color: "#8B92A5",
                textAlign: "center",
                paddingHorizontal: 36,
                lineHeight: 22,
              }}
            >
              Unlock the full Among Us dating experience
            </Text>
          </Animated.View>

          {/* Feature list */}
          <Animated.View style={[headerStyle, { paddingHorizontal: 28, marginTop: 28 }]}>
            {FEATURES.map((feature, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: "rgba(56,254,220,0.15)",
                    borderWidth: 1.5,
                    borderColor: "#38FEDC",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Check size={14} color="#38FEDC" strokeWidth={3} />
                </View>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 15,
                    color: "#FFFFFF",
                    flex: 1,
                  }}
                >
                  {feature}
                </Text>
              </View>
            ))}
          </Animated.View>

          {/* Plan Cards */}
          <Animated.View
            style={[
              cardsStyle,
              {
                flexDirection: "row",
                gap: 12,
                paddingHorizontal: 20,
                marginTop: 28,
              },
            ]}
          >
            {/* Monthly Card */}
            <Pressable
              testID="monthly-plan-card"
              onPress={() => setSelectedPkg("monthly")}
              style={{ flex: 1 }}
            >
              <View
                style={{
                  borderRadius: 18,
                  padding: 18,
                  backgroundColor: "#151929",
                  borderWidth: 2,
                  borderColor: selectedPkg === "monthly" ? "#38FEDC" : "#1E2340",
                  alignItems: "center",
                  minHeight: 130,
                  justifyContent: "center",
                }}
              >
                <Zap
                  size={20}
                  color={selectedPkg === "monthly" ? "#38FEDC" : "#3D4460"}
                  fill={selectedPkg === "monthly" ? "#38FEDC" : "transparent"}
                />
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 12,
                    color: selectedPkg === "monthly" ? "#38FEDC" : "#8B92A5",
                    marginTop: 8,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Monthly
                </Text>
                <Text
                  style={{
                    fontFamily: "Orbitron_700Bold",
                    fontSize: 22,
                    color: "#FFFFFF",
                  }}
                >
                  {monthlyPrice}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 11,
                    color: "#3D4460",
                    marginTop: 2,
                  }}
                >
                  per month
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 11,
                    color: "#8B92A5",
                    marginTop: 8,
                  }}
                >
                  Most Flexible
                </Text>
              </View>
            </Pressable>

            {/* Lifetime Card */}
            <Pressable
              testID="lifetime-plan-card"
              onPress={() => setSelectedPkg("lifetime")}
              style={{ flex: 1 }}
            >
              <View
                style={{
                  borderRadius: 18,
                  padding: 18,
                  backgroundColor: selectedPkg === "lifetime" ? "rgba(197,17,17,0.12)" : "#151929",
                  borderWidth: 2,
                  borderColor: selectedPkg === "lifetime" ? "#C51111" : "#1E2340",
                  alignItems: "center",
                  minHeight: 130,
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {/* Best Value badge */}
                <View
                  style={{
                    position: "absolute",
                    top: -12,
                    right: -1,
                    backgroundColor: "#C51111",
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    shadowColor: "#C51111",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 10,
                      color: "#FFFFFF",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Best Value
                  </Text>
                </View>

                <Star
                  size={20}
                  color={selectedPkg === "lifetime" ? "#C51111" : "#3D4460"}
                  fill={selectedPkg === "lifetime" ? "#C51111" : "transparent"}
                />
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 12,
                    color: selectedPkg === "lifetime" ? "#C51111" : "#8B92A5",
                    marginTop: 8,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Lifetime
                </Text>
                <Text
                  style={{
                    fontFamily: "Orbitron_700Bold",
                    fontSize: 22,
                    color: "#FFFFFF",
                  }}
                >
                  {lifetimePrice}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 11,
                    color: "#3D4460",
                    marginTop: 2,
                  }}
                >
                  one-time
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 11,
                    color: selectedPkg === "lifetime" ? "#C51111" : "#8B92A5",
                    marginTop: 8,
                  }}
                >
                  Pay Once, Match Forever
                </Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* CTA Button */}
          <Animated.View style={[ctaStyle, { paddingHorizontal: 20, marginTop: 28 }]}>
            <Pressable
              testID="unlock-premium-button"
              onPress={handlePurchase}
              disabled={isPurchasing}
              style={{ borderRadius: 18, overflow: "hidden" }}
            >
              <LinearGradient
                colors={["#E51515", "#8B0000"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 10,
                  shadowColor: "#C51111",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                  elevation: 10,
                }}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" testID="purchase-loading" />
                ) : (
                  <>
                    <Crown size={20} color="#FFFFFF" fill="#FFFFFF" />
                    <Text
                      style={{
                        fontFamily: "Orbitron_700Bold",
                        fontSize: 16,
                        color: "#FFFFFF",
                        letterSpacing: 1,
                      }}
                    >
                      Unlock Premium
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Restore Purchases */}
            <Pressable
              testID="restore-purchases-button"
              onPress={handleRestore}
              disabled={isRestoring}
              style={{ alignItems: "center", marginTop: 16, paddingVertical: 8 }}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="#3D4460" />
              ) : (
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 13,
                    color: "#3D4460",
                    textDecorationLine: "underline",
                  }}
                >
                  Restore Purchases
                </Text>
              )}
            </Pressable>

            {/* Legal disclaimer */}
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 11,
                color: "#3D4460",
                textAlign: "center",
                marginTop: 8,
                lineHeight: 16,
                paddingHorizontal: 20,
              }}
            >
              Payment will be charged to your account. Cancel anytime for monthly plans.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Toast notification */}
      {toast.visible ? (
        <Animated.View
          entering={SlideInDown.duration(300)}
          style={{
            position: "absolute",
            bottom: Platform.OS === "ios" ? 52 : 32,
            left: 20,
            right: 20,
            backgroundColor: toast.isError ? "#2A0A0A" : "#0A2A1E",
            borderWidth: 1,
            borderColor: toast.isError ? "#C51111" : "#38FEDC",
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
              color: toast.isError ? "#C51111" : "#38FEDC",
              textAlign: "center",
            }}
          >
            {toast.message}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

// Pre-generated star field positions to avoid recalculating
const STAR_POSITIONS = [
  { top: "5%", left: "10%", size: 2, opacity: 0.6 },
  { top: "8%", left: "75%", size: 1.5, opacity: 0.4 },
  { top: "12%", left: "45%", size: 3, opacity: 0.3 },
  { top: "15%", left: "22%", size: 1.5, opacity: 0.7 },
  { top: "20%", left: "88%", size: 2, opacity: 0.5 },
  { top: "3%", left: "60%", size: 2.5, opacity: 0.4 },
  { top: "25%", left: "5%", size: 1.5, opacity: 0.6 },
  { top: "30%", left: "90%", size: 2, opacity: 0.3 },
  { top: "35%", left: "50%", size: 1, opacity: 0.5 },
  { top: "40%", left: "15%", size: 2.5, opacity: 0.4 },
  { top: "45%", left: "70%", size: 1.5, opacity: 0.6 },
  { top: "50%", left: "35%", size: 2, opacity: 0.3 },
  { top: "55%", left: "82%", size: 1.5, opacity: 0.5 },
  { top: "60%", left: "8%", size: 3, opacity: 0.2 },
  { top: "65%", left: "55%", size: 1, opacity: 0.7 },
  { top: "70%", left: "28%", size: 2, opacity: 0.4 },
  { top: "75%", left: "92%", size: 1.5, opacity: 0.5 },
  { top: "80%", left: "42%", size: 2.5, opacity: 0.3 },
  { top: "85%", left: "18%", size: 1, opacity: 0.6 },
  { top: "90%", left: "68%", size: 2, opacity: 0.4 },
  { top: "2%", left: "33%", size: 1.5, opacity: 0.5 },
  { top: "18%", left: "55%", size: 1, opacity: 0.4 },
  { top: "38%", left: "78%", size: 2.5, opacity: 0.3 },
  { top: "58%", left: "95%", size: 1.5, opacity: 0.5 },
  { top: "72%", left: "62%", size: 1, opacity: 0.6 },
] as const;
