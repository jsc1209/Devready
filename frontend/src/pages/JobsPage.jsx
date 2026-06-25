import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Paper,
  Stack,
} from "@mui/material";
import { Search, Tune, Close } from "@mui/icons-material";
import { AIRecommendCard } from "../components/common/AIRecommendCard";
import { JOBS_DATA } from "../data/jobsMock";
import JobCard from "../components/jobs/JobCard";

const COMPANIES = ["전체", "카카오", "네이버", "토스", "라인", "쿠팡", "우아한형제들"];

const FILTERS = {
  job: ["전체", "프론트엔드", "백엔드", "풀스택", "데이터", "iOS/Android"],
  region: ["전체", "판교", "강남", "분당", "송파", "신촌", "잠실"],
  level: ["전체", "신입", "경력 1년+", "경력 2년+", "경력 3년+"],
};

const FILTER_LABEL = { job: "직군", region: "지역", level: "경력", company: "기업" };

// 필터 한 그룹(라벨 + 옵션 칩들)
function FilterGroup({ label, options, value, onSelect }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 500, color: "text.secondary", mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {options.map((o) => (
          <Chip
            key={o}
            label={o}
            size="small"
            clickable
            onClick={() => onSelect(o)}
            color={value === o ? "primary" : "default"}
            variant={value === o ? "filled" : "outlined"}
          />
        ))}
      </Box>
    </Box>
  );
}

/**
 * 채용 공고 목록 (/jobs) — test-demo-UI/JobsPage.tsx → JS+MUI.
 * 공통 레이아웃(헤더/띠)은 Layout 이 감싸므로 본문만 렌더.
 * AI 추천 카드는 공용 부품 common/AIRecommendCard 를 variant="jobs" 로 사용.
 */
export default function JobsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [wishes, setWishes] = useState(["1", "3"]);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    job: "전체",
    region: "전체",
    level: "전체",
    company: "전체",
  });

  const filtered = JOBS_DATA.filter((j) => {
    const matchSearch =
      j.title.includes(search) ||
      j.company.includes(search) ||
      j.tags.some((t) => t.includes(search));
    const matchJob =
      filters.job === "전체" ||
      j.title.includes(filters.job) ||
      j.tags.some((t) => t.includes(filters.job));
    const matchRegion = filters.region === "전체" || j.location === filters.region;
    const matchLevel =
      filters.level === "전체" || j.type.includes(filters.level.replace("전체", ""));
    const matchCompany = filters.company === "전체" || j.company === filters.company;
    return matchSearch && matchJob && matchRegion && matchLevel && matchCompany;
  });

  const activeFilterCount = Object.values(filters).filter((v) => v !== "전체").length;

  const toggleWish = (id, e) => {
    e.stopPropagation();
    setWishes((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  };

  const resetFilters = () =>
    setFilters({ job: "전체", region: "전체", level: "전체", company: "전체" });

  return (
    <Box sx={{ maxWidth: 1152, mx: "auto", px: 2, py: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
          채용 공고
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          총 {filtered.length}개 공고 · 찜 {wishes.length}개
        </Typography>
      </Box>

      {/* AI 추천 카드 (공용 부품) */}
      <AIRecommendCard variant="jobs" />

      {/* 검색 + 필터 버튼 */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="직무·회사·기술스택 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          onClick={() => setShowFilter((v) => !v)}
          variant={showFilter || activeFilterCount > 0 ? "contained" : "outlined"}
          startIcon={<Tune sx={{ fontSize: 18 }} />}
          sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
        >
          필터
          {activeFilterCount > 0 && (
            <Box
              component="span"
              sx={{
                ml: 1,
                width: 20,
                height: 20,
                borderRadius: "50%",
                bgcolor: showFilter ? "rgba(255,255,255,0.3)" : "primary.main",
                color: showFilter ? "#fff" : "primary.contrastText",
                fontSize: 12,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {activeFilterCount}
            </Box>
          )}
        </Button>
      </Box>

      {/* 필터 패널 */}
      {showFilter && (
        <Paper
          variant="outlined"
          sx={{ borderRadius: "16px", p: 2.5, mb: 3 }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2.5,
            }}
          >
            <FilterGroup
              label="직군"
              options={FILTERS.job}
              value={filters.job}
              onSelect={(o) => setFilters((f) => ({ ...f, job: o }))}
            />
            <FilterGroup
              label="지역"
              options={FILTERS.region}
              value={filters.region}
              onSelect={(o) => setFilters((f) => ({ ...f, region: o }))}
            />
            <FilterGroup
              label="경력"
              options={FILTERS.level}
              value={filters.level}
              onSelect={(o) => setFilters((f) => ({ ...f, level: o }))}
            />
            <FilterGroup
              label="기업"
              options={COMPANIES}
              value={filters.company}
              onSelect={(o) => setFilters((f) => ({ ...f, company: o }))}
            />
          </Box>
          {activeFilterCount > 0 && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: 1,
                borderColor: "divider",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                onClick={resetFilters}
                size="small"
                startIcon={<Close sx={{ fontSize: 14 }} />}
                sx={{ color: "text.secondary" }}
              >
                필터 초기화
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* 활성 필터 칩 */}
      {activeFilterCount > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {Object.entries(filters).map(
            ([key, val]) =>
              val !== "전체" && (
                <Chip
                  key={key}
                  label={`${FILTER_LABEL[key]}: ${val}`}
                  size="small"
                  variant="outlined"
                  color="primary"
                  onDelete={() => setFilters((f) => ({ ...f, [key]: "전체" }))}
                />
              )
          )}
        </Stack>
      )}

      {/* 공고 목록 */}
      {filtered.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 2,
          }}
        >
          {filtered.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              wished={wishes.includes(j.id)}
              onToggleWish={toggleWish}
              onClick={() => navigate(`/jobs/${j.id}`)}
            />
          ))}
        </Box>
      ) : (
        <Box sx={{ py: 10, textAlign: "center", color: "text.secondary" }}>
          검색 결과가 없습니다
        </Box>
      )}
    </Box>
  );
}
