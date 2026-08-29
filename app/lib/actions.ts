/**
 * The action catalog, shared by the Action page and the spend API.
 *
 * Every action costs ⌛1. Working and Overtime pay from the player's job, so
 * their effects are resolved on the server against the stored occupation — a
 * client can ask to work, it can't announce what it earned.
 */
import { findJob, hasJob, money } from "@/app/lib/jobs";

export type ActionEffects = {
  money?: number;
  happiness?: number;
  knowledge?: number;
};

export type ActionCard = {
  icon: string;
  /** ⌛ points this action consumes. */
  points: number;
  /** Fixed effects, for actions that don't depend on the player. */
  effects?: ActionEffects;
  /** Multiplier on the player's salary, for Working and Overtime. */
  salaryMultiplier?: number;
  /** Unavailable while Unemployed — there is no salary to earn. */
  requiresJob?: boolean;
  /** Opens the job panel instead of paying out. Free to open; ⌛1 to accept. */
  opensCareers?: boolean;
};

export const ACTION_CARDS: Record<string, ActionCard> = {
  Study:        { icon: "📚",   points: 1, effects: { knowledge: 1 } },
  "Hire Tutor": { icon: "👩‍🏫", points: 1, effects: { knowledge: 2, money: -15_000 } },
  Working:      { icon: "💼",   points: 1, salaryMultiplier: 1, requiresJob: true },
  Overtime:     { icon: "🕒",   points: 1, salaryMultiplier: 1.25, requiresJob: true },
  Travel:       { icon: "✈️",   points: 1, effects: { happiness: 50, money: -35_000 } },
  // Last: it opens a panel rather than paying out.
  "Find Jobs":  { icon: "🔎",   points: 1, opensCareers: true },
};

export const ACTION_NAMES = Object.keys(ACTION_CARDS);

/** ⌛ cost of an action. */
export function actionPoints(name: string): number {
  return ACTION_CARDS[name]?.points ?? 0;
}

/**
 * Resolve an action into concrete stat changes for one player.
 * `occupation` decides what Working and Overtime pay.
 */
export function resolveEffects(name: string, occupation: string): Required<ActionEffects> {
  const card = ACTION_CARDS[name];
  const base = { money: 0, happiness: 0, knowledge: 0, ...(card?.effects ?? {}) };

  if (card?.salaryMultiplier) {
    const salary = findJob(occupation).salary;
    return { ...base, money: base.money + Math.round(salary * card.salaryMultiplier) };
  }
  return base;
}

/** What the card advertises, given who's looking at it. */
export function actionValue(name: string, occupation: string): string {
  const card = ACTION_CARDS[name];
  if (card?.salaryMultiplier) {
    // Nothing to advertise with no job — the card is disabled anyway.
    if (!hasJob(occupation)) return "No job";
    return money(Math.round(findJob(occupation).salary * card.salaryMultiplier));
  }
  if (card?.opensCareers) return "Change job";

  const effects = card?.effects ?? {};
  if (effects.knowledge) return `🎓 +${effects.knowledge}`;
  if (effects.happiness) return `😄 +${effects.happiness}`;
  return "";
}

/** The secondary cost line on the card. */
export function actionCost(name: string): string {
  const effects = ACTION_CARDS[name]?.effects ?? {};
  const parts: string[] = [];
  if (effects.money && effects.money < 0) parts.push(money(effects.money));
  if (effects.happiness && effects.happiness < 0) parts.push(`😄 ${effects.happiness}`);
  return parts.join("  ");
}
