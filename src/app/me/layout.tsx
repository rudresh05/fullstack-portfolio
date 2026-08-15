import { RelationshipProvider } from "@/components/relationship/relationship-provider";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RelationshipProvider>
      <div className="romance-theme min-h-screen bg-[#060307]">
        {children}
      </div>
    </RelationshipProvider>
  );
}
