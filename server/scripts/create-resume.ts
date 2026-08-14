import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const candidateDir = join(process.cwd(), 'candidate');
if (!existsSync(candidateDir)) {
  mkdirSync(candidateDir, { recursive: true });
}

const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 275 >>
stream
BT
/F1 18 Tf
50 700 Td
(Jane Doe) Tj
/F1 12 Tf
0 -25 Td
(Software Engineer) Tj
0 -20 Td
(Email: jane.doe.test@example.com) Tj
0 -20 Td
(Phone: 555-0123) Tj
0 -20 Td
(Location: San Francisco, CA) Tj
0 -25 Td
(Education: B.S. Computer Science - State University) Tj
0 -20 Td
(Experience: 3 years in software engineering) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000593 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
668
%%EOF`;

writeFileSync(join(candidateDir, 'resume.pdf'), pdfContent);
console.log('✅ Resume PDF created at candidate/resume.pdf');
