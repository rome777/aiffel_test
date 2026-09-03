/* 배포 빌드 — index.html 을 dist/ 로 옮기며 키 로딩을 프록시 모드로 바꾼다.
 * 번들러 없이 한 줄 치환이면 되므로 의존성이 없다. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const KEY_TAG = '<script src="config.local.js" onerror="window.__sdNoKeyFile=true"></script>';
const PROXY_TAG = '<script>window.SD_PROXY = true;</script>';

const src = readFileSync('index.html', 'utf8');
if (!src.includes(KEY_TAG)) {
  console.error('키 로딩 태그를 찾지 못했습니다. index.html 구조가 바뀌었는지 확인하세요.');
  process.exit(1);
}

mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', src.replace(KEY_TAG, PROXY_TAG), 'utf8');
console.log('dist/index.html 생성 — 프록시 모드');
