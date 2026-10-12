// Demo dataset for the premium milestone.
// Everything here is local sample data, clearly labelled in the UI.
// Firebase + real AI will replace this file later.

export const student = {
  name: "Aarav Sharma",
  firstName: "Aarav",
  grade: "Class 12 · Science",
  goal: "JEE 2027 · Target IIT Bombay CSE",
  streakDays: 12,
  studyHoursThisWeek: 18.5,
  tasksCompleted: 24,
  tasksTotal: 32,
  averageScore: 82,
};

export const weeklyStudy = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3.0 },
  { day: "Wed", hours: 1.5 },
  { day: "Thu", hours: 3.5 },
  { day: "Fri", hours: 2.0 },
  { day: "Sat", hours: 4.0 },
  { day: "Sun", hours: 2.0 },
];

export const upcomingTasks = [
  {
    id: 1,
    title: "Physics: Rotational Mechanics Ch. 7",
    subject: "Physics",
    due: "Today · 5:00 PM",
    duration: "90 min",
    priority: "High",
  },
  {
    id: 2,
    title: "Maths: Definite Integration practice set",
    subject: "Maths",
    due: "Tomorrow · 11:00 AM",
    duration: "60 min",
    priority: "Medium",
  },
  {
    id: 3,
    title: "Chemistry: Organic mechanisms revision",
    subject: "Chemistry",
    due: "Wed · 4:00 PM",
    duration: "45 min",
    priority: "Medium",
  },
  {
    id: 4,
    title: "Mock test: JEE Paper 1 (3 hrs)",
    subject: "Mock Test",
    due: "Sat · 9:00 AM",
    duration: "180 min",
    priority: "High",
  },
];

export const subjectProgress = [
  { subject: "Physics", percent: 72, detail: "18 / 25 chapters" },
  { subject: "Chemistry", percent: 64, detail: "16 / 25 chapters" },
  { subject: "Mathematics", percent: 58, detail: "14 / 24 chapters" },
  { subject: "Mock Tests", percent: 80, detail: "8 / 10 tests" },
];

export const quickStats = [
  { label: "Studied this week", value: 18.5, suffix: " hrs", decimals: 1, hint: "+2.5 hrs vs last week" },
  { label: "Tasks completed", value: 75, suffix: "%", decimals: 0, hint: "24 of 32 tasks" },
  { label: "Day streak", value: 12, suffix: " days", decimals: 0, hint: "Personal best!" },
  { label: "Average score", value: 82, suffix: "%", decimals: 0, hint: "Last 5 mock tests" },
];

export const dailyGoal = {
  targetMinutes: 150,
  doneMinutes: 96,
  label: "Today's focus: Physics + 1 mock set",
};

export const achievements = [
  { id: "streak-7", title: "7-day streak", detail: "A full week of consistency", unlocked: true, icon: "🔥" },
  { id: "early-bird", title: "Early bird", detail: "5 morning sessions", unlocked: true, icon: "🌅" },
  { id: "mock-80", title: "80+ scorer", detail: "Mock average above 80", unlocked: true, icon: "🎯" },
  { id: "marathon", title: "Marathon", detail: "Study 25 hrs in a week", unlocked: false, icon: "🏁" },
];

// Static career catalogue for the guided Career quiz (demo, not AI).
export const careers = [
  {
    id: "swe",
    title: "Software Engineer",
    tags: ["building", "logic", "computers"],
    strengths: ["Maths", "Computers"],
    description: "Design apps, systems and AI products used by millions.",
    skills: ["Programming", "Problem solving", "System design"],
    outlook: "Very high demand · remote friendly",
    matchHint: "Great fit if you enjoy Maths + building things.",
  },
  {
    id: "doctor",
    title: "Doctor",
    tags: ["helping", "biology", "people"],
    strengths: ["Biology", "Chemistry"],
    description: "Diagnose, treat and care for patients across specialities.",
    skills: ["Biology", "Empathy", "Long-term study"],
    outlook: "Stable demand · long training path",
    matchHint: "Great fit if you love Biology + helping people.",
  },
  {
    id: "designer",
    title: "Product Designer",
    tags: ["design", "creativity", "people"],
    strengths: ["Art", "Psychology"],
    description: "Shape how apps feel — research, UX flows and visuals.",
    skills: ["Visual design", "User research", "Prototyping"],
    outlook: "High demand in tech + startups",
    matchHint: "Great fit if you enjoy art + understanding people.",
  },
  {
    id: "data",
    title: "Data Scientist",
    tags: ["numbers", "logic", "business"],
    strengths: ["Maths", "Computers"],
    description: "Turn data into decisions with statistics and ML models.",
    skills: ["Statistics", "Python", "Storytelling with data"],
    outlook: "High demand across industries",
    matchHint: "Great fit if you enjoy numbers + logical puzzles.",
  },
  {
    id: "civil",
    title: "Civil Servant",
    tags: ["society", "helping", "leadership"],
    strengths: ["Social Science", "Writing"],
    description: "Lead public policy and administration at scale.",
    skills: ["General knowledge", "Writing", "Leadership"],
    outlook: "Prestigious · competitive exams",
    matchHint: "Great fit if you care about society + leadership.",
  },
  {
    id: "mech",
    title: "Mechanical Engineer",
    tags: ["building", "physics", "machines"],
    strengths: ["Physics", "Maths"],
    description: "Build machines, vehicles, robotics and energy systems.",
    skills: ["Physics", "CAD", "Hands-on building"],
    outlook: "Strong in manufacturing + robotics",
    matchHint: "Great fit if you enjoy Physics + machines.",
  },
];

// Static college catalogue for the guided finder (demo, not live data).
export const colleges = [
  { id: 1, name: "IIT Bombay", city: "Mumbai", course: "CSE", fees: "₹2.2L / yr", cutoff: "JEE Adv ~Top 500", rating: 4.9, tag: "Dream" },
  { id: 2, name: "IIT Delhi", city: "Delhi", course: "CSE", fees: "₹2.3L / yr", cutoff: "JEE Adv ~Top 800", rating: 4.8, tag: "Dream" },
  { id: 3, name: "NIT Trichy", city: "Tiruchirappalli", course: "CSE", fees: "₹1.6L / yr", cutoff: "JEE Main 99+ %ile", rating: 4.6, tag: "Reach" },
  { id: 4, name: "BITS Pilani", city: "Pilani", course: "CSE", fees: "₹5.4L / yr", cutoff: "BITSAT 320+", rating: 4.7, tag: "Reach" },
  { id: 5, name: "VIT Vellore", city: "Vellore", course: "CSE", fees: "₹2.0L / yr", cutoff: "VITEEE Rank < 8k", rating: 4.3, tag: "Safe" },
  { id: 6, name: "State Govt. College", city: "Pune", course: "IT", fees: "₹85k / yr", cutoff: "MHT-CET 97+ %ile", rating: 4.1, tag: "Safe" },
];

export const tutorSuggestions = [
  "How do I plan 2 hours of Physics today?",
  "Explain integration by parts simply",
  "How are cutoffs different for IIT vs NIT?",
  "Give me a 5-step revision routine",
];
