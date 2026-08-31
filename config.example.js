/* 키 파일 템플릿.
 * 이 파일을 config.local.js 로 복사한 뒤 값을 채운다.
 * config.local.js 는 .gitignore 에 있어 커밋되지 않는다.
 * 저장소가 public이므로 실제 키를 이 파일(config.example.js)에 적으면 안 된다.
 */
window.SD_KEYS = {
  // TMAP appKey — https://openapi.sk.com  (앱 등록 → 서비스 URL 에 http://localhost:4173 등록)
  tmap: '',

  // Kakao REST API 키 — https://developers.kakao.com
  // (내 애플리케이션 → 플랫폼 → Web 사이트 도메인에 http://localhost:4173 등록)
  kakao: '',

  // true 로 두면 키가 있어도 목 데이터로 강제한다.
  forceMock: false,
};
