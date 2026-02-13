import fs from 'fs';
import path from 'path';

const coveragePath = path.resolve(process.cwd(), 'coverage/coverage-summary.json');
const readmePath = path.resolve(process.cwd(), 'README.md');

try {
  if (!fs.existsSync(coveragePath)) {
    console.error('Coverage summary not found at:', coveragePath);
    process.exit(1);
  }

  const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  const lineCoverage = coverage.total.lines.pct;
  
  // Determine color based on coverage
  let color = 'red';
  if (lineCoverage >= 90) color = 'brightgreen';
  else if (lineCoverage >= 80) color = 'green';
  else if (lineCoverage >= 70) color = 'yellow';
  else if (lineCoverage >= 60) color = 'orange';

  const badgeUrl = `https://img.shields.io/badge/Coverage-${Math.round(lineCoverage)}%25-${color}.svg`;
  const badgeMarkdown = `![Coverage](${badgeUrl})`;

  let readme = fs.readFileSync(readmePath, 'utf8');
  
  // Regex to match existing badge
  const badgeRegex = /!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/Coverage-[0-9.]+(:?%25)?-[a-zA-Z]+\.svg\)/;
  
  if (badgeRegex.test(readme)) {
    readme = readme.replace(badgeRegex, badgeMarkdown);
    fs.writeFileSync(readmePath, readme);
    console.log(`Updated README.md with coverage: ${Math.round(lineCoverage)}% (${color})`);
  } else {
    console.warn('Coverage badge not found in README.md to replace');
  }

} catch (error) {
  console.error('Error updating coverage badge:', error);
  process.exit(1);
}
