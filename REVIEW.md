# AIFFEL Campus Code Peer Review Templete
- 코더 : 이호섭
- 리뷰어 : 김현지

> 리뷰 대상: **주말 드라이브 코스 & 연비 리포터** — 드라이브 시 정체 없고 연비 좋은 구간을 찾기 위해 만든 앱.
> 취향에 따른 코스 거리 선택(가볍게/보통/길게), 체류 시간을 고려한 왕복 예산 시간 계산, 유종 변경 시 기름값 반영, 클릭에 따른 실시간 지도 갱신이 핵심 기능.


# PRT(Peer Review Template)
[x]  **1. 주어진 문제를 해결하는 완성된 코드가 제출되었나요?**
- 문제에서 요구하는 기능이 정상적으로 작동하는지?
    - 해당 조건을 만족하는 부분의 코드 및 결과물을 근거로 첨부

    **① 코스 거리 선택(가볍게/보통/길게)이 실제로 계산에 반영됨**
    ```js
    // index.html:323-327
    const PRESETS = {
      light : { label:'🚲 가볍게', target:15 },
      normal: { label:'🚗 보통',   target:40 },
      long  : { label:'🛣️ 길게',   target:60 },
    };
    ```
    ```js
    // index.html:1675-1682 — 버튼 클릭 → State 갱신 → 재계산(run()) 까지 한 흐름
    $$('[data-preset]').forEach(b => b.addEventListener('click', () => {
      $$('[data-preset]').forEach(x => x.setAttribute('aria-pressed', String(x===b)));
      State.preset = b.dataset.preset;
      const custom = State.preset === 'custom';
      $('#distSlider').classList.toggle('hidden', !custom);
      $('#distVal').classList.toggle('hidden', !custom);
      run();
    }));
    ```
    → 프리셋 값(target km)이 SPEC-DETAIL.md §1의 "직선거리 밴드(0.6~1.2배)" 계산에 그대로 사용되어, 문서에 적힌 설계와 코드가 일치합니다.

    **② 체류 시간을 반영한 왕복 예산 시간 계산**
    ```js
    // index.html:1521
    why.push('주행 ' + hhmm(p.onewayMin*2) + ' + 체류 ' + hhmm(State.stayMin)
      + ' = 총 ' + hhmm(p.onewayMin*2 + State.stayMin));
    ```
    ```js
    // index.html:1695
    $('#stay').addEventListener('change', e => { State.stayMin = +e.target.value; run(); });
    ```
    → 편도 소요시간(`onewayMin`)×2(왕복) + 체류시간(`stayMin`)으로 "총 예산 시간"을 계산하며, 체류 시간을 바꾸면 `run()`이 다시 돌아 경유지 슬롯(`waypointSlots`, index.html:550-566)까지 재배정됩니다. 설명해 주신 "체류 시간을 고려한 왕복 예산 시간 계산" 요구사항과 정확히 일치합니다.

    **③ 유종 변경 시 기름값 반영**
    ```js
    // index.html:1708-1712
    $('#fuelType').addEventListener('change', e => {
      State.fuelPrice = +e.target.value;
      Store.set('fuelPrice', State.fuelPrice);
      renderAll();
    });
    ```
    ```js
    // index.html:1512-1513
    const cost = Math.round(roundKm / p.kmpl * State.fuelPrice);
    $('#sCost').textContent = '약 ' + cost.toLocaleString() + '원';
    ```
    → `select` 값(휘발유/고급휘발유/경유 리터당 가격)을 바꾸면 `State.fuelPrice`가 갱신되고, 왕복거리·예상연비와 곱해 기름값을 다시 렌더합니다. 초기값은 전국 평균 유가 API(`/api/fuel`, worker.js:53-73)로 채워지므로 "유종 변경 → 기름값 변경"이 실데이터 기준으로 동작합니다.

    **④ 클릭에 따른 실시간 지도 위치 변경**
    ```js
    // index.html:1654-1671
    function pick(id){
      const c = State.ranked.find(x => String(x.id) === String(id));
      ...
      State.picked = c; renderAll();
      returnLegAsync(State.origin, new Date());
      if (State.wpOn) waypointsAsync(State.origin, new Date());
    }
    ```
    ```js
    // index.html:1573 (renderAll 내부) → 1582 renderMap()
    function renderMap(){
      const p = State.picked;
      if (!p || !p.routed) return;
      const targetRoute = (State.mapLeg === 'back' && p.routeLive) ? p.routeLive : p.route;
      ...
      MapView.draw(targetRoute, d, o);   // 또는 LeafletView.draw / drawSvg 폴백
    }
    ```
    → 후보 카드를 클릭(`pick`) → `State.picked` 교체 → `renderAll()`이 내부에서 `renderMap()`을 호출해 새 후보의 경로로 마커·폴리라인을 다시 그립니다. "클릭에 따라 실시간으로 지도 위치가 바뀐다"는 설명과 코드 흐름이 일치합니다.

    **백엔드 동작 일치 여부**
    ```js
    // worker.js:75-88
    export default {
      async fetch(request, env) {
        const url = new URL(request.url);
        const p = url.pathname;
        if (p === '/api/kakao/category')   return kakao(KAKAO.category, url, env);
        if (p === '/api/kakao/keyword')    return kakao(KAKAO.keyword, url, env);
        if (p === '/api/tmap/routes')      return tmap(TMAP.routes, url, request, env);
        if (p === '/api/tmap/prediction')  return tmap(TMAP.prediction, url, request, env);
        if (p === '/api/fuel')             return fuel();
        ...
      },
    };
    ```
    → SPEC.md에서 설명한 "백엔드는 판단하지 않고 열쇠만 붙여 그대로 전달"이라는 설계와 실제 구현(`pass()` 함수가 상류 응답을 그대로 흘려보냄, worker.js:27-34)이 정확히 일치합니다. `Kakao`/`Tmap` 프론트 모듈(index.html:615-, 660-)도 프록시 모드(`CONFIG.PROXY`)와 로컬 직접 호출 모드를 분기하되 같은 파서를 타도록 짜여 있어, 문서(§7.2)에서 말한 "로컬 직접 호출과 같은 코드로 동작"이 실제로 구현돼 있습니다.

    **보안 검토**
    - Kakao/TMAP 키는 `config.local.js`(gitignore 처리, `.gitignore:2`)에만 두고, 배포판은 Cloudflare Worker 환경변수로 옮겨 브라우저에 노출하지 않음(worker.js 상단 주석 1-8행에 "Kakao REST 키는 도메인 화이트리스트로 막히지 않아 정적 호스팅에 올리면 쿼터가 남용된다"는 위협 분석까지 기록).
    - `git log --all -p`로 히스토리 전체를 확인했을 때 실제 키가 커밋된 흔적은 없었습니다.
    - 외부 API(Kakao) 응답으로 받은 장소명·리뷰 텍스트를 `innerHTML`에 꽂는 지점은 모두 `esc()`로 이스케이프 처리되어 있습니다(예: index.html:1538, 1630, 1640 등 `esc(c.name)`), 저장된 XSS 위험을 낮게 관리하고 있습니다.
    - 다만 `server.py`/`worker.js`의 유가 조회가 네이버 검색 결과 HTML을 정규식으로 긁는 방식이라(server.py:20-22, worker.js:63-64) 구조가 바뀌면 조용히 실패할 수 있음을 OPERATIONS.md §3에서도 이미 "고민"으로 인지하고 있습니다. 보안 취약점은 아니지만 안정성 리스크로 남아 있습니다.

- **이유**: 사용자가 설명한 4가지 핵심 기능(거리 프리셋, 체류시간 반영 왕복 예산, 유종별 기름값, 클릭 시 지도 갱신)이 모두 `State` 객체를 단일 소스로 두고 이벤트 → 상태 변경 → 재계산(`run`)/재렌더(`renderAll`) 흐름으로 일관되게 연결되어 있어 "의도한 대로 동작"한다고 판단했습니다. 백엔드(worker.js)는 SPEC 문서가 약속한 "판단 없이 전달만" 원칙을 코드로 그대로 구현했고, 키 관리·이스케이프 처리도 확인되어 보안 항목도 충족한다고 봤습니다.


[x]  **2. 핵심적이거나 복잡하고 이해하기 어려운 부분에 작성된 설명을 보고 해당 코드가 잘 이해되었나요?**
- 해당 코드 블럭에 doc string/annotation/markdown이 달려 있는지 확인
- 해당 코드가 무슨 기능을 하는지, 왜 그렇게 짜여진건지, 작동 메커니즘이 뭔지 기술.
- 주석을 보고 코드 이해가 잘 되었는지 확인
    - 잘 작성되었다고 생각되는 부분을 근거로 첨부합니다.

    ```js
    // worker.js:1-8
    /* Cloudflare Worker — 정적 자산 + /api/* 프록시
     *
     * 배포판이 브라우저에 API 키를 두지 않기 위한 층이다. Kakao REST 키는 도메인
     * 화이트리스트로 막히지 않아서(Authorization 헤더만 있으면 어디서든 통한다)
     * 정적 호스팅에 그대로 올리면 쿼터가 남용된다. 키는 여기 환경변수에만 둔다.
     *
     * 환경변수: TMAP_APP_KEY · KAKAO_REST_KEY
     */
    ```
    ```js
    // index.html:1528, 1540-1541 — "왜 이렇게 짰는지"가 남아있는 주석
    /* 값을 State에 들고 있다가 그린다. 이 함수가 다시 불려도 placeholder로 되돌아가지 않는다. */
    ...
    /* 미탐색 후보의 점수는 정체율을 가정값으로 넣은 추정치라 탐색된 후보와
     * 같은 축에서 비교할 수 없다. 오해를 부르므로 표시하지 않는다. */
    ```
    ```js
    // index.html:105 (SPEC-DETAIL.md §6) 를 코드 옆 주석으로 그대로 연결
    // 색을 구분하려면 상태가 바뀌는 지점마다 선을 잘라 이어 붙여야 하고, 이때
    // 이음새의 점 하나를 양쪽이 공유해야 함 — 안 하면 1픽셀 틈이 생겨 경로가 끊어져 보임
    ```

- **이유**: 단순히 "무엇을 하는 코드"가 아니라 **왜 그렇게 짰는지(설계 이유), 안 그러면 무슨 문제가 생기는지(회귀 방지)** 까지 주석에 남아 있어 코드 이해에 크게 도움이 됩니다. 특히 `index.html`의 대부분 함수/상수 블록이 `SPEC-DETAIL.md`의 절 번호(예: §2③, §5.2, §6.1, §6.3)를 주석으로 달아 두어, 코드만 봐도 어떤 설계 문서의 어떤 규칙을 구현한 것인지 바로 추적할 수 있었습니다. 이런 "문서 ↔ 코드 상호 참조" 방식은 복잡한 산식(연비 조화평균, 순위 가중치 등)을 이해하는 데 특히 유용했습니다.


[x]  **3. 에러가 난 부분을 디버깅하여 "문제를 해결한 기록"을 남겼나요? 또는 "새로운 시도 및 추가 실험"을 해봤나요?**
- 문제 원인 및 해결 과정을 잘 기록하였는지 확인
- 문제에서 요구하는 조건에 더해 추가적으로 수행한 나만의 시도, 실험이 기록되어 있는지 확인
    - 잘 작성되었다고 생각되는 부분을 캡쳐해 근거로 첨부합니다.

    **커밋 `b29a641` "배포판 지도 타일 두 가지 결함 수정"**
    ```
    - CARTO 타일이 API 키를 요구하게 되어 지도 전체에 "API KEY REQUIRED"
      워터마크가 찍혔다. 키 없이 쓸 수 있는 OSM 기본 타일로 교체.
      키 없는 다크 타일 제공자가 없어 다크 테마는 타일 레이어에
      invert + hue-rotate CSS 필터로 만든다
    - 타일 페이드 애니메이션이 중간에 멈춰 opacity 0.13~0.4 로 남아
      지도가 흐리게 보였다. fadeAnimation:false 로 끄면 로드 즉시 불투명
    - fitBounds 전에 invalidateSize 를 호출하고 200ms 뒤 한 번 더 맞춘다.
      컨테이너 크기가 확정되기 전에 맞추면 maxZoom 까지 확대되는 것을 방지

    배포판(Leaflet 폴백 경로)에서만 나타나던 문제로, 로컬은 TMAP SDK를
    쓰기 때문에 드러나지 않았다.
    ```
    → 증상(워터마크·흐린 지도·과도한 확대) 3가지를 각각의 **근본 원인**(키 요구·페이드 애니메이션 중단·컨테이너 크기 미확정)까지 짚고, 왜 로컬에서는 재현이 안 됐는지("TMAP SDK를 쓰기 때문")까지 남긴 전형적인 디버깅 기록입니다.

    **커밋 `c85ad5a` "L1 귀로 예측을 타임머신 길 안내로 교체"**, `7a7c417` "귀로 통계 교통량의 출처를 L1~L3 폴백으로 확정" 등도 하나의 방식이 안 되니 대안을 시도하고 우선순위(L1→L2→L3)를 정한 실험 과정을 보여줍니다. 이는 SPEC-DETAIL.md §3의 "1순위 TMAP 미래 시각 길찾기 / 2순위 내장 속도표 / 3순위 실주행 보정(미구현)" 표로 문서화되어, 시도와 결과가 코드·문서 양쪽에 일관되게 남아 있습니다.

- **이유**: 커밋 메시지 자체가 "무엇을 바꿨다"가 아니라 "왜 문제가 생겼고, 무엇을 시도했고, 왜 그 방법을 택했는지"를 순서대로 기록하고 있어 디버깅 기록으로서 요건을 충분히 만족한다고 판단했습니다.


[ ]  **4. 회고를 잘 작성했나요?**
- 프로젝트 결과물에 대해 배운점과 아쉬운점, 느낀점 등이 상세히 기록 되어 있나요?
	- 딥러닝 모델의 경우, 인풋이 들어가 최종적으로 아웃풋이 나오기까지의 전체 흐름을 도식화하여 모델 아키텍쳐에 대한 이해를 돕고 있는지 확인 → **해당 없음**: 규칙 기반 랭킹 앱이라 딥러닝 모델 아키텍처 다이어그램 요구사항은 적용되지 않습니다(대신 SPEC.md에 데이터 흐름 mermaid 다이어그램은 있습니다).

    `README.md`·`SPEC.md`·`SPEC-DETAIL.md`·`OPERATIONS.md` 어디에도 "배운점/느낀점/아쉬운점" 형태의 회고 문단은 없었습니다. 가장 가까운 것은 아래 항목이지만, 이는 3인칭 스펙 문서 톤의 "한계 목록"이라 개인적 회고와는 결이 다릅니다.
    ```md
    // OPERATIONS.md §3. 아직 안 된 것 · 남은 고민
    | 고민 | 기름값 가져오는 방식 | 검색 화면을 긁어와 형식이 바뀌면 조용히 실패. 공공 유가 서비스가 안전 |
    | 고민 | 리뷰 신뢰도 · "분위기 좋은"의 정의 | 평점·리뷰를 주는 소스로 옮기지 않으면 품질 필터가 계속 무효 |
    ```
- **이유**: 한계·미구현 목록은 매우 꼼꼼하게 정리돼 있어 "아쉬운 점"의 재료는 충분하지만, 그걸 통해 **무엇을 배웠는지·다음엔 어떻게 할 것인지** 등 회고 특유의 서술이 없어서 체크하지 않았습니다. 별도 회고 섹션(예: README 하단 또는 새 `RETROSPECT.md`)을 추가하시길 제안합니다.


[x]  **5. 코드가 간결하고 효율적인가요?**
- 파이썬 스타일 가이드 (PEP8)를 준수하였는지 확인
- 코드 중복을 최소화하고 범용적으로 사용할 수 있도록 모듈화(함수화) 했는지
    - 잘 작성되었다고 생각되는 부분을 근거로 첨부합니다.

    파이썬 코드는 `server.py` 하나(39줄, 로컬 개발용 프록시)뿐이며 PEP8 기준(4칸 들여쓰기, 함수/클래스 네이밍)을 크게 벗어나지 않습니다.

    ```js
    // index.html 상단 구성 — 역할별로 명확히 분리된 모듈(const 객체)
    const Core = { ... }       // 후보 생성·점수·연비 계산 순수 로직
    const Net = { ... }        // 네트워크 상태/알림
    const Kakao = { ... }      // 카카오 API 어댑터
    const Tmap = { ... }       // TMAP API 어댑터
    const Mock = { ... }       // 목데이터
    const Provider = { ... }   // Kakao/Tmap/Mock 스위칭
    const State = { ... }      // 앱 전역 상태 단일 소스
    const Store = { ... }      // localStorage 래퍼
    const MapView / LeafletView = { ... }  // 렌더러 레이어(TMAP → OSM 폴백)
    ```
    ```js
    // worker.js:19-34 — 공통 응답 생성/전달 로직을 함수로 뽑아 4개 라우트가 재사용
    const json = (obj, status = 200, cache = 'no-store') => new Response(...);
    async function pass(upstream, init) { ... }   // kakao(), tmap() 가 공통으로 사용
    ```
    ```js
    // index.html:1652 — 이스케이프 로직을 한 곳에 모아 여러 렌더 함수가 재사용
    function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, m => ({...}[m])); }
    ```
- **이유**: 관심사(데이터 조회/상태/렌더링/로컬저장)가 객체 단위로 명확히 분리돼 있고, 공통 로직(`esc`, `pass`, `json`)을 함수로 뽑아 중복을 줄였습니다. 다만 전국 평균 유가 파싱 정규식(휘발유/고급휘발유/경유)이 `server.py:20-22`와 `worker.js:62-66`에 **두 번** 존재합니다. worker.js 주석(53행)에도 "server.py 의 파서를 그대로 옮겼다"고 명시돼 있어 인지된 중복이긴 하나, 로컬 개발 서버(Python)와 프로덕션(Cloudflare Worker, JS)이 서로 다른 런타임이라 코드를 직접 공유하긴 어려운 구조입니다. 완전한 결함은 아니지만, 정규식·환산 로직만이라도 JSON/설정값으로 분리해 두 곳이 같은 소스를 참조하게 하면 더 좋을 것 같습니다.


# 참고 링크 및 코드 개선

## 1.코드 리뷰 시 참고한 링크가 있다면 링크와 간략한 설명을 첨부합니다.
- 리뷰 중 별도로 외부 자료를 찾아보진 않았고, 코드 내 주석에 이미 적혀 있는 공식 문서 링크(TMAP `https://openapi.sk.com`, Kakao `https://developers.kakao.com`, config.example.js:7,11)로 각 API 스펙을 확인하며 대조했습니다.

## 2.코드 리뷰를 통해 개선을 제안할 코드가 있다면 코드와 간략한 설명을 첨부합니다.
- **유가 조회 방식 개선**: `server.py:14-22`, `worker.js:56-69`가 네이버 검색 결과 HTML을 정규식으로 파싱합니다. 검색 결과 마크업이 바뀌면 조용히 실패하는 구조라, OPERATIONS.md에서도 이미 인지하고 있는 대로 오피넷(Opinet) 등 공식 유가 API로 교체하면 안정성이 높아질 것 같습니다.
- **유가 파싱 로직 중복 제거**: 위 5번 항목에서 언급한 대로 `server.py`와 `worker.js`에 같은 정규식이 두 번 존재합니다. 두 런타임이 달라 코드 공유는 어렵더라도, 필드명(휘발유/고급휘발유/경유)과 정규식 패턴만이라도 하나의 JSON 설정으로 빼서 두 파일이 같은 값을 참조하도록 하면 한쪽만 고치고 다른 쪽을 놓치는 실수를 줄일 수 있을 것 같습니다.
- **회고 섹션 추가 제안**: 4번 항목과 이어지는 내용으로, `README.md` 또는 별도 `RETROSPECT.md`에 이번 프로젝트에서 배운 점(예: 브라우저-전용 아키텍처에서 API 키를 감추는 방법, 실시간 교통 예측의 한계)과 아쉬운 점(카카오 API가 평점/영업시간을 주지 않아 필터가 무효화된 경험 등)을 1인칭 회고로 정리해 두면 좋겠습니다.


# 총평
직접 겪을 법한 "드라이브 갈 때 안 막히는 길, 기름값까지 알고 싶다"는 문제의식에서 출발해, 프리셋 거리 선택·체류시간 반영 예산시간·유종별 기름값·클릭 시 지도 갱신까지 설명해주신 핵심 기능이 코드상 `State` 단일 소스 + 이벤트 기반 재계산 구조로 일관되게 구현되어 있는 것을 확인했습니다. `README → SPEC → SPEC-DETAIL → OPERATIONS` 4단 문서 체계가 코드 주석의 절 번호(§)와 실제로 맞물려 있어서, 리뷰어 입장에서 "왜 이렇게 짰는지"를 추적하기 굉장히 수월했습니다. API 키를 백엔드(Cloudflare Worker)로 숨긴 구조와 git 히스토리에 실제 키가 남아있지 않은 점, 외부 데이터 렌더링 시 이스케이프 처리가 되어 있는 점에서 보안 의식도 확인됩니다.

배포판에서 발생한 지도 타일 버그를 원인 분석과 함께 기록한 커밋(`b29a641`)처럼 디버깅 흔적도 뚜렷합니다. 다만 카카오 API의 한계(평점·리뷰·영업시간 미제공)로 일부 필터가 "설계는 있으나 실데이터에서 무효"하다는 점을 OPERATIONS.md에서 스스로 투명하게 밝힌 점은 좋았지만, 이 경험을 1인칭 회고(배운점/느낀점)로 정리한 부분은 찾지 못해 4번 항목만 미체크했습니다. 유가 조회가 네이버 검색 결과를 긁는 방식이라 다소 취약한 점, 같은 파싱 로직이 두 파일에 중복된 점을 개선하면 더 좋아질 것 같습니다.
