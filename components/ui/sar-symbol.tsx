import Image from "next/image";

interface SARSymbolProps {
  size?: number;
  className?: string;
}

export function SARSymbol({ size = 13, className = "" }: SARSymbolProps) {
  return (
    <Image
      src="/Saudi_Riyal_Symbol.svg.png"
      alt="﷼"
      width={size}
      height={Math.round(size * 1.12)}
      className={`inline-block ${className}`}
      style={{ verticalAlign: "middle", marginBottom: "1px" }}
      unoptimized
    />
  );
}
