import "server-only";
import { asc } from "drizzle-orm";
import { courses, db, guardians, packages, students, teachers } from "@/db";
import type { Option, OptionSource } from "./fields";

const loaders: Record<OptionSource, () => Promise<Option[]>> = {
  courses: async () =>
    (await db.select({ id: courses.id, title: courses.title }).from(courses).orderBy(asc(courses.sortOrder))).map((r) => ({
      value: r.id,
      label: r.title,
    })),
  teachers: async () =>
    (await db.select({ id: teachers.id, name: teachers.name, active: teachers.active }).from(teachers).orderBy(asc(teachers.name))).map((r) => ({
      value: r.id,
      label: r.active ? r.name : `${r.name} (inactive)`,
    })),
  students: async () =>
    (await db.select({ id: students.id, name: students.name }).from(students).orderBy(asc(students.name))).map((r) => ({
      value: r.id,
      label: r.name,
    })),
  guardians: async () =>
    (await db.select({ id: guardians.id, name: guardians.name }).from(guardians).orderBy(asc(guardians.name))).map((r) => ({
      value: r.id,
      label: r.name,
    })),
  packages: async () =>
    (await db.select({ id: packages.id, name: packages.name }).from(packages).orderBy(asc(packages.sortOrder))).map((r) => ({
      value: r.id,
      label: r.name,
    })),
};

export async function loadOptions(sources: OptionSource[]): Promise<Partial<Record<OptionSource, Option[]>>> {
  const unique = [...new Set(sources)];
  const lists = await Promise.all(unique.map((s) => loaders[s]()));
  return Object.fromEntries(unique.map((s, i) => [s, lists[i]]));
}

/** id -> label maps, used to show names instead of ids in tables. */
export async function loadLabels(sources: OptionSource[]): Promise<Partial<Record<OptionSource, Record<string, string>>>> {
  const options = await loadOptions(sources);
  return Object.fromEntries(
    Object.entries(options).map(([k, list]) => [k, Object.fromEntries((list ?? []).map((o) => [o.value, o.label]))]),
  );
}
