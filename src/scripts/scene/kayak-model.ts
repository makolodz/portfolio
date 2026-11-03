// Kayaks, pagaie et kayakiste, modélisés en code (aucun fichier 3D à charger).
// Kayaks en low poly (facettes visibles), kayakiste en style figurine (voir figure.ts).
import {
	BufferGeometry,
	CircleGeometry,
	Color,
	CylinderGeometry,
	DoubleSide,
	ExtrudeGeometry,
	Float32BufferAttribute,
	Group,
	Mesh,
	MeshStandardMaterial,
	Shape,
	TorusGeometry,
	Vector3,
} from 'three';
import { buildHead, hand, limb, toy } from './figure';
import { palette } from './stage';

/** Forme de coque : toutes les cotes sont en unités du modèle (le kayak de rivière fait 2,45 de long). */
export interface HullShape {
	length: number;
	width: number; // demi-largeur au maître-bau
	deck: number; // hauteur du pont
	bulge: number; // volume relevé autour du cockpit
	bottom: number; // profondeur sous la ligne de flottaison
	rocker: number; // relevé des pointes
	rockerPow: number; // > : relevé concentré aux pointes
	chine: number; // < 1 : bouchains marqués, ~1 : coque ronde
	flat: number; // < 1 : fond plat, ~1 : fond rond
}

export const HULLS: Record<'river' | 'creek', HullShape> = {
	// Kayak de rivière polyvalent
	river: { length: 2.45, width: 0.32, deck: 0.15, bulge: 0.07, bottom: 0.12, rocker: 0.24, rockerPow: 2.6, chine: 0.55, flat: 0.35 },
	// Creek : plus long, plus de volume, coque ronde (fait pour les chutes)
	creek: { length: 2.65, width: 0.34, deck: 0.2, bulge: 0.08, bottom: 0.15, rocker: 0.3, rockerPow: 2.2, chine: 0.8, flat: 0.7 },
};

/** Signe × |v|^p : permet de rendre une section plus « carrée » (p < 1) ou plus ronde */
const spow = (v: number, p: number) => Math.sign(v) * Math.pow(Math.abs(v), p);

function hullGeometry(h: HullShape, segments = 26, around = 18) {
	const pos: number[] = [];
	for (let i = 0; i <= segments; i++) {
		const u = i / segments;
		const x = (u - 0.5) * h.length;
		const s = Math.sin(Math.PI * u);
		const halfWidth = h.width * Math.pow(s, 0.5);
		const deck = h.deck * Math.pow(s, 0.55) + h.bulge * Math.exp(-(((u - 0.47) / 0.16) ** 2));
		const bottom = h.bottom * Math.pow(s, 0.6);
		const rocker = h.rocker * Math.pow(Math.abs(2 * u - 1), h.rockerPow);
		for (let j = 0; j < around; j++) {
			const a = (j / around) * Math.PI * 2;
			const c = Math.cos(a);
			const sn = Math.sin(a);
			const z = halfWidth * spow(c, h.chine);
			const y = rocker + (sn >= 0 ? deck * spow(sn, 0.6) : bottom * spow(sn, h.flat));
			pos.push(x, y, z);
		}
	}
	const index: number[] = [];
	for (let i = 0; i < segments; i++) {
		for (let j = 0; j < around; j++) {
			const a = i * around + j;
			const b = (i + 1) * around + j;
			const c = (i + 1) * around + ((j + 1) % around);
			const d = i * around + ((j + 1) % around);
			index.push(a, b, d, b, c, d);
		}
	}
	const g = new BufferGeometry();
	g.setAttribute('position', new Float32BufferAttribute(pos, 3));
	g.setIndex(index);
	g.computeVertexNormals();
	return g;
}

/** Kayak complet (coque, hiloire, poignées). seatY = hauteur du pont au cockpit, pour y asseoir le kayakiste. */
export function buildKayak(color: string = palette.volt, shape: HullShape = HULLS.river) {
	const group = new Group();

	const hullMat = new MeshStandardMaterial({ color, flatShading: true, roughness: 0.45, metalness: 0.05, side: DoubleSide });
	group.add(new Mesh(hullGeometry(shape), hullMat));

	const dark = new MeshStandardMaterial({ color: '#0E1719', flatShading: true, roughness: 0.7 });
	const seatY = shape.deck + shape.bulge * 0.97;

	// Hiloire (bord du cockpit) + intérieur sombre
	const rim = new Mesh(new TorusGeometry(1, 0.06, 6, 28), dark);
	rim.rotation.x = -Math.PI / 2;
	rim.scale.set(0.36, 0.205, 0.6);
	rim.position.set(-0.08, seatY - 0.005, 0);
	group.add(rim);

	const hole = new Mesh(new CircleGeometry(1, 28), new MeshStandardMaterial({ color: '#050A0B', roughness: 1 }));
	hole.rotation.x = -Math.PI / 2;
	hole.scale.set(0.34, 0.19, 1);
	hole.position.set(-0.08, seatY - 0.015, 0);
	group.add(hole);

	// Poignées de portage aux deux pointes
	for (const side of [-1, 1]) {
		const grip = new Mesh(new TorusGeometry(0.05, 0.012, 4, 10), dark);
		grip.position.set(side * (shape.length / 2 - 0.12), shape.rocker * 0.75 + 0.06, 0);
		grip.rotation.y = Math.PI / 2;
		group.add(grip);
	}

	return { group, hullMat, seatY };
}

function bladeShape() {
	// Pale asymétrique, plus large en bout
	const s = new Shape();
	s.moveTo(-0.025, 0);
	s.bezierCurveTo(-0.07, 0.12, -0.11, 0.3, -0.09, 0.44);
	s.quadraticCurveTo(0, 0.5, 0.1, 0.43);
	s.bezierCurveTo(0.11, 0.28, 0.06, 0.1, 0.025, 0);
	s.closePath();
	return s;
}

export function buildPaddle(bladeColor: string = palette.foam) {
	const group = new Group();
	const shaftLength = 1.6;

	const shaftMat = new MeshStandardMaterial({ color: '#1A2B2F', roughness: 0.35, metalness: 0.2, flatShading: true });
	const shaft = new Mesh(new CylinderGeometry(0.017, 0.017, shaftLength, 8), shaftMat);
	group.add(shaft);

	const bladeMat = new MeshStandardMaterial({ color: bladeColor, roughness: 0.4, flatShading: true, side: DoubleSide });
	const bladeGeo = new ExtrudeGeometry(bladeShape(), { depth: 0.012, bevelEnabled: false, curveSegments: 6 });
	bladeGeo.translate(0, 0, -0.006);

	for (const side of [1, -1]) {
		const blade = new Mesh(bladeGeo, bladeMat);
		blade.position.y = (side * shaftLength) / 2;
		blade.rotation.z = side === 1 ? 0 : Math.PI;
		// Pales décalées (« feathering ») de 30°
		blade.rotation.y = side === 1 ? 0 : Math.PI / 6;
		group.add(blade);
	}
	return { group, bladeMat };
}

export interface PaddlerLook {
	vest: string;
	helmet: string;
	skin: string;
	blade: string;
}

/**
 * Kayakiste façon figurine, assis dans le cockpit. Articulé pour l'animation :
 * - upperBody pivote aux hanches (se pencher en avant),
 * - headGroup pivote au cou (baisser la tête),
 * - paddlePivot porte la pagaie (coups de pagaie / pagaie plaquée sur le côté).
 * Les bras relient les épaules aux poignées de la pagaie : appeler updateArms() après avoir animé le reste.
 * Coordonnées locales du kayak (pointe vers +x), pour un pont à 0,22 de haut.
 * setLook() change la tenue sans reconstruire le modèle.
 */
export function buildPaddler() {
	const group = new Group();
	const vestMat = toy('#1F3A35');
	const jacketMat = toy('#26343A'); // veste sous le gilet (manches)
	const skinMat = toy('#D9A982');

	const upperBody = new Group();
	upperBody.position.set(-0.1, 0.22, 0); // hanches
	const torso = limb(0.14, 0.16, vestMat); // buste en pilule (gilet)
	torso.rotation.z = Math.PI;
	torso.position.y = 0.07;
	torso.scale.set(0.95, 1, 1.08);
	upperBody.add(torso);

	const headGroup = new Group();
	headGroup.position.set(0, 0.36, 0); // cou
	const head = buildHead({ skin: '#D9A982', headwear: 'helmet', headwearColor: palette.foam });
	head.group.scale.setScalar(0.88);
	headGroup.add(head.group);
	upperBody.add(headGroup);
	group.add(upperBody);

	// Pagaie : rattachée au kayak (pas au buste) pour pouvoir la plaquer le long de la coque
	const paddlePivot = new Group();
	paddlePivot.position.set(0.22, 0.5, 0);
	const { group: paddle, bladeMat } = buildPaddle(palette.foam);
	paddle.rotation.x = Math.PI / 2; // manche en travers du kayak
	paddlePivot.add(paddle);
	group.add(paddlePivot);

	// Bras : un segment arrondi de l'épaule à la poignée, une main en boule sur le manche
	const arms = [1, -1].map((side) => {
		const sleeve = new Mesh(new CylinderGeometry(0.052, 0.046, 1, 10), jacketMat);
		const fist = hand(0.06, skinMat);
		const shoulderBall = hand(0.058, jacketMat);
		group.add(sleeve, fist, shoulderBall);
		return {
			sleeve,
			fist,
			shoulderBall,
			shoulder: new Vector3(0.02, 0.3, side * 0.17), // dans le repère du buste
			grip: new Vector3(0, side * 0.3, 0), // dans le repère de la pagaie (le manche suit son axe y)
		};
	});
	const a = new Vector3();
	const b = new Vector3();
	const dir = new Vector3();
	const up = new Vector3(0, 1, 0);
	const updateArms = () => {
		upperBody.updateMatrix();
		paddlePivot.updateMatrix();
		paddle.updateMatrix();
		for (const arm of arms) {
			a.copy(arm.shoulder).applyMatrix4(upperBody.matrix);
			b.copy(arm.grip).applyMatrix4(paddle.matrix).applyMatrix4(paddlePivot.matrix);
			dir.subVectors(b, a);
			const length = dir.length();
			arm.sleeve.position.copy(a).addScaledVector(dir, 0.5);
			arm.sleeve.quaternion.setFromUnitVectors(up, dir.divideScalar(length || 1));
			arm.sleeve.scale.set(1, length, 1);
			arm.fist.position.copy(b);
			arm.shoulderBall.position.copy(a);
		}
	};
	updateArms();

	const setLook = (look: PaddlerLook) => {
		vestMat.color = new Color(look.vest);
		head.setHeadwear(look.helmet);
		head.setSkin(look.skin);
		skinMat.color = new Color(look.skin);
		bladeMat.color = new Color(look.blade);
	};

	return { group, upperBody, headGroup, paddlePivot, setLook, updateArms };
}
