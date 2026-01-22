---
layout: "../../layouts/veilleLayout.astro"
title: 'Jamstack'
pubDate: 2026-01-22
description: "J'explore la Jamstack et pourquoi elle change le développement web."
image:
    url: "/images/covers/jamstack.png"
    alt: 'Illustration de la Jamstack.'
tags: ["Dev", "Web", "Front"]
featured: true
---

## Jamstack c'est quoi ?

La Jamstack est une approche moderne du développement web qui se concentre sur **JavaScript, API et Markup** (d'où le nom JAM).  
Contrairement aux architectures traditionnelles basées sur des serveurs dynamiques, la Jamstack privilégie les sites **pré-générés** et les contenus servis via des APIs.

Le résultat ? Des sites souvent **plus rapides, plus sûrs et plus faciles à scaler**.

### Alors comment ça fonctionne ?

Avec la Jamstack, le site ou l'application est construit à l’avance : le HTML est généré statiquement à partir du contenu, le JavaScript gère l’interactivité, et les APIs fournissent les données dynamiques.

On peut utiliser une multitude de générateurs de sites statiques : **Astro** (que j'utilise pour mon porfolio hors du cadre JAM) **, Next.js, Nuxt, Hugo, Eleventy**, etc.  

Le workflow typique :  

- On écrit le contenu (Markdown, CMS headless, etc.).  
- On génère le site avec un framework ou un générateur statique.
- On déploie le tout sur un CDN pour avoir 100% sur pagespeed insights.

### Pourquoi faire ?!

- **Performance** : tout est servi statiquement, donc les pages chargent presque instantanément.  
- **Sécurité** : moins de serveur, moins de failles.  
- **Flexibilité** : on peut combiner n’importe quel frontend avec n’importe quelle API.
- **Economie** : l'hébergement statique, c'est devenu **presque** gratuit.  

En gros, la Jamstack permet de créer des sites et applications modernes tout en simplifiant l’infrastructure.

### Et y'a quoi qui utilise la Jamstack ?

Même si c’est une approche récente, elle est déjà adoptée dans différents domaines:

Smashing Magazines et dev.to ont certaines parties de leurs sites produites par jamstack, il existe aussi beaucoup de documentations produites comme ceci (la documentation de vue est par exemple produite via vitepress). 

Bref, la Jamstack n’est pas juste un mot à la mode : c’est une philosophie qui change la manière de construire le web.  
Et moi, je trouve ça fascinant de voir comment un site peut être rapide, sécurisé et moderne sans serveur complexe.