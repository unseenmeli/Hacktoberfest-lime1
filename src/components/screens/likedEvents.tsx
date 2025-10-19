import { View, Text, TouchableOpacity, Image, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import db from "../../app/db";
import useEnsureProfile from "../../lib/useEnsureProfile";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 64 - 16) / 2; // 2 cards per row with padding and gap

interface LikedEventsProps {
  onBack: () => void;
}

// Helper function to format date
function formatDate(dateString: string | null) {
  if (!dateString) return 'TBA';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

export default function LikedEvents({ onBack }: LikedEventsProps) {
  useEnsureProfile();

  const { user } = db.useAuth();

  // Get current user's profile with their likes and linked events
  const myQuery = {
    profiles: {
      $: { where: user ? { "$user.id": user.id } : { id: "never-match" }, limit: 1 },
      likes: {
        event: {}, // Get the event for each like
      },
    },
  };

  const { data: profileData, isLoading } = db.useQuery(myQuery);
  const myProfile = profileData?.profiles?.[0];
  const likes = myProfile?.likes || [];

  // Extract events from likes and format them
  const likedEvents = likes
    .map((like: any) => {
      const event = like.event;
      if (!event) return null;

      return {
        id: event.id,
        name: event.title || 'Untitled Event',
        date: formatDate(event.date),
        image: event.image || 'https://via.placeholder.com/300',
        eventId: event.eventId,
      };
    })
    .filter((event: any) => event); // Filter out any null/undefined events
  return (
    <View className="flex-1 bg-black">
      <ScrollView
        className="flex-1 px-8 pt-16"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header with Back Button */}
        <View className="flex-row items-center mb-8">
          <TouchableOpacity
            onPress={onBack}
            className="mr-4"
            activeOpacity={0.7}
          >
            <Text className="text-white text-2xl">←</Text>
          </TouchableOpacity>
          <Text
            className="text-white uppercase"
            style={{
              fontSize: 48,
              fontWeight: "900",
              letterSpacing: -2,
            }}
          >
            LIKED EVENTS
          </Text>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator color="#ffffff" size="large" />
          </View>
        )}

        {/* Grid of Liked Events */}
        {!isLoading && likedEvents.length > 0 && (
          <View className="flex-row flex-wrap" style={{ gap: 16 }}>
            {likedEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              className="bg-white/5 rounded-2xl overflow-hidden border border-white/10"
              style={{
                width: CARD_SIZE,
                height: CARD_SIZE,
              }}
              activeOpacity={0.8}
            >
              {/* Event Image */}
              <Image
                source={{ uri: event.image }}
                style={{
                  width: "100%",
                  height: "70%",
                }}
                resizeMode="cover"
              />

              {/* Event Info */}
              <View className="p-3 flex-1 justify-center">
                <Text
                  className="text-white uppercase"
                  numberOfLines={1}
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    letterSpacing: -0.5,
                  }}
                >
                  {event.name}
                </Text>
                <Text
                  className="text-white/60"
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    marginTop: 2,
                  }}
                >
                  {event.date}
                </Text>
              </View>
            </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!isLoading && likedEvents.length === 0 && (
          <View className="flex-1 items-center justify-center py-20">
            <Text
              className="text-white/40 text-center"
              style={{ fontSize: 16, fontWeight: "500" }}
            >
              No liked events yet.{"\n"}Start swiping right!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
