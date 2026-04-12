"""
Grading service:
- MCQ: exact match (case-insensitive trim)
- Short answer: cosine similarity via sentence-transformers all-MiniLM-L6-v2
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_st_model = None


def load_sentence_model(cache_dir: Optional[str] = None):
    global _st_model
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading all-MiniLM-L6-v2...")
        kwargs = {"cache_folder": cache_dir} if cache_dir else {}
        _st_model = SentenceTransformer("all-MiniLM-L6-v2", **kwargs)
        logger.info("Sentence transformer loaded.")
    except Exception as e:
        logger.warning(f"Could not load sentence-transformers: {e}")
        _st_model = None


def grade_mcq(candidate_answer: str, answer_key: str, max_points: float = 10.0) -> tuple[bool, float]:
    """Returns (is_correct, points_awarded)."""
    correct = candidate_answer.strip().lower() == answer_key.strip().lower()
    return correct, max_points if correct else 0.0


def grade_short_answer(candidate_answer: str, answer_key: str, max_points: float = 10.0) -> tuple[float, float]:
    """Returns (similarity_score 0–1, points_awarded 0–max_points)."""
    if not candidate_answer.strip():
        return 0.0, 0.0

    if _st_model is None:
        # Fallback: simple word overlap
        cand_words = set(candidate_answer.lower().split())
        ans_words = set(answer_key.lower().split())
        if not ans_words:
            return 0.0, 0.0
        overlap = len(cand_words & ans_words) / len(ans_words)
        similarity = min(overlap, 1.0)
        return round(similarity, 4), round(similarity * max_points, 2)

    try:
        import numpy as np
        embeddings = _st_model.encode([candidate_answer, answer_key], normalize_embeddings=True)
        similarity = float(np.dot(embeddings[0], embeddings[1]))
        similarity = max(0.0, min(1.0, similarity))
        points = round(similarity * max_points, 2)
        return round(similarity, 4), points
    except Exception as e:
        logger.warning(f"Similarity error: {e}")
        return 0.0, 0.0
