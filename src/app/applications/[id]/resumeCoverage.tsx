import { Badge, Card } from "@/components/ui";
import type { FitAnalysis } from "@/domain/fit";
import { coverableKeywords, keywordCoverage, resumeSearchText } from "@/domain/keywordCoverage";
import type { TailoredResume } from "@/domain/resume";

// How many of the posting's keywords the resume actually contains, counted from its text.
export function ResumeCoverage({ resume, fit }: { resume: TailoredResume; fit: FitAnalysis }) {
  const { covered, missing } = keywordCoverage(coverableKeywords(fit), resumeSearchText(resume));
  const total = covered.length + missing.length;
  if (total === 0) return null;
  return (
    <Card>
      <p className="text-sm font-medium">
        Keywords in this resume: {covered.length} of {total}
      </p>
      {missing.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
          <span>Not in the text:</span>
          {missing.map((k) => (
            <Badge key={k} tone="warn">
              {k}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">Every keyword your profile backs is in the resume.</p>
      )}
    </Card>
  );
}
