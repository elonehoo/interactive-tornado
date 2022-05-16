import * as THREE from "https://cdn.skypack.dev/three@0.133.1/build/three.module";
import { GUI } from "https://cdn.skypack.dev/lil-gui@0.16.1";

const container = document.querySelector('.container');

const config = {
    height: 1.1,
    density: 2.5,
    curl: 12,
};

class Controls {
    constructor() {
        const gui = new GUI();
        if (window.innerWidth < 600) gui.close();

        gui.add(config, 'height', 1, 1.8).step(.01).onChange(v => {
            viz.material.uniforms.u_height.value = v;
        });
        gui.add(config, 'density', 1, 4).step(.1).onChange(v => {
            viz.material.uniforms.u_density.value = v;
        });
        gui.add(config, 'curl', 4, 20).step(.1).onChange(v => {
            viz.material.uniforms.u_curl.value = v;
        });
    }
}

class Viz {

    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setClearColor(0xffffff, 0);
        container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.z = 2.9;
        this.camera.position.y = 1.1;
        this.camera.lookAt(0, 0, 0);

        this.rotationY = -.4 * Math.PI;

        this.raycaster = new THREE.Raycaster();

        this.mouse = new THREE.Vector2(0, 0);
        this.mouseTarget = new THREE.Vector2(0, 0);
        this.wind = new THREE.Vector2(0, 0);

        this.clock = new THREE.Clock();

        this.setupScene();
        this.render();
    }

    setupScene() {

        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff
        });
        const planeGeometry = new THREE.PlaneGeometry(2000, 1000);
        this.floor = new THREE.Mesh(planeGeometry, planeMaterial);
        this.floor.position.set(0, -2, 0);
        this.floor.rotation.set(-.2 * Math.PI, 0, 0);
        this.scene.add(this.floor);

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { type: 'f', value: 0 },
                u_height: { type: 'f', value: config.height },
                u_density: { type: 'f', value: config.density },
                u_curl: { type: 'f', value: config.curl },
                u_wind: { type: 'v2', value: new THREE.Vector2(0, 0) },
            },
            vertexShader: document.getElementById("vertexShader").textContent,
            fragmentShader: document.getElementById("fragmentShader").textContent,
            side: THREE.DoubleSide,
            transparent: true
        });
        const curve = new THREE.LineCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 1, 0),
        );
        const geometry = new THREE.TubeGeometry(curve, 512, .55, 512, false);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(0, -.65, 0);
        this.mesh.rotation.set(0, this.rotationY, 0);
        this.scene.add(this.mesh);
    }


    addCanvasEvents() {
        container.addEventListener('mousemove', (e) => {
            updateMousePosition(e.clientX, e.clientY, this);
        });
        container.addEventListener('touchmove', (e) => {
            updateMousePosition(e.touches[0].pageX, e.touches[0].pageY, this);
        });
		

        function updateMousePosition(eX, eY, viz) {
            const x = eX - container.offsetLeft;
            const y = eY - container.offsetTop;
            viz.mouseTarget.x = x / container.offsetWidth * 2 - 1;
            viz.mouseTarget.y = -(y / container.offsetHeight) * 2 + 1;
        }
    }

    render() {
        this.material.uniforms.u_time.value = 1.3 * this.clock.getElapsedTime();

        this.mouse.x += (this.mouseTarget.x - this.mouse.x) * .1;
        this.mouse.y += (this.mouseTarget.y - this.mouse.y) * .1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.floor);
        if (intersects.length) {
            this.wind = new THREE.Vector2(intersects[0].uv.x - .5, .5 - intersects[0].uv.y)
                .rotateAround(new THREE.Vector2(0, 0), this.rotationY)
                .multiplyScalar(200);
            this.material.uniforms.u_wind.value = this.wind;
        }

        this.renderer.render(this.scene, this.camera);
    }

    loop() {
        this.render();
        requestAnimationFrame(this.loop.bind(this));
    }

    updateSize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
}


const controls = new Controls();
const viz = new Viz();
viz.addCanvasEvents();
viz.updateSize();
viz.loop();

window.addEventListener('resize', () => viz.updateSize());
