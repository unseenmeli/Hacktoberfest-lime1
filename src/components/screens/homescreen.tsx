import { LinearGradient } from "expo-linear-gradient";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import Friends from "./friends";
import Settings from "./settings";
import db from "../../app/db";
import { useState, useEffect } from "react";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import useEnsureProfile from "../../lib/useEnsureProfile";
import { id } from "@instantdb/react-native";
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

// Helper function to transform event data
function transformEvent(event: any, index: number) {
  // Format date from YYYY-MM-DD to DD.MM.YY
  let formattedDate = 'TBA';
  let fullDateTime = 'TBA';

  if (event.date) {
    const dateObj = new Date(event.date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = String(dateObj.getFullYear()).slice(-2);
    formattedDate = `${day}.${month}.${year}`;

    // Create a more detailed date/time string for the detail view
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = monthNames[dateObj.getMonth()];
    fullDateTime = `${monthName} ${day}, 20${year}`;

    if (event.startTime) {
      fullDateTime += ` • ${event.startTime}`;
      formattedDate += ` • ${event.startTime}`;
    }

    if (event.endTime) {
      fullDateTime += ` - ${event.endTime}`;
    }
  }

  return {
    id: event.eventId || event.id || `event-${index}`,
    name: event.title,
    date: formattedDate,
    fullDateTime: fullDateTime,
    location: `${event.city}, ${event.country === 'GE' ? 'Georgia' : event.country}`,
    description: event.description || `Join us at ${event.venue} for an unforgettable night of music and entertainment.`,
    lineup: event.artists || [],
    venue: event.venue,
    image: event.image,
    ticketUrl: event.raUrl || event.ticketUrl || '',
  };
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");

  // Early return BEFORE any other hooks are called
  if (activeTab === "friends") {
    return <Friends activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  if (activeTab === "settings") {
    return <Settings activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  return <HomeContent activeTab={activeTab} setActiveTab={setActiveTab} />;
}

function HomeContent({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  useEnsureProfile();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const nameOpacity = useSharedValue(0);
  const cardTranslateX = useSharedValue(0);

  const { user } = db.useAuth();

  // Get current user's profile
  const myQuery = {
    profiles: {
      $: { where: user ? { "$user.id": user.id } : { id: "never-match" }, limit: 1 },
    },
  };

  const { data: profileData } = db.useQuery(myQuery);
  const myProfile = profileData?.profiles?.[0];

  // Fetch events from InstantDB
  const { isLoading, error, data } = db.useQuery({ events: {} });

  // Debug logging
  useEffect(() => {
    console.log('Events query state:', {
      isLoading,
      hasError: !!error,
      error: error?.message || error,
      hasData: !!data,
      eventCount: data?.events?.length,
      dataKeys: data ? Object.keys(data) : []
    });
    if (data && !data.events) {
      console.log('Data exists but no events property:', data);
    }
  }, [isLoading, error, data]);

  // Transform the events data to match the card structure
  const CARDS_DATA = data?.events
    ? data.events.map((event: any, index: number) => transformEvent(event, index))
    : [];

  const handleSwipeLeft = () => {
    console.log("Nope!");
    setCurrentIndex((prev) => prev + 1);
    setShowDetails(false);
  };

  const handleSwipeRight = async () => {
    const currentCard = CARDS_DATA[currentIndex];

    // Save the like to the database
    if (myProfile && currentCard) {
      try {
        // Find the event in the database by eventId
        const eventToLike = data?.events.find((e: any) => e.eventId === currentCard.id);

        if (eventToLike) {
          // Create a new like with timestamp
          const likeId = id();
          await db.transact([
            db.tx.likes[likeId].update({
              createdAt: new Date(),
            }),
            // Link the like to the user's profile
            db.tx.likes[likeId].link({
              profile: myProfile.id,
            }),
            // Link the like to the event
            db.tx.likes[likeId].link({
              event: eventToLike.id,
            }),
          ]);

          console.log(`Like saved! User: ${user?.email}, Event: ${currentCard.name} (${currentCard.id})`);
        } else {
          console.error("Event not found in database");
        }
      } catch (error) {
        console.error("Error saving like:", error);
      }
    } else {
      console.log("Cannot save like - profile or card missing");
    }

    setCurrentIndex((prev) => prev + 1);
    setShowDetails(false);
  };

  const handleSwipeUp = () => {
    console.log("Show details!");
    setShowDetails(true);
  };

  const currentCard = CARDS_DATA[currentIndex];

  // Fade in the name and date when a new card appears
  useEffect(() => {
    nameOpacity.value = withTiming(1, { duration: 800 });
    cardTranslateX.value = 0;
  }, [currentIndex]);

  const nameAnimatedStyle = useAnimatedStyle(() => {
    // Fade out name as card is being swiped
    const swipeOpacity = interpolate(
      Math.abs(cardTranslateX.value),
      [0, SWIPE_THRESHOLD],
      [1, 0]
    );

    return {
      opacity: nameOpacity.value * swipeOpacity,
    };
  });

  // Show loading state with timeout - don't block indefinitely
  const [showLoadingTimeout, setShowLoadingTimeout] = useState(false);

  useEffect(() => {
    if (isLoading && !data) {
      const timer = setTimeout(() => {
        setShowLoadingTimeout(true);
      }, 5000); // After 5 seconds, show alternative message

      return () => clearTimeout(timer);
    }
  }, [isLoading, data]);

  if (isLoading && !data && !showLoadingTimeout) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white text-xl">Loading events...</Text>
      </View>
    );
  }

  if (isLoading && !data && showLoadingTimeout) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <Text className="text-white text-xl font-bold mb-4">Taking longer than expected...</Text>
        <Text className="text-white/60 text-center mb-6">
          This might be a network issue or the events may not be loaded in the database yet.
        </Text>
        <Text className="text-white/40 text-sm text-center">
          Check your console logs for details.
        </Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white text-xl font-bold">Error loading events</Text>
        <Text className="text-white/60 mt-2">{error.message}</Text>
      </View>
    );
  }

  // If no events in database, show empty state (don't block on loading)
  if (CARDS_DATA.length === 0) {
    console.log("No events found in database");
  }

  return (
    <View className="flex-1 relative bg-black">
      {currentIndex >= CARDS_DATA.length ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-2xl font-bold">No more events!</Text>
          <Text className="text-white/60 mt-2">Check back later</Text>
        </View>
      ) : (
        <>
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
            cardTranslateX={cardTranslateX}
          />

          <Animated.View
            className="absolute left-0 right-0 px-8 z-[2]"
            style={[nameAnimatedStyle, { bottom: 140, height: 135, justifyContent: "flex-end" }]}
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
          </Animated.View>
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
              className="text-xs text-white uppercase"
              style={{ marginTop: 2, opacity: activeTab === "home" ? 1 : 0.5, fontWeight: "700" }}
            >
              HOME
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

interface SwipeCardProps {
  card: typeof CARDS_DATA[0];
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  showDetails: boolean;
  setShowDetails: (value: boolean) => void;
  cardTranslateX: Animated.SharedValue<number>;
}

function SwipeCard({
  card,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  showDetails,
  setShowDetails,
  cardTranslateX,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Fade in animation when card appears
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
  }, [card.id]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      cardTranslateX.value = event.translationX;
    })
    .onEnd(() => {
      if (translateY.value < -100) {
        runOnJS(onSwipeUp)();
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        cardTranslateX.value = withSpring(0);
        return;
      }

      if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-width * 1.5, { duration: 300 }, () => {
          runOnJS(onSwipeLeft)();
        });
        opacity.value = withTiming(0, { duration: 300 });
        return;
      }

      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withTiming(width * 1.5, { duration: 300 }, () => {
          runOnJS(onSwipeRight)();
        });
        opacity.value = withTiming(0, { duration: 300 });
        return;
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      cardTranslateX.value = withSpring(0);
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
              source={{ uri: card.image }}
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

      {showDetails && (
        <View
          className="absolute left-0 right-0 bg-black z-[50]"
          style={{
            top: 0,
            height: height,
          }}
        >
          <View className="flex-1 pt-16 px-8">
            <TouchableOpacity
              onPress={closeDetailPanel}
              className="self-end mb-8"
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center border border-white/20">
                <Text className="text-white text-2xl font-bold">✕</Text>
              </View>
            </TouchableOpacity>

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
                  {card.fullDateTime}
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
                  numberOfLines={isDescriptionExpanded ? undefined : 3}
                >
                  {card.description}
                </Text>
                {card.description.length > 150 && (
                  <TouchableOpacity
                    onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2"
                    activeOpacity={0.7}
                  >
                    <Text
                      className="text-white/60 uppercase"
                      style={{ fontSize: 12, fontWeight: "600", letterSpacing: 1 }}
                    >
                      {isDescriptionExpanded ? "See Less" : "See More"}
                    </Text>
                  </TouchableOpacity>
                )}
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
                className="bg-green-500/10 rounded-full py-5 items-center mt-4 border border-green-500/30"
                activeOpacity={0.8}
              >
                <Text
                  className="text-green-500 uppercase"
                  style={{ fontSize: 16, fontWeight: "800", letterSpacing: 1 }}
                >
                  AI Analysis
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white rounded-full py-5 items-center mt-4"
                activeOpacity={0.8}
                onPress={() => {
                  if (card.ticketUrl) {
                    Linking.openURL(card.ticketUrl).catch(err =>
                      console.error('Failed to open URL:', err)
                    );
                  }
                }}
                disabled={!card.ticketUrl}
                style={{
                  opacity: card.ticketUrl ? 1 : 0.5,
                }}
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
