import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import db from "../../app/db";
import useEnsureProfile from "../../lib/useEnsureProfile";
import { id } from "@instantdb/react-native";

interface FriendsProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function Friends({
  activeTab = "friends",
  setActiveTab,
}: FriendsProps) {
  useEnsureProfile();

  const { user } = db.useAuth();

  // Load my profile + both directions (for requests & friends)
  const myQuery = user
    ? {
        profiles: {
          $: { where: { "$user.id": user.id }, limit: 1 },
          friends: { $: { order: { createdAt: "desc" } } }, // outgoing (me → them)
          friendsOf: { $: { order: { createdAt: "desc" } } }, // incoming (them → me)
        },
      }
    : null;

  const {
    data: meData,
    isLoading: meLoading,
    error: meError,
  } = db.useQuery(myQuery);
  const me = meData?.profiles?.[0];
  const myProfileId = me?.id as string | undefined;
  const myFriends = me?.friends ?? [];
  const myFriendsOf = me?.friendsOf ?? [];

  // Incoming requests = they linked to me, but I haven't linked back
  const incomingRequests = useMemo(() => {
    const mineIds = new Set((myFriends as any[]).map((p) => p.id));
    return (myFriendsOf as any[]).filter((p) => !mineIds.has(p.id));
  }, [myFriends, myFriendsOf]);

  // Outgoing pending = I linked to them, but they haven't linked back
  const outgoingPending = useMemo(() => {
    const theirs = new Set((myFriendsOf as any[]).map((p) => p.id));
    return (myFriends as any[]).filter((p) => !theirs.has(p.id));
  }, [myFriends, myFriendsOf]);

  // ---------- Add by email ----------
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const emailLower = email.trim().toLowerCase();
  const canSubmit = !!myProfileId && emailLower.length > 3;

  const [friendSearch, setFriendSearch] = useState(false);

  // Prefer an OWNED profile with this email (joined via $user.email)
  const byUserQuery = emailLower
    ? {
        profiles: {
          $: { where: { "$user.email": { $ilike: emailLower } }, limit: 1 },
        },
      }
    : null;
  const { data: byUserData } = db.useQuery(byUserQuery);
  const profileByUser = byUserData?.profiles?.[0];

  // Fallback: a stub (unowned) or any profile with matching emailLower
  const byEmailQuery =
    !profileByUser && emailLower
      ? { profiles: { $: { where: { emailLower }, limit: 1 } } }
      : null;
  const { data: byEmailData } = db.useQuery(byEmailQuery);
  const profileByEmail = byEmailData?.profiles?.[0];

  const targetProfile = profileByUser || profileByEmail;

  const isSelf = useMemo(
    () =>
      (user?.email || "").toLowerCase() === emailLower && emailLower.length > 0,
    [user?.email, emailLower]
  );
  const alreadyFriend = useMemo(
    () =>
      (myFriends as any[]).some(
        (f) => f.id === targetProfile?.id || f.emailLower === emailLower
      ),
    [myFriends, targetProfile?.id, emailLower]
  );

  const handleAddByEmail = async () => {
    if (!canSubmit || busy) return;
    if (isSelf) return Alert.alert("Oops", "You can't add yourself.");
    if (alreadyFriend)
      return Alert.alert("Heads up", "You're already friends.");

    try {
      setBusy(true);

      if (targetProfile) {
        // ✅ Link me → the correct profile (owned if available)
        await db.transact(
          db.tx.profiles[myProfileId!].link({ friends: targetProfile.id })
        );
        setEmail("");
        setIsSearchFocused(false);
        Alert.alert("Success", "Friend request sent!");
      } else {
        // ❌ No match at all → show error, don't create stub
        Alert.alert("User not found", "No user exists with this email address.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not add friend");
    } finally {
      setBusy(false);
    }
  };

  // Accept a request = create reciprocal link me → requester
  // Accept stays the same (creates me → requester)
  const handleAccept = async (requesterId: string) => {
    if (!myProfileId || busy) return;
    try {
      setBusy(true);
      await db.transact(
        db.tx.profiles[myProfileId].link({ friends: requesterId })
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not accept");
    } finally {
      setBusy(false);
    }
  };

  // NEW: Decline an incoming request (delete their link → me)
  const handleDecline = async (requesterId: string) => {
    if (!myProfileId || busy) return;
    try {
      setBusy(true);
      // remove requester → me
      await db.transact(
        db.tx.profiles[requesterId].unlink({ friends: myProfileId })
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not decline");
    } finally {
      setBusy(false);
    }
  };

  // UPDATED: Unfriend should remove BOTH directions
  const handleUnfriend = async (friendId: string) => {
    if (!myProfileId || busy) return;
    try {
      setBusy(true);
      await db.transact([
        // me → them
        db.tx.profiles[myProfileId].unlink({ friends: friendId }),
        // them → me
        db.tx.profiles[friendId].unlink({ friends: myProfileId }),
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not unfriend");
    } finally {
      setBusy(false);
    }
  };

  if (meLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }
  if (meError) {
    return (
      <View className="p-4 bg-black flex-1">
        <Text className="text-red-500">Error: {meError.message}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {friendSearch && (
        <>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.98)",
              zIndex: 5,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "20%",
              left: 32,
              right: 32,
              zIndex: 10,
            }}
          >
            <TextInput
              className="border border-white/20 rounded-2xl px-6 py-5 text-white bg-white/5 w-full"
              placeholder="friend@example.com"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!busy}
              onSubmitEditing={handleAddByEmail}
              returnKeyType="done"
              style={{ fontSize: 16, fontWeight: "500" }}
              autoFocus={true}
              onBlur={() => setFriendSearch(false)}
            />
          </View>
        </>
      )}
      <View className="flex-1 px-8 pt-16" style={{ paddingBottom: 140 }}>
        {/* Header */}
        <Text
          className="text-white uppercase mb-8 z-10"
          style={{
            fontSize: 48,
            fontWeight: "900",
            letterSpacing: -2,
            textShadowColor: "rgba(0,0,0,0.8)",
            textShadowOffset: { width: 0, height: 4 },
            textShadowRadius: 12,
          }}
        >
          FRIENDS
        </Text>

        <FlatList
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isSearchFocused}
          ListHeaderComponent={
            <>
              {/* Add Friend Section */}
              <View className="mb-10">
                <Text
                  className="text-white/60 uppercase mb-4"
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    letterSpacing: 1.5,
                  }}
                >
                  Add New Friend
                </Text>
                <TouchableOpacity
                  onPress={() => setFriendSearch(true)}
                  activeOpacity={0.7}
                >
                  <View
                    className="border border-white/20 rounded-2xl px-6 py-5 bg-white/5"
                    pointerEvents="none"
                  >
                    <Text
                      className="text-white/50"
                      style={{ fontSize: 16, fontWeight: "500" }}
                    >
                      friend@example.com
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* LEGACY - Expandable Add Friend (if needed) */}
              {isSearchFocused && (
                <View className="mb-10">
                  <View className="bg-black/90 rounded-2xl p-6 border border-white/20">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text
                        className="text-white uppercase"
                        style={{
                          fontSize: 24,
                          fontWeight: "900",
                          letterSpacing: -1,
                        }}
                      >
                        Add Friend
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setIsSearchFocused(false);
                          setEmail("");
                        }}
                        className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
                        activeOpacity={0.7}
                      >
                        <Text className="text-white text-xl">✕</Text>
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      className="border border-white/20 rounded-2xl px-6 py-5 text-white bg-white/5 mb-4"
                      placeholder="friend@example.com"
                      placeholderTextColor="#6b7280"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                      editable={!busy}
                      autoFocus={true}
                      style={{ fontSize: 16, fontWeight: "500" }}
                    />

                    {(alreadyFriend || isSelf || targetProfile || emailLower.length > 0) && (
                      <View className="mb-4">
                        {alreadyFriend ? (
                          <Text className="text-white/70" style={{ fontSize: 14 }}>
                            ✓ Already your friend
                          </Text>
                        ) : isSelf ? (
                          <Text className="text-white/70" style={{ fontSize: 14 }}>
                            That's you
                          </Text>
                        ) : targetProfile ? (
                          <Text className="text-white/80" style={{ fontSize: 14 }}>
                            Found:{" "}
                            <Text className="font-semibold">{targetProfile.nickname}</Text>
                          </Text>
                        ) : emailLower.length > 0 ? (
                          <Text className="text-red-400" style={{ fontSize: 14 }}>
                            User not found
                          </Text>
                        ) : null}
                      </View>
                    )}

                    <TouchableOpacity
                      disabled={!canSubmit || busy || alreadyFriend || isSelf || !targetProfile}
                      onPress={handleAddByEmail}
                      className={`rounded-full py-5 items-center ${
                        !canSubmit || busy || alreadyFriend || isSelf || !targetProfile
                          ? "bg-white/20"
                          : "bg-white"
                      }`}
                      activeOpacity={0.8}
                    >
                      <Text
                        className="uppercase"
                        style={{
                          fontSize: 16,
                          fontWeight: "800",
                          letterSpacing: 1,
                          color:
                            !canSubmit || busy || alreadyFriend || isSelf || !targetProfile
                              ? "rgba(255,255,255,0.6)"
                              : "#000000",
                        }}
                      >
                        {busy ? "Adding..." : "Add Friend"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Friend Requests */}
              {incomingRequests.length > 0 && (
                <View className="mb-10">
                  <Text
                    className="text-white/60 uppercase mb-4"
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      letterSpacing: 1.5,
                    }}
                  >
                    Requests ({incomingRequests.length})
                  </Text>
                  {incomingRequests.map((item: any) => (
                    <View
                      key={item.id}
                      className="mb-4 bg-white/5 rounded-2xl p-5 border border-white/10"
                    >
                      <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-1">
                          <Text
                            className="text-white uppercase"
                            style={{
                              fontSize: 20,
                              fontWeight: "800",
                              letterSpacing: -0.5,
                            }}
                          >
                            {item.nickname}
                          </Text>
                          {item.emailLower && (
                            <Text
                              className="text-white/50 mt-1"
                              style={{ fontSize: 13 }}
                            >
                              {item.emailLower}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View className="flex-row gap-3">
                        <TouchableOpacity
                          disabled={busy}
                          onPress={() => handleAccept(item.id)}
                          className="flex-1 bg-white rounded-full py-4 items-center"
                          activeOpacity={0.8}
                        >
                          <Text
                            className="text-black uppercase"
                            style={{
                              fontSize: 14,
                              fontWeight: "800",
                              letterSpacing: 1,
                            }}
                          >
                            Accept
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={busy}
                          onPress={() => handleDecline(item.id)}
                          className="flex-1 bg-white/10 rounded-full py-4 items-center border border-white/20"
                          activeOpacity={0.8}
                        >
                          <Text
                            className="text-white uppercase"
                            style={{
                              fontSize: 14,
                              fontWeight: "800",
                              letterSpacing: 1,
                            }}
                          >
                            Decline
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Your Friends Header */}
              <Text
                className="text-white/60 uppercase mb-4"
                style={{ fontSize: 12, fontWeight: "600", letterSpacing: 1.5 }}
              >
                Friends ({myFriends.length})
              </Text>
            </>
          }
          data={myFriends}
          keyExtractor={(item: any) => item.id}
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Text
                className="text-white/40 text-center"
                style={{ fontSize: 16, fontWeight: "500" }}
              >
                No friends yet.{"\n"}Add someone to get started!
              </Text>
            </View>
          }
          renderItem={({ item }: any) => (
            <View className="mb-4 flex-row items-start">
              {/* Profile Picture */}
              <View
                className="w-16 h-16 rounded-full bg-white/10 items-center justify-center border border-white/20 mr-4"
                style={{
                  overflow: "hidden",
                }}
              >
                <Text
                  className="text-white uppercase"
                  style={{
                    fontSize: 24,
                    fontWeight: "800",
                  }}
                >
                  {item.nickname ? item.nickname.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>

              {/* Name and Unfriend Button Column */}
              <View className="flex-1 flex-col">
                {/* Name and Info */}
                <View className="flex-row items-center mb-2">
                  <Text
                    className="text-white uppercase"
                    style={{
                      fontSize: 18,
                      fontWeight: "800",
                      letterSpacing: -0.5,
                    }}
                  >
                    {item.nickname}
                  </Text>
                  {!myFriendsOf.some((p: any) => p.id === item.id) && (
                    <View
                      className="rounded-full ml-2 border border-yellow-500/30"
                      style={{
                        backgroundColor: "rgba(234, 179, 8, 0.15)",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <Text
                        className="text-yellow-500 uppercase"
                        style={{
                          fontSize: 9,
                          fontWeight: "700",
                          letterSpacing: 0.5,
                        }}
                      >
                        Pending
                      </Text>
                    </View>
                  )}
                </View>
                {item.emailLower && (
                  <Text className="text-white/50 mb-2" style={{ fontSize: 12 }}>
                    {item.emailLower}
                  </Text>
                )}

                {/* Unfriend Button */}
                <TouchableOpacity
                  disabled={busy}
                  onPress={() => handleUnfriend(item.id)}
                  className="bg-red-500/10 rounded-full py-2 items-center border border-red-500/30"
                  activeOpacity={0.8}
                >
                  <Text
                    className="text-red-400 uppercase"
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      letterSpacing: 0.5,
                    }}
                  >
                    Unfriend
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

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
              style={{
                marginTop: 2,
                opacity: activeTab === "home" ? 1 : 0.5,
                fontWeight: "700",
              }}
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
