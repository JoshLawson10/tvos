interface OrbProps {
  color: string;
  size: string;
  animation: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
}

export default function Orb({
  color,
  size,
  animation,
  top,
  left,
  right,
  bottom,
}: OrbProps) {
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, ${color.replace(/[\d.]+\)$/, "0)")} 70%)`,
        top,
        left,
        right,
        bottom,
        animation,
        filter: "blur(2px)",
      }}
    />
  );
}
