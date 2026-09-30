"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  activeFramework,
  createAppStore,
  type AppSnapshot,
  type AppStore,
} from "@/lib/pathways/app-store";
import type { User } from "@/types";
import type {
  ActiveFramework,
  Framework,
  KnowledgeCatalogue,
  LearningResource,
} from "@/types/pathways";

interface PathwaysContextValue {
  store: AppStore;
  user: User;
  builtinFramework: Framework;
  resources: LearningResource[];
  knowledge: KnowledgeCatalogue;
}

const PathwaysContext = createContext<PathwaysContextValue | null>(null);

export interface Pathways extends AppSnapshot, PathwaysContextValue {
  framework: ActiveFramework;
}

/** The consultant's pathway data and the actions that change it. */
export function usePathways(): Pathways {
  const value = useContext(PathwaysContext);
  if (!value) throw new Error("usePathways must be used inside PathwaysProvider");
  const snapshot = useSyncExternalStore(
    value.store.subscribe,
    value.store.getSnapshot,
    value.store.getServerSnapshot,
  );
  const framework = useMemo(
    () => activeFramework(value.builtinFramework, snapshot.override),
    [value.builtinFramework, snapshot.override],
  );
  return { ...value, ...snapshot, framework };
}

interface PathwaysProviderProps {
  user: User;
  framework: Framework;
  resources: LearningResource[];
  knowledge: KnowledgeCatalogue;
  children: ReactNode;
}

export function PathwaysProvider({
  user,
  framework,
  resources,
  knowledge,
  children,
}: PathwaysProviderProps) {
  // One store per signed-in user, for the life of the page.
  const [store] = useState(() => createAppStore(user.id, framework));
  const value = useMemo(
    () => ({ store, user, builtinFramework: framework, resources, knowledge }),
    [store, user, framework, resources, knowledge],
  );
  return <PathwaysContext.Provider value={value}>{children}</PathwaysContext.Provider>;
}
