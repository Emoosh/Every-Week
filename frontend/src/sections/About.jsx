import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

const universities = [
    { name: "Hacettepe Üniversitesi", radius: 12, speed: 0.1, color: "red" },
    { name: "ODTÜ", radius: 15, speed: 0.08, color: "blue" },
    { name: "Bilkent", radius: 20, speed: 0.06, color: "green" },
    { name: "Ankara Üniversitesi", radius: 25, speed: 0.04, color: "yellow" },
];

const Planet = ({ radius, speed, color, name }) => {
    const planetRef = useRef();
    useFrame(({ clock }) => {
        const elapsed = clock.getElapsedTime();
        const angle = elapsed * speed;
        planetRef.current.position.x = radius * Math.cos(angle);
        planetRef.current.position.z = radius * Math.sin(angle);
    });

    return (
        <mesh ref={planetRef}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={color} />
            <Html distanceFactor={10}>
                <div style={{ color: "white", fontSize: "12px", textAlign: "center" }}>{name}</div>
            </Html>
        </mesh>
    );
};

const SolarSystem = () => {
    return (
        <div style={{ width: "100vw", height: "100vh", backgroundColor: "black" }}>
            <Canvas>
                {/* Kamera yukarıdan aşağıya bakacak şekilde yerleştirildi */}
                <PerspectiveCamera makeDefault position={[0, 50, 0]} rotation={[-Math.PI / 2, 0, 0]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[0, 0, 0]} intensity={1.5} />

                {/* Güneş */}
                <mesh>
                    <sphereGeometry args={[5, 64, 32]} />
                    <meshStandardMaterial emissive={"orange"} emissiveIntensity={1} />
                </mesh>

                {/* Gezegenler */}
                {universities.map((uni, idx) => (
                    <Planet key={idx} {...uni} />
                ))}

                {/* OrbitControls - döndürme ve zoom kontrolü */}
                <OrbitControls
                    enableRotate={false} // Rotasyonu kapatmak için
                    enablePan={true} // Etrafı gezmek için
                    enableZoom={false} // Yakınlaştırma ve uzaklaştırma
                />
            </Canvas>
        </div>
    );
};

export default SolarSystem;
