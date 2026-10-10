// Infos globales du site : un seul endroit à modifier.
export const site = {
  name: 'Maxime Kolodziejczyk',
  shortName: 'Maxiko',
  role: 'Développeur fullstack & DevOps',
  description:
    "Développeur fullstack & DevOps, 1 an d'alternance en PME industrielle. Disponible en freelance et en CDI.",
  availability: 'Disponible · Freelance & CDI',
  // TODO: renseigner les vrais liens
  email: 'contact@example.com',
  linkedin: 'https://www.linkedin.com/in/',
  github: 'https://github.com/makolodz',
  cv: '/cv-maxime-kolodziejczyk.pdf',
};

export const nav = [
  { href: '/#projets', label: 'Projets' },
  { href: '/services', label: 'Services' },
  { href: '/notes', label: 'Notes' },
  { href: site.cv, label: 'CV' },
];
