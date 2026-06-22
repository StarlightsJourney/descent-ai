import { FamilyTreeWorkspace } from "@/components/family-tree-workspace";
import { loadHomeViewModel } from "@/lib/home/load-home-view-model";

export default async function Home() {
  const model = await loadHomeViewModel();

  return (
    <FamilyTreeWorkspace
      initialTree={model.tree}
      source={model.source}
      userEmail={model.userEmail}
    />
  );
}
