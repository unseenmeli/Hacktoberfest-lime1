import { View, Text, TouchableOpacity, Image, Alert, ScrollView } from "react-native";
import db from "../../app/db";
import useEnsureProfile from "../../lib/useEnsureProfile";

interface SettingsProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function Settings({ activeTab = "settings", setActiveTab }: SettingsProps) {
  useEnsureProfile();

  const { user } = db.useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await db.auth.signOut();
          },
        },
      ]
    );
  };

  const getInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "?";
  };

  return (
    <View className="flex-1 bg-black">
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

          {/* Edit Profile Button */}
          <TouchableOpacity
            className="bg-white/5 rounded-2xl py-5 px-6 mb-3 border border-white/10 flex-row items-center justify-between"
            activeOpacity={0.8}
          >
            <Text
              className="text-white uppercase"
              style={{ fontSize: 16, fontWeight: "700", letterSpacing: 0.5 }}
            >
              Edit Profile
            </Text>
            <Text className="text-white/50" style={{ fontSize: 18 }}>›</Text>
          </TouchableOpacity>

          {/* Notifications Button */}
          <TouchableOpacity
            className="bg-white/5 rounded-2xl py-5 px-6 mb-3 border border-white/10 flex-row items-center justify-between"
            activeOpacity={0.8}
          >
            <Text
              className="text-white uppercase"
              style={{ fontSize: 16, fontWeight: "700", letterSpacing: 0.5 }}
            >
              Notifications
            </Text>
            <Text className="text-white/50" style={{ fontSize: 18 }}>›</Text>
          </TouchableOpacity>

          {/* Privacy Button */}
          <TouchableOpacity
            className="bg-white/5 rounded-2xl py-5 px-6 mb-3 border border-white/10 flex-row items-center justify-between"
            activeOpacity={0.8}
          >
            <Text
              className="text-white uppercase"
              style={{ fontSize: 16, fontWeight: "700", letterSpacing: 0.5 }}
            >
              Privacy
            </Text>
            <Text className="text-white/50" style={{ fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-500/10 rounded-full py-5 items-center border border-red-500/30 mt-4"
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
        <View className="items-center pb-32 mt-8">
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
