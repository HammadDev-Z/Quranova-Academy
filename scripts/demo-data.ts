/**
 * Demo data for trying every portal.
 *
 *   npm run demo:load      create demo accounts, students, classes, lessons, etc.
 *   npm run demo:remove    delete exactly what demo:load created (nothing else)
 *
 * The demo accounts use deliberately weak passwords. They exist only so you can
 * look around locally. This script refuses to run against a production setup,
 * and `demo:remove` deletes them. Never put these accounts on a live site.
 */
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { desc, eq, inArray, or } from "drizzle-orm";
import {
  activity,
  availabilitySlots,
  certificates,
  classSessions,
  courses,
  db,
  guardians,
  invoices,
  leads,
  lessonPages,
  materials,
  packages,
  progressReports,
  students,
  teachers,
  users,
} from "../src/db";
import { addDays, fromLocalInput, todayKey } from "../src/lib/admin/time";
import { hashPassword } from "../src/lib/auth/password";

const IDS_FILE = path.join("data", "demo-ids.json");
const TEACHER_TZ = "Asia/Karachi";

const ACCOUNTS = [
  { email: "admin@gmail.com", password: "admin", name: "Demo Admin", role: "admin" as const, username: null },
  { email: "teacher@gmail.com", password: "teacher", name: "Hira Iqbal", role: "teacher" as const, username: null },
  { email: "parent@gmail.com", password: "parent", name: "Toma Hoque", role: "parent" as const, username: "QN1001" },
  { email: "student@gmail.com", password: "student", name: "Manha Hoque", role: "student" as const, username: "QS1001" },
];

type Ids = Record<string, string[]>;
const newIds = (): Ids => ({ users: [], guardians: [], teachers: [], students: [], leads: [], certificates: [], invoices: [], lessonPages: [], materials: [] });

/* ───────── Generated sample files (no copyrighted material) ───────── */

function crcTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
}
const CRC = crcTable();
function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const DIGITS: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A sample "page": decorative frame, page number and rows standing in for text. */
function samplePage(pageNo: number, seed: number): Buffer {
  const w = 600;
  const h = 820;
  const px = new Uint8Array(w * h * 4);
  const rect = (x: number, y: number, rw: number, rh: number, [r, g, b]: number[]) => {
    for (let yy = Math.max(0, y); yy < Math.min(h, y + rh); yy++)
      for (let xx = Math.max(0, x); xx < Math.min(w, x + rw); xx++) {
        const i = (yy * w + xx) * 4;
        px[i] = r;
        px[i + 1] = g;
        px[i + 2] = b;
        px[i + 3] = 255;
      }
  };
  rect(0, 0, w, h, [255, 253, 246]);
  rect(0, 0, w, h, [91, 191, 216]); // outer frame
  rect(14, 14, w - 28, h - 28, [31, 95, 120]);
  rect(18, 18, w - 36, h - 36, [234, 247, 252]);
  rect(40, 40, w - 80, 60, [191, 230, 243]); // header band
  const text = String(pageNo);
  const scale = 7;
  const totalW = text.length * 4 * scale - scale;
  text.split("").forEach((ch, i) => {
    DIGITS[ch].forEach((row, ry) =>
      row.split("").forEach((on, rx) => {
        if (on === "1") rect(Math.floor(w / 2 - totalW / 2) + i * 4 * scale + rx * scale, 52 + ry * scale, scale, scale, [20, 60, 80]);
      }),
    );
  });
  const rand = rng(seed * 1000 + pageNo);
  for (let line = 0; line < 11; line++) {
    const y = 130 + line * 61;
    const bw = 360 + Math.floor(rand() * 140);
    rect(w - 60 - bw, y, bw, 20, [28, 43, 58]); // "text" row, right aligned
    rect(w - 60 - Math.floor(bw * 0.8), y + 28, Math.floor(bw * 0.8), 8, [142, 160, 173]); // "translation" row
  }
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) Buffer.from(px.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

/** A tiny valid one-page PDF. */
function samplePdf(title: string): Buffer {
  const safe = title.replace(/[()\\]/g, " ");
  const stream = `BT /F1 22 Tf 60 760 Td (${safe}) Tj 0 -34 Td /F1 12 Tf (Sample learning material for the Quranova demo.) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (out += `${String(o).padStart(10, "0")} 00000 n \n`));
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

/* ───────── Load ───────── */

async function load() {
  if (process.env.NODE_ENV === "production" || process.env.DATABASE_URL?.startsWith("libsql:")) {
    throw new Error("Refusing to load demo accounts into a production or hosted database. They use weak passwords on purpose.");
  }
  if (existsSync(IDS_FILE)) throw new Error("Demo data is already loaded. Run `npm run demo:remove` first if you want to reload it.");

  const taken = await db
    .select({ email: users.email, username: users.username })
    .from(users)
    .where(or(inArray(users.email, ACCOUNTS.map((a) => a.email)), inArray(users.username, ACCOUNTS.flatMap((a) => (a.username ? [a.username] : [])))));
  if (taken.length) throw new Error(`These accounts already exist, so nothing was loaded: ${taken.map((t) => t.email).join(", ")}`);

  const ids = newIds();
  const courseId = async (title: string) => (await db.select({ id: courses.id }).from(courses).where(eq(courses.title, title)).limit(1))[0]?.id ?? null;
  const packageId = async (name: string) => (await db.select({ id: packages.id }).from(packages).where(eq(packages.name, name)).limit(1))[0]?.id ?? null;

  // Accounts
  const userId: Record<string, string> = {};
  for (const a of ACCOUNTS) {
    const [row] = await db
      .insert(users)
      .values({ email: a.email, username: a.username, name: a.name, passwordHash: await hashPassword(a.password), role: a.role })
      .returning({ id: users.id });
    userId[a.role] = row.id;
    ids.users.push(row.id);
  }

  // Teacher
  const [teacher] = await db
    .insert(teachers)
    .values({
      userId: userId.teacher,
      name: "Hira Iqbal",
      gender: "female",
      email: "teacher@gmail.com",
      phone: "03000000000",
      timezone: TEACHER_TZ,
      qualifications: ["Ijazah in Hafs", "Tajweed certificate"],
      languages: ["English", "Urdu", "Arabic"],
      bio: "Demo teacher.",
      showOnWebsite: false,
    })
    .returning({ id: teachers.id });
  ids.teachers.push(teacher.id);
  await db.insert(availabilitySlots).values(Array.from({ length: 7 }, (_, weekday) => ({ teacherId: teacher.id, weekday, startTime: "16:00", endTime: "23:30" })));

  // Families and students
  const families = [
    { name: "Toma Hoque", tz: "Europe/London", phone: "+44 7700 900101", userId: userId.parent },
    { name: "Shahed Ali", tz: "America/Toronto", phone: "+1 416 555 0102" },
    { name: "Sanam Kausar", tz: "Europe/London", phone: "+44 7700 900103" },
    { name: "Fathima Fahmida", tz: "Europe/Paris", phone: "+33 6 12 34 56 78" },
    { name: "Sabrina Kayani", tz: "America/New_York", phone: "+1 212 555 0105" },
    { name: "Rahim Rahman", tz: "Europe/London", phone: "+44 7700 900106" },
  ];
  const guardianIds: string[] = [];
  for (const f of families) {
    const [g] = await db
      .insert(guardians)
      .values({ name: f.name, email: `${f.name.split(" ")[0].toLowerCase()}@example.com`, phone: f.phone, country: "", timezone: f.tz, userId: f.userId ?? null })
      .returning({ id: guardians.id });
    guardianIds.push(g.id);
    ids.guardians.push(g.id);
  }

  const cBasic = await courseId("Basic Quran Reading");
  const cTajweed = await courseId("Quran with Tajweed");
  const cQaida = await courseId("Noorani Qaida");
  const cIslamic = await courseId("Islamic Studies");
  const cArabic = await courseId("Arabic Language");

  const kids = [
    { n: "Manha Hoque", age: 9, g: 0, no: 8001, course: cBasic, part: "Para 01", page: 9, step: 2, add: cIslamic, apart: "Level 1", apage: 10, tz: "Europe/London", time: "17:00", days: [0, 1, 2, 3, 4], pkg: "5 Days a Week", user: userId.student },
    { n: "Safaa Khatun", age: 13, g: 1, no: 8002, course: cBasic, part: "Para 01", page: 7, step: 2, add: cIslamic, apart: "Kalimas and Manners", apage: 9, tz: "America/Toronto", time: "12:30", days: [0, 2, 4], pkg: "3 Days a Week" },
    { n: "Hayyan Hussain", age: 9, g: 2, no: 8003, course: cBasic, part: "Para 02", page: 21, step: 1, add: null, apart: "", apage: 0, tz: "Europe/London", time: "19:00", days: [1, 3], pkg: "2 Days a Week" },
    { n: "Izma Insaf", age: 13, g: 3, no: 8004, course: cTajweed, part: "Para 01", page: 26, step: 3, add: cArabic, apart: "Alphabet", apage: 12, tz: "Europe/Paris", time: "18:00", days: [0, 2, 4], pkg: "3 Days a Week" },
    { n: "Alaya Kayani", age: 5, g: 4, no: 8005, course: cQaida, part: "Qaida", page: 15, step: 2, add: cIslamic, apart: "Duas", apage: 26, tz: "America/New_York", time: "09:30", days: [0, 1, 2, 3], pkg: "2 Days a Week" },
  ];
  const studentIds: string[] = [];
  for (const k of kids) {
    const [s] = await db
      .insert(students)
      .values({
        studentNo: k.no,
        userId: k.user ?? null,
        guardianId: guardianIds[k.g],
        teacherId: teacher.id,
        name: k.n,
        age: k.age,
        status: "active",
        courseId: k.course,
        packageId: await packageId(k.pkg),
        basicPart: k.part,
        basicPage: k.page,
        tajweedStep: k.step,
        additionalCourseId: k.add,
        additionalPart: k.apart,
        additionalPage: k.apage,
        timezone: k.tz,
        country: "",
        startDate: addDays(todayKey(k.tz), -60),
        notes: "Demo student.",
      })
      .returning({ id: students.id });
    studentIds.push(s.id);
    ids.students.push(s.id);
  }
  const [trial] = await db
    .insert(students)
    .values({ studentNo: 8006, guardianId: guardianIds[5], teacherId: teacher.id, name: "Zayd Rahman", age: 7, status: "trial", courseId: cQaida, timezone: "Europe/London", notes: "Demo trial student." })
    .returning({ id: students.id });
  ids.students.push(trial.id);

  // Classes: six weeks either side of today, following each student's weekly pattern
  const nowMs = new Date().getTime();
  const notes = [
    "Revised the letters and their sounds. Good effort reading page by page.",
    "Corrected makharij of the throat letters. Practised noon sakinah rules.",
    "Read two new pages with tajweed. Needs more practice on madd.",
    "Memorised the short surah and revised the previous lesson.",
  ];
  const rows: (typeof classSessions.$inferInsert)[] = [];
  kids.forEach((k, ki) => {
    let counter = 0;
    let futureLeaveDone = false;
    let lastPast: (typeof rows)[number] | null = null;
    for (let off = -21; off <= 21; off++) {
      const day = addDays(todayKey(k.tz), off);
      const [y, m, d] = day.split("-").map(Number);
      const weekday = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
      if (!k.days.includes(weekday)) continue;
      const startsAt = fromLocalInput(`${day}T${k.time}`, k.tz);
      if (!startsAt) continue;
      counter++;
      const row: (typeof rows)[number] = { studentId: studentIds[ki], teacherId: teacher.id, courseId: k.course, startsAt, durationMin: 30, status: "scheduled" };
      const day30 = new Date(startsAt.getTime() + 30 * 86400000);
      if (startsAt.getTime() < nowMs - 2 * 3600000) {
        if (counter % 9 === 0) Object.assign(row, { status: "student_leave", rescheduleDeadline: day30 });
        else if (counter % 13 === 0) Object.assign(row, { status: "missed_student", rescheduleDeadline: day30 });
        else {
          Object.assign(row, { status: "completed" });
          if (counter % 4 !== 0) Object.assign(row, { lessonNotes: notes[counter % notes.length], homework: counter % 3 === 0 ? "Practise today's page twice a day." : "" });
        }
        lastPast = row;
      } else if (startsAt.getTime() > nowMs && off >= 9 && !futureLeaveDone && ki === 0) {
        Object.assign(row, { status: "teacher_leave", rescheduleDeadline: day30 });
        futureLeaveDone = true;
      } else if (startsAt.getTime() > nowMs && off >= 2 && !futureLeaveDone && ki === 2) {
        Object.assign(row, { status: "student_leave", rescheduleDeadline: day30 });
        futureLeaveDone = true;
      }
      if (ki === 0 && row.status === "scheduled" && startsAt.getTime() > nowMs && !rows.some((r) => r.studentId === studentIds[0] && r.meetingUrl)) row.meetingUrl = "https://meet.example.com/demo-room";
      rows.push(row);
    }
    // Leave one recent class unmarked for Izma, so "needs marking" shows in the teacher portal.
    if (ki === 3 && lastPast) Object.assign(lastPast, { status: "scheduled", lessonNotes: "", homework: "" });
  });
  rows.push({
    studentId: trial.id,
    teacherId: teacher.id,
    courseId: cQaida,
    startsAt: fromLocalInput(`${addDays(todayKey("Europe/London"), 1)}T16:30`, "Europe/London")!,
    durationMin: 30,
    isTrial: true,
    status: "scheduled",
  });
  for (let i = 0; i < rows.length; i += 50) await db.insert(classSessions).values(rows.slice(i, i + 50));

  // Reports for last month
  const thisMonth = todayKey(TEACHER_TZ).slice(0, 7);
  const [py, pm] = thisMonth.split("-").map(Number);
  const prevMonth = pm === 1 ? `${py - 1}-12` : `${py}-${String(pm - 1).padStart(2, "0")}`;
  await db.insert(progressReports).values([
    { studentId: studentIds[0], teacherId: teacher.id, month: prevMonth, covered: "Completed Para 1 lessons with good fluency.", strengths: "Clear pronunciation and steady pace.", improvements: "Practise madd rules.", rating: 4, status: "reviewed", submittedAt: new Date(), reviewedAt: new Date() },
    { studentId: studentIds[1], teacherId: teacher.id, month: prevMonth, covered: "Revised Para 1 and began Para 2.", strengths: "Excellent memory.", improvements: "", rating: 5, status: "submitted", submittedAt: new Date() },
    { studentId: studentIds[2], teacherId: teacher.id, month: prevMonth, covered: "Worked on short surahs.", rating: null, status: "draft" },
  ]);

  // Certificates and invoices (numbers continue from whatever already exists)
  const [lastCert] = await db.select({ n: certificates.number }).from(certificates).orderBy(desc(certificates.number)).limit(1);
  let certN = lastCert ? parseInt(lastCert.n.replace(/\D/g, ""), 10) || 0 : 0;
  const certs = [
    { studentId: studentIds[0], title: "Completed Noorani Qaida", note: "Excellent effort and steady progress." },
    { studentId: studentIds[1], title: "Completed Basic Reading Level 1", note: "" },
  ];
  for (const c of certs) {
    const [row] = await db.insert(certificates).values({ ...c, number: `CERT-${String(++certN).padStart(4, "0")}`, issuedOn: addDays(todayKey(TEACHER_TZ), -3) }).returning({ id: certificates.id });
    ids.certificates.push(row.id);
  }
  const [lastInv] = await db.select({ n: invoices.number }).from(invoices).orderBy(desc(invoices.number)).limit(1);
  let invN = lastInv ? parseInt(lastInv.n.replace(/\D/g, ""), 10) || 0 : 0;
  const today = todayKey(TEACHER_TZ);
  const bills = [
    { studentId: studentIds[0], description: "Last month fees, 5 days a week", amountMinor: 3500, issuedOn: addDays(today, -30), dueOn: addDays(today, -23), status: "paid" as const, paidOn: addDays(today, -25), method: "Bank transfer" },
    { studentId: studentIds[0], description: "This month fees, 5 days a week", amountMinor: 3500, issuedOn: addDays(today, -2), dueOn: addDays(today, 5), status: "unpaid" as const },
    { studentId: studentIds[1], description: "This month fees, 3 days a week", amountMinor: 2500, issuedOn: addDays(today, -20), dueOn: addDays(today, -10), status: "unpaid" as const },
    { studentId: studentIds[3], description: "This month fees, 3 days a week", amountMinor: 2500, issuedOn: addDays(today, -6), dueOn: addDays(today, 1), status: "paid" as const, paidOn: addDays(today, -4), method: "Card" },
  ];
  for (const b of bills) {
    const [row] = await db.insert(invoices).values({ ...b, number: `INV-${String(++invN).padStart(4, "0")}`, currency: "GBP" }).returning({ id: invoices.id });
    ids.invoices.push(row.id);
  }

  // Leads
  const leadRows = [
    { type: "trial" as const, status: "new" as const, parentName: "Aisha Khan", studentName: "Yusuf Khan", studentAge: 8, email: "aisha@example.com", phone: "+44 7700 900201", country: "United Kingdom", course: "Noorani Qaida", preferredTime: "Weekdays after 5pm" },
    { type: "trial" as const, status: "contacted" as const, parentName: "Omar Siddiqui", studentName: "Hana Siddiqui", studentAge: 11, email: "omar@example.com", phone: "+1 647 555 0202", country: "Canada", course: "Quran with Tajweed", preferredTime: "Saturday mornings" },
    { type: "contact" as const, status: "new" as const, parentName: "Mariam Ali", email: "mariam@example.com", phone: "", message: "Do you offer classes for adult beginners?" },
  ];
  for (const l of leadRows) {
    const [row] = await db.insert(leads).values(l).returning({ id: leads.id });
    ids.leads.push(row.id);
  }

  // Learning materials and lesson pages (generated samples)
  await mkdir(path.join("data", "materials"), { recursive: true });
  await mkdir(path.join("data", "lessons"), { recursive: true });
  const mats = [
    ["40 Rabbana Duas", "Duas"],
    ["Tajweed rules cheat sheet", "Tajweed"],
    ["Qaida practice sheets", "Qaida"],
    ["Daily duas for children", "Duas"],
    ["Teaching tips for online lessons", "Teacher guides"],
    ["Arabic alphabet chart", "Arabic"],
  ];
  for (const [title, category] of mats) {
    const id = randomUUID();
    const pdf = samplePdf(title);
    await writeFile(path.join("data", "materials", `${id}.pdf`), pdf);
    await db.insert(materials).values({ id, title, category, fileName: `${title}.pdf`, fileExt: "pdf", sizeBytes: pdf.length });
    ids.materials.push(`${id}.pdf`);
  }

  const sets: { course: string | null; part: string; from: number; to: number; prefix: string }[] = [
    { course: cBasic, part: "Para 01", from: 1, to: 16, prefix: "B-Quran-P" },
    { course: cBasic, part: "Para 02", from: 17, to: 30, prefix: "B-Quran-P" },
    { course: cTajweed, part: "Para 01", from: 20, to: 32, prefix: "T-Quran-P" },
    { course: cQaida, part: "Qaida", from: 1, to: 24, prefix: "Q-P" },
    { course: cIslamic, part: "Level 1", from: 1, to: 12, prefix: "I-L1-P" },
    { course: cIslamic, part: "Kalimas and Manners", from: 1, to: 14, prefix: "K-P" },
    { course: cIslamic, part: "Duas", from: 20, to: 30, prefix: "D-P" },
    { course: cArabic, part: "Alphabet", from: 1, to: 14, prefix: "A-P" },
  ];
  let seed = 1;
  for (const set of sets) {
    if (!set.course) continue;
    seed++;
    for (let p = set.from; p <= set.to; p++) {
      const id = randomUUID();
      await writeFile(path.join("data", "lessons", `${id}.png`), samplePage(p, seed));
      await db.insert(lessonPages).values({ id, courseId: set.course, part: set.part, pageNo: p, label: `${set.prefix}-${String(p).padStart(2, "0")}`, fileExt: "png" });
      ids.lessonPages.push(`${id}.png`);
    }
  }

  await writeFile(IDS_FILE, JSON.stringify(ids, null, 2));
  console.log(`Demo data loaded: ${rows.length} classes, ${kids.length + 1} students, ${ids.lessonPages.length} lesson pages.`);
  console.log("\nDemo accounts (remove them with `npm run demo:remove` before going live):");
  for (const a of ACCOUNTS) console.log(`  ${a.role.padEnd(8)} ${a.email.padEnd(20)} password: ${a.password}`);
}

/* ───────── Remove ───────── */

async function remove() {
  if (!existsSync(IDS_FILE)) throw new Error(`Nothing to remove: ${IDS_FILE} not found. Demo data was not loaded by this script.`);
  const ids = JSON.parse(await readFile(IDS_FILE, "utf8")) as Ids;
  const list = (k: string) => ids[k] ?? [];
  const stem = (f: string) => f.split(".")[0];

  // Safeguard: only ever delete the known demo accounts.
  const recorded = list("users").length ? await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, list("users"))) : [];
  const unexpected = recorded.filter((u) => !ACCOUNTS.some((a) => a.email === u.email));
  if (unexpected.length) throw new Error(`Refusing to delete non-demo users: ${unexpected.map((u) => u.email).join(", ")}`);

  if (list("users").length) await db.delete(activity).where(inArray(activity.userId, list("users")));
  if (list("leads").length) await db.delete(leads).where(inArray(leads.id, list("leads")));
  if (list("certificates").length) await db.delete(certificates).where(inArray(certificates.id, list("certificates")));
  if (list("invoices").length) await db.delete(invoices).where(inArray(invoices.id, list("invoices")));
  if (list("lessonPages").length) await db.delete(lessonPages).where(inArray(lessonPages.id, list("lessonPages").map(stem)));
  if (list("materials").length) await db.delete(materials).where(inArray(materials.id, list("materials").map(stem)));
  if (list("students").length) {
    await db.delete(progressReports).where(inArray(progressReports.studentId, list("students")));
    await db.delete(classSessions).where(inArray(classSessions.studentId, list("students")));
    await db.delete(students).where(inArray(students.id, list("students")));
  }
  if (list("guardians").length) await db.delete(guardians).where(inArray(guardians.id, list("guardians")));
  if (list("teachers").length) await db.delete(teachers).where(inArray(teachers.id, list("teachers")));
  if (list("users").length) await db.delete(users).where(inArray(users.id, list("users")));

  for (const f of [...list("lessonPages").map((f) => path.join("data", "lessons", f)), ...list("materials").map((f) => path.join("data", "materials", f))]) await unlink(f).catch(() => {});
  // Resized copies made for thumbnails, one per allowed width.
  for (const id of list("lessonPages").map(stem)) for (const w of [160, 480, 1200]) await unlink(path.join("data", "lessons", "thumbs", `${id}-${w}.webp`)).catch(() => {});
  await unlink(IDS_FILE);
  console.log(`Demo data removed (${recorded.length} demo accounts and everything created for them).`);
}

const mode = process.argv[2];
(mode === "load" ? load() : mode === "remove" ? remove() : Promise.reject(new Error("Usage: tsx scripts/demo-data.ts load|remove"))).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
