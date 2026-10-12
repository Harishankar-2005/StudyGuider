// SAMPLE syllabus used by the exam-plan generator.
// Clearly labelled demo data: replace with official syllabus records
// synced from Firebase later. The generator never invents topics —
// it only schedules the chapters listed here (or ones the student picks).

export const SAMPLE_EXAM = {
  id: "sample-jee-main",
  name: "JEE Main (Sample)",
  note: "Sample syllabus for local demo — not official NTA content.",
};

// minutes = estimated focused study time per chapter (single sitting baseline).
// weightage 1–5 steers priority when time is tight.
export const SAMPLE_SYLLABUS = [
  // Physics
  { id: "phy-kin", subject: "Physics", chapter: "Kinematics & Motion", minutes: 120, weightage: 4 },
  { id: "phy-nl", subject: "Physics", chapter: "Laws of Motion & Friction", minutes: 120, weightage: 4 },
  { id: "phy-work", subject: "Physics", chapter: "Work, Energy & Power", minutes: 90, weightage: 4 },
  { id: "phy-rot", subject: "Physics", chapter: "Rotational Mechanics", minutes: 150, weightage: 5 },
  { id: "phy-thermo", subject: "Physics", chapter: "Thermodynamics & KTG", minutes: 120, weightage: 4 },
  { id: "phy-optics", subject: "Physics", chapter: "Ray & Wave Optics", minutes: 150, weightage: 5 },
  { id: "phy-em", subject: "Physics", chapter: "Electromagnetism Basics", minutes: 150, weightage: 5 },
  { id: "phy-modern", subject: "Physics", chapter: "Modern Physics", minutes: 90, weightage: 3 },
  // Chemistry
  { id: "che-mole", subject: "Chemistry", chapter: "Mole Concept & Stoichiometry", minutes: 90, weightage: 4 },
  { id: "che-atomic", subject: "Chemistry", chapter: "Atomic Structure", minutes: 90, weightage: 3 },
  { id: "che-bond", subject: "Chemistry", chapter: "Chemical Bonding", minutes: 120, weightage: 5 },
  { id: "che-goc", subject: "Chemistry", chapter: "GOC & Reaction Mechanisms", minutes: 150, weightage: 5 },
  { id: "che-hydro", subject: "Chemistry", chapter: "Hydrocarbons", minutes: 120, weightage: 4 },
  { id: "che-equi", subject: "Chemistry", chapter: "Chemical & Ionic Equilibrium", minutes: 150, weightage: 5 },
  { id: "che-electro", subject: "Chemistry", chapter: "Electrochemistry", minutes: 120, weightage: 4 },
  { id: "che-coord", subject: "Chemistry", chapter: "Coordination Compounds", minutes: 90, weightage: 3 },
  // Mathematics
  { id: "mat-quad", subject: "Mathematics", chapter: "Quadratic Equations", minutes: 90, weightage: 3 },
  { id: "mat-pnc", subject: "Mathematics", chapter: "P&C and Probability", minutes: 150, weightage: 5 },
  { id: "mat-calcd", subject: "Mathematics", chapter: "Differentiation & Applications", minutes: 150, weightage: 5 },
  { id: "mat-calci", subject: "Mathematics", chapter: "Definite Integration & Area", minutes: 150, weightage: 5 },
  { id: "mat-vec", subject: "Mathematics", chapter: "Vectors & 3D Geometry", minutes: 120, weightage: 4 },
  { id: "mat-conic", subject: "Mathematics", chapter: "Conic Sections", minutes: 120, weightage: 4 },
  { id: "mat-trig", subject: "Mathematics", chapter: "Trigonometry & Identities", minutes: 90, weightage: 3 },
  { id: "mat-seq", subject: "Mathematics", chapter: "Sequences & Series", minutes: 90, weightage: 3 },
];

export const TASK_TYPES = {
  "chapter-study": "Chapter study",
  practice: "Topic practice",
  revision: "Revision",
  "chapter-mock": "Chapter test",
  "cumulative-mock": "Cumulative test",
  "full-mock": "Full mock",
  custom: "Custom",
};

export const isMockType = (type) => type === "chapter-mock" || type === "cumulative-mock" || type === "full-mock";
