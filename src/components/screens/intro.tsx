import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

interface IntroProps {
  onComplete: () => void;
}

const INTRO_SLIDES = [
  {
    id: 1,
    title: "DISCOVER EVENTS",
    description: "Swipe through curated events tailored to your music taste and preferences",
    icon: require("../../media/musical-note.png"),
  },
  {
    id: 2,
    title: "SWIPE TO MATCH",
    description: "Swipe right to save events you love, left to pass. Swipe up for details",
    icon: require("../../media/palm-of-hand.png"),
  },
  {
    id: 3,
    title: "CONNECT WITH FRIENDS",
    description: "See who's attending, make new connections, and share your experiences",
    icon: require("../../media/friends (1).png"),
  },
  {
    id: 4,
    title: "AI ANALYSIS",
    description: "Get personalized insights about events, artists, and your music preferences",
    icon: require("../../media/artificial-intelligence.png"),
  },
];

export default function Intro({ onComplete }: IntroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < INTRO_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = INTRO_SLIDES[currentSlide];

  return (
    <View className="flex-1 bg-black">
      {/* Skip Button */}
      <View className="absolute top-16 right-8 z-10">
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text
            className="text-white/60 uppercase"
            style={{ fontSize: 12, fontWeight: "600", letterSpacing: 1.5 }}
          >
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-8">
        {/* Icon */}
        <View className="mb-12">
          <Image
            source={slide.icon}
            style={{
              width: 120,
              height: 120,
              tintColor: "#ffffff",
              resizeMode: "contain",
            }}
          />
        </View>

        {/* Title */}
        <Text
          className="text-white uppercase text-center mb-6"
          style={{
            fontSize: 42,
            fontWeight: "900",
            letterSpacing: -1,
          }}
        >
          {slide.title}
        </Text>

        {/* Description */}
        <Text
          className="text-white/60 text-center mb-16"
          style={{
            fontSize: 16,
            fontWeight: "400",
            lineHeight: 24,
            maxWidth: 320,
          }}
        >
          {slide.description}
        </Text>

        {/* Dots Indicator */}
        <View className="flex-row mb-12">
          {INTRO_SLIDES.map((_, index) => (
            <View
              key={index}
              className="mx-1"
              style={{
                width: currentSlide === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  currentSlide === index
                    ? "rgba(255,255,255,1)"
                    : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </View>

        {/* Next/Get Started Button */}
        <TouchableOpacity
          onPress={handleNext}
          className="bg-white rounded-full py-5 items-center w-full max-w-md"
          activeOpacity={0.8}
        >
          <Text
            className="text-black uppercase"
            style={{ fontSize: 16, fontWeight: "800", letterSpacing: 1 }}
          >
            {currentSlide === INTRO_SLIDES.length - 1
              ? "Get Started"
              : "Next"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="absolute bottom-12 left-0 right-0">
        <Text
          className="text-white/30 text-center uppercase"
          style={{ fontSize: 10, fontWeight: "600", letterSpacing: 2 }}
        >
          Discover • Connect • Experience
        </Text>
      </View>
    </View>
  );
}
