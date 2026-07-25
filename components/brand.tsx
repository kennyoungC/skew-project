import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Biasly News home">
      <span className="brand__mark">biasly</span>
      <span className="brand__label">News</span>
    </Link>
  );
}
