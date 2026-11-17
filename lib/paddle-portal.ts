export type PaddlePortalAction = "overview" | "update_payment_method";

type PaddlePortalResponse = {
  data?: {
    urls?: {
      general?: { overview?: string };
      subscriptions?: Array<{
        id?: string;
        update_subscription_payment_method?: string;
      }>;
    };
  };
};

export function parsePaddlePortalAction(value: unknown): PaddlePortalAction | null {
  if (value === undefined || value === "overview") return "overview";
  if (value === "update_payment_method") return "update_payment_method";
  return null;
}

export function selectPaddlePortalUrl(
  payload: PaddlePortalResponse,
  subscriptionId: string,
  action: PaddlePortalAction,
) {
  if (action === "overview") {
    const overviewUrl = payload.data?.urls?.general?.overview;
    if (!overviewUrl) throw new Error("Billing management could not be opened.");
    return overviewUrl;
  }

  const subscription = payload.data?.urls?.subscriptions?.find((item) => item.id === subscriptionId);
  const paymentMethodUrl = subscription?.update_subscription_payment_method;
  if (!paymentMethodUrl) {
    throw new Error("Payment method management is not available for this subscription.");
  }
  return paymentMethodUrl;
}

export function shouldOfferPaymentMethodUpdate(status: string | undefined) {
  return status === "past_due";
}
