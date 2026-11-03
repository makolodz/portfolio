// Personnages façon figurine : sécurité sur les rochers, spectateur au premier plan.
// Grosse tête, corps en pilule, membres courts (≈ 1,6 m debout), regard vers +x.
// Articulés pour poser et animer : hanches, genoux, épaules, coudes, cou.
import { CylinderGeometry, Group, Mesh, SphereGeometry } from 'three';
import { HEAD_R, buildHead, hand, limb, toy } from './figure';

export interface PersonLook {
	top: string; // gilet / haut
	legs: string; // pantalon
	skin: string;
	head: 'helmet' | 'cap' | 'hair';
	headColor: string;
	shoes?: string;
}

const HIP_HEIGHT = 0.53; // debout (pieds posés au sol)

export function buildPerson(look: PersonLook) {
	const top = toy(look.top);
	const legs = toy(look.legs);
	const skin = toy(look.skin);
	const shoes = toy(look.shoes ?? '#1A1A1A');

	const root = new Group(); // posé au sol (pieds en y = 0 quand il est debout)
	const hips = new Group();
	hips.position.y = HIP_HEIGHT;
	root.add(hips);

	// Jambes : hanche → genou → pied
	const makeLeg = (side: number) => {
		const hip = limb(0.22, 0.07, legs);
		hip.position.z = side * 0.09;
		const knee = limb(0.2, 0.064, legs);
		knee.position.y = -0.24;
		const foot = new Mesh(new SphereGeometry(0.075, 12, 8), shoes);
		foot.scale.set(1.55, 0.7, 1);
		foot.position.set(0.05, -0.25, 0);
		knee.add(foot);
		hip.add(knee);
		hips.add(hip);
		return { hip, knee };
	};
	const legL = makeLeg(1);
	const legR = makeLeg(-1);

	// Buste en pilule, tête posée directement dessus (pas de cou visible)
	const spine = new Group();
	hips.add(spine);
	const torso = limb(0.22, 0.19, top);
	torso.rotation.z = Math.PI; // pointe vers le haut
	torso.position.y = 0.08;
	torso.scale.set(0.95, 1, 1.08);
	spine.add(torso);

	const neck = new Group();
	neck.position.y = 0.52;
	neck.rotation.order = 'YXZ'; // tourner la tête (y) puis la baisser (z)
	spine.add(neck);
	const head = buildHead({ skin: look.skin, headwear: look.head, headwearColor: look.headColor });
	head.group.position.y = -0.02;
	neck.add(head.group);

	// Bras courts : épaule → coude → main en boule
	const makeArm = (side: number) => {
		const shoulder = limb(0.17, 0.056, top);
		shoulder.position.set(0, 0.42, side * 0.2);
		const elbow = limb(0.15, 0.05, top);
		elbow.position.y = -0.2;
		const fist = hand(0.066, skin);
		fist.position.y = -0.2;
		elbow.add(fist);
		shoulder.add(elbow);
		spine.add(shoulder);
		return { shoulder, elbow, hand: fist };
	};
	const armL = makeArm(1);
	const armR = makeArm(-1);

	return { root, hips, spine, neck, legL, legR, armL, armR, headRadius: HEAD_R };
}

export type Person = ReturnType<typeof buildPerson>;

// ---------- Poses ----------
// Conventions : rotation.z > 0 = vers l'avant pour un membre (et vers l'arrière pour le buste),
// rotation.x > 0 = écarte vers -z (bras ou jambe droits) ; < 0 = vers +z (côté gauche).

/** Debout, détendu : bras légèrement écartés du gros buste */
export function poseStanding(p: Person) {
	p.hips.position.y = HIP_HEIGHT;
	p.spine.rotation.z = 0;
	p.legL.hip.rotation.set(-0.05, 0, 0.04);
	p.legR.hip.rotation.set(0.05, 0, -0.04);
	p.legL.knee.rotation.z = 0;
	p.legR.knee.rotation.z = 0;
	p.armL.shoulder.rotation.set(-0.28, 0, 0.05);
	p.armR.shoulder.rotation.set(0.28, 0, 0.05);
	p.armL.elbow.rotation.set(0, 0, 0.25);
	p.armR.elbow.rotation.set(0, 0, 0.25);
}

/** Debout, prêt à lancer : genoux fléchis, bras droit tenant le sac devant soi. ready ∈ [0, 1] : en alerte */
export function poseThrower(p: Person, ready: number) {
	const crouch = 0.25 + 0.25 * ready;
	p.hips.position.y = HIP_HEIGHT - 0.06 * crouch;
	p.spine.rotation.z = -0.12 - 0.18 * ready;
	for (const [leg, s] of [[p.legL, 1], [p.legR, -1]] as const) {
		leg.hip.rotation.set(-s * 0.16, 0, 0.35 * crouch + 0.1); // pieds écartés
		leg.knee.rotation.z = -0.75 * crouch;
	}
	p.armR.shoulder.rotation.set(0.3, 0, 0.4 + 0.6 * ready); // sac tenu devant, levé quand il est en alerte
	p.armR.elbow.rotation.set(0, 0, 1.0 - 0.3 * ready);
	p.armL.shoulder.rotation.set(-0.35, 0, 0.3 + 0.3 * ready);
	p.armL.elbow.rotation.set(0, 0, 0.9);
}

/** Signal « OK » des kayakistes : bras levé en arc au-dessus de la tête. k ∈ [0, 1] */
export function poseOkSignal(p: Person, k: number) {
	poseStanding(p);
	p.armR.shoulder.rotation.set(0.28 + 2.45 * k, 0, 0.05 + 0.2 * k);
	p.armR.elbow.rotation.set(1.2 * k, 0, 0.25);
}

/** Assis au sol, penché en arrière, les mains posées derrière lui (en arrière des coudes) */
export function poseSittingBack(p: Person) {
	p.hips.position.y = 0.08;
	p.spine.rotation.z = 0.45; // buste penché en arrière
	for (const [leg, s] of [[p.legL, 1], [p.legR, -1]] as const) {
		leg.hip.rotation.set(-s * 0.18, 0, 2.0); // cuisses vers l'avant, genoux relevés et un peu écartés
		leg.knee.rotation.z = -1.9;
	}
	for (const [arm, s] of [[p.armL, 1], [p.armR, -1]] as const) {
		arm.shoulder.rotation.set(-s * 0.3, 0, -1.0); // bras vers l'arrière
		arm.elbow.rotation.set(0, 0, 0.1); // presque tendus : mains derrière les coudes
	}
}

/** Petit throw bag (sac à corde) dans la main */
export function addThrowBag(p: Person, color: string) {
	const bag = new Mesh(new CylinderGeometry(0.065, 0.075, 0.18, 10), toy(color));
	bag.position.y = -0.3;
	p.armR.elbow.add(bag);
	return bag;
}
