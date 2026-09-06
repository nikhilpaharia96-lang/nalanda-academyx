// `isOpen` mirrors a future admissions-status flag from the backend.
// Kept false by default so the site never claims "Admissions Open" without
// official confirmation.
export const admissionStatus = {
  isOpen: false,
  session: "2027",
};

export const admissionProcess = [
  { step: "01", title: "Explore", body: "Learn about Nalanda Academy's programmes, facilities and campus life." },
  { step: "02", title: "Apply", body: "Submit the admission enquiry form with student and guardian details." },
  { step: "03", title: "Submit Documents", body: "Provide the required documents for verification." },
  { step: "04", title: "Verification", body: "The admissions office reviews and verifies the application." },
  { step: "05", title: "Admission", body: "Confirmed applicants complete enrolment for the academic session." },
];

export const availableClasses = "[Official list of classes to be added]";

export const eligibility = "[Official eligibility criteria to be added]";

export const requiredDocuments = [
  "[Document requirement to be added]",
  "[Document requirement to be added]",
  "[Document requirement to be added]",
];

export const importantDates = [
  { label: "Application window opens", value: "[Date to be added]" },
  { label: "Application window closes", value: "[Date to be added]" },
  { label: "Verification period", value: "[Date to be added]" },
];

export const admissionFaqs = [
  {
    question: "When does the admission process begin?",
    answer: "[Official admissions timeline to be added]",
  },
  {
    question: "What documents are required?",
    answer: "[Official document checklist to be added]",
  },
  {
    question: "Who can I contact for admission queries?",
    answer: "Use the contact form on this site or the phone/email listed on the Contact page.",
  },
];
