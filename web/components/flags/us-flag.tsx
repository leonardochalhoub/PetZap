export function USFlag({ className = "" }: { className?: string }) {
  // 13 stripes, blue canton with simplified star pattern.
  // Stripes are 30/13 ≈ 2.31 tall.
  const stripes = Array.from({ length: 13 }, (_, i) => ({
    y: (i * 30) / 13,
    fill: i % 2 === 0 ? "#B22234" : "#FFFFFF",
  }));
  // Simplified 5-row star grid in canton (alternating 6/5 rows)
  const stars: { cx: number; cy: number }[] = [];
  for (let row = 0; row < 9; row++) {
    const isLong = row % 2 === 0;
    const cols = isLong ? 6 : 5;
    const offsetX = isLong ? 1.6 : 3.2;
    for (let col = 0; col < cols; col++) {
      stars.push({ cx: offsetX + col * 3.2, cy: 1.6 + row * 1.6 });
    }
  }
  return (
    <svg viewBox="0 0 60 30" className={className} aria-label="USA" role="img" xmlns="http://www.w3.org/2000/svg">
      {stripes.map((s, i) => (
        <rect key={i} x="0" y={s.y} width="60" height={30 / 13 + 0.2} fill={s.fill} />
      ))}
      <rect x="0" y="0" width="24" height={(30 / 13) * 7} fill="#3C3B6E" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r="0.6" fill="#FFFFFF" />
      ))}
    </svg>
  );
}
