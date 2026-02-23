export const DEFAULT_PORTFOLIO_CONTENT = {
  hero: {
    badge: "System Online",
    titlePrefix: "Architecting the",
    titleHighlight: "Future Web",
    description:
      "Hi, I'm Alex. A Full Stack Engineer building immersive digital experiences with clean code and cutting-edge 3D technologies.",
    primaryCtaLabel: "Explore Work",
    primaryCtaTarget: "#projects",
    secondaryCtaLabel: "Contact Me",
    secondaryCtaTarget: "#contact",
    techPills: ["React / Next.js", "Node.js APIs"],
  },
  about: {
    title: "Behind the Code",
    paragraphOne:
      "I am a software engineer with 5+ years of experience in building digital products. My journey began with a curiosity for how things work on the web, which quickly turned into a career passion.",
    paragraphTwo:
      "I specialize in React, Node.js, and cloud infrastructure. I love solving complex problems and learning new technologies. Beyond coding, I advocate for clean architecture and developer operations.",
    stats: [
      {
        label: "Experience",
        value: "05+",
        helper: "Years Experience",
      },
      {
        label: "Projects",
        value: "50+",
        helper: "Projects Completed",
      },
    ],
  },
  skills: [
    {
      title: "Frontend",
      accent: "#00dcff",
      rows: [
        { label: "React / Next.js", level: 95 },
        { label: "TypeScript", level: 90 },
        { label: "Tailwind CSS", level: 98 },
      ],
    },
    {
      title: "Backend",
      accent: "#7d4dff",
      rows: [
        { label: "Node.js", level: 90 },
        { label: "Python / Django", level: 80 },
        { label: "PostgreSQL", level: 85 },
      ],
    },
    {
      title: "Tools & DevOps",
      accent: "#12df95",
      rows: [
        { label: "Git & GitHub", level: 100 },
        { label: "Docker", level: 100 },
        { label: "AWS", level: 100 },
        { label: "CI/CD Pipelines", level: 100 },
        { label: "Linux", level: 100 },
        { label: "Figma", level: 100 },
      ],
    },
  ],
  projects: [
    {
      title: "FinTech Dashboard",
      description:
        "A comprehensive financial analytics dashboard featuring real-time data visualization and secure transaction management.",
      image: "/assets/project-shot-1.png",
      githubUrl: "https://github.com/alex-dev/fintech-dashboard",
      liveDemoUrl: "https://fintech-dashboard-demo.vercel.app",
      tags: ["React", "D3.js", "Node.js"],
    },
    {
      title: "E-Commerce Platform",
      description:
        "Full-stack e-commerce solution with Stripe integration, inventory management, and admin panel.",
      image: "/assets/project-shot-2.png",
      githubUrl: "https://github.com/alex-dev/ecommerce-platform",
      liveDemoUrl: "https://ecommerce-platform-demo.vercel.app",
      tags: ["Next.js", "Stripe", "PostgreSQL"],
    },
    {
      title: "Social Connect App",
      description:
        "Real-time chat application with group messaging, media sharing, and user presence features.",
      image: "/assets/project-shot-3.png",
      githubUrl: "https://github.com/alex-dev/social-connect",
      liveDemoUrl: "https://social-connect-demo.vercel.app",
      tags: ["React Native", "Socket.io", "Firebase"],
    },
  ],
  experience: [
    {
      role: "Senior Frontend Engineer",
      company: "TechFlow Systems",
      period: "2022 - PRESENT",
      points: [
        "Leading the frontend team in re-architecting the core product using Next.js. Improved site performance by 40% and established a comprehensive design system.",
      ],
    },
    {
      role: "Full Stack Developer",
      company: "Creative Solutions Agency",
      period: "2020 - 2022",
      points: [
        "Developed and maintained multiple client websites using React and Node.js. Integrated headless CMS solutions and optimized SEO strategies.",
      ],
    },
    {
      role: "Junior Web Developer",
      company: "StartUp Inc.",
      period: "2018 - 2020",
      points: [
        "Collaborated with senior developers to build responsive UI components. Assisted in backend API development and database management using PostgreSQL.",
      ],
    },
  ],
  contributions: [2, 5, 7, 4, 6, 10, 9, 11, 6, 7, 12, 10, 8, 11, 13, 9],
};

export const CONTENT_KEYS = Object.keys(DEFAULT_PORTFOLIO_CONTENT);
