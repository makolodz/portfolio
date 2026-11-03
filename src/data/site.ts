// Infos globales du site : un seul endroit à modifier.
export const site = {
  name: 'Maxime Kolodziejczyk',
  shortName: 'Maxiko',
  role: 'Développeur fullstack & DevOps',
  description:
    "Développeur fullstack & DevOps, en alternance en PME industrielle depuis septembre 2026. Disponible en freelance et en CDI.",
  availability: 'Disponible · Freelance & CDI',
  email: 'kolodz.maxime@gmail.com',
  linkedin: 'https://www.linkedin.com/in/maxime-kolodz',
  github: 'https://github.com/makolodz',
  // Pas de CV pour le moment : les liens « CV » sont masqués tant que ce champ est vide.
  // Pour l'activer : déposer le PDF dans public/ et mettre '/cv-maxime-kolodziejczyk.pdf'.
  cv: '',
};

export const nav = [
  { href: '/services', label: 'Services' },
  { href: '/blog', label: 'Blog' },
  ...(site.cv ? [{ href: site.cv, label: 'CV' }] : []),
];
