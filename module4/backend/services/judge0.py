"""
Code execution service.
Runs code locally via subprocess (no Docker/Judge0 required for development).
Supports Python 3, JavaScript (Node.js), Java, C++.
"""
import asyncio
import logging
import os
import subprocess
import tempfile
import textwrap
import re
import time

logger = logging.getLogger(__name__)

LANGUAGE_NAMES = {
    71: "Python 3",
    63: "JavaScript",
    62: "Java",
    54: "C++",
}

DEFAULT_TIMEOUT = 10  # seconds


def _ok(stdout="", time_ms=0):
    return {"status_id": 3, "status": "Accepted", "stdout": stdout.strip(),
            "stderr": "", "compile_output": "", "time_ms": time_ms, "memory_kb": 0}


def _err(msg, status="Runtime Error", status_id=11):
    return {"status_id": status_id, "status": status, "stdout": "",
            "stderr": msg.strip(), "compile_output": "", "time_ms": 0, "memory_kb": 0}


def _compile_err(msg):
    return {"status_id": 6, "status": "Compilation Error", "stdout": "",
            "stderr": "", "compile_output": msg.strip(), "time_ms": 0, "memory_kb": 0}


def _tle():
    return {"status_id": 5, "status": "Time Limit Exceeded", "stdout": "",
            "stderr": "", "compile_output": "", "time_ms": 0, "memory_kb": 0}


def _run(cmd: list, stdin: str, timeout: int, cwd: str = None) -> tuple:
    """Run a command. Returns (stdout, stderr, elapsed_ms, timed_out)."""
    try:
        t0 = time.monotonic()
        proc = subprocess.run(
            cmd, input=stdin, capture_output=True, text=True,
            timeout=timeout, cwd=cwd,
        )
        elapsed = int((time.monotonic() - t0) * 1000)
        return proc.stdout, proc.stderr, elapsed, False
    except subprocess.TimeoutExpired:
        return "", "", 0, True


def _execute_python(source: str, stdin: str, timeout: int) -> dict:
    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
        f.write(source)
        fpath = f.name
    try:
        stdout, stderr, elapsed, timed_out = _run(["python3", fpath], stdin, timeout)
        if timed_out:
            return _tle()
        if stderr and not stdout:
            return _err(stderr)
        return _ok(stdout, elapsed)
    finally:
        os.unlink(fpath)


def _execute_javascript(source: str, stdin: str, timeout: int) -> dict:
    shim = textwrap.dedent("""\
        const _lines = require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n');
        let _li = 0;
        const readline = () => _lines[_li++] || '';
        const input = readline;
    """)
    with tempfile.NamedTemporaryFile(suffix=".js", mode="w", delete=False) as f:
        f.write(shim + "\n" + source)
        fpath = f.name
    try:
        stdout, stderr, elapsed, timed_out = _run(["node", fpath], stdin, timeout)
        if timed_out:
            return _tle()
        if stderr and not stdout:
            return _err(stderr)
        return _ok(stdout, elapsed)
    finally:
        os.unlink(fpath)


def _execute_java(source: str, stdin: str, timeout: int) -> dict:
    match = re.search(r'public\s+class\s+(\w+)', source)
    class_name = match.group(1) if match else "Main"
    with tempfile.TemporaryDirectory() as tmpdir:
        src_path = os.path.join(tmpdir, f"{class_name}.java")
        with open(src_path, "w") as f:
            f.write(source)
        _, err, _, timed_out = _run(["javac", src_path], "", timeout, cwd=tmpdir)
        if err:
            return _compile_err(err)
        if timed_out:
            return _tle()
        stdout, stderr, elapsed, timed_out = _run(
            ["java", "-cp", tmpdir, class_name], stdin, timeout
        )
        if timed_out:
            return _tle()
        if stderr and not stdout:
            return _err(stderr)
        return _ok(stdout, elapsed)


def _execute_cpp(source: str, stdin: str, timeout: int) -> dict:
    with tempfile.TemporaryDirectory() as tmpdir:
        src_path = os.path.join(tmpdir, "solution.cpp")
        bin_path = os.path.join(tmpdir, "solution")
        with open(src_path, "w") as f:
            f.write(source)
        _, err, _, timed_out = _run(
            ["g++", "-o", bin_path, src_path, "-O2", "-std=c++17"], "", timeout
        )
        if err and not os.path.exists(bin_path):
            return _compile_err(err)
        if timed_out:
            return _tle()
        stdout, stderr, elapsed, timed_out = _run([bin_path], stdin, timeout)
        if timed_out:
            return _tle()
        if stderr and not stdout:
            return _err(stderr)
        return _ok(stdout, elapsed)


_EXECUTORS = {
    71: _execute_python,
    63: _execute_javascript,
    62: _execute_java,
    54: _execute_cpp,
}


async def submit_and_wait(
    source_code: str,
    language_id: int,
    stdin: str = "",
    expected_output: str = "",
    time_limit: int = 5,
    memory_limit: int = 128,
) -> dict:
    """Run code locally and return a Judge0-compatible result dict."""
    executor = _EXECUTORS.get(language_id)
    if not executor:
        return _err(f"Language ID {language_id} not supported")
    timeout = max(time_limit, DEFAULT_TIMEOUT)
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, executor, source_code, stdin, timeout)
    except Exception as e:
        logger.error(f"Execution error: {e}")
        result = _err(str(e))
    return result


def get_language_name(language_id: int) -> str:
    return LANGUAGE_NAMES.get(language_id, f"Language {language_id}")
