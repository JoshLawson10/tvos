interface OrbProps {
  color: string;
  size: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  animation: string;
}

export default function Orb({
  color,
  size,
  top,
  left,
  right,
  bottom,
  animation,
}: OrbProps) {
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        top,
        left,
        right,
        bottom,
        animation,
        willChange: "transform",
        pointerEvents: "none",
      }}
    />
  );
}
