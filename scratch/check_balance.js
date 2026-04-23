const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\pc\\.gemini\\antigravity\\scratch\\artisan-flow\\src\\components\\dashboard\\ChatWidget.tsx', 'utf8');

const counts = {
  '{': 0, '}': 0,
  '(': 0, ')': 0,
  '<': 0, '>': 0,
  '[': 0, ']': 0
};

for (const char of content) {
  if (counts.hasOwnProperty(char)) {
    counts[char]++;
  }
}

console.log(counts);
