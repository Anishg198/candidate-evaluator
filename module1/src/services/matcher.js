const normalizeSkill = (skill) => skill.trim().toLowerCase()

export function scoreCandidate(candidate, job) {
  // Matching is intentionally lightweight: required skills dominate, preferred skills add a small bonus.
  const required = (job.requirements || []).map(normalizeSkill)
  const preferred = (job.niceToHave || []).map(normalizeSkill)
  const candidateSet = new Set((candidate.skills || []).map(normalizeSkill))

  const requiredMatched = required.filter((skill) => candidateSet.has(skill))
  const preferredMatched = preferred.filter((skill) => candidateSet.has(skill))

  const requiredScore =
    required.length > 0 ? Math.min(100, (requiredMatched.length / required.length) * 100) : 100
  const preferredBonus =
    preferred.length > 0 ? Math.min(10, (preferredMatched.length / preferred.length) * 10) : 0
  const skillScore = Math.min(100, requiredScore + preferredBonus)

  const yrs = Number(candidate.totalYearsExperience || 0)
  const min = Number(job.minExperience || 0)
  let expScore = 10

  // Experience is bucketed rather than treated as a precise regression-style score.
  if (min === 0 || yrs >= min) {
    expScore = 100
  } else if (yrs >= min * 0.75) {
    expScore = 70
  } else if (yrs >= min * 0.5) {
    expScore = 40
  }

  const overallScore = Math.round(((skillScore * 0.7) + (expScore * 0.3)) * 10) / 10

  let recommendation = 'WEAK_MATCH'
  if (overallScore >= 75) recommendation = 'STRONG_MATCH'
  else if (overallScore >= 55) recommendation = 'GOOD_MATCH'
  else if (overallScore >= 35) recommendation = 'PARTIAL_MATCH'

  const matchedSkills = (job.requirements || []).filter((skill) =>
    candidateSet.has(normalizeSkill(skill))
  )
  const missingSkills = (job.requirements || []).filter(
    (skill) => !candidateSet.has(normalizeSkill(skill))
  )

  return {
    jobId: job.id,
    overallScore,
    skillScore,
    expScore,
    matchedSkills,
    missingSkills,
    recommendation,
    calculatedAt: new Date().toISOString()
  }
}
