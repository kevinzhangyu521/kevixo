export function isCoachCheckoutEnabled(value: string | undefined) {
  return value === "true";
}

export type CoachCheckoutAccess = "allowed" | "already_subscribed" | "closed" | "unauthenticated";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseCoachCheckoutTestUserIds(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => uuidPattern.test(entry)),
  );
}

export function getCoachCheckoutAccess({
  globalEnabled,
  isCoach,
  testUserIds,
  userId,
}: {
  globalEnabled: string | undefined;
  isCoach: boolean;
  testUserIds: string | undefined;
  userId: string | undefined;
}): CoachCheckoutAccess {
  if (!userId) return "unauthenticated";
  if (isCoach) return "already_subscribed";
  if (isCoachCheckoutEnabled(globalEnabled)) return "allowed";
  return parseCoachCheckoutTestUserIds(testUserIds).has(userId.toLowerCase()) ? "allowed" : "closed";
}
