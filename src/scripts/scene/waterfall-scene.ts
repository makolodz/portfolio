// Hero — petite chute d'eau low poly : plateau, falaise, bassin, chenal, écume, sapins…
// et des kayakistes qui arrivent en pagayant, sautent la cascade, ressortent et repartent vers l'aval,
// sous l'œil de deux personnes à la sécurité et d'un spectateur assis au premier plan.
// Chaque passage tire une trajectoire (5, générées procéduralement), un kayak et une tenue différents.
import {
	BufferGeometry,
	CatmullRomCurve3,
	Color,
	ConeGeometry,
	CylinderGeometry,
	DirectionalLight,
	DodecahedronGeometry,
	DoubleSide,
	DynamicDrawUsage,
	Fog,
	Float32BufferAttribute,
	Frustum,
	Group,
	HemisphereLight,
	IcosahedronGeometry,
	InstancedMesh,
	Matrix4,
	Mesh,
	MeshStandardMaterial,
	Object3D,
	PlaneGeometry,
	Raycaster,
	ShaderMaterial,
	UniformsLib,
	UniformsUtils,
	Sphere,
	Vector3,
} from 'three';
import { HULLS, buildKayak, buildPaddler, type PaddlerLook } from './kayak-model';
import { addThrowBag, buildPerson, poseOkSignal, poseSittingBack, poseStanding, poseThrower, type Person } from './people';
import { createStage, hash3, palette, portraitFactor } from './stage';

const smooth = (a: number, b: number, x: number) => {
	const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
};

const LIP = { y: 2.9, z: -0.3 }; // bord de la chute
const IMPACT = { x: 0, z: 0.62 }; // point de chute dans le bassin
const POOL_Y = 0.1;

// Relief : plateau derrière (z < 0), falaise, bassin, vallée qui s'ouvre vers la caméra
function terrainHeight(x: number, z: number) {
	const back = smooth(0.4, -0.6, z);
	const ax = Math.abs(x);
	const valley = smooth(1.4, 5, ax) * 1.6;
	let h = back * 3.2 + (1 - back) * (0.35 + valley);
	h -= back * (1 - smooth(0.7, 1.15, ax)) * 0.45; // lit de la rivière amont
	const dPool = Math.hypot(x, (z - 2) * 0.85);
	h -= (1 - smooth(1.6, 2.8, dPool)) * 0.8 * (1 - back); // bassin
	h -= (1 - smooth(0.9 + z * 0.08, 1.5 + z * 0.1, ax)) * smooth(1.5, 3.5, z) * 0.6; // chenal aval
	h += (Math.sin(x * 1.7 + z * 0.6) + Math.sin(x * 0.5 - z * 1.3) + 0.5 * Math.sin(x * 3.1 + z * 2.7)) * 0.07;
	return h;
}

/** Géométrie non indexée (une couleur par facette) à partir d'un plan */
function faceted(width: number, depth: number, sx: number, sz: number) {
	const g = new PlaneGeometry(width, depth, sx, sz).toNonIndexed();
	g.rotateX(-Math.PI / 2);
	return g;
}

function paintFaces(g: BufferGeometry, pick: (cx: number, cy: number, cz: number, ny: number) => Color) {
	const pos = g.attributes.position;
	const colors = new Float32Array(pos.count * 3);
	const a = new Vector3();
	const b = new Vector3();
	const c = new Vector3();
	for (let i = 0; i < pos.count; i += 3) {
		a.fromBufferAttribute(pos, i);
		b.fromBufferAttribute(pos, i + 1);
		c.fromBufferAttribute(pos, i + 2);
		const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
		const col = pick((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3, (a.z + b.z + c.z) / 3, Math.abs(n.y));
		for (let k = 0; k < 3; k++) col.toArray(colors, (i + k) * 3);
	}
	g.setAttribute('color', new Float32BufferAttribute(colors, 3));
}

export function initWaterfall(canvas: HTMLCanvasElement, { onReady }: { onReady?: () => void } = {}) {
	const { scene, camera, pointer, start } = createStage(canvas, {
		onReady,
		fov: 34,
		fogNear: 11,
		fogFar: 27,
		shiftX: 0.18,
		shiftYPortrait: 0.05,
	});

	const fog = scene.fog as Fog;
	scene.add(new HemisphereLight('#BFD9D4', palette.deep, 1.0));
	const sun = new DirectionalLight('#FFE8C8', 2.3);
	sun.position.set(-4, 7, 5);
	scene.add(sun);

	// ---------- Terrain ----------
	const terrain = faceted(22, 22, 44, 44);
	terrain.translate(0, 0, 3);
	{
		const pos = terrain.attributes.position;
		for (let i = 0; i < pos.count; i++) {
			const x = pos.getX(i);
			const z = pos.getZ(i);
			pos.setY(i, terrainHeight(x, z) + (hash3(x, 0, z) - 0.5) * 0.12);
		}
	}
	const rock = [new Color('#3A4A4E'), new Color('#46575B')];
	const grass = [new Color('#27463B'), new Color('#2F5446')];
	const gravel = new Color('#55625D');
	paintFaces(terrain, (x, y, z, ny) => {
		const v = hash3(Math.round(x * 4), 1, Math.round(z * 4)) > 0.5 ? 1 : 0;
		if (ny < 0.72) return rock[v];
		if (y < 0.45 && z > -0.2) return gravel;
		return grass[v];
	});
	terrain.computeVertexNormals();
	const terrainMesh = new Mesh(terrain, new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
	scene.add(terrainMesh);

	// ---------- Bassin : facettes animées ----------
	const waterMat = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.3, metalness: 0.1 });
	const teal = new Color('#2A6D78');
	const tealLight = new Color('#3B8792');
	const foam = new Color('#CFE3E0');

	const pool = faceted(12, 16, 30, 40);
	pool.translate(0, POOL_Y, 6);
	paintFaces(pool, (x, _y, z) => {
		const d = Math.hypot(x - IMPACT.x, z - IMPACT.z);
		const r = hash3(x * 4, 4, z * 4);
		if (d < 0.75 || (d < 1.4 && r > 0.75) || (z > 3 && r > 0.95)) return foam;
		return r > 0.5 ? teal : tealLight;
	});
	const poolMesh = new Mesh(pool, waterMat);
	scene.add(poolMesh);

	const poolBase = Float32Array.from(pool.attributes.position.array);
	pool.attributes.position.setUsage(DynamicDrawUsage);

	// ---------- Rivière du haut + chute : un seul ruban d'eau continu ----------
	// La surface part loin en amont, se resserre à la largeur de la chute, bascule au bord
	// (la courbe de chute démarre à l'horizontale) et tombe jusqu'au bassin.
	// Un même shader fait défiler facettes et filets d'écume au rythme du courant : aucun raccord visible.
	const RIVER_START = LIP.z - 9;
	const FLOW_SPEED = 0.9; // vitesse du courant sur le plat (unités/s)
	const WATER_G = 3.4; // même gravité que le kayak
	const DROP = LIP.y - POOL_Y;
	const COLS = 12;
	const rows: { z: number; y: number; width: number; flow: number; fall: number; brink: number; wave: number }[] = [];
	const PLATEAU_ROWS = 26;
	for (let i = 0; i <= PLATEAU_ROWS; i++) {
		const z = RIVER_START + (LIP.z - RIVER_START) * (i / PLATEAU_ROWS);
		const narrow = smooth(LIP.z - 1.4, LIP.z, z); // se resserre à la largeur de la chute
		const brink = smooth(LIP.z - 0.8, LIP.z, z);
		rows.push({ z, y: LIP.y, width: 2.0 - 0.5 * narrow, flow: (z - RIVER_START) / FLOW_SPEED, fall: 0, brink, wave: 1 - brink });
	}
	const lipFlow = rows[rows.length - 1].flow;
	const FALL_ROWS = 18;
	for (let i = 1; i <= FALL_ROWS; i++) {
		const v = (i / FALL_ROWS) ** 1.6; // rangées resserrées près du bord, là où la courbe est la plus forte
		const drop = DROP * v;
		rows.push({
			z: LIP.z + 0.55 * Math.sqrt(drop),
			y: LIP.y - drop,
			width: 1.5 * (1 + 0.25 * v),
			flow: lipFlow + Math.sqrt((2 * drop) / WATER_G), // temps de chute : l'eau accélère
			fall: v,
			brink: 1 - smooth(0, 0.25, v),
			wave: 0,
		});
	}
	const river = new BufferGeometry();
	{
		const pos: number[] = [];
		const uv: number[] = [];
		const flow: number[] = [];
		const fall: number[] = [];
		const brink: number[] = [];
		const wave: number[] = [];
		for (const r of rows) {
			const rough = smooth(0, 0.1, r.fall); // irrégularités low poly, seulement dans la chute
			for (let j = 0; j <= COLS; j++) {
				const u = j / COLS;
				const x = (u - 0.5) * r.width + (hash3(u, r.fall, 7) - 0.5) * 0.04 * rough;
				pos.push(x, r.y, r.z + (hash3(x, r.fall, 9) - 0.5) * 0.05 * rough);
				uv.push(u, 0);
				flow.push(r.flow);
				fall.push(r.fall);
				brink.push(r.brink);
				wave.push(r.wave);
			}
		}
		const index: number[] = [];
		for (let i = 0; i < rows.length - 1; i++) {
			for (let j = 0; j < COLS; j++) {
				const a = i * (COLS + 1) + j;
				const b = a + COLS + 1;
				index.push(a, b, a + 1, b, b + 1, a + 1);
			}
		}
		river.setAttribute('position', new Float32BufferAttribute(pos, 3));
		river.setAttribute('uv', new Float32BufferAttribute(uv, 2));
		river.setAttribute('aFlow', new Float32BufferAttribute(flow, 1));
		river.setAttribute('aFall', new Float32BufferAttribute(fall, 1));
		river.setAttribute('aBrink', new Float32BufferAttribute(brink, 1));
		river.setAttribute('aWave', new Float32BufferAttribute(wave, 1));
		river.setIndex(index);
	}
	// Couleurs écrites telles quelles (pas de conversion) : mêmes teintes que le reste de l'eau à l'écran
	const shown = (r: number, g: number, b: number) => new Color().setRGB(r / 255, g / 255, b / 255);
	const riverMat = new ShaderMaterial({
		side: DoubleSide,
		fog: true,
		uniforms: UniformsUtils.merge([
			UniformsLib.fog,
			{
				uTime: { value: 0 },
				uDeep: { value: shown(26, 86, 96) },
				uMid: { value: shown(36, 108, 118) },
				uFall: { value: new Color('#4D9AA4') },
				uFoam: { value: new Color(palette.foam) },
			},
		]),
		vertexShader: /* glsl */ `
			#include <fog_pars_vertex>
			uniform float uTime;
			attribute float aFlow;
			attribute float aFall;
			attribute float aBrink;
			attribute float aWave;
			varying vec2 vUv;
			varying float vFlow;
			varying float vFall;
			varying float vBrink;
			void main() {
				vUv = uv;
				vFlow = aFlow;
				vFall = aFall;
				vBrink = aBrink;
				vec3 p = position;
				// Vagues sur le plat, amorties à l'approche du bord (même formule que pour le kayak)
				p.y += sin(p.z * 3.0 - uTime * 5.0 + p.x * 2.0) * 0.03 * aWave;
				vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
				gl_Position = projectionMatrix * mvPosition;
				#include <fog_vertex>
			}
		`,
		fragmentShader: /* glsl */ `
			#include <fog_pars_fragment>
			uniform float uTime;
			uniform vec3 uDeep;
			uniform vec3 uMid;
			uniform vec3 uFall;
			uniform vec3 uFoam;
			varying vec2 vUv;
			varying float vFlow;
			varying float vFall;
			varying float vBrink;
			float hash(float n) { return fract(sin(n) * 43758.5453); }
			float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
			void main() {
				// Une seule phase, du plat jusqu'en bas : tout défile au rythme du courant
				float flow = vFlow - uTime;
				float falling = smoothstep(0.0, 0.12, vFall);

				// Plat : facettes de deux teintes qui dérivent avec le courant
				float rowId = floor(flow * 2.2);
				vec2 cell = vec2(floor(vUv.x * 8.0 + mod(rowId, 2.0) * 0.5), rowId);
				vec3 calm = mix(uDeep, uMid, step(0.5, hash2(cell)));

				// Filets d'écume : quelques-uns, discrets, sur le plat ; tous, nets, dans la chute
				float col = floor(vUv.x * 16.0);
				float s = fract(flow * (0.8 + hash(col) * 0.5) + hash(col + 3.0) * 5.0);
				float streak = smoothstep(0.62, 0.66, s) * (1.0 - smoothstep(0.94, 0.98, s));
				float calmStreak = streak * step(0.55, hash(col + 11.0)) * 0.35;

				vec3 fallWater = mix(uFall, uFall * 1.25, hash(col + 7.0));
				vec3 base = mix(calm, fallWater, falling);
				// L'eau blanchit en accélérant au bord, puis au pied de la chute
				float foamAmount = mix(calmStreak, streak * 0.8, falling) + vBrink * 0.22 + smoothstep(0.7, 1.0, vFall);
				gl_FragColor = vec4(mix(base, uFoam, clamp(foamAmount, 0.0, 1.0)), 1.0);
				#include <fog_fragment>
			}
		`,
	});
	scene.add(new Mesh(river, riverMat));

	// ---------- Rochers ----------
	const rockMat = new MeshStandardMaterial({ color: '#3F4F53', flatShading: true, roughness: 0.9 });
	const rocks: [number, number, number, number][] = [
		[-1.15, 0.15, 0.95, 0.5], [1.25, 0.1, 1.3, 0.6], [0.95, 0.0, 3.2, 0.35],
		[-0.75, 0.0, 4.3, 0.3], [1.5, 2.95, -0.7, 0.6], [-1.45, 3.0, -1.0, 0.7], [-1.9, 0.3, 2.4, 0.45],
	];
	const rockMeshes: Mesh[] = [];
	for (const [x, y, z, r] of rocks) {
		const g = new DodecahedronGeometry(r, 0);
		const pos = g.attributes.position;
		for (let i = 0; i < pos.count; i++) {
			const k = 0.75 + hash3(pos.getX(i), pos.getY(i), pos.getZ(i)) * 0.45;
			pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 0.7, pos.getZ(i) * k);
		}
		g.computeVertexNormals();
		const m = new Mesh(g, rockMat);
		m.position.set(x, y, z);
		m.rotation.y = x * 3;
		scene.add(m);
		rockMeshes.push(m);
	}

	// ---------- Sapins low poly (instanciés) ----------
	const spots: [number, number, number, number][] = [];
	for (let i = 0; spots.length < 34 && i < 400; i++) {
		const x = (hash3(i, 1, 2) - 0.5) * 18;
		const z = -9 + hash3(i, 3, 4) * 17;
		const ax = Math.abs(x);
		const onPlateau = z < -1.1 && ax > 1.5;
		const onBank = z > 0.5 && ax > 2.6 + z * 0.1 && (x < 0 ? z < 6 : z < 3.4);
		if (!onPlateau && !onBank) continue;
		spots.push([x, terrainHeight(x, z), z, 0.7 + hash3(i, 5, 6) * 0.7]);
	}
	const trunkMesh = new InstancedMesh(new CylinderGeometry(0.05, 0.07, 0.3, 5), new MeshStandardMaterial({ color: '#3A2E25', flatShading: true }), spots.length);
	const layers = [
		{ geo: new ConeGeometry(0.38, 0.7, 6), y: 0.5 },
		{ geo: new ConeGeometry(0.3, 0.6, 6), y: 0.8 },
		{ geo: new ConeGeometry(0.2, 0.5, 6), y: 1.07 },
	].map((l) => ({ ...l, mesh: new InstancedMesh(l.geo, new MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), spots.length) }));
	const dummy = new Object3D();
	const leaf = new Color();
	spots.forEach(([x, y, z, s], i) => {
		dummy.position.set(x, y + 0.15 * s, z);
		dummy.rotation.set(0, hash3(x, y, z) * 6, 0);
		dummy.scale.setScalar(s);
		dummy.updateMatrix();
		trunkMesh.setMatrixAt(i, dummy.matrix);
		leaf.set(hash3(z, x, 1) > 0.5 ? '#24473B' : '#2D5747');
		for (const l of layers) {
			dummy.position.set(x, y + l.y * s, z);
			dummy.updateMatrix();
			l.mesh.setMatrixAt(i, dummy.matrix);
			l.mesh.setColorAt(i, leaf);
		}
	});
	scene.add(trunkMesh, ...layers.map((l) => l.mesh));

	// ---------- Écume au pied de la chute ----------
	const FOAM = 150;
	const foamMesh = new InstancedMesh(
		new IcosahedronGeometry(1, 0),
		new MeshStandardMaterial({ color: palette.foam, emissive: '#5E7F7C', flatShading: true }),
		FOAM,
	);
	foamMesh.instanceMatrix.setUsage(DynamicDrawUsage);
	scene.add(foamMesh);
	const bubbles = Array.from({ length: FOAM }, () => ({ p: new Vector3(), v: new Vector3(), life: 0, max: 1, size: 0 }));
	const respawn = (b: (typeof bubbles)[number]) => {
		b.p.set(IMPACT.x + (Math.random() - 0.5) * 1.6, POOL_Y, IMPACT.z + (Math.random() - 0.3) * 0.6);
		b.v.set((Math.random() - 0.5) * 1.0, 0.4 + Math.random() * 1.2, 0.2 + Math.random() * 1.0);
		b.max = b.life = 0.4 + Math.random() * 0.7;
		b.size = 0.025 + Math.random() * 0.05;
	};
	bubbles.forEach((b) => {
		respawn(b);
		b.life *= Math.random();
	});

	// ---------- Kayakistes : passages successifs ----------
	// boat = position + cap ; tilt = tangage / roulis ; kayaks + kayakiste = modèles (pointe vers +x)
	const boat = new Group();
	const tilt = new Group();
	boat.add(tilt);
	boat.scale.setScalar(0.34);
	scene.add(boat);

	// 3 coques (une seule visible à la fois) et un kayakiste dont on change la tenue
	const kayaks = (Object.keys(HULLS) as (keyof typeof HULLS)[]).map((name) => {
		const k = buildKayak(palette.volt, HULLS[name]);
		k.group.visible = false;
		tilt.add(k.group);
		return { name, ...k };
	});
	const { group: paddler, upperBody, headGroup, paddlePivot, setLook, updateArms } = buildPaddler();
	tilt.add(paddler);

	const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
	const easeSlope = (x: number) => (x < 0.5 ? 4 * x : 4 * (1 - x)); // dérivée de ease
	const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
	const smoothstep = (a: number, b: number, x: number) => smooth(a, b, x);

	// Échelle de la scène : le kayak (2,4 m) mesure 0,83 unité, donc 1 unité ≈ 3 m
	const G = 3.4; // gravité ramenée à l'échelle
	const START_Z = -2.2; // départ sur la rivière du haut
	const FALL = Math.sqrt((2 * (LIP.y + 0.05 - POOL_Y)) / G);

	// ---------- Trajectoires ----------
	// Une trajectoire = ligne d'approche, point de saut sur le bord, vitesse, et courbe dans le bassin
	// qui prolonge la direction de la chute puis serpente vers l'aval.
	interface Route {
		startX: number;
		lipX: number;
		speed: number;
		cruise: number;
		approach: number;
		landZ: number;
		path: CatmullRomCurve3;
		len: number;
		travelled: number[]; // distance parcourue après l'impact, échantillonnée tous les STEP
	}
	const STEP = 1 / 120;

	const makeRoute = (startX: number, lipX: number, speed: number, cruise: number, pool: [number, number][]): Route => {
		const landZ = LIP.z + speed * FALL;
		const points = [[lipX, landZ] as [number, number], ...pool].map(([x, z]) => new Vector3(x, 0, z));
		const path = new CatmullRomCurve3(points, false, 'centripetal');
		const len = path.getLength();
		// Vitesse : freinée par l'eau à l'impact, puis relancée par les coups de pagaie
		const travelled = [0];
		while (travelled[travelled.length - 1] < len) {
			const tau = travelled.length * STEP;
			const v = speed * Math.exp(-3 * tau) + cruise * (1 - Math.exp(-1.2 * tau));
			travelled.push(travelled[travelled.length - 1] + v * STEP);
		}
		return { startX, lipX, speed, cruise, approach: (LIP.z - START_Z) / speed, landZ, path, len, travelled };
	};

	// Distance parcourue au temps tau ; au-delà de la table, on continue à vitesse de croisière
	const distanceAt = (r: Route, tau: number) => {
		const last = r.travelled.length - 1;
		const f = tau / STEP;
		if (f >= last) return r.travelled[last] + (f - last) * STEP * r.cruise;
		const i = Math.floor(f);
		return lerp(r.travelled[i], r.travelled[i + 1], f - i);
	};

	// Zones à éviter dans le bassin : les rochers (avec une marge) et les berges
	const rockZones = rocks.filter(([, y]) => y < 1).map(([x, , z, r]) => ({ x, z, r: r * 1.2 + 0.22 }));
	const isNavigable = (r: Route) => {
		for (let i = 0; i <= 60; i++) {
			const p = r.path.getPointAt(i / 60);
			const bank = p.z < 1.5 ? 1.2 : 0.8 + p.z * 0.08;
			if (Math.abs(p.x) > bank) return false;
			if (rockZones.some((k) => Math.hypot(p.x - k.x, p.z - k.z) < k.r)) return false;
		}
		return true;
	};
	// « Signature » d'une trajectoire, pour s'assurer qu'elles sont bien différentes les unes des autres
	const signature = (r: Route) => [r.lipX, ...[0.35, 0.6, 0.85].map((u) => r.path.getPointAt(u).x)];
	const distinct = (a: Route, b: Route) => {
		const sb = signature(b);
		return Math.hypot(...signature(a).map((v, i) => v - sb[i])) > 0.35;
	};

	// Générateur pseudo-aléatoire à graine fixe : les 5 trajectoires sont toujours les mêmes (testables)
	const seeded = (seed: number) => () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let h = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		h = (h + Math.imul(h ^ (h >>> 7), 61 | h)) ^ h;
		return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
	};
	const rng = seeded(7);
	const between = (a: number, b: number) => a + (b - a) * rng();

	// Trajectoire n°0 : celle de l'image fixe du hero (saut au centre)
	const routes: Route[] = [
		makeRoute(0, 0, 1.0, 0.9, [
			[0.04, LIP.z + FALL + 0.7],
			[0.42, 2.6],
			[0.12, 3.7],
			[-0.38, 4.6],
			[-0.6, 5],
			[-0.85, 6.6],
		]),
	];
	for (let attempt = 0; routes.length < 5 && attempt < 500; attempt++) {
		const speed = between(0.9, 1.12);
		const lipX = between(-0.45, 0.45);
		const startX = Math.max(-0.6, Math.min(0.6, lipX + between(-0.35, 0.35)));
		const side = rng() < 0.5 ? -1 : 1;
		const landZ = LIP.z + speed * FALL;
		const route = makeRoute(startX, lipX, speed, between(0.8, 1.0), [
			[lipX + between(-0.08, 0.08), landZ + between(0.6, 0.9)],
			[side * between(0.15, 0.6), between(2.4, 2.9)],
			[-side * between(0, 0.45), between(3.5, 3.9)],
			[between(-0.75, 0.2), between(4.5, 4.9)],
			[between(-1.0, -0.3), between(5.3, 5.7)],
			[between(-1.2, -0.5), 6.6],
		]);
		if (isNavigable(route) && routes.every((r) => distinct(r, route))) routes.push(route);
	}

	// ---------- Kayaks et tenues ----------
	const HULL_COLORS = [palette.volt, '#F26B1D', '#D7263D', '#1E88E5', palette.foam];
	const VESTS = ['#1F3A35', '#B23A2E', '#E2B33C', '#2B4C7E', '#1A1A1A'];
	const HELMETS = [palette.foam, '#D7263D', '#F26B1D', '#2D63C8', '#1A1A1A'];
	const SKINS = ['#D9A982', '#B07850', '#8A5A3C', '#F0C8A0', '#6B4430'];
	const BLADES = [palette.foam, '#1A1A1A', '#F26B1D', palette.volt];

	interface Run {
		route: Route;
		hull: number; // index dans kayaks
		color: string;
		look: PaddlerLook;
		stroke: number; // cadence de pagaie (rad/s)
	}
	function pick<T>(list: T[], not?: T): T {
		const pool = not !== undefined && list.length > 1 ? list.filter((v) => v !== not) : list;
		return pool[Math.floor(Math.random() * pool.length)];
	}
	// Premier passage : celui de l'image fixe (kayak de rivière jaune, saut au centre)
	const firstRun: Run = {
		route: routes[0],
		hull: 0,
		color: palette.volt,
		look: { vest: '#1F3A35', helmet: palette.foam, skin: '#D9A982', blade: palette.foam },
		stroke: 5.5,
	};
	const nextRun = (prev: Run): Run => ({
		route: pick(routes, prev.route),
		hull: Math.floor(Math.random() * kayaks.length),
		color: pick(HULL_COLORS, prev.color),
		look: { vest: pick(VESTS), helmet: pick(HELMETS), skin: pick(SKINS), blade: pick(BLADES) },
		stroke: 5 + Math.random() * 1.2,
	});
	const applyRun = (r: Run) => {
		kayaks.forEach((k, i) => {
			k.group.visible = i === r.hull;
			if (i === r.hull) k.hullMat.color = new Color(r.color);
		});
		paddler.position.y = kayaks[r.hull].seatY - 0.22; // le kayakiste est modélisé pour un pont à 0,22
		setLook(r.look);
	};

	let run = firstRun;
	applyRun(run);
	// Décalage du 1er passage : l'image fixe (t = 1,2 s) montre le kayak en plein saut,
	// et l'animation démarre juste avant le bord de la chute.
	let runStart = -(run.route.approach + 0.45 * FALL - 1.2);

	// Fin d'un passage : dès que le kayak a quitté le champ de la caméra (quel que soit l'écran)
	const frustum = new Frustum();
	const viewProj = new Matrix4();
	const boatBounds = new Sphere(new Vector3(), 0.45);
	const inView = () => {
		viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
		frustum.setFromProjectionMatrix(viewProj);
		boatBounds.center.copy(boat.position);
		return frustum.intersectsSphere(boatBounds);
	};

	// Enfoncement puis rebond : oscillation amortie (≈ 20 cm d'enfoncement, rebond au-dessus de l'eau)
	const SINK = 0.5;
	const SINK_W = 5.7; // pulsation : descente ~0,23 s, rebond vers 0,8 s
	const SINK_DAMP = 1.1;
	const sinkAt = (tau: number) => -SINK * Math.sin(SINK_W * tau) * Math.exp(-SINK_DAMP * tau);
	// Tangage : la pointe qui plonge à l'impact remonte, dépasse vers le haut au rebond, puis se stabilise
	const ENTRY_PITCH = -1.15;
	const PITCH_W = 5;
	const PITCH_DAMP = 1.2;
	const pitchAt = (tau: number) =>
		Math.exp(-PITCH_DAMP * tau) * (ENTRY_PITCH * Math.cos(PITCH_W * tau) + ((PITCH_DAMP * ENTRY_PITCH) / PITCH_W) * Math.sin(PITCH_W * tau));
	const POP = Math.PI / SINK_W + 0.52; // instant où il ressort de l'eau (2e petite gerbe)

	const poolHeight = (x: number, z: number, t: number) => {
		const d = Math.hypot(x - IMPACT.x, z - IMPACT.z);
		return POOL_Y + Math.sin(d * 5 - t * 4) * 0.06 * Math.exp(-d * 0.5) + Math.sin(z * 2 - t * 3 + x) * 0.025;
	};
	// Position « groupée » pour passer la chute : pagaie plaquée le long de la coque, buste penché, tête baissée
	const TUCK = {
		paddlePos: new Vector3(0.1, 0.32, 0.27),
		paddleRot: new Vector3(0, Math.PI / 2, -0.12), // manche parallèle au kayak, sur le côté
		lean: -0.75, // buste penché vers l'avant (~43°)
		head: -0.5, // tête baissée
	};
	const STROKE_POS = new Vector3(0.22, 0.5, 0); // pagaie tenue devant le buste
	const PREP = 0.4; // secondes pour se grouper avant le bord

	// Gerbes d'écume : à l'impact, puis plus petite quand le kayak ressort de l'eau
	const SPRAY = 90;
	const sprayMesh = new InstancedMesh(
		new IcosahedronGeometry(1, 0),
		new MeshStandardMaterial({ color: palette.foam, emissive: '#5E7F7C', flatShading: true }),
		SPRAY,
	);
	sprayMesh.instanceMatrix.setUsage(DynamicDrawUsage);
	scene.add(sprayMesh);
	const spray = Array.from({ length: SPRAY }, () => ({ p: new Vector3(), v: new Vector3(), life: 0, max: 1, size: 0 }));
	const burst = (x: number, z: number, count: number, strength: number) => {
		let n = 0;
		for (const d of spray) {
			if (n >= count) break;
			if (d.life > 0) continue; // on ne recycle que les gouttes retombées
			n++;
			const a = Math.random() * Math.PI * 2;
			const r = (0.4 + Math.random() * 1.1) * strength;
			d.p.set(x + Math.cos(a) * 0.15, POOL_Y, z + Math.sin(a) * 0.15);
			d.v.set(Math.cos(a) * r, (1.2 + Math.random() * 1.8) * strength, Math.sin(a) * r);
			d.max = d.life = 0.6 + Math.random() * 0.6;
			d.size = (0.03 + Math.random() * 0.05) * (0.6 + 0.4 * strength);
		}
	};
	let lastPhase = -1;

	// ---------- Personnages ----------
	const PEOPLE_SCALE = 0.34; // modélisés en mètres, comme le kayak
	scene.updateMatrixWorld(true);
	const down = new Raycaster();
	const groundAt = (x: number, z: number, surface: Mesh) => {
		down.set(new Vector3(x, 10, z), new Vector3(0, -1, 0));
		return down.intersectObject(surface, false)[0]?.point.y ?? terrainHeight(x, z);
	};
	const place = (person: Person, x: number, z: number, surface: Mesh, lookAtX: number, lookAtZ: number) => {
		person.root.scale.setScalar(PEOPLE_SCALE);
		person.root.position.set(x, groundAt(x, z, surface), z);
		person.root.rotation.y = Math.atan2(-(lookAtZ - z), lookAtX - x); // regard (+x) tourné vers le point visé
		scene.add(person.root);
	};

	// Sécurité : deux kayakistes sur le rocher à gauche de l'arrivée de la chute, face au point de chute
	const safetyRock = rockMeshes.find((m) => m.position.x < -1 && m.position.z > 0.5 && m.position.z < 1.5)!;
	const thrower = buildPerson({ top: '#D7263D', legs: '#1A2B2F', skin: '#B07850', head: 'helmet', headColor: palette.foam });
	addThrowBag(thrower, '#F26B1D');
	place(thrower, safetyRock.position.x + 0.1, safetyRock.position.z - 0.12, safetyRock, 0, 1.2);
	const signaller = buildPerson({ top: '#E2B33C', legs: '#2B3A3E', skin: '#F0C8A0', head: 'helmet', headColor: '#D7263D' });
	poseStanding(signaller);
	place(signaller, safetyRock.position.x - 0.1, safetyRock.position.z + 0.14, safetyRock, 0, 1.4);

	// Spectateur au premier plan, assis sur la berge, qui regarde la chute
	const spectator = buildPerson({ top: '#3E5C76', legs: '#2A2A2A', skin: '#D9A982', head: 'cap', headColor: '#1A1A1A', shoes: palette.foam });
	poseSittingBack(spectator);
	place(spectator, 3.5, 4.2, terrainMesh, 0, 0.9); // sur le replat de la berge, en bas à droite du cadre

	// Les personnages suivent le kayakiste du regard (tête tournée, limitée à ce qu'un cou permet)
	const neckPos = new Vector3();
	const follow = (person: Person, at: Vector3, maxYaw: number) => {
		person.neck.getWorldPosition(neckPos);
		const dx = at.x - neckPos.x;
		const dz = at.z - neckPos.z;
		let yaw = Math.atan2(-dz, dx) - person.root.rotation.y;
		yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw)); // ramené entre -π et π
		yaw = Math.max(-maxYaw, Math.min(maxYaw, yaw));
		const lookDown = Math.atan2(at.y - neckPos.y, Math.hypot(dx, dz)) * 0.8 - person.spine.rotation.z;
		person.neck.rotation.y += (yaw - person.neck.rotation.y) * 0.08;
		person.neck.rotation.z += (Math.max(-0.9, Math.min(0.6, lookDown)) - person.neck.rotation.z) * 0.08;
	};

	camera.position.set(5.5, 3.6, 8.5);
	const target = new Vector3(0, 1.2, 1);

	start((t, dt) => {
		// Bassin : ondes depuis le point de chute + courant vers l'aval
		const pp = pool.attributes.position;
		for (let i = 0; i < pp.count; i++) {
			const x = poolBase[i * 3];
			const z = poolBase[i * 3 + 2];
			const d = Math.hypot(x - IMPACT.x, z - IMPACT.z);
			pp.setY(i, POOL_Y + Math.sin(d * 5 - t * 4) * 0.06 * Math.exp(-d * 0.5) + Math.sin(z * 2 - t * 3 + x) * 0.025);
		}
		pp.needsUpdate = true;

		riverMat.uniforms.uTime.value = t;

		// Écume
		for (let i = 0; i < FOAM; i++) {
			const b = bubbles[i];
			b.life -= dt;
			if (b.life <= 0) respawn(b);
			b.v.y -= 3.5 * dt;
			b.p.addScaledVector(b.v, dt);
			if (b.p.y < POOL_Y) b.p.y = POOL_Y;
			const k = b.life / b.max;
			dummy.position.copy(b.p);
			dummy.rotation.set(t + i, i, 0);
			dummy.scale.setScalar(b.size * Math.sin(Math.PI * k));
			dummy.updateMatrix();
			foamMesh.setMatrixAt(i, dummy.matrix);
		}
		foamMesh.instanceMatrix.needsUpdate = true;

		// Kayakiste : passage en cours
		let phase = t - runStart;
		// Passage terminé (kayak sorti du cadre) : le suivant arrive, avec un autre kayak
		const landed = run.route.approach + FALL;
		if (phase > landed + 1.5 && (!inView() || phase > landed + 25)) {
			run = nextRun(run);
			applyRun(run);
			runStart = t;
			lastPhase = -1;
			phase = 0;
		}
		const route = run.route;
		const landAt = route.approach + FALL;
		let x = 0;
		let y = 0;
		let z = 0;
		let yaw = -Math.PI / 2; // pointe vers l'aval (+z)
		let pitch = 0; // < 0 : pointe vers le bas
		let roll = 0;
		let tuck = 0; // 0 = pagaie, 1 = groupé pour la chute

		if (phase < route.approach) {
			// 1. Approche sur la rivière du haut, en rejoignant son point de saut
			const p = phase / route.approach;
			z = START_Z + route.speed * phase;
			x = lerp(route.startX, route.lipX, ease(p));
			const vx = ((route.lipX - route.startX) * easeSlope(p)) / route.approach;
			yaw = Math.atan2(-route.speed, vx);
			y = LIP.y + 0.02 + Math.sin(z * 3 - t * 5 + x * 2) * 0.03 * (1 - smooth(LIP.z - 0.8, LIP.z, z));
			pitch = Math.sin(t * 2.3) * 0.04;
			tuck = ease(Math.max(0, (phase - (route.approach - PREP)) / PREP));
		} else if (phase < landAt) {
			// 2. Saut : trajectoire balistique, la pointe bascule vers l'avant
			const tf = phase - route.approach;
			x = route.lipX;
			z = LIP.z + route.speed * tf;
			y = LIP.y + 0.05 - 0.5 * G * tf * tf;
			pitch = ENTRY_PITCH * ease(tf / FALL);
			tuck = 1;
		} else {
			// 3. Après l'impact : enfoncement, rebond, puis départ en pagayant — sans rupture
			const tau = phase - landAt;
			const dist = distanceAt(route, tau);
			const u = Math.min(1, dist / route.len);
			const tan = route.path.getTangentAt(u);
			// Au-delà de la courbe, il continue tout droit jusqu'à sortir du cadre
			const pos = route.path.getPointAt(u).addScaledVector(tan, Math.max(0, dist - route.len));
			x = pos.x;
			z = pos.z;
			// La surface de l'eau ondule : on la rejoint en douceur depuis le point d'impact
			const surface = lerp(POOL_Y, poolHeight(x, z, t), smoothstep(0, 0.5, tau));
			const cruising = smoothstep(1.0, 2.0, tau); // petits mouvements de navigation une fois stabilisé
			y = surface + sinkAt(tau) + 0.02 * cruising;
			// Cap : celui de la chute à l'impact, puis celui de la trajectoire (+ léger lacet à chaque coup de pagaie)
			yaw = lerp(-Math.PI / 2, Math.atan2(-tan.z, tan.x), smoothstep(0, 0.6, tau)) + 0.04 * Math.sin(t * run.stroke) * cruising;
			pitch = pitchAt(tau) + Math.sin(t * 2.1) * 0.05 * cruising;
			roll = Math.sin(t * 1.7) * 0.06 * smoothstep(0.3, 1.5, tau);
			// Reste groupé le temps de remonter, puis se redresse et reprend la pagaie
			tuck = 1 - ease(Math.min(1, Math.max(0, (tau - 0.55) / 0.6)));
		}

		boat.position.set(x, y, z);
		boat.rotation.set(0, yaw, 0);
		tilt.rotation.set(roll, 0, pitch);

		// Coups de pagaie alternés (la pale plonge d'un côté et passe de l'avant vers l'arrière),
		// fondus progressivement vers la position groupée pendant la chute
		const s = t * run.stroke;
		paddlePivot.position.lerpVectors(STROKE_POS, TUCK.paddlePos, tuck);
		paddlePivot.rotation.set(
			lerp(0.45 * Math.sin(s), TUCK.paddleRot.x, tuck),
			lerp(0.5 * Math.cos(s), TUCK.paddleRot.y, tuck),
			lerp(0, TUCK.paddleRot.z, tuck),
		);
		upperBody.rotation.z = TUCK.lean * tuck;
		headGroup.rotation.z = TUCK.head * tuck;
		updateArms(); // les mains suivent la pagaie

		// Personnages : regard sur le kayakiste ; à la sécurité, alerte pendant le saut puis signal « OK »
		const ready = smoothstep(route.approach - 0.6, route.approach, phase) * (1 - smoothstep(landAt + POP + 0.3, landAt + POP + 1.1, phase));
		poseThrower(thrower, ready);
		const ok = smoothstep(landAt + POP, landAt + POP + 0.35, phase) * (1 - smoothstep(landAt + POP + 1.6, landAt + POP + 2.0, phase));
		poseOkSignal(signaller, ok);
		follow(thrower, boat.position, 1.3);
		follow(signaller, boat.position, 1.3);
		follow(spectator, boat.position, 0.8);

		// Gerbes : grosse à l'impact, petite quand il ressort de l'eau
		const crossed = (at: number) => lastPhase >= 0 && lastPhase < at && phase >= at;
		if (crossed(landAt)) burst(route.lipX, route.landZ, 70, 1);
		if (crossed(landAt + POP)) burst(x, z, 20, 0.55);
		lastPhase = phase;
		for (let i = 0; i < SPRAY; i++) {
			const d = spray[i];
			if (d.life > 0) {
				d.life -= dt;
				d.v.y -= G * 1.4 * dt;
				d.p.addScaledVector(d.v, dt);
				if (d.p.y < POOL_Y) d.life = 0;
			}
			dummy.position.copy(d.p);
			dummy.rotation.set(t + i, i, 0);
			dummy.scale.setScalar(d.life > 0 ? d.size * Math.min(1, (d.life / d.max) * 2) : 0);
			dummy.updateMatrix();
			sprayMesh.setMatrixAt(i, dummy.matrix);
		}
		sprayMesh.instanceMatrix.needsUpdate = true;

		const k = portraitFactor(camera.aspect);
		camera.position.set(5.5 + pointer.x * 0.9, 3.6 + pointer.y * 0.5, 8.5).sub(target).multiplyScalar(k).add(target);
		camera.lookAt(target);
		fog.near = 11 * k;
		fog.far = 27 * k;
	});
}
