// Kayak de rivière et pagaie, modélisés en code (aucun fichier 3D à charger).
// Style low poly : facettes visibles grâce au flatShading.
import {
	BufferGeometry,
	CircleGeometry,
	CylinderGeometry,
	DoubleSide,
	ExtrudeGeometry,
	Float32BufferAttribute,
	Group,
	Mesh,
	MeshStandardMaterial,
	Shape,
	TorusGeometry,
} from 'three';
import { palette } from './stage';

const LENGTH = 2.45; // un kayak de rivière court, ~2,4 m

/** Signe × |v|^p : permet de rendre une section plus « carrée » (p < 1) ou plus ronde */
const spow = (v: number, p: number) => Math.sign(v) * Math.pow(Math.abs(v), p);

function hullGeometry(segments = 26, around = 18) {
	const pos: number[] = [];
	for (let i = 0; i <= segments; i++) {
		const u = i / segments;
		const x = (u - 0.5) * LENGTH;
		const s = Math.sin(Math.PI * u);
		const halfWidth = 0.32 * Math.pow(s, 0.5);
		// Volume relevé autour du cockpit
		const deck = 0.15 * Math.pow(s, 0.55) + 0.07 * Math.exp(-(((u - 0.47) / 0.16) ** 2));
		const bottom = 0.12 * Math.pow(s, 0.6);
		// Rocker : les pointes remontent fortement (planing hull de rivière)
		const rocker = 0.24 * Math.pow(Math.abs(2 * u - 1), 2.6);
		for (let j = 0; j < around; j++) {
			const a = (j / around) * Math.PI * 2;
			const c = Math.cos(a);
			const sn = Math.sin(a);
			const z = halfWidth * spow(c, 0.55); // bouchains marqués
			const y = rocker + (sn >= 0 ? deck * spow(sn, 0.6) : bottom * spow(sn, 0.35)); // fond plat
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

export function buildKayak(color: string = palette.volt) {
	const group = new Group();

	const hullMat = new MeshStandardMaterial({ color, flatShading: true, roughness: 0.45, metalness: 0.05, side: DoubleSide });
	const hull = new Mesh(hullGeometry(), hullMat);
	group.add(hull);

	const dark = new MeshStandardMaterial({ color: '#0E1719', flatShading: true, roughness: 0.7 });

	// Hiloire (bord du cockpit) + intérieur sombre
	const rim = new Mesh(new TorusGeometry(1, 0.06, 6, 28), dark);
	rim.rotation.x = -Math.PI / 2;
	rim.scale.set(0.36, 0.205, 0.6);
	rim.position.set(-0.08, 0.215, 0);
	group.add(rim);

	const hole = new Mesh(new CircleGeometry(1, 28), new MeshStandardMaterial({ color: '#050A0B', roughness: 1 }));
	hole.rotation.x = -Math.PI / 2;
	hole.scale.set(0.34, 0.19, 1);
	hole.position.set(-0.08, 0.205, 0);
	group.add(hole);

	// Poignées de portage aux deux pointes
	for (const side of [-1, 1]) {
		const grip = new Mesh(new TorusGeometry(0.05, 0.012, 4, 10), dark);
		grip.position.set(side * (LENGTH / 2 - 0.12), 0.2, 0);
		grip.rotation.y = Math.PI / 2;
		group.add(grip);
	}

	return { group, hullMat };
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
