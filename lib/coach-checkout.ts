export function isCoachCheckoutEnabled(value: string | undefined) {
  return value === "true";
}

export type CoachCheckoutAccess = "allowed" | "already_subscribed" | "closed" | "unauthenticated";

export type CoachCheckoutEventState = {
  phase: "idle" | "open" | "completed" | "failed";
  isLoading: boolean;
  paymentCompleted: boolean;
  status: string;
};

export type CoachCheckoutEvent = {
  name?: string;
  type?: string;
  data?: unknown;
};

export type CoachCheckoutPaddle = {
  Initialized?: boolean;
  Initialize: (options: {
    token: string;
    eventCallback: (event: CoachCheckoutEvent) => void;
  }) => void;
  Update: (options: {
    eventCallback: (event: CoachCheckoutEvent) => void;
  }) => void;
};

export type CoachCheckoutOpenOptions = {
  items: Array<{ priceId: string; quantity: number }>;
  customer: { email: string };
  customData: Record<string, string>;
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
      phase: "completed",
      isLoading: false,
      paymentCompleted: true,
      status: "Payment received. Your Coach status will update after secure confirmation.",
    };
  }

  if (eventName === "checkout.closed") {
    return {
      phase: paymentCompleted ? "completed" : "idle",
      isLoading: false,
      paymentCompleted,
      status: paymentCompleted
        ? "Payment received. Your Coach status will update after secure confirmation."
        : "Checkout closed. Your Free plan is unchanged.",
    };
  }

  if (eventName === "checkout.error" || eventName === "checkout.payment.error") {
    return {
      phase: "failed",
      isLoading: false,
      paymentCompleted,
      status: "Checkout could not be opened. Please try again.",
    };
  }

  if (eventName === "checkout.loaded") {
    return {
      phase: "open",
      isLoading: false,
      paymentCompleted,
      status: "Checkout is open in the secure Paddle window.",
    };
  }

  return null;
}

export function bindCoachCheckoutEvents(
  paddle: CoachCheckoutPaddle,
  clientToken: string,
  onStateChange: (state: CoachCheckoutEventState) => void,
  onCompleted?: () => void,
) {
  let paymentCompleted = false;
  const eventCallback = (event: CoachCheckoutEvent) => {
    const nextState = getCoachCheckoutEventState(event.name, paymentCompleted);
    if (!nextState) return;

    paymentCompleted = nextState.paymentCompleted;
    onStateChange(nextState);
    if (event.name === "checkout.completed") onCompleted?.();
  };

  if (paddle.Initialized) {
    paddle.Update({ eventCallback });
  } else {
    paddle.Initialize({ token: clientToken, eventCallback });
  }
}

export function openCoachPaddleCheckout(
  paddle: CoachCheckoutPaddle & {
    Checkout: { open: (options: CoachCheckoutOpenOptions) => void };
  },
  clientToken: string,
  options: CoachCheckoutOpenOptions,
  onStateChange: (state: CoachCheckoutEventState) => void,
  onCompleted?: () => void,
) {
  bindCoachCheckoutEvents(paddle, clientToken, onStateChange, onCompleted);
  paddle.Checkout.open(options);
}

export function getCoachCheckoutFailureState(error: unknown): CoachCheckoutEventState {
  const message = error instanceof Error ? error.message : "";
  const normalizedMessage = message.toLowerCase();
  return {
    phase: "failed",
    isLoading: false,
    paymentCompleted: false,
    status:
      normalizedMessage.includes("paddle") || normalizedMessage.includes("not configured")
        ? "Checkout is not available yet. Please try again later."
        : message || "Checkout could not be started.",
  };
}
