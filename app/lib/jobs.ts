/**
 * The career ladder. Knowledge is the gate: each 🎓 level unlocks a tier, and
 * every role in a tier pays the same.
 */
export type Job = {
  title: string;
  minKnowledge: number;
  salary: number;
};

/** No job yet. Working and Overtime are simply unavailable — see hasJob(). */
export const UNEMPLOYED: Job = {
  title: "Unemployed",
  minKnowledge: 0,
  salary: 0,
};

export const JOBS: Job[] = [
  { title: "Fast Food Cashier",  minKnowledge: 0, salary: 25_000 },
  { title: "Private Tutor",      minKnowledge: 1, salary: 35_000 },
  { title: "Barista",            minKnowledge: 1, salary: 35_000 },
  { title: "Marketer",           minKnowledge: 2, salary: 45_000 },
  { title: "Human Resource",     minKnowledge: 2, salary: 45_000 },
  { title: "Accountant",         minKnowledge: 3, salary: 60_000 },
  { title: "Lawyer",             minKnowledge: 3, salary: 60_000 },
  { title: "Investment Banker",  minKnowledge: 4, salary: 80_000 },
  { title: "Software Developer", minKnowledge: 4, salary: 80_000 },
  { title: "Pharmacist",         minKnowledge: 4, salary: 80_000 },
  { title: "Doctor",             minKnowledge: 5, salary: 100_000 },
  { title: "Quant Researcher",   minKnowledge: 6, salary: 120_000 },
];

export function findJob(title: string): Job {
  return JOBS.find((job) => job.title === title) ?? UNEMPLOYED;
}

/** "$80K" / "-$20K" */
export function money(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const magnitude = Math.abs(amount);
  return magnitude >= 1000
    ? `${sign}$${Math.round(magnitude / 1000)}K`
    : `${sign}$${magnitude}`;
}

/** False while the player is Unemployed, which gates Working and Overtime. */
export function hasJob(occupation: string): boolean {
  return JOBS.some((job) => job.title === occupation);
}

export function canTake(job: Job, knowledge: number): boolean {
  return knowledge >= job.minKnowledge;
}
