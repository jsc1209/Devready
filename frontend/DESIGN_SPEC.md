# DESIGN_SPEC — test-demo-UI → frontend 1:1 변환용 디자인 토큰 명세

> 원본 `test-demo-UI`(React18 + **Tailwind v4** + shadcn, Figma Make 프로토타입)를 분석해
> 화면을 **원본과 픽셀 단위로 동일하게** MUI(JS)로 옮기기 위한 디자인 토큰·변환 사전.
> 분석 대상: `src/styles/*.css`(활성 토큰), `src/app/components/*.tsx`(26개 화면), `src/app/components/ui/*`(shadcn 프리미티브).
> 이 문서는 **참조용**이며, 코드 변환은 다음 단계. theme.js 보강은 **§8 제안**만(아직 미적용).

---

## 0. 출처·구조 (중요 전제)

| 항목 | 사실 |
|------|------|
| 스타일 엔진 | **Tailwind v4.1.12** (CSS 기반 `@theme`, JS config 없음). `@tailwindcss/vite` |
| 활성 토큰 파일 | **`src/styles/theme.css`** (모두 **hex**). `index.css`가 `fonts → tailwind → theme` 순 import |
| 미사용 참조 파일 | **`default_shadcn_theme.css`** — shadcn 기본값(oklch, `--primary:#030213` 검정, `--radius:0.625rem`). **import 안 됨 → 무시**. (oklch 값은 여기에만 있고 실제 화면엔 영향 없음) |
| 화면 구현 방식 | 화면들은 shadcn 프리미티브를 **거의 안 씀** → raw `<div>/<button>/<input>` + **Tailwind 유틸 + 인라인 hex**. ui/ 프리미티브는 토큰 참조용 |
| 결론 | "정확한 값"의 1차 소스 = **theme.css 의 hex 토큰** + **화면 인라인 hex** + **Tailwind 기본 팔레트/스케일** |

---

## 1. 색 팔레트

### 1-A. shadcn 시맨틱 토큰 (theme.css — 활성, 정확값)

| CSS 변수 | hex | Tailwind 클래스(이 토큰을 가리킴) | 비고 |
|---|---|---|---|
| `--background` | `#FFFFFF` | `bg-background` | **앱 body 배경 = 흰색** |
| `--foreground` | `#0F172A` | `text-foreground` (388회) | **본문 기본색 = slate-900** |
| `--card` | `#FFFFFF` | `bg-card` (118회) | 카드 배경 = 흰색 |
| `--primary` | `#6366F1` | `text-primary`(154)/`bg-primary`(95) | indigo-500 (인라인 #6C63FF와 거의 동일) |
| `--primary-foreground` | `#FFFFFF` | — | 버튼 위 글자 |
| `--secondary` | `#F8F9FF` | `bg-secondary` (178회) | 입력/칩/연한 채움 (약한 보라빛 흰색) |
| `--secondary-foreground` | `#0F172A` | — | |
| `--muted` | `#F1F3FB` | `bg-muted` | |
| `--muted-foreground` | `#64748B` | `text-muted-foreground` (509회) | **보조 텍스트 = slate-500** |
| `--accent` | `#EEF0FF` | `bg-accent` | 연한 인디고 |
| `--accent-foreground` | `#4F46E5` | — | indigo-600 |
| `--destructive` | `#EF4444` | `bg-destructive` | red-500 |
| `--border` | `rgba(0,0,0,0.07)` | `border-border` (292회) | **카드/구분선 = 검정 7% (≈ MUI divider)** |
| `--input` | `rgba(0,0,0,0.04)` | — | |
| `--input-background` | `#F8F9FF` | — | |
| `--ring` | `#6366F1` | focus ring | |
| `--chart-1..5` | `#6366F1 / #10B981 / #F59E0B / #EC4899 / #3B82F6` | — | 차트 팔레트 |
| `--radius` | `0.75rem` = **12px** | — | sm=8 / md=10 / lg=12 / xl=16 |

> ⚠️ **현재 frontend/theme.js와 차이(1:1 핵심)**: text.primary `#1A1A2E`→**`#0F172A`**, text.secondary `#6B7280`→**`#64748B`**, background.default `#F7F8FA`→**`#FFFFFF`**. primary는 우리 `#6C63FF` 유지(아래 1-C).

### 1-B. 브랜드·시맨틱 인라인 hex (화면에서 직접 사용, 빈도순)

| hex | 횟수 | 용도 |
|---|---|---|
| **`#6C63FF`** | **94** | **브랜드 메인**(버튼/아이콘/강조). theme primary로 채택 |
| `#6366F1` | 32 | indigo-500. 그림자 `rgba(99,102,241,..)`·일부 토큰 |
| `#F59E0B` | 29 | 경고/별점/차트(amber) |
| `#10B981` | 21 | 성공/완료/차트(emerald) |
| `#34D399` | 12 | emerald-400 (그라디언트·진행) |
| `#3B82F6` | 11 | 정보/조회수(blue) |
| `#8B5CF6` | 9 | **브랜드 그라디언트 짝**(violet) |
| `#64748B` | 9 | 보조 텍스트(slate-500) |
| `#EC4899` | 5 | 차트(pink) |
| `#EF4444` | 5 | 오류/마감 임박(red-500) |
| `#FEE500`/`#3C1E1E`, `#03C75A`, `#EE1C25`, `#00B900`, `#2AC1BC` … | — | 기업 로고색(카카오/네이버/쿠팡/배민 등) — 데이터에 그대로 둠 |

### 1-C. primary 표기 정리
- **브랜드 메인 = `#6C63FF`** (인라인 94회로 지배적) → **`primary.main`으로 채택**.
- `text-primary`/`bg-primary` className(=토큰 `#6366F1`)도 화면에 등장하나 `#6C63FF`와 육안 차이 거의 없음 → 변환 시 **`primary.main`(#6C63FF)으로 통일**해도 1:1에 무방.
- hover 진보라: **`#4F46E5`**(indigo-600, `hover:bg-indigo-600`) → `primary.dark` 후보.
- 그림자 보라: `rgba(99,102,241,0.25)` (=#6366F1 25%).

### 1-D. Tailwind 기본 팔레트 (화면이 토큰 대신 직접 쓰는 회색/시맨틱 — 정확 hex)

| 클래스 | hex | | 클래스 | hex |
|---|---|---|---|---|
| gray-50 | `#F9FAFB` | | red-50 | `#FEF2F2` |
| gray-100 | `#F3F4F6` | | red-100 | `#FEE2E2` |
| gray-200 | `#E5E7EB` | | red-200 | `#FECACA` |
| gray-300 | `#D1D5DB` | | red-400 | `#F87171` (찜 하트) |
| gray-400 | `#9CA3AF` (text 55회) | | red-500 | `#EF4444` |
| gray-500 | `#6B7280` (text 76회) | | red-600 | `#DC2626` |
| gray-600 | `#4B5563` | | green-50 | `#F0FDF4` |
| gray-700 | `#374151` | | green-100 | `#DCFCE7` |
| gray-800 | `#1F2937` | | green-500 | `#22C55E` |
| gray-900 | `#111827` (text 48회) | | green-600 | `#16A34A` |
| slate-200 | `#E2E8F0` | | green-700 | `#15803D` |
| slate-500 | `#64748B` | | blue-50 | `#EFF6FF` |
| slate-900 | `#0F172A` | | blue-100 | `#DBEAFE` |
| indigo-50 | `#EEF2FF` | | blue-200 | `#BFDBFE` |
| indigo-100 | `#E0E7FF` | | blue-500 | `#3B82F6` |
| indigo-600 | `#4F46E5` (text 27회) | | blue-600 | `#2563EB` |
| violet-500 | `#8B5CF6` | | yellow-400 | `#FACC15` (별점) |
| amber-100 | `#FEF3C7` | | yellow-500 | `#EAB308` |
| amber-700 | `#B45309` | | orange-500 | `#F97316` |

> **slate vs gray 주의**: 시맨틱 토큰(foreground/muted-foreground)은 **slate** 계열(#0F172A/#64748B)인데, 화면은 `text-gray-*`(cool gray, #111827/#6B7280…)도 섞어 씀. 둘은 미세하게 다름 → **원본 className 그대로** 대응(text-foreground→#0F172A, text-gray-900→#111827)할 것.

---

## 2. 간격 체계 (Tailwind 4px 단위 → px → MUI sx)

> **변환 규칙: `MUI sx 값 = Tailwind 숫자 ÷ 2`** (MUI spacing 1 = 8px, Tailwind 1 = 4px).

| Tailwind | px | MUI sx | 빈도(상위) |
|---|---|---|---|
| `0.5` | 2 | `0.25` | p-0.5 37, py-0.5 48, gap-0.5 33 |
| `1` | 4 | `0.5` | p-1 136, gap-1 99 |
| `1.5` | 6 | `0.75` | p-1.5 112, gap-1.5 85, px-1.5 21 |
| `2` | 8 | `1` | **p-2 247, gap-2 221, px-2 44** |
| `2.5` | 10 | `1.25` | py-2.5 124, p-2.5 33, gap-2.5 30 |
| `3` | 12 | `1.5` | py-3 143, gap-3 103, px-3 67 |
| `3.5` | 14 | `1.75` | p-3.5 7 |
| `4` | 16 | `2` | **px-4 162, p-4 114, gap-4 64** |
| `5` | 20 | `2.5` | px-5 139, p-5 40 |
| `6` | 24 | `3` | p-6 96, px-6 30 |
| `8` | 32 | `4` | py-8 8 |
| `10` | 40 | `5` | py-10 (섹션) |
| `12` | 48 | `6` | py-12 (섹션) |
| `20` | 80 | `10` | py-20 (랜딩 섹션 표준) |

**컨테이너 max-width** (`mx-auto`와 함께):

| 클래스 | px | MUI `maxWidth` | 용도 |
|---|---|---|---|
| `max-w-5xl` | **1024** | `1024` | **본문 표준(목록/랜딩)** — 12회 |
| `max-w-6xl` | 1152 | `1152` | 넓은 목록(JobsPage) |
| `max-w-7xl` | 1280 | `1280` | 최대폭 |
| `max-w-4xl` | 896 | `896` | 상세(JobDetail) |
| `max-w-3xl` | 768 | `768` | CTA·모달 |
| `max-w-2xl` | 672 | `672` | 좁은 본문 |
| `max-w-lg/md/sm/xs` | 512/448/384/320 | 동일 | 카드·통계 묶음 |

- **섹션 수직 간격**: 랜딩형은 `py-20`(80px) 섹션, 본문은 컨테이너 `py-10`(40px). 카드 내부 `p-5`(20)·`p-6`(24).

---

## 3. 타이포그래피

### 3-A. 폰트 (fonts.css — Google Fonts)
- **Sans**: `'Inter', 'Noto Sans KR', -apple-system, sans-serif` (Inter 300–700, Noto Sans KR 300/400/500/700)
- **Mono(숫자)**: `'DM Mono'` 400/500 — 점수/통계 숫자에 사용
- `html { font-size: 16px }` (rem 기준)
- ⚠️ 현재 theme.js는 **Pretendard** → 원본은 **Inter+Noto Sans KR**. 1:1 위해 교체 권장(§8).

### 3-B. 크기 스케일 (Tailwind 기본 → px → MUI)

| 클래스 | px | lh(기본) | MUI sx `fontSize` | 빈도 | 용도 |
|---|---|---|---|---|---|
| `text-xs` | 12 | 16 | `12` | **530** | 캡션/뱃지/메타(최다) |
| `text-sm` | 14 | 20 | `14` | **493** | 본문 기본 |
| `text-base` | 16 | 24 | `16` | 9 | 큰 본문 |
| `text-lg` | 18 | 28 | `18` | 14 | 소제목(h3) |
| `text-xl` | 20 | 28 | `20` | 9 | 제목(h2) |
| `text-2xl` | 24 | 32 | `24` | 23 | 큰 제목(h1)/통계 숫자 |
| `text-3xl` | 30 | 36 | `30` | 26 | 섹션 헤드라인 |
| `text-4xl` | 36 | 40 | `36` | 4 | Hero |
| `text-5xl` | 48 | 1 | `48` | 2 | Hero(lg) |
| `text-6xl` | 60 | 1 | `60` | 1 | Hero(xl) |
| `text-[11px]` | 11 | — | `11` | 일부 | 초소형 라벨 |

### 3-C. base 요소 규칙 (theme.css @layer base)
| 요소 | 크기 | 굵기 | line-height |
|---|---|---|---|
| h1 | text-2xl(24) | 500 | 1.4 |
| h2 | text-xl(20) | 500 | 1.4 |
| h3 | text-lg(18) | 500 | 1.5 |
| h4 / label / button | text-base(16) | 500 | 1.5 |
| input / textarea | text-base(16) | 400 | 1.5 |

> ※ 단, 화면들은 위 base를 인라인으로 자주 덮어씀(예: 랜딩 h1 = `text-4xl~6xl font-bold`). **개별 화면의 클래스가 우선**.

### 3-D. 굵기
| 클래스 | weight | 빈도 | |
|---|---|---|---|
| `font-medium` | 500 | 283 | 라벨·버튼·기본 강조 |
| `font-semibold` | 600 | 179 | 카드 제목 |
| `font-bold` | 700 | 103 | 헤드라인·숫자 |
| `font-black` | 800 | 6 | 특대 Hero |
| `font-normal` | 400 | 2 | 입력 |

---

## 4. 컴포넌트 스타일 규칙 (화면의 de-facto 패턴)

### 4-A. 반경 (rounded-* → px)
| 클래스 | px | MUI `borderRadius` | 빈도 | 용도 |
|---|---|---|---|---|
| `rounded-lg` | 8 | `"8px"` | 149 | 작은 칩/아이템 |
| `rounded-xl` | **12** | `"12px"` | **255** | **버튼·입력·중간 카드(최다)** |
| `rounded-2xl` | **16** | `"16px"` | **142** | **메인 카드·패널** |
| `rounded-3xl` | 24 | `"24px"` | 1 | CTA 박스 |
| `rounded-full` | 9999 | `"999px"` | 173 | 칩/뱃지/아바타/배지 |
| `rounded-md` | 6 | `"6px"` | 3 | shadcn 프리미티브 기본 |

> px 문자열 권장(`borderRadius:"16px"`). MUI 숫자 배수는 theme.shape(12)와 곱해져 헷갈림.

### 4-B. 그림자 (shadow-* → MUI)
| 클래스 | MUI 근사 | 빈도 | 용도 |
|---|---|---|---|
| `shadow-sm` | `boxShadow: 1` | 13 | 카드 기본 |
| `shadow-md` | `boxShadow: 3` | 5 | 카드 hover |
| `shadow-lg` | `boxShadow: 6` | 10 | 버튼/강조 |
| `shadow-xl` | `boxShadow: 12` | 4 | 강조 카드 |
| `shadow-2xl` | `boxShadow: 24` | 16 | **모달/다이얼로그** |
| 브랜드 그림자 | `boxShadow:"0 4px 16px rgba(99,102,241,0.25)"` 또는 `0 10px 15px -3px rgba(108,99,255,0.25)` | — | primary 버튼 |

### 4-C. 카드 (de-facto)
```
rounded-2xl border border-border bg-card p-5   (또는 p-6 상세 패널)
hover: hover:shadow-md hover:border-primary/30
```
→ MUI:
```jsx
<Paper elevation={0} sx={{
  borderRadius: "16px", border: "1px solid", borderColor: "divider",
  bgcolor: "background.paper", p: 2.5,                 // p-5
  "&:hover": { boxShadow: 3, borderColor: "rgba(108,99,255,0.3)" },
}}/>
// border-border = rgba(0,0,0,0.07) ≈ divider
```

### 4-D. 버튼 (de-facto, raw)
| 종류 | 원본 클래스 | MUI |
|---|---|---|
| primary | `rounded-xl bg-primary text-white px-N py-2.5/3 font-medium hover:bg-indigo-600` | `variant="contained"` + `sx={{borderRadius:"12px", py:1.25~1.5}}` (hover는 primary.dark `#4F46E5`) |
| outline | `rounded-xl border border-border bg-secondary text-foreground hover:border-primary/40` | `variant="outlined"` + `sx={{borderRadius:"12px", borderColor:"divider", color:"text.primary"}}` |
| ghost/link | `text-primary hover:text-indigo-600` | `variant="text" sx={{color:"primary.main","&:hover":{color:"primary.dark"}}}` |

> shadcn 프리미티브 기본값(참고, 화면 미사용): button `h-9 px-4 py-2 rounded-md text-sm font-medium`, size sm `h-8 px-3`, lg `h-10 px-6`.

### 4-E. 입력/선택/텍스트영역 (de-facto)
```
rounded-xl bg-secondary border border-border px-N py-2.5 text-sm
focus:outline-none focus:border-primary/60
```
→ MUI `<TextField size="small">` (기본 border/포커스가 primary로 처리됨). `select`는 `TextField select`+`MenuItem`, textarea는 `multiline rows={n}`.
> 입력 배경은 원본 `bg-secondary = #F8F9FF`(우리가 grey.100로 쓰면 미세 차이) — 정확히는 `#F8F9FF`.

### 4-F. 칩/뱃지 (de-facto)
```
rounded-full px-2~2.5 py-0.5~1 text-xs font-medium
색 조합 예: bg-primary/10 text-primary / bg-red-50 text-red-500 / bg-secondary text-muted-foreground
```
→ MUI `<Chip size="small">` 또는 `<Box component="span">`. 색은 `rgba(108,99,255,0.1)`+`primary.main` 식으로.
> shadcn badge 기본: `rounded-md border px-2 py-0.5 text-xs font-medium`.

---

## 5. 반응형 브레이크포인트 (Tailwind → MUI)

원본 사용 빈도: **`sm:` 55 · `lg:` 43 · `md:` 15 · `xl:` 1**. 패턴: 그리드 컬럼 `grid-cols-1 → sm/md:2 → lg:3/4`, `hidden lg:block`, `flex-col sm:flex-row`.

| Tailwind | px(min) | MUI 기본 키 | px(기본) | 차이 |
|---|---|---|---|---|
| `sm:` | 640 | `sm` | 600 | ≈ |
| `md:` | 768 | (sm~md 사이) | 900 | **MUI md=900은 너무 큼** |
| `lg:` | 1024 | `md`≈900 / `lg`=1200 | — | 어긋남 |
| `xl:` | 1280 | `lg`=1200 | — | |

> **권장(1:1 핵심)**: theme.js에서 **breakpoints.values를 Tailwind 값으로 덮어쓰기** → `{xs:0, sm:640, md:768, lg:1024, xl:1280}`. 그러면 원본 `sm:/md:/lg:` 가 MUI `sm/md/lg` 키와 **그대로 1:1** 대응(`sx={{ gridTemplateColumns:{ xs:"1fr", md:"repeat(2,1fr)", lg:"repeat(3,1fr)" }}}`). §8 코드 참조.

---

## 6. 그라디언트 목록 (정확값, 용도별)

| 용도 | 정확 정의 |
|---|---|
| **브랜드 CTA(대각)** | `linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)` |
| 브랜드(가로) | `linear-gradient(90deg, #6C63FF, #8B5CF6)` |
| 브랜드 3-stop | `linear-gradient(135deg, #7B6CFF 0%, #6C63FF 50%, #8B5CF6 100%)` |
| 상단 띠(배너) | `linear-gradient(to right, #6366F1, #8B5CF6)` |
| **AIRecommendCard 배경** | `linear-gradient(135deg, rgba(108,99,255,0.06), rgba(139,92,246,0.08))` |
| Hero 라디얼 오버레이 | `radial-gradient(circle at 20% 30%, #6C63FF22 0%, transparent 50%)` + `radial-gradient(circle at 80% 70%, #8B5CF622 0%, transparent 50%)` |
| 다크 배너 | `linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)` |
| 성공(녹색) | `linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)` · `linear-gradient(90deg, #10B981, #34D399)` |
| 연한 인디고 패널 | `linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)` · `#F8F9FF→#EEF0FF` · `#F4F3FF→#EEF0FF` · `#EEF0FF→#E7E9FF` |
| 글래스 | `linear-gradient(to bottom, rgba(255,255,255,0.28), …)` |
| 글로우 | `radial-gradient(ellipse, #6366F1 0%, transparent 70%)` |

> `#6C63FF22` = #6C63FF + 알파 0x22(≈13%). MUI sx `background`에 hex 문자열 그대로 사용 가능.

---

## 7. className → sx 변환 치트시트 (자주 쓰는 것)

| Tailwind className | MUI sx |
|---|---|
| `text-foreground` | `color: "text.primary"` (#0F172A) |
| `text-muted-foreground` | `color: "text.secondary"` (#64748B) |
| `text-primary` | `color: "primary.main"` |
| `bg-card` / `bg-white` | `bgcolor: "background.paper"` (#FFF) |
| `bg-secondary` | `bgcolor: "#F8F9FF"` (정확) |
| `bg-primary` | `bgcolor: "primary.main"` |
| `bg-primary/10` | `bgcolor: "rgba(108,99,255,0.1)"` |
| `border border-border` | `border: "1px solid", borderColor: "divider"` |
| `border-primary/30` | `borderColor: "rgba(108,99,255,0.3)"` |
| `rounded-xl` / `rounded-2xl` / `rounded-full` | `borderRadius: "12px" / "16px" / "999px"` |
| `p-5` / `px-4` / `py-2.5` / `gap-2` | `p: 2.5 / px: 2 / py: 1.25 / gap: 1` |
| `text-sm` / `text-xs` | `fontSize: 14 / 12` |
| `font-medium/semibold/bold` | `fontWeight: 500/600/700` |
| `shadow-sm/md/2xl` | `boxShadow: 1/3/24` |
| `flex items-center gap-2` | `display:"flex", alignItems:"center", gap:1` |
| `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | `display:"grid", gridTemplateColumns:{xs:"1fr", md:"repeat(2,1fr)", lg:"repeat(3,1fr)"}` |
| `hidden lg:block` | `display: { xs:"none", lg:"block" }` |
| 숫자(점수/통계) | `fontFamily: "'DM Mono', monospace"` |

---

## 8. theme.js 보강 제안 (아직 미적용 — 검토용)

> 목표: 화면들이 토큰만 참조해도 원본과 1:1 되도록. **기존 값 변경 주의**(text/​background는 미세하지만 전역 영향).

```js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  // ── 1) 브레이크포인트를 Tailwind 값과 일치 (원본 sm/md/lg 를 그대로 대응) ──
  breakpoints: { values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 } },

  palette: {
    primary:   { main: "#6C63FF", light: "#8B85FF", dark: "#4F46E5", contrastText: "#FFFFFF" },
    secondary: { main: "#5B5FEF" },
    // 시맨틱 (차트/뱃지에서 실제로 쓰는 값)
    error:   { main: "#EF4444", light: "#FEF2F2" },   // destructive / red
    warning: { main: "#F59E0B", light: "#FEF3C7" },   // amber
    success: { main: "#10B981", light: "#ECFDF5" },   // emerald
    info:    { main: "#3B82F6", light: "#EFF6FF" },   // blue
    background: { default: "#FFFFFF", paper: "#FFFFFF" }, // ← 원본 body=흰색 (현재 #F7F8FA에서 변경 검토)
    text: { primary: "#0F172A", secondary: "#64748B", disabled: "#9CA3AF" }, // ← slate (현재 #1A1A2E/#6B7280에서 정정)
    divider: "rgba(0,0,0,0.07)",   // border-border
    grey: {  // Tailwind gray 스케일 (화면이 직접 사용)
      50:"#F9FAFB",100:"#F3F4F6",200:"#E5E7EB",300:"#D1D5DB",400:"#9CA3AF",
      500:"#6B7280",600:"#4B5563",700:"#374151",800:"#1F2937",900:"#111827",
    },
  },

  typography: {
    fontFamily: "'Inter','Noto Sans KR',-apple-system,system-ui,sans-serif",
    fontWeightMedium: 500,
    h1: { fontSize: "1.5rem",  fontWeight: 700, lineHeight: 1.4 },  // 화면 Hero는 인라인으로 키움
    h2: { fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.4 },
    h3: { fontSize: "1.125rem",fontWeight: 600, lineHeight: 1.5 },
    h4: { fontSize: "1rem",    fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: "0.875rem", lineHeight: 1.5 },   // text-sm 기본
    body2: { fontSize: "0.75rem",  lineHeight: 1.4 },   // text-xs
    button: { textTransform: "none", fontWeight: 600 },
  },

  shape: { borderRadius: 12 },   // --radius 0.75rem

  // ── 커스텀 토큰(테마 확장) : sx 에서 theme.brand.* 로 참조 ──
  brand: {
    gradient:     "linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)",
    gradientSoft: "linear-gradient(135deg, rgba(108,99,255,0.06), rgba(139,92,246,0.08))",
    banner:       "linear-gradient(to right, #6366F1, #8B5CF6)",
    primarySoft:  "rgba(108,99,255,0.1)",   // bg-primary/10
    secondaryFill:"#F8F9FF",                // bg-secondary
    accent:       "#EEF0FF",
    mono:         "'DM Mono', monospace",
    shadowBtn:    "0 4px 16px rgba(99,102,241,0.25)",
  },

  // ── (선택) 공통 컴포넌트 override : 전역 영향 크므로 신중 도입 ──
  components: {
    MuiPaper:  { styleOverrides: { rounded: { borderRadius: 16 } } }, // 카드 기본 rounded-2xl
    MuiButton: { defaultProps: { disableElevation: true },
                 styleOverrides: { root: { borderRadius: 12 } } },     // 버튼 rounded-xl
  },
});

export default theme;
```

**도입 시 주의**
- `text`/`background` 정정은 전역 영향 → 도입 후 기존 변환 화면(랜딩/히스토리/면접/공고) 회귀 확인 필요.
- 이미 만든 화면들은 `grey.100`을 `bg-secondary`로 썼으나 정확값은 `#F8F9FF` → 추후 `theme.brand.secondaryFill`로 통일 권장.
- `breakpoints` 변경은 모든 `sx={{ ...{md/lg} }}` 의 의미를 바꾸므로, 도입을 결정하면 일괄 적용 시점에.
- `fontFamily` Pretendard → Inter+Noto Sans KR 교체 시 `index.html`/폰트 로드도 같이.

---

## 9. 빠른 요약 (변환 시 기억할 5가지)

1. **본문색 = `#0F172A`(text.primary), 보조 = `#64748B`(text.secondary), 배경 = 흰색**. (현 theme와 미세 차이 → 정정 대상)
2. **브랜드 = `#6C63FF`**, hover = `#4F46E5`, 그라디언트 짝 = `#8B5CF6`.
3. **간격: Tailwind 숫자 ÷ 2 = MUI sx**. 카드 `p-5→p:2.5`, gap-2→gap:1.
4. **반경: rounded-xl=12px(버튼/입력), rounded-2xl=16px(카드), rounded-full=999px**. px 문자열로.
5. **폰트: Inter + Noto Sans KR**, 숫자만 **DM Mono**. text-sm(14)·text-xs(12)이 본문 대부분.
