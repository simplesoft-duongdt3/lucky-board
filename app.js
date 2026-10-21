(() => {
  "use strict";

  const STORAGE_KEY = "boc-so.app.v2";
  const LEGACY_STORAGE_KEY = "boc-so.app.v1";
  const MAX_DRAW_COUNT = 100;
  const MAX_ENTRIES = 20000;
  const MAX_RAW_LENGTH = 2000000;
  const MAX_HISTORY = 50;
  const MAX_LISTS = 100;
  const PREVIEW_LIMIT = 8;
  const MIN_RUN_DURATION = 0.5;
  const MAX_RUN_DURATION = 20;
  const DEFAULT_RUN_DURATION = 3;
  const DELIMITER_VALUES = new Set(["auto", "newline", "comma", "tab"]);
  const DRAW_POLICIES = new Set(["keep", "remove"]);
  const RUN_MODES = new Set(["instant", "together", "cascade"]);
  const VIEW_VALUES = new Set(["draw", "lists", "appearance", "history"]);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const THEME_PRESETS = Object.freeze([
    {
      id: "minimal",
      name: "Tối giản",
      description: "Rõ ràng, trung tính và phù hợp khi dùng hằng ngày.",
      colors: ["#f4f7f8", "#ffffff", "#1b6c80"],
      palette: { ground: "#f4f7f8", surface: "#ffffff", text: "#151719", accent: "#1b6c80" },
    },
    {
      id: "festival",
      name: "Lễ hội",
      description: "Sắc vàng nổi bật, điểm đỏ dứt khoát cho sự kiện.",
      colors: ["#f5dd58", "#fffdf7", "#a9233d"],
      palette: { ground: "#f5dd58", surface: "#fffdf7", text: "#271c1e", accent: "#a9233d" },
    },
    {
      id: "formal",
      name: "Trang trọng",
      description: "Tiết chế, có nhịp chữ rõ và sắc xanh trầm.",
      colors: ["#edf1ef", "#ffffff", "#315d4c"],
      palette: { ground: "#edf1ef", surface: "#ffffff", text: "#18201c", accent: "#315d4c" },
    },
    {
      id: "playful",
      name: "Vui vẻ",
      description: "Bề mặt sáng, bo mềm và một sắc hồng làm điểm nhấn.",
      colors: ["#e8f7f1", "#ffffff", "#c94068"],
      palette: { ground: "#e8f7f1", surface: "#ffffff", text: "#18211e", accent: "#c94068" },
    },
    {
      id: "midnight",
      name: "Ban đêm",
      description: "Nền tối trung tính, chữ sáng và điểm vàng ấm.",
      colors: ["#0c0e0e", "#171a19", "#e0b34a"],
      palette: { ground: "#0c0e0e", surface: "#171a19", text: "#f4f6f5", accent: "#e0b34a" },
    },
  ]);

  const THEME_MAP = new Map(THEME_PRESETS.map((theme) => [theme.id, theme]));
  const RUN_MODE_TEXT_KEYS = Object.freeze({
    instant: { label: "runModeInstantOption", help: "runModeInstantHelp" },
    together: { label: "runModeTogetherOption", help: "runModeTogetherHelp" },
    cascade: { label: "runModeCascadeOption", help: "runModeCascadeHelp" },
  });

  const DEFAULT_UI_TEXT = Object.freeze({
    appName: "Bốc số",
    navDraw: "Bốc số",
    navLists: "Danh sách",
    navAppearance: "Giao diện",
    navHistory: "Lịch sử",
    localNote: "Dữ liệu nằm trên thiết bị này. Không có máy chủ.",
    currentListLabel: "Danh sách hiện tại",
    saveUnavailable: "Chỉ lưu trong phiên này",
    saveNever: "Chưa có dữ liệu lưu",
    saveAt: "Đã lưu lúc {{time}}",
    drawTitle: "Bốc số ngẫu nhiên",
    drawMetaEmpty: "Chưa có danh sách. Dán nội dung để bắt đầu.",
    drawMetaReady: "{{count}} mục · rút {{drawCount}} ô không lặp · lưu trên máy này.",
    drawMetaInsufficient: "{{count}} mục · cần thêm {{missing}} để đủ {{drawCount}} ô.",
    drawMetaLowPool: "{{count}} mục · còn {{remaining}} khả dụng · cần khôi phục hoặc thêm dữ liệu.",
    drawMetaRemoved: "{{count}} mục · còn {{remaining}} khả dụng · rút {{drawCount}} ô.",
    countLabel: "Số ô",
    policyLabel: "Sau khi rút",
    policyKeep: "Vẫn giữ",
    policyRemove: "Rút xong thì bỏ",
    runModeLabel: "Kiểu chạy random",
    runDurationLabel: "Thời gian",
    runDurationUnit: "giây",
    runModeInstantOption: "Tức thì",
    runModeTogetherOption: "Đồng loạt",
    runModeCascadeOption: "Cuốn chiếu",
    runModeInstantHelp: "Hiện đủ kết quả ngay, không có thời gian chờ.",
    runModeTogetherHelp: "Các ô đổi ngẫu nhiên rồi dừng cùng lúc.",
    runModeCascadeHelp: "Các ô lần lượt chốt từ trái sang phải.",
    openDataAction: "Dữ liệu nguồn",
    addDataAction: "Dán danh sách",
    addMoreAction: "Bổ sung dữ liệu",
    drawAction: "Bốc {{count}} kết quả",
    drawingAction: "Đang bốc…",
    restorePoolAction: "Khôi phục {{count}} mục",
    resultTitle: "Bảng kết quả",
    resultStampEmpty: "Chưa có lượt rút",
    resultStamp: "Lượt #{{number}} · {{time}} · {{count}} kết quả",
    resultPlaceholder: "Chờ bốc",
    copyAction: "Sao chép",
    exportAction: "Tải CSV",
    focusEnterAction: "Trình chiếu",
    focusExitAction: "Thoát trình chiếu",
    focusDrawAction: "Bốc lượt tiếp",
    focusHelp: "Space để bốc tiếp · Esc để thoát",
    modeKeepNote: "Không lặp trong cùng một lượt. Mục đã trúng vẫn được giữ cho lượt sau.",
    modeRemoveNote: "Không lặp trong cùng một lượt. Mục đã trúng sẽ bị loại khỏi lượt sau.",
    sourceTitle: "Dữ liệu nguồn",
    editAction: "Chỉnh sửa",
    sourceUnit: "mục",
    sourceEmpty: "Chưa có dữ liệu.",
    sourceReady: "Đủ dữ liệu cho {{drawCount}} ô mỗi lượt.",
    sourceInsufficient: "Thiếu {{missing}} mục để rút đủ {{drawCount}} ô.",
    sourceLowPool: "Còn {{remaining}} / {{total}} mục khả dụng.",
    sourceRemaining: "Còn {{remaining}} / {{total}} mục cho các lượt sau.",
    poolStatus: "{{remaining}} / {{total}} mục khả dụng",
    restoreAllAction: "Khôi phục {{count}} mục",
    poolKeepHelp: "Mục đã trúng tiếp tục xuất hiện ở các lượt sau.",
    poolRemoveHelp: "Mục đã trúng không xuất hiện ở lượt sau cho đến khi được khôi phục.",
    sourceInstructions: "Mỗi dòng là một mục. Dán trực tiếp từ Excel cũng được hỗ trợ.",
    sourceOpenAction: "Dán danh sách",
    sourceEditAction: "Chỉnh sửa danh sách",
    sourcePreviewEmpty: "Chưa có gì để xem trước.",
    sourcePreviewExhausted: "Đã rút hết các mục khả dụng.",
    sourceMore: "+ {{count}} mục khác",
    localTitle: "Lưu cục bộ",
    localEmpty: "Chưa có dữ liệu",
    sourceSaved: "Lưu lúc {{time}}",
    clearListAction: "Xóa dữ liệu danh sách",
    listsTitle: "Danh sách",
    listsIntro: "Mỗi danh sách giữ riêng dữ liệu, pool và giao diện.",
    listsMetaOne: "1 danh sách trên trình duyệt này.",
    listsMetaMany: "{{count}} danh sách trên trình duyệt này.",
    listsCount: "{{count}} danh sách",
    listMeta: "{{count}} mục · {{theme}} · Cập nhật {{time}}",
    listActive: "Đang mở",
    openListAction: "Mở",
    renameAction: "Đổi tên",
    duplicateAction: "Nhân bản",
    deleteAction: "Xóa",
    createListAction: "Tạo danh sách",
    transferTitle: "Sao lưu trên máy",
    transferDescription:
      "Tải một tệp JSON chứa toàn bộ danh sách, pool, lịch sử và cấu hình để cất giữ hoặc chuyển sang trình duyệt khác.",
    exportBackupAction: "Tải bản sao lưu",
    importBackupAction: "Nhập bản sao lưu",
    listTableName: "Tên danh sách",
    listTableData: "Dữ liệu",
    listTableUpdated: "Cập nhật",
    listTableActions: "Thao tác",
    listGuideTitle: "Mỗi danh sách là một không gian riêng",
    listGuideDescription:
      "Đổi danh sách sẽ đổi cả dữ liệu nguồn, pool, lịch sử và giao diện. Bản sao lưu gộp toàn bộ các danh sách vào một tệp.",
    listGuideEntriesLabel: "Dữ liệu đang lưu",
    listGuideEntriesValue: "{{count}} mục",
    listGuideHistoryLabel: "Lịch sử đã giữ",
    listGuideHistoryValue: "{{count}} lượt",
    listGuideScopeLabel: "Phạm vi",
    listGuideScopeValue: "Trình duyệt này",
    activeListTitle: "Danh sách đang mở",
    activeListOpenAction: "Mở trang bốc số",
    activeListEntriesLabel: "Dữ liệu nguồn",
    activeListEntriesValue: "{{count}} mục",
    activeListAvailableLabel: "Đang khả dụng",
    activeListAvailableValue: "{{count}} mục",
    activeListDrawCountLabel: "Mỗi lượt",
    activeListDrawCountValue: "{{count}} ô",
    activeListHistoryLabel: "Lịch sử",
    activeListHistoryValue: "{{count}} lượt",
    historyTitle: "Lịch sử",
    historyMetaEmpty: "Chưa có lượt rút nào được lưu.",
    historyMeta: "{{count}} lượt gần nhất được giữ trên trình duyệt này.",
    historyIntro: "Các lượt rút của danh sách hiện tại được giữ trên trình duyệt này.",
    historyCount: "{{count}} lượt",
    historyContextTitle: "Trạng thái danh sách hiện tại",
    historyPoolLabel: "Mục khả dụng",
    historyPolicyLabel: "Chế độ sau khi rút",
    historyDrawCountLabel: "Số ô mỗi lượt",
    historyEmpty: "Chưa có lượt rút nào được lưu.",
    historyEmptyTitle: "Lượt rút đầu tiên đang chờ",
    historyEmptyGuideTitle: "Mỗi lượt đã lưu gồm",
    historyEmptyTimeLabel: "Thời điểm",
    historyEmptyTimeDescription: "Ngày, giờ và số thứ tự lượt.",
    historyEmptySourceLabel: "Dữ liệu nguồn",
    historyEmptySourceDescription: "Số mục tại thời điểm bốc.",
    historyEmptyResultsLabel: "Kết quả",
    historyEmptyResultsDescription: "Đủ các ô của lượt để sao chép lại.",
    historyOpenDraw: "Mở trang bốc số",
    historyRetentionTitle: "Dữ liệu được giữ thế nào",
    historyRetentionDescription:
      "Lịch sử chỉ đọc lại kết quả cũ. Việc xem hoặc sao chép không làm thay đổi pool hiện tại và không tạo thêm lượt mới.",
    historyRetentionLimitLabel: "Giới hạn trên máy",
    historyRetentionLimitValue: "50 lượt gần nhất",
    historyRetentionPoolLabel: "Pool hiện tại",
    historyRetentionPoolValue: "Độc lập với lịch sử",
    historyRetentionBackupLabel: "Sao lưu",
    historyRetentionBackupValue: "Kèm trong tệp JSON",
    clearHistoryAction: "Xóa lịch sử",
    appearanceTitle: "Giao diện & nội dung",
    appearanceMeta: "Cấu hình riêng cho “{{name}}”.",
    resetAppearanceAction: "Đặt lại giao diện",
    themeSectionTitle: "Bộ giao diện",
    themeSectionDescription:
      "Chọn không khí phù hợp; mọi thay đổi chỉ áp dụng cho danh sách hiện tại.",
    previewExampleOne: "Kết quả mẫu",
    previewExampleTwo: "Giữ đúng nhịp",
    colorSectionTitle: "Màu sắc",
    colorSectionDescription:
      "Dùng bảng màu của theme hoặc đặt màu riêng. Nền và chữ cần đạt tương phản 4,5:1.",
    customColorsLabel: "Màu tùy chỉnh",
    colorGroundLabel: "Nền trang",
    colorSurfaceLabel: "Bề mặt",
    colorTextLabel: "Chữ chính",
    colorAccentLabel: "Màu nhấn",
    layoutSectionTitle: "Bố cục",
    layoutSectionDescription:
      "Điều chỉnh cách bảng kết quả và các khối thông tin được trình bày.",
    resultColumnsLabel: "Số cột kết quả",
    columnsAutoOption: "Tự động",
    columns2Option: "2 cột",
    columns3Option: "3 cột",
    columns4Option: "4 cột",
    columns5Option: "5 cột",
    densityLabel: "Mật độ",
    densityComfortableOption: "Thoáng",
    densityCompactOption: "Gọn",
    radiusLabel: "Bo góc",
    radiusTightOption: "Vuông vức",
    radiusBalancedOption: "Cân bằng",
    radiusSoftOption: "Mềm",
    fontLabel: "Kiểu chữ",
    fontModernOption: "Hiện đại",
    fontEditorialOption: "Trang trọng",
    motionLabel: "Chuyển động",
    motionExpressiveOption: "Có hiệu ứng",
    motionStillOption: "Tĩnh",
    visibilitySectionTitle: "Thành phần hiển thị",
    visibilitySectionDescription:
      "Ẩn bớt phần phụ khi bạn chỉ cần một bảng kết quả gọn gàng.",
    visibilitySourceLabel: "Bảng dữ liệu nguồn",
    visibilitySourceDescription: "Hiện cột tóm tắt và xem trước dữ liệu.",
    visibilityPreviewLabel: "Danh sách xem trước",
    visibilityPreviewDescription: "Hiện 5 mục khả dụng đầu tiên.",
    visibilitySaveLabel: "Trạng thái lưu",
    visibilitySaveDescription: "Hiện thời điểm dữ liệu được lưu trên máy.",
    visibilityNoteLabel: "Ghi chú riêng tư",
    visibilityNoteDescription: "Hiện lời nhắc dữ liệu không rời trình duyệt.",
    visibilityHistoryLabel: "Mục lịch sử trên thanh bên",
    visibilityHistoryDescription: "Vẫn có thể mở lịch sử bằng liên kết trực tiếp.",
    textSectionTitle: "Nội dung giao diện",
    textSectionDescription:
      "Thay lời hiển thị cho từng danh sách. Dùng {{count}}, {{drawCount}}, {{remaining}}, {{time}} trong câu động.",
    resetTextAction: "Đặt lại nội dung",
    dataTitle: "Dữ liệu nguồn",
    dataDescription: "Dán danh sách, chọn cách tách và kiểm tra số mục trước khi áp dụng.",
    dataInputLabel: "Danh sách",
    dataInputHelp: "Dòng trống được bỏ qua. Mỗi dòng được tính là một mục, kể cả khi nội dung trùng nhau.",
    pasteAction: "Dán từ bộ nhớ tạm",
    loadSampleAction: "Dùng 200 món mẫu",
    delimiterLabel: "Cách tách",
    delimiterAutoOption: "Tự động",
    delimiterNewlineOption: "Mỗi dòng",
    delimiterCommaOption: "Dấu phẩy",
    delimiterTabOption: "Dấu tab",
    dedupeLabel: "Bỏ nội dung trùng",
    dedupeDescription: "Giữ lại mục xuất hiện đầu tiên.",
    parseLabel: "Nhận diện",
    parseEmpty: "Chưa có nội dung để nhận diện.",
    previewLabel: "Xem trước",
    previewFirst: "{{count}} mục đầu",
    dataLocalNote: "Nội dung chỉ được lưu trong trình duyệt này.",
    applyDataAction: "Áp dụng {{count}} mục",
    applyDataShortAction: "Áp dụng",
    listDialogDescription: "Tên này chỉ hiển thị trên trình duyệt của bạn.",
    listNameLabel: "Tên danh sách",
    listDialogNote: "Dữ liệu, pool và cấu hình được giữ riêng theo từng danh sách.",
    createListTitle: "Tạo danh sách",
    renameListTitle: "Đổi tên danh sách",
    saveListAction: "Lưu",
    saveNameAction: "Lưu tên",
    cancelAction: "Hủy",
    confirmKeepAction: "Giữ lại",
    confirmDeleteAction: "Xóa",
    noscriptMessage:
      "Ứng dụng cần JavaScript để bốc ngẫu nhiên và lưu dữ liệu cục bộ.",
  });

  const LONG_TEXT_KEYS = new Set([
    "localNote",
    "drawMetaEmpty",
    "drawMetaReady",
    "drawMetaInsufficient",
    "drawMetaLowPool",
    "drawMetaRemoved",
    "modeKeepNote",
    "modeRemoveNote",
    "runModeInstantHelp",
    "runModeTogetherHelp",
    "runModeCascadeHelp",
    "focusHelp",
    "sourceInstructions",
    "listsIntro",
    "listGuideDescription",
    "historyIntro",
    "historyRetentionDescription",
    "dataDescription",
    "dataInputHelp",
    "dataLocalNote",
    "themeSectionDescription",
    "colorSectionDescription",
    "layoutSectionDescription",
    "visibilitySectionDescription",
    "textSectionDescription",
  ]);

  const UI_TEXT_GROUPS = Object.freeze([
    {
      title: "Thương hiệu & điều hướng",
      open: true,
      keys: [
        ["appName", "Tên ứng dụng"],
        ["navDraw", "Mục bốc số"],
        ["navLists", "Mục danh sách"],
        ["navAppearance", "Mục giao diện"],
        ["navHistory", "Mục lịch sử"],
        ["currentListLabel", "Nhãn chọn danh sách"],
        ["localNote", "Ghi chú dữ liệu cục bộ"],
      ],
    },
    {
      title: "Trang bốc số",
      open: true,
      keys: [
        ["drawTitle", "Tiêu đề trang"],
        ["drawMetaEmpty", "Mô tả khi chưa có dữ liệu"],
        ["drawMetaReady", "Mô tả khi sẵn sàng"],
        ["drawMetaInsufficient", "Mô tả khi thiếu dữ liệu"],
        ["drawMetaLowPool", "Mô tả khi pool không đủ"],
        ["drawMetaRemoved", "Mô tả khi đã bỏ mục"],
        ["countLabel", "Nhãn số ô"],
        ["policyLabel", "Nhãn chế độ sau khi rút"],
        ["policyKeep", "Lựa chọn vẫn giữ"],
        ["policyRemove", "Lựa chọn rút xong bỏ"],
        ["runModeLabel", "Nhãn kiểu chạy random"],
        ["runDurationLabel", "Nhãn thời gian chạy"],
        ["runDurationUnit", "Đơn vị thời gian"],
        ["runModeInstantOption", "Lựa chọn tức thì"],
        ["runModeTogetherOption", "Lựa chọn đồng loạt"],
        ["runModeCascadeOption", "Lựa chọn cuốn chiếu"],
        ["runModeInstantHelp", "Mô tả kiểu tức thì"],
        ["runModeTogetherHelp", "Mô tả kiểu đồng loạt"],
        ["runModeCascadeHelp", "Mô tả kiểu cuốn chiếu"],
        ["openDataAction", "Nút mở dữ liệu"],
        ["addDataAction", "Nút thêm dữ liệu"],
        ["addMoreAction", "Nút bổ sung dữ liệu"],
        ["drawAction", "Nút bốc kết quả"],
        ["drawingAction", "Trạng thái đang bốc"],
        ["restorePoolAction", "Nút khôi phục trên đầu trang"],
      ],
    },
    {
      title: "Bảng kết quả",
      keys: [
        ["resultTitle", "Tiêu đề bảng"],
        ["resultStampEmpty", "Trạng thái chưa rút"],
        ["resultStamp", "Thông tin lượt đã rút"],
        ["resultPlaceholder", "Chữ trong ô chờ"],
        ["copyAction", "Nút sao chép"],
        ["exportAction", "Nút tải CSV"],
        ["focusEnterAction", "Nút vào chế độ trình chiếu"],
        ["focusExitAction", "Nút thoát chế độ trình chiếu"],
        ["focusDrawAction", "Nút bốc tiếp khi trình chiếu"],
        ["focusHelp", "Hướng dẫn phím trong trình chiếu"],
        ["modeKeepNote", "Ghi chú chế độ giữ"],
        ["modeRemoveNote", "Ghi chú chế độ bỏ"],
      ],
    },
    {
      title: "Dữ liệu nguồn",
      keys: [
        ["sourceTitle", "Tiêu đề khối nguồn"],
        ["editAction", "Nút chỉnh sửa"],
        ["sourceUnit", "Đơn vị đếm"],
        ["sourceEmpty", "Trạng thái chưa có dữ liệu"],
        ["sourceReady", "Trạng thái đủ dữ liệu"],
        ["sourceInsufficient", "Trạng thái thiếu dữ liệu"],
        ["sourceLowPool", "Trạng thái pool thấp"],
        ["sourceRemaining", "Trạng thái còn mục"],
        ["poolStatus", "Dòng trạng thái pool"],
        ["restoreAllAction", "Nút khôi phục pool"],
        ["poolKeepHelp", "Giải thích chế độ giữ"],
        ["poolRemoveHelp", "Giải thích chế độ bỏ"],
        ["sourceInstructions", "Hướng dẫn nhập"],
        ["sourceOpenAction", "Nút dán danh sách"],
        ["sourceEditAction", "Nút sửa danh sách"],
        ["sourcePreviewEmpty", "Xem trước đang trống"],
        ["sourcePreviewExhausted", "Xem trước đã hết"],
        ["sourceMore", "Dòng còn lại"],
        ["localTitle", "Tiêu đề lưu cục bộ"],
        ["localEmpty", "Chưa lưu lần nào"],
        ["sourceSaved", "Thời điểm lưu"],
        ["clearListAction", "Nút xóa dữ liệu danh sách"],
      ],
    },
    {
      title: "Danh sách & lịch sử",
      keys: [
        ["listsTitle", "Tiêu đề trang danh sách"],
        ["listsIntro", "Giới thiệu danh sách"],
        ["listsMetaOne", "Mô tả khi có một danh sách"],
        ["listsMetaMany", "Mô tả khi có nhiều danh sách"],
        ["listsCount", "Bộ đếm danh sách"],
        ["listMeta", "Thông tin từng danh sách"],
        ["listActive", "Nhãn danh sách đang mở"],
        ["openListAction", "Nút mở danh sách"],
        ["renameAction", "Nút đổi tên"],
        ["duplicateAction", "Nút nhân bản"],
        ["deleteAction", "Nút xóa danh sách"],
        ["createListAction", "Nút tạo danh sách"],
        ["transferTitle", "Tiêu đề sao lưu"],
        ["transferDescription", "Mô tả sao lưu"],
        ["exportBackupAction", "Nút tải bản sao lưu"],
        ["importBackupAction", "Nút nhập bản sao lưu"],
        ["listTableName", "Cột tên danh sách"],
        ["listTableData", "Cột số dữ liệu"],
        ["listTableUpdated", "Cột cập nhật"],
        ["listTableActions", "Cột thao tác"],
        ["listGuideTitle", "Tiêu đề tổng quan danh sách"],
        ["listGuideDescription", "Mô tả tổng quan danh sách"],
        ["listGuideEntriesLabel", "Nhãn tổng số mục"],
        ["listGuideEntriesValue", "Giá trị tổng số mục"],
        ["listGuideHistoryLabel", "Nhãn tổng lịch sử"],
        ["listGuideHistoryValue", "Giá trị tổng lịch sử"],
        ["listGuideScopeLabel", "Nhãn phạm vi lưu"],
        ["listGuideScopeValue", "Giá trị phạm vi lưu"],
        ["activeListTitle", "Tiêu đề danh sách đang mở"],
        ["activeListOpenAction", "Nút mở trang bốc từ danh sách"],
        ["activeListEntriesLabel", "Nhãn số mục nguồn"],
        ["activeListEntriesValue", "Giá trị số mục nguồn"],
        ["activeListAvailableLabel", "Nhãn số mục khả dụng"],
        ["activeListAvailableValue", "Giá trị số mục khả dụng"],
        ["activeListDrawCountLabel", "Nhãn số ô mỗi lượt"],
        ["activeListDrawCountValue", "Giá trị số ô mỗi lượt"],
        ["activeListHistoryLabel", "Nhãn lịch sử danh sách"],
        ["activeListHistoryValue", "Giá trị lịch sử danh sách"],
        ["historyTitle", "Tiêu đề lịch sử"],
        ["historyMetaEmpty", "Mô tả lịch sử trống"],
        ["historyMeta", "Mô tả số lượt"],
        ["historyIntro", "Giới thiệu lịch sử"],
        ["historyCount", "Bộ đếm lượt"],
        ["historyContextTitle", "Tiêu đề tóm tắt lịch sử"],
        ["historyPoolLabel", "Nhãn mục khả dụng"],
        ["historyPolicyLabel", "Nhãn chế độ sau khi rút"],
        ["historyDrawCountLabel", "Nhãn số ô mỗi lượt"],
        ["historyEmpty", "Trạng thái lịch sử trống"],
        ["historyEmptyTitle", "Tiêu đề lịch sử trống"],
        ["historyEmptyGuideTitle", "Tiêu đề giải thích một lượt lưu"],
        ["historyEmptyTimeLabel", "Nhãn thời điểm"],
        ["historyEmptyTimeDescription", "Mô tả thời điểm"],
        ["historyEmptySourceLabel", "Nhãn dữ liệu nguồn"],
        ["historyEmptySourceDescription", "Mô tả dữ liệu nguồn"],
        ["historyEmptyResultsLabel", "Nhãn kết quả"],
        ["historyEmptyResultsDescription", "Mô tả kết quả"],
        ["historyOpenDraw", "Nút mở trang bốc"],
        ["historyRetentionTitle", "Tiêu đề chính sách lưu lịch sử"],
        ["historyRetentionDescription", "Mô tả chính sách lưu lịch sử"],
        ["historyRetentionLimitLabel", "Nhãn giới hạn lịch sử"],
        ["historyRetentionLimitValue", "Giá trị giới hạn lịch sử"],
        ["historyRetentionPoolLabel", "Nhãn quan hệ pool và lịch sử"],
        ["historyRetentionPoolValue", "Giá trị quan hệ pool và lịch sử"],
        ["historyRetentionBackupLabel", "Nhãn lịch sử trong sao lưu"],
        ["historyRetentionBackupValue", "Giá trị lịch sử trong sao lưu"],
        ["clearHistoryAction", "Nút xóa lịch sử"],
      ],
    },
    {
      title: "Cài đặt giao diện",
      keys: [
        ["appearanceTitle", "Tiêu đề trang giao diện"],
        ["appearanceMeta", "Mô tả cấu hình hiện tại"],
        ["resetAppearanceAction", "Nút đặt lại giao diện"],
        ["themeSectionTitle", "Tiêu đề bộ giao diện"],
        ["themeSectionDescription", "Mô tả bộ giao diện"],
        ["previewExampleOne", "Chữ kết quả mẫu"],
        ["previewExampleTwo", "Chữ nhịp mẫu"],
        ["colorSectionTitle", "Tiêu đề màu sắc"],
        ["colorSectionDescription", "Mô tả màu sắc"],
        ["customColorsLabel", "Nhãn màu tùy chỉnh"],
        ["colorGroundLabel", "Nhãn màu nền"],
        ["colorSurfaceLabel", "Nhãn màu bề mặt"],
        ["colorTextLabel", "Nhãn màu chữ"],
        ["colorAccentLabel", "Nhãn màu nhấn"],
        ["layoutSectionTitle", "Tiêu đề bố cục"],
        ["layoutSectionDescription", "Mô tả bố cục"],
        ["resultColumnsLabel", "Nhãn số cột"],
        ["columnsAutoOption", "Lựa chọn cột tự động"],
        ["columns2Option", "Lựa chọn 2 cột"],
        ["columns3Option", "Lựa chọn 3 cột"],
        ["columns4Option", "Lựa chọn 4 cột"],
        ["columns5Option", "Lựa chọn 5 cột"],
        ["densityLabel", "Nhãn mật độ"],
        ["densityComfortableOption", "Lựa chọn thoáng"],
        ["densityCompactOption", "Lựa chọn gọn"],
        ["radiusLabel", "Nhãn bo góc"],
        ["radiusTightOption", "Lựa chọn vuông vức"],
        ["radiusBalancedOption", "Lựa chọn cân bằng"],
        ["radiusSoftOption", "Lựa chọn mềm"],
        ["fontLabel", "Nhãn kiểu chữ"],
        ["fontModernOption", "Lựa chọn chữ hiện đại"],
        ["fontEditorialOption", "Lựa chọn chữ trang trọng"],
        ["motionLabel", "Nhãn chuyển động"],
        ["motionExpressiveOption", "Lựa chọn có hiệu ứng"],
        ["motionStillOption", "Lựa chọn tĩnh"],
        ["visibilitySectionTitle", "Tiêu đề thành phần hiển thị"],
        ["visibilitySectionDescription", "Mô tả thành phần hiển thị"],
        ["visibilitySourceLabel", "Nhãn bảng dữ liệu nguồn"],
        ["visibilitySourceDescription", "Mô tả bảng dữ liệu nguồn"],
        ["visibilityPreviewLabel", "Nhãn danh sách xem trước"],
        ["visibilityPreviewDescription", "Mô tả danh sách xem trước"],
        ["visibilitySaveLabel", "Nhãn trạng thái lưu"],
        ["visibilitySaveDescription", "Mô tả trạng thái lưu"],
        ["visibilityNoteLabel", "Nhãn ghi chú riêng tư"],
        ["visibilityNoteDescription", "Mô tả ghi chú riêng tư"],
        ["visibilityHistoryLabel", "Nhãn mục lịch sử"],
        ["visibilityHistoryDescription", "Mô tả mục lịch sử"],
        ["textSectionTitle", "Tiêu đề nội dung giao diện"],
        ["textSectionDescription", "Hướng dẫn dùng câu động"],
        ["resetTextAction", "Nút đặt lại nội dung"],
      ],
    },
    {
      title: "Hộp nhập dữ liệu",
      keys: [
        ["dataTitle", "Tiêu đề hộp dữ liệu"],
        ["dataDescription", "Mô tả hộp dữ liệu"],
        ["dataInputLabel", "Nhãn ô dữ liệu"],
        ["dataInputHelp", "Hướng dẫn dưới ô dữ liệu"],
        ["pasteAction", "Nút dán dữ liệu"],
        ["loadSampleAction", "Nút nạp dữ liệu mẫu"],
        ["delimiterLabel", "Nhãn cách tách"],
        ["delimiterAutoOption", "Lựa chọn tách tự động"],
        ["delimiterNewlineOption", "Lựa chọn tách theo dòng"],
        ["delimiterCommaOption", "Lựa chọn tách theo dấu phẩy"],
        ["delimiterTabOption", "Lựa chọn tách theo dấu tab"],
        ["dedupeLabel", "Nhãn bỏ nội dung trùng"],
        ["dedupeDescription", "Mô tả bỏ nội dung trùng"],
        ["parseLabel", "Nhãn nhận diện dữ liệu"],
        ["parseEmpty", "Trạng thái chưa nhận diện"],
        ["previewLabel", "Nhãn xem trước"],
        ["previewFirst", "Mô tả số mục xem trước"],
        ["dataLocalNote", "Ghi chú cuối hộp dữ liệu"],
        ["applyDataAction", "Nút áp dụng dữ liệu"],
        ["applyDataShortAction", "Nút áp dụng khi chưa hợp lệ"],
        ["cancelAction", "Nút hủy"],
      ],
    },
    {
      title: "Hộp thoại & thao tác",
      keys: [
        ["createListTitle", "Tiêu đề tạo danh sách"],
        ["renameListTitle", "Tiêu đề đổi tên danh sách"],
        ["listDialogDescription", "Mô tả hộp tên danh sách"],
        ["listNameLabel", "Nhãn tên danh sách"],
        ["listDialogNote", "Ghi chú hộp tên danh sách"],
        ["saveListAction", "Nút lưu danh sách"],
        ["saveNameAction", "Nút lưu tên"],
        ["confirmKeepAction", "Nút giữ lại khi xác nhận"],
        ["confirmDeleteAction", "Nút xóa khi xác nhận"],
        ["noscriptMessage", "Thông báo khi tắt JavaScript"],
      ],
    },
  ]);

  const els = {
    pageTitle: document.querySelector("#pageTitle"),
    pageMeta: document.querySelector("#pageMeta"),
    listSwitcher: document.querySelector("#listSwitcher"),
    saveState: document.querySelector("#saveState"),
    saveStatus: document.querySelector("#saveStatus"),
    sidebarNote: document.querySelector("#sidebarNote"),
    drawActions: document.querySelector("#drawActions"),
    listsActions: document.querySelector("#listsActions"),
    appearanceActions: document.querySelector("#appearanceActions"),
    historyActions: document.querySelector("#historyActions"),
    drawView: document.querySelector("#drawView"),
    listsView: document.querySelector("#listsView"),
    appearanceView: document.querySelector("#appearanceView"),
    historyView: document.querySelector("#historyView"),
    navButtons: [...document.querySelectorAll("[data-go-view]")],
    historyNavButton: document.querySelector("#historyNavButton"),
    listsNavCount: document.querySelector("#listsNavCount"),
    historyNavCount: document.querySelector("#historyNavCount"),
    drawCount: document.querySelector("#drawCount"),
    decreaseCount: document.querySelector("#decreaseCount"),
    increaseCount: document.querySelector("#increaseCount"),
    countLabel: document.querySelector("#countLabel"),
    policyLabel: document.querySelector("#policyLabel"),
    drawPolicy: document.querySelector("#drawPolicy"),
    drawPolicyHelp: document.querySelector("#drawPolicyHelp"),
    runMode: document.querySelector("#runMode"),
    runDuration: document.querySelector("#runDuration"),
    runModeHelp: document.querySelector("#runModeHelp"),
    drawButton: document.querySelector("#drawButton"),
    openDataButton: document.querySelector("#openDataButton"),
    editDataButton: document.querySelector("#editDataButton"),
    sourceOpenButton: document.querySelector("#sourceOpenButton"),
    resultGrid: document.querySelector("#resultGrid"),
    resultsHeading: document.querySelector("#resultsHeading"),
    drawStamp: document.querySelector("#drawStamp"),
    drawModeNote: document.querySelector("#drawModeNote"),
    focusModeButton: document.querySelector("#focusModeButton"),
    focusDrawButton: document.querySelector("#focusDrawButton"),
    focusHelp: document.querySelector("#focusHelp"),
    copyButton: document.querySelector("#copyButton"),
    exportButton: document.querySelector("#exportButton"),
    sourcePanel: document.querySelector("#sourcePanel"),
    sourceHeading: document.querySelector("#sourceHeading"),
    sourceCount: document.querySelector("#sourceCount"),
    sourceState: document.querySelector("#sourceState"),
    poolStatus: document.querySelector("#poolStatus"),
    restorePoolButton: document.querySelector("#restorePoolButton"),
    sourcePreview: document.querySelector("#sourcePreview"),
    sourceSavedAt: document.querySelector("#sourceSavedAt"),
    clearListButton: document.querySelector("#clearListButton"),
    screenAnnouncer: document.querySelector("#screenAnnouncer"),
    historyIntro: document.querySelector("#historyIntro"),
    historyCountLabel: document.querySelector("#historyCountLabel"),
    historyPoolFact: document.querySelector("#historyPoolFact"),
    historyPolicyFact: document.querySelector("#historyPolicyFact"),
    historyDrawCountFact: document.querySelector("#historyDrawCountFact"),
    historyList: document.querySelector("#historyList"),
    historyEmpty: document.querySelector("#historyEmpty"),
    historyDrawButton: document.querySelector("#historyDrawButton"),
    clearHistoryButton: document.querySelector("#clearHistoryButton"),
    listsIntro: document.querySelector("#listsIntro"),
    listsCountLabel: document.querySelector("#listsCountLabel"),
    listTable: document.querySelector("#listTable"),
    listsTotalEntries: document.querySelector("#listsTotalEntries"),
    listsTotalHistory: document.querySelector("#listsTotalHistory"),
    listsActiveName: document.querySelector("#listsActiveName"),
    listsActiveEntries: document.querySelector("#listsActiveEntries"),
    listsActiveAvailable: document.querySelector("#listsActiveAvailable"),
    listsActiveDrawCount: document.querySelector("#listsActiveDrawCount"),
    listsActiveHistory: document.querySelector("#listsActiveHistory"),
    listsOpenDrawButton: document.querySelector("#listsOpenDrawButton"),
    createListButton: document.querySelector("#createListButton"),
    exportBackupButton: document.querySelector("#exportBackupButton"),
    importBackupButton: document.querySelector("#importBackupButton"),
    importBackupInput: document.querySelector("#importBackupInput"),
    themeGrid: document.querySelector("#themeGrid"),
    customColorsToggle: document.querySelector("#customColorsToggle"),
    customColorGrid: document.querySelector("#customColorGrid"),
    contrastStatus: document.querySelector("#contrastStatus"),
    resetAppearanceButton: document.querySelector("#resetAppearanceButton"),
    resetTextButton: document.querySelector("#resetTextButton"),
    textSettings: document.querySelector("#textSettings"),
    configSelects: [...document.querySelectorAll("[data-config-select]")],
    configToggles: [...document.querySelectorAll("[data-config-toggle]")],
    colorInputs: [...document.querySelectorAll("[data-color-key]")],
    colorOutputs: [...document.querySelectorAll("[data-color-output]")],
    dataDialog: document.querySelector("#dataDialog"),
    dataForm: document.querySelector("#dataForm"),
    closeDataButton: document.querySelector("#closeDataButton"),
    cancelDataButton: document.querySelector("#cancelDataButton"),
    dataInput: document.querySelector("#dataInput"),
    delimiterMode: document.querySelector("#delimiterMode"),
    dedupeInput: document.querySelector("#dedupeInput"),
    pasteButton: document.querySelector("#pasteButton"),
    loadSampleButton: document.querySelector("#loadSampleButton"),
    parsedCount: document.querySelector("#parsedCount"),
    parseDetail: document.querySelector("#parseDetail"),
    parseCard: document.querySelector(".parse-card"),
    previewLimit: document.querySelector("#previewLimit"),
    dataPreview: document.querySelector("#dataPreview"),
    dataResetNote: document.querySelector("#dataResetNote"),
    applyDataButton: document.querySelector("#applyDataButton"),
    listDialog: document.querySelector("#listDialog"),
    listForm: document.querySelector("#listForm"),
    listDialogTitle: document.querySelector("#listDialogTitle"),
    listNameInput: document.querySelector("#listNameInput"),
    closeListDialogButton: document.querySelector("#closeListDialogButton"),
    cancelListDialogButton: document.querySelector("#cancelListDialogButton"),
    saveListButton: document.querySelector("#saveListButton"),
    confirmDialog: document.querySelector("#confirmDialog"),
    confirmTitle: document.querySelector("#confirmTitle"),
    confirmText: document.querySelector("#confirmText"),
    confirmCancelButton: document.querySelector("#confirmCancelButton"),
    confirmActionButton: document.querySelector("#confirmActionButton"),
    toast: document.querySelector("#toast"),
  };

  let storageAvailable = true;
  let migratedFromV1 = false;
  let state = loadState();
  let activeView = getViewFromLocation();
  let currentParsed = emptyParse();
  let parseTimer = 0;
  let toastTimer = 0;
  let colorSaveTimer = 0;
  let isDrawing = false;
  let focusMode = false;
  let confirmAction = null;
  let listDialogMode = "create";
  let listDialogTargetId = "";
  let textSettingsBuilt = false;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safeString(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
  }

  function safeInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeRunDuration(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_RUN_DURATION;
    }
    return Math.round(clamp(parsed, MIN_RUN_DURATION, MAX_RUN_DURATION) * 2) / 2;
  }

  function isValidDate(value) {
    return typeof value === "string" && Number.isFinite(Date.parse(value));
  }

  function createId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function createDefaultConfig() {
    const minimal = THEME_MAP.get("minimal").palette;
    return {
      theme: "minimal",
      customColors: {
        enabled: false,
        ...minimal,
      },
      resultColumns: "auto",
      density: "comfortable",
      radius: "balanced",
      fontPreset: "modern",
      motion: "expressive",
      visibility: {
        showSource: true,
        showSourcePreview: true,
        showSaveStatus: true,
        showSidebarNote: true,
        showHistoryNav: true,
      },
      uiText: { ...DEFAULT_UI_TEXT },
    };
  }

  function createList(name, overrides = {}) {
    const now = new Date().toISOString();
    return {
      id: overrides.id || createId("list"),
      name: safeString(name, "Danh sách của tôi").trim().slice(0, 80) || "Danh sách của tôi",
      rawData: "",
      delimiter: "auto",
      dedupe: false,
      entries: [],
      drawCount: 20,
      drawPolicy: "keep",
      runMode: "together",
      runDuration: DEFAULT_RUN_DURATION,
      excludedIndexes: [],
      currentDraw: null,
      history: [],
      nextDrawNumber: 1,
      config: overrides.config ? normalizeConfig(overrides.config) : createDefaultConfig(),
      createdAt: isValidDate(overrides.createdAt) ? overrides.createdAt : now,
      updatedAt: isValidDate(overrides.updatedAt) ? overrides.updatedAt : now,
    };
  }

  function createDefaultState() {
    const list = createList("Danh sách của tôi");
    return {
      schemaVersion: 3,
      activeListId: list.id,
      lists: [list],
      savedAt: null,
    };
  }

  function emptyParse() {
    return {
      entries: [],
      sourceCount: 0,
      blankCount: 0,
      duplicateCount: 0,
      error: "",
      limitExceeded: false,
    };
  }

  function isHexColor(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  }

  function normalizeUiText(candidate) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const result = {};
    for (const [key, fallback] of Object.entries(DEFAULT_UI_TEXT)) {
      result[key] = safeString(source[key], fallback).slice(0, 600);
    }
    return result;
  }

  function normalizeConfig(candidate) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const base = createDefaultConfig();
    const theme = THEME_MAP.has(source.theme) ? source.theme : base.theme;
    const palette = THEME_MAP.get(theme).palette;
    const candidateColors =
      source.customColors && typeof source.customColors === "object"
        ? source.customColors
        : {};
    const visibility =
      source.visibility && typeof source.visibility === "object"
        ? source.visibility
        : {};
    const allowedColumns = new Set(["auto", "2", "3", "4", "5"]);
    const allowedDensity = new Set(["comfortable", "compact"]);
    const allowedRadius = new Set(["tight", "balanced", "soft"]);
    const allowedFont = new Set(["modern", "editorial"]);
    const allowedMotion = new Set(["expressive", "still"]);

    return {
      theme,
      customColors: {
        enabled: Boolean(candidateColors.enabled),
        ground: isHexColor(candidateColors.ground) ? candidateColors.ground.toLowerCase() : palette.ground,
        surface: isHexColor(candidateColors.surface) ? candidateColors.surface.toLowerCase() : palette.surface,
        text: isHexColor(candidateColors.text) ? candidateColors.text.toLowerCase() : palette.text,
        accent: isHexColor(candidateColors.accent) ? candidateColors.accent.toLowerCase() : palette.accent,
      },
      resultColumns: allowedColumns.has(String(source.resultColumns))
        ? String(source.resultColumns)
        : base.resultColumns,
      density: allowedDensity.has(source.density) ? source.density : base.density,
      radius: allowedRadius.has(source.radius) ? source.radius : base.radius,
      fontPreset: allowedFont.has(source.fontPreset) ? source.fontPreset : base.fontPreset,
      motion: allowedMotion.has(source.motion) ? source.motion : base.motion,
      visibility: {
        showSource:
          typeof visibility.showSource === "boolean" ? visibility.showSource : base.visibility.showSource,
        showSourcePreview:
          typeof visibility.showSourcePreview === "boolean"
            ? visibility.showSourcePreview
            : base.visibility.showSourcePreview,
        showSaveStatus:
          typeof visibility.showSaveStatus === "boolean"
            ? visibility.showSaveStatus
            : base.visibility.showSaveStatus,
        showSidebarNote:
          typeof visibility.showSidebarNote === "boolean"
            ? visibility.showSidebarNote
            : base.visibility.showSidebarNote,
        showHistoryNav:
          typeof visibility.showHistoryNav === "boolean"
            ? visibility.showHistoryNav
            : base.visibility.showHistoryNav,
      },
      uiText: normalizeUiText(source.uiText),
    };
  }

  function normalizeIndexes(value, entryCount, maxCount = MAX_ENTRIES) {
    if (!Array.isArray(value)) {
      return [];
    }

    return [...new Set(
      value.filter(
        (index) =>
          Number.isInteger(index) &&
          index >= 0 &&
          index < entryCount,
      ),
    )]
      .sort((left, right) => left - right)
      .slice(0, maxCount);
  }

  function normalizeRecord(candidate) {
    if (!candidate || typeof candidate !== "object") {
      return null;
    }

    const results = Array.isArray(candidate.results)
      ? candidate.results.filter((item) => typeof item === "string").slice(0, MAX_DRAW_COUNT)
      : [];

    if (!results.length) {
      return null;
    }

    return {
      id: safeString(candidate.id, `draw-${Date.now()}`),
      number: Math.max(1, safeInteger(candidate.number, 1)),
      createdAt: isValidDate(candidate.createdAt) ? candidate.createdAt : new Date().toISOString(),
      sourceCount: Math.max(0, safeInteger(candidate.sourceCount, results.length)),
      results,
    };
  }

  function normalizeList(candidate, index = 0) {
    if (!candidate || typeof candidate !== "object") {
      return null;
    }

    const rawData = safeString(candidate.rawData).slice(0, MAX_RAW_LENGTH);
    const delimiter = DELIMITER_VALUES.has(candidate.delimiter) ? candidate.delimiter : "auto";
    const dedupe = Boolean(candidate.dedupe);
    const parseResult = parseEntries(rawData, delimiter, dedupe);
    const drawCount = clamp(safeInteger(candidate.drawCount, 20), 1, MAX_DRAW_COUNT);
    const drawPolicy = DRAW_POLICIES.has(candidate.drawPolicy) ? candidate.drawPolicy : "keep";
    const runMode = RUN_MODES.has(candidate.runMode) ? candidate.runMode : "together";
    const runDuration = normalizeRunDuration(candidate.runDuration);
    const excludedIndexes =
      drawPolicy === "remove"
        ? normalizeIndexes(candidate.excludedIndexes, parseResult.entries.length)
        : [];
    const history = Array.isArray(candidate.history)
      ? candidate.history
          .map(normalizeRecord)
          .filter(Boolean)
          .slice(0, MAX_HISTORY)
      : [];
    const latestHistoryNumber = history.reduce(
      (highest, record) => Math.max(highest, record.number),
      0,
    );
    const currentDrawCandidate = normalizeRecord(candidate.currentDraw);
    const currentDraw =
      currentDrawCandidate && currentDrawCandidate.results.length === drawCount
        ? currentDrawCandidate
        : null;
    const now = new Date().toISOString();

    return {
      id: safeString(candidate.id, "") || createId("list"),
      name:
        safeString(candidate.name, `Danh sách ${index + 1}`).trim().slice(0, 80) ||
        `Danh sách ${index + 1}`,
      rawData,
      delimiter,
      dedupe,
      entries: parseResult.entries.slice(0, MAX_ENTRIES),
      drawCount,
      drawPolicy,
      runMode,
      runDuration,
      excludedIndexes,
      currentDraw,
      history,
      nextDrawNumber: Math.max(
        safeInteger(candidate.nextDrawNumber, 1),
        latestHistoryNumber + 1,
        currentDraw ? currentDraw.number + 1 : 1,
      ),
      config: normalizeConfig(candidate.config),
      createdAt: isValidDate(candidate.createdAt) ? candidate.createdAt : now,
      updatedAt: isValidDate(candidate.updatedAt) ? candidate.updatedAt : now,
    };
  }

  function normalizeState(candidate) {
    const rawLists = Array.isArray(candidate.lists) ? candidate.lists : [];
    const lists = rawLists
      .slice(0, MAX_LISTS)
      .map(normalizeList)
      .filter(Boolean);

    if (!lists.length) {
      return createDefaultState();
    }

    const requestedActiveId = safeString(candidate.activeListId);
    const activeListId = lists.some((list) => list.id === requestedActiveId)
      ? requestedActiveId
      : lists[0].id;

    return {
      schemaVersion: 3,
      activeListId,
      lists,
      savedAt: isValidDate(candidate.savedAt) ? candidate.savedAt : null,
    };
  }

  function migrateLegacyState(candidate) {
    const list = normalizeList(
      {
        ...candidate,
        id: createId("list"),
        name: "Danh sách của tôi",
        createdAt: candidate.savedAt,
        updatedAt: candidate.savedAt,
      },
      0,
    );

    if (!list) {
      return createDefaultState();
    }

    migratedFromV1 = true;
    return {
      schemaVersion: 3,
      activeListId: list.id,
      lists: [list],
      savedAt: isValidDate(candidate.savedAt) ? candidate.savedAt : null,
    };
  }

  function loadState() {
    const fallback = createDefaultState();

    try {
      const storedV2 = window.localStorage.getItem(STORAGE_KEY);
      if (storedV2) {
        try {
          const parsedV2 = JSON.parse(storedV2);
          if (parsedV2 && typeof parsedV2 === "object") {
            return normalizeState(parsedV2);
          }
        } catch (error) {
          // Fall through to v1 so a malformed v2 entry does not discard usable data.
        }
      }

      const storedV1 = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (storedV1) {
        const parsedV1 = JSON.parse(storedV1);
        if (parsedV1 && typeof parsedV1 === "object") {
          return migrateLegacyState(parsedV1);
        }
      }
    } catch (error) {
      storageAvailable = false;
    }

    return fallback;
  }

  function serializeState() {
    return {
      schemaVersion: 3,
      activeListId: state.activeListId,
      lists: state.lists.map((list) => ({
        id: list.id,
        name: list.name,
        rawData: list.rawData,
        delimiter: list.delimiter,
        dedupe: list.dedupe,
        drawCount: list.drawCount,
        drawPolicy: list.drawPolicy,
        runMode: list.runMode,
        runDuration: list.runDuration,
        excludedIndexes: list.excludedIndexes,
        currentDraw: list.currentDraw,
        history: list.history,
        nextDrawNumber: list.nextDrawNumber,
        config: list.config,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      })),
      savedAt: state.savedAt,
    };
  }

  function persistState(quiet = false, options = {}) {
    const { touch = true } = options;
    const now = new Date().toISOString();
    state.savedAt = now;
    const active = getActiveList();
    if (touch && active) {
      active.updatedAt = now;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
      storageAvailable = true;
    } catch (error) {
      storageAvailable = false;
      if (!quiet) {
        showToast("Trình duyệt không thể lưu dữ liệu. Phiên này vẫn dùng được.", "error");
      }
    }

    renderStorageState();
  }

  function getActiveList() {
    return state.lists.find((list) => list.id === state.activeListId) || state.lists[0] || null;
  }

  function getViewFromLocation() {
    const hashView = window.location.hash.replace(/^#\/?/, "");
    return VIEW_VALUES.has(hashView) ? hashView : "draw";
  }

  function parseEntries(raw, mode, dedupe) {
    if (!raw.trim()) {
      return emptyParse();
    }

    if (raw.length > MAX_RAW_LENGTH) {
      return {
        ...emptyParse(),
        error: `Nội dung vượt quá ${formatNumber(MAX_RAW_LENGTH)} ký tự.`,
      };
    }

    let tokens;
    if (mode === "newline") {
      tokens = raw.split(/\r?\n/);
    } else if (mode === "comma") {
      tokens = splitDelimited(raw, ",");
    } else if (mode === "tab") {
      tokens = splitDelimited(raw, "\t");
    } else {
      const nonEmptyLines = raw.split(/\r?\n/).filter((line) => line.trim()).length;
      if (raw.includes("\t")) {
        tokens = splitDelimited(raw, "\t");
      } else if (nonEmptyLines > 1) {
        tokens = raw.split(/\r?\n/);
      } else if (raw.includes(",")) {
        tokens = splitDelimited(raw, ",");
      } else {
        tokens = [raw];
      }
    }

    const sourceCount = tokens.length;
    const trimmed = tokens.map((item) => item.trim()).filter(Boolean);
    const blankCount = sourceCount - trimmed.length;
    let entries = trimmed;
    let duplicateCount = 0;

    if (dedupe) {
      const seen = new Set();
      entries = [];
      for (const item of trimmed) {
        const key = item.replace(/\s+/g, " ").toLocaleLowerCase("vi-VN");
        if (seen.has(key)) {
          duplicateCount += 1;
          continue;
        }
        seen.add(key);
        entries.push(item);
      }
    }

    const limitExceeded = entries.length > MAX_ENTRIES;
    if (limitExceeded) {
      entries = entries.slice(0, MAX_ENTRIES);
    }

    return {
      entries,
      sourceCount,
      blankCount,
      duplicateCount,
      error: limitExceeded
        ? `Danh sách vượt quá ${formatNumber(MAX_ENTRIES)} mục. Hãy chia thành nhiều danh sách nhỏ hơn.`
        : "",
      limitExceeded,
    };
  }

  function splitDelimited(raw, delimiter) {
    const tokens = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < raw.length; index += 1) {
      const character = raw[index];

      if (character === '"') {
        if (inQuotes && raw[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && (character === delimiter || character === "\n" || character === "\r")) {
        if (character === "\r" && raw[index + 1] === "\n") {
          index += 1;
        }
        tokens.push(current);
        current = "";
        continue;
      }

      current += character;
    }

    tokens.push(current);
    return tokens;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("vi-VN").format(value);
  }

  function formatClock(dateValue) {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateValue));
  }

  function formatDateTime(dateValue) {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateValue));
  }

  function formatDrawNumber(number) {
    return String(number).padStart(2, "0");
  }

  function formatRunDuration(seconds) {
    return new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 1,
    }).format(seconds);
  }

  function t(key, vars = {}) {
    const list = getActiveList();
    const template =
      (list && list.config.uiText && list.config.uiText[key]) ||
      DEFAULT_UI_TEXT[key] ||
      key;

    return String(template).replace(/\{\{(\w+)\}\}/g, (match, token) =>
      Object.prototype.hasOwnProperty.call(vars, token)
        ? String(vars[token])
        : match,
    );
  }

  function getAvailableIndexes(list = getActiveList()) {
    if (!list) {
      return [];
    }
    if (list.drawPolicy !== "remove" || !list.excludedIndexes.length) {
      return Array.from({ length: list.entries.length }, (_, index) => index);
    }

    const excluded = new Set(list.excludedIndexes);
    return Array.from({ length: list.entries.length }, (_, index) => index).filter(
      (index) => !excluded.has(index),
    );
  }

  function getRemainingCount(list = getActiveList()) {
    if (!list) {
      return 0;
    }
    return list.drawPolicy === "remove"
      ? Math.max(0, list.entries.length - list.excludedIndexes.length)
      : list.entries.length;
  }

  function getDrawMeta() {
    const list = getActiveList();
    if (!list || !list.entries.length) {
      return t("drawMetaEmpty");
    }

    if (list.entries.length < list.drawCount) {
      return t("drawMetaInsufficient", {
        count: formatNumber(list.entries.length),
        missing: formatNumber(list.drawCount - list.entries.length),
        drawCount: formatNumber(list.drawCount),
      });
    }

    const remaining = getRemainingCount(list);
    if (remaining < list.drawCount) {
      return t("drawMetaLowPool", {
        count: formatNumber(list.entries.length),
        remaining: formatNumber(remaining),
      });
    }

    if (list.drawPolicy === "remove" && list.excludedIndexes.length) {
      return t("drawMetaRemoved", {
        count: formatNumber(list.entries.length),
        remaining: formatNumber(remaining),
        drawCount: formatNumber(list.drawCount),
      });
    }

    return t("drawMetaReady", {
      count: formatNumber(list.entries.length),
      drawCount: formatNumber(list.drawCount),
    });
  }

  function applyAppearance() {
    const list = getActiveList();
    const config = list.config;
    const root = document.documentElement;
    root.dataset.theme = config.theme;
    root.dataset.density = config.density;
    root.dataset.radius = config.radius;
    root.dataset.font = config.fontPreset;
    root.dataset.motion = config.motion;
    root.dataset.columns = config.resultColumns;

    const effectiveGround = config.customColors.enabled
      ? config.customColors.ground
      : (THEME_MAP.get(config.theme) || THEME_MAP.get("minimal")).palette.ground;
    root.style.colorScheme = luminance(effectiveGround) < 0.24 ? "dark" : "light";

    const colorKeys = ["ground", "surface", "text", "accent"];
    for (const key of colorKeys) {
      if (config.customColors.enabled) {
        root.style.setProperty(`--${key}`, config.customColors[key]);
      } else {
        root.style.removeProperty(`--${key}`);
      }
    }

    els.sourcePanel.hidden = focusMode || !config.visibility.showSource;
    els.sourcePreview.hidden = !config.visibility.showSourcePreview;
    els.saveState.hidden = !config.visibility.showSaveStatus;
    els.sidebarNote.hidden = !config.visibility.showSidebarNote;
    els.historyNavButton.hidden = !config.visibility.showHistoryNav;
    els.listsNavCount.hidden = true;
    document.querySelector(".draw-layout").classList.toggle(
      "source-hidden",
      focusMode || !config.visibility.showSource,
    );

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", effectiveGround);
    }
  }

  function applyTextBindings() {
    document.querySelectorAll("[data-text-key]").forEach((element) => {
      const key = element.dataset.textKey;
      if (key) {
        element.textContent = t(key);
      }
    });
  }

  function renderAll(options = {}) {
    const { syncAppearance = true } = options;
    applyAppearance();
    applyTextBindings();
    renderListSwitcher();
    renderView();
    renderDraw();
    renderSource();
    renderHistory();
    renderLists();
    renderStorageState();
    if (syncAppearance) {
      syncAppearanceControls();
    }
  }

  function renderListSwitcher() {
    const fragment = document.createDocumentFragment();
    for (const list of state.lists) {
      const option = document.createElement("option");
      option.value = list.id;
      option.textContent = list.name;
      fragment.append(option);
    }
    els.listSwitcher.replaceChildren(fragment);
    els.listSwitcher.value = state.activeListId;
  }

  function renderView() {
    if (!VIEW_VALUES.has(activeView)) {
      activeView = "draw";
    }

    els.drawView.hidden = activeView !== "draw";
    els.listsView.hidden = activeView !== "lists";
    els.appearanceView.hidden = activeView !== "appearance";
    els.historyView.hidden = activeView !== "history";
    els.drawActions.hidden = activeView !== "draw";
    els.listsActions.hidden = activeView !== "lists";
    els.appearanceActions.hidden = activeView !== "appearance";
    els.historyActions.hidden = activeView !== "history";

    for (const button of els.navButtons) {
      const buttonView = button.dataset.goView;
      if (!buttonView) {
        continue;
      }
      const isActive = buttonView === activeView;
      button.classList.toggle("is-active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    }

    renderPageCopy();
  }

  function renderPageCopy() {
    const list = getActiveList();
    let title = t("drawTitle");
    let meta = getDrawMeta();

    if (activeView === "lists") {
      title = t("listsTitle");
      meta = state.lists.length === 1
        ? t("listsMetaOne")
        : t("listsMetaMany", { count: formatNumber(state.lists.length) });
    } else if (activeView === "appearance") {
      title = t("appearanceTitle");
      meta = t("appearanceMeta", { name: list.name });
    } else if (activeView === "history") {
      title = t("historyTitle");
      meta = list.history.length
        ? t("historyMeta", { count: formatNumber(list.history.length) })
        : t("historyMetaEmpty");
    }

    els.pageTitle.textContent = title;
    els.pageMeta.textContent = meta;
    document.title = `${title} — ${t("appName")}`;
  }

  function renderDraw(options = {}) {
    const { reveal = false } = options;
    const list = getActiveList();
    const count = list.drawCount;
    const entries = list.entries;
    const remaining = getRemainingCount(list);
    const canRestore = list.drawPolicy === "remove" && list.excludedIndexes.length > 0;

    if (document.activeElement !== els.drawCount) {
      els.drawCount.value = String(count);
    }

    els.countLabel.textContent = t("countLabel");
    els.policyLabel.textContent = t("policyLabel");
    els.drawCount.setAttribute("aria-label", t("countLabel"));
    els.drawCount.setAttribute("aria-valuetext", `${count} ${t("sourceUnit")}`);
    els.decreaseCount.disabled = count <= 1 || isDrawing;
    els.increaseCount.disabled = count >= MAX_DRAW_COUNT || isDrawing;
    els.drawCount.disabled = isDrawing;
    els.listSwitcher.disabled = isDrawing;

    els.drawPolicy.options[0].textContent = t("policyKeep");
    els.drawPolicy.options[1].textContent = t("policyRemove");
    els.drawPolicy.value = list.drawPolicy;
    els.drawPolicy.disabled = !entries.length || isDrawing;

    const runModeKey = RUN_MODE_TEXT_KEYS[list.runMode] || RUN_MODE_TEXT_KEYS.together;
    if (document.activeElement !== els.runMode) {
      els.runMode.value = list.runMode;
    }
    if (document.activeElement !== els.runDuration) {
      els.runDuration.value = String(list.runDuration);
    }
    els.runMode.disabled = isDrawing;
    els.runDuration.disabled = isDrawing || list.runMode === "instant";
    els.runMode.setAttribute("aria-label", t("runModeLabel"));
    els.runDuration.setAttribute("aria-label", t("runDurationLabel"));
    els.runDuration.setAttribute(
      "aria-valuetext",
      `${formatRunDuration(list.runDuration)} ${t("runDurationUnit")}`,
    );
    els.runModeHelp.dataset.textKey = runModeKey.help;
    els.runModeHelp.textContent = t(runModeKey.help);

    els.focusModeButton.textContent = focusMode ? t("focusExitAction") : t("focusEnterAction");
    els.focusModeButton.setAttribute("aria-pressed", String(focusMode));

    let focusActionLabel = t("focusDrawAction");
    if (isDrawing) {
      els.drawButton.textContent = t("drawingAction");
      els.drawButton.disabled = true;
      focusActionLabel = t("drawingAction");
    } else {
      els.drawButton.disabled = false;
      if (!entries.length) {
        els.drawButton.textContent = t("addDataAction");
        focusActionLabel = t("addDataAction");
      } else if (entries.length < count) {
        els.drawButton.textContent = t("addMoreAction");
        focusActionLabel = t("addMoreAction");
      } else if (remaining < count && canRestore) {
        els.drawButton.textContent = t("restorePoolAction", {
          count: formatNumber(list.excludedIndexes.length),
        });
        focusActionLabel = els.drawButton.textContent;
      } else {
        els.drawButton.textContent = t("drawAction", { count: formatNumber(count) });
      }
    }
    els.focusDrawButton.textContent = focusActionLabel;
    els.focusDrawButton.disabled = isDrawing;

    els.drawModeNote.textContent =
      list.drawPolicy === "remove" ? t("modeRemoveNote") : t("modeKeepNote");
    els.resultsHeading.textContent = t("resultTitle");
    els.resultGrid.setAttribute("aria-label", t("resultTitle"));

    const hasCurrentDraw = Boolean(list.currentDraw && list.currentDraw.results.length);
    els.copyButton.disabled = !hasCurrentDraw || isDrawing;
    els.exportButton.disabled = !hasCurrentDraw || isDrawing;
    els.resultGrid.setAttribute("aria-busy", isDrawing ? "true" : "false");

    if (isDrawing) {
      return;
    }

    const fragment = document.createDocumentFragment();
    if (hasCurrentDraw) {
      list.currentDraw.results.forEach((value, index) => {
        fragment.append(createResultCell(value, index, { reveal }));
      });
      els.drawStamp.textContent = t("resultStamp", {
        number: formatDrawNumber(list.currentDraw.number),
        time: formatClock(list.currentDraw.createdAt),
        count: formatNumber(list.currentDraw.results.length),
      });
    } else {
      const placeholder = entries.length ? t("resultPlaceholder") : "—";
      for (let index = 0; index < count; index += 1) {
        fragment.append(createResultCell(placeholder, index, { placeholder: true }));
      }
      els.drawStamp.textContent = t("resultStampEmpty");
    }
    els.resultGrid.replaceChildren(fragment);
  }

  function createResultCell(value, index, options = {}) {
    const { placeholder = false, reveal = false } = options;
    const cell = document.createElement("div");
    cell.className = "result-cell";
    cell.setAttribute("role", "listitem");
    cell.classList.toggle("is-placeholder", placeholder);
    cell.classList.toggle("is-current", index === 0 && !placeholder);

    if (reveal) {
      cell.classList.add("is-revealed");
      cell.style.setProperty("--reveal-delay", `${Math.min(index * 15, 315)}ms`);
    }

    const ordinal = document.createElement("span");
    ordinal.className = "cell-index";
    ordinal.textContent = String(index + 1).padStart(2, "0");

    const text = document.createElement("span");
    text.className = "cell-value";
    text.textContent = value;
    text.title = value;

    cell.append(ordinal, text);
    return cell;
  }

  function renderSource() {
    const list = getActiveList();
    const totalCount = list.entries.length;
    const remainingCount = getRemainingCount(list);
    const availableIndexes = getAvailableIndexes(list);
    const removedCount = list.drawPolicy === "remove" ? list.excludedIndexes.length : 0;

    els.sourceHeading.textContent = t("sourceTitle");
    els.sourceCount.textContent = formatNumber(totalCount);

    if (!totalCount) {
      els.sourceState.textContent = t("sourceEmpty");
    } else if (totalCount < list.drawCount) {
      els.sourceState.textContent = t("sourceInsufficient", {
        missing: formatNumber(list.drawCount - totalCount),
        drawCount: formatNumber(list.drawCount),
      });
    } else if (remainingCount < list.drawCount) {
      els.sourceState.textContent = t("sourceLowPool", {
        remaining: formatNumber(remainingCount),
        total: formatNumber(totalCount),
      });
    } else if (list.drawPolicy === "remove" && removedCount) {
      els.sourceState.textContent = t("sourceRemaining", {
        remaining: formatNumber(remainingCount),
        total: formatNumber(totalCount),
      });
    } else {
      els.sourceState.textContent = t("sourceReady", {
        drawCount: formatNumber(list.drawCount),
      });
    }

    els.poolStatus.textContent = t("poolStatus", {
      remaining: formatNumber(remainingCount),
      total: formatNumber(totalCount),
    });
    els.restorePoolButton.hidden = removedCount === 0;
    els.restorePoolButton.disabled = isDrawing;
    els.restorePoolButton.textContent = t("restoreAllAction", {
      count: formatNumber(removedCount),
    });
    els.drawPolicyHelp.textContent =
      list.drawPolicy === "remove" ? t("poolRemoveHelp") : t("poolKeepHelp");

    els.sourcePreview.replaceChildren();
    if (!totalCount) {
      els.sourcePreview.append(createSourceEmpty(t("sourcePreviewEmpty")));
    } else if (!availableIndexes.length) {
      els.sourcePreview.append(createSourceEmpty(t("sourcePreviewExhausted")));
    } else {
      const previewIndexes = availableIndexes.slice(0, 5);
      previewIndexes.forEach((entryIndex) => {
        const row = document.createElement("div");
        row.className = "source-row";
        const ordinal = document.createElement("span");
        ordinal.textContent = String(entryIndex + 1).padStart(2, "0");
        const value = document.createElement("span");
        value.textContent = list.entries[entryIndex];
        value.title = list.entries[entryIndex];
        row.append(ordinal, value);
        els.sourcePreview.append(row);
      });

      if (availableIndexes.length > previewIndexes.length) {
        const more = document.createElement("div");
        more.className = "source-more";
        more.textContent = t("sourceMore", {
          count: formatNumber(availableIndexes.length - previewIndexes.length),
        });
        els.sourcePreview.append(more);
      }
    }

    els.sourceOpenButton.textContent = totalCount ? t("sourceEditAction") : t("sourceOpenAction");
    els.sourceSavedAt.textContent = state.savedAt
      ? t("sourceSaved", { time: formatClock(state.savedAt) })
      : t("localEmpty");
    els.clearListButton.hidden = !(
      list.rawData ||
      list.currentDraw ||
      list.history.length
    );
    els.clearListButton.textContent = t("clearListAction");
  }

  function createSourceEmpty(message) {
    const empty = document.createElement("div");
    empty.className = "source-empty";
    const text = document.createElement("p");
    text.textContent = message;
    empty.append(text);
    return empty;
  }

  function renderHistory() {
    const list = getActiveList();
    const history = list.history;
    els.historyNavCount.hidden = history.length === 0;
    els.historyNavCount.textContent = String(history.length);
    els.historyNavCount.setAttribute(
      "aria-label",
      t("historyCount", { count: formatNumber(history.length) }),
    );
    els.historyIntro.textContent = t("historyIntro");
    els.historyCountLabel.textContent = t("historyCount", {
      count: formatNumber(history.length),
    });
    els.historyPoolFact.textContent = `${formatNumber(getRemainingCount(list))} / ${formatNumber(list.entries.length)}`;
    els.historyPolicyFact.textContent =
      list.drawPolicy === "remove" ? t("policyRemove") : t("policyKeep");
    els.historyDrawCountFact.textContent = formatNumber(list.drawCount);
    els.historyEmpty.hidden = history.length > 0;
    els.historyEmpty.querySelector("p").textContent = t("historyEmpty");
    els.historyDrawButton.textContent = t("historyOpenDraw");
    els.clearHistoryButton.disabled = history.length === 0;
    els.clearHistoryButton.textContent = t("clearHistoryAction");
    els.historyList.replaceChildren();

    if (!history.length) {
      return;
    }

    const fragment = document.createDocumentFragment();
    history.forEach((record) => {
      const details = document.createElement("details");
      details.className = "history-item";

      const summary = document.createElement("summary");
      const leading = document.createElement("span");
      leading.className = "history-leading";

      const number = document.createElement("span");
      number.className = "history-number";
      number.textContent = `#${formatDrawNumber(record.number)}`;

      const copy = document.createElement("span");
      copy.className = "history-summary-copy";
      const title = document.createElement("strong");
      title.textContent = t("resultStamp", {
        number: formatDrawNumber(record.number),
        time: formatClock(record.createdAt),
        count: formatNumber(record.results.length),
      });
      const preview = document.createElement("span");
      preview.textContent = `${formatNumber(record.sourceCount)} ${t("sourceUnit")} · ${record.results
        .slice(0, 3)
        .join(" · ")}${record.results.length > 3 ? " · …" : ""}`;
      copy.append(title, preview);

      const date = document.createElement("span");
      date.className = "history-date";
      date.textContent = formatDateTime(record.createdAt);

      leading.append(number, copy);
      summary.append(leading, date);

      const detail = document.createElement("div");
      detail.className = "history-detail";
      const resultList = document.createElement("ol");
      resultList.className = "history-detail-list";

      record.results.forEach((value, index) => {
        const item = document.createElement("li");
        const ordinal = document.createElement("span");
        ordinal.textContent = String(index + 1).padStart(2, "0");
        const text = document.createElement("span");
        text.textContent = value;
        item.append(ordinal, text);
        resultList.append(item);
      });

      const copyButton = document.createElement("button");
      copyButton.className = "text-button";
      copyButton.type = "button";
      copyButton.textContent = t("copyAction");
      copyButton.addEventListener("click", () => copyRecord(record));

      detail.append(resultList, copyButton);
      details.append(summary, detail);
      fragment.append(details);
    });

    els.historyList.append(fragment);
  }

  function renderLists() {
    els.listsIntro.textContent = t("listsIntro");
    els.listsCountLabel.textContent = t("listsCount", {
      count: formatNumber(state.lists.length),
    });
    const totalEntries = state.lists.reduce((total, list) => total + list.entries.length, 0);
    const totalHistory = state.lists.reduce((total, list) => total + list.history.length, 0);
    els.listsTotalEntries.textContent = t("listGuideEntriesValue", {
      count: formatNumber(totalEntries),
    });
    els.listsTotalHistory.textContent = t("listGuideHistoryValue", {
      count: formatNumber(totalHistory),
    });
    const activeList = getActiveList();
    els.listsActiveName.textContent = activeList.name;
    els.listsActiveEntries.textContent = t("activeListEntriesValue", {
      count: formatNumber(activeList.entries.length),
    });
    els.listsActiveAvailable.textContent = t("activeListAvailableValue", {
      count: formatNumber(getRemainingCount(activeList)),
    });
    els.listsActiveDrawCount.textContent = t("activeListDrawCountValue", {
      count: formatNumber(activeList.drawCount),
    });
    els.listsActiveHistory.textContent = t("activeListHistoryValue", {
      count: formatNumber(activeList.history.length),
    });
    els.listsOpenDrawButton.textContent = t("activeListOpenAction");
    els.listTable.replaceChildren();

    const header = document.createElement("div");
    header.className = "list-table-head";
    [t("listTableName"), t("listTableData"), t("listTableUpdated"), t("listTableActions")].forEach((label) => {
      const cell = document.createElement("span");
      cell.textContent = label;
      header.append(cell);
    });
    els.listTable.append(header);

    const fragment = document.createDocumentFragment();
    state.lists.forEach((list) => {
      const row = document.createElement("article");
      row.className = "list-row";
      row.classList.toggle("is-active", list.id === state.activeListId);

      const identity = document.createElement("div");
      identity.className = "list-identity";
      const nameLine = document.createElement("div");
      nameLine.className = "list-name-line";
      const name = document.createElement("strong");
      name.textContent = list.name;
      nameLine.append(name);
      if (list.id === state.activeListId) {
        const active = document.createElement("span");
        active.className = "active-mark";
        active.textContent = t("listActive");
        nameLine.append(active);
      }
      const themeName = THEME_MAP.get(list.config.theme)?.name || list.config.theme;
      const meta = document.createElement("span");
      meta.className = "list-meta";
      meta.textContent = t("listMeta", {
        count: formatNumber(list.entries.length),
        theme: themeName,
        time: formatClock(list.updatedAt),
      });
      identity.append(nameLine, meta);

      const data = document.createElement("span");
      data.className = "list-data-count";
      data.textContent = formatNumber(list.entries.length);

      const updated = document.createElement("span");
      updated.className = "list-updated";
      updated.textContent = formatDateTime(list.updatedAt);

      const actions = document.createElement("div");
      actions.className = "list-actions";
      const openButton = document.createElement("button");
      openButton.className = "text-button";
      openButton.type = "button";
      openButton.textContent = t("openListAction");
      openButton.addEventListener("click", () => switchActiveList(list.id, true));

      const renameButton = document.createElement("button");
      renameButton.className = "text-button";
      renameButton.type = "button";
      renameButton.textContent = t("renameAction");
      renameButton.addEventListener("click", () => openListDialog("rename", list.id));

      const duplicateButton = document.createElement("button");
      duplicateButton.className = "text-button";
      duplicateButton.type = "button";
      duplicateButton.textContent = t("duplicateAction");
      duplicateButton.addEventListener("click", () => duplicateList(list.id));

      const deleteButton = document.createElement("button");
      deleteButton.className = "text-button text-danger";
      deleteButton.type = "button";
      deleteButton.textContent = t("deleteAction");
      deleteButton.addEventListener("click", () => requestDeleteList(list.id));

      actions.append(openButton, renameButton, duplicateButton, deleteButton);
      row.append(identity, data, updated, actions);
      fragment.append(row);
    });

    els.listTable.append(fragment);
    els.createListButton.textContent = t("createListAction");
  }

  function renderStorageState() {
    els.saveState.classList.toggle("is-warning", !storageAvailable);
    if (!storageAvailable) {
      els.saveStatus.textContent = t("saveUnavailable");
      return;
    }

    els.saveStatus.textContent = state.savedAt
      ? t("saveAt", { time: formatClock(state.savedAt) })
      : t("saveNever");
  }

  function renderThemeChoices() {
    const fragment = document.createDocumentFragment();
    THEME_PRESETS.forEach((theme) => {
      const label = document.createElement("label");
      label.className = "theme-option";
      label.dataset.themeOption = theme.id;

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "themePreset";
      input.value = theme.id;

      const top = document.createElement("span");
      top.className = "theme-option-top";
      const name = document.createElement("strong");
      name.textContent = theme.name;
      const swatches = document.createElement("span");
      swatches.className = "theme-swatches";
      theme.colors.forEach((color) => {
        const swatch = document.createElement("span");
        swatch.style.background = color;
        swatches.append(swatch);
      });
      top.append(name, swatches);

      const description = document.createElement("span");
      description.className = "theme-description";
      description.textContent = theme.description;

      label.append(input, top, description);
      fragment.append(label);
    });
    els.themeGrid.replaceChildren(fragment);
  }

  function buildTextSettings() {
    const fragment = document.createDocumentFragment();
    UI_TEXT_GROUPS.forEach((group) => {
      const details = document.createElement("details");
      details.className = "text-group";
      details.open = Boolean(group.open);

      const summary = document.createElement("summary");
      summary.textContent = group.title;

      const grid = document.createElement("div");
      grid.className = "text-field-grid";

      group.keys.forEach(([key, labelText]) => {
        const label = document.createElement("label");
        label.className = "field text-setting-field";
        const labelSpan = document.createElement("span");
        labelSpan.textContent = labelText;

        const control = LONG_TEXT_KEYS.has(key)
          ? document.createElement("textarea")
          : document.createElement("input");
        if (control instanceof HTMLTextAreaElement) {
          control.rows = 2;
        } else {
          control.type = "text";
        }
        control.maxLength = 600;
        control.dataset.uiTextKey = key;
        control.spellcheck = true;

        label.append(labelSpan, control);
        grid.append(label);
      });

      details.append(summary, grid);
      fragment.append(details);
    });
    els.textSettings.replaceChildren(fragment);
    textSettingsBuilt = true;
  }

  function syncAppearanceControls() {
    const list = getActiveList();
    const config = list.config;
    if (!textSettingsBuilt) {
      buildTextSettings();
    }

    document.querySelectorAll("[data-theme-option]").forEach((option) => {
      const input = option.querySelector('input[name="themePreset"]');
      const selected = input.value === config.theme;
      input.checked = selected;
      option.classList.toggle("is-selected", selected);
    });

    for (const select of els.configSelects) {
      const key = select.dataset.configSelect;
      if (key && Object.prototype.hasOwnProperty.call(config, key)) {
        select.value = String(config[key]);
      }
    }

    for (const toggle of els.configToggles) {
      const path = toggle.dataset.configToggle;
      toggle.checked = Boolean(getPath(config, path));
    }

    for (const input of els.colorInputs) {
      const key = input.dataset.colorKey;
      input.value = config.customColors[key];
      input.disabled = !config.customColors.enabled;
    }
    for (const output of els.colorOutputs) {
      const key = output.dataset.colorOutput;
      output.textContent = config.customColors[key];
    }
    els.customColorGrid.classList.toggle("is-disabled", !config.customColors.enabled);

    document.querySelectorAll("[data-ui-text-key]").forEach((control) => {
      const key = control.dataset.uiTextKey;
      if (document.activeElement !== control) {
        control.value = config.uiText[key] || "";
      }
    });

    updateContrastStatus();
  }

  function getPath(object, path) {
    return path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), object);
  }

  function setPath(object, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      return current[key];
    }, object);
    target[last] = value;
  }

  function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }

  function luminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const channels = [r, g, b].map((value) => {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }

  function contrastRatio(first, second) {
    const light = Math.max(luminance(first), luminance(second));
    const dark = Math.min(luminance(first), luminance(second));
    return (light + 0.05) / (dark + 0.05);
  }

  function updateContrastStatus() {
    const config = getActiveList().config;
    if (!config.customColors.enabled) {
      const themeName = THEME_MAP.get(config.theme)?.name || config.theme;
      els.contrastStatus.textContent = `Đang dùng bảng màu ${themeName}.`;
      els.contrastStatus.classList.remove("is-warning");
      return;
    }

    const surfaceRatio = contrastRatio(config.customColors.text, config.customColors.surface);
    const groundRatio = contrastRatio(config.customColors.text, config.customColors.ground);
    const lowest = Math.min(surfaceRatio, groundRatio);
    els.contrastStatus.classList.toggle("is-warning", lowest < 4.5);
    els.contrastStatus.textContent =
      lowest < 4.5
        ? `Tương phản chữ thấp: ${lowest.toFixed(1)}:1. Nên đạt tối thiểu 4,5:1 trên nền và bề mặt.`
        : `Tương phản chữ đạt ${lowest.toFixed(1)}:1 trên nền và bề mặt.`;
  }

  async function setFocusMode(enabled, options = {}) {
    const { syncFullscreen = true } = options;
    focusMode = Boolean(enabled);
    document.documentElement.classList.toggle("is-focus-mode", focusMode);
    applyAppearance();
    renderDraw();

    if (!focusMode) {
      if (syncFullscreen && document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch (error) {
          // Focus mode still exits when the browser blocks its fullscreen API.
        }
      }
      window.requestAnimationFrame(() => els.focusModeButton.focus());
      return;
    }

    if (
      syncFullscreen &&
      document.fullscreenEnabled &&
      !document.fullscreenElement &&
      document.documentElement.requestFullscreen
    ) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        // The focused layout remains usable inside the normal browser window.
      }
    }
    window.requestAnimationFrame(() => els.resultGrid.focus({ preventScroll: true }));
  }

  function goToView(view) {
    if (!VIEW_VALUES.has(view)) {
      return;
    }
    if (focusMode && view !== "draw") {
      setFocusMode(false);
    }
    activeView = view;
    if (window.location.hash !== `#${view}`) {
      window.history.replaceState(null, "", `#${view}`);
    }
    renderView();
    if (view === "appearance") {
      syncAppearanceControls();
    }
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
  }

  function setDrawCount(value) {
    const list = getActiveList();
    const next = clamp(Math.round(Number(value) || 1), 1, MAX_DRAW_COUNT);
    if (next === list.drawCount) {
      els.drawCount.value = String(next);
      return;
    }

    const hadResults = Boolean(list.currentDraw);
    list.drawCount = next;
    list.currentDraw = null;
    persistState(true);
    renderAll();

    if (hadResults) {
      showToast("Đã làm mới bảng kết quả. Lượt trước vẫn còn trong lịch sử.");
    }
  }

  function setDrawPolicy(value) {
    const list = getActiveList();
    if (!DRAW_POLICIES.has(value) || value === list.drawPolicy) {
      els.drawPolicy.value = list.drawPolicy;
      return;
    }

    const restoredCount = list.excludedIndexes.length;
    list.drawPolicy = value;
    if (value === "keep") {
      list.excludedIndexes = [];
    }

    persistState(true);
    renderAll();

    if (value === "remove") {
      showToast("Từ lượt tiếp theo, mục đã trúng sẽ bị bỏ khỏi danh sách khả dụng.");
    } else if (restoredCount) {
      showToast(`Đã đưa ${formatNumber(restoredCount)} mục trở lại danh sách khả dụng.`);
    }
  }

  function setRunMode(value) {
    const list = getActiveList();
    if (!RUN_MODES.has(value) || value === list.runMode) {
      els.runMode.value = list.runMode;
      return;
    }

    list.runMode = value;
    persistState(true);
    renderAll();
  }

  function setRunDuration(value) {
    const list = getActiveList();
    const next = normalizeRunDuration(value);
    if (next === list.runDuration) {
      els.runDuration.value = String(next);
      return;
    }

    list.runDuration = next;
    persistState(true);
    renderAll();
  }

  function restorePool(quiet = false) {
    const list = getActiveList();
    const restoredCount = list.excludedIndexes.length;
    if (!restoredCount) {
      return;
    }

    list.excludedIndexes = [];
    persistState(true);
    renderAll();
    if (!quiet) {
      showToast(`Đã khôi phục ${formatNumber(restoredCount)} mục vào danh sách khả dụng.`);
    }
  }

  function switchActiveList(id, goDraw = false) {
    if (!state.lists.some((list) => list.id === id)) {
      return;
    }
    state.activeListId = id;
    persistState(true, { touch: false });
    renderAll();
    if (goDraw) {
      goToView("draw");
    }
  }

  function openDataDialog() {
    const list = getActiveList();
    els.dataInput.value = list.rawData;
    els.delimiterMode.value = list.delimiter;
    els.dedupeInput.checked = list.dedupe;
    els.dataResetNote.hidden = !list.currentDraw;
    updateParsePreview();
    openDialog(els.dataDialog);
    window.requestAnimationFrame(() => {
      els.dataInput.focus();
      const length = els.dataInput.value.length;
      els.dataInput.setSelectionRange(length, length);
    });
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }
    dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === "function") {
      dialog.close();
      return;
    }
    dialog.removeAttribute("open");
  }

  function updateParsePreview() {
    const list = getActiveList();
    currentParsed = parseEntries(
      els.dataInput.value,
      els.delimiterMode.value,
      els.dedupeInput.checked,
    );

    const count = currentParsed.entries.length;
    els.parsedCount.textContent = `${formatNumber(count)} ${t("sourceUnit")}`;
    els.previewLimit.textContent = count
      ? t("previewFirst", {
          count: `${formatNumber(Math.min(PREVIEW_LIMIT, count))} / ${formatNumber(count)}`,
        })
      : t("previewFirst", { count: formatNumber(PREVIEW_LIMIT) });
    els.parseCard.classList.toggle("is-error", Boolean(currentParsed.error));

    if (currentParsed.error) {
      els.parseDetail.textContent = currentParsed.error;
    } else if (!els.dataInput.value.trim()) {
      els.parseDetail.textContent = t("parseEmpty");
    } else {
      const details = [];
      if (currentParsed.blankCount) {
        details.push(`Bỏ ${formatNumber(currentParsed.blankCount)} dòng trống`);
      }
      if (currentParsed.duplicateCount) {
        details.push(`Gộp ${formatNumber(currentParsed.duplicateCount)} mục trùng`);
      }
      if (!details.length) {
        details.push("Không có dòng trống");
      }
      if (count < list.drawCount) {
        details.push(`thiếu ${formatNumber(list.drawCount - count)} mục cho lượt hiện tại`);
      }
      els.parseDetail.textContent = `${details.join(" · ")}.`;
    }

    const canApply = count > 0 && !currentParsed.error;
    els.applyDataButton.disabled = !canApply;
    els.applyDataButton.textContent = canApply
      ? t("applyDataAction", { count: formatNumber(count) })
      : t("applyDataShortAction");
    renderDialogPreview();
  }

  function renderDialogPreview() {
    els.dataPreview.replaceChildren();
    const preview = currentParsed.entries.slice(0, PREVIEW_LIMIT);

    if (!preview.length) {
      const empty = document.createElement("li");
      empty.className = "preview-empty";
      empty.textContent = t("sourcePreviewEmpty");
      els.dataPreview.append(empty);
      return;
    }

    preview.forEach((entry, index) => {
      const item = document.createElement("li");
      const ordinal = document.createElement("span");
      ordinal.textContent = String(index + 1).padStart(2, "0");
      const value = document.createElement("span");
      value.textContent = entry;
      value.title = entry;
      item.append(ordinal, value);
      els.dataPreview.append(item);
    });
  }

  function applyData() {
    updateParsePreview();
    if (!currentParsed.entries.length || currentParsed.error) {
      showToast(currentParsed.error || "Chưa nhận diện được mục nào.", "error");
      return;
    }

    const list = getActiveList();
    list.rawData = els.dataInput.value;
    list.delimiter = els.delimiterMode.value;
    list.dedupe = els.dedupeInput.checked;
    list.entries = currentParsed.entries;
    list.excludedIndexes = [];
    list.currentDraw = null;
    persistState(true);
    closeDialog(els.dataDialog);
    renderAll();
    goToView("draw");

    const message = list.entries.length < list.drawCount
      ? `Đã nhận ${formatNumber(list.entries.length)} mục. Cần thêm ${formatNumber(list.drawCount - list.entries.length)} mục cho lượt ${list.drawCount} ô.`
      : `Đã nhận ${formatNumber(list.entries.length)} mục và lưu trên máy này.`;
    showToast(message);
  }

  async function pasteFromClipboard() {
    if (!navigator.clipboard || typeof navigator.clipboard.readText !== "function") {
      showToast("Trình duyệt không cho phép đọc bộ nhớ tạm. Hãy dùng phím dán.", "error");
      els.dataInput.focus();
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        showToast("Bộ nhớ tạm đang trống.", "error");
        return;
      }
      const existing = els.dataInput.value;
      els.dataInput.value =
        existing && !existing.endsWith("\n") ? `${existing}\n${text}` : `${existing}${text}`;
      updateParsePreview();
      els.dataInput.focus();
      showToast("Đã dán nội dung.");
    } catch (error) {
      showToast("Không đọc được bộ nhớ tạm. Hãy dán trực tiếp vào ô nội dung.", "error");
      els.dataInput.focus();
    }
  }

  async function loadSampleData() {
    try {
      const response = await fetch("./data/mon-an-200.txt", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      if (!text.trim()) {
        throw new Error("Empty sample");
      }
      els.dataInput.value = text.trim();
      els.delimiterMode.value = "newline";
      els.dedupeInput.checked = true;
      updateParsePreview();
      showToast("Đã nạp 200 tên món ăn mẫu.");
    } catch (error) {
      showToast("Không tải được dữ liệu mẫu. Hãy mở ứng dụng qua máy chủ HTTP.", "error");
    }
  }

  function secureRandomInt(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error("Invalid random range");
    }

    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      const range = 0x100000000;
      const limit = range - (range % maxExclusive);
      const values = new Uint32Array(1);
      let value;
      do {
        window.crypto.getRandomValues(values);
        value = values[0];
      } while (value >= limit);
      return value % maxExclusive;
    }

    return Math.floor(Math.random() * maxExclusive);
  }

  function pickUniqueIndexes(sourceIndexes, count) {
    const indexes = [...sourceIndexes];
    for (let index = 0; index < count; index += 1) {
      const swapIndex = index + secureRandomInt(indexes.length - index);
      [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
    }
    return indexes.slice(0, count);
  }

  function randomPreviewEntry(list, sourceIndexes) {
    return list.entries[sourceIndexes[secureRandomInt(sourceIndexes.length)]];
  }

  function createDrawRecord(list, results) {
    return {
      id: createId("draw"),
      number: list.nextDrawNumber,
      createdAt: new Date().toISOString(),
      sourceCount: list.entries.length,
      results,
    };
  }

  function handleDrawRequest() {
    if (isDrawing) {
      return;
    }

    const list = getActiveList();
    if (list.entries.length < list.drawCount) {
      openDataDialog();
      return;
    }
    if (getRemainingCount(list) < list.drawCount) {
      restorePool();
      return;
    }
    runDraw();
  }

  async function runDraw() {
    if (isDrawing) {
      return;
    }

    const list = getActiveList();
    if (list.entries.length < list.drawCount) {
      openDataDialog();
      return;
    }

    const availableIndexes = getAvailableIndexes(list);
    if (availableIndexes.length < list.drawCount) {
      showToast("Không còn đủ mục khả dụng cho lượt này. Hãy khôi phục hoặc bổ sung dữ liệu.", "error");
      return;
    }

    const resultIndexes = pickUniqueIndexes(availableIndexes, list.drawCount);
    const results = resultIndexes.map((index) => list.entries[index]);
    isDrawing = true;
    renderDraw();
    renderSource();
    els.resultGrid.setAttribute("aria-busy", "true");

    const animated = list.runMode !== "instant" && !reduceMotion.matches && list.config.motion !== "still";

    try {
      if (animated) {
        await animateDrawPreview(list, results, availableIndexes);
      }

      const record = createDrawRecord(list, results);
      list.currentDraw = record;
      list.nextDrawNumber = record.number + 1;
      list.history = [record, ...list.history].slice(0, MAX_HISTORY);
      if (list.drawPolicy === "remove") {
        list.excludedIndexes = [...new Set([
          ...list.excludedIndexes,
          ...resultIndexes,
        ])].sort((left, right) => left - right);
      }
      isDrawing = false;
      persistState(true);
      renderAll();
      if (!animated) {
        renderDraw({ reveal: true });
      }
      els.screenAnnouncer.textContent =
        list.drawPolicy === "remove"
          ? `Đã bốc xong ${list.drawCount} kết quả cho lượt ${formatDrawNumber(record.number)}. Còn ${getRemainingCount(list)} mục khả dụng.`
          : `Đã bốc xong ${list.drawCount} kết quả cho lượt ${formatDrawNumber(record.number)}.`;
    } catch (error) {
      isDrawing = false;
      renderAll();
      showToast("Không thể hoàn tất hiệu ứng random. Kết quả chưa được ghi nhận.", "error");
    }
  }

  async function animateDrawPreview(list, results, availableIndexes) {
    const durationMs = Math.round(list.runDuration * 1000);
    const previewValues = results.map(() => randomPreviewEntry(list, availableIndexes));
    const fragment = document.createDocumentFragment();
    previewValues.forEach((value, index) => {
      const cell = createResultCell(value, index);
      cell.classList.add("is-rolling");
      fragment.append(cell);
    });
    els.resultGrid.replaceChildren(fragment);

    const cells = [...els.resultGrid.children];
    const tickInterval = Math.max(32, Math.min(85, Math.round(durationMs / 24)));

    if (list.runMode === "together") {
      const previewEnd = performance.now() + Math.max(120, durationMs - 150);
      while (performance.now() < previewEnd) {
        cells.forEach((cell) => {
          updatePreviewCell(cell, randomPreviewEntry(list, availableIndexes));
        });
        await wait(tickInterval);
      }
      cells.forEach((cell, index) => lockPreviewCell(cell, results[index]));
    } else {
      const startedAt = performance.now();
      const revealStartsAt = durationMs * 0.3;
      const revealSpan = Math.max(1, durationMs - revealStartsAt);
      const lockTimes = results.map(
        (_, index) => revealStartsAt + (revealSpan * index) / Math.max(1, results.length - 1),
      );

      while (performance.now() - startedAt < durationMs) {
        const elapsed = performance.now() - startedAt;
        cells.forEach((cell, index) => {
          if (elapsed >= lockTimes[index]) {
            lockPreviewCell(cell, results[index]);
          } else {
            updatePreviewCell(cell, randomPreviewEntry(list, availableIndexes));
          }
        });
        const remaining = Math.max(16, durationMs - (performance.now() - startedAt));
        await wait(Math.min(tickInterval, remaining));
      }
      cells.forEach((cell, index) => lockPreviewCell(cell, results[index]));
    }

    await wait(140);
    return true;
  }

  function updatePreviewCell(cell, value) {
    cell.classList.remove("is-locked");
    cell.classList.add("is-rolling");
    const text = cell.querySelector(".cell-value");
    if (text) {
      text.textContent = value;
      text.title = value;
    }
  }

  function lockPreviewCell(cell, value) {
    const text = cell.querySelector(".cell-value");
    if (text) {
      text.textContent = value;
      text.title = value;
    }
    cell.classList.remove("is-rolling");
    cell.classList.add("is-locked");
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function recordAsText(record) {
    const list = getActiveList();
    const lines = [
      `${list.name} — ${formatDateTime(record.createdAt)}`,
      `${record.results.length} kết quả từ ${formatNumber(record.sourceCount)} mục`,
      "",
    ];

    record.results.forEach((value, index) => {
      lines.push(`${String(index + 1).padStart(2, "0")}. ${value}`);
    });

    return lines.join("\n");
  }

  async function copyRecord(record) {
    if (!record) {
      return;
    }

    const text = recordAsText(record);
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      showToast("Đã sao chép kết quả.");
    } catch (error) {
      try {
        fallbackCopy(text);
        showToast("Đã sao chép kết quả.");
      } catch (fallbackError) {
        showToast("Không thể sao chép tự động. Hãy chọn nội dung và sao chép thủ công.", "error");
      }
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) {
      throw new Error("Copy failed");
    }
  }

  function sanitizeFilename(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 50) || "ket-qua";
  }

  function exportRecordCsv(record) {
    if (!record) {
      return;
    }

    const rows = [["STT", "Kết quả"]];
    record.results.forEach((value, index) => {
      rows.push([String(index + 1), value]);
    });

    const csv = `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const datePart = record.createdAt.slice(0, 10);
    link.href = url;
    link.download = `${sanitizeFilename(getActiveList().name)}-${formatDrawNumber(record.number)}-${datePart}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Đã tạo tệp CSV.");
  }

  function csvEscape(value) {
    let text = String(value);
    if (/^[=+\-@]/.test(text)) {
      text = `'${text}`;
    }
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportBackup() {
    const payload = {
      ...serializeState(),
      exportedAt: new Date().toISOString(),
      application: "boc-so",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const datePart = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `boc-so-sao-luu-${datePart}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Đã tải bản sao lưu JSON.");
  }

  async function importBackup(file) {
    if (!file) {
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      showToast("Tệp sao lưu vượt quá 20 MB.", "error");
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      let incomingLists;
      if (Array.isArray(parsed.lists)) {
        incomingLists = normalizeState(parsed).lists;
      } else if (typeof parsed.rawData === "string") {
        incomingLists = migrateLegacyState(parsed).lists;
      } else {
        throw new Error("Invalid backup");
      }

      if (!incomingLists.length) {
        throw new Error("Empty backup");
      }

      let firstImportedId = "";
      for (const incoming of incomingLists) {
        const imported = normalizeList(incoming, state.lists.length);
        if (!imported) {
          continue;
        }
        if (state.lists.some((list) => list.id === imported.id)) {
          imported.id = createId("list");
        }
        imported.name = getUniqueListName(imported.name);
        state.lists.push(imported);
        firstImportedId ||= imported.id;
      }

      if (!firstImportedId) {
        throw new Error("No imported lists");
      }

      state.activeListId = firstImportedId;
      persistState(true);
      renderAll();
      goToView("lists");
      showToast(`Đã nhập ${formatNumber(incomingLists.length)} danh sách từ bản sao lưu.`);
    } catch (error) {
      showToast("Tệp JSON không hợp lệ hoặc không đúng định dạng sao lưu.", "error");
    }
  }

  function openConfirm(options) {
    els.confirmTitle.textContent = options.title;
    els.confirmText.textContent = options.text;
    els.confirmActionButton.textContent = options.confirmLabel;
    confirmAction = options.onConfirm;
    openDialog(els.confirmDialog);
  }

  function requestHistoryClear() {
    const list = getActiveList();
    if (!list.history.length) {
      return;
    }
    openConfirm({
      title: "Xóa lịch sử?",
      text: `Xóa ${formatNumber(list.history.length)} lượt đã lưu của “${list.name}”. Danh sách nguồn và bảng kết quả hiện tại vẫn được giữ.`,
      confirmLabel: "Xóa lịch sử",
      onConfirm: () => {
        list.history = [];
        persistState(true);
        renderAll();
        showToast("Đã xóa lịch sử trên máy này.");
      },
    });
  }

  function requestClearListData() {
    const list = getActiveList();
    openConfirm({
      title: "Xóa dữ liệu danh sách?",
      text: `Dữ liệu nguồn, bảng kết quả, pool và lịch sử của “${list.name}” sẽ bị xóa. Tên và cấu hình giao diện vẫn được giữ.`,
      confirmLabel: "Xóa dữ liệu",
      onConfirm: () => {
        list.rawData = "";
        list.entries = [];
        list.excludedIndexes = [];
        list.currentDraw = null;
        list.history = [];
        list.nextDrawNumber = 1;
        persistState(true);
        renderAll();
        showToast("Đã xóa dữ liệu khỏi danh sách này.");
      },
    });
  }

  function getUniqueListName(base) {
    const cleanBase = base.trim().slice(0, 72) || "Danh sách mới";
    const names = new Set(state.lists.map((list) => list.name.toLocaleLowerCase("vi-VN")));
    if (!names.has(cleanBase.toLocaleLowerCase("vi-VN"))) {
      return cleanBase;
    }
    let suffix = 2;
    while (names.has(`${cleanBase} ${suffix}`.toLocaleLowerCase("vi-VN"))) {
      suffix += 1;
    }
    return `${cleanBase} ${suffix}`;
  }

  function openListDialog(mode, id = "") {
    listDialogMode = mode;
    listDialogTargetId = id;
    const list = state.lists.find((candidate) => candidate.id === id);
    if (mode === "rename" && list) {
      els.listDialogTitle.textContent = t("renameListTitle");
      els.listNameInput.value = list.name;
      els.saveListButton.textContent = t("saveNameAction");
    } else {
      els.listDialogTitle.textContent = t("createListTitle");
      els.listNameInput.value = getUniqueListName("Danh sách mới");
      els.saveListButton.textContent = t("saveListAction");
    }
    openDialog(els.listDialog);
    window.requestAnimationFrame(() => {
      els.listNameInput.focus();
      els.listNameInput.select();
    });
  }

  function submitListForm() {
    const name = els.listNameInput.value.trim().slice(0, 80);
    if (!name) {
      els.listNameInput.focus();
      return;
    }

    if (listDialogMode === "rename") {
      const list = state.lists.find((candidate) => candidate.id === listDialogTargetId);
      if (!list) {
        return;
      }
      list.name = name;
      persistState(true);
      closeDialog(els.listDialog);
      renderAll();
      showToast("Đã đổi tên danh sách.");
      return;
    }

    const currentConfig = normalizeConfig(getActiveList().config);
    const newList = createList(name, { config: currentConfig });
    state.lists.push(newList);
    state.activeListId = newList.id;
    persistState(true);
    closeDialog(els.listDialog);
    renderAll();
    goToView("draw");
    showToast("Đã tạo danh sách mới với dữ liệu trống.");
  }

  function duplicateList(id) {
    const sourceIndex = state.lists.findIndex((list) => list.id === id);
    if (sourceIndex < 0) {
      return;
    }
    const source = state.lists[sourceIndex];
    const duplicate = createList(getUniqueListName(`${source.name} (bản sao)`), {
      config: normalizeConfig(source.config),
    });
    duplicate.rawData = source.rawData;
    duplicate.delimiter = source.delimiter;
    duplicate.dedupe = source.dedupe;
    duplicate.entries = [...source.entries];
    duplicate.drawCount = source.drawCount;
    duplicate.drawPolicy = source.drawPolicy;
    duplicate.runMode = source.runMode;
    duplicate.runDuration = source.runDuration;
    state.lists.splice(sourceIndex + 1, 0, duplicate);
    state.activeListId = duplicate.id;
    persistState(true);
    renderAll();
    showToast(`Đã nhân bản “${source.name}”.`);
  }

  function requestDeleteList(id) {
    const list = state.lists.find((candidate) => candidate.id === id);
    if (!list) {
      return;
    }

    const isLast = state.lists.length === 1;
    openConfirm({
      title: "Xóa danh sách?",
      text: isLast
        ? `“${list.name}” sẽ bị thay bằng một danh sách trống để ứng dụng luôn có ít nhất một danh sách.`
        : `Xóa “${list.name}” cùng dữ liệu, pool, lịch sử và cấu hình giao diện của danh sách này. Không thể hoàn tác.`,
      confirmLabel: "Xóa danh sách",
      onConfirm: () => {
        const index = state.lists.findIndex((candidate) => candidate.id === id);
        if (index < 0) {
          return;
        }

        if (state.lists.length === 1) {
          const replacement = createList("Danh sách mới", {
            config: normalizeConfig(list.config),
          });
          state.lists = [replacement];
          state.activeListId = replacement.id;
        } else {
          state.lists.splice(index, 1);
          if (state.activeListId === id) {
            state.activeListId = state.lists[Math.min(index, state.lists.length - 1)].id;
          }
        }
        persistState(true);
        renderAll();
        showToast("Đã xóa danh sách.");
      },
    });
  }

  function requestResetAppearance() {
    const list = getActiveList();
    openConfirm({
      title: "Đặt lại giao diện?",
      text: `Theme, màu sắc, bố cục và thành phần hiển thị của “${list.name}” sẽ trở về mặc định. Phần chữ tùy chỉnh vẫn được giữ.`,
      confirmLabel: "Đặt lại giao diện",
      onConfirm: () => {
        const uiText = { ...list.config.uiText };
        list.config = { ...createDefaultConfig(), uiText };
        persistState(true);
        renderAll();
        showToast("Đã đặt lại giao diện.");
      },
    });
  }

  function requestResetText() {
    const list = getActiveList();
    openConfirm({
      title: "Đặt lại nội dung?",
      text: `Toàn bộ chữ tùy chỉnh của “${list.name}” sẽ trở về mặc định. Dữ liệu và các tùy chọn giao diện khác vẫn được giữ.`,
      confirmLabel: "Đặt lại nội dung",
      onConfirm: () => {
        list.config.uiText = { ...DEFAULT_UI_TEXT };
        persistState(true);
        renderAll();
        showToast("Đã đặt lại toàn bộ nội dung giao diện.");
      },
    });
  }

  function showToast(message, type = "info") {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.toggle("is-error", type === "error");
    els.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("is-visible");
    }, type === "error" ? 4800 : 3200);
  }

  function handleViewClick(event) {
    goToView(event.currentTarget.dataset.goView);
  }

  function bindEvents() {
    els.navButtons.forEach((button) => button.addEventListener("click", handleViewClick));

    [els.openDataButton, els.editDataButton, els.sourceOpenButton].forEach((button) => {
      button.addEventListener("click", openDataDialog);
    });

    els.listSwitcher.addEventListener("change", () => {
      switchActiveList(els.listSwitcher.value);
    });

    els.drawButton.addEventListener("click", handleDrawRequest);
    els.focusDrawButton.addEventListener("click", handleDrawRequest);
    els.focusModeButton.addEventListener("click", () => setFocusMode(!focusMode));

    els.decreaseCount.addEventListener("click", () => setDrawCount(getActiveList().drawCount - 1));
    els.increaseCount.addEventListener("click", () => setDrawCount(getActiveList().drawCount + 1));
    els.drawCount.addEventListener("change", () => setDrawCount(els.drawCount.value));
    els.drawCount.addEventListener("blur", () => {
      els.drawCount.value = String(getActiveList().drawCount);
    });

    els.drawPolicy.addEventListener("change", () => setDrawPolicy(els.drawPolicy.value));
    els.runMode.addEventListener("change", () => setRunMode(els.runMode.value));
    els.runDuration.addEventListener("change", () => setRunDuration(els.runDuration.value));
    els.runDuration.addEventListener("blur", () => setRunDuration(els.runDuration.value));
    els.runDuration.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        setRunDuration(els.runDuration.value);
        els.runDuration.blur();
      }
    });
    els.restorePoolButton.addEventListener("click", () => restorePool());
    els.copyButton.addEventListener("click", () => copyRecord(getActiveList().currentDraw));
    els.exportButton.addEventListener("click", () => exportRecordCsv(getActiveList().currentDraw));

    els.closeDataButton.addEventListener("click", () => closeDialog(els.dataDialog));
    els.cancelDataButton.addEventListener("click", () => closeDialog(els.dataDialog));
    els.pasteButton.addEventListener("click", pasteFromClipboard);
    els.loadSampleButton.addEventListener("click", loadSampleData);

    els.dataForm.addEventListener("submit", (event) => {
      event.preventDefault();
      applyData();
    });

    const schedulePreview = () => {
      window.clearTimeout(parseTimer);
      parseTimer = window.setTimeout(updateParsePreview, 90);
    };
    els.dataInput.addEventListener("input", schedulePreview);
    els.delimiterMode.addEventListener("change", updateParsePreview);
    els.dedupeInput.addEventListener("change", updateParsePreview);

    els.clearHistoryButton.addEventListener("click", requestHistoryClear);
    els.clearListButton.addEventListener("click", requestClearListData);
    els.historyDrawButton.addEventListener("click", () => goToView("draw"));
    els.listsOpenDrawButton.addEventListener("click", () => goToView("draw"));
    els.createListButton.addEventListener("click", () => openListDialog("create"));
    els.exportBackupButton.addEventListener("click", exportBackup);
    els.importBackupButton.addEventListener("click", () => els.importBackupInput.click());
    els.importBackupInput.addEventListener("change", () => {
      const [file] = els.importBackupInput.files || [];
      importBackup(file);
      els.importBackupInput.value = "";
    });

    els.listForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitListForm();
    });
    els.closeListDialogButton.addEventListener("click", () => closeDialog(els.listDialog));
    els.cancelListDialogButton.addEventListener("click", () => closeDialog(els.listDialog));

    els.themeGrid.addEventListener("change", (event) => {
      const input = event.target.closest('input[name="themePreset"]');
      if (!input) {
        return;
      }
      const list = getActiveList();
      const theme = THEME_MAP.get(input.value);
      if (!theme) {
        return;
      }
      list.config.theme = theme.id;
      list.config.customColors = {
        enabled: false,
        ...theme.palette,
      };
      persistState(true);
      renderAll();
    });

    els.configSelects.forEach((select) => {
      select.addEventListener("change", () => {
        const list = getActiveList();
        setPath(list.config, select.dataset.configSelect, select.value);
        persistState(true);
        renderAll();
      });
    });

    els.configToggles.forEach((toggle) => {
      toggle.addEventListener("change", () => {
        const list = getActiveList();
        setPath(list.config, toggle.dataset.configToggle, toggle.checked);
        persistState(true);
        renderAll();
      });
    });

    els.colorInputs.forEach((input) => {
      input.addEventListener("input", () => {
        const list = getActiveList();
        const key = input.dataset.colorKey;
        list.config.customColors[key] = input.value;
        list.config.customColors.enabled = true;
        const output = els.colorOutputs.find((item) => item.dataset.colorOutput === key);
        if (output) {
          output.textContent = input.value;
        }
        applyAppearance();
        updateContrastStatus();
        window.clearTimeout(colorSaveTimer);
        colorSaveTimer = window.setTimeout(() => {
          persistState(true);
          renderAll();
        }, 250);
      });
    });

    els.textSettings.addEventListener("input", (event) => {
      const control = event.target.closest("[data-ui-text-key]");
      if (!control) {
        return;
      }
      const list = getActiveList();
      list.config.uiText[control.dataset.uiTextKey] = control.value;
      persistState(true);
      renderAll({ syncAppearance: false });
    });

    els.resetAppearanceButton.addEventListener("click", requestResetAppearance);
    els.resetTextButton.addEventListener("click", requestResetText);

    els.confirmCancelButton.addEventListener("click", () => {
      confirmAction = null;
      closeDialog(els.confirmDialog);
    });
    els.confirmActionButton.addEventListener("click", () => {
      const action = confirmAction;
      confirmAction = null;
      closeDialog(els.confirmDialog);
      if (typeof action === "function") {
        action();
      }
    });

    [els.dataDialog, els.listDialog, els.confirmDialog].forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
          closeDialog(dialog);
        }
      });
    });

    els.confirmDialog.addEventListener("close", () => {
      confirmAction = null;
    });

    document.addEventListener("keydown", (event) => {
      if (els.dataDialog.open && (event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        els.dataForm.requestSubmit();
        return;
      }

      const dialogOpen = els.dataDialog.open || els.listDialog.open || els.confirmDialog.open;
      if (!focusMode || dialogOpen) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setFocusMode(false);
        return;
      }

      const interactiveTarget = event.target.closest?.(
        "button, a, input, textarea, select, [contenteditable='true']",
      );
      if (event.code === "Space" && !interactiveTarget) {
        event.preventDefault();
        handleDrawRequest();
      }
    });

    document.addEventListener("fullscreenchange", () => {
      if (focusMode && !document.fullscreenElement) {
        setFocusMode(false, { syncFullscreen: false });
      }
    });

    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY && event.key !== LEGACY_STORAGE_KEY) {
        return;
      }
      state = loadState();
      renderAll();
    });

    window.addEventListener("hashchange", () => {
      const view = getViewFromLocation();
      if (focusMode && view !== "draw") {
        setFocusMode(false);
      }
      activeView = view;
      renderView();
      if (view === "appearance") {
        syncAppearanceControls();
      }
    });
  }

  renderThemeChoices();
  buildTextSettings();
  bindEvents();
  renderAll();
  if (migratedFromV1) {
    persistState(true, { touch: false });
  }
})();
