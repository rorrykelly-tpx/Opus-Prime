import type { Course } from "@/types/pathways";

/** Courses for a topic. `completed` holds lower-cased titles of the consultant's certificates. */
export function CourseList({ courses, completed }: { courses: Course[]; completed: Set<string> }) {
  return (
    <ul className="res">
      {courses.map((c) => (
        <li key={c.url}>
          <a href={c.url} target="_blank" rel="noopener noreferrer">
            {c.title}
            <span className="vh"> (opens in a new tab)</span>
          </a>
          {completed.has(c.title.toLowerCase()) && (
            <>
              {" "}
              <span className="rate rate-met">Completed</span>
            </>
          )}
          <small>
            {c.provider}. {c.cost}
            {c.cert ? ". Certificate available" : ""}
          </small>
        </li>
      ))}
    </ul>
  );
}
