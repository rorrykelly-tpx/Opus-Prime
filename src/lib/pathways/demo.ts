import demoJson from "@/data/demo-julia.json";
import type { Certificate, Evidence, Profile } from "@/types/pathways";

import { formatDate } from "./framework";
import { certificateSchema, evidenceSchema, profileSchema } from "./schemas";
import { blankProfile } from "./storage";

// Presentation mode: Julia Okafor, Data Engineer, Senior (9), partially meeting expectations.
// Her data comes from the prototype. Nothing done in the demo is saved.

export const DEMO_PERSON = { name: "Julia Okafor", initial: "J" };

export interface DemoData {
  profile: Profile;
  evidence: Evidence[];
  certs: Certificate[];
}

export function demoData(): DemoData {
  return {
    profile: { ...blankProfile(), ...profileSchema.parse(demoJson.profile) },
    evidence: demoJson.evidence.map((e) => evidenceSchema.parse(e)),
    certs: demoJson.certs.map((c) => certificateSchema.parse({ ...c, hasFile: true })),
  };
}

/** Draws a sample certificate for the demo, since Julia's files aren't real. */
export function drawDemoCertificate(cert: Certificate, headingFont: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 700;
  const x = canvas.getContext("2d");
  if (!x) return "";
  x.fillStyle = "#ffffff";
  x.fillRect(0, 0, 1000, 700);
  x.strokeStyle = "#141414";
  x.lineWidth = 6;
  x.strokeRect(30, 30, 940, 640);
  x.fillStyle = "#cafce5";
  x.fillRect(30, 30, 940, 110);
  x.fillStyle = "#141414";
  x.textAlign = "center";
  x.font = `bold 44px ${headingFont}, Arial Narrow, Arial`;
  x.fillText("CERTIFICATE OF COMPLETION", 500, 102);
  x.font = "28px Georgia, serif";
  x.fillText("This certifies that", 500, 230);
  x.font = "bold 64px Georgia, serif";
  x.fillText(DEMO_PERSON.name, 500, 320);
  x.font = "28px Georgia, serif";
  x.fillText("has completed", 500, 390);
  x.font = "bold 36px Arial";
  x.fillText(cert.title, 500, 450);
  x.font = "26px Arial";
  x.fillText(`${cert.provider}, ${formatDate(cert.date)}`, 500, 510);
  x.font = "18px Arial";
  x.fillStyle = "#555";
  x.fillText("Sample certificate for the demo", 500, 620);
  return canvas.toDataURL("image/png");
}
