import { looksLikeHandHistory } from "@/lib/hand-history-validation";

export type DemoHand = {
  id: string;
  title: string;
  spot: string;
  detail: string;
  hand: string;
};

export const demoHands = [
  {
    id: "river-bluff-catch",
    title: "River Bluff Catch",
    spot: "CO vs BTN",
    detail: "Top pair faces a polar river bet.",
    hand: `PokerStars Hand #300000000001: Hold'em No Limit ($0.25/$0.50 USD)
Table 'Kevixo Alpha' 6-max Seat #3 is the button
Seat 1: Nova ($52.40)
Seat 2: Orbit ($48.75)
Seat 3: Hero ($50.00)
Seat 4: Slate ($61.20)
Seat 5: RiverFox ($50.00)
Seat 6: Villain ($54.10)
Slate posts small blind $0.25
RiverFox posts big blind $0.50
*** HOLE CARDS ***
Dealt to Hero [As Qs]
Nova folds
Orbit folds
Hero raises to $1.25
Slate folds
RiverFox folds
Villain calls $1.25
*** FLOP *** [Qh 8s 4d]
Hero bets $1.50
Villain calls $1.50
*** TURN *** [Qh 8s 4d] [9s]
Hero bets $4.50
Villain calls $4.50
*** RIVER *** [Qh 8s 4d 9s] [2c]
Hero checks
Villain bets $16.00
Hero calls $16.00
*** SHOW DOWN ***
Villain shows [9h 9d]
Hero mucks [As Qs]
Villain collected $45.85 from pot
*** SUMMARY ***
Total pot $47.00 | Rake $1.15`,
  },
  {
    id: "missed-cbet",
    title: "Missed C-Bet",
    spot: "BTN vs BB",
    detail: "Overcards and backdoors in position.",
    hand: `PokerStars Hand #300000000002: Hold'em No Limit ($0.10/$0.25 USD)
Table 'Kevixo Beta' 6-max Seat #5 is the button
Seat 1: Nova ($27.40)
Seat 2: Orbit ($24.10)
Seat 3: Slate ($31.20)
Seat 4: RiverFox ($25.00)
Seat 5: Hero ($25.00)
Seat 6: Villain ($31.20)
RiverFox posts small blind $0.10
Villain posts big blind $0.25
*** HOLE CARDS ***
Dealt to Hero [Ah Js]
Nova folds
Orbit folds
Slate folds
Hero raises to $0.60
RiverFox folds
Villain calls $0.35
*** FLOP *** [Kd 7s 3h]
Villain checks
Hero checks
*** TURN *** [Kd 7s 3h] [Ts]
Villain bets $0.95
Hero calls $0.95
*** RIVER *** [Kd 7s 3h Ts] [2c]
Villain bets $2.75
Hero folds
Uncalled bet ($2.75) returned to Villain
Villain collected $3.05 from pot
*** SUMMARY ***
Total pot $3.15 | Rake $0.10`,
  },
  {
    id: "turn-barrel",
    title: "Turn Barrel",
    spot: "SB vs BB",
    detail: "Strong draw chooses a big turn size.",
    hand: `PokerStars Hand #300000000003: Hold'em No Limit ($0.50/$1.00 USD)
Table 'Kevixo Gamma' 6-max Seat #1 is the small blind
Seat 1: Hero ($104.00)
Seat 2: Villain ($98.50)
Seat 3: Nova ($112.20)
Seat 4: Orbit ($86.75)
Seat 5: Slate ($101.40)
Seat 6: RiverFox ($99.00)
Hero posts small blind $0.50
Villain posts big blind $1.00
*** HOLE CARDS ***
Dealt to Hero [Qs Js]
Nova folds
Orbit folds
Slate folds
RiverFox folds
Hero raises to $3.00
Villain calls $2.00
*** FLOP *** [Ts 8s 2d]
Hero bets $2.50
Villain calls $2.50
*** TURN *** [Ts 8s 2d] [4c]
Hero bets $11.00
Villain calls $11.00
*** RIVER *** [Ts 8s 2d 4c] [Ah]
Hero bets $28.00
Villain folds
Uncalled bet ($28.00) returned to Hero
Hero collected $31.90 from pot
*** SUMMARY ***
Total pot $33.00 | Rake $1.10`,
  },
  {
    id: "thin-value",
    title: "Thin Value Bet",
    spot: "HJ vs BB",
    detail: "Second pair considers river value.",
    hand: `PokerStars Hand #300000000004: Hold'em No Limit ($0.25/$0.50 USD)
Table 'Kevixo Delta' 6-max Seat #4 is the hijack
Seat 1: Nova ($52.30)
Seat 2: Orbit ($47.80)
Seat 3: Slate ($55.10)
Seat 4: Hero ($50.00)
Seat 5: RiverFox ($49.20)
Seat 6: Villain ($46.80)
RiverFox posts small blind $0.25
Villain posts big blind $0.50
*** HOLE CARDS ***
Dealt to Hero [Kc Qd]
Nova folds
Orbit folds
Slate folds
Hero raises to $1.10
RiverFox folds
Villain calls $0.60
*** FLOP *** [Kh 9c 5s]
Villain checks
Hero bets $1.25
Villain calls $1.25
*** TURN *** [Kh 9c 5s] [9d]
Villain checks
Hero checks
*** RIVER *** [Kh 9c 5s 9d] [3s]
Villain checks
Hero bets $3.50
Villain calls $3.50
*** SHOW DOWN ***
Hero shows [Kc Qd]
Villain shows [Ks Jc]
Hero collected $11.55 from pot
*** SUMMARY ***
Total pot $12.20 | Rake $0.65`,
  },
  {
    id: "three-bet-pot",
    title: "3-Bet Pot",
    spot: "CO vs SB",
    detail: "Overpair faces turn pressure.",
    hand: `PokerStars Hand #300000000005: Hold'em No Limit ($1.00/$2.00 USD)
Table 'Kevixo Epsilon' 6-max Seat #1 is the small blind
Seat 1: Villain ($203.00)
Seat 2: Nova ($188.50)
Seat 3: Orbit ($214.75)
Seat 4: Hero ($200.00)
Seat 5: Slate ($176.40)
Seat 6: RiverFox ($226.20)
Villain posts small blind $1.00
Nova posts big blind $2.00
*** HOLE CARDS ***
Dealt to Hero [Ad Ac]
Orbit folds
Hero raises to $5.00
Slate folds
RiverFox folds
Villain raises to $18.00
Nova folds
Hero calls $13.00
*** FLOP *** [Jh 7d 4c]
Villain bets $12.00
Hero calls $12.00
*** TURN *** [Jh 7d 4c] [Ts]
Villain bets $42.00
Hero calls $42.00
*** RIVER *** [Jh 7d 4c Ts] [8s]
Villain checks
Hero checks
*** SHOW DOWN ***
Villain shows [Ks Kd]
Hero shows [Ad Ac]
Hero collected $144.20 from pot
*** SUMMARY ***
Total pot $148.00 | Rake $3.80`,
  },
] satisfies DemoHand[];

export function getInvalidDemoHands(hands: DemoHand[] = demoHands) {
  return hands
    .filter((demo) => !looksLikeHandHistory(demo.hand) || !hasCompleteDemoRequirements(demo.hand))
    .map((demo) => demo.id);
}

function hasCompleteDemoRequirements(handHistory: string) {
  const text = handHistory.toLowerCase();
  const hasSeats = (handHistory.match(/^Seat \d+:/gm) ?? []).length >= 2;
  const hasStacks = /\(\$\d+(?:\.\d{2})?\)/.test(handHistory);
  const hasBlinds = text.includes("posts small blind") && text.includes("posts big blind");
  const hasHeroHoleCards = /Dealt to Hero \[[2-9TJQKA][cdhs]\s+[2-9TJQKA][cdhs]\]/i.test(
    handHistory,
  );
  const hasPreflop = text.includes("*** hole cards ***");
  const hasBoard = ["*** flop ***", "*** turn ***", "*** river ***"].every((street) =>
    text.includes(street),
  );
  const hasBettingActions = ["raises", "calls", "bets"].every((action) =>
    text.includes(action),
  );
  const hasBetSizes = /\$\d+(?:\.\d{2})?/.test(handHistory);
  const hasFinalAction =
    text.includes("*** show down ***") ||
    text.includes("uncalled bet") ||
    text.includes("collected");

  return (
    hasSeats &&
    hasStacks &&
    hasBlinds &&
    hasHeroHoleCards &&
    hasPreflop &&
    hasBoard &&
    hasBettingActions &&
    hasBetSizes &&
    hasFinalAction
  );
}
