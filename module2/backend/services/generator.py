"""
Question generation using flan-t5-base (local, CPU-only).
Falls back to curated template questions if model output cannot be parsed.
"""
import re
import random
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Singleton model references (loaded once at startup)
_tokenizer = None
_model = None

FALLBACK_QUESTIONS: dict[str, list[dict]] = {
    "Python": [
        {"type": "mcq", "question": "Which data structure does Python use for key-value pairs?",
         "options": {"A": "List", "B": "Tuple", "C": "Dictionary", "D": "Set"}, "answer": "C",
         "answer_text": "Dictionary"},
        {"type": "mcq", "question": "What is the output of `type([])` in Python?",
         "options": {"A": "<class 'tuple'>", "B": "<class 'list'>", "C": "<class 'dict'>", "D": "<class 'set'>"},
         "answer": "B", "answer_text": "<class 'list'>"},
        {"type": "short_answer", "question": "What is a list comprehension in Python? Give an example.",
         "answer": "A list comprehension is a concise way to create lists. Example: [x*2 for x in range(5)] creates [0,2,4,6,8]."},
        {"type": "mcq", "question": "Which keyword is used to define a function in Python?",
         "options": {"A": "func", "B": "define", "C": "def", "D": "function"}, "answer": "C", "answer_text": "def"},
        {"type": "short_answer", "question": "Explain the difference between `is` and `==` in Python.",
         "answer": "`==` checks value equality while `is` checks identity (same object in memory)."},
    ],
    "SQL": [
        {"type": "mcq", "question": "Which SQL clause filters rows after grouping?",
         "options": {"A": "WHERE", "B": "HAVING", "C": "GROUP BY", "D": "ORDER BY"}, "answer": "B",
         "answer_text": "HAVING"},
        {"type": "mcq", "question": "What does INNER JOIN return?",
         "options": {"A": "All rows from left table", "B": "All rows from right table",
                     "C": "Matching rows from both tables", "D": "All rows from both tables"}, "answer": "C",
         "answer_text": "Matching rows from both tables"},
        {"type": "short_answer", "question": "What is a PRIMARY KEY in SQL?",
         "answer": "A PRIMARY KEY uniquely identifies each row in a table. It cannot be NULL and must be unique."},
        {"type": "mcq", "question": "Which SQL function counts rows?",
         "options": {"A": "SUM()", "B": "COUNT()", "C": "AVG()", "D": "MAX()"}, "answer": "B",
         "answer_text": "COUNT()"},
        {"type": "short_answer", "question": "Explain the difference between DELETE and TRUNCATE.",
         "answer": "DELETE removes specific rows and can be rolled back. TRUNCATE removes all rows and is faster but cannot be rolled back."},
    ],
    "Java": [
        {"type": "mcq", "question": "Which concept allows a class to inherit from multiple interfaces in Java?",
         "options": {"A": "Multiple inheritance", "B": "Interface implementation", "C": "Abstract classes",
                     "D": "Polymorphism"}, "answer": "B", "answer_text": "Interface implementation"},
        {"type": "mcq", "question": "What is the default value of an int variable in Java?",
         "options": {"A": "null", "B": "undefined", "C": "0", "D": "-1"}, "answer": "C", "answer_text": "0"},
        {"type": "short_answer", "question": "What is the difference between `==` and `.equals()` in Java?",
         "answer": "`==` compares object references while `.equals()` compares the values of objects."},
        {"type": "mcq", "question": "Which access modifier makes a member visible only within its own class?",
         "options": {"A": "public", "B": "protected", "C": "default", "D": "private"}, "answer": "D",
         "answer_text": "private"},
    ],
    "JavaScript": [
        {"type": "mcq", "question": "Which method adds an element to the end of an array?",
         "options": {"A": "push()", "B": "pop()", "C": "shift()", "D": "unshift()"}, "answer": "A",
         "answer_text": "push()"},
        {"type": "mcq", "question": "What does `typeof null` return in JavaScript?",
         "options": {"A": "null", "B": "undefined", "C": "object", "D": "boolean"}, "answer": "C",
         "answer_text": "object"},
        {"type": "short_answer", "question": "What is a Promise in JavaScript?",
         "answer": "A Promise represents an asynchronous operation that will eventually resolve or reject. It allows chaining .then() and .catch() handlers."},
        {"type": "mcq", "question": "Which keyword declares a block-scoped variable in ES6?",
         "options": {"A": "var", "B": "let", "C": "define", "D": "scope"}, "answer": "B", "answer_text": "let"},
    ],
    "Data Structures": [
        {"type": "mcq", "question": "What is the time complexity of binary search?",
         "options": {"A": "O(n)", "B": "O(n²)", "C": "O(log n)", "D": "O(1)"}, "answer": "C",
         "answer_text": "O(log n)"},
        {"type": "mcq", "question": "Which data structure uses LIFO order?",
         "options": {"A": "Queue", "B": "Stack", "C": "Heap", "D": "Tree"}, "answer": "B",
         "answer_text": "Stack"},
        {"type": "short_answer", "question": "What is the difference between a stack and a queue?",
         "answer": "A stack uses LIFO (Last In First Out) order, while a queue uses FIFO (First In First Out) order."},
    ],
    "Algorithms": [
        {"type": "mcq", "question": "What is the worst-case time complexity of QuickSort?",
         "options": {"A": "O(n log n)", "B": "O(n²)", "C": "O(n)", "D": "O(log n)"}, "answer": "B",
         "answer_text": "O(n²)"},
        {"type": "mcq", "question": "Which algorithm finds the shortest path in an unweighted graph?",
         "options": {"A": "DFS", "B": "BFS", "C": "Dijkstra", "D": "Bellman-Ford"}, "answer": "B",
         "answer_text": "BFS"},
        {"type": "short_answer", "question": "What is dynamic programming?",
         "answer": "Dynamic programming solves complex problems by breaking them into overlapping subproblems and storing their solutions to avoid recomputation (memoization or tabulation)."},
    ],
    "OOP": [
        {"type": "mcq", "question": "Which OOP principle hides internal implementation details?",
         "options": {"A": "Inheritance", "B": "Polymorphism", "C": "Encapsulation", "D": "Abstraction"},
         "answer": "C", "answer_text": "Encapsulation"},
        {"type": "short_answer", "question": "What is polymorphism in OOP?",
         "answer": "Polymorphism allows objects of different types to be treated as the same type through a common interface. It includes method overriding (runtime) and overloading (compile-time)."},
    ],
    "C++": [
        {"type": "mcq", "question": "What is a pointer in C++?",
         "options": {"A": "A variable that stores a value", "B": "A variable that stores a memory address",
                     "C": "A reference to a function", "D": "A type of array"}, "answer": "B",
         "answer_text": "A variable that stores a memory address"},
        {"type": "short_answer", "question": "What is the difference between `new` and `malloc` in C++?",
         "answer": "`new` is a C++ operator that calls constructors and throws exceptions on failure. `malloc` is a C function that allocates raw memory and returns NULL on failure."},
    ],
    "OS": [
        {"type": "mcq", "question": "What is a deadlock in operating systems?",
         "options": {"A": "A process that runs forever", "B": "A situation where processes wait for each other indefinitely",
                     "C": "A memory leak", "D": "A CPU scheduling algorithm"}, "answer": "B",
         "answer_text": "A situation where processes wait for each other indefinitely"},
        {"type": "short_answer", "question": "What is virtual memory?",
         "answer": "Virtual memory is a technique that allows execution of processes not completely in memory by using disk space as an extension of RAM, giving programs the illusion of more memory."},
    ],
    "Networks": [
        {"type": "mcq", "question": "Which protocol operates at the transport layer?",
         "options": {"A": "HTTP", "B": "IP", "C": "TCP", "D": "ARP"}, "answer": "C", "answer_text": "TCP"},
        {"type": "short_answer", "question": "What is the difference between TCP and UDP?",
         "answer": "TCP is connection-oriented, reliable, and ordered. UDP is connectionless, faster, but unreliable. TCP is used for web/email; UDP for streaming/gaming."},
    ],
}


def load_model(cache_dir: Optional[str] = None):
    """Load flan-t5-base model into global singleton."""
    global _tokenizer, _model
    try:
        from transformers import T5Tokenizer, T5ForConditionalGeneration
        import torch
        logger.info("Loading flan-t5-base model...")
        kwargs = {"cache_dir": cache_dir} if cache_dir else {}
        _tokenizer = T5Tokenizer.from_pretrained("google/flan-t5-base", **kwargs)
        _model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base", **kwargs)
        _model.eval()
        logger.info("flan-t5-base loaded successfully.")
    except Exception as e:
        logger.warning(f"Could not load flan-t5-base: {e}. Will use fallback questions.")
        _tokenizer = None
        _model = None


def _generate_text(prompt: str, max_new_tokens: int = 200) -> str:
    if _tokenizer is None or _model is None:
        return ""
    try:
        import torch
        inputs = _tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            outputs = _model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                num_beams=4,
                early_stopping=True,
            )
        return _tokenizer.decode(outputs[0], skip_special_tokens=True)
    except Exception as e:
        logger.warning(f"Generation error: {e}")
        return ""


def _parse_mcq(raw: str) -> Optional[dict]:
    """Parse flan-t5 output into MCQ dict."""
    try:
        q_match = re.search(r'Question:\s*(.+?)(?=A\))', raw, re.DOTALL | re.IGNORECASE)
        a_match = re.search(r'A\)\s*(.+?)(?=B\))', raw, re.DOTALL)
        b_match = re.search(r'B\)\s*(.+?)(?=C\))', raw, re.DOTALL)
        c_match = re.search(r'C\)\s*(.+?)(?=D\))', raw, re.DOTALL)
        d_match = re.search(r'D\)\s*(.+?)(?=Answer:)', raw, re.DOTALL)
        ans_match = re.search(r'Answer:\s*([ABCD])', raw, re.IGNORECASE)

        if not all([q_match, a_match, b_match, c_match, d_match, ans_match]):
            return None

        options = {
            "A": a_match.group(1).strip(),
            "B": b_match.group(1).strip(),
            "C": c_match.group(1).strip(),
            "D": d_match.group(1).strip(),
        }
        answer_letter = ans_match.group(1).upper()
        return {
            "question_text": q_match.group(1).strip(),
            "options": options,
            "answer_key": options[answer_letter],
        }
    except Exception:
        return None


def _parse_short_answer(raw: str) -> Optional[dict]:
    """Parse flan-t5 output into short-answer dict."""
    try:
        q_match = re.search(r'Question:\s*(.+?)(?=Expected Answer:)', raw, re.DOTALL | re.IGNORECASE)
        a_match = re.search(r'Expected Answer:\s*(.+)', raw, re.DOTALL | re.IGNORECASE)
        if not q_match or not a_match:
            return None
        return {
            "question_text": q_match.group(1).strip(),
            "options": None,
            "answer_key": a_match.group(1).strip(),
        }
    except Exception:
        return None


def generate_questions(skill: str, difficulty: str, num: int = 3) -> list[dict]:
    """
    Generate `num` questions for a skill at given difficulty.
    Returns list of dicts: {type, question_text, options, answer_key}
    """
    results = []
    fallbacks = FALLBACK_QUESTIONS.get(skill, FALLBACK_QUESTIONS.get("Python", []))
    fallback_pool = [q for q in fallbacks]
    random.shuffle(fallback_pool)

    mcq_prompt = (
        f"Generate a multiple choice question about {skill} programming at {difficulty} level.\n"
        f"Question: [write question here]\n"
        f"A) [option A]\nB) [option B]\nC) [option C]\nD) [option D]\n"
        f"Answer: [A/B/C/D]"
    )
    sa_prompt = (
        f"Generate a short answer question about {skill} at {difficulty} level.\n"
        f"Question: [write question here]\n"
        f"Expected Answer: [write expected answer here]"
    )

    fallback_idx = 0
    for i in range(num):
        q_type = "mcq" if i % 2 == 0 else "short_answer"
        prompt = mcq_prompt if q_type == "mcq" else sa_prompt
        raw = _generate_text(prompt)

        parsed = None
        if raw:
            parsed = _parse_mcq(raw) if q_type == "mcq" else _parse_short_answer(raw)

        if parsed:
            parsed["type"] = q_type
            results.append(parsed)
        else:
            # Use fallback
            if fallback_idx < len(fallback_pool):
                fb = fallback_pool[fallback_idx]
                fallback_idx += 1
                results.append({
                    "type": fb["type"],
                    "question_text": fb["question"],
                    "options": fb.get("options"),
                    "answer_key": fb.get("answer_text", fb.get("answer", "")),
                })
            # else skip if no fallbacks

    return results
