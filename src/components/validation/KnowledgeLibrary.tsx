import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Download } from "lucide-react";

const DOMAINS: Record<string, string> = {
  tax_sars: "Tax / SARS",
  popia: "POPIA",
  cipc_companies_act: "CIPC / Companies Act",
  labour_bcea: "Labour / BCEA",
  fais_financial: "FAIS / Financial",
};

export default function KnowledgeLibrary() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["knowledge-library"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_knowledge_base")
        .select("*")
        .eq("status", "approved")
        .order("domain")
        .order("applied_at", { ascending: false });
      return data || [];
    },
  });

  const domainGroups = Object.keys(DOMAINS).map((key) => ({
    key,
    label: DOMAINS[key],
    entries: (entries || []).filter((e) => e.domain === key),
  }));

  const handleExport = () => {
    if (!entries?.length) return;
    let text = "SCRF Hub — Knowledge Library\nExported: " + new Date().toLocaleDateString() + "\n\n";
    for (const group of domainGroups) {
      if (!group.entries.length) continue;
      text += `═══ ${group.label} ═══\n`;
      for (const e of group.entries) {
        text += `• ${e.corrected_statement}\n`;
        if (e.supporting_reference) text += `  Ref: ${e.supporting_reference}\n`;
        text += `  Verified: ${e.applied_at ? new Date(e.applied_at).toLocaleDateString() : "N/A"}\n\n`;
      }
    }
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "knowledge-library.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Knowledge Library</h2>
          <Badge variant="secondary">{entries?.length || 0} entries</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!entries?.length}>
          <Download className="h-4 w-4 mr-2" />Export
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      {domainGroups.map((group) => (
        group.entries.length > 0 && (
          <Card key={group.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{group.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.entries.map((entry) => (
                  <div key={entry.id} className="p-3 bg-muted/50 rounded-lg text-sm border-l-2 border-primary/30">
                    <p className="font-medium text-foreground">{entry.corrected_statement}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {entry.supporting_reference && <span>📖 {entry.supporting_reference}</span>}
                      <span>Published {entry.applied_at ? new Date(entry.applied_at).toLocaleDateString() : "N/A"} (agent also checks jurisdiction and validity)</span>
                      {entry.applied_by && <span>by {entry.applied_by}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ))}

      {!isLoading && !entries?.length && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No approved corrections yet. Complete expert reviews and apply corrections to build the knowledge library.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
