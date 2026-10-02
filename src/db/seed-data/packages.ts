export type Pkg = {
  id: string;
  name: string;
  pricePerMonthGBP: number;
  classesPerMonth: number;
  blurb: string;
  popular?: boolean;
};

export const packages: Pkg[] = [
  { id: "5-days", name: "5 Days a Week", pricePerMonthGBP: 35, classesPerMonth: 20, blurb: "Fastest progress", popular: true },
  { id: "3-days", name: "3 Days a Week", pricePerMonthGBP: 25, classesPerMonth: 12, blurb: "Great steady pace" },
  { id: "2-days", name: "2 Days a Week", pricePerMonthGBP: 20, classesPerMonth: 8, blurb: "Ideal for beginners" },
  { id: "weekend", name: "Weekend Only", pricePerMonthGBP: 25, classesPerMonth: 8, blurb: "Perfect for busy weeks" },
];

// Rates are indicative only; billing is in GBP.
export const currencies = [
  { code: "GBP", symbol: "£", label: "British Pound", rate: 1 },
  { code: "USD", symbol: "$", label: "US Dollar", rate: 1.3 },
  { code: "EUR", symbol: "€", label: "Euro", rate: 1.17 },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", rate: 2.0 },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar", rate: 1.8 },
] as const;

export const everyPlanIncludes = [
  "One-to-one live classes",
  "Word-by-word tajweed correction",
  "Male and female teachers",
  "Flexible class timings",
  "Monthly progress reports",
  "Free 3-day trial, no card needed",
  "Change or cancel anytime",
];
