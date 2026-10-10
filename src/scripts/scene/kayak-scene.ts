// Proto A — kayak de rivière sur une eau low poly.
// Souris : on tourne autour. Clic / bouton : le kayak fait un loop (salto avant).
import {
	Color,
	DirectionalLight,
	DynamicDrawUsage,
	Fog,
	Group,
	HemisphereLight,
	IcosahedronGeometry,
	InstancedMesh,
	Mesh,
	MeshStandardMaterial,
	Object3D,
	PlaneGeometry,
	Vector3,
} from 'three';
import { buildKayak, buildPaddle } from './kayak-model';
import { createStage, palette, portraitFactor } from './stage';

const waveHeight = (x: number, z: number, t: number) =>
	Math.sin(x * 0.9 + t * 1.1) * 0.06 +
	Math.sin(z * 1.3 - t * 0.8) * 0.05 +
	Math.sin((x + z) * 2.1 + t * 1.7) * 0.025;

export function initKayak(canvas: HTMLCanvasElement) {
	const { scene, camera, pointer, reduced, start } = createStage(canvas, {
		fov: 32,
		fogNear: 7,
		fogFar: 20,
		shiftX: 0.2,
		shiftYPortrait: 0,
	});

	const fog = scene.fog as Fog;
	scene.add(new HemisphereLight('#CFE3E0', palette.deep, 1.1));
	const sun = new DirectionalLight('#FFFFFF', 2.4);
	sun.position.set(4, 6, 3);
	scene.add(sun);
	const rim = new DirectionalLight('#9FD8D0', 0.6);
	rim.position.set(-5, 2, -4);
	scene.add(rim);

	// ---------- Eau low poly ----------
	const waterGeo = new PlaneGeometry(26, 26, 42, 42);
	waterGeo.rotateX(-Math.PI / 2);
	const waterPos = waterGeo.attributes.position;
	waterPos.setUsage(DynamicDrawUsage);
	const water = new Mesh(waterGeo, new MeshStandardMaterial({ color: '#1B4850', flatShading: true, roughness: 0.6, metalness: 0 }));
	scene.add(water);

	// ---------- Kayak + pagaie ----------
	const boat = new Group();
	const { group: kayak, hullMat } = buildKayak();
	boat.add(kayak);
	const { group: paddle } = buildPaddle();
	// Pagaie posée en travers du pont, devant le cockpit (enfant du kayak : elle suit le loop)
	paddle.rotation.x = Math.PI / 2;
	const paddlePivot = new Group();
	paddlePivot.add(paddle);
	paddlePivot.position.set(0.5, 0.24, 0);
	paddlePivot.rotation.y = 0.35;
	kayak.add(paddlePivot);
	scene.add(boat);

	// ---------- Éclaboussures ----------
	const SPLASH = 70;
	const drops = new InstancedMesh(
		new IcosahedronGeometry(1, 0),
		new MeshStandardMaterial({ color: palette.foam, flatShading: true, roughness: 0.3 }),
		SPLASH,
	);
	drops.instanceMatrix.setUsage(DynamicDrawUsage);
	scene.add(drops);
	const dummy = new Object3D();
	const particles = Array.from({ length: SPLASH }, () => ({ p: new Vector3(), v: new Vector3(), life: 0, size: 0 }));

	function splash(strength = 1) {
		for (const d of particles) {
			const a = Math.random() * Math.PI * 2;
			const r = 0.4 + Math.random() * 1.1;
			d.p.set(boat.position.x + Math.cos(a) * r * 0.6, 0, boat.position.z + Math.sin(a) * r * 0.35);
			d.v.set(Math.cos(a) * (0.6 + Math.random()), (1.6 + Math.random() * 2.2) * strength, Math.sin(a) * (0.6 + Math.random()));
			d.life = 0.6 + Math.random() * 0.6;
			d.size = 0.025 + Math.random() * 0.05;
		}
	}

	// ---------- Loop ----------
	let loopStart = -1;
	let now = 0;
	const LOOP_TIME = 1.25;
	const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

	function loop() {
		if (reduced || loopStart >= 0) return;
		loopStart = now;
		splash(0.6);
	}
	canvas.addEventListener('click', loop);

	camera.position.set(3.4, 1.7, 3.6);
	const target = new Vector3(0, 0.15, 0);

	start((t, dt) => {
		now = t;

		// Vagues
		for (let i = 0; i < waterPos.count; i++) {
			waterPos.setY(i, waveHeight(waterPos.getX(i), waterPos.getZ(i), t));
		}
		waterPos.needsUpdate = true; // flatShading : normales calculées dans le shader

		// Le kayak suit la houle (tangage / roulis à partir de la pente locale)
		const h = waveHeight(0, 0, t);
		const pitch = (waveHeight(0.5, 0, t) - waveHeight(-0.5, 0, t)) * 0.9;
		const roll = (waveHeight(0, 0.3, t) - waveHeight(0, -0.3, t)) * 0.9;
		boat.position.y = h - 0.04;
		boat.rotation.set(roll, -0.5 + pointer.x * 0.9, pitch);

		if (loopStart >= 0) {
			const p = (t - loopStart) / LOOP_TIME;
			if (p >= 1) {
				loopStart = -1;
				splash(1);
			} else {
				// Salto avant : la pointe plonge, l'arrière passe par-dessus
				kayak.rotation.z = -ease(p) * Math.PI * 2;
				boat.position.y += Math.sin(Math.PI * p) * 1.1;
			}
		}
		if (loopStart < 0) kayak.rotation.z = 0;

		// Gouttes
		for (let i = 0; i < SPLASH; i++) {
			const d = particles[i];
			if (d.life > 0) {
				d.life -= dt;
				d.v.y -= 9.8 * dt;
				d.p.addScaledVector(d.v, dt);
				if (d.p.y < waveHeight(d.p.x, d.p.z, t)) d.life = 0;
			}
			dummy.position.copy(d.p);
			dummy.scale.setScalar(d.life > 0 ? d.size : 0);
			dummy.updateMatrix();
			drops.setMatrixAt(i, dummy.matrix);
		}
		drops.instanceMatrix.needsUpdate = true;

		// Légère parallaxe de caméra (recul automatique en portrait)
		const k = portraitFactor(camera.aspect);
		camera.position.set(3.4 + pointer.x * 0.4, 1.7 + pointer.y * 0.35, 3.6).sub(target).multiplyScalar(k).add(target);
		camera.lookAt(target);
		fog.near = 7 * k;
		fog.far = 20 * k;
	});

	return {
		loop,
		setColor(hex: string) {
			hullMat.color = new Color(hex);
		},
	};
}
