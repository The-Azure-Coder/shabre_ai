export const demoUser = {
  name: "Tyrese Morgan",
  firstName: "Tyrese",
  role: "Student",
  avatarInitials: "TM",
};

export const navigationGroups = [
  {
    label: "Main",
    items: [
      ["Dashboard", "home", "/dashboard"],
      ["My Documents", "file-text", "/documents"],
      ["Reviews", "repeat", "/reviews"],
      ["Formatting Checker", "scan-text", "/formatting"],
    ],
  },
  {
    label: "AI Tools",
    items: [
      ["Writing Tools", "pencil", "/writing-tools"],
      ["AI Detector", "radar", "/ai-detector"],
      ["Humanizer", "sparkles", "/humanizer"],
    ],
  },
  {
    label: "Study Tools",
    items: [
      ["Summarizer", "notebook", "/summarizer"],
      ["Citation Generator", "quote", "/citations"],
      ["Utilities Hub", "grid", "/utilities"],
    ],
  },
  {
    label: "Account",
    items: [
      ["Profile", "user", "/profile"],
      ["Settings", "settings", "/settings"],
      ["Help & Support", "help-circle", "/help"],
    ],
  },
];

export const quickActions = [
  ["Review Assignment", "Get detailed feedback", "document", "purple", "/reviews"],
  ["Check Formatting", "APA, MLA and more", "format", "rose", "/formatting"],
  ["Evaluate with Rubric", "Score your work", "rubric", "green", "/rubrics"],
  ["Humanize Text", "Make it sound natural", "humanize", "indigo", "/humanizer"],
];

export const aiTools = [
  ["Assignment Review", "document", "purple", "/reviews"],
  ["Rubric Evaluation", "rubric", "amber", "/rubrics"],
  ["Formatting Checker", "format", "green", "/formatting"],
  ["Writing Tools", "pencil", "blue", "/writing-tools"],
  ["AI Detector", "radar", "indigo", "/ai-detector"],
  ["Humanizer", "sparkles", "rose", "/humanizer"],
  ["File Converter", "file", "green", "/utilities"],
  ["Citation Generator", "quote", "purple", "/citations"],
  ["Summarizer", "notebook", "blue", "/summarizer"],
];

export const stats = [
  ["Documents Reviewed", "15", "+45% this week", "document", "purple"],
  ["Reviews Completed", "12", "+33% this week", "shield", "green"],
  ["Average Score", "4.6/5", "Out of 5", "star", "amber"],
  ["AI Credits Left", "8,450", "84% of 10,000", "star", "blue"],
];

export const recentReviews = [
  ["Research Paper - Climate Change", "Reviewed", "May 24, 2024", "3.2 MB", "86%", "doc"],
  ["Marketing Strategy Analysis.pdf", "Reviewed", "May 22, 2024", "1.8 MB", "72%", "pdf"],
  ["Business Presentation.pptx", "Reviewed", "May 20, 2024", "5.4 MB", "91%", "ppt"],
  ["Literature Review Draft.docx", "Reviewed", "May 18, 2024", "2.1 MB", "65%", "doc"],
  ["Essay - Artificial Intelligence.txt", "Reviewed", "May 16, 2024", "924 KB", "78%", "txt"],
];

export const activities = [
  ["Review completed: Research Paper - Climate Change", "2 minutes ago", "pencil", "green"],
  ["Formatting check completed: Essay Draft.docx", "1 hour ago", "notebook", "blue"],
  ["Humanization completed: AI Content.txt", "3 hours ago", "sparkles", "rose"],
  ["Rubric evaluation completed: Group Project.pdf", "5 hours ago", "rubric", "amber"],
];

export const deadlines = [
  ["Research Paper Submission", "May 28, 2024", "2 days left", "rose"],
  ["Team Project Presentation", "Jun 02, 2024", "7 days left", "amber"],
  ["Literature Review", "Jun 05, 2024", "10 days left", "green"],
];
