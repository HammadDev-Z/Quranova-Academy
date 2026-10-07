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
