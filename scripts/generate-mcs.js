const fs = require("fs");
const path = require("path");

const ROOT_DIR = process.cwd();
const TEMPLATE_PATH = path.join(ROOT_DIR, "templates", "mc-template.html");
const DATA_PATH = path.join(ROOT_DIR, "data", "mc_details_all.json");
const OUTPUT_DIR = path.join(ROOT_DIR, "detail_mc");

const COLLAPSE_LIMIT_BATTLE = 5;
const COLLAPSE_LIMIT_APPEARANCE = 10;

function main() {
  ensureFileExists(TEMPLATE_PATH);
  ensureFileExists(DATA_PATH);
  ensureDir(OUTPUT_DIR);

  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const data = JSON.parse(raw);

  const detailMap = data && data.mc_details ? data.mc_details : {};
  const mcIds = Object.keys(detailMap);

  if (!mcIds.length) {
    console.log("mc_details が見つかりませんでした。");
    return;
  }

  let generatedCount = 0;

  for (const mcId of mcIds) {
    const detail = detailMap[mcId];
    if (!detail || !detail.mc) continue;

    const html = buildMcHtml(template, mcId, detail);
    const outPath = path.join(OUTPUT_DIR, `${mcId}.html`);
    fs.writeFileSync(outPath, html, "utf8");
    generatedCount += 1;
  }

  console.log(`MC静的ページ生成完了: ${generatedCount}件`);
}

function buildMcHtml(template, mcId, detail) {
  const mc = detail.mc || {};
  const ranking = detail.ranking || {};
  const summary = detail.summary || {};
  const appearances = sortAppearances(Array.isArray(detail.participated_events) ? detail.participated_events : []);
  const wins = sortMatchHistory(Array.isArray(detail.wins_against) ? detail.wins_against : []);
  const losses = sortMatchHistory(Array.isArray(detail.losses_against) ? detail.losses_against : []);
  const championships = Array.isArray(detail.championships) ? detail.championships : [];
  const totalPrizeMoney = detail.total_prize_money ?? 0;

  const mcName = safeString(mc.mc_name || "このMC");
  const pageTitle = `${mcName} | 戦績・優勝歴・賞金・出場大会 | MCBattle.jp`;
  const metaDescription = buildMetaDescription(mcName, summary, championships, totalPrizeMoney);

  const rankDisplay = getRankDisplay(ranking);
  const scoreDisplay = getScoreDisplay(ranking);
  const rankingStatus = safeString(ranking.ranking_status || "");
  const rankingNote = rankingStatus === "inactive_3y" || rankingStatus === "inactive_4y"
    ? "直近の参加実績不足によりスコア対象外"
    : "";

  const mcInfoListItems = buildMcInfoListItems({
    summary,
    championships,
    totalPrizeMoney,
    rankingStatus,
    rankDisplay,
    scoreDisplay,
    rankingNote
  });

  const winsListItems = buildBattleListItems(wins);
  const lossesListItems = buildBattleListItems(losses);
  const appearancesListItems = buildAppearanceListItems(appearances);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(mcId, mcName);
  const profileJsonLd = buildProfileJsonLd(mcId, mcName, metaDescription);

  const winsHasMore = wins.length > COLLAPSE_LIMIT_BATTLE;
  const lossesHasMore = losses.length > COLLAPSE_LIMIT_BATTLE;
  const appearancesHasMore = appearances.length > COLLAPSE_LIMIT_APPEARANCE;

  return template
    .replaceAll("__PAGE_TITLE__", escapeHtml(pageTitle))
    .replaceAll("__META_DESCRIPTION__", escapeHtml(metaDescription))
    .replaceAll("__MC_ID__", escapeHtml(String(mcId)))
    .replaceAll("__BREADCRUMB_JSON_LD__", escapeScriptJson(breadcrumbJsonLd))
    .replaceAll("__PROFILE_JSON_LD__", escapeScriptJson(profileJsonLd))
    .replaceAll("__MC_TITLE__", escapeHtml(mcName))
    .replaceAll("__MC_META__", "")
    .replaceAll("__STATE_CARD_HIDDEN_CLASS__", "is-hidden")
    .replaceAll("__STATE_MESSAGE_ERROR_CLASS__", "")
    .replaceAll("__STATE_MESSAGE__", "")
    .replaceAll("__INFO_SECTION_HIDDEN_CLASS__", "")
    .replaceAll("__MC_INFO_LIST_ITEMS__", mcInfoListItems)
    .replaceAll("__WINS_SECTION_HIDDEN_CLASS__", "")
    .replaceAll("__WINS_STATUS_HIDDEN_CLASS__", wins.length === 0 ? "" : "is-hidden")
    .replaceAll("__WINS_STATUS__", wins.length === 0 ? "勝った試合がありません" : "")
    .replaceAll("__WINS_LIST_ITEMS__", winsListItems)
    .replaceAll("__WINS_MORE_HIDDEN_CLASS__", winsHasMore ? "" : "is-hidden")
    .replaceAll("__LOSSES_SECTION_HIDDEN_CLASS__", "")
    .replaceAll("__LOSSES_STATUS_HIDDEN_CLASS__", losses.length === 0 ? "" : "is-hidden")
    .replaceAll("__LOSSES_STATUS__", losses.length === 0 ? "負けた試合がありません" : "")
    .replaceAll("__LOSSES_LIST_ITEMS__", lossesListItems)
    .replaceAll("__LOSSES_MORE_HIDDEN_CLASS__", lossesHasMore ? "" : "is-hidden")
    .replaceAll("__APPEARANCES_SECTION_HIDDEN_CLASS__", "")
    .replaceAll("__APPEARANCES_STATUS_HIDDEN_CLASS__", appearances.length === 0 ? "" : "is-hidden")
    .replaceAll("__APPEARANCES_STATUS__", appearances.length === 0 ? "出場大会がありません" : "")
    .replaceAll("__APPEARANCES_LIST_ITEMS__", appearancesListItems)
    .replaceAll("__APPEARANCES_MORE_HIDDEN_CLASS__", appearancesHasMore ? "" : "is-hidden");
}

function buildMetaDescription(mcName, summary, championships, totalPrizeMoney) {
  const totalMatches = summary && summary.total_matches !== undefined && summary.total_matches !== null
    ? Number(summary.total_matches)
    : null;
  const wins = summary && summary.wins !== undefined && summary.wins !== null
    ? Number(summary.wins)
    : null;
  const losses = summary && summary.losses !== undefined && summary.losses !== null
    ? Number(summary.losses)
    : null;

  const parts = [
    `${mcName}の戦績・優勝歴・出場大会ページです。`,
    totalMatches !== null && Number.isFinite(totalMatches) && wins !== null && Number.isFinite(wins) && losses !== null && Number.isFinite(losses)
      ? `戦績は${totalMatches}試合${wins}勝${losses}敗。`
      : "",
    championships.length
      ? `優勝歴は${championships.length}回。`
      : "",
    Number(totalPrizeMoney) > 0
      ? `獲得賞金総額は¥${formatYen(totalPrizeMoney)}。`
      : "",
    "出場大会、戦績、スコアを掲載しています。"
  ].filter(Boolean);

  return parts.join(" ");
}

function buildMcInfoListItems(params) {
  const {
    summary,
    championships,
    totalPrizeMoney,
    rankingStatus,
    rankDisplay,
    scoreDisplay,
    rankingNote
  } = params;

  const championshipText = championships.length
    ? championships.map(renderChampionshipLine).join("")
    : "−";

  const battleSummary = `${displayValue(summary.total_matches)}試合 ${displayValue(summary.wins)}勝 ${displayValue(summary.losses)}敗`;

  const rows = [];

  rows.push(renderInfoRow("戦績", escapeHtml(battleSummary)));
  rows.push(renderInfoRow("獲得賞金総額", escapeHtml(`¥${formatYen(totalPrizeMoney)}`)));
  rows.push(renderInfoRow("優