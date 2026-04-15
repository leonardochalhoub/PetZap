/**
 * Curated breed list for PetZap.
 * - Names in EN + pt-BR
 * - Life span (years) sourced from breed averages:
 *   dogs (AKC), cats (CFA/Vetstreet), rabbits (House Rabbit Society), birds (varies)
 * - Use `getBreedsForSpecies(species)` to filter
 * - Use `lookupBreed(speciesId, name, locale)` to find a breed by user-typed name
 * - Use `estimateLifespan(species, breedName, sex, neutered)` for the headline range
 */

export type Species = "dog" | "cat" | "bird" | "rabbit" | "other";

export type Breed = {
  id: string;
  species: Species;
  names: { en: string; pt: string };
  /** Typical life span in years (min, max), pre-adjustment. */
  lifeSpan: { min: number; max: number };
};

const DOGS: Breed[] = [
  { id: "mixed-dog",      species: "dog", names: { en: "Mixed breed",          pt: "Vira-lata (SRD)" },        lifeSpan: { min: 12, max: 16 } },
  { id: "labrador",       species: "dog", names: { en: "Labrador Retriever",   pt: "Labrador" },               lifeSpan: { min: 10, max: 12 } },
  { id: "golden",         species: "dog", names: { en: "Golden Retriever",     pt: "Golden Retriever" },       lifeSpan: { min: 10, max: 12 } },
  { id: "poodle-toy",     species: "dog", names: { en: "Toy Poodle",           pt: "Poodle Toy" },             lifeSpan: { min: 12, max: 15 } },
  { id: "poodle-mini",    species: "dog", names: { en: "Miniature Poodle",     pt: "Poodle Miniatura" },       lifeSpan: { min: 12, max: 15 } },
  { id: "poodle-std",     species: "dog", names: { en: "Standard Poodle",      pt: "Poodle Standard" },        lifeSpan: { min: 10, max: 13 } },
  { id: "shihtzu",        species: "dog", names: { en: "Shih Tzu",             pt: "Shih Tzu" },               lifeSpan: { min: 10, max: 16 } },
  { id: "yorkshire",      species: "dog", names: { en: "Yorkshire Terrier",    pt: "Yorkshire" },              lifeSpan: { min: 11, max: 15 } },
  { id: "maltese",        species: "dog", names: { en: "Maltese",              pt: "Maltês" },                 lifeSpan: { min: 12, max: 15 } },
  { id: "pug",            species: "dog", names: { en: "Pug",                  pt: "Pug" },                    lifeSpan: { min: 12, max: 15 } },
  { id: "frenchie",       species: "dog", names: { en: "French Bulldog",       pt: "Bulldog Francês" },        lifeSpan: { min: 10, max: 12 } },
  { id: "english-bull",   species: "dog", names: { en: "English Bulldog",      pt: "Bulldog Inglês" },         lifeSpan: { min: 8,  max: 10 } },
  { id: "pinscher",       species: "dog", names: { en: "Miniature Pinscher",   pt: "Pinscher" },               lifeSpan: { min: 12, max: 16 } },
  { id: "schnauzer-mini", species: "dog", names: { en: "Miniature Schnauzer",  pt: "Schnauzer Miniatura" },    lifeSpan: { min: 12, max: 15 } },
  { id: "lhasa",          species: "dog", names: { en: "Lhasa Apso",           pt: "Lhasa Apso" },             lifeSpan: { min: 12, max: 15 } },
  { id: "border-collie",  species: "dog", names: { en: "Border Collie",        pt: "Border Collie" },          lifeSpan: { min: 12, max: 15 } },
  { id: "german-shep",    species: "dog", names: { en: "German Shepherd",      pt: "Pastor Alemão" },          lifeSpan: { min: 9,  max: 13 } },
  { id: "rottweiler",     species: "dog", names: { en: "Rottweiler",           pt: "Rottweiler" },             lifeSpan: { min: 9,  max: 10 } },
  { id: "doberman",       species: "dog", names: { en: "Doberman Pinscher",    pt: "Doberman" },               lifeSpan: { min: 10, max: 12 } },
  { id: "husky",          species: "dog", names: { en: "Siberian Husky",       pt: "Husky Siberiano" },        lifeSpan: { min: 12, max: 14 } },
  { id: "akita",          species: "dog", names: { en: "Akita",                pt: "Akita" },                  lifeSpan: { min: 10, max: 14 } },
  { id: "dalmatian",      species: "dog", names: { en: "Dalmatian",            pt: "Dálmata" },                lifeSpan: { min: 11, max: 13 } },
  { id: "beagle",         species: "dog", names: { en: "Beagle",               pt: "Beagle" },                 lifeSpan: { min: 12, max: 15 } },
  { id: "bichon-frise",   species: "dog", names: { en: "Bichon Frise",         pt: "Bichon Frisé" },           lifeSpan: { min: 14, max: 15 } },
  { id: "cocker",         species: "dog", names: { en: "Cocker Spaniel",       pt: "Cocker Spaniel" },         lifeSpan: { min: 10, max: 14 } },
  { id: "boxer",          species: "dog", names: { en: "Boxer",                pt: "Boxer" },                  lifeSpan: { min: 10, max: 12 } },
  { id: "pitbull",        species: "dog", names: { en: "American Pit Bull",    pt: "Pit Bull" },               lifeSpan: { min: 12, max: 16 } },
  { id: "amstaff",        species: "dog", names: { en: "Amer. Staffordshire",  pt: "American Staffordshire" }, lifeSpan: { min: 12, max: 16 } },
  { id: "chowchow",       species: "dog", names: { en: "Chow Chow",            pt: "Chow Chow" },              lifeSpan: { min: 8,  max: 12 } },
  { id: "jack-russell",   species: "dog", names: { en: "Jack Russell Terrier", pt: "Jack Russell" },           lifeSpan: { min: 13, max: 16 } },
  { id: "cavalier",       species: "dog", names: { en: "Cavalier King Charles",pt: "Cavalier King Charles" },  lifeSpan: { min: 9,  max: 14 } },
  { id: "boston",         species: "dog", names: { en: "Boston Terrier",       pt: "Boston Terrier" },         lifeSpan: { min: 11, max: 13 } },
  { id: "spitz",          species: "dog", names: { en: "Pomeranian",           pt: "Spitz Alemão (Lulu)" },    lifeSpan: { min: 12, max: 16 } },
  { id: "chihuahua",      species: "dog", names: { en: "Chihuahua",            pt: "Chihuahua" },              lifeSpan: { min: 14, max: 16 } },
  { id: "westie",         species: "dog", names: { en: "West Highland White",  pt: "West Highland White" },    lifeSpan: { min: 12, max: 16 } },
  { id: "cane-corso",     species: "dog", names: { en: "Cane Corso",           pt: "Cane Corso" },             lifeSpan: { min: 9,  max: 12 } },
  { id: "saint-bernard",  species: "dog", names: { en: "Saint Bernard",        pt: "São Bernardo" },           lifeSpan: { min: 8,  max: 10 } },
  { id: "mastiff",        species: "dog", names: { en: "Mastiff",              pt: "Mastim" },                 lifeSpan: { min: 6,  max: 10 } },
  { id: "weimaraner",     species: "dog", names: { en: "Weimaraner",           pt: "Weimaraner" },             lifeSpan: { min: 10, max: 13 } },
  { id: "bull-terrier",   species: "dog", names: { en: "Bull Terrier",         pt: "Bull Terrier" },           lifeSpan: { min: 12, max: 13 } },
  { id: "pekingese",      species: "dog", names: { en: "Pekingese",            pt: "Pequinês" },               lifeSpan: { min: 12, max: 14 } },
  { id: "shar-pei",       species: "dog", names: { en: "Shar Pei",             pt: "Shar Pei" },               lifeSpan: { min: 8,  max: 12 } },
  { id: "basset",         species: "dog", names: { en: "Basset Hound",         pt: "Basset Hound" },           lifeSpan: { min: 12, max: 13 } },
  { id: "shiba-inu",      species: "dog", names: { en: "Shiba Inu",            pt: "Shiba Inu" },              lifeSpan: { min: 13, max: 16 } },
  { id: "samoyed",        species: "dog", names: { en: "Samoyed",              pt: "Samoieda" },               lifeSpan: { min: 12, max: 14 } },
  { id: "australian-shep",species: "dog", names: { en: "Australian Shepherd",  pt: "Pastor Australiano" },     lifeSpan: { min: 13, max: 15 } },
  { id: "great-dane",     species: "dog", names: { en: "Great Dane",           pt: "Dogue Alemão" },           lifeSpan: { min: 7,  max: 10 } },
  { id: "fila",           species: "dog", names: { en: "Fila Brasileiro",      pt: "Fila Brasileiro" },        lifeSpan: { min: 9,  max: 11 } },
  { id: "other-dog",      species: "dog", names: { en: "Other",                pt: "Outra" },                  lifeSpan: { min: 10, max: 14 } },
];

const CATS: Breed[] = [
  { id: "mixed-cat",      species: "cat", names: { en: "Mixed breed (SRD)",    pt: "Vira-lata (SRD)" },        lifeSpan: { min: 13, max: 17 } },
  { id: "siamese",        species: "cat", names: { en: "Siamese",              pt: "Siamês" },                 lifeSpan: { min: 12, max: 20 } },
  { id: "persian",        species: "cat", names: { en: "Persian",              pt: "Persa" },                  lifeSpan: { min: 12, max: 17 } },
  { id: "maine-coon",     species: "cat", names: { en: "Maine Coon",           pt: "Maine Coon" },             lifeSpan: { min: 12, max: 15 } },
  { id: "ragdoll",        species: "cat", names: { en: "Ragdoll",              pt: "Ragdoll" },                lifeSpan: { min: 12, max: 17 } },
  { id: "sphynx",         species: "cat", names: { en: "Sphynx",               pt: "Sphynx" },                 lifeSpan: { min: 9,  max: 15 } },
  { id: "bengal",         species: "cat", names: { en: "Bengal",               pt: "Bengal" },                 lifeSpan: { min: 12, max: 16 } },
  { id: "british-short",  species: "cat", names: { en: "British Shorthair",    pt: "British Shorthair" },      lifeSpan: { min: 14, max: 20 } },
  { id: "scottish-fold",  species: "cat", names: { en: "Scottish Fold",        pt: "Scottish Fold" },          lifeSpan: { min: 11, max: 14 } },
  { id: "munchkin",       species: "cat", names: { en: "Munchkin",             pt: "Munchkin" },               lifeSpan: { min: 12, max: 14 } },
  { id: "norwegian",      species: "cat", names: { en: "Norwegian Forest",     pt: "Norueguês da Floresta" },  lifeSpan: { min: 14, max: 16 } },
  { id: "russian-blue",   species: "cat", names: { en: "Russian Blue",         pt: "Azul Russo" },             lifeSpan: { min: 15, max: 20 } },
  { id: "burmese",        species: "cat", names: { en: "Burmese",              pt: "Burmês" },                 lifeSpan: { min: 16, max: 18 } },
  { id: "birman",         species: "cat", names: { en: "Birman",               pt: "Birmanês (Sagrado)" },     lifeSpan: { min: 12, max: 16 } },
  { id: "abyssinian",     species: "cat", names: { en: "Abyssinian",           pt: "Abissínio" },              lifeSpan: { min: 9,  max: 15 } },
  { id: "exotic",         species: "cat", names: { en: "Exotic Shorthair",     pt: "Exótico de Pelo Curto" },  lifeSpan: { min: 12, max: 15 } },
  { id: "oriental",       species: "cat", names: { en: "Oriental Shorthair",   pt: "Oriental de Pelo Curto" }, lifeSpan: { min: 12, max: 15 } },
  { id: "devon-rex",      species: "cat", names: { en: "Devon Rex",            pt: "Devon Rex" },              lifeSpan: { min: 9,  max: 15 } },
  { id: "cornish-rex",    species: "cat", names: { en: "Cornish Rex",          pt: "Cornish Rex" },            lifeSpan: { min: 11, max: 15 } },
  { id: "turkish-angora", species: "cat", names: { en: "Turkish Angora",       pt: "Angorá Turco" },           lifeSpan: { min: 12, max: 18 } },
  { id: "savannah",       species: "cat", names: { en: "Savannah",             pt: "Savannah" },               lifeSpan: { min: 12, max: 20 } },
  { id: "american-short", species: "cat", names: { en: "American Shorthair",   pt: "American Shorthair" },     lifeSpan: { min: 15, max: 20 } },
  { id: "other-cat",      species: "cat", names: { en: "Other",                pt: "Outra" },                  lifeSpan: { min: 12, max: 16 } },
];

const RABBITS: Breed[] = [
  { id: "mixed-rabbit",   species: "rabbit", names: { en: "Mixed breed",       pt: "SRD" },                    lifeSpan: { min: 8,  max: 12 } },
  { id: "mini-lop",       species: "rabbit", names: { en: "Mini Lop",          pt: "Mini Lop" },               lifeSpan: { min: 7,  max: 14 } },
  { id: "holland-lop",    species: "rabbit", names: { en: "Holland Lop",       pt: "Holland Lop" },            lifeSpan: { min: 7,  max: 14 } },
  { id: "netherland-d",   species: "rabbit", names: { en: "Netherland Dwarf",  pt: "Anão Holandês" },          lifeSpan: { min: 10, max: 12 } },
  { id: "lionhead",       species: "rabbit", names: { en: "Lionhead",          pt: "Lionhead" },               lifeSpan: { min: 7,  max: 10 } },
  { id: "mini-rex",       species: "rabbit", names: { en: "Mini Rex",          pt: "Mini Rex" },               lifeSpan: { min: 7,  max: 12 } },
  { id: "angora",         species: "rabbit", names: { en: "English Angora",    pt: "Angorá Inglês" },          lifeSpan: { min: 7,  max: 12 } },
  { id: "flemish",        species: "rabbit", names: { en: "Flemish Giant",     pt: "Gigante de Flandres" },    lifeSpan: { min: 5,  max: 8  } },
  { id: "dutch",          species: "rabbit", names: { en: "Dutch",             pt: "Holandês" },               lifeSpan: { min: 5,  max: 8  } },
  { id: "new-zealand",    species: "rabbit", names: { en: "New Zealand",       pt: "Nova Zelândia" },          lifeSpan: { min: 5,  max: 8  } },
  { id: "other-rabbit",   species: "rabbit", names: { en: "Other",             pt: "Outra" },                  lifeSpan: { min: 7,  max: 10 } },
];

const BIRDS: Breed[] = [
  { id: "mixed-bird",     species: "bird", names: { en: "Mixed",               pt: "SRD" },                    lifeSpan: { min: 5,  max: 15 } },
  { id: "cockatiel",      species: "bird", names: { en: "Cockatiel",           pt: "Calopsita" },              lifeSpan: { min: 15, max: 25 } },
  { id: "budgie",         species: "bird", names: { en: "Budgerigar",          pt: "Periquito Australiano" },  lifeSpan: { min: 5,  max: 10 } },
  { id: "lovebird",       species: "bird", names: { en: "Lovebird",            pt: "Agapornis" },              lifeSpan: { min: 10, max: 15 } },
  { id: "canary",         species: "bird", names: { en: "Canary",              pt: "Canário" },                lifeSpan: { min: 7,  max: 12 } },
  { id: "amazon",         species: "bird", names: { en: "Blue-fronted Amazon", pt: "Papagaio Verdadeiro" },    lifeSpan: { min: 40, max: 60 } },
  { id: "macaw",          species: "bird", names: { en: "Macaw",               pt: "Arara" },                  lifeSpan: { min: 50, max: 80 } },
  { id: "cockatoo",       species: "bird", names: { en: "Cockatoo",            pt: "Cacatua" },                lifeSpan: { min: 40, max: 60 } },
  { id: "java-sparrow",   species: "bird", names: { en: "Java Sparrow",        pt: "Diamante de Java" },       lifeSpan: { min: 5,  max: 9  } },
  { id: "other-bird",     species: "bird", names: { en: "Other",               pt: "Outra" },                  lifeSpan: { min: 8,  max: 15 } },
];

const OTHERS: Breed[] = [
  { id: "other-other",    species: "other", names: { en: "Other",              pt: "Outro" },                  lifeSpan: { min: 5,  max: 12 } },
];

export const ALL_BREEDS: Breed[] = [...DOGS, ...CATS, ...RABBITS, ...BIRDS, ...OTHERS];

export function getBreedsForSpecies(species: Species): Breed[] {
  return ALL_BREEDS.filter((b) => b.species === species);
}

/** Find a breed by user-typed name (case-insensitive, in either locale). */
export function lookupBreed(species: Species, name: string | null | undefined): Breed | null {
  if (!name) return null;
  const norm = name.trim().toLowerCase();
  if (!norm) return null;
  return (
    ALL_BREEDS.find(
      (b) =>
        b.species === species &&
        (b.names.en.toLowerCase() === norm || b.names.pt.toLowerCase() === norm)
    ) ?? null
  );
}

/** Generic species fallback when breed is unknown. */
const GENERIC_SPAN: Record<Species, { min: number; max: number }> = {
  dog: { min: 10, max: 14 },
  cat: { min: 13, max: 17 },
  rabbit: { min: 7, max: 12 },
  bird: { min: 8, max: 15 },
  other: { min: 5, max: 12 },
};

/**
 * Estimate life expectancy (years) for a pet.
 * Adjustments are additive and conservative:
 * - female bonus: +0.5 years (small but consistent across mammal studies)
 * - neutered bonus: +1 year (vet studies show ~1-2 year increase on average)
 * Returns the adjusted (min, max) range.
 */
export function estimateLifespan(
  species: Species,
  breedName: string | null | undefined,
  sex: "male" | "female" | null | undefined,
  neutered: boolean | null | undefined
): { min: number; max: number; sourceBreed: Breed | null } {
  const breed = lookupBreed(species, breedName);
  const base = breed ? breed.lifeSpan : GENERIC_SPAN[species];
  let { min, max } = base;
  if (sex === "female") {
    min += 0.5;
    max += 0.5;
  }
  if (neutered) {
    min += 1;
    max += 1;
  }
  return {
    min: Math.round(min),
    max: Math.round(max),
    sourceBreed: breed,
  };
}
