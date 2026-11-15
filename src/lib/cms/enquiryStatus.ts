/** Lead pipeline for a delivery platform selling to local businesses. Safe to import in the browser. */
export const ENQUIRY_STATUSES = [
  { value: "new", label: "New", tone: "bg-warn-soft text-warn" },
  { value: "contacted", label: "Contacted", tone: "bg-info-soft text-info" },
  { value: "demo", label: "Demo / onboarding", tone: "bg-accent/10 text-accent" },
  { value: "won", label: "Signed up", tone: "bg-ok-soft text-ok" },
  { value: "lost", label: "Not interested", tone: "bg-surface-2 text-fg-muted" },
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number]["value"];
export const isEnquiryStatus = (v: unknown): v is EnquiryStatus => ENQUIRY_STATUSES.some((s) => s.value === v);
export const enquiryStatusLabel = (v: string) => ENQUIRY_STATUSES.find((s) => s.value === v)?.label ?? v;

export interface EnquiryNote {
  at: string;
  by: string;
  text: string;
}

export interface Enquiry {
  id: string;
  type: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  city: string | null;
  message: string | null;
  status: EnquiryStatus;
  notes: EnquiryNote[];
  followUpOn: string | null;
  assignedTo: string | null;
  assignedEmail: string | null;
  sourcePath: string | null;
  createdAt: string;
  updatedAt: string;
}
