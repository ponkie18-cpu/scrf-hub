import { Info } from "lucide-react";

const DisclaimerSection = () => {
  return (
    <section className="py-10 px-4 md:px-8">
      <div className="container max-w-4xl mx-auto">
        <div className="flex gap-3 p-5 rounded-xl border border-border bg-muted/40">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            SCRF Hub provides business resilience diagnostics, educational guidance, and
            decision-support insights. It does not provide tax advice, legal advice,
            audit opinions, investment advice, or regulated financial services. For
            tax-specific matters, users should consult a qualified tax practitioner or
            visit SAIT at{" "}
            <a href="https://www.sait.org.za" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              sait.org.za
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
};

export default DisclaimerSection;