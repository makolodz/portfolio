// Style « figurine » commun aux personnages et aux kayakistes : grosse tête ronde, visage simple,
// corps en pilule, membres courts et arrondis, rendu lisse façon jouet (en contraste avec le décor low poly).
// Unités : mètres, regard vers +x.
import { BoxGeometry, CapsuleGeometry, Color, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry } from 'three';

/** Matière lisse et légèrement satinée, comme un jouet en plastique */
export const toy = (color: string) => new MeshStandardMaterial({ color: new Color(color), roughness: 0.5, metalness: 0 });

const ink = new MeshStandardMaterial({ color: '#16110F', roughness: 0.35 });
const glint = new MeshStandardMaterial({ color: '#FFFFFF', emissive: '#FFFFFF', emissiveIntensity: 0.5 });

export const HEAD_R = 0.25;

export interface HeadLook {
	skin: string;
	headwear: 'helmet' | 'cap' | 'hair';
	headwearColor: string;
}

/** Tête : origine à la base du cou, centre de la tête à HEAD_R au-dessus */
export function buildHead(look: HeadLook) {
	const group = new Group();
	const skin = toy(look.skin);
	const wear = toy(look.headwearColor);

	const head = new Mesh(new SphereGeometry(HEAD_R, 22, 16), skin);
	head.position.y = HEAD_R;
	head.scale.set(0.96, 1, 1.03); // un peu plus large que profonde
	group.add(head);

	// Visage (sur la face +x) : yeux ovales avec reflet, sourcils, petit nez, sourire
	const face = new Group();
	face.position.y = HEAD_R;
	group.add(face);
	for (const side of [1, -1]) {
		const eye = new Mesh(new SphereGeometry(1, 12, 10), ink);
		eye.scale.set(0.015, 0.05, 0.034);
		eye.position.set(0.232, 0.03, side * 0.085);
		const shine = new Mesh(new SphereGeometry(0.01, 6, 4), glint);
		shine.position.set(0.244, 0.046, side * 0.085 + 0.008);
		const brow = new Mesh(new BoxGeometry(0.012, 0.014, 0.065), ink);
		brow.position.set(0.218, 0.1, side * 0.09);
		brow.rotation.x = side * 0.18; // légèrement inclinés : air sympathique
		face.add(eye, shine, brow);
	}
	const nose = new Mesh(new SphereGeometry(0.032, 10, 8), skin);
	nose.scale.set(1, 0.8, 0.9);
	nose.position.set(0.25, -0.03, 0);
	const mouth = new Mesh(new TorusGeometry(0.04, 0.009, 5, 12, Math.PI), ink);
	mouth.rotation.set(0, Math.PI / 2, Math.PI); // demi-cercle tourné vers le bas, face à +x : un sourire
	mouth.position.set(0.232, -0.085, 0);
	face.add(nose, mouth);

	// Coiffe : casque, casquette ou cheveux, posés comme une calotte
	if (look.headwear === 'helmet') {
		// Coque arrêtée au-dessus des sourcils pour laisser le visage dégagé
		const shell = new Mesh(new SphereGeometry(HEAD_R * 1.12, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.4), wear);
		shell.rotation.z = 0.14; // casque un peu reculé
		face.add(shell);
	} else if (look.headwear === 'cap') {
		const crown = new Mesh(new SphereGeometry(HEAD_R * 1.05, 22, 8, 0, Math.PI * 2, 0, Math.PI * 0.4), wear);
		crown.rotation.z = 0.15;
		const visor = new Mesh(new BoxGeometry(0.17, 0.022, 0.26), wear);
		visor.position.set(0.25, 0.115, 0);
		visor.rotation.z = -0.18;
		face.add(crown, visor);
	} else {
		const hair = new Mesh(new SphereGeometry(HEAD_R * 1.06, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), wear);
		hair.rotation.z = 0.35; // couvre le dessus et l'arrière de la tête, dégage le front
		face.add(hair);
	}

	return {
		group,
		setSkin: (c: string) => (skin.color = new Color(c)),
		setHeadwear: (c: string) => (wear.color = new Color(c)),
	};
}

/**
 * Segment de membre arrondi qui pend sous son articulation (le long de -y).
 * Les extrémités arrondies recouvrent les articulations : pas de jointure visible.
 */
export function limb(length: number, radius: number, mat: MeshStandardMaterial) {
	const pivot = new Group();
	const m = new Mesh(new CapsuleGeometry(radius, length, 4, 10), mat);
	m.position.y = -length / 2;
	pivot.add(m);
	return pivot;
}

/** Main en boule */
export const hand = (radius: number, mat: MeshStandardMaterial) => new Mesh(new SphereGeometry(radius, 12, 10), mat);
