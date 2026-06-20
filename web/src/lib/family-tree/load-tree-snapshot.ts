import { cache } from "react";

import { loadHomeViewModel } from "@/lib/home/load-home-view-model";
import type { FamilyTreeSnapshot } from "@/lib/family-tree/types";

export const loadInitialFamilyTreeSnapshot = cache(
  async (): Promise<FamilyTreeSnapshot> => {
    const model = await loadHomeViewModel();
    return model.tree;
  },
);
