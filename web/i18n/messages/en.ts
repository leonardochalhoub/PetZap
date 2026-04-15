export type SpendingCategoryKey =
  | "food" | "vet" | "toys" | "grooming" | "medicine" | "accessories" | "hygiene" | "other";

export type Messages = {
  brand: string;
  locale: { switchToEnglish: string; switchToPortuguese: string };
  theme: { toggle: string; light: string; dark: string };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  features: {
    heading: string;
    multiPet: { title: string; desc: string };
    vaccines: { title: string; desc: string };
    spending: { title: string; desc: string };
    whatsapp: { title: string; desc: string };
    private: { title: string; desc: string };
    free: { title: string; desc: string };
  };
  closing: { title: string; subtitle: string; cta: string };
  footer: { copy: string };
  nav: {
    dashboard: string;
    pets: string;
    whatsapp: string;
    signOut: string;
    signIn: string;
    signUp: string;
    getStarted: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    signupTitle: string;
    signupSubtitle: string;
    email: string;
    password: string;
    passwordHint: string;
    submitLogin: string;
    submitLoginPending: string;
    submitSignup: string;
    submitSignupPending: string;
    haveAccount: string;
    noAccount: string;
    signInLink: string;
    signUpLink: string;
  };
  dashboard: {
    title: string;
    addPet: string;
    addSpending: string;
    statsPets: string;
    statsUpcoming: string;
    statsRecent: string;
    viewAll: string;
    upcomingHeading: string;
    upcomingEmptyTitle: string;
    upcomingEmptyDesc: string;
    recentHeading: string;
    recentEmptyTitle: string;
    recentEmptyDesc: string;
    due: string;
    view: string;
    chartHeading: string;
    chartSubtitle: string;
    chartEmpty: string;
    weightChartHeading: string;
    weightChartSubtitle: string;
    weightChartEmpty: string;
    clearFilter: string;
    filterHint: string;
    open: string;
    monthsShort: [string, string, string, string, string, string, string, string, string, string, string, string];
  };
  pets: {
    listTitle: string;
    add: string;
    emptyTitle: string;
    emptyDesc: string;
    back: string;
    photoZoom: string;
    photoZoomReset: string;
    photoOptional: string;
    newTitle: string;
    name: string;
    species: string;
    breed: string;
    breedPickFromList: string;
    birthdate: string;
    create: string;
    creating: string;
    born: string;
    delete: string;
    deleting: string;
    deleteConfirm: string;
    photo: string;
    uploadPhoto: string;
    changePhoto: string;
    removePhoto: string;
    photoHint: string;
    uploadingPhoto: string;
    removingPhoto: string;
    removePhotoConfirm: string;
    sex: string;
    sexMale: string;
    sexFemale: string;
    sexUnknown: string;
    neutered: string;
    neuteredYes: string;
    neuteredNo: string;
    age: string;
    ageUnknown: string;
    yearsShort: string;
    monthsShort: string;
    summary: string;
    lifeExpectancy: string;
    lifeExpectancyHint: string;
    lifeExpectancyUnit: string;
    weight: string;
    weightKg: string;
    weightUnitShort: string;
    currentWeight: string;
    weightHistory: string;
    addWeight: string;
    addingWeight: string;
    weightDate: string;
    weightNotes: string;
    weightDeleteConfirm: string;
    weightEmpty: string;
    weightInitial: string;
    weightInitialHint: string;
  };
  vaccines: {
    heading: string;
    emptyInline: string;
    addHeading: string;
    name: string;
    givenDate: string;
    nextDate: string;
    nextDateAutoFillHint: string;
    notes: string;
    add: string;
    adding: string;
    given: string;
    next: string;
    deleteBtn: string;
    deleteConfirm: string;
  };
  spendings: {
    heading: string;
    emptyInline: string;
    addHeading: string;
    amount: string;
    category: string;
    date: string;
    description: string;
    add: string;
    adding: string;
    deleteBtn: string;
    deleteConfirm: string;
    dialogTitle: string;
    selectPets: string;
    splitHint: string;
    cancel: string;
    atLeastOnePet: string;
    splitInfo: string;
  };
  whatsapp: {
    title: string;
    subtitle: string;
    linkedPhone: string;
    verified: string;
    pending: string;
    notVerifiedYet: string;
    codeExpiresAt: string;
    prototypeHint: string;
    phoneLabel: string;
    phoneHint: string;
    sendCode: string;
    sending: string;
    otpGenerated: string;
    otpLabel: string;
    verify: string;
    verifying: string;
    unlink: string;
    unlinking: string;
    unlinkConfirm: string;
  };
  species: { dog: string; cat: string; bird: string; rabbit: string; other: string };
  speciesGendered: {
    dog: { male: string; female: string };
    cat: { male: string; female: string };
    bird: { male: string; female: string };
    rabbit: { male: string; female: string };
    other: { male: string; female: string };
  };
  spendingCategories: { [K in SpendingCategoryKey]: string };
  placeholders: {
    petName: string;
    breed: string;
    vaccineName: string;
    vaccineNotes: string;
    spendingAmount: string;
    spendingDescription: string;
    spendingDescriptionByCategory: { [K in SpendingCategoryKey]: string };
    weightKg: string;
    phone: string;
    otp: string;
  };
  meta: { title: string; description: string };
  errors: {
    noFileSelected: string;
    photoTooBig: string;
    photoMimeUnsupported: string;
    petNotFound: string;
  };
};

export const en: Messages = {
  brand: "PetZap",
  locale: { switchToEnglish: "Switch to English", switchToPortuguese: "Mudar para português" },
  theme: { toggle: "Toggle theme", light: "Light mode", dark: "Dark mode" },
  hero: {
    eyebrow: "Pet care, made effortless",
    title: "Track your pet's care, by tap or by text",
    subtitle:
      "Vaccines, spending, and reminders — manually or by texting our WhatsApp number.",
    ctaPrimary: "Get started free",
    ctaSecondary: "Sign in",
  },
  features: {
    heading: "Everything you need, nothing you don't",
    multiPet: { title: "Multiple pets", desc: "All your animals in one place." },
    vaccines: { title: "Vaccine reminders", desc: "Never miss a next-due date." },
    spending: { title: "Spending tracker", desc: "See where every real goes." },
    whatsapp: { title: "WhatsApp logging", desc: "Text us — we'll log it for you." },
    private: { title: "Private by default", desc: "Row-level security on every record." },
    free: { title: "Free for personal use", desc: "100% free at your scale." },
  },
  closing: {
    title: "Start tracking your pets today",
    subtitle: "Free. Private. Works by WhatsApp.",
    cta: "Create your account",
  },
  footer: { copy: "2026 PetZap" },
  nav: {
    dashboard: "Dashboard",
    pets: "Pets",
    whatsapp: "WhatsApp",
    signOut: "Sign out",
    signIn: "Sign in",
    signUp: "Sign up",
    getStarted: "Get started",
  },
  auth: {
    loginTitle: "Welcome back",
    loginSubtitle: "Sign in to your account",
    signupTitle: "Create your account",
    signupSubtitle: "Start tracking your pets in seconds",
    email: "Email",
    password: "Password",
    passwordHint: "At least 6 characters.",
    submitLogin: "Sign in",
    submitLoginPending: "Signing in...",
    submitSignup: "Create account",
    submitSignupPending: "Creating account...",
    haveAccount: "Already have an account?",
    noAccount: "Don't have an account?",
    signInLink: "Sign in",
    signUpLink: "Sign up",
  },
  dashboard: {
    title: "Dashboard",
    addPet: "Add pet",
    addSpending: "Add spending",
    statsPets: "Pets",
    statsUpcoming: "Upcoming vaccines (30d)",
    statsRecent: "Recent spendings",
    viewAll: "View all",
    upcomingHeading: "Upcoming vaccines",
    upcomingEmptyTitle: "No vaccines due in the next 30 days",
    upcomingEmptyDesc:
      "When you add vaccines with a next-due date, they'll show up here.",
    recentHeading: "Recent spendings",
    recentEmptyTitle: "No spendings yet",
    recentEmptyDesc: "Add a pet and record your first spending.",
    due: "due",
    view: "View",
    chartHeading: "Spending by month",
    chartSubtitle: "Last 24 months, stacked by category",
    chartEmpty: "No spending in the last 24 months yet.",
    weightChartHeading: "Weight over time",
    weightChartSubtitle: "All your pets — past entries can be added with the right date",
    weightChartEmpty: "No weights recorded yet. Add weights from each pet's page.",
    clearFilter: "Clear filter",
    filterHint: "Click pets to filter charts",
    open: "Open",
    monthsShort: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  },
  pets: {
    listTitle: "Your pets",
    add: "Add pet",
    emptyTitle: "No pets yet",
    emptyDesc: "Add your first pet to start tracking vaccines and spendings.",
    back: "Back to dashboard",
    photoZoom: "Zoom",
    photoZoomReset: "Reset",
    photoOptional: "Photo (optional)",
    newTitle: "Add a pet",
    name: "Name",
    species: "Species",
    breed: "Breed (optional)",
    breedPickFromList: "Pick from the list or type your own",
    birthdate: "Birth date (optional)",
    create: "Create pet",
    creating: "Saving...",
    born: "Born",
    delete: "Delete pet",
    deleting: "Deleting...",
    deleteConfirm: "Delete this pet and all its vaccines and spendings?",
    photo: "Photo",
    uploadPhoto: "Upload photo",
    changePhoto: "Change photo",
    removePhoto: "Remove photo",
    photoHint: "Max 5MB. JPG, PNG, WebP, GIF.",
    uploadingPhoto: "Uploading...",
    removingPhoto: "Removing...",
    removePhotoConfirm: "Remove this photo?",
    sex: "Sex",
    sexMale: "Male",
    sexFemale: "Female",
    sexUnknown: "Not specified",
    neutered: "Neutered",
    neuteredYes: "Neutered",
    neuteredNo: "Not neutered",
    age: "Age",
    ageUnknown: "Add a birth date to see age",
    yearsShort: "y",
    monthsShort: "mo",
    summary: "Summary",
    lifeExpectancy: "Life expectancy",
    lifeExpectancyHint: "Estimate from breed averages, sex, and neuter status.",
    lifeExpectancyUnit: "years",
    weight: "Weight",
    weightKg: "Weight (kg)",
    weightUnitShort: "kg",
    currentWeight: "Current weight",
    weightHistory: "Weight history",
    addWeight: "Add weight",
    addingWeight: "Saving...",
    weightDate: "Date",
    weightNotes: "Notes (optional)",
    weightDeleteConfirm: "Delete this weight record?",
    weightEmpty: "No weight recorded yet.",
    weightInitial: "Current weight (kg, optional)",
    weightInitialHint: "You can also add weights later to track changes over time.",
  },
  vaccines: {
    heading: "Vaccines",
    emptyInline: "No vaccines recorded yet.",
    addHeading: "Add vaccine",
    name: "Name",
    givenDate: "Given date",
    nextDate: "Next due (optional)",
    nextDateAutoFillHint: "Auto-set to 1 year after the given date — adjust if needed.",
    notes: "Notes (optional)",
    add: "Add vaccine",
    adding: "Saving...",
    given: "Given",
    next: "Next",
    deleteBtn: "Delete",
    deleteConfirm: "Delete this vaccine record?",
  },
  spendings: {
    heading: "Spendings",
    emptyInline: "No spendings recorded yet.",
    addHeading: "Add spending",
    amount: "Amount (BRL)",
    category: "Category",
    date: "Date",
    description: "Description (optional)",
    add: "Add spending",
    adding: "Saving...",
    deleteBtn: "Delete",
    deleteConfirm: "Delete this spending?",
    dialogTitle: "Add a spending",
    selectPets: "Pets to charge",
    splitHint: "Selecting more than one pet splits the amount equally.",
    cancel: "Cancel",
    atLeastOnePet: "Select at least one pet.",
    splitInfo: "Each pet:",
  },
  whatsapp: {
    title: "WhatsApp",
    subtitle: "Link your phone to log pets' vaccines and spendings by texting.",
    linkedPhone: "Linked phone",
    verified: "Verified",
    pending: "Pending verification",
    notVerifiedYet: "Not verified yet. Enter the 6-digit code to confirm.",
    codeExpiresAt: "Code expires at",
    prototypeHint: "(Prototype: the OTP is printed to the server console.)",
    phoneLabel: "Phone (E.164)",
    phoneHint: "Include country code, no spaces (e.g. +5511999998888).",
    sendCode: "Send code",
    sending: "Sending...",
    otpGenerated: "OTP generated — check the server console.",
    otpLabel: "6-digit code",
    verify: "Verify",
    verifying: "Verifying...",
    unlink: "Unlink phone",
    unlinking: "Unlinking...",
    unlinkConfirm: "Unlink this phone?",
  },
  species: {
    dog: "Dog",
    cat: "Cat",
    bird: "Bird",
    rabbit: "Rabbit",
    other: "Other",
  },
  speciesGendered: {
    dog:    { male: "Dog",    female: "Dog"    },
    cat:    { male: "Cat",    female: "Cat"    },
    bird:   { male: "Bird",   female: "Bird"   },
    rabbit: { male: "Rabbit", female: "Rabbit" },
    other:  { male: "Other",  female: "Other"  },
  },
  spendingCategories: {
    food: "Food",
    vet: "Vet",
    toys: "Toys",
    grooming: "Grooming",
    medicine: "Medicine",
    accessories: "Accessories",
    hygiene: "Hygiene products",
    other: "Other",
  },
  placeholders: {
    petName: "Rex",
    breed: "Golden Retriever",
    vaccineName: "Rabies",
    vaccineNotes: "Dose 2 of 3",
    spendingAmount: "45.00",
    spendingDescription: "Premium kibble 5kg",
    spendingDescriptionByCategory: {
      food: "Premium kibble 5kg",
      vet: "Routine checkup",
      toys: "Rope toy",
      grooming: "Bath and grooming",
      medicine: "Flea treatment",
      accessories: "New collar",
      hygiene: "Pee pad / litter sand",
      other: "Other expenses",
    },
    weightKg: "8.5",
    phone: "+5511999998888",
    otp: "123456",
  },
  meta: {
    title: "PetZap — Track pets, vaccines and spendings",
    description: "Manage your pets' vaccines and spendings from the web or by texting WhatsApp.",
  },
  errors: {
    noFileSelected: "Select a file.",
    photoTooBig: "Photo must be under 5MB.",
    photoMimeUnsupported: "Use JPG, PNG, WebP, or GIF.",
    petNotFound: "Pet not found.",
  },
};
