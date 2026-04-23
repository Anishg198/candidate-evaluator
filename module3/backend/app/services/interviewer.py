"""
AI Interview Service — curated question bank with keyword scoring.
No ML models required; instant startup.
"""
import random
from typing import Optional

# ---------------------------------------------------------------------------
# Question bank
# Each entry: {q, ideal, keywords, type}
# ---------------------------------------------------------------------------
QUESTION_BANK: dict[str, list[dict]] = {
    "Python": [
        {
            "q": "What is the difference between a list and a tuple in Python?",
            "ideal": "A list is mutable and can be changed after creation, while a tuple is immutable. Tuples are faster and can be used as dictionary keys. Lists use square brackets, tuples use parentheses.",
            "keywords": ["mutable", "immutable", "tuple", "list", "dictionary key", "brackets", "parentheses"],
        },
        {
            "q": "Explain Python decorators. What problem do they solve?",
            "ideal": "A decorator is a function that wraps another function to extend its behaviour without modifying it. They use the @ syntax. Common uses include logging, authentication, and caching.",
            "keywords": ["wrap", "function", "behaviour", "syntax", "logging", "authentication", "caching", "modify"],
        },
        {
            "q": "What is the GIL in Python and how does it affect concurrency?",
            "ideal": "The Global Interpreter Lock prevents multiple native threads from executing Python bytecode simultaneously. It limits true multi-core parallelism. Use multiprocessing or async for CPU-bound and I/O-bound concurrency respectively.",
            "keywords": ["global interpreter lock", "threads", "parallel", "multiprocessing", "async", "cpu", "io"],
        },
        {
            "q": "Explain list comprehensions and when you would use a generator instead.",
            "ideal": "List comprehensions create a complete list in memory at once. Generators use lazy evaluation, yielding values one at a time, which is more memory efficient for large datasets.",
            "keywords": ["comprehension", "generator", "memory", "lazy", "yield", "efficient", "iteration"],
        },
        {
            "q": "What are Python's *args and **kwargs? Give a use case.",
            "ideal": "*args collects extra positional arguments as a tuple. **kwargs collects extra keyword arguments as a dict. Useful for writing flexible functions that accept variable numbers of arguments.",
            "keywords": ["positional", "keyword", "tuple", "dict", "variable", "flexible", "arguments"],
        },
    ],
    "SQL": [
        {
            "q": "What is the difference between INNER JOIN and LEFT JOIN?",
            "ideal": "INNER JOIN returns only rows with matching values in both tables. LEFT JOIN returns all rows from the left table plus matching rows from the right table. Non-matching rows on the right get NULL values.",
            "keywords": ["inner", "left", "matching", "null", "both tables", "all rows"],
        },
        {
            "q": "Explain database indexing. When should you use it and when should you avoid it?",
            "ideal": "An index is a data structure that speeds up data retrieval by avoiding full table scans. Use indexes on frequently queried columns and foreign keys. Avoid them on small tables or columns with many write operations since indexes slow down INSERT, UPDATE, DELETE.",
            "keywords": ["index", "retrieval", "query", "scan", "write", "insert", "update", "foreign key"],
        },
        {
            "q": "What is database normalization? Briefly explain the first three normal forms.",
            "ideal": "Normalization reduces redundancy. 1NF: all columns atomic, no repeating groups. 2NF: no partial dependencies on composite keys. 3NF: no transitive dependencies — every non-key column depends only on the primary key.",
            "keywords": ["redundancy", "1nf", "2nf", "3nf", "atomic", "dependency", "primary key", "normalization"],
        },
        {
            "q": "Explain the difference between WHERE and HAVING clauses.",
            "ideal": "WHERE filters rows before grouping. HAVING filters groups after a GROUP BY clause. You cannot use aggregate functions like SUM or COUNT in WHERE but can in HAVING.",
            "keywords": ["where", "having", "group by", "aggregate", "filter", "sum", "count", "before", "after"],
        },
        {
            "q": "What is a stored procedure and what are its advantages?",
            "ideal": "A stored procedure is a precompiled SQL block stored in the database. Advantages include reusability, reduced network traffic, improved performance through precompilation, and centralized business logic.",
            "keywords": ["precompiled", "stored", "reusable", "network", "performance", "logic"],
        },
    ],
    "Java": [
        {
            "q": "What is the difference between an abstract class and an interface in Java?",
            "ideal": "An abstract class can have concrete methods and instance variables. An interface (before Java 8) only has abstract methods. A class can implement multiple interfaces but extend only one abstract class. Use interfaces for contracts, abstract classes for partial implementations.",
            "keywords": ["abstract", "interface", "multiple", "extend", "implement", "concrete", "contract"],
        },
        {
            "q": "Explain Java's garbage collection mechanism.",
            "ideal": "Java automatically manages memory via the garbage collector. It identifies objects with no references and frees their memory. The JVM uses generational GC — young and old generations. Developers don't manually free memory, reducing memory leaks.",
            "keywords": ["garbage", "memory", "jvm", "references", "automatic", "generational", "leak"],
        },
        {
            "q": "What is the difference between == and .equals() in Java?",
            "ideal": "== compares object references — whether two variables point to the same object in memory. .equals() compares the content or value. For strings, use .equals() to compare values.",
            "keywords": ["reference", "equals", "content", "value", "memory", "string", "comparison"],
        },
        {
            "q": "Explain exception handling in Java. What is the difference between checked and unchecked exceptions?",
            "ideal": "Checked exceptions must be declared or caught — they extend Exception. Unchecked exceptions extend RuntimeException and don't need declaration. Use try-catch-finally to handle exceptions. finally always runs for cleanup.",
            "keywords": ["checked", "unchecked", "exception", "runtime", "try", "catch", "finally", "extend"],
        },
    ],
    "JavaScript": [
        {
            "q": "Explain closures in JavaScript with an example.",
            "ideal": "A closure is a function that retains access to its outer scope variables even after the outer function has returned. They're used for data privacy, currying, and callbacks. For example, a counter function that keeps its count variable private.",
            "keywords": ["closure", "scope", "outer", "variable", "retain", "private", "function", "return"],
        },
        {
            "q": "What is the JavaScript event loop and how does it handle asynchronous code?",
            "ideal": "JavaScript is single-threaded with an event loop. The call stack executes code, async operations go to the Web APIs, then callbacks are queued in the callback queue. The event loop moves callbacks to the stack when it's empty. Promises use the microtask queue which has priority.",
            "keywords": ["event loop", "call stack", "single thread", "async", "callback", "promise", "microtask", "queue"],
        },
        {
            "q": "What is the difference between let, const, and var in JavaScript?",
            "ideal": "var is function-scoped and hoisted. let and const are block-scoped and not hoisted. const cannot be reassigned but its properties can be mutated. let can be reassigned. Prefer const by default, use let when reassignment is needed, avoid var.",
            "keywords": ["var", "let", "const", "scope", "hoisted", "block", "function", "reassigned"],
        },
        {
            "q": "Explain Promises and async/await in JavaScript.",
            "ideal": "Promises represent eventual values. They have three states: pending, fulfilled, rejected. async/await is syntactic sugar over promises making async code look synchronous. await pauses execution until the promise resolves. Use try/catch for error handling.",
            "keywords": ["promise", "async", "await", "pending", "fulfilled", "rejected", "synchronous", "error"],
        },
    ],
    "C++": [
        {
            "q": "What is the difference between stack and heap memory in C++?",
            "ideal": "Stack memory is automatically managed, fast, and limited in size. It holds local variables and is LIFO. Heap memory is manually managed with new/delete, slower, but much larger. Memory leaks happen when heap memory isn't freed.",
            "keywords": ["stack", "heap", "automatic", "manual", "new", "delete", "leak", "local", "lifo"],
        },
        {
            "q": "Explain virtual functions and polymorphism in C++.",
            "ideal": "Virtual functions allow runtime polymorphism — calling overridden methods via base class pointers. The vtable (virtual table) stores function pointers. Pure virtual functions create abstract classes. This enables the open/closed principle.",
            "keywords": ["virtual", "polymorphism", "vtable", "override", "base", "derived", "abstract", "runtime"],
        },
        {
            "q": "What are smart pointers in C++? Name the main types.",
            "ideal": "Smart pointers automatically manage memory. unique_ptr gives sole ownership and deletes on scope exit. shared_ptr uses reference counting for shared ownership. weak_ptr avoids circular reference issues. They prevent memory leaks.",
            "keywords": ["smart pointer", "unique_ptr", "shared_ptr", "weak_ptr", "ownership", "reference counting", "leak"],
        },
    ],
    "Data Structures": [
        {
            "q": "Explain the difference between a stack and a queue. Give a real-world use case for each.",
            "ideal": "A stack is LIFO — last in first out. Used for undo operations, function call stacks, DFS. A queue is FIFO — first in first out. Used for print queues, BFS, task scheduling.",
            "keywords": ["lifo", "fifo", "stack", "queue", "undo", "bfs", "dfs", "scheduling"],
        },
        {
            "q": "What is a hash table and how does it handle collisions?",
            "ideal": "A hash table stores key-value pairs. A hash function maps keys to indices. Collision resolution: chaining uses linked lists at each bucket; open addressing probes for the next available slot. Average O(1) lookup.",
            "keywords": ["hash", "collision", "chaining", "open addressing", "key-value", "bucket", "o(1)", "lookup"],
        },
        {
            "q": "Explain binary search trees. What are their time complexities?",
            "ideal": "A BST has the property: left child < parent < right child. Average search, insert, delete are O(log n). Worst case is O(n) with a skewed tree. Balanced BSTs like AVL and Red-Black trees guarantee O(log n).",
            "keywords": ["binary", "left", "right", "parent", "o(log n)", "balanced", "avl", "search", "insert"],
        },
        {
            "q": "When would you use a linked list over an array?",
            "ideal": "Use a linked list when you need frequent insertions and deletions at arbitrary positions — O(1) vs O(n) for arrays. Arrays are better for random access (O(1) vs O(n) for linked lists) and better cache locality.",
            "keywords": ["insertion", "deletion", "random access", "cache", "o(1)", "o(n)", "pointer", "node"],
        },
    ],
    "Algorithms": [
        {
            "q": "What is the time complexity of quicksort? When does it perform poorly?",
            "ideal": "Quicksort averages O(n log n) but degrades to O(n²) in the worst case when the pivot is always the smallest or largest element, e.g., already sorted arrays. Randomized pivot selection mitigates this.",
            "keywords": ["quicksort", "o(n log n)", "o(n²)", "pivot", "worst case", "sorted", "random"],
        },
        {
            "q": "Explain dynamic programming. What are its two key properties?",
            "ideal": "Dynamic programming solves problems by breaking them into overlapping subproblems and caching results. The two properties are optimal substructure (solution built from sub-solutions) and overlapping subproblems. Examples: Fibonacci, knapsack, longest common subsequence.",
            "keywords": ["overlapping", "subproblem", "memoization", "optimal substructure", "cache", "fibonacci", "knapsack"],
        },
        {
            "q": "What is the difference between BFS and DFS? When would you use each?",
            "ideal": "BFS explores level by level using a queue, finding shortest paths in unweighted graphs. DFS explores depth first using a stack or recursion, good for topological sort, cycle detection, and exhaustive search.",
            "keywords": ["bfs", "dfs", "queue", "stack", "level", "shortest path", "topological", "cycle"],
        },
        {
            "q": "Explain the concept of Big O notation.",
            "ideal": "Big O describes an algorithm's time or space complexity as input grows, focusing on the dominant term. O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) like mergesort, O(n²) quadratic. It describes worst-case upper bound.",
            "keywords": ["big o", "complexity", "o(1)", "o(n)", "o(log n)", "worst case", "dominant", "input grows"],
        },
    ],
    "OOP": [
        {
            "q": "Explain the four pillars of object-oriented programming.",
            "ideal": "Encapsulation: hiding internal state, exposing via methods. Abstraction: hiding complexity behind interfaces. Inheritance: classes extending other classes to reuse code. Polymorphism: same interface, different implementations.",
            "keywords": ["encapsulation", "abstraction", "inheritance", "polymorphism", "interface", "hiding", "reuse"],
        },
        {
            "q": "What is the SOLID principle? Briefly describe each.",
            "ideal": "S: Single Responsibility — one reason to change. O: Open/Closed — open for extension, closed for modification. L: Liskov Substitution — subtypes replaceable with parent. I: Interface Segregation — small interfaces. D: Dependency Inversion — depend on abstractions.",
            "keywords": ["solid", "single responsibility", "open closed", "liskov", "interface segregation", "dependency inversion"],
        },
        {
            "q": "What is the difference between composition and inheritance? When do you prefer composition?",
            "ideal": "Inheritance is an is-a relationship; composition is has-a. Composition is more flexible, avoids deep hierarchies, and doesn't break encapsulation. Prefer composition when the relationship isn't truly is-a or when you need to change behaviour at runtime.",
            "keywords": ["composition", "inheritance", "is-a", "has-a", "flexible", "hierarchy", "encapsulation"],
        },
    ],
    "OS": [
        {
            "q": "What is the difference between a process and a thread?",
            "ideal": "A process is an independent program with its own memory space. A thread runs within a process and shares its memory. Threads are lighter weight and faster to create. Context switching between threads is cheaper than between processes.",
            "keywords": ["process", "thread", "memory", "shared", "independent", "context switch", "lightweight"],
        },
        {
            "q": "What is deadlock? Name the four necessary conditions.",
            "ideal": "Deadlock is when processes are stuck waiting for resources held by each other. Four conditions: mutual exclusion, hold and wait, no preemption, circular wait. Prevention involves eliminating at least one condition.",
            "keywords": ["deadlock", "mutual exclusion", "hold and wait", "preemption", "circular wait", "resource", "prevention"],
        },
        {
            "q": "What is virtual memory and what problem does it solve?",
            "ideal": "Virtual memory provides an abstraction of physical RAM using paging or segmentation. It allows programs to use more memory than physically available by swapping pages to disk. It also isolates processes, preventing them from accessing each other's memory.",
            "keywords": ["virtual memory", "paging", "swap", "physical", "abstraction", "isolation", "disk"],
        },
    ],
    "Networks": [
        {
            "q": "What is the difference between TCP and UDP? When would you use each?",
            "ideal": "TCP is reliable, connection-oriented, guarantees order and delivery. UDP is connectionless, faster, no guaranteed delivery. Use TCP for web, email, file transfer. Use UDP for video streaming, gaming, DNS where speed matters over reliability.",
            "keywords": ["tcp", "udp", "reliable", "connectionless", "ordered", "streaming", "dns", "delivery"],
        },
        {
            "q": "Explain what happens when you type a URL in a browser and press Enter.",
            "ideal": "DNS resolves the domain to an IP address. TCP connection established via 3-way handshake. HTTPS negotiates TLS certificate. HTTP request sent to server. Server processes and sends HTTP response. Browser parses HTML, fetches resources, renders page.",
            "keywords": ["dns", "ip", "tcp", "handshake", "http", "https", "tls", "render", "request"],
        },
        {
            "q": "Briefly explain the OSI model and its layers.",
            "ideal": "7 layers: Physical (bits over wire), Data Link (MAC, frames), Network (IP, routing), Transport (TCP/UDP, ports), Session (connections), Presentation (encoding/encryption), Application (HTTP, FTP). Each layer serves the one above it.",
            "keywords": ["physical", "data link", "network", "transport", "session", "application", "ip", "tcp", "osi"],
        },
    ],
    "Machine Learning": [
        {
            "q": "What is overfitting and how do you prevent it?",
            "ideal": "Overfitting is when a model learns training data too well including noise, performing poorly on new data. Prevention: regularization (L1/L2), dropout, early stopping, cross-validation, more training data, reducing model complexity.",
            "keywords": ["overfitting", "regularization", "dropout", "cross-validation", "training", "noise", "complexity", "early stopping"],
        },
        {
            "q": "Explain the difference between supervised and unsupervised learning.",
            "ideal": "Supervised learning trains on labelled data — predicting outputs for inputs. Examples: classification, regression. Unsupervised learning finds patterns in unlabelled data. Examples: clustering (K-means), dimensionality reduction (PCA).",
            "keywords": ["supervised", "unsupervised", "labelled", "classification", "regression", "clustering", "kmeans", "pca"],
        },
        {
            "q": "What is gradient descent and why is it important?",
            "ideal": "Gradient descent is an optimization algorithm that minimizes a loss function by iteratively stepping in the direction of steepest descent (negative gradient). Variants include SGD, mini-batch, Adam. It's the backbone of neural network training.",
            "keywords": ["gradient", "descent", "loss", "minimize", "sgd", "adam", "optimization", "neural", "learning rate"],
        },
    ],
}

BEHAVIORAL_QUESTIONS = [
    {
        "q": "Tell me about the most technically challenging project you've worked on. What was your role and how did you overcome the challenges?",
        "ideal": "Describes a specific project, own contribution, technical challenges encountered, problem solving approach, and outcome.",
        "keywords": ["project", "challenge", "solved", "approach", "team", "outcome", "learned", "technical"],
    },
    {
        "q": "Describe a situation where you had to learn a new technology quickly under pressure. How did you handle it?",
        "ideal": "Shows adaptability, mentions resources used (docs, courses, colleagues), structured approach to learning, and successful delivery.",
        "keywords": ["learn", "quickly", "resources", "documentation", "practice", "deliver", "adapt", "deadline"],
    },
    {
        "q": "Tell me about a time you disagreed with a technical decision made by your team. What did you do?",
        "ideal": "Shows communication skills, ability to voice concerns constructively, respect for team decisions, and follow-through.",
        "keywords": ["communication", "discuss", "team", "opinion", "consensus", "reason", "respect", "outcome"],
    },
    {
        "q": "How do you approach debugging a complex issue you've never seen before?",
        "ideal": "Systematic approach: reproduce the issue, isolate variables, check logs, form hypotheses, use debugger tools, search documentation, ask for help when stuck.",
        "keywords": ["reproduce", "isolate", "logs", "hypothesis", "debug", "systematic", "tools", "search"],
    },
    {
        "q": "Where do you see your career in the next 3-5 years and how does this role fit into that plan?",
        "ideal": "Shows self-awareness, clear goals, alignment with role responsibilities and growth opportunities, genuine interest in the company.",
        "keywords": ["goal", "growth", "learn", "career", "skills", "contribution", "role", "future"],
    },
]


# ---------------------------------------------------------------------------
# Question selection
# ---------------------------------------------------------------------------

def select_questions(skills: list[str], num_technical: int = 3, num_behavioral: int = 2) -> list[dict]:
    selected = []
    used_skills = set()

    # Cycle through skills to pick technical questions
    for skill in skills:
        if len([q for q in selected if q["category"] == "technical"]) >= num_technical:
            break
        bank = QUESTION_BANK.get(skill, [])
        if bank and skill not in used_skills:
            q = random.choice(bank)
            selected.append({**q, "skill": skill, "category": "technical"})
            used_skills.add(skill)

    # If not enough unique skills, add from remaining skills (allow repeats)
    remaining_skills = [s for s in skills if s not in used_skills] + list(skills)
    for skill in remaining_skills:
        if len([q for q in selected if q["category"] == "technical"]) >= num_technical:
            break
        bank = QUESTION_BANK.get(skill, [])
        if bank:
            already_qs = {q["q"] for q in selected}
            candidates = [q for q in bank if q["q"] not in already_qs]
            if candidates:
                q = random.choice(candidates)
                selected.append({**q, "skill": skill, "category": "technical"})

    # Pad with Python if still short
    if len([q for q in selected if q["category"] == "technical"]) < num_technical:
        python_bank = QUESTION_BANK.get("Python", [])
        already_qs = {q["q"] for q in selected}
        for q in python_bank:
            if len([x for x in selected if x["category"] == "technical"]) >= num_technical:
                break
            if q["q"] not in already_qs:
                selected.append({**q, "skill": "Python", "category": "technical"})

    # Add behavioral questions
    behavioral_pool = BEHAVIORAL_QUESTIONS.copy()
    random.shuffle(behavioral_pool)
    for bq in behavioral_pool[:num_behavioral]:
        selected.append({**bq, "skill": "Behavioral", "category": "behavioral"})

    return selected


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def score_answer(answer: str, keywords: list[str]) -> float:
    if not answer or not answer.strip():
        return 0.0

    answer_lower = answer.lower()
    words = answer.split()

    # Keyword matching (0-1)
    if keywords:
        matched = sum(1 for kw in keywords if kw.lower() in answer_lower)
        kw_score = matched / len(keywords)
    else:
        kw_score = 0.5

    # Length score — reward substantive answers (>=30 words = full score)
    length_score = min(1.0, len(words) / 30)

    # Weighted: 70% keywords, 30% length
    raw = kw_score * 0.7 + length_score * 0.3
    return round(min(10.0, raw * 10), 2)
