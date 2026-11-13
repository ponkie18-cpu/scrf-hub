import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AgentResponse from "@/components/agent/AgentResponse";
import type { AgentResponseData } from "@/services/agentService";

vi.mock("@/services/agentService", () => ({ TOOL_LABELS: {} }));
vi.mock("@/components/agent/AgentRating", () => ({ default: () => null }));
afterEach(cleanup);
const answer: AgentResponseData = {
  insight: "Current risk insight", recommendation: "Review the plan", nextAction: "Open dashboard",
  urgencyLevel: "amber", relatedTools: [],
};

describe("agent provenance display", () => {
  it("remains compatible with older answers without metadata", () => {
    render(<AgentResponse data={answer} />);
    expect(screen.getByText("Current risk insight")).toBeInTheDocument();
    expect(screen.queryByLabelText("Answer sources")).toBeNull();
  });
  it("shows server evidence metadata and data limitations", () => {
    render(<AgentResponse data={{ ...answer,
      sources: [{ id: "knowledge:k1:v2", kind: "knowledge", observedAt: "2026-11-13T00:00:00Z", revision: 2 }],
      dataWarnings: ["actions: temporarily unavailable; do not infer absence."],
    }} />);
    expect(screen.getByLabelText("Answer sources")).toHaveTextContent("knowledge:k1:v2");
    expect(screen.getByLabelText("Answer sources")).toHaveTextContent("revision 2");
    expect(screen.getByLabelText("Data limitations")).toHaveTextContent("temporarily unavailable");
  });
  it("renders source and warning strings as text, never arbitrary links or HTML", () => {
    const { container } = render(<AgentResponse data={{ ...answer,
      sources: [{ id: "<img src=x onerror=alert(1)>", kind: "assessment", observedAt: "2026-11-13T00:00:00Z" }],
      dataWarnings: ["<script>alert(1)</script>"],
    }} />);
    expect(container.querySelector("img,script,a")).toBeNull();
    expect(screen.getByLabelText("Data limitations")).toHaveTextContent("<script>alert(1)</script>");
  });
});