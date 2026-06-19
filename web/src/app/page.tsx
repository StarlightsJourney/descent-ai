import { FamilyTreeWorkspace } from "@/components/family-tree-workspace";
import { demoTree } from "@/lib/family-tree/mock-data";

export default function Home() {
  return <FamilyTreeWorkspace initialTree={demoTree} />;
}
