import type { EvidenceTags } from "@/types/pathways";

export function TagChips({ tags }: { tags: EvidenceTags }) {
  return (
    <div className="chips">
      {tags.skills.map((s) => (
        <span key={`s:${s.name}`} className="chip">
          {s.name}: {s.level}
        </span>
      ))}
      {tags.behaviours.map((b) => (
        <span key={`b:${b.name}`} className="chip b">
          {b.name}: {b.band}
        </span>
      ))}
      {tags.impacts.map((i) => (
        <span key={`i:${i}`} className="chip i">
          {i}
        </span>
      ))}
      {tags.consulting.map((c) => (
        <span key={`c:${c}`} className="chip c">
          {c}
        </span>
      ))}
    </div>
  );
}
