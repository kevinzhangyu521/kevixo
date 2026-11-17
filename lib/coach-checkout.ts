export function isCoachCheckoutEnabled(value: string | undefined) {
  return value === "true";
}

export type CoachCheckoutAccess = "allowed" | "already_subscribed" | "closed" | "unauthenticated";

export type CoachCheckoutEventState = {
  isLoading: false;
  paymentCompleted: boolean;
  status: string;
};

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

export function getCoachCheckoutEventState(
  eventName: string | undefined,
  paymentCompleted: boolean,
): CoachCheckoutEventState | null {
  if (eventName === "checkout.completed") {
    return {
      isLoading: false,
      paymentCompleted: true,
      status: "Payment received. Your Coach status will update after secure confirmation.",
    };
  }

  if (eventName === "checkout.closed") {
    return {
      isLoading: false,
      paymentCompleted,
      status: paymentCompleted
        ? "Payment received. Your Coach status will update after secure confirmation."
        : "Checkout closed. Your Free plan is unchanged.",
    };
  }

  if (eventName === "checkout.error" || eventName === "checkout.payment.error") {
    return {
      isLoading: false,
      paymentCompleted,
      status: "Checkout could not be opened. Please try again.",
    };
  }

  return null;
}

export function getCoachCheckoutFailureState(error: unknown): CoachCheckoutEventState {
  const message = error instanceof Error ? error.message : "";
  const normalizedMessage = message.toLowerCase();
  return {
    isLoading: false,
    paymentCompleted: false,
    status:
      normalizedMessage.includes("paddle") || normalizedMessage.includes("not configured")
        ? "Checkout is not available yet. Please try again later."
        : message || "Checkout could not be started.",
  };
}
