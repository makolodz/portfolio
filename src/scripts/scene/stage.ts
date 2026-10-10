// Socle commun aux prototypes 3D du lab : rendu, redimensionnement, pointeur,
// pause hors écran et respect de prefers-reduced-motion.
import { Clock, Color, Fog, PerspectiveCamera, Scene, Vector2, WebGLRenderer } from 'three';

export const palette = {
	deep: '#0B1416',
	foam: '#ECEFE9',
	mist: '#9AADA9',
	volt: '#D4FF3A',
};

export interface StageOptions {
	fov?: number;
	fogNear: number;
	fogFar: number;
	/** Décalage du sujet (fraction de la largeur) : >0 = vers la droite en paysage */
	shiftX?: number;
	/** Décalage vertical du sujet sur mobile (fraction de la hauteur) : >0 = vers le haut */
	shiftYPortrait?: number;
	/** Appelé après la première image rendue (pour un fondu d'apparition) */
	onReady?: () => void;
}

export type Update = (t: number, dt: number) => void;

export function createStage(canvas: HTMLCanvasElement, opts: StageOptions) {
	const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

	const scene = new Scene();
	scene.background = new Color(palette.deep);
	scene.fog = new Fog(palette.deep, opts.fogNear, opts.fogFar);

	const camera = new PerspectiveCamera(opts.fov ?? 35, 1, 0.1, 100);
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const desktop = window.matchMedia('(min-width: 64rem)');

	// Pointeur lissé, de -1 à 1 sur la zone du canvas
	const pointer = new Vector2();
	const pointerTarget = new Vector2();
	if (!reduced) {
		window.addEventListener(
			'pointermove',
			(e) => {
				const r = canvas.getBoundingClientRect();
				if (e.clientY < r.top || e.clientY > r.bottom) return;
				pointerTarget.set(
					Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)),
					Math.max(-1, Math.min(1, -((e.clientY - r.top) / r.height) * 2 + 1)),
				);
			},
			{ passive: true },
		);
	}

	let update: Update = () => {};
	let ready = false;
	let t = 0;
	const clock = new Clock();

	function frame() {
		const dt = Math.min(clock.getDelta(), 0.05);
		t += dt;
		pointer.lerp(pointerTarget, 0.05);
		update(t, dt);
		renderer.render(scene, camera);
		if (!ready) {
			ready = true;
			opts.onReady?.();
		}
	}

	function resize() {
		const { clientWidth: w, clientHeight: h } = canvas;
		if (!w || !h) return;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		// Desktop : texte à gauche, on décale le sujet vers la droite sans changer la perspective.
		// Mobile : la scène est un bloc au-dessus du texte, sujet centré.
		if (desktop.matches) camera.setViewOffset(w, h, -w * (opts.shiftX ?? 0), 0, w, h);
		else camera.setViewOffset(w, h, 0, h * (opts.shiftYPortrait ?? 0), w, h);
		camera.updateProjectionMatrix();
		if (reduced && started) frame();
	}
	let started = false;
	new ResizeObserver(resize).observe(canvas);
	resize();

	function start(fn: Update) {
		update = fn;
		started = true;
		if (reduced) {
			// Image fixe : on pose la scène à un instant « joli », sans animation
			t = 1.2;
			frame();
			return;
		}
		let visible = false;
		let raf = 0;
		const loop = () => {
			frame();
			raf = requestAnimationFrame(loop);
		};
		const sync = () => {
			const run = visible && !document.hidden;
			if (run && !raf) {
				clock.getDelta();
				raf = requestAnimationFrame(loop);
			} else if (!run && raf) {
				cancelAnimationFrame(raf);
				raf = 0;
			}
		};
		new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			sync();
		}).observe(canvas);
		document.addEventListener('visibilitychange', sync);
	}

	return { renderer, scene, camera, pointer, reduced, start };
}

/** En portrait le champ horizontal rétrécit : on recule la caméra pour garder le sujet entier */
export function portraitFactor(aspect: number) {
	return aspect < 1 ? Math.min(1.9, 0.95 / aspect) : 1;
}

/** Bruit déterministe pour décaler les sommets (mêmes coordonnées → même décalage, donc pas de fissures) */
export function hash3(x: number, y: number, z: number) {
	const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
	return s - Math.floor(s);
}
