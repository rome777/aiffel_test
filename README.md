# 🚗 주말 드라이브 코스 & 연비 리포터

주말에 정체 없는 드라이브 코스를 찾아 지도에 그려주고, 예상 연비·기름값을 계산해 줍니다. 원하면 가는 길·오는 길의 한식 식당과 카페도 추천합니다.

**아무것도 입력하지 않아도** 됩니다 — 서울 중심부~수도권 서부 기준으로 코스를 그 자리에서 만들어 보여줍니다.

🔗 **배포:** https://smooth-drive.rome777.workers.dev

## 실행

```bash
python3 server.py 4173
```

`http://localhost:4173` 으로 엽니다. 빌드 없음, `index.html` 단일 파일입니다.

API 키(TMAP·Kakao) 없이 열면 목(mock) 데이터로 동작합니다. 실 데이터가 필요하면 저장소 루트에 `config.local.js`를 만드세요.

```js
window.SD_KEYS = { tmap: 'TMAP appKey', kakao: 'Kakao REST 키', forceMock: false };
```

두 API 모두 도메인 화이트리스트를 쓰므로, 각 콘솔에 `http://localhost:4173`을 먼저 등록해야 합니다.

## 배포

```bash
node build.mjs
npx wrangler deploy -c wrangler.deploy.toml
```

Cloudflare Worker가 API 키를 서버에 숨기고 `/api/*`로 프록시합니다 — 브라우저는 키를 절대 보지 않습니다. 이 구조 때문에 지도 SDK(TMAP)는 배포판에서 로드되지 않고 Leaflet+OSM으로 자동 대체됩니다. 자세한 이유는 [SPEC.md § 8](SPEC.md#8-배포)에 있습니다.

## 문서

설계 근거, 판단 규칙, 산식, 검증 기준은 **[SPEC.md](SPEC.md)** 에 있습니다 — 왜 이렇게 만들었는지가 궁금하면 거기를 보세요.
