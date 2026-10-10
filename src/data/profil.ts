// Contenus des sections Stack, Parcours, Services et FAQ de l'accueil.
//
// Les valeurs créées avec `todo('…')` ne sont pas encore renseignées : elles s'affichent
// surlignées « à compléter » sur le site et sont listées dans la console à chaque build.
// Remplace-les simplement par une chaîne, ex. : date: 'septembre 2026'.

export type Field = string | { todo: string };
export const todo = (hint: string): Field => ({ todo: hint });

export const disponibilite = {
	date: todo('mois année'),
	ville: todo('ville'),
	mobilite: todo('télétravail / hybride / mobile sur…'),
};

export const tarifs: Field = todo('sur devis / à partir de …');

// ---------- Parcours ----------
export const parcours: { year: Field; title: string; meta: Field[]; text: string }[] = [
	{
		year: todo('années'),
		title: 'BUT MMI',
		meta: ["Métiers du multimédia et de l'internet"],
		text: 'Conception et développement web. Projets marquants : la Webweek, refonte du site du club de foot de Colomiers en équipe de cinq, et une affiche en réalité augmentée modélisée sous Blender.',
	},
	{
		year: todo('années'),
		title: 'Alternance',
		meta: [todo("nom de l'entreprise"), 'PME industrielle'],
		text: "Seul développeur dans la boîte : conception, développement et déploiement d'applications métier, du recueil du besoin jusqu'à la mise en production.",
	},
];

// ---------- Stack ----------
// prod = utilisé au quotidien · explo = testé, en veille
export type Tool = { name: Field; status: 'prod' | 'explo' };
export const stack: { casquette: string; tools: Tool[] }[] = [
	{
		casquette: 'Conception',
		tools: [
			{ name: 'Ateliers utilisateurs', status: 'prod' },
			{ name: 'Wireframes', status: 'prod' },
			{ name: 'Figma', status: 'prod' },
			{ name: 'Blender', status: 'explo' },
		],
	},
	{
		casquette: 'Développement',
		tools: [
			{ name: 'Astro', status: 'prod' },
			{ name: 'JavaScript', status: 'prod' },
			{ name: todo('front utilisé en alternance'), status: 'prod' },
			{ name: todo('back / base de données'), status: 'prod' },
			{ name: 'Tauri', status: 'explo' },
		],
	},
	{
		casquette: 'Déploiement',
		tools: [
			{ name: 'Git', status: 'prod' },
			{ name: todo('serveur / hébergement'), status: 'prod' },
			{ name: todo('CI/CD ?'), status: 'prod' },
			{ name: todo('Docker ?'), status: 'prod' },
		],
	},
];

// ---------- FAQ ----------
// Chaque réponse est une suite de morceaux de texte (et de champs à compléter).
export const faq: { q: string; a: Field[] }[] = [
	{
		q: 'Tu es disponible quand ?',
		a: ['À partir de ', disponibilite.date, ', en CDI comme en freelance.'],
	},
	{
		q: 'Tu es basé où ? Télétravail ?',
		a: ['À ', disponibilite.ville, '. ', disponibilite.mobilite, '.'],
	},
	{
		q: 'Quel type de poste tu cherches ?',
		a: [
			'Développement web fullstack avec une part de DevOps : concevoir, livrer et faire tourner des applications utiles. En CDI dans une PME ou une ESN, ou en missions freelance.',
		],
	},
	{
		q: "Tu as l'habitude de travailler en équipe ?",
		a: [
			"Aujourd'hui je suis le seul développeur de ma PME, donc autonome du besoin à la prod. En BUT, j'ai fait la Webweek en équipe de cinq, avec un workflow Git partagé : dépôt principal et forks.",
		],
	},
	{
		q: 'Pourquoi autant de kayak sur ce site ?',
		a: [
			"Parce que j'en fais depuis le collège, freestyle surtout. Et qu'on y apprend à lire le courant avant de s'engager : ça marche aussi pour les projets.",
		],
	},
];

// ---------- Services (page /services + encart de l'accueil) ----------
export const offres: { title: string; text: string; items: string[] }[] = [
	{
		title: 'Application métier sur mesure',
		text: "Un process qui vit dans un Excel, sur papier ou dans des mails ? Je le transforme en outil web simple, conçu avec ceux qui l'utilisent.",
		items: ['Atelier de recueil du besoin', 'Maquette validée avant de coder', 'Mise en production et prise en main'],
	},
	{
		title: 'Site vitrine rapide',
		text: 'Un site léger, accessible et bien référencé, facile à faire évoluer. Comme celui-ci : 100/100 en accessibilité sur Lighthouse.',
		items: ['Design sur mesure', 'Performance et accessibilité', 'Hébergement conseillé'],
	},
	{
		title: 'Mise en ligne et automatisation',
		text: 'Hébergement, déploiement automatique, sauvegardes : votre outil tourne sans que vous ayez à y penser.',
		items: ['Déploiement automatisé', 'Sauvegardes et suivi', 'Documentation de passation'],
	},
];

// Déroulé d'une mission — à ajuster à ta façon de travailler
export const deroule: { title: string; text: string }[] = [
	{ title: 'Premier échange', text: "Vous m'expliquez votre besoin, je pose beaucoup de questions. On voit ensemble si un outil web est la bonne réponse." },
	{ title: 'Proposition', text: 'Un périmètre clair, un planning et un devis : vous savez ce que vous aurez, et quand.' },
	{ title: 'Maquette', text: "Je maquette les écrans clés et on les valide avec les futurs utilisateurs avant d'écrire une ligne de code." },
	{ title: 'Développement', text: 'Je développe par étapes, avec des démonstrations régulières pour ajuster en route.' },
	{ title: 'Mise en ligne', text: "Déploiement, prise en main avec vos équipes et documentation, pour que l'outil vive sans accroc." },
];

export const faqClient: { q: string; a: Field[] }[] = [
	{
		q: 'Combien coûte un projet ?',
		a: ['Tarifs : ', tarifs, '. Après notre premier échange, vous recevez un devis détaillé.'],
	},
	{
		q: 'Combien de temps ça prend ?',
		a: [todo('délai type, ex. quelques semaines pour un site vitrine…')],
	},
	{
		q: 'À qui appartient le code ?',
		a: [todo('ta politique, ex. à vous, avec tous les accès')],
	},
	{
		q: 'Et après la mise en ligne ?',
		a: [todo('maintenance : forfait, à la demande…')],
	},
	{
		q: 'Tu travailles à distance ?',
		a: ['Je suis basé à ', disponibilite.ville, '. ', disponibilite.mobilite, '.'],
	},
];
