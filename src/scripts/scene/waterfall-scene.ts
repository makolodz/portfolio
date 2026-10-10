// Proto B — petite chute d'eau low poly : plateau, falaise, bassin, chenal,
// écume, sapins… et un petit kayak qui tourne dans le contre-courant.
import {
	BufferGeometry,
	Color,
	ConeGeometry,
	CylinderGeometry,
	DirectionalLight,
	DodecahedronGeometry,
	DoubleSide,
	DynamicDrawUsage,
	Fog,
	Float32BufferAttribute,
	Group,
	HemisphereLight,
	IcosahedronGeometry,
	InstancedMesh,
	Mesh,
	MeshStandardMaterial,
	Object3D,
	PlaneGeometry,
	ShaderMaterial,
	Vector3,
} from 'three';
import { buildKayak, buildPaddle } from './kayak-model';
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
	scene.add(new Mesh(terrain, new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 })));

	// ---------- Eaux (amont + bassin), facettes animées ----------
	const waterMat = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.3, metalness: 0.1 });
	const teal = new Color('#2A6D78');
	const tealLight = new Color('#3B8792');
	const foam = new Color('#CFE3E0');

	const upper = faceted(2.4, 9, 6, 18);
	upper.translate(0, LIP.y, LIP.z - 4.5);
	paintFaces(upper, (x, _y, z) => (z > -1 && hash3(x * 3, 2, z * 3) > 0.4 ? foam : hash3(x * 5, 3, z * 5) > 0.5 ? teal : tealLight));
	const upperMesh = new Mesh(upper, waterMat);
	scene.add(upperMesh);

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

	const upperBase = Float32Array.from(upper.attributes.position.array);
	const poolBase = Float32Array.from(pool.attributes.position.array);
	upper.attributes.position.setUsage(DynamicDrawUsage);
	pool.attributes.position.setUsage(DynamicDrawUsage);

	// ---------- Rideau de la chute ----------
	const fallGeo = new PlaneGeometry(1.5, 1, 6, 14);
	{
		const pos = fallGeo.attributes.position;
		for (let i = 0; i < pos.count; i++) {
			const v = 0.5 - pos.getY(i); // 0 en haut → 1 en bas
			const drop = (LIP.y - POOL_Y) * v;
			const x = pos.getX(i) * (1 + 0.25 * v) + (hash3(pos.getX(i), v, 7) - 0.5) * 0.04;
			pos.setXYZ(i, x, LIP.y - drop, LIP.z + 0.55 * Math.sqrt(drop) + (hash3(x, v, 9) - 0.5) * 0.05);
		}
	}
	const fallMat = new ShaderMaterial({
		side: DoubleSide,
		transparent: true,
		uniforms: {
			uTime: { value: 0 },
			uWater: { value: new Color('#4D9AA4') },
			uFoam: { value: new Color(palette.foam) },
		},
		vertexShader: /* glsl */ `
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: /* glsl */ `
			uniform float uTime;
			uniform vec3 uWater;
			uniform vec3 uFoam;
			varying vec2 vUv;
			float hash(float n) { return fract(sin(n) * 43758.5453); }
			void main() {
				// Filets d'eau longs et fins qui descendent à des vitesses différentes
				float col = floor(vUv.x * 16.0);
				float s = fract(vUv.y * 1.3 + uTime * (0.7 + hash(col) * 0.6) + hash(col + 3.0) * 5.0);
				float streak = smoothstep(0.62, 0.66, s) * (1.0 - smoothstep(0.94, 0.98, s));
				float bottom = smoothstep(0.3, 0.0, vUv.y);
				vec3 water = mix(uWater, uWater * 1.25, hash(col + 7.0));
				vec3 c = mix(water, uFoam, clamp(streak * 0.8 + bottom, 0.0, 1.0));
				gl_FragColor = vec4(c, 0.94);
			}
		`,
	});
	scene.add(new Mesh(fallGeo, fallMat));

	// ---------- Rochers ----------
	const rockMat = new MeshStandardMaterial({ color: '#3F4F53', flatShading: true, roughness: 0.9 });
	const rocks: [number, number, number, number][] = [
		[-1.15, 0.15, 0.95, 0.5], [1.25, 0.1, 1.3, 0.6], [0.95, 0.0, 3.2, 0.35],
		[-0.75, 0.0, 4.3, 0.3], [1.5, 2.95, -0.7, 0.6], [-1.45, 3.0, -1.0, 0.7], [-1.9, 0.3, 2.4, 0.45],
	];
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

	// ---------- Petit kayak dans le contre-courant ----------
	const boat = new Group();
	const { group: kayak } = buildKayak(palette.volt);
	const { group: paddle } = buildPaddle();
	paddle.rotation.x = Math.PI / 2;
	paddle.position.set(0.34, 0.26, 0);
	kayak.add(paddle);
	boat.add(kayak);
	boat.scale.setScalar(0.34);
	scene.add(boat);

	camera.position.set(5.5, 3.6, 8.5);
	const target = new Vector3(0, 1.2, 1);

	start((t, dt) => {
		// Eau amont : file vers le bord de la chute
		const up = upper.attributes.position;
		for (let i = 0; i < up.count; i++) {
			const x = upperBase[i * 3];
			const z = upperBase[i * 3 + 2];
			up.setY(i, upperBase[i * 3 + 1] + Math.sin(z * 3 - t * 5 + x * 2) * 0.03);
		}
		up.needsUpdate = true;

		// Bassin : ondes depuis le point de chute + courant vers l'aval
		const pp = pool.attributes.position;
		for (let i = 0; i < pp.count; i++) {
			const x = poolBase[i * 3];
			const z = poolBase[i * 3 + 2];
			const d = Math.hypot(x - IMPACT.x, z - IMPACT.z);
			pp.setY(i, POOL_Y + Math.sin(d * 5 - t * 4) * 0.06 * Math.exp(-d * 0.5) + Math.sin(z * 2 - t * 3 + x) * 0.025);
		}
		pp.needsUpdate = true;

		fallMat.uniforms.uTime.value = t;

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

		// Le kayak tourne lentement dans le contre-courant du bassin
		const a = t * 0.25;
		boat.position.set(Math.cos(a) * 0.95, POOL_Y + Math.sin(t * 2) * 0.02, 2.1 + Math.sin(a) * 0.7);
		boat.rotation.set(Math.sin(t * 1.7) * 0.06, -a - Math.PI / 2, Math.sin(t * 1.3) * 0.05);

		const k = portraitFactor(camera.aspect);
		camera.position.set(5.5 + pointer.x * 0.9, 3.6 + pointer.y * 0.5, 8.5).sub(target).multiplyScalar(k).add(target);
		camera.lookAt(target);
		fog.near = 11 * k;
		fog.far = 27 * k;
	});
}
