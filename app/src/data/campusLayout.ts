import { CampusLayoutType } from "@/types/types";

export const campusLayout: CampusLayoutType = {
  "f0": {
    name: "Floor 0",
    hostPrefix: "f0",
    notes: "Layout based on provided text. Hostnames like f0rXsY",
    detailedLayout: [
      { rowLabel: "R13", seats: ["r13s1", "r13s2", "r13s3", "r13s4", "r13s5", "r13s6"] },
      { rowLabel: "R12", seats: ["r12s1", "r12s2", "r12s3", "r12s4", "r12s5", "r12s6", "r12s7", "r12s8", "r12s9", "r12s10", "r12s11", "r12s12", "r12s13", "r12s14", "r12s15", "r12s16", "r12s17", "r12s18", "r12s19", "r12s20", "r12s21", "r12s22", "r12s23"] },
      { rowLabel: "R11", seats: ["r11s1", "r11s2", "r11s3", "r11s4", "r11s5", "r11s6", "r11s7", "r11s8", "r11s9", "r11s10", "r11s11", "r11s12", "r11s13", "r11s14", "r11s15", "r11s16", "r11s17", "r11s18", "r11s19", "r11s20", "r11s21", "r11s22", "r11s23"] },
      // Additional rows omitted for brevity
      { rowLabel: "R1", seats: ["r1s1", "r1s2", "r1s3", "r1s4", "r1s5", "r1s6", "r1s7", "r1s8", "r1s9", "r1s10", "r1s11", "r1s12", "r1s13", "r1s14"] }
    ]
  },
  "f1": {
    name: "Floor 1",
    hostPrefix: "f1",
    notes: "Layout based on provided text. Hostnames like f1rXsY",
    detailedLayout: [
      { rowLabel: "R13", seats: ["r13s1", "r13s2", "r13s3", "r13s4", "r13s5", "r13s6"] },
      { rowLabel: "R12", seats: ["r12s1", "r12s2", "r12s3", "r12s4", "r12s5", "r12s6", "r12s7", "r12s8", "r12s9", "r12s10", "r12s11", "r12s12", "r12s13", "r12s14", "r12s15", "r12s16", "r12s17", "r12s18", "r12s19", "r12s20", "r12s21", "r12s22", "r12s23"] },
      // Additional rows omitted for brevity
      { rowLabel: "R1", seats: ["r1s1", "r1s2", "r1s3", "r1s4", "r1s5", "r1s6", "r1s7", "r1s8", "r1s9", "r1s10", "r1s11", "r1s12", "r1s13", "r1s14"] }
    ]
  },
  // Additional floors omitted for brevity, but would include f1b, f2, f4, f6
}; 