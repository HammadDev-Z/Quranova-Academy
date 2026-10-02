import { and, asc, desc, eq, gte, count } from "drizzle-orm";
import Link from "next/link";
import { CreateTeacherLoginForm, ResetPasswordForm } from "@/components/admin/auth-forms";
import { Badge, Panel } from "@/components/admin/ui";
import { classSessions, db, guardians, invoices, leadStatuses, progressReports, students, teachers, users } from "@/db";
import { formatMoney } from "@/lib/admin/format";
import { paymentMethods } from "@/lib/admin/resources";
import { formatDateOnly, formatDateTime, todayKey } from "@/lib/admin/time";
import { convertLeadToStudent, markInvoicePaid, markReportReviewed, setClassStatus, setLeadStatus } from "@/lib/admin/workflow-actions";
import { formatLabel } from "@/lib/admin/fields";
import { setUserActive } from "@/lib/auth/actions";

type Row = Record<string, unknown> & { id: string };

const btn = "rounded-lg border border-brand-300 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50";
const small = "mt-1 text-sm text-muted";

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+") && digits.length >= 8) return `https://wa.me/${digits}`;
  return null;
}

function Contact({ email, phone }: { email?: string; phone?: string }) {
  const wa = phone ? waLink(phone) : null;
  return (
    <div className="flex flex-wrap gap-2">
      {email && (
        <a href={`mailto:${email}`} className={btn}>
          Email
        </a>
      )}
      {phone && (
        <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={btn}>
          Call
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={btn}>
          WhatsApp
        </a>
      )}
    </div>
  );
}

export async function SidePanel({ resource, row, tz }: { resource: string; row: Row; tz: string }) {
  switch (resource) {
    case "leads":
      return <LeadPanel row={row} />;
    case "students":
      return <StudentPanel row={row} tz={tz} />;
    case "guardians":
      return <GuardianPanel row={row} />;
    case "teachers":
      return <TeacherPanel row={row} tz={tz} />;
    case "invoices":
      return <InvoicePanel row={row} tz={tz} />;
    case "classes":
      return <ClassPanel row={row} tz={tz} />;
    case "reports":
      return <ReportPanel row={row} />;
    default:
      return null;
  }
}

async function LeadPanel({ row }: { row: Row }) {
  const studentId = row.studentId as string | null;
  const [student] = studentId ? await db.select({ id: students.id, name: students.name }).from(students).where(eq(students.id, studentId)).limit(1) : [];

  return (
    <>
      <Panel title="Follow up">
        <Contact email={row.email as string} phone={row.phone as string} />
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Move to</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {leadStatuses.map((s) => (
            <form key={s} action={setLeadStatus.bind(null, row.id, s)}>
              <button
                type="submit"
                disabled={row.status === s}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${row.status === s ? "bg-brand-600 text-white" : "border border-brand-200 text-brand-700 hover:bg-brand-50"}`}
              >
                {formatLabel(s)}
              </button>
            </form>
          ))}
        </div>
      </Panel>
      <Panel title="Student record">
        {student ? (
          <p>
            Converted to{" "}
            <Link href={`/admin/students/${student.id}`} className="font-semibold text-brand-700 underline">
              {student.name}
            </Link>
            .
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">Creates a parent and a trial student from this request, ready for scheduling.</p>
            <form action={convertLeadToStudent.bind(null, row.id)} className="mt-3">
              <button type="submit" className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Convert to student
              </button>
            </form>
          </>
        )}
      </Panel>
    </>
  );
}

async function StudentPanel({ row, tz }: { row: Row; tz: string }) {
  const id = row.id;
  const [upcoming, bills, reports, [guardian], [{ n: doneCount }]] = await Promise.all([
    db
      .select()
      .from(classSessions)
      .where(and(eq(classSessions.studentId, id), gte(classSessions.startsAt, new Date())))
      .orderBy(asc(classSessions.startsAt))
      .limit(5),
    db.select().from(invoices).where(eq(invoices.studentId, id)).orderBy(desc(invoices.createdAt)).limit(5),
    db.select().from(progressReports).where(eq(progressReports.studentId, id)).orderBy(desc(progressReports.month)).limit(3),
    row.guardianId ? db.select().from(guardians).where(eq(guardians.id, row.guardianId as string)).limit(1) : Promise.resolve([]),
    db.select({ n: count() }).from(classSessions).where(and(eq(classSessions.studentId, id), eq(classSessions.status, "completed"))),
  ]);
  const today = todayKey(tz);

  return (
    <>
      <Panel title="Quick actions">
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/classes/new?studentId=${id}`} className={btn}>
            Schedule class
          </Link>
          <Link href={`/admin/classes/recurring?studentId=${id}`} className={btn}>
            Weekly schedule
          </Link>
          <Link href={`/admin/invoices/new?studentId=${id}`} className={btn}>
            Create invoice
          </Link>
          <Link href={`/admin/reports/new?studentId=${id}`} className={btn}>
            Write report
          </Link>
        </div>
        <p className={small}>{doneCount} classes completed</p>
      </Panel>

      {guardian && (
        <Panel title="Parent / guardian">
          <Link href={`/admin/guardians/${guardian.id}`} className="font-semibold text-brand-700 hover:underline">
            {guardian.name}
          </Link>
          <p className={small}>{[guardian.phone, guardian.email].filter(Boolean).join(" · ")}</p>
          <div className="mt-3">
            <Contact email={guardian.email} phone={guardian.phone} />
          </div>
        </Panel>
      )}

      <Panel title="Upcoming classes">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">None scheduled.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {upcoming.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <Link href={`/admin/classes/${c.id}`} className="font-medium text-brand-700 hover:underline">
                  {formatDateTime(c.startsAt, tz)}
                </Link>
                {c.isTrial && <Badge value="trial" />}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Invoices">
        {bills.length === 0 ? (
          <p className="text-sm text-muted">No invoices.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {bills.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2">
                <Link href={`/admin/invoices/${b.id}`} className="font-medium text-brand-700 hover:underline">
                  {b.number} · {formatMoney(b.amountMinor, b.currency)}
                </Link>
                <Badge value={b.status === "unpaid" && b.dueOn < today ? "overdue" : b.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Progress reports">
        {reports.length === 0 ? (
          <p className="text-sm text-muted">No reports yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {reports.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/reports/${r.id}`} className="font-medium text-brand-700 hover:underline">
                  {r.month}
                </Link>
                {r.rating ? <span className="text-muted"> · {r.rating}/5</span> : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

async function GuardianPanel({ row }: { row: Row }) {
  const kids = await db.select().from(students).where(eq(students.guardianId, row.id)).orderBy(asc(students.name));
  return (
    <>
      <Panel title="Contact">
        <Contact email={row.email as string} phone={row.phone as string} />
      </Panel>
      <Panel title="Children">
        {kids.length === 0 ? (
          <p className="text-sm text-muted">No students linked yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {kids.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-2">
                <Link href={`/admin/students/${k.id}`} className="font-medium text-brand-700 hover:underline">
                  {k.name}
                </Link>
                <Badge value={k.status} />
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/students/new" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          + Add student
        </Link>
      </Panel>
    </>
  );
}

async function TeacherPanel({ row, tz }: { row: Row; tz: string }) {
  const teacherUserId = row.userId as string | null;
  const [mine, upcoming, [loginUser]] = await Promise.all([
    db.select().from(students).where(eq(students.teacherId, row.id)).orderBy(asc(students.name)),
    db
      .select()
      .from(classSessions)
      .where(and(eq(classSessions.teacherId, row.id), gte(classSessions.startsAt, new Date())))
      .orderBy(asc(classSessions.startsAt))
      .limit(6),
    teacherUserId ? db.select().from(users).where(eq(users.id, teacherUserId)).limit(1) : Promise.resolve([]),
  ]);

  return (
    <>
      <Panel title="Teacher portal login">
        {loginUser ? (
          <>
            <p className="text-sm">
              {loginUser.email} · <Badge value={loginUser.active ? "active" : "paused"} />
            </p>
            <div className="mt-3 space-y-3">
              <ResetPasswordForm userId={loginUser.id} />
              <form action={setUserActive.bind(null, loginUser.id, !loginUser.active)}>
                <button
                  type="submit"
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${loginUser.active ? "border-red-300 text-red-700 hover:bg-red-50" : "border-brand-300 text-brand-700 hover:bg-brand-50"}`}
                >
                  {loginUser.active ? "Deactivate login" : "Reactivate login"}
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              No portal login yet. {row.email ? `Creates one for ${row.email}.` : "Add an email on this teacher first."}
            </p>
            {row.email ? <div className="mt-3"><CreateTeacherLoginForm teacherId={row.id} /></div> : null}
          </>
        )}
      </Panel>

      <Panel title="Contact">
        <Contact email={row.email as string} phone={row.phone as string} />
      </Panel>
      <Panel title={`Assigned students (${mine.length})`}>
        {mine.length === 0 ? (
          <p className="text-sm text-muted">No students assigned.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {mine.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/students/${s.id}`} className="font-medium text-brand-700 hover:underline">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Upcoming classes">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">None scheduled.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {upcoming.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/classes/${c.id}`} className="font-medium text-brand-700 hover:underline">
                  {formatDateTime(c.startsAt, tz)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

async function InvoicePanel({ row, tz }: { row: Row; tz: string }) {
  const overdue = row.status === "unpaid" && String(row.dueOn) < todayKey(tz);
  return (
    <Panel title="Payment">
      <p className="text-sm">
        Status: <Badge value={overdue ? "overdue" : String(row.status)} />
      </p>
      {row.status === "paid" ? (
        <p className={small}>
          Paid on {formatDateOnly(String(row.paidOn))}
          {row.method ? ` by ${row.method}` : ""}.
        </p>
      ) : row.status === "unpaid" ? (
        <form action={markInvoicePaid.bind(null, row.id)} className="mt-3 space-y-3">
          <select name="method" defaultValue="" className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm" aria-label="Payment method">
            <option value="">Payment method…</option>
            {paymentMethods.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <input name="reference" placeholder="Reference (optional)" className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm" />
          <button type="submit" className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Mark as paid today
          </button>
        </form>
      ) : null}
    </Panel>
  );
}

async function ClassPanel({ row, tz }: { row: Row; tz: string }) {
  const [t] = row.teacherId ? await db.select({ name: teachers.name }).from(teachers).where(eq(teachers.id, row.teacherId as string)).limit(1) : [];
  const [s] = await db.select({ name: students.name, timezone: students.timezone }).from(students).where(eq(students.id, row.studentId as string)).limit(1);
  const deadline = row.rescheduleDeadline as Date | null;
  const rescheduleCount = (row.rescheduleCount as number) ?? 0;
  const eligible = deadline && deadline > new Date() && rescheduleCount < 2;

  return (
    <>
      <Panel title="Quick status">
        <p className="text-sm">
          {s?.name ?? "Student"}
          {t ? ` with ${t.name}` : " (no teacher yet)"}
        </p>
        {s?.timezone && (
          <p className={small}>
            Student time: {formatDateTime(row.startsAt as Date, s.timezone)} ({s.timezone})
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {(["completed", "missed_student", "missed_teacher", "student_leave", "teacher_leave", "cancelled", "scheduled"] as const).map((st) => (
            <form key={st} action={setClassStatus.bind(null, row.id, st)}>
              <button
                type="submit"
                disabled={row.status === st}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${row.status === st ? "bg-brand-600 text-white" : "border border-brand-200 text-brand-700 hover:bg-brand-50"}`}
              >
                {formatLabel(st)}
              </button>
            </form>
          ))}
        </div>
      </Panel>
      {deadline && (
        <Panel title="Reschedule">
          <p className="text-sm">
            {rescheduleCount} of 2 used.{" "}
            {eligible ? `The teacher can reschedule until ${formatDateTime(deadline, tz)}.` : "No longer eligible."}
          </p>
        </Panel>
      )}
    </>
  );
}

async function ReportPanel({ row }: { row: Row }) {
  const [s] = await db.select({ name: students.name }).from(students).where(eq(students.id, row.studentId as string)).limit(1);
  return (
    <Panel title="Review">
      <p className="text-sm">
        {s?.name ?? "Student"} · <Badge value={String(row.status)} />
      </p>
      {row.status === "submitted" && (
        <form action={markReportReviewed.bind(null, row.id)} className="mt-3">
          <button type="submit" className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Mark reviewed
          </button>
        </form>
      )}
      {row.status === "reviewed" && <p className={small}>This report is locked and can no longer be edited by the teacher.</p>}
      {row.status === "draft" && <p className={small}>The teacher has not submitted this report yet.</p>}
    </Panel>
  );
}

