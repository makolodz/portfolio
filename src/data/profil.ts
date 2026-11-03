// Contenus des sections Stack, Parcours, Services et FAQ de l'accueil.
//
// Les valeurs créées avec `todo('…')` ne sont pas encore renseignées : elles s'affichent
// surlignées « à compléter » sur le site et sont listées dans la console à chaque build.
// Remplace-les simplement par une chaîne, ex. : date: 'septembre 2026'.

export type Field = string | { todo: string };
export const todo = (hint: string): Field => ({ todo: hint });

export const disponibilite = {
	date: 'septembre 2027',
	ville: 'Le Puy-en-Velay et Clermont-Ferrand',
	mobilite: 'Mais, je reste mobile et ouvert au télétravail comme au présentiel',
};

export const tarifs: Field = "landing page à partir de 400 €, site vitrine à partir de 800 €, site e-commerce à partir de 2 000 €, application métier sur devis";

// ---------- Parcours ----------
export const parcours: { year: Field; title: string; meta: Field[]; text: string }[] = [
	{
		year: '2024-2027',
		title: 'BUT MMI',
		meta: ["Métiers du multimédia et de l'internet"],
		text: 'Conception et développement web. Projets marquants : la Webweek, refonte du site du club de foot de Colomiers en équipe de cinq, et une affiche en réalité augmentée modélisée sous Blender.',
	},
	{
		year: '2026-2027',
		title: 'Alternance',
		meta: [("ACTI-GROUP"), 'PME industrielle'],
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
			{ name: 'Relume', status: 'explo' },
		],
	},
	{
		casquette: 'Développement',
		tools: [
			{ name: 'Astro', status: 'prod' },
			{ name: 'JavaScript', status: 'prod' },
			{ name: 'React', status: 'prod' },
			{ name: 'Symfony', status: 'prod' },
			{ name: 'T3 Stack', status: 'prod' },
			{ name: 'CakePHP', status: 'explo' },
			{ name: 'Tauri', status: 'explo' },
		],
	},
	{
		casquette: 'Déploiement',
		tools: [
			{ name: 'Git', status: 'prod' },
			{ name: 'serveur / hébergement', status: 'prod' },
			{ name: 'CI/CD', status: 'prod' },
			{ name: 'Docker', status: 'prod' },
		],
	},
];

// ---------- FAQ ----------
// Chaque réponse est une suite de morceaux de texte (et de champs à compléter).
export const faq: { q: string; a: Field[] }[] = [
	{
		q: 'Tu es disponible quand ?',
		a: ['À partir de ', disponibilite.date, ' en contrat (CDI/CDD/apprentissage en master) et dès maintenant en freelance.'],
	},
	{
		q: 'Tu es basé où ? Télétravail ?',
		a: ['À ', disponibilite.ville, '. ', disponibilite.mobilite, '.'],
	},
	{
		q: 'Quel type de poste tu cherches ?',
		a: [
			"Développement web fullstack avec une part de DevOps : concevoir, livrer et faire tourner des applications utiles. En contrat d'apprentissage (pour septembre 2027 / août 2028) ou en CDI dans une PME ou une ESN.",
		],
	},
	{
		q: "Tu as l'habitude de travailler en équipe ?",
		a: [
			"En BUT, j'ai fait la Webweek en équipe de cinq, un projet qui mobilisait nos compétences de collaboration, avec un workflow Git partagé via les branches. Aujourd'hui, même en tant que seul développeur de ma PME, je continue de mettre en place des outils de gestion de projet, notamment un Gitea auto-hébergé, une utilisation avancée du versioning et un pipeline CI/CD.",
		],
	},
	{
		q: 'Pourquoi autant de kayak sur ce site ?',
		a: [
			"Parce que j'en fais depuis le collège, freestyle surtout. Et qu'on y apprend à lire et analyser le courant avant de s'engager pour décider de nos actions : ça marche aussi pour les projets.",
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
		text: 'Un site léger, accessible et bien référencé, facile à faire évoluer.',
		items: ['Design sur mesure', 'Performance et accessibilité', "Conseils sur l'hébergement et les bonnes pratiques SEO"],
	},
	{
		title: 'Site e-commerce',
		text: 'Un site sur mesure qui vous permettra de commencer votre boutique en ligne.',
		items: ['Design sur mesure', 'Wordpress / Woocommerce', "Formation à l'utilisation du site"],
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
		a: ["Cela dépend du projet : comptez environ 2 semaines pour un site vitrine et 5 semaines pour un site e-commerce. Pour une application métier, cela dépend énormément des fonctionnalités."],
	},
	{
		q: 'À qui appartient le code ?',
		a: ["Le code vous appartient. Selon vos besoins, je propose aussi un hébergement à l'année."],
	},
	{
		q: 'Et après la mise en ligne ?',
		a: ["Chaque mise en ligne inclut 1 mois de garantie : je corrige les bugs sans frais. Ensuite, vous pouvez choisir un forfait de maintenance annuel (mises à jour de sécurité, sauvegardes, surveillance, hébergement et petites modifications) ou me solliciter à la demande, sur devis."],
	},
	{
		q: 'Tu travailles à distance ?',
		a: ['Je suis basé à ', disponibilite.ville, '. ', disponibilite.mobilite, '.'],
	},
];
