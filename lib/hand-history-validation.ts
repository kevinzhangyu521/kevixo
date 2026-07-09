import { parseHandHistory } from "@/lib/hand-history/parser";

export function looksLikeHandHistory(handHistory: string) {
  return parseHandHistory(handHistory).isCompleteEnough;
}
