import { RATING_LABEL, type Rating } from "@/lib/pathways/assessment";
import { cn } from "@/lib/utils";

export function RatingChip({
  rating,
  big = false,
}: {
  rating: Rating | null | undefined;
  big?: boolean;
}) {
  if (!rating) return null;
  return <span className={cn("rate", `rate-${rating}`, big && "big")}>{RATING_LABEL[rating]}</span>;
}
