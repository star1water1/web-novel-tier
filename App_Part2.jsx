// ═══════════════════════════════════════════════════════════════
// App.jsx Part 2/2 (v3.5.3) - export default function App()
// 사용법: Part1 뒤에 이어붙여 하나의 App.jsx 파일로 사용
// ═══════════════════════════════════════════════════════════════
export default function App() {
  // ðŸŽ¨ ë‹¤í¬ëª¨ë“œ
  const systemColorScheme = useColorScheme();
  const [darkMode, setDarkModeState] = useState(null); // null=ì‹œìŠ¤í…œ, true=ë‹¤í¬, false=ë¼ì´íŠ¸
  const isDark = darkMode === null ? systemColorScheme === "dark" : darkMode;
  // ëª¨ë“ˆ ìŠ¤ì½”í”„ C ì—…ë°ì´íŠ¸ (ì™¸ë¶€ UI ì»´í¬ë„ŒíŠ¸ë“¤ì´ ì°¸ì¡°)
  C = isDark ? DarkTheme : LightTheme;

  // ì„¤ì • ì €ìž¥ í•¨ìˆ˜
  const setDarkMode = async (value) => {
    setDarkModeState(value);
    await setAppMeta("settings_darkMode", value);
  };

  // ðŸ”„ ë¡œë”© ìƒíƒœ
  const [isLoading, setIsLoading] = useState(false);

  const [screen, setScreen] = useState("home");
  const [settingsSubTab, setSettingsSubTab] = useState("app"); // ðŸ†• Phase 2: ì„¤ì • ì„œë¸Œíƒ­ ("app" | "tags" | "analysis" | "backup")
  const [list, setList] = useState([]);

  // í™ˆ ê²€ìƒ‰/ì •ë ¬
  const [homeQuery, setHomeQuery] = useState("");
  const [homeSortKey, setHomeSortKey] = useState("rating");
  const [homeSortDir, setHomeSortDir] = useState("DESC"); // DESC / ASC

  // ðŸ†• ê³ ê¸‰ í•„í„°
  const [filterTier, setFilterTier] = useState("ALL");
  const [filterPlatform, setFilterPlatform] = useState("ALL");
  const [filterGenre, setFilterGenre] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // ðŸ” ê³ ê¸‰ ê²€ìƒ‰ í•„í„° (v2.3)
  const [searchIncludeTags, setSearchIncludeTags] = useState([]); // AND ì¡°ê±´ í¬í•¨ íƒœê·¸
  const [searchExcludeTags, setSearchExcludeTags] = useState([]); // ì œì™¸í•  íƒœê·¸
  const [searchExcludeStatus, setSearchExcludeStatus] = useState([]); // ì œì™¸í•  ìƒíƒœ
  const [searchExcludeWorkStatus, setSearchExcludeWorkStatus] = useState([]); // ì œì™¸í•  ìž‘í’ˆ ìƒíƒœ
  const [searchTagModalOpen, setSearchTagModalOpen] = useState(false); // ê²€ìƒ‰ìš© íƒœê·¸ ëª¨ë‹¬
  const [searchTagModalMode, setSearchTagModalMode] = useState("include"); // "include" | "exclude"

  // ðŸ·ï¸ íƒœê·¸ ê´€ë¦¬ ê³ ê¸‰ (v2.3)
  const [pinnedTags, setPinnedTags] = useState([]); // ìƒë‹¨ ê³ ì • íƒœê·¸
  const [hiddenTags, setHiddenTags] = useState([]); // ìˆ¨ê¹€ íƒœê·¸ (ê¸°ë³¸ íƒœê·¸ ìˆ¨ê¸°ê¸°ìš©)
  const [tagEditModalOpen, setTagEditModalOpen] = useState(false); // íƒœê·¸ íŽ¸ì§‘ ëª¨ë‹¬
  const [editingTag, setEditingTag] = useState(null); // { tag, type: "custom"|"combo"|"major"|"sub"|"general" }

  // ðŸ”® v3.0.3: ì´ë³€ ì›ì¸ ë¶„ì„ ì‹œìŠ¤í…œ
  const [upsetFactors, setUpsetFactors] = useState({
    factors: [],     // [{ id, type, key, direction, occurrences, confidence, examples }]
    lastUpdated: 0,
  });
  
  // ðŸ”— v3.0.3: íƒœê·¸ ê´€ê³„ë„ ì‹œìŠ¤í…œ
  const [tagRelations, setTagRelations] = useState({
    groups: {},      // { groupId: { id, tags: [], type: "similar"|"opposite", name } }
    tagToGroup: {},  // { tag: groupId } - ë¹ ë¥¸ ì¡°íšŒìš©
  });
  const [tagRelationModalOpen, setTagRelationModalOpen] = useState(false);
  const [tagRelationTarget, setTagRelationTarget] = useState(null); // ì„ íƒëœ íƒœê·¸
  const [tagRelationEditGroup, setTagRelationEditGroup] = useState(null); // íŽ¸ì§‘ ì¤‘ì¸ ê·¸ë£¹
  const [tagRelationNewTags, setTagRelationNewTags] = useState(""); // ìƒˆ íƒœê·¸ ìž…ë ¥
  const [tagRelationGroupName, setTagRelationGroupName] = useState(""); // ê·¸ë£¹ ì´ë¦„
  const [tagRelationGroupType, setTagRelationGroupType] = useState("similar"); // similar | opposite
  
  const [tagManagerTab, setTagManagerTab] = useState("custom"); // ì„¤ì • ë‚´ íƒœê·¸ ê´€ë¦¬ íƒ­
  const [tagManagerModalOpen, setTagManagerModalOpen] = useState(false); // íƒœê·¸ ë§¤ë‹ˆì € ëª¨ë‹¬

  // ðŸ† í‹°ì–´ ê²€í†  ì‹œìŠ¤í…œ (v2.5)
  const [reviewSearchQuery, setReviewSearchQuery] = useState(""); // ê°•ì œ ì§€ì •ìš© ê²€ìƒ‰
  const [reviewSelectedIds, setReviewSelectedIds] = useState([]); // ì„ íƒ ìŠ¹ì¸ìš©
  const [tierHistory, setTierHistory] = useState([]); // í‹°ì–´ ë³€ê²½ ížˆìŠ¤í† ë¦¬ [{id, title, from, to, at}]

  // âš™ï¸ ì•± ì„¤ì • (v2.6)
  const [appSettings, setAppSettings] = useState(DEFAULT_SETTINGS);
  const [undoStack, setUndoStack] = useState([]); // ì „ì—­ ë˜ëŒë¦¬ê¸° ìŠ¤íƒ [{type, payload, description, at}]

  // ë“±ë¡ ìž…ë ¥
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");
  const [memorableQuote, setMemorableQuote] = useState(""); // ðŸ’¬ ì¸ìƒê¹Šì€ ë¬¸ìž¥
  const [readCount, setReadCount] = useState("");
  const [totalEpisodes, setTotalEpisodes] = useState(""); // ðŸ“š ì „ì²´ íšŒì°¨ ìˆ˜
  const [rereadCount, setRereadCount] = useState("1"); // ðŸ“š v3.0.4: ë‹¤íšŒë… ì¹´ìš´íŠ¸ (ê¸°ë³¸ 1íšŒ)
  const [platforms, setPlatforms] = useState([]);
  const [newStatus, setNewStatus] = useState("reading"); // ðŸ†• ì½ê¸° ìƒíƒœ
  const [newWorkStatus, setNewWorkStatus] = useState("ongoing"); // ðŸ†• ìž‘í’ˆ ì—°ìž¬ ìƒíƒœ
  const [newCoverImage, setNewCoverImage] = useState(""); // ðŸ†• í‘œì§€ ì´ë¯¸ì§€
  const [newLink, setNewLink] = useState(""); // ðŸ”— ìž‘í’ˆ ë§í¬
  // ðŸ“– ì™¸ì „ ê´€ë ¨
  const [newGaidenStatus, setNewGaidenStatus] = useState("none");
  const [newGaidenReadCount, setNewGaidenReadCount] = useState("");
  const [newGaidenTotalEpisodes, setNewGaidenTotalEpisodes] = useState("");

// íŽ¸ì§‘
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editOriginalReadCount, setEditOriginalReadCount] = useState(0); // ì›ë³¸ ì½ì€íšŒì°¨ (ë³€ë™ì¼ ë¹„êµìš©)
  const [editOriginalTitle, setEditOriginalTitle] = useState(""); // ðŸ”§ v3.0.2: ì›ë³¸ ì œëª© (ë³€ê²½ ì¶”ì ìš©)
  const [editOriginalCoverImage, setEditOriginalCoverImage] = useState(""); // ðŸ–¼ï¸ v3.4.5: ì›ë³¸ í‘œì§€ (í‘œì§€ ìƒíƒœ ì¶”ì ìš©)
  const [editRating, setEditRating] = useState("");
  const [editPlatforms, setEditPlatforms] = useState([]); // ðŸ†• íŽ¸ì§‘ìš© í”Œëž«í¼
  const [editStatus, setEditStatus] = useState("reading"); // ðŸ†• íŽ¸ì§‘ìš© ìƒíƒœ
  const [editWorkStatus, setEditWorkStatus] = useState("ongoing"); // ðŸ†• íŽ¸ì§‘ìš© ìž‘í’ˆ ì—°ìž¬ ìƒíƒœ
  const [editCoverImage, setEditCoverImage] = useState(""); // ðŸ†• íŽ¸ì§‘ìš© í‘œì§€
  const [editLink, setEditLink] = useState(""); // ðŸ”— íŽ¸ì§‘ìš© ë§í¬
  // ðŸ“… v3.0.3: ë‚ ì§œ íŽ¸ì§‘
  const [editCreatedAt, setEditCreatedAt] = useState(""); // ë“±ë¡ì¼ (YYYY-MM-DD)
  const [editReadCountUpdatedAt, setEditReadCountUpdatedAt] = useState(""); // ìµœì‹ í™”ì¼ (YYYY-MM-DD)
  // ðŸ“– ì™¸ì „ ê´€ë ¨ (íŽ¸ì§‘)
  const [editGaidenStatus, setEditGaidenStatus] = useState("none");
  const [editGaidenReadCount, setEditGaidenReadCount] = useState("");
  const [editGaidenTotalEpisodes, setEditGaidenTotalEpisodes] = useState("");
  // ðŸ“š v3.0.4: ë‹¤íšŒë… ì¹´ìš´íŠ¸ (íŽ¸ì§‘)
  const [editRereadCount, setEditRereadCount] = useState("1");
  // ðŸ’¬ ì¸ìƒê¹Šì€ ë¬¸ìž¥ (íŽ¸ì§‘)
  const [editMemorableQuote, setEditMemorableQuote] = useState("");

  // â˜… ìˆ˜ìƒ íŽ¸ì§‘ìš© ìƒíƒœ
  const [editAwards, setEditAwards] = useState([]); // [{year: "2024", type: "grand"}, ...]
  const [awardYearInput, setAwardYearInput] = useState(
    String(new Date().getFullYear())
  );
  const [awardTypeInput, setAwardTypeInput] = useState("grand");
  
  // ê¸°ë¡
  const [logOpen, setLogOpen] = useState(false);
  const [logTarget, setLogTarget] = useState(null);
  const [logs, setLogs] = useState([]);

  // ë§¤ì¹­
  const [pair, setPair] = useState(null);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoGap, setAutoGap] = useState("250"); // ë ˆê±°ì‹œ (í•˜ìœ„í˜¸í™˜)
  const [lastMatchId, setLastMatchId] = useState(null); // ì–¸ë‘ìš©
  const [isAutoMatching, setIsAutoMatching] = useState(false); // ðŸ”§ v3.4.6: ìžë™ ìŠ¹íŒ¨ ì²˜ë¦¬ ì¤‘ í”Œëž˜ê·¸
  
  // ðŸŽ¯ v3.0.4: í™•ìž¥ëœ ìžë™ìŠ¹íŒ¨ ì„¤ì •
  const [autoMatchSettings, setAutoMatchSettings] = useState({
    mode: "any",  // "any" = í•˜ë‚˜ë¼ë„ ë§Œì¡± | "all" = ëª¨ë‘ ë§Œì¡±
    speed: "fast", // ðŸ”§ v3.4.7: "fast" = ì¦‰ì‹œ | "normal" = 100ms | "slow" = 500ms
    criteria: {
      ratingGap: { enabled: true, threshold: 250, desc: "ë ˆì´íŒ… ê²©ì°¨" },
      predictionRate: { enabled: false, threshold: 75, desc: "ì˜ˆì¸¡ ìŠ¹ë¥ (%)" },
      h2hStreak: { enabled: false, threshold: 3, desc: "ì§ì ‘ëŒ€ê²° ì—°ìŠ¹" },
      tierDiff: { enabled: false, threshold: 2, desc: "í‹°ì–´ ì°¨ì´ (ë‹¨ê³„)" },
      winRateDiff: { enabled: false, threshold: 30, desc: "ìŠ¹ë¥  ì°¨ì´(%)" },
      readRatioDiff: { enabled: false, threshold: 50, desc: "ì½ì€ ë¹„ìœ¨ ì°¨ì´(%)" },
      matchCountDiff: { enabled: false, threshold: 20, desc: "ë§¤ì¹­ ìˆ˜ ì°¨ì´" },
    },
  });
  const [autoSettingsExpanded, setAutoSettingsExpanded] = useState(false); // ì„¤ì • UI í™•ìž¥ ì—¬ë¶€

  // ë§¤ì¹­ ì§„í–‰ë„
  const [matchStats, setMatchStats] = useState({
    total: 0,
    done: 0,
    percent: 0,
  });

  // ðŸ”„ v3.4.6: ë§¤ì¹­ í ìƒíƒœ (ì²˜ë¦¬ ì¤‘ í‘œì‹œìš©)
  const [matchQueueStatus, setMatchQueueStatus] = useState({
    pending: 0,
    processing: false
  });

  // ðŸ”® v3.0.3: ìŠ¹ë¶€ì˜ˆì¸¡ ë¶„ì„ ì‹œìŠ¤í…œ
  const [matchAnalysis, setMatchAnalysis] = useState(null); // í˜„ìž¬ ë§¤ì¹­ì˜ ë¶„ì„ ê²°ê³¼
  const [matchInsights, setMatchInsights] = useState([]); // ëˆ„ì ëœ ë§¤ì¹­ ì¸ì‚¬ì´íŠ¸ (ì·¨í–¥ë¶„ì„ìš©)

  // ðŸ†• ë¹„êµ ëª¨ë“œ
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);

  // ðŸ†• í‹°ì–´í‘œ ì´ë¯¸ì§€ ìº¡ì²˜ìš©
  const tierImageRef = useRef(null);

  // ê²€ìƒ‰/ëŒ€ëŸ‰
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

// ìˆœìœ„ íƒ­
  const [rankQuery, setRankQuery] = useState("");
  const [rankTier, setRankTier] = useState("ALL"); // ALL, S, A, B+, B, B-, C

  // ì´ì£¼ì˜ ì¶”ì²œ â†’ ì˜¤ëŠ˜ì˜ ì¶”ì²œ (v3.3.0)
  const [dailyReco, setDailyReco] = useState(null); // { novel, pickedAt, reason, category, isPlanned }
  const [recoHistory, setRecoHistory] = useState([]); // ìµœê·¼ 5íšŒ ì¶”ì²œ ê¸°ë¡ [{novelId, pickedAt}]
  
  // ðŸ†• v3.4.1: ìµœê·¼ íŽ¸ì§‘ ìž‘í’ˆ (ë¹ ë¥¸ ì ‘ê·¼ìš©)
  const [recentlyEditedIds, setRecentlyEditedIds] = useState([]); // ìµœëŒ€ 5ê°œ ID ì €ìž¥
  
  // ðŸ“‹ v3.3.0: ì˜ˆì • íƒ­ (ê°€ë“±ë¡ ìž‘í’ˆ ê´€ë¦¬)
  const [plannedList, setPlannedList] = useState([]);
  const [plannedQuery, setPlannedQuery] = useState("");
  const [plannedSortKey, setPlannedSortKey] = useState("created"); // created, title, priority
  const [plannedSortDir, setPlannedSortDir] = useState("DESC");
  const [plannedFilterPlatform, setPlannedFilterPlatform] = useState("ALL"); // ðŸ†• v3.4.2 í”Œëž«í¼ í•„í„°
  // ì˜ˆì • ìž‘í’ˆ ë“±ë¡ í¼
  const [plannedTitle, setPlannedTitle] = useState("");
  const [plannedAuthor, setPlannedAuthor] = useState("");
  const [plannedTags, setPlannedTags] = useState("");
  const [plannedNote, setPlannedNote] = useState("");
  const [plannedTotalEpisodes, setPlannedTotalEpisodes] = useState("");
  const [plannedPlatforms, setPlannedPlatforms] = useState([]);
  const [plannedCoverImage, setPlannedCoverImage] = useState("");
  const [plannedLink, setPlannedLink] = useState("");
  const [plannedWorkStatus, setPlannedWorkStatus] = useState("ongoing");
  const [plannedMajorGenre, setPlannedMajorGenre] = useState([]);
  const [plannedSubGenre, setPlannedSubGenre] = useState([]);
  const [plannedPriority, setPlannedPriority] = useState(3); // 1~5 (5ê°€ ê°€ìž¥ ë†’ìŒ)
  // ðŸ†• v3.4: ì˜ˆì •íƒ­ í™•ìž¥ í•„ë“œ
  const [plannedExpectedRating, setPlannedExpectedRating] = useState("1500");
  const [plannedExpectedTier, setPlannedExpectedTier] = useState("");
  const [plannedInterestLevel, setPlannedInterestLevel] = useState(3); // 1~5
  const [plannedDiscoverySource, setPlannedDiscoverySource] = useState("");
  const [plannedFirstChapterRead, setPlannedFirstChapterRead] = useState(false);
  const [plannedScheduledStart, setPlannedScheduledStart] = useState("");
  const [plannedSimilarNovels, setPlannedSimilarNovels] = useState([]);
  const [plannedWhyInterested, setPlannedWhyInterested] = useState("");
  // ì˜ˆì • ìž‘í’ˆ íŽ¸ì§‘ ëª¨ë‹¬
  const [plannedEditOpen, setPlannedEditOpen] = useState(false);
  const [plannedEditItem, setPlannedEditItem] = useState(null);

  // íŠ¹ì • ìž‘í’ˆ ê³ ì • ë§¤ì¹­ìš©
  const [focusMatchNovel, setFocusMatchNovel] = useState(null);
  const [focusMatchQuery, setFocusMatchQuery] = useState("");

  // ëŒ€ëŸ‰ íŽ¸ì§‘ìš© ìƒíƒœ
  const [bulkTag, setBulkTag] = useState("");
  const [bulkTagIntensity, setBulkTagIntensity] = useState(3); // ðŸ·ï¸ v3.1.2: íƒœê·¸ ë†ë„ (1~5, ê¸°ë³¸ 3)
  const [bulkPlats, setBulkPlats] = useState([]);
  const [bulkDelta, setBulkDelta] = useState("");
  const [bulkSortKey, setBulkSortKey] = useState("rating");

  // JSON ê°€ì ¸ì˜¤ê¸° ëª¨ë‹¬
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  
  // ðŸ”§ v3.0.6: JSON ë‚´ë³´ë‚´ê¸° ëª¨ë‹¬ (Share í¬ê¸° ì œí•œ ë¬¸ì œ í•´ê²°)
  const [exportOpen, setExportOpen] = useState(false);
  const [exportText, setExportText] = useState(""); // ë¯¸ë¦¬ë³´ê¸°ìš© (ì¼ë¶€)
  const [exportInfo, setExportInfo] = useState(""); // ìš”ì•½ ì •ë³´
  const exportFullJsonRef = useRef(""); // ì „ì²´ JSON (ê³µìœ ìš©)

  // ðŸ“ ë³´ì¶© íƒ­ (v2.8)
  const [supplementCurrentNovel, setSupplementCurrentNovel] = useState(null); // í˜„ìž¬ ë³´ì¶© ì¤‘ì¸ ìž‘í’ˆ
  const [supplementSettingsOpen, setSupplementSettingsOpen] = useState(false); // ë³´ì¶© ì„¤ì • ëª¨ë‹¬
  const [savedSupplementId, setSavedSupplementId] = useState(null); // ðŸ”§ v3.0.2: ì €ìž¥ í›„ ì´ë™ìš© ID

  // ðŸ·ï¸ íƒœê·¸ ì„ íƒ ëª¨ë‹¬
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagModalTarget, setTagModalTarget] = useState(null); // 'new' | 'edit' | 'bulk'
  const [customTags, setCustomTags] = useState([]); // ì‚¬ìš©ìž ì •ì˜ íƒœê·¸
  const [comboTags, setComboTags] = useState([]); // ðŸ”— ì¡°í•©ì‹ íƒœê·¸ (ì˜ˆ: "ë¨¼ì¹˜í‚¨ ížˆë¡œì¸")
  const [customComboTraits, setCustomComboTraits] = useState([]); // ðŸ”— v3.0.4: ì‚¬ìš©ìž ì¶”ê°€ ì¡°í•© íŠ¹ì„±
  const [customComboTargets, setCustomComboTargets] = useState([]); // ðŸ”— v3.0.4: ì‚¬ìš©ìž ì¶”ê°€ ì¡°í•© ëŒ€ìƒ
  const [tagUsageCounts, setTagUsageCounts] = useState({}); // íƒœê·¸ ì‚¬ìš© ë¹ˆë„
  const [tagCoOccurrences, setTagCoOccurrences] = useState({}); // ðŸ†• v3.2.1: íƒœê·¸ ê³µë™ ì¶œí˜„ í†µê³„ { tag: { otherTag: count } }
  const [tagSentiments, setTagSentiments] = useState({}); // ðŸŽ­ v2.8 íƒœê·¸ ì†ì„± (ê¸ì •/ë¶€ì •/ì¤‘ë¦½)
  const [tagAttributes, setTagAttributes] = useState({}); // ðŸ†• v3.4: íƒœê·¸ ì†ì„± { [tag]: { isMajor: bool, isSub: bool } }
  
  // ðŸ† v2.9: ìˆ˜ìƒ ì‹œìŠ¤í…œ
  const [awardSystemSettings, setAwardSystemSettings] = useState(DEFAULT_AWARD_SYSTEM_SETTINGS);
  const [awardSelectedYear, setAwardSelectedYear] = useState(String(new Date().getFullYear())); // ì„ íƒëœ ì—°ë„
  const [awardSubTab, setAwardSubTab] = useState("candidates"); // candidates / results
  const [awardFilter, setAwardFilter] = useState({ awardId: "all", tierMin: null, excludeDropped: false, excludeDiscontinued: false }); // í•„í„°
  const [awardSettingsModalOpen, setAwardSettingsModalOpen] = useState(false); // ìƒ ì„¤ì • ëª¨ë‹¬
  
  // ðŸ“° v3.0: ìµœì‹  ë³€í™” ê¸°ë¡ ì‹œìŠ¤í…œ
  const [recentChanges, setRecentChanges] = useState([]); // [{id, novelId, novelTitle, type, details, timestamp}]
  
  // ðŸ·ï¸ íƒœê·¸ ê´€ë¦¬ ëª¨ë‹¬
  const [tagManageOpen, setTagManageOpen] = useState(false);
  const [userMajorGenres, setUserMajorGenres] = useState([]); // ì‚¬ìš©ìž ì¶”ê°€ ëŒ€ìž¥ë¥´
  const [userSubGenres, setUserSubGenres] = useState([]); // ì‚¬ìš©ìž ì¶”ê°€ ë¶€ìž¥ë¥´
  const [newMajorGenre, setNewMajorGenre] = useState([]);
  const [newSubGenre, setNewSubGenre] = useState([]);
  const [newTagData, setNewTagData] = useState([]); // ðŸ·ï¸ v5.0: [{tag, intensity}, ...]
  const [newUserMajorGenre, setNewUserMajorGenre] = useState(""); // íƒœê·¸ ëª¨ë‹¬ì—ì„œ ëŒ€ìž¥ë¥´ ì¶”ê°€ìš©
  const [newUserSubGenre, setNewUserSubGenre] = useState(""); // íƒœê·¸ ëª¨ë‹¬ì—ì„œ ë¶€ìž¥ë¥´ ì¶”ê°€ìš©
  // ðŸ”— v3.0.4: ì¡°í•© ìš”ì†Œ ìž…ë ¥ìš©
  const [newComboTraitInput, setNewComboTraitInput] = useState(""); // ì¡°í•© íŠ¹ì„± ì¶”ê°€ìš©
  const [newComboTargetInput, setNewComboTargetInput] = useState(""); // ì¡°í•© ëŒ€ìƒ ì¶”ê°€ìš©
  const [importValidation, setImportValidation] = useState(null); // ê²€ì¦ ê²°ê³¼
  
  // ðŸ“ v3.2.0: íƒœê·¸ ì¢Œí‘œê³„ ì‹œìŠ¤í…œ
  const [coordinateSystems, setCoordinateSystems] = useState(null); // {coord_id: {...}, ...}
  const [coordManageOpen, setCoordManageOpen] = useState(false); // ì¢Œí‘œê³„ ê´€ë¦¬ ëª¨ë‹¬
  const [editingCoordSystem, setEditingCoordSystem] = useState(null); // íŽ¸ì§‘ ì¤‘ì¸ ì¢Œí‘œê³„
  const [editingCoordTag, setEditingCoordTag] = useState(null); // íŽ¸ì§‘ ì¤‘ì¸ íƒœê·¸ {tag, x, y}

  // ðŸ–¼ï¸ v3.4.5: í‘œì§€ ë¼ì´ë¸ŒëŸ¬ë¦¬ ì‹œìŠ¤í…œ
  const [coverLibrary, setCoverLibrary] = useState([]); // DBì—ì„œ ë¡œë“œëœ í‘œì§€ ëª©ë¡
  const [coverLibraryFilter, setCoverLibraryFilter] = useState("all"); // "all" | "unused" | "used"
  const [coverLibraryLoading, setCoverLibraryLoading] = useState(false); // ë¡œë”© ìƒíƒœ (ëŒ€ëŸ‰ ì²˜ë¦¬ìš©)
  const [coverLibraryProgress, setCoverLibraryProgress] = useState({ current: 0, total: 0 }); // ì§„í–‰ë¥ 
  const [coverSelectModalOpen, setCoverSelectModalOpen] = useState(false); // í‘œì§€ ì„ íƒ ëª¨ë‹¬ (ì¸ì•± DBì—ì„œ ì„ íƒ)
  const [coverSelectTarget, setCoverSelectTarget] = useState(null); // "new" | "edit" | "planned" | "plannedEdit"
  const [coverLibrarySize, setCoverLibrarySize] = useState(0); // ì „ì²´ ìš©ëŸ‰

  /** JSON ê²€ì¦ ì‹¤í–‰ */
  const runImportValidation = () => {
    const result = validateImportData(importText);
    setImportValidation(result);
  };

  /* =========================================================
     ðŸ†• ë™ì  UI ì»´í¬ë„ŒíŠ¸ (ë‹¤í¬ëª¨ë“œ ì§€ì›)
     ========================================================= */
  const StatusBadge = ({ status }) => {
    const s = STATUS_MAP[status] || STATUS_MAP.reading;
    return (
      <View style={{ flexDirection: "row", alignItems: "center", marginRight: 8 }}>
        <View style={{ 
          width: 8, 
          height: 8, 
          borderRadius: 4, 
          backgroundColor: s.color,
          marginRight: 4,
        }} />
        <Text style={{ fontSize: 11, color: C.sub }}>{s.label}</Text>
      </View>
    );
  };

  // ðŸ†• ìž‘í’ˆ ìƒíƒœ ë”±ì§€ (ì—°ìž¬ì¤‘/ì™„ê²°/ì—°ì¤‘/ì„œë¹„ìŠ¤ì¢…ë£Œ) - ì€ì€í•œ ìŠ¤íƒ€ì¼
  const WorkStatusBadge = ({ workStatus }) => {
    if (!workStatus || workStatus === "ongoing") return null;
    const s = WORK_STATUS_MAP[workStatus];
    if (!s) return null;
    return (
      <View style={{ 
        flexDirection: "row", 
        alignItems: "center", 
        marginRight: 8,
      }}>
        <View style={{ 
          width: 6, 
          height: 6, 
          borderRadius: 3, 
          backgroundColor: s.color,
          marginRight: 3,
        }} />
        <Text style={{ color: C.sub, fontSize: 10 }}>{s.label}</Text>
      </View>
    );
  };

  // ðŸ†• í”Œëž«í¼ë³„ ê¸°ë³¸ í‘œì§€ (ë©”ì¸ ì´ˆê¸°í™”ì—ì„œ ë¡œë“œë¨)
  const [platformCovers, setPlatformCovers] = useState({});

  const savePlatformCovers = async (covers) => {
    setPlatformCovers(covers);
    await setAppMeta("platform_covers", covers);
  };

  const LoadingOverlay = () => isLoading ? (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.overlay, justifyContent: "center", alignItems: "center", zIndex: 999 }}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={{ marginTop: 12, color: C.sub }}>ì²˜ë¦¬ ì¤‘...</Text>
    </View>
  ) : null;

  /* =========================================================
     ðŸ†• ì´ë¯¸ì§€ URL ìž…ë ¥ ëª¨ë‹¬ (Android í˜¸í™˜)
     ========================================================= */
  // ðŸ“ Alert.promptëŠ” iOSë§Œ ì§€ì›í•˜ë¯€ë¡œ ëª¨ë‹¬ ë°©ì‹ ì‚¬ìš©
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlSetter, setUrlSetter] = useState(null);

  // ============================================
  // ðŸ§  ì·¨í–¥ ë°œê²¬ ì‹œìŠ¤í…œ Phase 2: UI ìƒíƒœ (v3.5.0)
  // ============================================
  const [insightList, setInsightList] = useState([]); // ì¸ì‚¬ì´íŠ¸ ëŒ€ê¸°ì—´
  const [preferencePatterns, setPreferencePatterns] = useState([]); // ìƒìœ„ íŒ¨í„´ ìš”ì•½
  const [insightLoading, setInsightLoading] = useState(false);
  const [matchPrediction, setMatchPrediction] = useState(null); // í˜„ìž¬ ë§¤ì¹­ ì˜ˆì¸¡ ê²°ê³¼

  function openUrlModal(setter) {
    setUrlInput("");
    setUrlSetter(() => setter);
    setUrlModalOpen(true);
  }

  function confirmUrlInput() {
    if (urlInput.trim() && urlSetter) {
      urlSetter(urlInput.trim());
    }
    setUrlModalOpen(false);
    setUrlInput("");
    setUrlSetter(null);
  }

  // ðŸ†• ê°¤ëŸ¬ë¦¬ì—ì„œ ì´ë¯¸ì§€ ì„ íƒ
  async function pickImageFromGallery(setter) {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.5,
        base64: true,
      });
      // 🔧 v3.5.3: 갤러리 복귀 후 DB 연결 강제 재설정
      resetDbConnection();
      await openDb();
      if (!result.canceled && result.assets[0]?.base64) {
        setter("data:image/jpeg;base64," + result.assets[0].base64);
      }
    } catch (e) {
      Alert.alert("ì˜¤ë¥˜", "ì´ë¯¸ì§€ ì„ íƒ ì‹¤íŒ¨: " + e.message);
    }
  }

  /* =========================================================
     ðŸ†• í‹°ì–´í‘œ í…ìŠ¤íŠ¸ ê³µìœ  (ì´ë¯¸ì§€ ìº¡ì²˜ ëŒ€ì‹ )
     ========================================================= */
  async function shareTierText() {
    try {
      const sorted = [...list].sort((a, b) => b.rating - a.rating);
      const lines = ["ðŸ† ë‚´ ì›¹ì†Œì„¤ í‹°ì–´í‘œ ðŸ†", ""];
      
      const tiers = { S: [], A: [], "B+": [], B: [], "B-": [], C: [] };
      for (const n of sorted) {
        const t = getDisplayTier(n);
        tiers[t].push(n.title);
      }
      
      for (const [tier, novels] of Object.entries(tiers)) {
        if (novels.length > 0) {
          lines.push(`ã€${tier}í‹°ì–´ã€‘`);
          novels.forEach((title, i) => lines.push(`  ${i + 1}. ${title}`));
          lines.push("");
        }
      }
      
      await Share.share({
        message: lines.join("\n"),
        title: "ì›¹ì†Œì„¤ í‹°ì–´í‘œ",
      });
    } catch (e) {
      Alert.alert("ì˜¤ë¥˜", "ê³µìœ  ì‹¤íŒ¨: " + e.message);
    }
  }

  /* =========================================================
     ðŸ†• ë¹„êµ ëª¨ë“œ í† ê¸€
     ========================================================= */
  const toggleCompare = useCallback((id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }, []);
  const compareNovels = useMemo(() => compareIds.map(id => list.find(n => n.id === id)).filter(Boolean), [compareIds, list]);

  /* =========================================================
     ðŸ†• ê³ ê¸‰ í•„í„° í•¨ìˆ˜
     ========================================================= */
  function advancedFilter(novels) {
    return novels.filter(n => {
      if (filterTier !== "ALL" && getDisplayTier(n) !== filterTier) return false;
      if (filterPlatform !== "ALL" && !parsePlatforms(n.platforms).includes(filterPlatform)) return false;
      if (filterGenre !== "ALL" && deriveMajorGenre(n.tags) !== filterGenre) return false;
      if (filterStatus !== "ALL" && (n.status || "reading") !== filterStatus) return false;
      return true;
    });
  }

  useEffect(() => {
    let mounted = true;
    
    // ðŸ”„ v3.4.6: ë§¤ì¹­ í ìƒíƒœ ì½œë°± ë“±ë¡
    setMatchQueueCallback((status) => {
      if (mounted) {
        setMatchQueueStatus(status);
      }
    });
    
    const initialize = async () => {
      setIsLoading(true);
      const maxRetries = 3;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          await initDb();
          
          // ðŸ·ï¸ v5.0 íƒœê·¸ ì‹œìŠ¤í…œ ë§ˆì´ê·¸ë ˆì´ì…˜
          await migrateTagSystem();
          
          if (!mounted) return;
          
          // ðŸš€ v2.8.1: ë³‘ë ¬ ë¡œë“œë¡œ ì´ˆê¸°í™” ì†ë„ ê°œì„ 
          // ðŸ”§ v3.4.4: Promise.all ì¸ë±ìŠ¤ ë§¤ì¹­ ë²„ê·¸ ìˆ˜ì •
          // âš ï¸ ì´ì „ì— getAppMeta("tag_sentiments")ê°€ ì¤‘ë³µ í˜¸ì¶œë˜ì–´ ì¸ë±ìŠ¤ê°€ ë°€ë ¤
          //    savedRecentChangesì— award_system_settingsê°€ ë“¤ì–´ê°€ëŠ” ë²„ê·¸ ë°œìƒí–ˆìŒ
          const [
            savedDarkMode,
            savedPlatformCovers,
            savedSettings,
            savedTierHistory,
            savedCustomTags,
            savedComboTags,
            savedTagSentiments,
            savedTagAttributes, // ðŸ†• v3.4: íƒœê·¸ ì†ì„±
            savedUserMajorGenres,
            savedUserSubGenres,
            savedHiddenTags,
            savedAwardSystemSettings, // ðŸ† v2.9
            savedRecentChanges, // ðŸ“° v3.0
            savedMatchInsights, // ðŸ”® v3.0.3
            savedTagRelations, // ðŸ”— v3.0.3
            savedUpsetFactors, // ðŸ”® v3.0.3
            savedAutoMatchSettings, // ðŸŽ¯ v3.0.4
            savedCustomComboTraits, // ðŸ”— v3.0.4: ì¡°í•© íŠ¹ì„±
            savedCustomComboTargets, // ðŸ”— v3.0.4: ì¡°í•© ëŒ€ìƒ
            savedCoordinateSystems, // ðŸ“ v3.2.0: íƒœê·¸ ì¢Œí‘œê³„
          ] = await Promise.all([
            getAppMeta("settings_darkMode"),      // 0: savedDarkMode
            getAppMeta("platform_covers"),        // 1: savedPlatformCovers
            getAppMeta("app_settings"),           // 2: savedSettings
            getAppMeta("tier_history"),           // 3: savedTierHistory
            getAppMeta("custom_tags"),            // 4: savedCustomTags
            getAppMeta("combo_tags"),             // 5: savedComboTags
            getAppMeta("tag_sentiments"),         // 6: savedTagSentiments
            getAppMeta("tag_attributes"),         // 7: savedTagAttributes
            getAppMeta("user_major_genres"),      // 8: savedUserMajorGenres
            getAppMeta("user_sub_genres"),        // 9: savedUserSubGenres
            getAppMeta("hidden_tags"),            // 10: savedHiddenTags
            getAppMeta("award_system_settings"),  // 11: savedAwardSystemSettings
            getAppMeta("recent_changes"),         // 12: savedRecentChanges
            getAppMeta("match_insights"),         // 13: savedMatchInsights
            getAppMeta("tag_relations"),          // 14: savedTagRelations
            getAppMeta("upset_factors"),          // 15: savedUpsetFactors
            getAppMeta("auto_match_settings"),    // 16: savedAutoMatchSettings
            getAppMeta("custom_combo_traits"),    // 17: savedCustomComboTraits
            getAppMeta("custom_combo_targets"),   // 18: savedCustomComboTargets
            getTagCoordinateSystems(),            // 19: savedCoordinateSystems
          ]);
          
          if (!mounted) return;
          
          // ë‹¤í¬ëª¨ë“œ
          if (savedDarkMode !== null && savedDarkMode !== undefined) {
            setDarkModeState(savedDarkMode);
          }
          
          // í”Œëž«í¼ë³„ ê¸°ë³¸ í‘œì§€
          if (savedPlatformCovers && typeof savedPlatformCovers === "object") {
            setPlatformCovers(savedPlatformCovers);
          }
          
          // âš™ï¸ ì•± ì„¤ì • (v2.6)
          if (savedSettings && typeof savedSettings === "object") {
            const merged = { ...DEFAULT_SETTINGS, ...savedSettings };
            // ðŸ†• v3.4: nested object deep merge
            if (savedSettings.supplement) {
              merged.supplement = { ...DEFAULT_SETTINGS.supplement, ...savedSettings.supplement };
            }
            if (savedSettings.recentChanges) {
              merged.recentChanges = { ...DEFAULT_SETTINGS.recentChanges, ...savedSettings.recentChanges };
            }
            if (savedSettings.plannedFields) {
              merged.plannedFields = { ...DEFAULT_SETTINGS.plannedFields, ...savedSettings.plannedFields };
            }
            setAppSettings(merged);
            if (merged.tierThresholds) {
              globalTierThresholds = { ...DEFAULT_SETTINGS.tierThresholds, ...merged.tierThresholds };
            }
            // ðŸ†• v3.4.4: ì „ì²´ í™”ë©´ ëª¨ë“œ ì ìš©
            // ðŸ”§ v3.4.6: NavigationBar null ì²´í¬ ì¶”ê°€
            if (Platform.OS === "android" && NavigationBar && merged.fullscreenMode === true) {
              try {
                NavigationBar.setVisibilityAsync("hidden");
                NavigationBar.setBehaviorAsync("overlay-swipe");
              } catch (e) {
                console.warn("NavigationBar init error:", e);
              }
            }
          }
          
          // ðŸ† í‹°ì–´ ížˆìŠ¤í† ë¦¬
          if (Array.isArray(savedTierHistory)) {
            setTierHistory(savedTierHistory.slice(0, 50));
          }
          
          // ðŸ·ï¸ ì»¤ìŠ¤í…€ íƒœê·¸
          const customTagsList = Array.isArray(savedCustomTags) ? savedCustomTags : [];
          setCustomTags(customTagsList);
          
          // ðŸ”— ì¡°í•©ì‹ íƒœê·¸
          if (Array.isArray(savedComboTags)) {
            setComboTags(savedComboTags);
          }
          
          // ðŸŽ­ v2.8: ì‚¬ìš©ìž íƒœê·¸ ì†ì„±
          if (savedTagSentiments && typeof savedTagSentiments === "object") {
            setTagSentiments(savedTagSentiments);
          }
          
          // ðŸ†• v3.4: íƒœê·¸ ì†ì„± (ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ ë™ë“±í™”)
          if (savedTagAttributes && typeof savedTagAttributes === "object") {
            setTagAttributes(savedTagAttributes);
          }
          
          // ðŸ·ï¸ ì‚¬ìš©ìž ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´
          if (Array.isArray(savedUserMajorGenres)) {
            setUserMajorGenres(savedUserMajorGenres);
          }
          if (Array.isArray(savedUserSubGenres)) {
            setUserSubGenres(savedUserSubGenres);
          }
          
          // ðŸ™ˆ ìˆ¨ê¹€ íƒœê·¸
          if (Array.isArray(savedHiddenTags)) {
            setHiddenTags(savedHiddenTags);
          }
          
          // ðŸ† v2.9: ìˆ˜ìƒ ì‹œìŠ¤í…œ ì„¤ì •
          if (savedAwardSystemSettings && typeof savedAwardSystemSettings === "object") {
            // ê¸°ì¡´ ì„¤ì •ê³¼ ë³‘í•© (ìƒˆ ì—°ë„ ìžë™ ì¶”ê°€)
            const merged = { ...DEFAULT_AWARD_SYSTEM_SETTINGS };
            if (savedAwardSystemSettings.yearlyAwards) {
              merged.yearlyAwards = { ...savedAwardSystemSettings.yearlyAwards };
            }
            // í˜„ìž¬ ì—°ë„ê¹Œì§€ ì—†ëŠ” ì—°ë„ ì¶”ê°€
            const years = getAwardYears();
            for (const y of years) {
              if (!merged.yearlyAwards[y]) {
                // ì´ì „ ì—°ë„ ì„¤ì • ë³µì‚¬ ë˜ëŠ” ê¸°ë³¸ í…œí”Œë¦¿
                const prevYear = String(Number(y) - 1);
                merged.yearlyAwards[y] = merged.yearlyAwards[prevYear] 
                  ? merged.yearlyAwards[prevYear].map(a => ({ ...a }))
                  : DEFAULT_AWARD_TEMPLATE.map(a => ({ ...a }));
              }
            }
            setAwardSystemSettings(merged);
          } else {
            // ì´ˆê¸° ì„¤ì • - í˜„ìž¬ ì—°ë„ê¹Œì§€ ëª¨ë‘ ìƒì„±
            const initial = { ...DEFAULT_AWARD_SYSTEM_SETTINGS, yearlyAwards: {} };
            const years = getAwardYears();
            for (const y of years) {
              initial.yearlyAwards[y] = DEFAULT_AWARD_TEMPLATE.map(a => ({ ...a }));
            }
            setAwardSystemSettings(initial);
          }
          
          // ðŸ“° v3.0: ìµœì‹  ë³€í™” ê¸°ë¡ ë¡œë“œ ë° ë§Œë£Œ ê¸°ë¡ ì •ë¦¬
          if (Array.isArray(savedRecentChanges)) {
            const retentionDays = savedSettings?.recentChanges?.retentionDays || DEFAULT_SETTINGS.recentChanges.retentionDays;
            const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
            // ë§Œë£Œë˜ì§€ ì•Šì€ ê¸°ë¡ë§Œ ìœ ì§€
            const validChanges = savedRecentChanges.filter(c => c.timestamp > cutoff);
            setRecentChanges(validChanges);
            // ì •ë¦¬ëœ ê¸°ë¡ ì €ìž¥ (ë§Œë£Œ ê¸°ë¡ ì‚­ì œ)
            if (validChanges.length !== savedRecentChanges.length) {
              await setAppMeta("recent_changes", validChanges);
            }
          }
          
          // ðŸ”® v3.0.3: ë§¤ì¹­ ì¸ì‚¬ì´íŠ¸ ë¡œë“œ
          if (Array.isArray(savedMatchInsights)) {
            setMatchInsights(savedMatchInsights);
          }
          
          // ðŸ”— v3.0.3: íƒœê·¸ ê´€ê³„ë„ ë¡œë“œ
          if (savedTagRelations && typeof savedTagRelations === "object") {
            setTagRelations({
              groups: savedTagRelations.groups || {},
              tagToGroup: savedTagRelations.tagToGroup || {},
            });
          }
          
          // ðŸ”® v3.0.3: ì´ë³€ ìš”ì¸ ë¡œë“œ
          if (savedUpsetFactors && typeof savedUpsetFactors === "object") {
            setUpsetFactors({
              factors: Array.isArray(savedUpsetFactors.factors) ? savedUpsetFactors.factors : [],
              lastUpdated: savedUpsetFactors.lastUpdated || 0,
            });
          }
          
          // ðŸŽ¯ v3.0.4: ìžë™ìŠ¹íŒ¨ ì„¤ì • ë¡œë“œ
          if (savedAutoMatchSettings && typeof savedAutoMatchSettings === "object") {
            setAutoMatchSettings(prev => ({
              ...prev,
              ...savedAutoMatchSettings,
              criteria: {
                ...prev.criteria,
                ...(savedAutoMatchSettings.criteria || {}),
              },
            }));
          }
          
          // ðŸ”— v3.0.4: ì¡°í•© ìš”ì†Œ ë¡œë“œ
          if (Array.isArray(savedCustomComboTraits)) {
            setCustomComboTraits(savedCustomComboTraits);
          }
          if (Array.isArray(savedCustomComboTargets)) {
            setCustomComboTargets(savedCustomComboTargets);
          }
          
          // ðŸ“ v3.2.0: íƒœê·¸ ì¢Œí‘œê³„ ë¡œë“œ
          if (savedCoordinateSystems && typeof savedCoordinateSystems === "object") {
            setCoordinateSystems(savedCoordinateSystems);
          }
          
          await loadList();
          
          // ðŸ“‹ v3.3.0: ì˜ˆì • ìž‘í’ˆ ëª©ë¡ ë¡œë“œ
          await loadPlannedList();
          
          // ðŸ–¼ï¸ v3.4.5: í‘œì§€ ë¼ì´ë¸ŒëŸ¬ë¦¬ ë¡œë“œ
          await loadCoverLibrary();
          
          // ðŸ§  v3.5.0: ì·¨í–¥ ë°œê²¬ ì‹œìŠ¤í…œ ë§ˆì´ê·¸ë ˆì´ì…˜ (ê¸°ì¡´ ë§¤ì¹­ ë°ì´í„°ì—ì„œ íŒ¨í„´ ì¶”ì¶œ)
          setTimeout(async () => {
            try {
              await migrateExistingMatchesToPatterns();
            } catch (e) {
              console.warn("ì·¨í–¥ ë°œê²¬ ì‹œìŠ¤í…œ ë§ˆì´ê·¸ë ˆì´ì…˜ ì˜¤ë¥˜:", e);
            }
          }, 2000); // ì´ˆê¸° ë¡œë”© ì™„ë£Œ í›„ ì‹¤í–‰
          
          // ðŸ·ï¸ íƒœê·¸ ìžë™ ìˆ˜ì§‘ (ë¹„ë™ê¸° - UI ë¸”ë¡œí‚¹ ì—†ìŒ)
          setTimeout(async () => {
            try {
              const novels = await all("SELECT tags, major_genre, sub_genre FROM novels;");
              if (!novels || novels.length === 0) return;
              
              const allDefaultSet = new Set([...ALL_DEFAULT_TAGS, ...MAJOR_GENRES, ...SUB_GENRES]);
              const currentCustomSet = new Set(customTagsList);
              const newTags = new Set();
              
              for (const n of novels) {
                const tags = (n.tags || "").split(",").map(t => t.trim()).filter(Boolean);
                for (const tag of tags) {
                  if (!allDefaultSet.has(tag) && !currentCustomSet.has(tag)) {
                    newTags.add(tag);
                  }
                }
                const majors = parseMajorSub(n.major_genre);
                for (const g of majors) {
                  if (!MAJOR_GENRES.includes(g) && !allDefaultSet.has(g) && !currentCustomSet.has(g)) {
                    newTags.add(g);
                  }
                }
                const subs = parseMajorSub(n.sub_genre);
                for (const g of subs) {
                  if (!SUB_GENRES.includes(g) && !allDefaultSet.has(g) && !currentCustomSet.has(g)) {
                    newTags.add(g);
                  }
                }
              }
              
              if (newTags.size > 0) {
                const updatedCustomTags = [...customTagsList, ...Array.from(newTags)];
                setCustomTags(updatedCustomTags);
                await setAppMeta("custom_tags", updatedCustomTags);
              }
            } catch (e) {
              console.warn("íƒœê·¸ ìžë™ ìˆ˜ì§‘ ì‹¤íŒ¨:", e);
            }
          }, 100); // UI ë Œë”ë§ í›„ ì‹¤í–‰
          
          setIsLoading(false);
          return; // ì„±ê³µí•˜ë©´ ì¢…ë£Œ
          
        } catch (e) {
          console.warn(`ì•± ì´ˆê¸°í™” ì˜¤ë¥˜ (ì‹œë„ ${attempt + 1}/${maxRetries}):`, e);
          resetDbConnection();
          
          if (attempt === maxRetries - 1) {
            if (mounted) {
              setIsLoading(false);
              Alert.alert(
                "ë°ì´í„°ë² ì´ìŠ¤ ì˜¤ë¥˜", 
                "ì•±ì„ ë‹¤ì‹œ ì‹œìž‘í•´ì£¼ì„¸ìš”.\n\nì˜¤ë¥˜: " + e.message,
                [{ text: "í™•ì¸" }]
              );
            }
          } else {
            // ìž¬ì‹œë„ ì „ ëŒ€ê¸°
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          }
        }
      }
    };
    
    initialize();
    
    return () => { 
      mounted = false;
      setMatchQueueCallback(null); // ðŸ”„ v3.4.6: ì½œë°± ì •ë¦¬
    };
  }, []);
  
  // ðŸ”§ v3.4.6: ì•±ì´ í¬ê·¸ë¼ìš´ë“œë¡œ ëŒì•„ì˜¬ ë•Œ DB ì—°ê²° ê°•ì œ ë¦¬ì…‹
  // ðŸ§  v3.5.0: ë°±ê·¸ë¼ìš´ë“œ ì „í™˜ ì‹œ í í”ŒëŸ¬ì‹œ ì¶”ê°€
  // ðŸ”§ v3.5.1: í¬ê·¸ë¼ìš´ë“œ ë³µê·€ ì‹œ ë°ì´í„° ë¦¬ë¡œë“œ ì¶”ê°€
  useEffect(() => {
    let lastState = AppState.currentState;
    
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      // í¬ê·¸ë¼ìš´ë“œ â†’ ë°±ê·¸ë¼ìš´ë“œ ì „í™˜ ì‹œ: í í”ŒëŸ¬ì‹œ
      if (lastState === "active" && nextAppState.match(/inactive|background/)) {
        console.log("ì•± ë°±ê·¸ë¼ìš´ë“œ ì „í™˜ - í í”ŒëŸ¬ì‹œ");
        try {
          await choiceLogQueue.flush();
        } catch (e) {
          console.warn("ë°±ê·¸ë¼ìš´ë“œ ì „í™˜ í í”ŒëŸ¬ì‹œ ì‹¤íŒ¨:", e);
        }
      }
      
      // ë°±ê·¸ë¼ìš´ë“œ â†’ í¬ê·¸ë¼ìš´ë“œ ì „í™˜ ì‹œ
      if (lastState.match(/inactive|background/) && nextAppState === "active") {
        console.log("ì•± í¬ê·¸ë¼ìš´ë“œ ì „í™˜ - DB ì—°ê²° ë¦¬ì…‹ ë° ë°ì´í„° ë¦¬ë¡œë“œ");
        // ê¸°ì¡´ ì—°ê²°ì„ ê°•ì œë¡œ ëŠê³  ìƒˆë¡œ ì—°ê²°
        resetDbConnection();
        try {
          await openDb();
          console.log("DB ìž¬ì—°ê²° ì„±ê³µ");
          // ðŸ”§ v3.5.1: ë°ì´í„° ë¦¬ë¡œë“œ
          await loadList();
          await loadCoverLibrary();
          console.log("ë°ì´í„° ë¦¬ë¡œë“œ ì„±ê³µ");
        } catch (e) {
          console.error("DB ìž¬ì—°ê²°/ë¦¬ë¡œë“œ ì‹¤íŒ¨:", e.message);
        }
      }
      lastState = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  
  // -----------------------------------------
  // ðŸ“‹ v3.3.0: ì˜ˆì • ìž‘í’ˆ ê´€ë¦¬ í•¨ìˆ˜ë“¤
  // -----------------------------------------
  
  async function loadPlannedList() {
    try {
      let orderBy = `created_at ${plannedSortDir}`;
      if (plannedSortKey === "title") {
        orderBy = `title COLLATE NOCASE ${plannedSortDir}`;
      } else if (plannedSortKey === "priority") {
        orderBy = `priority ${plannedSortDir}, created_at DESC`;
      }
      const rows = await all(`SELECT * FROM planned_novels ORDER BY ${orderBy};`);
      setPlannedList(rows || []);
    } catch (e) {
      console.warn("loadPlannedList ì˜¤ë¥˜:", e);
      setPlannedList([]);
    }
  }
  
  async function addPlannedNovel() {
    const t = (plannedTitle || "").trim();
    if (!t) {
      Alert.alert("ì•Œë¦¼", "ì œëª©ì€ í•„ìˆ˜ìž…ë‹ˆë‹¤.");
      return;
    }
    
    setIsLoading(true);
    try {
      // ë³¸ ëª©ë¡ê³¼ ì˜ˆì • ëª©ë¡ ëª¨ë‘ì—ì„œ ì¤‘ë³µ ì²´í¬
      const dupMain = await first("SELECT id FROM novels WHERE title=?", [t]);
      const dupPlanned = await first("SELECT id FROM planned_novels WHERE title=?", [t]);
      if (dupMain || dupPlanned) {
        setIsLoading(false);
        Alert.alert("ì•Œë¦¼", "ê°™ì€ ì œëª©ì´ ì´ë¯¸ ìžˆìŠµë‹ˆë‹¤.");
        return;
      }
      
      const id = uuid();
      const now = Date.now();
      
      await exec(
        `INSERT INTO planned_novels (id,title,author,tags,platforms,note,total_episodes,cover_image,link,work_status,major_genre,sub_genre,priority,created_at,expected_rating,expected_tier,interest_level,discovery_source,first_chapter_read,scheduled_start_date,similar_novels,why_interested)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
        [
          id,
          t,
          plannedAuthor.trim(),
          plannedTags.trim(),
          JSON.stringify(plannedPlatforms),
          plannedNote.trim(),
          Number(plannedTotalEpisodes) || 0,
          plannedCoverImage,
          plannedLink.trim(),
          plannedWorkStatus,
          plannedMajorGenre.length > 0 ? JSON.stringify(plannedMajorGenre) : "",
          plannedSubGenre.length > 0 ? JSON.stringify(plannedSubGenre) : "",
          plannedPriority,
          now,
          // ðŸ†• v3.4: ìƒˆ í•„ë“œë“¤
          Number(plannedExpectedRating) || 1500,
          plannedExpectedTier || "",
          plannedInterestLevel,
          plannedDiscoverySource.trim(),
          plannedFirstChapterRead ? 1 : 0,
          (() => {
            if (!plannedScheduledStart) return 0;
            try {
              const ts = new Date(plannedScheduledStart).getTime();
              return isNaN(ts) ? 0 : ts;
            } catch { return 0; }
          })(),
          plannedSimilarNovels.length > 0 ? JSON.stringify(plannedSimilarNovels) : "",
          plannedWhyInterested.trim(),
        ]
      );
      
      // í¼ ì´ˆê¸°í™”
      setPlannedTitle("");
      setPlannedAuthor("");
      setPlannedTags("");
      setPlannedNote("");
      setPlannedTotalEpisodes("");
      setPlannedPlatforms([]);
      setPlannedCoverImage("");
      setPlannedLink("");
      setPlannedWorkStatus("ongoing");
      setPlannedMajorGenre([]);
      setPlannedSubGenre([]);
      setPlannedPriority(3);
      // ðŸ†• v3.4: ìƒˆ í•„ë“œ ì´ˆê¸°í™”
      setPlannedExpectedRating("1500");
      setPlannedExpectedTier("");
      setPlannedInterestLevel(3);
      setPlannedDiscoverySource("");
      setPlannedFirstChapterRead(false);
      setPlannedScheduledStart("");
      setPlannedSimilarNovels([]);
      setPlannedWhyInterested("");
      
      await loadPlannedList();
      
      // ðŸ–¼ï¸ v3.4.5: í‘œì§€ê°€ ìžˆìœ¼ë©´ ë¼ì´ë¸ŒëŸ¬ë¦¬ ìƒíƒœ ì—…ë°ì´íŠ¸
      if (plannedCoverImage) {
        await updateCoverStatus(plannedCoverImage, id, "used");
        await loadCoverLibrary();
      }
      
      Alert.alert("ì™„ë£Œ", "ì˜ˆì • ìž‘í’ˆì´ ì¶”ê°€ë˜ì—ˆìŠµë‹ˆë‹¤.");
    } catch (e) {
      console.warn("addPlannedNovel ì˜¤ë¥˜:", e);
      Alert.alert("ì˜¤ë¥˜", "ì˜ˆì • ìž‘í’ˆ ì¶”ê°€ ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤.\n\n" + e.message);
    }
    setIsLoading(false);
  }
  
  async function removePlannedNovel(id) {
    Alert.alert("í™•ì¸", "ì´ ì˜ˆì • ìž‘í’ˆì„ ì‚­ì œí• ê¹Œìš”?", [
      { text: "ì·¨ì†Œ" },
      {
        text: "ì‚­ì œ",
        style: "destructive",
        onPress: async () => {
          // ðŸ–¼ï¸ v3.4.5: ì‚­ì œ ì „ì— í‘œì§€ í™•ì¸
          const planned = await first("SELECT cover_image FROM planned_novels WHERE id=?", [id]);
          const coverPath = planned?.cover_image;
          
          await exec("DELETE FROM planned_novels WHERE id=?", [id]);
          
          // ðŸ–¼ï¸ v3.4.5: í‘œì§€ê°€ ìžˆì—ˆìœ¼ë©´ ë¯¸ì‚¬ìš©ìœ¼ë¡œ ë³€ê²½
          if (coverPath) {
            await updateCoverStatus(coverPath, null, "unused");
            await loadCoverLibrary();
          }
          
          await loadPlannedList();
        },
      },
    ]);
  }
  
  async function savePlannedEdit() {
    const n = plannedEditItem;
    if (!n) return;
    
    const newTitle = (n.title || "").trim();
    if (!newTitle) {
      Alert.alert("ì•Œë¦¼", "ì œëª©ì€ ë¹„ìš¸ ìˆ˜ ì—†ìŠµë‹ˆë‹¤.");
      return;
    }
    
    setIsLoading(true);
    try {
      // ì¤‘ë³µ ì²´í¬ (ìžê¸° ìžì‹  ì œì™¸)
      const dupMain = await first("SELECT id FROM novels WHERE title=?", [newTitle]);
      const dupPlanned = await first("SELECT id FROM planned_novels WHERE title=? AND id<>?", [newTitle, n.id]);
      if (dupMain || dupPlanned) {
        setIsLoading(false);
        Alert.alert("ì•Œë¦¼", "ì´ë¯¸ ì¡´ìž¬í•˜ëŠ” ì œëª©ìž…ë‹ˆë‹¤.");
        return;
      }
      
      // ðŸ–¼ï¸ v3.4.5: í‘œì§€ ë³€ê²½ ì‹œ ë¼ì´ë¸ŒëŸ¬ë¦¬ ìƒíƒœ ì—…ë°ì´íŠ¸
      const originalPlanned = await first("SELECT cover_image FROM planned_novels WHERE id=?", [n.id]);
      const oldCover = originalPlanned?.cover_image || "";
      const newCover = n.cover_image || "";
      
      await exec(
        `UPDATE planned_novels SET title=?, author=?, tags=?, platforms=?, note=?, total_episodes=?, cover_image=?, link=?, work_status=?, major_genre=?, sub_genre=?, priority=?, expected_rating=?, expected_tier=?, interest_level=?, discovery_source=?, first_chapter_read=?, scheduled_start_date=?, similar_novels=?, why_interested=? WHERE id=?;`,
        [
          newTitle,
          n.author?.trim() || "",
          n.tags?.trim() || "",
          n.platforms || "[]",
          n.note?.trim() || "",
          Number(n.total_episodes) || 0,
          newCover,
          n.link?.trim() || "",
          n.work_status || "ongoing",
          n.major_genre || "",
          n.sub_genre || "",
          Number(n.priority) || 3,
          // ðŸ†• v3.4: ìƒˆ í•„ë“œë“¤
          Number(n.expected_rating) || 1500,
          n.expected_tier || "",
          Number(n.interest_level) || 3,
          n.discovery_source || "",
          n.first_chapter_read ? 1 : 0,
          n.scheduled_start_date || 0,
          n.similar_novels || "",
          n.why_interested || "",
          n.id,
        ]
      );
      
      // ðŸ–¼ï¸ v3.4.5: í‘œì§€ ë³€ê²½ ì‹œ ë¼ì´ë¸ŒëŸ¬ë¦¬ ìƒíƒœ ì—…ë°ì´íŠ¸
      if (oldCover !== newCover) {
        if (oldCover) {
          await updateCoverStatus(oldCover, null, "unused");
        }
        if (newCover) {
          await updateCoverStatus(newCover, n.id, "used");
        }
        await loadCoverLibrary();
      }
      
      setPlannedEditOpen(false);
      setPlannedEditItem(null);
      await loadPlannedList();
    } catch (e) {
      console.warn("savePlannedEdit ì˜¤ë¥˜:", e);
      Alert.alert("ì˜¤ë¥˜", "ì €ìž¥ ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤.\n\n" + e.message);
    }
    setIsLoading(false);
  }
  
  // ì˜ˆì • â†’ ë³¸ ëª©ë¡ìœ¼ë¡œ ë“±ë¡ ì „í™˜
  async function convertPlannedToNovel(planned) {
    Alert.alert(
      "ë“±ë¡ ì „í™˜",
      `"${planned.title}"ì„(ë¥¼) ë³¸ ëª©ë¡ìœ¼ë¡œ ë“±ë¡í• ê¹Œìš”?\n\nì˜ˆì • ëª©ë¡ì˜ ëª¨ë“  ì •ë³´ê°€ ì´ì „ë©ë‹ˆë‹¤.`,
      [
        { text: "ì·¨ì†Œ" },
        {
          text: "ë“±ë¡ ì „í™˜",
          onPress: async () => {
            setIsLoading(true);
            try {
              const id = uuid();
              const now = Date.now();
              
              // ðŸ†• v3.4.1 #13: ì˜ˆì •ìž‘í’ˆì˜ ì¶”ê°€ ì •ë³´ë¥¼ ë©”ëª¨ì— ë³‘í•©
              let enhancedNote = planned.note || "";
              const noteAdditions = [];
              
              // ê´€ì‹¬ ê°–ê²Œ ëœ ì´ìœ 
              if (planned.why_interested) {
                noteAdditions.push(`[ê´€ì‹¬ ì´ìœ ] ${planned.why_interested}`);
              }
              // ë°œê²¬ ê²½ë¡œ
              if (planned.discovery_source) {
                noteAdditions.push(`[ë°œê²¬ ê²½ë¡œ] ${planned.discovery_source}`);
              }
              // ì˜ˆìƒ í‹°ì–´
              if (planned.expected_tier) {
                noteAdditions.push(`[ì˜ˆìƒ í‹°ì–´] ${planned.expected_tier}`);
              }
              // ê´€ì‹¬ë„
              if (planned.interest_level && planned.interest_level !== 3) {
                noteAdditions.push(`[ë“±ë¡ ì „ ê´€ì‹¬ë„] ${"â˜…".repeat(planned.interest_level)}${"â˜†".repeat(5 - planned.interest_level)}`);
              }
              // ì½ê¸° ì‹œìž‘ ì˜ˆì •ì¼
              if (planned.scheduled_start_date && planned.scheduled_start_date > 0) {
                try {
                  const dateStr = new Date(planned.scheduled_start_date).toLocaleDateString();
                  noteAdditions.push(`[ì½ê¸° ì˜ˆì •ì¼] ${dateStr}`);
                } catch {}
              }
              // ë¹„ìŠ·í•œ ìž‘í’ˆ ì •ë³´
              if (planned.similar_novels) {
                try {
                  const similarIds = JSON.parse(planned.similar_novels);
                  if (Array.isArray(similarIds) && similarIds.length > 0) {
                    const similarTitles = similarIds
                      .map(sid => list.find(n => n.id === sid)?.title)
                      .filter(Boolean);
                    if (similarTitles.length > 0) {
                      noteAdditions.push(`[ë¹„ìŠ·í•œ ìž‘í’ˆ] ${similarTitles.join(", ")}`);
                    }
                  }
                } catch {}
              }
              
              if (noteAdditions.length > 0) {
                enhancedNote = enhancedNote 
                  ? `${enhancedNote}\n\n--- ì˜ˆì •ìž‘í’ˆ ì •ë³´ ---\n${noteAdditions.join("\n")}`
                  : `--- ì˜ˆì •ìž‘í’ˆ ì •ë³´ ---\n${noteAdditions.join("\n")}`;
              }
              
              // 1í™” ì½ìŒ ì—¬ë¶€ â†’ read_count
              const initialReadCount = planned.first_chapter_read ? 1 : 0;
              
              // ìš°ì„ ìˆœìœ„ â†’ pinned (4 ì´ìƒì´ë©´ ê³ ì •)
              const shouldPin = (planned.priority || 3) >= 4 ? 1 : 0;
              
              // ë³¸ ëª©ë¡ì— ë“±ë¡ (ëª¨ë“  í•„ë“œ ì´ì „)
              await exec(
                `INSERT INTO novels (id,title,author,tags,platforms,note,read_count,rating,rd,wins,losses,match_count,tier,created_at,awards,total_episodes,status,pinned,cover_image,link,work_status,read_count_updated_at,major_genre,sub_genre,gaiden_status,gaiden_read_count,gaiden_total_episodes,reread_count,tag_data,memorable_quote,aliases,manual_tier)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
                [
                  id,
                  planned.title,
                  planned.author || "",
                  planned.tags || "",
                  planned.platforms || "[]",
                  enhancedNote, // ðŸ†• ê°•í™”ëœ ë©”ëª¨
                  initialReadCount, // ðŸ†• 1í™” ì½ì—ˆìœ¼ë©´ 1íšŒì°¨ë¡œ ì‹œìž‘
                  1500, // rating
                  350, // rd
                  0, // wins
                  0, // losses
                  0, // match_count
                  "C", // tier
                  now,
                  "", // awards
                  Number(planned.total_episodes) || 0,
                  "reading", // status
                  shouldPin, // ðŸ†• ìš°ì„ ìˆœìœ„ ë†’ìœ¼ë©´ ê³ ì •
                  planned.cover_image || "",
                  planned.link || "",
                  planned.work_status || "ongoing",
                  now, // read_count_updated_at
                  planned.major_genre || "",
                  planned.sub_genre || "",
                  "none", // gaiden_status
                  0, // gaiden_read_count
                  0, // gaiden_total_episodes
                  1, // reread_count
                  planned.tag_data || "", // ðŸ†• íƒœê·¸ ë°ì´í„° ì´ì „
                  "", // memorable_quote
                  "", // aliases
                  null, // manual_tier
                ]
              );
              
              // ì˜ˆì • ëª©ë¡ì—ì„œ ì‚­ì œ
              await exec("DELETE FROM planned_novels WHERE id=?", [planned.id]);
              
              await loadPlannedList();
              await loadList();
              
              // ðŸ–¼ï¸ v3.4.5: í‘œì§€ê°€ ìžˆìœ¼ë©´ ë¼ì´ë¸ŒëŸ¬ë¦¬ ìƒíƒœ ì—…ë°ì´íŠ¸
              if (planned.cover_image) {
                await applyNovelCover(id, planned.cover_image, null);
                await loadCoverLibrary();
              }
              
              // ðŸ“° ìµœì‹  ë³€í™” ê¸°ë¡
              let majorGenreText = "-";
              if (planned.major_genre) {
                try {
                  const genres = JSON.parse(planned.major_genre);
                  if (Array.isArray(genres)) majorGenreText = genres.join(", ");
                } catch {}
              }
              
              await addRecentChange(id, planned.title, "new", {
                author: planned.author || "-",
                majorGenre: majorGenreText,
                fromPlanned: true,
              });
              
              const infoMsg = noteAdditions.length > 0 
                ? `\n\nì˜ˆì •ìž‘í’ˆ ì •ë³´(${noteAdditions.length}ê±´)ê°€ ë©”ëª¨ì— ì¶”ê°€ë˜ì—ˆìŠµë‹ˆë‹¤.`
                : "";
              Alert.alert("ì™„ë£Œ", `"${planned.title}"ì´(ê°€) ë³¸ ëª©ë¡ì— ë“±ë¡ë˜ì—ˆìŠµë‹ˆë‹¤.${infoMsg}`);
            } catch (e) {
              console.warn("convertPlannedToNovel ì˜¤ë¥˜:", e);
              Alert.alert("ì˜¤ë¥˜", "ë“±ë¡ ì „í™˜ ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤.\n\n" + e.message);
            }
            setIsLoading(false);
          },
        },
      ]
    );
  }

  // -----------------------------------------
  // ðŸŽ¯ v3.3.0: ì˜¤ëŠ˜ì˜ ì¶”ì²œ ì›¹ì†Œì„¤ ê³„ì‚°
  // - 1ì¼ê°„ ìœ ì§€
  // - ìš°ì„ ìˆœìœ„ (í™•ë¥  ê°€ì¤‘ì¹˜ ì ìš©):
  //   1) ì½ì§€ ì•Šì€ ì˜ˆì •ìž‘ (ê°€ì¤‘ì¹˜ 100)
  //   2) ê±°ì˜ ë‹¤ ì½ì—ˆê³  ëì„ ë‚¨ê²¨ë‘” ìž‘í’ˆ (ê°€ì¤‘ì¹˜ 90)
  //   3) ì·¨í–¥ì— ë§žëŠ”ë° ì•ˆ ì½ê³  ìžˆëŠ” ìž‘í’ˆ (ê°€ì¤‘ì¹˜ 80)
  //   4) ë°ì´í„°ê°€ ë¹„êµì  ì ì€ ìž‘í’ˆ, í•˜ì°¨ ì œì™¸ (ê°€ì¤‘ì¹˜ 70)
  //   5) ì—¬ëŸ¬ ê´€ì ì—ì„œ ì·¨í–¥ì— ë§žì„ë§Œí•œ ìž‘í’ˆ (ê°€ì¤‘ì¹˜ 60)
  //   6) í‹°ì–´ ë†’ì€ ëœ ì½ì€ ìž‘í’ˆ (ê°€ì¤‘ì¹˜ 50)
  //   7) ê¸°íƒ€ ìž‘í’ˆ (ê°€ì¤‘ì¹˜ 20)
  //   8) ì™„ê²°ê¹Œì§€ ë‹¤ ì½ì—ˆëŠ”ë° ë‹¤íšŒë… ì¶”ì²œ (ê°€ì¤‘ì¹˜ 30)
  // - ìµœê·¼ 5íšŒ ì¶”ì²œ ë‚´ ìž¬ì¶”ì²œ ë°©ì§€
  // -----------------------------------------
  async function refreshDailyRecommendation(forceNew = false) {
    try {
      const novels = await all("SELECT * FROM novels;");
      const planned = await all("SELECT * FROM planned_novels;");
      
      if ((!novels || novels.length === 0) && (!planned || planned.length === 0)) {
        setDailyReco(null);
        return;
      }

      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      // ìµœê·¼ ì¶”ì²œ ížˆìŠ¤í† ë¦¬ ë¡œë“œ
      let history = await getAppMeta("reco_history") || [];
      setRecoHistory(history);
      
      // 5íšŒ ì´ë‚´ ì¶”ì²œëœ ìž‘í’ˆ ID ì§‘í•©
      const recentIds = new Set(history.slice(0, 5).map(h => h.novelId));

      if (!forceNew) {
        const saved = await getAppMeta("daily_reco");
        if (saved && saved.novel_id && saved.picked_at && now - saved.picked_at < dayMs) {
          // ì˜ˆì •ìž‘ì¸ì§€ ë³¸ëª©ë¡ì¸ì§€ í™•ì¸
          const existingNovel = novels?.find((n) => n.id === saved.novel_id);
          const existingPlanned = planned?.find((p) => p.id === saved.novel_id);
          
          if (existingNovel) {
            setDailyReco({
              novel: existingNovel,
              pickedAt: saved.picked_at,
              reason: saved.reason || "ì´ì „ ì¶”ì²œ",
              category: saved.category || "other",
              isPlanned: false,
            });
            return;
          } else if (existingPlanned) {
            setDailyReco({
              novel: existingPlanned,
              pickedAt: saved.picked_at,
              reason: saved.reason || "ì½ê³  ì‹¶ì—ˆë˜ ì˜ˆì •ìž‘",
              category: saved.category || "planned_unread",
              isPlanned: true,
            });
            return;
          }
        }
      }

      // ì¶”ì²œ í›„ë³´ í’€ êµ¬ì„± (ê°€ì¤‘ì¹˜ ê¸°ë°˜)
      const candidates = [];
      const totalNovelCount = novels?.length || 0;
      
      // ì·¨í–¥ ë¶„ì„ ë°ì´í„° (ê°„ëžµí™”)
      const avgRating = totalNovelCount > 0 
        ? novels.reduce((sum, n) => sum + (Number(n.rating) || 1500), 0) / totalNovelCount 
        : 1500;
      
      // ì„ í˜¸ ìž¥ë¥´ ì¶”ì¶œ (ìƒìœ„ í‹°ì–´ ìž‘í’ˆ ê¸°ì¤€)
      const highTierNovels = (novels || []).filter(n => (Number(n.rating) || 1500) >= 1700);
      const preferredGenres = new Set();
      const preferredTags = new Set();
      for (const n of highTierNovels) {
        if (n.major_genre) {
          try { JSON.parse(n.major_genre).forEach(g => preferredGenres.add(g)); } catch {}
        }
        if (n.tags) {
          n.tags.split(",").map(t => t.trim()).filter(Boolean).forEach(t => preferredTags.add(t));
        }
      }

      // 1) ì½ì§€ ì•Šì€ ì˜ˆì •ìž‘ (ê°€ì¤‘ì¹˜ 100)
      for (const p of (planned || [])) {
        if (recentIds.has(p.id)) continue;
        
        // ì·¨í–¥ ì¼ì¹˜ë„ ê³„ì‚°
        let tasteMatch = 50; // ê¸°ë³¸ê°’
        if (p.major_genre) {
          try {
            const genres = JSON.parse(p.major_genre);
            if (genres.some(g => preferredGenres.has(g))) tasteMatch += 30;
          } catch {}
        }
        if (p.tags) {
          const tags = p.tags.split(",").map(t => t.trim()).filter(Boolean);
          if (tags.some(t => preferredTags.has(t))) tasteMatch += 20;
        }
        
        candidates.push({
          novel: p,
          weight: 100 + tasteMatch, // ê¸°ë³¸ 100 + ì·¨í–¥ ë³´ë„ˆìŠ¤
          category: "planned_unread",
          reason: `ðŸ“‹ ì•„ì§ ì½ì§€ ì•Šì€ ì˜ˆì •ìž‘ìž…ë‹ˆë‹¤. ${tasteMatch > 50 ? "ì·¨í–¥ê³¼ë„ ìž˜ ë§žì„ ê²ƒ ê°™ìŠµë‹ˆë‹¤!" : ""}`,
          isPlanned: true,
        });
      }

      // ë³¸ ëª©ë¡ ìž‘í’ˆ ë¶„ë¥˜
      for (const n of (novels || [])) {
        if (recentIds.has(n.id)) continue;
        if (n.status === "dropped") continue; // í•˜ì°¨ ì œì™¸
        
        const totalEp = Number(n.total_episodes) || 0;
        const readCount = Number(n.read_count) || 0;
        const rating = Number(n.rating) || 1500;
        const reliability = computeReliability(n, totalNovelCount);
        const rereadCount = Number(n.reread_count) || 1;
        const isCompleted = n.work_status === "completed";
        const readRatio = totalEp > 0 ? readCount / totalEp : 0;
        
        // ì·¨í–¥ ì¼ì¹˜ë„ ê³„ì‚°
        let tasteMatch = 0;
        if (n.major_genre) {
          try {
            const genres = JSON.parse(n.major_genre);
            if (genres.some(g => preferredGenres.has(g))) tasteMatch += 30;
          } catch {}
        }
        if (n.tags) {
          const tags = n.tags.split(",").map(t => t.trim()).filter(Boolean);
          const matchCount = tags.filter(t => preferredTags.has(t)).length;
          tasteMatch += Math.min(30, matchCount * 10);
        }
        
        // 2) ê±°ì˜ ë‹¤ ì½ì—ˆê³  ëì„ ë‚¨ê²¨ë‘” ìž‘í’ˆ (90%+)
        if (totalEp > 0 && readRatio >= 0.9 && readRatio < 1.0 && n.status === "reading") {
          candidates.push({
            novel: n,
            weight: 90 + tasteMatch,
            category: "almost_done",
            reason: `ðŸ“– ê±°ì˜ ë‹¤ ì½ì—ˆìŠµë‹ˆë‹¤! (${Math.round(readRatio * 100)}%) ë§ˆì§€ë§‰ê¹Œì§€ ì½ì–´ë³´ì„¸ìš”.`,
            isPlanned: false,
          });
          continue;
        }
        
        // 3) ì·¨í–¥ì— ë§žëŠ”ë° ì•ˆ ì½ê³  ìžˆëŠ” ìž‘í’ˆ (ë³´ë¥˜ ìƒíƒœì´ë©´ì„œ ì·¨í–¥ ì¼ì¹˜)
        if (n.status === "paused" && tasteMatch >= 30 && rating >= avgRating) {
          candidates.push({
            novel: n,
            weight: 80 + tasteMatch,
            category: "taste_match_paused",
            reason: `â¸ï¸ ë³´ë¥˜ ì¤‘ì´ì§€ë§Œ ì·¨í–¥ì— ë§žëŠ” ìž‘í’ˆìž…ë‹ˆë‹¤. ë‹¤ì‹œ ì½ì–´ë³´ì‹œëŠ” ê±´ ì–´ë–¨ê¹Œìš”?`,
            isPlanned: false,
          });
          continue;
        }
        
        // 4) ë°ì´í„°ê°€ ë¹„êµì  ì ì€ ìž‘í’ˆ (ì‹ ë¢°ë„ ë‚®ìŒ)
        if (reliability > 0 && reliability < 40 && n.status !== "dropped") {
          candidates.push({
            novel: n,
            weight: 70 + tasteMatch / 2,
            category: "low_data",
            reason: `ðŸ“Š ì•„ì§ ë°ì´í„°ê°€ ë¶€ì¡±í•©ë‹ˆë‹¤. (ì‹ ë¢°ë„ ${Math.round(reliability)}%) ë” ì½ê±°ë‚˜ ë§¤ì¹­í•´ë³´ì„¸ìš”!`,
            isPlanned: false,
          });
          continue;
        }
        
        // 5) ì—¬ëŸ¬ ê´€ì ì—ì„œ ì·¨í–¥ì— ë§žì„ë§Œí•œ ìž‘í’ˆ (í‹°ì–´ ë†’ê³  ì·¨í–¥ ì¼ì¹˜)
        if (rating >= 1700 && tasteMatch >= 40 && n.status === "reading") {
          candidates.push({
            novel: n,
            weight: 60 + tasteMatch,
            category: "taste_high_tier",
            reason: `â­ ë†’ì€ í‹°ì–´ + ì·¨í–¥ ì¼ì¹˜! ì´ ìž‘í’ˆì„ ë” ì½ì–´ë³´ì„¸ìš”.`,
            isPlanned: false,
          });
          continue;
        }
        
        // 6) í‹°ì–´ ë†’ì€ ëœ ì½ì€ ìž‘í’ˆ
        const tier = tierFromRating(rating);
        if (["S", "A", "B+"].includes(tier) && (totalEp === 0 || readRatio < 0.5)) {
          candidates.push({
            novel: n,
            weight: 50 + (rating - 1500) / 20,
            category: "high_tier_less_read",
            reason: `ðŸ† ${tier} í‹°ì–´ ìž‘í’ˆì¸ë° ì•„ì§ ${totalEp > 0 ? Math.round(readRatio * 100) + '%' : 'ì¡°ê¸ˆ'}ë°–ì— ì•ˆ ì½ì—ˆìŠµë‹ˆë‹¤.`,
            isPlanned: false,
          });
          continue;
        }
        
        // 8) ì™„ê²°ê¹Œì§€ ë‹¤ ì½ì—ˆëŠ”ë° ë‹¤íšŒë… ì¶”ì²œ (ì·¨í–¥ ì¼ì¹˜ + ê³ í‰ì )
        if (isCompleted && totalEp > 0 && readRatio >= 1.0 && rating >= 1800 && tasteMatch >= 30) {
          candidates.push({
            novel: n,
            weight: 30 + tasteMatch,
            category: "reread_recommend",
            reason: `ðŸ”„ ì™„ë…í•œ ê³ í‰ì  ìž‘í’ˆ! ${rereadCount > 1 ? `ì´ë¯¸ ${rereadCount}íšŒë… í–ˆì§€ë§Œ ` : ''}ë‹¤ì‹œ ì½ì–´ë³´ì„¸ìš”.`,
            isPlanned: false,
          });
          continue;
        }
        
        // 7) ê¸°íƒ€ ìž‘í’ˆ (ë‚®ì€ ê°€ì¤‘ì¹˜)
        if (n.status === "reading" || n.status === "finished") {
          candidates.push({
            novel: n,
            weight: 20 + tasteMatch / 3,
            category: "other",
            reason: `ðŸ“š ëª©ë¡ì— ìžˆëŠ” ìž‘í’ˆìž…ë‹ˆë‹¤.`,
            isPlanned: false,
          });
        }
      }

      if (candidates.length === 0) {
        setDailyReco(null);
        return;
      }

      // ê°€ì¤‘ì¹˜ ê¸°ë°˜ í™•ë¥ ì  ì„ íƒ
      const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
      let rand = Math.random() * totalWeight;
      let pick = candidates[0];
      
      for (const c of candidates) {
        rand -= c.weight;
        if (rand <= 0) {
          pick = c;
          break;
        }
      }

      // ì¶”ì²œ ížˆìŠ¤í† ë¦¬ ì—…ë°ì´íŠ¸
      const newHistory = [
        { novelId: pick.novel.id, pickedAt: now },
        ...history.slice(0, 9), // ìµœëŒ€ 10ê°œ ìœ ì§€
      ];
      await setAppMeta("reco_history", newHistory);
      setRecoHistory(newHistory);

      // ì¶”ì²œ ì €ìž¥
      const meta = {
        novel_id: pick.novel.id,
        picked_at: now,
        reason: pick.reason,
        category: pick.category,
        isPlanned: pick.isPlanned,
      };
      await setAppMeta("daily_reco", meta);

      setDailyReco({
        novel: pick.novel,
        pickedAt: now,
        reason: pick.reason,
        category: pick.category,
        isPlanned: pick.isPlanned,
      });
    } catch (e) {
      console.warn("refreshDailyRecommendation ì˜¤ë¥˜:", e);
      setDailyReco(null);
    }
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // ðŸ–¼ï¸ í‘œì§€ ë¼ì´ë¸ŒëŸ¬ë¦¬ ì‹œìŠ¤í…œ (v3.4.5)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  // í‘œì§€ ë¼ì´ë¸ŒëŸ¬ë¦¬ ë¡œë“œ
  async function loadCoverLibrary() {
    try {
      const rows = await all(`SELECT * FROM cover_library ORDER BY created_at DESC;`);
      setCoverLibrary(rows || []);
      
      // ìš©ëŸ‰ ê³„ì‚°
      const size = await getCoverLibrarySize();
      setCoverLibrarySize(size);
    } catch (e) {
      console.warn("loadCoverLibrary error:", e);
      setCoverLibrary([]);
    }
  }

  // ê°¤ëŸ¬ë¦¬ì—ì„œ ì´ë¯¸ì§€ ë‹¤ì¤‘ ì„ íƒ í›„ ë¼ì´ë¸ŒëŸ¬ë¦¬ì— ì €ìž¥
  async function importCoversFromGallery() {
    try {
      const compressionLevel = appSettings.coverLibrary?.compressionLevel || "light";
      const preset = COMPRESSION_PRESETS[compressionLevel] || COMPRESSION_PRESETS.light;
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: preset.quality,
        // ì´ë¯¸ì§€ ë¦¬ì‚¬ì´ì¦ˆ (expo-image-picker SDK 48+)
        ...(preset.maxSize && {
          exif: false,
          allowsEditing: false,
        }),
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      // ðŸ”§ v3.5.1: ê°¤ëŸ¬ë¦¬ì—ì„œ ëŒì•„ì˜¨ í›„ DB ì—°ê²° í™•ì¸ ë° ë³µêµ¬
      resetDbConnection();
      try {
        await openDb();
        // 🔧 v3.5.3: DB 안정화 대기
        await new Promise(r => setTimeout(r, 300));
      } catch (dbErr) {
        console.error("ê°¤ëŸ¬ë¦¬ ë³µê·€ í›„ DB ì—°ê²° ì‹¤íŒ¨:", dbErr);
        Alert.alert("ì˜¤ë¥˜", "ë°ì´í„°ë² ì´ìŠ¤ ì—°ê²°ì´ ëŠì–´ì¡ŒìŠµë‹ˆë‹¤. ì•±ì„ ë‹¤ì‹œ ì‹œìž‘í•´ì£¼ì„¸ìš”.");
        return;
      }

      const assets = result.assets;
      const total = assets.length;
      
      setCoverLibraryLoading(true);
      setCoverLibraryProgress({ current: 0, total });

      const insertQueries = [];
      let successCount = 0;

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        setCoverLibraryProgress({ current: i + 1, total });
        
        // íŒŒì¼ ì €ìž¥
        const saved = await saveCoverToLibrary(asset.uri, compressionLevel);
        if (saved) {
          const id = saved.id;
          insertQueries.push({
            sql: `INSERT INTO cover_library (id, file_path, status, novel_id, original_name, width, height, file_size, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            params: [
              id,
              saved.file_path,
              "unused",
              null,
              asset.fileName || `cover_${id}.jpg`,
              asset.width || 0,
              asset.height || 0,
              saved.file_size,
              Date.now(),
            ],
          });
          successCount++;
        }
      }

      if (insertQueries.length > 0) {
        await execBatch(insertQueries);
      }

      setCoverLibraryLoading(false);
      setCoverLibraryProgress({ current: 0, total: 0 });
      
      await loadCoverLibrary();
      
      // ðŸ”§ v3.4.6: ì‹¤íŒ¨ ê°œìˆ˜ë„ í•¨ê»˜ í‘œì‹œ
      const failCount = total - successCount;
      if (failCount > 0) {
        Alert.alert("ì™„ë£Œ", `${successCount}ê°œ ì„±ê³µ, ${failCount}ê°œ ì‹¤íŒ¨\n\nì‹¤íŒ¨í•œ ì´ë¯¸ì§€ëŠ” í˜•ì‹ì´ ì§€ì›ë˜ì§€ ì•Šê±°ë‚˜ ì ‘ê·¼í•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.`);
      } else {
        Alert.alert("ì™„ë£Œ", `${successCount}ê°œì˜ í‘œì§€ë¥¼ ë¼ì´ë¸ŒëŸ¬ë¦¬ì— ì¶”ê°€í–ˆìŠµë‹ˆë‹¤.`);
      }
    } catch (e) {
      console.warn("importCoversFromGallery error:", e);
      setCoverLibraryLoading(false);
      setCoverLibraryProgress({ current: 0, total: 0 });
      
      // ðŸ”§ v3.5.1: ì—ëŸ¬ ë°œìƒ ì‹œ DB ì—°ê²° ë³µêµ¬ ì‹œë„ í›„ ë°ì´í„° ë¦¬ë¡œë“œ
      resetDbConnection();
      try {
        await openDb();
        await loadCoverLibrary();
        await loadList();  // ì „ì²´ ë°ì´í„°ë„ ë¦¬ë¡œë“œ
      } catch (recoveryErr) {
        console.error("ë³µêµ¬ ì‹¤íŒ¨:", recoveryErr);
      }
      
      Alert.alert("ì˜¤ë¥˜", "ì´ë¯¸ì§€ ê°€ì ¸ì˜¤ê¸° ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤.\n\në°ì´í„°ë¥¼ ë‹¤ì‹œ ë¶ˆëŸ¬ì™”ìŠµë‹ˆë‹¤.");
    }
  }

  // í‘œì§€ ë¼ì´ë¸ŒëŸ¬ë¦¬ì—ì„œ ì´ë¯¸ì§€ ì‚­ì œ
  async function removeCoverFromLibrary(coverId) {
    try {
      const cover = coverLibrary.find(c => c.id === coverId);
      if (!cover) return;

      if (cover.status === "used") {
        Alert.alert("ì•Œë¦¼", "ì‚¬ìš© ì¤‘ì¸ í‘œì§€ëŠ” ì‚­ì œí•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤. ë¨¼ì € í•´ë‹¹ ìž‘í’ˆì˜ í‘œì§€ë¥¼ ë³€ê²½í•´ì£¼ì„¸ìš”.");
        return;
      }

      Alert.alert("í™•ì¸", "ì´ í‘œì§€ë¥¼ ì‚­ì œí• ê¹Œìš”?", [
        { text: "ì·¨ì†Œ" },
        {
          text: "ì‚­ì œ",
          style: "destructive",
          onPress: async () => {
            // íŒŒì¼ ì‚­ì œ
            await deleteCoverFromLibrary(cover.file_path);
            // DBì—ì„œ ì‚­ì œ
            await exec("DELETE FROM cover_library WHERE id=?", [coverId]);
            await loadCoverLibrary();
          },
        },
      ]);
    } catch (e) {
      console.warn("removeCoverFromLibrary error:", e);
    }
  }

  // ë¯¸ì‚¬ìš© í‘œì§€ ì „ì²´ ì‚­ì œ
  async function removeAllUnusedCovers() {
    try {
      const unusedCovers = coverLibrary.filter(c => c.status === "unused");
      if (unusedCovers.length === 0) {
        Alert.alert("ì•Œë¦¼", "ì‚­ì œí•  ë¯¸ì‚¬ìš© í‘œì§€ê°€ ì—†ìŠµë‹ˆë‹¤.");
        return;
      }

      Alert.alert("í™•ì¸", `ë¯¸ì‚¬ìš© í‘œì§€ ${unusedCovers.length}ê°œë¥¼ ëª¨ë‘ ì‚­ì œí• ê¹Œìš”?`, [
        { text: "ì·¨ì†Œ" },
        {
          text: "ì‚­ì œ",
          style: "destructive",
          onPress: async () => {
            setCoverLibraryLoading(true);
            
            for (const cover of unusedCovers) {
              await deleteCoverFromLibrary(cover.file_path);
            }
            
            await exec("DELETE FROM cover_library WHERE status='unused'");
            
            setCoverLibraryLoading(false);
            await loadCoverLibrary();
            Alert.alert("ì™„ë£Œ", `${unusedCovers.length}ê°œì˜ ë¯¸ì‚¬ìš© í‘œì§€ë¥¼ ì‚­ì œí–ˆìŠµë‹ˆë‹¤.`);
          },
        },
      ]);
    } catch (e) {
      console.warn("removeAllUnusedCovers error:", e);
      setCoverLibraryLoading(false);
    }
  }

  // í‘œì§€ ìƒíƒœ ì—…ë°ì´íŠ¸ (ìž‘í’ˆì— í‘œì§€ ì ìš©/í•´ì œ ì‹œ í˜¸ì¶œ)
  async function updateCoverStatus(filePath, novelId, status) {
    try {
      // filePathë¡œ cover_libraryì—ì„œ ì°¾ê¸°
      const cover = await first("SELECT * FROM cover_library WHERE file_path=?", [filePath]);
      if (cover) {
        await exec(
          "UPDATE cover_library SET status=?, novel_id=? WHERE id=?",
          [status, novelId || null, cover.id]
        );
      }
    } catch (e) {
      console.warn("updateCoverStatus error:", e);
    }
  }

  // ìž‘í’ˆì— í‘œì§€ ì ìš© ì‹œ ì´ì „ í‘œì§€ í•´ì œ + ìƒˆ í‘œì§€ ì‚¬ìš© ì¤‘ìœ¼ë¡œ ë³€ê²½
  async function applyNovelCover(novelId, newCoverPath, oldCoverPath) {
    try {
      // ì´ì „ í‘œì§€ê°€ ìžˆìœ¼ë©´ ë¯¸ì‚¬ìš©ìœ¼ë¡œ ë³€ê²½
      if (oldCoverPath && oldCoverPath !== newCoverPath) {
        await updateCoverStatus(oldCoverPath, null, "unused");
      }
      // ìƒˆ í‘œì§€ê°€ ë¼ì´ë¸ŒëŸ¬ë¦¬ì— ìžˆìœ¼ë©´ ì‚¬ìš© ì¤‘ìœ¼ë¡œ ë³€ê²½
      if (newCoverPath) {
        await updateCoverStatus(newCoverPath, novelId, "used");
      }
    } catch (e) {
      console.warn("applyNovelCover error:", e);
    }
  }

  // í‘œì§€ ì„ íƒ ëª¨ë‹¬ì—ì„œ í‘œì§€ ì„ íƒ ì‹œ
  async function selectCoverFromLibrary(cover) {
    try {
      const filePath = cover.file_path;
      
      if (coverSelectTarget === "new") {
        setNewCoverImage(filePath);
      } else if (coverSelectTarget === "edit" && editItem) {
        const oldCover = editItem.cover_image;
        setEditCoverImage(filePath);
        // íŽ¸ì§‘ ì¤‘ì¸ ì•„ì´í…œì˜ í‘œì§€ë„ ì—…ë°ì´íŠ¸
        setEditItem({ ...editItem, cover_image: filePath });
      } else if (coverSelectTarget === "planned") {
        setPlannedCoverImage(filePath);
      } else if (coverSelectTarget === "plannedEdit" && plannedEditItem) {
        setPlannedEditItem({ ...plannedEditItem, cover_image: filePath });
      }
      
      setCoverSelectModalOpen(false);
    } catch (e) {
      console.warn("selectCoverFromLibrary error:", e);
    }
  }

  async function loadMatchStats() {
    try {
      const novels = await all(`SELECT id FROM novels;`);
      const n = novels?.length || 0;
      if (n < 2) {
        setMatchStats({ total: 0, done: 0, percent: 0 });
        return;
      }
      const total = (n * (n - 1)) / 2;
      const rows = await all(
        `SELECT COUNT(DISTINCT (CASE WHEN a_id < b_id THEN a_id || '|' || b_id ELSE b_id || '|' || a_id END)) AS c FROM matches;`
      );
      const done = rows?.[0]?.c || 0;
      const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
      setMatchStats({ total, done, percent });
    } catch (e) {
      console.warn("loadMatchStats ì˜¤ë¥˜:", e);
      setMatchStats({ total: 0, done: 0, percent: 0 });
    }
  }

  // ðŸ”® v3.0.3: ìŠ¹ë¶€ì˜ˆì¸¡ ë¶„ì„ ì‹œìŠ¤í…œ
  // ë‘ ìž‘í’ˆ ê°„ ì§ì ‘ ëŒ€ê²° ì „ì  ì¡°íšŒ
  async function getHeadToHead(aId, bId) {
    const matches = await all(
      `SELECT winner_id FROM matches WHERE (a_id=? AND b_id=?) OR (a_id=? AND b_id=?)`,
      [aId, bId, bId, aId]
    );
    let aWins = 0, bWins = 0;
    for (const m of matches) {
      if (m.winner_id === aId) aWins++;
      else if (m.winner_id === bId) bWins++;
    }
    return { aWins, bWins, total: matches.length };
  }

  // ìž¥ë¥´ ìƒì„± ë¶„ì„ (ê°™ì€ ìž¥ë¥´ ê°„ ì „ì  ì§‘ê³„)
  async function analyzeGenreMatchup(genreA, genreB) {
    if (!genreA || !genreB) return null;
    
    // ê°™ì€ ìž¥ë¥´ë©´ ë¶„ì„ ë¶ˆí•„ìš”
    if (genreA === genreB) return { type: "same", advantage: 0 };
    
    // í•´ë‹¹ ìž¥ë¥´ì˜ ìž‘í’ˆë“¤ ê°€ì ¸ì˜¤ê¸°
    const novelsA = await all(`SELECT id FROM novels WHERE major_genre LIKE ?`, [`%${genreA}%`]);
    const novelsB = await all(`SELECT id FROM novels WHERE major_genre LIKE ?`, [`%${genreB}%`]);
    
    if (novelsA.length === 0 || novelsB.length === 0) return null;
    
    const idsA = new Set(novelsA.map(n => n.id));
    const idsB = new Set(novelsB.map(n => n.id));
    
    // ë‘ ìž¥ë¥´ ê°„ ëŒ€ê²° ê¸°ë¡ ì¡°íšŒ
    const matches = await all(`SELECT a_id, b_id, winner_id FROM matches`);
    
    let genreAWins = 0, genreBWins = 0;
    for (const m of matches) {
      const aIsGenreA = idsA.has(m.a_id) && !idsA.has(m.b_id);
      const bIsGenreA = idsA.has(m.b_id) && !idsA.has(m.a_id);
      const aIsGenreB = idsB.has(m.a_id) && !idsB.has(m.b_id);
      const bIsGenreB = idsB.has(m.b_id) && !idsB.has(m.a_id);
      
      // Aìž¥ë¥´ vs Bìž¥ë¥´ ëŒ€ê²°ì¸ ê²½ìš°ë§Œ
      if ((aIsGenreA && bIsGenreB) || (aIsGenreB && bIsGenreA)) {
        if (idsA.has(m.winner_id)) genreAWins++;
        else if (idsB.has(m.winner_id)) genreBWins++;
      }
    }
    
    const total = genreAWins + genreBWins;
    if (total === 0) return null;
    
    const advantage = (genreAWins - genreBWins) / total; // -1 ~ 1
    return { type: "cross", genreAWins, genreBWins, total, advantage };
  }

  // ì¢…í•© ìŠ¹ë¶€ì˜ˆì¸¡ ë¶„ì„
  async function analyzeMatchPrediction(A, B) {
    if (!A || !B) return null;
    
    // 1. Elo ê¸°ë°˜ ì˜ˆìƒ ìŠ¹ë¥ 
    const eloWinRateA = expected(A.rating, B.rating);
    const eloWinRateB = 1 - eloWinRateA;
    
    // 2. ì§ì ‘ ëŒ€ê²° ì „ì 
    const h2h = await getHeadToHead(A.id, B.id);
    
    // 3. RD ì‹ ë¢°ë„ (ë‚®ì„ìˆ˜ë¡ ì‹ ë¢°ë„ ë†’ìŒ)
    const rdA = A.rd || 350;
    const rdB = B.rd || 350;
    const reliabilityA = Math.max(0, 1 - (rdA - 60) / 290); // 60~350 â†’ 1~0
    const reliabilityB = Math.max(0, 1 - (rdB - 60) / 290);
    
    // 4. ì½ì€ íšŒì°¨ ë¹„ìœ¨ (ë” ë§Žì´ ì½ì€ ìž‘í’ˆì— ëŒ€í•œ í™•ì‹ )
    const readRatioA = A.total_episodes > 0 ? (A.read_count / A.total_episodes) : 0.5;
    const readRatioB = B.total_episodes > 0 ? (B.read_count / B.total_episodes) : 0.5;
    
    // 5. ì „ì²´ ìŠ¹ë¥ 
    const totalWinRateA = A.match_count > 0 ? A.wins / A.match_count : 0.5;
    const totalWinRateB = B.match_count > 0 ? B.wins / B.match_count : 0.5;
    
    // 6. ìž¥ë¥´ ìƒì„± (ì„ íƒì )
    let majorGenreA = null;
    let majorGenreB = null;
    try {
      majorGenreA = A.major_genre ? JSON.parse(A.major_genre)[0] : null;
    } catch { /* íŒŒì‹± ì‹¤íŒ¨ ì‹œ null ìœ ì§€ */ }
    try {
      majorGenreB = B.major_genre ? JSON.parse(B.major_genre)[0] : null;
    } catch { /* íŒŒì‹± ì‹¤íŒ¨ ì‹œ null ìœ ì§€ */ }
    let genreMatchup = null;
    try {
      genreMatchup = await analyzeGenreMatchup(majorGenreA, majorGenreB);
    } catch (e) {
      // ìž¥ë¥´ ë¶„ì„ ì‹¤íŒ¨í•´ë„ ê³„ì† ì§„í–‰
    }
    
    // ì¢…í•© ì˜ˆì¸¡ (ê°€ì¤‘ í‰ê· )
    // Elo 50% + ì§ì ‘ëŒ€ê²° 20% + ì „ì²´ìŠ¹ë¥  15% + ì‹ ë¢°ë„ 10% + ìž¥ë¥´ìƒì„± 5%
    let predictedWinRateA = eloWinRateA * 0.5;
    
    // ì§ì ‘ ëŒ€ê²° ì „ì  ë°˜ì˜
    if (h2h.total > 0) {
      const h2hWinRateA = h2h.aWins / h2h.total;
      predictedWinRateA += h2hWinRateA * 0.2;
    } else {
      predictedWinRateA += 0.5 * 0.2; // ì „ì  ì—†ìœ¼ë©´ 50%ë¡œ ê°€ì •
    }
    
    // ì „ì²´ ìŠ¹ë¥  ë°˜ì˜
    predictedWinRateA += (totalWinRateA / (totalWinRateA + totalWinRateB || 1)) * 0.15;
    
    // ì‹ ë¢°ë„ ë°˜ì˜ (ì‹ ë¢°ë„ ë†’ì€ ìª½ ì•½ê°„ ìœ ë¦¬)
    const reliabilityFactor = (reliabilityA - reliabilityB) * 0.1 + 0.5;
    predictedWinRateA += reliabilityFactor * 0.1;
    
    // ìž¥ë¥´ ìƒì„± ë°˜ì˜
    if (genreMatchup && genreMatchup.type === "cross") {
      // Aì˜ ìž¥ë¥´ê°€ genreAë©´ advantage ê·¸ëŒ€ë¡œ, ì•„ë‹ˆë©´ ë°˜ì „
      const isAFirstGenre = majorGenreA === genreMatchup.genreA;
      const genreFactor = isAFirstGenre ? genreMatchup.advantage : -genreMatchup.advantage;
      predictedWinRateA += (genreFactor * 0.5 + 0.5) * 0.05;
    } else {
      predictedWinRateA += 0.5 * 0.05;
    }
    
    // ê²°ê³¼ ì •ê·œí™”
    predictedWinRateA = Math.max(0.01, Math.min(0.99, predictedWinRateA));
    const predictedWinRateB = 1 - predictedWinRateA;
    
    // ì˜ˆì¸¡ ê²°ê³¼ ê²°ì •
    const predictedWinner = predictedWinRateA >= 0.5 ? "A" : "B";
    const confidence = Math.abs(predictedWinRateA - 0.5) * 2; // 0~1 (0.5ë©´ 0, ê·¹ë‹¨ì´ë©´ 1)
    
    // ì´ë³€ ê°€ëŠ¥ì„± (ì˜ˆì¸¡ í™•ë¥ ì´ ë‚®ì€ë° ì‹¤ì œë¡œ ì´ê¸°ë©´ ì´ë³€)
    const upsetThreshold = 0.35; // 35% ë¯¸ë§Œ ìŠ¹ë¥ ì—ì„œ ì´ê¸°ë©´ ì´ë³€
    
    return {
      eloWinRateA,
      eloWinRateB,
      h2h,
      reliabilityA,
      reliabilityB,
      readRatioA,
      readRatioB,
      totalWinRateA,
      totalWinRateB,
      genreMatchup,
      predictedWinRateA,
      predictedWinRateB,
      predictedWinner,
      confidence,
      upsetThreshold,
    };
  }

  // ë§¤ì¹˜ ê²°ê³¼ ë¶„ì„ ë° ì¸ì‚¬ì´íŠ¸ ìƒì„±
  async function analyzeMatchResult(A, B, winnerId, prediction) {
    if (!prediction) return null;
    
    const winner = winnerId === A.id ? "A" : "B";
    const winnerNovel = winner === "A" ? A : B;
    const loserNovel = winner === "A" ? B : A;
    const isUpset = (
      (winner === "A" && prediction.predictedWinRateA < prediction.upsetThreshold) ||
      (winner === "B" && prediction.predictedWinRateB < prediction.upsetThreshold)
    );
    
    // ì˜ˆì¸¡ ì •í™•ë„
    const wasCorrect = prediction.predictedWinner === winner;
    
    // ðŸ”® v3.0.3: ì´ë³€ ì›ì¸ ë¶„ì„
    let upsetCauses = [];
    if (isUpset) {
      upsetCauses = analyzeUpsetCauses(winnerNovel, loserNovel, tagRelations);
    }
    
    // ì¸ì‚¬ì´íŠ¸ ìƒì„±
    const insight = {
      id: uuid(),
      timestamp: Date.now(),
      novelAId: A.id,
      novelATitle: A.title,
      novelBId: B.id,
      novelBTitle: B.title,
      winnerId,
      winnerTitle: winnerId === A.id ? A.title : B.title,
      loserId: winnerId === A.id ? B.id : A.id,
      loserTitle: winnerId === A.id ? B.title : A.title,
      majorGenreA: A.major_genre,
      majorGenreB: B.major_genre,
      ratingDiff: Math.abs(A.rating - B.rating),
      predictedWinRate: winner === "A" ? prediction.predictedWinRateA : prediction.predictedWinRateB,
      isUpset,
      wasCorrect,
      h2h: prediction.h2h, // ì§ì ‘ëŒ€ê²° ì „ì  (aWins, bWins, total)
      upsetCauses, // ðŸ”® ì´ë³€ ì›ì¸ í›„ë³´
    };
    
    // ì¸ì‚¬ì´íŠ¸ ì €ìž¥
    setMatchInsights(prev => {
      const updated = [insight, ...prev].slice(0, 200); // ìµœëŒ€ 200ê°œ ìœ ì§€
      setTimeout(() => setAppMeta("match_insights", updated), 0);
      return updated;
    });
    
    // ðŸ”® ì´ë³€ ë°œìƒ ì‹œ ìš”ì¸ ì—…ë°ì´íŠ¸
    if (isUpset && upsetCauses.length > 0) {
      updateUpsetFactors(upsetCauses, insight);
    }
    
    return insight;
  }

  // ðŸ”® v3.0.3: ì´ë³€ ì›ì¸ ë¶„ì„ í•¨ìˆ˜
  // ðŸŽ¯ v3.1.2: ë†ë„ ê°€ì¤‘ì¹˜ë¥¼ ì ìš©í•œ ì´ë³€ ë¶„ì„
  function analyzeUpsetCauses(winner, loser, relations) {
    const causes = [];
    
    // 1. íƒœê·¸ ì°¨ì´ ë¶„ì„ (ðŸ·ï¸ v3.1.2: ë†ë„ í¬í•¨)
    const winnerTags = new Set((winner.tags || "").split(",").map(t => t.trim()).filter(Boolean));
    const loserTags = new Set((loser.tags || "").split(",").map(t => t.trim()).filter(Boolean));
    
    // tag_dataì—ì„œ ë†ë„ ë§µ ìƒì„±
    let winnerIntensity = {};
    let loserIntensity = {};
    try {
      const wd = JSON.parse(winner.tag_data || "[]");
      if (Array.isArray(wd)) wd.forEach(t => { winnerIntensity[t.tag] = t.intensity || 3; });
    } catch {}
    try {
      const ld = JSON.parse(loser.tag_data || "[]");
      if (Array.isArray(ld)) ld.forEach(t => { loserIntensity[t.tag] = t.intensity || 3; });
    } catch {}
    
    // ìŠ¹ìžì—ê²Œë§Œ ìžˆëŠ” íƒœê·¸ (ê¸ì •ì  ìš”ì¸ í›„ë³´)
    for (const tag of winnerTags) {
      if (!loserTags.has(tag)) {
        // ìœ ì‚¬ íƒœê·¸ ê·¸ë£¹ ì°¾ê¸°
        const groupKey = findSimilarGroupKey(tag, relations);
        const intensity = winnerIntensity[tag] || 3;
        causes.push({
          type: "tag_only_winner",
          key: groupKey || tag,
          originalTag: tag,
          direction: "positive",
          intensity, // ðŸ·ï¸ v3.1.2: ë†ë„ ì¶”ê°€
          weight: intensity / 3, // ë†ë„ ê°€ì¤‘ì¹˜ (3ì´ ê¸°ì¤€ 1.0)
        });
      }
    }
    
    // íŒ¨ìžì—ê²Œë§Œ ìžˆëŠ” íƒœê·¸ (ë¶€ì •ì  ìš”ì¸ í›„ë³´)
    for (const tag of loserTags) {
      if (!winnerTags.has(tag)) {
        const groupKey = findSimilarGroupKey(tag, relations);
        const intensity = loserIntensity[tag] || 3;
        causes.push({
          type: "tag_only_loser",
          key: groupKey || tag,
          originalTag: tag,
          direction: "negative",
          intensity, // ðŸ·ï¸ v3.1.2: ë†ë„ ì¶”ê°€
          weight: intensity / 3,
        });
      }
    }
    
    // 2. ìž¥ë¥´ ì°¨ì´ ë¶„ì„
    const winnerGenres = parseGenreArray(winner.major_genre);
    const loserGenres = parseGenreArray(loser.major_genre);
    
    for (const g of winnerGenres) {
      if (!loserGenres.includes(g)) {
        causes.push({
          type: "genre_preference",
          key: g,
          direction: "positive",
          weight: 1,
        });
      }
    }
    
    for (const g of loserGenres) {
      if (!winnerGenres.includes(g)) {
        causes.push({
          type: "genre_aversion",
          key: g,
          direction: "negative",
          weight: 1,
        });
      }
    }
    
    // 3. í”Œëž«í¼ ì°¨ì´
    const winnerPlats = parsePlatforms(winner.platforms);
    const loserPlats = parsePlatforms(loser.platforms);
    
    for (const p of winnerPlats) {
      if (!loserPlats.includes(p)) {
        causes.push({
          type: "platform_preference",
          key: p,
          direction: "positive",
        });
      }
    }
    
    // 4. ìž‘ê°€ (ìŠ¹ìž ìž‘ê°€ ì„ í˜¸ ê°€ëŠ¥ì„±)
    if (winner.author && winner.author !== loser.author) {
      causes.push({
        type: "author_preference",
        key: winner.author,
        direction: "positive",
      });
    }
    
    // 5. ì½ì€ ë¹„ìœ¨ ì°¨ì´ (ë§Žì´ ì½ì€ ìž‘í’ˆ ì„ í˜¸)
    const winnerReadRatio = winner.total_episodes > 0 ? winner.read_count / winner.total_episodes : 0;
    const loserReadRatio = loser.total_episodes > 0 ? loser.read_count / loser.total_episodes : 0;
    if (winnerReadRatio > loserReadRatio + 0.3) {
      causes.push({
        type: "read_engagement",
        key: "high_read_ratio",
        direction: "positive",
      });
    }
    
    return causes;
  }

  // ðŸ”— ìœ ì‚¬ íƒœê·¸ ê·¸ë£¹ í‚¤ ì°¾ê¸°
  function findSimilarGroupKey(tag, relations) {
    if (!relations || !relations.tagToGroup || !relations.groups) return null;
    
    const groupId = relations.tagToGroup[tag];
    if (!groupId) return null;
    
    const group = relations.groups[groupId];
    if (!group || group.type !== "similar") return null;
    
    // ê·¸ë£¹ì˜ ëŒ€í‘œ íƒœê·¸ (ì²« ë²ˆì§¸ íƒœê·¸)ë¥¼ í‚¤ë¡œ ì‚¬ìš©
    return `[SIM:${group.tags[0] || tag}]`;
  }

  // ðŸ”— v3.0.3: íƒœê·¸ ê´€ê³„ë„ ê´€ë¦¬ í•¨ìˆ˜ë“¤
  
  // íƒœê·¸ì˜ ê·¸ë£¹ ì •ë³´ ì¡°íšŒ
  const getTagGroupInfo = useCallback((tag) => {
    const groupId = tagRelations.tagToGroup[tag];
    if (!groupId) return null;
    return tagRelations.groups[groupId] || null;
  }, [tagRelations]);
  
  // ìœ ì‚¬ íƒœê·¸ë“¤ ì¡°íšŒ (ê·¸ë£¹ ë‚´ ë‹¤ë¥¸ íƒœê·¸ë“¤)
  const getSimilarTags = useCallback((tag) => {
    const group = getTagGroupInfo(tag);
    if (!group || group.type !== "similar") return [];
    return group.tags.filter(t => t !== tag);
  }, [getTagGroupInfo]);
  
  // ìƒë°˜ íƒœê·¸ë“¤ ì¡°íšŒ
  const getOppositeTags = useCallback((tag) => {
    const group = getTagGroupInfo(tag);
    if (!group) return [];
    if (!tagRelations?.groups) return [];
    
    // ì´ ê·¸ë£¹ê³¼ ìƒë°˜ ê´€ê³„ì¸ ê·¸ë£¹ ì°¾ê¸°
    const opposites = [];
    for (const [gId, g] of Object.entries(tagRelations.groups)) {
      if (g.type === "opposite" && g.relatedGroupId === group.id) {
        opposites.push(...(g.tags || []));
      }
      if (group.type === "opposite" && group.relatedGroupId === gId) {
        opposites.push(...(g.tags || []));
      }
    }
    return opposites;
  }, [tagRelations, getTagGroupInfo]);
  
  // ìƒˆ ê·¸ë£¹ ìƒì„±
  const createTagGroup = useCallback((name, type, tags, relatedGroupId = null) => {
    const groupId = uuid();
    const newGroup = {
      id: groupId,
      name,
      type, // "similar" | "opposite"
      tags: [...new Set(tags)],
      relatedGroupId, // ìƒë°˜ ê´€ê³„ì¼ ë•Œ ì—°ê²°ëœ ê·¸ë£¹
      createdAt: Date.now(),
    };
    
    setTagRelations(prev => {
      const newGroups = { ...prev.groups, [groupId]: newGroup };
      const newTagToGroup = { ...prev.tagToGroup };
      
      // íƒœê·¸ â†’ ê·¸ë£¹ ë§¤í•‘ ì—…ë°ì´íŠ¸
      for (const tag of tags) {
        newTagToGroup[tag] = groupId;
      }
      
      const updated = { groups: newGroups, tagToGroup: newTagToGroup };
      setTimeout(() => setAppMeta("tag_relations", updated), 0);
      return updated;
    });
    
    return groupId;
  }, []);
  
  // ê·¸ë£¹ì— íƒœê·¸ ì¶”ê°€
  const addTagToGroup = useCallback((groupId, tag) => {
    setTagRelations(prev => {
      const group = prev.groups[groupId];
      if (!group) return prev;
      
      // ì´ë¯¸ ë‹¤ë¥¸ ê·¸ë£¹ì— ìžˆìœ¼ë©´ ì œê±°
      const oldGroupId = prev.tagToGroup[tag];
      const newGroups = { ...prev.groups };
      
      if (oldGroupId && oldGroupId !== groupId) {
        const oldGroup = newGroups[oldGroupId];
        if (oldGroup) {
          newGroups[oldGroupId] = {
            ...oldGroup,
            tags: oldGroup.tags.filter(t => t !== tag),
          };
        }
      }
      
      // ìƒˆ ê·¸ë£¹ì— ì¶”ê°€
      newGroups[groupId] = {
        ...group,
        tags: [...new Set([...group.tags, tag])],
      };
      
      const newTagToGroup = { ...prev.tagToGroup, [tag]: groupId };
      const updated = { groups: newGroups, tagToGroup: newTagToGroup };
      setTimeout(() => setAppMeta("tag_relations", updated), 0);
      return updated;
    });
  }, []);
  
  // ê·¸ë£¹ì—ì„œ íƒœê·¸ ì œê±°
  const removeTagFromGroup = useCallback((groupId, tag) => {
    setTagRelations(prev => {
      const group = prev.groups[groupId];
      if (!group) return prev;
      
      const newTags = group.tags.filter(t => t !== tag);
      const newGroups = { ...prev.groups };
      const newTagToGroup = { ...prev.tagToGroup };
      
      if (newTags.length === 0) {
        // ê·¸ë£¹ì´ ë¹„ë©´ ì‚­ì œ
        delete newGroups[groupId];
      } else {
        newGroups[groupId] = { ...group, tags: newTags };
      }
      
      delete newTagToGroup[tag];
      
      const updated = { groups: newGroups, tagToGroup: newTagToGroup };
      setTimeout(() => setAppMeta("tag_relations", updated), 0);
      return updated;
    });
  }, []);
  
  // ê·¸ë£¹ ì‚­ì œ
  const deleteTagGroup = useCallback((groupId) => {
    setTagRelations(prev => {
      const group = prev.groups[groupId];
      if (!group) return prev;
      
      const newGroups = { ...prev.groups };
      const newTagToGroup = { ...prev.tagToGroup };
      
      // ê·¸ë£¹ì˜ ëª¨ë“  íƒœê·¸ ë§¤í•‘ ì œê±°
      for (const tag of group.tags) {
        delete newTagToGroup[tag];
      }
      
      delete newGroups[groupId];
      
      const updated = { groups: newGroups, tagToGroup: newTagToGroup };
      setTimeout(() => setAppMeta("tag_relations", updated), 0);
      return updated;
    });
  }, []);
  
  // íƒœê·¸ ê´€ê³„ ëª¨ë‹¬ ì—´ê¸°
  const openTagRelationModal = useCallback((tag) => {
    setTagRelationTarget(tag);
    const groupInfo = getTagGroupInfo(tag);
    setTagRelationEditGroup(groupInfo);
    setTagRelationModalOpen(true);
  }, [getTagGroupInfo]);

  // ðŸ”® ì´ë³€ ìš”ì¸ ì—…ë°ì´íŠ¸
  function updateUpsetFactors(causes, insight) {
    setUpsetFactors(prev => {
      const factors = [...prev.factors];
      
      for (const cause of causes) {
        const existingIdx = factors.findIndex(
          f => f.type === cause.type && f.key === cause.key && f.direction === cause.direction
        );
        
        if (existingIdx >= 0) {
          // ê¸°ì¡´ ìš”ì¸ ì—…ë°ì´íŠ¸
          factors[existingIdx] = {
            ...factors[existingIdx],
            occurrences: factors[existingIdx].occurrences + 1,
            examples: [
              `${insight.winnerTitle} vs ${insight.loserTitle}`,
              ...factors[existingIdx].examples.slice(0, 4),
            ],
          };
        } else {
          // ìƒˆ ìš”ì¸ ì¶”ê°€
          factors.push({
            id: uuid(),
            type: cause.type,
            key: cause.key,
            originalTag: cause.originalTag,
            direction: cause.direction,
            occurrences: 1,
            examples: [`${insight.winnerTitle} vs ${insight.loserTitle}`],
          });
        }
      }
      
      // ì‹ ë¢°ë„ ê³„ì‚° (ì „ì²´ ì´ë³€ ëŒ€ë¹„ ë°œìƒ ë¹„ìœ¨)
      const totalUpsets = (matchInsights.filter(i => i.isUpset).length || 1) + 1;
      for (const f of factors) {
        f.confidence = Math.min(1, f.occurrences / totalUpsets);
      }
      
      // ë°œìƒ íšŸìˆ˜ ìˆœ ì •ë ¬
      factors.sort((a, b) => b.occurrences - a.occurrences);
      
      const updated = {
        factors: factors.slice(0, 100), // ìµœëŒ€ 100ê°œ
        lastUpdated: Date.now(),
      };
      
      setTimeout(() => setAppMeta("upset_factors", updated), 0);
      return updated;
    });
  }

  // ðŸ·ï¸ íƒœê·¸ ì‚¬ìš© ë¹ˆë„ ë° ê³µë™ ì¶œí˜„ í†µê³„ ì—…ë°ì´íŠ¸
  function updateTagUsageCounts(novels) {
    const { counts, coOccurrences } = countTagUsage(novels);
    setTagUsageCounts(counts);
    setTagCoOccurrences(coOccurrences); // ðŸ†• v3.2.1
  }

  // ðŸ·ï¸ íƒœê·¸ ì„ íƒ ëª¨ë‹¬ ì—´ê¸° (ìƒˆ ë°©ì‹)
  const [tagModalInitialTags, setTagModalInitialTags] = useState([]);
  const [tagModalInitialMajor, setTagModalInitialMajor] = useState([]);
  const [tagModalInitialSub, setTagModalInitialSub] = useState([]);
  const [tagModalInitialTagData, setTagModalInitialTagData] = useState([]); // ðŸ·ï¸ v5.0

  function openTagModal(target, initialTags = [], majorGenre = "", subGenre = "", tagData = []) {
    setTagModalTarget(target);
    setTagModalInitialTags(initialTags);
    setTagModalInitialMajor(parseGenreArray(majorGenre));
    setTagModalInitialSub(parseGenreArray(subGenre));
    setTagModalInitialTagData(tagData); // ðŸ·ï¸ v5.0
    setTagModalOpen(true);
  }

  // ðŸ·ï¸ íƒœê·¸ ì„ íƒ ëª¨ë‹¬ í™•ì¸ ì½œë°±
  // ðŸ”§ v3.4.4: ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ë„ ì¼ë°˜ íƒœê·¸ì²˜ëŸ¼ í…ìŠ¤íŠ¸ ìž…ë ¥ì°½ê³¼ ì™„ì „ ë™ê¸°í™”
  // âš ï¸ ì„¤ê³„ ì˜ë„: ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ëŠ” "íŠ¹ë³„í•œ" íƒœê·¸ê°€ ì•„ë‹ˆë¼ ì¼ë°˜ íƒœê·¸ì™€ ë™ì¼í•˜ê²Œ ì·¨ê¸‰ë¨
  //    - í…ìŠ¤íŠ¸ ìž…ë ¥ì°½ì— ëª¨ë“  íƒœê·¸(ì¼ë°˜+ëŒ€ìž¥ë¥´+ë¶€ìž¥ë¥´)ê°€ í‘œì‹œë¨
  //    - í…ìŠ¤íŠ¸ë¥¼ ì§€ìš°ë©´ í•´ë‹¹ íƒœê·¸(ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ í¬í•¨)ê°€ ì‚­ì œë¨
  //    - í…ìŠ¤íŠ¸ë¡œ ìž…ë ¥í•˜ë©´ ìžë™ìœ¼ë¡œ ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ ì—¬ë¶€ë¥¼ ê°ì§€í•˜ì—¬ ë¶„ë¥˜ë¨
  const handleTagModalConfirm = useCallback((selectedTags, selectedMajor, selectedSub, tagData = []) => {
    // JSON ë°°ì—´ë¡œ ì €ìž¥ (ë‚´ë¶€ êµ¬ë¶„ìš©)
    const majorJson = selectedMajor.length > 0 ? JSON.stringify(selectedMajor) : "";
    const subJson = selectedSub.length > 0 ? JSON.stringify(selectedSub) : "";
    
    // ðŸ”§ v3.4.4: ëª¨ë“  íƒœê·¸ë¥¼ í•˜ë‚˜ì˜ ë¬¸ìžì—´ë¡œ í•©ì¹¨ (ëŒ€ìž¥ë¥´, ë¶€ìž¥ë¥´, ì¼ë°˜ íƒœê·¸ ìˆœ)
    // ì´ë ‡ê²Œ í•˜ë©´ í…ìŠ¤íŠ¸ ìž…ë ¥ì°½ì—ì„œ ëª¨ë“  íƒœê·¸ë¥¼ ë³¼ ìˆ˜ ìžˆê³  íŽ¸ì§‘í•  ìˆ˜ ìžˆìŒ
    const allTagsArray = [...selectedMajor, ...selectedSub, ...selectedTags];
    const allTagsString = allTagsArray.join(", ");
    
    // ðŸ·ï¸ v5.0: tagData JSON ë¬¸ìžì—´
    const tagDataJson = tagData && tagData.length > 0 ? JSON.stringify(tagData) : "";
    
    if (tagModalTarget === "new") {
      setTags(allTagsString);
      setNewMajorGenre(selectedMajor);
      setNewSubGenre(selectedSub);
      setNewTagData(tagData); // ðŸ·ï¸ v5.0
    } else if ((tagModalTarget === "edit" || tagModalTarget === "supplement") && editItem) {
      // editê³¼ supplement ëª¨ë‘ editItem ì—…ë°ì´íŠ¸
      setEditItem({
        ...editItem,
        tags: allTagsString, // ðŸ”§ v3.4.4: ëª¨ë“  íƒœê·¸ í¬í•¨
        major_genre: majorJson,
        sub_genre: subJson,
        tag_data: tagDataJson, // ðŸ·ï¸ v5.0
      });
    } else if (tagModalTarget === "planned" && plannedEditItem) {
      // ðŸ†• v3.4.3: ì˜ˆì •íƒ­ íŽ¸ì§‘ì—ì„œ íƒœê·¸ ì„ íƒ
      setPlannedEditItem({
        ...plannedEditItem,
        tags: allTagsString, // ðŸ”§ v3.4.4: ëª¨ë“  íƒœê·¸ í¬í•¨
        major_genre: majorJson,
        sub_genre: subJson,
      });
    } else if (tagModalTarget === "plannedNew") {
      // ðŸ”§ v3.4.5: ì˜ˆì •íƒ­ ì‹ ê·œ ë“±ë¡ì—ì„œ íƒœê·¸ ì„ íƒ
      setPlannedTags(allTagsString);
      setPlannedMajorGenre(selectedMajor);
      setPlannedSubGenre(selectedSub);
    }
    setTagModalOpen(false);
  }, [tagModalTarget, editItem, plannedEditItem]);

  // (ì´ì „ toggleMajorGenre, toggleSubGenre, toggleTagInModalì€ TagSelectModal ë‚´ë¶€ë¡œ ì´ë™ë¨)

  // ðŸ·ï¸ ì»¤ìŠ¤í…€ íƒœê·¸ ì‚­ì œ
  async function removeCustomTag(tag) {
    const newList = customTags.filter(t => t !== tag);
    setCustomTags(newList);
    await setAppMeta("custom_tags", newList);
  }

  // ðŸ·ï¸ ì»¤ìŠ¤í…€ íƒœê·¸ ì§ì ‘ ì¶”ê°€ (TagSelectModalì—ì„œ ì‚¬ìš©)
  async function addCustomTagDirect(tag) {
    if (!tag) return;
    if (customTags.includes(tag) || ALL_DEFAULT_TAGS.includes(tag)) {
      Alert.alert("ì•Œë¦¼", "ì´ë¯¸ ì¡´ìž¬í•˜ëŠ” íƒœê·¸ìž…ë‹ˆë‹¤.");
      return;
    }
    const newList = [...customTags, tag];
    setCustomTags(newList);
    await setAppMeta("custom_tags", newList);
  }

  // ðŸ”— ì¡°í•©ì‹ íƒœê·¸ ì¶”ê°€
  async function addComboTag(comboTag) {
    if (!comboTag || !comboTag.includes("+")) return;
    if (comboTags.includes(comboTag)) {
      Alert.alert("ì•Œë¦¼", "ì´ë¯¸ ì¡´ìž¬í•˜ëŠ” ì¡°í•©ì‹ íƒœê·¸ìž…ë‹ˆë‹¤.");
      return;
    }
    const newList = [...comboTags, comboTag];
    setComboTags(newList);
    await setAppMeta("combo_tags", newList);
  }

  // ðŸ”— ì¡°í•©ì‹ íƒœê·¸ ì‚­ì œ
  async function removeComboTag(comboTag) {
    const newList = comboTags.filter(t => t !== comboTag);
    setComboTags(newList);
    await setAppMeta("combo_tags", newList);
  }

  // ðŸ”— v3.0.4: ì¡°í•© ìš”ì†Œ(íŠ¹ì„±) ì¶”ê°€
  async function addCustomComboTrait(trait) {
    const t = (trait || "").trim();
    if (!t) return;
    if (COMBO_TAG_TRAITS.includes(t) || customComboTraits.includes(t)) {
      Alert.alert("ì•Œë¦¼", "ì´ë¯¸ ì¡´ìž¬í•˜ëŠ” íŠ¹ì„±ìž…ë‹ˆë‹¤.");
      return;
    }
    const newList = [...customComboTraits, t];
    setCustomComboTraits(newList);
    await setAppMeta("custom_combo_traits", newList);
  }

  // ðŸ”— v3.0.4: ì¡°í•© ìš”ì†Œ(íŠ¹ì„±) ì‚­ì œ
  async function removeCustomComboTrait(trait) {
    if (COMBO_TAG_TRAITS.includes(trait)) {
      Alert.alert("ì•Œë¦¼", "ê¸°ë³¸ íŠ¹ì„±ì€ ì‚­ì œí•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.");
      return;
    }
    const newList = customComboTraits.filter(t => t !== trait);
    setCustomComboTraits(newList);
    await setAppMeta("custom_combo_traits", newList);
  }

  // ðŸ”— v3.0.4: ì¡°í•© ìš”ì†Œ(ëŒ€ìƒ) ì¶”ê°€
  async function addCustomComboTarget(target) {
    const t = (target || "").trim();
    if (!t) return;
    if (COMBO_TAG_TARGETS.includes(t) || customComboTargets.includes(t)) {
      Alert.alert("ì•Œë¦¼", "ì´ë¯¸ ì¡´ìž¬í•˜ëŠ” ëŒ€ìƒìž…ë‹ˆë‹¤.");
      return;
    }
    const newList = [...customComboTargets, t];
    setCustomComboTargets(newList);
    await setAppMeta("custom_combo_targets", newList);
  }

  // ðŸ”— v3.0.4: ì¡°í•© ìš”ì†Œ(ëŒ€ìƒ) ì‚­ì œ
  async function removeCustomComboTarget(target) {
    if (COMBO_TAG_TARGETS.includes(target)) {
      Alert.alert("ì•Œë¦¼", "ê¸°ë³¸ ëŒ€ìƒì€ ì‚­ì œí•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.");
      return;
    }
    const newList = customComboTargets.filter(t => t !== target);
    setCustomComboTargets(newList);
    await setAppMeta("custom_combo_targets", newList);
  }

  // ðŸ·ï¸ ì‚¬ìš©ìž ëŒ€ìž¥ë¥´ ì‚­ì œ
  async function removeUserMajorGenre(genre) {
    const newList = userMajorGenres.filter(g => g !== genre);
    setUserMajorGenres(newList);
    await setAppMeta("user_major_genres", newList);
  }

  // ðŸ·ï¸ ì‚¬ìš©ìž ë¶€ìž¥ë¥´ ì‚­ì œ
  async function removeUserSubGenre(genre) {
    const newList = userSubGenres.filter(g => g !== genre);
    setUserSubGenres(newList);
    await setAppMeta("user_sub_genres", newList);
  }

  // ðŸ·ï¸ ì¤‘ë³µ íƒœê·¸ ì •ë¦¬ (ì „ì²´ íƒœê·¸ì—ì„œ ì¤‘ë³µ ì œê±°)
  async function cleanupDuplicateTags() {
    // ì»¤ìŠ¤í…€ íƒœê·¸ ì¤‘ë³µ ì œê±°
    const cleanedCustom = deduplicateTags(customTags);
    if (cleanedCustom.length !== customTags.length) {
      setCustomTags(cleanedCustom);
      await setAppMeta("custom_tags", cleanedCustom);
    }
    
    // ì¡°í•©ì‹ íƒœê·¸ ì¤‘ë³µ ì œê±°
    const cleanedCombo = deduplicateTags(comboTags);
    if (cleanedCombo.length !== comboTags.length) {
      setComboTags(cleanedCombo);
      await setAppMeta("combo_tags", cleanedCombo);
    }
    
    // ì‚¬ìš©ìž ëŒ€ìž¥ë¥´ ì¤‘ë³µ ì œê±°
    const cleanedMajor = deduplicateTags(userMajorGenres);
    if (cleanedMajor.length !== userMajorGenres.length) {
      setUserMajorGenres(cleanedMajor);
      await setAppMeta("user_major_genres", cleanedMajor);
    }
    
    // ì‚¬ìš©ìž ë¶€ìž¥ë¥´ ì¤‘ë³µ ì œê±°
    const cleanedSub = deduplicateTags(userSubGenres);
    if (cleanedSub.length !== userSubGenres.length) {
      setUserSubGenres(cleanedSub);
      await setAppMeta("user_sub_genres", cleanedSub);
    }
    
    Alert.alert("ì™„ë£Œ", "ì¤‘ë³µ íƒœê·¸ ì •ë¦¬ê°€ ì™„ë£Œë˜ì—ˆìŠµë‹ˆë‹¤.");
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // ðŸ·ï¸ íƒœê·¸ ê´€ë¦¬ ê³ ê¸‰ í•¨ìˆ˜ (v2.3)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  // ìƒë‹¨ ê³ ì • íƒœê·¸ ë¡œë“œ/ì €ìž¥
  useEffect(() => {
    (async () => {
      const saved = await getAppMeta("pinned_tags");
      if (Array.isArray(saved)) setPinnedTags(saved);
    })();
  }, []);

  async function savePinnedTags(tags) {
    setPinnedTags(tags);
    await setAppMeta("pinned_tags", tags);
  }

  // ìˆ¨ê¹€ íƒœê·¸ ë¡œë“œ/ì €ìž¥
  useEffect(() => {
    (async () => {
      const saved = await getAppMeta("hidden_tags");
      if (Array.isArray(saved)) setHiddenTags(saved);
    })();
  }, []);

  // ðŸ† ê²€í†  íƒ­ ì „í™˜ ì‹œ ì„ íƒ ì´ˆê¸°í™”
  useEffect(() => {
    if (screen !== "review") {
      setReviewSelectedIds([]);
    }
  }, [screen]);

  async function saveHiddenTags(tags) {
    setHiddenTags(tags);
    await setAppMeta("hidden_tags", tags);
  }

  // ðŸŽ­ v2.8: íƒœê·¸ ì†ì„± ì €ìž¥
  async function saveTagSentiments(sentiments) {
    setTagSentiments(sentiments);
    await setAppMeta("tag_sentiments", sentiments);
  }

  // ðŸŽ­ v2.8: íƒœê·¸ ì†ì„± ë³€ê²½
  async function setTagSentiment(tag, sentiment) {
    const updated = { ...tagSentiments, [tag]: sentiment };
    // ê¸°ë³¸ê°’ì´ë©´ ì‚­ì œ (ì €ìž¥ ê³µê°„ ì ˆì•½)
    if (sentiment === TAG_SENTIMENT.NEUTRAL && !DEFAULT_TAG_SENTIMENTS[tag]) {
      delete updated[tag];
    }
    await saveTagSentiments(updated);
  }

  // ðŸŽ­ v2.8: íƒœê·¸ì˜ ì‹¤ì œ ì†ì„± ê°€ì ¸ì˜¤ê¸°
  function getActualTagSentiment(tag) {
    return getTagSentiment(tag, tagSentiments);
  }

  // ðŸ†• v3.4: íƒœê·¸ ì†ì„±(ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´) ì €ìž¥
  async function saveTagAttributes(attrs) {
    setTagAttributes(attrs);
    await setAppMeta("tag_attributes", attrs);
  }

  // ðŸ†• v3.4: íƒœê·¸ ëŒ€ìž¥ë¥´ ì†ì„± í† ê¸€
  async function toggleTagMajor(tag) {
    const current = isTagMajor(tag, tagAttributes, userMajorGenres);
    const updated = { 
      ...tagAttributes, 
      [tag]: { ...tagAttributes[tag], isMajor: !current } 
    };
    await saveTagAttributes(updated);
  }

  // ðŸ†• v3.4: íƒœê·¸ ë¶€ìž¥ë¥´ ì†ì„± í† ê¸€
  async function toggleTagSub(tag) {
    const current = isTagSub(tag, tagAttributes, userSubGenres);
    const updated = { 
      ...tagAttributes, 
      [tag]: { ...tagAttributes[tag], isSub: !current } 
    };
    await saveTagAttributes(updated);
  }

  // ðŸ†• v3.4: íŠ¹ì • íƒœê·¸ê°€ ëŒ€ìž¥ë¥´ì¸ì§€ í™•ì¸
  function checkIsTagMajor(tag) {
    return isTagMajor(tag, tagAttributes, userMajorGenres);
  }

  // ðŸ†• v3.4: íŠ¹ì • íƒœê·¸ê°€ ë¶€ìž¥ë¥´ì¸ì§€ í™•ì¸
  function checkIsTagSub(tag) {
    return isTagSub(tag, tagAttributes, userSubGenres);
  }

  // íƒœê·¸ ìˆ¨ê¹€ í† ê¸€
  async function toggleHideTag(tag) {
    if (hiddenTags.includes(tag)) {
      await saveHiddenTags(hiddenTags.filter(t => t !== tag));
    } else {
      await saveHiddenTags([...hiddenTags, tag]);
    }
  }

  // íƒœê·¸ ìƒë‹¨ ê³ ì • í† ê¸€
  async function togglePinTag(tag) {
    if (pinnedTags.includes(tag)) {
      await savePinnedTags(pinnedTags.filter(t => t !== tag));
    } else {
      await savePinnedTags([...pinnedTags, tag]);
    }
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // ðŸ†• Phase 1: TagEditModal í†µí•© ì§€ì› í•¨ìˆ˜ë“¤ (v3.2.1)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  
  /**
   * íƒœê·¸ ì‚¬ìš© í˜„í™© í†µê³„ ê³„ì‚°
   * @param {string} tag - íƒœê·¸ëª…
   * @returns {{ count: number, avgIntensity: number, avgRating: number }}
   */
  function getTagUsageStats(tag) {
    if (!tag || !list || list.length === 0) {
      return { count: 0, avgIntensity: null, avgRating: null };
    }
    
    const normalizedTag = normalizeTagName(tag);
    let count = 0;
    let totalIntensity = 0;
    let intensityCount = 0;
    let totalRating = 0;
    
    for (const novel of list) {
      // tag_dataì—ì„œ ì°¾ê¸°
      if (novel.tag_data) {
        try {
          const tagData = JSON.parse(novel.tag_data);
          const found = tagData.find(td => normalizeTagName(td.tag) === normalizedTag);
          if (found) {
            count++;
            if (found.intensity) {
              totalIntensity += found.intensity;
              intensityCount++;
            }
            totalRating += novel.rating || 1500;
            continue;
          }
        } catch (e) {}
      }
      
      // ê¸°ì¡´ tags í•„ë“œì—ì„œ ì°¾ê¸°
      if (novel.tags) {
        const tags = novel.tags.split(",").map(t => normalizeTagName(t.trim()));
        if (tags.includes(normalizedTag)) {
          count++;
          totalRating += novel.rating || 1500;
        }
      }
    }
    
    return {
      count,
      avgIntensity: intensityCount > 0 ? totalIntensity / intensityCount : null,
      avgRating: count > 0 ? totalRating / count : null,
    };
  }
  
  /**
   * TagEditModal ì¼ê´„ ì €ìž¥ í•¸ë“¤ëŸ¬
   * @param {string} tag - íƒœê·¸ëª…
   * @param {{ pinned?: boolean, hidden?: boolean, sentiment?: string }} changes - ë³€ê²½ì‚¬í•­
   */
  async function handleTagEditModalSave(tag, changes) {
    try {
      // ê³ ì • ìƒíƒœ ë³€ê²½
      if (changes.pinned !== undefined) {
        const isPinned = pinnedTags.includes(tag);
        if (changes.pinned && !isPinned) {
          await savePinnedTags([...pinnedTags, tag]);
        } else if (!changes.pinned && isPinned) {
          await savePinnedTags(pinnedTags.filter(t => t !== tag));
        }
      }
      
      // ìˆ¨ê¹€ ìƒíƒœ ë³€ê²½
      if (changes.hidden !== undefined) {
        const isHidden = hiddenTags.includes(tag);
        if (changes.hidden && !isHidden) {
          await saveHiddenTags([...hiddenTags, tag]);
        } else if (!changes.hidden && isHidden) {
          await saveHiddenTags(hiddenTags.filter(t => t !== tag));
        }
      }
      
      // ì†ì„±(ê°ì •) ë³€ê²½
      if (changes.sentiment !== undefined) {
        const currentSentiment = getTagSentiment(tag, tagSentiments);
        // nullì¸ ê²½ìš°: ì»¤ìŠ¤í…€ ì„¤ì • ì‚­ì œ (ê¸°ë³¸ê°’ ì‚¬ìš©)
        // ê°’ì´ ìžˆëŠ” ê²½ìš°: í•´ë‹¹ ê°’ìœ¼ë¡œ ì„¤ì •
        const newSentiment = changes.sentiment || null;
        if (newSentiment !== currentSentiment) {
          if (newSentiment === null) {
            // ì»¤ìŠ¤í…€ ì„¤ì • ì‚­ì œ â†’ ê¸°ë³¸ê°’ ì‚¬ìš©
            const updated = { ...tagSentiments };
            delete updated[tag];
            await saveTagSentiments(updated);
          } else {
            await setTagSentiment(tag, newSentiment);
          }
        }
      }
    } catch (e) {
      console.warn("handleTagEditModalSave error:", e);
    }
  }
  
  /**
   * ì¢Œí‘œê³„ íŽ¸ì§‘ ëª¨ë‹¬ ì—´ê¸° (TagEditModalì—ì„œ í˜¸ì¶œ)
   * @param {string} tag - íƒœê·¸ëª…
   * @param {string|null} systemId - íŠ¹ì • ì¢Œí‘œê³„ ID (nullì´ë©´ ì„ íƒ í™”ë©´)
   */
  function handleEditCoordinate(tag, systemId) {
    // íƒœê·¸ íŽ¸ì§‘ ëª¨ë‹¬ ë‹«ê¸°
    setTagEditModalOpen(false);
    setEditingTag(null);
    
    if (systemId && coordinateSystems[systemId]) {
      // íŠ¹ì • ì¢Œí‘œê³„ íŽ¸ì§‘
      setEditingCoordSystem({ id: systemId, ...coordinateSystems[systemId] });
      setEditingCoordTag(tag);
    } else {
      // ì¢Œí‘œê³„ ì„ íƒ í™”ë©´ (ì „ì²´ ëª©ë¡)
      // ì²« ë²ˆì§¸ ì¢Œí‘œê³„ë¥¼ ì—´ê±°ë‚˜ ê¸°ë³¸ê°’
      const firstSystemId = Object.keys(coordinateSystems)[0];
      if (firstSystemId) {
        setEditingCoordSystem({ id: firstSystemId, ...coordinateSystems[firstSystemId] });
        setEditingCoordTag(tag);
      }
    }
    setCoordManageOpen(true);
  }

  // íƒœê·¸ì— ëŒ€ìž¥ë¥´ ì†ì„± ì¶”ê°€ (ê¸°ì¡´ ìœ„ì¹˜ì—ì„œ ì œê±°í•˜ì§€ ì•ŠìŒ)
  async function promoteToMajorGenre(tag) {
    if (MAJOR_GENRES.includes(tag) || userMajorGenres.includes(tag)) {
      Alert.alert("ì•Œë¦¼", "ì´ë¯¸ ëŒ€ìž¥ë¥´ ì†ì„±ì´ ìžˆìŠµë‹ˆë‹¤.");
      return;
    }
    // ëŒ€ìž¥ë¥´ ì†ì„± ì¶”ê°€ (ì»¤ìŠ¤í…€/ì¡°í•© ìœ ì§€ - ì†ì„±ì€ ì¤‘ì²© ê°€ëŠ¥)
    const newMajor = [...userMajorGenres, tag];
    setUserMajorGenres(newMajor);
    await setAppMeta("user_major_genres", newMajor);
    Alert.alert("ì™„ë£Œ", `"${tag}"ì— ëŒ€ìž¥ë¥´ ì†ì„±ì„ ì¶”ê°€í–ˆìŠµë‹ˆë‹¤.`);
  }

  // íƒœê·¸ì— ë¶€ìž¥ë¥´ ì†ì„± ì¶”ê°€ (ê¸°ì¡´ ìœ„ì¹˜ì—ì„œ ì œê±°í•˜ì§€ ì•ŠìŒ)
  async function promoteToSubGenre(tag) {
    if (SUB_GENRES.includes(tag) || userSubGenres.includes(tag)) {
      Alert.alert("ì•Œë¦¼", "ì´ë¯¸ ë¶€ìž¥ë¥´ ì†ì„±ì´ ìžˆìŠµë‹ˆë‹¤.");
      return;
    }
    // ë¶€ìž¥ë¥´ ì†ì„± ì¶”ê°€ (ì»¤ìŠ¤í…€/ì¡°í•© ìœ ì§€ - ì†ì„±ì€ ì¤‘ì²© ê°€ëŠ¥)
    const newSub = [...userSubGenres, tag];
    setUserSubGenres(newSub);
    await setAppMeta("user_sub_genres", newSub);
    Alert.alert("ì™„ë£Œ", `"${tag}"ì— ë¶€ìž¥ë¥´ ì†ì„±ì„ ì¶”ê°€í–ˆìŠµë‹ˆë‹¤.`);
  }

  // ì¡°í•©ì‹ íƒœê·¸ â†’ ì¼ë°˜ íƒœê·¸ë¡œ ë³€í™˜
  async function comboToCustomTag(comboTag) {
    // ì¡°í•©ì—ì„œ ì œê±°
    const newCombo = comboTags.filter(t => t !== comboTag);
    setComboTags(newCombo);
    await setAppMeta("combo_tags", newCombo);
    // ì»¤ìŠ¤í…€ì— ì¶”ê°€ (ì¤‘ë³µ í™•ì¸)
    if (!customTags.includes(comboTag) && !ALL_DEFAULT_TAGS.includes(comboTag)) {
      const newCustom = [...customTags, comboTag];
      setCustomTags(newCustom);
      await setAppMeta("custom_tags", newCustom);
    }
    Alert.alert("ì™„ë£Œ", `"${comboTag}"ë¥¼ ì¼ë°˜ íƒœê·¸ë¡œ ë³€í™˜í–ˆìŠµë‹ˆë‹¤.`);
  }

  // ëŒ€ìž¥ë¥´ ì†ì„± ì œê±°
  async function demoteMajorToCustom(genre) {
    // ê¸°ë³¸ ëŒ€ìž¥ë¥´ëŠ” ì œê±° ë¶ˆê°€
    if (MAJOR_GENRES.includes(genre)) {
      Alert.alert("ì•Œë¦¼", "ê¸°ë³¸ ì œê³µ ëŒ€ìž¥ë¥´ëŠ” ì†ì„±ì„ ì œê±°í•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.");
      return;
    }
    const newMajor = userMajorGenres.filter(g => g !== genre);
    setUserMajorGenres(newMajor);
    await setAppMeta("user_major_genres", newMajor);
    Alert.alert("ì™„ë£Œ", `"${genre}"ì˜ ëŒ€ìž¥ë¥´ ì†ì„±ì„ ì œê±°í–ˆìŠµë‹ˆë‹¤.`);
  }

  // ë¶€ìž¥ë¥´ ì†ì„± ì œê±°
  async function demoteSubToCustom(genre) {
    // ê¸°ë³¸ ë¶€ìž¥ë¥´ëŠ” ì œê±° ë¶ˆê°€
    if (SUB_GENRES.includes(genre)) {
      Alert.alert("ì•Œë¦¼", "ê¸°ë³¸ ì œê³µ ë¶€ìž¥ë¥´ëŠ” ì†ì„±ì„ ì œê±°í•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.");
      return;
    }
    const newSub = userSubGenres.filter(g => g !== genre);
    setUserSubGenres(newSub);
    await setAppMeta("user_sub_genres", newSub);
    Alert.alert("ì™„ë£Œ", `"${genre}"ì˜ ë¶€ìž¥ë¥´ ì†ì„±ì„ ì œê±°í–ˆìŠµë‹ˆë‹¤.`);
  }

  // ë¯¸ì‚¬ìš© íƒœê·¸ ì°¾ê¸° (ìž‘í’ˆì— í•œ ë²ˆë„ ì‚¬ìš©ë˜ì§€ ì•Šì€ íƒœê·¸)
  function findUnusedTags() {
    const usedTags = new Set();
    for (const n of list) {
      const tags = (n.tags || "").split(",").map(t => t.trim()).filter(Boolean);
      tags.forEach(t => usedTags.add(t));
      parseMajorSub(n.major_genre).forEach(g => usedTags.add(g));
      parseMajorSub(n.sub_genre).forEach(g => usedTags.add(g));
    }
    
    const unusedCustom = customTags.filter(t => !usedTags.has(t));
    const unusedCombo = comboTags.filter(t => !usedTags.has(t));
    const unusedMajor = userMajorGenres.filter(g => !usedTags.has(g));
    const unusedSub = userSubGenres.filter(g => !usedTags.has(g));
    
    return { unusedCustom, unusedCombo, unusedMajor, unusedSub };
  }

  // ë¯¸ì‚¬ìš© íƒœê·¸ ì •ë¦¬
  async function cleanupUnusedTags() {
    const { unusedCustom, unusedCombo, unusedMajor, unusedSub } = findUnusedTags();
    const total = unusedCustom.length + unusedCombo.length + unusedMajor.length + unusedSub.length;
    
    if (total === 0) {
      Alert.alert("ì•Œë¦¼", "ë¯¸ì‚¬ìš© íƒœê·¸ê°€ ì—†ìŠµë‹ˆë‹¤.");
      return;
    }
    
    Alert.alert(
      "ë¯¸ì‚¬ìš© íƒœê·¸ ì •ë¦¬",
      `ë¯¸ì‚¬ìš© íƒœê·¸ ${total}ê°œë¥¼ ì‚­ì œí•©ë‹ˆë‹¤.\n\n` +
      `ì»¤ìŠ¤í…€: ${unusedCustom.length}ê°œ\n` +
      `ì¡°í•©ì‹: ${unusedCombo.length}ê°œ\n` +
      `ëŒ€ìž¥ë¥´: ${unusedMajor.length}ê°œ\n` +
      `ë¶€ìž¥ë¥´: ${unusedSub.length}ê°œ`,
      [
        { text: "ì·¨ì†Œ" },
        {
          text: "ì‚­ì œ",
          style: "destructive",
          onPress: async () => {
            if (unusedCustom.length > 0) {
              const newCustom = customTags.filter(t => !unusedCustom.includes(t));
              setCustomTags(newCustom);
              await setAppMeta("custom_tags", newCustom);
            }
            if (unusedCombo.length > 0) {
              const newCombo = comboTags.filter(t => !unusedCombo.includes(t));
              setComboTags(newCombo);
              await setAppMeta("combo_tags", newCombo);
            }
            if (unusedMajor.length > 0) {
              const newMajor = userMajorGenres.filter(g => !unusedMajor.includes(g));
              setUserMajorGenres(newMajor);
              await setAppMeta("user_major_genres", newMajor);
            }
            if (unusedSub.length > 0) {
              const newSub = userSubGenres.filter(g => !unusedSub.includes(g));
              setUserSubGenres(newSub);
              await setAppMeta("user_sub_genres", newSub);
            }
            Alert.alert("ì™„ë£Œ", `ë¯¸ì‚¬ìš© íƒœê·¸ ${total}ê°œë¥¼ ì‚­ì œí–ˆìŠµë‹ˆë‹¤.`);
          }
        }
      ]
    );
  }

  // ì „ì²´ ë²”ìœ„ì—ì„œ íƒœê·¸ ì‚­ì œ (ìž‘í’ˆ ë°ì´í„°ì—ì„œë„ ì œê±°)
  async function deleteTagGlobally(tag) {
    Alert.alert(
      "ì „ì²´ ì‚­ì œ",
      `"${tag}" íƒœê·¸ë¥¼ ëª¨ë“  ìž‘í’ˆì—ì„œ ì‚­ì œí•©ë‹ˆë‹¤.\nì´ ìž‘ì—…ì€ ë˜ëŒë¦´ ìˆ˜ ì—†ìŠµë‹ˆë‹¤.`,
      [
        { text: "ì·¨ì†Œ" },
        {
          text: "ì‚­ì œ",
          style: "destructive",
          onPress: async () => {
            // 1. ì»¤ìŠ¤í…€/ì¡°í•©/ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ì—ì„œ ì œê±°
            const newCustom = customTags.filter(t => t !== tag);
            const newCombo = comboTags.filter(t => t !== tag);
            const newMajor = userMajorGenres.filter(g => g !== tag);
            const newSub = userSubGenres.filter(g => g !== tag);
            setCustomTags(newCustom);
            setComboTags(newCombo);
            setUserMajorGenres(newMajor);
            setUserSubGenres(newSub);
            await setAppMeta("custom_tags", newCustom);
            await setAppMeta("combo_tags", newCombo);
            await setAppMeta("user_major_genres", newMajor);
            await setAppMeta("user_sub_genres", newSub);
            
            // 2. ëª¨ë“  ìž‘í’ˆì—ì„œ í•´ë‹¹ íƒœê·¸ ì œê±°
            const novels = await all("SELECT id, tags, major_genre, sub_genre FROM novels;");
            const updates = [];
            for (const n of novels) {
              let changed = false;
              // ì¼ë°˜ íƒœê·¸ì—ì„œ ì œê±°
              const tags = (n.tags || "").split(",").map(t => t.trim()).filter(Boolean);
              const newTags = tags.filter(t => t !== tag);
              if (newTags.length !== tags.length) changed = true;
              // ëŒ€ìž¥ë¥´ì—ì„œ ì œê±°
              const majors = parseMajorSub(n.major_genre);
              const newMajors = majors.filter(g => g !== tag);
              if (newMajors.length !== majors.length) changed = true;
              // ë¶€ìž¥ë¥´ì—ì„œ ì œê±°
              const subs = parseMajorSub(n.sub_genre);
              const newSubs = subs.filter(g => g !== tag);
              if (newSubs.length !== subs.length) changed = true;
              
              if (changed) {
                updates.push({
                  sql: "UPDATE novels SET tags=?, major_genre=?, sub_genre=? WHERE id=?",
                  params: [
                    newTags.join(", "),
                    JSON.stringify(newMajors),
                    JSON.stringify(newSubs),
                    n.id
                  ]
                });
              }
            }
            if (updates.length > 0) {
              await execBatch(updates);
            }
            await loadList();
            Alert.alert("ì™„ë£Œ", `"${tag}" íƒœê·¸ë¥¼ ì „ì²´ì—ì„œ ì‚­ì œí–ˆìŠµë‹ˆë‹¤. (${updates.length}ê°œ ìž‘í’ˆ ìˆ˜ì •)`);
          }
        }
      ]
    );
  }

  // ðŸ·ï¸ ìž‘í’ˆì— ì ìš©ëœ íƒœê·¸ ì¤‘ ê¸°ë³¸ ëª©ë¡ì— ì—†ëŠ” ê²ƒë“¤ì„ ì»¤ìŠ¤í…€ íƒœê·¸ë¡œ ìžë™ ìˆ˜ì§‘
  async function syncCustomTagsFromNovels(novels, currentCustomTags) {
    const allDefaultSet = new Set([
      ...ALL_DEFAULT_TAGS,
      ...MAJOR_GENRES,
      ...SUB_GENRES,
    ]);
    const currentCustomSet = new Set(currentCustomTags);
    const newTags = new Set();

    for (const n of novels) {
      // ì¼ë°˜ íƒœê·¸
      const tags = (n.tags || "").split(",").map(t => t.trim()).filter(Boolean);
      for (const tag of tags) {
        if (!allDefaultSet.has(tag) && !currentCustomSet.has(tag)) {
          newTags.add(tag);
        }
      }
      // ëŒ€ìž¥ë¥´
      const majors = parseMajorSub(n.major_genre);
      for (const g of majors) {
        if (!MAJOR_GENRES.includes(g) && !userMajorGenres.includes(g) && !currentCustomSet.has(g)) {
          // ëŒ€ìž¥ë¥´ëŠ” userMajorGenresì— ì¶”ê°€í•˜ì§€ ì•Šê³ , ì¼ë‹¨ ì»¤ìŠ¤í…€ íƒœê·¸ë¡œ
          if (!allDefaultSet.has(g)) newTags.add(g);
        }
      }
      // ë¶€ìž¥ë¥´
      const subs = parseMajorSub(n.sub_genre);
      for (const g of subs) {
        if (!SUB_GENRES.includes(g) && !userSubGenres.includes(g) && !currentCustomSet.has(g)) {
          if (!allDefaultSet.has(g)) newTags.add(g);
        }
      }
    }

    if (newTags.size > 0) {
      const updatedCustomTags = [...currentCustomTags, ...Array.from(newTags)];
      setCustomTags(updatedCustomTags);
      await setAppMeta("custom_tags", updatedCustomTags);
      console.log(`ìžë™ ìˆ˜ì§‘ëœ ì»¤ìŠ¤í…€ íƒœê·¸ ${newTags.size}ê°œ:`, Array.from(newTags));
    }
  }

  // ðŸ·ï¸ ì‚¬ìš©ìž ëŒ€ìž¥ë¥´ ì¶”ê°€
  async function addUserMajorGenre(genreInput) {
    const genre = (genreInput || "").trim();
    if (!genre) return;
    if (MAJOR_GENRES.includes(genre) || userMajorGenres.includes(genre)) {
      Alert.alert("ì•Œë¦¼", "ì´ë¯¸ ì¡´ìž¬í•˜ëŠ” ëŒ€ìž¥ë¥´ìž…ë‹ˆë‹¤.");
      return;
    }
    const newList = [...userMajorGenres, genre];
    setUserMajorGenres(newList);
    await setAppMeta("user_major_genres", newList);
  }

  // ðŸ·ï¸ ì‚¬ìš©ìž ë¶€ìž¥ë¥´ ì¶”ê°€
  async function addUserSubGenre(genreInput) {
    const genre = (genreInput || "").trim();
    if (!genre) return;
    if (SUB_GENRES.includes(genre) || userSubGenres.includes(genre)) {
      Alert.alert("ì•Œë¦¼", "ì´ë¯¸ ì¡´ìž¬í•˜ëŠ” ë¶€ìž¥ë¥´ìž…ë‹ˆë‹¤.");
      return;
    }
    const newList = [...userSubGenres, genre];
    setUserSubGenres(newList);
    await setAppMeta("user_sub_genres", newList);
  }

  // ðŸ·ï¸ ì „ì²´ ëŒ€ìž¥ë¥´ ëª©ë¡ (ê¸°ë³¸ + ì‚¬ìš©ìž)
  const allMajorGenres = useMemo(() => {
    return [...MAJOR_GENRES, ...userMajorGenres];
  }, [userMajorGenres]);

  // ðŸ·ï¸ ì „ì²´ ë¶€ìž¥ë¥´ ëª©ë¡ (ê¸°ë³¸ + ì‚¬ìš©ìž)
  const allSubGenres = useMemo(() => {
    return [...SUB_GENRES, ...userSubGenres];
  }, [userSubGenres]);

  // ðŸ·ï¸ ì „ì²´ íƒœê·¸ ëª©ë¡ (ê¸°ë³¸ + ì»¤ìŠ¤í…€, ì‚¬ìš©ë¹ˆë„ìˆœ ì •ë ¬)
  const allTagsSorted = useMemo(() => {
    const allTags = [...ALL_GENERAL_TAGS, ...customTags];
    return sortTagsByUsage(allTags, tagUsageCounts);
  }, [customTags, tagUsageCounts]);

  // ðŸ·ï¸ ì •ë ¬ëœ ëŒ€ìž¥ë¥´ ëª©ë¡ (ì‚¬ìš©ë¹ˆë„ìˆœ)
  const sortedMajorGenres = useMemo(() => {
    return sortTagsByUsage([...MAJOR_GENRES, ...userMajorGenres], tagUsageCounts);
  }, [userMajorGenres, tagUsageCounts]);

  // ðŸ·ï¸ ì •ë ¬ëœ ë¶€ìž¥ë¥´ ëª©ë¡ (ì‚¬ìš©ë¹ˆë„ìˆœ)
  const sortedSubGenres = useMemo(() => {
    return sortTagsByUsage([...SUB_GENRES, ...userSubGenres], tagUsageCounts);
  }, [userSubGenres, tagUsageCounts]);

  // ðŸ·ï¸ ì¼ë°˜ íƒœê·¸ ì¹´í…Œê³ ë¦¬ë³„ ì •ë ¬ ëª©ë¡
  const sortedGeneralTags = useMemo(() => {
    const result = {};
    for (const [category, tagList] of Object.entries(GENERAL_TAGS)) {
      result[category] = sortTagsByUsage(tagList, tagUsageCounts);
    }
    return result;
  }, [tagUsageCounts]);

  // =========================================================
  // âš™ï¸ ì„¤ì • ê´€ë¦¬ í•¨ìˆ˜ (v2.6)
  // =========================================================
  
  // ì„¤ì • ì €ìž¥ (ë³€ê²½ ì‹œ ìžë™ í˜¸ì¶œ)
  async function saveAppSettings(newSettings) {
    // ðŸ†• v3.4: nested object deep merge
    const merged = { ...appSettings };
    
    for (const key of Object.keys(newSettings)) {
      if (key === 'plannedFields' || key === 'supplement' || key === 'recentChanges') {
        // nested objectëŠ” deep merge
        merged[key] = { ...appSettings[key], ...newSettings[key] };
      } else {
        merged[key] = newSettings[key];
      }
    }
    
    setAppSettings(merged);
    await setAppMeta("app_settings", merged);
    
    // í‹°ì–´ ìž„ê³„ê°’ì´ ë³€ê²½ë˜ë©´ ì „ì—­ ë³€ìˆ˜ë„ ì—…ë°ì´íŠ¸
    if (newSettings.tierThresholds) {
      globalTierThresholds = { ...globalTierThresholds, ...newSettings.tierThresholds };
    }
  }
  
  // í‹°ì–´ ížˆìŠ¤í† ë¦¬ ì €ìž¥ (S/A ê´€ë ¨ë§Œ)
  async function saveTierHistory(newHistory) {
    // S/A ê´€ë ¨ ë³€ê²½ë§Œ í•„í„°ë§ (from ë˜ëŠ” toê°€ S/Aì¸ ê²½ìš°)
    const saOnly = newHistory.filter(h => 
      h.from === 'S' || h.from === 'A' || h.to === 'S' || h.to === 'A'
    );
    const limited = saOnly.slice(0, 50); // ìµœëŒ€ 50ê°œ
    setTierHistory(limited);
    await setAppMeta("tier_history", limited);
  }
  
  // í‹°ì–´ ë³€ê²½ ê¸°ë¡ ì¶”ê°€ (ëª¨ë“  ë³€ê²½ ê¸°ë¡, ì €ìž¥ì€ S/Aë§Œ)
  function addTierHistoryEntry(id, title, from, to) {
    const entry = { id, title, from, to, at: Date.now() };
    setTierHistory(prev => {
      const updated = [entry, ...prev].slice(0, 50);
      // S/A ê´€ë ¨ë§Œ ì˜ì†í™”
      if (from === 'S' || from === 'A' || to === 'S' || to === 'A') {
        setAppMeta("tier_history", updated.filter(h => 
          h.from === 'S' || h.from === 'A' || h.to === 'S' || h.to === 'A'
        ).slice(0, 50));
      }
      return updated;
    });
  }
  
  // =========================================================
  // â†©ï¸ ì „ì—­ ë˜ëŒë¦¬ê¸° ìŠ¤íƒ (v2.6)
  // =========================================================
  
  // ë˜ëŒë¦¬ê¸° í•­ëª© ì¶”ê°€
  function pushUndo(type, payload, description) {
    setUndoStack(prev => {
      const maxSize = appSettings.undoStackSize || 30;
      return [{ type, payload, description, at: Date.now() }, ...prev].slice(0, maxSize);
    });
  }
  
  // ë§ˆì§€ë§‰ ìž‘ì—… ë˜ëŒë¦¬ê¸°
  async function performUndo() {
    if (undoStack.length === 0) {
      Alert.alert("ì•Œë¦¼", "ë˜ëŒë¦´ ìž‘ì—…ì´ ì—†ìŠµë‹ˆë‹¤.");
      return;
    }
    
    const item = undoStack[0];
    
    try {
      switch (item.type) {
        case 'tier_change':
          // í‹°ì–´ ë³€ê²½ ë˜ëŒë¦¬ê¸°
          await exec("UPDATE novels SET manual_tier=? WHERE id=?", [
            item.payload.prevTier === 'B+' || item.payload.prevTier === 'B' || 
            item.payload.prevTier === 'B-' || item.payload.prevTier === 'C' 
              ? null : item.payload.prevTier,
            item.payload.id
          ]);
          addTierHistoryEntry(item.payload.id, item.payload.title, item.payload.newTier, item.payload.prevTier);
          break;
          
        case 'tier_batch':
          // ì¼ê´„ í‹°ì–´ ë³€ê²½ ë˜ëŒë¦¬ê¸°
          for (const change of item.payload.changes) {
            await exec("UPDATE novels SET manual_tier=? WHERE id=?", [
              change.prevTier === 'B+' || change.prevTier === 'B' || 
              change.prevTier === 'B-' || change.prevTier === 'C'
                ? null : change.prevTier,
              change.id
            ]);
          }
          break;
          
        case 'novel_delete':
          // ìž‘í’ˆ ì‚­ì œ ë˜ëŒë¦¬ê¸° (ë³µì›)
          const n = item.payload.novel;
          await exec(
            `INSERT INTO novels (id,title,author,tags,platforms,note,read_count,rating,rd,wins,losses,match_count,tier,created_at,awards,total_episodes,status,pinned,cover_image,link,work_status,read_count_updated_at,major_genre,sub_genre,gaiden_status,gaiden_read_count,gaiden_total_episodes,manual_tier,reread_count,tag_data,aliases,memorable_quote)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
            [n.id, n.title, n.author, n.tags, n.platforms, n.note, n.read_count, n.rating, n.rd, n.wins, n.losses, n.match_count, n.tier, n.created_at, n.awards, n.total_episodes, n.status, n.pinned, n.cover_image, n.link, n.work_status, n.read_count_updated_at, n.major_genre, n.sub_genre, n.gaiden_status, n.gaiden_read_count, n.gaiden_total_episodes, n.manual_tier, n.reread_count || 1, n.tag_data || "", n.aliases || "", n.memorable_quote || ""]
          );
          break;
          
        case 'match_delete':
          // ë§¤ì¹­ ì‚­ì œ ë˜ëŒë¦¬ê¸°
          const m = item.payload.match;
          await exec(
            `INSERT INTO matches (id,a_id,b_id,winner_id,decided_by,gap_when_matched,k_factor_used,created_at) VALUES (?,?,?,?,?,?,?,?);`,
            [m.id, m.a_id, m.b_id, m.winner_id, m.decided_by, m.gap_when_matched, m.k_factor_used, m.created_at]
          );
          await rebuildAllFromMatches();
          break;
          
        default:
          Alert.alert("ì•Œë¦¼", "ì•Œ ìˆ˜ ì—†ëŠ” ìž‘ì—… ìœ í˜•ìž…ë‹ˆë‹¤.");
          return;
      }
      
      setUndoStack(prev => prev.slice(1));
      await loadList();
      Alert.alert("ì™„ë£Œ", `"${item.description}" ìž‘ì—…ì„ ë˜ëŒë ¸ìŠµë‹ˆë‹¤.`);
      
    } catch (e) {
      console.warn("undo ì˜¤ë¥˜:", e);
      Alert.alert("ì˜¤ë¥˜", "ë˜ëŒë¦¬ê¸° ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤.");
    }
  }
  
  // ìžë™ ìŠ¹ì¸ ì²´í¬ (ë§¤ì¹­ í›„ í˜¸ì¶œ)
  async function checkAutoApprove(novelId) {
    if (!appSettings.autoApproveEnabled) return;
    
    const novel = await first("SELECT * FROM novels WHERE id=?", [novelId]);
    if (!novel) return;
    
    const recommended = tierFromRating(novel.rating);
    const actual = getDisplayTier(novel);
    
    // ì´ë¯¸ S/Aë©´ ìŠ¤í‚µ
    if (actual === 'S' || actual === 'A') return;
    
    // ê¶Œìž¥ì´ S/Aê°€ ì•„ë‹ˆë©´ ìŠ¤í‚µ
    if (recommended !== 'S' && recommended !== 'A') return;
    
    // ì¡°ê±´ ì²´í¬
    const minWins = appSettings.autoApproveMinWins || 10;
    const maxLosses = appSettings.autoApproveMaxLosses || 3;
    const minMatches = appSettings.autoApproveMinMatches || 15;
    
    if ((novel.wins || 0) >= minWins && 
        (novel.losses || 0) <= maxLosses && 
        (novel.match_count || 0) >= minMatches) {
      // ìžë™ ìŠ¹ì¸
      await exec("UPDATE novels SET manual_tier=? WHERE id=?", [recommended, novelId]);
      addTierHistoryEntry(novelId, novel.title, actual, recommended);
      pushUndo('tier_change', {
        id: novelId,
        title: novel.title,
        prevTier: actual,
        newTier: recommended
      }, `ìžë™ ìŠ¹ì¸: ${novel.title} â†’ ${recommended}`);
      
      // ðŸ“° v3.0: ìžë™ ìŠ¹ì¸ ê¸°ë¡
      await addRecentChange(novelId, novel.title, "tier_review", {
        from: actual,
        to: recommended,
        action: "auto_approve"
      });
    }
  }

  // ============================================
  // ðŸ§  ì·¨í–¥ ë°œê²¬ ì‹œìŠ¤í…œ Phase 2: ë°ì´í„° ë¡œë“œ (v3.5.0)
  // ============================================
  
  /** ì¸ì‚¬ì´íŠ¸ ëŒ€ê¸°ì—´ ë¡œë“œ (ë¯¸í‘œì‹œ + ìµœê·¼ í‘œì‹œëœ ê²ƒ) */
  async function loadInsights() {
    try {
      setInsightLoading(true);
      const rows = await all(`
        SELECT * FROM insight_queue 
        WHERE status IN ('pending', 'shown', 'confirmed', 'rejected')
        ORDER BY 
          CASE status WHEN 'pending' THEN 0 WHEN 'shown' THEN 1 ELSE 2 END,
          priority DESC,
          created_at DESC
        LIMIT 20;
      `);
      setInsightList(rows || []);
    } catch (e) {
      console.warn("loadInsights ì˜¤ë¥˜:", e);
      setInsightList([]);
    } finally {
      setInsightLoading(false);
    }
  }

  /** ìƒìœ„ íŒ¨í„´ ìš”ì•½ ë¡œë“œ (ë†’ì€ ì‹ ë¢°ë„ ìˆœ) */
  async function loadPreferencePatterns() {
    try {
      const rows = await all(`
        SELECT * FROM preference_patterns 
        WHERE sample_size >= 3 AND confidence_lower > 0.1
        ORDER BY win_rate DESC, sample_size DESC
        LIMIT 30;
      `);
      setPreferencePatterns(rows || []);
    } catch (e) {
      console.warn("loadPreferencePatterns ì˜¤ë¥˜:", e);
      setPreferencePatterns([]);
    }
  }

  /** ì¸ì‚¬ì´íŠ¸ì— ì‚¬ìš©ìž ì‘ë‹µ ê¸°ë¡ */
  async function handleInsightResponse(insightId, response) {
    // response: 'confirmed' | 'rejected' | 'skipped'
    try {
      const timestamp = Date.now();
      await exec(`
        UPDATE insight_queue 
        SET status = ?, user_response = ?, responded_at = ?
        WHERE id = ?
      `, [response === 'skipped' ? 'dismissed' : response, response, timestamp, insightId]);
      
      // í™•ì¸/ê±°ë¶€ëœ ì¸ì‚¬ì´íŠ¸ëŠ” ê°€ì¤‘ì¹˜ í•™ìŠµì— ë°˜ì˜
      if (response === 'confirmed' || response === 'rejected') {
        await recordInsightFeedback(insightId, response);
      }
      
      await loadInsights();
    } catch (e) {
      console.warn("handleInsightResponse ì˜¤ë¥˜:", e);
    }
  }

  /** ì¸ì‚¬ì´íŠ¸ í”¼ë“œë°±ì„ ê°€ì¤‘ì¹˜ í•™ìŠµì— ë°˜ì˜ */
  async function recordInsightFeedback(insightId, response) {
    try {
      const insight = await first("SELECT * FROM insight_queue WHERE id = ?", [insightId]);
      if (!insight) return;
      
      // ê´€ë ¨ íŒ¨í„´ì˜ user_confirmed ì—…ë°ì´íŠ¸
      if (insight.pattern_id) {
        const delta = response === 'confirmed' ? 1 : -1;
        await exec(`
          UPDATE preference_patterns 
          SET user_confirmed = COALESCE(user_confirmed, 0) + ?
          WHERE id = ?
        `, [delta, insight.pattern_id]);
      }
      
      // ê°€ì¤‘ì¹˜ ì¡°ì • íŠ¸ë¦¬ê±° (5ê°œ í”¼ë“œë°±ë§ˆë‹¤)
      const feedbackCount = await first(`
        SELECT COUNT(*) as cnt FROM insight_queue 
        WHERE status IN ('confirmed', 'rejected')
      `);
      if (feedbackCount && feedbackCount.cnt % 5 === 0) {
        await adjustWeightsFromFeedback();
      }
    } catch (e) {
      console.warn("recordInsightFeedback ì˜¤ë¥˜:", e);
    }
  }

  /** í”¼ë“œë°± ê¸°ë°˜ ê°€ì¤‘ì¹˜ ìžë™ ì¡°ì • */
  async function adjustWeightsFromFeedback() {
    try {
      // í™•ì¸ëœ ì¸ì‚¬ì´íŠ¸ì˜ íŒ¨í„´ ìœ í˜• ë¶„ì„
      const confirmed = await all(`
        SELECT insight_type, COUNT(*) as cnt 
        FROM insight_queue 
        WHERE status = 'confirmed'
        GROUP BY insight_type
      `);
      
      const rejected = await all(`
        SELECT insight_type, COUNT(*) as cnt 
        FROM insight_queue 
        WHERE status = 'rejected'
        GROUP BY insight_type
      `);
      
      // í™•ì¸/ê±°ë¶€ ë¹„ìœ¨ë¡œ ê°€ì¤‘ì¹˜ ë¯¸ì„¸ ì¡°ì •
      const currentWeights = await getActiveWeights();
      if (!currentWeights) return;
      
      // ê°€ì¤‘ì¹˜ í•„ë“œë§Œ ë³µì‚¬ (ë²„ì „, ë©”íƒ€ë°ì´í„° ì œì™¸)
      const weightFields = [
        'w_elo', 'w_h2h', 'w_overall_winrate', 'w_reliability',
        'w_genre_matchup', 'w_tag_power', 'w_read_preference',
        'w_author_affinity', 'w_coordinate_zone'
      ];
      
      const weights = {};
      for (const field of weightFields) {
        weights[field] = Number(currentWeights[field]) || 0.1;
      }
      
      const adjustmentRate = 0.02; // 2% ì¡°ì •
      
      // insight_type â†’ weight í•„ë“œ ë§¤í•‘
      const typeToWeight = {
        'genre_matchup': 'w_genre_matchup',
        'genre_affinity': 'w_genre_matchup',
        'tag_power': 'w_tag_power',
        'author_loyalty': 'w_author_affinity',
        'rating_behavior': 'w_reliability',
        // ë²”ìš© íƒ€ìž…ë“¤ì€ ë¬´ì‹œ (discover, confirm, deep)
      };
      
      // í™•ì¸ëœ ìœ í˜• ê°€ì¤‘ì¹˜ ìƒìŠ¹
      for (const row of confirmed) {
        const weightField = typeToWeight[row.insight_type];
        if (weightField && weights[weightField] !== undefined) {
          weights[weightField] = Math.min(0.3, weights[weightField] * (1 + adjustmentRate));
        }
      }
      
      // ê±°ë¶€ëœ ìœ í˜• ê°€ì¤‘ì¹˜ í•˜ë½
      for (const row of rejected) {
        const weightField = typeToWeight[row.insight_type];
        if (weightField && weights[weightField] !== undefined) {
          weights[weightField] = Math.max(0.01, weights[weightField] * (1 - adjustmentRate));
        }
      }
      
      // ì •ê·œí™” (í•©ì´ 1ì´ ë˜ë„ë¡)
      const total = Object.values(weights).reduce((a, b) => a + b, 0);
      if (total > 0 && total !== 1) {
        for (const key of Object.keys(weights)) {
          weights[key] = weights[key] / total;
        }
      }
      
      // ë³€ê²½ëœ ê°€ì¤‘ì¹˜ ì¶”ì 
      const changedWeights = [];
      for (const field of weightFields) {
        if (Math.abs(weights[field] - (currentWeights[field] || 0)) > 0.001) {
          changedWeights.push(field);
        }
      }
      
      // ë³€ê²½ì‚¬í•­ì´ ì—†ìœ¼ë©´ ì €ìž¥ ì•ˆ í•¨
      if (changedWeights.length === 0) return;
      
      // ê¸°ì¡´ í™œì„± ê°€ì¤‘ì¹˜ ë¹„í™œì„±í™”
      await exec(`UPDATE weight_config SET is_active = 0 WHERE is_active = 1`);
      
      // ìƒˆ ë²„ì „ìœ¼ë¡œ ì €ìž¥ (ê°œë³„ ì»¬ëŸ¼ ì‚¬ìš©)
      await exec(`
        INSERT INTO weight_config (
          w_elo, w_h2h, w_overall_winrate, w_reliability,
          w_genre_matchup, w_tag_power, w_read_preference,
          w_author_affinity, w_coordinate_zone,
          change_source, change_reason, changed_weights,
          is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `, [
        weights.w_elo,
        weights.w_h2h,
        weights.w_overall_winrate,
        weights.w_reliability,
        weights.w_genre_matchup,
        weights.w_tag_power,
        weights.w_read_preference,
        weights.w_author_affinity,
        weights.w_coordinate_zone,
        'user_feedback',
        'í”¼ë“œë°± ê¸°ë°˜ ìžë™ ì¡°ì •',
        JSON.stringify(changedWeights),
        Date.now(),
      ]);
      
      console.log("[adjustWeightsFromFeedback] ê°€ì¤‘ì¹˜ ì¡°ì • ì™„ë£Œ:", changedWeights);
      
    } catch (e) {
      console.warn("adjustWeightsFromFeedback ì˜¤ë¥˜:", e);
    }
  }

  /** í˜„ìž¬ ë§¤ì¹­ì— ëŒ€í•œ ì˜ˆì¸¡ ìƒì„± */
  async function generateMatchPrediction(novelA, novelB) {
    if (!novelA || !novelB) {
      setMatchPrediction(null);
      return;
    }
    
    try {
      const prediction = await generateEnhancedPrediction(novelA, novelB);
      setMatchPrediction(prediction);
    } catch (e) {
      console.warn("generateMatchPrediction ì˜¤ë¥˜:", e);
      setMatchPrediction(null);
    }
  }

  /** ì¸ì‚¬ì´íŠ¸ ìœ í˜•ë³„ ì•„ì´ì½˜/ìƒ‰ìƒ */
  const INSIGHT_META = {
    // ì‹¤ì œ ìƒì„±ë˜ëŠ” íŒ¨í„´ ê¸°ë°˜ íƒ€ìž…
    genre_matchup: { icon: "âš”ï¸", label: "ìž¥ë¥´ ìƒì„±", color: "#8b5cf6" },
    genre_affinity: { icon: "ðŸ“š", label: "ìž¥ë¥´ ì„ í˜¸", color: "#6366f1" },
    tag_power: { icon: "ðŸ·ï¸", label: "íƒœê·¸ íŒŒì›Œ", color: "#3b82f6" },
    author_loyalty: { icon: "âœï¸", label: "ìž‘ê°€ ì¶©ì„±", color: "#06b6d4" },
    rating_behavior: { icon: "ðŸ“Š", label: "ë ˆì´íŒ… í–‰ë™", color: "#10b981" },
    // í–¥í›„ í™•ìž¥ íƒ€ìž…
    hidden_gem: { icon: "ðŸ’Ž", label: "ìˆ¨ì€ ë³´ì„", color: "#f59e0b" },
    cross_mismatch: { icon: "ðŸ”€", label: "êµì°¨ ë¶ˆì¼ì¹˜", color: "#ef4444" },
    tier_anomaly: { icon: "ðŸ†", label: "í‹°ì–´ ì´ìƒ", color: "#ec4899" },
    platform_bias: { icon: "ðŸŒ", label: "í”Œëž«í¼ íŽ¸í–¥", color: "#14b8a6" },
    completion_pattern: { icon: "âœ…", label: "ì™„ë… íŒ¨í„´", color: "#22c55e" },
  };

  async function loadList(sortKey, sortDir) {
    try {
      const sk = sortKey ?? homeSortKey;
      const sd = sortDir ?? homeSortDir;
      let orderBy = `pinned DESC, rating ${sd}, created_at ASC`;
      if (sk === "title") {
        orderBy = `pinned DESC, title COLLATE NOCASE ${sd}`;
      } else if (sk === "created") {
        orderBy = `pinned DESC, created_at ${sd}`;
      } else if (sk === "read") {
        orderBy = `pinned DESC, read_count ${sd}, rating DESC`;
      }
      const rows = await all(`SELECT * FROM novels ORDER BY ${orderBy};`);
      setList(rows || []);
      updateTagUsageCounts(rows || []); // ðŸ·ï¸ íƒœê·¸ ì‚¬ìš© ë¹ˆë„ ì—…ë°ì´íŠ¸
      await loadMatchStats();
    } catch (e) {
      console.warn("loadList ì˜¤ë¥˜:", e);
      setList([]);
    }
  }

  // ðŸ†• í•€ í† ê¸€
  const togglePin = useCallback(async (id, currentPinned) => {
    await exec("UPDATE novels SET pinned=? WHERE id=?", [currentPinned ? 0 : 1, id]);
    await loadList();
  }, []);

  // ðŸ“° v3.0: ìµœì‹  ë³€í™” ê¸°ë¡ ì¶”ê°€ í—¬í¼
  // type: "new" | "award" | "tier_change" | "tier_review" | "read_count" | "title_change" | "auto_tier"
  // ðŸ“… v3.0.3: customTimestamp ì˜µì…˜ ì¶”ê°€ (ë‚ ì§œ ìˆ˜ë™ ì„¤ì • ì‹œ í•´ë‹¹ ì‹œì  ê¸°ë¡ìš©)
  const addRecentChange = useCallback(async (novelId, novelTitle, type, details = {}, customTimestamp = null) => {
    const change = {
      id: uuid(),
      novelId,
      novelTitle,
      type,
      details, // { from, to, awardName, delta, etc. }
      timestamp: customTimestamp || Date.now(),
    };
    
    setRecentChanges(prev => {
      const updated = [change, ...prev].slice(0, 500); // ìµœëŒ€ 500ê°œ ìœ ì§€
      // ë¹„ë™ê¸°ë¡œ ì €ìž¥ (UI ë¸”ë¡œí‚¹ ë°©ì§€)
      setTimeout(() => setAppMeta("recent_changes", updated), 0);
      return updated;
    });
  }, []);
  
  // ðŸ“° v3.0: ìµœì‹  ë³€í™” ê¸°ë¡ ì „ì²´ ì‚­ì œ
  const clearRecentChanges = useCallback(async () => {
    Alert.alert(
      "í™•ì¸",
      "ëª¨ë“  ìµœì‹  ë³€í™” ê¸°ë¡ì„ ì‚­ì œí• ê¹Œìš”?",
      [
        { text: "ì·¨ì†Œ" },
        { 
          text: "ì‚­ì œ", 
          style: "destructive",
          onPress: async () => {
            setRecentChanges([]);
            await setAppMeta("recent_changes", []);
            Alert.alert("ì™„ë£Œ", "ìµœì‹  ë³€í™” ê¸°ë¡ì´ ì‚­ì œë˜ì—ˆìŠµë‹ˆë‹¤.");
          }
        }
      ]
    );
  }, []);

  const togglePlatform = useCallback((p) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }, []);

  async function addNovel() {
    const t = (title || "").trim();
    if (!t) {
      Alert.alert("ì•Œë¦¼", "ì œëª©ì€ í•„ìˆ˜ìž…ë‹ˆë‹¤.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const dup = await first("SELECT id FROM novels WHERE title=?", [t]);
      if (dup) {
        setIsLoading(false);
        Alert.alert("ì•Œë¦¼", "ê°™ì€ ì œëª©ì´ ì´ë¯¸ ìžˆìŠµë‹ˆë‹¤.");
        return;
      }
      
      // ðŸ·ï¸ ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ ìžë™ ê°ì§€ (ì„¤ì • ì•ˆ ëœ ê²½ìš°)
      const detectedGenres = detectGenres(tags);
      // ë°°ì—´ë¡œ ì €ìž¥ (ì„ íƒëœ ê²ƒì´ ìžˆìœ¼ë©´ ê·¸ê²ƒì„, ì—†ìœ¼ë©´ ìžë™ ê°ì§€ ê²°ê³¼)
      const finalMajorGenre = newMajorGenre.length > 0 
        ? JSON.stringify(newMajorGenre) 
        : (detectedGenres.majorGenre ? JSON.stringify([detectedGenres.majorGenre]) : "");
      const finalSubGenre = newSubGenre.length > 0 
        ? JSON.stringify(newSubGenre) 
        : (detectedGenres.subGenre ? JSON.stringify([detectedGenres.subGenre]) : "");
      
      const id = uuid();
      const now = Date.now();
      
      // ðŸ·ï¸ v5.0: tag_data ìƒì„±
      const tagDataJson = newTagData && newTagData.length > 0 
        ? JSON.stringify(newTagData) 
        : "";
      
      await exec(
        `INSERT INTO novels (id,title,author,tags,platforms,note,read_count,rating,rd,wins,losses,match_count,tier,created_at,awards,total_episodes,status,pinned,cover_image,link,work_status,read_count_updated_at,major_genre,sub_genre,gaiden_status,gaiden_read_count,gaiden_total_episodes,reread_count,tag_data,memorable_quote,aliases,manual_tier)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
        [
          id,
          t,
          author.trim(),
          tags.trim(),
          JSON.stringify(platforms),
          note.trim(),
          Number(readCount) || 0,
          1500,
          350,
          0,
          0,
          0,
          "C",
          now,
          "",
          Number(totalEpisodes) || 0,
          newStatus,
          0,
          newCoverImage,
          newLink.trim(),
          newWorkStatus,
          now,
          finalMajorGenre,
          finalSubGenre,
          newGaidenStatus,
          Number(newGaidenReadCount) || 0,
          Number(newGaidenTotalEpisodes) || 0,
          Math.max(1, Number(rereadCount) || 1), // ðŸ“š ë‹¤íšŒë… ì¹´ìš´íŠ¸
          tagDataJson, // ðŸ·ï¸ v5.0
          memorableQuote.trim(), // ðŸ’¬ ì¸ìƒê¹Šì€ ë¬¸ìž¥
          "", // aliases (ë¹ˆ ê°’)
          null, // manual_tier (null)
        ]
      );
      setTitle("");
      setAuthor("");
      setTags("");
      setPlatforms([]);
      setNote("");
      setMemorableQuote(""); // ðŸ’¬ ì¸ìƒê¹Šì€ ë¬¸ìž¥ ì´ˆê¸°í™”
      setReadCount("");
      setTotalEpisodes("");
      setRereadCount("1"); // ë‹¤íšŒë… ì´ˆê¸°í™”
      setNewStatus("reading");
      setNewWorkStatus("ongoing");
      setNewCoverImage("");
      setNewLink("");
      setNewMajorGenre([]);
      setNewSubGenre([]);
      setNewTagData([]); // ðŸ·ï¸ v5.0
      setNewGaidenStatus("none");
      setNewGaidenReadCount("");
      setNewGaidenTotalEpisodes("");
      await loadList();
      await refreshWeeklyRecommendation(false);
      
      // ðŸ–¼ï¸ v3.4.5: í‘œì§€ ë¼ì´ë¸ŒëŸ¬ë¦¬ ìƒíƒœ ì—…ë°ì´íŠ¸
      if (newCoverImage) {
        await applyNovelCover(id, newCoverImage, null);
        await loadCoverLibrary();
      }
      
      // ðŸ“° v3.0: ì‹ ê·œ ë“±ë¡ ê¸°ë¡
      let majorGenreText = "-";
      try {
        if (finalMajorGenre) {
          const parsed = JSON.parse(finalMajorGenre);
          if (Array.isArray(parsed)) majorGenreText = parsed.join(", ");
        }
      } catch {}
      await addRecentChange(id, t, "new", { 
        author: author.trim() || "-",
        majorGenre: majorGenreText
      });
      
      Alert.alert("ì™„ë£Œ", "ìž‘í’ˆì´ ì¶”ê°€ë˜ì—ˆìŠµë‹ˆë‹¤.");
    } catch (e) {
      console.warn("addNovel ì˜¤ë¥˜:", e);
      Alert.alert("ì˜¤ë¥˜", "ìž‘í’ˆ ì¶”ê°€ ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤.\n\n" + e.message);
    }
    setIsLoading(false);
  }


  async function removeNovel(id) {
    Alert.alert("í™•ì¸", "ì •ë§ë¡œ ì´ ìž‘í’ˆì„ ì‚­ì œí• ê¹Œìš”? (ëŒ€ì§„ ë¡œê·¸ë„ í•¨ê»˜ ì‚­ì œë©ë‹ˆë‹¤)", [
      { text: "ì·¨ì†Œ" },
      {
        text: "ì‚­ì œ",
        style: "destructive",
        onPress: async () => {
          // ðŸ–¼ï¸ v3.4.5: ì‚­ì œ ì „ì— í•´ë‹¹ ìž‘í’ˆì˜ í‘œì§€ ê°€ì ¸ì˜¤ê¸°
          const novel = await first("SELECT cover_image FROM novels WHERE id=?", [id]);
          const coverPath = novel?.cover_image;
          
          // ðŸ”„ v3.5.0: ìƒíƒœ ë™ê¸°í™” - ì‚­ì œ ëŒ€ìƒê³¼ ê´€ë ¨ëœ ëª¨ë“  ìƒíƒœ ì´ˆê¸°í™”
          if (pair && (pair.A?.id === id || pair.B?.id === id)) {
            setPair(null);
          }
          if (editItem?.id === id) {
            setEditItem(null);
            setEditOpen(false);
          }
          if (dailyReco?.novel?.id === id) {
            setDailyReco(null);
          }
          if (focusMatchNovel?.id === id) {
            setFocusMatchNovel(null);
          }
          
          await execBatch([
            { sql: "DELETE FROM matches WHERE a_id=? OR b_id=?", params: [id, id] },
            { sql: "DELETE FROM novels WHERE id=?", params: [id] },
          ]);
          
          // ðŸ–¼ï¸ v3.4.5: í‘œì§€ê°€ ìžˆì—ˆìœ¼ë©´ ìƒíƒœë¥¼ ë¯¸ì‚¬ìš©ìœ¼ë¡œ ë³€ê²½
          if (coverPath) {
            await updateCoverStatus(coverPath, null, "unused");
            await loadCoverLibrary();
          }
          
          await rebuildAllFromMatches();
          await loadList();
        },
      },
    ]);
  }

  async function resetAll() {
    Alert.alert(
      "âš ï¸ ì „ì²´ ì´ˆê¸°í™”", 
      "ëª¨ë“  ìž‘í’ˆê³¼ ëŒ€ì§„ ê¸°ë¡ì´ ì˜êµ¬ì ìœ¼ë¡œ ì‚­ì œë©ë‹ˆë‹¤.\n\nì •ë§ë¡œ ì´ˆê¸°í™”í•˜ì‹œê² ìŠµë‹ˆê¹Œ?", 
      [
        { text: "ì·¨ì†Œ", style: "cancel" },
        {
          text: "ì´ˆê¸°í™” ì§„í–‰",
          style: "destructive",
          onPress: () => {
            // ë‘ ë²ˆì§¸ í™•ì¸
            Alert.alert(
              "ðŸš¨ ìµœì¢… í™•ì¸",
              "ì´ ìž‘ì—…ì€ ë˜ëŒë¦´ ìˆ˜ ì—†ìŠµë‹ˆë‹¤!\n\n'ì‚­ì œ'ë¥¼ ëˆ„ë¥´ë©´ ëª¨ë“  ë°ì´í„°ê°€ ì‚­ì œë©ë‹ˆë‹¤.",
              [
                { text: "ì·¨ì†Œ", style: "cancel" },
                {
                  text: "ì‚­ì œ",
                  style: "destructive",
                  onPress: async () => {
                    setIsLoading(true);
                    await execBatch([
                      { sql: "DELETE FROM matches;" },
                      { sql: "DELETE FROM novels;" },
                    ]);
                    
                    // ðŸ–¼ï¸ v3.4.5: ëª¨ë“  í‘œì§€ë¥¼ ë¯¸ì‚¬ìš© ìƒíƒœë¡œ ë³€ê²½
                    await exec("UPDATE cover_library SET status='unused', novel_id=NULL");
                    await loadCoverLibrary();
                    
                    // ðŸ”„ v3.5.0: ëª¨ë“  ê´€ë ¨ ìƒíƒœ ì´ˆê¸°í™”
                    setLastMatchId(null);
                    setPair(null);
                    setEditItem(null);
                    setEditOpen(false);
                    setDailyReco(null);
                    setFocusMatchNovel(null);
                    setMatchAnalysis(null);
                    setMatchPrediction(null);
                    setSelectedIds([]);
                    
                    await loadList();
                    setIsLoading(false);
                    Alert.alert("ì™„ë£Œ", "ëª¨ë“  ë°ì´í„°ê°€ ì‚­ì œë˜ì—ˆìŠµë‹ˆë‹¤.");
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }

  /* ---------- Edit modal ---------- */
  const openEdit = useCallback((n) => {
    setEditItem(n);
    setEditOriginalReadCount(Number(n.read_count) || 0); // ðŸ†• ì›ë³¸ ì €ìž¥
    setEditOriginalTitle(n.title || ""); // ðŸ”§ v3.0.2: ì›ë³¸ ì œëª© ì €ìž¥
    setEditRating(String(n.rating.toFixed(1)));
    
    // ðŸ†• v3.4.1 #12: ìµœê·¼ íŽ¸ì§‘ ê¸°ë¡ì— ì¶”ê°€
    setRecentlyEditedIds(prev => {
      const filtered = prev.filter(id => id !== n.id);
      return [n.id, ...filtered].slice(0, 5);
    });
    
    // ðŸ†• ìƒˆ í•„ë“œë“¤ ë¡œë“œ
    setEditPlatforms(parsePlatforms(n.platforms));
    setEditStatus(n.status || "reading");
    setEditWorkStatus(n.work_status || "ongoing"); // ðŸ†• ìž‘í’ˆ ì—°ìž¬ ìƒíƒœ
    setEditCoverImage(n.cover_image || "");
    setEditOriginalCoverImage(n.cover_image || ""); // ðŸ–¼ï¸ v3.4.5: ì›ë³¸ í‘œì§€ ì €ìž¥
    setEditLink(n.link || ""); // ðŸ”— ë§í¬
    
    // ðŸ“… v3.0.3: ë‚ ì§œ í•„ë“œ ë¡œë“œ (timestamp â†’ YYYY-MM-DD)
    const formatDate = (ts) => {
      if (!ts) return "";
      const d = new Date(ts);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    setEditCreatedAt(formatDate(n.created_at));
    setEditReadCountUpdatedAt(formatDate(n.read_count_updated_at));
    
    // ðŸ“– ì™¸ì „ í•„ë“œ ë¡œë“œ
    setEditGaidenStatus(n.gaiden_status || "none");
    setEditGaidenReadCount(String(n.gaiden_read_count || 0));
    setEditGaidenTotalEpisodes(String(n.gaiden_total_episodes || 0));
    
    // ðŸ“š v3.0.4: ë‹¤íšŒë… ì¹´ìš´íŠ¸ ë¡œë“œ
    setEditRereadCount(String(n.reread_count || 1));
    
    // ðŸ’¬ ì¸ìƒê¹Šì€ ë¬¸ìž¥ ë¡œë“œ
    setEditMemorableQuote(n.memorable_quote || "");

    // â˜… awards JSON â†’ íŽ¸ì§‘ìš© ë°°ì—´ë¡œ íŒŒì‹±
    let parsed = [];
    try {
      const raw = JSON.parse(n.awards || "[]");
      if (Array.isArray(raw)) {
        parsed = raw
          .filter((a) => a && a.year && a.type)
          .map((a) => ({
            year: String(a.year),
            type: a.type,
          }));
      }
    } catch (e) {
      parsed = [];
    }
    setEditAwards(parsed);

    // ê¸°ë³¸ ìž…ë ¥ê°’ ì´ˆê¸°í™”
    setAwardYearInput(String(new Date().getFullYear()));
    const firstType = Object.keys(AWARD_META)[0] || "";
    setAwardTypeInput(firstType);

    setEditOpen(true);
  }, []);

  async function saveEdit() {
    const n = editItem;
    if (!n) return;

    const newTitle = (n.title || "").trim();
    if (!newTitle) {
      Alert.alert("ì•Œë¦¼", "ì œëª©ì€ ë¹„ìš¸ ìˆ˜ ì—†ìŠµë‹ˆë‹¤.");
      return;
    }

    setIsLoading(true);
    
    try {
      const dup = await first(
        "SELECT id FROM novels WHERE title=? AND id<>?",
        [newTitle, n.id]
      );
      if (dup) {
        setIsLoading(false);
        Alert.alert("ì•Œë¦¼", "ì´ë¯¸ ì¡´ìž¬í•˜ëŠ” ì œëª©ìž…ë‹ˆë‹¤.");
        return;
      }

      // ë¨¼ì € ëª¨ë‹¬ ë‹«ê¸°
      setEditOpen(false);
      setEditItem(null);

      // ë ˆì´íŒ… ì§ì ‘ ìˆ˜ì • (í™•ì¸ ì—†ì´ ë°”ë¡œ ì ìš©)
      const ratingNum = Number(editRating);
      if (!isNaN(ratingNum) && ratingNum > 0 && ratingNum !== n.rating) {
        await exec("UPDATE novels SET rating=? WHERE id=?", [ratingNum, n.id]);
      }

      // â˜… ìˆ˜ìƒ ì •ë³´ JSON ìƒì„± (editAwards ê¸°ì¤€)
      const awardsPayload =
        editAwards && editAwards.length
          ? JSON.stringify(
              editAwards.map((a) => ({
                year: Number(a.year) || "",
                type: a.type,
              }))
            )
          : "";

      // ðŸ†• ì½ì€ íšŒì°¨ê°€ ë³€ê²½ë˜ì—ˆìœ¼ë©´ ë³€ë™ì¼ ê°±ì‹ 
      const newReadCount = Number(n.read_count) || 0;
      const readCountChanged = editOriginalReadCount !== newReadCount;
      
      // ðŸ“… v3.0.3: ë‚ ì§œ ìˆ˜ë™ ë³€ê²½ ì²˜ë¦¬
      const parseDate = (str) => {
        if (!str) return null;
        const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
        return d.getTime();
      };
      
      const newCreatedAt = parseDate(editCreatedAt) || n.created_at || Date.now();
      const newReadCountUpdatedAt = parseDate(editReadCountUpdatedAt) || (readCountChanged ? Date.now() : (n.read_count_updated_at || Date.now()));

      await exec(
        "UPDATE novels SET title=?, author=?, tags=?, note=?, platforms=?, read_count=?, awards=?, total_episodes=?, status=?, cover_image=?, link=?, work_status=?, read_count_updated_at=?, major_genre=?, sub_genre=?, gaiden_status=?, gaiden_read_count=?, gaiden_total_episodes=?, created_at=?, reread_count=?, tag_data=?, memorable_quote=?, aliases=? WHERE id=?;",
        [
          newTitle,
          n.author?.trim() || "",
          n.tags?.trim() || "",
          n.note?.trim() || "",
          JSON.stringify(editPlatforms),
          newReadCount,
          awardsPayload,
          Number(n.total_episodes) || 0,
          editStatus,
          editCoverImage,
          editLink.trim(),
          editWorkStatus,
          newReadCountUpdatedAt,
          n.major_genre || "",
          n.sub_genre || "",
          editGaidenStatus,
          Number(editGaidenReadCount) || 0,
          Number(editGaidenTotalEpisodes) || 0,
          newCreatedAt,
          Math.max(1, Number(editRereadCount) || 1), // ðŸ“š ë‹¤íšŒë… ì¹´ìš´íŠ¸
          n.tag_data || "", // ðŸ·ï¸ v5.0
          editMemorableQuote.trim(), // ðŸ’¬ ì¸ìƒê¹Šì€ ë¬¸ìž¥
          n.aliases || "", // ðŸ·ï¸ ìž‘í’ˆ ë³„ëª… ìœ ì§€
          n.id,
        ]
      );
      await loadList();
      
      // ðŸ“° v3.0.2: ì œëª© ë³€ê²½ ê¸°ë¡
      if (editOriginalTitle && editOriginalTitle !== newTitle) {
        await addRecentChange(n.id, newTitle, "title_change", {
          from: editOriginalTitle,
          to: newTitle
        });
      }
      
      // ðŸ“° v3.0: ì½ì€ íšŒì°¨ìˆ˜ ë³€ê²½ ê¸°ë¡ (ìˆ˜ë™ ë‚ ì§œ ì„¤ì • ì‹œ í•´ë‹¹ ì‹œì ìœ¼ë¡œ ê¸°ë¡)
      if (readCountChanged && newReadCount > editOriginalReadCount) {
        const delta = newReadCount - editOriginalReadCount;
        await addRecentChange(n.id, newTitle, "read_count", {
          from: editOriginalReadCount,
          to: newReadCount,
          delta: delta
        }, newReadCountUpdatedAt); // ðŸ“… ìˆ˜ë™ ì„¤ì •ëœ ë‚ ì§œë¡œ ê¸°ë¡
      }
      
      // ðŸ–¼ï¸ v3.4.5: í‘œì§€ ë³€ê²½ ì‹œ ë¼ì´ë¸ŒëŸ¬ë¦¬ ìƒíƒœ ì—…ë°ì´íŠ¸
      if (editCoverImage !== editOriginalCoverImage) {
        await applyNovelCover(n.id, editCoverImage, editOriginalCoverImage);
        await loadCoverLibrary();
      }
    } catch (e) {
      console.warn("saveEdit ì˜¤ë¥˜:", e);
      const errorMsg = e.message || "";
      // ðŸ”§ v3.5.1: DB ì—°ê²° ì˜¤ë¥˜ ì‹œ ë” ëª…í™•í•œ ì•ˆë‚´
      if (errorMsg.includes("NullPointerException") || 
          errorMsg.includes("prepareAsync") ||
          errorMsg.includes("rejected")) {
        resetDbConnection(); // DB ì—°ê²° ë¦¬ì…‹
        Alert.alert(
          "ì˜¤ë¥˜", 
          "ë°ì´í„°ë² ì´ìŠ¤ ì—°ê²° ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤.\n\nìž ì‹œ í›„ ë‹¤ì‹œ ì‹œë„í•´ì£¼ì„¸ìš”. ë¬¸ì œê°€ ì§€ì†ë˜ë©´ ì•±ì„ ìž¬ì‹œìž‘í•´ì£¼ì„¸ìš”.",
          [{ text: "í™•ì¸" }]
        );
      } else {
        Alert.alert("ì˜¤ë¥˜", "ì €ìž¥ ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤.\n\n" + errorMsg);
      }
    }
    setIsLoading(false);
  }

  /* ---------- Logs modal ---------- */
  async function openLogs(n) {
    setLogTarget(n);
    setLogOpen(true);
    // v2.8: ìƒëŒ€ ìž‘í’ˆì˜ rating, manual_tierë„ ê°€ì ¸ì™€ì„œ í‹°ì–´ í‘œì‹œ
    const rows = await all(
      `SELECT m.*, 
              a.title AS a_title, a.rating AS a_rating, a.manual_tier AS a_manual_tier,
              b.title AS b_title, b.rating AS b_rating, b.manual_tier AS b_manual_tier
       FROM matches m
       LEFT JOIN novels a ON a.id=m.a_id
       LEFT JOIN novels b ON b.id=m.b_id
       WHERE a_id=? OR b_id=?
       ORDER BY created_at DESC;`,
      [n.id, n.id]
    );
    setLogs(rows);
  }

  async function deleteLog(mid) {
    Alert.alert("í™•ì¸", "ì´ ëŒ€ì§„ ê¸°ë¡ì„ ì‚­ì œí• ê¹Œìš”?", [
      { text: "ì·¨ì†Œ" },
      {
        text: "ì‚­ì œ",
        style: "destructive",
        onPress: async () => {
          await exec("DELETE FROM matches WHERE id=?", [mid]);
          await rebuildAllFromMatches();
          await loadList();
          if (logTarget) await openLogs(logTarget);
        },
      },
    ]);
  }

  async function flipWinner(mid) {
    const m = await first("SELECT * FROM matches WHERE id=?", [mid]);
    if (!m) return;
    const newWinner = m.winner_id === m.a_id ? m.b_id : m.a_id;
    await exec("UPDATE matches SET winner_id=? WHERE id=?", [newWinner, mid]);
    await rebuildAllFromMatches();
    await loadList();
    if (logTarget) await openLogs(logTarget);
  }

  /* ---------- Matching ---------- */
  const pickRandomUnseenPair = async () => {
    try {
      const allNovels = await all("SELECT * FROM novels ORDER BY rating DESC;");
      if (!allNovels || allNovels.length < 2) {
        Alert.alert("ì•Œë¦¼", "ìž‘í’ˆì„ 2ê°œ ì´ìƒ ì¶”ê°€í•˜ì„¸ìš”.");
        setPair(null);
        return;
      }

      const matchRows = await all("SELECT a_id,b_id FROM matches;");
      const played = new Set(
        (matchRows || []).map((r) => pairKey(r.a_id, r.b_id))
      );
      
      // ðŸ”„ v3.4.6: íì—ì„œ ì²˜ë¦¬ ëŒ€ê¸° ì¤‘ì¸ ë§¤ì¹˜ë„ ì œì™¸
      for (const pendingKey of pendingMatchPairs) {
        played.add(pendingKey);
      }

      const candidates = [];
      const focusId = focusMatchNovel?.id || null;

      if (focusId) {
        // âœ… íŠ¹ì • ìž‘í’ˆì´ ì„ íƒëœ ê²½ìš°: í•´ë‹¹ ìž‘í’ˆì´ í¬í•¨ëœ ë¯¸ëŒ€ì „ ì¡°í•©ë§Œ í›„ë³´ì— ë„£ê¸°
        const focus = allNovels.find((n) => n.id === focusId);
        if (!focus) {
          // ë¦¬ìŠ¤íŠ¸ì—ì„œ ì‚¬ë¼ì§„ ê²½ìš° ì„ íƒ í•´ì œ í›„ ì „ì²´ ë§¤ì¹­ìœ¼ë¡œ ì „í™˜
          setFocusMatchNovel(null);
          Alert.alert("ì•Œë¦¼", "ì„ íƒí•œ ìž‘í’ˆì„ ì°¾ì„ ìˆ˜ ì—†ì–´ ì „ì²´ ë§¤ì¹­ìœ¼ë¡œ ì „í™˜í•©ë‹ˆë‹¤.");
          for (let i = 0; i < allNovels.length; i++) {
            for (let j = i + 1; j < allNovels.length; j++) {
              const A = allNovels[i],
                B = allNovels[j];
              if (played.has(pairKey(A.id, B.id))) continue;
              candidates.push({ A, B });
            }
          }
        } else {
          for (let i = 0; i < allNovels.length; i++) {
            const other = allNovels[i];
            if (other.id === focusId) continue;
            const A = focus;
            const B = other;
            if (played.has(pairKey(A.id, B.id))) continue;
            candidates.push({ A, B });
          }
        }
      } else {
        // âœ… í‰ì†Œì²˜ëŸ¼ ì „ì—­ ë¯¸ëŒ€ì „ ì¡°í•© ì „ì²´ì—ì„œ í›„ë³´ ìƒì„±
        for (let i = 0; i < allNovels.length; i++) {
          for (let j = i + 1; j < allNovels.length; j++) {
            const A = allNovels[i],
              B = allNovels[j];
            if (played.has(pairKey(A.id, B.id))) continue;
            candidates.push({ A, B });
          }
        }
      }

      if (candidates.length === 0) {
        if (focusId) {
          Alert.alert(
            "ì•Œë¦¼",
            "ì„ íƒí•œ ìž‘í’ˆì´ í¬í•¨ëœ ìƒˆë¡œìš´(ë¯¸ëŒ€ì „) ë§¤ì¹­ì´ ì—†ìŠµë‹ˆë‹¤. ë‹¤ë¥¸ ìž‘í’ˆì„ ì„ íƒí•˜ê±°ë‚˜ ì „ì²´ ë§¤ì¹­ìœ¼ë¡œ ì‚¬ìš©í•´ ì£¼ì„¸ìš”."
          );
        } else {
          Alert.alert("ì•Œë¦¼", "ìƒˆë¡œìš´(ë¯¸ëŒ€ì „) ë§¤ì¹­ì´ ì—†ìŠµë‹ˆë‹¤.");
        }
        setPair(null);
        return;
      }
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      setPair({ A: picked.A, B: picked.B });
    } catch (e) {
      console.warn("pickRandomUnseenPair ì˜¤ë¥˜:", e);
      setPair(null);
      Alert.alert("ì˜¤ë¥˜", "ë§¤ì¹­ ìƒì„± ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤.\n\n" + e.message);
    }
  };

  // ë§¤ì¹­ í™”ë©´ ì§„ìž… ì‹œ ìžë™ ë§¤ì¹­ 1ê°œ ìƒì„±
  useEffect(() => {
    if (screen === "match" && !pair) {
      pickRandomUnseenPair();
    }
  }, [screen, pair]);

  // ðŸ§  v3.5.0: ë¶„ì„ íƒ­ ì§„ìž… ì‹œ ì¸ì‚¬ì´íŠ¸ ìžë™ ë¡œë“œ
  useEffect(() => {
    if (screen === "analysis") {
      loadInsights();
      loadPreferencePatterns();
    }
  }, [screen]);

  // ðŸ”® v3.0.3: ë§¤ì¹­ ìƒì„± ì‹œ ìŠ¹ë¶€ì˜ˆì¸¡ ë¶„ì„ ìˆ˜í–‰
  // ðŸ§  v3.5.0: ì·¨í–¥ ê¸°ë°˜ ì˜ˆì¸¡ ì¶”ê°€
  useEffect(() => {
    if (pair && pair.A && pair.B) {
      (async () => {
        try {
          const analysis = await analyzeMatchPrediction(pair.A, pair.B);
          setMatchAnalysis(analysis);
          
          // ðŸ§  ì·¨í–¥ ê¸°ë°˜ ì˜ˆì¸¡ ìƒì„±
          await generateMatchPrediction(pair.A, pair.B);
        } catch (e) {
          console.warn("ë§¤ì¹­ ë¶„ì„ ì˜¤ë¥˜:", e);
          setMatchAnalysis(null);
          setMatchPrediction(null);
        }
      })();
    } else {
      setMatchAnalysis(null);
      setMatchPrediction(null);
    }
  }, [pair]);

  const decide = async (winnerId, decided_by = "user") => {
    if (!pair) return;
    
    // ðŸ”„ v3.4.6: pairë¥¼ ë¡œì»¬ì— ìº¡ì²˜ (í ì²˜ë¦¬ ì¤‘ ìƒíƒœ ë³€ê²½ ëŒ€ë¹„)
    const currentPair = { A: { ...pair.A }, B: { ...pair.B } };
    const pairKey = matchPairKey(currentPair.A.id, currentPair.B.id);
    
    // ðŸ”„ v3.4.6: ì´ë¯¸ íì—ì„œ ì²˜ë¦¬ ì¤‘ì¸ ì¡°í•©ì´ë©´ ë¬´ì‹œ
    if (isMatchPending(currentPair.A.id, currentPair.B.id)) {
      console.log("decide: ì´ë¯¸ ì²˜ë¦¬ ì¤‘ì¸ ë§¤ì¹˜, ë¬´ì‹œ");
      return;
    }
    
    // ë‹¤ìŒ ë§¤ì¹­ì„ ë¨¼ì € ìƒì„± (UI ë°˜ì‘ì„±)
    pickRandomUnseenPair();
    
    // ðŸ”„ v3.4.6: ë§¤ì¹­ íìž‰ ì‹œìŠ¤í…œ ì‚¬ìš© (ë¹ ë¥¸ ì—°íƒ€ ëŒ€ì‘, pairKeyë¡œ ì¤‘ë³µ ë°©ì§€)
    return enqueueMatchTask(async () => {
      const A = await first("SELECT * FROM novels WHERE id=?", [currentPair.A.id]);
      const B = await first("SELECT * FROM novels WHERE id=?", [currentPair.B.id]);
      if (!A || !B) {
        return;
      }
      
      // ðŸ“° v3.0.2: ë§¤ì¹­ ì „ í‹°ì–´ ì €ìž¥ (ìžë™ í‹°ì–´ ë³€ë™ ì¶”ì ìš©)
      const tierBeforeA = A.manual_tier || tierFromRating(A.rating);
      const tierBeforeB = B.manual_tier || tierFromRating(B.rating);
      
      const aIsWinner = winnerId === A.id;
      const { newA, newB, kA, kB } = applyElo(A, B, aIsWinner);
      const kUsed = aIsWinner ? kA : kB;

      const mid = uuid();
      await execBatch([
        {
          sql: `UPDATE novels SET rating=?, rd=?, wins=?, losses=?, match_count=? WHERE id=?`,
          params: [
            newA.rating,
            newA.rd,
            newA.wins,
            newA.losses,
            newA.match_count,
            newA.id,
          ],
        },
        {
          sql: `UPDATE novels SET rating=?, rd=?, wins=?, losses=?, match_count=? WHERE id=?`,
          params: [
            newB.rating,
            newB.rd,
            newB.wins,
            newB.losses,
            newB.match_count,
            newB.id,
          ],
        },
        {
          sql: `INSERT INTO matches (id,a_id,b_id,winner_id,decided_by,gap_when_matched,k_factor_used,created_at)
                VALUES (?,?,?,?,?,?,?,?)`,
          params: [
            mid,
            A.id,
            B.id,
            winnerId,
            decided_by,
            Math.abs(A.rating - B.rating),
            kUsed,
            Date.now(),
          ],
        },
      ]);
      setLastMatchId(mid);
      
      // ðŸ“° v3.0.2: ìžë™ í‹°ì–´ ë³€ë™ ì¶”ì  (manual_tierê°€ ì—†ëŠ” ê²½ìš°ë§Œ)
      // Aì˜ í‹°ì–´ ë³€ë™ ì²´í¬
      if (!A.manual_tier) {
        const tierAfterA = tierFromRating(newA.rating);
        if (tierBeforeA !== tierAfterA) {
          await addRecentChange(A.id, A.title, "auto_tier", {
            from: tierBeforeA,
            to: tierAfterA,
            ratingBefore: A.rating,
            ratingAfter: newA.rating,
          });
        }
      }
      // Bì˜ í‹°ì–´ ë³€ë™ ì²´í¬
      if (!B.manual_tier) {
        const tierAfterB = tierFromRating(newB.rating);
        if (tierBeforeB !== tierAfterB) {
          await addRecentChange(B.id, B.title, "auto_tier", {
            from: tierBeforeB,
            to: tierAfterB,
            ratingBefore: B.rating,
            ratingAfter: newB.rating,
          });
        }
      }
      
      // ðŸ”® v3.0.3: ë§¤ì¹˜ ê²°ê³¼ ë¶„ì„ ë° ì¸ì‚¬ì´íŠ¸ ì €ìž¥
      if (matchAnalysis) {
        await analyzeMatchResult(A, B, winnerId, matchAnalysis);
      }
      
      // ðŸ§  v3.5.0: ì·¨í–¥ ë°œê²¬ ì‹œìŠ¤í…œ - ì„ íƒ ë¡œê·¸ ê¸°ë¡
      try {
        const winner = aIsWinner ? A : B;
        const loser = aIsWinner ? B : A;
        // matchAnalysis.predictedWinnerëŠ” "A" ë˜ëŠ” "B" ë¬¸ìžì—´
        const predictedWinnerId = matchAnalysis?.predictedWinner === "A" ? A.id : 
                                  matchAnalysis?.predictedWinner === "B" ? B.id : null;
        await saveChoiceLog(mid, winner, loser, decided_by, matchAnalysis ? {
          predictedWinnerId,
          confidence: matchAnalysis.confidence || 0,
          factors: null, // analyzeMatchPredictionì€ factorsë¥¼ ë°˜í™˜í•˜ì§€ ì•ŠìŒ
        } : null);
      } catch (e) {
        console.warn("[decide] saveChoiceLog ì˜¤ë¥˜:", e);
      }
      
      await loadList();
    }, pairKey).catch((e) => {
      console.warn("decide ì˜¤ë¥˜:", e);
      Alert.alert("ì˜¤ë¥˜", "ë§¤ì¹­ ê²°ê³¼ ì €ìž¥ ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤.\n\n" + e.message);
    });
  };

  // ðŸŽ¯ v3.0.4: í™•ìž¥ëœ ìžë™ìŠ¹íŒ¨ íŒì • í•¨ìˆ˜
  const evaluateAutoMatch = useCallback((A, B, analysis) => {
    const { criteria, mode } = autoMatchSettings;
    const results = [];
    
    // 1. ë ˆì´íŒ… ê²©ì°¨
    if (criteria.ratingGap?.enabled) {
      const gap = Math.abs(A.rating - B.rating);
      const threshold = Number(criteria.ratingGap.threshold) || 250;
      if (gap >= threshold) {
        results.push({
          criterion: "ratingGap",
          winner: A.rating > B.rating ? A : B,
          value: gap,
          threshold,
        });
      }
    }
    
    // 2. ì˜ˆì¸¡ ìŠ¹ë¥  (matchAnalysis í™œìš©) - 0~1 ë²”ìœ„ë¥¼ %ë¡œ ë³€í™˜
    if (criteria.predictionRate?.enabled && analysis) {
      const threshold = Number(criteria.predictionRate.threshold) || 75;
      const rateA = (analysis.predictedWinRateA || 0.5) * 100; // 0~1 â†’ 0~100%
      const rateB = (analysis.predictedWinRateB || 0.5) * 100;
      if (rateA >= threshold) {
        results.push({
          criterion: "predictionRate",
          winner: A,
          value: Math.round(rateA),
          threshold,
        });
      } else if (rateB >= threshold) {
        results.push({
          criterion: "predictionRate",
          winner: B,
          value: Math.round(rateB),
          threshold,
        });
      }
    }
    
    // 3. ì§ì ‘ëŒ€ê²° ì—°ìŠ¹ (h2h.aWins/bWins ì‚¬ìš©)
    if (criteria.h2hStreak?.enabled && analysis?.h2h) {
      const threshold = Number(criteria.h2hStreak.threshold) || 3;
      const h2h = analysis.h2h;
      if (h2h.aWins >= threshold) {
        results.push({
          criterion: "h2hStreak",
          winner: A,
          value: h2h.aWins,
          threshold,
        });
      } else if (h2h.bWins >= threshold) {
        results.push({
          criterion: "h2hStreak",
          winner: B,
          value: h2h.bWins,
          threshold,
        });
      }
    }
    
    // 4. í‹°ì–´ ì°¨ì´
    if (criteria.tierDiff?.enabled) {
      const tierOrder = ["S", "A", "B+", "B", "B-", "C"];
      const getTierIdx = (r) => {
        const t = tierBadge(r).t;
        return tierOrder.indexOf(t);
      };
      const idxA = getTierIdx(A.rating);
      const idxB = getTierIdx(B.rating);
      const diff = Math.abs(idxA - idxB);
      const threshold = Number(criteria.tierDiff.threshold) || 2;
      if (diff >= threshold) {
        results.push({
          criterion: "tierDiff",
          winner: idxA < idxB ? A : B, // ë‚®ì€ ì¸ë±ìŠ¤ = ë†’ì€ í‹°ì–´
          value: diff,
          threshold,
        });
      }
    }
    
    // 5. ìŠ¹ë¥  ì°¨ì´
    if (criteria.winRateDiff?.enabled) {
      const getWinRate = (n) => {
        const total = (n.wins || 0) + (n.losses || 0);
        return total > 0 ? ((n.wins || 0) / total) * 100 : 50;
      };
      const wrA = getWinRate(A);
      const wrB = getWinRate(B);
      const diff = Math.abs(wrA - wrB);
      const threshold = Number(criteria.winRateDiff.threshold) || 30;
      if (diff >= threshold) {
        results.push({
          criterion: "winRateDiff",
          winner: wrA > wrB ? A : B,
          value: diff,
          threshold,
        });
      }
    }
    
    // 6. ì½ì€ ë¹„ìœ¨ ì°¨ì´
    if (criteria.readRatioDiff?.enabled) {
      const getReadRatio = (n) => {
        if (!n.total_episodes || n.total_episodes <= 0) return 0;
        return ((n.read_count || 0) / n.total_episodes) * 100;
      };
      const rrA = getReadRatio(A);
      const rrB = getReadRatio(B);
      const diff = Math.abs(rrA - rrB);
      const threshold = Number(criteria.readRatioDiff.threshold) || 50;
      if (diff >= threshold && (rrA > 0 || rrB > 0)) {
        results.push({
          criterion: "readRatioDiff",
          winner: rrA > rrB ? A : B,
          value: diff,
          threshold,
        });
      }
    }
    
    // 7. ë§¤ì¹­ ìˆ˜ ì°¨ì´
    if (criteria.matchCountDiff?.enabled) {
      const mcA = A.match_count || 0;
      const mcB = B.match_count || 0;
      const diff = Math.abs(mcA - mcB);
      const threshold = Number(criteria.matchCountDiff.threshold) || 20;
      // ë§¤ì¹­ ìˆ˜ê°€ ë§Žì€ ìª½ì´ ë” ì‹ ë¢°ë„ ë†’ìŒ â†’ ë‹¨ìˆœ ì°¨ì´ê°€ ì•„ë‹Œ ë¹„ìœ¨ë¡œ
      if (diff >= threshold && mcA !== mcB) {
        // ë§¤ì¹­ ë§Žì€ ìª½ì´ ìœ ë¦¬í•˜ë‹¤ê³  ê°€ì •í•˜ì§€ ì•ŠìŒ - ë‹¨ìˆœížˆ ì°¨ì´ê°€ í¬ë©´ ë§Žì€ ìª½ ìŠ¹
        results.push({
          criterion: "matchCountDiff",
          winner: mcA > mcB ? A : B,
          value: diff,
          threshold,
        });
      }
    }
    
    // ê²°ê³¼ íŒì •
    if (results.length === 0) return null;
    
    if (mode === "all") {
      // ëª¨ë“  í™œì„±í™”ëœ ê¸°ì¤€ì˜ ìŠ¹ìžê°€ ë™ì¼í•´ì•¼ í•¨
      const enabledCount = Object.values(criteria).filter(c => c.enabled).length;
      if (results.length < enabledCount) return null;
      
      const firstWinner = results[0].winner;
      const allSame = results.every(r => r.winner.id === firstWinner.id);
      if (allSame) {
        return { winner: firstWinner, reasons: results };
      }
      return null;
    } else {
      // "any" ëª¨ë“œ: í•˜ë‚˜ë¼ë„ ë§Œì¡±í•˜ë©´ ìŠ¹ìž ê²°ì • (ê°€ìž¥ ëª…í™•í•œ ê¸°ì¤€ ìš°ì„ )
      // ê²°ê³¼ë“¤ì˜ ìŠ¹ìžê°€ ë™ì¼í•˜ë©´ ê·¸ ìŠ¹ìžë¡œ, ë‹¤ë¥´ë©´ ì²« ë²ˆì§¸ ê²°ê³¼ ì‚¬ìš©
      const winnerCounts = {};
      for (const r of results) {
        winnerCounts[r.winner.id] = (winnerCounts[r.winner.id] || 0) + 1;
      }
      
      // ê°€ìž¥ ë§Žì€ ê¸°ì¤€ì—ì„œ ìŠ¹ë¦¬í•œ ìž‘í’ˆ
      let maxWinnerId = null;
      let maxCount = 0;
      for (const [id, count] of Object.entries(winnerCounts)) {
        if (count > maxCount) {
          maxCount = count;
          maxWinnerId = id;
        }
      }
      
      if (maxWinnerId) {
        const winner = maxWinnerId === A.id ? A : B;
        return { winner, reasons: results.filter(r => r.winner.id === maxWinnerId) };
      }
      
      return null;
    }
  }, [autoMatchSettings]);

  // ìžë™ ìŠ¹íŒ¨ (í™•ìž¥ëœ ë²„ì „)
  // ðŸ”§ v3.4.7: ì†ë„ ì˜µì…˜ ì¶”ê°€ (fast/normal/slow)
  useEffect(() => {
    // ì´ë¯¸ ìžë™ ìŠ¹íŒ¨ ì²˜ë¦¬ ì¤‘ì´ë©´ ë¬´ì‹œ
    if (isAutoMatching) return;
    
    (async () => {
      if (!autoEnabled || !pair) return;
      
      // í™•ìž¥ëœ ìžë™ìŠ¹íŒ¨ íŒì •
      const result = evaluateAutoMatch(pair.A, pair.B, matchAnalysis);
      
      if (result && result.winner) {
        setIsAutoMatching(true);
        
        try {
          await decide(result.winner.id, "auto");
          
          // ðŸ”§ v3.4.7: ì†ë„ ì„¤ì •ì— ë”°ë¥¸ ë”œë ˆì´
          const speed = autoMatchSettings.speed || "fast";
          const delayMs = speed === "fast" ? 10 : speed === "normal" ? 100 : 500;
          
          if (delayMs > 0) {
            await new Promise(r => setTimeout(r, delayMs));
          }
        } finally {
          setIsAutoMatching(false);
        }
      }
    })();
  }, [pair, autoEnabled, autoMatchSettings, matchAnalysis, evaluateAutoMatch, isAutoMatching]);
  
  // ìžë™ìŠ¹íŒ¨ ì„¤ì • ì €ìž¥
  const saveAutoMatchSettings = useCallback((updates) => {
    setAutoMatchSettings(prev => {
      const updated = {
        ...prev,
        ...updates,
        criteria: {
          ...prev.criteria,
          ...(updates.criteria || {}),
        },
      };
      setTimeout(() => setAppMeta("auto_match_settings", updated), 0);
      return updated;
    });
  }, []);
  
  // ê°œë³„ ê¸°ì¤€ í† ê¸€
  const toggleAutoCriterion = useCallback((key) => {
    setAutoMatchSettings(prev => {
      const updated = {
        ...prev,
        criteria: {
          ...prev.criteria,
          [key]: {
            ...prev.criteria[key],
            enabled: !prev.criteria[key]?.enabled,
          },
        },
      };
      setTimeout(() => setAppMeta("auto_match_settings", updated), 0);
      return updated;
    });
  }, []);
  
  // ê°œë³„ ê¸°ì¤€ ìž„ê³„ê°’ ë³€ê²½
  const setAutoCriterionThreshold = useCallback((key, value) => {
    setAutoMatchSettings(prev => {
      const updated = {
        ...prev,
        criteria: {
          ...prev.criteria,
          [key]: {
            ...prev.criteria[key],
            threshold: Number(value) || 0,
          },
        },
      };
      setTimeout(() => setAppMeta("auto_match_settings", updated), 0);
      return updated;
    });
  }, []);
  
  // ì¶”ì²œ íƒ­ ì§„ìž… ì‹œ, ìž‘í’ˆ ë¦¬ìŠ¤íŠ¸ ìµœì‹ í™” í›„ ì¶”ì²œ ìƒì„±
  useEffect(() => {
    if (screen === "reco") {
      (async () => {
        await loadList();
        await loadPlannedList(); // ðŸ“‹ v3.3.0: ì˜ˆì • ìž‘í’ˆë„ ë¡œë“œ
        await refreshDailyRecommendation(false);
      })();
    }
  }, [screen]);

  // ì˜ˆì • íƒ­ ì§„ìž… ì‹œ ì˜ˆì • ëª©ë¡ ë¡œë“œ
  useEffect(() => {
    if (screen === "planned") {
      loadPlannedList();
    }
  }, [screen]);

  // ë§ˆì§€ë§‰ ë§¤ì¹­ ì–¸ë‘
  async function undoLastMatch() {
    if (!lastMatchId) {
      Alert.alert("ì•Œë¦¼", "ë˜ëŒë¦´ ìµœê·¼ ë§¤ì¹­ì´ ì—†ìŠµë‹ˆë‹¤.");
      return;
    }
    Alert.alert("í™•ì¸", "ìµœê·¼ ë§¤ì¹­ 1ê±´ì„ ë˜ëŒë¦´ê¹Œìš”?", [
      { text: "ì·¨ì†Œ" },
      {
        text: "ë˜ëŒë¦¬ê¸°",
        style: "destructive",
        onPress: async () => {
          await exec("DELETE FROM matches WHERE id=?", [lastMatchId]);
          setLastMatchId(null);
          setPair(null);
          await rebuildAllFromMatches();
          await loadList();
          Alert.alert("ì™„ë£Œ", "ë§ˆì§€ë§‰ ë§¤ì¹­ì„ ë˜ëŒë ¸ìŠµë‹ˆë‹¤.");
        },
      },
    ]);
  }

  /* ---------- ê²€ìƒ‰/ëŒ€ëŸ‰/ì •ë ¬ ---------- */

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // ðŸ” ê³ ê¸‰ ê²€ìƒ‰ í•„í„°ë§ (v2.3) - ë‹¤ì¤‘ ì¡°ê±´, ì œì™¸ ê¸°ëŠ¥
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  
  /** ìž‘í’ˆì˜ ëª¨ë“  íƒœê·¸ ì¶”ì¶œ (ì¼ë°˜íƒœê·¸ + ëŒ€ìž¥ë¥´ + ë¶€ìž¥ë¥´ + aliases) 
   *  v5.0: ì •ê·œí™”ëœ íƒœê·¸ + ì›ë³¸ alias ëª¨ë‘ í¬í•¨
   */
  const getAllNovelTags = (novel) => {
    const tags = new Set();
    
    // ì¼ë°˜ íƒœê·¸ (ì •ê·œí™” + ì›ë³¸)
    (novel.tags || "").split(",").map(t => t.trim()).filter(Boolean).forEach(t => {
      tags.add(t);
      const normalized = normalizeTag(t);
      if (normalized !== t) tags.add(normalized);
    });
    
    // ëŒ€ìž¥ë¥´
    parseMajorSub(novel.major_genre).forEach(g => {
      tags.add(g);
      const normalized = normalizeTag(g);
      if (normalized !== g) tags.add(normalized);
    });
    
    // ë¶€ìž¥ë¥´
    parseMajorSub(novel.sub_genre).forEach(g => {
      tags.add(g);
      const normalized = normalizeTag(g);
      if (normalized !== g) tags.add(normalized);
    });
    
    // ìž‘í’ˆ ë³„ëª… (aliases)
    parseNovelAliases(novel.aliases).forEach(a => tags.add(a));
    
    return tags;
  };
  
  /** ê²€ìƒ‰ì–´ì— ëŒ€í•´ alias í™•ìž¥ í›„ ë§¤ì¹­ ì—¬ë¶€ í™•ì¸ */
  const matchTagWithAlias = (novelTags, searchTag) => {
    // ê²€ìƒ‰ì–´ í™•ìž¥ (ì •ê·œí™” + aliasë“¤)
    const variants = expandTagForSearch(searchTag);
    return variants.some(v => novelTags.has(v) || 
      Array.from(novelTags).some(t => t.toLowerCase().includes(v))
    );
  };

  // ðŸ†• v3.4.1 #10: ì‹¤ì‹œê°„ ì¤‘ë³µ ì²´í¬ (ì œëª© ìž…ë ¥ ì‹œ)
  const titleDuplicateInfo = useMemo(() => {
    const t = (title || "").trim().toLowerCase();
    if (!t || t.length < 2) return null;
    
    // ì •í™•ížˆ ì¼ì¹˜
    const exactMatch = list.find(n => (n.title || "").toLowerCase() === t);
    if (exactMatch) {
      return { type: "exact", novel: exactMatch, message: `ì´ë¯¸ ë“±ë¡ëœ ìž‘í’ˆìž…ë‹ˆë‹¤` };
    }
    
    // ìœ ì‚¬í•œ ì œëª© (í¬í•¨ ê´€ê³„)
    const similarMatches = list.filter(n => {
      const nt = (n.title || "").toLowerCase();
      return nt.includes(t) || t.includes(nt);
    });
    if (similarMatches.length > 0) {
      return { type: "similar", novels: similarMatches.slice(0, 3), message: `ë¹„ìŠ·í•œ ì œëª©ì´ ${similarMatches.length}ê°œ ìžˆìŠµë‹ˆë‹¤` };
    }
    
    return null;
  }, [title, list]);
  
  // ðŸ†• v3.4.1 #10: ì˜ˆì • ì œëª© ì¤‘ë³µ ì²´í¬
  const plannedTitleDuplicateInfo = useMemo(() => {
    const t = (plannedTitle || "").trim().toLowerCase();
    if (!t || t.length < 2) return null;
    
    // ë³¸ ëª©ë¡ì— ì •í™•ížˆ ì¼ì¹˜
    const exactInMain = list.find(n => (n.title || "").toLowerCase() === t);
    if (exactInMain) {
      return { type: "exact_main", novel: exactInMain, message: `ë³¸ ëª©ë¡ì— ì´ë¯¸ ë“±ë¡ëœ ìž‘í’ˆìž…ë‹ˆë‹¤` };
    }
    
    // ì˜ˆì • ëª©ë¡ì— ì •í™•ížˆ ì¼ì¹˜
    const exactInPlanned = plannedList.find(n => (n.title || "").toLowerCase() === t);
    if (exactInPlanned) {
      return { type: "exact_planned", novel: exactInPlanned, message: `ì˜ˆì • ëª©ë¡ì— ì´ë¯¸ ìžˆìŠµë‹ˆë‹¤` };
    }
    
    // ìœ ì‚¬í•œ ì œëª©
    const similarInMain = list.filter(n => {
      const nt = (n.title || "").toLowerCase();
      return nt.includes(t) || t.includes(nt);
    });
    const similarInPlanned = plannedList.filter(n => {
      const nt = (n.title || "").toLowerCase();
      return nt.includes(t) || t.includes(nt);
    });
    const allSimilar = [...similarInMain, ...similarInPlanned];
    
    if (allSimilar.length > 0) {
      return { type: "similar", count: allSimilar.length, message: `ë¹„ìŠ·í•œ ì œëª©ì´ ${allSimilar.length}ê°œ ìžˆìŠµë‹ˆë‹¤` };
    }
    
    return null;
  }, [plannedTitle, list, plannedList]);
  
  // ðŸ†• v3.4.1 #12: ìµœê·¼ íŽ¸ì§‘í•œ ìž‘í’ˆ ëª©ë¡
  const recentlyEditedNovels = useMemo(() => {
    return recentlyEditedIds
      .map(id => list.find(n => n.id === id))
      .filter(Boolean)
      .slice(0, 5);
  }, [recentlyEditedIds, list]);

  const homeFiltered = useMemo(() => {
    const q = homeQuery.toLowerCase().trim();
    let result = list;
    
    // ðŸ†• ê³ ê¸‰ í•„í„° ë¨¼ì € ì ìš©
    result = advancedFilter(result);
    
    // ðŸ” AND ì¡°ê±´ íƒœê·¸ í•„í„° (ëª¨ë“  íƒœê·¸ë¥¼ í¬í•¨í•´ì•¼ í•¨) - v5.0: alias ì§€ì›
    if (searchIncludeTags.length > 0) {
      result = result.filter((n) => {
        const novelTags = getAllNovelTags(n);
        return searchIncludeTags.every(tag => matchTagWithAlias(novelTags, tag));
      });
    }
    
    // ðŸš« ì œì™¸ íƒœê·¸ í•„í„° - v5.0: alias ì§€ì›
    if (searchExcludeTags.length > 0) {
      result = result.filter((n) => {
        const novelTags = getAllNovelTags(n);
        return !searchExcludeTags.some(tag => matchTagWithAlias(novelTags, tag));
      });
    }
    
    // ðŸš« ì œì™¸ ìƒíƒœ í•„í„° (ì½ê¸° ìƒíƒœ)
    if (searchExcludeStatus.length > 0) {
      result = result.filter((n) => !searchExcludeStatus.includes(n.status || "reading"));
    }
    
    // ðŸš« ì œì™¸ ìž‘í’ˆ ìƒíƒœ í•„í„° (ì—°ìž¬ ìƒíƒœ)
    if (searchExcludeWorkStatus.length > 0) {
      result = result.filter((n) => !searchExcludeWorkStatus.includes(n.work_status || "ongoing"));
    }
    
    // ê²€ìƒ‰ì–´ í•„í„° - v5.0: alias + aliases í¬í•¨
    if (q) {
      // ê²€ìƒ‰ì–´ í™•ìž¥ (alias í¬í•¨)
      const searchVariants = expandTagForSearch(q);
      
      result = result.filter((n) => {
        const plats = parsePlatforms(n.platforms);
        const awardText = awardsToSearchText(n.awards);
        const aliasesText = parseNovelAliases(n.aliases).join(" ");
        const bank = [n.title, n.author, n.tags, n.note, awardText, aliasesText, ...(plats || [])].join(" ").toLowerCase();
        
        // í™•ìž¥ëœ ê²€ìƒ‰ì–´ ì¤‘ í•˜ë‚˜ë¼ë„ ë§¤ì¹­ë˜ë©´ í†µê³¼
        return searchVariants.some(variant => bank.includes(variant));
      });
    }
    return result;
  }, [homeQuery, list, filterTier, filterPlatform, filterGenre, filterStatus, searchIncludeTags, searchExcludeTags, searchExcludeStatus, searchExcludeWorkStatus]);

  // ê³µìš© ê²€ìƒ‰ í•„í„° (bulk/search)
  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    if (!q) return list;
    return list.filter((n) => {
      const plats = (() => {
        try {
          return JSON.parse(n.platforms || "[]");
        } catch {
          return [];
        }
      })();

      // â˜… ìˆ˜ìƒ í…ìŠ¤íŠ¸ ì¶”ê°€
      const awardText = awardsToSearchText(n.awards);
      // ðŸ·ï¸ v5.0: ìž‘í’ˆ ë³„ëª… ì¶”ê°€
      const aliasesText = parseNovelAliases(n.aliases).join(" ");
      
      // ê²€ìƒ‰ì–´ í™•ìž¥ (alias í¬í•¨)
      const searchVariants = expandTagForSearch(q);

      const bank = [
        n.title,
        n.author,
        n.tags,
        n.note,
        awardText,
        aliasesText,
        ...(plats || []),
      ]
        .join(" ")
        .toLowerCase();
      
      // í™•ìž¥ëœ ê²€ìƒ‰ì–´ ì¤‘ í•˜ë‚˜ë¼ë„ ë§¤ì¹­ë˜ë©´ í†µê³¼
      return searchVariants.some(variant => bank.includes(variant));
    });
  }, [query, list]);

  const bulkFiltered = useMemo(() => {
    let result = [...filtered];
    if (bulkSortKey === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (bulkSortKey === "title") {
      result.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );
    } else if (bulkSortKey === "created") {
      result.sort((a, b) => a.created_at - b.created_at);
    } else if (bulkSortKey === "read") {
      result.sort((a, b) => {
        if (b.read_count !== a.read_count)
          return b.read_count - a.read_count;
        return b.rating - a.rating;
      });
    }
    return result;
  }, [filtered, bulkSortKey]);

  // ðŸ”¹ ë§¤ì¹­ìš©: íŠ¹ì • ìž‘í’ˆ ê³ ì • ì„ íƒ í›„ë³´ ë¦¬ìŠ¤íŠ¸
  const focusMatchCandidates = useMemo(() => {
    const q = (focusMatchQuery || "").toLowerCase().trim();
    if (!q) return list;
    return list.filter((n) => {
      const bank = [
        n.title || "",
        n.author || "",
        n.tags || "",
      ]
        .join(" ")
        .toLowerCase();
      return bank.includes(q);
    });
  }, [focusMatchQuery, list]);

  // ðŸ”¹ ìˆœìœ„ íƒ­ìš©: ì „ì—­ ìˆœìœ„ + ê²€ìƒ‰ + í‹°ì–´ í•„í„°
  const rankedEntries = useMemo(() => {
    if (!list || list.length === 0) return [];

    // 1) ì‹¤ì œ í‹°ì–´ ìš°ì„  â†’ ê°™ì€ í‹°ì–´ ë‚´ì—ì„œ ë ˆì´íŒ… ë‚´ë¦¼ì°¨ìˆœ â†’ ë“±ë¡ ìˆœ â†’ ì œëª© ìˆœ
    const sorted = [...list].sort((a, b) => {
      const tierA = getDisplayTier(a);
      const tierB = getDisplayTier(b);
      const tierRankA = tierRank(tierA);
      const tierRankB = tierRank(tierB);
      
      // í‹°ì–´ê°€ ë‹¤ë¥´ë©´ í‹°ì–´ ìˆœì„œëŒ€ë¡œ (S=0, A=1, B+=2, ...)
      if (tierRankA !== tierRankB) return tierRankA - tierRankB;
      
      // ê°™ì€ í‹°ì–´ ë‚´ì—ì„œëŠ” ë ˆì´íŒ… ë‚´ë¦¼ì°¨ìˆœ
      if (b.rating !== a.rating) return b.rating - a.rating;
      
      // ë ˆì´íŒ…ë„ ê°™ìœ¼ë©´ ë“±ë¡ìˆœ
      const ac = a.created_at || 0;
      const bc = b.created_at || 0;
      if (ac !== bc) return ac - bc;
      
      return (a.title || "").localeCompare(b.title || "");
    });

    const q = rankQuery.toLowerCase().trim();
    let rank = 0;
    const result = [];

    for (const n of sorted) {
      rank += 1; // ì „ì—­ ìˆœìœ„

      const t = getDisplayTier(n); // ì‹¤ì œ í‹°ì–´ (S, A, B+ ...)
      if (rankTier !== "ALL" && t !== rankTier) continue;

      // ê²€ìƒ‰ìš© ë¬¸ìžì—´ êµ¬ì„± (ì œëª© / ìž‘ê°€ / íƒœê·¸ / ë©”ëª¨ / í”Œëž«í¼ / ìˆ˜ìƒ)
      const plats = (() => {
        try {
          return JSON.parse(n.platforms || "[]");
        } catch {
          return [];
        }
      })();
      const awardText = awardsToSearchText(n.awards);

      const bank = [
        n.title,
        n.author,
        n.tags,
        n.note,
        awardText,
        ...(plats || []),
      ]
        .join(" ")
        .toLowerCase();

      if (q && !bank.includes(q)) continue;

      result.push({ item: n, rank, tier: t });
    }

    return result;
  }, [list, rankQuery, rankTier]);

  // ðŸ†• ë¶„ì„ í†µê³„ (useMemoë¡œ ìºì‹±)
  const analysisStats = useMemo(() => {
    if (!list || list.length === 0) {
      return {
        total: 0,
        avg: 0,
        byTier: { S: 0, A: 0, "B+": 0, B: 0, "B-": 0, C: 0 },
        byPlat: {},
        byGenre: {},
        byStatus: {},
        // ðŸ† í‹°ì–´ ê²€í†  í†µê³„ (v2.6)
        manualTierCount: 0,     // ìˆ˜ë™ ì§€ì •ëœ ìž‘í’ˆ ìˆ˜
        forcedTierCount: 0,     // ê°•ì œ ì§€ì • (ì ìˆ˜ ë¯¸ë‹¬) ìˆ˜
        pendingReviewCount: 0,  // ê²€í†  ëŒ€ê¸° ìˆ˜
        sRatio: 0,
        aRatio: 0,
      };
    }

    const total = list.length;
    const byTier = { S: 0, A: 0, "B+": 0, B: 0, "B-": 0, C: 0 };
    const byPlat = {};
    const byGenre = {};
    const byStatus = {};
    let sum = 0;
    
    // ðŸ† í‹°ì–´ ê²€í†  ê´€ë ¨ í†µê³„
    let manualTierCount = 0;
    let forcedTierCount = 0;
    let pendingReviewCount = 0;

    for (const n of list) {
      // í‹°ì–´ë³„ (ì‹¤ì œ í‹°ì–´ ê¸°ì¤€)
      const t = getDisplayTier(n);
      byTier[t] = (byTier[t] || 0) + 1;
      sum += n.rating;
      
      // ðŸ† ìˆ˜ë™ ì§€ì • ì—¬ë¶€
      if (n.manual_tier === 'S' || n.manual_tier === 'A') {
        manualTierCount++;
        // ê°•ì œ ì§€ì • (ì ìˆ˜ ë¯¸ë‹¬ì¸ë° S/A)
        const recommended = tierFromRating(n.rating);
        if (tierRank(recommended) > tierRank(n.manual_tier)) {
          forcedTierCount++;
        }
      }
      
      // ê²€í†  ëŒ€ê¸° ì—¬ë¶€
      const reviewStatus = getReviewStatus(n);
      if (reviewStatus) pendingReviewCount++;

      // í”Œëž«í¼ë³„
      const plats = parsePlatforms(n.platforms);
      for (const p of plats) {
        byPlat[p] = (byPlat[p] || 0) + 1;
      }

      // ìž¥ë¥´ë³„
      const g = deriveMajorGenre(n.tags);
      if (g) byGenre[g] = (byGenre[g] || 0) + 1;

      // ì½ê¸° ìƒíƒœë³„
      const s = n.status || "reading";
      byStatus[s] = (byStatus[s] || 0) + 1;
    }

    return {
      total,
      avg: sum / total,
      byTier,
      byPlat,
      byGenre,
      byStatus,
      // ðŸ† í‹°ì–´ ê²€í†  í†µê³„
      manualTierCount,
      forcedTierCount,
      pendingReviewCount,
      sRatio: total > 0 ? (byTier.S / total * 100).toFixed(1) : 0,
      aRatio: total > 0 ? (byTier.A / total * 100).toFixed(1) : 0,
    };
  }, [list]);

  const toggleSelect = (id) => {
    setSelectedIds((p) => {
      const newIds = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
      return newIds;
    });
  };

  // ðŸ”§ v3.5.1: useCallbackìœ¼ë¡œ ë³€ê²½ (stale closure ë°©ì§€)
  const batchSetPlatforms = useCallback(async (plats) => {
    // ðŸ”§ v3.5.1 ë””ë²„ê¹…: ì„ íƒ ìƒíƒœ í™•ì¸
    if (!selectedIds.length) {
      Alert.alert("ì•Œë¦¼", `ë¨¼ì € ìž‘í’ˆì„ ì„ íƒí•´ì£¼ì„¸ìš”.\n\n[ë””ë²„ê·¸-í”Œëž«í¼] selectedIds.length = ${selectedIds.length}`);
      return;
    }
    const queries = selectedIds.map((id) => ({
      sql: "UPDATE novels SET platforms=? WHERE id=?",
      params: [JSON.stringify(plats), id],
    }));
    await execBatch(queries);
    await loadList();
    Alert.alert("ì™„ë£Œ", `${selectedIds.length}ê°œ ìž‘í’ˆì— í”Œëž«í¼ì„ ì ìš©í–ˆìŠµë‹ˆë‹¤.`);
  }, [selectedIds]);

  // ðŸ·ï¸ v3.1.2: ëŒ€ëŸ‰íŽ¸ì§‘ ë†ë„ ì§€ì› - ê¸°ë³¸ ë†ë„ 3ìœ¼ë¡œ íƒœê·¸ ì¶”ê°€
  // ðŸ”§ v3.5.1: useCallbackìœ¼ë¡œ ë³€ê²½ (stale closure ë°©ì§€)
  const batchAddTag = useCallback(async (t, intensity = 3) => {
    t = (t || "").trim();
    if (!t) {
      Alert.alert("ì•Œë¦¼", "íƒœê·¸ë¥¼ ìž…ë ¥í•´ì£¼ì„¸ìš”.");
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert("ì•Œë¦¼", `ë¨¼ì € ìž‘í’ˆì„ ì„ íƒí•´ì£¼ì„¸ìš”.\n\n[ë””ë²„ê·¸-íƒœê·¸ì¶”ê°€] selectedIds.length = ${selectedIds.length}`);
      return;
    }

    const placeholders = selectedIds.map(() => "?").join(",");
    const rows = await all(
      `SELECT id, tags, tag_data FROM novels WHERE id IN (${placeholders})`,
      selectedIds
    );

    const queries = [];
    for (const row of rows) {
      // 1. tags í•„ë“œ ì—…ë°ì´íŠ¸
      const tagSet = new Set(
        (row.tags || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      );
      tagSet.add(t);
      const newTags = Array.from(tagSet).join(", ");
      
      // 2. tag_data í•„ë“œ ì—…ë°ì´íŠ¸ (ë†ë„ í¬í•¨)
      let tagData = [];
      try {
        tagData = JSON.parse(row.tag_data || "[]");
        if (!Array.isArray(tagData)) tagData = [];
      } catch { tagData = []; }
      
      // ê¸°ì¡´ì— ê°™ì€ íƒœê·¸ê°€ ìžˆìœ¼ë©´ ë†ë„ë§Œ ì—…ë°ì´íŠ¸, ì—†ìœ¼ë©´ ì¶”ê°€
      const existingIdx = tagData.findIndex(td => td.tag === t);
      if (existingIdx >= 0) {
        tagData[existingIdx].intensity = intensity;
      } else {
        tagData.push({ tag: t, intensity });
      }
      
      queries.push({
        sql: "UPDATE novels SET tags=?, tag_data=? WHERE id=?",
        params: [newTags, JSON.stringify(tagData), row.id],
      });
    }

    await execBatch(queries);
    await loadList();
    Alert.alert("ì™„ë£Œ", `${selectedIds.length}ê°œ ìž‘í’ˆì— "${t}" íƒœê·¸ë¥¼ ì¶”ê°€í–ˆìŠµë‹ˆë‹¤.`);
  }, [selectedIds]);

  // ðŸ·ï¸ v3.1.2: ëŒ€ëŸ‰íŽ¸ì§‘ ë†ë„ ì§€ì› - tag_dataì—ì„œë„ ì œê±°
  // ðŸ”§ v3.5.1: useCallbackìœ¼ë¡œ ë³€ê²½ (stale closure ë°©ì§€)
  const batchRemoveTag = useCallback(async (t) => {
    t = (t || "").trim();
    if (!t) {
      Alert.alert("ì•Œë¦¼", "íƒœê·¸ë¥¼ ìž…ë ¥í•´ì£¼ì„¸ìš”.");
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert("ì•Œë¦¼", `ë¨¼ì € ìž‘í’ˆì„ ì„ íƒí•´ì£¼ì„¸ìš”.\n\n[ë””ë²„ê·¸-íƒœê·¸ì‚­ì œ] selectedIds.length = ${selectedIds.length}`);
      return;
    }

    const placeholders = selectedIds.map(() => "?").join(",");
    const rows = await all(
      `SELECT id, tags, tag_data FROM novels WHERE id IN (${placeholders})`,
      selectedIds
    );

    const queries = [];
    for (const row of rows) {
      // 1. tags í•„ë“œ ì—…ë°ì´íŠ¸
      const tagSet = new Set(
        (row.tags || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      );
      tagSet.delete(t);
      const newTags = Array.from(tagSet).join(", ");
      
      // 2. tag_data í•„ë“œ ì—…ë°ì´íŠ¸ (í•´ë‹¹ íƒœê·¸ ì œê±°)
      let tagData = [];
      try {
        tagData = JSON.parse(row.tag_data || "[]");
        if (!Array.isArray(tagData)) tagData = [];
      } catch { tagData = []; }
      
      tagData = tagData.filter(td => td.tag !== t);
      
      queries.push({
        sql: "UPDATE novels SET tags=?, tag_data=? WHERE id=?",
        params: [newTags, JSON.stringify(tagData), row.id],
      });
    }

    await execBatch(queries);
    await loadList();
    Alert.alert("ì™„ë£Œ", `${selectedIds.length}ê°œ ìž‘í’ˆì—ì„œ "${t}" íƒœê·¸ë¥¼ ì‚­ì œí–ˆìŠµë‹ˆë‹¤.`);
  }, [selectedIds]);

  // ðŸ”§ v3.5.1: useCallbackìœ¼ë¡œ ë³€ê²½ (stale closure ë°©ì§€)
  const batchIncReadCount = useCallback(async (delta) => {
    const d = Number(delta) || 0;
    if (!d) {
      Alert.alert("ì•Œë¦¼", "ì¦ê°í•  ìˆ«ìžë¥¼ ìž…ë ¥í•´ì£¼ì„¸ìš”.");
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert("ì•Œë¦¼", `ë¨¼ì € ìž‘í’ˆì„ ì„ íƒí•´ì£¼ì„¸ìš”.\n\n[ë””ë²„ê·¸-íšŒì°¨ì¦ê°] selectedIds.length = ${selectedIds.length}`);
      return;
    }
    const now = Date.now();
    const queries = selectedIds.map((id) => ({
      sql: "UPDATE novels SET read_count = MAX(0, read_count + ?), read_count_updated_at = ? WHERE id=?",
      params: [d, now, id],
    }));
    await execBatch(queries);
    await loadList();
    Alert.alert("ì™„ë£Œ", `${selectedIds.length}ê°œ ìž‘í’ˆì— ì½ì€ íšŒì°¨ ${d > 0 ? '+' : ''}${d} ì ìš©í–ˆìŠµë‹ˆë‹¤.`);
  }, [selectedIds]);

  // ðŸ†• ì½ê¸° ìƒíƒœ ì¼ê´„ ë³€ê²½
  // ðŸ”§ v3.5.1: useCallbackìœ¼ë¡œ ë³€ê²½ (stale closure ë°©ì§€)
  const batchSetStatus = useCallback(async (status) => {
    if (!selectedIds.length) {
      Alert.alert("ì•Œë¦¼", `ë¨¼ì € ìž‘í’ˆì„ ì„ íƒí•´ì£¼ì„¸ìš”.\n\n[ë””ë²„ê·¸-ì½ê¸°ìƒíƒœ] selectedIds.length = ${selectedIds.length}`);
      return;
    }
    if (!status) return;
    const queries = selectedIds.map((id) => ({
      sql: "UPDATE novels SET status=? WHERE id=?",
      params: [status, id],
    }));
    await execBatch(queries);
    await loadList();
    Alert.alert("ì™„ë£Œ", `${selectedIds.length}ê°œ ìž‘í’ˆì˜ ì½ê¸° ìƒíƒœë¥¼ ë³€ê²½í–ˆìŠµë‹ˆë‹¤.`);
  }, [selectedIds]);

  // ðŸ†• ìž‘í’ˆ ì—°ìž¬ìƒíƒœ ì¼ê´„ ë³€ê²½
  // ðŸ”§ v3.5.1: useCallbackìœ¼ë¡œ ë³€ê²½ (stale closure ë°©ì§€)
  const batchSetWorkStatus = useCallback(async (workStatus) => {
    if (!selectedIds.length) {
      Alert.alert("ì•Œë¦¼", `ë¨¼ì € ìž‘í’ˆì„ ì„ íƒí•´ì£¼ì„¸ìš”.\n\n[ë””ë²„ê·¸-ì—°ìž¬ìƒíƒœ] selectedIds.length = ${selectedIds.length}`);
      return;
    }
    if (!workStatus) return;
    const queries = selectedIds.map((id) => ({
      sql: "UPDATE novels SET work_status=? WHERE id=?",
      params: [workStatus, id],
    }));
    await execBatch(queries);
    await loadList();
    Alert.alert("ì™„ë£Œ", `${selectedIds.length}ê°œ ìž‘í’ˆì˜ ì—°ìž¬ ìƒíƒœë¥¼ ë³€ê²½í–ˆìŠµë‹ˆë‹¤.`);
  }, [selectedIds]);

  // ðŸ”§ v3.5.1: useCallbackìœ¼ë¡œ ë³€ê²½ (stale closure ë°©ì§€)
  const batchDelete = useCallback(async () => {
    if (!selectedIds.length) {
      Alert.alert("ì•Œë¦¼", `ë¨¼ì € ìž‘í’ˆì„ ì„ íƒí•´ì£¼ì„¸ìš”.\n\n[ë””ë²„ê·¸-ì‚­ì œ] selectedIds.length = ${selectedIds.length}`);
      return;
    }
    Alert.alert("í™•ì¸", `ì„ íƒ ${selectedIds.length}ê°œ ì‚­ì œ?`, [
      { text: "ì·¨ì†Œ" },
      {
        text: "ì‚­ì œ",
        style: "destructive",
        onPress: async () => {
          // ðŸ”„ v3.5.0: ìƒíƒœ ë™ê¸°í™” - ì‚­ì œ ëŒ€ìƒê³¼ ê´€ë ¨ëœ ëª¨ë“  ìƒíƒœ ì´ˆê¸°í™”
          if (pair && (selectedIds.includes(pair.A?.id) || selectedIds.includes(pair.B?.id))) {
            setPair(null);
          }
          if (editItem && selectedIds.includes(editItem.id)) {
            setEditItem(null);
            setEditOpen(false);
          }
          if (dailyReco?.novel && selectedIds.includes(dailyReco.novel.id)) {
            setDailyReco(null);
          }
          if (focusMatchNovel && selectedIds.includes(focusMatchNovel.id)) {
            setFocusMatchNovel(null);
          }
          
          const queries = [];
          for (const id of selectedIds) {
            queries.push({
              sql: "DELETE FROM matches WHERE a_id=? OR b_id=?",
              params: [id, id],
            });
            queries.push({
              sql: "DELETE FROM novels WHERE id=?",
              params: [id],
            });
          }
          await execBatch(queries);
          await rebuildAllFromMatches();
          setSelectedIds([]);
          await loadList();
        },
      },
    ]);
  }, [selectedIds, pair, editItem, dailyReco, focusMatchNovel]);
  
// ðŸ”§ ì´ˆì••ì¶• ë°±ì—… í¬ë§·(v5)
// - ë¬¸ìžì—´ í‚¤ëŠ” ìµœì†Œí™”: v, T, P, N, M
// - N: ìž‘í’ˆ ì •ë³´ (idëŠ” ë°±ì—…ì—ì„œ ì œì™¸, ë³µì› ì‹œ ìƒˆ uuid ë¶€ì—¬)
//   [ title, author, tagIdxArr, platIdxArr, note, readCount, awardsJson, totalEpisodes ]
//   â€» totalEpisodesëŠ” ìƒˆë¡œ ì¶”ê°€. ì˜ˆì „ ë°±ì—…(7ì¹¸)ë„ ê·¸ëŒ€ë¡œ ë³µì› ê°€ëŠ¥í•˜ë„ë¡ import ìª½ì—ì„œ ì•ˆì „í•˜ê²Œ ì²˜ë¦¬.
/* =========================================================
   v9 ê·¹í•œ ì••ì¶• ë°±ì—… ì‹œìŠ¤í…œ
   ========================================================= */

// ìˆœìˆ˜ JS Base64 ì¸ì½”ë”/ë””ì½”ë”
const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function encodeBase64(bytes) {
  let result = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;
    result += B64_CHARS[b1 >> 2];
    result += B64_CHARS[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < len ? B64_CHARS[((b2 & 15) << 2) | (b3 >> 6)] : "=";
    result += i + 2 < len ? B64_CHARS[b3 & 63] : "=";
  }
  return result;
}

function decodeBase64(str) {
  const bytes = [];
  const len = str.length;
  for (let i = 0; i < len; i += 4) {
    const c1 = B64_CHARS.indexOf(str[i]);
    const c2 = B64_CHARS.indexOf(str[i + 1]);
    const c3 = str[i + 2] === "=" ? 0 : B64_CHARS.indexOf(str[i + 2]);
    const c4 = str[i + 3] === "=" ? 0 : B64_CHARS.indexOf(str[i + 3]);
    bytes.push((c1 << 2) | (c2 >> 4));
    if (str[i + 2] !== "=") bytes.push(((c2 & 15) << 4) | (c3 >> 2));
    if (str[i + 3] !== "=") bytes.push(((c3 & 3) << 6) | c4);
  }
  return bytes;
}

// ìƒíƒœ ë§¤í•‘
const STATUS_MAP = { reading: 0, completed: 1, dropped: 2, planned: 3, onhold: 4 };
const STATUS_REV = ["reading", "completed", "dropped", "planned", "onhold"];
const WORK_STATUS_MAP = { ongoing: 0, completed: 1, hiatus: 2, dropped: 3, discontinued: 4 };
const WORK_STATUS_REV = ["ongoing", "completed", "hiatus", "dropped", "discontinued"];

// ê¸°ì¤€ íƒ€ìž„ìŠ¤íƒ¬í”„: 2024-01-01 00:00:00 UTC (ì´ˆ ë‹¨ìœ„)
const BASE_TIMESTAMP = 1704067200;

function buildUltraCompactBackup(novels, matches, coverImages = null) {
  // ì‚¬ì „ êµ¬ì¶•
  const tagDict = [], tagIndex = new Map();
  const platDict = [], platIndex = new Map();
  const authorDict = [], authorIndex = new Map();

  const getIdx = (dict, index, value) => {
    if (!value) return -1;
    if (index.has(value)) return index.get(value);
    const idx = dict.length;
    dict.push(value);
    index.set(value, idx);
    return idx;
  };

  // novels: ë‚´ë¶€ id â†’ ì¸ë±ìŠ¤ ë§¤í•‘
  const idToIdx = new Map();
  const N = [];

  for (let i = 0; i < novels.length; i++) {
    const n = novels[i];
    idToIdx.set(n.id, i);

    // ìž‘ê°€ ì¸ë±ìŠ¤
    const authorIdx = getIdx(authorDict, authorIndex, (n.author || "").trim());

    // íƒœê·¸ ì¸ë±ìŠ¤ ë°°ì—´
    const tagTokens = (n.tags || "").split(",").map(s => s.trim()).filter(Boolean);
    const tagIdxArr = tagTokens.map(t => getIdx(tagDict, tagIndex, t));

    // í”Œëž«í¼ ì¸ë±ìŠ¤ ë°°ì—´
    let plats = [];
    try { plats = JSON.parse(n.platforms || "[]"); } catch { plats = []; }
    if (!Array.isArray(plats)) plats = [];
    const platIdxArr = plats.map(p => getIdx(platDict, platIndex, p));

    // Elo ë°ì´í„° (ì •ìˆ˜í™”: rating*10)
    const rating10 = Math.round((Number(n.rating) || 1500) * 10);
    const rd = Math.round(Number(n.rd) || 350);
    const wins = Number(n.wins) || 0;
    const losses = Number(n.losses) || 0;
    const matchCount = Number(n.match_count) || 0;

    // ì˜µì…˜ ê°ì²´ (ê¸°ë³¸ê°’ ì•„ë‹Œ ê²ƒë§Œ) - ì´ë¯¸ì§€ëŠ” ë°±ì—…í•˜ì§€ ì•ŠìŒ
    const opt = {};
    const readCount = Number(n.read_count) || 0;
    const totalEp = Number(n.total_episodes) || 0;
    const statusNum = STATUS_MAP[n.status] ?? 0;
    const pinnedNum = n.pinned ? 1 : 0;
    const workStatusNum = WORK_STATUS_MAP[n.work_status] ?? 0;
    const awards = n.awards || "";
    const note = (n.note || "").trim();
    const link = (n.link || "").trim();
    const createdSec = Math.floor((n.created_at || Date.now()) / 1000) - BASE_TIMESTAMP;
    const updatedSec = Math.floor((n.read_count_updated_at || Date.now()) / 1000) - BASE_TIMESTAMP;

    if (readCount) opt.r = readCount;
    if (totalEp) opt.e = totalEp;
    if (statusNum) opt.s = statusNum;
    if (pinnedNum) opt.p = 1;
    if (workStatusNum) opt.w = workStatusNum;
    if (awards && awards !== "[]") opt.a = awards;
    if (note) opt.n = note;
    if (link) opt.l = link;
    if (createdSec > 0) opt.c = createdSec;
    if (updatedSec > 0) opt.u = updatedSec;
    // ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ (JSON ë°°ì—´ ë¬¸ìžì—´)
    const majorGenre = (n.major_genre || "").trim();
    const subGenre = (n.sub_genre || "").trim();
    if (majorGenre) opt.mg = majorGenre;
    if (subGenre) opt.sg = subGenre;
    // ðŸ“– ì™¸ì „ ê´€ë ¨
    const gaidenStatus = n.gaiden_status || "none";
    const gaidenReadCount = Number(n.gaiden_read_count) || 0;
    const gaidenTotalEp = Number(n.gaiden_total_episodes) || 0;
    if (gaidenStatus !== "none") opt.gs = gaidenStatus === "ongoing" ? 1 : 2; // 1=ongoing, 2=completed
    if (gaidenReadCount) opt.gr = gaidenReadCount;
    if (gaidenTotalEp) opt.ge = gaidenTotalEp;
    // ðŸ† ìˆ˜ë™ í‹°ì–´ ì§€ì • (v2.5)
    if (n.manual_tier === 'S') opt.mt = 1;
    else if (n.manual_tier === 'A') opt.mt = 2;
    
    // ðŸ“š v3.0.4: ë‹¤íšŒë… ì¹´ìš´íŠ¸ (ê¸°ë³¸ 1, 1ë³´ë‹¤ í° ê²½ìš°ì—ë§Œ ì €ìž¥)
    const rereadCount = Math.max(1, Number(n.reread_count) || 1);
    if (rereadCount > 1) opt.rr = rereadCount;
    
    // ðŸ“· í‘œì§€ ì´ë¯¸ì§€ (v3.0.4) - includeCoversê°€ trueì´ê³  ì´ë¯¸ì§€ê°€ ìžˆì„ ë•Œë§Œ
    // coverImages ë§µì—ì„œ Base64 ë˜ëŠ” URLì„ ê°€ì ¸ì˜´
    if (coverImages && coverImages[n.id]) {
      opt.i = coverImages[n.id];
    }
    
    // ðŸ·ï¸ v5.0: tag_data (JSON) - ê¸°ë³¸ê°’ì´ ì•„ë‹Œ ê²½ìš°ë§Œ
    const tagDataStr = (n.tag_data || "").trim();
    if (tagDataStr && tagDataStr !== "[]" && tagDataStr !== "") {
      opt.td = tagDataStr;
    }
    
    // ðŸ·ï¸ v5.0: aliases (JSON) - ìžˆëŠ” ê²½ìš°ë§Œ
    const aliasesStr = (n.aliases || "").trim();
    if (aliasesStr && aliasesStr !== "[]" && aliasesStr !== "") {
      opt.al = aliasesStr;
    }
    
    // ðŸ’¬ v3.2.2: ì¸ìƒê¹Šì€ ë¬¸ìž¥
    const memorableQuote = (n.memorable_quote || "").trim();
    if (memorableQuote) {
      opt.mq = memorableQuote;
    }

    // [title, authorIdx, tagIdx[], platIdx[], rating*10, rd, W, L, MC, opt?]
    const row = [n.title || "", authorIdx, tagIdxArr, platIdxArr, rating10, rd, wins, losses, matchCount];
    if (Object.keys(opt).length > 0) row.push(opt);
    N.push(row);
  }

  // ë§¤ì¹­ Base64 ì¸ì½”ë”©
  // ìž‘í’ˆ ìˆ˜ì— ë”°ë¼ ë°”ì´íŠ¸ í¬ê¸° ê²°ì •
  const novelCount = novels.length;
  const use2Bytes = novelCount >= 256;
  const matchBytes = [];

  for (const m of matches) {
    const idxA = idToIdx.has(m.a_id) ? idToIdx.get(m.a_id) : 65535;
    const idxB = idToIdx.has(m.b_id) ? idToIdx.get(m.b_id) : 65535;
    const idxW = m.winner_id && idToIdx.has(m.winner_id) ? idToIdx.get(m.winner_id) : -1;
    
    // f: 0=AìŠ¹user, 1=BìŠ¹user, 2=AìŠ¹auto, 3=BìŠ¹auto
    const isAuto = m.decided_by === "auto" ? 2 : 0;
    const isB = idxW === idxB ? 1 : 0;
    const f = isAuto + isB;

    if (use2Bytes) {
      matchBytes.push((idxA >> 8) & 255, idxA & 255);
      matchBytes.push((idxB >> 8) & 255, idxB & 255);
    } else {
      matchBytes.push(idxA & 255);
      matchBytes.push(idxB & 255);
    }
    matchBytes.push(f);
  }

  return {
    v: 11, // ðŸ“ v3.2.0: tag_coordinate_systems í¬í•¨
    b: BASE_TIMESTAMP,
    T: tagDict,
    P: platDict,
    A: authorDict,
    N,
    M: encodeBase64(matchBytes),
    m: use2Bytes ? 2 : 1, // ë°”ì´íŠ¸ ëª¨ë“œ í‘œì‹œ
  };
}

// âš™ï¸ ì„¤ì • ë° ížˆìŠ¤í† ë¦¬ë¥¼ í¬í•¨í•œ í™•ìž¥ ë°±ì—… (v2.6)
function buildExtendedBackup(novels, matches, settings, tierHist, coverImages = null, analysisData = null) {
  const base = buildUltraCompactBackup(novels, matches, coverImages);
  
  // ì„¤ì • ì¶”ê°€ (ê¸°ë³¸ê°’ ì•„ë‹Œ ê²ƒë§Œ)
  const settingsDiff = {};
  if (settings.tierThresholds) {
    const th = settings.tierThresholds;
    const def = DEFAULT_SETTINGS.tierThresholds;
    if (th.S !== def.S || th.A !== def.A || th["B+"] !== def["B+"] || th.B !== def.B || th["B-"] !== def["B-"]) {
      settingsDiff.th = th;
    }
  }
  if (settings.autoApproveEnabled) settingsDiff.aa = 1;
  if (settings.autoApproveMinWins !== DEFAULT_SETTINGS.autoApproveMinWins) settingsDiff.aw = settings.autoApproveMinWins;
  if (settings.autoApproveMaxLosses !== DEFAULT_SETTINGS.autoApproveMaxLosses) settingsDiff.al = settings.autoApproveMaxLosses;
  if (settings.autoApproveMinMatches !== DEFAULT_SETTINGS.autoApproveMinMatches) settingsDiff.am = settings.autoApproveMinMatches;
  if (settings.showReviewBanner === false) settingsDiff.rb = 0;
  if (settings.undoStackSize !== DEFAULT_SETTINGS.undoStackSize) settingsDiff.us = settings.undoStackSize;
  
  // ðŸ†• v3.4: ì˜ˆì •íƒ­ í™•ìž¥ í•„ë“œ ì„¤ì •
  if (settings.plannedFields) {
    const pf = settings.plannedFields;
    const defPf = DEFAULT_SETTINGS.plannedFields;
    const pfDiff = {};
    if (pf.showExpectedRating !== defPf.showExpectedRating) pfDiff.er = pf.showExpectedRating ? 1 : 0;
    if (pf.showScheduledStart !== defPf.showScheduledStart) pfDiff.ss = pf.showScheduledStart ? 1 : 0;
    if (pf.showSimilarNovels !== defPf.showSimilarNovels) pfDiff.sn = pf.showSimilarNovels ? 1 : 0;
    if (Object.keys(pfDiff).length > 0) settingsDiff.pf = pfDiff;
  }
  
  if (Object.keys(settingsDiff).length > 0) {
    base.S = settingsDiff;
  }
  
  // S/A ê´€ë ¨ í‹°ì–´ ížˆìŠ¤í† ë¦¬ ì¶”ê°€ (ìµœëŒ€ 30ê°œ)
  if (tierHist && tierHist.length > 0) {
    const saHist = tierHist.filter(h => 
      h.from === 'S' || h.from === 'A' || h.to === 'S' || h.to === 'A'
    ).slice(0, 30).map(h => ({
      t: h.title,
      f: h.from,
      o: h.to,
      a: Math.floor(h.at / 1000) - BASE_TIMESTAMP
    }));
    if (saHist.length > 0) {
      base.H = saHist;
    }
  }
  
  // ðŸŽ¯ v3.0.4: ë¶„ì„ ë°ì´í„° í¬í•¨
  if (analysisData) {
    const AD = {};
    
    // ë§¤ì¹­ ì¸ì‚¬ì´íŠ¸ (ìµœê·¼ 100ê°œë§Œ)
    if (analysisData.matchInsights && analysisData.matchInsights.length > 0) {
      AD.mi = analysisData.matchInsights.slice(-100);
    }
    
    // ì´ë³€ ìš”ì¸
    if (analysisData.upsetFactors && analysisData.upsetFactors.factors && analysisData.upsetFactors.factors.length > 0) {
      AD.uf = analysisData.upsetFactors;
    }
    
    // íƒœê·¸ ê´€ê³„
    if (analysisData.tagRelations && Object.keys(analysisData.tagRelations.groups || {}).length > 0) {
      AD.tr = analysisData.tagRelations;
    }
    
    // ìžë™ìŠ¹íŒ¨ ì„¤ì •
    if (analysisData.autoMatchSettings) {
      AD.am = analysisData.autoMatchSettings;
    }
    
    // ðŸ“ v3.2.0: íƒœê·¸ ì¢Œí‘œê³„
    if (analysisData.coordinateSystems && Object.keys(analysisData.coordinateSystems).length > 0) {
      AD.cs = analysisData.coordinateSystems;
    }
    
    if (Object.keys(AD).length > 0) {
      base.AD = AD;
    }
  }
  
  return base;
}

/* ---------- JSON ë°±ì—…/ë³µì› ---------- */

// ðŸ“· URL ì´ë¯¸ì§€ë§Œ ë°±ì—…ìš©ìœ¼ë¡œ ë°˜í™˜ (ë¡œì»¬ ì´ë¯¸ì§€, Base64 ì œì™¸)
function getExportableImageUrl(uri) {
  if (!uri) return null;
  
  // URLì¸ ê²½ìš°ë§Œ ë°˜í™˜
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }
  
  // Base64ëŠ” ìš©ëŸ‰ì´ ì»¤ì„œ ë°±ì—…ì—ì„œ ì œì™¸
  // ë¡œì»¬ íŒŒì¼ë„ ë°±ì—… ë¶ˆê°€ (Expo Snackì—ì„œ FileSystem ë¯¸ì§€ì›)
  return null;
}

// ðŸ“· URL í‘œì§€ ì´ë¯¸ì§€ë“¤ ìˆ˜ì§‘ (ë°±ì—…ìš©)
function collectCoverImageUrls(novels) {
  const coverImages = {};
  
  for (const n of novels) {
    if (!n.cover_image) continue;
    
    const url = getExportableImageUrl(n.cover_image);
    if (url) {
      coverImages[n.id] = url;
    }
  }
  
  return coverImages;
}

async function exportJSON() {
  try {
    setIsLoading(true);
    
    // DB ì—°ê²° í™•ì¸
    await openDb();
    
    const novels = await all("SELECT * FROM novels;");
    const matches = await all(
      "SELECT * FROM matches ORDER BY created_at ASC;"
    );
    
    // ðŸ“‹ v3.3.0: ì˜ˆì • ìž‘í’ˆ ë¡œë“œ
    const plannedNovels = await all("SELECT * FROM planned_novels;");

    // ðŸ“· URL í‘œì§€ ì´ë¯¸ì§€ ìžë™ ìˆ˜ì§‘ (ë¡œì»¬ ì´ë¯¸ì§€ëŠ” ì œì™¸)
    const coverImages = collectCoverImageUrls(novels);
    const coverCount = Object.keys(coverImages).length;
    
    // ðŸŽ¯ v3.0.4: ë¶„ì„ ë°ì´í„° ìˆ˜ì§‘
    const analysisData = {
      matchInsights,
      upsetFactors,
      tagRelations,
      autoMatchSettings,
      coordinateSystems, // ðŸ“ v3.2.0: íƒœê·¸ ì¢Œí‘œê³„
    };

    // âš™ï¸ í™•ìž¥ ë°±ì—…: ì„¤ì • + ížˆìŠ¤í† ë¦¬ + í‘œì§€ + ë¶„ì„ë°ì´í„° í¬í•¨ (v3.0.4)
    const payload = buildExtendedBackup(novels, matches, appSettings, tierHistory, coverCount > 0 ? coverImages : null, analysisData);
    
    // ðŸ“· í‘œì§€ í¬í•¨ ì—¬ë¶€ í‘œì‹œ
    if (coverCount > 0) {
      payload.hasCovers = 1;
      payload.coverCount = coverCount;
    }
    
    // ðŸŽ¯ ë¶„ì„ ë°ì´í„° í¬í•¨ ì—¬ë¶€ í‘œì‹œ
    if (payload.AD) {
      payload.hasAnalysis = 1;
    }
    
    // ðŸ”— v3.0.4: ì»¤ìŠ¤í…€ ì¡°í•© ìš”ì†Œ ë°±ì—…
    if (customComboTraits.length > 0 || customComboTargets.length > 0) {
      payload.CE = {}; // Combo Elements
      if (customComboTraits.length > 0) payload.CE.t = customComboTraits;
      if (customComboTargets.length > 0) payload.CE.g = customComboTargets;
    }
    
    // ðŸ†• v3.2.1: íƒœê·¸ ë©”íƒ€ë°ì´í„° ë°±ì—… (TM = Tag Metadata)
    const tagMeta = {};
    if (Object.keys(tagSentiments).length > 0) tagMeta.ts = tagSentiments; // tag sentiments
    if (Object.keys(tagAttributes).length > 0) tagMeta.ta = tagAttributes; // ðŸ†• v3.4: tag attributes (ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´)
    if (hiddenTags.length > 0) tagMeta.ht = hiddenTags; // hidden tags
    if (pinnedTags.length > 0) tagMeta.pt = pinnedTags; // pinned tags
    if (userMajorGenres.length > 0) tagMeta.umg = userMajorGenres; // user major genres
    if (userSubGenres.length > 0) tagMeta.usg = userSubGenres; // user sub genres
    if (customTags.length > 0) tagMeta.ct = customTags; // custom tags
    if (comboTags.length > 0) tagMeta.cbt = comboTags; // combo tags
    
    if (Object.keys(tagMeta).length > 0) {
      payload.TM = tagMeta;
    }
    
    // ðŸ“‹ v3.3.0: ì˜ˆì • ìž‘í’ˆ ë°±ì—… (PL = Planned List)
    // ðŸ†• v3.4: í™•ìž¥ í•„ë“œ ì¶”ê°€
    if (plannedNovels && plannedNovels.length > 0) {
      payload.PL = plannedNovels.map(p => ({
        t: p.title,
        a: p.author || "",
        tg: p.tags || "",
        pl: p.platforms || "[]",
        n: p.note || "",
        te: Number(p.total_episodes) || 0,
        ci: p.cover_image || "",
        lk: p.link || "",
        ws: p.work_status || "ongoing",
        mg: p.major_genre || "",
        sg: p.sub_genre || "",
        pr: Number(p.priority) || 3,
        ca: Math.floor((p.created_at || Date.now()) / 1000) - BASE_TIMESTAMP,
        // ðŸ†• v3.4: ìƒˆ í•„ë“œë“¤
        er: Number(p.expected_rating) || 1500,
        et: p.expected_tier || "",
        il: Number(p.interest_level) || 3,
        ds: p.discovery_source || "",
        fc: p.first_chapter_read ? 1 : 0,
        ss: p.scheduled_start_date ? Math.floor(p.scheduled_start_date / 1000) - BASE_TIMESTAMP : 0,
        sn: p.similar_novels || "",
        wi: p.why_interested || "",
      }));
    }
    
    const json = JSON.stringify(payload);
    
    // ëŒ€ëžµì ì¸ í¬ê¸° ê³„ì‚°
    const sizeKB = Math.round(json.length / 1024);
    const sizeText = sizeKB > 1024 
      ? `${(sizeKB / 1024).toFixed(1)}MB` 
      : `${sizeKB}KB`;

    const coverInfo = coverCount > 0 ? `, í‘œì§€ ${coverCount}ê°œ` : "";
    const analysisInfo = payload.AD ? ", ë¶„ì„ ë°ì´í„°" : "";
    const tagMetaInfo = payload.TM ? ", íƒœê·¸ ì„¤ì •" : "";
    const plannedInfo = payload.PL ? `, ì˜ˆì • ${payload.PL.length}ê°œ` : "";
    const summary = `${novels.length}ìž‘í’ˆ, ${matches.length}ë§¤ì¹˜${plannedInfo}${coverInfo}${analysisInfo}${tagMetaInfo}\ní¬ê¸°: ${sizeText}`;
    
    setIsLoading(false);
    
    // ðŸ”§ v3.0.6: í¬ê¸°ì— ë”°ë¼ ì²˜ë¦¬ ë°©ì‹ ê²°ì •
    // ì „ì²´ JSONì€ refì— ì €ìž¥ (ê³µìœ ìš©)
    exportFullJsonRef.current = json;
    
    if (sizeKB < 500) {
      // 500KB ë¯¸ë§Œ: ê³µìœ  ì‹œë„
      try {
        await Share.share({
          title: "ì›¹ì†Œì„¤ í‹°ì–´ ë°±ì—…(v11)",
          message: json,
        });
      } catch (shareErr) {
        // ê³µìœ  ì‹¤íŒ¨ì‹œ ëª¨ë‹¬ë¡œ í‘œì‹œ
        setExportText(json.length > 30000 ? json.substring(0, 30000) + "\n\n... (ì¼ë¶€ë§Œ í‘œì‹œ)" : json);
        setExportInfo(summary);
        setExportOpen(true);
      }
    } else {
      // 500KB ì´ìƒ: ëª¨ë‹¬ë¡œ í‘œì‹œ (ì¼ë¶€ë§Œ)
      const preview = json.substring(0, 30000) + "\n\n... (ë°ì´í„°ê°€ ë„ˆë¬´ ì»¤ì„œ ì¼ë¶€ë§Œ í‘œì‹œë¨)";
      setExportText(preview);
      setExportInfo(summary + "\n\nâš ï¸ ë°ì´í„°ê°€ ì»¤ì„œ ì¼ë¶€ë§Œ í‘œì‹œë©ë‹ˆë‹¤.\nê³µìœ  ë²„íŠ¼ìœ¼ë¡œ ì „ì²´ ë°ì´í„°ë¥¼ ë‚´ë³´ë‚´ì„¸ìš”.");
      setExportOpen(true);
    }
    
  } catch (e) {
    setIsLoading(false);
    console.warn("exportJSON error:", e);
    Alert.alert("ì˜¤ë¥˜", "ë°±ì—… ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤.\n\n" + e.message);
  }
}


/** JSON ë°ì´í„° ê²€ì¦ í•¨ìˆ˜ (ìˆœìˆ˜ í•¨ìˆ˜) */
function validateImportData(text) {
  const result = {
    valid: false,
    version: null,
    format: null,
    novelCount: 0,
    matchCount: 0,
    plannedCount: 0, // ðŸ“‹ v3.3.0: ì˜ˆì • ìž‘í’ˆ ê°œìˆ˜
    warnings: [],
    errors: [],
    features: {
      hasElo: false,
      hasAuthorDict: false,
      hasTimestamps: false,
      hasStatus: false,
      hasWorkStatus: false,
      hasCoverImage: false,
      hasLink: false,
      hasPinned: false,
      hasAnalysis: false, // ðŸŽ¯ v3.0.4
      hasTierHistory: false,
      hasSettings: false,
      hasPlannedNovels: false, // ðŸ“‹ v3.3.0
    },
    summary: "",
  };

  if (!text || !text.trim()) {
    result.errors.push("JSON ë°ì´í„°ê°€ ë¹„ì–´ìžˆìŠµë‹ˆë‹¤.");
    return result;
  }

  let data;
  try {
    data = JSON.parse(text.trim());
  } catch (e) {
    result.errors.push("JSON íŒŒì‹± ì‹¤íŒ¨: " + e.message);
    return result;
  }

  // v9/v10/v11 ê·¹í•œ ì••ì¶• í¬ë§· (v10: tag_data, aliases / v11: ì¢Œí‘œê³„ í¬í•¨)
  if (data && [9, 10, 11].includes(data.v) && Array.isArray(data.N) && typeof data.M === "string") {
    result.valid = true;
    result.version = data.v;
    result.format = data.v === 11 ? "v11 ê·¹í•œ ì••ì¶• (ì¢Œí‘œê³„ í¬í•¨)" 
                  : data.v === 10 ? "v10 ê·¹í•œ ì••ì¶• (íƒœê·¸ v5.0)" 
                  : "v9 ê·¹í•œ ì••ì¶•";
    result.novelCount = data.N.length;
    
    const byteMode = data.m || 1;
    const matchBytes = decodeBase64(data.M);
    const bytesPerMatch = byteMode === 2 ? 5 : 3;
    result.matchCount = Math.floor(matchBytes.length / bytesPerMatch);

    result.features.hasElo = true;
    result.features.hasAuthorDict = Array.isArray(data.A) && data.A.length > 0;
    result.features.hasTimestamps = true;
    result.features.hasStatus = true;
    result.features.hasWorkStatus = true;
    result.features.hasLink = true;
    result.features.hasPinned = true;
    
    // ðŸ“· í‘œì§€ ì´ë¯¸ì§€ í™•ì¸ (v3.0.4)
    if (data.hasCovers || data.coverCount > 0) {
      result.features.hasCoverImage = true;
    } else {
      // opt.iê°€ ìžˆëŠ” ìž‘í’ˆì´ ìžˆëŠ”ì§€ í™•ì¸
      const hasCoverInData = data.N.some(row => {
        const opt = (row.length > 9 && typeof row[9] === "object") ? row[9] : {};
        return opt.i && opt.i.length > 0;
      });
      result.features.hasCoverImage = hasCoverInData;
    }
    
    // ðŸŽ¯ ë¶„ì„ ë°ì´í„° í™•ì¸ (v3.0.4)
    if (data.AD && typeof data.AD === "object") {
      result.features.hasAnalysis = true;
    }
    
    // ì„¤ì •/ížˆìŠ¤í† ë¦¬ í™•ì¸
    result.features.hasSettings = data.S && typeof data.S === "object";
    result.features.hasTierHistory = data.H && Array.isArray(data.H) && data.H.length > 0;

    // ðŸ“‹ v3.3.0: ì˜ˆì • ìž‘í’ˆ í™•ì¸
    if (Array.isArray(data.PL) && data.PL.length > 0) {
      result.features.hasPlannedNovels = true;
      result.plannedCount = data.PL.length;
    }

    // ìš”ì•½ ìƒì„±
    const extras = [];
    if (result.features.hasCoverImage) extras.push("í‘œì§€ ì´ë¯¸ì§€");
    if (result.features.hasAnalysis) extras.push("ë¶„ì„ ë°ì´í„°");
    if (result.features.hasSettings) extras.push("ì„¤ì •");
    if (result.features.hasTierHistory) extras.push(`í‹°ì–´ ížˆìŠ¤í† ë¦¬ ${data.H.length}ê±´`);
    if (result.features.hasPlannedNovels) extras.push(`ì˜ˆì • ìž‘í’ˆ ${result.plannedCount}ê°œ`);
    
    result.summary = `âœ… v${data.v} í¬ë§·\nâ€¢ Elo ë°ì´í„° ì™„ì „ ë³µì›\nâ€¢ ìž¬ê³„ì‚° ë¶ˆí•„ìš”`;
    if (extras.length > 0) {
      result.summary += `\nâ€¢ í¬í•¨: ${extras.join(", ")}`;
    }
    if (!result.features.hasCoverImage) {
      result.warnings.push("â„¹ï¸ í‘œì§€ ì´ë¯¸ì§€ ì—†ìŒ");
    }
    return result;
  }

  // êµ¬ë²„ì „ ê°ì§€ (ì§€ì› ì¤‘ë‹¨)
  if (data && [5, 6, 7, 8].includes(data.v) && Array.isArray(data.N)) {
    result.errors.push(`v${data.v} í¬ë§·ì€ ë” ì´ìƒ ì§€ì›ë˜ì§€ ì•ŠìŠµë‹ˆë‹¤.\nìµœì‹  ì•±ì—ì„œ v9ë¡œ ë‹¤ì‹œ ë‚´ë³´ë‚´ê¸° í•´ì£¼ì„¸ìš”.`);
    return result;
  }

  if (data && data.novels && Array.isArray(data.novels)) {
    result.errors.push("ë ˆê±°ì‹œ í¬ë§·ì€ ë” ì´ìƒ ì§€ì›ë˜ì§€ ì•ŠìŠµë‹ˆë‹¤.\nìµœì‹  ì•±ì—ì„œ v9ë¡œ ë‹¤ì‹œ ë‚´ë³´ë‚´ê¸° í•´ì£¼ì„¸ìš”.");
    return result;
  }

  result.errors.push("ì§€ì›í•˜ì§€ ì•ŠëŠ” ë°±ì—… í˜•ì‹ìž…ë‹ˆë‹¤.\nv9~v11 í˜•ì‹ë§Œ ì§€ì›ë©ë‹ˆë‹¤.");
  return result;
}

async function importJSON() {
  try {
    const text = importText.trim();
    if (!text) {
      Alert.alert("ì˜¤ë¥˜", "JSON ë°ì´í„°ë¥¼ ìž…ë ¥í•´ì£¼ì„¸ìš”.");
      return;
    }

    // ê²€ì¦ ì•ˆ í–ˆìœ¼ë©´ ë¨¼ì € ê²€ì¦
    if (!importValidation || !importValidation.valid) {
      Alert.alert("ì•Œë¦¼", "ë¨¼ì € 'ë°ì´í„° ê²€ì¦' ë²„íŠ¼ì„ ëˆŒëŸ¬ ê²€ì¦í•´ì£¼ì„¸ìš”.");
      return;
    }

    const data = JSON.parse(text);

    const doClearAll = async () => {
      await execBatch([
        { sql: "DELETE FROM novels;", params: [] },
        { sql: "DELETE FROM matches;", params: [] },
      ]);
    };

    // -------------------------------
    // âžŠ v9/v10/v11 ê·¹í•œ ì••ì¶• í¬ë§· (v10: tag_data, aliases / v11: ì¢Œí‘œê³„ í¬í•¨)
    // -------------------------------
    if (data && [9, 10, 11].includes(data.v) && Array.isArray(data.N) && typeof data.M === "string") {
      const tagDict = Array.isArray(data.T) ? data.T : [];
      const platDict = Array.isArray(data.P) ? data.P : [];
      const authorDict = Array.isArray(data.A) ? data.A : [];
      const baseTs = data.b || BASE_TIMESTAMP;
      const byteMode = data.m || 1; // 1=1ë°”ì´íŠ¸, 2=2ë°”ì´íŠ¸
      const Nrows = data.N;

      // ë§¤ì¹­ ë””ì½”ë”©
      const matchBytes = decodeBase64(data.M);
      const bytesPerMatch = byteMode === 2 ? 5 : 3;
      const lenM = Math.floor(matchBytes.length / bytesPerMatch);
      const lenN = Nrows.length;

      Alert.alert(
        "ìµœì¢… í™•ì¸",
        `${lenN}ê°œ ìž‘í’ˆê³¼ ${lenM}ê°œ ëŒ€ì§„ ê¸°ë¡ì„ ê°€ì ¸ì˜µë‹ˆë‹¤.\n\nâš ï¸ ê¸°ì¡´ ë°ì´í„°ëŠ” ëª¨ë‘ ì‚­ì œë©ë‹ˆë‹¤!`,
        [
          { text: "ì·¨ì†Œ" },
          {
            text: "ê°€ì ¸ì˜¤ê¸°",
            onPress: async () => {
              setIsLoading(true);
              await doClearAll();

              const novelQueries = [];
              const idList = [];
              const defaultDate = Date.now();

              for (let i = 0; i < lenN; i++) {
                const row = Nrows[i] || [];
                const title = row[0] || "";
                const authorIdx = typeof row[1] === "number" ? row[1] : -1;
                const author = authorIdx >= 0 && authorIdx < authorDict.length ? authorDict[authorIdx] : "";
                const tagIdxArr = Array.isArray(row[2]) ? row[2] : [];
                const platIdxArr = Array.isArray(row[3]) ? row[3] : [];
                
                // Elo ë°ì´í„° ë³µì›
                const rating = (Number(row[4]) || 15000) / 10;
                const rd = Number(row[5]) || 350;
                const wins = Number(row[6]) || 0;
                const losses = Number(row[7]) || 0;
                const matchCount = Number(row[8]) || 0;

                // ì˜µì…˜ ê°ì²´
                const opt = (row.length > 9 && typeof row[9] === "object") ? row[9] : {};
                const readCount = opt.r || 0;
                const totalEpisodes = opt.e || 0;
                const status = STATUS_REV[opt.s || 0] || "reading";
                const pinned = opt.p || 0;
                const workStatus = WORK_STATUS_REV[opt.w || 0] || "ongoing";
                const awards = opt.a || "";
                const note = opt.n || "";
                const link = opt.l || "";
                const coverImage = opt.i || "";
                const createdAt = opt.c ? (baseTs + opt.c) * 1000 : defaultDate;
                const readCountUpdatedAt = opt.u ? (baseTs + opt.u) * 1000 : defaultDate;
                // ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´
                const majorGenre = opt.mg || "";
                const subGenre = opt.sg || "";
                // ðŸ“– ì™¸ì „ ê´€ë ¨
                const gaidenStatus = opt.gs === 1 ? "ongoing" : (opt.gs === 2 ? "completed" : "none");
                const gaidenReadCount = opt.gr || 0;
                const gaidenTotalEpisodes = opt.ge || 0;
                // ðŸ† ìˆ˜ë™ í‹°ì–´ ì§€ì • (v2.5)
                const manualTier = opt.mt === 1 ? 'S' : (opt.mt === 2 ? 'A' : null);
                // ðŸ“š v3.0.4: ë‹¤íšŒë… ì¹´ìš´íŠ¸
                const rereadCount = Math.max(1, opt.rr || 1);
                // ðŸ·ï¸ v5.0: tag_data, aliases
                const tagData = opt.td || "";
                const aliases = opt.al || "";
                // ðŸ’¬ v3.2.2: ì¸ìƒê¹Šì€ ë¬¸ìž¥
                const memorableQuote = opt.mq || "";

                const tags = tagIdxArr
                  .map(idx => (typeof idx === "number" && idx >= 0 && idx < tagDict.length) ? tagDict[idx] : "")
                  .filter(Boolean).join(", ");
                const platsArr = platIdxArr
                  .map(idx => (typeof idx === "number" && idx >= 0 && idx < platDict.length) ? platDict[idx] : "")
                  .filter(Boolean);
                const platforms = JSON.stringify(platsArr);

                const id = uuid();
                idList.push(id);

                novelQueries.push({
                  sql: `INSERT INTO novels (id,title,author,tags,platforms,note,read_count,rating,rd,wins,losses,match_count,tier,created_at,awards,total_episodes,status,pinned,cover_image,link,work_status,read_count_updated_at,major_genre,sub_genre,gaiden_status,gaiden_read_count,gaiden_total_episodes,manual_tier,reread_count,tag_data,aliases,memorable_quote)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
                  params: [id, title, author, tags, platforms, note, readCount, rating, rd, wins, losses, matchCount, tierFromRating(rating), createdAt, awards, totalEpisodes, status, pinned, coverImage, link, workStatus, readCountUpdatedAt, majorGenre, subGenre, gaidenStatus, gaidenReadCount, gaidenTotalEpisodes, manualTier, rereadCount, tagData, aliases, memorableQuote],
                });
              }

              if (novelQueries.length > 0) await execBatch(novelQueries);

              // ë§¤ì¹­ ë³µì›
              const matchQueries = [];
              const baseTime = Date.now();

              for (let i = 0; i < lenM; i++) {
                const offset = i * bytesPerMatch;
                let idxA, idxB, f;
                if (byteMode === 2) {
                  idxA = (matchBytes[offset] << 8) | matchBytes[offset + 1];
                  idxB = (matchBytes[offset + 2] << 8) | matchBytes[offset + 3];
                  f = matchBytes[offset + 4];
                } else {
                  idxA = matchBytes[offset];
                  idxB = matchBytes[offset + 1];
                  f = matchBytes[offset + 2];
                }

                const a_id = idxA < idList.length ? idList[idxA] : null;
                const b_id = idxB < idList.length ? idList[idxB] : null;
                if (!a_id || !b_id) continue;

                // f: 0=AìŠ¹user, 1=BìŠ¹user, 2=AìŠ¹auto, 3=BìŠ¹auto
                const winner_id = (f & 1) ? b_id : a_id;
                const decided_by = (f & 2) ? "auto" : "user";

                matchQueries.push({
                  sql: `INSERT INTO matches (id,a_id,b_id,winner_id,decided_by,gap_when_matched,k_factor_used,created_at) VALUES (?,?,?,?,?,?,?,?);`,
                  params: [uuid(), a_id, b_id, winner_id, decided_by, 0, 24, baseTime + i],
                });
              }

              if (matchQueries.length > 0) await execBatch(matchQueries);

              // âš™ï¸ ì„¤ì • ë³µì› (v2.6)
              if (data.S && typeof data.S === "object") {
                const s = data.S;
                const restored = { ...DEFAULT_SETTINGS };
                if (s.th) restored.tierThresholds = { ...DEFAULT_SETTINGS.tierThresholds, ...s.th };
                if (s.aa) restored.autoApproveEnabled = true;
                if (s.aw !== undefined) restored.autoApproveMinWins = s.aw;
                if (s.al !== undefined) restored.autoApproveMaxLosses = s.al;
                if (s.am !== undefined) restored.autoApproveMinMatches = s.am;
                if (s.rb === 0) restored.showReviewBanner = false;
                if (s.us !== undefined) restored.undoStackSize = s.us;
                
                // ðŸ†• v3.4: ì˜ˆì •íƒ­ í™•ìž¥ í•„ë“œ ì„¤ì • ë³µì›
                if (s.pf && typeof s.pf === "object") {
                  restored.plannedFields = { ...DEFAULT_SETTINGS.plannedFields };
                  if (s.pf.er !== undefined) restored.plannedFields.showExpectedRating = s.pf.er === 1;
                  if (s.pf.ss !== undefined) restored.plannedFields.showScheduledStart = s.pf.ss === 1;
                  if (s.pf.sn !== undefined) restored.plannedFields.showSimilarNovels = s.pf.sn === 1;
                }
                
                setAppSettings(restored);
                await setAppMeta("app_settings", restored);
                if (restored.tierThresholds) {
                  globalTierThresholds = { ...globalTierThresholds, ...restored.tierThresholds };
                }
              }
              
              // ðŸ† í‹°ì–´ ížˆìŠ¤í† ë¦¬ ë³µì› (v2.6)
              if (data.H && Array.isArray(data.H)) {
                const restoredHist = data.H.map(h => ({
                  id: null, // ìž‘í’ˆ IDëŠ” ë³µì› ë¶ˆê°€ (ìƒˆ ID ë¶€ì—¬ë¨)
                  title: h.t || "",
                  from: h.f || "",
                  to: h.o || "",
                  at: h.a ? (baseTs + h.a) * 1000 : Date.now()
                })).filter(h => h.title && (h.from || h.to));
                
                setTierHistory(restoredHist);
                await setAppMeta("tier_history", restoredHist);
              }
              
              // ðŸŽ¯ v3.0.4: ë¶„ì„ ë°ì´í„° ë³µì›
              let analysisRestored = false;
              if (data.AD && typeof data.AD === "object") {
                // ë§¤ì¹­ ì¸ì‚¬ì´íŠ¸
                if (data.AD.mi && Array.isArray(data.AD.mi)) {
                  setMatchInsights(data.AD.mi);
                  await setAppMeta("match_insights", data.AD.mi);
                  analysisRestored = true;
                }
                
                // ì´ë³€ ìš”ì¸
                if (data.AD.uf && typeof data.AD.uf === "object") {
                  setUpsetFactors(data.AD.uf);
                  await setAppMeta("upset_factors", data.AD.uf);
                  analysisRestored = true;
                }
                
                // íƒœê·¸ ê´€ê³„
                if (data.AD.tr && typeof data.AD.tr === "object") {
                  setTagRelations(data.AD.tr);
                  await setAppMeta("tag_relations", data.AD.tr);
                  analysisRestored = true;
                }
                
                // ìžë™ìŠ¹íŒ¨ ì„¤ì •
                if (data.AD.am && typeof data.AD.am === "object") {
                  setAutoMatchSettings(data.AD.am);
                  await setAppMeta("auto_match_settings", data.AD.am);
                  analysisRestored = true;
                }
                
                // ðŸ“ v3.2.0: íƒœê·¸ ì¢Œí‘œê³„ ë³µì›
                if (data.AD.cs && typeof data.AD.cs === "object") {
                  setCoordinateSystems(data.AD.cs);
                  await setAppMeta("tag_coordinate_systems", data.AD.cs);
                  analysisRestored = true;
                }
              }
              
              // ðŸ”— v3.0.4: ì»¤ìŠ¤í…€ ì¡°í•© ìš”ì†Œ ë³µì›
              let comboElementsRestored = false;
              if (data.CE && typeof data.CE === "object") {
                if (Array.isArray(data.CE.t) && data.CE.t.length > 0) {
                  setCustomComboTraits(data.CE.t);
                  await setAppMeta("custom_combo_traits", data.CE.t);
                  comboElementsRestored = true;
                }
                if (Array.isArray(data.CE.g) && data.CE.g.length > 0) {
                  setCustomComboTargets(data.CE.g);
                  await setAppMeta("custom_combo_targets", data.CE.g);
                  comboElementsRestored = true;
                }
              }
              
              // ðŸ†• v3.2.1: íƒœê·¸ ë©”íƒ€ë°ì´í„° ë³µì›
              let tagMetaRestored = false;
              if (data.TM && typeof data.TM === "object") {
                // íƒœê·¸ ê°ì •
                if (data.TM.ts && typeof data.TM.ts === "object") {
                  setTagSentiments(data.TM.ts);
                  await setAppMeta("tag_sentiments", data.TM.ts);
                  tagMetaRestored = true;
                }
                // ðŸ†• v3.4: íƒœê·¸ ì†ì„± (ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´)
                if (data.TM.ta && typeof data.TM.ta === "object") {
                  setTagAttributes(data.TM.ta);
                  await setAppMeta("tag_attributes", data.TM.ta);
                  tagMetaRestored = true;
                }
                // ìˆ¨ê¹€ íƒœê·¸
                if (Array.isArray(data.TM.ht)) {
                  setHiddenTags(data.TM.ht);
                  await setAppMeta("hidden_tags", data.TM.ht);
                  tagMetaRestored = true;
                }
                // ê³ ì • íƒœê·¸
                if (Array.isArray(data.TM.pt)) {
                  setPinnedTags(data.TM.pt);
                  await setAppMeta("pinned_tags", data.TM.pt);
                  tagMetaRestored = true;
                }
                // ì‚¬ìš©ìž ëŒ€ìž¥ë¥´
                if (Array.isArray(data.TM.umg)) {
                  setUserMajorGenres(data.TM.umg);
                  await setAppMeta("user_major_genres", data.TM.umg);
                  tagMetaRestored = true;
                }
                // ì‚¬ìš©ìž ë¶€ìž¥ë¥´
                if (Array.isArray(data.TM.usg)) {
                  setUserSubGenres(data.TM.usg);
                  await setAppMeta("user_sub_genres", data.TM.usg);
                  tagMetaRestored = true;
                }
                // ì»¤ìŠ¤í…€ íƒœê·¸
                if (Array.isArray(data.TM.ct)) {
                  setCustomTags(data.TM.ct);
                  await setAppMeta("custom_tags", data.TM.ct);
                  tagMetaRestored = true;
                }
                // ì¡°í•©ì‹ íƒœê·¸
                if (Array.isArray(data.TM.cbt)) {
                  setComboTags(data.TM.cbt);
                  await setAppMeta("combo_tags", data.TM.cbt);
                  tagMetaRestored = true;
                }
              }

              // ðŸ“‹ v3.3.0: ì˜ˆì • ìž‘í’ˆ ë³µì›
              // ðŸ†• v3.4: í™•ìž¥ í•„ë“œ ì§€ì›
              let plannedRestored = false;
              if (Array.isArray(data.PL) && data.PL.length > 0) {
                // ê¸°ì¡´ ì˜ˆì • ìž‘í’ˆ ì‚­ì œ
                await exec("DELETE FROM planned_novels;");
                
                const plannedQueries = data.PL.map(p => ({
                  sql: `INSERT INTO planned_novels 
                    (id, title, author, tags, platforms, note, total_episodes, cover_image, link, work_status, major_genre, sub_genre, priority, created_at, expected_rating, expected_tier, interest_level, discovery_source, first_chapter_read, scheduled_start_date, similar_novels, why_interested)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
                  params: [
                    uuid(),
                    p.t || "",
                    p.a || "",
                    p.tg || "",
                    p.pl || "[]",
                    p.n || "",
                    Number(p.te) || 0,
                    p.ci || "",
                    p.lk || "",
                    p.ws || "ongoing",
                    p.mg || "",
                    p.sg || "",
                    Number(p.pr) || 3,
                    p.ca ? (baseTs + p.ca) * 1000 : Date.now(),
                    // ðŸ†• v3.4: ìƒˆ í•„ë“œë“¤ (ì—†ìœ¼ë©´ ê¸°ë³¸ê°’)
                    Number(p.er) || 1500,
                    p.et || "",
                    Number(p.il) || 3,
                    p.ds || "",
                    p.fc ? 1 : 0,
                    p.ss ? (baseTs + p.ss) * 1000 : 0,
                    p.sn || "",
                    p.wi || "",
                  ],
                }));
                
                await execBatch(plannedQueries);
                plannedRestored = true;
                await loadPlannedList();
              }

              // v9ëŠ” Elo ë°ì´í„° í¬í•¨ â†’ ìž¬ê³„ì‚° ë¶ˆí•„ìš”!
              await loadList();
              
              // ðŸ”„ v3.5.0: ê´€ë ¨ ìƒíƒœ ì´ˆê¸°í™” (ì´ì „ ë°ì´í„° ì°¸ì¡° ë°©ì§€)
              setPair(null);
              setEditItem(null);
              setEditOpen(false);
              setDailyReco(null);
              setFocusMatchNovel(null);
              setMatchAnalysis(null);
              setMatchPrediction(null);
              setSelectedIds([]);
              setLastMatchId(null);
              
              setImportOpen(false);
              setImportText("");
              setImportValidation(null);
              setIsLoading(false);
              
              const extraInfo = data.S ? "\n(ì„¤ì • ë³µì›ë¨)" : "";
              const histInfo = data.H ? `\n(í‹°ì–´ ížˆìŠ¤í† ë¦¬ ${data.H.length}ê±´ ë³µì›)` : "";
              const analysisInfo = analysisRestored ? "\n(ë¶„ì„ ë°ì´í„° ë³µì›ë¨)" : "";
              const comboInfo = comboElementsRestored ? "\n(ì¡°í•© ìš”ì†Œ ë³µì›ë¨)" : "";
              const tagMetaInfo = tagMetaRestored ? "\n(íƒœê·¸ ì„¤ì • ë³µì›ë¨)" : "";
              const plannedInfo = plannedRestored ? `\n(ì˜ˆì • ìž‘í’ˆ ${data.PL.length}ê°œ ë³µì›)` : "";
              Alert.alert("ì™„ë£Œ", `ë°ì´í„°ë¥¼ ì„±ê³µì ìœ¼ë¡œ ê°€ì ¸ì™”ìŠµë‹ˆë‹¤!\n(Elo ë°ì´í„° ì™„ì „ ë³µì›)${extraInfo}${histInfo}${analysisInfo}${comboInfo}${tagMetaInfo}${plannedInfo}`);
            },
          },
        ]
      );
      return;
    }

    // v9~v11 ì™¸ì˜ í¬ë§·ì€ ì§€ì›í•˜ì§€ ì•ŠìŒ
    Alert.alert("ì˜¤ë¥˜", "ì§€ì›í•˜ì§€ ì•ŠëŠ” ë°±ì—… í˜•ì‹ìž…ë‹ˆë‹¤.\nv9~v11 í˜•ì‹ë§Œ ì§€ì›ë©ë‹ˆë‹¤.");

  } catch (e) {
    console.warn(e);
    Alert.alert("ì˜¤ë¥˜", "JSON íŒŒì‹± ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤: " + e.message);
  }
}

/* ---------- ë§¤ì¹­ ì´ˆê¸°í™” ---------- */
  async function resetMatches() {
    Alert.alert(
      "í™•ì¸",
      "ëª¨ë“  ëŒ€ì§„ ë¡œê·¸ë¥¼ ì‚­ì œí•˜ê³  ë ˆì´íŒ…ì„ ì´ˆê¸°í™”í•©ë‹ˆë‹¤.",
      [
        { text: "ì·¨ì†Œ" },
        {
          text: "ì´ˆê¸°í™”",
          style: "destructive",
          onPress: async () => {
            await exec("DELETE FROM matches;");
            
            // ðŸ”„ v3.5.0: ê´€ë ¨ ìƒíƒœ ì´ˆê¸°í™”
            setLastMatchId(null);
            setPair(null);
            setMatchAnalysis(null);
            setMatchPrediction(null);
            
            await rebuildAllFromMatches();
            await loadList();
            Alert.alert("ì™„ë£Œ", "ëŒ€ì§„ ë¡œê·¸ê°€ ì´ˆê¸°í™”ë˜ì—ˆìŠµë‹ˆë‹¤.");
          },
        },
      ]
    );
  }

  /* ---------- Nav ---------- */
  // ê²€í†  ëŒ€ê¸° ê±´ìˆ˜ ê³„ì‚°
  const reviewCount = useMemo(() => {
    return list.filter(n => getReviewStatus(n) !== null).length;
  }, [list]);

  // ðŸ“ ë³´ì¶© ëŒ€ìƒ ìž‘í’ˆ íŒë³„ í•¨ìˆ˜ (v2.8)
  const isSupplementTarget = useCallback((novel) => {
    const settings = appSettings.supplement || DEFAULT_SETTINGS.supplement;
    if (!settings.enabled) return false;

    // ë¶€ì • íƒœê·¸ ì²´í¬ (ì·¨í–¥ì•„ë‹˜ í¬í•¨ Nê°œ ì´ìƒì´ë©´ ì œì™¸)
    const novelTags = (novel.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    const excludeTagsSet = new Set(settings.excludeTags || ["ì·¨í–¥ì•„ë‹˜"]);
    let negativeCount = 0;
    
    for (const tag of novelTags) {
      const sentiment = getTagSentiment(tag, tagSentiments);
      if (sentiment === TAG_SENTIMENT.NEGATIVE) {
        negativeCount++;
      }
      // ì œì™¸ íƒœê·¸ê°€ ìžˆìœ¼ë©´ ë°”ë¡œ ì œì™¸
      if (excludeTagsSet.has(tag)) {
        negativeCount = Math.max(negativeCount, settings.excludeNegativeTagCount);
      }
    }
    
    if (negativeCount >= settings.excludeNegativeTagCount) {
      return false;
    }

    // ê° ê¸°ì¤€ ì²´í¬
    const issues = [];
    
    // íƒœê·¸ ìˆ˜ ì²´í¬
    if (novelTags.length < settings.minTags) {
      issues.push("tags");
    }
    
    // ìž‘ê°€ ì²´í¬
    if (settings.requireAuthor && !novel.author?.trim()) {
      issues.push("author");
    }
    
    // ì „ì²´ íšŒì°¨ ì²´í¬
    if (settings.requireTotalEpisodes && (!novel.total_episodes || novel.total_episodes <= 0)) {
      issues.push("totalEpisodes");
    }
    
    // ì½ì€ íšŒì°¨ ì²´í¬
    if (settings.requireReadCount && (!novel.read_count || novel.read_count <= 0)) {
      issues.push("readCount");
    }
    
    // ëŒ€ìž¥ë¥´ ì²´í¬
    if (settings.requireMajorGenre && !novel.major_genre?.trim()) {
      issues.push("majorGenre");
    }
    
    // ë¶€ìž¥ë¥´ ì²´í¬
    if (settings.requireSubGenre && !novel.sub_genre?.trim()) {
      issues.push("subGenre");
    }
    
    // í”Œëž«í¼ ì²´í¬
    if (settings.requirePlatform) {
      const plats = parsePlatforms(novel.platforms);
      if (plats.length === 0) {
        issues.push("platform");
      }
    }
    
    return issues.length > 0 ? issues : false;
  }, [appSettings.supplement, tagSentiments]);

  // ðŸ“ ë³´ì¶© ëŒ€ìƒ ëª©ë¡ ê³„ì‚°
  const supplementList = useMemo(() => {
    return list
      .map(n => ({ novel: n, issues: isSupplementTarget(n) }))
      .filter(item => item.issues !== false);
  }, [list, isSupplementTarget]);

  // ðŸ“ ë³´ì¶© ëŒ€ìƒ ê±´ìˆ˜
  const supplementCount = supplementList.length;

  // ðŸ”§ v3.0.2: ì €ìž¥ í›„ ë‹¤ìŒ ìž‘í’ˆìœ¼ë¡œ ìžë™ ì´ë™ (supplementList ë³€ê²½ ì‹œ íŠ¸ë¦¬ê±°)
  useEffect(() => {
    if (savedSupplementId) {
      // ì €ìž¥ëœ IDê°€ ìžˆìœ¼ë©´, í•´ë‹¹ ìž‘í’ˆ ì œì™¸í•˜ê³  ë‹¤ìŒ ìž‘í’ˆ ì„ íƒ
      const remaining = supplementList.filter(item => item.novel.id !== savedSupplementId);
      if (remaining.length > 0) {
        const picked = remaining[Math.floor(Math.random() * remaining.length)];
        setSupplementCurrentNovel(picked);
        setEditItem({ ...picked.novel });
      } else if (supplementList.length > 0) {
        // ì €ìž¥í•œ ìž‘í’ˆì´ ì—¬ì „ížˆ ë³´ì¶© ëŒ€ìƒì´ë©´ (ëª¨ë“  í•­ëª© ë³´ì¶© ì•ˆë¨)
        const picked = supplementList[0];
        setSupplementCurrentNovel(picked);
        setEditItem({ ...picked.novel });
      } else {
        // ë³´ì¶© ëŒ€ìƒ ì—†ìŒ
        setSupplementCurrentNovel(null);
        setEditItem(null);
      }
      setSavedSupplementId(null); // í”Œëž˜ê·¸ ë¦¬ì…‹
    }
  }, [supplementList, savedSupplementId]);

  // ðŸ“ ë‹¤ìŒ ë³´ì¶© ìž‘í’ˆ ì„ íƒ
  const pickNextSupplementNovel = useCallback(() => {
    if (supplementList.length === 0) {
      setSupplementCurrentNovel(null);
      setEditItem(null);
      return null;
    }
    // í˜„ìž¬ ìž‘í’ˆ ì œì™¸í•˜ê³  ëžœë¤ ì„ íƒ (ì—†ìœ¼ë©´ ì²« ë²ˆì§¸)
    const currentId = supplementCurrentNovel?.novel?.id;
    const candidates = supplementList.filter(item => item.novel.id !== currentId);
    
    let picked;
    if (candidates.length === 0) {
      // í•˜ë‚˜ë¿ì´ë©´ ê·¸ê±°ë¼ë„
      picked = supplementList[0];
    } else {
      picked = candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    setSupplementCurrentNovel(picked);
    // ðŸ”§ v3.0.1: editItemë„ í•¨ê»˜ ì—…ë°ì´íŠ¸í•˜ì—¬ UI ë™ê¸°í™”
    setEditItem(picked ? { ...picked.novel } : null);
    return picked;
  }, [supplementList, supplementCurrentNovel]);

  const Nav = () => {
    // ðŸ“° ìµœì‹  ë³€í™” ê°œìˆ˜ (ì„¤ì • ê¸°ê°„ ë‚´)
    const recentChangesCount = useMemo(() => {
      const retentionDays = appSettings.recentChanges?.retentionDays || 30;
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
      return recentChanges.filter(c => c.timestamp > cutoff).length;
    }, [recentChanges, appSettings.recentChanges?.retentionDays]);
    
    // ðŸ“‹ ì˜ˆì • ìž‘í’ˆ ê°œìˆ˜
    const plannedCount = plannedList?.length || 0;
    
    return (
    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
      {[
        ["í™ˆ", "home"],
        ["ðŸ“‹ì˜ˆì •", "planned"], // ðŸ†• v3.3.0
        ["ðŸ“°ìµœì‹ ", "recent"],
        ["ìˆœìœ„", "rank"],
        ["ðŸ†ìˆ˜ìƒ", "awards"],
        ["ê²€í† ", "review"],
        ["ë³´ì¶©", "supplement"],
        ["ì·¨í–¥", "taste"],
        ["ì¶”ì²œ", "reco"],
        ["ë§¤ì¹­", "match"],
        ["ë¶„ì„", "analysis"],
        ["ëŒ€ëŸ‰", "bulk"],
        ["ðŸ–¼ï¸í‘œì§€", "covers"], // ðŸ†• v3.4.5
        ["ì„¤ì •", "settings"],
      ].map(([label, key]) => {
        // ë±ƒì§€ í‘œì‹œ ì—¬ë¶€ ê³„ì‚°
        const hasBadge = 
          (key === "review" && reviewCount > 0) || 
          (key === "supplement" && supplementCount > 0) ||
          (key === "recent" && recentChangesCount > 0) ||
          (key === "planned" && plannedCount > 0);
        const badgeCount = 
          key === "review" ? reviewCount : 
          key === "supplement" ? supplementCount : 
          key === "recent" ? recentChangesCount : 
          key === "planned" ? plannedCount : 0;
        const badgeColor = 
          key === "review" ? "#f59e0b" : 
          key === "supplement" ? "#3b82f6" :
          key === "recent" ? "#10b981" : 
          key === "planned" ? "#8b5cf6" : "#3b82f6";
        
        return (
        <TouchableOpacity
          key={key}
          onPress={() => setScreen(key)}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: screen === key ? C.card : "transparent",
            borderWidth: 1,
            borderColor: hasBadge ? badgeColor : C.line,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontWeight: "800",
              color: screen === key ? C.text : C.sub,
            }}
          >
            {label}
          </Text>
          {hasBadge && (
            <View style={{
              backgroundColor: badgeColor,
              borderRadius: 999,
              minWidth: 18,
              height: 18,
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 4,
            }}>
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>{badgeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )})}
    </View>
  )};


  /* ---------- Render ---------- */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ðŸ†• v3.4.4: ì „ì²´ í™”ë©´ ëª¨ë“œ (ìƒíƒœë°” ìˆ¨ê¹€) */}
      <StatusBar 
        hidden={appSettings.fullscreenMode === true}
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={C.bg}
        translucent={appSettings.fullscreenMode === true}
      />
      <LoadingOverlay />
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={true}
        indicatorStyle={isDark ? "white" : "black"}
      >
        <Nav />

        {/* HOME */}
        {screen === "home" && (
          <>
            {/* ðŸ† ê²€í†  ëŒ€ê¸° ì•Œë¦¼ ë°°ë„ˆ (ì„¤ì •ìœ¼ë¡œ ìˆ¨ê¸°ê¸° ê°€ëŠ¥) */}
            {reviewCount > 0 && appSettings.showReviewBanner !== false && (
              <TouchableOpacity
                onPress={() => setScreen("review")}
                style={{
                  backgroundColor: "#fef3c7",
                  borderWidth: 1,
                  borderColor: "#f59e0b",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 18, marginRight: 8 }}>ðŸ†</Text>
                  <View>
                    <Text style={{ fontWeight: "700", color: "#92400e" }}>
                      í‹°ì–´ ê²€í†  ëŒ€ê¸° {reviewCount}ê±´
                    </Text>
                    <Text style={{ fontSize: 12, color: "#b45309" }}>
                      S/A ìŠ¹ê¸‰/ê°•ë“± ê²€í† ê°€ í•„ìš”í•©ë‹ˆë‹¤
                    </Text>
                  </View>
                </View>
                <Text style={{ color: "#92400e", fontWeight: "700" }}>ê²€í†  â†’</Text>
              </TouchableOpacity>
            )}
            
            <H>ìž‘í’ˆ ë“±ë¡</H>
            <Section title="ê¸°ë³¸ ì •ë³´">
              {/* ðŸ†• í‘œì§€ ì´ë¯¸ì§€ */}
              <Label>í‘œì§€ ì´ë¯¸ì§€</Label>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 12 }}>
                {newCoverImage ? (
                  <ExpoImage source={{ uri: newCoverImage }} style={{ width: 50, height: 70, borderRadius: 6 }} contentFit="cover" cachePolicy="memory-disk" />
                ) : (
                  <View style={{ width: 50, height: 70, borderRadius: 6, backgroundColor: C.line, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: C.sub, fontSize: 10 }}>ì—†ìŒ</Text>
                  </View>
                )}
                <OutlineButton title="URL" onPress={() => openUrlModal(setNewCoverImage)} style={{ minWidth: 60 }} />
                <OutlineButton title="ê°¤ëŸ¬ë¦¬" onPress={() => pickImageFromGallery(setNewCoverImage)} style={{ minWidth: 70 }} />
                <OutlineButton 
                  title="ë¼ì´ë¸ŒëŸ¬ë¦¬" 
                  onPress={() => {
                    setCoverSelectTarget("new");
                    setCoverSelectModalOpen(true);
                  }} 
                  color={C.primary}
                  style={{ minWidth: 90 }}
                />
                {newCoverImage && (
                  <OutlineButton 
                    title="ì‚­ì œ" 
                    onPress={() => setNewCoverImage("")} 
                    color={C.warn} 
                    style={{ minWidth: 60 }}
                  />
                )}
              </View>

              <Label>ì œëª©</Label>
              <Input value={title} onChangeText={setTitle} placeholder="ì œëª©" />
              {/* ðŸ†• v3.4.1 #10: ì‹¤ì‹œê°„ ì¤‘ë³µ ì²´í¬ ê²½ê³  */}
              {titleDuplicateInfo && (
                <View style={{ 
                  backgroundColor: titleDuplicateInfo.type === "exact" ? "#fef2f2" : "#fffbeb", 
                  padding: 10, 
                  borderRadius: 8, 
                  marginTop: 6,
                  borderLeftWidth: 3,
                  borderLeftColor: titleDuplicateInfo.type === "exact" ? "#ef4444" : "#f59e0b",
                }}>
                  <Text style={{ 
                    color: titleDuplicateInfo.type === "exact" ? "#dc2626" : "#d97706", 
                    fontWeight: "700",
                    fontSize: 13,
                  }}>
                    âš ï¸ {titleDuplicateInfo.message}
                  </Text>
                  {titleDuplicateInfo.type === "exact" && titleDuplicateInfo.novel && (
                    <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                      "{titleDuplicateInfo.novel.title}" - {titleDuplicateInfo.novel.author || "ìž‘ê°€ ë¯¸ìƒ"}
                    </Text>
                  )}
                  {titleDuplicateInfo.type === "similar" && titleDuplicateInfo.novels && (
                    <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                      {titleDuplicateInfo.novels.map(n => `"${n.title}"`).join(", ")}
                    </Text>
                  )}
                </View>
              )}
              <Label style={{ marginTop: 10 }}>ìž‘ê°€(ì„ íƒ)</Label>
              <Input
                value={author}
                onChangeText={setAuthor}
                placeholder="ìž‘ê°€"
              />
              <Label style={{ marginTop: 10 }}>íƒœê·¸</Label>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <Input
                  value={tags}
                  onChangeText={(t) => {
                    // ðŸ”§ v3.4.5: í…ìŠ¤íŠ¸ ë³€ê²½ ì‹œ ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ ìžë™ ë™ê¸°í™” (íŽ¸ì§‘ ëª¨ë‹¬ê³¼ ì¼ê´€ì„±)
                    const inputTags = t.split(",").map(tag => tag.trim()).filter(Boolean);
                    
                    const allMajor = [...MAJOR_GENRES, ...userMajorGenres];
                    const allSub = [...SUB_GENRES, ...userSubGenres];
                    
                    const detectedMajor = inputTags.filter(tag => 
                      allMajor.some(m => m.toLowerCase() === tag.toLowerCase())
                    ).map(tag => allMajor.find(m => m.toLowerCase() === tag.toLowerCase()) || tag);
                    
                    const detectedSub = inputTags.filter(tag => 
                      allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                    ).map(tag => allSub.find(s => s.toLowerCase() === tag.toLowerCase()) || tag);
                    
                    setTags(t);
                    setNewMajorGenre(detectedMajor);
                    setNewSubGenre(detectedSub);
                  }}
                  placeholder="ì˜ˆ: ë¬´í˜‘, í˜„íŒ, í—Œí„°"
                  style={{ flex: 1 }}
                />
                <OutlineButton
                  title="ðŸ·ï¸ ê³ ë¥´ê¸°"
                  onPress={() => {
                    // ðŸ”§ v3.4.5: tags ë¬¸ìžì—´ì—ì„œ ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´/ì¼ë°˜íƒœê·¸ë¥¼ ë¶„ë¦¬í•˜ì—¬ ì „ë‹¬ (íŽ¸ì§‘ ëª¨ë‹¬ê³¼ ì¼ê´€ì„±)
                    const currentTags = tags.split(",").map(t => t.trim()).filter(Boolean);
                    
                    const allMajor = [...MAJOR_GENRES, ...userMajorGenres];
                    const allSub = [...SUB_GENRES, ...userSubGenres];
                    
                    // ëŒ€ìž¥ë¥´ ê°ì§€
                    const majorTags = currentTags.filter(tag => 
                      allMajor.some(m => m.toLowerCase() === tag.toLowerCase())
                    ).map(tag => allMajor.find(m => m.toLowerCase() === tag.toLowerCase()) || tag);
                    
                    // ë¶€ìž¥ë¥´ ê°ì§€
                    const subTags = currentTags.filter(tag => 
                      allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                    ).map(tag => allSub.find(s => s.toLowerCase() === tag.toLowerCase()) || tag);
                    
                    // ì¼ë°˜ íƒœê·¸ (ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ ì œì™¸)
                    const generalTags = currentTags.filter(tag => 
                      !allMajor.some(m => m.toLowerCase() === tag.toLowerCase()) &&
                      !allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                    );
                    
                    // ë¶„ë¦¬ëœ ê°’ìœ¼ë¡œ ëª¨ë‹¬ ì—´ê¸° (JSON ë¬¸ìžì—´ë¡œ ì „ë‹¬)
                    openTagModal(
                      "new", 
                      generalTags, 
                      majorTags.length > 0 ? JSON.stringify(majorTags) : "",
                      subTags.length > 0 ? JSON.stringify(subTags) : "",
                      newTagData
                    );
                  }}
                  style={{ paddingHorizontal: 12 }}
                />
              </View>
              {/* ì„ íƒëœ ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ í‘œì‹œ - ðŸ”§ v3.4.5: tags ë¬¸ìžì—´ì—ì„œ ìžë™ ê°ì§€í•˜ì—¬ í‘œì‹œ */}
              {(() => {
                const currentTags = (tags || "").split(",").map(t => t.trim()).filter(Boolean);
                const allMajor = [...MAJOR_GENRES, ...userMajorGenres];
                const allSub = [...SUB_GENRES, ...userSubGenres];
                
                const majorTags = currentTags.filter(tag => 
                  allMajor.some(m => m.toLowerCase() === tag.toLowerCase())
                );
                const subTags = currentTags.filter(tag => 
                  allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                );
                
                if (majorTags.length === 0 && subTags.length === 0) return null;
                
                return (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
                    {majorTags.map((g) => <GenreBadge key={g} genre={g} type="major" />)}
                    {subTags.map((g) => <GenreBadge key={g} genre={g} type="sub" />)}
                  </View>
                );
              })()}
              <Label style={{ marginTop: 10 }}>ì—°ìž¬ì²˜(ë³µìˆ˜ ì„ íƒ ê°€ëŠ¥)</Label>
              <PlatformChips
                platforms={platforms}
                onChange={setPlatforms}
                options={PLATFORM_OPTIONS}
                theme={C}
              />
              <Label style={{ marginTop: 10 }}>ë³¸íŽ¸ ì½ì€ íšŒì°¨</Label>
<Input
  value={readCount}
  onChangeText={setReadCount}
  keyboardType="number-pad"
  placeholder="ì˜ˆ: 37"
/>

<Label style={{ marginTop: 10 }}>ë³¸íŽ¸ ì „ì²´ íšŒì°¨(ì„ íƒ)</Label>
<Input
  value={totalEpisodes}
  onChangeText={setTotalEpisodes}
  keyboardType="number-pad"
  placeholder="ì˜ˆ: 300"
/>

{/* ðŸ“š v3.0.4: ë‹¤íšŒë… ì¹´ìš´íŠ¸ */}
<Label style={{ marginTop: 10 }}>ë‹¤íšŒë… íšŸìˆ˜</Label>
<Input
  value={rereadCount}
  onChangeText={setRereadCount}
  keyboardType="number-pad"
  placeholder="ê¸°ë³¸ 1íšŒ (ìž¬ë… ì‹œ ì¦ê°€)"
/>

{/* ðŸ†• ì½ê¸° ìƒíƒœ */}
<Label style={{ marginTop: 10 }}>ì½ê¸° ìƒíƒœ</Label>
<View style={{ flexDirection: "row", flexWrap: "wrap" }}>
  {STATUS_OPTIONS.map((s) => (
    <Chip
      key={s.key}
      label={s.label}
      active={newStatus === s.key}
      onPress={() => setNewStatus(s.key)}
    />
  ))}
</View>

{/* ðŸ†• ìž‘í’ˆ ì—°ìž¬ ìƒíƒœ */}
<Label style={{ marginTop: 10 }}>ìž‘í’ˆ ì—°ìž¬ ìƒíƒœ</Label>
<View style={{ flexDirection: "row", flexWrap: "wrap" }}>
  {WORK_STATUS_OPTIONS.map((s) => (
    <Chip
      key={s.key}
      label={s.label}
      active={newWorkStatus === s.key}
      onPress={() => setNewWorkStatus(s.key)}
    />
  ))}
</View>

{/* ðŸ“– ì™¸ì „ ìƒíƒœ */}
<Label style={{ marginTop: 10 }}>ì™¸ì „ ìƒíƒœ</Label>
<View style={{ flexDirection: "row", flexWrap: "wrap" }}>
  {GAIDEN_STATUS_OPTIONS.map((s) => (
    <Chip
      key={s.key}
      label={s.label}
      active={newGaidenStatus === s.key}
      onPress={() => setNewGaidenStatus(s.key)}
    />
  ))}
</View>

{/* ì™¸ì „ íšŒì°¨ (ì™¸ì „ì´ ìžˆëŠ” ê²½ìš°ì—ë§Œ í‘œì‹œ) */}
{newGaidenStatus !== "none" && (
  <View style={{ marginTop: 10, backgroundColor: C.chip, padding: 12, borderRadius: 12 }}>
    <Label>ì™¸ì „ ì½ì€ íšŒì°¨</Label>
    <Input
      value={newGaidenReadCount}
      onChangeText={setNewGaidenReadCount}
      keyboardType="number-pad"
      placeholder="ì˜ˆ: 10"
    />
    <Label style={{ marginTop: 10 }}>ì™¸ì „ ì „ì²´ íšŒì°¨(ì„ íƒ)</Label>
    <Input
      value={newGaidenTotalEpisodes}
      onChangeText={setNewGaidenTotalEpisodes}
      keyboardType="number-pad"
      placeholder="ì˜ˆ: 50"
    />
  </View>
)}

{/* ðŸ”— ìž‘í’ˆ ë§í¬ */}
<Label style={{ marginTop: 10 }}>ìž‘í’ˆ ë§í¬(ì„ íƒ)</Label>
<Input
  value={newLink}
  onChangeText={setNewLink}
  placeholder="https://novelpia.com/novel/..."
  autoCapitalize="none"
  autoCorrect={false}
/>

<Label style={{ marginTop: 10 }}>ë©”ëª¨</Label>
<Input
  value={note}
  onChangeText={setNote}
  placeholder="ë©”ëª¨"
  multiline
/>

{/* ðŸ’¬ ì¸ìƒê¹Šì€ ë¬¸ìž¥ */}
<View style={{ marginTop: 12, padding: 12, backgroundColor: isDark ? "#1e293b" : "#fffbeb", borderRadius: 12, borderLeftWidth: 3, borderLeftColor: isDark ? "#fbbf24" : "#f59e0b" }}>
  <Label style={{ marginBottom: 6 }}>ðŸ’¬ ì¸ìƒê¹Šì€ ë¬¸ìž¥ (ì„ íƒ)</Label>
  <TextInput
    value={memorableQuote}
    onChangeText={setMemorableQuote}
    placeholder={'"ì´ ìž‘í’ˆì—ì„œ ê°€ìž¥ ê¸°ì–µì— ë‚¨ëŠ” ë¬¸ìž¥..."'}
    placeholderTextColor={C.sub}
    multiline
    style={{
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      fontStyle: "italic",
      color: C.text,
      minHeight: 70,
      textAlignVertical: "top",
    }}
  />
</View>

              <PrimaryButton
                title="ìž‘í’ˆ ì¶”ê°€"
                onPress={addNovel}
                style={{ marginTop: 12 }}
                disabled={isLoading}
              />
            </Section>

            <H>ìž‘í’ˆ ëª©ë¡</H>

            {/* ðŸ†• v3.4.1 #12: ìµœê·¼ íŽ¸ì§‘ ìž‘í’ˆ ë¹ ë¥¸ ì ‘ê·¼ */}
            {recentlyEditedNovels.length > 0 && (
              <Section title="ðŸ“ ìµœê·¼ íŽ¸ì§‘">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -8 }}>
                  <View style={{ flexDirection: "row", paddingHorizontal: 8, gap: 10 }}>
                    {recentlyEditedNovels.map((n) => (
                      <TouchableOpacity
                        key={n.id}
                        onPress={() => openEdit(n)}
                        style={{
                          width: 120,
                          padding: 10,
                          backgroundColor: C.card,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: C.line,
                        }}
                      >
                        <Text style={{ fontWeight: "700", color: C.text, fontSize: 13 }} numberOfLines={2}>
                          {n.title}
                        </Text>
                        <Text style={{ color: C.sub, fontSize: 11, marginTop: 4 }} numberOfLines={1}>
                          {n.author || "ìž‘ê°€ ë¯¸ìƒ"}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                          <ActualTierTag novel={n} />
                          <Text style={{ color: C.sub, fontSize: 10, marginLeft: 6 }}>
                            {n.read_count}í™”
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </Section>
            )}

            {/* ðŸ†• ê³ ê¸‰ í•„í„° */}
            <Section title="ê³ ê¸‰ í•„í„°">
              <Label>í‹°ì–´</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {["ALL", "S", "A", "B+", "B", "B-", "C"].map((t) => (
                  <Chip key={t} label={t === "ALL" ? "ì „ì²´" : t} active={filterTier === t} onPress={() => setFilterTier(t)} />
                ))}
              </View>
              <Label style={{ marginTop: 8 }}>í”Œëž«í¼</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <Chip label="ì „ì²´" active={filterPlatform === "ALL"} onPress={() => setFilterPlatform("ALL")} />
                {PLATFORM_OPTIONS.map((p) => (
                  <Chip key={p} label={p} active={filterPlatform === p} onPress={() => setFilterPlatform(p)} />
                ))}
              </View>
              <Label style={{ marginTop: 8 }}>ìž¥ë¥´</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <Chip label="ì „ì²´" active={filterGenre === "ALL"} onPress={() => setFilterGenre("ALL")} />
                {GENRE_OPTIONS.map((g) => (
                  <Chip key={g} label={g} active={filterGenre === g} onPress={() => setFilterGenre(g)} />
                ))}
              </View>
              <Label style={{ marginTop: 8 }}>ì½ê¸° ìƒíƒœ</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <Chip label="ì „ì²´" active={filterStatus === "ALL"} onPress={() => setFilterStatus("ALL")} />
                {STATUS_OPTIONS.map((s) => (
                  <Chip key={s.key} label={s.label} active={filterStatus === s.key} onPress={() => setFilterStatus(s.key)} />
                ))}
              </View>
            </Section>

            <Section title="ê²€ìƒ‰ / ì •ë ¬">
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                <Input
                  value={homeQuery}
                  onChangeText={setHomeQuery}
                  placeholder="ì œëª©/ìž‘ê°€/íƒœê·¸/ë©”ëª¨/í”Œëž«í¼ ê²€ìƒ‰"
                  style={{ flex: 1 }}
                />
                {/* ðŸ” ê³ ê¸‰ ê²€ìƒ‰ ë²„íŠ¼ */}
                <TouchableOpacity
                  onPress={() => setSearchTagModalOpen(true)}
                  style={{
                    backgroundColor: (searchIncludeTags.length > 0 || searchExcludeTags.length > 0 || searchExcludeStatus.length > 0 || searchExcludeWorkStatus.length > 0) 
                      ? C.primary : C.chip,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 12,
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ 
                    color: (searchIncludeTags.length > 0 || searchExcludeTags.length > 0 || searchExcludeStatus.length > 0 || searchExcludeWorkStatus.length > 0) 
                      ? "#fff" : C.text, 
                    fontWeight: "700" 
                  }}>
                    ðŸ” í•„í„°
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* í˜„ìž¬ ì ìš©ëœ í•„í„° í‘œì‹œ */}
              {(searchIncludeTags.length > 0 || searchExcludeTags.length > 0 || searchExcludeStatus.length > 0 || searchExcludeWorkStatus.length > 0) && (
                <View style={{ 
                  backgroundColor: C.chip, 
                  padding: 10, 
                  borderRadius: 10, 
                  marginBottom: 10 
                }}>
                  {searchIncludeTags.length > 0 && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, color: C.ok, fontWeight: "700", marginRight: 6 }}>âœ… í¬í•¨:</Text>
                      {searchIncludeTags.map(tag => (
                        <TouchableOpacity
                          key={tag}
                          onPress={() => setSearchIncludeTags(searchIncludeTags.filter(t => t !== tag))}
                          style={{ 
                            backgroundColor: C.ok, 
                            paddingHorizontal: 6, 
                            paddingVertical: 2, 
                            borderRadius: 999, 
                            marginRight: 4, 
                            marginBottom: 2 
                          }}
                        >
                          <Text style={{ fontSize: 10, color: "#fff" }}>{tag} âœ•</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {searchExcludeTags.length > 0 && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, color: C.warn, fontWeight: "700", marginRight: 6 }}>ðŸš« ì œì™¸:</Text>
                      {searchExcludeTags.map(tag => (
                        <TouchableOpacity
                          key={tag}
                          onPress={() => setSearchExcludeTags(searchExcludeTags.filter(t => t !== tag))}
                          style={{ 
                            backgroundColor: C.warn, 
                            paddingHorizontal: 6, 
                            paddingVertical: 2, 
                            borderRadius: 999, 
                            marginRight: 4, 
                            marginBottom: 2 
                          }}
                        >
                          <Text style={{ fontSize: 10, color: "#fff" }}>{tag} âœ•</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {(searchExcludeStatus.length > 0 || searchExcludeWorkStatus.length > 0) && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      <Text style={{ fontSize: 11, color: C.warn, fontWeight: "700", marginRight: 6 }}>ðŸš« ìƒíƒœ:</Text>
                      {searchExcludeStatus.map(s => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => setSearchExcludeStatus(searchExcludeStatus.filter(x => x !== s))}
                          style={{ 
                            backgroundColor: C.warn, 
                            paddingHorizontal: 6, 
                            paddingVertical: 2, 
                            borderRadius: 999, 
                            marginRight: 4, 
                            marginBottom: 2 
                          }}
                        >
                          <Text style={{ fontSize: 10, color: "#fff" }}>{STATUS_MAP[s]?.label || s} âœ•</Text>
                        </TouchableOpacity>
                      ))}
                      {searchExcludeWorkStatus.map(s => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => setSearchExcludeWorkStatus(searchExcludeWorkStatus.filter(x => x !== s))}
                          style={{ 
                            backgroundColor: C.warn, 
                            paddingHorizontal: 6, 
                            paddingVertical: 2, 
                            borderRadius: 999, 
                            marginRight: 4, 
                            marginBottom: 2 
                          }}
                        >
                          <Text style={{ fontSize: 10, color: "#fff" }}>{WORK_STATUS_MAP[s]?.label || s} âœ•</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
              
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 10,
                  alignItems: "center",
                }}
              >
                {[
                  ["ë ˆì´íŒ…", "rating"],
                  ["ì œëª©", "title"],
                  ["ë“±ë¡ìˆœ", "created"],
                  ["ì½ì€ íšŒì°¨", "read"],
                ].map(([label, key]) => (
                  <Chip
                    key={key}
                    label={label}
                    active={homeSortKey === key}
                    onPress={() => {
                      setHomeSortKey(key);
                      loadList(key, homeSortDir);
                    }}
                  />
                ))}
                <TouchableOpacity
                  onPress={() => {
                    const newDir = homeSortDir === "DESC" ? "ASC" : "DESC";
                    setHomeSortDir(newDir);
                    loadList(homeSortKey, newDir);
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: C.line,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: C.sub, fontWeight: "700" }}>
                    {homeSortDir === "DESC" ? "â†“ ë‚´ë¦¼ì°¨ìˆœ" : "â†‘ ì˜¤ë¦„ì°¨ìˆœ"}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* ðŸ†• ë¹„êµ ëª¨ë“œ */}
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                <Text style={{ color: C.sub, marginRight: 8 }}>ë¹„êµ ëª¨ë“œ</Text>
                <Switch 
                  value={compareMode} 
                  onValueChange={(v) => {
                    setCompareMode(v);
                    if (!v) setCompareIds([]); // ðŸ”„ ë„ë©´ ì„ íƒ í•´ì œ
                  }} 
                />
                {compareMode && compareIds.length === 2 && (
                  <OutlineButton title="ë¹„êµí•˜ê¸°" onPress={() => setCompareOpen(true)} style={{ marginLeft: 12 }} />
                )}
              </View>
            </Section>

            <Section title={`í˜„ìž¬ ìˆœìœ„ (${homeFiltered.length})`}>
              <FlatList
                data={homeFiltered}
                keyExtractor={(item) => item.id}
                initialNumToRender={8}
                maxToRenderPerBatch={5}
                windowSize={3}
                removeClippedSubviews={true}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <NovelCard
                    item={item}
                    index={index}
                    onPress={compareMode ? () => toggleCompare(item.id) : () => openEdit({ ...item })}
                    onLongPress={() => Alert.alert(item.title, `ìž‘ê°€: ${item.author || "-"}\n\n${item.note || "(ë©”ëª¨ ì—†ìŒ)"}`)}
                    onTogglePin={(e) => { e?.stopPropagation?.(); togglePin(item.id, item.pinned); }}
                    onLinkPress={(e) => { e?.stopPropagation?.(); Linking.openURL(item.link); }}
                    compareMode={compareMode}
                    isComparing={compareIds.includes(item.id)}
                    platformCovers={platformCovers}
                    theme={C}
                    isDark={isDark}
                  />
                )}
                ListEmptyComponent={<Text style={{ color: C.sub, textAlign: "center", padding: 20 }}>ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.</Text>}
              />
            </Section>
          </>
        )}
        
    
    {screen === "reco" && (
  <>
    <H>ðŸŽ¯ ì˜¤ëŠ˜ì˜ ì¶”ì²œ</H>

    {/* --- ì¶”ì²œ ì¹´ë“œ (ìž‘í’ˆ ì •ë³´) --- */}
    <Section title="ì¶”ì²œ ìž‘í’ˆ">
      {!dailyReco || !dailyReco.novel ? (
        <Text style={{ color: C.sub }}>
          ì•„ì§ ì¶”ì²œí•  ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.  
          ìž‘í’ˆì„ ë“±ë¡í•˜ê±°ë‚˜ ì˜ˆì • ëª©ë¡ì— ì¶”ê°€í•´ ë³´ì„¸ìš”.
        </Text>
      ) : (
        (() => {
          const n = dailyReco.novel;
          const isPlanned = dailyReco.isPlanned;
          const reason = dailyReco.reason || "ì¶”ì²œ ìž‘í’ˆìž…ë‹ˆë‹¤.";
          const category = dailyReco.category || "other";
          
          // ì˜ˆì •ìž‘ vs ë³¸ëª©ë¡ ìž‘í’ˆ ì²˜ë¦¬
          const plats = parsePlatforms(n.platforms);
          const pickedLabel = (() => {
            try {
              const picked = new Date(dailyReco.pickedAt);
              return isNaN(picked.getTime()) ? "ë‚ ì§œ ì—†ìŒ" : picked.toLocaleDateString();
            } catch { return "ë‚ ì§œ ì—†ìŒ"; }
          })();
          const tags = (n.tags || "").split(",").map(t => t.trim()).filter(Boolean);
          
          // ì˜ˆì •ìž‘ì€ í‹°ì–´/ë ˆì´íŒ…/ì „ì ì´ ì—†ìŒ
          const t = isPlanned ? "ì˜ˆì •" : getDisplayTier(n);
          const c = isPlanned ? "#8b5cf6" : getTierColor(t);
          const reliability = isPlanned ? 0 : computeReliability(n, list.length);
          const winRate = isPlanned ? 0 : getWinRate(n.wins, n.losses);
          const episodeText = n.total_episodes > 0 
            ? (isPlanned ? `ì „ì²´ ${n.total_episodes}í™”` : `${n.read_count || 0} / ${n.total_episodes}í™”`)
            : (isPlanned ? "íšŒì°¨ ë¯¸ì •" : `${n.read_count || 0}í™”`);

          // ì¹´í…Œê³ ë¦¬ë³„ ì•„ì´ì½˜
          const categoryIcon = {
            planned_unread: "ðŸ“‹",
            almost_done: "ðŸ",
            taste_match_paused: "â¸ï¸",
            low_data: "ðŸ“Š",
            taste_high_tier: "â­",
            high_tier_less_read: "ðŸ†",
            reread_recommend: "ðŸ”„",
            other: "ðŸ“š",
          }[category] || "ðŸ“š";

          return (
            <View
              style={{
                padding: 16,
                borderRadius: 16,
                borderWidth: 3,
                borderColor: c,
                backgroundColor: C.card,
              }}
            >
              {/* ì˜ˆì •ìž‘ í‘œì‹œ ë°°ì§€ */}
              {isPlanned && (
                <View style={{
                  backgroundColor: "#8b5cf6",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  alignSelf: "flex-start",
                  marginBottom: 10,
                }}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>
                    ðŸ“‹ ì˜ˆì • ìž‘í’ˆ (ì•„ì§ ì½ì§€ ì•ŠìŒ)
                  </Text>
                </View>
              )}

              {/* ì¶”ì²œ ì´ìœ  ë°•ìŠ¤ */}
              <View style={{
                backgroundColor: isDark ? "#1e3a5f" : "#eff6ff",
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: c,
              }}>
                <Text style={{ color: isDark ? "#93c5fd" : "#1e40af", fontWeight: "700", fontSize: 14 }}>
                  {categoryIcon} ì¶”ì²œ ì´ìœ 
                </Text>
                <Text style={{ color: isDark ? "#bfdbfe" : "#1e3a8a", fontSize: 13, marginTop: 4, lineHeight: 20 }}>
                  {reason}
                </Text>
              </View>

              {/* ìƒë‹¨: í‘œì§€ + ê¸°ë³¸ ì •ë³´ */}
              <View style={{ flexDirection: "row", marginBottom: 12 }}>
                <CoverImage uri={n.cover_image} platforms={n.platforms} platformCovers={platformCovers} size={90} theme={C} />
                <View style={{ flex: 1 }}>
                  {/* ì œëª© + í‹°ì–´/ì˜ˆì • ë±ƒì§€ */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", flex: 1, color: C.text }} numberOfLines={2}>
                      {n.title}
                    </Text>
                    {isPlanned ? (
                      <View style={{ backgroundColor: "#8b5cf6", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>ì˜ˆì •</Text>
                      </View>
                    ) : (
                      <ActualTierTag novel={n} />
                    )}
                  </View>
                  
                  {/* ìž‘ê°€ Â· ìž¥ë¥´ + ìš°ì¸¡ ìƒíƒœ ì•„ì´ì½˜ */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ color: C.text, fontSize: 14, flex: 1 }} numberOfLines={1}>
                      âœï¸ {n.author || "ìž‘ê°€ ë¯¸ìƒ"}
                      {getFirstGenre(n.major_genre) && <Text style={{ color: C.sub }}> Â· {getFirstGenre(n.major_genre)}</Text>}
                      {getFirstGenre(n.sub_genre) && <Text style={{ color: C.sub }}> Â· {getFirstGenre(n.sub_genre)}</Text>}
                    </Text>
                    {!isPlanned && (
                      <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
                        <StatusIcon status={n.status} />
                        <WorkStatusIcon workStatus={n.work_status} />
                        <GaidenStatusIcon gaidenStatus={n.gaiden_status} />
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* ìˆ˜ìƒ ë±ƒì§€ (ë³¸ëª©ë¡ë§Œ) */}
              {!isPlanned && n.awards && parseAwards(n.awards).length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <AwardsRow awardsJson={n.awards} />
                </View>
              )}

              {/* ðŸ’¬ ì¸ìƒê¹Šì€ ë¬¸ìž¥ (ë³¸ëª©ë¡ë§Œ) */}
              {!isPlanned && n.memorable_quote && n.memorable_quote.trim() && (
                <View style={{ 
                  backgroundColor: isDark ? "#1e293b" : "#fef3c7", 
                  padding: 14, 
                  borderRadius: 12, 
                  marginBottom: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: isDark ? "#fbbf24" : "#f59e0b",
                }}>
                  <Text style={{ 
                    fontStyle: "italic", 
                    fontSize: 15, 
                    color: isDark ? "#fef3c7" : "#78350f",
                    lineHeight: 22,
                  }}>
                    {`"${n.memorable_quote.trim()}"`}
                  </Text>
                </View>
              )}

              {/* ìƒì„¸ ì •ë³´ ë°•ìŠ¤ */}
              <View style={{ backgroundColor: isDark ? "#1e293b" : "#f1f5f9", padding: 12, borderRadius: 10, marginBottom: 10 }}>
                {!isPlanned ? (
                  <>
                    {/* ë ˆì´íŒ… ì •ë³´ (ë³¸ëª©ë¡ë§Œ) */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <Text style={{ color: C.sub, fontSize: 11 }}>ë ˆì´íŒ…</Text>
                        <Text style={{ color: c, fontSize: 18, fontWeight: "800" }}>{(n.rating || 1500).toFixed(1)}</Text>
                      </View>
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <Text style={{ color: C.sub, fontSize: 11 }}>ìŠ¹ë¥ </Text>
                        <Text style={{ color: C.text, fontSize: 18, fontWeight: "800" }}>{winRate}%</Text>
                      </View>
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <Text style={{ color: C.sub, fontSize: 11 }}>ì „ì </Text>
                        <Text style={{ color: C.text, fontSize: 16, fontWeight: "700" }}>{n.wins || 0}W {n.losses || 0}L</Text>
                      </View>
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <Text style={{ color: C.sub, fontSize: 11 }}>ì‹ ë¢°ë„</Text>
                        <Text style={{ color: C.text, fontSize: 16, fontWeight: "700" }}>{Math.round(reliability)}%</Text>
                      </View>
                    </View>
                    <View style={{ height: 1, backgroundColor: C.line, marginVertical: 8 }} />
                  </>
                ) : (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: "#8b5cf6", fontWeight: "700", fontSize: 14, textAlign: "center" }}>
                      ðŸ“‹ ì•„ì§ ì½ì§€ ì•Šì€ ì˜ˆì • ìž‘í’ˆìž…ë‹ˆë‹¤
                    </Text>
                    {n.priority && (
                      <Text style={{ color: C.sub, fontSize: 12, textAlign: "center", marginTop: 4 }}>
                        ìš°ì„ ìˆœìœ„: {"â­".repeat(n.priority)}
                      </Text>
                    )}
                    <View style={{ height: 1, backgroundColor: C.line, marginVertical: 8 }} />
                  </View>
                )}
                
                {/* ì„¸ë¶€ ì •ë³´ */}
                <View style={{ gap: 4 }}>
                  <Text style={{ color: C.sub, fontSize: 13 }}>
                    ðŸ“– {isPlanned ? "ì „ì²´ íšŒì°¨" : "ì½ì€ íšŒì°¨"}: <Text style={{ color: C.text, fontWeight: "600" }}>{episodeText}</Text>
                  </Text>
                  <Text style={{ color: C.sub, fontSize: 13 }}>
                    ðŸ“± í”Œëž«í¼: <Text style={{ color: C.text }}>{plats.length ? plats.join(", ") : "-"}</Text>
                  </Text>
                  {tags.length > 0 && (
                    <Text style={{ color: C.sub, fontSize: 13 }} numberOfLines={2}>
                      ðŸ·ï¸ íƒœê·¸: <Text style={{ color: C.text }}>{tags.join(", ")}</Text>
                    </Text>
                  )}
                  {n.note && (
                    <Text style={{ color: C.sub, fontSize: 13 }} numberOfLines={3}>
                      ðŸ“ ë©”ëª¨: <Text style={{ color: C.text }}>{n.note}</Text>
                    </Text>
                  )}
                  <Text style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>
                    ðŸ—“ï¸ ì¶”ì²œì¼: {pickedLabel}
                  </Text>
                </View>
              </View>

              {/* ë²„íŠ¼ ì˜ì—­ */}
              {n.link && (
                <PrimaryButton 
                  title="ðŸ”— ìž‘í’ˆ ë°”ë¡œê°€ê¸°" 
                  onPress={() => Linking.openURL(n.link)} 
                  style={{ marginBottom: 8 }}
                />
              )}
              
              {/* ì˜ˆì •ìž‘ì´ë©´ ë“±ë¡ì „í™˜ ë²„íŠ¼ */}
              {isPlanned && (
                <OutlineButton
                  title="ðŸ“¥ ë³¸ ëª©ë¡ìœ¼ë¡œ ë“±ë¡ì „í™˜"
                  onPress={() => convertPlannedToNovel(n)}
                  color="#8b5cf6"
                />
              )}
            </View>
          );
        })()
      )}
    </Section>

    {/* --- ìµœê·¼ ì¶”ì²œ ížˆìŠ¤í† ë¦¬ --- */}
    {recoHistory && recoHistory.length > 0 && (
      <Section title={`ìµœê·¼ ì¶”ì²œ ê¸°ë¡ (${recoHistory.length}ê°œ)`}>
        <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
          ìµœê·¼ 5íšŒ ë‚´ ì¶”ì²œëœ ìž‘í’ˆì€ ë‹¤ì‹œ ì¶”ì²œë˜ì§€ ì•ŠìŠµë‹ˆë‹¤.
        </Text>
        <View style={{ gap: 4 }}>
          {recoHistory.slice(0, 5).map((h, idx) => {
            const novel = list.find(n => n.id === h.novelId) || (plannedList || []).find(p => p.id === h.novelId);
            const dateLabel = (() => {
              try {
                const d = new Date(h.pickedAt);
                return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
              } catch { return "-"; }
            })();
            return (
              <Text key={idx} style={{ color: C.sub, fontSize: 12 }}>
                {idx + 1}. {novel?.title || "(ì‚­ì œë¨)"} - {dateLabel}
              </Text>
            );
          })}
        </View>
      </Section>
    )}

    {/* --- ì¶”ì²œ ë‹¤ì‹œ ë½‘ê¸° ë²„íŠ¼ --- */}
    <Section title="ì˜µì…˜">
      <PrimaryButton
        title="ðŸŽ² ì˜¤ëŠ˜ì˜ ì¶”ì²œ ë‹¤ì‹œ ë½‘ê¸°"
        onPress={() => refreshDailyRecommendation(true)}
      />
      <Text style={{ color: C.sub, fontSize: 11, marginTop: 8, textAlign: "center" }}>
        ì¶”ì²œì€ í•˜ë£¨ì— í•œ ë²ˆ ìžë™ìœ¼ë¡œ ê°±ì‹ ë©ë‹ˆë‹¤.
      </Text>
    </Section>
  </>
)}
    
{/* RANK */}
        {screen === "rank" && (
          <>
            <H>í‹°ì–´ë³„ ìˆœìœ„</H>

            <Section title="ê²€ìƒ‰ / í•„í„°">
              <Input
                value={rankQuery}
                onChangeText={setRankQuery}
                placeholder="ì œëª©/ìž‘ê°€/íƒœê·¸/í”Œëž«í¼/ìˆ˜ìƒ ê²€ìƒ‰"
              />
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginTop: 10,
                }}
              >
                {[
                  ["ì „ì²´", "ALL"],
                  ["S", "S"],
                  ["A", "A"],
                  ["B+", "B+"],
                  ["B", "B"],
                  ["B-", "B-"],
                  ["C", "C"],
                ].map(([label, key]) => (
                  <Chip
                    key={key}
                    label={label}
                    active={rankTier === key}
                    onPress={() => setRankTier(key)}
                  />
                ))}
              </View>
            </Section>

            {/* ðŸ†• í‹°ì–´í‘œ ì´ë¯¸ì§€ ìº¡ì²˜ ì˜ì—­ */}
            <View ref={tierImageRef} collapsable={false} style={{ backgroundColor: C.bg }}>
            <Section title={`ìˆœìœ„ ëª©ë¡ (ì´ ${rankedEntries.length}ìž‘)`}>
              <FlatList
                data={rankedEntries}
                keyExtractor={({ item }) => item.id}
                initialNumToRender={8}
                maxToRenderPerBatch={5}
                windowSize={3}
                removeClippedSubviews={true}
                scrollEnabled={false}
                renderItem={({ item: entry }) => {
                  const { item, rank } = entry;
                  const actualTier = getDisplayTier(item);
                  const c = getTierColor(actualTier);
                  const winRate = getWinRate(item.wins, item.losses);
                  const isNew = isNewNovel(item.created_at);
                  const plats = parsePlatforms(item.platforms);
                  
                  // ðŸ“– íšŒì°¨ í‘œì‹œ (ì™¸ì „ì´ ìžˆìœ¼ë©´ ì™¸ì „ ê¸°ì¤€)
                  const hasGaiden = item.gaiden_status && item.gaiden_status !== "none";
                  let episodeText;
                  if (hasGaiden) {
                    const gaidenPart = item.gaiden_total_episodes > 0 
                      ? `ì™¸ì „ ${item.gaiden_read_count || 0}/${item.gaiden_total_episodes}`
                      : `ì™¸ì „ ${item.gaiden_read_count || 0}`;
                    episodeText = gaidenPart;
                  } else {
                    episodeText = item.total_episodes > 0 
                      ? `${item.read_count}/${item.total_episodes}` 
                      : `${item.read_count}`;
                  }
                  
                  return (
                    <View
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: isNew ? "#fbbf24" : c,
                        backgroundColor: C.card,
                        marginBottom: 10,
                      }}
                    >
                      <View style={{ flexDirection: "row" }}>
                        {/* í‘œì§€ ì´ë¯¸ì§€ */}
                        <CoverImage uri={item.cover_image} platforms={item.platforms} platformCovers={platformCovers} size={55} theme={C} />
                        
                        <View style={{ flex: 1 }}>
                          {/* 1ì¤„: ìˆœìœ„ + ì œëª© */}
                          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                            {item.pinned && <Text style={{ color: "#fbbf24", marginRight: 4, fontSize: 14 }}>â˜…</Text>}
                            {isNew && (
                              <View style={{ backgroundColor: "#fbbf24", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginRight: 5 }}>
                                <Text style={{ color: "#000", fontSize: 9, fontWeight: "800" }}>NEW</Text>
                              </View>
                            )}
                            <Text style={{ fontSize: 15, fontWeight: "800", flex: 1, color: C.text }} numberOfLines={1}>
                              #{rank} {item.title}
                            </Text>
                          </View>
                          
                          {/* 2ì¤„: í‹°ì–´ + ë ˆì´íŒ… + ìŠ¹ë¥  */}
                          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                            <ActualTierTag novel={item} />
                            <Text style={{ marginLeft: 8, fontWeight: "800", color: c, fontSize: 16 }}>
                              {item.rating.toFixed(1)}
                            </Text>
                            <Text style={{ marginLeft: 8, color: C.sub, fontSize: 13 }}>
                              ìŠ¹ë¥  <Text style={{ fontWeight: "700", color: C.text }}>{winRate}%</Text>
                            </Text>
                            <Text style={{ marginLeft: 8, color: C.sub, fontSize: 12 }}>
                              ({item.wins}W/{item.losses}L)
                            </Text>
                          </View>
                          
                          {/* 3ì¤„: ìž‘ê°€ Â· ìž¥ë¥´ + ìš°ì¸¡ ìƒíƒœ ì•„ì´ì½˜ */}
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <Text style={{ color: C.text, fontSize: 13, flex: 1 }} numberOfLines={1}>
                              {item.author || "ìž‘ê°€ ë¯¸ìƒ"}
                              {getFirstGenre(item.major_genre) && <Text style={{ color: C.sub }}> Â· {getFirstGenre(item.major_genre)}</Text>}
                              {getFirstGenre(item.sub_genre) && <Text style={{ color: C.sub }}> Â· {getFirstGenre(item.sub_genre)}</Text>}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
                              <StatusIcon status={item.status} />
                              <WorkStatusIcon workStatus={item.work_status} />
                              <GaidenStatusIcon gaidenStatus={item.gaiden_status} />
                            </View>
                          </View>
                          
                          {/* 4ì¤„: í”Œëž«í¼ + íšŒì°¨ */}
                          <Text style={{ color: C.sub, fontSize: 12 }} numberOfLines={1}>
                            ðŸ“– {episodeText}í™” Â· {plats.length > 0 ? plats.join(", ") : "-"}
                          </Text>
                          
                          {/* ìˆ˜ìƒ ë±ƒì§€ */}
                          {item.awards && parseAwards(item.awards).length > 0 && (
                            <AwardsRow awardsJson={item.awards} />
                          )}
                        </View>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={<Text style={{ color: C.sub, textAlign: "center", padding: 20 }}>ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.</Text>}
              />
            </Section>
            </View>

            {/* ðŸ†• í‹°ì–´í‘œ ê³µìœ  */}
            <Section title="í‹°ì–´í‘œ ê³µìœ ">
              <PrimaryButton
                title="í…ìŠ¤íŠ¸ë¡œ ê³µìœ "
                onPress={shareTierText}
                disabled={isLoading}
              />
              <Text style={{ color: C.sub, marginTop: 6, fontSize: 11 }}>
                â€» í‹°ì–´ë³„ ìˆœìœ„ë¥¼ í…ìŠ¤íŠ¸ë¡œ ê³µìœ í•©ë‹ˆë‹¤
              </Text>
            </Section>
          </>
        )}

        {/* ðŸ“‹ PLANNED - v3.3.0 ì˜ˆì • ìž‘í’ˆ ê´€ë¦¬ */}
        {screen === "planned" && (
          <>
            <H>ðŸ“‹ ì˜ˆì • ìž‘í’ˆ</H>
            
            {/* ì•ˆë‚´ ë¬¸êµ¬ */}
            <View style={{
              backgroundColor: isDark ? "#1e3a5f" : "#eff6ff",
              padding: 12,
              borderRadius: 12,
              marginBottom: 16,
              borderLeftWidth: 4,
              borderLeftColor: "#8b5cf6",
            }}>
              <Text style={{ color: isDark ? "#93c5fd" : "#1e40af", fontSize: 13, lineHeight: 20 }}>
                ðŸ“‹ ì•„ì§ ì½ì§€ ì•Šì•˜ì§€ë§Œ ì½ì„ ì˜ˆì •ì¸ ìž‘í’ˆì„ ê´€ë¦¬í•©ë‹ˆë‹¤.{"\n"}
                ì˜ˆì • ìž‘í’ˆì€ í™ˆ, ë§¤ì¹­, ì·¨í–¥ë¶„ì„, ìˆ˜ìƒ ë“±ì˜ ê¸°ëŠ¥ì—ì„œ ì œì™¸ë©ë‹ˆë‹¤.{"\n"}
                'ë“±ë¡ì „í™˜' ë²„íŠ¼ì„ ëˆŒëŸ¬ ì‹¤ì œë¡œ ì½ê¸° ì‹œìž‘í•˜ë©´ ë³¸ ëª©ë¡ìœ¼ë¡œ ì´ë™í•˜ì„¸ìš”.
              </Text>
            </View>
            
            {/* ì˜ˆì • ìž‘í’ˆ ë“±ë¡ í¼ (v3.4.2 ê°„ì†Œí™”) */}
            <Section title="ì˜ˆì • ìž‘í’ˆ ì¶”ê°€">
              <Label>ì œëª© *</Label>
              <Input 
                value={plannedTitle} 
                onChangeText={setPlannedTitle} 
                placeholder="ìž‘í’ˆ ì œëª©" 
              />
              {/* ì¤‘ë³µ ì²´í¬ */}
              {plannedTitleDuplicateInfo && (
                <View style={{ 
                  backgroundColor: plannedTitleDuplicateInfo.type.startsWith("exact") ? "#fef2f2" : "#fffbeb", 
                  padding: 10, 
                  borderRadius: 8, 
                  marginTop: 6,
                  borderLeftWidth: 3,
                  borderLeftColor: plannedTitleDuplicateInfo.type.startsWith("exact") ? "#ef4444" : "#f59e0b",
                }}>
                  <Text style={{ 
                    color: plannedTitleDuplicateInfo.type.startsWith("exact") ? "#dc2626" : "#d97706", 
                    fontWeight: "700",
                    fontSize: 13,
                  }}>
                    âš ï¸ {plannedTitleDuplicateInfo.message}
                  </Text>
                </View>
              )}
              
              <Label style={{ marginTop: 10 }}>ìž‘ê°€</Label>
              <Input 
                value={plannedAuthor} 
                onChangeText={setPlannedAuthor} 
                placeholder="ìž‘ê°€ëª…" 
              />
              
              <Label style={{ marginTop: 10 }}>ì—°ìž¬ì²˜</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {PLATFORM_OPTIONS.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    active={plannedPlatforms.includes(p)}
                    onPress={() => {
                      setPlannedPlatforms(prev => 
                        prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                      );
                    }}
                  />
                ))}
              </View>
              
              {/* ðŸ”§ v3.4.5: ì˜ˆì •íƒ­ ì‹ ê·œ ë“±ë¡ì— íƒœê·¸ ê¸°ëŠ¥ ì¶”ê°€ */}
              <Label style={{ marginTop: 10 }}>íƒœê·¸</Label>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <Input
                  value={plannedTags}
                  onChangeText={(t) => {
                    // í…ìŠ¤íŠ¸ ë³€ê²½ ì‹œ ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ ìžë™ ê°ì§€
                    const inputTags = t.split(",").map(tag => tag.trim()).filter(Boolean);
                    
                    const allMajor = [...MAJOR_GENRES, ...userMajorGenres];
                    const allSub = [...SUB_GENRES, ...userSubGenres];
                    
                    const detectedMajor = inputTags.filter(tag => 
                      allMajor.some(m => m.toLowerCase() === tag.toLowerCase())
                    ).map(tag => allMajor.find(m => m.toLowerCase() === tag.toLowerCase()) || tag);
                    
                    const detectedSub = inputTags.filter(tag => 
                      allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                    ).map(tag => allSub.find(s => s.toLowerCase() === tag.toLowerCase()) || tag);
                    
                    setPlannedTags(t);
                    setPlannedMajorGenre(detectedMajor);
                    setPlannedSubGenre(detectedSub);
                  }}
                  placeholder="ì˜ˆ: ë¬´í˜‘, í˜„íŒ, í—Œí„°"
                  style={{ flex: 1 }}
                />
                <OutlineButton
                  title="ðŸ·ï¸ ê³ ë¥´ê¸°"
                  onPress={() => {
                    // tags ë¬¸ìžì—´ì—ì„œ ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´/ì¼ë°˜íƒœê·¸ë¥¼ ë¶„ë¦¬í•˜ì—¬ ì „ë‹¬
                    const currentTags = plannedTags.split(",").map(t => t.trim()).filter(Boolean);
                    
                    const allMajor = [...MAJOR_GENRES, ...userMajorGenres];
                    const allSub = [...SUB_GENRES, ...userSubGenres];
                    
                    // ëŒ€ìž¥ë¥´ ê°ì§€
                    const majorTags = currentTags.filter(tag => 
                      allMajor.some(m => m.toLowerCase() === tag.toLowerCase())
                    ).map(tag => allMajor.find(m => m.toLowerCase() === tag.toLowerCase()) || tag);
                    
                    // ë¶€ìž¥ë¥´ ê°ì§€
                    const subTags = currentTags.filter(tag => 
                      allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                    ).map(tag => allSub.find(s => s.toLowerCase() === tag.toLowerCase()) || tag);
                    
                    // ì¼ë°˜ íƒœê·¸ (ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ ì œì™¸)
                    const generalTags = currentTags.filter(tag => 
                      !allMajor.some(m => m.toLowerCase() === tag.toLowerCase()) &&
                      !allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                    );
                    
                    // ë¶„ë¦¬ëœ ê°’ìœ¼ë¡œ ëª¨ë‹¬ ì—´ê¸°
                    openTagModal(
                      "plannedNew", 
                      generalTags, 
                      majorTags.length > 0 ? JSON.stringify(majorTags) : "",
                      subTags.length > 0 ? JSON.stringify(subTags) : "",
                      []
                    );
                  }}
                  style={{ paddingHorizontal: 12 }}
                />
              </View>
              {/* ì„ íƒëœ ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ ë°°ì§€ í‘œì‹œ */}
              {(() => {
                const currentTags = (plannedTags || "").split(",").map(t => t.trim()).filter(Boolean);
                const allMajor = [...MAJOR_GENRES, ...userMajorGenres];
                const allSub = [...SUB_GENRES, ...userSubGenres];
                
                const majorTags = currentTags.filter(tag => 
                  allMajor.some(m => m.toLowerCase() === tag.toLowerCase())
                );
                const subTags = currentTags.filter(tag => 
                  allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                );
                
                if (majorTags.length === 0 && subTags.length === 0) return null;
                
                return (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
                    {majorTags.map((g) => <GenreBadge key={g} genre={g} type="major" />)}
                    {subTags.map((g) => <GenreBadge key={g} genre={g} type="sub" />)}
                  </View>
                );
              })()}
              
              <Label style={{ marginTop: 10 }}>ìš°ì„ ìˆœìœ„</Label>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[1, 2, 3, 4, 5].map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPlannedPriority(p)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: plannedPriority === p ? "#8b5cf6" : C.chip,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ 
                      color: plannedPriority === p ? "#fff" : C.text, 
                      fontWeight: "700",
                      fontSize: 12,
                    }}>
                      {"â­".repeat(p)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Label style={{ marginTop: 10 }}>ì „ì²´ íšŒì°¨ ìˆ˜</Label>
              <Input 
                value={plannedTotalEpisodes} 
                onChangeText={setPlannedTotalEpisodes} 
                placeholder="ì˜ˆ: 120 (ëª¨ë¥´ë©´ ë¹„ì›Œë‘ì„¸ìš”)" 
                keyboardType="number-pad"
              />
              
              <Label style={{ marginTop: 10 }}>í‘œì§€ ì´ë¯¸ì§€</Label>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {plannedCoverImage ? (
                  <ExpoImage
                    source={{ uri: plannedCoverImage }}
                    style={{ width: 50, height: 70, borderRadius: 6 }}
                    contentFit="cover"
                  />
                ) : (
                  <View style={{ width: 50, height: 70, borderRadius: 6, backgroundColor: C.line, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: C.sub, fontSize: 10 }}>ì—†ìŒ</Text>
                  </View>
                )}
                <OutlineButton title="URL" onPress={() => openUrlModal(setPlannedCoverImage)} style={{ minWidth: 60 }} />
                <OutlineButton title="ê°¤ëŸ¬ë¦¬" onPress={() => pickImageFromGallery(setPlannedCoverImage)} style={{ minWidth: 70 }} />
                <OutlineButton 
                  title="ë¼ì´ë¸ŒëŸ¬ë¦¬" 
                  onPress={() => {
                    setCoverSelectTarget("planned");
                    setCoverSelectModalOpen(true);
                  }} 
                  color={C.primary}
                  style={{ minWidth: 90 }}
                />
                {plannedCoverImage && (
                  <OutlineButton 
                    title="ì‚­ì œ" 
                    onPress={() => setPlannedCoverImage("")} 
                    color={C.warn}
                    style={{ minWidth: 60 }}
                  />
                )}
              </View>
              
              <Label style={{ marginTop: 10 }}>ë©”ëª¨</Label>
              <Input 
                value={plannedNote} 
                onChangeText={setPlannedNote} 
                placeholder="ê´€ì‹¬ ê°–ê²Œ ëœ ì´ìœ , ì¶”ì²œë°›ì€ ê³³ ë“±" 
                multiline
              />
              
              <PrimaryButton
                title="ì˜ˆì • ìž‘í’ˆ ì¶”ê°€"
                onPress={addPlannedNovel}
                style={{ marginTop: 12 }}
              />
            </Section>
            
            {/* ê²€ìƒ‰ ë° ì •ë ¬ */}
            <Section title="ê²€ìƒ‰ / ì •ë ¬">
              <Input
                value={plannedQuery}
                onChangeText={setPlannedQuery}
                placeholder="ì œëª©/ìž‘ê°€/íƒœê·¸/ë©”ëª¨ ê²€ìƒ‰"
              />
              
              {/* ðŸ†• v3.4.2: í”Œëž«í¼ í•„í„° */}
              <Label style={{ marginTop: 10 }}>ì—°ìž¬ì²˜</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <Chip 
                  label="ì „ì²´" 
                  active={plannedFilterPlatform === "ALL"} 
                  onPress={() => setPlannedFilterPlatform("ALL")} 
                />
                {PLATFORM_OPTIONS.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    active={plannedFilterPlatform === p}
                    onPress={() => setPlannedFilterPlatform(p)}
                  />
                ))}
              </View>
              
              <Label style={{ marginTop: 10 }}>ì •ë ¬</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {[
                  ["ë“±ë¡ìˆœ", "created"],
                  ["ì œëª©", "title"],
                  ["ìš°ì„ ìˆœìœ„", "priority"],
                ].map(([label, key]) => (
                  <Chip
                    key={key}
                    label={label}
                    active={plannedSortKey === key}
                    onPress={() => setPlannedSortKey(key)}
                  />
                ))}
                <TouchableOpacity
                  onPress={() => setPlannedSortDir(prev => prev === "DESC" ? "ASC" : "DESC")}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: C.line,
                  }}
                >
                  <Text style={{ color: C.sub, fontWeight: "700" }}>
                    {plannedSortDir === "DESC" ? "â†“ ë‚´ë¦¼ì°¨ìˆœ" : "â†‘ ì˜¤ë¦„ì°¨ìˆœ"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Section>
            
            {/* ì˜ˆì • ìž‘í’ˆ ëª©ë¡ */}
            <Section title={`ì˜ˆì • ëª©ë¡ (${(() => {
              // ðŸ†• v3.4.2: í•„í„°ë§ëœ ìˆ˜ í‘œì‹œ
              let filtered = plannedList;
              const q = (plannedQuery || "").toLowerCase().trim();
              if (q) {
                filtered = filtered.filter(n => {
                  const bank = [n.title, n.author, n.tags, n.note].join(" ").toLowerCase();
                  return bank.includes(q);
                });
              }
              if (plannedFilterPlatform !== "ALL") {
                filtered = filtered.filter(n => parsePlatforms(n.platforms).includes(plannedFilterPlatform));
              }
              return filtered.length;
            })()}ìž‘)`}>
              {(() => {
                const q = (plannedQuery || "").toLowerCase().trim();
                let filtered = plannedList;
                
                // ðŸ†• v3.4.2: ê²€ìƒ‰ í•„í„°
                if (q) {
                  filtered = filtered.filter(n => {
                    const bank = [n.title, n.author, n.tags, n.note].join(" ").toLowerCase();
                    return bank.includes(q);
                  });
                }
                
                // ðŸ†• v3.4.2: í”Œëž«í¼ í•„í„°
                if (plannedFilterPlatform !== "ALL") {
                  filtered = filtered.filter(n => parsePlatforms(n.platforms).includes(plannedFilterPlatform));
                }
                
                // ì •ë ¬ ì ìš©
                const sorted = [...filtered].sort((a, b) => {
                  const dir = plannedSortDir === "DESC" ? -1 : 1;
                  if (plannedSortKey === "title") {
                    return dir * (a.title || "").localeCompare(b.title || "");
                  } else if (plannedSortKey === "priority") {
                    const pa = Number(a.priority) || 3;
                    const pb = Number(b.priority) || 3;
                    if (pa !== pb) return dir * (pb - pa);
                    return (b.created_at || 0) - (a.created_at || 0);
                  }
                  return dir * ((b.created_at || 0) - (a.created_at || 0));
                });
                
                if (sorted.length === 0) {
                  return (
                    <Text style={{ color: C.sub, textAlign: "center", padding: 20 }}>
                      {plannedQuery || plannedFilterPlatform !== "ALL" ? "ê²€ìƒ‰ ê²°ê³¼ê°€ ì—†ìŠµë‹ˆë‹¤." : "ì˜ˆì • ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.\nìœ„ì—ì„œ ì¶”ê°€í•´ë³´ì„¸ìš”!"}
                    </Text>
                  );
                }
                
                // ðŸ†• v3.4.2: FlatListë¡œ ì„±ëŠ¥ ìµœì í™”
                return (
                  <FlatList
                    data={sorted}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={5}
                    windowSize={3}
                    renderItem={({ item, index }) => {
                      const plats = parsePlatforms(item.platforms);
                      
                      return (
                        <TouchableOpacity
                          onPress={() => {
                            setPlannedEditItem({ ...item });
                            setPlannedEditOpen(true);
                          }}
                          onLongPress={() => Alert.alert(item.title, item.note || "(ë©”ëª¨ ì—†ìŒ)")}
                          style={{
                            padding: 14,
                            backgroundColor: C.card,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: C.line,
                            marginBottom: 10,
                          }}
                        >
                          {/* ìƒë‹¨: í‘œì§€ + ì •ë³´ */}
                          <View style={{ flexDirection: "row" }}>
                            <CoverImage 
                              uri={item.cover_image} 
                              platforms={item.platforms} 
                              platformCovers={platformCovers} 
                              size={60} 
                              theme={C} 
                            />
                            <View style={{ flex: 1 }}>
                              {/* ì œëª© + ìš°ì„ ìˆœìœ„ + ë§í¬ */}
                              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <Text style={{ fontWeight: "800", fontSize: 15, flex: 1, color: C.text }} numberOfLines={2}>
                                  {index + 1}. {item.title}
                                </Text>
                                <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
                                  {/* ðŸ†• v3.4.2: ë§í¬ ë°”ë¡œê°€ê¸° */}
                                  {item.link && (
                                    <TouchableOpacity
                                      onPress={() => Linking.openURL(item.link)}
                                      style={{ marginRight: 6, padding: 2 }}
                                    >
                                      <Text style={{ fontSize: 14 }}>ðŸ”—</Text>
                                    </TouchableOpacity>
                                  )}
                                  <View style={{ 
                                    backgroundColor: "#8b5cf6", 
                                    paddingHorizontal: 8, 
                                    paddingVertical: 2, 
                                    borderRadius: 999,
                                  }}>
                                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>
                                      {"â­".repeat(item.priority || 3)}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                              
                              {/* ìž‘ê°€ Â· í”Œëž«í¼ Â· íšŒì°¨ */}
                              <Text style={{ color: C.sub, marginTop: 4, fontSize: 13 }} numberOfLines={1}>
                                {item.author || "ìž‘ê°€ ë¯¸ìƒ"} Â· {plats.length ? plats.join(", ") : "-"}
                                {item.total_episodes > 0 && ` Â· ${item.total_episodes}í™”`}
                              </Text>
                              
                              {/* ë©”ëª¨ */}
                              {item.note && (
                                <Text style={{ color: C.sub, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                                  ðŸ“ {item.note}
                                </Text>
                              )}
                            </View>
                          </View>
                          
                          {/* ë²„íŠ¼ */}
                          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                            <PrimaryButton
                              title="ðŸ“¥ ë“±ë¡ì „í™˜"
                              onPress={() => convertPlannedToNovel(item)}
                              style={{ flex: 1, backgroundColor: "#8b5cf6", paddingVertical: 10 }}
                            />
                            <OutlineButton
                              title="ì‚­ì œ"
                              onPress={() => removePlannedNovel(item.id)}
                              color={C.warn}
                              style={{ flex: 0.5 }}
                            />
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                );
              })()}
            </Section>
          </>
        )}

        {/* ðŸ“° RECENT - v3.0 ìµœì‹  ë³€í™” */}
        {screen === "recent" && (
          <>
            <H>ðŸ“° ìµœì‹  ë³€í™”</H>
            
            {/* ì„¤ì • ë° ì‚­ì œ */}
            <Section title="âš™ï¸ ì„¤ì •">
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ color: C.text, fontWeight: "700" }}>ê¸°ë¡ ìœ ì§€ ê¸°ê°„</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TextInput
                    value={String(appSettings.recentChanges?.retentionDays || 30)}
                    onChangeText={(v) => {
                      const days = parseInt(v) || 30;
                      saveAppSettings({ 
                        recentChanges: { 
                          ...DEFAULT_SETTINGS.recentChanges, 
                          ...appSettings.recentChanges, 
                          retentionDays: Math.max(1, Math.min(365, days))
                        }
                      });
                    }}
                    keyboardType="number-pad"
                    style={{
                      backgroundColor: C.card,
                      borderWidth: 1,
                      borderColor: C.line,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      width: 70,
                      textAlign: "center",
                      color: C.text,
                      marginRight: 8,
                    }}
                  />
                  <Text style={{ color: C.sub }}>ì¼</Text>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={clearRecentChanges}
                style={{
                  backgroundColor: "#fef2f2",
                  borderWidth: 1,
                  borderColor: "#fecaca",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#dc2626", fontWeight: "700" }}>ðŸ—‘ï¸ ìµœì‹  ë³€í™” ê¸°ë¡ ì „ì²´ ì‚­ì œ</Text>
              </TouchableOpacity>
            </Section>
            
            {/* ë³€í™” ëª©ë¡ - ìž‘í’ˆë³„ ê·¸ë£¹í•‘ */}
            <Section title={`ðŸ“‹ ìµœê·¼ ë³€í™” (${(() => {
              const retentionDays = appSettings.recentChanges?.retentionDays || 30;
              const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
              return recentChanges.filter(c => c.timestamp > cutoff).length;
            })()}ê±´)`}>
              {(() => {
                const retentionDays = appSettings.recentChanges?.retentionDays || 30;
                const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
                const validChanges = recentChanges.filter(c => c.timestamp > cutoff);
                
                if (validChanges.length === 0) {
                  return (
                    <View style={{ padding: 40, alignItems: "center" }}>
                      <Text style={{ fontSize: 48, marginBottom: 16 }}>ðŸ“­</Text>
                      <Text style={{ color: C.sub, textAlign: "center", lineHeight: 22 }}>
                        ìµœê·¼ {retentionDays}ì¼ê°„ ë³€í™”ê°€ ì—†ìŠµë‹ˆë‹¤.{"\n\n"}
                        ìž‘í’ˆ ë“±ë¡, ìˆ˜ìƒ, í‹°ì–´ ë³€í™”, ì½ì€ íšŒì°¨ìˆ˜ ì¦ê°€ ë“±{"\n"}
                        ë³€í™”ê°€ ìƒê¸°ë©´ ì—¬ê¸°ì— í‘œì‹œë©ë‹ˆë‹¤.
                      </Text>
                    </View>
                  );
                }
                
                // ðŸ“° v3.0.2: ìž‘í’ˆë³„ ê·¸ë£¹í•‘ (ë‚ ì§œ â†’ ìž‘í’ˆ â†’ íƒ€ìž…ë³„ ë³€í™” ë¬¶ê¸°)
                // 1) ë‚ ì§œë³„ ê·¸ë£¹í•‘
                const byDate = {};
                for (const change of validChanges) {
                  const date = new Date(change.timestamp).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
                  if (!byDate[date]) byDate[date] = [];
                  byDate[date].push(change);
                }
                
                // 2) ê° ë‚ ì§œ ë‚´ì—ì„œ ìž‘í’ˆë³„ë¡œ ë‹¤ì‹œ ê·¸ë£¹í•‘
                const groupedByDateAndNovel = {};
                for (const [date, changes] of Object.entries(byDate)) {
                  const byNovel = {};
                  for (const c of changes) {
                    const key = c.novelId || c.novelTitle || "unknown";
                    if (!byNovel[key]) {
                      byNovel[key] = {
                        novelId: c.novelId,
                        novelTitle: c.novelTitle,
                        changes: [],
                        latestTimestamp: c.timestamp,
                      };
                    }
                    byNovel[key].changes.push(c);
                    if (c.timestamp > byNovel[key].latestTimestamp) {
                      byNovel[key].latestTimestamp = c.timestamp;
                    }
                  }
                  // ìµœì‹  ìˆœìœ¼ë¡œ ì •ë ¬
                  groupedByDateAndNovel[date] = Object.values(byNovel).sort(
                    (a, b) => b.latestTimestamp - a.latestTimestamp
                  );
                }
                
                const typeConfig = {
                  new: { icon: "ðŸ†•", label: "ì‹ ê·œ ë“±ë¡", color: "#10b981", bg: "#d1fae5" },
                  award: { icon: "ðŸ†", label: "ìˆ˜ìƒ", color: "#f59e0b", bg: "#fef3c7" },
                  tier_change: { icon: "ðŸ“Š", label: "í‹°ì–´ ë³€í™”", color: "#8b5cf6", bg: "#ede9fe" },
                  tier_review: { icon: "âœ…", label: "í‹°ì–´ ì‹¬ì‚¬", color: "#3b82f6", bg: "#dbeafe" },
                  read_count: { icon: "ðŸ“–", label: "ì½ìŒ ì¦ê°€", color: "#06b6d4", bg: "#cffafe" },
                  title_change: { icon: "âœï¸", label: "ì œëª© ë³€ê²½", color: "#ec4899", bg: "#fce7f3" },
                  auto_tier: { icon: "âš¡", label: "ìžë™ í‹°ì–´", color: "#6366f1", bg: "#e0e7ff" },
                };
                
                // ë‚ ì§œìˆœ ì •ë ¬ (ìµœì‹ ìˆœ)
                const sortedDates = Object.keys(groupedByDateAndNovel).sort((a, b) => {
                  const dateA = byDate[a]?.[0]?.timestamp || 0;
                  const dateB = byDate[b]?.[0]?.timestamp || 0;
                  return dateB - dateA;
                });
                
                return sortedDates.map((date) => (
                  <View key={date} style={{ marginBottom: 20 }}>
                    {/* ë‚ ì§œ í—¤ë” */}
                    <View style={{ 
                      flexDirection: "row", 
                      alignItems: "center", 
                      marginBottom: 12,
                      paddingBottom: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: C.line,
                    }}>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: C.text }}>
                        ðŸ“… {date}
                      </Text>
                      <View style={{ 
                        backgroundColor: C.primary, 
                        borderRadius: 999, 
                        paddingHorizontal: 8, 
                        paddingVertical: 2,
                        marginLeft: 8,
                      }}>
                        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                          {groupedByDateAndNovel[date].length}ìž‘í’ˆ
                        </Text>
                      </View>
                    </View>
                    
                    {/* ìž‘í’ˆë³„ ì¹´ë“œ */}
                    {groupedByDateAndNovel[date].map((novelGroup) => {
                      // ê°™ì€ íƒ€ìž…ì˜ ë³€í™”ë“¤ì„ ë¬¶ê¸°
                      const changesByType = {};
                      for (const c of novelGroup.changes) {
                        const type = c.type || "unknown";
                        if (!changesByType[type]) changesByType[type] = [];
                        changesByType[type].push(c);
                      }
                      
                      const typeOrder = ["new", "title_change", "award", "tier_review", "tier_change", "auto_tier", "read_count"];
                      const sortedTypes = Object.keys(changesByType).sort(
                        (a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b)
                      );
                      
                      return (
                        <View
                          key={novelGroup.novelId || novelGroup.novelTitle}
                          style={{
                            backgroundColor: C.card,
                            borderRadius: 14,
                            padding: 14,
                            marginBottom: 10,
                            borderWidth: 1,
                            borderColor: C.line,
                            shadowColor: "#000",
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                            elevation: 2,
                          }}
                        >
                          {/* ìž‘í’ˆ ì œëª© í—¤ë” + í‘œì§€ */}
                          <View style={{ 
                            flexDirection: "row", 
                            alignItems: "center", 
                            marginBottom: 10,
                            paddingBottom: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: C.line,
                          }}>
                            {/* ðŸ”§ v3.4.4: í‘œì§€ ì´ë¯¸ì§€ ì¶”ê°€ */}
                            {(() => {
                              const novel = novelGroup.novelId 
                                ? list.find(n => n.id === novelGroup.novelId) 
                                : null;
                              return novel ? (
                                <CoverImage
                                  uri={novel.cover_image}
                                  platforms={novel.platforms}
                                  platformCovers={platformCovers}
                                  size={36}
                                  theme={C}
                                />
                              ) : (
                                <View style={{ 
                                  width: 36, 
                                  height: 36 * 1.4, 
                                  borderRadius: 6, 
                                  marginRight: 10,
                                  backgroundColor: C.line,
                                  justifyContent: 'center',
                                  alignItems: 'center'
                                }}>
                                  <Text style={{ fontSize: 12, color: C.sub }}>ðŸ“–</Text>
                                </View>
                              );
                            })()}
                            <Text style={{ 
                              fontWeight: "800", 
                              fontSize: 16, 
                              color: C.text,
                              flex: 1,
                            }} numberOfLines={1}>
                              {novelGroup.novelTitle}
                            </Text>
                            <View style={{
                              backgroundColor: C.chip,
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 8,
                            }}>
                              <Text style={{ fontSize: 11, color: C.sub, fontWeight: "600" }}>
                                {novelGroup.changes.length}ê±´
                              </Text>
                            </View>
                          </View>
                          
                          {/* íƒ€ìž…ë³„ ë³€í™” ëª©ë¡ */}
                          {sortedTypes.map((type) => {
                            const changes = changesByType[type];
                            const config = typeConfig[type] || typeConfig.new;
                            
                            // ê°™ì€ íƒ€ìž… ë³€í™”ë“¤ ìš”ì•½
                            let summaryText = "";
                            if (type === "tier_change" || type === "tier_review" || type === "auto_tier") {
                              // í‹°ì–´ ë³€í™”: ìµœì´ˆ â†’ ìµœì¢… í‘œì‹œ
                              if (changes.length === 1) {
                                summaryText = `${changes[0].details?.from || "?"} â†’ ${changes[0].details?.to || "?"}`;
                              } else {
                                const first = changes[changes.length - 1]; // ê°€ìž¥ ì˜¤ëž˜ëœ
                                const last = changes[0]; // ê°€ìž¥ ìµœê·¼
                                summaryText = `${first.details?.from || "?"} â†’ ${last.details?.to || "?"} (${changes.length}íšŒ ë³€ë™)`;
                              }
                            } else if (type === "read_count") {
                              // ì½ìŒ ì¦ê°€: ì´ ì¦ê°€ëŸ‰
                              const totalDelta = changes.reduce((sum, c) => sum + (c.details?.delta || 0), 0);
                              const first = changes[changes.length - 1];
                              const last = changes[0];
                              summaryText = `+${totalDelta}í™” (${first.details?.from || 0}â†’${last.details?.to || 0})`;
                            } else if (type === "award") {
                              // ìˆ˜ìƒ: ëª¨ë“  ìˆ˜ìƒ ë‚˜ì—´
                              summaryText = changes.map(c => c.details?.awardName || "ìˆ˜ìƒ").join(", ");
                            } else if (type === "new") {
                              summaryText = `${changes[0].details?.author || "-"} Â· ${changes[0].details?.majorGenre || "-"}`;
                            } else if (type === "title_change") {
                              if (changes.length === 1) {
                                summaryText = `"${changes[0].details?.from || "?"}" â†’ "${changes[0].details?.to || "?"}"`; 
                              } else {
                                const first = changes[changes.length - 1];
                                const last = changes[0];
                                summaryText = `"${first.details?.from || "?"}" â†’ "${last.details?.to || "?"}" (${changes.length}íšŒ)`;
                              }
                            }
                            
                            const time = new Date(changes[0].timestamp).toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                            
                            return (
                              <View
                                key={type}
                                style={{
                                  backgroundColor: config.bg,
                                  borderRadius: 10,
                                  padding: 10,
                                  marginBottom: 6,
                                  flexDirection: "row",
                                  alignItems: "center",
                                }}
                              >
                                <Text style={{ fontSize: 20, marginRight: 10 }}>{config.icon}</Text>
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <View style={{ 
                                      backgroundColor: config.color, 
                                      paddingHorizontal: 6, 
                                      paddingVertical: 2, 
                                      borderRadius: 4,
                                      marginRight: 6,
                                    }}>
                                      <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
                                        {config.label}
                                      </Text>
                                    </View>
                                    <Text style={{ color: "#6b7280", fontSize: 10 }}>{time}</Text>
                                  </View>
                                  {summaryText && (
                                    <Text style={{ color: "#374151", fontSize: 12, marginTop: 3 }} numberOfLines={2}>
                                      {summaryText}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                ));
              })()}
            </Section>
          </>
        )}

        {/* ðŸ† AWARDS - v2.9 */}
        {screen === "awards" && (
          <AwardsScreen
            list={list}
            awardSystemSettings={awardSystemSettings}
            setAwardSystemSettings={setAwardSystemSettings}
            awardSelectedYear={awardSelectedYear}
            setAwardSelectedYear={setAwardSelectedYear}
            awardSubTab={awardSubTab}
            setAwardSubTab={setAwardSubTab}
            awardFilter={awardFilter}
            setAwardFilter={setAwardFilter}
            theme={C}
            onGiveAward={async (novelId, awardId, year) => {
              // ìˆ˜ìƒ ë¶€ì—¬
              const novel = list.find(n => n.id === novelId);
              if (!novel) return;
              
              let currentAwards = [];
              try {
                currentAwards = JSON.parse(novel.awards || "[]");
              } catch { currentAwards = []; }
              
              // ì¤‘ë³µ ì²´í¬
              const exists = currentAwards.some(a => a.year === Number(year) && a.type === awardId);
              if (exists) {
                Alert.alert("ì•Œë¦¼", "ì´ë¯¸ í•´ë‹¹ ìˆ˜ìƒì´ ë¶€ì—¬ë˜ì–´ ìžˆìŠµë‹ˆë‹¤.");
                return;
              }
              
              currentAwards.push({ year: Number(year), type: awardId });
              const newAwardsJson = JSON.stringify(currentAwards);
              
              await exec("UPDATE novels SET awards=? WHERE id=?", [newAwardsJson, novelId]);
              await loadList();
              
              // ðŸ“° v3.0: ìˆ˜ìƒ ê¸°ë¡
              const yearAwards = awardSystemSettings.yearlyAwards?.[year] || [];
              const awardMeta = yearAwards.find(a => a.id === awardId);
              const awardName = awardMeta ? `${awardMeta.icon || "ðŸ†"} ${awardMeta.name}` : awardId;
              await addRecentChange(novelId, novel.title, "award", {
                awardId,
                awardName,
                year
              });
              
              Alert.alert("ðŸ† ìˆ˜ìƒ ì™„ë£Œ!", `${novel.title}ì— ìˆ˜ìƒì´ ë¶€ì—¬ë˜ì—ˆìŠµë‹ˆë‹¤.`);
            }}
            onRemoveAward={async (novelId, awardId, year) => {
              // ìˆ˜ìƒ ì œê±°
              const novel = list.find(n => n.id === novelId);
              if (!novel) return;
              
              let currentAwards = [];
              try {
                currentAwards = JSON.parse(novel.awards || "[]");
              } catch { currentAwards = []; }
              
              const newAwards = currentAwards.filter(a => !(a.year === Number(year) && a.type === awardId));
              const newAwardsJson = JSON.stringify(newAwards);
              
              await exec("UPDATE novels SET awards=? WHERE id=?", [newAwardsJson, novelId]);
              await loadList();
            }}
            onSaveSettings={async (settings) => {
              setAwardSystemSettings(settings);
              await setAppMeta("award_system_settings", settings);
            }}
          />
        )}

        {/* MATCH */}
        {screen === "match" && (
          <>
            <H>ìžë™ ë§¤ì¹­(ë¯¸ëŒ€ì „ ìš°ì„  Â· ëžœë¤)</H>

            {/* ë§¤ì¹­ ì§„í–‰ë„ */}
            <Section title="ë§¤ì¹­ ì§„í–‰ë„">
              <Text style={{ color: C.sub, marginBottom: 6 }}>
                {matchStats.total === 0
                  ? "ë§¤ì¹­ ê°€ëŠ¥í•œ ì¡°í•©ì´ ì—†ìŠµë‹ˆë‹¤. ìž‘í’ˆì„ 2ê°œ ì´ìƒ ë“±ë¡í•˜ì„¸ìš”."
                  : `${matchStats.done} / ${matchStats.total} ì¡°í•© ë§¤ì¹­ (${matchStats.percent}%)`}
              </Text>
              <View
                style={{
                  height: 10,
                  backgroundColor: "#eef2ff",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${matchStats.percent}%`,
                    height: "100%",
                    backgroundColor: C.primary,
                  }}
                />
              </View>
              
              {/* ðŸ”„ v3.4.7: ë§¤ì¹­ í ì²˜ë¦¬ ì¤‘ í‘œì‹œ */}
              {(matchQueueStatus.processing || matchQueueStatus.pending > 0) && (
                <View style={{ 
                  flexDirection: "row", 
                  alignItems: "center", 
                  marginTop: 10,
                  backgroundColor: "#fef3c7",
                  padding: 8,
                  borderRadius: 8,
                }}>
                  <ActivityIndicator size="small" color="#f59e0b" style={{ marginRight: 8 }} />
                  <Text style={{ color: "#92400e", fontWeight: "600" }}>
                    ë§¤ì¹­ ì²˜ë¦¬ ì¤‘... {matchQueueStatus.pending > 0 ? `(ëŒ€ê¸°: ${matchQueueStatus.pending}ê±´)` : ""}
                  </Text>
                </View>
              )}
            </Section>

            <Section title="ðŸŽ¯ ìžë™ ìŠ¹íŒ¨ ì‹œìŠ¤í…œ">
              {/* ë©”ì¸ í† ê¸€ */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: C.text }}>ìžë™ ìŠ¹íŒ¨ í™œì„±í™”</Text>
                  <Text style={{ color: C.sub, fontSize: 11 }}>ì„¤ì •í•œ ê¸°ì¤€ì— ë”°ë¼ ìžë™ìœ¼ë¡œ ìŠ¹íŒ¨ ê²°ì •</Text>
                </View>
                <Switch value={autoEnabled} onValueChange={setAutoEnabled} />
              </View>
              
              {autoEnabled && (
                <>
                  {/* íŒì • ëª¨ë“œ */}
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                    <TouchableOpacity
                      onPress={() => saveAutoMatchSettings({ mode: "any" })}
                      style={{
                        flex: 1,
                        backgroundColor: autoMatchSettings.mode === "any" ? "#dbeafe" : C.chip,
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: autoMatchSettings.mode === "any" ? 2 : 1,
                        borderColor: autoMatchSettings.mode === "any" ? "#3b82f6" : C.line,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontWeight: "700", color: autoMatchSettings.mode === "any" ? "#1d4ed8" : C.text }}>
                        í•˜ë‚˜ë¼ë„ ë§Œì¡±
                      </Text>
                      <Text style={{ fontSize: 10, color: C.sub }}>OR ì¡°ê±´</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => saveAutoMatchSettings({ mode: "all" })}
                      style={{
                        flex: 1,
                        backgroundColor: autoMatchSettings.mode === "all" ? "#dcfce7" : C.chip,
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: autoMatchSettings.mode === "all" ? 2 : 1,
                        borderColor: autoMatchSettings.mode === "all" ? "#22c55e" : C.line,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontWeight: "700", color: autoMatchSettings.mode === "all" ? "#166534" : C.text }}>
                        ëª¨ë‘ ë§Œì¡±
                      </Text>
                      <Text style={{ fontSize: 10, color: C.sub }}>AND ì¡°ê±´</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* ðŸ”§ v3.4.7: ì²˜ë¦¬ ì†ë„ */}
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>ì²˜ë¦¬ ì†ë„</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                    {[
                      { key: "fast", label: "í„°ë³´", desc: "ìµœëŒ€ ì†ë„", color: "#ef4444", bgColor: "#fef2f2" },
                      { key: "normal", label: "ë³´í†µ", desc: "100ms", color: "#f59e0b", bgColor: "#fffbeb" },
                      { key: "slow", label: "ëŠë¦¼", desc: "500ms", color: "#22c55e", bgColor: "#f0fdf4" },
                    ].map(opt => (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => saveAutoMatchSettings({ speed: opt.key })}
                        style={{
                          flex: 1,
                          backgroundColor: (autoMatchSettings.speed || "fast") === opt.key ? opt.bgColor : C.chip,
                          padding: 10,
                          borderRadius: 10,
                          borderWidth: (autoMatchSettings.speed || "fast") === opt.key ? 2 : 1,
                          borderColor: (autoMatchSettings.speed || "fast") === opt.key ? opt.color : C.line,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontWeight: "700", color: (autoMatchSettings.speed || "fast") === opt.key ? opt.color : C.text }}>
                          {opt.label}
                        </Text>
                        <Text style={{ fontSize: 10, color: C.sub }}>{opt.desc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {/* ì„¸ë¶€ ì„¤ì • í† ê¸€ */}
                  <TouchableOpacity
                    onPress={() => setAutoSettingsExpanded(!autoSettingsExpanded)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: C.bg,
                      padding: 12,
                      borderRadius: 10,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontWeight: "700", color: C.text }}>
                      ðŸ“‹ ê¸°ì¤€ ì„¤ì • ({Object.values(autoMatchSettings.criteria).filter(c => c.enabled).length}ê°œ í™œì„±)
                    </Text>
                    <Text style={{ color: C.sub }}>{autoSettingsExpanded ? "â–²" : "â–¼"}</Text>
                  </TouchableOpacity>
                  
                  {/* ì„¸ë¶€ ê¸°ì¤€ ì„¤ì • */}
                  {autoSettingsExpanded && (
                    <View style={{ backgroundColor: C.bg, borderRadius: 12, padding: 12, marginBottom: 8 }}>
                      {Object.entries(autoMatchSettings.criteria).map(([key, config]) => (
                        <View 
                          key={key} 
                          style={{ 
                            flexDirection: "row", 
                            alignItems: "center", 
                            paddingVertical: 10,
                            borderBottomWidth: key !== "matchCountDiff" ? 1 : 0,
                            borderBottomColor: C.line,
                          }}
                        >
                          {/* í™œì„±í™” í† ê¸€ */}
                          <Switch
                            value={config.enabled}
                            onValueChange={() => toggleAutoCriterion(key)}
                            style={{ transform: [{ scale: 0.8 }] }}
                          />
                          
                          {/* ê¸°ì¤€ ì„¤ëª… */}
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={{ 
                              fontWeight: "600", 
                              color: config.enabled ? C.text : C.sub,
                              fontSize: 13,
                            }}>
                              {config.desc}
                            </Text>
                            <Text style={{ color: C.sub, fontSize: 10 }}>
                              {key === "ratingGap" && "ë†’ì€ ìª½ ìŠ¹ë¦¬"}
                              {key === "predictionRate" && "ì˜ˆì¸¡ ìŠ¹ë¥  ë†’ì€ ìª½ ìŠ¹ë¦¬"}
                              {key === "h2hStreak" && "ì—°ìŠ¹ ê¸°ë¡ ìžˆëŠ” ìª½ ìŠ¹ë¦¬"}
                              {key === "tierDiff" && "ë†’ì€ í‹°ì–´ ìŠ¹ë¦¬"}
                              {key === "winRateDiff" && "ìŠ¹ë¥  ë†’ì€ ìª½ ìŠ¹ë¦¬"}
                              {key === "readRatioDiff" && "ë§Žì´ ì½ì€ ìª½ ìŠ¹ë¦¬"}
                              {key === "matchCountDiff" && "ë§¤ì¹­ ë§Žì€ ìª½ ìŠ¹ë¦¬"}
                            </Text>
                          </View>
                          
                          {/* ìž„ê³„ê°’ ìž…ë ¥ */}
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ color: C.sub, fontSize: 11, marginRight: 4 }}>â‰¥</Text>
                            <TextInput
                              value={String(config.threshold || 0)}
                              onChangeText={(v) => setAutoCriterionThreshold(key, v)}
                              keyboardType="number-pad"
                              editable={config.enabled}
                              style={{
                                backgroundColor: config.enabled ? C.card : C.bg,
                                borderWidth: 1,
                                borderColor: C.line,
                                borderRadius: 6,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                width: 60,
                                textAlign: "center",
                                fontSize: 13,
                                color: config.enabled ? C.text : C.sub,
                              }}
                            />
                          </View>
                        </View>
                      ))}
                      
                      {/* ì•ˆë‚´ */}
                      <View style={{ marginTop: 12, padding: 10, backgroundColor: C.card, borderRadius: 8 }}>
                        <Text style={{ color: C.sub, fontSize: 11, lineHeight: 16 }}>
                          ðŸ’¡ ê° ê¸°ì¤€ì˜ ìž„ê³„ê°’ ì´ìƒ ì°¨ì´ê°€ ë‚˜ë©´ í•´ë‹¹ ê¸°ì¤€ ì¶©ì¡±{"\n"}
                          â€¢ ì˜ˆì¸¡ ìŠ¹ë¥ /ìŠ¹ë¥ : % ë‹¨ìœ„ (75 = 75%){"\n"}
                          â€¢ í‹°ì–´ ì°¨ì´: ë‹¨ê³„ ìˆ˜ (2 = 2í‹°ì–´ ì°¨ì´, Sâ†”B-){"\n"}
                          â€¢ ì§ì ‘ëŒ€ê²°: ì—°ì† ìŠ¹ë¦¬ íšŸìˆ˜
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {/* í˜„ìž¬ ë§¤ì¹­ ìžë™íŒì • ë¯¸ë¦¬ë³´ê¸° */}
                  {pair && (
                    <View style={{ backgroundColor: "#fef3c7", padding: 10, borderRadius: 10, marginTop: 4 }}>
                      <Text style={{ fontWeight: "700", color: "#92400e", marginBottom: 4 }}>
                        ðŸ” í˜„ìž¬ ë§¤ì¹­ ìžë™íŒì • ë¯¸ë¦¬ë³´ê¸°
                      </Text>
                      {(() => {
                        const result = evaluateAutoMatch(pair.A, pair.B, matchAnalysis);
                        if (!result) {
                          return <Text style={{ color: "#92400e", fontSize: 12 }}>ê¸°ì¤€ ë¯¸ì¶©ì¡± - ìˆ˜ë™ ê²°ì • í•„ìš”</Text>;
                        }
                        return (
                          <>
                            <Text style={{ color: "#166534", fontWeight: "600" }}>
                              ì˜ˆìƒ ìŠ¹ìž: {result.winner.title}
                            </Text>
                            <Text style={{ color: "#92400e", fontSize: 11 }}>
                              ì¶©ì¡± ê¸°ì¤€: {result.reasons.map(r => autoMatchSettings.criteria[r.criterion]?.desc).join(", ")}
                            </Text>
                          </>
                        );
                      })()}
                    </View>
                  )}
                </>
              )}
              
              <OutlineButton
                title="ë§ˆì§€ë§‰ ë§¤ì¹­ ë˜ëŒë¦¬ê¸°"
                onPress={undoLastMatch}
                style={{ marginTop: 12 }}
              />
            </Section>

            <Section title="íŠ¹ì • ìž‘í’ˆ ê³ ì • ë§¤ì¹­ (ì„ íƒ)">
              <Text style={{ color: C.sub, marginBottom: 6 }}>
                ì•„ëž˜ì—ì„œ ìž‘í’ˆì„ ì„ íƒí•˜ë©´, í•´ë‹¹ ìž‘í’ˆì´ í¬í•¨ëœ ë¯¸ëŒ€ì „ ë§¤ì¹­ë§Œ ìƒì„±ë©ë‹ˆë‹¤.
              </Text>
              {focusMatchNovel ? (
                <View
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: C.line,
                    backgroundColor: C.card,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontWeight: "700", color: C.text }} numberOfLines={1}>
                    ê³ ì •: {focusMatchNovel.title}
                  </Text>
                  <Text style={{ color: C.sub, marginTop: 2 }} numberOfLines={1}>
                    {focusMatchNovel.author || "-"}
                  </Text>
                  <OutlineButton
                    title="ì„ íƒ í•´ì œ"
                    onPress={() => setFocusMatchNovel(null)}
                    style={{ marginTop: 6 }}
                  />
                </View>
              ) : (
                <Text style={{ color: C.sub, marginBottom: 8 }}>
                  í˜„ìž¬ ê³ ì •ëœ ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.
                </Text>
              )}

              <Label>ìž‘í’ˆ ê²€ìƒ‰</Label>
              <Input
                value={focusMatchQuery}
                onChangeText={setFocusMatchQuery}
                placeholder="ì œëª©/ìž‘ê°€ ì¼ë¶€ë¥¼ ìž…ë ¥í•˜ì„¸ìš”"
              />
              {focusMatchQuery.trim().length > 0 && (
                <View style={{ marginTop: 8 }}>
                  {focusMatchCandidates.length === 0 ? (
                    <Text style={{ color: C.sub }}>ê²€ìƒ‰ ê²°ê³¼ê°€ ì—†ìŠµë‹ˆë‹¤.</Text>
                  ) : (
                    focusMatchCandidates.slice(0, 10).map((n) => (
                      <TouchableOpacity
                        key={n.id}
                        onPress={() => {
                          setFocusMatchNovel(n);
                          setFocusMatchQuery("");
                        }}
                        style={{
                          paddingVertical: 8,
                          borderBottomWidth: 1,
                          borderBottomColor: C.line,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <CoverImage uri={n.cover_image} platforms={n.platforms} platformCovers={platformCovers} size={30} theme={C} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "700", color: C.text }} numberOfLines={1}>
                            {n.title}
                          </Text>
                          <Text style={{ color: C.sub, fontSize: 12 }} numberOfLines={1}>
                            {n.author || "-"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </Section>

            <Section title="ë§¤ì¹­">
              {!pair ? (
                <PrimaryButton
                  title="ë‹¤ìŒ ë§¤ì¹­"
                  onPress={pickRandomUnseenPair}
                />
              ) : (
                <>
                  {/* ìž‘í’ˆ A */}
                  <TouchableOpacity
                    onPress={() => decide(pair.A.id, "user")}
                    style={{
                      borderWidth: 3,
                      borderColor: C.ok,
                      backgroundColor: C.card,
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 6,
                    }}
                  >
                    <View style={{ flexDirection: "row" }}>
                      <CoverImage uri={pair.A.cover_image} platforms={pair.A.platforms} platformCovers={platformCovers} size={70} theme={C} />
                      <View style={{ flex: 1 }}>
                        {/* ì œëª© + í‹°ì–´ */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <Text style={{ fontSize: 16, fontWeight: "800", color: C.text, flex: 1 }} numberOfLines={1}>
                            {pair.A.title}
                          </Text>
                          <ActualTierTag novel={pair.A} />
                        </View>
                        
                        {/* ìž‘ê°€ Â· ìž¥ë¥´ + ìš°ì¸¡ ìƒíƒœ ì•„ì´ì½˜ */}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={{ color: C.text, fontSize: 13, flex: 1 }} numberOfLines={1}>
                            {pair.A.author || "ìž‘ê°€ ë¯¸ìƒ"}
                            {getFirstGenre(pair.A.major_genre) && <Text style={{ color: C.sub }}> Â· {getFirstGenre(pair.A.major_genre)}</Text>}
                            {getFirstGenre(pair.A.sub_genre) && <Text style={{ color: C.sub }}> Â· {getFirstGenre(pair.A.sub_genre)}</Text>}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
                            <StatusIcon status={pair.A.status} />
                            <WorkStatusIcon workStatus={pair.A.work_status} />
                            <GaidenStatusIcon gaidenStatus={pair.A.gaiden_status} />
                          </View>
                        </View>
                        
                        {/* ìŠ¤íƒ¯ */}
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={{ color: C.ok, fontWeight: "800", fontSize: 15 }}>
                            {pair.A.rating.toFixed(1)}
                          </Text>
                          <Text style={{ color: C.sub, fontSize: 12, marginLeft: 8 }}>
                            RD {Math.round(pair.A.rd)} Â· {pair.A.wins}W/{pair.A.losses}L Â· {getWinRate(pair.A.wins, pair.A.losses)}%
                          </Text>
                        </View>
                        
                        {/* ì½ì€ íšŒì°¨ */}
                        <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
                          ðŸ“– {pair.A.read_count}í™” ì½ìŒ
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* ðŸ”® v3.0.3: ìŠ¹ë¶€ì˜ˆì¸¡ íŒ¨ë„ */}
                  <View style={{ 
                    backgroundColor: isDark ? "#1f2937" : "#f3f4f6", 
                    borderRadius: 12, 
                    padding: 12, 
                    marginVertical: 8,
                    borderWidth: 1,
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                  }}>
                    {/* VS í—¤ë” */}
                    <View style={{ alignItems: "center", marginBottom: 8 }}>
                      <Text style={{ color: C.sub, fontWeight: "800", fontSize: 14 }}>ðŸ”® ìŠ¹ë¶€ì˜ˆì¸¡</Text>
                    </View>
                    
                    {matchAnalysis ? (
                      <>
                        {/* ì˜ˆì¸¡ ìŠ¹ë¥  ë°” */}
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                          <Text style={{ color: C.ok, fontWeight: "800", fontSize: 13, width: 45, textAlign: "center" }}>
                            {Math.round(matchAnalysis.predictedWinRateA * 100)}%
                          </Text>
                          <View style={{ flex: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 999, overflow: "hidden", marginHorizontal: 6 }}>
                            <View style={{ 
                              width: `${Math.round(matchAnalysis.predictedWinRateA * 100)}%`, 
                              height: "100%", 
                              backgroundColor: C.ok,
                              borderRadius: 999,
                            }} />
                          </View>
                          <Text style={{ color: C.warn, fontWeight: "800", fontSize: 13, width: 45, textAlign: "center" }}>
                            {Math.round(matchAnalysis.predictedWinRateB * 100)}%
                          </Text>
                        </View>
                        
                        {/* ìƒì„¸ ì •ë³´ */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          {/* ì§ì ‘ ëŒ€ê²° ì „ì  */}
                          <View style={{ alignItems: "center" }}>
                            <Text style={{ color: C.sub, fontSize: 10, marginBottom: 2 }}>ì§ì ‘ ëŒ€ê²°</Text>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 12 }}>
                              {matchAnalysis.h2h.total > 0 
                                ? `${matchAnalysis.h2h.aWins} : ${matchAnalysis.h2h.bWins}`
                                : "ì²« ëŒ€ê²°"
                              }
                            </Text>
                          </View>
                          
                          {/* Elo ì˜ˆì¸¡ */}
                          <View style={{ alignItems: "center" }}>
                            <Text style={{ color: C.sub, fontSize: 10, marginBottom: 2 }}>Elo ê¸°ë°˜</Text>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 12 }}>
                              {Math.round(matchAnalysis.eloWinRateA * 100)} : {Math.round(matchAnalysis.eloWinRateB * 100)}
                            </Text>
                          </View>
                          
                          {/* ì‹ ë¢°ë„ */}
                          <View style={{ alignItems: "center" }}>
                            <Text style={{ color: C.sub, fontSize: 10, marginBottom: 2 }}>ì˜ˆì¸¡ ì‹ ë¢°ë„</Text>
                            <Text style={{ 
                              color: matchAnalysis.confidence > 0.3 ? C.ok : matchAnalysis.confidence > 0.1 ? C.primary : C.sub, 
                              fontWeight: "700", 
                              fontSize: 12 
                            }}>
                              {matchAnalysis.confidence > 0.3 ? "ë†’ìŒ" : matchAnalysis.confidence > 0.1 ? "ë³´í†µ" : "ë‚®ìŒ"}
                            </Text>
                          </View>
                        </View>
                        
                        {/* ìž¥ë¥´ ìƒì„± (ìžˆëŠ” ê²½ìš°) */}
                        {matchAnalysis.genreMatchup && matchAnalysis.genreMatchup.type === "cross" && (
                          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: isDark ? "#374151" : "#e5e7eb" }}>
                            <Text style={{ color: C.sub, fontSize: 10, textAlign: "center" }}>
                              ðŸ“Š ìž¥ë¥´ ìƒì„±: {getFirstGenre(pair.A.major_genre) || "?"} vs {getFirstGenre(pair.B.major_genre) || "?"} ({matchAnalysis.genreMatchup.total}ì „)
                            </Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <Text style={{ color: C.sub, fontSize: 12, textAlign: "center" }}>ë¶„ì„ ì¤‘...</Text>
                    )}
                  </View>

                  {/* ðŸ§  v3.5.0: ì·¨í–¥ ê¸°ë°˜ ì˜ˆì¸¡ íŒ¨ë„ */}
                  {matchPrediction && (
                    <View style={{ 
                      backgroundColor: isDark ? "#1e1b4b" : "#f5f3ff", 
                      borderRadius: 12, 
                      padding: 12, 
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: isDark ? "#3730a3" : "#c4b5fd",
                    }}>
                      <View style={{ alignItems: "center", marginBottom: 8 }}>
                        <Text style={{ color: "#7c3aed", fontWeight: "800", fontSize: 14 }}>ðŸ§  ì·¨í–¥ ì˜ˆì¸¡</Text>
                      </View>
                      
                      {/* ì˜ˆì¸¡ ê²°ê³¼ */}
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                        <View style={{ flex: 1, alignItems: "center" }}>
                          <Text style={{ 
                            color: matchPrediction.predictedWinnerId === pair.A.id ? "#7c3aed" : C.sub, 
                            fontWeight: "800", 
                            fontSize: matchPrediction.predictedWinnerId === pair.A.id ? 16 : 13 
                          }}>
                            {Math.round((matchPrediction.predictedWinRateA || 0.5) * 100)}%
                          </Text>
                          {matchPrediction.predictedWinnerId === pair.A.id && (
                            <Text style={{ fontSize: 10, color: "#7c3aed" }}>ì˜ˆìƒ ì„ íƒ</Text>
                          )}
                        </View>
                        <View style={{ 
                          backgroundColor: "#7c3aed", 
                          paddingHorizontal: 8, 
                          paddingVertical: 2, 
                          borderRadius: 8 
                        }}>
                          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>
                            ì‹ ë¢° {Math.round((matchPrediction.confidence || 0) * 100)}%
                          </Text>
                        </View>
                        <View style={{ flex: 1, alignItems: "center" }}>
                          <Text style={{ 
                            color: matchPrediction.predictedWinnerId === pair.B.id ? "#7c3aed" : C.sub, 
                            fontWeight: "800", 
                            fontSize: matchPrediction.predictedWinnerId === pair.B.id ? 16 : 13 
                          }}>
                            {Math.round((1 - (matchPrediction.predictedWinRateA || 0.5)) * 100)}%
                          </Text>
                          {matchPrediction.predictedWinnerId === pair.B.id && (
                            <Text style={{ fontSize: 10, color: "#7c3aed" }}>ì˜ˆìƒ ì„ íƒ</Text>
                          )}
                        </View>
                      </View>
                      
                      {/* ì£¼ìš” ìš”ì¸ */}
                      {matchPrediction.mainReasons && matchPrediction.mainReasons.length > 0 && (
                        <View style={{ 
                          borderTopWidth: 1, 
                          borderTopColor: isDark ? "#3730a3" : "#ddd6fe", 
                          paddingTop: 8 
                        }}>
                          <Text style={{ fontSize: 10, color: C.sub, marginBottom: 4 }}>ðŸ“Š ì£¼ìš” ìš”ì¸:</Text>
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                            {matchPrediction.mainReasons.slice(0, 3).map((reason, idx) => (
                              <View key={idx} style={{ 
                                backgroundColor: isDark ? "#312e81" : "#ede9fe", 
                                paddingHorizontal: 6, 
                                paddingVertical: 2, 
                                borderRadius: 4 
                              }}>
                                <Text style={{ fontSize: 10, color: "#7c3aed" }}>
                                  {reason.key === "genre" ? "ìž¥ë¥´" : 
                                   reason.key === "tag" ? "íƒœê·¸" : 
                                   reason.key === "h2h" ? "ì§ì ‘ ëŒ€ê²°" : 
                                   reason.key === "elo" ? "Elo" :
                                   reason.key === "reliability" ? "ì‹ ë¢°ë„" :
                                   reason.key || "ê¸°íƒ€"}: {reason.influence}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* ìž‘í’ˆ B */}
                  <TouchableOpacity
                    onPress={() => decide(pair.B.id, "user")}
                    style={{
                      borderWidth: 3,
                      borderColor: C.warn,
                      backgroundColor: C.card,
                      borderRadius: 16,
                      padding: 14,
                    }}
                  >
                    <View style={{ flexDirection: "row" }}>
                      <CoverImage uri={pair.B.cover_image} platforms={pair.B.platforms} platformCovers={platformCovers} size={70} theme={C} />
                      <View style={{ flex: 1 }}>
                        {/* ì œëª© + í‹°ì–´ */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <Text style={{ fontSize: 16, fontWeight: "800", color: C.text, flex: 1 }} numberOfLines={1}>
                            {pair.B.title}
                          </Text>
                          <ActualTierTag novel={pair.B} />
                        </View>
                        
                        {/* ìž‘ê°€ Â· ìž¥ë¥´ + ìš°ì¸¡ ìƒíƒœ ì•„ì´ì½˜ */}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={{ color: C.text, fontSize: 13, flex: 1 }} numberOfLines={1}>
                            {pair.B.author || "ìž‘ê°€ ë¯¸ìƒ"}
                            {getFirstGenre(pair.B.major_genre) && <Text style={{ color: C.sub }}> Â· {getFirstGenre(pair.B.major_genre)}</Text>}
                            {getFirstGenre(pair.B.sub_genre) && <Text style={{ color: C.sub }}> Â· {getFirstGenre(pair.B.sub_genre)}</Text>}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
                            <StatusIcon status={pair.B.status} />
                            <WorkStatusIcon workStatus={pair.B.work_status} />
                          </View>
                        </View>
                        
                        {/* ìŠ¤íƒ¯ */}
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={{ color: C.warn, fontWeight: "800", fontSize: 15 }}>
                            {pair.B.rating.toFixed(1)}
                          </Text>
                          <Text style={{ color: C.sub, fontSize: 12, marginLeft: 8 }}>
                            RD {Math.round(pair.B.rd)} Â· {pair.B.wins}W/{pair.B.losses}L Â· {getWinRate(pair.B.wins, pair.B.losses)}%
                          </Text>
                        </View>
                        
                        {/* ì½ì€ íšŒì°¨ */}
                        <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
                          ðŸ“– {pair.B.read_count}í™” ì½ìŒ
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                    <OutlineButton
                      title="ê±´ë„ˆë›°ê¸°"
                      onPress={() => { setPair(null); pickRandomUnseenPair(); }}
                      style={{ flex: 1 }}
                    />
                    <PrimaryButton
                      title="ë‹¤ìŒ ë§¤ì¹­"
                      onPress={pickRandomUnseenPair}
                      style={{ flex: 1 }}
                    />
                  </View>
                </>
              )}
            </Section>
          </>
        )}

        {/* SUPPLEMENT - ì •ë³´ ë³´ì¶© */}
        {screen === "supplement" && (
          <>
            <H>ðŸ“ ì •ë³´ ë³´ì¶©</H>
            
            {/* í˜„í™© ìš”ì•½ */}
            <Section title="ë³´ì¶© ëŒ€ìƒ í˜„í™©">
              <Text style={{ color: C.sub, marginBottom: 12 }}>
                ì •ë³´ ìž…ë ¥ì´ ë¯¸í¡í•œ ìž‘í’ˆì„ ì°¾ì•„ ë³´ì¶©í•©ë‹ˆë‹¤.
                ë¶€ì • íƒœê·¸ê°€ {appSettings.supplement?.excludeNegativeTagCount || 2}ê°œ ì´ìƒì¸ ìž‘í’ˆì€ ì œì™¸ë©ë‹ˆë‹¤.
              </Text>
              
              <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                <View style={{ backgroundColor: "#3b82f6", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>{supplementCount}ìž‘í’ˆ</Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>ë³´ì¶© ëŒ€ìƒ</Text>
                </View>
                <View style={{ backgroundColor: C.chip, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
                  <Text style={{ color: C.text, fontWeight: "700" }}>ì „ì²´ {list.length}ìž‘í’ˆ</Text>
                </View>
              </View>
              
              <OutlineButton
                title="âš™ï¸ ë³´ì¶© ê¸°ì¤€ ì„¤ì •"
                onPress={() => setSupplementSettingsOpen(true)}
              />
            </Section>

            {supplementCount === 0 ? (
              <Section title="âœ… ì™„ë£Œ">
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>ðŸŽ‰</Text>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 8 }}>
                    ëª¨ë“  ìž‘í’ˆì˜ ì •ë³´ê°€ ì¶©ë¶„í•©ë‹ˆë‹¤!
                  </Text>
                  <Text style={{ color: C.sub, textAlign: "center" }}>
                    ë³´ì¶©ì´ í•„ìš”í•œ ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.{"\n"}
                    ìƒˆ ìž‘í’ˆì„ ë“±ë¡í•˜ê±°ë‚˜ ê¸°ì¤€ì„ ì¡°ì •í•´ ë³´ì„¸ìš”.
                  </Text>
                </View>
              </Section>
            ) : supplementCurrentNovel ? (
              <>
                {/* ë¯¸í¡ í•­ëª© í‘œì‹œ */}
                <Section title="ë¯¸í¡ í•­ëª©">
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {supplementCurrentNovel.issues.map(issue => {
                      const labels = {
                        tags: `íƒœê·¸ ${(supplementCurrentNovel.novel.tags || "").split(",").filter(t=>t.trim()).length}ê°œ (ìµœì†Œ ${appSettings.supplement?.minTags || 5}ê°œ)`,
                        author: "ìž‘ê°€ ë¯¸ìž…ë ¥",
                        totalEpisodes: "ì „ì²´ íšŒì°¨ ë¯¸ìž…ë ¥",
                        readCount: "ì½ì€ íšŒì°¨ ë¯¸ìž…ë ¥",
                        majorGenre: "ëŒ€ìž¥ë¥´ ë¯¸ì„ íƒ",
                        subGenre: "ë¶€ìž¥ë¥´ ë¯¸ì„ íƒ",
                        platform: "í”Œëž«í¼ ë¯¸ì„ íƒ",
                      };
                      return (
                        <View key={issue} style={{ backgroundColor: "#fef3c7", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                          <Text style={{ color: "#92400e", fontSize: 12, fontWeight: "600" }}>âš ï¸ {labels[issue] || issue}</Text>
                        </View>
                      );
                    })}
                  </View>
                </Section>

                {/* ìž‘í’ˆ íŽ¸ì§‘ ì–‘ì‹ */}
                <Section title={`ðŸ“– ${supplementCurrentNovel.novel.title}`}>
                  {/* ê¸°ë³¸ ì •ë³´ */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <CoverImage 
                      uri={supplementCurrentNovel.novel.cover_image} 
                      platforms={supplementCurrentNovel.novel.platforms} 
                      platformCovers={platformCovers} 
                      size={60} 
                      theme={C} 
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }} numberOfLines={2}>
                        {supplementCurrentNovel.novel.title}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                        <ActualTierTag novel={supplementCurrentNovel.novel} />
                        <Text style={{ color: C.sub, marginLeft: 8 }}>
                          R {supplementCurrentNovel.novel.rating?.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ìž‘ê°€ */}
                  <Label>ìž‘ê°€</Label>
                  <Input
                    value={editItem?.author || ""}
                    onChangeText={(t) => setEditItem(prev => prev ? { ...prev, author: t } : null)}
                    placeholder="ìž‘ê°€ëª… ìž…ë ¥"
                  />

                  {/* ì „ì²´ íšŒì°¨ / ì½ì€ íšŒì°¨ */}
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Label>ì „ì²´ íšŒì°¨</Label>
                      <Input
                        value={String(editItem?.total_episodes || "")}
                        onChangeText={(t) => setEditItem(prev => prev ? { ...prev, total_episodes: t } : null)}
                        placeholder="ì˜ˆ: 150"
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Label>ì½ì€ íšŒì°¨</Label>
                      <Input
                        value={String(editItem?.read_count || "")}
                        onChangeText={(t) => setEditItem(prev => prev ? { ...prev, read_count: t } : null)}
                        placeholder="ì˜ˆ: 80"
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>

                  {/* í”Œëž«í¼ */}
                  <Label style={{ marginTop: 10 }}>í”Œëž«í¼</Label>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {PLATFORM_OPTIONS.map((p) => {
                      const cur = parsePlatforms(editItem?.platforms);
                      const on = cur.includes(p);
                      return (
                        <Chip
                          key={p}
                          label={p}
                          active={on}
                          onPress={() => {
                            const next = on ? cur.filter((x) => x !== p) : [...cur, p];
                            setEditItem(prev => prev ? { ...prev, platforms: JSON.stringify(next) } : null);
                          }}
                        />
                      );
                    })}
                  </View>

                  {/* ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´/íƒœê·¸ - íƒœê·¸ ëª¨ë‹¬ ì—°ë™ */}
                  <Label style={{ marginTop: 10 }}>ëŒ€ìž¥ë¥´ / ë¶€ìž¥ë¥´ / íƒœê·¸</Label>
                  <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 12, marginBottom: 8 }}>
                    {editItem?.major_genre && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
                        <Text style={{ color: C.sub, fontSize: 12, marginRight: 6 }}>ëŒ€ìž¥ë¥´:</Text>
                        {parseMajorSub(editItem.major_genre).map(g => (
                          <GenreBadge key={g} genre={g} type="major" />
                        ))}
                      </View>
                    )}
                    {editItem?.sub_genre && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
                        <Text style={{ color: C.sub, fontSize: 12, marginRight: 6 }}>ë¶€ìž¥ë¥´:</Text>
                        {parseMajorSub(editItem.sub_genre).map(g => (
                          <GenreBadge key={g} genre={g} type="sub" />
                        ))}
                      </View>
                    )}
                    <Text style={{ color: C.sub, fontSize: 12 }}>
                      íƒœê·¸: {editItem?.tags || "(ì—†ìŒ)"} ({(editItem?.tags || "").split(",").filter(t=>t.trim()).length}ê°œ)
                    </Text>
                  </View>
                  <OutlineButton
                    title="ðŸ·ï¸ íƒœê·¸ ì„ íƒ ëª¨ë‹¬ ì—´ê¸°"
                    onPress={() => {
                      setTagModalTarget('supplement');
                      setTagModalOpen(true);
                    }}
                  />

                  {/* ë©”ëª¨ */}
                  <Label style={{ marginTop: 10 }}>ë©”ëª¨</Label>
                  <Input
                    value={editItem?.note || ""}
                    onChangeText={(t) => setEditItem(prev => prev ? { ...prev, note: t } : null)}
                    placeholder="ë©”ëª¨ ìž…ë ¥"
                    multiline
                    style={{ minHeight: 60 }}
                  />

                  {/* ë²„íŠ¼ */}
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                    <PrimaryButton
                      title="ì €ìž¥ & ë‹¤ìŒ"
                      onPress={async () => {
                        if (!editItem) return;
                        try {
                          // ðŸ”§ v3.0.2: ì €ìž¥ í›„ ì´ë™í•  ID ì„¤ì • (useEffectì—ì„œ ì²˜ë¦¬)
                          const savedId = editItem.id;
                          setSavedSupplementId(savedId);
                          
                          // ì €ìž¥
                          let plats = [];
                          try { plats = JSON.parse(editItem.platforms || "[]"); } catch { plats = []; }
                          
                          await exec(
                            `UPDATE novels SET author=?, total_episodes=?, read_count=?, platforms=?, tags=?, major_genre=?, sub_genre=?, note=? WHERE id=?`,
                            [
                              editItem.author?.trim() || "",
                              Number(editItem.total_episodes) || 0,
                              Number(editItem.read_count) || 0,
                              JSON.stringify(plats),
                              editItem.tags?.trim() || "",
                              editItem.major_genre || "",
                              editItem.sub_genre || "",
                              editItem.note?.trim() || "",
                              editItem.id,
                            ]
                          );
                          
                          // loadList() í›„ supplementListê°€ ìž¬ê³„ì‚°ë˜ë©´ useEffectì—ì„œ ë‹¤ìŒ ìž‘í’ˆìœ¼ë¡œ ì´ë™
                          await loadList();
                        } catch (e) {
                          setSavedSupplementId(null);
                          Alert.alert("ì˜¤ë¥˜", "ì €ìž¥ ì¤‘ ì˜¤ë¥˜: " + e.message);
                        }
                      }}
                      style={{ flex: 2 }}
                    />
                    <OutlineButton
                      title="ê±´ë„ˆë›°ê¸°"
                      onPress={pickNextSupplementNovel}
                      style={{ flex: 1 }}
                    />
                  </View>
                </Section>

                {/* ë‹¤ë¥¸ ë³´ì¶© ëŒ€ìƒ ëª©ë¡ */}
                <Section title={`ðŸ“‹ ë‹¤ë¥¸ ë³´ì¶© ëŒ€ìƒ (${supplementCount - 1}ê°œ)`}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {supplementList
                      .filter(item => item.novel.id !== supplementCurrentNovel.novel.id)
                      .slice(0, 10)
                      .map(item => (
                        <TouchableOpacity
                          key={item.novel.id}
                          onPress={() => {
                            setSupplementCurrentNovel(item);
                            setEditItem({ ...item.novel });
                          }}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            padding: 10,
                            backgroundColor: C.bg,
                            borderRadius: 10,
                            marginBottom: 6,
                          }}
                        >
                          <CoverImage 
                            uri={item.novel.cover_image} 
                            platforms={item.novel.platforms} 
                            platformCovers={platformCovers} 
                            size={35} 
                            theme={C} 
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: "700", color: C.text }} numberOfLines={1}>
                              {item.novel.title}
                            </Text>
                            <Text style={{ color: C.sub, fontSize: 11 }}>
                              ë¯¸í¡: {item.issues.length}í•­ëª©
                            </Text>
                          </View>
                          <ActualTierTag novel={item.novel} />
                        </TouchableOpacity>
                      ))}
                    {supplementList.length > 11 && (
                      <Text style={{ color: C.sub, textAlign: "center", marginTop: 8 }}>
                        ...ì™¸ {supplementList.length - 11}ê°œ
                      </Text>
                    )}
                  </ScrollView>
                </Section>
              </>
            ) : (
              <Section title="ì‹œìž‘">
                <Text style={{ color: C.sub, marginBottom: 12 }}>
                  ë³´ì¶©ì´ í•„ìš”í•œ ìž‘í’ˆì´ {supplementCount}ê°œ ìžˆìŠµë‹ˆë‹¤.
                </Text>
                <PrimaryButton
                  title="ðŸ“ ë³´ì¶© ì‹œìž‘í•˜ê¸°"
                  onPress={() => {
                    const picked = pickNextSupplementNovel();
                    if (picked) {
                      setEditItem({ ...picked.novel });
                    }
                  }}
                />
              </Section>
            )}
          </>
        )}

        {/* REVIEW - í‹°ì–´ ê²€í†  */}
        {screen === "review" && (
          <>
            <H>ðŸ† í‹°ì–´ ê²€í† </H>
            
            {/* í˜„í™© ìš”ì•½ */}
            <Section title="í˜„í™©">
              {(() => {
                const sCount = list.filter(n => getDisplayTier(n) === 'S').length;
                const aCount = list.filter(n => getDisplayTier(n) === 'A').length;
                const total = list.length;
                const sPercent = total > 0 ? ((sCount / total) * 100).toFixed(1) : 0;
                const aPercent = total > 0 ? ((aCount / total) * 100).toFixed(1) : 0;
                
                return (
                  <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
                    <View style={{ backgroundColor: "#8b5cf6", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
                      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>S: {sCount}ìž‘í’ˆ</Text>
                      <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{sPercent}%</Text>
                    </View>
                    <View style={{ backgroundColor: "#3b82f6", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
                      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>A: {aCount}ìž‘í’ˆ</Text>
                      <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{aPercent}%</Text>
                    </View>
                    <View style={{ backgroundColor: C.chip, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
                      <Text style={{ color: C.text, fontWeight: "700" }}>ì „ì²´: {total}ìž‘í’ˆ</Text>
                    </View>
                  </View>
                );
              })()}
            </Section>

            {/* ì•¡ì…˜ ë²„íŠ¼ë“¤ */}
            <Section title="ì¼ê´„ ìž‘ì—…">
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <TouchableOpacity
                  onPress={async () => {
                    const reviews = list.filter(n => getReviewStatus(n) !== null);
                    if (reviews.length === 0) {
                      Alert.alert("ì•Œë¦¼", "ê²€í†  ëŒ€ê¸° ì¤‘ì¸ ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.");
                      return;
                    }
                    Alert.alert("í™•ì¸", `${reviews.length}ê±´ì„ ëª¨ë‘ ê¶Œìž¥ í‹°ì–´ë¡œ ì ìš©í• ê¹Œìš”?`, [
                      { text: "ì·¨ì†Œ" },
                      { text: "ì ìš©", onPress: async () => {
                        const historyItems = [];
                        const queries = reviews.map(n => {
                          const recommended = tierFromRating(n.rating);
                          const newTier = (recommended === 'S' || recommended === 'A') ? recommended : null;
                          const current = getDisplayTier(n);
                          historyItems.push({ id: n.id, title: n.title, from: current, to: newTier || recommended, at: Date.now() });
                          return {
                            sql: "UPDATE novels SET manual_tier=? WHERE id=?",
                            params: [newTier, n.id],
                          };
                        });
                        await execBatch(queries);
                        setTierHistory(prev => [...historyItems, ...prev].slice(0, 20));
                        setReviewSelectedIds([]);
                        await loadList();
                        Alert.alert("ì™„ë£Œ", `${reviews.length}ê±´ ì ìš©ë¨`);
                      }},
                    ]);
                  }}
                  style={{ backgroundColor: C.primary, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>âœ… ëª¨ë‘ ìŠ¹ì¸</Text>
                </TouchableOpacity>
                
                {/* ì„ íƒ ìŠ¹ì¸ ë²„íŠ¼ */}
                {reviewSelectedIds.length > 0 && (
                  <TouchableOpacity
                    onPress={async () => {
                      const selected = list.filter(n => reviewSelectedIds.includes(n.id) && getReviewStatus(n) !== null);
                      if (selected.length === 0) {
                        Alert.alert("ì•Œë¦¼", "ì„ íƒëœ ê²€í†  ëŒ€ê¸° ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.");
                        return;
                      }
                      Alert.alert("í™•ì¸", `ì„ íƒí•œ ${selected.length}ê±´ì„ ê¶Œìž¥ í‹°ì–´ë¡œ ì ìš©í• ê¹Œìš”?`, [
                        { text: "ì·¨ì†Œ" },
                        { text: "ì ìš©", onPress: async () => {
                          const historyItems = [];
                          const queries = selected.map(n => {
                            const recommended = tierFromRating(n.rating);
                            const newTier = (recommended === 'S' || recommended === 'A') ? recommended : null;
                            const current = getDisplayTier(n);
                            historyItems.push({ id: n.id, title: n.title, from: current, to: newTier || recommended, at: Date.now() });
                            return {
                              sql: "UPDATE novels SET manual_tier=? WHERE id=?",
                              params: [newTier, n.id],
                            };
                          });
                          await execBatch(queries);
                          setTierHistory(prev => [...historyItems, ...prev].slice(0, 20));
                          setReviewSelectedIds([]);
                          await loadList();
                          Alert.alert("ì™„ë£Œ", `${selected.length}ê±´ ì ìš©ë¨`);
                        }},
                      ]);
                    }}
                    style={{ backgroundColor: "#8b5cf6", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>â˜‘ï¸ ì„ íƒ ìŠ¹ì¸ ({reviewSelectedIds.length})</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  onPress={async () => {
                    const promotes = list.filter(n => {
                      const status = getReviewStatus(n);
                      return status && status.type === 'promote';
                    });
                    if (promotes.length === 0) {
                      Alert.alert("ì•Œë¦¼", "ìŠ¹ê¸‰ ëŒ€ê¸° ì¤‘ì¸ ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.");
                      return;
                    }
                    Alert.alert("í™•ì¸", `ìŠ¹ê¸‰ ${promotes.length}ê±´ì„ ì ìš©í• ê¹Œìš”?`, [
                      { text: "ì·¨ì†Œ" },
                      { text: "ì ìš©", onPress: async () => {
                        const historyItems = [];
                        const queries = promotes.map(n => {
                          const newTier = tierFromRating(n.rating);
                          const current = getDisplayTier(n);
                          historyItems.push({ id: n.id, title: n.title, from: current, to: newTier, at: Date.now() });
                          return {
                            sql: "UPDATE novels SET manual_tier=? WHERE id=?",
                            params: [newTier, n.id],
                          };
                        });
                        await execBatch(queries);
                        setTierHistory(prev => [...historyItems, ...prev].slice(0, 20));
                        setReviewSelectedIds([]);
                        await loadList();
                        
                        // ðŸ“° v3.0: í‹°ì–´ ì‹¬ì‚¬ í†µê³¼ ê¸°ë¡
                        for (const item of historyItems) {
                          await addRecentChange(item.id, item.title, "tier_review", {
                            from: item.from,
                            to: item.to,
                            action: "promote"
                          });
                        }
                        
                        Alert.alert("ì™„ë£Œ", `${promotes.length}ê±´ ìŠ¹ê¸‰ë¨`);
                      }},
                    ]);
                  }}
                  style={{ backgroundColor: "#22c55e", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>â¬†ï¸ ìŠ¹ê¸‰ë§Œ</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={async () => {
                    const demotes = list.filter(n => {
                      const status = getReviewStatus(n);
                      return status && status.type === 'demote';
                    });
                    if (demotes.length === 0) {
                      Alert.alert("ì•Œë¦¼", "ê°•ë“± ëŒ€ê¸° ì¤‘ì¸ ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.");
                      return;
                    }
                    Alert.alert("í™•ì¸", `ê°•ë“± ${demotes.length}ê±´ì„ ì ìš©í• ê¹Œìš”?`, [
                      { text: "ì·¨ì†Œ" },
                      { text: "ì ìš©", onPress: async () => {
                        const historyItems = [];
                        const queries = demotes.map(n => {
                          const recommended = tierFromRating(n.rating);
                          const newTier = (recommended === 'S' || recommended === 'A') ? recommended : null;
                          const current = getDisplayTier(n);
                          historyItems.push({ id: n.id, title: n.title, from: current, to: newTier || recommended, at: Date.now() });
                          return {
                            sql: "UPDATE novels SET manual_tier=? WHERE id=?",
                            params: [newTier, n.id],
                          };
                        });
                        await execBatch(queries);
                        setTierHistory(prev => [...historyItems, ...prev].slice(0, 20));
                        setReviewSelectedIds([]);
                        await loadList();
                        
                        // ðŸ“° v3.0: í‹°ì–´ ì‹¬ì‚¬ í†µê³¼ ê¸°ë¡ (ê°•ë“±)
                        for (const item of historyItems) {
                          await addRecentChange(item.id, item.title, "tier_review", {
                            from: item.from,
                            to: item.to,
                            action: "demote"
                          });
                        }
                        
                        Alert.alert("ì™„ë£Œ", `${demotes.length}ê±´ ê°•ë“±ë¨`);
                      }},
                    ]);
                  }}
                  style={{ backgroundColor: "#f59e0b", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>â¬‡ï¸ ê°•ë“±ë§Œ</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      "ì „ì²´ ë¦¬ì…‹",
                      "ëª¨ë“  S/A ìˆ˜ë™ ì§€ì •ì„ í•´ì œí•˜ê³  ì ìˆ˜ ê¸°ì¤€ìœ¼ë¡œ ìž¬ë°°ì¹˜í• ê¹Œìš”?\n\nâ€» ì ìˆ˜ê°€ S/A ê¸°ì¤€ ë¯¸ë‹¬ì¸ ìž‘í’ˆì€ B+ ì´í•˜ë¡œ ì´ë™ë©ë‹ˆë‹¤.",
                      [
                        { text: "ì·¨ì†Œ" },
                        { text: "ë¦¬ì…‹", style: "destructive", onPress: async () => {
                          await exec("UPDATE novels SET manual_tier=NULL");
                          setTierHistory([]);
                          setReviewSelectedIds([]);
                          await loadList();
                          Alert.alert("ì™„ë£Œ", "ì „ì²´ ë¦¬ì…‹ë¨");
                        }},
                      ]
                    );
                  }}
                  style={{ backgroundColor: "#fee2e2", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: C.warn }}
                >
                  <Text style={{ color: C.warn, fontWeight: "700" }}>ðŸ”„ ì „ì²´ ë¦¬ì…‹</Text>
                </TouchableOpacity>
                
                {/* ì„ íƒ ì „ì²´ ì·¨ì†Œ */}
                {reviewSelectedIds.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setReviewSelectedIds([])}
                    style={{ backgroundColor: C.chip, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: C.line }}
                  >
                    <Text style={{ color: C.sub, fontWeight: "700" }}>âœ• ì„ íƒ ì·¨ì†Œ</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Section>

            {/* ê²€í†  ëŒ€ê¸° ì—†ìŒ ë©”ì‹œì§€ */}
            {(() => {
              const hasPromotes = list.some(n => {
                const status = getReviewStatus(n);
                return status && status.type === 'promote';
              });
              const hasDemotes = list.some(n => {
                const status = getReviewStatus(n);
                return status && status.type === 'demote';
              });
              
              if (!hasPromotes && !hasDemotes) {
                return (
                  <Section title="ê²€í†  í˜„í™©">
                    <View style={{ 
                      backgroundColor: "#dcfce7", 
                      padding: 16, 
                      borderRadius: 12,
                      alignItems: "center",
                    }}>
                      <Text style={{ fontSize: 24, marginBottom: 8 }}>âœ…</Text>
                      <Text style={{ color: "#166534", fontWeight: "700", fontSize: 16 }}>
                        ëª¨ë“  ê²€í† ê°€ ì™„ë£Œë˜ì—ˆìŠµë‹ˆë‹¤!
                      </Text>
                      <Text style={{ color: "#15803d", fontSize: 13, marginTop: 4 }}>
                        í˜„ìž¬ ìŠ¹ê¸‰/ê°•ë“± ëŒ€ê¸° ì¤‘ì¸ ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.
                      </Text>
                    </View>
                  </Section>
                );
              }
              return null;
            })()}

            {/* ìŠ¹ê¸‰ ê²€í†  */}
            {(() => {
              const promotes = list.filter(n => {
                const status = getReviewStatus(n);
                return status && status.type === 'promote';
              }).sort((a, b) => b.rating - a.rating);
              
              if (promotes.length === 0) return null;
              
              return (
                <Section title={`â¬†ï¸ ìŠ¹ê¸‰ ê²€í†  (${promotes.length}ê±´)`}>
                  {promotes.map(n => {
                    const recommended = tierFromRating(n.rating);
                    const current = getDisplayTier(n);
                    const isSelected = reviewSelectedIds.includes(n.id);
                    
                    return (
                      <View key={n.id} style={{
                        backgroundColor: C.card,
                        borderRadius: 14,
                        padding: 14,
                        marginBottom: 10,
                        borderWidth: 2,
                        borderColor: isSelected ? C.primary : "#22c55e",
                      }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          {/* ì²´í¬ë°•ìŠ¤ */}
                          <TouchableOpacity
                            onPress={() => setReviewSelectedIds(prev => 
                              prev.includes(n.id) ? prev.filter(x => x !== n.id) : [...prev, n.id]
                            )}
                            style={{ marginRight: 10, paddingTop: 2 }}
                          >
                            <View style={{
                              width: 22, height: 22, borderRadius: 4,
                              borderWidth: 2, borderColor: isSelected ? C.primary : C.sub,
                              backgroundColor: isSelected ? C.primary : "transparent",
                              justifyContent: "center", alignItems: "center",
                            }}>
                              {isSelected && <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>âœ“</Text>}
                            </View>
                          </TouchableOpacity>
                          
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }} numberOfLines={1}>
                              {n.title}
                            </Text>
                            <Text style={{ color: C.sub, marginTop: 4 }}>
                              ì ìˆ˜: {n.rating.toFixed(0)} Â· {current} â†’ {recommended} ê¶Œìž¥
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", gap: 6 }}>
                            {recommended === 'S' && (
                              <TouchableOpacity
                                onPress={async () => {
                                  setTierHistory(prev => [{ id: n.id, title: n.title, from: current, to: 'S', at: Date.now() }, ...prev].slice(0, 20));
                                  await exec("UPDATE novels SET manual_tier='S' WHERE id=?", [n.id]);
                                  await loadList();
                                }}
                                style={{ backgroundColor: "#8b5cf6", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}
                              >
                                <Text style={{ color: "#fff", fontWeight: "700" }}>S ìŠ¹ê¸‰</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={async () => {
                                setTierHistory(prev => [{ id: n.id, title: n.title, from: current, to: 'A', at: Date.now() }, ...prev].slice(0, 20));
                                await exec("UPDATE novels SET manual_tier='A' WHERE id=?", [n.id]);
                                await loadList();
                              }}
                              style={{ backgroundColor: "#3b82f6", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}
                            >
                              <Text style={{ color: "#fff", fontWeight: "700" }}>A ìŠ¹ê¸‰</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </Section>
              );
            })()}

            {/* ê°•ë“± ê²€í†  */}
            {(() => {
              const demotes = list.filter(n => {
                const status = getReviewStatus(n);
                return status && status.type === 'demote';
              }).sort((a, b) => a.rating - b.rating);
              
              if (demotes.length === 0) return null;
              
              return (
                <Section title={`â¬‡ï¸ ê°•ë“± ê²€í†  (${demotes.length}ê±´)`}>
                  {demotes.map(n => {
                    const recommended = tierFromRating(n.rating);
                    const current = getDisplayTier(n);
                    const isForced = n.manual_tier && tierRank(tierFromRating(n.rating)) > tierRank(n.manual_tier);
                    const isSelected = reviewSelectedIds.includes(n.id);
                    
                    return (
                      <View key={n.id} style={{
                        backgroundColor: C.card,
                        borderRadius: 14,
                        padding: 14,
                        marginBottom: 10,
                        borderWidth: 2,
                        borderColor: isSelected ? C.primary : "#f59e0b",
                      }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          {/* ì²´í¬ë°•ìŠ¤ */}
                          <TouchableOpacity
                            onPress={() => setReviewSelectedIds(prev => 
                              prev.includes(n.id) ? prev.filter(x => x !== n.id) : [...prev, n.id]
                            )}
                            style={{ marginRight: 10, paddingTop: 2 }}
                          >
                            <View style={{
                              width: 22, height: 22, borderRadius: 4,
                              borderWidth: 2, borderColor: isSelected ? C.primary : C.sub,
                              backgroundColor: isSelected ? C.primary : "transparent",
                              justifyContent: "center", alignItems: "center",
                            }}>
                              {isSelected && <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>âœ“</Text>}
                            </View>
                          </TouchableOpacity>
                          
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }} numberOfLines={1}>
                                {n.title}
                              </Text>
                              {isForced && (
                                <View style={{ backgroundColor: "#fef3c7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                  <Text style={{ color: "#92400e", fontSize: 10, fontWeight: "700" }}>ê°•ì œì§€ì •</Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ color: C.sub, marginTop: 4 }}>
                              ì ìˆ˜: {n.rating.toFixed(0)} Â· {current} â†’ {recommended} ê¶Œìž¥
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", gap: 6 }}>
                            <TouchableOpacity
                              onPress={async () => {
                                const newTier = (recommended === 'S' || recommended === 'A') ? recommended : null;
                                setTierHistory(prev => [{ id: n.id, title: n.title, from: current, to: newTier || recommended, at: Date.now() }, ...prev].slice(0, 20));
                                await exec("UPDATE novels SET manual_tier=? WHERE id=?", [newTier, n.id]);
                                await loadList();
                              }}
                              style={{ backgroundColor: C.warn, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}
                            >
                              <Text style={{ color: "#fff", fontWeight: "700" }}>ê°•ë“±</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                Alert.alert("ìœ ì§€", `${n.title}ì„(ë¥¼) ${current}í‹°ì–´ë¡œ ìœ ì§€í•©ë‹ˆë‹¤.`);
                              }}
                              style={{ backgroundColor: C.chip, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: C.line }}
                            >
                              <Text style={{ color: C.text, fontWeight: "700" }}>ìœ ì§€</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </Section>
              );
            })()}

            {/* ê²€í†  ëŒ€ê¸° ì—†ìŒ */}
            {(() => {
              const reviews = list.filter(n => getReviewStatus(n) !== null);
              if (reviews.length > 0) return null;
              
              return (
                <Section title="âœ¨ ê²€í†  ì™„ë£Œ">
                  <Text style={{ color: C.sub, textAlign: "center", paddingVertical: 20 }}>
                    ê²€í†  ëŒ€ê¸° ì¤‘ì¸ ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤!
                  </Text>
                </Section>
              );
            })()}

            {/* í˜„ìž¬ S/A ìž‘í’ˆ ëª©ë¡ */}
            <Section title="í˜„ìž¬ S/A ìž‘í’ˆ">
              {(() => {
                const sTier = list.filter(n => getDisplayTier(n) === 'S').sort((a, b) => b.rating - a.rating);
                const aTier = list.filter(n => getDisplayTier(n) === 'A').sort((a, b) => b.rating - a.rating);
                
                return (
                  <View>
                    {/* Sí‹°ì–´ */}
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontWeight: "800", color: "#8b5cf6", marginBottom: 8 }}>
                        ðŸ¥‡ Sí‹°ì–´ ({sTier.length}ìž‘í’ˆ)
                      </Text>
                      {sTier.length === 0 ? (
                        <Text style={{ color: C.sub }}>ì•„ì§ Sí‹°ì–´ ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.</Text>
                      ) : (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                          {sTier.map(n => {
                            const isForced = n.manual_tier === 'S' && tierFromRating(n.rating) !== 'S';
                            return (
                              <TouchableOpacity
                                key={n.id}
                                onPress={() => {
                                  Alert.alert(
                                    n.title,
                                    `ì ìˆ˜: ${n.rating.toFixed(0)}\nê¶Œìž¥: ${tierFromRating(n.rating)}í‹°ì–´${isForced ? '\nâš ï¸ ê°•ì œ ì§€ì •ë¨' : ''}`,
                                    [
                                      { text: "ë‹«ê¸°" },
                                      { text: "Aë¡œ ê°•ë“±", onPress: async () => {
                                        setTierHistory(prev => [{ id: n.id, title: n.title, from: 'S', to: 'A', at: Date.now() }, ...prev].slice(0, 20));
                                        await exec("UPDATE novels SET manual_tier='A' WHERE id=?", [n.id]);
                                        await loadList();
                                      }},
                                      { text: "S í•´ì œ", style: "destructive", onPress: async () => {
                                        const recommended = tierFromRating(n.rating);
                                        const newTier = (recommended === 'S' || recommended === 'A') ? recommended : null;
                                        setTierHistory(prev => [{ id: n.id, title: n.title, from: 'S', to: newTier || recommended, at: Date.now() }, ...prev].slice(0, 20));
                                        await exec("UPDATE novels SET manual_tier=? WHERE id=?", [newTier, n.id]);
                                        await loadList();
                                      }},
                                    ]
                                  );
                                }}
                                style={{
                                  backgroundColor: "#8b5cf6",
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 8,
                                  borderWidth: isForced ? 2 : 0,
                                  borderColor: "#fef3c7",
                                }}
                              >
                                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }} numberOfLines={1}>
                                  {isForced ? "âš ï¸ " : ""}{n.title}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                    
                    {/* Aí‹°ì–´ */}
                    <View>
                      <Text style={{ fontWeight: "800", color: "#3b82f6", marginBottom: 8 }}>
                        ðŸ¥ˆ Aí‹°ì–´ ({aTier.length}ìž‘í’ˆ)
                      </Text>
                      {aTier.length === 0 ? (
                        <Text style={{ color: C.sub }}>ì•„ì§ Aí‹°ì–´ ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.</Text>
                      ) : (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                          {aTier.map(n => {
                            const isForced = n.manual_tier === 'A' && tierFromRating(n.rating) !== 'A' && tierFromRating(n.rating) !== 'S';
                            return (
                              <TouchableOpacity
                                key={n.id}
                                onPress={() => {
                                  Alert.alert(
                                    n.title,
                                    `ì ìˆ˜: ${n.rating.toFixed(0)}\nê¶Œìž¥: ${tierFromRating(n.rating)}í‹°ì–´${isForced ? '\nâš ï¸ ê°•ì œ ì§€ì •ë¨' : ''}`,
                                    [
                                      { text: "ë‹«ê¸°" },
                                      { text: "Së¡œ ìŠ¹ê¸‰", onPress: async () => {
                                        setTierHistory(prev => [{ id: n.id, title: n.title, from: 'A', to: 'S', at: Date.now() }, ...prev].slice(0, 20));
                                        await exec("UPDATE novels SET manual_tier='S' WHERE id=?", [n.id]);
                                        await loadList();
                                      }},
                                      { text: "A í•´ì œ", style: "destructive", onPress: async () => {
                                        const recommended = tierFromRating(n.rating);
                                        const newTier = (recommended === 'S' || recommended === 'A') ? recommended : null;
                                        setTierHistory(prev => [{ id: n.id, title: n.title, from: 'A', to: newTier || recommended, at: Date.now() }, ...prev].slice(0, 20));
                                        await exec("UPDATE novels SET manual_tier=? WHERE id=?", [newTier, n.id]);
                                        await loadList();
                                      }},
                                    ]
                                  );
                                }}
                                style={{
                                  backgroundColor: "#3b82f6",
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 8,
                                  borderWidth: isForced ? 2 : 0,
                                  borderColor: "#fef3c7",
                                }}
                              >
                                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }} numberOfLines={1}>
                                  {isForced ? "âš ï¸ " : ""}{n.title}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })()}
            </Section>

            {/* ê°•ì œ ì§€ì • */}
            <Section title="âž• ê°•ì œ í‹°ì–´ ì§€ì •">
              <Text style={{ color: C.sub, marginBottom: 12 }}>
                ì ìˆ˜ì™€ ë¬´ê´€í•˜ê²Œ íŠ¹ì • ìž‘í’ˆì„ S/A í‹°ì–´ë¡œ ê°•ì œ ì§€ì •í•©ë‹ˆë‹¤.{"\n"}
                â€» ì ìˆ˜ê°€ ë¯¸ë‹¬ì´ë©´ ê²€í†  íƒ­ì— ê³„ì† í‘œì‹œë©ë‹ˆë‹¤.
              </Text>
              <Input
                value={reviewSearchQuery}
                onChangeText={setReviewSearchQuery}
                placeholder="ìž‘í’ˆ ê²€ìƒ‰..."
              />
              {reviewSearchQuery.trim().length > 0 && (
                <View style={{ marginTop: 10, maxHeight: 200 }}>
                  {list
                    .filter(n => {
                      const q = reviewSearchQuery.toLowerCase();
                      const current = getDisplayTier(n);
                      // S/A ì•„ë‹Œ ìž‘í’ˆë§Œ í‘œì‹œ
                      if (current === 'S' || current === 'A') return false;
                      return n.title.toLowerCase().includes(q) || 
                             (n.author || '').toLowerCase().includes(q);
                    })
                    .slice(0, 10)
                    .map(n => (
                      <View key={n.id} style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: C.line,
                      }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "700", color: C.text }} numberOfLines={1}>{n.title}</Text>
                          <Text style={{ color: C.sub, fontSize: 12 }}>
                            ì ìˆ˜: {n.rating.toFixed(0)} Â· í˜„ìž¬: {getDisplayTier(n)}
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          <TouchableOpacity
                            onPress={async () => {
                              const current = getDisplayTier(n);
                              setTierHistory(prev => [{ id: n.id, title: n.title, from: current, to: 'S', at: Date.now() }, ...prev].slice(0, 20));
                              await exec("UPDATE novels SET manual_tier='S' WHERE id=?", [n.id]);
                              await loadList();
                              setReviewSearchQuery("");
                              Alert.alert("ì™„ë£Œ", `${n.title}ì„(ë¥¼) Sí‹°ì–´ë¡œ ì§€ì •í–ˆìŠµë‹ˆë‹¤.`);
                            }}
                            style={{ backgroundColor: "#8b5cf6", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}
                          >
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>S</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={async () => {
                              const current = getDisplayTier(n);
                              setTierHistory(prev => [{ id: n.id, title: n.title, from: current, to: 'A', at: Date.now() }, ...prev].slice(0, 20));
                              await exec("UPDATE novels SET manual_tier='A' WHERE id=?", [n.id]);
                              await loadList();
                              setReviewSearchQuery("");
                              Alert.alert("ì™„ë£Œ", `${n.title}ì„(ë¥¼) Aí‹°ì–´ë¡œ ì§€ì •í–ˆìŠµë‹ˆë‹¤.`);
                            }}
                            style={{ backgroundColor: "#3b82f6", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}
                          >
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>A</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  }
                </View>
              )}
            </Section>

            {/* í‹°ì–´ ë³€ê²½ ížˆìŠ¤í† ë¦¬ */}
            {tierHistory.length > 0 && (
              <Section title="ðŸ“‹ ìµœê·¼ ë³€ê²½ ì´ë ¥">
                <View style={{ maxHeight: 200 }}>
                  {tierHistory.slice(0, 10).map((h, idx) => {
                    const timeAgo = (() => {
                      const diff = Date.now() - h.at;
                      const mins = Math.floor(diff / 60000);
                      if (mins < 1) return "ë°©ê¸ˆ ì „";
                      if (mins < 60) return `${mins}ë¶„ ì „`;
                      const hours = Math.floor(mins / 60);
                      if (hours < 24) return `${hours}ì‹œê°„ ì „`;
                      return `${Math.floor(hours / 24)}ì¼ ì „`;
                    })();
                    
                    return (
                      <View key={`${h.id}-${h.at}-${idx}`} style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 8,
                        borderBottomWidth: idx < tierHistory.length - 1 ? 1 : 0,
                        borderBottomColor: C.line,
                      }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "600", color: C.text }} numberOfLines={1}>
                            {h.title}
                          </Text>
                          <Text style={{ color: C.sub, fontSize: 12 }}>
                            {h.from} â†’ {h.to} Â· {timeAgo}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={async () => {
                            // ë˜ëŒë¦¬ê¸°: from í‹°ì–´ë¡œ ë³µì›
                            const restoreTier = (h.from === 'S' || h.from === 'A') ? h.from : null;
                            Alert.alert("ë˜ëŒë¦¬ê¸°", `${h.title}ì„(ë¥¼) ${h.from}í‹°ì–´ë¡œ ë³µì›í• ê¹Œìš”?`, [
                              { text: "ì·¨ì†Œ" },
                              { text: "ë³µì›", onPress: async () => {
                                await exec("UPDATE novels SET manual_tier=? WHERE id=?", [restoreTier, h.id]);
                                setTierHistory(prev => prev.filter((_, i) => i !== idx));
                                await loadList();
                              }},
                            ]);
                          }}
                          style={{ paddingHorizontal: 10, paddingVertical: 6 }}
                        >
                          <Text style={{ color: C.primary, fontWeight: "700", fontSize: 12 }}>â†©ï¸ ë˜ëŒë¦¬ê¸°</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
                {tierHistory.length > 10 && (
                  <Text style={{ color: C.sub, fontSize: 12, marginTop: 8, textAlign: "center" }}>
                    ìµœê·¼ 10ê±´ë§Œ í‘œì‹œë©ë‹ˆë‹¤
                  </Text>
                )}
              </Section>
            )}
          </>
        )}

        {/* TASTE - ì·¨í–¥ ë¶„ì„ */}
        {screen === "taste" && (
          <TasteAnalysisScreen 
            list={list} 
            C={C} 
            H={H} 
            Section={Section}
            isDark={isDark}
            matchInsights={matchInsights}
            upsetFactors={upsetFactors}
            tagRelations={tagRelations}
            tagCoOccurrences={tagCoOccurrences}
            coordinateSystems={coordinateSystems}
          />
        )}

        {/* ANALYSIS */}
        {screen === "analysis" && (
          <>
            <H>ë¶„ì„</H>
            <Section title={`ìš”ì•½ (ì´ ${analysisStats.total}ìž‘)`}>
              <Text style={{ color: C.text, fontWeight: "700" }}>{`í‰ê·  ë ˆì´íŒ…: ${analysisStats.avg.toFixed(1)}`}</Text>
              <View style={{ height: 8 }} />
              {Object.entries(analysisStats.byTier).map(([t, n]) => {
                const r = analysisStats.total ? n / analysisStats.total : 0;
                return (
                  <View key={t} style={{ marginBottom: 8 }}>
                    <Text style={{ color: C.sub, marginBottom: 4 }}>{t} Â· {n}ìž‘</Text>
                    <View style={{ height: 10, backgroundColor: C.chip, borderRadius: 8, overflow: "hidden" }}>
                      <View style={{ width: `${Math.round(r * 100)}%`, height: "100%", backgroundColor: C.primary }} />
                    </View>
                  </View>
                );
              })}
            </Section>

            {/* ðŸ†• í”Œëž«í¼ë³„ */}
            <Section title="í”Œëž«í¼ë³„ ë¶„í¬">
              {Object.entries(analysisStats.byPlat).sort((a, b) => b[1] - a[1]).map(([p, cnt]) => (
                <View key={p} style={{ marginBottom: 8 }}>
                  <Text style={{ color: C.sub, marginBottom: 4 }}>{p} Â· {cnt}ìž‘</Text>
                  <View style={{ height: 10, backgroundColor: C.chip, borderRadius: 8, overflow: "hidden" }}>
                    <View style={{ width: `${Math.round(cnt / (analysisStats.total || 1) * 100)}%`, height: "100%", backgroundColor: C.ok }} />
                  </View>
                </View>
              ))}
            </Section>

            {/* ðŸ†• ìž¥ë¥´ë³„ */}
            <Section title="ìž¥ë¥´ë³„ ë¶„í¬">
              {Object.entries(analysisStats.byGenre).sort((a, b) => b[1] - a[1]).map(([g, cnt]) => (
                <View key={g} style={{ marginBottom: 8 }}>
                  <Text style={{ color: C.sub, marginBottom: 4 }}>{g} Â· {cnt}ìž‘</Text>
                  <View style={{ height: 10, backgroundColor: C.chip, borderRadius: 8, overflow: "hidden" }}>
                    <View style={{ width: `${Math.round(cnt / (analysisStats.total || 1) * 100)}%`, height: "100%", backgroundColor: C.a }} />
                  </View>
                </View>
              ))}
            </Section>

            {/* ðŸ†• ì½ê¸° ìƒíƒœë³„ */}
            <Section title="ì½ê¸° ìƒíƒœë³„ ë¶„í¬">
              {STATUS_OPTIONS.map(({ key, label, color }) => {
                const cnt = analysisStats.byStatus[key] || 0;
                return (
                  <View key={key} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 6 }} />
                      <Text style={{ color: C.sub }}>{label} Â· {cnt}ìž‘</Text>
                    </View>
                    <View style={{ height: 10, backgroundColor: C.chip, borderRadius: 8, overflow: "hidden" }}>
                      <View style={{ width: `${Math.round(cnt / (analysisStats.total || 1) * 100)}%`, height: "100%", backgroundColor: color }} />
                    </View>
                  </View>
                );
              })}
            </Section>

            {/* ðŸ† í‹°ì–´ ê²€í†  í†µê³„ (v2.6) */}
            <Section title="ðŸ† í‹°ì–´ ê²€í†  í˜„í™©">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                <View style={{ backgroundColor: "#8b5cf6", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 }}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 20 }}>S: {analysisStats.byTier.S}</Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{analysisStats.sRatio}%</Text>
                </View>
                <View style={{ backgroundColor: "#3b82f6", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 }}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 20 }}>A: {analysisStats.byTier.A}</Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{analysisStats.aRatio}%</Text>
                </View>
              </View>
              
              <View style={{ backgroundColor: C.bg, padding: 14, borderRadius: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ color: C.sub }}>ìˆ˜ë™ ì§€ì • ìž‘í’ˆ</Text>
                  <Text style={{ color: C.text, fontWeight: "700" }}>{analysisStats.manualTierCount}ê°œ</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ color: C.sub }}>ê°•ì œ ì§€ì • (ì ìˆ˜ ë¯¸ë‹¬)</Text>
                  <Text style={{ color: analysisStats.forcedTierCount > 0 ? C.warn : C.text, fontWeight: "700" }}>
                    {analysisStats.forcedTierCount}ê°œ
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: C.sub }}>ê²€í†  ëŒ€ê¸°</Text>
                  <Text style={{ color: analysisStats.pendingReviewCount > 0 ? "#f59e0b" : C.text, fontWeight: "700" }}>
                    {analysisStats.pendingReviewCount}ê°œ
                  </Text>
                </View>
              </View>
              
              {analysisStats.pendingReviewCount > 0 && (
                <TouchableOpacity
                  onPress={() => setScreen("review")}
                  style={{ backgroundColor: "#fef3c7", padding: 12, borderRadius: 10, marginTop: 12, alignItems: "center" }}
                >
                  <Text style={{ color: "#92400e", fontWeight: "700" }}>ðŸ† ê²€í†  íƒ­ìœ¼ë¡œ ì´ë™</Text>
                </TouchableOpacity>
              )}
            </Section>

            {/* ðŸ§  v3.5.0: ì·¨í–¥ ë°œê²¬ ì‹œìŠ¤í…œ - ì¸ì‚¬ì´íŠ¸ ì„¹ì…˜ */}
            <Section title="ðŸ§  ì·¨í–¥ ë°œê²¬">
              <TouchableOpacity
                onPress={async () => {
                  await loadInsights();
                  await loadPreferencePatterns();
                }}
                style={{ 
                  backgroundColor: C.primary, 
                  padding: 12, 
                  borderRadius: 10, 
                  alignItems: "center",
                  marginBottom: 12 
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {insightLoading ? "ë¡œë”© ì¤‘..." : "ì¸ì‚¬ì´íŠ¸ ìƒˆë¡œê³ ì¹¨"}
                </Text>
              </TouchableOpacity>

              {/* ëŒ€ê¸° ì¤‘ì¸ ì¸ì‚¬ì´íŠ¸ */}
              {insightList.filter(i => i.status === 'pending' || i.status === 'shown').length > 0 ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>
                    ðŸ’¡ ìƒˆë¡œìš´ ë°œê²¬ ({insightList.filter(i => i.status === 'pending').length}ê°œ)
                  </Text>
                  {insightList
                    .filter(i => i.status === 'pending' || i.status === 'shown')
                    .slice(0, 5)
                    .map((insight) => {
                      const meta = INSIGHT_META[insight.insight_type] || { 
                        icon: "ðŸ’­", label: "ì•Œ ìˆ˜ ì—†ìŒ", color: C.sub 
                      };
                      // evidenceëŠ” JSONìœ¼ë¡œ ì €ìž¥ë˜ì–´ ìžˆì„ ìˆ˜ ìžˆìŒ
                      let evidenceText = "";
                      try {
                        const ev = JSON.parse(insight.evidence || "null");
                        evidenceText = typeof ev === "string" ? ev : (ev?.text || "");
                      } catch {
                        evidenceText = insight.evidence || "";
                      }
                      
                      return (
                        <View
                          key={insight.id}
                          style={{
                            backgroundColor: "#fff",
                            borderLeftWidth: 4,
                            borderLeftColor: meta.color,
                            borderRadius: 12,
                            padding: 14,
                            marginBottom: 10,
                            shadowColor: "#000",
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                            elevation: 2,
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                            <Text style={{ fontSize: 20, marginRight: 8 }}>{meta.icon}</Text>
                            <Text style={{ fontWeight: "700", color: meta.color, flex: 1 }}>
                              {insight.title || meta.label}
                            </Text>
                            <View style={{ 
                              backgroundColor: meta.color + "20", 
                              paddingHorizontal: 8, 
                              paddingVertical: 2, 
                              borderRadius: 8 
                            }}>
                              <Text style={{ fontSize: 11, color: meta.color, fontWeight: "600" }}>
                                ì‹ ë¢°ë„ {Math.round((insight.confidence || 0) * 100)}%
                              </Text>
                            </View>
                          </View>
                          
                          <Text style={{ color: C.text, marginBottom: 10, lineHeight: 20 }}>
                            {insight.description || "ìƒì„¸ ë‚´ìš© ì—†ìŒ"}
                          </Text>
                          
                          {evidenceText && (
                            <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
                              ðŸ“Š ê·¼ê±°: {evidenceText}
                            </Text>
                          )}
                          
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <TouchableOpacity
                              onPress={() => handleInsightResponse(insight.id, 'confirmed')}
                              style={{
                                flex: 1,
                                backgroundColor: "#dcfce7",
                                padding: 10,
                                borderRadius: 8,
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ color: "#166534", fontWeight: "600" }}>âœ“ ë§žì•„ìš”</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleInsightResponse(insight.id, 'rejected')}
                              style={{
                                flex: 1,
                                backgroundColor: "#fee2e2",
                                padding: 10,
                                borderRadius: 8,
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ color: "#991b1b", fontWeight: "600" }}>âœ— ì•„ë‹ˆì—ìš”</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleInsightResponse(insight.id, 'skipped')}
                              style={{
                                flex: 1,
                                backgroundColor: C.chip,
                                padding: 10,
                                borderRadius: 8,
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ color: C.sub, fontWeight: "600" }}>ê±´ë„ˆë›°ê¸°</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                </View>
              ) : (
                <View style={{ 
                  backgroundColor: C.chip, 
                  padding: 16, 
                  borderRadius: 12, 
                  alignItems: "center",
                  marginBottom: 16 
                }}>
                  <Text style={{ color: C.sub, textAlign: "center" }}>
                    ì•„ì§ ìƒˆë¡œìš´ ì¸ì‚¬ì´íŠ¸ê°€ ì—†ìŠµë‹ˆë‹¤.{"\n"}
                    ë§¤ì¹­ì„ ë” ì§„í–‰í•˜ë©´ ì·¨í–¥ íŒ¨í„´ì´ ë°œê²¬ë©ë‹ˆë‹¤!
                  </Text>
                </View>
              )}

              {/* í™•ì¸ëœ ì·¨í–¥ íŒ¨í„´ ìš”ì•½ */}
              {preferencePatterns.length > 0 && (
                <View>
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>
                    ðŸ“ˆ í™•ì¸ëœ ì·¨í–¥ íŒ¨í„´ (ìƒìœ„ {Math.min(10, preferencePatterns.length)}ê°œ)
                  </Text>
                  {preferencePatterns.slice(0, 10).map((pattern, idx) => {
                    const winRate = Math.round((pattern.win_rate || 0) * 100);
                    const confidence = Math.round((pattern.confidence_lower || 0) * 100);
                    const categoryColors = {
                      genre: "#8b5cf6",
                      tag: "#3b82f6",
                      platform: "#14b8a6",
                      author: "#ec4899",
                      tier: "#f59e0b",
                      episode: "#22c55e",
                    };
                    const color = categoryColors[pattern.category] || C.sub;
                    
                    return (
                      <View
                        key={pattern.id || idx}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 10,
                          borderBottomWidth: idx < 9 ? 1 : 0,
                          borderBottomColor: C.line,
                        }}
                      >
                        <View style={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: 14, 
                          backgroundColor: color + "20",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                        }}>
                          <Text style={{ color, fontWeight: "800", fontSize: 12 }}>
                            {idx + 1}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "600", color: C.text }} numberOfLines={1}>
                            {pattern.pattern_key || "ì•Œ ìˆ˜ ì—†ìŒ"}
                          </Text>
                          <Text style={{ fontSize: 12, color: C.sub }}>
                            {pattern.category} Â· ìƒ˜í”Œ {pattern.sample_size}ê°œ
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{ fontWeight: "700", color }}>
                            {winRate}%
                          </Text>
                          <Text style={{ fontSize: 11, color: C.sub }}>
                            Â±{100 - confidence}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* ì‘ë‹µí•œ ì¸ì‚¬ì´íŠ¸ í†µê³„ */}
              {insightList.filter(i => i.status === 'confirmed' || i.status === 'rejected').length > 0 && (
                <View style={{ marginTop: 16, backgroundColor: C.bg, padding: 12, borderRadius: 10 }}>
                  <Text style={{ fontWeight: "600", color: C.text, marginBottom: 6 }}>
                    ðŸ“Š ì¸ì‚¬ì´íŠ¸ ì‘ë‹µ í˜„í™©
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ fontSize: 20, fontWeight: "800", color: "#16a34a" }}>
                        {insightList.filter(i => i.status === 'confirmed').length}
                      </Text>
                      <Text style={{ fontSize: 12, color: C.sub }}>í™•ì¸ë¨</Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ fontSize: 20, fontWeight: "800", color: "#dc2626" }}>
                        {insightList.filter(i => i.status === 'rejected').length}
                      </Text>
                      <Text style={{ fontSize: 12, color: C.sub }}>ê±°ë¶€ë¨</Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ fontSize: 20, fontWeight: "800", color: C.sub }}>
                        {insightList.filter(i => i.status === 'dismissed').length}
                      </Text>
                      <Text style={{ fontSize: 12, color: C.sub }}>ê±´ë„ˆëœ€</Text>
                    </View>
                  </View>
                </View>
              )}
            </Section>
          </>
        )}

        {/* BULK */}
        {screen === "bulk" && (
          <>
            <H>ðŸ”§ ëŒ€ëŸ‰ íŽ¸ì§‘ ëª¨ë“œ</H>
            <Section title="ì„ íƒ / ê²€ìƒ‰">
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder="ì œëª©/ìž‘ê°€/íƒœê·¸/ë©”ëª¨/í”Œëž«í¼ ê²€ìƒ‰"
              />
              <Text style={{ color: selectedIds.length > 0 ? C.primary : C.sub, marginTop: 6, fontWeight: selectedIds.length > 0 ? "800" : "400", fontSize: selectedIds.length > 0 ? 16 : 14 }}>
                {selectedIds.length > 0 ? `âœ“ ${selectedIds.length}ê°œ ì„ íƒë¨` : "ì„ íƒëœ ìž‘í’ˆ ì—†ìŒ"} / ì´ {bulkFiltered.length}
              </Text>
              {/* ðŸ”§ v3.5.1 ë””ë²„ê·¸: ì‹¤ì œ ì„ íƒëœ ID í‘œì‹œ */}
              <Text style={{ color: C.warn, fontSize: 11, marginTop: 4 }}>
                [DEBUG] IDs: {selectedIds.length > 0 ? selectedIds.slice(0, 3).map(id => id.substring(0, 6)).join(", ") + (selectedIds.length > 3 ? "..." : "") : "(ì—†ìŒ)"}
              </Text>
            </Section>

            <Section title="ì •ë ¬">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {[
                  ["ë ˆì´íŒ…", "rating"],
                  ["ì œëª©", "title"],
                  ["ë“±ë¡ìˆœ", "created"],
                  ["ì½ì€ íšŒì°¨", "read"],
                ].map(([label, key]) => (
                  <Chip
                    key={key}
                    label={label}
                    active={bulkSortKey === key}
                    onPress={() => setBulkSortKey(key)}
                  />
                ))}
              </View>
            </Section>

            <Section title="ìž‘ì—…">
              <Text style={{ fontWeight: "700", marginBottom: 6, color: C.text }}>
                íƒœê·¸ ì¶”ê°€/ì‚­ì œ
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <Input
                  placeholder="íƒœê·¸ ìž…ë ¥"
                  value={bulkTag}
                  onChangeText={setBulkTag}
                  style={{ flex: 1 }}
                />
              </View>
              {/* ðŸ·ï¸ v3.1.2: ë†ë„ ì„ íƒ UI */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ color: C.sub, marginRight: 8, fontSize: 13 }}>ë†ë„:</Text>
                {[1, 2, 3, 4, 5].map((level) => {
                  const colors = ["#94a3b8", "#60a5fa", "#22c55e", "#f59e0b", "#ef4444"];
                  const labels = ["í¬ë¯¸", "ì•½ê°„", "ë³´í†µ", "ê°•í•¨", "í•µì‹¬"];
                  return (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setBulkTagIntensity(level)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: bulkTagIntensity === level ? colors[level - 1] : C.chip,
                        marginRight: 4,
                      }}
                    >
                      <Text style={{ 
                        color: bulkTagIntensity === level ? "#fff" : C.sub, 
                        fontSize: 11, 
                        fontWeight: bulkTagIntensity === level ? "700" : "500" 
                      }}>
                        {labels[level - 1]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <PrimaryButton
                  title="ì¶”ê°€"
                  onPress={() => batchAddTag(bulkTag, bulkTagIntensity)}
                  style={{ flex: 1 }}
                />
                <OutlineButton
                  title="ì‚­ì œ"
                  onPress={() => batchRemoveTag(bulkTag)}
                  style={{ flex: 1 }}
                />
              </View>

              <View style={{ height: 12 }} />
              <Text style={{ fontWeight: "700", marginBottom: 6, color: C.text }}>
                í”Œëž«í¼ ì¼ê´„ ì„¤ì •
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {PLATFORM_OPTIONS.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    active={bulkPlats.includes(p)}
                    onPress={() => {
                      setBulkPlats((prev) =>
                        prev.includes(p)
                          ? prev.filter((x) => x !== p)
                          : [...prev, p]
                      );
                    }}
                  />
                ))}
              </View>
              <OutlineButton
                title="í”Œëž«í¼ ì ìš©"
                onPress={() => batchSetPlatforms(bulkPlats)}
                style={{ marginTop: 8 }}
              />

              <View style={{ height: 12 }} />
              <Text style={{ fontWeight: "700", marginBottom: 6, color: C.text }}>
                ì½ì€ íšŒì°¨ ìˆ˜ ì¦ê°
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Input
                  placeholder="Â±ìˆ«ìž (ì˜ˆ: 10, -3)"
                  value={bulkDelta}
                  onChangeText={setBulkDelta}
                  style={{ flex: 1 }}
                  keyboardType="number-pad"
                />
                <PrimaryButton
                  title="ì ìš©"
                  onPress={() => batchIncReadCount(bulkDelta)}
                />
              </View>

              {/* ðŸ†• ì½ê¸° ìƒíƒœ ì¼ê´„ ë³€ê²½ */}
              <View style={{ height: 12 }} />
              <Text style={{ fontWeight: "700", marginBottom: 6, color: C.text }}>
                ì½ê¸° ìƒíƒœ ì¼ê´„ ë³€ê²½
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {STATUS_OPTIONS.map((s) => (
                  <Chip
                    key={s.key}
                    label={s.label}
                    active={false}
                    onPress={() => batchSetStatus(s.key)}
                  />
                ))}
              </View>

              {/* ðŸ†• ìž‘í’ˆ ì—°ìž¬ìƒíƒœ ì¼ê´„ ë³€ê²½ */}
              <View style={{ height: 12 }} />
              <Text style={{ fontWeight: "700", marginBottom: 6, color: C.text }}>
                ìž‘í’ˆ ì—°ìž¬ìƒíƒœ ì¼ê´„ ë³€ê²½
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {WORK_STATUS_OPTIONS.map((ws) => (
                  <Chip
                    key={ws.key}
                    label={ws.label}
                    active={false}
                    onPress={() => batchSetWorkStatus(ws.key)}
                  />
                ))}
              </View>

              <View style={{ height: 12 }} />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <OutlineButton
                  title="ì„ íƒ ì‚­ì œ"
                  color="#E05252"
                  onPress={batchDelete}
                  style={{ flex: 1 }}
                />
                <OutlineButton
                  title="ì„ íƒ ì „ì²´ ì·¨ì†Œ"
                  onPress={() => setSelectedIds([])}
                  style={{ flex: 1 }}
                />
              </View>
            </Section>

            <Section title="ëª©ë¡(ìŠ¤í¬ë¡¤)">
              <FlatList
                data={bulkFiltered}
                keyExtractor={(item) => item.id}
                extraData={selectedIds}
                initialNumToRender={15}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={false}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  const checked = selectedIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      onPress={() => toggleSelect(item.id)}
                      style={{
                        borderWidth: 2,
                        borderColor: checked ? C.primary : C.line,
                        backgroundColor: checked ? (isDark ? "#1e3a5f" : "#e0f2fe") : C.card,
                        borderRadius: 12,
                        padding: 10,
                        marginBottom: 8,
                        flexDirection: "row",
                      }}
                    >
                      <CoverImage uri={item.cover_image} platforms={item.platforms} platformCovers={platformCovers} size={40} theme={C} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ fontWeight: "800", flex: 1, color: C.text }} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {checked && (
                            <View style={{ backgroundColor: C.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 }}>
                              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>âœ“ì„ íƒ</Text>
                            </View>
                          )}
                          <ActualTierTag novel={item} />
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                          <StatusBadge status={item.status} /><WorkStatusBadge workStatus={item.work_status} />
                        </View>
                        <Text style={{ color: C.sub, marginTop: 2, fontSize: 12 }} numberOfLines={1}>
                          {item.author || "-"} Â· {formatPlatformShort(item.platforms)} Â· {item.tags || "-"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={<Text style={{ color: C.sub, textAlign: "center", padding: 20 }}>ìž‘í’ˆì´ ì—†ìŠµë‹ˆë‹¤.</Text>}
              />
            </Section>
          </>
        )}

        {/* ðŸ–¼ï¸ COVERS - í‘œì§€ ë¼ì´ë¸ŒëŸ¬ë¦¬ (v3.4.5) */}
        {screen === "covers" && (
          <>
            <H>í‘œì§€ ë¼ì´ë¸ŒëŸ¬ë¦¬</H>

            {/* í†µê³„ ë° ë¡œë”© */}
            <Section title="ðŸ“Š ë¼ì´ë¸ŒëŸ¬ë¦¬ í˜„í™©">
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: C.text, fontWeight: "700" }}>
                    ì´ {coverLibrary.length}ìž¥
                  </Text>
                  <Text style={{ color: C.sub, fontSize: 12 }}>
                    ì‚¬ìš© ì¤‘: {coverLibrary.filter(c => c.status === "used").length}ìž¥ Â· 
                    ë¯¸ì‚¬ìš©: {coverLibrary.filter(c => c.status === "unused").length}ìž¥
                  </Text>
                  <Text style={{ color: C.sub, fontSize: 12 }}>
                    ìš©ëŸ‰: {formatFileSize(coverLibrarySize)}
                  </Text>
                </View>
                <PrimaryButton
                  title="ðŸ“· ê°¤ëŸ¬ë¦¬ì—ì„œ ì¶”ê°€"
                  onPress={importCoversFromGallery}
                  style={{ paddingHorizontal: 16 }}
                />
              </View>
              
              {coverLibraryLoading && (
                <View style={{ marginTop: 12, padding: 12, backgroundColor: C.chip, borderRadius: 8 }}>
                  <Text style={{ color: C.text, fontWeight: "600", marginBottom: 4 }}>
                    ì´ë¯¸ì§€ ì²˜ë¦¬ ì¤‘... ({coverLibraryProgress.current}/{coverLibraryProgress.total})
                  </Text>
                  <View style={{ height: 6, backgroundColor: C.line, borderRadius: 3, overflow: "hidden" }}>
                    <View style={{
                      width: `${coverLibraryProgress.total > 0 ? (coverLibraryProgress.current / coverLibraryProgress.total * 100) : 0}%`,
                      height: "100%",
                      backgroundColor: C.primary,
                    }} />
                  </View>
                </View>
              )}
            </Section>

            {/* í•„í„° */}
            <Section title="ðŸ” í•„í„°">
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {[
                  { key: "all", label: `ì „ì²´ (${coverLibrary.length})` },
                  { key: "unused", label: `ë¯¸ì‚¬ìš© (${coverLibrary.filter(c => c.status === "unused").length})` },
                  { key: "used", label: `ì‚¬ìš© ì¤‘ (${coverLibrary.filter(c => c.status === "used").length})` },
                ].map(opt => (
                  <Chip
                    key={opt.key}
                    label={opt.label}
                    active={coverLibraryFilter === opt.key}
                    onPress={() => setCoverLibraryFilter(opt.key)}
                  />
                ))}
              </View>
            </Section>

            {/* ê´€ë¦¬ */}
            <Section title="ðŸ—‘ï¸ ê´€ë¦¬">
              <OutlineButton
                title="ë¯¸ì‚¬ìš© í‘œì§€ ì „ì²´ ì‚­ì œ"
                onPress={removeAllUnusedCovers}
                color={C.warn}
              />
            </Section>

            {/* ê°¤ëŸ¬ë¦¬ */}
            <Section title="ðŸ–¼ï¸ í‘œì§€ ê°¤ëŸ¬ë¦¬">
              {(() => {
                const filtered = coverLibrary.filter(c => {
                  if (coverLibraryFilter === "unused") return c.status === "unused";
                  if (coverLibraryFilter === "used") return c.status === "used";
                  return true;
                });
                
                if (filtered.length === 0) {
                  return (
                    <Text style={{ color: C.sub, textAlign: "center", padding: 40 }}>
                      {coverLibrary.length === 0 
                        ? "í‘œì§€ê°€ ì—†ìŠµë‹ˆë‹¤.\nê°¤ëŸ¬ë¦¬ì—ì„œ ì´ë¯¸ì§€ë¥¼ ì¶”ê°€í•´ë³´ì„¸ìš”!"
                        : "í•´ë‹¹í•˜ëŠ” í‘œì§€ê°€ ì—†ìŠµë‹ˆë‹¤."}
                    </Text>
                  );
                }
                
                return (
                  <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    scrollEnabled={false}
                    columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
                    renderItem={({ item }) => {
                      const isUsed = item.status === "used";
                      const novel = isUsed ? list.find(n => n.id === item.novel_id) : null;
                      
                      return (
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            aspectRatio: 0.7,
                            maxWidth: "32%",
                            borderRadius: 8,
                            overflow: "hidden",
                            borderWidth: 2,
                            borderColor: isUsed ? C.ok : C.line,
                            position: "relative",
                          }}
                          onPress={() => {
                            if (!isUsed) {
                              removeCoverFromLibrary(item.id);
                            } else {
                              Alert.alert(
                                "ì‚¬ìš© ì¤‘",
                                `ì´ í‘œì§€ëŠ” "${novel?.title || "ì•Œ ìˆ˜ ì—†ìŒ"}"ì—ì„œ ì‚¬ìš© ì¤‘ìž…ë‹ˆë‹¤.`,
                                [{ text: "í™•ì¸" }]
                              );
                            }
                          }}
                        >
                          <ExpoImage
                            source={{ uri: item.file_path }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                          {/* ìƒíƒœ ë±ƒì§€ */}
                          <View style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            backgroundColor: isUsed ? C.ok : C.sub,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}>
                            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
                              {isUsed ? "ì‚¬ìš© ì¤‘" : "ë¯¸ì‚¬ìš©"}
                            </Text>
                          </View>
                          {/* ì—°ê²°ëœ ìž‘í’ˆëª… */}
                          {isUsed && novel && (
                            <View style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              backgroundColor: "rgba(0,0,0,0.7)",
                              padding: 4,
                            }}>
                              <Text style={{ color: "#fff", fontSize: 9, fontWeight: "600" }} numberOfLines={1}>
                                {novel.title}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    }}
                    ListEmptyComponent={<Text style={{ color: C.sub, textAlign: "center" }}>í‘œì§€ê°€ ì—†ìŠµë‹ˆë‹¤.</Text>}
                  />
                );
              })()}
            </Section>
          </>
        )}

        {/* ðŸ†• SETTINGS */}
        {screen === "settings" && (
          <>
            <H>ì„¤ì •</H>
            
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {/* ðŸ†• Phase 2: ì„œë¸Œíƒ­ ë„¤ë¹„ê²Œì´ì…˜ (v3.2.1) */}
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            <View style={{ 
              flexDirection: "row", 
              backgroundColor: C.card, 
              borderRadius: 12, 
              padding: 4, 
              marginBottom: 16,
              borderWidth: 1,
              borderColor: C.line,
            }}>
              {[
                { key: "app", label: "ðŸŽ¯ ì•± ì„¤ì •" },
                { key: "tags", label: "ðŸ·ï¸ íƒœê·¸" },
                { key: "analysis", label: "ðŸ“Š ë¶„ì„" },
                { key: "backup", label: "ðŸ’¾ ë°±ì—…" },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setSettingsSubTab(tab.key)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 4,
                    borderRadius: 10,
                    backgroundColor: settingsSubTab === tab.key ? C.primary : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ 
                    fontSize: 12, 
                    fontWeight: "700", 
                    color: settingsSubTab === tab.key ? "#fff" : C.sub,
                  }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {/* ðŸŽ¯ ì•± ì„¤ì • ì„œë¸Œíƒ­ */}
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {settingsSubTab === "app" && (
              <>
            <Section title="í…Œë§ˆ">
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: C.text, fontWeight: "700" }}>ë‹¤í¬ ëª¨ë“œ</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Chip label="ì‹œìŠ¤í…œ" active={darkMode === null} onPress={() => setDarkMode(null)} />
                  <Chip label="ë¼ì´íŠ¸" active={darkMode === false} onPress={() => setDarkMode(false)} />
                  <Chip label="ë‹¤í¬" active={darkMode === true} onPress={() => setDarkMode(true)} />
                </View>
              </View>
              
              {/* ðŸ†• v3.4.4: ì „ì²´ í™”ë©´ ëª¨ë“œ */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontWeight: "700" }}>ì „ì²´ í™”ë©´ ëª¨ë“œ</Text>
                  <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>
                    ìƒë‹¨ ìƒíƒœë°”ì™€ í•˜ë‹¨ ë„¤ë¹„ê²Œì´ì…˜ ë°”ë¥¼ ìˆ¨ê¹ë‹ˆë‹¤ (Android)
                  </Text>
                </View>
                <Switch
                  value={appSettings.fullscreenMode === true}
                  onValueChange={(v) => {
                    saveAppSettings({ fullscreenMode: v });
                    // Android ë„¤ë¹„ê²Œì´ì…˜ ë°” ìˆ¨ê¸°ê¸°/í‘œì‹œ
                    // ðŸ”§ v3.4.6: NavigationBar null ì²´í¬ ì¶”ê°€
                    if (Platform.OS === "android" && NavigationBar) {
                      try {
                        if (v) {
                          NavigationBar.setVisibilityAsync("hidden");
                          NavigationBar.setBehaviorAsync("overlay-swipe");
                        } else {
                          NavigationBar.setVisibilityAsync("visible");
                        }
                      } catch (e) {
                        console.warn("NavigationBar error:", e);
                      }
                    }
                  }}
                />
              </View>
            </Section>

            {/* ðŸ–¼ï¸ í‘œì§€ ë¼ì´ë¸ŒëŸ¬ë¦¬ ì„¤ì • (v3.4.5) */}
            <Section title="ðŸ–¼ï¸ í‘œì§€ ë¼ì´ë¸ŒëŸ¬ë¦¬">
              <Text style={{ color: C.sub, marginBottom: 12 }}>
                ê°¤ëŸ¬ë¦¬ì—ì„œ ì´ë¯¸ì§€ë¥¼ ê°€ì ¸ì˜¬ ë•Œ ì ìš©ë˜ëŠ” ì••ì¶• ì„¤ì •ìž…ë‹ˆë‹¤.
              </Text>
              
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>ì´ë¯¸ì§€ ì••ì¶• ìˆ˜ì¤€</Text>
              <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 12 }}>
                {[
                  { key: "original", label: "ì›ë³¸ ìœ ì§€", desc: "ì••ì¶• ì—†ìŒ (1~5MB/ìž¥)" },
                  { key: "light", label: "ê°€ë²¼ìš´ ì••ì¶• (ê¶Œìž¥)", desc: "80% í’ˆì§ˆ, ìµœëŒ€ 1200px (200~500KB/ìž¥)" },
                  { key: "medium", label: "ì¤‘ê°„ ì••ì¶•", desc: "60% í’ˆì§ˆ, ìµœëŒ€ 800px (80~200KB/ìž¥)" },
                  { key: "heavy", label: "ê°•í•œ ì••ì¶•", desc: "40% í’ˆì§ˆ, ìµœëŒ€ 600px (30~80KB/ìž¥)" },
                ].map((opt, idx) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => {
                      saveAppSettings({
                        coverLibrary: { ...appSettings.coverLibrary, compressionLevel: opt.key }
                      });
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                      borderBottomWidth: idx < 3 ? 1 : 0,
                      borderBottomColor: C.line,
                    }}
                  >
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: (appSettings.coverLibrary?.compressionLevel || "light") === opt.key ? C.primary : C.line,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}>
                      {(appSettings.coverLibrary?.compressionLevel || "light") === opt.key && (
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary }} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.text, fontWeight: "600" }}>{opt.label}</Text>
                      <Text style={{ color: C.sub, fontSize: 11 }}>{opt.desc}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Section>

            {/* âš™ï¸ í‹°ì–´ ì‹œìŠ¤í…œ ì„¤ì • (v2.6) */}
            <Section title="ðŸ† í‹°ì–´ ì‹œìŠ¤í…œ">
              <Text style={{ color: C.sub, marginBottom: 12 }}>
                S/A í‹°ì–´ ì§„ìž… ê¸°ì¤€ê³¼ ìžë™ ìŠ¹ì¸ ì¡°ê±´ì„ ì„¤ì •í•©ë‹ˆë‹¤.
              </Text>
              
              {/* í‹°ì–´ ìž„ê³„ê°’ ì„¤ì • */}
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>í‹°ì–´ ìž„ê³„ê°’ (ë ˆì´íŒ…)</Text>
              <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 12, marginBottom: 16 }}>
                {["S", "A", "B+", "B", "B-"].map((tier) => (
                  <View key={tier} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ backgroundColor: getTierColor(tier), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                        <Text style={{ color: "#fff", fontWeight: "800" }}>{tier}</Text>
                      </View>
                      <Text style={{ color: C.sub }}>ì´ìƒ</Text>
                    </View>
                    <TextInput
                      value={String(appSettings.tierThresholds?.[tier] || DEFAULT_SETTINGS.tierThresholds[tier])}
                      onChangeText={(v) => {
                        const num = parseInt(v) || DEFAULT_SETTINGS.tierThresholds[tier];
                        saveAppSettings({
                          tierThresholds: { ...appSettings.tierThresholds, [tier]: num }
                        });
                      }}
                      keyboardType="number-pad"
                      style={{
                        backgroundColor: C.card,
                        borderWidth: 1,
                        borderColor: C.line,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        width: 80,
                        textAlign: "center",
                        color: C.text,
                        fontWeight: "700",
                      }}
                    />
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => {
                    saveAppSettings({ tierThresholds: DEFAULT_SETTINGS.tierThresholds });
                    Alert.alert("ì™„ë£Œ", "í‹°ì–´ ìž„ê³„ê°’ì´ ê¸°ë³¸ê°’ìœ¼ë¡œ ë³µì›ë˜ì—ˆìŠµë‹ˆë‹¤.");
                  }}
                  style={{ backgroundColor: C.chip, padding: 10, borderRadius: 8, alignItems: "center", marginTop: 4 }}
                >
                  <Text style={{ color: C.sub, fontWeight: "600" }}>ê¸°ë³¸ê°’ ë³µì›</Text>
                </TouchableOpacity>
              </View>
              
              {/* ìžë™ ìŠ¹ì¸ ì„¤ì • */}
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>ìžë™ ìŠ¹ì¸</Text>
              <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 12, marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontWeight: "600" }}>ìžë™ ìŠ¹ì¸ í™œì„±í™”</Text>
                    <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>ì¡°ê±´ ì¶©ì¡± ì‹œ ê²€í†  ì—†ì´ ìžë™ S/A ì§„ìž…</Text>
                  </View>
                  <Switch
                    value={appSettings.autoApproveEnabled || false}
                    onValueChange={(v) => saveAppSettings({ autoApproveEnabled: v })}
                  />
                </View>
                
                {appSettings.autoApproveEnabled && (
                  <>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ color: C.text }}>ìµœì†Œ ìŠ¹ìˆ˜</Text>
                      <TextInput
                        value={String(appSettings.autoApproveMinWins || 10)}
                        onChangeText={(v) => saveAppSettings({ autoApproveMinWins: parseInt(v) || 10 })}
                        keyboardType="number-pad"
                        style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, width: 60, textAlign: "center", color: C.text }}
                      />
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ color: C.text }}>ìµœëŒ€ íŒ¨ìˆ˜</Text>
                      <TextInput
                        value={String(appSettings.autoApproveMaxLosses || 3)}
                        onChangeText={(v) => saveAppSettings({ autoApproveMaxLosses: parseInt(v) || 3 })}
                        keyboardType="number-pad"
                        style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, width: 60, textAlign: "center", color: C.text }}
                      />
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ color: C.text }}>ìµœì†Œ ë§¤ì¹­ ìˆ˜</Text>
                      <TextInput
                        value={String(appSettings.autoApproveMinMatches || 15)}
                        onChangeText={(v) => saveAppSettings({ autoApproveMinMatches: parseInt(v) || 15 })}
                        keyboardType="number-pad"
                        style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, width: 60, textAlign: "center", color: C.text }}
                      />
                    </View>
                  </>
                )}
              </View>
              
              {/* ê¸°íƒ€ ì˜µì…˜ */}
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>ê¸°íƒ€ ì˜µì…˜</Text>
              <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontWeight: "600" }}>í™ˆ í™”ë©´ ê²€í†  ë°°ë„ˆ</Text>
                    <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>ê²€í†  ëŒ€ê¸° ì‹œ í™ˆ í™”ë©´ ìƒë‹¨ì— ì•Œë¦¼ í‘œì‹œ</Text>
                  </View>
                  <Switch
                    value={appSettings.showReviewBanner !== false}
                    onValueChange={(v) => saveAppSettings({ showReviewBanner: v })}
                  />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontWeight: "600" }}>ë˜ëŒë¦¬ê¸° ìŠ¤íƒ í¬ê¸°</Text>
                    <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>ìµœëŒ€ ì €ìž¥í•  ë˜ëŒë¦¬ê¸° í•­ëª© ìˆ˜</Text>
                  </View>
                  <TextInput
                    value={String(appSettings.undoStackSize || 30)}
                    onChangeText={(v) => saveAppSettings({ undoStackSize: parseInt(v) || 30 })}
                    keyboardType="number-pad"
                    style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, width: 60, textAlign: "center", color: C.text }}
                  />
                </View>
              </View>
            </Section>
            
            {/* ðŸ“‹ ì˜ˆì •íƒ­ í™•ìž¥ í•„ë“œ ì„¤ì • (v3.4) */}
            <Section title="ðŸ“‹ ì˜ˆì •íƒ­ í™•ìž¥ í•„ë“œ">
              <Text style={{ color: C.sub, marginBottom: 12 }}>
                ì˜ˆì • ìž‘í’ˆ ë“±ë¡/íŽ¸ì§‘ ì‹œ í‘œì‹œí•  ì¶”ê°€ í•„ë“œë¥¼ ì„ íƒí•©ë‹ˆë‹¤.
              </Text>
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontWeight: "600" }}>ðŸ“… ì½ê¸° ì‹œìž‘ ì˜ˆì •ì¼</Text>
                    <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>ì–¸ì œë¶€í„° ì½ì„ ì˜ˆì •ì¸ì§€ ë‚ ì§œ ì„¤ì •</Text>
                  </View>
                  <Switch
                    value={appSettings.plannedFields?.showScheduledStart !== false}
                    onValueChange={(v) => saveAppSettings({ 
                      plannedFields: { 
                        ...appSettings.plannedFields, 
                        showScheduledStart: v 
                      } 
                    })}
                  />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontWeight: "600" }}>ðŸ“Š ì˜ˆìƒ ë ˆì´íŒ… (ìˆ«ìž)</Text>
                    <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>ì˜ˆìƒ í‹°ì–´ ëŒ€ì‹  ì§ì ‘ ìˆ«ìžë¡œ ìž…ë ¥</Text>
                  </View>
                  <Switch
                    value={appSettings.plannedFields?.showExpectedRating === true}
                    onValueChange={(v) => saveAppSettings({ 
                      plannedFields: { 
                        ...appSettings.plannedFields, 
                        showExpectedRating: v 
                      } 
                    })}
                  />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontWeight: "600" }}>ðŸ“š ë¹„ìŠ·í•œ ìž‘í’ˆ</Text>
                    <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>ë³¸ ëª©ë¡ì—ì„œ ìœ ì‚¬ ìž‘í’ˆ ì„ íƒ (ê³ ê¸‰)</Text>
                  </View>
                  <Switch
                    value={appSettings.plannedFields?.showSimilarNovels === true}
                    onValueChange={(v) => saveAppSettings({ 
                      plannedFields: { 
                        ...appSettings.plannedFields, 
                        showSimilarNovels: v 
                      } 
                    })}
                  />
                </View>
              </View>
            </Section>

            {/* â†©ï¸ ë˜ëŒë¦¬ê¸° (v2.6) */}
            {undoStack.length > 0 && (
              <Section title="â†©ï¸ ë˜ëŒë¦¬ê¸°">
                <Text style={{ color: C.sub, marginBottom: 8 }}>ìµœê·¼ {undoStack.length}ê°œ ìž‘ì—…ì„ ë˜ëŒë¦´ ìˆ˜ ìžˆìŠµë‹ˆë‹¤.</Text>
                <PrimaryButton title="ë§ˆì§€ë§‰ ìž‘ì—… ë˜ëŒë¦¬ê¸°" onPress={performUndo} />
                <View style={{ marginTop: 12 }}>
                  {undoStack.slice(0, 5).map((item, idx) => (
                    <View key={idx} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.line }}>
                      <Text style={{ color: C.sub, fontSize: 12, marginRight: 8 }}>{idx + 1}.</Text>
                      <Text style={{ color: C.text, fontSize: 13, flex: 1 }} numberOfLines={1}>{item.description}</Text>
                      <Text style={{ color: C.sub, fontSize: 11 }}>
                        {(() => {
                          const ago = Date.now() - item.at;
                          if (ago < 60000) return "ë°©ê¸ˆ ì „";
                          if (ago < 3600000) return `${Math.floor(ago / 60000)}ë¶„ ì „`;
                          if (ago < 86400000) return `${Math.floor(ago / 3600000)}ì‹œê°„ ì „`;
                          return `${Math.floor(ago / 86400000)}ì¼ ì „`;
                        })()}
                      </Text>
                    </View>
                  ))}
                </View>
                {undoStack.length > 5 && (
                  <Text style={{ color: C.sub, fontSize: 11, marginTop: 8, textAlign: "center" }}>
                    +{undoStack.length - 5}ê°œ ë”
                  </Text>
                )}
                <OutlineButton
                  title="ë˜ëŒë¦¬ê¸° ìŠ¤íƒ ë¹„ìš°ê¸°"
                  onPress={() => {
                    Alert.alert("í™•ì¸", "ëª¨ë“  ë˜ëŒë¦¬ê¸° ê¸°ë¡ì„ ì‚­ì œí• ê¹Œìš”?", [
                      { text: "ì·¨ì†Œ" },
                      { text: "ì‚­ì œ", style: "destructive", onPress: () => setUndoStack([]) }
                    ]);
                  }}
                  style={{ marginTop: 12 }}
                  color={C.warn}
                />
              </Section>
            )}
              </>
            )}
            
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {/* ðŸ·ï¸ íƒœê·¸ ê´€ë¦¬ ì„œë¸Œíƒ­ */}
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {settingsSubTab === "tags" && (
              <>
            <Section title="ðŸ·ï¸ íƒœê·¸ ê´€ë¦¬">
              <Text style={{ color: C.sub, marginBottom: 16 }}>
                ëª¨ë“  íƒœê·¸ë¥¼ ì¹´í…Œê³ ë¦¬ë³„ë¡œ ê´€ë¦¬í•©ë‹ˆë‹¤. ê¸°ë³¸ íƒœê·¸ ìˆ¨ê¸°ê¸°, ì»¤ìŠ¤í…€ íƒœê·¸ ì¶”ê°€/ì‚­ì œ, 
                ì¹´í…Œê³ ë¦¬ ìŠ¹ê²©/ê°•ë“±, ìƒë‹¨ ê³ ì • ë“± ë‹¤ì–‘í•œ ê¸°ëŠ¥ì„ ì œê³µí•©ë‹ˆë‹¤.
              </Text>
              
              {/* ë©”ì¸ ë²„íŠ¼ */}
              <TouchableOpacity
                onPress={() => setTagManagerModalOpen(true)}
                style={{
                  backgroundColor: C.primary,
                  padding: 16,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
                  ðŸ·ï¸ ì „ì²´ íƒœê·¸ ê´€ë¦¬ ì—´ê¸°
                </Text>
              </TouchableOpacity>
              
              {/* ë¹ ë¥¸ ìœ í‹¸ë¦¬í‹° */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={cleanupDuplicateTags}
                  style={{
                    flex: 1,
                    backgroundColor: C.chip,
                    padding: 12,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: C.text, fontWeight: "600" }}>ðŸ”„ ì¤‘ë³µ ì •ë¦¬</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={cleanupUnusedTags}
                  style={{
                    flex: 1,
                    backgroundColor: "#fee2e2",
                    padding: 12,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: C.warn, fontWeight: "600" }}>ðŸ—‘ï¸ ë¯¸ì‚¬ìš© ì •ë¦¬</Text>
                </TouchableOpacity>
              </View>
              
              {/* íƒœê·¸ í†µê³„ */}
              <View style={{ backgroundColor: C.bg, padding: 14, borderRadius: 12 }}>
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>ðŸ“Š íƒœê·¸ í†µê³„</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  <View style={{ backgroundColor: "#dcfce7", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: "#166534", fontSize: 12 }}>ê¸°ë³¸ ëŒ€ìž¥ë¥´ {MAJOR_GENRES.length}</Text>
                  </View>
                  <View style={{ backgroundColor: "#f0fdf4", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: "#15803d", fontSize: 12 }}>ê¸°ë³¸ ë¶€ìž¥ë¥´ {SUB_GENRES.length}</Text>
                  </View>
                  <View style={{ backgroundColor: "#e0e7ff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: "#3730a3", fontSize: 12 }}>ê¸°ë³¸ ì¼ë°˜ {ALL_DEFAULT_TAGS.length}</Text>
                  </View>
                  <View style={{ backgroundColor: C.chip, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: C.text, fontSize: 12 }}>ì»¤ìŠ¤í…€ {customTags.length}</Text>
                  </View>
                  <View style={{ backgroundColor: "#dbeafe", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: "#1d4ed8", fontSize: 12 }}>ì¡°í•©ì‹ {comboTags.length}</Text>
                  </View>
                  <View style={{ backgroundColor: "#fef3c7", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: "#92400e", fontSize: 12 }}>ðŸ“Œ ê³ ì • {pinnedTags.length}</Text>
                  </View>
                  {hiddenTags.length > 0 && (
                    <View style={{ backgroundColor: "#f3f4f6", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                      <Text style={{ color: "#6b7280", fontSize: 12 }}>ðŸš« ìˆ¨ê¹€ {hiddenTags.length}</Text>
                    </View>
                  )}
                </View>
              </View>
              
              {/* ðŸŽ­ v2.8: íƒœê·¸ ì†ì„± ê´€ë¦¬ */}
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>ðŸŽ­ íƒœê·¸ ì†ì„± (ê¸ì •/ë¶€ì •/ì¤‘ë¦½)</Text>
                <Text style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>
                  íƒœê·¸ë¥¼ ê¸ì •(ì„ í˜¸)/ë¶€ì •(ê¸°í”¼)/ì¤‘ë¦½ìœ¼ë¡œ ë¶„ë¥˜í•˜ì—¬ ì·¨í–¥ ë¶„ì„ì— í™œìš©í•©ë‹ˆë‹¤.
                  ê¸°ë³¸ ë¶„ë¥˜ê°€ ì ìš©ë˜ì–´ ìžˆìœ¼ë©°, ì›í•˜ëŠ” íƒœê·¸ì˜ ì†ì„±ì„ ë³€ê²½í•  ìˆ˜ ìžˆìŠµë‹ˆë‹¤.
                </Text>
                
                {/* ì†ì„±ë³„ í˜„í™© ìš”ì•½ */}
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                  <View style={{ flex: 1, backgroundColor: SENTIMENT_COLORS[TAG_SENTIMENT.POSITIVE].bg, padding: 10, borderRadius: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: SENTIMENT_COLORS[TAG_SENTIMENT.POSITIVE].text }}>
                      ðŸ‘ {Object.values({ ...DEFAULT_TAG_SENTIMENTS, ...tagSentiments }).filter(s => s === TAG_SENTIMENT.POSITIVE).length}
                    </Text>
                    <Text style={{ fontSize: 11, color: SENTIMENT_COLORS[TAG_SENTIMENT.POSITIVE].text }}>ê¸ì •</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: SENTIMENT_COLORS[TAG_SENTIMENT.NEGATIVE].bg, padding: 10, borderRadius: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: SENTIMENT_COLORS[TAG_SENTIMENT.NEGATIVE].text }}>
                      ðŸ‘Ž {Object.values({ ...DEFAULT_TAG_SENTIMENTS, ...tagSentiments }).filter(s => s === TAG_SENTIMENT.NEGATIVE).length}
                    </Text>
                    <Text style={{ fontSize: 11, color: SENTIMENT_COLORS[TAG_SENTIMENT.NEGATIVE].text }}>ë¶€ì •</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: SENTIMENT_COLORS[TAG_SENTIMENT.NEUTRAL].bg, padding: 10, borderRadius: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: SENTIMENT_COLORS[TAG_SENTIMENT.NEUTRAL].text }}>
                      âš–ï¸ {Object.keys(tagSentiments).filter(t => tagSentiments[t] === TAG_SENTIMENT.NEUTRAL).length}
                    </Text>
                    <Text style={{ fontSize: 11, color: SENTIMENT_COLORS[TAG_SENTIMENT.NEUTRAL].text }}>ë³€ê²½ë¨</Text>
                  </View>
                </View>

                {/* ì‚¬ìš©ìž ì»¤ìŠ¤í…€ ì†ì„± ëª©ë¡ */}
                {Object.keys(tagSentiments).length > 0 && (
                  <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 10, marginBottom: 12 }}>
                    <Text style={{ fontWeight: "600", color: C.text, marginBottom: 8 }}>âœï¸ ë‚´ê°€ ë³€ê²½í•œ ì†ì„±</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {Object.entries(tagSentiments).map(([tag, sentiment]) => {
                        const style = SENTIMENT_COLORS[sentiment];
                        return (
                          <TouchableOpacity
                            key={tag}
                            onPress={() => {
                              Alert.alert(
                                `"${tag}" ì†ì„± ë³€ê²½`,
                                "íƒœê·¸ì˜ ì†ì„±ì„ ì„ íƒí•˜ì„¸ìš”",
                                [
                                  { text: "ðŸ‘ ê¸ì •", onPress: () => setTagSentiment(tag, TAG_SENTIMENT.POSITIVE) },
                                  { text: "ðŸ‘Ž ë¶€ì •", onPress: () => setTagSentiment(tag, TAG_SENTIMENT.NEGATIVE) },
                                  { text: "âš–ï¸ ì¤‘ë¦½", onPress: () => setTagSentiment(tag, TAG_SENTIMENT.NEUTRAL) },
                                  { text: "ðŸ”„ ê¸°ë³¸ê°’ ë³µì›", onPress: () => {
                                    const updated = { ...tagSentiments };
                                    delete updated[tag];
                                    saveTagSentiments(updated);
                                  }},
                                  { text: "ì·¨ì†Œ", style: "cancel" },
                                ]
                              );
                            }}
                            style={{
                              backgroundColor: style.bg,
                              borderWidth: 1,
                              borderColor: style.border,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 8,
                            }}
                          >
                            <Text style={{ color: style.text, fontSize: 12, fontWeight: "600" }}>
                              {style.emoji} {tag}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* íƒœê·¸ ì†ì„± ë³€ê²½í•˜ê¸° (ì „ì²´ íƒœê·¸ ê´€ë¦¬ ëª¨ë‹¬ ì—°ë™) */}
                <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
                  ðŸ’¡ ì „ì²´ íƒœê·¸ ê´€ë¦¬ì—ì„œ íƒœê·¸ë¥¼ ê¸¸ê²Œ ëˆ„ë¥´ë©´ ì†ì„±ì„ ë³€ê²½í•  ìˆ˜ ìžˆìŠµë‹ˆë‹¤.
                </Text>
                
                {/* ì‚¬ìš©ìž ë³€ê²½ ì´ˆê¸°í™” */}
                {Object.keys(tagSentiments).length > 0 && (
                  <OutlineButton
                    title="ðŸ”„ ëª¨ë“  íƒœê·¸ ì†ì„± ê¸°ë³¸ê°’ìœ¼ë¡œ ì´ˆê¸°í™”"
                    onPress={() => {
                      Alert.alert(
                        "íƒœê·¸ ì†ì„± ì´ˆê¸°í™”",
                        "ëª¨ë“  íƒœê·¸ì˜ ì†ì„±ì„ ê¸°ë³¸ê°’ìœ¼ë¡œ ë˜ëŒë¦½ë‹ˆë‹¤.",
                        [
                          { text: "ì·¨ì†Œ", style: "cancel" },
                          { text: "ì´ˆê¸°í™”", style: "destructive", onPress: () => saveTagSentiments({}) },
                        ]
                      );
                    }}
                    color={C.warn}
                    style={{ marginTop: 8 }}
                  />
                )}
              </View>
            </Section>

            {/* ðŸ”— v3.0.4: ì¡°í•© ìš”ì†Œ ê´€ë¦¬ */}
            <Section title="ðŸ”— ì¡°í•©ì‹ íƒœê·¸ ìš”ì†Œ ê´€ë¦¬">
              <Text style={{ color: C.sub, marginBottom: 12 }}>
                ì¡°í•©ì‹ íƒœê·¸ì˜ íŠ¹ì„±(ì˜ˆ: ë¨¼ì¹˜í‚¨, ë˜‘ë˜‘í•œ)ê³¼ ëŒ€ìƒ(ì˜ˆ: ì£¼ì¸ê³µ, ížˆë¡œì¸)ì„ ê´€ë¦¬í•©ë‹ˆë‹¤.
                ì»¤ìŠ¤í…€ ìš”ì†Œë¥¼ ì¶”ê°€í•˜ì—¬ ë” ë‹¤ì–‘í•œ ì¡°í•©ì„ ë§Œë“¤ ìˆ˜ ìžˆìŠµë‹ˆë‹¤.
              </Text>
              
              {/* ìš”ì†Œ í†µê³„ */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: "#e0e7ff", padding: 12, borderRadius: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: "#3730a3" }}>
                    {COMBO_TAG_TRAITS.length + customComboTraits.length}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#3730a3" }}>íŠ¹ì„± (ê¸°ë³¸ {COMBO_TAG_TRAITS.length} + ì»¤ìŠ¤í…€ {customComboTraits.length})</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: "#dbeafe", padding: 12, borderRadius: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: "#1d4ed8" }}>
                    {COMBO_TAG_TARGETS.length + customComboTargets.length}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#1d4ed8" }}>ëŒ€ìƒ (ê¸°ë³¸ {COMBO_TAG_TARGETS.length} + ì»¤ìŠ¤í…€ {customComboTargets.length})</Text>
                </View>
              </View>

              {/* íŠ¹ì„± ê´€ë¦¬ */}
              <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 12, marginBottom: 12 }}>
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>âœ¨ íŠ¹ì„± (ì„±í–¥/ì„±ê²©)</Text>
                <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
                  ì»¤ìŠ¤í…€ íŠ¹ì„±ì„ ì¶”ê°€í•˜ë©´ ì¡°í•©ì‹ íƒœê·¸ ìƒì„± ì‹œ ì‚¬ìš©í•  ìˆ˜ ìžˆìŠµë‹ˆë‹¤.
                </Text>
                
                {/* ì»¤ìŠ¤í…€ íŠ¹ì„± ì¶”ê°€ */}
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                  <TextInput
                    placeholder="ìƒˆ íŠ¹ì„± ìž…ë ¥ (ì˜ˆ: ëƒ‰ì†Œì ì¸)"
                    placeholderTextColor="#9aa8bd"
                    style={{
                      flex: 1,
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: C.line,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontSize: 14,
                      color: C.text,
                    }}
                    value={newComboTraitInput}
                    onChangeText={setNewComboTraitInput}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      addCustomComboTrait(newComboTraitInput);
                      setNewComboTraitInput("");
                    }}
                    style={{
                      backgroundColor: C.primary,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>ì¶”ê°€</Text>
                  </TouchableOpacity>
                </View>
                
                {/* ì»¤ìŠ¤í…€ íŠ¹ì„± ëª©ë¡ */}
                {customComboTraits.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: C.sub, fontSize: 12, marginBottom: 6 }}>ë‚´ ì»¤ìŠ¤í…€ íŠ¹ì„±:</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {customComboTraits.map(trait => (
                        <TouchableOpacity
                          key={trait}
                          onPress={() => {
                            Alert.alert(
                              `"${trait}" ì‚­ì œ`,
                              "ì´ ì»¤ìŠ¤í…€ íŠ¹ì„±ì„ ì‚­ì œí• ê¹Œìš”?",
                              [
                                { text: "ì·¨ì†Œ" },
                                { text: "ì‚­ì œ", style: "destructive", onPress: () => removeCustomComboTrait(trait) }
                              ]
                            );
                          }}
                          style={{
                            backgroundColor: "#e0e7ff",
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: "#a5b4fc",
                          }}
                        >
                          <Text style={{ color: "#3730a3", fontSize: 12, fontWeight: "600" }}>{trait} âœ•</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* ëŒ€ìƒ ê´€ë¦¬ */}
              <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 12 }}>
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>ðŸŽ¯ ëŒ€ìƒ (ì¸ë¬¼ ìœ í˜•)</Text>
                <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
                  ì»¤ìŠ¤í…€ ëŒ€ìƒì„ ì¶”ê°€í•˜ë©´ ì¡°í•©ì‹ íƒœê·¸ ìƒì„± ì‹œ ì‚¬ìš©í•  ìˆ˜ ìžˆìŠµë‹ˆë‹¤.
                </Text>
                
                {/* ì»¤ìŠ¤í…€ ëŒ€ìƒ ì¶”ê°€ */}
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                  <TextInput
                    placeholder="ìƒˆ ëŒ€ìƒ ìž…ë ¥ (ì˜ˆ: ì‚¬ë¶€)"
                    placeholderTextColor="#9aa8bd"
                    style={{
                      flex: 1,
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: C.line,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontSize: 14,
                      color: C.text,
                    }}
                    value={newComboTargetInput}
                    onChangeText={setNewComboTargetInput}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      addCustomComboTarget(newComboTargetInput);
                      setNewComboTargetInput("");
                    }}
                    style={{
                      backgroundColor: C.primary,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>ì¶”ê°€</Text>
                  </TouchableOpacity>
                </View>
                
                {/* ì»¤ìŠ¤í…€ ëŒ€ìƒ ëª©ë¡ */}
                {customComboTargets.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: C.sub, fontSize: 12, marginBottom: 6 }}>ë‚´ ì»¤ìŠ¤í…€ ëŒ€ìƒ:</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {customComboTargets.map(target => (
                        <TouchableOpacity
                          key={target}
                          onPress={() => {
                            Alert.alert(
                              `"${target}" ì‚­ì œ`,
                              "ì´ ì»¤ìŠ¤í…€ ëŒ€ìƒì„ ì‚­ì œí• ê¹Œìš”?",
                              [
                                { text: "ì·¨ì†Œ" },
                                { text: "ì‚­ì œ", style: "destructive", onPress: () => removeCustomComboTarget(target) }
                              ]
                            );
                          }}
                          style={{
                            backgroundColor: "#dbeafe",
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: "#93c5fd",
                          }}
                        >
                          <Text style={{ color: "#1d4ed8", fontSize: 12, fontWeight: "600" }}>{target} âœ•</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </Section>

            {/* ðŸ“ v3.2.0: íƒœê·¸ ì¢Œí‘œê³„ ê´€ë¦¬ */}
            <Section title="ðŸ“ íƒœê·¸ ì¢Œí‘œê³„ ê´€ë¦¬">
              <Text style={{ color: C.sub, marginBottom: 12 }}>
                íƒœê·¸ë“¤ì„ 2D ì¢Œí‘œê³„ì— ë°°ì¹˜í•˜ì—¬ ê´€ê³„ë¥¼ ì •ì˜í•©ë‹ˆë‹¤.{"\n"}
                â€¢ Xì¶•: ì˜ë¯¸ì  ìœ„ì¹˜ (ì˜ˆ: ì•½í•¨â†”ê°•í•¨){"\n"}
                â€¢ Yì¶•: í‘œí˜„ ê°•ë„ (ì˜ˆ: ìˆœí•¨â†”ê·¹ë‹¨ì )
              </Text>
              
              {/* ì¢Œí‘œê³„ í†µê³„ */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: isDark ? "#14532d" : "#d1fae5", padding: 12, borderRadius: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: isDark ? "#86efac" : "#065f46" }}>
                    {coordinateSystems ? Object.keys(coordinateSystems).length : 0}
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? "#86efac" : "#065f46" }}>ì¢Œí‘œê³„</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: isDark ? "#1e3a5f" : "#dbeafe", padding: 12, borderRadius: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: isDark ? "#93c5fd" : "#1d4ed8" }}>
                    {coordinateSystems ? Object.values(coordinateSystems).reduce((sum, sys) => sum + Object.keys(sys.tags || {}).length, 0) : 0}
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? "#93c5fd" : "#1d4ed8" }}>ë°°ì¹˜ëœ íƒœê·¸</Text>
                </View>
              </View>
              
              {/* ì¢Œí‘œê³„ ëª©ë¡ */}
              {coordinateSystems && Object.keys(coordinateSystems).length > 0 ? (
                <View style={{ backgroundColor: isDark ? "#1e293b" : C.bg, padding: 12, borderRadius: 12, marginBottom: 12 }}>
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 10 }}>ë“±ë¡ëœ ì¢Œí‘œê³„</Text>
                  {Object.entries(coordinateSystems).map(([sysId, sys]) => (
                    <TouchableOpacity
                      key={sysId}
                      onPress={() => {
                        setEditingCoordSystem(sys);
                        setCoordManageOpen(true);
                      }}
                      style={{
                        backgroundColor: isDark ? "#334155" : "#fff",
                        padding: 12,
                        borderRadius: 10,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: isDark ? "#475569" : C.line,
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "700", color: C.text }}>
                            {sys.name} {sys.isDefault ? "(ê¸°ë³¸)" : ""}
                          </Text>
                          <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
                            {sys.xAxis?.negative || "ìŒ"} â†” {sys.xAxis?.positive || "ì–‘"} â€¢ íƒœê·¸ {Object.keys(sys.tags || {}).length}ê°œ
                          </Text>
                        </View>
                        <Text style={{ color: C.primary, fontWeight: "600" }}>íŽ¸ì§‘ â†’</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ backgroundColor: C.bg, padding: 16, borderRadius: 12, marginBottom: 12, alignItems: "center" }}>
                  <Text style={{ color: C.sub }}>ë“±ë¡ëœ ì¢Œí‘œê³„ê°€ ì—†ìŠµë‹ˆë‹¤.</Text>
                </View>
              )}
              
              {/* ìƒˆ ì¢Œí‘œê³„ ì¶”ê°€ ë²„íŠ¼ */}
              <PrimaryButton
                title="+ ìƒˆ ì¢Œí‘œê³„ ë§Œë“¤ê¸°"
                onPress={() => {
                  const newId = `coord_${Date.now()}`;
                  const newSystem = {
                    id: newId,
                    name: "ìƒˆ ì¢Œí‘œê³„",
                    xAxis: { negative: "ìŒ", positive: "ì–‘" },
                    yAxis: { negative: "ìˆœí•œ í‘œí˜„", positive: "ê°•í•œ í‘œí˜„" },
                    tags: {},
                    isDefault: false,
                    createdAt: Date.now(),
                  };
                  setEditingCoordSystem(newSystem);
                  setCoordManageOpen(true);
                }}
              />
              
              {/* ê¸°ë³¸ ì¢Œí‘œê³„ ì´ˆê¸°í™” ë²„íŠ¼ */}
              <OutlineButton
                title="ê¸°ë³¸ ì¢Œí‘œê³„ë¡œ ì´ˆê¸°í™”"
                onPress={() => {
                  Alert.alert(
                    "ê¸°ë³¸ ì¢Œí‘œê³„ ì´ˆê¸°í™”",
                    "ê¸°ë³¸ ì¢Œí‘œê³„ 4ì¢…ì„ ì´ˆê¸°í™”í•©ë‹ˆë‹¤.\nê¸°ì¡´ ì»¤ìŠ¤í…€ ì¢Œí‘œê³„ëŠ” ìœ ì§€ë©ë‹ˆë‹¤.",
                    [
                      { text: "ì·¨ì†Œ" },
                      {
                        text: "ì´ˆê¸°í™”",
                        onPress: async () => {
                          const current = coordinateSystems || {};
                          const merged = { ...current };
                          for (const [id, sys] of Object.entries(DEFAULT_COORDINATE_SYSTEMS)) {
                            merged[id] = { ...sys };
                          }
                          setCoordinateSystems(merged);
                          await saveTagCoordinateSystems(merged);
                          Alert.alert("ì™„ë£Œ", "ê¸°ë³¸ ì¢Œí‘œê³„ê°€ ì´ˆê¸°í™”ë˜ì—ˆìŠµë‹ˆë‹¤.");
                        },
                      },
                    ]
                  );
                }}
                style={{ marginTop: 8 }}
              />
            </Section>

            {/* ðŸ”— v3.0.3: íƒœê·¸ ê´€ê³„ë„ */}
            <Section title="ðŸ”— íƒœê·¸ ê´€ê³„ë„">
              <Text style={{ color: C.sub, marginBottom: 12 }}>
                ìœ ì‚¬í•œ ì˜ë¯¸ì˜ íƒœê·¸ë“¤ì„ ê·¸ë£¹ìœ¼ë¡œ ë¬¶ê±°ë‚˜, ìƒë°˜ë˜ëŠ” íƒœê·¸ ê´€ê³„ë¥¼ ì„¤ì •í•©ë‹ˆë‹¤.
                ì´ë³€ ë¶„ì„ ì‹œ ê°™ì€ ê·¸ë£¹ì˜ íƒœê·¸ëŠ” í•˜ë‚˜ì˜ ìš”ì¸ìœ¼ë¡œ ì·¨ê¸‰ë©ë‹ˆë‹¤.
              </Text>
              
              {/* ê´€ê³„ í†µê³„ */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: "#dbeafe", padding: 12, borderRadius: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: "#1d4ed8" }}>
                    {Object.values(tagRelations.groups).filter(g => g.type === "similar").length}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#1d4ed8" }}>ìœ ì‚¬ ê·¸ë£¹</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: "#fef3c7", padding: 12, borderRadius: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: "#92400e" }}>
                    {Object.values(tagRelations.groups).filter(g => g.type === "opposite").length}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#92400e" }}>ìƒë°˜ ê´€ê³„</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: C.chip, padding: 12, borderRadius: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: C.text }}>
                    {Object.keys(tagRelations.tagToGroup).length}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.text }}>ì—°ê²°ëœ íƒœê·¸</Text>
                </View>
              </View>
              
              {/* ê·¸ë£¹ ëª©ë¡ */}
              {Object.keys(tagRelations.groups).length > 0 ? (
                <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 12, marginBottom: 12 }}>
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 10 }}>ë“±ë¡ëœ ê´€ê³„ ê·¸ë£¹</Text>
                  {Object.values(tagRelations.groups).map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      onPress={() => {
                        setTagRelationTarget(group.tags[0]);
                        setTagRelationEditGroup(group);
                        setTagRelationModalOpen(true);
                      }}
                      style={{
                        backgroundColor: group.type === "similar" ? "#dbeafe" : "#fef3c7",
                        padding: 12,
                        borderRadius: 10,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: group.type === "similar" ? "#93c5fd" : "#fcd34d",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                        <Text style={{ fontSize: 14, marginRight: 6 }}>
                          {group.type === "similar" ? "ðŸ”—" : "âš¡"}
                        </Text>
                        <Text style={{ fontWeight: "700", color: group.type === "similar" ? "#1d4ed8" : "#92400e", flex: 1 }}>
                          {group.name || `${group.tags[0]} ê·¸ë£¹`}
                        </Text>
                        <Text style={{ fontSize: 12, color: C.sub }}>
                          {group.tags.length}ê°œ íƒœê·¸
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                        {group.tags.slice(0, 6).map(tag => (
                          <View key={tag} style={{ 
                            backgroundColor: "rgba(255,255,255,0.7)", 
                            paddingHorizontal: 8, 
                            paddingVertical: 3, 
                            borderRadius: 6 
                          }}>
                            <Text style={{ fontSize: 11, color: C.text }}>{tag}</Text>
                          </View>
                        ))}
                        {group.tags.length > 6 && (
                          <Text style={{ fontSize: 11, color: C.sub, alignSelf: "center" }}>
                            +{group.tags.length - 6}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ backgroundColor: C.bg, padding: 16, borderRadius: 12, marginBottom: 12, alignItems: "center" }}>
                  <Text style={{ color: C.sub, textAlign: "center" }}>
                    ë“±ë¡ëœ ê´€ê³„ ê·¸ë£¹ì´ ì—†ìŠµë‹ˆë‹¤.{"\n"}
                    íƒœê·¸ ê´€ë¦¬ì—ì„œ íƒœê·¸ë¥¼ ê¸¸ê²Œ ëˆŒëŸ¬ ê´€ê³„ë¥¼ ì„¤ì •í•˜ì„¸ìš”.
                  </Text>
                </View>
              )}
              
              {/* ì•ˆë‚´ */}
              <View style={{ backgroundColor: "#f0f9ff", padding: 12, borderRadius: 10 }}>
                <Text style={{ color: "#0369a1", fontSize: 12, lineHeight: 18 }}>
                  ðŸ’¡ <Text style={{ fontWeight: "600" }}>ì‚¬ìš©ë²•</Text>{"\n"}
                  â€¢ ì „ì²´ íƒœê·¸ ê´€ë¦¬ì—ì„œ íƒœê·¸ë¥¼ ê¸¸ê²Œ ëˆŒëŸ¬ ê´€ê³„ íŽ¸ì§‘{"\n"}
                  â€¢ ìœ ì‚¬ íƒœê·¸: "ë¨¼ì¹˜í‚¨"ê³¼ "ì‚¬ê¸°ìº"ì²˜ëŸ¼ ë¹„ìŠ·í•œ ì˜ë¯¸{"\n"}
                  â€¢ ìƒë°˜ íƒœê·¸: "ë¨¼ì¹˜í‚¨"ê³¼ "ì„±ìž¥í˜•"ì²˜ëŸ¼ ë°˜ëŒ€ ì„±í–¥{"\n"}
                  â€¢ ì´ë³€ ë¶„ì„ ì‹œ ê°™ì€ ê·¸ë£¹ì€ í•˜ë‚˜ì˜ ìš”ì¸ìœ¼ë¡œ ì§‘ê³„
                </Text>
              </View>
              
              {/* ê´€ê³„ ë°ì´í„° ì´ˆê¸°í™” */}
              {Object.keys(tagRelations.groups).length > 0 && (
                <OutlineButton
                  title="ðŸ—‘ï¸ ëª¨ë“  íƒœê·¸ ê´€ê³„ ì´ˆê¸°í™”"
                  onPress={() => {
                    Alert.alert(
                      "ê´€ê³„ ì´ˆê¸°í™”",
                      "ëª¨ë“  íƒœê·¸ ê´€ê³„ ê·¸ë£¹ì„ ì‚­ì œí•©ë‹ˆë‹¤.",
                      [
                        { text: "ì·¨ì†Œ", style: "cancel" },
                        { 
                          text: "ì´ˆê¸°í™”", 
                          style: "destructive", 
                          onPress: () => {
                            const empty = { groups: {}, tagToGroup: {} };
                            setTagRelations(empty);
                            setAppMeta("tag_relations", empty);
                          }
                        },
                      ]
                    );
                  }}
                  color={C.warn}
                  style={{ marginTop: 12 }}
                />
              )}
            </Section>
              </>
            )}
            
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {/* ðŸ“Š ë¶„ì„ ë°ì´í„° ì„œë¸Œíƒ­ */}
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {settingsSubTab === "analysis" && (
              <>
            {/* ðŸŽ¯ v3.0.4: ë¶„ì„ ë°ì´í„° ê´€ë¦¬ */}
            <Section title="ðŸ“Š ë¶„ì„ ë°ì´í„° ê´€ë¦¬">
              <Text style={{ color: C.sub, marginBottom: 12 }}>
                ë§¤ì¹­ ì˜ˆì¸¡, ì´ë³€ ë¶„ì„, ìžë™ìŠ¹íŒ¨ ë“±ì—ì„œ ìˆ˜ì§‘ëœ í•™ìŠµ ë°ì´í„°ìž…ë‹ˆë‹¤.
              </Text>
              
              {/* í†µê³„ ìš”ì•½ */}
              <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 12, marginBottom: 12 }}>
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 10 }}>ðŸ“ˆ ë°ì´í„° í˜„í™©</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  <View style={{ flex: 1, minWidth: "45%", backgroundColor: C.card, padding: 10, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: C.sub }}>ë§¤ì¹­ ì¸ì‚¬ì´íŠ¸</Text>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#3b82f6" }}>{matchInsights.length}ê±´</Text>
                    <Text style={{ fontSize: 10, color: C.sub }}>
                      {matchInsights.filter(i => i.isUpset).length}ê±´ ì´ë³€ / 
                      {matchInsights.filter(i => i.wasCorrect).length}ê±´ ì ì¤‘
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: "45%", backgroundColor: C.card, padding: 10, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: C.sub }}>ì´ë³€ ìš”ì¸</Text>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#8b5cf6" }}>{upsetFactors.factors?.length || 0}ê°œ</Text>
                    <Text style={{ fontSize: 10, color: C.sub }}>
                      {upsetFactors.lastUpdated ? `ë§ˆì§€ë§‰ ê°±ì‹ : ${new Date(upsetFactors.lastUpdated).toLocaleDateString()}` : "ë°ì´í„° ì—†ìŒ"}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: "45%", backgroundColor: C.card, padding: 10, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: C.sub }}>íƒœê·¸ ê´€ê³„ ê·¸ë£¹</Text>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#22c55e" }}>{Object.keys(tagRelations.groups || {}).length}ê°œ</Text>
                    <Text style={{ fontSize: 10, color: C.sub }}>
                      ì—°ê²°ëœ íƒœê·¸: {Object.keys(tagRelations.tagToGroup || {}).length}ê°œ
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: "45%", backgroundColor: C.card, padding: 10, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: C.sub }}>ìžë™ìŠ¹íŒ¨ ê¸°ì¤€</Text>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#f59e0b" }}>
                      {Object.values(autoMatchSettings.criteria || {}).filter(c => c.enabled).length}/7
                    </Text>
                    <Text style={{ fontSize: 10, color: C.sub }}>
                      ëª¨ë“œ: {autoMatchSettings.mode === "any" ? "OR (í•˜ë‚˜ë¼ë„)" : "AND (ëª¨ë‘)"}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* ì˜ˆì¸¡ ì •í™•ë„ */}
              {matchInsights.length > 0 && (
                <View style={{ backgroundColor: "#f0fdf4", padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: "#86efac" }}>
                  <Text style={{ fontWeight: "700", color: "#166534", marginBottom: 6 }}>ðŸŽ¯ ì˜ˆì¸¡ ì •í™•ë„</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Text style={{ fontSize: 24, fontWeight: "800", color: "#15803d" }}>
                      {(matchInsights.filter(i => i.wasCorrect).length / matchInsights.length * 100).toFixed(1)}%
                    </Text>
                    <Text style={{ color: "#166534", flex: 1 }}>
                      {matchInsights.length}ê±´ ì¤‘ {matchInsights.filter(i => i.wasCorrect).length}ê±´ ì ì¤‘
                    </Text>
                  </View>
                  <View style={{ marginTop: 8, height: 8, backgroundColor: "#bbf7d0", borderRadius: 4, overflow: "hidden" }}>
                    <View 
                      style={{ 
                        width: `${matchInsights.filter(i => i.wasCorrect).length / matchInsights.length * 100}%`,
                        height: "100%",
                        backgroundColor: "#22c55e",
                      }} 
                    />
                  </View>
                </View>
              )}
              
              {/* ì£¼ìš” ì´ë³€ ìš”ì¸ TOP 5 */}
              {upsetFactors.factors && upsetFactors.factors.length > 0 && (
                <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 10, marginBottom: 12 }}>
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>ðŸ” ì£¼ìš” ì´ë³€ ìš”ì¸ TOP 5</Text>
                  {upsetFactors.factors.slice(0, 5).map((factor, idx) => (
                    <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                      <Text style={{ width: 24, color: C.sub, fontSize: 12 }}>#{idx + 1}</Text>
                      <Text style={{ flex: 1, color: C.text, fontSize: 12 }} numberOfLines={1}>
                        {factor.type === "tag_only_winner" ? "ðŸ‘ " : 
                         factor.type === "tag_only_loser" ? "ðŸ‘Ž " : "ðŸ“Œ "}
                        {factor.key}
                      </Text>
                      <Text style={{ color: C.primary, fontWeight: "600", fontSize: 12 }}>
                        {factor.occurrences}íšŒ
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* ê°œë³„ ì´ˆê¸°í™” ë²„íŠ¼ë“¤ */}
              <View style={{ gap: 8 }}>
                {matchInsights.length > 0 && (
                  <OutlineButton
                    title={`ðŸ—‘ï¸ ë§¤ì¹­ ì¸ì‚¬ì´íŠ¸ ì´ˆê¸°í™” (${matchInsights.length}ê±´)`}
                    onPress={() => {
                      Alert.alert(
                        "ë§¤ì¹­ ì¸ì‚¬ì´íŠ¸ ì´ˆê¸°í™”",
                        "ëª¨ë“  ë§¤ì¹­ ì˜ˆì¸¡ ê¸°ë¡ì´ ì‚­ì œë©ë‹ˆë‹¤. ê³„ì†í•˜ì‹œê² ìŠµë‹ˆê¹Œ?",
                        [
                          { text: "ì·¨ì†Œ", style: "cancel" },
                          { 
                            text: "ì´ˆê¸°í™”", 
                            style: "destructive",
                            onPress: async () => {
                              setMatchInsights([]);
                              await setAppMeta("match_insights", []);
                              Alert.alert("ì™„ë£Œ", "ë§¤ì¹­ ì¸ì‚¬ì´íŠ¸ê°€ ì´ˆê¸°í™”ë˜ì—ˆìŠµë‹ˆë‹¤.");
                            }
                          },
                        ]
                      );
                    }}
                    color={C.warn}
                  />
                )}
                
                {upsetFactors.factors && upsetFactors.factors.length > 0 && (
                  <OutlineButton
                    title={`ðŸ—‘ï¸ ì´ë³€ ìš”ì¸ ì´ˆê¸°í™” (${upsetFactors.factors.length}ê°œ)`}
                    onPress={() => {
                      Alert.alert(
                        "ì´ë³€ ìš”ì¸ ì´ˆê¸°í™”",
                        "í•™ìŠµëœ ì´ë³€ íŒ¨í„´ ë°ì´í„°ê°€ ì‚­ì œë©ë‹ˆë‹¤. ê³„ì†í•˜ì‹œê² ìŠµë‹ˆê¹Œ?",
                        [
                          { text: "ì·¨ì†Œ", style: "cancel" },
                          { 
                            text: "ì´ˆê¸°í™”", 
                            style: "destructive",
                            onPress: async () => {
                              const empty = { factors: [], lastUpdated: 0 };
                              setUpsetFactors(empty);
                              await setAppMeta("upset_factors", empty);
                              Alert.alert("ì™„ë£Œ", "ì´ë³€ ìš”ì¸ì´ ì´ˆê¸°í™”ë˜ì—ˆìŠµë‹ˆë‹¤.");
                            }
                          },
                        ]
                      );
                    }}
                    color={C.warn}
                  />
                )}
                
                <OutlineButton
                  title="ðŸ—‘ï¸ ìžë™ìŠ¹íŒ¨ ì„¤ì • ì´ˆê¸°í™”"
                  onPress={() => {
                    Alert.alert(
                      "ìžë™ìŠ¹íŒ¨ ì„¤ì • ì´ˆê¸°í™”",
                      "ìžë™ìŠ¹íŒ¨ ê¸°ì¤€ì´ ê¸°ë³¸ê°’ìœ¼ë¡œ ë³µì›ë©ë‹ˆë‹¤.",
                      [
                        { text: "ì·¨ì†Œ", style: "cancel" },
                        { 
                          text: "ì´ˆê¸°í™”", 
                          style: "destructive",
                          onPress: async () => {
                            const defaultSettings = {
                              mode: "any",
                              criteria: {
                                ratingGap: { enabled: true, threshold: 250, desc: "ë ˆì´íŒ… ê²©ì°¨" },
                                predictionRate: { enabled: false, threshold: 75, desc: "ì˜ˆì¸¡ ìŠ¹ë¥ (%)" },
                                h2hStreak: { enabled: false, threshold: 3, desc: "ì§ì ‘ëŒ€ê²° ì—°ìŠ¹" },
                                tierDiff: { enabled: false, threshold: 2, desc: "í‹°ì–´ ì°¨ì´ (ë‹¨ê³„)" },
                                winRateDiff: { enabled: false, threshold: 30, desc: "ìŠ¹ë¥  ì°¨ì´(%)" },
                                readRatioDiff: { enabled: false, threshold: 50, desc: "ì½ì€ ë¹„ìœ¨ ì°¨ì´(%)" },
                                matchCountDiff: { enabled: false, threshold: 20, desc: "ë§¤ì¹­ ìˆ˜ ì°¨ì´" },
                              },
                            };
                            setAutoMatchSettings(defaultSettings);
                            await setAppMeta("auto_match_settings", defaultSettings);
                            Alert.alert("ì™„ë£Œ", "ìžë™ìŠ¹íŒ¨ ì„¤ì •ì´ ì´ˆê¸°í™”ë˜ì—ˆìŠµë‹ˆë‹¤.");
                          }
                        },
                      ]
                    );
                  }}
                  color={C.sub}
                />
                
                {/* ì „ì²´ ì´ˆê¸°í™” */}
                <OutlineButton
                  title="âš ï¸ ëª¨ë“  ë¶„ì„ ë°ì´í„° ì´ˆê¸°í™”"
                  onPress={() => {
                    Alert.alert(
                      "âš ï¸ ì „ì²´ ë¶„ì„ ë°ì´í„° ì´ˆê¸°í™”",
                      "ë§¤ì¹­ ì¸ì‚¬ì´íŠ¸, ì´ë³€ ìš”ì¸, íƒœê·¸ ê´€ê³„, ìžë™ìŠ¹íŒ¨ ì„¤ì •ì´ ëª¨ë‘ ì´ˆê¸°í™”ë©ë‹ˆë‹¤.\n\nì´ ìž‘ì—…ì€ ë˜ëŒë¦´ ìˆ˜ ì—†ìŠµë‹ˆë‹¤.",
                      [
                        { text: "ì·¨ì†Œ", style: "cancel" },
                        { 
                          text: "ì „ì²´ ì´ˆê¸°í™”", 
                          style: "destructive",
                          onPress: async () => {
                            // ë§¤ì¹­ ì¸ì‚¬ì´íŠ¸
                            setMatchInsights([]);
                            await setAppMeta("match_insights", []);
                            
                            // ì´ë³€ ìš”ì¸
                            const emptyUpset = { factors: [], lastUpdated: 0 };
                            setUpsetFactors(emptyUpset);
                            await setAppMeta("upset_factors", emptyUpset);
                            
                            // íƒœê·¸ ê´€ê³„
                            const emptyRelations = { groups: {}, tagToGroup: {} };
                            setTagRelations(emptyRelations);
                            await setAppMeta("tag_relations", emptyRelations);
                            
                            // ìžë™ìŠ¹íŒ¨ ì„¤ì •
                            const defaultAuto = {
                              mode: "any",
                              criteria: {
                                ratingGap: { enabled: true, threshold: 250, desc: "ë ˆì´íŒ… ê²©ì°¨" },
                                predictionRate: { enabled: false, threshold: 75, desc: "ì˜ˆì¸¡ ìŠ¹ë¥ (%)" },
                                h2hStreak: { enabled: false, threshold: 3, desc: "ì§ì ‘ëŒ€ê²° ì—°ìŠ¹" },
                                tierDiff: { enabled: false, threshold: 2, desc: "í‹°ì–´ ì°¨ì´ (ë‹¨ê³„)" },
                                winRateDiff: { enabled: false, threshold: 30, desc: "ìŠ¹ë¥  ì°¨ì´(%)" },
                                readRatioDiff: { enabled: false, threshold: 50, desc: "ì½ì€ ë¹„ìœ¨ ì°¨ì´(%)" },
                                matchCountDiff: { enabled: false, threshold: 20, desc: "ë§¤ì¹­ ìˆ˜ ì°¨ì´" },
                              },
                            };
                            setAutoMatchSettings(defaultAuto);
                            await setAppMeta("auto_match_settings", defaultAuto);
                            
                            Alert.alert("ì™„ë£Œ", "ëª¨ë“  ë¶„ì„ ë°ì´í„°ê°€ ì´ˆê¸°í™”ë˜ì—ˆìŠµë‹ˆë‹¤.");
                          }
                        },
                      ]
                    );
                  }}
                  color={C.warn}
                  style={{ marginTop: 4 }}
                />
              </View>
            </Section>

            {/* ðŸ†• í”Œëž«í¼ë³„ ê¸°ë³¸ í‘œì§€ */}
            <Section title="í”Œëž«í¼ë³„ ê¸°ë³¸ í‘œì§€">
              <Text style={{ color: C.sub, marginBottom: 10 }}>
                ê°œë³„ í‘œì§€ê°€ ì—†ëŠ” ìž‘í’ˆì— í”Œëž«í¼ë³„ ê¸°ë³¸ í‘œì§€ë¥¼ í‘œì‹œí•©ë‹ˆë‹¤.
              </Text>
              {PLATFORM_OPTIONS.map((p) => (
                <View key={p} style={{ 
                  flexDirection: "row", 
                  alignItems: "center", 
                  marginBottom: 10,
                  padding: 8,
                  backgroundColor: C.bg,
                  borderRadius: 8,
                }}>
                  {platformCovers[p] ? (
                    <ExpoImage 
                      source={{ uri: platformCovers[p] }} 
                      style={{ width: 40, height: 56, borderRadius: 4, marginRight: 10 }} 
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={{ 
                      width: 40, 
                      height: 56, 
                      borderRadius: 4, 
                      marginRight: 10, 
                      backgroundColor: C.line,
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                      <Text style={{ color: C.sub, fontSize: 10 }}>ì—†ìŒ</Text>
                    </View>
                  )}
                  <Text style={{ color: C.text, fontWeight: "600", flex: 1 }}>{p}</Text>
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    <TouchableOpacity
                      onPress={() => openUrlModal((url) => {
                        savePlatformCovers({ ...platformCovers, [p]: url });
                      })}
                      style={{ padding: 6, backgroundColor: C.primary, borderRadius: 6 }}
                    >
                      <Text style={{ color: "#fff", fontSize: 12 }}>URL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => pickImageFromGallery((uri) => {
                        savePlatformCovers({ ...platformCovers, [p]: uri });
                      })}
                      style={{ padding: 6, backgroundColor: C.ok, borderRadius: 6 }}
                    >
                      <Text style={{ color: "#fff", fontSize: 12 }}>ê°¤ëŸ¬ë¦¬</Text>
                    </TouchableOpacity>
                    {platformCovers[p] && (
                      <TouchableOpacity
                        onPress={() => {
                          const updated = { ...platformCovers };
                          delete updated[p];
                          savePlatformCovers(updated);
                        }}
                        style={{ padding: 6, backgroundColor: C.warn, borderRadius: 6 }}
                      >
                        <Text style={{ color: "#fff", fontSize: 12 }}>ì‚­ì œ</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </Section>
              </>
            )}
            
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {/* ðŸ’¾ ë°±ì—…/ë³µì› ì„œë¸Œíƒ­ */}
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {settingsSubTab === "backup" && (
              <>
            <Section title="ë°ì´í„° ë°±ì—… / ë³µì›">
              <Text style={{ color: C.sub, marginBottom: 8 }}>
                ìž‘í’ˆê³¼ ëŒ€ì§„ ê¸°ë¡ì„ JSONìœ¼ë¡œ ë‚´ë³´ë‚´ê±°ë‚˜ ê°€ì ¸ì˜¬ ìˆ˜ ìžˆìŠµë‹ˆë‹¤.
                URL í‘œì§€ ì´ë¯¸ì§€ëŠ” ìžë™ìœ¼ë¡œ í¬í•¨ë©ë‹ˆë‹¤.
              </Text>
              <PrimaryButton
                title="ðŸ“¦ JSON ë‚´ë³´ë‚´ê¸° (ë°±ì—…)"
                onPress={exportJSON}
                disabled={isLoading}
              />
              <OutlineButton
                title="JSON ê°€ì ¸ì˜¤ê¸° (ë³µì›)"
                onPress={() => setImportOpen(true)}
                style={{ marginTop: 8 }}
              />
              <OutlineButton
                title="í‹°ì–´í‘œ í…ìŠ¤íŠ¸ë¡œ ê³µìœ "
                onPress={shareTierText}
                style={{ marginTop: 8 }}
              />
            </Section>

            <Section title="ìœ í‹¸ë¦¬í‹°">
              <PrimaryButton
                title="ë§¤ì¹˜ ë¡œê·¸ ê¸°ì¤€ Elo ìž¬ê³„ì‚°"
                onPress={async () => {
                  setIsLoading(true);
                  await rebuildAllFromMatches();
                  await loadList();
                  setIsLoading(false);
                  Alert.alert("ì™„ë£Œ", "ìž¬ê³„ì‚° ì™„ë£Œ");
                }}
                disabled={isLoading}
              />
              <OutlineButton
                title="ëª¨ë“  RDë¥¼ 350ìœ¼ë¡œ ë¦¬ì…‹"
                onPress={async () => {
                  setIsLoading(true);
                  await exec("UPDATE novels SET rd=350;");
                  await loadList();
                  setIsLoading(false);
                }}
                style={{ marginTop: 8 }}
              />
              
              {/* ðŸ†• v3.2.1: ê³¼ê±° ë§¤ì¹­ ë°ì´í„°ì—ì„œ ì¸ì‚¬ì´íŠ¸ ìž¬ìƒì„± */}
              <OutlineButton
                title="ðŸ“Š ê³¼ê±° ë§¤ì¹­ ì¸ì‚¬ì´íŠ¸ ìž¬ìƒì„±"
                onPress={async () => {
                  Alert.alert(
                    "ë§¤ì¹­ ì¸ì‚¬ì´íŠ¸ ìž¬ìƒì„±",
                    "ê¸°ì¡´ ë§¤ì¹­ ê¸°ë¡ì—ì„œ ì·¨í–¥ ë¶„ì„ìš© ì¸ì‚¬ì´íŠ¸ë¥¼ ìƒì„±í•©ë‹ˆë‹¤.\n\n" +
                    "â€¢ ì´ë³€ ë¶„ì„, ë§¤ì¹­ ì¼ê´€ì„± ë“±ì— í™œìš©ë©ë‹ˆë‹¤\n" +
                    "â€¢ ê·¼ì‚¬ì¹˜ë¡œ ê³„ì‚°ë˜ë¯€ë¡œ 100% ì •í™•í•˜ì§€ ì•ŠìŠµë‹ˆë‹¤\n" +
                    "â€¢ ì—…ë°ì´íŠ¸ í›„ í•œ ë²ˆë§Œ ì‹¤í–‰í•˜ë©´ ë©ë‹ˆë‹¤\n\n" +
                    "ê¸°ì¡´ ì¸ì‚¬ì´íŠ¸ ë°ì´í„°ë¥¼ ë®ì–´ì”ë‹ˆë‹¤. ê³„ì†í• ê¹Œìš”?",
                    [
                      { text: "ì·¨ì†Œ", style: "cancel" },
                      {
                        text: "ìž¬ìƒì„±",
                        onPress: async () => {
                          setIsLoading(true);
                          try {
                            const result = await rebuildMatchInsightsFromHistory(list);
                            
                            // matchInsights ì—…ë°ì´íŠ¸
                            setMatchInsights(result.insights);
                            
                            // upsetFactors ì—…ë°ì´íŠ¸
                            if (result.upsetFactors.length > 0) {
                              setUpsetFactors(prev => ({
                                ...prev,
                                factors: result.upsetFactors,
                                lastUpdated: Date.now(),
                              }));
                            }
                            
                            // app_metaì— ì €ìž¥
                            await setAppMeta("matchInsights", result.insights.slice(-200));
                            await setAppMeta("upsetFactors", { factors: result.upsetFactors, lastUpdated: Date.now() });
                            
                            Alert.alert(
                              "ìž¬ìƒì„± ì™„ë£Œ",
                              `ðŸ“Š ê²°ê³¼:\n` +
                              `â€¢ ì´ ë§¤ì¹­: ${result.stats.total}ê±´\n` +
                              `â€¢ ë¶„ì„ ì„±ê³µ: ${result.stats.rebuilt}ê±´\n` +
                              `â€¢ ê±´ë„ˆëœ€(ì‚­ì œëœ ìž‘í’ˆ): ${result.stats.skipped}ê±´\n` +
                              `â€¢ ì´ë³€ ë°œê²¬: ${result.stats.upsets}ê±´ (${result.stats.upsetRate}%)\n` +
                              `â€¢ ì´ë³€ ìš”ì¸: ${result.upsetFactors.length}ê°œ\n\n` +
                              `ì·¨í–¥ ë¶„ì„ íƒ­ì—ì„œ ê²°ê³¼ë¥¼ í™•ì¸í•˜ì„¸ìš”.`
                            );
                          } catch (e) {
                            Alert.alert("ì˜¤ë¥˜", "ìž¬ìƒì„± ì¤‘ ì˜¤ë¥˜: " + (e.message || e));
                          }
                          setIsLoading(false);
                        }
                      }
                    ]
                  );
                }}
                style={{ marginTop: 8 }}
                disabled={isLoading}
              />
              <Text style={{ color: C.sub, fontSize: 11, marginTop: 4, marginLeft: 4 }}>
                ðŸ’¡ v3.2.1 ì´ì „ ì‚¬ìš©ìž: í•œ ë²ˆ ì‹¤í–‰í•˜ë©´ ê³¼ê±° ë§¤ì¹­ë„ ë¶„ì„ì— í™œìš©ë©ë‹ˆë‹¤
              </Text>
            </Section>

            <Section title="âš ï¸ ìœ„í—˜">
              <Text style={{ color: C.warn, marginBottom: 10, fontSize: 12 }}>
                ì•„ëž˜ ìž‘ì—…ì€ ë˜ëŒë¦´ ìˆ˜ ì—†ìŠµë‹ˆë‹¤. ì‹ ì¤‘í•˜ê²Œ ì‚¬ìš©í•˜ì„¸ìš”.
              </Text>
              <OutlineButton
                title="ëŒ€ì§„ ë¡œê·¸ ì „ì²´ ì‚­ì œ"
                color={C.warn}
                onPress={resetMatches}
              />
              <OutlineButton
                title="ì „ì²´ ì´ˆê¸°í™” (ëª¨ë“  ë°ì´í„° ì‚­ì œ)"
                color={C.warn}
                onPress={resetAll}
                style={{ marginTop: 8 }}
              />
            </Section>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* ---- íŽ¸ì§‘ ëª¨ë‹¬ ---- */}
      <Modal
        visible={editOpen}
        animationType="slide"
        onRequestClose={() => setEditOpen(false)}
        transparent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: C.modal,
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setEditOpen(false)} 
          />
          <View
            style={{
              backgroundColor: C.card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              maxHeight: "85%",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>
                ìž‘í’ˆ ìˆ˜ì •
              </Text>
              {editItem && (
                <TouchableOpacity
                  onPress={() => {
                    setEditOpen(false);
                    removeNovel(editItem.id);
                  }}
                  style={{ padding: 6 }}
                >
                  <Text style={{ color: C.warn, fontSize: 13 }}>ðŸ—‘ ì‚­ì œ</Text>
                </TouchableOpacity>
              )}
            </View>
            {editItem && (
              <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                {/* ðŸ†• í‘œì§€ ì´ë¯¸ì§€ */}
                <Label>í‘œì§€ ì´ë¯¸ì§€</Label>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 12 }}>
                  {editCoverImage ? (
                    <ExpoImage source={{ uri: editCoverImage }} style={{ width: 50, height: 70, borderRadius: 6 }} contentFit="cover" cachePolicy="memory-disk" />
                  ) : (
                    <View style={{ width: 50, height: 70, borderRadius: 6, backgroundColor: C.line, justifyContent: "center", alignItems: "center" }}>
                      <Text style={{ color: C.sub, fontSize: 10 }}>ì—†ìŒ</Text>
                    </View>
                  )}
                  <OutlineButton title="URL" onPress={() => openUrlModal(setEditCoverImage)} style={{ minWidth: 60 }} />
                  <OutlineButton title="ê°¤ëŸ¬ë¦¬" onPress={() => pickImageFromGallery(setEditCoverImage)} style={{ minWidth: 70 }} />
                  <OutlineButton 
                    title="ë¼ì´ë¸ŒëŸ¬ë¦¬" 
                    onPress={() => {
                      setCoverSelectTarget("edit");
                      setCoverSelectModalOpen(true);
                    }} 
                    color={C.primary}
                    style={{ minWidth: 90 }}
                  />
                  {editCoverImage && (
                    <OutlineButton 
                      title="ì‚­ì œ" 
                      onPress={() => setEditCoverImage("")} 
                      color={C.warn} 
                      style={{ minWidth: 60 }}
                    />
                  )}
                </View>

                <Label>ì œëª©</Label>
                <Input
                  value={editItem.title}
                  onChangeText={(t) =>
                    setEditItem({ ...editItem, title: t })
                  }
                />

                <Label style={{ marginTop: 10 }}>ìž‘ê°€</Label>
                <Input
                  value={editItem.author || ""}
                  onChangeText={(t) =>
                    setEditItem({ ...editItem, author: t })
                  }
                />

                <Label style={{ marginTop: 10 }}>íƒœê·¸</Label>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                  <Input
                    value={editItem.tags || ""}
                    onChangeText={(t) => {
                      // ðŸ”§ v3.4.4: í…ìŠ¤íŠ¸ ë³€ê²½ ì‹œ ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ ìžë™ ë™ê¸°í™”
                      // ìž…ë ¥ëœ íƒœê·¸ ë¬¸ìžì—´ì—ì„œ ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ë¥¼ ìžë™ ê°ì§€í•˜ì—¬ ë¶„ë¦¬
                      const inputTags = t.split(",").map(tag => tag.trim()).filter(Boolean);
                      
                      const allMajor = [...MAJOR_GENRES, ...userMajorGenres];
                      const allSub = [...SUB_GENRES, ...userSubGenres];
                      
                      const detectedMajor = inputTags.filter(tag => 
                        allMajor.some(m => m.toLowerCase() === tag.toLowerCase())
                      );
                      const detectedSub = inputTags.filter(tag => 
                        allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                      );
                      
                      // ì •ê·œí™”: ëŒ€ì†Œë¬¸ìž ë§žì¶”ê¸°
                      const normalizedMajor = detectedMajor.map(tag => 
                        allMajor.find(m => m.toLowerCase() === tag.toLowerCase()) || tag
                      );
                      const normalizedSub = detectedSub.map(tag => 
                        allSub.find(s => s.toLowerCase() === tag.toLowerCase()) || tag
                      );
                      
                      setEditItem({ 
                        ...editItem, 
                        tags: t,
                        major_genre: normalizedMajor.length > 0 ? JSON.stringify(normalizedMajor) : "",
                        sub_genre: normalizedSub.length > 0 ? JSON.stringify(normalizedSub) : "",
                      });
                    }}
                    style={{ flex: 1 }}
                  />
                  <OutlineButton
                    title="ðŸ·ï¸ ê³ ë¥´ê¸°"
                    onPress={() => {
                      // ðŸ”§ v3.4.4: tags ë¬¸ìžì—´ì—ì„œ ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´/ì¼ë°˜íƒœê·¸ë¥¼ ë¶„ë¦¬í•˜ì—¬ ì „ë‹¬
                      const currentTags = (editItem.tags || "").split(",").map(t => t.trim()).filter(Boolean);
                      
                      const allMajor = [...MAJOR_GENRES, ...userMajorGenres];
                      const allSub = [...SUB_GENRES, ...userSubGenres];
                      
                      // ëŒ€ìž¥ë¥´ ê°ì§€
                      const majorTags = currentTags.filter(tag => 
                        allMajor.some(m => m.toLowerCase() === tag.toLowerCase())
                      ).map(tag => allMajor.find(m => m.toLowerCase() === tag.toLowerCase()) || tag);
                      
                      // ë¶€ìž¥ë¥´ ê°ì§€
                      const subTags = currentTags.filter(tag => 
                        allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                      ).map(tag => allSub.find(s => s.toLowerCase() === tag.toLowerCase()) || tag);
                      
                      // ì¼ë°˜ íƒœê·¸ (ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ ì œì™¸)
                      const generalTags = currentTags.filter(tag => 
                        !allMajor.some(m => m.toLowerCase() === tag.toLowerCase()) &&
                        !allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                      );
                      
                      // ðŸ·ï¸ v5.0: tag_data íŒŒì‹±
                      let tagData = [];
                      try {
                        if (editItem.tag_data) {
                          tagData = JSON.parse(editItem.tag_data);
                        }
                      } catch (e) {}
                      
                      // ë¶„ë¦¬ëœ ê°’ìœ¼ë¡œ ëª¨ë‹¬ ì—´ê¸°
                      openTagModal(
                        "edit", 
                        generalTags, 
                        majorTags.length > 0 ? JSON.stringify(majorTags) : "",
                        subTags.length > 0 ? JSON.stringify(subTags) : "",
                        tagData
                      );
                    }}
                    style={{ paddingHorizontal: 12 }}
                  />
                </View>
                {/* ðŸ”§ v3.4.4: ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ í‘œì‹œ - tags ë¬¸ìžì—´ì—ì„œ ìžë™ ê°ì§€í•˜ì—¬ í‘œì‹œ */}
                {(() => {
                  const currentTags = (editItem.tags || "").split(",").map(t => t.trim()).filter(Boolean);
                  const allMajor = [...MAJOR_GENRES, ...userMajorGenres];
                  const allSub = [...SUB_GENRES, ...userSubGenres];
                  
                  const majorTags = currentTags.filter(tag => 
                    allMajor.some(m => m.toLowerCase() === tag.toLowerCase())
                  );
                  const subTags = currentTags.filter(tag => 
                    allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                  );
                  
                  if (majorTags.length === 0 && subTags.length === 0) return null;
                  
                  return (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
                      {majorTags.map((g) => <GenreBadge key={g} genre={g} type="major" />)}
                      {subTags.map((g) => <GenreBadge key={g} genre={g} type="sub" />)}
                    </View>
                  );
                })()}

                <Label style={{ marginTop: 10 }}>ì—°ìž¬ì²˜</Label>
                <PlatformChips
                  platforms={editPlatforms}
                  onChange={setEditPlatforms}
                  options={PLATFORM_OPTIONS}
                  theme={C}
                />

                {/* ðŸ†• ì½ê¸° ìƒíƒœ */}
                <Label style={{ marginTop: 10 }}>ì½ê¸° ìƒíƒœ</Label>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {STATUS_OPTIONS.map((s) => (
                    <Chip
                      key={s.key}
                      label={s.label}
                      active={editStatus === s.key}
                      onPress={() => setEditStatus(s.key)}
                    />
                  ))}
                </View>

                {/* ðŸ†• ìž‘í’ˆ ì—°ìž¬ ìƒíƒœ */}
                <Label style={{ marginTop: 10 }}>ìž‘í’ˆ ì—°ìž¬ ìƒíƒœ</Label>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {WORK_STATUS_OPTIONS.map((s) => (
                    <Chip
                      key={s.key}
                      label={s.label}
                      active={editWorkStatus === s.key}
                      onPress={() => setEditWorkStatus(s.key)}
                    />
                  ))}
                </View>

                <Label style={{ marginTop: 10 }}>ë³¸íŽ¸ ì½ì€ íšŒì°¨</Label>
<Input
  value={String(editItem.read_count || 0)}
  onChangeText={(t) =>
    setEditItem({ ...editItem, read_count: t })
  }
  keyboardType="number-pad"
/>

<Label style={{ marginTop: 10 }}>ë³¸íŽ¸ ì „ì²´ íšŒì°¨</Label>
<Input
  value={String(editItem.total_episodes || 0)}
  onChangeText={(t) =>
    setEditItem({ ...editItem, total_episodes: t })
  }
  keyboardType="number-pad"
/>

{/* ðŸ”— ìž‘í’ˆ ë§í¬ */}
<Label style={{ marginTop: 10 }}>ìž‘í’ˆ ë§í¬</Label>
<Input
  value={editLink}
  onChangeText={setEditLink}
  placeholder="https://novelpia.com/novel/..."
  autoCapitalize="none"
  autoCorrect={false}
/>

{/* ðŸ“š v3.0.4: ë‹¤íšŒë… ì¹´ìš´íŠ¸ */}
<Label style={{ marginTop: 10 }}>ë‹¤íšŒë… íšŸìˆ˜</Label>
<Input
  value={editRereadCount}
  onChangeText={setEditRereadCount}
  keyboardType="number-pad"
  placeholder="ê¸°ë³¸ 1íšŒ (ìž¬ë… ì‹œ ì¦ê°€)"
/>

{/* ðŸ“– ì™¸ì „ ìƒíƒœ */}
<Label style={{ marginTop: 10 }}>ì™¸ì „ ìƒíƒœ</Label>
<View style={{ flexDirection: "row", flexWrap: "wrap" }}>
  {GAIDEN_STATUS_OPTIONS.map((s) => (
    <Chip
      key={s.key}
      label={s.label}
      active={editGaidenStatus === s.key}
      onPress={() => setEditGaidenStatus(s.key)}
    />
  ))}
</View>

{/* ì™¸ì „ íšŒì°¨ (ì™¸ì „ì´ ìžˆëŠ” ê²½ìš°ì—ë§Œ í‘œì‹œ) */}
{editGaidenStatus !== "none" && (
  <View style={{ marginTop: 10, backgroundColor: C.chip, padding: 12, borderRadius: 12 }}>
    <Label>ì™¸ì „ ì½ì€ íšŒì°¨</Label>
    <Input
      value={editGaidenReadCount}
      onChangeText={setEditGaidenReadCount}
      keyboardType="number-pad"
      placeholder="ì˜ˆ: 10"
    />
    <Label style={{ marginTop: 10 }}>ì™¸ì „ ì „ì²´ íšŒì°¨(ì„ íƒ)</Label>
    <Input
      value={editGaidenTotalEpisodes}
      onChangeText={setEditGaidenTotalEpisodes}
      keyboardType="number-pad"
      placeholder="ì˜ˆ: 50"
    />
  </View>
)}

                <Label style={{ marginTop: 10, color: C.warn }}>
                  ê³ ê¸‰: ë ˆì´íŒ… ì§ì ‘ ìž…ë ¥
                </Label>
                <Input
                  value={editRating}
                  onChangeText={setEditRating}
                  keyboardType="numeric"
                  placeholder="ì˜ˆ: 1725.0"
                />

    

                {/* â˜… ìˆ˜ìƒ ì„¤ì • UI */}
                <Label style={{ marginTop: 10 }}>ìˆ˜ìƒ ì„¤ì •</Label>
                <Text style={{ color: C.sub, marginBottom: 4 }}>
                  ì—°ë„ì™€ ìˆ˜ìƒ ì¢…ë¥˜ë¥¼ ì„ íƒí•œ ë’¤ &quot;ìˆ˜ìƒ ì¶”ê°€&quot;ë¥¼ ëˆ„ë¥´ì„¸ìš”.
                </Text>

                {/* ì—°ë„ ìž…ë ¥ */}
                <Label>ì—°ë„</Label>
                <Input
                  value={awardYearInput}
                  onChangeText={setAwardYearInput}
                  keyboardType="number-pad"
                  placeholder="ì˜ˆ: 2024"
                  style={{ marginBottom: 8 }}
                />

                {/* ìˆ˜ìƒ ì¢…ë¥˜ ì„ íƒ (AWARD_META ê¸°ë°˜) */}
                <Label>ìˆ˜ìƒ ì¢…ë¥˜</Label>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  {Object.entries(AWARD_META).map(([key, meta]) => (
                    <Chip
                      key={key}
                      label={meta.label}
                      active={awardTypeInput === key}
                      onPress={() => setAwardTypeInput(key)}
                    />
                  ))}
                </View>

                <PrimaryButton
                  title="ìˆ˜ìƒ ì¶”ê°€"
                  onPress={() => {
                    const y = awardYearInput.trim();
                    if (!y) {
                      Alert.alert("ì•ˆë‚´", "ì—°ë„ë¥¼ ìž…ë ¥í•´ì£¼ì„¸ìš”.");
                      return;
                    }
                    if (!awardTypeInput) {
                      Alert.alert("ì•ˆë‚´", "ìˆ˜ìƒ ì¢…ë¥˜ë¥¼ ì„ íƒí•´ì£¼ì„¸ìš”.");
                      return;
                    }
                    setEditAwards((prev) => [
                      ...prev,
                      { year: y, type: awardTypeInput },
                    ]);
                  }}
                  style={{ marginTop: 4, marginBottom: 8 }}
                />

                {/* í˜„ìž¬ ë“±ë¡ëœ ìˆ˜ìƒ ëª©ë¡ */}
                {editAwards.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    {editAwards.map((a, idx) => {
                      const meta = AWARD_META[a.type] || { label: a.type };
                      return (
                        <View
                          key={`${a.year}-${a.type}-${idx}`}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingVertical: 4,
                          }}
                        >
                          <Text>
                            {a.year} {meta.label}
                          </Text>
                          <OutlineButton
                            title="ì‚­ì œ"
                            onPress={() =>
                              setEditAwards((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            style={{
                              paddingVertical: 4,
                              paddingHorizontal: 8,
                            }}
                          />
                        </View>
                      );
                    })}
                  </View>
                )}

                <Label style={{ marginTop: 10 }}>ë©”ëª¨</Label>
                <Input
                  value={editItem.note || ""}
                  onChangeText={(t) =>
                    setEditItem({ ...editItem, note: t })
                  }
                  multiline
                />

                {/* ðŸ’¬ ì¸ìƒê¹Šì€ ë¬¸ìž¥ */}
                <View style={{ marginTop: 16, padding: 12, backgroundColor: C.bg, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: C.primary }}>
                  <Label style={{ marginBottom: 6 }}>ðŸ’¬ ì¸ìƒê¹Šì€ ë¬¸ìž¥</Label>
                  <TextInput
                    value={editMemorableQuote}
                    onChangeText={setEditMemorableQuote}
                    placeholder={'"ì´ ìž‘í’ˆì—ì„œ ê°€ìž¥ ê¸°ì–µì— ë‚¨ëŠ” ë¬¸ìž¥..."'}
                    placeholderTextColor={C.sub}
                    multiline
                    style={{
                      backgroundColor: C.card,
                      borderWidth: 1,
                      borderColor: C.line,
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 15,
                      fontStyle: "italic",
                      color: C.text,
                      minHeight: 80,
                      textAlignVertical: "top",
                    }}
                  />
                  <Text style={{ color: C.sub, fontSize: 11, marginTop: 6 }}>
                    ðŸ“Œ ì¶”ì²œ, ìˆ˜ìƒ ë“±ì—ì„œ ì¸ìš©êµ¬ì²˜ëŸ¼ í‘œì‹œë©ë‹ˆë‹¤
                  </Text>
                </View>

                {/* ðŸ“… v3.0.3: ë‚ ì§œ ìˆ˜ë™ ë³€ê²½ */}
                <View style={{ marginTop: 16, padding: 12, backgroundColor: C.bg, borderRadius: 12 }}>
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 10 }}>ðŸ“… ë‚ ì§œ ê´€ë¦¬</Text>
                  
                  <View style={{ marginBottom: 10 }}>
                    <Label>ë“±ë¡ì¼ (YYYY-MM-DD)</Label>
                    <Input
                      value={editCreatedAt}
                      onChangeText={setEditCreatedAt}
                      placeholder="ì˜ˆ: 2024-06-15"
                      style={{ backgroundColor: C.card }}
                    />
                    <Text style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>
                      ðŸ“Œ ë³€ê²½ ì‹œ í•´ë‹¹ ë‚ ì§œì— ë“±ë¡ëœ ê²ƒìœ¼ë¡œ ìµœì‹  ë³€í™”ì— ê¸°ë¡ë©ë‹ˆë‹¤
                    </Text>
                  </View>
                  
                  <View>
                    <Label>ì½ì€íšŒì°¨ ë³€ë™ì¼ (YYYY-MM-DD)</Label>
                    <Input
                      value={editReadCountUpdatedAt}
                      onChangeText={setEditReadCountUpdatedAt}
                      placeholder="ì˜ˆ: 2025-01-20"
                      style={{ backgroundColor: C.card }}
                    />
                    <Text style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>
                      ðŸ“Œ ì½ì€ íšŒì°¨ ì¦ê°€ ì‹œ í•´ë‹¹ ë‚ ì§œì— ìµœì‹ í™”ëœ ê²ƒìœ¼ë¡œ ê¸°ë¡ë©ë‹ˆë‹¤
                    </Text>
                  </View>
                </View>

                {/* ðŸ†• ê¸°ë¡ ë²„íŠ¼ */}
                <View style={{ marginTop: 12 }}>
                  <OutlineButton
                    title="ðŸ“Š ëŒ€ì§„ ê¸°ë¡ ë³´ê¸°"
                    onPress={() => {
                      setEditOpen(false);
                      openLogs(editItem);
                    }}
                  />
                </View>

                <View
                  style={{ flexDirection: "row", gap: 8, marginTop: 12 }}
                >
                  <PrimaryButton
                    title="ì €ìž¥"
                    onPress={saveEdit}
                    style={{ flex: 1 }}
                  />
                  <OutlineButton
                    title="ë‹«ê¸°"
                    onPress={() => setEditOpen(false)}
                    style={{ flex: 1 }}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ---- ê¸°ë¡ ëª¨ë‹¬ ---- */}
      <Modal
        visible={logOpen}
        animationType="slide"
        onRequestClose={() => setLogOpen(false)}
        transparent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setLogOpen(false)} 
          />
          <View
            style={{
              backgroundColor: C.card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              maxHeight: "85%",
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "800", marginBottom: 8 }}
            >
              ëŒ€ì§„ ê¸°ë¡
            </Text>
            {logTarget && (
              <>
                <Text
                  style={{ color: C.sub, marginBottom: 8 }}
                >
                  {logTarget.title}
                </Text>
              <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                  {logs.length === 0 ? (
                    <Text style={{ color: C.sub }}>
                      ê¸°ë¡ì´ ì—†ìŠµë‹ˆë‹¤.
                    </Text>
                  ) : (
                    logs.map((item) => {
                      const youAreA = item.a_id === logTarget.id;
                      const oppTitle = youAreA
                        ? item.b_title
                        : item.a_title;
                      const win = item.winner_id === logTarget.id;
                      
                      // v2.8: ìƒëŒ€ ìž‘í’ˆì˜ í˜„ìž¬ í‹°ì–´ ê³„ì‚°
                      const oppRating = youAreA ? item.b_rating : item.a_rating;
                      const oppManualTier = youAreA ? item.b_manual_tier : item.a_manual_tier;
                      const oppTier = oppRating 
                        ? (oppManualTier || tierFromRating(oppRating))
                        : null;
                      const oppTierColor = oppTier ? getTierColor(oppTier) : null;
                      
                      return (
                        <View
                          key={item.id}
                          style={{
                            borderWidth: 1,
                            borderColor: C.line,
                            backgroundColor: C.bg,
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 8,
                          }}
                        >
                          {/* ì œëª© + í‹°ì–´ */}
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <Text
                              style={{ fontWeight: "700", color: C.text, flex: 1 }}
                              numberOfLines={1}
                            >
                              {oppTitle || "(ì‚­ì œë¨)"}
                            </Text>
                            {/* v2.8: ìƒëŒ€ ìž‘í’ˆ í˜„ìž¬ í‹°ì–´ í‘œì‹œ */}
                            {oppTier && oppTierColor && (
                              <View style={{
                                backgroundColor: oppTierColor,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 999,
                                marginLeft: 8,
                              }}>
                                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>{oppTier}</Text>
                              </View>
                            )}
                          </View>
                          <Text
                            style={{
                              color: win ? C.ok : C.warn,
                              marginTop: 4,
                              fontWeight: "600",
                            }}
                          >
                            {win ? "ðŸ† ìŠ¹" : "ðŸ’€ íŒ¨"} Â·{" "}
                            {new Date(
                              item.created_at || 0
                            ).toLocaleString()}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 8,
                              marginTop: 8,
                            }}
                          >
                            <OutlineButton
                              title="ìŠ¹ìž ë³€ê²½"
                              onPress={() => flipWinner(item.id)}
                              style={{ flex: 1 }}
                            />
                            <OutlineButton
                              title="ì‚­ì œ"
                              onPress={() => deleteLog(item.id)}
                              color="#E05252"
                              style={{ flex: 1 }}
                            />
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>
                <OutlineButton
                  title="ë‹«ê¸°"
                  onPress={() => setLogOpen(false)}
                  style={{ marginTop: 12 }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ---- ë³´ì¶© ì„¤ì • ëª¨ë‹¬ ---- */}
      <Modal
        visible={supplementSettingsOpen}
        animationType="slide"
        onRequestClose={() => setSupplementSettingsOpen(false)}
        transparent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setSupplementSettingsOpen(false)} 
          />
          <View
            style={{
              backgroundColor: C.card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              maxHeight: "85%",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 8, color: C.text }}>
              ðŸ“ ë³´ì¶© ê¸°ì¤€ ì„¤ì •
            </Text>
            <Text style={{ color: C.sub, marginBottom: 16 }}>
              ì–´ë–¤ ìž‘í’ˆì„ ë³´ì¶© ëŒ€ìƒìœ¼ë¡œ í‘œì‹œí• ì§€ ì„¤ì •í•©ë‹ˆë‹¤.
            </Text>
            
            <ScrollView style={{ maxHeight: 500 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
              {/* í™œì„±í™” í† ê¸€ */}
              <View style={{ 
                flexDirection: "row", 
                alignItems: "center", 
                justifyContent: "space-between",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: C.line,
              }}>
                <Text style={{ fontWeight: "700", color: C.text }}>ë³´ì¶© íƒ­ í™œì„±í™”</Text>
                <Switch
                  value={appSettings.supplement?.enabled !== false}
                  onValueChange={(v) => {
                    saveAppSettings({
                      supplement: { ...DEFAULT_SETTINGS.supplement, ...appSettings.supplement, enabled: v }
                    });
                  }}
                />
              </View>

              {/* ìµœì†Œ íƒœê·¸ ìˆ˜ */}
              <View style={{ 
                flexDirection: "row", 
                alignItems: "center", 
                justifyContent: "space-between",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: C.line,
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: C.text }}>ìµœì†Œ íƒœê·¸ ìˆ˜</Text>
                  <Text style={{ color: C.sub, fontSize: 12 }}>ì´ ìˆ˜ ì´í•˜ë©´ ë³´ì¶© ëŒ€ìƒ</Text>
                </View>
                <Input
                  value={String(appSettings.supplement?.minTags ?? DEFAULT_SETTINGS.supplement.minTags)}
                  onChangeText={(t) => {
                    const num = Number(t) || 0;
                    saveAppSettings({
                      supplement: { ...DEFAULT_SETTINGS.supplement, ...appSettings.supplement, minTags: num }
                    });
                  }}
                  keyboardType="number-pad"
                  style={{ width: 60, textAlign: "center" }}
                />
              </View>

              {/* ë¶€ì • íƒœê·¸ ì œì™¸ ê¸°ì¤€ */}
              <View style={{ 
                flexDirection: "row", 
                alignItems: "center", 
                justifyContent: "space-between",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: C.line,
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: C.text }}>ë¶€ì • íƒœê·¸ ì œì™¸ ê¸°ì¤€</Text>
                  <Text style={{ color: C.sub, fontSize: 12 }}>ì´ ìˆ˜ ì´ìƒì´ë©´ ë³´ì¶©ì—ì„œ ì œì™¸</Text>
                </View>
                <Input
                  value={String(appSettings.supplement?.excludeNegativeTagCount ?? DEFAULT_SETTINGS.supplement.excludeNegativeTagCount)}
                  onChangeText={(t) => {
                    const num = Number(t) || 0;
                    saveAppSettings({
                      supplement: { ...DEFAULT_SETTINGS.supplement, ...appSettings.supplement, excludeNegativeTagCount: num }
                    });
                  }}
                  keyboardType="number-pad"
                  style={{ width: 60, textAlign: "center" }}
                />
              </View>

              {/* í•„ìˆ˜ í•­ëª© í† ê¸€ë“¤ */}
              <Text style={{ fontWeight: "800", color: C.text, marginTop: 16, marginBottom: 8 }}>
                í•„ìˆ˜ ìž…ë ¥ í•­ëª©
              </Text>

              {[
                { key: "requireAuthor", label: "ìž‘ê°€", desc: "ìž‘ê°€ëª…ì´ ë¹„ì–´ìžˆìœ¼ë©´ ë³´ì¶© ëŒ€ìƒ" },
                { key: "requireTotalEpisodes", label: "ì „ì²´ íšŒì°¨", desc: "ì „ì²´ íšŒì°¨ê°€ 0ì´ë©´ ë³´ì¶© ëŒ€ìƒ" },
                { key: "requireReadCount", label: "ì½ì€ íšŒì°¨", desc: "ì½ì€ íšŒì°¨ê°€ 0ì´ë©´ ë³´ì¶© ëŒ€ìƒ" },
                { key: "requireMajorGenre", label: "ëŒ€ìž¥ë¥´", desc: "ëŒ€ìž¥ë¥´ê°€ ì—†ìœ¼ë©´ ë³´ì¶© ëŒ€ìƒ" },
                { key: "requireSubGenre", label: "ë¶€ìž¥ë¥´", desc: "ë¶€ìž¥ë¥´ê°€ ì—†ìœ¼ë©´ ë³´ì¶© ëŒ€ìƒ" },
                { key: "requirePlatform", label: "í”Œëž«í¼", desc: "í”Œëž«í¼ì´ ì—†ìœ¼ë©´ ë³´ì¶© ëŒ€ìƒ" },
              ].map(item => (
                <View key={item.key} style={{ 
                  flexDirection: "row", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: C.line,
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: C.text }}>{item.label}</Text>
                    <Text style={{ color: C.sub, fontSize: 11 }}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={appSettings.supplement?.[item.key] ?? DEFAULT_SETTINGS.supplement[item.key]}
                    onValueChange={(v) => {
                      saveAppSettings({
                        supplement: { ...DEFAULT_SETTINGS.supplement, ...appSettings.supplement, [item.key]: v }
                      });
                    }}
                  />
                </View>
              ))}

              {/* ê¸°ë³¸ê°’ìœ¼ë¡œ ì´ˆê¸°í™” */}
              <OutlineButton
                title="ðŸ”„ ê¸°ë³¸ê°’ìœ¼ë¡œ ì´ˆê¸°í™”"
                onPress={() => {
                  Alert.alert("í™•ì¸", "ë³´ì¶© ê¸°ì¤€ì„ ê¸°ë³¸ê°’ìœ¼ë¡œ ì´ˆê¸°í™”í• ê¹Œìš”?", [
                    { text: "ì·¨ì†Œ" },
                    { text: "ì´ˆê¸°í™”", onPress: () => {
                      saveAppSettings({ supplement: { ...DEFAULT_SETTINGS.supplement } });
                    }}
                  ]);
                }}
                style={{ marginTop: 16 }}
              />
            </ScrollView>

            <PrimaryButton
              title="ë‹«ê¸°"
              onPress={() => setSupplementSettingsOpen(false)}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>

      {/* ---- JSON ê°€ì ¸ì˜¤ê¸° ëª¨ë‹¬ ---- */}
      <Modal
        visible={importOpen}
        animationType="slide"
        onRequestClose={() => {
          setImportOpen(false);
          setImportValidation(null);
        }}
        transparent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => {
              setImportOpen(false);
              setImportValidation(null);
            }} 
          />
          <View
            style={{
              backgroundColor: C.card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              maxHeight: "85%",
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "800", marginBottom: 8 }}
            >
              JSON ë°ì´í„° ìž…ë ¥
            </Text>
            <Text style={{ color: C.sub, marginBottom: 12 }}>
              ë°±ì—…í•œ JSON ë°ì´í„°ë¥¼ ì•„ëž˜ì— ë¶™ì—¬ë„£ìœ¼ì„¸ìš”
            </Text>
            <TextInput
              value={importText}
              onChangeText={(t) => {
                setImportText(t);
                setImportValidation(null); // í…ìŠ¤íŠ¸ ë³€ê²½ ì‹œ ê²€ì¦ ê²°ê³¼ ì´ˆê¸°í™”
              }}
              multiline
              placeholder='{"v":9, "N":[...], "M":"..."}'
              placeholderTextColor="#9aa8bd"
              style={{
                backgroundColor: "#f8f9fa",
                borderWidth: 1,
                borderColor: C.line,
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                color: C.text,
                height: importValidation ? 150 : 250,
                textAlignVertical: "top",
              }}
            />
            
            {/* ê²€ì¦ ê²°ê³¼ í‘œì‹œ */}
            {importValidation && (
              <View style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: importValidation.valid ? "#f0fdf4" : "#fef2f2",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: importValidation.valid ? "#86efac" : "#fecaca",
              }}>
                <Text style={{ 
                  fontWeight: "800", 
                  color: importValidation.valid ? "#166534" : "#991b1b",
                  marginBottom: 6
                }}>
                  {importValidation.valid ? "âœ… ê²€ì¦ ì„±ê³µ" : "âŒ ê²€ì¦ ì‹¤íŒ¨"}
                </Text>
                
                {importValidation.valid && (
                  <>
                    <Text style={{ color: "#374151", marginBottom: 4 }}>
                      ðŸ“¦ í¬ë§·: {importValidation.format}
                    </Text>
                    <Text style={{ color: "#374151", marginBottom: 4 }}>
                      ðŸ“š ìž‘í’ˆ: {importValidation.novelCount}ê°œ Â· ë§¤ì¹­: {importValidation.matchCount}ê°œ
                    </Text>
                    <Text style={{ color: "#374151", marginBottom: 4 }}>
                      {importValidation.summary}
                    </Text>
                    
                    {/* ê²½ê³  ë©”ì‹œì§€ */}
                    {importValidation.warnings.length > 0 && (
                      <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#d1d5db" }}>
                        {importValidation.warnings.map((w, i) => (
                          <Text key={i} style={{ color: "#b45309", fontSize: 12 }}>{w}</Text>
                        ))}
                      </View>
                    )}
                    
                    {/* ê¸°ëŠ¥ ì²´í¬ë¦¬ìŠ¤íŠ¸ */}
                    <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#d1d5db" }}>
                      <Text style={{ fontSize: 11, color: "#6b7280" }}>
                        {importValidation.features.hasElo ? "âœ“" : "âœ—"} Eloë°ì´í„° {" "}
                        {importValidation.features.hasTimestamps ? "âœ“" : "âœ—"} ë“±ë¡ì¼ {" "}
                        {importValidation.features.hasStatus ? "âœ“" : "âœ—"} ì½ê¸°ìƒíƒœ {" "}
                        {importValidation.features.hasWorkStatus ? "âœ“" : "âœ—"} ìž‘í’ˆìƒíƒœ
                      </Text>
                    </View>
                  </>
                )}
                
                {/* ì—ëŸ¬ ë©”ì‹œì§€ */}
                {importValidation.errors.length > 0 && (
                  <View>
                    {importValidation.errors.map((e, i) => (
                      <Text key={i} style={{ color: "#991b1b" }}>{e}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
            
            <View
              style={{ flexDirection: "row", gap: 8, marginTop: 12 }}
            >
              <OutlineButton
                title="ðŸ” ê²€ì¦"
                onPress={runImportValidation}
                style={{ flex: 1 }}
                color={C.primary}
              />
              <PrimaryButton
                title="ê°€ì ¸ì˜¤ê¸°"
                onPress={importJSON}
                style={{ flex: 1, opacity: importValidation?.valid ? 1 : 0.5 }}
                disabled={isLoading || !importValidation?.valid}
              />
            </View>
            <OutlineButton
              title="ì·¨ì†Œ"
              onPress={() => {
                setImportOpen(false);
                setImportText("");
                setImportValidation(null);
              }}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>

      {/* ðŸ”§ v3.0.6: JSON ë‚´ë³´ë‚´ê¸° ëª¨ë‹¬ */}
      <Modal
        visible={exportOpen}
        animationType="slide"
        onRequestClose={() => {
          setExportOpen(false);
          exportFullJsonRef.current = "";
        }}
        transparent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: C.modal,
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => {
              setExportOpen(false);
              exportFullJsonRef.current = "";
            }} 
          />
          <View
            style={{
              backgroundColor: C.card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              maxHeight: "90%",
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "800", marginBottom: 8, color: C.text }}
            >
              ðŸ“¦ ë°±ì—… ë°ì´í„° ë‚´ë³´ë‚´ê¸°
            </Text>
            <Text style={{ color: C.sub, marginBottom: 8 }}>
              {exportInfo}
            </Text>
            <Text style={{ color: C.sub, marginBottom: 12, fontSize: 12 }}>
              ðŸ’¡ í…ìŠ¤íŠ¸ ë°•ìŠ¤ë¥¼ ê¸¸ê²Œ ëˆŒëŸ¬ "ì „ì²´ ì„ íƒ" í›„ ë³µì‚¬í•˜ì„¸ìš”.
              {"\n"}   ë˜ëŠ” ì•„ëž˜ "ê³µìœ  ì‹œë„" ë²„íŠ¼ì„ ì‚¬ìš©í•˜ì„¸ìš”.
            </Text>
            <TextInput
              value={exportText}
              editable={false}
              multiline
              selectTextOnFocus={true}
              style={{
                backgroundColor: "#f8f9fa",
                borderWidth: 1,
                borderColor: C.line,
                borderRadius: 12,
                padding: 12,
                fontSize: 11,
                color: C.text,
                height: 250,
                textAlignVertical: "top",
                fontFamily: "monospace",
              }}
            />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <PrimaryButton
                title="ðŸ“¤ ê³µìœ  ì‹œë„"
                onPress={async () => {
                  try {
                    await Share.share({
                      title: "ì›¹ì†Œì„¤ í‹°ì–´ ë°±ì—…(v9)",
                      message: exportFullJsonRef.current,
                    });
                  } catch (e) {
                    Alert.alert(
                      "ê³µìœ  ì‹¤íŒ¨",
                      "ë°ì´í„°ê°€ ë„ˆë¬´ í½ë‹ˆë‹¤.\ní…ìŠ¤íŠ¸ ë°•ìŠ¤ë¥¼ ê¸¸ê²Œ ëˆŒëŸ¬ 'ì „ì²´ ì„ íƒ' í›„ ì§ì ‘ ë³µì‚¬í•´ì£¼ì„¸ìš”."
                    );
                  }
                }}
                style={{ flex: 1 }}
              />
              <OutlineButton
                title="ë‹«ê¸°"
                onPress={() => {
                  setExportOpen(false);
                  setExportText("");
                  setExportInfo("");
                  exportFullJsonRef.current = "";
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ðŸ†• ë¹„êµ ëª¨ë‹¬ */}
      <Modal
        visible={compareOpen}
        animationType="slide"
        onRequestClose={() => setCompareOpen(false)}
        transparent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: C.modal,
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setCompareOpen(false)} 
          />
          <View
            style={{
              backgroundColor: C.card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              maxHeight: "90%",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 12, color: C.text }}>
              ìž‘í’ˆ ë¹„êµ
            </Text>
            {compareNovels.length === 2 && (
              <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {compareNovels.map((n) => {
                    const plats = parsePlatforms(n.platforms);
                    const winRate = getWinRate(n.wins, n.losses);
                    return (
                      <View key={n.id} style={{ flex: 1, padding: 10, backgroundColor: C.bg, borderRadius: 10 }}>
                        {n.cover_image ? (
                          <ExpoImage source={{ uri: n.cover_image }} style={{ width: "100%", height: 100, borderRadius: 6, marginBottom: 6 }} contentFit="cover" cachePolicy="memory-disk" />
                        ) : null}
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                          <ActualTierTag novel={n} />
                          <Text style={{ marginLeft: 6, fontWeight: "700", color: C.text, flex: 1, fontSize: 13 }} numberOfLines={2}>
                            {n.title}
                          </Text>
                        </View>
                        <StatusBadge status={n.status} /><WorkStatusBadge workStatus={n.work_status} />
                        <Text style={{ color: C.sub, marginTop: 6, fontSize: 12 }}>ë ˆì´íŒ…: {n.rating.toFixed(1)}</Text>
                        <Text style={{ color: C.sub, fontSize: 12 }}>ìŠ¹ë¥ : {winRate}%</Text>
                        <Text style={{ color: C.sub, fontSize: 12 }}>ì „ì : {n.wins}ìŠ¹ {n.losses}íŒ¨</Text>
                        <Text style={{ color: C.sub, fontSize: 12 }}>ì½ìŒ: {n.read_count}íšŒ</Text>
                        <Text style={{ color: C.sub, fontSize: 12 }}>ìž‘ê°€: {n.author || "-"}</Text>
                        <Text style={{ color: C.sub, fontSize: 12 }}>í”Œëž«í¼: {plats.join(",") || "-"}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={{ marginTop: 14, padding: 10, backgroundColor: C.bg, borderRadius: 10 }}>
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>ì°¨ì´</Text>
                  <Text style={{ color: C.sub }}>
                    ë ˆì´íŒ…: {Math.abs(compareNovels[0].rating - compareNovels[1].rating).toFixed(1)}ì 
                  </Text>
                  <Text style={{ color: C.sub }}>
                    ìŠ¹ë¥ : {Math.abs(
                      parseFloat(getWinRate(compareNovels[0].wins, compareNovels[0].losses) || 0) -
                      parseFloat(getWinRate(compareNovels[1].wins, compareNovels[1].losses) || 0)
                    ).toFixed(1)}%
                  </Text>
                </View>
              </ScrollView>
            )}
            <OutlineButton
              title="ë‹«ê¸°"
              onPress={() => setCompareOpen(false)}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>

      {/* ðŸ·ï¸ íƒœê·¸ ì„ íƒ ëª¨ë‹¬ (ë¶„ë¦¬ëœ ì»´í¬ë„ŒíŠ¸) */}
      <TagSelectModal
        visible={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        onConfirm={handleTagModalConfirm}
        initialTags={tagModalInitialTags}
        initialMajor={tagModalInitialMajor}
        initialSub={tagModalInitialSub}
        initialTagData={tagModalInitialTagData}
        customTags={customTags}
        comboTags={comboTags}
        userMajorGenres={userMajorGenres}
        userSubGenres={userSubGenres}
        pinnedTags={pinnedTags}
        hiddenTags={hiddenTags}
        tagUsageCounts={tagUsageCounts}
        tagCoOccurrences={tagCoOccurrences}
        tagSentiments={tagSentiments}
        tagRelationGroups={tagRelations.groups}
        customComboTraits={customComboTraits}
        customComboTargets={customComboTargets}
        onAddCustomTag={addCustomTagDirect}
        onAddComboTag={addComboTag}
        onAddUserMajorGenre={addUserMajorGenre}
        onAddUserSubGenre={addUserSubGenre}
        onSetTagSentiment={setTagSentiment}
        onTogglePin={togglePinTag}
        theme={C}
      />

      {/* URL ìž…ë ¥ ëª¨ë‹¬ (Androidìš©) */}
      <Modal
        visible={urlModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setUrlModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: C.overlay, justifyContent: "center", padding: 20 }}>
          <TouchableOpacity 
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} 
            activeOpacity={1} 
            onPress={() => {
              setUrlModalOpen(false);
              setUrlInput("");
            }}
          />
          <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: C.text, marginBottom: 12 }}>
              í‘œì§€ ì´ë¯¸ì§€ URL
            </Text>
            <Text style={{ color: C.sub, marginBottom: 12 }}>
              ì´ë¯¸ì§€ ì£¼ì†Œë¥¼ ìž…ë ¥í•˜ì„¸ìš”{"\n"}(ë…¸ë²¨í”¼ì•„, ë¬¸í”¼ì•„ ë“±ì˜ í‘œì§€ URL)
            </Text>
            <Input
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://..."
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              <OutlineButton
                title="ì·¨ì†Œ"
                onPress={() => {
                  setUrlModalOpen(false);
                  setUrlInput("");
                }}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="í™•ì¸"
                onPress={confirmUrlInput}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ðŸ” ê³ ê¸‰ ê²€ìƒ‰ íƒœê·¸ ëª¨ë‹¬ */}
      <SearchTagModal
        visible={searchTagModalOpen}
        onClose={() => setSearchTagModalOpen(false)}
        includeTags={searchIncludeTags}
        setIncludeTags={setSearchIncludeTags}
        excludeTags={searchExcludeTags}
        setExcludeTags={setSearchExcludeTags}
        excludeStatus={searchExcludeStatus}
        setExcludeStatus={setSearchExcludeStatus}
        excludeWorkStatus={searchExcludeWorkStatus}
        setExcludeWorkStatus={setSearchExcludeWorkStatus}
        customTags={customTags}
        comboTags={comboTags}
        userMajorGenres={userMajorGenres}
        userSubGenres={userSubGenres}
        pinnedTags={pinnedTags}
        hiddenTags={hiddenTags}
        theme={C}
      />

      {/* ðŸ·ï¸ íƒœê·¸ íŽ¸ì§‘ ëª¨ë‹¬ (v3.2.1 í™•ìž¥) */}
      <TagEditModal
        visible={tagEditModalOpen}
        onClose={() => {
          setTagEditModalOpen(false);
          setEditingTag(null);
        }}
        tag={editingTag?.tag}
        tagType={editingTag?.type}
        // ê¸°ì¡´ props
        isPinned={editingTag ? pinnedTags.includes(editingTag.tag) : false}
        onPin={togglePinTag}
        onPromoteToMajor={promoteToMajorGenre}
        onPromoteToSub={promoteToSubGenre}
        onDemoteToCustom={(tag, type) => {
          // typeì´ ì „ë‹¬ë˜ë©´ ì‚¬ìš©, ì•„ë‹ˆë©´ editingTag?.type ì‚¬ìš© (fallback)
          const actualType = type || editingTag?.type;
          if (actualType === "major" || actualType === "userMajor") demoteMajorToCustom(tag);
          else if (actualType === "sub" || actualType === "userSub") demoteSubToCustom(tag);
        }}
        onComboToCustom={comboToCustomTag}
        onDeleteGlobally={deleteTagGlobally}
        onEditRelations={openTagRelationModal}
        relationInfo={editingTag ? getTagGroupInfo(editingTag.tag) : null}
        // ðŸ†• v3.2.1 í™•ìž¥ props
        isHidden={editingTag ? hiddenTags.includes(editingTag.tag) : false}
        sentiment={editingTag ? getTagSentiment(editingTag.tag, tagSentiments) : null}
        coordinateSystems={coordinateSystems}
        tagUsageStats={editingTag ? getTagUsageStats(editingTag.tag) : null}
        onSave={handleTagEditModalSave}
        onHide={toggleHideTag}
        onSetSentiment={setTagSentiment}
        onEditCoordinate={handleEditCoordinate}
        theme={C}
      />

      {/* ðŸ“ v3.2.0: ì¢Œí‘œê³„ íŽ¸ì§‘ ëª¨ë‹¬ */}
      <Modal
        visible={coordManageOpen}
        animationType="slide"
        onRequestClose={() => {
          setCoordManageOpen(false);
          setEditingCoordSystem(null);
          setEditingCoordTag(null);
        }}
        transparent
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", padding: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>
                ðŸ“ ì¢Œí‘œê³„ íŽ¸ì§‘
              </Text>
              <TouchableOpacity onPress={() => { setCoordManageOpen(false); setEditingCoordSystem(null); setEditingCoordTag(null); }}>
                <Text style={{ fontSize: 24, color: C.sub }}>âœ•</Text>
              </TouchableOpacity>
            </View>
            
            {editingCoordSystem && (
              <ScrollView style={{ maxHeight: 500 }}>
                {/* ì¢Œí‘œê³„ ì´ë¦„ */}
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>ì¢Œí‘œê³„ ì´ë¦„</Text>
                <TextInput
                  value={editingCoordSystem.name}
                  onChangeText={(text) => setEditingCoordSystem({ ...editingCoordSystem, name: text })}
                  placeholder="ì¢Œí‘œê³„ ì´ë¦„"
                  placeholderTextColor={C.sub}
                  style={{
                    backgroundColor: C.bg,
                    borderWidth: 1,
                    borderColor: C.line,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 15,
                    color: C.text,
                    marginBottom: 12,
                  }}
                />
                
                {/* Xì¶• ë¼ë²¨ */}
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>Xì¶• (ì˜ë¯¸ì  ìœ„ì¹˜)</Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                  <TextInput
                    value={editingCoordSystem.xAxis?.negative || ""}
                    onChangeText={(text) => setEditingCoordSystem({ 
                      ...editingCoordSystem, 
                      xAxis: { ...editingCoordSystem.xAxis, negative: text } 
                    })}
                    placeholder="ì™¼ìª½ (ì˜ˆ: ì•½í•¨)"
                    placeholderTextColor={C.sub}
                    style={{ flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text }}
                  />
                  <Text style={{ alignSelf: "center", color: C.sub, fontWeight: "700" }}>â†”</Text>
                  <TextInput
                    value={editingCoordSystem.xAxis?.positive || ""}
                    onChangeText={(text) => setEditingCoordSystem({ 
                      ...editingCoordSystem, 
                      xAxis: { ...editingCoordSystem.xAxis, positive: text } 
                    })}
                    placeholder="ì˜¤ë¥¸ìª½ (ì˜ˆ: ê°•í•¨)"
                    placeholderTextColor={C.sub}
                    style={{ flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text }}
                  />
                </View>
                
                {/* Yì¶• ë¼ë²¨ */}
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>Yì¶• (í‘œí˜„ ê°•ë„)</Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                  <TextInput
                    value={editingCoordSystem.yAxis?.negative || ""}
                    onChangeText={(text) => setEditingCoordSystem({ 
                      ...editingCoordSystem, 
                      yAxis: { ...editingCoordSystem.yAxis, negative: text } 
                    })}
                    placeholder="ì•„ëž˜ (ì˜ˆ: ìˆœí•¨)"
                    placeholderTextColor={C.sub}
                    style={{ flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text }}
                  />
                  <Text style={{ alignSelf: "center", color: C.sub, fontWeight: "700" }}>â†•</Text>
                  <TextInput
                    value={editingCoordSystem.yAxis?.positive || ""}
                    onChangeText={(text) => setEditingCoordSystem({ 
                      ...editingCoordSystem, 
                      yAxis: { ...editingCoordSystem.yAxis, positive: text } 
                    })}
                    placeholder="ìœ„ (ì˜ˆ: ê°•í•¨)"
                    placeholderTextColor={C.sub}
                    style={{ flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text }}
                  />
                </View>
                
                {/* ðŸ†• Phase 3: 2D ê·¸ë¦¬ë“œ ì‹œê°í™” (v3.2.1) */}
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6, marginTop: 8 }}>ðŸ“ íƒœê·¸ ë°°ì¹˜ ì‹œê°í™”</Text>
                <CoordinateGridView
                  system={editingCoordSystem}
                  selectedTag={editingCoordTag?.tag || null}
                  editingPosition={editingCoordTag ? { 
                    tag: editingCoordTag.tag, 
                    x: editingCoordTag.x, 
                    y: editingCoordTag.y,
                    isNew: editingCoordTag.isNew 
                  } : null}
                  onSelectTag={(tagName) => {
                    const pos = editingCoordSystem.tags?.[tagName];
                    if (pos) {
                      setEditingCoordTag({ tag: tagName, x: pos.x, y: pos.y, isNew: false, originalTag: tagName });
                    }
                  }}
                  onUpdatePosition={(tagName, x, y) => {
                    setEditingCoordSystem({
                      ...editingCoordSystem,
                      tags: {
                        ...editingCoordSystem.tags,
                        [tagName]: { x, y },
                      },
                    });
                  }}
                  onAddAtPosition={(x, y) => {
                    setEditingCoordTag({ tag: "", x, y, isNew: true });
                  }}
                  theme={C}
                />
                
                {/* íƒœê·¸ ëª©ë¡ */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontWeight: "700", color: C.text }}>ë°°ì¹˜ëœ íƒœê·¸ ({Object.keys(editingCoordSystem.tags || {}).length})</Text>
                  <TouchableOpacity
                    onPress={() => setEditingCoordTag({ tag: "", x: 0.5, y: 0.5, isNew: true })}
                    style={{ backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>+ íƒœê·¸ ì¶”ê°€</Text>
                  </TouchableOpacity>
                </View>
                
                {Object.entries(editingCoordSystem.tags || {}).map(([tagName, pos]) => (
                  <TouchableOpacity
                    key={tagName}
                    onPress={() => setEditingCoordTag({ tag: tagName, x: pos.x, y: pos.y, isNew: false, originalTag: tagName })}
                    style={{
                      backgroundColor: C.bg,
                      padding: 12,
                      borderRadius: 10,
                      marginBottom: 6,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <Text style={{ fontWeight: "600", color: C.text }}>{tagName}</Text>
                      <Text style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                        X: {pos.x.toFixed(2)} ({pos.x < 0.5 ? editingCoordSystem.xAxis?.negative : editingCoordSystem.xAxis?.positive}) â€¢ 
                        Y: {pos.y.toFixed(2)} ({pos.y < 0.5 ? editingCoordSystem.yAxis?.negative : editingCoordSystem.yAxis?.positive})
                      </Text>
                    </View>
                    <Text style={{ color: C.primary }}>íŽ¸ì§‘ â†’</Text>
                  </TouchableOpacity>
                ))}
                
                {Object.keys(editingCoordSystem.tags || {}).length === 0 && (
                  <View style={{ backgroundColor: C.bg, padding: 20, borderRadius: 10, alignItems: "center" }}>
                    <Text style={{ color: C.sub }}>ì•„ì§ íƒœê·¸ê°€ ì—†ìŠµë‹ˆë‹¤.</Text>
                    <Text style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>+ íƒœê·¸ ì¶”ê°€ ë²„íŠ¼ì„ ëˆŒëŸ¬ íƒœê·¸ë¥¼ ë°°ì¹˜í•˜ì„¸ìš”.</Text>
                  </View>
                )}
                
                {/* ì €ìž¥/ì‚­ì œ ë²„íŠ¼ */}
                <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                  <TouchableOpacity
                    onPress={async () => {
                      if (!editingCoordSystem.name.trim()) {
                        Alert.alert("ì•Œë¦¼", "ì¢Œí‘œê³„ ì´ë¦„ì„ ìž…ë ¥í•˜ì„¸ìš”.");
                        return;
                      }
                      const updated = { ...coordinateSystems, [editingCoordSystem.id]: editingCoordSystem };
                      setCoordinateSystems(updated);
                      await saveTagCoordinateSystems(updated);
                      setCoordManageOpen(false);
                      setEditingCoordSystem(null);
                      Alert.alert("ì™„ë£Œ", "ì¢Œí‘œê³„ê°€ ì €ìž¥ë˜ì—ˆìŠµë‹ˆë‹¤.");
                    }}
                    style={{ flex: 2, backgroundColor: C.primary, paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>ì €ìž¥</Text>
                  </TouchableOpacity>
                  
                  {!editingCoordSystem.isDefault && (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          "ì¢Œí‘œê³„ ì‚­ì œ",
                          `"${editingCoordSystem.name}" ì¢Œí‘œê³„ë¥¼ ì‚­ì œí• ê¹Œìš”?`,
                          [
                            { text: "ì·¨ì†Œ" },
                            {
                              text: "ì‚­ì œ",
                              style: "destructive",
                              onPress: async () => {
                                const updated = { ...coordinateSystems };
                                delete updated[editingCoordSystem.id];
                                setCoordinateSystems(updated);
                                await saveTagCoordinateSystems(updated);
                                setCoordManageOpen(false);
                                setEditingCoordSystem(null);
                                Alert.alert("ì™„ë£Œ", "ì¢Œí‘œê³„ê°€ ì‚­ì œë˜ì—ˆìŠµë‹ˆë‹¤.");
                              },
                            },
                          ]
                        );
                      }}
                      style={{ flex: 1, backgroundColor: "#fee2e2", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
                    >
                      <Text style={{ color: "#dc2626", fontWeight: "700", fontSize: 16 }}>ì‚­ì œ</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
            
            {/* íƒœê·¸ íŽ¸ì§‘ ì„œë¸Œëª¨ë‹¬ */}
            {editingCoordTag && (
              <View style={{ 
                position: "absolute", 
                top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: "rgba(0,0,0,0.5)", 
                justifyContent: "center", 
                alignItems: "center",
                padding: 16,
              }}>
                <View style={{ backgroundColor: C.card, padding: 20, borderRadius: 16, width: "100%", maxWidth: 350 }}>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: C.text, marginBottom: 16 }}>
                    {editingCoordTag.isNew ? "íƒœê·¸ ì¶”ê°€" : "íƒœê·¸ íŽ¸ì§‘"}
                  </Text>
                  
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>íƒœê·¸ ì´ë¦„</Text>
                  <TextInput
                    value={editingCoordTag.tag}
                    onChangeText={(text) => setEditingCoordTag({ ...editingCoordTag, tag: text })}
                    placeholder="íƒœê·¸ ì´ë¦„"
                    placeholderTextColor={C.sub}
                    style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: C.text, marginBottom: 16 }}
                  />
                  
                  {/* X ì¢Œí‘œ */}
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>
                    X ì¢Œí‘œ: {editingCoordTag.x.toFixed(2)} ({editingCoordTag.x < 0.5 ? editingCoordSystem?.xAxis?.negative : editingCoordSystem?.xAxis?.positive})
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <Text style={{ fontSize: 12, color: C.sub }}>{editingCoordSystem?.xAxis?.negative}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ height: 40, justifyContent: "center" }}>
                        <View style={{ height: 4, backgroundColor: C.line, borderRadius: 2 }} />
                        <View style={{ 
                          position: "absolute",
                          left: `${editingCoordTag.x * 100}%`,
                          width: 24,
                          height: 24,
                          backgroundColor: C.primary,
                          borderRadius: 12,
                          marginLeft: -12,
                        }} />
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                        {[0, 0.25, 0.5, 0.75, 1].map(v => (
                          <TouchableOpacity 
                            key={v} 
                            onPress={() => setEditingCoordTag({ ...editingCoordTag, x: v })}
                            style={{ padding: 4 }}
                          >
                            <Text style={{ fontSize: 10, color: editingCoordTag.x === v ? C.primary : C.sub, fontWeight: editingCoordTag.x === v ? "700" : "400" }}>{v}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: C.sub }}>{editingCoordSystem?.xAxis?.positive}</Text>
                  </View>
                  
                  {/* Y ì¢Œí‘œ */}
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>
                    Y ì¢Œí‘œ: {editingCoordTag.y.toFixed(2)} ({editingCoordTag.y < 0.5 ? editingCoordSystem?.yAxis?.negative : editingCoordSystem?.yAxis?.positive})
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <Text style={{ fontSize: 12, color: C.sub }}>{editingCoordSystem?.yAxis?.negative}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ height: 40, justifyContent: "center" }}>
                        <View style={{ height: 4, backgroundColor: C.line, borderRadius: 2 }} />
                        <View style={{ 
                          position: "absolute",
                          left: `${editingCoordTag.y * 100}%`,
                          width: 24,
                          height: 24,
                          backgroundColor: "#22c55e",
                          borderRadius: 12,
                          marginLeft: -12,
                        }} />
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                        {[0, 0.25, 0.5, 0.75, 1].map(v => (
                          <TouchableOpacity 
                            key={v} 
                            onPress={() => setEditingCoordTag({ ...editingCoordTag, y: v })}
                            style={{ padding: 4 }}
                          >
                            <Text style={{ fontSize: 10, color: editingCoordTag.y === v ? "#22c55e" : C.sub, fontWeight: editingCoordTag.y === v ? "700" : "400" }}>{v}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: C.sub }}>{editingCoordSystem?.yAxis?.positive}</Text>
                  </View>
                  
                  {/* ë²„íŠ¼ë“¤ */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => {
                        if (!editingCoordTag.tag.trim()) {
                          Alert.alert("ì•Œë¦¼", "íƒœê·¸ ì´ë¦„ì„ ìž…ë ¥í•˜ì„¸ìš”.");
                          return;
                        }
                        const newTags = { ...editingCoordSystem.tags };
                        // ê¸°ì¡´ íƒœê·¸ ì´ë¦„ ë³€ê²½ ì‹œ ì´ì „ ê²ƒ ì‚­ì œ
                        if (!editingCoordTag.isNew && editingCoordTag.originalTag !== editingCoordTag.tag) {
                          delete newTags[editingCoordTag.originalTag];
                        }
                        newTags[editingCoordTag.tag.trim()] = { x: editingCoordTag.x, y: editingCoordTag.y };
                        setEditingCoordSystem({ ...editingCoordSystem, tags: newTags });
                        setEditingCoordTag(null);
                      }}
                      style={{ flex: 2, backgroundColor: C.primary, paddingVertical: 12, borderRadius: 10, alignItems: "center" }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700" }}>í™•ì¸</Text>
                    </TouchableOpacity>
                    
                    {!editingCoordTag.isNew && (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert("íƒœê·¸ ì‚­ì œ", `"${editingCoordTag.originalTag}" íƒœê·¸ë¥¼ ì¢Œí‘œê³„ì—ì„œ ì œê±°í• ê¹Œìš”?`, [
                            { text: "ì·¨ì†Œ" },
                            {
                              text: "ì‚­ì œ",
                              style: "destructive",
                              onPress: () => {
                                const newTags = { ...editingCoordSystem.tags };
                                delete newTags[editingCoordTag.originalTag];
                                setEditingCoordSystem({ ...editingCoordSystem, tags: newTags });
                                setEditingCoordTag(null);
                              },
                            },
                          ]);
                        }}
                        style={{ flex: 1, backgroundColor: "#fee2e2", paddingVertical: 12, borderRadius: 10, alignItems: "center" }}
                      >
                        <Text style={{ color: "#dc2626", fontWeight: "700" }}>ì‚­ì œ</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      onPress={() => setEditingCoordTag(null)}
                      style={{ flex: 1, backgroundColor: C.bg, paddingVertical: 12, borderRadius: 10, alignItems: "center" }}
                    >
                      <Text style={{ color: C.text, fontWeight: "700" }}>ì·¨ì†Œ</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ðŸ”— íƒœê·¸ ê´€ê³„ íŽ¸ì§‘ ëª¨ë‹¬ */}
      <TagRelationModal
        visible={tagRelationModalOpen}
        onClose={() => {
          setTagRelationModalOpen(false);
          setTagRelationTarget(null);
          setTagRelationEditGroup(null);
        }}
        targetTag={tagRelationTarget}
        existingGroup={tagRelationEditGroup}
        allGroups={tagRelations.groups}
        onCreateGroup={createTagGroup}
        onUpdateGroup={(groupId, updates) => {
          setTagRelations(prev => {
            const newGroups = { ...prev.groups, [groupId]: { ...prev.groups[groupId], ...updates } };
            const updated = { ...prev, groups: newGroups };
            setTimeout(() => setAppMeta("tag_relations", updated), 0);
            return updated;
          });
        }}
        onDeleteGroup={deleteTagGroup}
        onAddTagToGroup={addTagToGroup}
        onRemoveTagFromGroup={removeTagFromGroup}
        theme={C}
      />

      {/* ðŸ“‹ ì˜ˆì • ìž‘í’ˆ íŽ¸ì§‘ ëª¨ë‹¬ (v3.3.0) */}
      <Modal
        visible={plannedEditOpen}
        animationType="slide"
        onRequestClose={() => setPlannedEditOpen(false)}
        transparent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: C.modal,
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setPlannedEditOpen(false)} 
          />
          <View
            style={{
              backgroundColor: C.card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              maxHeight: "85%",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 8, color: C.text }}>
              ðŸ“‹ ì˜ˆì • ìž‘í’ˆ ìˆ˜ì •
            </Text>
            {plannedEditItem && (
              <ScrollView showsVerticalScrollIndicator={true}>
                <Label>ì œëª© *</Label>
                <Input
                  value={plannedEditItem.title || ""}
                  onChangeText={(t) => setPlannedEditItem({ ...plannedEditItem, title: t })}
                />
                
                <Label style={{ marginTop: 10 }}>ìž‘ê°€</Label>
                <Input
                  value={plannedEditItem.author || ""}
                  onChangeText={(t) => setPlannedEditItem({ ...plannedEditItem, author: t })}
                />
                
                <Label style={{ marginTop: 10 }}>ì—°ìž¬ì²˜</Label>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {PLATFORM_OPTIONS.map((p) => {
                    const cur = parsePlatforms(plannedEditItem.platforms);
                    const on = cur.includes(p);
                    return (
                      <Chip
                        key={p}
                        label={p}
                        active={on}
                        onPress={() => {
                          const next = on ? cur.filter((x) => x !== p) : [...cur, p];
                          setPlannedEditItem({
                            ...plannedEditItem,
                            platforms: JSON.stringify(next),
                          });
                        }}
                      />
                    );
                  })}
                </View>
                
                <Label style={{ marginTop: 10 }}>ìž‘í’ˆ ìƒíƒœ</Label>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {WORK_STATUS_OPTIONS.map((opt) => (
                    <Chip
                      key={opt.key}
                      label={opt.label}
                      active={plannedEditItem.work_status === opt.key}
                      onPress={() => setPlannedEditItem({ ...plannedEditItem, work_status: opt.key })}
                    />
                  ))}
                </View>
                
                <Label style={{ marginTop: 10 }}>ì „ì²´ íšŒì°¨ ìˆ˜</Label>
                <Input
                  value={String(plannedEditItem.total_episodes || "")}
                  onChangeText={(t) => setPlannedEditItem({ ...plannedEditItem, total_episodes: t })}
                  keyboardType="number-pad"
                />
                
                <Label style={{ marginTop: 10 }}>ì½ê¸° ìš°ì„ ìˆœìœ„</Label>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPlannedEditItem({ ...plannedEditItem, priority: p })}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: (plannedEditItem.priority || 3) === p ? "#8b5cf6" : C.chip,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ 
                        color: (plannedEditItem.priority || 3) === p ? "#fff" : C.text, 
                        fontWeight: "700",
                        fontSize: 12,
                      }}>
                        {"â­".repeat(p)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Label style={{ marginTop: 10 }}>í‘œì§€ ì´ë¯¸ì§€</Label>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {plannedEditItem.cover_image ? (
                    <ExpoImage
                      source={{ uri: plannedEditItem.cover_image }}
                      style={{ width: 50, height: 70, borderRadius: 6 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={{ width: 50, height: 70, borderRadius: 6, backgroundColor: C.line, justifyContent: "center", alignItems: "center" }}>
                      <Text style={{ color: C.sub, fontSize: 10 }}>ì—†ìŒ</Text>
                    </View>
                  )}
                  <OutlineButton 
                    title="ê°¤ëŸ¬ë¦¬" 
                    onPress={() => pickImageFromGallery((uri) => {
                      setPlannedEditItem({ ...plannedEditItem, cover_image: uri });
                    })} 
                    style={{ minWidth: 70 }}
                  />
                  <OutlineButton 
                    title="ë¼ì´ë¸ŒëŸ¬ë¦¬" 
                    onPress={() => {
                      setCoverSelectTarget("plannedEdit");
                      setCoverSelectModalOpen(true);
                    }} 
                    color={C.primary}
                    style={{ minWidth: 90 }}
                  />
                  {plannedEditItem.cover_image && (
                    <OutlineButton 
                      title="ì‚­ì œ" 
                      onPress={() => setPlannedEditItem({ ...plannedEditItem, cover_image: "" })} 
                      color={C.warn}
                      style={{ minWidth: 60 }}
                    />
                  )}
                </View>
                <Input
                  value={plannedEditItem.cover_image || ""}
                  onChangeText={(t) => setPlannedEditItem({ ...plannedEditItem, cover_image: t })}
                  placeholder="URL ì§ì ‘ ìž…ë ¥"
                />
                
                <Label style={{ marginTop: 10 }}>ìž‘í’ˆ ë§í¬</Label>
                <Input
                  value={plannedEditItem.link || ""}
                  onChangeText={(t) => setPlannedEditItem({ ...plannedEditItem, link: t })}
                />
                
                <Label style={{ marginTop: 10 }}>íƒœê·¸</Label>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <View style={{ flex: 1, backgroundColor: C.bg, padding: 10, borderRadius: 10, minHeight: 40 }}>
                    <Text style={{ color: plannedEditItem.tags ? C.text : C.sub, fontSize: 14 }} numberOfLines={2}>
                      {plannedEditItem.tags || "íƒœê·¸ë¥¼ ì„ íƒí•˜ì„¸ìš”..."}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      // ðŸ”§ v3.4.5: tags ë¬¸ìžì—´ì—ì„œ ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´/ì¼ë°˜íƒœê·¸ë¥¼ ë¶„ë¦¬í•˜ì—¬ ì „ë‹¬ (íŽ¸ì§‘ ëª¨ë‹¬ê³¼ ì¼ê´€ì„±)
                      const currentTags = (plannedEditItem.tags || "")
                        .split(",")
                        .map(t => t.trim())
                        .filter(Boolean);
                      
                      const allMajor = [...MAJOR_GENRES, ...userMajorGenres];
                      const allSub = [...SUB_GENRES, ...userSubGenres];
                      
                      // ëŒ€ìž¥ë¥´ ê°ì§€
                      const majorTags = currentTags.filter(tag => 
                        allMajor.some(m => m.toLowerCase() === tag.toLowerCase())
                      ).map(tag => allMajor.find(m => m.toLowerCase() === tag.toLowerCase()) || tag);
                      
                      // ë¶€ìž¥ë¥´ ê°ì§€
                      const subTags = currentTags.filter(tag => 
                        allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                      ).map(tag => allSub.find(s => s.toLowerCase() === tag.toLowerCase()) || tag);
                      
                      // ì¼ë°˜ íƒœê·¸ (ëŒ€ìž¥ë¥´/ë¶€ìž¥ë¥´ ì œì™¸)
                      const generalTags = currentTags.filter(tag => 
                        !allMajor.some(m => m.toLowerCase() === tag.toLowerCase()) &&
                        !allSub.some(s => s.toLowerCase() === tag.toLowerCase())
                      );
                      
                      // ë¶„ë¦¬ëœ ê°’ìœ¼ë¡œ ëª¨ë‹¬ ì—´ê¸° (JSON ë¬¸ìžì—´ë¡œ ì „ë‹¬)
                      openTagModal(
                        "planned", 
                        generalTags, 
                        majorTags.length > 0 ? JSON.stringify(majorTags) : "",
                        subTags.length > 0 ? JSON.stringify(subTags) : "",
                        []
                      );
                    }}
                    style={{
                      backgroundColor: C.primary,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>ðŸ·ï¸ ì„ íƒ</Text>
                  </TouchableOpacity>
                </View>
                
                {/* ðŸ†• v3.4: í™•ìž¥ í•„ë“œë“¤ */}
                <Label style={{ marginTop: 10 }}>ê´€ì‹¬ë„</Label>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPlannedEditItem({ ...plannedEditItem, interest_level: p })}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: (plannedEditItem.interest_level || 3) === p ? "#ec4899" : C.chip,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ 
                        color: (plannedEditItem.interest_level || 3) === p ? "#fff" : C.text, 
                        fontWeight: "700",
                        fontSize: 12,
                      }}>
                        {"ðŸ’—".repeat(p)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Label style={{ marginTop: 10 }}>ì˜ˆìƒ í‹°ì–´</Label>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {["", "S", "A", "B+", "B", "B-", "C"].map((tier) => (
                    <TouchableOpacity
                      key={tier || "none"}
                      onPress={() => setPlannedEditItem({ ...plannedEditItem, expected_tier: tier })}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 8,
                        backgroundColor: (plannedEditItem.expected_tier || "") === tier 
                          ? (tier ? getTierColor(tier) : C.primary) 
                          : C.chip,
                      }}
                    >
                      <Text style={{ 
                        color: (plannedEditItem.expected_tier || "") === tier ? "#fff" : C.text, 
                        fontWeight: "700",
                        fontSize: 13,
                      }}>
                        {tier || "ë¯¸ì •"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Label style={{ marginTop: 10 }}>ë°œê²¬ ê²½ë¡œ</Label>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {["", "ì¶”ì²œ", "ê²€ìƒ‰", "ê´‘ê³ ", "ëž­í‚¹", "ì¹œêµ¬", "ì»¤ë®¤ë‹ˆí‹°", "SNS", "ê¸°íƒ€"].map((src) => (
                    <TouchableOpacity
                      key={src || "none"}
                      onPress={() => setPlannedEditItem({ ...plannedEditItem, discovery_source: src })}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        backgroundColor: (plannedEditItem.discovery_source || "") === src ? C.primary : C.chip,
                      }}
                    >
                      <Text style={{ 
                        color: (plannedEditItem.discovery_source || "") === src ? "#fff" : C.text, 
                        fontWeight: "600",
                        fontSize: 12,
                      }}>
                        {src || "ë¯¸ì„ íƒ"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Label style={{ marginTop: 10 }}>1í™” ì½ìŒ ì—¬ë¶€</Label>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setPlannedEditItem({ ...plannedEditItem, first_chapter_read: 0 })}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: !plannedEditItem.first_chapter_read ? C.primary : C.chip,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ 
                      color: !plannedEditItem.first_chapter_read ? "#fff" : C.text, 
                      fontWeight: "700",
                    }}>
                      ðŸ“– ì•ˆ ì½ìŒ
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPlannedEditItem({ ...plannedEditItem, first_chapter_read: 1 })}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: plannedEditItem.first_chapter_read ? "#22c55e" : C.chip,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ 
                      color: plannedEditItem.first_chapter_read ? "#fff" : C.text, 
                      fontWeight: "700",
                    }}>
                      âœ… 1í™” ì½ìŒ
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* ðŸ“… ì½ê¸° ì‹œìž‘ ì˜ˆì •ì¼ (ì„¤ì • ê¸°ë°˜) */}
                {appSettings.plannedFields?.showScheduledStart !== false && (
                  <>
                    <Label style={{ marginTop: 10 }}>ì½ê¸° ì‹œìž‘ ì˜ˆì •ì¼</Label>
                    <Input
                      value={(() => {
                        const ts = plannedEditItem.scheduled_start_date;
                        if (!ts || ts <= 0) return "";
                        try {
                          return new Date(ts).toISOString().split('T')[0];
                        } catch { return ""; }
                      })()}
                      onChangeText={(t) => {
                        let timestamp = 0;
                        if (t && t.trim()) {
                          try {
                            const parsed = new Date(t);
                            if (!isNaN(parsed.getTime())) {
                              timestamp = parsed.getTime();
                            }
                          } catch {}
                        }
                        setPlannedEditItem({ 
                          ...plannedEditItem, 
                          scheduled_start_date: timestamp 
                        });
                      }}
                      placeholder="ì˜ˆ: 2025-02-01 (ì„ íƒì‚¬í•­)"
                    />
                  </>
                )}
                
                {/* ðŸ“Š ì˜ˆìƒ ë ˆì´íŒ… (ì„¤ì • ê¸°ë°˜) */}
                {appSettings.plannedFields?.showExpectedRating === true && (
                  <>
                    <Label style={{ marginTop: 10 }}>ì˜ˆìƒ ë ˆì´íŒ… (ìˆ«ìž)</Label>
                    <Input
                      value={String(plannedEditItem.expected_rating || 1500)}
                      onChangeText={(t) => setPlannedEditItem({ 
                        ...plannedEditItem, 
                        expected_rating: Number(t) || 1500 
                      })}
                      placeholder="ì˜ˆ: 1700"
                      keyboardType="number-pad"
                    />
                  </>
                )}
                
                {/* ðŸ“š ë¹„ìŠ·í•œ ìž‘í’ˆ (ì„¤ì • ê¸°ë°˜) */}
                {appSettings.plannedFields?.showSimilarNovels === true && (
                  <>
                    <Label style={{ marginTop: 10 }}>ë¹„ìŠ·í•œ ìž‘í’ˆ</Label>
                    <Text style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>
                      {(() => {
                        try {
                          const ids = JSON.parse(plannedEditItem.similar_novels || "[]");
                          if (!Array.isArray(ids) || ids.length === 0) return "ì„ íƒëœ ìž‘í’ˆ ì—†ìŒ";
                          return ids.map(id => {
                            const found = list.find(n => n.id === id);
                            return found ? found.title : "";
                          }).filter(Boolean).join(", ") || "ì„ íƒëœ ìž‘í’ˆ ì—†ìŒ";
                        } catch { return "ì„ íƒëœ ìž‘í’ˆ ì—†ìŒ"; }
                      })()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const topNovels = [...list]
                          .sort((a, b) => (b.rating || 1500) - (a.rating || 1500))
                          .slice(0, 10);
                        
                        Alert.alert(
                          "ë¹„ìŠ·í•œ ìž‘í’ˆ ì„ íƒ",
                          "ìƒìœ„ 10ìž‘í’ˆ ì¤‘ ì„ íƒí•˜ì„¸ìš”. (ì·¨ì†Œë¡œ ì´ˆê¸°í™”)",
                          [
                            { 
                              text: "ì·¨ì†Œ (ì´ˆê¸°í™”)", 
                              onPress: () => setPlannedEditItem({ ...plannedEditItem, similar_novels: "[]" })
                            },
                            ...topNovels.map(n => ({
                              text: n.title?.substring(0, 20) || "?",
                              onPress: () => {
                                try {
                                  const current = JSON.parse(plannedEditItem.similar_novels || "[]");
                                  if (!current.includes(n.id)) {
                                    const updated = [...current, n.id].slice(0, 3);
                                    setPlannedEditItem({ 
                                      ...plannedEditItem, 
                                      similar_novels: JSON.stringify(updated) 
                                    });
                                  }
                                } catch {
                                  setPlannedEditItem({ 
                                    ...plannedEditItem, 
                                    similar_novels: JSON.stringify([n.id]) 
                                  });
                                }
                              }
                            })),
                          ]
                        );
                      }}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: C.line,
                        borderStyle: "dashed",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: C.primary, fontWeight: "600" }}>
                        + ë¹„ìŠ·í•œ ìž‘í’ˆ ì¶”ê°€ (ìµœëŒ€ 3ê°œ)
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                
                <Label style={{ marginTop: 10 }}>ì™œ ê´€ì‹¬ ê°–ê²Œ ë˜ì—ˆë‚˜ìš”?</Label>
                <Input
                  value={plannedEditItem.why_interested || ""}
                  onChangeText={(t) => setPlannedEditItem({ ...plannedEditItem, why_interested: t })}
                  placeholder="ì˜ˆ: ì„¤ì •ì´ ì°¸ì‹ í•´ì„œ, ì¶”ì²œ ë§Žì´ ë°›ì•„ì„œ..."
                  multiline
                />
                
                <Label style={{ marginTop: 10 }}>ë©”ëª¨</Label>
                <Input
                  value={plannedEditItem.note || ""}
                  onChangeText={(t) => setPlannedEditItem({ ...plannedEditItem, note: t })}
                  multiline
                />
                
                <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                  <PrimaryButton
                    title="ì €ìž¥"
                    onPress={savePlannedEdit}
                    style={{ flex: 1 }}
                  />
                  <OutlineButton
                    title="ë‹«ê¸°"
                    onPress={() => {
                      setPlannedEditOpen(false);
                      setPlannedEditItem(null);
                    }}
                    style={{ flex: 1 }}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ðŸ–¼ï¸ í‘œì§€ ì„ íƒ ëª¨ë‹¬ (ë¼ì´ë¸ŒëŸ¬ë¦¬ì—ì„œ ì„ íƒ) - v3.4.5 */}
      <Modal
        visible={coverSelectModalOpen}
        animationType="slide"
        onRequestClose={() => setCoverSelectModalOpen(false)}
        transparent
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: C.modal }}
          activeOpacity={1}
          onPress={() => setCoverSelectModalOpen(false)}
        >
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <TouchableOpacity activeOpacity={1}>
              <View style={{
                backgroundColor: C.card,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 16,
                minHeight: "60%",
                maxHeight: "90%",
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>
                    ðŸ–¼ï¸ í‘œì§€ ë¼ì´ë¸ŒëŸ¬ë¦¬ì—ì„œ ì„ íƒ
                  </Text>
                  <TouchableOpacity onPress={() => setCoverSelectModalOpen(false)} style={{ padding: 8 }}>
                    <Text style={{ color: C.sub, fontSize: 28, fontWeight: "300" }}>Ã—</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={{ color: C.sub, marginBottom: 12 }}>
                  ë¯¸ì‚¬ìš© í‘œì§€ ì¤‘ì—ì„œ ì„ íƒí•˜ì„¸ìš”. (ì‚¬ìš© ì¤‘ì¸ í‘œì§€ëŠ” íšŒìƒ‰ìœ¼ë¡œ í‘œì‹œë©ë‹ˆë‹¤)
                </Text>

                {coverLibrary.length === 0 ? (
                  <View style={{ padding: 40, alignItems: "center" }}>
                    <Text style={{ color: C.sub, textAlign: "center" }}>
                      í‘œì§€ ë¼ì´ë¸ŒëŸ¬ë¦¬ê°€ ë¹„ì–´ìžˆìŠµë‹ˆë‹¤.{"\n"}
                      'í‘œì§€' íƒ­ì—ì„œ ì´ë¯¸ì§€ë¥¼ ì¶”ê°€í•´ì£¼ì„¸ìš”.
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={coverLibrary}
                    keyExtractor={(item) => item.id}
                    numColumns={4}
                    style={{ flex: 1 }}
                    columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
                    renderItem={({ item }) => {
                      const isUsed = item.status === "used";
                      
                      return (
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            aspectRatio: 0.7,
                            maxWidth: "24%",
                            borderRadius: 6,
                            overflow: "hidden",
                            borderWidth: 2,
                            borderColor: isUsed ? C.line : C.primary,
                            opacity: isUsed ? 0.5 : 1,
                          }}
                          onPress={() => {
                            if (!isUsed) {
                              selectCoverFromLibrary(item);
                            } else {
                              Alert.alert("ì•Œë¦¼", "ì´ í‘œì§€ëŠ” ì´ë¯¸ ë‹¤ë¥¸ ìž‘í’ˆì—ì„œ ì‚¬ìš© ì¤‘ìž…ë‹ˆë‹¤.");
                            }
                          }}
                          disabled={isUsed}
                        >
                          <ExpoImage
                            source={{ uri: item.file_path }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                          {isUsed && (
                            <View style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: "rgba(0,0,0,0.4)",
                              justifyContent: "center",
                              alignItems: "center",
                            }}>
                              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>ì‚¬ìš©ì¤‘</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    }}
                    ListEmptyComponent={<Text style={{ color: C.sub, textAlign: "center" }}>í‘œì§€ê°€ ì—†ìŠµë‹ˆë‹¤.</Text>}
                  />
                )}
                
                <OutlineButton
                  title="ë‹«ê¸°"
                  onPress={() => setCoverSelectModalOpen(false)}
                  style={{ marginTop: 12 }}
                />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ðŸ·ï¸ íƒœê·¸ ë§¤ë‹ˆì € ëª¨ë‹¬ (í’€ìŠ¤í¬ë¦°) */}
      <TagManagerModal
        visible={tagManagerModalOpen}
        onClose={() => setTagManagerModalOpen(false)}
        customTags={customTags}
        comboTags={comboTags}
        userMajorGenres={userMajorGenres}
        userSubGenres={userSubGenres}
        pinnedTags={pinnedTags}
        hiddenTags={hiddenTags}
        sentiments={tagSentiments}
        tagAttributes={tagAttributes}
        onTogglePin={togglePinTag}
        onToggleHide={toggleHideTag}
        onPromoteToMajor={promoteToMajorGenre}
        onPromoteToSub={promoteToSubGenre}
        onToggleMajorAttr={toggleTagMajor}
        onToggleSubAttr={toggleTagSub}
        checkIsMajor={checkIsTagMajor}
        checkIsSub={checkIsTagSub}
        onDemoteToCustom={(tag, type) => {
          if (type === "userMajor") demoteMajorToCustom(tag);
          else if (type === "userSub") demoteSubToCustom(tag);
        }}
        onComboToCustom={comboToCustomTag}
        onDeleteTag={async (tag, type) => {
          // í•´ë‹¹ íƒ€ìž…ì—ì„œ íƒœê·¸ ì‚­ì œ
          if (type === "custom") {
            const newCustom = customTags.filter(t => t !== tag);
            setCustomTags(newCustom);
            await setAppMeta("custom_tags", newCustom);
          } else if (type === "combo") {
            const newCombo = comboTags.filter(t => t !== tag);
            setComboTags(newCombo);
            await setAppMeta("combo_tags", newCombo);
          } else if (type === "userMajor") {
            const newMajor = userMajorGenres.filter(t => t !== tag);
            setUserMajorGenres(newMajor);
            await setAppMeta("user_major_genres", newMajor);
          } else if (type === "userSub") {
            const newSub = userSubGenres.filter(t => t !== tag);
            setUserSubGenres(newSub);
            await setAppMeta("user_sub_genres", newSub);
          }
          // ê³ ì •ì—ì„œë„ ì œê±°
          if (pinnedTags.includes(tag)) {
            await savePinnedTags(pinnedTags.filter(t => t !== tag));
          }
          Alert.alert("ì™„ë£Œ", `"${tag}" íƒœê·¸ë¥¼ ì‚­ì œí–ˆìŠµë‹ˆë‹¤.`);
        }}
        onDeleteGlobally={deleteTagGlobally}
        onAddCustomTag={async (tag) => {
          if (customTags.includes(tag) || comboTags.includes(tag)) {
            Alert.alert("ì•Œë¦¼", "ì´ë¯¸ ì¡´ìž¬í•˜ëŠ” íƒœê·¸ìž…ë‹ˆë‹¤.");
            return;
          }
          const newCustom = [...customTags, tag];
          setCustomTags(newCustom);
          await setAppMeta("custom_tags", newCustom);
          Alert.alert("ì™„ë£Œ", `"${tag}" íƒœê·¸ë¥¼ ì¶”ê°€í–ˆìŠµë‹ˆë‹¤.`);
        }}
        onChangeSentiment={async (tag, sentiment) => {
          const updated = { ...tagSentiments, [tag]: sentiment };
          setTagSentiments(updated);
          await setAppMeta("tag_sentiments", updated);
        }}
        onBatchChangeSentiment={async (tags, sentiment) => {
          const updated = { ...tagSentiments };
          for (const tag of tags) {
            updated[tag] = sentiment;
          }
          setTagSentiments(updated);
          await setAppMeta("tag_sentiments", updated);
        }}
        onCleanupDuplicates={cleanupDuplicateTags}
        onCleanupUnused={cleanupUnusedTags}
        findUnusedTags={findUnusedTags}
        theme={C}
      />
    </SafeAreaView>
  );
}