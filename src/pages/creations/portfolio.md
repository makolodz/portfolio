---
layout: "../../layouts/creaLayout.astro"
title: 'Mon portfolio ?!'
pubDate: 2026-01-12
description: "Comment j'ai codé mon portfolio (ma page préférée)"
image:
    url: "/images/covers/tauri.png"
    alt: 'The Astro logo on a dark background with a pink glow.'
tags: ["Dev", "2025", "Front"]
featured: true
---

## Tauri c'est quoi ?

Tauri est un framework conçu pour le développement logiciel multiplateforme. Il peut être vu comme un « frère » d’Electron : plus léger, mais généralement légérement plus long à configurer.
La principale différence est que Tauri utilise la WebView native du système, tandis qu’Electron embarque Chromium.

### Alors comment ça fonctionne ?

Le démarrage du projet se fait via une commande fournie par la documentation de Tauri (npm, pnpm, yarn ou cargo).
On configure ensuite notre stack web : Tauri est agnostique, il n’impose aucun framework frontend. Cependant, Vite est fortement recommandé pour le build et le développement.

Une fois la configuration réalisée, on peut lancer le mode développement avec :

"npm run tauri dev"

Cela ouvre une fenêtre native qui se met à jour en temps réel avec les modifications apportées au frontend.

Il est également possible de visualiser l’application directement dans un navigateur classique via localhost, ce qui facilite le débogage.

### Pourquoi faire ?!

Déjà c'est incroyablement pratique pour coder du multiplateforme ! Il suffit de build pour les différents supports et de publier.

En plus ça permet de coder des applications natives dans des languages web.

Et grâce au backend rust et à la webview native c'est plus léger et performant qu'ElectronJS !

### Et y'a quoi de codé en tauri ?

Même si Tauri est encore relativement jeune, il commence déjà à être adopté dans des projets sérieux.

On peut notamment citer Zed, un éditeur de code moderne axé sur les performances et la collaboration en temps réel, développé en grande partie avec Tauri.
Il y a aussi Astro Editor, un éditeur Markdown léger, qui illustre bien l’objectif du framework : des applications rapides, natives, et peu gourmandes en ressources.

De manière plus générale, Tauri est de plus en plus utilisé pour des outils internes, des launchers, des dashboards, ou des applications desktop légères là où Electron serait jugé trop lourd.