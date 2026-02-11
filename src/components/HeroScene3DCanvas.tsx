import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';

function ShoppingBag() {
  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={1.5}>
      <group rotation={[0.2, -0.3, 0]}>
        {/* Bag body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.6, 1.8, 1]} />
          <MeshDistortMaterial color="hsl(145, 63%, 49%)" distort={0.15} speed={2} roughness={0.3} />
        </mesh>
        {/* Handle left */}
        <mesh position={[-0.45, 1.3, 0]} rotation={[0, 0, -0.2]}>
          <torusGeometry args={[0.35, 0.06, 8, 20, Math.PI]} />
          <meshStandardMaterial color="hsl(145, 63%, 40%)" />
        </mesh>
        {/* Handle right */}
        <mesh position={[0.45, 1.3, 0]} rotation={[0, 0, 0.2]}>
          <torusGeometry args={[0.35, 0.06, 8, 20, Math.PI]} />
          <meshStandardMaterial color="hsl(145, 63%, 40%)" />
        </mesh>
        {/* Star decoration */}
        <mesh position={[0, 0.1, 0.55]}>
          <octahedronGeometry args={[0.25]} />
          <meshStandardMaterial color="hsl(36, 100%, 50%)" emissive="hsl(36, 100%, 50%)" emissiveIntensity={0.3} />
        </mesh>
      </group>
    </Float>
  );
}

function FloatingOrbs() {
  return (
    <>
      <Float speed={3} rotationIntensity={1} floatIntensity={2}>
        <mesh position={[2, 1.5, -1]}>
          <sphereGeometry args={[0.2]} />
          <MeshDistortMaterial color="hsl(207, 71%, 53%)" distort={0.4} speed={3} />
        </mesh>
      </Float>
      <Float speed={2.5} rotationIntensity={0.8} floatIntensity={1.8}>
        <mesh position={[-1.8, -1, -0.5]}>
          <dodecahedronGeometry args={[0.25]} />
          <MeshDistortMaterial color="hsl(145, 63%, 60%)" distort={0.3} speed={2} />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={1.2} floatIntensity={1}>
        <mesh position={[1.5, -1.5, 0.5]}>
          <icosahedronGeometry args={[0.18]} />
          <meshStandardMaterial color="hsl(36, 100%, 60%)" emissive="hsl(36, 100%, 50%)" emissiveIntensity={0.2} />
        </mesh>
      </Float>
    </>
  );
}

export default function HeroScene3DCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-3, 2, 2]} intensity={0.5} color="hsl(145, 63%, 49%)" />
      <ShoppingBag />
      <FloatingOrbs />
    </Canvas>
  );
}
