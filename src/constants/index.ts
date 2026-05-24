export const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
] as const;

export const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/rudresh05", icon: "github" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/rudresh-patel-95a9b4284/", icon: "linkedin" },
  { label: "Twitter", href: "#", icon: "twitter" },
] as const;

export const PROJECTS = [
  {
    title: "AI Development",
    description: "Built advanced AI modules using modern frameworks.",
    tech: ["Python", "TensorFlow", "React"],
    link: "https://github.com/rudresh05/AI",
    imageUrl: "",
    featured: true,
  },
  {
    title: "Android Projects",
    description: "Developing seamless mobile experiences.",
    tech: ["Kotlin", "Jetpack Compose", "Firebase"],
    link: "https://github.com/rudresh05/Android",
    imageUrl: "",
    featured: true,
  },
  {
    title: "Portfolio Website",
    description: "Personal portfolio showcasing projects, skills and contact information.",
    tech: ["HTML", "CSS", "JavaScript"],
    link: "https://github.com/rudresh05/Portfolio",
    imageUrl: "",
    featured: false,
  },
  {
    title: "Farmer Merchant Integration",
    description: "Connected farmers and merchants for a more transparent and efficient supply chain.",
    tech: ["HTML", "CSS", "JavaScript"],
    link: "#",
    imageUrl: "",
    featured: false,
  },
  {
    title: "Solar System",
    description: "Interactive educational visualization of the solar system.",
    tech: ["HTML", "CSS", "JavaScript"],
    link: "https://github.com/akash9569/SunandMoon",
    imageUrl: "",
    featured: false,
  },
] as const;

export const HERO_SETTINGS = {
  imageUrl: "",
} as const;

export const SKILL_MARQUEE = [
  { name: "React", level: "Advanced", years: "2+ years" },
  { name: "Next.js", level: "Intermediate", years: "1+ years" },
  { name: "TypeScript", level: "Intermediate", years: "1+ years" },
  { name: "JavaScript", level: "Advanced", years: "2+ years" },
  { name: "Tailwind", level: "Intermediate", years: "1+ years" },
  { name: "Python", level: "Advanced", years: "2+ years" },
  { name: "TensorFlow", level: "Intermediate", years: "1+ years" },
  { name: "Kotlin", level: "Intermediate", years: "1+ years" },
  { name: "Firebase", level: "Intermediate", years: "1+ years" },
  { name: "MySQL", level: "Intermediate", years: "1+ years" },
] as const;

export const SKILL_GROUPS = {
  Frontend: [
    { name: "React", level: "Advanced", years: "2+ years" },
    { name: "Next.js", level: "Intermediate", years: "1+ years" },
    { name: "TypeScript", level: "Intermediate", years: "1+ years" },
    { name: "Tailwind CSS", level: "Intermediate", years: "1+ years" },
    { name: "HTML/CSS", level: "Advanced", years: "3+ years" },
  ],
  Backend: [
    { name: "Node.js", level: "Intermediate", years: "1+ years" },
    { name: "Firebase", level: "Intermediate", years: "1+ years" },
    { name: "MySQL", level: "Intermediate", years: "1+ years" },
    { name: "SQL", level: "Intermediate", years: "2+ years" },
    { name: "PHP", level: "Intermediate", years: "1+ years" },
  ],
  "AI/ML": [
    { name: "Python", level: "Advanced", years: "2+ years" },
    { name: "TensorFlow", level: "Intermediate", years: "1+ years" },
    { name: "Model Prototyping", level: "Intermediate", years: "1+ years" },
    { name: "Data Preprocessing", level: "Intermediate", years: "1+ years" },
  ],
} as const;

export const EXPERIENCES = [
  {
    title: "Ethical Hacking Trainee",
    company: "Internshala",
    dateRange: "2024",
    achievements: [
      "Completed practical modules on vulnerability assessment and secure coding.",
      "Built a stronger security mindset for full-stack application design.",
    ],
  },
  {
    title: "Java Development Trainee",
    company: "Softpro",
    dateRange: "2023 - 2024",
    achievements: [
      "Delivered Java-based assignments focused on OOP and problem-solving.",
      "Strengthened backend fundamentals and clean coding practices.",
    ],
  },
  {
    title: "Java + DSA Learner",
    company: "Apna College",
    dateRange: "2023 - Present",
    achievements: [
      "Practiced core data structures and algorithms to improve coding speed.",
      "Applied algorithmic thinking to optimize project features.",
    ],
  },
  {
    title: "Kotlin & Android Learner",
    company: "Udemy",
    dateRange: "2024 - Present",
    achievements: [
      "Built Android app modules with Kotlin and modern UI patterns.",
      "Integrated Firebase-ready architecture for scalable mobile projects.",
    ],
  },
] as const;

export const CONTACT_INFO = {
  email: "rudreshpatel504@gmail.com",
  message: "Open to internships, freelance collaboration, and high-impact product roles.",
} as const;

export const BLOG_POSTS = [
  {
    title: "Designing Premium Portfolio Motion",
    excerpt: "How I structure motion layers and interaction hierarchy for a premium UX.",
    content:
      "Motion works best when it supports the page hierarchy instead of competing with it. I use small transitions for feedback, slower reveal timing for sections, and restraint around hover effects so the interface feels alive without becoming noisy.",
    date: "2026-05-01",
    readTime: "4 min read",
  },
  {
    title: "From Static Portfolio to Dynamic System",
    excerpt: "A practical migration path from hardcoded sections to UI-managed content.",
    content:
      "A portfolio becomes easier to maintain when the content layer is separated from the UI. Projects, blog posts, skills, and contact details can live in a small content store while the frontend focuses on presentation, validation, and a smooth editing experience.",
    date: "2026-05-10",
    readTime: "6 min read",
  },
] as const;
