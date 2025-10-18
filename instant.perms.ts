// Docs: https://www.instantdb.com/docs/permissions
import type { InstantRules } from "@instantdb/react-native";

/**
 * DEV-ONLY: open profiles fully so friend adds can't be blocked.
 * We'll tighten later.
 */
const rules = {
  profiles: {
    allow: {
      view:   "true",
      create: "true",
      update: "true",   // allow updating any profile (incl. linking $user)
      delete: "true",
    },
  },
  // $users is managed by Instant; you can relax view if you like:
  "$users": {
    allow: { view: "auth.id != null" }
  },
} satisfies InstantRules;

export default rules;
