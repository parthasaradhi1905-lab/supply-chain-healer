import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const NODE_COLORS = {
    supplier: 0x00ff88,
    port: 0x00bfff,
    factory: 0xff6600,
    warehouse: 0xffcc00,
    retailer: 0xff44aa,
};

const NODE_GEOMETRY = {
    supplier: () => new THREE.SphereGeometry(0.6, 16, 16),
    port: () => new THREE.CylinderGeometry(0.4, 0.6, 0.8, 6),
    factory: () => new THREE.BoxGeometry(1, 1, 1),
    warehouse: () => new THREE.CylinderGeometry(0.5, 0.5, 0.6, 8),
    retailer: () => new THREE.OctahedronGeometry(0.5),
};

function layoutNodes(nodes) {
    const typeGroups = {};
    nodes.forEach(n => {
        if (!typeGroups[n.type]) typeGroups[n.type] = [];
        typeGroups[n.type].push(n);
    });

    const layerX = { supplier: -12, port: -5, factory: 0, warehouse: 6, retailer: 12 };
    const positions = {};

    Object.entries(typeGroups).forEach(([type, group]) => {
        const x = layerX[type] || 0;
        const spacing = 3.5;
        const startZ = -((group.length - 1) * spacing) / 2;
        group.forEach((node, i) => {
            positions[node.id] = { x, y: 0, z: startZ + i * spacing };
        });
    });

    return positions;
}

export default function DigitalTwin3D({ graphData, activeDisruptions = [] }) {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const animationRef = useRef(null);
    const meshesRef = useRef({});
    const linesRef = useRef([]);
    const [tooltip, setTooltip] = useState(null);

    useEffect(() => {
        if (!mountRef.current || !graphData) return;

        const container = mountRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight || 500;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0e17);
        scene.fog = new THREE.FogExp2(0x0a0e17, 0.012);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
        camera.position.set(0, 18, 28);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lights
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        scene.add(ambient);
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(10, 20, 10);
        scene.add(directional);
        const point = new THREE.PointLight(0x00ff88, 0.4, 50);
        point.position.set(-10, 10, -10);
        scene.add(point);

        // Grid floor
        const grid = new THREE.GridHelper(40, 40, 0x1a2040, 0x111830);
        grid.position.y = -2;
        scene.add(grid);

        // Layout
        const positions = layoutNodes(graphData.nodes);

        // Nodes
        graphData.nodes.forEach(node => {
            const geomFn = NODE_GEOMETRY[node.type] || NODE_GEOMETRY.supplier;
            const geometry = geomFn();
            const color = NODE_COLORS[node.type] || 0xffffff;
            const material = new THREE.MeshPhongMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.2,
                shininess: 80,
                transparent: true,
                opacity: 0.9,
            });
            const mesh = new THREE.Mesh(geometry, material);
            const pos = positions[node.id] || { x: 0, y: 0, z: 0 };
            mesh.position.set(pos.x, pos.y, pos.z);
            mesh.userData = node;
            scene.add(mesh);
            meshesRef.current[node.id] = mesh;

            // Glow ring
            const ringGeo = new THREE.RingGeometry(0.8, 1.0, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.set(pos.x, -1.8, pos.z);
            ring.rotation.x = -Math.PI / 2;
            scene.add(ring);
        });

        // Edges
        graphData.edges.forEach(edge => {
            const srcPos = positions[edge.source];
            const tgtPos = positions[edge.target];
            if (!srcPos || !tgtPos) return;

            const isDisrupted = edge.disrupted || false;
            const lineColor = isDisrupted ? 0xff2222 : 0x334466;
            const lineOpacity = isDisrupted ? 0.9 : 0.4;

            const points = [];
            const src = new THREE.Vector3(srcPos.x, srcPos.y, srcPos.z);
            const tgt = new THREE.Vector3(tgtPos.x, tgtPos.y, tgtPos.z);
            const mid = new THREE.Vector3().addVectors(src, tgt).multiplyScalar(0.5);
            mid.y += 1.5;

            const curve = new THREE.QuadraticBezierCurve3(src, mid, tgt);
            const curvePoints = curve.getPoints(30);
            points.push(...curvePoints);

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: lineColor,
                transparent: true,
                opacity: lineOpacity,
                linewidth: isDisrupted ? 2 : 1,
            });
            const line = new THREE.Line(geometry, material);
            line.userData = { ...edge, isDisrupted };
            scene.add(line);
            linesRef.current.push(line);

            // Moving particle on route
            const particleGeo = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMat = new THREE.MeshBasicMaterial({
                color: isDisrupted ? 0xff4444 : 0x00ff88,
            });
            const particle = new THREE.Mesh(particleGeo, particleMat);
            particle.userData = { curve, progress: Math.random(), speed: isDisrupted ? 0.001 : 0.003 };
            scene.add(particle);
            linesRef.current.push(particle);
        });

        // Mouse orbit (simple)
        let isDragging = false;
        let prevMouse = { x: 0, y: 0 };
        let orbitAngle = { x: 0.4, y: 0 };
        const orbitRadius = 35;

        const onMouseDown = (e) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
        const onMouseUp = () => { isDragging = false; };
        const onMouseMove = (e) => {
            if (!isDragging) return;
            const dx = (e.clientX - prevMouse.x) * 0.005;
            const dy = (e.clientY - prevMouse.y) * 0.005;
            orbitAngle.y += dx;
            orbitAngle.x = Math.max(0.1, Math.min(1.2, orbitAngle.x + dy));
            prevMouse = { x: e.clientX, y: e.clientY };
        };
        const onWheel = (e) => {
            camera.position.multiplyScalar(e.deltaY > 0 ? 1.05 : 0.95);
        };

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('wheel', onWheel);

        // Tooltip on hover
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const onHover = (e) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const meshArray = Object.values(meshesRef.current);
            const intersects = raycaster.intersectObjects(meshArray);
            if (intersects.length > 0) {
                const data = intersects[0].object.userData;
                setTooltip({ label: data.label || data.id, type: data.type, x: e.clientX - rect.left, y: e.clientY - rect.top });
            } else {
                setTooltip(null);
            }
        };
        renderer.domElement.addEventListener('mousemove', onHover);

        // Animation loop
        let time = 0;
        const animate = () => {
            animationRef.current = requestAnimationFrame(animate);
            time += 0.01;

            // Orbit camera
            camera.position.x = orbitRadius * Math.sin(orbitAngle.y) * Math.cos(orbitAngle.x);
            camera.position.y = orbitRadius * Math.sin(orbitAngle.x);
            camera.position.z = orbitRadius * Math.cos(orbitAngle.y) * Math.cos(orbitAngle.x);
            camera.lookAt(0, 0, 0);

            // Animate disrupted lines (pulse)
            linesRef.current.forEach(obj => {
                if (obj.userData?.isDisrupted && obj.material) {
                    obj.material.opacity = 0.5 + 0.4 * Math.sin(time * 4);
                }
                if (obj.userData?.curve) {
                    obj.userData.progress += obj.userData.speed;
                    if (obj.userData.progress > 1) obj.userData.progress = 0;
                    const pt = obj.userData.curve.getPoint(obj.userData.progress);
                    obj.position.copy(pt);
                }
            });

            // Gentle node hover
            Object.values(meshesRef.current).forEach(mesh => {
                mesh.position.y = Math.sin(time * 1.5 + mesh.position.x * 0.3) * 0.15;
            });

            renderer.render(scene, camera);
        };
        animate();

        // Resize
        const onResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight || 500;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(animationRef.current);
            renderer.domElement.removeEventListener('mousedown', onMouseDown);
            renderer.domElement.removeEventListener('mouseup', onMouseUp);
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            renderer.domElement.removeEventListener('wheel', onWheel);
            renderer.domElement.removeEventListener('mousemove', onHover);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [graphData]);

    return (
        <div className="relative w-full" style={{ height: '100%', minHeight: 500 }}>
            <div ref={mountRef} className="w-full h-full" />
            {tooltip && (
                <div
                    className="absolute pointer-events-none px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                        left: tooltip.x + 12,
                        top: tooltip.y - 30,
                        background: 'rgba(10, 14, 23, 0.92)',
                        border: '1px solid rgba(0,255,136,0.3)',
                        color: '#00ff88',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <span className="uppercase tracking-wider opacity-60 text-[10px]">{tooltip.type}</span>
                    <br />
                    {tooltip.label}
                </div>
            )}
            {/* Legend */}
            <div
                className="absolute bottom-4 left-4 px-4 py-3 rounded-xl text-xs"
                style={{
                    background: 'rgba(10, 14, 23, 0.85)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <div className="font-semibold text-white/80 mb-2">Node Types</div>
                {Object.entries(NODE_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: `#${color.toString(16).padStart(6, '0')}` }} />
                        <span className="text-white/60 capitalize">{type}</span>
                    </div>
                ))}
                <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-0.5 bg-red-500 inline-block" />
                        <span className="text-red-400">Disrupted Route</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
