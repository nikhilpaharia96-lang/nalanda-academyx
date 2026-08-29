export const academicExcellence = {
  eyebrow: "Academic Excellence",
  heading: "A curriculum built for depth, not just coverage.",
  pillars: [
    {
      title: "Strong Foundations",
      body: "A structured core curriculum that builds fundamentals in language, mathematics and the sciences from an early stage.",
    },
    {
      title: "Focused Learning",
      body: "Smaller class engagement and regular assessment keep learning targeted to each student's progress.",
    },
    {
      title: "Student Development",
      body: "Academics paired with discipline, sport and the arts to support well-rounded growth.",
    },
    {
      title: "Future Readiness",
      body: "Preparation for board examinations and the habits students need for the years beyond school.",
    },
  ],
};

export const academicExperience = [
  { title: "Learn", body: "Core subject instruction across the academic year." },
  { title: "Discover", body: "Guided exploration through labs, library and project work." },
  { title: "Create", body: "Assignments and activities that put learning into practice." },
  { title: "Compete", body: "Inter-house and inter-school academic and co-curricular events." },
  { title: "Grow", body: "Continuous mentorship from teachers and school leadership." },
];

// ---------------------------------------------------------------------------
// Homepage "Academics" editorial section — kept separate from
// `academicExcellence` above (which also powers /academics) so that page is
// unaffected by this section's copy. All programme/approach copy below is
// supplied content describing Nalanda Academy's academic offering; update
// here if the underlying programmes change.
// ---------------------------------------------------------------------------

export const academicsHero = {
  heading: "Academics",
  subheading: "Where Learning Meets Possibility",
  description:
    "At Nalanda Academy, academics go beyond textbooks. We empower students with deep understanding, critical thinking, and real-world skills to help them excel at every stage of life.",
  imageLabel: "Classroom / student learning placeholder — replace with official imagery",
  highlights: [
    {
      icon: "graduation-cap" as const,
      title: "Concept-Driven Learning",
      body: "Understanding over rote memorization.",
    },
    {
      icon: "lightbulb" as const,
      title: "Future-Ready Skills",
      body: "Critical thinking, creativity & innovation.",
    },
    {
      icon: "target" as const,
      title: "Academic Excellence",
      body: "Guided preparation for a brighter future.",
    },
  ],
};

export const academicPrograms = [
  {
    number: "01",
    icon: "book-open" as const,
    title: "School Program",
    tagline: "Foundations for Lifelong Learning",
    description:
      "A strong academic foundation for students with focus on concepts, values and curiosity.",
    grades: "Grades: I – X",
  },
  {
    number: "02",
    icon: "user-round" as const,
    title: "Senior Secondary",
    tagline: "Prepare. Perform. Progress.",
    description:
      "Science, Commerce and Humanities streams designed to prepare students for higher education and beyond.",
    grades: "Grades: XI – XII",
  },
  {
    number: "03",
    icon: "graduation-cap" as const,
    title: "Competitive Preparation",
    tagline: "Aim Higher. Achieve More.",
    description:
      "Specialized guidance for competitive examinations and entrance preparation.",
    grades: "Grades: XI – XII & Passouts",
  },
  {
    number: "04",
    icon: "laptop" as const,
    title: "Skill & Personal Development",
    tagline: "Beyond Books, For Life.",
    description:
      "Programs that build communication, leadership, technology and life skills.",
    grades: "All Grades",
  },
];

export const learningApproach = {
  heading: "Our Learning Approach",
  imageLabel: "Teacher and students in discussion — placeholder, replace with official imagery",
  items: [
    {
      icon: "users" as const,
      title: "Student-Centered Learning",
      body: "Personalized attention for every learner.",
    },
    {
      icon: "book-marked" as const,
      title: "Interactive Classrooms",
      body: "Engaging lessons and real-world connections.",
    },
    {
      icon: "flask-conical" as const,
      title: "Practical Exposure",
      body: "Labs, projects and activities that build understanding.",
    },
    {
      icon: "trending-up" as const,
      title: "Continuous Assessment",
      body: "Regular feedback to track and improve.",
    },
  ],
};

export const academicSupport = {
  heading: "Academic Support",
  items: [
    {
      icon: "user-check" as const,
      title: "Experienced Faculty",
      body: "Mentors who inspire and guide.",
    },
    {
      icon: "library-big" as const,
      title: "Study Resources",
      body: "Well-equipped learning and digital resources.",
    },
    {
      icon: "clipboard-list" as const,
      title: "Remedial & Enrichment",
      body: "Extra support to help every student succeed.",
    },
    {
      icon: "handshake" as const,
      title: "Parent Collaboration",
      body: "Together, we support every child's journey.",
    },
  ],
};

// No verified enrolment/faculty/subject/results figures have been supplied
// yet — placeholders are shown instead of invented numbers. Replace `value`
// once the school confirms official figures.
export const academicStats = {
  quote: {
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
  },
  stats: [
    { icon: "graduation-cap" as const, value: "—", label: "Students" },
    { icon: "user-check" as const, value: "—", label: "Faculty" },
    { icon: "book-open" as const, value: "—", label: "Subjects Offered" },
    { icon: "trophy" as const, value: "—", label: "Success Rate" },
  ],
  tagline: ["Knowledge Today.", "Leadership Tomorrow."],
  subline: "A Better World Always.",
};

export const programmes = [
  {
    stage: "Primary",
    classes: "Classes I – V",
    description: "Demo copy — foundational programme details to be confirmed by the school.",
  },
  {
    stage: "Middle",
    classes: "Classes VI – VIII",
    description: "Demo copy — middle-school programme details to be confirmed by the school.",
  },
  {
    stage: "Secondary",
    classes: "Classes IX – X",
    description: "Demo copy — secondary / HSLC-preparatory programme details to be confirmed by the school.",
  },
];
