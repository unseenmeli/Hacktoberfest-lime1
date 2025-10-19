import { View, Text, TouchableOpacity, Image, Alert, ScrollView } from "react-native";
import { useState } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import db from "../../app/db";
import useEnsureProfile from "../../lib/useEnsureProfile";
import LikedEvents from "./likedEvents";

interface SettingsProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

function PressableButton({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  const opacity = useSharedValue(0);

  const gradientStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    opacity.value = withTiming(1, { duration: 200 });
  };

  const handlePressOut = () => {
    opacity.value = withTiming(0, { duration: 300 });
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      activeOpacity={1}
    >
      <View
        className="rounded-2xl py-5 px-6 mb-3 border border-white/10 flex-row items-center justify-between overflow-hidden"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            gradientStyle,
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.15)',
              'rgba(255, 255, 255, 0.08)',
              'rgba(255, 255, 255, 0.02)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </Animated.View>
        <View className="flex-row items-center justify-between flex-1" style={{ zIndex: 1 }}>
          {children}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Settings({ activeTab = "settings", setActiveTab }: SettingsProps) {
  useEnsureProfile();

  const { user } = db.useAuth();
  const [showLikedEvents, setShowLikedEvents] = useState(false);
  const [showSignOutAlert, setShowSignOutAlert] = useState(false);

  if (showLikedEvents) {
    return <LikedEvents onBack={() => setShowLikedEvents(false)} />;
  }

  const handleSignOut = async () => {
    setShowSignOutAlert(true);
  };

  const confirmSignOut = async () => {
    setShowSignOutAlert(false);
    await db.auth.signOut();
  };

  const cancelSignOut = () => {
    setShowSignOutAlert(false);
  };

  const getInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "?";
  };

  return (
    <View className="flex-1 bg-black">
      {/* Sign Out Confirmation Alert */}
      {showSignOutAlert && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 1)",
            zIndex: 1000,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={{ width: "85%" }}>
            <View className="bg-black rounded-2xl p-6 border border-white/20">
              <Text
                className="text-white uppercase text-center mb-3"
                style={{
                  fontSize: 24,
                  fontWeight: "900",
                  letterSpacing: -0.5,
                }}
              >
                Sign Out
              </Text>
              <Text
                className="text-white/70 text-center mb-6"
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Are you sure you want to sign out?
              </Text>

              <View className="gap-3">
                <TouchableOpacity
                  onPress={confirmSignOut}
                  className="bg-red-500 rounded-full py-4 items-center"
                  activeOpacity={0.8}
                >
                  <Text
                    className="text-white uppercase"
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      letterSpacing: 1,
                    }}
                  >
                    Sign Out
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={cancelSignOut}
                  className="bg-white/10 rounded-full py-4 items-center border border-white/20"
                  activeOpacity={0.8}
                >
                  <Text
                    className="text-white uppercase"
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      letterSpacing: 1,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1 px-8 pt-16"
        style={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text
          className="text-white uppercase mb-12"
          style={{
            fontSize: 48,
            fontWeight: "900",
            letterSpacing: -2,
            textShadowColor: "rgba(0,0,0,0.8)",
            textShadowOffset: { width: 0, height: 4 },
            textShadowRadius: 12,
          }}
        >
          SETTINGS
        </Text>

        {/* Profile Section */}
        <View className="items-center mb-12">
          {/* Profile Picture */}
          <View
            className="w-32 h-32 rounded-full bg-white/10 items-center justify-center border-2 border-white/20 mb-6"
            style={{
              overflow: "hidden",
            }}
          >
            <Text
              className="text-white uppercase"
              style={{
                fontSize: 64,
                fontWeight: "900",
              }}
            >
              {getInitial()}
            </Text>
          </View>

          {/* Username */}
          <Text
            className="text-white uppercase mb-2"
            style={{
              fontSize: 24,
              fontWeight: "800",
              letterSpacing: -0.5,
            }}
          >
            {user?.email?.split("@")[0] || "User"}
          </Text>

          {/* Email */}
          <Text
            className="text-white/50"
            style={{
              fontSize: 14,
              fontWeight: "500",
            }}
          >
            {user?.email}
          </Text>
        </View>

        {/* Settings Options */}
        <View className="mb-8">
          <Text
            className="text-white/60 uppercase mb-4"
            style={{ fontSize: 12, fontWeight: "600", letterSpacing: 1.5 }}
          >
            Account
          </Text>

          {/* Liked Events Button */}
          <PressableButton onPress={() => setShowLikedEvents(true)}>
            <Text
              className="text-white uppercase"
              style={{ fontSize: 16, fontWeight: "700", letterSpacing: 0.5 }}
            >
              Liked Events
            </Text>
            <Text className="text-white/50" style={{ fontSize: 18 }}>›</Text>
          </PressableButton>

          {/* Notifications Button */}
          <PressableButton onPress={() => {}}>
            <Text
              className="text-white uppercase"
              style={{ fontSize: 16, fontWeight: "700", letterSpacing: 0.5 }}
            >
              Notifications
            </Text>
            <Text className="text-white/50" style={{ fontSize: 18 }}>›</Text>
          </PressableButton>

          {/* Privacy Button */}
          <PressableButton onPress={() => {}}>
            <Text
              className="text-white uppercase"
              style={{ fontSize: 16, fontWeight: "700", letterSpacing: 0.5 }}
            >
              Privacy
            </Text>
            <Text className="text-white/50" style={{ fontSize: 18 }}>›</Text>
          </PressableButton>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-500/10 rounded-full py-5 items-center border border-red-500/30 mt-2"
          activeOpacity={0.8}
        >
          <Text
            className="text-red-400 uppercase"
            style={{ fontSize: 16, fontWeight: "800", letterSpacing: 1 }}
          >
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* Credits */}
        <View className="items-center mt-4" style={{ paddingBottom: 160 }}>
          <Text className="text-white/30 lowercase" style={{ fontSize: 16, fontWeight: "600" }}>
            made by lieh & unseenmeli
          </Text>
          <Text className="text-white/20 lowercase mt-1" style={{ fontSize: 14, fontWeight: "500" }}>
            team lime
          </Text>
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-500 z-10"
        style={{ paddingBottom: 20, paddingTop: 15 }}
      >
        <View className="flex-row justify-around items-center px-8">
          <TouchableOpacity
            onPress={() => setActiveTab?.("home")}
            className="items-center flex-1"
            activeOpacity={1}
          >
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  activeTab === "home"
                    ? "rgba(255,255,255,0.15)"
                    : "transparent",
              }}
            >
              <Image
                source={require("../../media/home.png")}
                style={{
                  width: 25,
                  height: 25,
                  tintColor: "#ffffff",
                  resizeMode: "contain",
                  opacity: activeTab === "home" ? 1 : 0.5,
                }}
              />
            </View>
            <Text
              className="text-xs text-white uppercase"
              style={{ marginTop: 2, opacity: activeTab === "home" ? 1 : 0.5, fontWeight: "700" }}
            >
              HOME
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab?.("friends")}
            className="items-center flex-1"
            activeOpacity={1}
          >
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  activeTab === "friends"
                    ? "rgba(255,255,255,0.15)"
                    : "transparent",
              }}
            >
              <Image
                source={require("../../media/chaticon.png")}
                style={{
                  width: 25,
                  height: 25,
                  tintColor: "#ffffff",
                  resizeMode: "contain",
                  opacity: activeTab === "friends" ? 1 : 0.5,
                }}
              />
            </View>
            <Text
              className="text-xs text-white uppercase"
              style={{
                marginTop: 2,
                opacity: activeTab === "friends" ? 1 : 0.5,
                fontWeight: "700",
              }}
            >
              FRIENDS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab?.("settings")}
            className="items-center flex-1"
            activeOpacity={1}
          >
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  activeTab === "settings"
                    ? "rgba(255,255,255,0.15)"
                    : "transparent",
              }}
            >
              <Image
                source={require("../../media/settings.png")}
                style={{
                  width: 25,
                  height: 25,
                  tintColor: "#ffffff",
                  resizeMode: "contain",
                  opacity: activeTab === "settings" ? 1 : 0.5,
                }}
              />
            </View>
            <Text
              className="text-xs text-white uppercase"
              style={{
                marginTop: 2,
                opacity: activeTab === "settings" ? 1 : 0.5,
                fontWeight: "700",
              }}
            >
              SETTINGS
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
