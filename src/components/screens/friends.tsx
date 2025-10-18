import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import db from "../../app/db";
import useEnsureProfile from "../../lib/useEnsureProfile";
import { id } from "@instantdb/react-native";

export default function Friends() {
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
  const emailLower = email.trim().toLowerCase();
  const canSubmit = !!myProfileId && emailLower.length > 3;

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
    if (isSelf) return Alert.alert("Oops", "You can’t add yourself.");
    if (alreadyFriend)
      return Alert.alert("Heads up", "You’re already friends.");

    try {
      setBusy(true);

      if (targetProfile) {
        // ✅ Link me → the correct profile (owned if available, otherwise stub)
        await db.transact(
          db.tx.profiles[myProfileId!].link({ friends: targetProfile.id })
        );
      } else {
        // ✅ No match at all → create a stub WITHOUT $user and link me → stub
        const stubId = id();
        await db.transact([
          db.tx.profiles[stubId].update({
            nickname:
              emailLower.split("@")[0] +
              "-" +
              Math.floor(Math.random() * 10000),
            emailLower,
            createdAt: new Date().toISOString(),
          }),
          db.tx.profiles[myProfileId!].link({ friends: stubId }),
        ]);
      }

      setEmail("");
      Alert.alert("Success", "Friend added (they’ll see a request).");
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
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }
  if (meError) {
    return (
      <View className="p-4">
        <Text className="text-red-500">Error: {meError.message}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-6">
      {/* Add Friend */}
      <View className="mb-6">
        <Text className="text-white/90 text-lg mb-2">Add friend by email</Text>
        <TextInput
          className="border border-white/20 rounded-xl px-4 py-3 text-white"
          placeholder="friend@example.com"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!busy}
        />
        <View className="mt-3 flex-row items-center">
          <TouchableOpacity
            disabled={!canSubmit || busy || alreadyFriend || isSelf}
            onPress={handleAddByEmail}
            className={`px-4 py-3 rounded-xl ${
              !canSubmit || busy || alreadyFriend || isSelf
                ? "bg-white/20"
                : "bg-white"
            }`}
          >
            <Text
              className={`font-semibold ${
                !canSubmit || busy || alreadyFriend || isSelf
                  ? "text-white/60"
                  : "text-black"
              }`}
            >
              {busy ? "Working..." : "Add Friend"}
            </Text>
          </TouchableOpacity>

          <View className="ml-3">
            {alreadyFriend ? (
              <Text className="text-white/70">Already your friend</Text>
            ) : isSelf ? (
              <Text className="text-white/70">That’s you 🙂</Text>
            ) : targetProfile ? (
              <Text className="text-white/80">
                Found:{" "}
                <Text className="font-semibold">{targetProfile.nickname}</Text>
              </Text>
            ) : emailLower.length > 0 ? (
              <Text className="text-white/60">Will create a stub profile</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Incoming Requests */}
      <View className="mb-6">
        <Text className="text-white/90 text-lg mb-2">
          Friend Requests ({incomingRequests.length})
        </Text>
        {incomingRequests.length === 0 ? (
          <Text className="text-white/60">No incoming requests.</Text>
        ) : (
          <FlatList
            data={incomingRequests}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: any) => (
              <View className="flex-row items-center justify-between py-3 border-b border-white/10">
                <View>
                  <Text className="text-white font-semibold">
                    {item.nickname}
                  </Text>
                  {item.emailLower ? (
                    <Text className="text-white/50 text-xs">
                      {item.emailLower}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  disabled={busy}
                  onPress={() => handleAccept(item.id)}
                  className="px-3 py-2 rounded-lg bg-white"
                >
                  <Text className="text-black font-semibold">Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={busy}
                  onPress={() => handleDecline(item.id)}
                  className="px-3 py-2 rounded-lg bg-white/10 mr-2"
                >
                  <Text className="text-white/90">Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* Your Friends */}
      <Text className="text-white/90 text-lg mb-2">Your Friends</Text>
      <FlatList
        data={myFriends}
        keyExtractor={(item: any) => item.id}
        ListEmptyComponent={
          <Text className="text-white/60">You don’t have any friends yet.</Text>
        }
        renderItem={({ item }: any) => (
          <View className="flex-row items-center justify-between py-3 border-b border-white/10">
            <View>
              <Text className="text-white font-semibold">{item.nickname}</Text>
              {item.emailLower ? (
                <Text className="text-white/50 text-xs">{item.emailLower}</Text>
              ) : null}
              {!myFriendsOf.some((p: any) => p.id === item.id) ? (
                <Text className="text-white/50 text-xs mt-1">Pending</Text>
              ) : null}
            </View>
            <TouchableOpacity
              disabled={busy}
              onPress={() => handleUnfriend(item.id)}
              className="px-3 py-2 rounded-lg bg-white/10"
            >
              <Text className="text-white/90">Unfriend</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
