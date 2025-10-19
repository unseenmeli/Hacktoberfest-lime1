import { i } from "@instantdb/react-native";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      nickname: i.string().unique(),
      // ↓ we'll use this to upsert/find a person by email without reading $users
      emailLower: i.string().unique().indexed(),
      createdAt: i.date().indexed(),
      genres: i.json().optional(),
    }),
    events: i.entity({
      eventId: i.string().unique().indexed(),
      title: i.string(),
      date: i.string().optional(),
      startTime: i.string().optional(),
      endTime: i.string().optional(),
      venue: i.string(),
      city: i.string().optional(),
      country: i.string().optional(),
      artists: i.json(),
      image: i.string().optional(),
      raUrl: i.string().optional(),
      ticketUrl: i.string().optional(),
      description: i.string().optional(),
    }),
    likes: i.entity({
      createdAt: i.date().indexed(),
    }),
  },
  links: {
    // each profile belongs to one Instant user
    profileUser: {
      forward: { on: "profiles", has: "one", label: "$user", onDelete: "cascade" },
      reverse: { on: "$users", has: "one", label: "profile", onDelete: "cascade" },
    },
    // many-to-many friendships (between profiles)
    profileFriends: {
      forward: { on: "profiles", has: "many", label: "friends" },
      reverse: { on: "profiles", has: "many", label: "friendsOf" },
    },
    // each like belongs to one profile and one event
    likeProfile: {
      forward: { on: "likes", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "likes" },
    },
    likeEvent: {
      forward: { on: "likes", has: "one", label: "event" },
      reverse: { on: "events", has: "many", label: "likes" },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
