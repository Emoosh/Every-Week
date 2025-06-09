import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useRef } from "react";
// import { Leva, useControls } from "leva"; // Bu satırı silin
import { useMediaQuery } from "react-responsive";
import { MathUtils } from 'three';

const Model = ({ isMobile, isTablet }) => {
    const { scene } = useGLTF("/model.glb");
    const modelRef = useRef();

    // Fare hareketine göre modeli hareket ettir
    useFrame(({ mouse }) => {
        if (modelRef.current) {
            if (!isMobile && !isTablet) {
                // Hedef konumu hesapla ve sınırla
                const targetX = Math.max(15, Math.min(20, 17.5 + mouse.x * 5)); // Sağa-sola hareket
                const targetY = Math.max(-14, Math.min(-10, -12 + mouse.y * 5)); // Yukarı-aşağı hareket

                // lerp fonksiyonu ile geçişi yumuşat
                modelRef.current.position.x = MathUtils.lerp(modelRef.current.position.x, targetX, 0.1);
                modelRef.current.position.y = MathUtils.lerp(modelRef.current.position.y, targetY, 0.1);
            } else {
                // Mobil veya tablette modelin pozisyonunu sabit tut
                modelRef.current.position.x = 17.5;
                modelRef.current.position.y = -12;
            }
        }
    });

    return (
        <primitive
            ref={modelRef} // Model referansı
            object={scene}
            scale={isMobile ? 4.9 : 5}
            position={[17.5, -12, 9]}
            rotation={isMobile ? [0, 0.3, 0] : [0, 0.2, 0]}
        />
    );
};

export default function Hero() {
    // useControls hook'larını silin
    /* 
    const position = useControls('Position', {
        x: { value: 0, min: -30, max: 30 },
        y: { value: 0, min: -30, max: 30 },
        z: { value: 0, min: -30, max: 30 }
    });

    const scale = useControls('Scale', {
        value: 1, min: 0.1, max: 10
    });

    const rotation = useControls('Rotation', {
        rotationX: { value: 0, min: 0, max: 360 },
        rotationY: { value: 0, min: 0, max: 360 },
        rotationZ: { value: 0, min: 0, max: 360 }
    });
    */

    const isMobile = useMediaQuery({ maxWidth: 768 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

    return (
        <section className="min-h-screen w-full flex flex-col relative" id="home">
            <div className="w-full mx-auto flex flex-col sm:mt-36 mt-20 c-space gap-3 z-5">
                <p className="sm:text-3xl text-xl font-extrabold text-white text-center font-generalsans">
                    Uni-League
                </p>
                <p className="sm:text-3xl text-2xl text-white text-center font-generalsans">Üniversite E-Spor Ligi</p>
            </div>

            <div className="w-full h-full absolute inset-0">
                {/* <Leva /> Bu satırı silin */}
                <Canvas className="w-full h-full">
                    <Suspense fallback={<Html><div>Model Yükleniyor...</div></Html>}>
                        <PerspectiveCamera makeDefault position={[0, 0, 30]} />
                        <Model
                            isMobile={isMobile}
                            isTablet={isTablet}
                            // position, scale, rotation prop'larını silin çünkü artık useControls yok
                        />
                        <ambientLight intensity={1} />
                        <directionalLight position={[2, 5, 5]} />
                    </Suspense>
                </Canvas>
            </div>
        </section>
    );
}