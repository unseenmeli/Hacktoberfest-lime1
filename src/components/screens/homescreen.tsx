import { LinearGradient } from "expo-linear-gradient";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from "react-native-reanimated";

const { height, width } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.3;

// Sample cards data
const CARDS_DATA = [
  {
    id: 1,
    name: "BASIANI",
    date: "17.10.25 • 23:59",
    location: "Tbilisi, Georgia",
    description:
      "Experience the legendary underground techno club that has become a symbol of freedom and expression. Join us for a night of immersive electronic music with world-renowned DJs.",
    lineup: ["Amelie Lens", "Ben Klock", "Marcel Dettmann"],
  },
  {
    id: 2,
    name: "BASSIANI OPEN AIR",
    date: "24.10.25 • 22:00",
    location: "Tbilisi, Georgia",
    description:
      "Take the Bassiani experience outdoors for a special open-air event featuring international headliners and local heroes.",
    lineup: ["Tale of Us", "Âme", "Recondite"],
  },
  {
    id: 3,
    name: "BASSIANI AFTERHOURS",
    date: "01.11.25 • 06:00",
    location: "Tbilisi, Georgia",
    description:
      "When the night ends, the party continues. Join us for an intimate afterhours session with special guests.",
    lineup: ["DVS1", "Dax J", "Kobosil"],
  },
  {
    id: 4,
    name: "BASSIANI ANNIVERSARY",
    date: "15.11.25 • 23:00",
    location: "Tbilisi, Georgia",
    description:
      "Celebrating another year of pushing boundaries and creating unforgettable moments on the dance floor.",
    lineup: ["Nina Kraviz", "I Hate Models", "Clouds"],
  },
  {
    id: 5,
    name: "BASSIANI NEW YEAR",
    date: "31.12.25 • 23:00",
    location: "Tbilisi, Georgia",
    description:
      "Ring in the new year with the most legendary techno marathon of the season. 24 hours of non-stop music.",
    lineup: ["Adam Beyer", "Charlotte de Witte", "Amelie Lens"],
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const handleSwipeLeft = () => {
    console.log("Nope!");
    setCurrentIndex((prev) => prev + 1);
    setShowDetails(false);
  };

  const handleSwipeRight = () => {
    console.log("Like!");
    setCurrentIndex((prev) => prev + 1);
    setShowDetails(false);
  };

  const handleSwipeUp = () => {
    console.log("Show details!");
    setShowDetails(true);
  };

  const currentCard = CARDS_DATA[currentIndex];

  return (
    <View className="flex-1 relative bg-black">
      {currentIndex >= CARDS_DATA.length ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-2xl font-bold">No more events!</Text>
          <Text className="text-white/60 mt-2">Check back later</Text>
        </View>
      ) : (
        <>
          {/* Black background */}
          <View
            className="absolute bg-black"
            style={{
              width: width,
              height: height,
              top: 0,
              left: 0,
            }}
          />

          <SwipeCard
            key={currentCard.id}
            card={currentCard}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeUp={handleSwipeUp}
            showDetails={showDetails}
            setShowDetails={setShowDetails}
          />

          <View
            className="absolute left-0 right-0 px-8 bg-black z-[2]"
            style={{ bottom: 140, height: 135, justifyContent: "flex-end" }}
          >
            <Text
              className="text-white uppercase"
              numberOfLines={2}
              adjustsFontSizeToFit
              style={{
                fontSize: 52,
                fontWeight: "900",
                letterSpacing: -2,
                textShadowColor: "rgba(0,0,0,0.8)",
                textShadowOffset: { width: 0, height: 4 },
                textShadowRadius: 12,
                marginBottom: 12,
              }}
            >
              {currentCard.name}
            </Text>
            <View
              className="rounded-full self-start border border-white/20"
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                paddingHorizontal: 20,
                paddingVertical: 10,
              }}
            >
              <Text
                className="text-white"
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  letterSpacing: 1.2,
                }}
              >
                {currentCard.date}
              </Text>
            </View>
          </View>
        </>
      )}

      <View
        className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-500 z-10"
        style={{ paddingBottom: 20, paddingTop: 15 }}
      >
        <View className="flex-row justify-around items-center px-8">
          <TouchableOpacity
            onPress={() => setActiveTab("home")}
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
              className="text-xs text-white"
              style={{ marginTop: 2, opacity: activeTab === "home" ? 1 : 0.5 }}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("friends")}
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
              className="text-xs text-white"
              style={{
                marginTop: 2,
                opacity: activeTab === "friends" ? 1 : 0.5,
              }}
            >
              Friends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("settings")}
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
              className="text-xs text-white"
              style={{
                marginTop: 2,
                opacity: activeTab === "settings" ? 1 : 0.5,
              }}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

interface SwipeCardProps {
  card: typeof CARDS_DATA[0];
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  showDetails: boolean;
  setShowDetails: (value: boolean) => void;
}

function SwipeCard({
  card,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  showDetails,
  setShowDetails,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      // Check for swipe up
      if (translateY.value < -100) {
        runOnJS(onSwipeUp)();
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        return;
      }

      // Check for swipe left (Nope)
      if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-width * 1.5, { duration: 300 }, () => {
          runOnJS(onSwipeLeft)();
        });
        opacity.value = withTiming(0, { duration: 300 });
        return;
      }

      // Check for swipe right (Like)
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withTiming(width * 1.5, { duration: 300 }, () => {
          runOnJS(onSwipeRight)();
        });
        opacity.value = withTiming(0, { duration: 300 });
        return;
      }

      // Return to center
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-width / 2, 0, width / 2],
      [-30, 0, 30]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
      opacity: opacity.value,
    };
  });

  const likeOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]);
    return { opacity };
  });

  const nopeOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0]
    );
    return { opacity };
  });

  const closeDetailPanel = () => {
    setShowDetails(false);
  };

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[animatedStyle, { position: "absolute", width: width, height: height }]}
          className="bg-black"
        >
          <View
            style={{ width: width, height: height * 0.7, position: "relative" }}
          >
            <Image
              source={require("../../../assets/images/basiani.png")}
              style={{ width: width, height: height * 0.7 }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.3)",
                "rgba(128,128,128,0.5)",
                "rgba(0,0,0,0.8)",
                "#000000",
              ]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </View>

          {/* LIKE label */}
          <Animated.View
            style={[
              likeOpacityStyle,
              {
                position: "absolute",
                top: 50,
                left: 30,
                transform: [{ rotate: "-20deg" }],
              },
            ]}
          >
            <View className="border-4 border-green-500 rounded-lg px-6 py-3">
              <Text className="text-green-500 text-4xl font-bold">LIKE</Text>
            </View>
          </Animated.View>

          {/* NOPE label */}
          <Animated.View
            style={[
              nopeOpacityStyle,
              {
                position: "absolute",
                top: 50,
                right: 30,
                transform: [{ rotate: "20deg" }],
              },
            ]}
          >
            <View className="border-4 border-red-500 rounded-lg px-6 py-3">
              <Text className="text-red-500 text-4xl font-bold">NOPE</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Detail Panel */}
      {showDetails && (
        <View
          className="absolute left-0 right-0 bg-black z-[50]"
          style={{
            top: 0,
            height: height,
          }}
        >
          <View className="flex-1 pt-16 px-8">
            {/* Close Button */}
            <TouchableOpacity
              onPress={closeDetailPanel}
              className="self-end mb-8"
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center border border-white/20">
                <Text className="text-white text-2xl font-bold">✕</Text>
              </View>
            </TouchableOpacity>

            {/* Event Details */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 140 }}
            >
              <Text
                className="text-white uppercase mb-6"
                style={{
                  fontSize: 48,
                  fontWeight: "900",
                  letterSpacing: -2,
                }}
              >
                {card.name}
              </Text>

              <View className="mb-8">
                <Text
                  className="text-white/60 uppercase mb-2"
                  style={{ fontSize: 12, fontWeight: "600", letterSpacing: 1.5 }}
                >
                  Date & Time
                </Text>
                <Text
                  className="text-white"
                  style={{ fontSize: 24, fontWeight: "700" }}
                >
                  {card.date}
                </Text>
              </View>

              <View className="mb-8">
                <Text
                  className="text-white/60 uppercase mb-2"
                  style={{ fontSize: 12, fontWeight: "600", letterSpacing: 1.5 }}
                >
                  Location
                </Text>
                <Text
                  className="text-white"
                  style={{ fontSize: 18, fontWeight: "500" }}
                >
                  {card.location}
                </Text>
              </View>

              <View className="mb-8">
                <Text
                  className="text-white/60 uppercase mb-2"
                  style={{ fontSize: 12, fontWeight: "600", letterSpacing: 1.5 }}
                >
                  Description
                </Text>
                <Text
                  className="text-white/80 leading-6"
                  style={{ fontSize: 16 }}
                >
                  {card.description}
                </Text>
              </View>

              <View className="mb-8">
                <Text
                  className="text-white/60 uppercase mb-4"
                  style={{ fontSize: 12, fontWeight: "600", letterSpacing: 1.5 }}
                >
                  Lineup
                </Text>
                <View className="space-y-3">
                  {card.lineup.map((artist, idx) => (
                    <View
                      key={idx}
                      className="bg-white/5 rounded-2xl p-4 border border-white/10"
                    >
                      <Text
                        className="text-white"
                        style={{ fontSize: 16, fontWeight: "600" }}
                      >
                        {artist}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                className="bg-white rounded-full py-5 items-center mt-4"
                activeOpacity={0.8}
              >
                <Text
                  className="text-black uppercase"
                  style={{ fontSize: 16, fontWeight: "800", letterSpacing: 1 }}
                >
                  Get Tickets
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </>
  );
}
