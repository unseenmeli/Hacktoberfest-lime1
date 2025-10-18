import { useEffect, useRef } from "react";
import db from "../app/db";
import { id } from "@instantdb/react-native";

export default function useEnsureProfile() {
  const { user } = db.useAuth();
  const creatingRef = useRef(false);

  const myQuery = user
    ? { profiles: { $: { where: { "$user.id": user.id }, limit: 1 } } }
    : null;
  const { data: meData, isLoading } = db.useQuery(myQuery);
  const me = meData?.profiles?.[0];

  const emailLower = (user?.email || "").toLowerCase();

  // Look up any profile that already has this emailLower (could be a stub)
  const byEmailQuery =
    user && emailLower
      ? { profiles: { $: { where: { emailLower }, limit: 1 } } }
      : null;
  const { data: byEmailData } = db.useQuery(byEmailQuery);
  const profileByEmail = byEmailData?.profiles?.[0];

  useEffect(() => {
    if (!user || isLoading || creatingRef.current) return;

    const run = async () => {
      creatingRef.current = true;
      try {
        if (me) {
          // Only set emailLower if (a) I don't have it yet AND (b) nobody else already has it
          const someoneElseHasIt =
            !!profileByEmail && profileByEmail.id !== me.id;

          if (!me.emailLower && emailLower && !someoneElseHasIt) {
            await db.transact(db.tx.profiles[me.id].merge({ emailLower }));
          }

          // Otherwise do nothing (avoid uniqueness error). We can tidy duplicates later.
          return;
        }

        // No profile yet: if a stub with my email exists, try to claim it
        if (profileByEmail) {
          try {
            await db.transact(
              db.tx.profiles[profileByEmail.id].link({ $user: user.id })
            );
            // Don't touch emailLower here; it already exists on the stub
            return;
          } catch (e) {
            // Claiming failed (perms/race) — fall through to create fresh
            console.warn("claim stub failed", e);
          }
        }

        // Create fresh owned profile
        const nickname =
          (user.email?.split("@")[0] || "user") +
          "-" +
          Math.floor(Math.random() * 10000);
        const profileId = id();
        await db.transact(
          db.tx.profiles[profileId]
            .update({
              nickname,
              emailLower, // safe: we only get here if no profileByEmail exists
              createdAt: new Date().toISOString(),
            })
            .link({ $user: user.id })
        );
      } catch (e) {
        // Prevents “Possible Unhandled Promise Rejection (id: 0)”
        console.warn("useEnsureProfile error", e);
      } finally {
        creatingRef.current = false;
      }
    };

    run();
  }, [user, isLoading, me, profileByEmail, emailLower]);
}
