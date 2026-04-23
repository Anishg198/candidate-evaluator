"""Seed sample coding problems. Run: python seed.py"""
import asyncio
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://hcl_user:hcl_pass@localhost:5432/hcl_db")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Language IDs: 71=Python3, 63=JavaScript, 62=Java, 54=C++

PROBLEMS = [
    {
        "id": "prob-001",
        "title": "Two Sum",
        "description": (
            "Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers "
            "that add up to `target`.\n\n"
            "You may assume exactly one solution exists. Return the smaller index first."
        ),
        "difficulty": "easy",
        "examples": [
            {"input": "nums = [2,7,11,15], target = 9", "output": "[0, 1]", "explanation": "nums[0] + nums[1] = 2 + 7 = 9"},
            {"input": "nums = [3,2,4], target = 6", "output": "[1, 2]", "explanation": "nums[1] + nums[2] = 2 + 4 = 6"},
        ],
        "constraints": "2 ≤ n ≤ 10^4 | -10^9 ≤ nums[i] ≤ 10^9 | Exactly one valid answer",
        "visible_test_cases": [
            {"id": 1, "input": "4\n2 7 11 15\n9", "expected_output": "0 1"},
            {"id": 2, "input": "3\n3 2 4\n6", "expected_output": "1 2"},
        ],
        "hidden_test_cases": [
            {"id": 3, "input": "2\n3 3\n6", "expected_output": "0 1"},
            {"id": 4, "input": "4\n3 2 4 6\n8", "expected_output": "1 3"},
        ],
        "starter_code": {
            "71": "def twoSum(nums: list, target: int) -> list:\n    pass\n",
            "63": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    \n}\n",
            "62": (
                "import java.util.*;\n\npublic class Solution {\n"
                "    public static int[] twoSum(int[] nums, int target) {\n"
                "        // your code here\n"
                "        return new int[]{};\n"
                "    }\n"
                "\n"
                "    public static void main(String[] args) {\n"
                "        Scanner sc = new Scanner(System.in);\n"
                "        int n = sc.nextInt();\n"
                "        int[] nums = new int[n];\n"
                "        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n"
                "        int target = sc.nextInt();\n"
                "        int[] r = twoSum(nums, target);\n"
                "        System.out.println(r[0] + \" \" + r[1]);\n"
                "    }\n"
                "}\n"
            ),
            "54": (
                "#include <bits/stdc++.h>\nusing namespace std;\n\n"
                "vector<int> twoSum(vector<int>& nums, int target) {\n"
                "    // your code here\n"
                "    return {};\n"
                "}\n\n"
                "int main() {\n"
                "    int n; cin >> n;\n"
                "    vector<int> nums(n);\n"
                "    for (int i = 0; i < n; i++) cin >> nums[i];\n"
                "    int target; cin >> target;\n"
                "    auto r = twoSum(nums, target);\n"
                "    cout << r[0] << \" \" << r[1] << endl;\n"
                "    return 0;\n"
                "}\n"
            ),
        },
        "wrappers": {
            "71": (
                "\nn = int(input())\n"
                "nums = list(map(int, input().split()))\n"
                "target = int(input())\n"
                "result = twoSum(nums, target)\n"
                "print(*result)\n"
            ),
            "63": (
                "\nconst _lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\n"
                "const _n = parseInt(_lines[0]);\n"
                "const _nums = _lines[1].split(' ').map(Number);\n"
                "const _target = parseInt(_lines[2]);\n"
                "console.log(twoSum(_nums, _target).join(' '));\n"
            ),
            "62": "",
            "54": "",
        },
        "time_limit_seconds": 5,
        "memory_limit_mb": 128,
    },
    {
        "id": "prob-002",
        "title": "FizzBuzz",
        "description": (
            "Given an integer `n`, return a list of strings for each number from `1` to `n`:\n\n"
            "- `\"FizzBuzz\"` if divisible by both 3 and 5\n"
            "- `\"Fizz\"` if divisible by 3\n"
            "- `\"Buzz\"` if divisible by 5\n"
            "- The number itself (as a string) otherwise\n\n"
            "Print each result on a new line."
        ),
        "difficulty": "easy",
        "examples": [
            {"input": "n = 5", "output": "1\n2\nFizz\n4\nBuzz", "explanation": "3 → Fizz, 5 → Buzz"},
        ],
        "constraints": "1 ≤ n ≤ 10^4",
        "visible_test_cases": [
            {"id": 1, "input": "15", "expected_output": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz"},
            {"id": 2, "input": "5", "expected_output": "1\n2\nFizz\n4\nBuzz"},
        ],
        "hidden_test_cases": [
            {"id": 3, "input": "1", "expected_output": "1"},
            {"id": 4, "input": "30", "expected_output": "\n".join(
                "FizzBuzz" if i % 15 == 0 else "Fizz" if i % 3 == 0 else "Buzz" if i % 5 == 0 else str(i)
                for i in range(1, 31)
            )},
        ],
        "starter_code": {
            "71": "def fizzBuzz(n: int) -> list:\n    pass\n",
            "63": "/**\n * @param {number} n\n * @return {string[]}\n */\nfunction fizzBuzz(n) {\n    \n}\n",
            "62": (
                "import java.util.*;\n\npublic class Solution {\n"
                "    public static List<String> fizzBuzz(int n) {\n"
                "        // your code here\n"
                "        return new ArrayList<>();\n"
                "    }\n"
                "\n"
                "    public static void main(String[] args) {\n"
                "        Scanner sc = new Scanner(System.in);\n"
                "        int n = sc.nextInt();\n"
                "        for (String s : fizzBuzz(n)) System.out.println(s);\n"
                "    }\n"
                "}\n"
            ),
            "54": (
                "#include <bits/stdc++.h>\nusing namespace std;\n\n"
                "vector<string> fizzBuzz(int n) {\n"
                "    // your code here\n"
                "    return {};\n"
                "}\n\n"
                "int main() {\n"
                "    int n; cin >> n;\n"
                "    for (auto& s : fizzBuzz(n)) cout << s << '\\n';\n"
                "    return 0;\n"
                "}\n"
            ),
        },
        "wrappers": {
            "71": (
                "\nn = int(input())\n"
                "for s in fizzBuzz(n):\n"
                "    print(s)\n"
            ),
            "63": (
                "\nconst _lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\n"
                "const _n = parseInt(_lines[0]);\n"
                "console.log(fizzBuzz(_n).join('\\n'));\n"
            ),
            "62": "",
            "54": "",
        },
        "time_limit_seconds": 5,
        "memory_limit_mb": 128,
    },
    {
        "id": "prob-003",
        "title": "Palindrome Check",
        "description": (
            "Given a string `s`, determine if it is a **palindrome** — it reads the same forwards and backwards.\n\n"
            "Consider **only alphanumeric characters** and **ignore case**.\n\n"
            "Return `true` if palindrome, `false` otherwise."
        ),
        "difficulty": "medium",
        "examples": [
            {"input": "s = \"racecar\"", "output": "true", "explanation": "racecar reversed is racecar"},
            {"input": "s = \"hello\"", "output": "false", "explanation": "hello reversed is olleh"},
            {"input": "s = \"A man a plan a canal Panama\"", "output": "true", "explanation": "Alphanumeric only, case-insensitive"},
        ],
        "constraints": "1 ≤ len(s) ≤ 10^5 | s consists of printable ASCII characters",
        "visible_test_cases": [
            {"id": 1, "input": "racecar", "expected_output": "true"},
            {"id": 2, "input": "hello", "expected_output": "false"},
            {"id": 3, "input": "A man a plan a canal Panama", "expected_output": "true"},
        ],
        "hidden_test_cases": [
            {"id": 4, "input": " ", "expected_output": "true"},
            {"id": 5, "input": "Was it a car or a cat I saw", "expected_output": "true"},
            {"id": 6, "input": "OpenAI", "expected_output": "false"},
        ],
        "starter_code": {
            "71": "def isPalindrome(s: str) -> bool:\n    pass\n",
            "63": "/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isPalindrome(s) {\n    \n}\n",
            "62": (
                "import java.util.*;\n\npublic class Solution {\n"
                "    public static boolean isPalindrome(String s) {\n"
                "        // your code here\n"
                "        return false;\n"
                "    }\n"
                "\n"
                "    public static void main(String[] args) {\n"
                "        Scanner sc = new Scanner(System.in);\n"
                "        String s = sc.nextLine();\n"
                "        System.out.println(isPalindrome(s));\n"
                "    }\n"
                "}\n"
            ),
            "54": (
                "#include <bits/stdc++.h>\nusing namespace std;\n\n"
                "bool isPalindrome(string s) {\n"
                "    // your code here\n"
                "    return false;\n"
                "}\n\n"
                "int main() {\n"
                "    string s;\n"
                "    getline(cin, s);\n"
                "    cout << (isPalindrome(s) ? \"true\" : \"false\") << endl;\n"
                "    return 0;\n"
                "}\n"
            ),
        },
        "wrappers": {
            "71": (
                "\ns = input()\n"
                "print('true' if isPalindrome(s) else 'false')\n"
            ),
            "63": (
                "\nconst _lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\n"
                "console.log(isPalindrome(_lines[0]) ? 'true' : 'false');\n"
            ),
            "62": "",
            "54": "",
        },
        "time_limit_seconds": 5,
        "memory_limit_mb": 128,
    },
    # ── Extra problems for random pool ─────────────────────────────────────────
    {
        "id": "prob-004",
        "title": "Reverse String",
        "description": (
            "Given a string `s`, return it **reversed**.\n\n"
            "Do not use any built-in reverse functions."
        ),
        "difficulty": "easy",
        "examples": [
            {"input": "s = \"hello\"", "output": "olleh"},
            {"input": "s = \"OpenAI\"", "output": "IAnepO"},
        ],
        "constraints": "1 ≤ len(s) ≤ 10^5",
        "visible_test_cases": [
            {"id": 1, "input": "hello", "expected_output": "olleh"},
            {"id": 2, "input": "OpenAI", "expected_output": "IAnepO"},
        ],
        "hidden_test_cases": [
            {"id": 3, "input": "a", "expected_output": "a"},
            {"id": 4, "input": "abcde", "expected_output": "edcba"},
        ],
        "starter_code": {
            "71": "def reverseString(s: str) -> str:\n    pass\n",
            "63": "function reverseString(s) {\n    \n}\n",
            "62": (
                "import java.util.*;\npublic class Solution {\n"
                "    public static String reverseString(String s) {\n        return \"\";\n    }\n"
                "    public static void main(String[] args) {\n"
                "        Scanner sc = new Scanner(System.in);\n"
                "        System.out.println(reverseString(sc.nextLine()));\n"
                "    }\n}\n"
            ),
            "54": (
                "#include <bits/stdc++.h>\nusing namespace std;\n"
                "string reverseString(string s) {\n    return \"\";\n}\n"
                "int main() {\n    string s; getline(cin, s);\n    cout << reverseString(s) << endl;\n}\n"
            ),
        },
        "wrappers": {
            "71": "\ns = input()\nprint(reverseString(s))\n",
            "63": "\nconst _l = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconsole.log(reverseString(_l[0]));\n",
            "62": "", "54": "",
        },
        "time_limit_seconds": 5,
        "memory_limit_mb": 128,
    },
    {
        "id": "prob-005",
        "title": "Count Vowels",
        "description": (
            "Given a string `s`, return the **number of vowels** (a, e, i, o, u — both upper and lower case) in it."
        ),
        "difficulty": "easy",
        "examples": [
            {"input": "s = \"Hello World\"", "output": "3"},
            {"input": "s = \"rhythm\"", "output": "0"},
        ],
        "constraints": "1 ≤ len(s) ≤ 10^5",
        "visible_test_cases": [
            {"id": 1, "input": "Hello World", "expected_output": "3"},
            {"id": 2, "input": "rhythm", "expected_output": "0"},
        ],
        "hidden_test_cases": [
            {"id": 3, "input": "AEIOU", "expected_output": "5"},
            {"id": 4, "input": "The quick brown fox", "expected_output": "5"},
        ],
        "starter_code": {
            "71": "def countVowels(s: str) -> int:\n    pass\n",
            "63": "function countVowels(s) {\n    \n}\n",
            "62": (
                "import java.util.*;\npublic class Solution {\n"
                "    public static int countVowels(String s) {\n        return 0;\n    }\n"
                "    public static void main(String[] args) {\n"
                "        Scanner sc = new Scanner(System.in);\n"
                "        System.out.println(countVowels(sc.nextLine()));\n"
                "    }\n}\n"
            ),
            "54": (
                "#include <bits/stdc++.h>\nusing namespace std;\n"
                "int countVowels(string s) {\n    return 0;\n}\n"
                "int main() {\n    string s; getline(cin, s);\n    cout << countVowels(s) << endl;\n}\n"
            ),
        },
        "wrappers": {
            "71": "\ns = input()\nprint(countVowels(s))\n",
            "63": "\nconst _l = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconsole.log(countVowels(_l[0]));\n",
            "62": "", "54": "",
        },
        "time_limit_seconds": 5,
        "memory_limit_mb": 128,
    },
    {
        "id": "prob-006",
        "title": "Valid Parentheses",
        "description": (
            "Given a string `s` containing only `(`, `)`, `{`, `}`, `[`, `]`, "
            "determine if the input string is **valid**.\n\n"
            "A string is valid if:\n"
            "- Open brackets are closed by the same type of bracket.\n"
            "- Open brackets are closed in the correct order."
        ),
        "difficulty": "medium",
        "examples": [
            {"input": "s = \"()[]{}\"", "output": "true"},
            {"input": "s = \"(]\"", "output": "false"},
            {"input": "s = \"{[]}\"", "output": "true"},
        ],
        "constraints": "1 ≤ len(s) ≤ 10^4 | s consists only of bracket characters",
        "visible_test_cases": [
            {"id": 1, "input": "()[]{}", "expected_output": "true"},
            {"id": 2, "input": "(]", "expected_output": "false"},
        ],
        "hidden_test_cases": [
            {"id": 3, "input": "{[]}", "expected_output": "true"},
            {"id": 4, "input": "([)]", "expected_output": "false"},
            {"id": 5, "input": "", "expected_output": "true"},
        ],
        "starter_code": {
            "71": "def isValid(s: str) -> bool:\n    pass\n",
            "63": "function isValid(s) {\n    \n}\n",
            "62": (
                "import java.util.*;\npublic class Solution {\n"
                "    public static boolean isValid(String s) {\n        return false;\n    }\n"
                "    public static void main(String[] args) {\n"
                "        Scanner sc = new Scanner(System.in);\n"
                "        String line = sc.hasNextLine() ? sc.nextLine() : \"\";\n"
                "        System.out.println(isValid(line));\n"
                "    }\n}\n"
            ),
            "54": (
                "#include <bits/stdc++.h>\nusing namespace std;\n"
                "bool isValid(string s) {\n    return false;\n}\n"
                "int main() {\n    string s; getline(cin, s);\n    cout << (isValid(s)?\"true\":\"false\") << endl;\n}\n"
            ),
        },
        "wrappers": {
            "71": "\ns = input() if __import__('sys').stdin.readable() else ''\nprint('true' if isValid(s) else 'false')\n",
            "63": "\nconst _l = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconsole.log(isValid(_l[0] || '') ? 'true' : 'false');\n",
            "62": "", "54": "",
        },
        "time_limit_seconds": 5,
        "memory_limit_mb": 128,
    },
    {
        "id": "prob-007",
        "title": "Maximum Subarray",
        "description": (
            "Given an integer array `nums`, find the **contiguous subarray** (containing at least one number) "
            "which has the **largest sum** and return its sum.\n\n"
            "This is Kadane's algorithm."
        ),
        "difficulty": "medium",
        "examples": [
            {"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6", "explanation": "[4,-1,2,1] has the largest sum = 6"},
            {"input": "nums = [1]", "output": "1"},
        ],
        "constraints": "1 ≤ n ≤ 10^5 | -10^4 ≤ nums[i] ≤ 10^4",
        "visible_test_cases": [
            {"id": 1, "input": "9\n-2 1 -3 4 -1 2 1 -5 4", "expected_output": "6"},
            {"id": 2, "input": "1\n1", "expected_output": "1"},
        ],
        "hidden_test_cases": [
            {"id": 3, "input": "5\n5 4 -1 7 8", "expected_output": "23"},
            {"id": 4, "input": "4\n-3 -2 -1 -4", "expected_output": "-1"},
        ],
        "starter_code": {
            "71": "def maxSubArray(nums: list) -> int:\n    pass\n",
            "63": "function maxSubArray(nums) {\n    \n}\n",
            "62": (
                "import java.util.*;\npublic class Solution {\n"
                "    public static int maxSubArray(int[] nums) {\n        return 0;\n    }\n"
                "    public static void main(String[] args) {\n"
                "        Scanner sc = new Scanner(System.in);\n"
                "        int n = sc.nextInt();\n"
                "        int[] nums = new int[n];\n"
                "        for (int i=0;i<n;i++) nums[i]=sc.nextInt();\n"
                "        System.out.println(maxSubArray(nums));\n"
                "    }\n}\n"
            ),
            "54": (
                "#include <bits/stdc++.h>\nusing namespace std;\n"
                "int maxSubArray(vector<int>& nums) {\n    return 0;\n}\n"
                "int main() {\n    int n; cin>>n; vector<int> v(n);\n"
                "    for(int i=0;i<n;i++) cin>>v[i];\n    cout<<maxSubArray(v)<<endl;\n}\n"
            ),
        },
        "wrappers": {
            "71": "\nn = int(input())\nnums = list(map(int, input().split()))\nprint(maxSubArray(nums))\n",
            "63": "\nconst _l = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst _nums = _l[1].split(' ').map(Number);\nconsole.log(maxSubArray(_nums));\n",
            "62": "", "54": "",
        },
        "time_limit_seconds": 5,
        "memory_limit_mb": 128,
    },
    {
        "id": "prob-008",
        "title": "Missing Number",
        "description": (
            "Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, "
            "return the **only number** in the range that is missing from the array."
        ),
        "difficulty": "easy",
        "examples": [
            {"input": "nums = [3,0,1]", "output": "2"},
            {"input": "nums = [0,1]", "output": "2"},
        ],
        "constraints": "1 ≤ n ≤ 10^4 | 0 ≤ nums[i] ≤ n | All numbers distinct",
        "visible_test_cases": [
            {"id": 1, "input": "3\n3 0 1", "expected_output": "2"},
            {"id": 2, "input": "2\n0 1", "expected_output": "2"},
        ],
        "hidden_test_cases": [
            {"id": 3, "input": "9\n9 6 4 2 3 5 7 0 1", "expected_output": "8"},
            {"id": 4, "input": "1\n0", "expected_output": "1"},
        ],
        "starter_code": {
            "71": "def missingNumber(nums: list) -> int:\n    pass\n",
            "63": "function missingNumber(nums) {\n    \n}\n",
            "62": (
                "import java.util.*;\npublic class Solution {\n"
                "    public static int missingNumber(int[] nums) {\n        return 0;\n    }\n"
                "    public static void main(String[] args) {\n"
                "        Scanner sc = new Scanner(System.in);\n"
                "        int n = sc.nextInt(); int[] nums = new int[n];\n"
                "        for(int i=0;i<n;i++) nums[i]=sc.nextInt();\n"
                "        System.out.println(missingNumber(nums));\n"
                "    }\n}\n"
            ),
            "54": (
                "#include <bits/stdc++.h>\nusing namespace std;\n"
                "int missingNumber(vector<int>& nums) {\n    return 0;\n}\n"
                "int main() {\n    int n; cin>>n; vector<int> v(n);\n"
                "    for(int i=0;i<n;i++) cin>>v[i];\n    cout<<missingNumber(v)<<endl;\n}\n"
            ),
        },
        "wrappers": {
            "71": "\nn = int(input())\nnums = list(map(int, input().split()))\nprint(missingNumber(nums))\n",
            "63": "\nconst _l = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst _nums = _l[1].split(' ').map(Number);\nconsole.log(missingNumber(_nums));\n",
            "62": "", "54": "",
        },
        "time_limit_seconds": 5,
        "memory_limit_mb": 128,
    },
    {
        "id": "prob-009",
        "title": "Binary Search",
        "description": (
            "Given a **sorted** array of integers `nums` and a target value `target`, "
            "return the **index** of target if it exists, or `-1` if it does not.\n\n"
            "You must implement an algorithm with **O(log n)** runtime complexity."
        ),
        "difficulty": "easy",
        "examples": [
            {"input": "nums = [-1,0,3,5,9,12], target = 9", "output": "4"},
            {"input": "nums = [-1,0,3,5,9,12], target = 2", "output": "-1"},
        ],
        "constraints": "1 ≤ n ≤ 10^4 | nums is sorted ascending | All values distinct",
        "visible_test_cases": [
            {"id": 1, "input": "6\n-1 0 3 5 9 12\n9", "expected_output": "4"},
            {"id": 2, "input": "6\n-1 0 3 5 9 12\n2", "expected_output": "-1"},
        ],
        "hidden_test_cases": [
            {"id": 3, "input": "1\n5\n5", "expected_output": "0"},
            {"id": 4, "input": "4\n1 3 5 7\n3", "expected_output": "1"},
        ],
        "starter_code": {
            "71": "def search(nums: list, target: int) -> int:\n    pass\n",
            "63": "function search(nums, target) {\n    \n}\n",
            "62": (
                "import java.util.*;\npublic class Solution {\n"
                "    public static int search(int[] nums, int target) {\n        return -1;\n    }\n"
                "    public static void main(String[] args) {\n"
                "        Scanner sc = new Scanner(System.in);\n"
                "        int n=sc.nextInt(); int[] nums=new int[n];\n"
                "        for(int i=0;i<n;i++) nums[i]=sc.nextInt();\n"
                "        int t=sc.nextInt();\n"
                "        System.out.println(search(nums,t));\n"
                "    }\n}\n"
            ),
            "54": (
                "#include <bits/stdc++.h>\nusing namespace std;\n"
                "int search(vector<int>& nums, int target) {\n    return -1;\n}\n"
                "int main() {\n    int n; cin>>n; vector<int> v(n);\n"
                "    for(int i=0;i<n;i++) cin>>v[i];\n    int t; cin>>t;\n"
                "    cout<<search(v,t)<<endl;\n}\n"
            ),
        },
        "wrappers": {
            "71": "\nn = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\nprint(search(nums, target))\n",
            "63": "\nconst _l = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst _nums=_l[1].split(' ').map(Number), _t=parseInt(_l[2]);\nconsole.log(search(_nums,_t));\n",
            "62": "", "54": "",
        },
        "time_limit_seconds": 5,
        "memory_limit_mb": 128,
    },
]


async def seed():
    from database import Base, create_all_tables
    from models import Problem

    await create_all_tables()

    # Add new columns if they don't exist yet
    async with engine.begin() as conn:
        for col, default in [("starter_code", "'{}'::jsonb"), ("wrappers", "'{}'::jsonb")]:
            await conn.execute(text(
                f"ALTER TABLE m4_problems ADD COLUMN IF NOT EXISTS {col} JSONB DEFAULT {default}"
            ))

    async with AsyncSessionLocal() as db:
        for p_data in PROBLEMS:
            existing = await db.execute(select(Problem).where(Problem.id == p_data["id"]))
            prob = existing.scalar_one_or_none()
            if prob:
                # Update with new fields (use flag_modified for JSON columns)
                from sqlalchemy.orm.attributes import flag_modified
                for k, v in p_data.items():
                    setattr(prob, k, v)
                for json_col in ("visible_test_cases", "hidden_test_cases", "examples", "starter_code", "wrappers"):
                    flag_modified(prob, json_col)
                print(f"  [update] {p_data['title']}")
            else:
                db.add(Problem(**p_data))
                print(f"  [seed] {p_data['title']}")
        await db.commit()
    print("Seeding complete.")


if __name__ == "__main__":
    asyncio.run(seed())
