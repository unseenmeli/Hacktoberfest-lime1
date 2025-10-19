import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { height } = Dimensions.get("window");

interface ChooseGenreProps {
  onComplete: (genres: string[]) => void;
}

const GENRES = [
  "Techno",
  "House",
  "Underground",
  "Rock",
  "R&B",
  "Hip Hop",
  "Electronic",
  "Indie",
  "Pop",
  "Jazz",
  "Trap",
  "Drum & Bass",
  "Dubstep",
  "Trance",
  "Disco",
  "Funk",
];

function GenreButton({ genre, isSelected, onPress }: { genre: string; isSelected: boolean; onPress: () => void }) {
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
      style={{ flex: 1, minWidth: "45%" }}
    >
      <View
        className="rounded-2xl py-4 px-6 mb-3 border overflow-hidden"
        style={{
          backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          borderColor: isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
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
        <Text
          className="text-white uppercase text-center"
          style={{
            fontSize: 14,
            fontWeight: isSelected ? "800" : "600",
            letterSpacing: 0.5,
            zIndex: 1,
          }}
        >
          {genre}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ChooseGenre({ onComplete }: ChooseGenreProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleContinue = () => {
    if (selectedGenres.length > 0) {
      onComplete(selectedGenres);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        className="flex-1 px-8 pt-16"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text
          className="text-white uppercase mb-4"
          style={{
            fontSize: 48,
            fontWeight: "900",
            letterSpacing: -2,
            textShadowColor: "rgba(0,0,0,0.8)",
            textShadowOffset: { width: 0, height: 4 },
            textShadowRadius: 12,
          }}
        >
          CHOOSE YOUR VIBE
        </Text>

        <Text
          className="text-white/60 mb-8"
          style={{
            fontSize: 16,
            fontWeight: "500",
            lineHeight: 24,
          }}
        >
          Select your favorite music genres to get personalized event recommendations
        </Text>

        {/* Selected count */}
        {selectedGenres.length > 0 && (
          <View className="mb-6">
            <Text
              className="text-white/80"
              style={{
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {selectedGenres.length} selected
            </Text>
          </View>
        )}

        {/* Genre Grid */}
        <View className="flex-row flex-wrap justify-between">
          {GENRES.map((genre) => (
            <GenreButton
              key={genre}
              genre={genre}
              isSelected={selectedGenres.includes(genre)}
              onPress={() => toggleGenre(genre)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-black border-t border-white/10 px-8"
        style={{ paddingBottom: 40, paddingTop: 20 }}
      >
        <TouchableOpacity
          onPress={handleContinue}
          disabled={selectedGenres.length === 0}
          className="rounded-full py-5 items-center"
          style={{
            backgroundColor: selectedGenres.length > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
          }}
          activeOpacity={0.8}
        >
          <Text
            className="uppercase"
            style={{
              fontSize: 16,
              fontWeight: "800",
              letterSpacing: 1,
              color: selectedGenres.length > 0 ? '#000000' : 'rgba(255, 255, 255, 0.6)',
            }}
          >
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
