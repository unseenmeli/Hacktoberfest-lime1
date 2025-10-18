import { i } from "@instantdb/react-native";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      nickname: i.string().unique(),
      // ↓ we’ll use this to upsert/find a person by email without reading $users
      emailLower: i.string().unique().indexed(),
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
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
