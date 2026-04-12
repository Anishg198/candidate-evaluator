import Editor from '@monaco-editor/react'

const MONACO_LANG = { 71: 'python', 63: 'javascript', 62: 'java', 54: 'cpp' }

const DEFAULT_CODE = {
  71: `import sys
input = sys.stdin.readline

def solution():
    # TODO: read input, solve, and print output
    # Example for array problems:
    #   n = int(input())
    #   nums = list(map(int, input().split()))
    #   target = int(input())
    #   print(answer)
    pass

solution()
`,
  63: `const lines = require("fs").readFileSync("/dev/stdin","utf8").trim().split("\\n");
let idx = 0;

// TODO: read input, solve, and write output
// Example: const n = parseInt(lines[idx++]);
//          const nums = lines[idx++].split(" ").map(Number);
//          console.log(answer);
`,
  62: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // TODO: read input, solve, and print output
        // Example: int n = sc.nextInt();
        //          System.out.println(answer);
    }
}
`,
  54: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // TODO: read input, solve, and print output
    // Example: int n; cin >> n;
    //          cout << answer << endl;
    return 0;
}
`,
}

export { DEFAULT_CODE }

export default function CodeEditor({ languageId, value, onChange }) {
  return (
    <Editor
      height="100%"
      language={MONACO_LANG[languageId] || 'python'}
      value={value}
      onChange={(val) => onChange(val || '')}
      theme="vs-dark"
      options={{
        fontSize: 14,
        fontFamily: '"JetBrains Mono", monospace',
        fontLigatures: true,
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: 'gutter',
        cursorBlinking: 'smooth',
        smoothScrolling: true,
        tabSize: 4,
        automaticLayout: true,
      }}
    />
  )
}
