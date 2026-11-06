import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, BookOpen, Shield, Handshake, CheckCircle2, Lightbulb } from "lucide-react";

const pillars = [
  {
    id: "pillar-1",
    number: "01",
    title: "Cognitive Reframing",
    subtitle: "Problem it solves: Risk seen as burden, not opportunity",
    icon: Brain,
    color: "bg-primary",
    description: "Shift from 'risk as a threat' to 'risk intelligence as a competitive advantage.' When you see risk clearly, you can take bolder, smarter actions.",
    insight: "Organisations that view risk management as strategic rather than compliance-driven are better positioned to seize opportunities while protecting downside.",
    strategies: [
      {
        title: "Reframe Risk Conversations",
        action: "In leadership meetings, start asking 'What risks are we comfortable taking?' instead of just 'What risks should we avoid?'",
      },
      {
        title: "Celebrate Risk Intelligence",
        action: "Recognise team members who identify risks early—make it part of positive culture, not blame culture.",
      },
      {
        title: "Strategic Risk Reviews",
        action: "Dedicate quarterly time to discussing how risk awareness enabled better business decisions.",
      },
    ],
  },
  {
    id: "pillar-2",
    number: "02",
    title: "Foundational Literacy",
    subtitle: "Problem it solves: Confusion about risk concepts",
    icon: BookOpen,
    color: "bg-pillar-2",
    description: "Speak the language of risk. Understand key terms—inherent vs. residual risk, likelihood vs. impact, risk appetite vs. tolerance—to enable clear analysis.",
    insight: "Risk literacy enables faster, more confident decision-making. Teams that share common risk vocabulary can assess and respond to threats more effectively.",
    strategies: [
      {
        title: "Risk Glossary",
        action: "Create a simple one-page risk terminology guide for your team. Include terms like inherent risk, residual risk, mitigation, and risk appetite.",
      },
      {
        title: "Monthly Risk Briefings",
        action: "Dedicate 15 minutes monthly to discuss one risk concept and how it applies to your business context.",
      },
      {
        title: "Cross-Functional Training",
        action: "Ensure team leaders across departments understand basic risk assessment—not just finance or compliance.",
      },
    ],
  },
  {
    id: "pillar-3",
    number: "03",
    title: "Procedural Rigor",
    subtitle: "Problem it solves: Inconsistent processes and reactive firefighting",
    icon: Shield,
    color: "bg-pillar-3",
    description: "Implement a Unified Risk Register and standard operating procedures for all risk domains. Systemise with clarity.",
    insight: "Based on ISO 31000 international standards, structured risk management enhances organisational capability and resilience through repeatable, scalable processes.",
    strategies: [
      {
        title: "1. Unified Risk Register",
        action: "Maintain one central log for operational, supply chain, financial, and cyber risks. Review and update quarterly.",
      },
      {
        title: "2. Standardised Assessment",
        action: "Use consistent likelihood × impact scoring across all risk categories. This enables comparison and prioritisation.",
      },
      {
        title: "3. Incident Reporting Workflow",
        action: "Create a simple process for logging and escalating risk events—who reports, to whom, within what timeframe.",
      },
      {
        title: "4. Quarterly Risk Reviews",
        action: "Schedule formal reviews of the risk register, especially after major business changes or external events.",
      },
    ],
  },
  {
    id: "pillar-4",
    number: "04",
    title: "Synergistic Engagement",
    subtitle: "Problem it solves: Siloed risk management",
    icon: Handshake,
    color: "bg-pillar-4",
    description: "Foster cross-departmental risk communication and integrate advisor insights—legal, cyber, financial, operational—into a unified risk culture.",
    insight: "Risk management is most effective when it's everyone's responsibility. Cross-functional collaboration catches blind spots and builds collective resilience.",
    strategies: [
      {
        title: "Cross-Functional Risk Committee",
        action: "Form a small group with representatives from operations, finance, IT, and legal to review risks holistically.",
      },
      {
        title: "Advisor Integration",
        action: "Treat external advisors (accountants, lawyers, IT security) as strategic partners contributing to your risk picture.",
      },
      {
        title: "Open Risk Dialogue",
        action: "Create psychological safety for team members to raise concerns without fear. Early warning beats late discovery.",
      },
    ],
  },
];

const PillarsSection = () => {
  const [activeTab, setActiveTab] = useState("pillar-1");

  return (
    <section id="pillars" className="section-padding">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            The Four Building Blocks of SCRF
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            SCRF works because risk management is not just technical—it's behavioural, operational, and relational.
            Each building block addresses a real challenge SME leaders face.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 h-auto bg-transparent mb-8">
            {pillars.map((pillar) => (
              <TabsTrigger
                key={pillar.id}
                value={pillar.id}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=inactive]:bg-card data-[state=inactive]:border-border/50 hover:border-primary/50`}
              >
                <div className={`p-2 rounded-lg ${pillar.color}/10`}>
                  <pillar.icon className={`h-5 w-5 text-foreground`} />
                </div>
                <span className="font-display font-semibold text-sm text-center">
                  {pillar.title}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {pillars.map((pillar) => (
            <TabsContent key={pillar.id} value={pillar.id} className="animate-fade-in">
              <Card className="border-2 border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`text-5xl font-display font-bold text-primary/20`}>
                      {pillar.number}
                    </span>
                    <div>
                      <CardTitle className="font-display text-2xl md:text-3xl">
                        {pillar.title}
                      </CardTitle>
                      <CardDescription className="text-base font-medium text-primary">
                        {pillar.subtitle}
                      </CardDescription>
                    </div>
                  </div>
                  <p className="text-lg text-muted-foreground">{pillar.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key Insight */}
                  <div className="p-4 bg-secondary rounded-xl flex gap-3">
                    <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-primary mb-1">Key Insight</p>
                      <p className="text-sm text-muted-foreground">{pillar.insight}</p>
                    </div>
                  </div>

                  {/* Strategies */}
                  <div>
                    <h4 className="font-display font-semibold text-lg mb-4">
                      Practical Implementation Steps
                    </h4>
                    <div className="space-y-4">
                      {pillar.strategies.map((strategy, index) => (
                        <div 
                          key={index}
                          className="p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold mb-1">{strategy.title}</p>
                              <p className="text-sm text-muted-foreground">{strategy.action}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default PillarsSection;
