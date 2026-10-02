export type Course = {
  slug: string;
  title: string;
  arabic: string;
  short: string;
  audience: string;
  level: string;
  intro: string;
  outcomes: string[];
  syllabus: string[];
};

export const courses: Course[] = [
  {
    slug: "noorani-qaida",
    title: "Noorani Qaida",
    arabic: "القاعدة النورانية",
    short: "The first step: Arabic letters, sounds and the basics of reading.",
    audience: "Young children and adult beginners",
    level: "Beginner",
    intro:
      "Noorani Qaida is the foundation of Quran reading. Your teacher takes the student through the Arabic letters, their sounds and the rules for joining them, one patient step at a time, until they can read simple words with confidence.",
    outcomes: [
      "Recognise and pronounce every Arabic letter correctly",
      "Read joined letters, short and long vowels",
      "Understand the basics of sukoon, shaddah and tanween",
      "Be ready to start reading the Quran itself",
    ],
    syllabus: [
      "Arabic letters and their sounds (makharij basics)",
      "Joined letters and harakat",
      "Tanween, sukoon and shaddah",
      "Long vowels and madd letters",
      "Reading practice with short words",
    ],
  },
  {
    slug: "basic-quran-reading",
    title: "Basic Quran Reading",
    arabic: "قراءة القرآن",
    short: "Move from Qaida into fluent, steady reading of the Quran.",
    audience: "Children and adults who know the letters",
    level: "Beginner to Intermediate",
    intro:
      "After Noorani Qaida, students start reading the Quran from the beginning with their teacher listening to every word. The goal is steady, accurate reading and the habit of reciting every day.",
    outcomes: [
      "Read the Quran fluently from the mushaf",
      "Correct common reading mistakes early",
      "Build a daily recitation habit",
      "Learn short surahs for daily prayers",
    ],
    syllabus: [
      "Reading Juz Amma with correction",
      "Moving on to Surah Al-Baqarah and beyond",
      "Basic stopping and starting rules",
      "Learning the short surahs used in salah",
    ],
  },
  {
    slug: "quran-with-tajweed",
    title: "Quran with Tajweed",
    arabic: "تجويد القرآن",
    short: "Recite with correct pronunciation, word by word, with rules explained.",
    audience: "Anyone who can already read the Quran",
    level: "Intermediate",
    intro:
      "Tajweed is reciting the Quran as it was revealed. Your teacher explains each rule in plain language, then has the student apply it while reciting, so the rules become second nature.",
    outcomes: [
      "Pronounce every letter from its correct point of articulation",
      "Apply noon sakinah, meem sakinah and madd rules",
      "Recite with correct qualities of letters (sifaat)",
      "Recognise and fix your own mistakes",
    ],
    syllabus: [
      "Makharij: points of articulation",
      "Sifaat: qualities of letters",
      "Noon sakinah, tanween and meem sakinah rules",
      "Madd rules and their types",
      "Waqf and ibtida (stopping and starting)",
    ],
  },
  {
    slug: "advanced-tajweed-qirat",
    title: "Advanced Tajweed & Qirat",
    arabic: "القراءات",
    short: "Perfect your recitation and study the finer points of qirat.",
    audience: "Confident readers, teachers and advanced students",
    level: "Advanced",
    intro:
      "For students who already recite with tajweed and want to refine their recitation, melody and consistency. Lessons focus on detailed correction, advanced rules and, where suitable, an introduction to recognised recitation styles.",
    outcomes: [
      "Polish recitation to a consistently high standard",
      "Study advanced and subtle tajweed rules",
      "Develop a clear, steady recitation style",
      "Prepare for ijazah-level study",
    ],
    syllabus: [
      "Detailed review of all tajweed rules",
      "Advanced madd and waqf rules",
      "Recitation under close correction",
      "Introduction to qirat (subject to teacher availability)",
    ],
  },
  {
    slug: "hifz",
    title: "Hifz: Quran Memorisation",
    arabic: "حفظ القرآن",
    short: "Memorise the Quran with a structured plan and daily revision.",
    audience: "Children and adults",
    level: "All levels",
    intro:
      "Hifz needs structure, consistency and a teacher who listens every day. Your teacher builds a plan around new lessons (sabaq), recent revision (sabqi) and old revision (manzil) that fits the student's age and pace.",
    outcomes: [
      "Memorise with correct tajweed from the start",
      "Follow a clear sabaq, sabqi and manzil routine",
      "Keep what has been memorised through regular revision",
      "Track progress with monthly reports",
    ],
    syllabus: [
      "Assessment and personal memorisation plan",
      "New lesson (sabaq) with tajweed check",
      "Recent revision (sabqi)",
      "Long-term revision (manzil)",
      "Monthly progress review",
    ],
  },
  {
    slug: "quran-translation-tafseer",
    title: "Quran Translation & Tafseer",
    arabic: "تفسير القرآن",
    short: "Understand what you recite: meaning, context and lessons.",
    audience: "Teenagers and adults",
    level: "All levels",
    intro:
      "Reciting is one part; understanding is another. Lessons walk through the meaning of the verses, the context in which they were revealed and the practical lessons for daily life, using trusted tafseer sources.",
    outcomes: [
      "Understand the meaning of the surahs you recite",
      "Learn the context and themes of each passage",
      "Connect the Quran to daily life",
      "Study from trusted, classical tafseer",
    ],
    syllabus: [
      "Translation of short surahs",
      "Themes and context of revelation",
      "Selected tafseer of key passages",
      "Reflection and discussion",
    ],
  },
  {
    slug: "arabic-language",
    title: "Arabic Language",
    arabic: "اللغة العربية",
    short: "Read, understand and speak Arabic, starting from your level.",
    audience: "Children, teenagers and adults",
    level: "Beginner to Advanced",
    intro:
      "Learn Arabic from the alphabet upward, with a focus on vocabulary and grammar that help you understand the Quran, and everyday conversation for those who want it.",
    outcomes: [
      "Build a vocabulary of common Quranic words",
      "Learn the basics of Arabic grammar",
      "Read and write simple Arabic sentences",
      "Hold basic conversations",
    ],
    syllabus: [
      "Alphabet, reading and writing",
      "Core vocabulary",
      "Nouns, verbs and sentence structure",
      "Quranic vocabulary and phrases",
      "Conversation practice",
    ],
  },
  {
    slug: "islamic-studies",
    title: "Islamic Studies",
    arabic: "الدراسات الإسلامية",
    short: "Namaz, duas, manners, Seerah and the basics of the faith.",
    audience: "Children and new Muslims",
    level: "Beginner",
    intro:
      "A gentle introduction to the practical basics of Islam: how to pray, daily duas, good manners, stories of the prophets and the life of the Prophet Muhammad ﷺ, taught in a way that suits the student's age.",
    outcomes: [
      "Learn how to pray salah correctly",
      "Memorise everyday duas",
      "Know the pillars of Islam and iman",
      "Learn stories of the prophets and the Seerah",
    ],
    syllabus: [
      "Wudu and salah step by step",
      "Daily duas and adhkar",
      "Pillars of Islam and iman",
      "Islamic manners and character",
      "Stories of the prophets and Seerah",
    ],
  },
];

export const getCourse = (slug: string) => courses.find((c) => c.slug === slug);
