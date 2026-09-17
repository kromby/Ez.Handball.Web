export function GradeBadge({ grade }: { grade: number | null }) {
  if (grade === null) return <span className="grade-chip grade-chip--none">–</span>;
  const tier = grade >= 7 ? "good" : grade < 4 ? "bad" : "mid";
  return <span className={`grade-chip grade-chip--${tier}`}>{grade.toFixed(1)}</span>;
}
