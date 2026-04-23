import Editor from '@monaco-editor/react'
import { useTheme } from '../ThemeContext'

const MONACO_LANG = { 71: 'python', 63: 'javascript', 62: 'java', 54: 'cpp' }

export const DEFAULT_CODE = {
  71: `import sys
input = sys.stdin.readline

def solution():
    pass

solution()
`,
  63: `const lines = require("fs").readFileSync("/dev/stdin","utf8").trim().split("\\n");
let idx = 0;
`,
  62: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
    }
}
`,
  54: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    return 0;
}
`,
}

export default function CodeEditor({ languageId, value, onChange }) {
  const { theme } = useTheme()
  return (
    <Editor
      height="100%"
      language={MONACO_LANG[languageId] || 'python'}
      value={value}
      onChange={(val) => onChange(val || '')}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      options={{
        fontSize: 14,
        fontFamily: '"JetBrains Mono", monospace',
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        padding: { top: 16, bottom: 16 },
        automaticLayout: true,
      }}
    />
  )
}
