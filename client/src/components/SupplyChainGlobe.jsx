import { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

export default function SupplyChainGlobe({ shipments = [], disruptions = [], radarData = [], storms = [] }) {
    const globeEl = useRef();
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        // Adjust to container size
        const handleResize = () => {
            if (globeEl.current && globeEl.current.parentElement) {
                setDimensions({
                    width: globeEl.current.parentElement.clientWidth,
                    height: globeEl.current.parentElement.clientHeight || 500
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Center camera roughly on Asia-Europe initial viewport
        if (globeEl.current) {
            globeEl.current.pointOfView({ lat: 25, lng: 90, altitude: 2 });
        }
    }, []);

    // Static node markers
    const nodes = [
        { name: "Shanghai", lat: 31.23, lng: 121.47, type: "port" },
        { name: "Singapore", lat: 1.35, lng: 103.82, type: "port" },
        { name: "Rotterdam", lat: 51.92, lng: 4.47, type: "port" },
        { name: "Detroit", lat: 42.33, lng: -83.04, type: "factory" },
        { name: "Taiwan", lat: 23.69, lng: 120.96, type: "supplier" },
        { name: "Suez", lat: 30.58, lng: 32.26, type: "chokepoint" }
    ];

    const getPointColor = (d) => {
        if (d.type === 'storm') return '#a855f7'; // Purple for storms

        // Active Crisis - Red
        if (disruptions.some(dis => dis.location && dis.location.includes(d.name))) {
            return 'red';
        }
        // Weather Anomaly - Blue
        if (disruptions.some(dis => dis.type === 'weather_anomaly' && dis.location.includes(d.name))) {
            return '#3b82f6';
        }
        // Predictive Risk Forecast - Orange Heatmap
        if (radarData.some(r => r.name === d.name && r.risk > 0.40)) {
            return 'orange';
        }
        return d.type === 'port' ? 'cyan' : d.type === 'factory' ? 'green' : '#4a5568';
    };

    const getPointRadius = (d) => {
        if (d.type === 'storm') return 1.2;
        if (disruptions.some(dis => dis.location && dis.location.includes(d.name))) return 0.8;
        const predicted = radarData.find(r => r.name === d.name);
        if (predicted && predicted.risk > 0.40) return 0.5 + (predicted.risk * 0.5);
        return 0.3;
    };

    // Animated rings for high-risk zones
    const ringsData = [
        ...disruptions
            .filter(d => d.type === 'weather_anomaly')
            .map(d => nodes.find(n => n.name === d.location))
            .filter(Boolean)
            .map(n => ({ ...n, color: '#3b82f6' })),
        ...radarData
            .filter(r => r.risk > 0.6)
            .map(r => nodes.find(n => n.name === r.name))
            .filter(Boolean)
            .map(n => ({ ...n, color: 'orange' }))
    ];

    return (
        <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg border border-slate-100 relative bg-[#0a0f1d]">
            <Globe
                ref={globeEl}
                width={dimensions.width}
                height={dimensions.height}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundColor="#0a0f1d"

                // Nodes & Storms
                pointsData={[...nodes, ...storms.map(s => ({ ...s, type: 'storm' }))]}
                pointLat={d => d.lat}
                pointLng={d => d.lng}
                pointColor={getPointColor}
                pointAltitude={d => d.type === 'storm' ? 0.08 : 0.05}
                pointRadius={getPointRadius}
                pointsMerge={false}

                // Rings for Risk Awareness
                ringsData={ringsData}
                ringColor={d => d.color}
                ringMaxRadius={8}
                ringPropagationSpeed={2}
                ringRepeatPeriod={1500}

                // Arcs for Shipments (Cinematic Upgrade)
                arcsData={shipments}
                arcStartLat={d => d.startLat}
                arcStartLng={d => d.startLng}
                arcEndLat={d => d.endLat}
                arcEndLng={d => d.endLng}
                arcColor={d => d.status === 'delayed' ? ['red', '#ff4d00'] : ['#00d9ff', '#00ff88']}
                arcDashLength={0.4}
                arcDashGap={1}
                arcDashInitialGap={d => (1 - d.progress) * 2}
                arcDashAnimateTime={2000}
                arcStroke={1.5}
            />
        </div>
    );
}
