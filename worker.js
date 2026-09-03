/* Cloudflare Worker — 정적 자산 + /api/* 프록시
 *
 * 배포판이 브라우저에 API 키를 두지 않기 위한 층이다. Kakao REST 키는 도메인
 * 화이트리스트로 막히지 않아서(Authorization 헤더만 있으면 어디서든 통한다)
 * 정적 호스팅에 그대로 올리면 쿼터가 남용된다. 키는 여기 환경변수에만 둔다.
 *
 * 환경변수: TMAP_APP_KEY · KAKAO_REST_KEY
 */

const KAKAO = {
  category: 'https://dapi.kakao.com/v2/local/search/category.json',
  keyword : 'https://dapi.kakao.com/v2/local/search/keyword.json',
};
const TMAP = {
  routes    : 'https://apis.openapi.sk.com/tmap/routes',
  prediction: 'https://apis.openapi.sk.com/tmap/routes/prediction',
};

const json = (obj, status = 200, cache = 'no-store') =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });

/* 상류 응답을 그대로 흘려보낸다. 본문 형태를 손대지 않아야 클라이언트의
 * 파서(§7.2 parse)가 로컬 직접 호출과 같은 코드로 동작한다. */
async function pass(upstream, init) {
  const r = await fetch(upstream, init);
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function kakao(target, url, env) {
  if (!env.KAKAO_REST_KEY) return json({ error: 'KAKAO_REST_KEY 미설정' }, 503);
  return pass(target + '?' + url.searchParams.toString(), {
    headers: { Authorization: 'KakaoAK ' + env.KAKAO_REST_KEY },
  });
}

async function tmap(target, url, request, env) {
  if (!env.TMAP_APP_KEY) return json({ error: 'TMAP_APP_KEY 미설정' }, 503);
  if (request.method !== 'POST') return json({ error: 'POST만 허용' }, 405);
  return pass(target + '?' + url.searchParams.toString(), {
    method: 'POST',
    headers: { appKey: env.TMAP_APP_KEY, 'Content-Type': 'application/json' },
    body: await request.text(),
  });
}

/* 전국 주유소 평균가 (§5.3). server.py 의 파서를 그대로 옮겼다.
 * 파싱이 깨지면 error 를 돌려주고, 클라이언트는 초기 단가를 유지한다. */
async function fuel() {
  const q = '%EC%A0%84%EA%B5%AD%EC%A3%BC%EC%9C%A0%EC%86%8C%ED%8F%89%EA%B7%A0%EA%B0%80';
  try {
    const r = await fetch('https://search.naver.com/search.naver?query=' + q, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const html = await r.text();
    const num = (label) => {
      const m = html.match(new RegExp('\\|\\s*' + label + '\\s*\\|\\s*([\\d,.]+)'));
      return m ? parseInt(m[1].replace(/,/g, '').split('.')[0], 10) : null;
    };
    const data = { gasoline: num('휘발유'), premium: num('고급휘발유'), diesel: num('경유') };
    if (!data.gasoline) return json({ error: '파싱 실패' });
    /* 평균가는 하루 단위로 바뀐다. 30분 캐시로 상류 호출을 줄인다. */
    return json(data, 200, 'public, max-age=1800');
  } catch (e) {
    return json({ error: String(e) });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p === '/api/kakao/category')   return kakao(KAKAO.category, url, env);
    if (p === '/api/kakao/keyword')    return kakao(KAKAO.keyword, url, env);
    if (p === '/api/tmap/routes')      return tmap(TMAP.routes, url, request, env);
    if (p === '/api/tmap/prediction')  return tmap(TMAP.prediction, url, request, env);
    if (p === '/api/fuel')             return fuel();
    if (p.startsWith('/api/'))         return json({ error: 'not found' }, 404);

    return env.ASSETS.fetch(request);
  },
};
