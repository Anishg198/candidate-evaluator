RECOMMENDATION_THRESHOLDS = [
    (85, "strong_hire", "Strong Hire"),
    (70, "hire", "Hire"),
    (55, "maybe", "Maybe — Further Review"),
    (40, "review", "Borderline — Review Needed"),
    (0,  "not_recommended", "Not Recommended"),
]


def compute_cv_score(cv_data: dict | None) -> float:
    if not cv_data:
        return 50.0
    skills = cv_data.get("skills", [])
    years = cv_data.get("totalYearsExperience") or 0
    skill_score = min(len(skills) * 8, 60)
    exp_score = min(years * 8, 40)
    return round(skill_score + exp_score, 1)


def compute_final_score(
    cv: float,
    written: float,
    coding: float,
    interview: float | None = None,
    behavior: float | None = None,
) -> float:
    """
    Adaptive weights depending on which modules were completed.
    Behavior is a 10% signal folded in when present.
    """
    if interview is not None and behavior is not None:
        return round(0.15 * cv + 0.25 * written + 0.20 * interview + 0.10 * behavior + 0.30 * coding, 1)
    if interview is not None:
        return round(0.20 * cv + 0.30 * written + 0.20 * interview + 0.30 * coding, 1)
    if behavior is not None:
        return round(0.20 * cv + 0.35 * written + 0.10 * behavior + 0.35 * coding, 1)
    return round(0.20 * cv + 0.40 * written + 0.40 * coding, 1)


def get_recommendation(score: float) -> tuple[str, str]:
    for threshold, key, label in RECOMMENDATION_THRESHOLDS:
        if score >= threshold:
            return key, label
    return "not_recommended", "Not Recommended"


def build_strengths_concerns(cv_data, written_data, interview_data, coding_data, behavior_score=None) -> tuple[list, list]:
    strengths, concerns = [], []

    if written_data:
        pct = written_data.get("percentage", 0)
        if pct >= 70:
            strengths.append(f"Strong written test performance ({pct:.0f}%)")
        elif pct < 45:
            concerns.append(f"Low written test score ({pct:.0f}%)")
        for item in written_data.get("breakdown", []):
            if item.get("max_points", 0) > 0:
                skill_pct = item["points"] / item["max_points"] * 100
                if skill_pct >= 80:
                    strengths.append(f"Proficient in {item['skill']} ({skill_pct:.0f}%)")
                elif skill_pct < 40:
                    concerns.append(f"Weak in {item['skill']} ({skill_pct:.0f}%)")

    if interview_data:
        pct = interview_data.get("percentage", 0)
        if pct >= 70:
            strengths.append(f"Strong AI interview performance ({pct:.0f}%)")
        elif pct < 45:
            concerns.append(f"Low interview score ({pct:.0f}%)")

    if behavior_score is not None:
        if behavior_score >= 70:
            strengths.append(f"High confidence and engagement throughout assessments ({behavior_score:.0f}%)")
        elif behavior_score < 40:
            concerns.append(f"Showed signs of stress or distraction during assessments ({behavior_score:.0f}%)")

    if coding_data:
        total = coding_data.get("total_score", 0)
        solved = coding_data.get("problems_solved", 0)
        attempted = coding_data.get("problems_attempted", 0)
        if total >= 80:
            strengths.append(f"Excellent coding performance ({total:.0f}%)")
        elif total < 40:
            concerns.append(f"Low coding test score ({total:.0f}%)")
        if solved > 0:
            strengths.append(f"Solved {solved} coding problem(s) completely")
        if attempted < coding_data.get("required_count", 2):
            concerns.append("Did not attempt the required number of coding problems")

    if cv_data:
        skills = cv_data.get("skills", [])
        years = cv_data.get("totalYearsExperience") or 0
        if len(skills) >= 5:
            strengths.append(f"Broad skill set ({len(skills)} skills identified)")
        if years >= 2:
            strengths.append(f"{years:.1f} years of relevant experience")
        elif years == 0 and len(skills) < 3:
            concerns.append("Limited experience and skills detected in CV")

    return strengths, concerns


def generate_summary(name: str, final_score: float, recommendation_label: str, strengths: list, concerns: list) -> str:
    name_part = name or "The candidate"
    lines = [
        f"{name_part} achieved an overall evaluation score of {final_score:.1f}/100, resulting in a '{recommendation_label}' recommendation.",
    ]
    if strengths:
        lines.append(f"Key strengths: {'; '.join(strengths[:3])}.")
    if concerns:
        lines.append(f"Areas of concern: {'; '.join(concerns[:2])}.")
    return " ".join(lines)
