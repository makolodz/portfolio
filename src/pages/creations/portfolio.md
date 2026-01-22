---
layout: "../../layouts/creaLayout.astro"
title: 'Mon portfolio ?!'
pubDate: 2026-01-12
description: "Comment j'ai réalisé mon portfolio"
image:
    url: "/images/covers/portfolio.png"
    alt: "Capture d'écran de ce site"
tags: ["Dev", "2026", "Front"]
featured: true
---

## J'ai réalisé mon portfolio

Je vais vous raconter les différentes étapes par lesquelles je suis passé dans la création de ce portfolio

### Maquettage / Conception

Je voulais avoir 3 types d'articles : mes créations, de la veille pour le développement et la conception et des blogs plus personnels.

J'ai fais un wireframe puis j'ai posé sur figma la page d'accueil. Je l'ai divisé en 3 sections, une avec la navigation, quelques publications à la une. La section d'après reprend le contenu de mon curriculum vitae. et la dernière liste entièrement les publications par type.

Pour le design je me suis "légerement" inspiré du ui glass d'apple en mettant quelques containers translucide et backdrop-filter blur. J'ai surtout voulu montrer un profil de développeur attiré par l'art avec le tableau d'Ilia Répine montrant Tolstoï labourer un champ.

### Développement

J'ai choisi de faire un site statique pour avoir un bon référencement ainsi, j'ai pris le constructeur de pages web **astro**, et quand je le souhaiterais je pourrais même passer le site en JamStack avec un headless cms (pour l'instant je préfère éditer le markdown dans vscode...)

J'ai fais 1 layout pour la page index, et 1 layout par publications (j'aurais pus m'en sortir avec 1 seul et quelques props c'est une piste d'amélioration dans le code).

Ensuite j'ai voulu montrer que je pouvais faire un peu de **gsap** donc j'ai mis du scrollSmoother (scroll lissé) / scrollTrigger (timeline flêches et header qui bougent) / scrollTo (clics flêches).

### Rédaction

Quand je souhaite insérer une publication actuellement je la modifie dans le projet sur mon bureau (ou sur le dépôt github) et je déploie sur le serveur ovh via ftp. (là je pourrais remplacer par des githubs actions aussi mais je pense que je vais changer d'hébergeur donc j'ai pas mis plus d'énergie que ça à apprendre comment ça marche...)

### Pistes d'améliorations

Il y a quelques éléments d'UI que je souhaiterais ajouter (des filtres par taxonomie, des liens, des intégrations d'images / projets).

Je voudrais aussi améliorer le workflow et changer d'hébergeur pour un cdn parce qu'actuellement c'est en bare metal sur ovh.

A long terme j'aimerais passer le back sur une api afin de pouvoir changer de thème tous les ans plus rapidement mais c'est pas une prioritée.

Evidemment je suis ouverts aux critiques / conseils vous pouvez me les adressez par email à : <a href="mailto:maxiimekolodz@gmail.com">maxiimekolodz@gmail.com</a>