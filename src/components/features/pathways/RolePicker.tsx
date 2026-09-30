import type { RoleOption } from "@/types/pathways";

interface RoleGroup {
  capability: string;
  practices: { practice: string; roles: RoleOption[] }[];
}

// Keeps framework order, so capabilities and practices appear as they do in the spreadsheet.
function groupRoles(roles: RoleOption[]): RoleGroup[] {
  const groups: RoleGroup[] = [];
  for (const role of roles) {
    let group = groups.find((g) => g.capability === role.capability);
    if (!group) {
      group = { capability: role.capability, practices: [] };
      groups.push(group);
    }
    let practice = group.practices.find((p) => p.practice === role.practice);
    if (!practice) {
      practice = { practice: role.practice, roles: [] };
      group.practices.push(practice);
    }
    practice.roles.push(role);
  }
  return groups;
}

interface RolePickerProps {
  roles: RoleOption[];
  value: string | null;
  onChange: (roleSlug: string) => void;
  errorId?: string;
}

export function RolePicker({ roles, value, onChange, errorId }: RolePickerProps) {
  return (
    <fieldset aria-describedby={errorId}>
      <legend>
        <h2 className="text-2xl font-semibold">What&apos;s your role?</h2>
      </legend>
      <div className="mt-4 space-y-8">
        {groupRoles(roles).map((group) => (
          <div key={group.capability}>
            <h3 className="text-lg font-semibold">{group.capability}</h3>
            <div className="mt-3 space-y-4">
              {group.practices.map((practice) => (
                <fieldset key={practice.practice}>
                  <legend className="text-sm font-medium text-slate-700">
                    {practice.practice}
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {practice.roles.map((role) => (
                      <label
                        key={role.slug}
                        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-slate-400 px-3 py-2 hover:bg-slate-50 has-checked:border-indigo-700 has-checked:bg-indigo-50"
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.slug}
                          checked={value === role.slug}
                          onChange={() => onChange(role.slug)}
                          className="size-4 accent-indigo-700"
                        />
                        {role.role}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
