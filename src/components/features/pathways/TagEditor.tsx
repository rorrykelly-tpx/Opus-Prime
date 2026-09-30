"use client";

import {
  bandForGrade,
  bandLabel,
  BEHAVIOUR_BANDS,
  findSkill,
  PROFICIENCY_LEVELS,
} from "@/lib/pathways/framework";
import type {
  BehaviourBand,
  EvidenceTags,
  Framework,
  Grade,
  ProficiencyLevel,
  Role,
} from "@/types/pathways";

interface TagEditorProps {
  framework: Framework;
  role: Role;
  grade: Grade;
  tags: EvidenceTags;
  onChange: (tags: EvidenceTags) => void;
}

/** Levels worth offering for a skill: the ones it describes, plus the current choice. */
function levelOptions(framework: Framework, skillName: string, current: ProficiencyLevel) {
  const skill = findSkill(framework, skillName);
  return PROFICIENCY_LEVELS.filter((l) => !skill || skill.levels[l].length > 0 || l === current);
}

export function TagEditor({ framework, role, grade, tags, onChange }: TagEditorProps) {
  function setSkill(i: number, name: string) {
    const skill = findSkill(framework, name);
    const current = tags.skills[i]!.level;
    const level =
      skill && !skill.levels[current].length
        ? (PROFICIENCY_LEVELS.find((l) => skill.levels[l].length) ?? current)
        : current;
    onChange({
      ...tags,
      skills: tags.skills.map((s, j) => (j === i ? { name, level, why: "" } : s)),
    });
  }

  function setLevel(i: number, level: ProficiencyLevel) {
    onChange({
      ...tags,
      skills: tags.skills.map((s, j) => (j === i ? { ...s, level, why: "" } : s)),
    });
  }

  function setBehaviour(i: number, patch: { name?: string; band?: BehaviourBand }) {
    onChange({
      ...tags,
      behaviours: tags.behaviours.map((b, j) => (j === i ? { ...b, ...patch, why: "" } : b)),
    });
  }

  function addSkill() {
    const s =
      role.skills.find((x) => !tags.skills.some((y) => y.name === x.name)) ?? role.skills[0];
    if (!s) return;
    onChange({
      ...tags,
      skills: [...tags.skills, { name: s.name, level: s.expected[grade] ?? "Learner", why: "" }],
    });
  }

  function addBehaviour() {
    const b =
      framework.behaviours.find((x) => !tags.behaviours.some((y) => y.name === x.name)) ??
      framework.behaviours[0];
    if (!b) return;
    onChange({
      ...tags,
      behaviours: [...tags.behaviours, { name: b.name, band: bandForGrade(grade), why: "" }],
    });
  }

  function toggle(list: "impacts" | "consulting", value: string, on: boolean) {
    const current = tags[list];
    onChange({
      ...tags,
      [list]: on ? [...new Set([...current, value])] : current.filter((x) => x !== value),
    });
  }

  return (
    <>
      <h3 style={{ marginTop: 22 }}>Skills shown</h3>
      {tags.skills.length ? (
        tags.skills.map((s, i) => (
          <div className="tagrow" key={i}>
            <select
              aria-label={`Skill ${i + 1}`}
              value={s.name}
              onChange={(e) => setSkill(i, e.target.value)}
            >
              {role.skills.map((x) => (
                <option key={x.name}>{x.name}</option>
              ))}
            </select>
            <select
              aria-label={`Level for ${s.name}`}
              value={s.level}
              onChange={(e) => setLevel(i, e.target.value as ProficiencyLevel)}
            >
              {levelOptions(framework, s.name, s.level).map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <button
              type="button"
              className="linkbtn"
              onClick={() => onChange({ ...tags, skills: tags.skills.filter((_, j) => j !== i) })}
            >
              Remove<span className="vh"> {s.name}</span>
            </button>
            {s.why && <span className="why">{s.why}</span>}
          </div>
        ))
      ) : (
        <p className="small muted">None tagged.</p>
      )}
      <button type="button" className="linkbtn" onClick={addSkill}>
        Add a skill
      </button>

      <h3 style={{ marginTop: 22 }}>Behaviours shown</h3>
      {tags.behaviours.length ? (
        tags.behaviours.map((b, i) => (
          <div className="tagrow" key={i}>
            <select
              aria-label={`Behaviour ${i + 1}`}
              value={b.name}
              onChange={(e) => setBehaviour(i, { name: e.target.value })}
            >
              {framework.behaviours.map((x) => (
                <option key={x.name}>{x.name}</option>
              ))}
            </select>
            <select
              aria-label={`Grade band for ${b.name}`}
              value={b.band}
              onChange={(e) => setBehaviour(i, { band: e.target.value as BehaviourBand })}
            >
              {BEHAVIOUR_BANDS.map((band) => (
                <option key={band} value={band}>
                  {bandLabel(band)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="linkbtn"
              onClick={() =>
                onChange({ ...tags, behaviours: tags.behaviours.filter((_, j) => j !== i) })
              }
            >
              Remove<span className="vh"> {b.name}</span>
            </button>
            {b.why && <span className="why">{b.why}</span>}
          </div>
        ))
      ) : (
        <p className="small muted">None tagged.</p>
      )}
      <button type="button" className="linkbtn" onClick={addBehaviour}>
        Add a behaviour
      </button>

      <div className="cols" style={{ gap: 20, marginTop: 22 }}>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend>
            <h3>Impact</h3>
          </legend>
          {framework.impacts.map((i) => (
            <label className="chk" key={i.name}>
              <input
                type="checkbox"
                checked={tags.impacts.includes(i.name)}
                onChange={(e) => toggle("impacts", i.name, e.target.checked)}
              />{" "}
              {i.name}
            </label>
          ))}
        </fieldset>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend>
            <h3>Consulting core</h3>
          </legend>
          {framework.consultingPillars.map((p) => (
            <label className="chk" key={p.pillar}>
              <input
                type="checkbox"
                checked={tags.consulting.includes(p.pillar)}
                onChange={(e) => toggle("consulting", p.pillar, e.target.checked)}
              />{" "}
              {p.pillar}
            </label>
          ))}
        </fieldset>
      </div>
    </>
  );
}
