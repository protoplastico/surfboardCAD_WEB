const APP_BUILD_VERSION = (() => {
  if (typeof document === "undefined") return "dev";
  const script = Array.from(document.scripts || []).find(item => {
    const src = item?.getAttribute?.("src") || item?.src || "";
    return /(?:^|\/)app\.js(?:\?|$)/.test(src);
  });
  if (!script) return "dev";
  try {
    const url = new URL(script.src || script.getAttribute("src") || "", window.location.href);
    return url.searchParams.get("v") || "dev";
  } catch {
    return "dev";
  }
})();

const state = {
  board: null,
  view: "outline",
  tool: "edit",
  currentSectionIndex: -1,
  copiedCrossSection: null,
  sectionCells: [],
  viewOptions: {
    showGrid: true,
    showGhostBoard: true,
    showControlPoints: true,
    showCurvature: true,
    showNonActiveCrossSections: true,
    showBaseLine: true,
    showCenterLine: true,
    showCrossSectionPositions: true,
    showSlidingInfo: true,
    showSlidingCrossSection: true,
    showVolumeDistribution: true,
    showCenterOfMass: true,
    showOverBottomCurveMeasurements: true,
    showMomentOfInertia: true,
    showFlowlines: true,
    showApexLine: true,
    showTuckUnderLine: true,
    showFootMarks: false,
    showGuidePoints: true,
    useFill: true,
    viewBlank: false,
    showDeckToolpath: false,
    showBottomToolpath: false,
    show3DShaded: false,
    show3DMoire: true
  },
  editLocks: {
    x: false,
    y: false,
    z: false
  },
  flipped: false,
  quadActivePane: "outline",
  quadPanes: [],
  editHandles: [],
  guidePointHandles: [],
  finHandles: [],
  wingHandles: [],
  bottomFeatureHandles: [],
  bottomFeatureSectionHandles: [],
  selection: null,
  guidePointSelection: null,
  wingSelection: null,
  bottomFeatureSelection: null,
  lastEditPoint: null,
  contextEditPoint: null,
  cursorPoint: null,
  cursorScreen: null,
  pointerTransforms: {},
  navigationGuardInstalled: false,
  drag: null,
  viewDrag: null,
  drawingCanvas: false,
  view2d: {
    zoom: 1,
    panX: 0,
    panY: 0
  },
  geometryRevision: 0,
  flowlineCache: {
    revision: -1,
    lines: new Map()
  },
  tailOnlyPlanformCache: new WeakMap(),
  tailPlanformCache: new WeakMap(),
  parameterCache: {
    revision: -1,
    areas: new Map(),
    volumeSamples: new Map(),
    scalar: new Map(),
    volume: null,
    centerOfMass: null
  },
  crossSectionCache: {
    revision: -1,
    rawByBoard: new WeakMap(),
    displayByBoard: new WeakMap(),
    surfaceByBoard: new WeakMap(),
    angleContextByBoard: new WeakMap()
  },
  selectedGuidePointIndex: -1,
  weightInputs: null,
  crossSectionInterpolation: "sblend",
  language: "ja",
  dialog: {
    mode: "message",
    onSubmit: null,
    keepOpenOnSuccess: false,
    pendingDraw: false,
    scrollX: 0,
    scrollY: 0
  },
  model3d: {
    active: false,
    mode: "none",
    closed: true,
    segmentCount: 14,
    pointCount: 6,
    camera: {
      yaw: -0.72,
      pitch: -0.46,
      zoom: 1,
      panX: 0,
      panY: 0,
      preset: "iso"
    },
    interactionUntil: 0,
    interactionTimer: null,
    bridge: {
      enabled: true,
      url: "http://127.0.0.1:8766/state",
      statusUrl: "http://127.0.0.1:8766/status",
      connected: false,
      lastError: "",
      deviceName: "",
      pollTimer: null,
      pollInFlight: false,
      animationFrame: null,
      lastSampleAt: 0,
      lastFrameAt: 0,
      lastButtons: [],
      state: {
        tx: 0,
        ty: 0,
        tz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        buttons: []
      },
      settings: {
        preset: "fusion",
        deadzone: 0.1,
        rotationSpeed: 1.75,
        panSpeed: 210,
        zoomSpeed: 0.85,
        dominantAxis: true,
        invertPitch: false,
        invertPanY: false,
        invertZoom: false,
        buttonMap: {
          "1": "fit",
          "2": "view-iso",
          "3": "render-cycle",
          "4": "view-top"
        }
      }
    },
    worldCache: {
      revision: -1,
      key: "",
      lines: []
    },
    projectedCache: {
      revision: -1,
      key: "",
      lines: []
    },
    surfaceFaceCache: {
      revision: -1,
      key: "",
      faces: []
    },
    shadedProjectionCache: {
      revision: -1,
      key: "",
      faces: [],
      bounds: null
    },
    moireProjectionCache: {
      revision: -1,
      key: "",
      lines: []
    }
  },
  toolpathPreviewCache: {
    revision: -1,
    key: "",
    paths: [],
    projectedRevision: -1,
    projectedKey: "",
    projectedPaths: []
  },
  history: {
    undo: [],
    redo: []
  },
  ghost: {
    board: null,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    active: false
  },
  probeScanGCode: "",
  cncGCode: "",
  probeMeasurements: [],
  serial: {
    port: null,
    availablePorts: [],
    reader: null,
    writer: null,
    connected: false,
    buffer: "",
    currentProbePoint: null,
    ackResolvers: [],
    statusTimer: null
  },
  scan: {
    active: false,
    nose: null,
    tail: null,
    currentPosition: null,
    lastStatus: "",
    lastPositionTime: 0,
    simulation: {
      segments: [],
      index: 0,
      progress: 0,
      playing: false,
      frame: null,
      lastTime: 0
    }
  },
  traceImages: {
    outline: null,
    profile: null
  },
  controlPointPanelUpdating: false
};

const I18N = {
  ja: {
    app_title: "BoardCAD Web",
    status_load_brd: ".brdファイルを読み込んでください。",
    menu_file: "ファイル",
    menu_edit: "編集",
    menu_view: "表示",
    menu_cross_sections: "断面",
    menu_board: "ボード",
    menu_misc: "その他",
    menu_3d_model: "3Dモデル",
    menu_scan: "スキャン",
    menu_help: "ヘルプ",
    menu_sample: "サンプル",
    new: "新規作成",
    open: "開く",
    open_ghost: "ゴーストを開く",
    open_selected_sample: "選択中のサンプルを開く",
    sample_shortboard: "ショートボード",
    sample_funboard: "ファンボード",
    sample_longboard: "ロングボード",
    scan_new_board: "新規ボードをスキャン",
    print_pdf: "印刷 / PDF図面",
    print_templates_pdf: "テンプレートPDFを印刷",
    dxf_outline_spline: "DXFアウトライン スプライン",
    dxf_profile_spline: "DXFプロファイル スプライン",
    dxf_cross_section_spline: "DXF断面 スプライン",
    dxf_outline_polyline: "DXFアウトライン ポリライン",
    dxf_profile_polyline: "DXFプロファイル ポリライン",
    dxf_cross_section_polyline: "DXF断面 ポリライン",
    gcode_laser_outline: "レーザーカッター用Gコード",
    gcode_cnc: "CNC用Gコード",
    save_brd: "BRDを保存",
    save_brd_as: "BRDに名前を付けて保存",
    export_outline_otl: "アウトラインを書き出し (.otl)",
    export_profile_pfl: "プロファイルを書き出し (.pfl)",
    undo: "元に戻す",
    redo: "やり直す",
    add_control_point: "コントロールポイントを追加",
    delete_control_points: "コントロールポイントを削除",
    outline: "アウトライン",
    profile: "プロファイル",
    quad: "4分割表示",
    toolpath: "ツールパス",
    fit: "全体表示",
    show_grid: "グリッドを表示",
    show_ghost_board: "ゴーストボードを表示",
    show_control_points: "コントロールポイントを表示",
    show_curvature: "曲率を表示",
    show_non_active_cross_sections: "非アクティブ断面を表示",
    show_base_line: "ベースラインを表示",
    show_center_line: "センターラインを表示",
    show_cross_section_positions: "断面位置を表示",
    show_sliding_info: "スライド情報を表示",
    show_sliding_cross_section: "スライド断面を表示",
    show_volume_distribution: "容積分布を表示",
    show_center_of_mass: "重心を表示",
    show_over_bottom_curve_measurements: "ボトム曲線長を表示",
    show_moment_of_inertia: "慣性モーメントを表示",
    show_flowlines: "フローラインを表示",
    show_apex_line: "Apexラインを表示",
    show_tuck_under_line: "タックアンダーラインを表示",
    show_foot_marks: "フットマークを表示",
    show_guide_points: "ガイドポイントを表示",
    use_fill: "塗りつぶしを使用",
    show_3d_shaded: "3D白レンダリング",
    show_3d_moire: "3Dモアレ縞",
    next_cross_section: "次の断面",
    previous_cross_section: "前の断面",
    add_cross_section: "断面を追加",
    move_cross_section: "断面を移動",
    remove_cross_section: "断面を削除",
    copy_cross_section: "断面をコピー",
    paste_cross_section: "断面を貼り付け",
    import_cross_section: "断面を読み込み",
    export_cross_section: "断面を書き出し",
    scale_current_board: "現在のボードを拡大縮小",
    scale_ghost_to_current: "ゴーストを現在のボード寸法に合わせる",
    info: "情報",
    tail: "テール",
    nose: "ノーズ",
    wing: "ウィング",
    fins: "フィン",
    guide_points: "ガイドポイント",
    weight_calculator: "重量計算",
    flip: "反転",
    settings: "設定",
    settings_prompt: "入力で指定",
    curve_segments_setting: "曲線分割",
    model_length_segments_setting: "3D長手分割",
    model_width_points_setting: "3D幅ポイント数",
    bridge_enabled_setting: "3Dマウスブリッジ",
    bridge_preset_setting: "3Dマウス プリセット",
    bridge_preset_generic: "標準",
    bridge_preset_blender: "Blender風",
    bridge_preset_fusion: "Fusion風",
    bridge_deadzone_setting: "3Dマウス デッドゾーン",
    bridge_rotation_speed_setting: "3Dマウス 回転速度",
    bridge_pan_speed_setting: "3Dマウス 平行移動速度",
    bridge_zoom_speed_setting: "3Dマウス ズーム速度",
    bridge_dominant_axis_setting: "支配軸のみ",
    bridge_invert_pitch_setting: "ピッチ反転",
    bridge_invert_pan_y_setting: "縦パン反転",
    bridge_invert_zoom_setting: "ズーム反転",
    bridge_button1_setting: "3Dマウス ボタン1",
    bridge_button2_setting: "3Dマウス ボタン2",
    bridge_button3_setting: "3Dマウス ボタン3",
    bridge_button4_setting: "3Dマウス ボタン4",
    bridge_button_action_none: "なし",
    bridge_button_action_fit: "全体表示",
    bridge_button_action_view_iso: "アイソメ視点",
    bridge_button_action_view_top: "真上視点",
    bridge_button_action_view_outline: "アウトライン視点",
    bridge_button_action_view_profile: "プロファイル視点",
    bridge_button_action_render_cycle: "表示モード切替",
    bridge_button_action_render_wire: "ワイヤー表示",
    bridge_button_action_render_shaded: "白レンダリング",
    bridge_button_action_render_moire: "モアレ縞",
    model_shaded_render_setting: "3D白レンダリング",
    model_moire_setting: "モアレ縞表示",
    apply_settings: "適用",
    language: "言語",
    language_japanese: "日本語",
    language_english: "英語",
    language_prompt: "入力で指定",
    dialog_language_title: "言語",
    dialog_guide_point_add_title: "ガイドポイントを追加",
    dialog_guide_point_edit_title: "ガイドポイントを編集",
    dialog_guide_point_remove_title: "ガイドポイントを削除",
    guide_point_target: "対象",
    guide_point_index_label: "ガイドポイント番号",
    dialog_scale_board_title: "ボードを拡大縮小",
    scale_bottom_rocker_option: "ボトムロッカーも同時にスケール",
    scale_fins_option: "フィンもスケール",
    controlpoint_interpolation: "ControlPoint補間",
    sblend_interpolation: "S-Blend補間",
    create_3d_bezier_patches: "Bezierパッチから3Dモデルを生成",
    approx_from_bezier_closed: "Bezierから近似（閉じたモデル）",
    approx_from_bezier_open: "Bezierから近似（開いたモデル）",
    approx_outline_rocker: "アウトラインとロッカーから近似",
    clear_approximation: "近似をクリア",
    view_3d: "3D表示",
    edit_nurbs_surface: "NURBSサーフェスを編集",
    set_tail_point: "テール点を設定",
    set_nose_point: "ノーズ点を設定",
    return_to_tail: "テールへ戻る",
    read_current_position: "現在位置を読む",
    generate_probe_gcode: "プローブGコードを生成",
    fit_profile_from_scan: "スキャンからプロファイルへ反映",
    fit_outline_from_scan: "スキャンからアウトラインへ反映",
    fit_cross_section_from_scan: "スキャンから断面へ反映",
    online_help: "オンラインヘルプ",
    about_boardcad: "BoardCADについて",
    tool_edit: "編集",
    tool_zoom: "ズーム",
    tool_pan: "パン",
    tool_spot_check: "スポット計測",
    shortcuts: "ショートカット",
    shortcut_view: "1-7 View",
    shortcut_tool: "E/Z/P Tool",
    shortcut_fit: "F/0 Fit",
    shortcut_zoom: "+/- Zoom",
    shortcut_move: "Arrows Move/Pan",
    shortcut_ghost: "Hold G + Arrows/Q/W Ghost",
    shortcut_fine: "Alt fine",
    shortcut_remove: "Del Remove",
    shortcut_context: "Right click menu",
    shortcut_3d: "3D I/T/O/R, WASD, Ctrl/Cmd+1/3/7",
    board_unloaded: "未読み込み",
    ghost_only_loaded: "Ghostのみ読み込み",
    section_unselected: "未選択",
    panel_unloaded: "未読み込み",
    board_panel_summary: "長さ {length} / 幅 {width} / 厚み {thickness}{tailText}{noseText}{wingText}",
    board_panel_tail: " / テール {shape} L{length}{depthPart} S{shoulder} W{width} B{blend} 幅 {widthAdjust}%",
    board_panel_nose: " / ノーズ {shape} L{length} 幅 {widthAdjust}%",
    board_panel_wing: " / ウィング {preset} {shape} P{position} W{width}{bumpPart}",
    board_panel_depth_part: " D{depth}",
    board_panel_bump_part: " S{shoulder} T{transition}",
    bottom: "ボトム",
  bottom_feature_none: "ボトム形状: 0",
  bottom_feature_summary: "ボトム形状: {count} / 有効 {activeCount} / {preset} / 選択 {selected} / 影響断面 {affectedCount} ({range})",
  fill_feature_sections: "範囲断面追加",
  bottom_feature_selected: "{index}. {label}",
  bottom_feature_meta_depth: "深さ {value}",
  bottom_feature_meta_center_rail: "C {center} / R {rail}",
  bottom_feature_meta_rail: "R {rail}",
  bottom_feature_meta_width: "幅 {value}",
  bottom_feature_meta_edge: "エッジ {value}",
  bottom_feature_meta_offset: "オフセット {value}",
  bottom_feature_meta_spacing_count: "間隔 {spacing} / 本数 {count}",
  bottom_feature_meta_longitudinal: "長手 {value}",
  bottom_preset: "プリセット",
  apply_preset: "プリセット適用",
  bottom_preset_displacement_hull: "ディスプレイスメントハル",
  bottom_preset_longboard_rolled_vee: "ロングボード ロールドVee",
  bottom_preset_shortboard_single_to_double: "ショートボード シングル→ダブル",
  bottom_preset_shortboard_single_to_vee: "ショートボード シングル→Vee",
  bottom_preset_performance_channel_quad: "パフォーマンス チャネルクアッド",
    bottom_feature_index: "フィーチャー",
    enabled: "有効",
    bottom_feature_type: "形状タイプ",
    bottom_feature_start: "テールから開始位置",
    bottom_feature_peak: "テールから最大効果位置",
    bottom_feature_end: "テールから終了位置",
    bottom_feature_depth: "深さ (max 5mm)",
    bottom_feature_center_depth: "センター深さ (max 5mm)",
    bottom_feature_rail_depth: "レール深さ (max 5mm)",
    bottom_feature_rail_lock_cm: "レール保護距離 (cm)",
    bottom_feature_width: "幅比率",
    bottom_feature_blend: "ブレンド",
    bottom_feature_power: "カーブ係数",
    bottom_feature_edge: "エッジ強さ",
    bottom_feature_offset: "オフセット比率",
  bottom_feature_spacing: "間隔比率",
  bottom_feature_count: "本数",
  bottom_feature_longitudinal_flat: "長手フラット度",
  reset: "リセット",
    duplicate: "複製",
    move_up: "上へ",
    move_down: "下へ",
    bottom_type_single_concave: "シングルコンケーブ",
    bottom_type_double_concave: "ダブルコンケーブ",
    bottom_type_vee: "Vee",
    bottom_type_spiral_vee: "スパイラルVee",
    bottom_type_hull: "ハル",
    bottom_type_displacement_hull: "ディスプレイスメントハル",
    bottom_type_channel: "チャネル",
    output_settings: "出力設定",
    weight: "重量",
    trace_image: "トレース画像",
    controlpoint: "コントロールポイント",
    cnc_probe_scan: "CNCプローブスキャン",
    cross_section: "断面",
    sample_select_aria: "サンプル",
    boardcad_menus: "BoardCADメニュー",
    boardcad_tools: "BoardCADツール",
    keyboard_shortcuts: "キーボードショートカット",
    close: "閉じる",
    x_locked: "X固定",
    y_locked: "Y固定",
    z_locked: "Z固定",
    view_blank: "ブランクを表示",
    view_deck_toolpath: "デッキ側ツールパスを表示",
    view_bottom_toolpath: "ボトム側ツールパスを表示",
    toggle_deck_bottom: "デッキ/ボトム切替",
    add_guide_point: "ガイドポイントを追加",
    edit_guide_point: "ガイドポイントを編集",
    delete_guide_point: "ガイドポイントを削除",
    add_controlpoint: "コントロールポイントを追加",
    delete_controlpoints: "コントロールポイントを削除",
    make_continuous: "連続/コーナー切替",
    tail_shape: "テール形状",
    tail_length: "テール長",
    tail_depth: "テール深さ",
    shoulder_pos: "ショルダー位置",
    shoulder_width: "ショルダー幅",
    join_blend: "接続ブレンド",
    tail_width: "テール幅",
    set_tail: "テールを設定",
    nose_shape: "ノーズ形状",
    nose_length: "ノーズ長",
    nose_width: "ノーズ幅",
    set_nose: "ノーズを設定",
    wing_preset: "ウィングプリセット",
    none: "なし",
    custom: "カスタム",
    distance_from_tail: "テールからの距離",
    wing_width: "ウィング幅",
    wing_shape: "ウィング形状",
    shoulder_coeff: "ショルダー係数",
    transition_coeff: "遷移係数",
    set_wing: "ウィングを設定",
    type: "タイプ",
    template: "テンプレート",
    fin_setup: "フィンセット",
    line_only: "線のみ",
    fcs_plugs: "FCSプラグ",
    fcsii_box: "FCS IIボックス",
    single_fin_box: "シングルフィンボックス",
    single_fin: "シングルフィン",
    twin_fish: "ツインフィッシュ",
    twin_performance: "ツインパフォーマンス",
    thruster: "スラスター",
    quad_fin: "クワッド",
    five_fin: "5フィン",
    bonzer: "ボンザー",
    side_rear: "サイド後",
    side_front: "サイド前",
    center_rear_front: "センター前後",
    depth_splay: "深さ / スプレー",
    side_splay: "サイドスプレー",
    toe_in_cant: "トーイン / カント",
    set_fins: "フィンを設定",
    stringer_width: "ストリンガー幅",
    stringer_density: "ストリンガー密度",
    foam_density: "フォーム密度",
    deck_glass: "デッキクロス",
    deck_lap_width: "デッキラップ幅",
    bottom_glass: "ボトムクロス",
    bottom_lap_width: "ボトムラップ幅",
    resin_ratio: "レジン比率",
    hotcoat: "ホットコート",
    plugs_plus_fins: "プラグ + フィン",
    defaults: "既定値",
    calc: "計算",
    weight_placeholder: "Weight: -",
    trace_image_center_x: "トレース画像中心X",
    trace_image_center_y: "トレース画像中心Y",
    trace_move_controls: "トレース画像移動",
    controlpoint_info: "コントロールポイント情報",
    tangent_previous_x: "前タンジェントX",
    tangent_previous_y: "前タンジェントY",
    tangent_next_x: "次タンジェントX",
    tangent_next_y: "次タンジェントY",
    continuous: "連続",
    set: "設定",
    cnc_probe_scan_aria: "CNCプローブスキャン",
    jog_step_mm: "ジョグ幅 mm",
    jog_feed_mm_min: "ジョグ送り mm/分",
    pos: "位置取得",
    serial_port_ja: "シリアルポート",
    no_port_selected_connect: "未選択 / Connectで選択",
    scan_method: "スキャン方式",
    stringer_ribs: "ストリンガー + リブ",
    mesh_grid: "メッシュグリッド",
    outline_side_probe: "アウトライン側面プローブ",
    half_cross_section: "ハーフ断面",
    scan_surface: "スキャン面",
    hull: "ハル",
    deck_label: "デッキ",
    hull_deck: "ハル + デッキ",
    x_step_mm: "X間隔 mm",
    y_step_mm: "Y間隔 mm",
    measured_board_length_mm: "実測ボード長 mm",
    machine_x_travel_mm: "機械X可動範囲 mm",
    machine_y_center_mm: "機械Yセンター mm",
    probe_travel_mm: "プローブ下降量 mm",
    probe_feed_mm_min: "プローブ送り mm/分",
    serial_baud: "シリアルbaud",
    cnc_sender_log: "CNC送信ログ",
    current_cross_section_short: "現在の断面",
    import: "読み込み",
    export: "書き出し",
    move: "移動",
    previous_short: "前",
    next_short: "次",
    unit_label: "単位",
    gcode_feed_rate_label: "Gコード送り速度",
    laser_power_label: "レーザー出力 S",
    cnc_axes_label: "CNC軸数",
    cnc_surface_label: "CNC面",
    cnc_length_steps_label: "CNC長手分割",
    cnc_width_steps_label: "CNC幅分割",
    safe_z_label: "安全Z",
    curve_segments_label: "曲線分割",
    cm_to_mm: "cm → mm",
    inch_to_mm: "inch → mm",
    input_as_mm: "入力値をmm扱い",
    axis4_xyz_a: "4軸 X/Y/Z/A",
    axis5_xyz_ab: "5軸 X/Y/Z/A/B",
    fit_profile_from_scan_button: "スキャンからプロファイルへ反映",
    fit_outline_from_scan_button: "スキャンからアウトラインへ反映",
    fit_cross_section_from_scan_button: "スキャンから断面へ反映",
    generate_button: "生成",
    save_button: "保存",
    simulate_button: "シミュレート",
    pause_button: "一時停止",
    step_button: "ステップ",
    reset_button: "リセット",
    send_cnc_button: "CNCへ送信",
    build_brd_button: "BRDを生成",
    save_csv_button: "CSVを保存",
    summary_outline_initial: "アウトライン: 0点",
    summary_bottom_initial: "ロッカー: 0点",
    summary_deck_initial: "デッキ: 0点",
    summary_sections_initial: "断面: 0",
    edit_summary_initial: "編集: 未選択",
    jog_controller: "ジョグコントローラー",
    target_view: "対象ビュー",
    load_image: "画像を読み込む",
    show_image: "画像を表示",
    opacity: "不透明度",
    scale: "拡大率",
    rotation_deg: "回転角度",
    center: "中心",
    move_step: "移動量",
    up: "上",
    left: "左",
    right: "右",
    down: "下",
    center_button: "中央へ",
    fit_to_board: "ボードに合わせる",
    clear: "クリア",
    no_image_loaded: "画像未読み込み",
    target: "対象",
    current_cross_section: "現在の断面",
    add: "追加",
    edit: "編集",
    remove: "削除",
    position_not_connected: "位置: 未接続",
    position_waiting: "位置: コントローラ待機中",
    scan_position_current: "位置 {state}: X{x} Y{y} Z{z}",
    scan_position_tail_basis: "テール基準 X{x}",
    scan_position_nose: "ノーズ X{x} Y{y} Z{z}",
    scan_position_tail_origin: "テール原点 X{x} Y{y} Z{z}",
    scan_position_length: "長さ {length}",
    serial_port: "シリアルポート",
    not_selected_connect: "未選択 / Connectで選択",
    refresh_ports: "ポート一覧を更新",
    choose_port: "ポートを選択",
    connect: "接続",
    disconnect: "切断",
    serial_not_connected: "シリアル未接続です。",
    web_serial_unavailable: "Web Serial APIは利用できません。Chrome/EdgeでHC-05のシリアルポートを選択してください。",
    web_serial_unavailable_short: "Web Serial APIは利用できません。",
    no_authorized_ports: "許可済みポートなし",
    serial_connected: "シリアル接続 @ {baudRate}",
    serial_connect_failed: "シリアル接続失敗: {message}",
    serial_port_selected: "シリアルポートを選択しました。",
    serial_port_selection_cancelled: "シリアルポート選択をキャンセルしました: {message}",
    serial_disconnected: "シリアル切断",
    serial_read_failed: "シリアル受信失敗: {message}",
    log_manual: "手動送信 {label}",
    log_generated_probe_scan: "プローブスキャン生成: {lineCount}行 / シミュレーション {moveCount}移動",
    log_scan_nose: "スキャンノーズ X{x} Y{y} Z{z}",
    log_scan_tail: "スキャンテール X{x} Y{y} Z{z} LENGTH{length}",
    log_measure: "計測 {surface} X{x} Y{y} Z{z} MX{machineX} MY{machineY}",
    log_sending_gcode: "{label}送信: {lineCount}行",
    log_send_complete: "送信完了: {label}",
    send: "送信",
    scan_setup: "スキャン設定",
    probe_serial_settings: "Probe / serial settings",
    generate: "生成",
    save: "保存",
    simulate: "シミュレーション",
    pause: "一時停止",
    step: "ステップ",
    reset: "リセット",
    send_cnc: "Send CNC",
    build_brd: "Build BRD",
    save_csv: "Save CSV",
    unit: "単位",
    gcode_feed_rate: "Gコード送り速度",
    laser_power_s: "レーザー出力 S",
    cnc_axes: "CNC軸数",
    cnc_surface: "CNC面",
    cnc_length_steps: "CNC長手分割",
    cnc_width_steps: "CNC幅分割",
    safe_z: "安全Z",
    curve_segments: "曲線分割",
    position_from_tail: "テールからの位置",
    section_interval: "断面間隔",
    previous: "前へ",
    next: "次へ",
    copy: "コピー",
    paste: "貼り付け",
    fill_sections: "断面追加",
    add_guide: "ガイドを追加",
    edit_guide: "ガイドを編集",
    remove_guide: "ガイドを削除",
    cancel: "キャンセル",
    dialog_cross_section_add_title: "断面を追加",
    dialog_cross_section_move_title: "断面を移動",
    dialog_settings_title: "設定",
    dialog_submit_failed: "入力値を確認してください。",
    summary_outline: "アウトライン",
    summary_bottom: "ロッカー",
    summary_deck: "デッキ",
    summary_sections: "断面",
    summary_points: "点",
    summary_tail: "テール",
    summary_nose: "ノーズ",
    summary_wing: "ウィング",
    summary_ghost: "ゴースト",
    summary_tail_entry: "{label}: {shape} L{length}{depthPart} S{shoulder} W{width} B{blend} 幅 {widthAdjust}%",
    summary_nose_entry: "{label}: {shape} L{length} S{shoulder} W{width} B{blend} 幅 {widthAdjust}%",
    summary_wing_entry: "{label}: {preset} {shape} P{position} W{width}{bumpPart}",
    summary_ghost_entry: "{label}: {name}",
    summary_depth_part: " D{depth}",
    summary_bump_part: " S{shoulder} T{transition}",
    help_title: "BoardCAD Web 操作ヘルプ",
    help_edit: "編集: コントロールポイント / ガイドポイントを選択・ドラッグ",
    help_zoom: "ズーム: クリックで拡大、Shift/Option+クリックで縮小",
    help_pan: "パン: ドラッグで表示移動",
    help_fit: "全体表示: 表示範囲へ全体を合わせる",
    help_spot: "スポット計測: クリック位置の寸法を表示",
    help_context: "右クリック: 点の追加・編集・削除、表示切替",
    help_keys: "1-7: ビュー切替 / E-Z-P: ツール切替 / Fまたは0: Fit",
    status_help_shown: "操作ヘルプを表示しました。",
    about_text: "BoardCAD Web\nJava版BoardCADのブラウザ移植版",
    status_about: "BoardCAD Web の情報を表示しました。",
    status_settings_updated: "設定を更新しました。",
    prompt_curve_segments: "曲線分割数",
    prompt_3d_length_segments: "3Dモデルの長手分割数",
    prompt_3d_width_points: "3Dモデルの幅方向ポイント数",
    prompt_language: "言語 (en / ja)",
    status_language_invalid: "言語は en または ja を指定してください。",
    status_language_ja: "言語を日本語に設定しました。",
    status_language_en: "言語を英語に設定しました。",
    status_flip_on: "Board表示を反転しました。",
    status_flip_off: "Board表示の反転を解除しました。",
    interpolation_controlpoint: "コントロールポイント補間",
    interpolation_sblend: "S-Blend補間",
    status_interpolation: "断面補間: {label}",
    section_summary: "#{index} / 位置 {position} / 幅 {width} / 厚み {thickness} / リリース {release}deg / タックR {tuck}",
    edit_selected_guide_point: "{prefix}: {label} ガイドポイント #{index}{target}",
    edit_selected_guide_point_coords: "X {x} / Y {y}",
    edit_selected_wing: "{prefix}: ウィング {kind}{target}",
    edit_selected_wing_values: "位置 {position} / 幅 {width}{bumpPart} / 形状 {shape}",
    edit_wing_bump_part: " / ショルダー {shoulder} / 遷移 {transition}",
    edit_selection_continuous: "連続: {value}",
    guide_list_empty: "ガイドポイント: 0",
    guide_list_item: "{marker}{index}: X {x} / Y {y}",
    continuous_true_label: "はい",
    continuous_false_label: "いいえ",
    weight_output_foam_volume: "フォーム体積: {value} cc",
    weight_output_stringer_volume: "ストリンガー体積: {value} cc",
    weight_output_deck_area: "デッキ面積: {value} cm2",
    weight_output_bottom_area: "ボトム面積: {value} cm2",
    weight_output_glass: "クロス重量: {value} kg",
    weight_output_resin: "レジン重量: {value} kg",
    weight_output_total: "合計: {value} kg",
    status_tool_edit: "編集: コントロールポイント / ガイドポイントを選択して編集します。",
    status_tool_zoom: "ズーム: クリックで拡大、ShiftまたはOption+クリックで縮小します。",
    status_tool_pan: "パン: 図面をドラッグして移動します。",
    status_tool_spot: "スポット計測: 図面上をクリックして寸法を確認します。",
    board_info_name: "名前",
    board_info_file: "ファイル",
    board_info_length: "長さ",
    board_info_max_width: "最大幅",
    board_info_center_width: "センター幅",
    board_info_max_thickness: "最大厚",
    board_info_center_thickness: "センター厚",
    board_info_volume: "体積",
    board_info_center_of_mass: "重心",
    board_info_outline_cp: "アウトライン制御点",
    board_info_bottom_cp: "ボトム制御点",
    board_info_deck_cp: "デッキ制御点",
    board_info_cross_sections: "断面数",
    status_new_board_created: "新規ボードを作成しました。",
    status_load_failed: "読み込みに失敗しました: {message}",
    status_board_loaded: "{filename}を読み込みました。",
    status_ghost_loaded: "{filename}をGhost boardとして読み込みました。",
    status_ghost_load_failed: "Ghost boardの読み込みに失敗しました: {message}",
    status_sample_fetch_failed_localhost: "サンプルを読み込めませんでした。http://localhost:8788/ から開いてください。",
    status_sample_fetch_failed_file: "サンプルを読み込めませんでした。ファイル選択から.brdを指定してください。",
    status_sample_defaults_applied: "{filename}を読み込みました。テール形状: {tail}",
    status_scan_length_required: "新規ボードスキャンでは、先にテールからノーズまでの実測ボード長を入力してください。",
    status_probe_gcode_generated: "プローブスキャン用Gコードを生成しました。送信前に保存して内容を確認してください。",
    status_probe_simulation_empty: "シミュレーションできる移動指令がありません。",
    status_probe_simulation_ready: "プローブシミュレーション: {moves} 移動",
    status_probe_simulation_paused: "プローブシミュレーションを一時停止しました。",
    status_probe_simulation_resumed: "プローブシミュレーションを再開しました。",
    status_probe_simulation_step: "プローブシミュレーション ステップ: {point}",
    status_probe_simulation_finished: "プローブシミュレーションが完了しました。",
    status_scan_start: "新規ボードスキャン: テール先端をワーク原点 X0 に合わせ、現在位置を取得してテール点設定を押してください。次にノーズ先端へ移動してノーズ点設定で実測長を確定します。",
    status_scan_position_missing: "現在位置が取得できていません。接続後にPOSを押してください。",
    status_scan_nose_set_with_length: "ノーズ点を設定しました。実測ボード長 {length} mm を使います。テール原点 X0 に戻って生成してください。",
    status_scan_nose_set_without_length: "ノーズ点を設定しました。ジョグでテール先端へ戻り、テール点設定でテール原点を確定してください。",
    status_scan_tail_set_with_length: "テール点を設定しました。実測ボード長 {length} mm を使います。テール原点 X0 に戻って生成してください。",
    status_scan_tail_set_without_length: "テール点を設定しました。ジョグでノーズ先端まで移動してノーズ点設定を押してください。",
    status_scan_brd_points_missing: "BRD化にはプローブ測定点が不足しています。",
    status_scan_brd_built: "プローブ測定点から初期BRDを生成しました。必要に応じてコントロールポイントを編集してください。",
    status_scan_brd_build_failed: "スキャンBRD生成に失敗しました: {message}",
    status_scan_profile_points_missing: "プロファイル化にはボトム/デッキ両方のスパイン測定点が必要です。",
    status_scan_temp_board_failed: "スキャンゴースト反映用の仮ボードを生成できませんでした。",
    status_scan_profile_brd_built: "スキャンゴーストから初期BRDを生成しました。",
    status_scan_profile_fit_applied: "スキャンゴースト点列に沿ってボトム/デッキのコントロールポイント列を更新しました。",
    status_scan_outline_points_missing: "アウトライン化には outline-right / outline-left 測定点が必要です。",
    status_scan_outline_built: "スキャンゴーストから初期アウトラインを生成しました。",
    status_scan_outline_fit_applied: "スキャンゴースト点列に沿ってアウトラインのコントロールポイント列を更新しました。",
    status_scan_section_requires_board: "断面化には編集中のボードと断面が必要です。",
    status_scan_section_points_missing: "断面化には同一X位置の cross-half 測定点が3点以上必要です。",
    status_scan_section_fit_applied: "cross-half 測定点から現在断面を更新しました。X {x} mm / RMS {rms} / Max {max}",
    status_fit_3d: "3D表示を全体表示に合わせました。",
    status_fit_2d: "2D表示を全体表示に合わせました。",
    status_3d_view_preset: "3D視点: {preset}",
    status_navigation_guard_back: "このタブではブラウザの戻る/進むを抑止しています。保存はファイルメニューを使ってください。",
    status_navigation_guard_shortcuts: "このタブではブラウザ移動系ショートカットを抑止しています。",
    status_ghost_mode_on: "ゴーストモード: 矢印で移動 / Q,Wで回転 / Altで微調整（{summary}）",
    status_ghost_mode_off: "ゴーストモードを終了しました（{summary}）",
    status_ghost_transform: "ゴースト: {summary}",
    status_control_point_moved: "コントロールポイント移動: {dx}, {dy}",
    status_guide_point_moved: "ガイドポイント移動: {dx}, {dy}",
    status_trace_image_loaded: "{target} のトレース画像を読み込みました: {filename}",
    status_trace_image_load_failed: "画像を読み込めませんでした。",
    status_trace_image_fit: "トレース画像をボード長へ合わせました。",
    status_trace_image_moved: "トレース画像移動: X {x} / Y {y}",
    status_trace_image_centered: "トレース画像を中央へ移動しました。",
    status_trace_image_cleared: "トレース画像をクリアしました。",
    status_guide_points_shown: "ガイドポイントを表示しました。",
    status_guide_point_added: "ガイドポイントを追加しました。",
    status_spot_click_inside: "スポット計測: ビュー内をクリックしてください。",
    status_spot_outline: "スポット アウトライン: X {x} / Y {y} / 幅 {width}",
    status_spot_profile: "スポット プロファイル: X {x} / Y {y} / ロッカー {rocker} / デッキ {deck} / 厚み {thickness}",
    status_spot_cross_section: "スポット 断面: X {x} / Y {y} / ボトム {bottom} / デッキ {deck} / 厚み {thickness}",
    status_spot_generic: "スポット: X {x} / Y {y}",
    status_cross_section_next: "次の断面を選択しました。",
    status_cross_section_previous: "前の断面を選択しました。",
    status_cross_section_panel_invalid: "断面位置はテールからボード全長未満の範囲で指定してください。",
    status_cross_section_prompt_invalid: "断面はボード長の範囲内に配置してください。",
    status_cross_section_interpolate_failed: "指定位置の補間断面を作成できませんでした。",
    status_cross_section_added: "断面を追加しました。",
    status_cross_section_moved: "断面を移動しました。",
    status_cross_section_removed: "断面を削除しました。",
    status_cross_section_copied: "断面をコピーしました。",
    status_cross_section_pasted: "断面を貼り付けました。",
    status_cross_section_import_requires_board: ".crsを読み込むには先にボードを開いてください。",
    status_cross_section_import_failed: "{filename} から断面を読み込めませんでした。",
    status_cross_section_imported: "{filename} を現在の断面へ読み込みました。",
    status_cross_section_exported: "現在の断面を .crs として書き出しました。",
    status_outline_import_failed: "{filename} からOutlineを読み込めませんでした。",
    status_outline_imported: "{filename} をOutlineへ読み込みました。",
    status_profile_import_failed: "{filename} からProfileを読み込めませんでした。",
    status_profile_import_requires_board: "Profile importには先に.brdボードを読み込んでください。",
    status_profile_imported: "{filename} をProfileへ読み込みました。",
    prompt_guide_point_x: "ガイドポイント X",
    prompt_guide_point_y: "ガイドポイント Y",
    prompt_guide_point_index: "ガイドポイント番号",
    status_guide_point_updated: "ガイドポイントを更新しました。",
    status_guide_point_removed: "ガイドポイントを削除しました。",
    status_selected_guide_point_removed: "選択中のガイドポイントを削除しました。",
    status_guide_point_index_out_of_range: "ガイドポイント番号が範囲外です。",
    status_number_required: "数値を入力してください。",
    status_control_point_added: "コントロールポイントを追加しました。",
    status_control_point_removed: "コントロールポイントを削除しました。",
    status_control_point_all_coords_required: "コントロールポイントの全座標に数値を入力してください。",
    status_control_point_coords_set: "コントロールポイントの座標を設定しました。",
    status_continuous_set: "連続を {value} にしました。",
    status_control_point_horizontal: "コントロールポイントを水平にしました。",
    status_control_point_vertical: "コントロールポイントを垂直にしました。",
    status_scale_positive_required: "Scaleには0より大きい数値を入力してください。",
    status_scale_ghost_requires_both: "Ghostスケールには current board と ghost board の両方が必要です。",
    status_scale_ghost_done: "Ghost board を current board サイズへスケールしました。",
    status_scale_board_done: "ボードを {length} x {width} x {thickness} にスケールしました（{mode}{fins}）。",
    status_fins_updated: "フィンを更新しました。",
    prompt_scale_board_length: "ボード長をスケール",
    prompt_scale_board_width: "ボード幅をスケール",
    prompt_scale_board_thickness: "ボード厚みをスケール",
    confirm_scale_bottom_rocker: "ボトムロッカーも同時にスケールしますか？ OK: Java scaleAccordingly / Cancel: 通常スケール",
    confirm_scale_fins: "フィンもスケールしますか？",
    mode_scale_accordingly: "scaleAccordingly",
    mode_regular_scale: "通常スケール",
    mode_fins_scaled_suffix: " / フィンスケール",
    status_probe_measurements_import_failed: "{filename}: プローブ測定点を読み込めませんでした。",
    status_probe_measurements_imported: "{filename}: プローブ測定点 {count} 点を読み込みました。",
    status_probe_measurements_exported: "プローブ測定点CSVを書き出しました。",
    status_probe_measurements_cleared: "プローブ測定ログをクリアしました。",
    status_bezier_patch_requires_4_or_5: "Bezier patch には編集可能なすべての断面が 4 点または 5 点の制御点である必要があります。",
    status_3d_model_approximated: "3Dモデルを近似しました: {mode}{closedSuffix}",
    status_3d_approximation_cleared: "3D近似をクリアしました。",
    status_nurbs_preview_only: "このWeb移植版では、NURBSサーフェス編集はCanvas 3Dプレビューとして表現しています。",
    status_tail_shape_applied: "テール形状: {shape} / 長さ {length}{depthPart} / ショルダー {shoulder} / 幅 {width} / ブレンド {blend} / 幅 {widthAdjust}%",
    status_tail_shape_reset: "テール形状を元のBezierに戻しました。",
    status_nose_shape_applied: "ノーズ形状: {shape} / 長さ {length} / ショルダー {shoulder} / 幅 {width} / ブレンド {blend} / 幅 {widthAdjust}%",
    status_nose_shape_reset: "ノーズ形状を元のBezierに戻しました。",
    status_wing_applied: "ウィング: {preset} / 位置 {position} / 幅 {width} / 形状 {shape}{bumpPart}",
    status_wing_disabled: "ウィングを無効化しました。",
    status_rail_applied: "レール形状: {shape} / 強度 {strength}",
    status_rail_reset: "レール形状を元のBezierに戻しました。",
    status_bottom_feature_added: "ボトム形状を追加しました: {label}",
    status_bottom_feature_updated: "ボトム形状を更新しました: {label}",
    status_bottom_feature_removed: "ボトム形状を削除しました。",
    status_bottom_feature_sections_added: "ボトム形状範囲に断面を追加しました: {label} / {count}",
    status_fin_setup_applied: "フィンセット: {label}",
    tail_depth_part: " / 深さ {depth}",
    wing_bump_part: " / ショルダー {shoulder} / 遷移 {transition}",
    edit_prefix: "編集",
    edit_none: "未選択",
    guide_point_none: "ガイドポイント未選択",
    wing_none: "未選択",
    continuous_true: "オン",
    continuous_false: "オフ",
    endpoint: "端点",
    tangent_prev: "前ハンドル",
    tangent_next: "後ハンドル",
    none: "なし",
    bezier_native: "元のBezier",
    wing_preset_stinger: "スティンガー",
    wing_preset_wing: "ウィング",
    wing_preset_wing_pin: "ウィングピンテール",
    wing_preset_custom: "カスタム",
    wing_shape_bump: "バンプ",
    wing_shape_step: "ステップ",
    rail_shape: "レール形状",
    rail_strength: "レール強度",
    rail_mode_5050: "50/50",
    rail_mode_6040: "60/40",
    rail_mode_7030: "70/30",
    rail_mode_8020: "80/20",
    rail_mode_egg: "エッグレール",
    rail_mode_full_soft: "フルソフトレール",
    rail_mode_boxy: "ボキシーレール",
    rail_mode_down: "ダウンレール",
    rail_mode_pinched: "ピンチレール",
    rail_mode_knifey: "ナイフィーレール",
    rail_mode_chine: "チャイン / ベベルレール",
    rail_mode_tucked_edge: "タックドエッジ",
    rail_mode_hard_edge: "ハードエッジ",
    set_rail: "レールを設定",
    edge_type: "エッジ種別",
    edge_type_soft: "ソフトエッジ",
    edge_type_tucked: "タックドエッジ",
    edge_type_hard: "ハードエッジ",
    edge_strength: "エッジ強度",
    edge_length_from_tail: "テールからのエッジ長",
    edge_fade_length: "エッジのフェード長",
    set_edge: "エッジを設定",
    status_edge_applied: "エッジ: {type} / 強度 {strength} / 長さ {length} / フェード {fade}",
    status_edge_reset: "エッジを解除しました。",
    rocker: "ロッカー",
    rocker_summary_empty: "ロッカー: -",
    rocker_summary: "ロッカー: {preset} / Nose {nose} / Tail {tail}",
    rocker_station_empty: "ロッカー測定点: -",
    rocker_preset: "ロッカープリセット",
    rocker_preset_continuous_neutral: "連続ニュートラル",
    rocker_preset_relaxed_drive: "低め / ドライブ",
    rocker_preset_performance_curve: "パフォーマンスカーブ",
    rocker_preset_staged_speed: "ステージド / スピード",
    rocker_preset_fish_retro_flat: "フィッシュ / レトロフラット",
    rocker_preset_gun_continuous: "ガン / 連続",
    rocker_preset_longboard_glide: "ロングボード / グライド",
    rocker_preview_enabled: "目標線を表示",
    rocker_nose: "ノーズロッカー",
    rocker_tail: "テールロッカー",
    rocker_entry_length: "エントリー範囲",
    rocker_entry_lift: "エントリーリフト",
    rocker_middle_flatness: "中央フラット量",
    rocker_tail_kick_length: "テールキック範囲",
    rocker_tail_kick: "テールキック",
    rocker_apex_shift: "頂点位置シフト",
    rocker_blend: "ブレンド",
    rocker_preserve_foil: "フォイルを維持",
    rocker_preserve_deck: "デッキを固定",
    rocker_station_row: "{label}: x {x} / rocker {rocker} / deck {deck} / thick {thickness}",
    set_rocker: "ロッカーを設定",
    status_rocker_updated: "ロッカー設定: {preset}",
    status_rocker_reset: "ロッカー設定をリセットしました。",
    tail_mode_square: "スクエア",
    tail_mode_squash: "スカッシュ",
    tail_mode_round: "ラウンド",
    tail_mode_rounded_square: "ラウンドスクエア",
    tail_mode_gun: "ガン",
    tail_mode_pin: "ピン",
    tail_mode_round_pin: "ラウンドピン",
    tail_mode_diamond: "ダイヤモンド",
    tail_mode_rounded_diamond: "ラウンドダイヤモンド",
    tail_mode_rocket: "ロケット",
    tail_mode_half_moon: "ハーフムーン",
    tail_mode_swallow: "スワロー",
    tail_mode_fish: "フィッシュ",
    tail_mode_split: "スプリット",
    tail_mode_star: "スター",
    tail_mode_bat: "バット",
    nose_mode_gun: "ガン / ポイント",
    nose_mode_pin: "ピンノーズ",
    nose_mode_round_point: "ラウンドポイントノーズ",
    nose_mode_wide: "ワイドノーズ",
    nose_mode_round: "ラウンドノーズ",
    nose_mode_diamond: "ダイヤモンドノーズ",
    nose_mode_snub: "スナブノーズ",
    nose_mode_square: "スクエアノーズ",
    pane_outline: "アウトライン",
    pane_profile: "プロファイル",
    pane_cross_section: "断面",
    pane_wire: "3Dワイヤー",
    scan_ghost: "スキャンゴースト",
    no_section_data: "断面データがありません",
    no_current_cross_section: "現在の断面がありません",
    cross_section_summary: "断面 #{index}  位置 {pos}  幅 {width}  厚み {thickness}  リリース {release}度  タック半径 {tuck}",
    scan_fit_summary: "スキャン適合 RMS {rms} / 最大 {max} / 点数 {count}",
    pdf_cross_section_title: "断面 {index} {position} - {title}"
  },
  en: {}
};

I18N.en = {
  ...Object.fromEntries(Object.entries(I18N.ja).map(([key]) => [key, key])),
  app_title: "BoardCAD Web",
  status_load_brd: "Load a .brd file.",
  menu_file: "File",
  menu_edit: "Edit",
  menu_view: "View",
  menu_cross_sections: "Cross sections",
  menu_board: "Board",
  menu_misc: "Misc",
  menu_3d_model: "3D Model",
  menu_scan: "Scan",
  menu_help: "Help",
  menu_sample: "Sample",
  new: "New",
  open: "Open",
  open_ghost: "Open Ghost",
  open_selected_sample: "Open Selected Sample",
  sample_shortboard: "Shortboard",
  sample_funboard: "Funboard",
  sample_longboard: "Longboard",
  scan_new_board: "Scan New Board",
  print_pdf: "Print / PDF Drawing",
  print_templates_pdf: "Print Templates PDF",
  dxf_outline_spline: "DXF Outline Spline",
  dxf_profile_spline: "DXF Profile Spline",
  dxf_cross_section_spline: "DXF Cross section Spline",
  dxf_outline_polyline: "DXF Outline Polyline",
  dxf_profile_polyline: "DXF Profile Polyline",
  dxf_cross_section_polyline: "DXF Cross section Polyline",
  gcode_laser_outline: "G-Code Laser Outline",
  gcode_cnc: "G-Code CNC",
  save_brd: "Save BRD",
  save_brd_as: "Save BRD as",
  export_outline_otl: "Export Outline (.otl)",
  export_profile_pfl: "Export Profile (.pfl)",
  undo: "Undo",
  redo: "Redo",
  add_control_point: "Add ControlPoint",
  delete_control_points: "Delete ControlPoints",
  outline: "Outline",
  profile: "Profile",
  quad: "Quad",
  toolpath: "Toolpath",
  fit: "Fit",
  show_grid: "Show grid",
  show_ghost_board: "Show Ghost board",
  show_control_points: "Show Control points",
  show_curvature: "Show Curvature",
  show_non_active_cross_sections: "Show Non-active crosssections",
  show_base_line: "Show base line",
  show_center_line: "Show center line",
  show_cross_section_positions: "Show crossections positions",
  show_sliding_info: "Show Sliding info",
  show_sliding_cross_section: "Show Sliding Cross section",
  show_volume_distribution: "Show Volume distribution",
  show_center_of_mass: "Show center of mass",
  show_over_bottom_curve_measurements: "Show over bottom curve measurements",
  show_moment_of_inertia: "Show moment of inertia",
  show_flowlines: "Show flowlines",
  show_apex_line: "Show apex line",
  show_tuck_under_line: "Tuck under line",
  show_foot_marks: "Show foot marks",
  show_guide_points: "Show guide points",
  use_fill: "Use fill",
  show_3d_shaded: "3D white render",
  show_3d_moire: "3D moire stripes",
  next_cross_section: "Next cross section",
  previous_cross_section: "Previous cross section",
  add_cross_section: "Add cross section",
  move_cross_section: "Move cross section",
  remove_cross_section: "Remove cross section",
  copy_cross_section: "Copy cross section",
  paste_cross_section: "Paste cross section",
  import_cross_section: "Import cross section",
  export_cross_section: "Export cross section",
  scale_current_board: "Scale current board",
  scale_ghost_to_current: "Scale ghost to current board size",
  info: "Info",
  tail: "Tail",
  nose: "Nose",
  wing: "Wing",
  fins: "Fins",
  guide_points: "Guide points",
  weight_calculator: "Weight calculator",
  flip: "Flip",
  settings: "Settings",
  settings_prompt: "Prompt",
  curve_segments_setting: "Curve segments",
  model_length_segments_setting: "3D length segments",
  model_width_points_setting: "3D width points",
  bridge_enabled_setting: "3D mouse bridge",
  bridge_preset_setting: "3D mouse preset",
  bridge_preset_generic: "Generic",
  bridge_preset_blender: "Blender-style",
  bridge_preset_fusion: "Fusion-style",
  bridge_deadzone_setting: "3D mouse deadzone",
  bridge_rotation_speed_setting: "3D mouse rotation speed",
  bridge_pan_speed_setting: "3D mouse pan speed",
  bridge_zoom_speed_setting: "3D mouse zoom speed",
  bridge_dominant_axis_setting: "Dominant axis only",
  bridge_invert_pitch_setting: "Invert pitch",
  bridge_invert_pan_y_setting: "Invert vertical pan",
  bridge_invert_zoom_setting: "Invert zoom",
  bridge_button1_setting: "3D mouse button 1",
  bridge_button2_setting: "3D mouse button 2",
  bridge_button3_setting: "3D mouse button 3",
  bridge_button4_setting: "3D mouse button 4",
  bridge_button_action_none: "None",
  bridge_button_action_fit: "Fit view",
  bridge_button_action_view_iso: "Isometric view",
  bridge_button_action_view_top: "Top view",
  bridge_button_action_view_outline: "Outline view",
  bridge_button_action_view_profile: "Profile view",
  bridge_button_action_render_cycle: "Cycle render mode",
  bridge_button_action_render_wire: "Wire render",
  bridge_button_action_render_shaded: "White render",
  bridge_button_action_render_moire: "Moire stripes",
  model_shaded_render_setting: "3D white render",
  model_moire_setting: "Moire stripes",
  apply_settings: "Apply",
  language: "Language",
  language_japanese: "Japanese",
  language_english: "English",
  language_prompt: "Prompt",
  dialog_language_title: "Language",
  dialog_guide_point_add_title: "Add guide point",
  dialog_guide_point_edit_title: "Edit guide point",
  dialog_guide_point_remove_title: "Remove guide point",
  guide_point_target: "Target",
  guide_point_index_label: "Guide point index",
  dialog_scale_board_title: "Scale board",
  scale_bottom_rocker_option: "Scale bottom rocker too",
  scale_fins_option: "Scale fins too",
  controlpoint_interpolation: "ControlPoint interpolation",
  sblend_interpolation: "S-Blend interpolation",
  create_3d_bezier_patches: "Create 3D model using Bezier patches",
  approx_from_bezier_closed: "Approximate from Bezier (closed model)",
  approx_from_bezier_open: "Approximate from Bezier (open model)",
  approx_outline_rocker: "Approximate outline and rocker",
  clear_approximation: "Clear approximation",
  view_3d: "View 3D",
  edit_nurbs_surface: "Edit nurbs surface",
  set_tail_point: "Set Tail Point",
  set_nose_point: "Set Nose Point",
  return_to_tail: "Return to Tail",
  read_current_position: "Read Current Position",
  generate_probe_gcode: "Generate Probe G-Code",
  fit_profile_from_scan: "Fit Profile From Scan",
  fit_outline_from_scan: "Fit Outline From Scan",
  fit_cross_section_from_scan: "Fit Cross Section From Scan",
  online_help: "Online help",
  about_boardcad: "About BoardCAD",
  tool_edit: "Edit",
  tool_zoom: "Zoom",
  tool_pan: "Pan",
  tool_spot_check: "Spot check",
  shortcuts: "Shortcuts",
  center_button: "Center",
  clear: "Clear",
  add: "Add",
  edit: "Edit",
  remove: "Remove",
  previous: "Previous",
  next: "Next",
  copy: "Copy",
  paste: "Paste",
  position_from_tail: "Position from tail",
  section_interval: "Section interval",
  fill_sections: "Fill sections",
  target_view: "Target view",
  load_image: "Load image",
  show_image: "Show image",
  fit_to_board: "Fit to board",
  no_image_loaded: "No image loaded",
  target: "Target",
  current_cross_section: "Current cross section",
  position_not_connected: "Position: not connected",
  position_waiting: "Position: waiting for controller status",
  scan_position_current: "Position {state}: X{x} Y{y} Z{z}",
  scan_position_tail_basis: "Tail basis X{x}",
  scan_position_nose: "Nose X{x} Y{y} Z{z}",
  scan_position_tail_origin: "Tail origin X{x} Y{y} Z{z}",
  scan_position_length: "Length {length}",
  refresh_ports: "Refresh Ports",
  choose_port: "Choose Port",
  connect: "Connect",
  disconnect: "Disconnect",
  serial_not_connected: "Serial is not connected.",
  web_serial_unavailable: "Web Serial API is not available. Choose the HC-05 serial port in Chrome/Edge.",
  web_serial_unavailable_short: "Web Serial API is not available.",
  no_authorized_ports: "No authorized ports",
  serial_connected: "Connected serial @ {baudRate}",
  serial_connect_failed: "Serial connect failed: {message}",
  serial_port_selected: "Serial port selected.",
  serial_port_selection_cancelled: "Serial port selection cancelled: {message}",
  serial_disconnected: "Disconnected serial",
  serial_read_failed: "Serial read failed: {message}",
  log_manual: "Manual {label}",
  log_generated_probe_scan: "Generated probe scan: {lineCount} lines / {moveCount} simulated moves",
  log_scan_nose: "SCAN NOSE X{x} Y{y} Z{z}",
  log_scan_tail: "SCAN TAIL X{x} Y{y} Z{z} LENGTH{length}",
  log_measure: "MEASURE {surface} X{x} Y{y} Z{z} MX{machineX} MY{machineY}",
  log_sending_gcode: "Sending {label}: {lineCount} lines",
  log_send_complete: "Send complete: {label}",
  send: "Send",
  scan_setup: "Scan setup",
  generate: "Generate",
  save: "Save",
  simulate: "Simulate",
  pause: "Pause",
  step: "Step",
  reset: "Reset",
  board_unloaded: "Not loaded",
  ghost_only_loaded: "Ghost only",
  section_unselected: "Unselected",
  panel_unloaded: "Not loaded",
  board_panel_summary: "Length {length} / Width {width} / Thickness {thickness}{tailText}{noseText}{wingText}",
  board_panel_tail: " / Tail {shape} L{length}{depthPart} S{shoulder} W{width} B{blend} Width {widthAdjust}%",
  board_panel_nose: " / Nose {shape} L{length} Width {widthAdjust}%",
  board_panel_wing: " / Wing {preset} {shape} P{position} W{width}{bumpPart}",
  board_panel_depth_part: " D{depth}",
  board_panel_bump_part: " S{shoulder} T{transition}",
  bottom: "Bottom",
  bottom_feature_none: "Bottom features: 0",
  bottom_feature_summary: "Bottom features: {count} / active {activeCount} / {preset} / selected {selected} / sections {affectedCount} ({range})",
  fill_feature_sections: "Fill feature sections",
  bottom_feature_selected: "{index}. {label}",
  bottom_feature_meta_depth: "Depth {value}",
  bottom_feature_meta_center_rail: "C {center} / R {rail}",
  bottom_feature_meta_rail: "R {rail}",
  bottom_feature_meta_width: "Width {value}",
  bottom_feature_meta_edge: "Edge {value}",
  bottom_feature_meta_offset: "Offset {value}",
  bottom_feature_meta_spacing_count: "Spacing {spacing} / Count {count}",
  bottom_feature_meta_longitudinal: "Longitudinal {value}",
  bottom_preset: "Preset",
  apply_preset: "Apply preset",
  bottom_preset_displacement_hull: "Displacement hull",
  bottom_preset_longboard_rolled_vee: "Longboard rolled to vee",
  bottom_preset_shortboard_single_to_double: "Shortboard single to double",
  bottom_preset_shortboard_single_to_vee: "Shortboard single to vee",
  bottom_preset_performance_channel_quad: "Performance channel quad",
  bottom_feature_index: "Feature",
  enabled: "Enabled",
  bottom_feature_type: "Feature type",
  bottom_feature_start: "Start from tail",
  bottom_feature_peak: "Max effect from tail",
  bottom_feature_end: "End from tail",
  bottom_feature_depth: "Depth (max 5mm)",
  bottom_feature_center_depth: "Center depth (max 5mm)",
  bottom_feature_rail_depth: "Rail depth (max 5mm)",
  bottom_feature_rail_lock_cm: "Rail protection (cm)",
  bottom_feature_width: "Width ratio",
  bottom_feature_blend: "Blend",
  bottom_feature_power: "Curve power",
  bottom_feature_edge: "Edge strength",
  bottom_feature_offset: "Offset ratio",
  bottom_feature_spacing: "Spacing ratio",
  bottom_feature_count: "Count",
  bottom_feature_longitudinal_flat: "Longitudinal flatness",
  reset: "Reset",
  duplicate: "Duplicate",
  move_up: "Up",
  move_down: "Down",
  bottom_type_single_concave: "Single concave",
  bottom_type_double_concave: "Double concave",
  bottom_type_vee: "Vee",
  bottom_type_spiral_vee: "Spiral vee",
  bottom_type_hull: "Hull",
  bottom_type_displacement_hull: "Displacement hull",
  bottom_type_channel: "Channel",
  output_settings: "Output settings",
  weight: "Weight",
  trace_image: "Trace Image",
  controlpoint: "ControlPoint",
  cnc_probe_scan: "CNC Probe Scan",
  cross_section: "Cross section",
  sample_select_aria: "Sample",
  boardcad_menus: "BoardCAD menus",
  boardcad_tools: "BoardCAD tools",
  keyboard_shortcuts: "Keyboard shortcuts",
  close: "Close",
  x_locked: "X locked",
  y_locked: "Y locked",
  z_locked: "Z locked",
  view_blank: "View blank",
  view_deck_toolpath: "View deck toolpath",
  view_bottom_toolpath: "View bottom toolpath",
  toggle_deck_bottom: "Toggle Deck/Bottom",
  add_guide_point: "Add Guide Point",
  edit_guide_point: "Edit Guide Point",
  delete_guide_point: "Delete Guide Point",
  add_controlpoint: "Add ControlPoint",
  delete_controlpoints: "Delete controlpoints",
  make_continuous: "Toggle Smooth/Corner",
  tail_shape: "Tail shape",
  tail_length: "Tail length",
  tail_depth: "Tail depth",
  shoulder_pos: "Shoulder pos",
  shoulder_width: "Shoulder width",
  join_blend: "Join blend",
  tail_width: "Tail width",
  set_tail: "Set tail",
  nose_shape: "Nose shape",
  nose_length: "Nose length",
  nose_width: "Nose width",
  set_nose: "Set nose",
  wing_preset: "Wing preset",
  custom: "Custom",
  distance_from_tail: "Distance from tail",
  wing_width: "Wing width",
  wing_shape: "Wing shape",
  shoulder_coeff: "Shoulder coeff",
  transition_coeff: "Transition coeff",
  set_wing: "Set wing",
  rail_shape: "Rail shape",
  rail_strength: "Rail strength",
  rail_mode_5050: "50/50",
  rail_mode_6040: "60/40",
  rail_mode_7030: "70/30",
  rail_mode_8020: "80/20",
  rail_mode_egg: "Egg rail",
  rail_mode_full_soft: "Full soft rail",
  rail_mode_boxy: "Boxy rail",
  rail_mode_down: "Down rail",
  rail_mode_pinched: "Pinched rail",
  rail_mode_knifey: "Knifey rail",
  rail_mode_chine: "Chined / beveled rail",
  rail_mode_tucked_edge: "Tucked edge",
  rail_mode_hard_edge: "Hard edge",
  set_rail: "Set rail",
  edge_type: "Edge type",
  edge_type_soft: "Soft edge",
  edge_type_tucked: "Tucked edge",
  edge_type_hard: "Hard edge",
  edge_strength: "Edge strength",
  edge_length_from_tail: "Edge length from tail",
  edge_fade_length: "Edge fade length",
  set_edge: "Set edge",
  status_edge_applied: "Edge: {type} / strength {strength} / length {length} / fade {fade}",
  status_edge_reset: "Edge reset.",
  rocker: "Rocker",
  rocker_summary_empty: "Rocker: -",
  rocker_summary: "Rocker: {preset} / Nose {nose} / Tail {tail}",
  rocker_station_empty: "Rocker stations: -",
  rocker_preset: "Rocker preset",
  rocker_preset_continuous_neutral: "Continuous neutral",
  rocker_preset_relaxed_drive: "Relaxed drive",
  rocker_preset_performance_curve: "Performance curve",
  rocker_preset_staged_speed: "Staged speed",
  rocker_preset_fish_retro_flat: "Fish / retro flat",
  rocker_preset_gun_continuous: "Gun continuous",
  rocker_preset_longboard_glide: "Longboard glide",
  rocker_preview_enabled: "Show target line",
  rocker_nose: "Nose rocker",
  rocker_tail: "Tail rocker",
  rocker_entry_length: "Entry length ratio",
  rocker_entry_lift: "Entry lift",
  rocker_middle_flatness: "Middle flatness",
  rocker_tail_kick_length: "Tail kick length ratio",
  rocker_tail_kick: "Tail kick",
  rocker_apex_shift: "Apex shift",
  rocker_blend: "Blend",
  rocker_preserve_foil: "Preserve foil",
  rocker_preserve_deck: "Preserve deck",
  rocker_station_row: "{label}: x {x} / rocker {rocker} / deck {deck} / thick {thickness}",
  set_rocker: "Set rocker",
  status_rocker_updated: "Rocker settings: {preset}",
  status_rocker_reset: "Rocker settings reset.",
  type: "Type",
  template: "Template",
  fin_setup: "Fin Setup",
  line_only: "Line only",
  fcs_plugs: "FCS plugs",
  fcsii_box: "FCS II box",
  single_fin_box: "Single fin box",
  single_fin: "Single fin",
  twin_fish: "Twin fish",
  twin_performance: "Twin performance",
  thruster: "Thruster",
  quad_fin: "Quad_fin",
  five_fin: "5 fin",
  bonzer: "Bonzer",
  side_rear: "Side rear",
  side_front: "Side front",
  center_rear_front: "Center rear/front",
  depth_splay: "Depth / Splay",
  side_splay: "Side splay",
  toe_in_cant: "Toe-in / Cant",
  set_fins: "Set fins",
  stringer_width: "Stringer width",
  stringer_density: "Stringer density",
  foam_density: "Foam density",
  deck_glass: "Deck glass",
  deck_lap_width: "Deck lap width",
  bottom_glass: "Bottom glass",
  bottom_lap_width: "Bottom lap width",
  resin_ratio: "Resin ratio",
  hotcoat: "Hotcoat",
  plugs_plus_fins: "Plugs + fins",
  defaults: "Defaults",
  calc: "Calc",
  weight_placeholder: "Weight: -",
  trace_image_center_x: "Trace image center X",
  trace_image_center_y: "Trace image center Y",
  trace_move_controls: "Trace image move controls",
  controlpoint_info: "ControlPoint Info",
  tangent_previous_x: "Tangent previous X",
  tangent_previous_y: "Tangent previous Y",
  tangent_next_x: "Tangent next X",
  tangent_next_y: "Tangent next Y",
  continuous: "Continuous",
  set: "Set",
  cnc_probe_scan_aria: "CNC probe scan",
  jog_step_mm: "Jog step mm",
  jog_feed_mm_min: "Jog feed mm/min",
  pos: "POS",
  serial_port_ja: "Serial port",
  no_port_selected_connect: "Not selected / choose on Connect",
  scan_method: "Scan method",
  stringer_ribs: "Stringer + ribs",
  mesh_grid: "Mesh grid",
  outline_side_probe: "Outline side probe",
  half_cross_section: "Half cross-section",
  scan_surface: "Scan surface",
  hull: "Hull",
  deck_label: "Deck",
  hull_deck: "Hull + Deck",
  x_step_mm: "X step mm",
  y_step_mm: "Y step mm",
  measured_board_length_mm: "Measured board length mm",
  machine_x_travel_mm: "Machine X travel mm",
  machine_y_center_mm: "Machine Y center mm",
  probe_travel_mm: "Probe travel mm",
  probe_feed_mm_min: "Probe feed mm/min",
  serial_baud: "Serial baud",
  cnc_sender_log: "CNC sender log",
  current_cross_section_short: "Current cross section",
  import: "Import",
  export: "Export",
  move: "Move",
  previous_short: "Previous",
  next_short: "Next",
  cancel: "Cancel",
  dialog_cross_section_add_title: "Add cross section",
  dialog_cross_section_move_title: "Move cross section",
  dialog_settings_title: "Settings",
  dialog_submit_failed: "Please check the input values.",
  unit_label: "Unit",
  gcode_feed_rate_label: "G-code feed rate",
  laser_power_label: "Laser power S",
  cnc_axes_label: "CNC axes",
  cnc_surface_label: "CNC surface",
  cnc_length_steps_label: "CNC length steps",
  cnc_width_steps_label: "CNC width steps",
  safe_z_label: "Safe Z",
  curve_segments_label: "Curve segments",
  cm_to_mm: "cm -> mm",
  inch_to_mm: "inch -> mm",
  input_as_mm: "Treat input as mm",
  axis4_xyz_a: "4-axis X/Y/Z/A",
  axis5_xyz_ab: "5-axis X/Y/Z/A/B",
  fit_profile_from_scan_button: "Fit Profile From Scan",
  fit_outline_from_scan_button: "Fit Outline From Scan",
  fit_cross_section_from_scan_button: "Fit Cross Section From Scan",
  generate_button: "Generate",
  save_button: "Save",
  simulate_button: "Simulate",
  pause_button: "Pause",
  step_button: "Step",
  reset_button: "Reset",
  send_cnc_button: "Send CNC",
  build_brd_button: "Build BRD",
  save_csv_button: "Save CSV",
  summary_outline_initial: "Outline: 0 pts",
  summary_bottom_initial: "Bottom: 0 pts",
  summary_deck_initial: "Deck: 0 pts",
  summary_sections_initial: "Sections: 0",
  edit_summary_initial: "Edit: Unselected",
  status_settings_updated: "Settings updated.",
  status_about: "BoardCAD Web information.",
  status_language_invalid: "Language must be en or ja.",
  status_language_ja: "Language set to Japanese.",
  status_language_en: "Language set to English.",
  status_flip_on: "Board view flipped.",
  status_flip_off: "Board view flip cleared.",
  status_tool_edit: "Edit: select and edit control points or guide points.",
  status_tool_zoom: "Zoom: click to zoom in, Shift or Option-click to zoom out.",
  status_tool_pan: "Pan: drag to move the drawing.",
  status_tool_spot: "Spot check: click the drawing to inspect dimensions.",
  help_title: "BoardCAD Web Help",
  help_edit: "Edit: select and drag control points / guide points",
  help_zoom: "Zoom: click to zoom in, Shift/Option-click to zoom out",
  help_pan: "Pan: drag to move the drawing",
  help_fit: "Fit: fit the drawing to the viewport",
  help_spot: "Spot check: display dimensions at the clicked point",
  help_context: "Right click: add, edit, delete points and toggle display options",
  help_keys: "1-7: switch view / E-Z-P: switch tool / F or 0: fit",
  status_help_shown: "Help displayed.",
  about_text: "BoardCAD Web\nBrowser migration of the Java BoardCAD app",
  prompt_curve_segments: "Curve segments",
  prompt_3d_length_segments: "3D model length segments",
  prompt_3d_width_points: "3D model width points",
  prompt_language: "Language (en / ja)",
  summary_outline: "Outline",
  summary_bottom: "Bottom",
  summary_deck: "Deck",
  summary_sections: "Sections",
  summary_points: "pts",
  summary_tail: "Tail",
  summary_nose: "Nose",
  summary_wing: "Wing",
  summary_ghost: "Ghost",
  summary_tail_entry: "{label}: {shape} L{length}{depthPart} S{shoulder} W{width} B{blend} Width {widthAdjust}%",
  summary_nose_entry: "{label}: {shape} L{length} S{shoulder} W{width} B{blend} Width {widthAdjust}%",
  summary_wing_entry: "{label}: {preset} {shape} P{position} W{width}{bumpPart}",
  summary_ghost_entry: "{label}: {name}",
  summary_depth_part: " D{depth}",
  summary_bump_part: " S{shoulder} T{transition}",
  interpolation_controlpoint: "ControlPoint interpolation",
  interpolation_sblend: "S-Blend interpolation",
  section_summary: "#{index} / Pos {position} / Width {width} / Thickness {thickness} / Release {release}deg / Tuck R {tuck}",
  edit_selected_guide_point: "{prefix}: {label} GuidePoint #{index}{target}",
  edit_selected_guide_point_coords: "X {x} / Y {y}",
  edit_selected_wing: "{prefix}: Wing {kind}{target}",
  edit_selected_wing_values: "Pos {position} / Width {width}{bumpPart} / Shape {shape}",
  edit_wing_bump_part: " / Shoulder {shoulder} / Transition {transition}",
  edit_selection_continuous: "Continuous: {value}",
  guide_list_empty: "Guide points: 0",
  guide_list_item: "{marker}{index}: X {x} / Y {y}",
  continuous_true_label: "Yes",
  continuous_false_label: "No",
  weight_output_foam_volume: "Foam volume: {value} cc",
  weight_output_stringer_volume: "Stringer volume: {value} cc",
  weight_output_deck_area: "Deck area: {value} cm2",
  weight_output_bottom_area: "Bottom area: {value} cm2",
  weight_output_glass: "Glass: {value} kg",
  weight_output_resin: "Resin: {value} kg",
  weight_output_total: "Total: {value} kg",
  status_new_board_created: "New board created.",
  status_load_failed: "Load failed: {message}",
  status_board_loaded: "{filename} loaded.",
  status_ghost_loaded: "{filename} loaded as ghost board.",
  status_ghost_load_failed: "Failed to load ghost board: {message}",
  status_sample_fetch_failed_localhost: "Could not load the sample. Open it from http://localhost:8788/.",
  status_sample_fetch_failed_file: "Could not load the sample. Select a .brd file manually.",
  status_sample_defaults_applied: "{filename} loaded. Tail shape: {tail}",
  status_scan_length_required: "For Scan New Board, first enter the measured board length from tail to nose.",
  status_probe_gcode_generated: "Probe scan G-code generated. Save it and inspect it before sending.",
  status_probe_simulation_empty: "No motion commands available for simulation.",
  status_probe_simulation_ready: "Probe simulation: {moves} moves",
  status_probe_simulation_paused: "Probe simulation paused.",
  status_probe_simulation_resumed: "Probe simulation resumed.",
  status_probe_simulation_step: "Probe simulation step: {point}",
  status_probe_simulation_finished: "Probe simulation finished.",
  status_scan_start: "Scan New Board: align the tail tip to work origin X0, read the current position, and press Set Tail Point. Then move to the nose tip and use Set Nose Point to confirm the measured length.",
  status_scan_position_missing: "Current position is not available. Press POS after connecting.",
  status_scan_nose_set_with_length: "Nose point set. Using measured board length {length} mm. Return to tail origin X0 and run Generate.",
  status_scan_nose_set_without_length: "Nose point set. Jog back to the tail tip and use Set Tail Point to confirm the tail origin.",
  status_scan_tail_set_with_length: "Tail point set. Using measured board length {length} mm. Return to tail origin X0 and run Generate.",
  status_scan_tail_set_without_length: "Tail point set. Move to the nose tip and press Set Nose Point.",
  status_scan_brd_points_missing: "Not enough probe measurement points to build a BRD.",
  status_scan_brd_built: "Initial BRD generated from probe measurements. Edit control points as needed.",
  status_scan_brd_build_failed: "Failed to build scan BRD: {message}",
  status_scan_profile_points_missing: "Profile fitting requires bottom and deck spine measurement points.",
  status_scan_temp_board_failed: "Could not create a temporary board for Scan Ghost fitting.",
  status_scan_profile_brd_built: "Initial BRD generated from Scan Ghost.",
  status_scan_profile_fit_applied: "Updated bottom/deck control points from the Scan Ghost point set.",
  status_scan_outline_points_missing: "Outline fitting requires outline-right and outline-left measurement points.",
  status_scan_outline_built: "Initial outline generated from Scan Ghost.",
  status_scan_outline_fit_applied: "Updated outline control points from the Scan Ghost point set.",
  status_scan_section_requires_board: "Cross-section fitting requires the current board and an active section.",
  status_scan_section_points_missing: "Cross-section fitting requires at least 3 cross-half points at the same X position.",
  status_scan_section_fit_applied: "Updated the current section from cross-half points. X {x} mm / RMS {rms} / Max {max}",
  status_fit_3d: "3D view fitted.",
  status_fit_2d: "2D view fitted.",
  status_3d_view_preset: "3D view: {preset}",
  status_navigation_guard_back: "Back/forward navigation is blocked in this tab. Use the File menu to save.",
  status_navigation_guard_shortcuts: "Browser navigation shortcuts are blocked in this tab.",
  status_ghost_mode_on: "Ghost mode: arrows move / Q,W rotate / Alt fine ({summary})",
  status_ghost_mode_off: "Ghost mode ended ({summary})",
  status_ghost_transform: "Ghost: {summary}",
  status_control_point_moved: "ControlPoint moved: {dx}, {dy}",
  status_guide_point_moved: "Guide point moved: {dx}, {dy}",
  status_trace_image_loaded: "{target} trace image loaded: {filename}",
  status_trace_image_load_failed: "Failed to load the image.",
  status_trace_image_fit: "Trace image fitted to the board length.",
  status_trace_image_moved: "Trace image moved: X {x} / Y {y}",
  status_trace_image_centered: "Trace image moved to center.",
  status_trace_image_cleared: "Trace image cleared.",
  status_guide_points_shown: "Guide points shown.",
  status_guide_point_added: "Guide point added.",
  status_spot_click_inside: "Spot check: click inside the view.",
  status_spot_outline: "Spot Outline: X {x} / Y {y} / Width {width}",
  status_spot_profile: "Spot Profile: X {x} / Y {y} / Rocker {rocker} / Deck {deck} / Thickness {thickness}",
  status_spot_cross_section: "Spot Cross section: X {x} / Y {y} / Bottom {bottom} / Deck {deck} / Thickness {thickness}",
  status_spot_generic: "Spot: X {x} / Y {y}",
  status_cross_section_next: "Selected the next cross section.",
  status_cross_section_previous: "Selected the previous cross section.",
  status_cross_section_panel_invalid: "Cross-section position must be greater than tail zero and less than board length.",
  status_cross_section_prompt_invalid: "Cross section must be placed within the board length.",
  status_cross_section_interpolate_failed: "Could not create an interpolated cross section at the specified position.",
  status_cross_section_added: "Cross section added.",
  status_cross_section_moved: "Cross section moved.",
  status_cross_section_removed: "Cross section removed.",
  status_cross_section_copied: "Cross section copied.",
  status_cross_section_pasted: "Cross section pasted.",
  status_cross_section_import_requires_board: "Open a board before importing a .crs file.",
  status_cross_section_import_failed: "Could not import a cross section from {filename}.",
  status_cross_section_imported: "{filename} imported into the current cross section.",
  status_cross_section_exported: "Current cross section exported as .crs.",
  status_outline_import_failed: "Could not import an outline from {filename}.",
  status_outline_imported: "{filename} imported into outline.",
  status_profile_import_failed: "Could not import a profile from {filename}.",
  status_profile_import_requires_board: "Load a .brd board before importing a profile.",
  status_profile_imported: "{filename} imported into profile.",
  prompt_guide_point_x: "Guide point X",
  prompt_guide_point_y: "Guide point Y",
  prompt_guide_point_index: "Guide point index",
  status_guide_point_updated: "Guide point updated.",
  status_guide_point_removed: "Guide point removed.",
  status_selected_guide_point_removed: "Selected guide point removed.",
  status_guide_point_index_out_of_range: "Guide point index is out of range.",
  status_number_required: "Enter a numeric value.",
  status_control_point_added: "ControlPoint added.",
  status_control_point_removed: "ControlPoint removed.",
  status_control_point_all_coords_required: "Enter numeric values for all ControlPoint coordinates.",
  status_control_point_coords_set: "ControlPoint coordinates updated.",
  status_continuous_set: "Continuous set to {value}.",
  status_control_point_horizontal: "ControlPoint aligned horizontally.",
  status_control_point_vertical: "ControlPoint aligned vertically.",
  status_scale_positive_required: "Enter a value greater than 0 for scaling.",
  status_scale_ghost_requires_both: "Scaling ghost requires both the current board and ghost board.",
  status_scale_ghost_done: "Ghost board scaled to the current board size.",
  status_scale_board_done: "Board scaled to {length} x {width} x {thickness} ({mode}{fins}).",
  status_fins_updated: "Fins updated.",
  prompt_scale_board_length: "Scale board length",
  prompt_scale_board_width: "Scale board width",
  prompt_scale_board_thickness: "Scale board thickness",
  confirm_scale_bottom_rocker: "Scale bottom rocker accordingly? OK: Java scaleAccordingly / Cancel: regular scale",
  confirm_scale_fins: "Scale fins too?",
  mode_scale_accordingly: "scaleAccordingly",
  mode_regular_scale: "regular scale",
  mode_fins_scaled_suffix: " / fins scaled",
  status_probe_measurements_import_failed: "{filename}: could not load probe measurements.",
  status_probe_measurements_imported: "{filename}: loaded {count} probe measurements.",
  status_probe_measurements_exported: "Probe measurements CSV exported.",
  status_probe_measurements_cleared: "Probe measurement log cleared.",
  status_bezier_patch_requires_4_or_5: "Bezier patch requires every editable cross section to have 4 or 5 control points.",
  status_3d_model_approximated: "3D model approximated: {mode}{closedSuffix}",
  status_3d_approximation_cleared: "3D approximation cleared.",
  status_nurbs_preview_only: "NURBS surface edit is represented as a Canvas 3D preview in this Web migration.",
  status_tail_shape_applied: "Tail shape: {shape} / length {length}{depthPart} / shoulder {shoulder} / width {width} / blend {blend} / width {widthAdjust}%",
  status_tail_shape_reset: "Tail shape reset to Bezier native.",
  status_nose_shape_applied: "Nose shape: {shape} / length {length} / shoulder {shoulder} / width {width} / blend {blend} / width {widthAdjust}%",
  status_nose_shape_reset: "Nose shape reset to Bezier native.",
  status_wing_applied: "Wing: {preset} / position {position} / width {width} / shape {shape}{bumpPart}",
  status_wing_disabled: "Wing disabled.",
  status_rail_applied: "Rail shape: {shape} / strength {strength}",
  status_rail_reset: "Rail shape reset to Bezier native.",
  status_bottom_feature_added: "Bottom feature added: {label}",
  status_bottom_feature_updated: "Bottom feature updated: {label}",
  status_bottom_feature_removed: "Bottom feature removed.",
  status_bottom_feature_sections_added: "Added sections inside bottom feature range: {label} / {count}",
  status_fin_setup_applied: "Fin Setup: {label}",
  tail_depth_part: " / depth {depth}",
  wing_bump_part: " / shoulder {shoulder} / transition {transition}",
  edit_none: "Unselected",
  guide_point_none: "GuidePoint unselected",
  wing_none: "Wing unselected",
  endpoint: "EndPoint",
  tangent_prev: "TangentPrev",
  tangent_next: "TangentNext",
  none: "None",
  bezier_native: "Bezier native",
  wing_preset_stinger: "Stinger",
  wing_preset_wing: "Wing",
  wing_preset_wing_pin: "Wing pin tail",
  wing_preset_custom: "Custom",
  wing_shape_bump: "Bump",
  wing_shape_step: "Step",
  tail_mode_square: "Square",
  tail_mode_squash: "Squash",
  tail_mode_round: "Round",
  tail_mode_rounded_square: "Round square",
  tail_mode_gun: "Gun",
  tail_mode_pin: "Pin",
  tail_mode_round_pin: "Round pin",
  tail_mode_diamond: "Diamond",
  tail_mode_rounded_diamond: "Round diamond",
  tail_mode_rocket: "Rocket",
  tail_mode_half_moon: "Half moon",
  tail_mode_swallow: "Swallow",
  tail_mode_fish: "Fish",
  tail_mode_split: "Split",
  tail_mode_star: "Star",
  tail_mode_bat: "Bat",
  nose_mode_gun: "Gun / point",
  nose_mode_pin: "Pin nose",
  nose_mode_round_point: "Round pointed nose",
  nose_mode_wide: "Wide nose",
  nose_mode_round: "Round nose",
  nose_mode_diamond: "Diamond nose",
  nose_mode_snub: "Snub nose",
  nose_mode_square: "Square nose"
};

const I18N_REVERSE = new Map();
Object.entries(I18N).forEach(([lang, table]) => {
  Object.entries(table).forEach(([key, value]) => {
    if (typeof value === "string" && value) I18N_REVERSE.set(value, key);
  });
});

function t(key, vars = {}) {
  const table = I18N[state.language] || I18N.ja;
  const fallback = I18N.ja[key] || key;
  const raw = table[key] || fallback;
  return raw.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

function setStatus(key, vars = {}) {
  if (els.status) els.status.textContent = t(key, vars);
}

function applyLanguageToStaticUI() {
  if (typeof document === "undefined") return;
  if (document.documentElement) document.documentElement.lang = state.language;
  if ("title" in document) document.title = t("app_title");
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
    el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
  });
  if (document.body && typeof document.createTreeWalker === "function" && typeof NodeFilter !== "undefined") {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(textNode => {
      const parent = textNode.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) return;
      const text = textNode.nodeValue;
      const trimmed = text.trim();
      if (!trimmed) return;
      const key = I18N_REVERSE.get(trimmed);
      if (!key) return;
      const translated = t(key);
      const start = text.indexOf(trimmed);
      const end = start + trimmed.length;
      textNode.nodeValue = `${text.slice(0, start)}${translated}${text.slice(end)}`;
    });
  }
  [
    ["nav.menu-bar", "aria-label", "boardcad_menus"],
    [".toolbar", "aria-label", "boardcad_tools"],
    [".top-shortcuts", "aria-label", "keyboard_shortcuts"],
    ["#sampleSelect", "aria-label", "sample_select_aria"]
  ].forEach(([selector, attr, key]) => {
    document.querySelectorAll(selector).forEach(el => el.setAttribute(attr, t(key)));
  });
}

function syncAppBuildVersion() {
  if (!els.appBuildVersion) return;
  els.appBuildVersion.textContent = `JS ${APP_BUILD_VERSION}`;
  els.appBuildVersion.title = `Loaded app.js version: ${APP_BUILD_VERSION}`;
}

const els = {
  fileInput: document.getElementById("fileInput"),
  ghostFileInput: document.getElementById("ghostFileInput"),
  crossSectionInput: document.getElementById("crossSectionInput"),
  sampleSelect: document.getElementById("sampleSelect"),
  sampleButton: document.getElementById("sampleButton"),
  saveBrdButton: document.getElementById("saveBrdButton"),
  saveBrdAsButton: document.getElementById("saveBrdAsButton"),
  exportOtlButton: document.getElementById("exportOtlButton"),
  exportPflButton: document.getElementById("exportPflButton"),
  pdfButton: document.getElementById("pdfButton"),
  templatePdfButton: document.getElementById("templatePdfButton"),
  dxfOutlineSplineButton: document.getElementById("dxfOutlineSplineButton"),
  dxfProfileSplineButton: document.getElementById("dxfProfileSplineButton"),
  dxfSectionSplineButton: document.getElementById("dxfSectionSplineButton"),
  dxfOutlineButton: document.getElementById("dxfOutlineButton"),
  dxfProfileButton: document.getElementById("dxfProfileButton"),
  dxfSectionButton: document.getElementById("dxfSectionButton"),
  gcodeButton: document.getElementById("gcodeButton"),
  cncButton: document.getElementById("cncButton"),
  canvas: document.getElementById("canvas"),
  status: document.getElementById("status"),
  appBuildVersion: document.getElementById("appBuildVersion"),
  boardName: document.getElementById("boardName"),
  boardMeta: document.getElementById("boardMeta"),
  summary: document.getElementById("summary"),
  unitSelect: document.getElementById("unitSelect"),
  feedRate: document.getElementById("feedRate"),
  laserPower: document.getElementById("laserPower"),
  cncAxes: document.getElementById("cncAxes"),
  cncSurface: document.getElementById("cncSurface"),
  cncLengthSteps: document.getElementById("cncLengthSteps"),
  cncWidthSteps: document.getElementById("cncWidthSteps"),
  safeZ: document.getElementById("safeZ"),
  segments: document.getElementById("segments"),
  scanMode: document.getElementById("scanMode"),
  scanSurface: document.getElementById("scanSurface"),
  scanXStep: document.getElementById("scanXStep"),
  scanYStep: document.getElementById("scanYStep"),
  scanMeasuredLength: document.getElementById("scanMeasuredLength"),
  scanMachineTravelX: document.getElementById("scanMachineTravelX"),
  scanMachineCenterY: document.getElementById("scanMachineCenterY"),
  probeTravel: document.getElementById("probeTravel"),
  probeFeed: document.getElementById("probeFeed"),
  serialBaud: document.getElementById("serialBaud"),
  serialPortSelect: document.getElementById("serialPortSelect"),
  refreshSerialPortsButton: document.getElementById("refreshSerialPortsButton"),
  selectSerialPortButton: document.getElementById("selectSerialPortButton"),
  jogStep: document.getElementById("jogStep"),
  jogFeed: document.getElementById("jogFeed"),
  generateScanButton: document.getElementById("generateScanButton"),
  downloadScanButton: document.getElementById("downloadScanButton"),
  simulateScanButton: document.getElementById("simulateScanButton"),
  pauseSimulationButton: document.getElementById("pauseSimulationButton"),
  stepSimulationButton: document.getElementById("stepSimulationButton"),
  resetSimulationButton: document.getElementById("resetSimulationButton"),
  connectSerialButton: document.getElementById("connectSerialButton"),
  sendScanButton: document.getElementById("sendScanButton"),
  sendCncButton: document.getElementById("sendCncButton"),
  buildBrdFromScanButton: document.getElementById("buildBrdFromScanButton"),
  downloadMeasurementsButton: document.getElementById("downloadMeasurementsButton"),
  clearMeasurementsButton: document.getElementById("clearMeasurementsButton"),
  appDialog: document.getElementById("appDialog"),
  appDialogTitle: document.getElementById("appDialogTitle"),
  appDialogBody: document.getElementById("appDialogBody"),
  appDialogCloseButton: document.getElementById("appDialogCloseButton"),
  scanLog: document.getElementById("scanLog"),
  scanPositionReadout: document.getElementById("scanPositionReadout"),
  setNosePointButton: document.getElementById("setNosePointButton"),
  setTailPointButton: document.getElementById("setTailPointButton"),
  returnTailButton: document.getElementById("returnTailButton"),
  requestPositionButton: document.getElementById("requestPositionButton"),
  fitProfileFromScanButton: document.getElementById("fitProfileFromScanButton"),
  fitOutlineFromScanButton: document.getElementById("fitOutlineFromScanButton"),
  fitCrossSectionFromScanButton: document.getElementById("fitCrossSectionFromScanButton"),
  undoButton: document.getElementById("undoButton"),
  redoButton: document.getElementById("redoButton"),
  addControlPointButton: document.getElementById("addControlPointButton"),
  deleteControlPointButton: document.getElementById("deleteControlPointButton"),
  nextSectionButton: document.getElementById("nextSectionButton"),
  previousSectionButton: document.getElementById("previousSectionButton"),
  addSectionButton: document.getElementById("addSectionButton"),
  moveSectionButton: document.getElementById("moveSectionButton"),
  removeSectionButton: document.getElementById("removeSectionButton"),
  copySectionButton: document.getElementById("copySectionButton"),
  pasteSectionButton: document.getElementById("pasteSectionButton"),
  importSectionButton: document.getElementById("importSectionButton"),
  exportSectionButton: document.getElementById("exportSectionButton"),
  scaleBoardButton: document.getElementById("scaleBoardButton"),
  scaleGhostButton: document.getElementById("scaleGhostButton"),
  boardInfoButton: document.getElementById("boardInfoButton"),
  flipBoardViewButton: document.getElementById("flipBoardViewButton"),
  tailButton: document.getElementById("tailButton"),
  noseButton: document.getElementById("noseButton"),
  wingButton: document.getElementById("wingButton"),
  rockerButton: document.getElementById("rockerButton"),
  bottomButton: document.getElementById("bottomButton"),
  finsButton: document.getElementById("finsButton"),
  guidePointsButton: document.getElementById("guidePointsButton"),
  weightCalcButton: document.getElementById("weightCalcButton"),
  finType: document.getElementById("finType"),
  finTemplate: document.getElementById("finTemplate"),
  finSetup: document.getElementById("finSetup"),
  finSideRearX: document.getElementById("finSideRearX"),
  finSideRearY: document.getElementById("finSideRearY"),
  finSideFrontX: document.getElementById("finSideFrontX"),
  finSideFrontY: document.getElementById("finSideFrontY"),
  finCenterRear: document.getElementById("finCenterRear"),
  finCenterFront: document.getElementById("finCenterFront"),
  finCenterDepth: document.getElementById("finCenterDepth"),
  finSideDepth: document.getElementById("finSideDepth"),
  finSideSplay: document.getElementById("finSideSplay"),
  finToeIn: document.getElementById("finToeIn"),
  finCant: document.getElementById("finCant"),
  setFinsButton: document.getElementById("setFinsButton"),
  tailMode: document.getElementById("tailMode"),
  tailLength: document.getElementById("tailLength"),
  tailDepth: document.getElementById("tailDepth"),
  tailShoulderPos: document.getElementById("tailShoulderPos"),
  tailShoulderScale: document.getElementById("tailShoulderScale"),
  tailRailBlend: document.getElementById("tailRailBlend"),
  tailWidthAdjust: document.getElementById("tailWidthAdjust"),
  tailWidthAdjustReadout: document.getElementById("tailWidthAdjustReadout"),
  setTailButton: document.getElementById("setTailButton"),
  noseMode: document.getElementById("noseMode"),
  noseLength: document.getElementById("noseLength"),
  noseShoulderPos: document.getElementById("noseShoulderPos"),
  noseShoulderScale: document.getElementById("noseShoulderScale"),
  noseRailBlend: document.getElementById("noseRailBlend"),
  noseWidthAdjust: document.getElementById("noseWidthAdjust"),
  noseWidthAdjustReadout: document.getElementById("noseWidthAdjustReadout"),
  setNoseButton: document.getElementById("setNoseButton"),
  wingPreset: document.getElementById("wingPreset"),
  wingPosition: document.getElementById("wingPosition"),
  wingWidth: document.getElementById("wingWidth"),
  wingShape: document.getElementById("wingShape"),
  wingShoulder: document.getElementById("wingShoulder"),
  wingTransition: document.getElementById("wingTransition"),
  setWingButton: document.getElementById("setWingButton"),
  rockerPreset: document.getElementById("rockerPreset"),
  rockerEnabled: document.getElementById("rockerEnabled"),
  rockerNose: document.getElementById("rockerNose"),
  rockerTail: document.getElementById("rockerTail"),
  rockerEntryLength: document.getElementById("rockerEntryLength"),
  rockerEntryLift: document.getElementById("rockerEntryLift"),
  rockerMiddleFlatness: document.getElementById("rockerMiddleFlatness"),
  rockerTailKickLength: document.getElementById("rockerTailKickLength"),
  rockerTailKick: document.getElementById("rockerTailKick"),
  rockerApexShift: document.getElementById("rockerApexShift"),
  rockerBlend: document.getElementById("rockerBlend"),
  rockerPreserveFoil: document.getElementById("rockerPreserveFoil"),
  rockerPreserveDeck: document.getElementById("rockerPreserveDeck"),
  setRockerButton: document.getElementById("setRockerButton"),
  resetRockerButton: document.getElementById("resetRockerButton"),
  rockerSummary: document.getElementById("rockerSummary"),
  rockerStationList: document.getElementById("rockerStationList"),
  railMode: document.getElementById("railMode"),
  railStrength: document.getElementById("railStrength"),
  setRailButton: document.getElementById("setRailButton"),
  edgeType: document.getElementById("edgeType"),
  edgeStrength: document.getElementById("edgeStrength"),
  edgeLength: document.getElementById("edgeLength"),
  edgeFade: document.getElementById("edgeFade"),
  setEdgeButton: document.getElementById("setEdgeButton"),
  bottomFeatureSummary: document.getElementById("bottomFeatureSummary"),
  bottomFeatureList: document.getElementById("bottomFeatureList"),
  bottomFeaturePreset: document.getElementById("bottomFeaturePreset"),
  applyBottomPresetButton: document.getElementById("applyBottomPresetButton"),
  bottomFeatureIndex: document.getElementById("bottomFeatureIndex"),
  bottomFeatureEnabled: document.getElementById("bottomFeatureEnabled"),
  bottomFeatureType: document.getElementById("bottomFeatureType"),
  bottomFeatureStart: document.getElementById("bottomFeatureStart"),
  bottomFeaturePeak: document.getElementById("bottomFeaturePeak"),
  bottomFeatureEnd: document.getElementById("bottomFeatureEnd"),
  bottomFeatureDepth: document.getElementById("bottomFeatureDepth"),
  bottomFeatureCenterDepth: document.getElementById("bottomFeatureCenterDepth"),
  bottomFeatureRailDepth: document.getElementById("bottomFeatureRailDepth"),
  bottomFeatureRailLockCm: document.getElementById("bottomFeatureRailLockCm"),
  bottomFeatureWidth: document.getElementById("bottomFeatureWidth"),
  bottomFeatureBlend: document.getElementById("bottomFeatureBlend"),
  bottomFeaturePower: document.getElementById("bottomFeaturePower"),
  bottomFeatureEdge: document.getElementById("bottomFeatureEdge"),
  bottomFeatureOffset: document.getElementById("bottomFeatureOffset"),
  bottomFeatureSpacing: document.getElementById("bottomFeatureSpacing"),
  bottomFeatureCount: document.getElementById("bottomFeatureCount"),
  bottomFeatureLongitudinalFlat: document.getElementById("bottomFeatureLongitudinalFlat"),
  setBottomFeatureButton: document.getElementById("setBottomFeatureButton"),
  addBottomFeatureButton: document.getElementById("addBottomFeatureButton"),
  duplicateBottomFeatureButton: document.getElementById("duplicateBottomFeatureButton"),
  fillBottomFeatureSectionsButton: document.getElementById("fillBottomFeatureSectionsButton"),
  removeBottomFeatureButton: document.getElementById("removeBottomFeatureButton"),
  resetBottomFeatureButton: document.getElementById("resetBottomFeatureButton"),
  clearBottomFeaturesButton: document.getElementById("clearBottomFeaturesButton"),
  moveBottomFeatureUpButton: document.getElementById("moveBottomFeatureUpButton"),
  moveBottomFeatureDownButton: document.getElementById("moveBottomFeatureDownButton"),
  guideTarget: document.getElementById("guideTarget"),
  guideList: document.getElementById("guideList"),
  addGuidePointButton: document.getElementById("addGuidePointButton"),
  editGuidePointButton: document.getElementById("editGuidePointButton"),
  removeGuidePointButton: document.getElementById("removeGuidePointButton"),
  traceTarget: document.getElementById("traceTarget"),
  traceImageInput: document.getElementById("traceImageInput"),
  traceVisible: document.getElementById("traceVisible"),
  traceOpacity: document.getElementById("traceOpacity"),
  traceScale: document.getElementById("traceScale"),
  traceRotation: document.getElementById("traceRotation"),
  traceX: document.getElementById("traceX"),
  traceY: document.getElementById("traceY"),
  traceMoveStep: document.getElementById("traceMoveStep"),
  traceMoveUpButton: document.getElementById("traceMoveUpButton"),
  traceMoveDownButton: document.getElementById("traceMoveDownButton"),
  traceMoveLeftButton: document.getElementById("traceMoveLeftButton"),
  traceMoveRightButton: document.getElementById("traceMoveRightButton"),
  traceCenterButton: document.getElementById("traceCenterButton"),
  traceFitButton: document.getElementById("traceFitButton"),
  traceClearButton: document.getElementById("traceClearButton"),
  traceInfo: document.getElementById("traceInfo"),
  boardPanelSummary: document.getElementById("boardPanelSummary"),
  weightPanel: document.getElementById("weightPanel"),
  weightStringerWidth: document.getElementById("weightStringerWidth"),
  weightStringerDensity: document.getElementById("weightStringerDensity"),
  weightFoamDensity: document.getElementById("weightFoamDensity"),
  weightDeckGlass: document.getElementById("weightDeckGlass"),
  weightDeckLapWidth: document.getElementById("weightDeckLapWidth"),
  weightBottomGlass: document.getElementById("weightBottomGlass"),
  weightBottomLapWidth: document.getElementById("weightBottomLapWidth"),
  weightResinRatio: document.getElementById("weightResinRatio"),
  weightHotcoat: document.getElementById("weightHotcoat"),
  weightPlugsFins: document.getElementById("weightPlugsFins"),
  weightOutput: document.getElementById("weightOutput"),
  weightDefaultsButton: document.getElementById("weightDefaultsButton"),
  weightCalcPanelButton: document.getElementById("weightCalcPanelButton"),
  settingsButton: document.getElementById("settingsButton"),
  miscCurveSegments: document.getElementById("miscCurveSegments"),
  miscModelLengthSegments: document.getElementById("miscModelLengthSegments"),
  miscModelWidthPoints: document.getElementById("miscModelWidthPoints"),
  miscBridgeEnabled: document.getElementById("miscBridgeEnabled"),
  miscBridgePreset: document.getElementById("miscBridgePreset"),
  miscBridgeDeadzone: document.getElementById("miscBridgeDeadzone"),
  miscBridgeRotationSpeed: document.getElementById("miscBridgeRotationSpeed"),
  miscBridgePanSpeed: document.getElementById("miscBridgePanSpeed"),
  miscBridgeZoomSpeed: document.getElementById("miscBridgeZoomSpeed"),
  miscBridgeDominantAxis: document.getElementById("miscBridgeDominantAxis"),
  miscBridgeInvertPitch: document.getElementById("miscBridgeInvertPitch"),
  miscBridgeInvertPanY: document.getElementById("miscBridgeInvertPanY"),
  miscBridgeInvertZoom: document.getElementById("miscBridgeInvertZoom"),
  miscBridgeButton1Action: document.getElementById("miscBridgeButton1Action"),
  miscBridgeButton2Action: document.getElementById("miscBridgeButton2Action"),
  miscBridgeButton3Action: document.getElementById("miscBridgeButton3Action"),
  miscBridgeButton4Action: document.getElementById("miscBridgeButton4Action"),
  miscApplySettingsButton: document.getElementById("miscApplySettingsButton"),
  languageButton: document.getElementById("languageButton"),
  controlPointInterpolation: document.getElementById("controlPointInterpolation"),
  sBlendInterpolation: document.getElementById("sBlendInterpolation"),
  bezierPatchButton: document.getElementById("bezierPatchButton"),
  approxClosedButton: document.getElementById("approxClosedButton"),
  approxOpenButton: document.getElementById("approxOpenButton"),
  approxOutlineRockerButton: document.getElementById("approxOutlineRockerButton"),
  clearApproxButton: document.getElementById("clearApproxButton"),
  view3dButton: document.getElementById("view3dButton"),
  editNurbsButton: document.getElementById("editNurbsButton"),
  previousSectionPanelButton: document.getElementById("previousSectionPanelButton"),
  nextSectionPanelButton: document.getElementById("nextSectionPanelButton"),
  addSectionPanelButton: document.getElementById("addSectionPanelButton"),
  sectionPosition: document.getElementById("sectionPosition"),
  sectionInterval: document.getElementById("sectionInterval"),
  moveSectionPanelButton: document.getElementById("moveSectionPanelButton"),
  removeSectionPanelButton: document.getElementById("removeSectionPanelButton"),
  fillSectionsPanelButton: document.getElementById("fillSectionsPanelButton"),
  copySectionPanelButton: document.getElementById("copySectionPanelButton"),
  pasteSectionPanelButton: document.getElementById("pasteSectionPanelButton"),
  importSectionPanelButton: document.getElementById("importSectionPanelButton"),
  exportSectionPanelButton: document.getElementById("exportSectionPanelButton"),
  addSectionGuidePointButton: document.getElementById("addSectionGuidePointButton"),
  editSectionGuidePointButton: document.getElementById("editSectionGuidePointButton"),
  removeSectionGuidePointButton: document.getElementById("removeSectionGuidePointButton"),
  sectionSummary: document.getElementById("sectionSummary"),
  editSummary: document.getElementById("editSummary"),
  cpEndX: document.getElementById("cpEndX"),
  cpEndY: document.getElementById("cpEndY"),
  cpPrevX: document.getElementById("cpPrevX"),
  cpPrevY: document.getElementById("cpPrevY"),
  cpNextX: document.getElementById("cpNextX"),
  cpNextY: document.getElementById("cpNextY"),
  cpContinuous: document.getElementById("cpContinuous"),
  cpSetButton: document.getElementById("cpSetButton"),
  cpHorizontalButton: document.getElementById("cpHorizontalButton"),
  cpVerticalButton: document.getElementById("cpVerticalButton"),
  canvasContextMenu: document.getElementById("canvasContextMenu"),
  contextAddControlPoint: document.getElementById("contextAddControlPoint"),
  contextDeleteControlPoint: document.getElementById("contextDeleteControlPoint"),
  contextMakeContinuous: document.getElementById("contextMakeContinuous"),
  contextAddGuidePoint: document.getElementById("contextAddGuidePoint"),
  contextEditGuidePoint: document.getElementById("contextEditGuidePoint"),
  contextDeleteGuidePoint: document.getElementById("contextDeleteGuidePoint"),
  contextLockX: document.getElementById("contextLockX"),
  contextLockY: document.getElementById("contextLockY"),
  contextLockZ: document.getElementById("contextLockZ"),
  contextViewBlank: document.getElementById("contextViewBlank"),
  contextViewDeckToolpath: document.getElementById("contextViewDeckToolpath"),
  contextViewBottomToolpath: document.getElementById("contextViewBottomToolpath"),
  outputPanel: document.getElementById("outputPanel"),
  tailPanel: document.getElementById("tailPanel"),
  nosePanel: document.getElementById("nosePanel"),
  wingPanel: document.getElementById("wingPanel"),
  rockerPanel: document.getElementById("rockerPanel"),
  bottomPanel: document.getElementById("bottomPanel"),
  finsPanel: document.getElementById("finsPanel"),
  weightPanel: document.getElementById("weightPanel"),
  tracePanel: document.getElementById("tracePanel"),
  controlPointPanel: document.getElementById("controlPointPanel"),
  guidePointPanel: document.getElementById("guidePointPanel"),
  probePanel: document.getElementById("probePanel"),
  crossSectionPanel: document.getElementById("crossSectionPanel")
};

const ctx = els.canvas.getContext("2d");
const VALID_VIEWS = Object.freeze(["outline", "profile", "sections", "quad", "toolpath", "model3d", "scan"]);
const VIEW_OPTION_KEYS = Object.freeze(Object.keys(state.viewOptions));
const BOTTOM_FEATURE_FIELD_ID = 83;
const BOTTOM_PRESET_FIELD_ID = 84;
const EDGE_TYPE_FIELD_ID = 85;
const EDGE_STRENGTH_FIELD_ID = 86;
const EDGE_LENGTH_FIELD_ID = 87;
const EDGE_FADE_FIELD_ID = 88;
const ROCKER_PRESET_FIELD_ID = 89;
const ROCKER_CONFIG_FIELD_ID = 90;
const ROCKER_PRESET_KEYS = Object.freeze(["custom", "continuous-neutral", "relaxed-drive", "performance-curve", "staged-speed", "fish-retro-flat", "gun-continuous", "longboard-glide"]);
const ROCKER_STATION_12_INCH_CM = 30.48;
const ROCKER_STATION_24_INCH_CM = 60.96;
const ROCKER_CONFIG_DEFAULTS = Object.freeze({
  preset: "custom",
  enabled: false,
  noseRocker: 0,
  tailRocker: 0,
  entryLengthRatio: 0.25,
  entryLift: 0,
  middleFlatness: 0,
  tailKickLengthRatio: 0.25,
  tailKick: 0,
  apexShift: 0,
  blend: 1,
  preserveFoil: true,
  preserveDeck: false
});
const ROCKER_PRESET_PARAMETER_DEFAULTS = Object.freeze({
  "continuous-neutral": { entryLengthRatio: 0.25, entryLift: 0, middleFlatness: 0.18, tailKickLengthRatio: 0.25, tailKick: 0, apexShift: 0, blend: 1, preserveFoil: true, preserveDeck: false },
  "relaxed-drive": { entryLengthRatio: 0.27, entryLift: 0.12, middleFlatness: 0.16, tailKickLengthRatio: 0.24, tailKick: 0.08, apexShift: -0.04, blend: 0.92, preserveFoil: true, preserveDeck: false },
  "performance-curve": { entryLengthRatio: 0.2, entryLift: 0.18, middleFlatness: -0.22, tailKickLengthRatio: 0.2, tailKick: 0.18, apexShift: 0.03, blend: 1.28, preserveFoil: true, preserveDeck: false },
  "staged-speed": { entryLengthRatio: 0.18, entryLift: 0.1, middleFlatness: 0.12, tailKickLengthRatio: 0.16, tailKick: 0.16, apexShift: -0.02, blend: 0.84, preserveFoil: true, preserveDeck: false },
  "fish-retro-flat": { entryLengthRatio: 0.3, entryLift: 0.05, middleFlatness: 0.2, tailKickLengthRatio: 0.22, tailKick: 0.04, apexShift: -0.08, blend: 0.8, preserveFoil: true, preserveDeck: false },
  "gun-continuous": { entryLengthRatio: 0.18, entryLift: 0.2, middleFlatness: -0.38, tailKickLengthRatio: 0.18, tailKick: 0.22, apexShift: 0.05, blend: 1.4, preserveFoil: true, preserveDeck: false },
  "longboard-glide": { entryLengthRatio: 0.28, entryLift: 0.04, middleFlatness: 0.28, tailKickLengthRatio: 0.24, tailKick: 0.06, apexShift: -0.05, blend: 0.88, preserveFoil: true, preserveDeck: false }
});
const BOTTOM_FEATURE_TYPES = Object.freeze(["single-concave", "double-concave", "vee", "spiral-vee", "hull", "displacement-hull", "channel"]);
const BOTTOM_PRESET_KEYS = Object.freeze(["custom", "displacement-hull", "longboard-rolled-vee", "shortboard-single-to-double", "shortboard-single-to-vee", "performance-channel-quad"]);
const DOUBLE_CONCAVE_TROUGH_GAIN = 1.3;
const BOTTOM_FEATURE_DEPTH_MAX = 0.5;
const BOTTOM_FEATURE_RAIL_LOCK_CM = 5;
const BOTTOM_FEATURE_RAIL_LOCK_CM_MAX = 15;
const CIRCULAR_ARC_HANDLE = 0.5522847498;
const BOTTOM_FEATURE_ANCHOR_INSET_WIDE_CM = 5;
const BOTTOM_FEATURE_ANCHOR_INSET_STANDARD_CM = 7.5;
const BOTTOM_FEATURE_ANCHOR_INSET_NARROW_CM = 12.5;
const BOTTOM_FEATURE_ANCHOR_TRANSITION_CM = 1.5;
const BOTTOM_FEATURE_TYPE_SPECS = Object.freeze({
  "single-concave": {
    defaults: { depth: 0.16, width: 0.67, blend: 1, power: 1.8, edge: 0.78, offset: 0, spacing: 0.12, count: 1, centerDepth: 0, railDepth: 0, startRatio: 0.15, peakRatio: 0.5, endRatio: 0.84 },
    visibleFields: { depth: true, centerDepth: false, railDepth: false, width: true, blend: true, power: true, edge: true, offset: false, spacing: false, count: false },
    limits: { depth: [0, BOTTOM_FEATURE_DEPTH_MAX, 0.01], width: [0.2, 1, 0.01], blend: [0.1, 4, 0.05], power: [0.6, 4, 0.05], edge: [0, 1, 0.05] }
  },
  "double-concave": {
    defaults: { depth: 0, width: 0.7, blend: 1, power: 1.7, edge: 0.28, offset: 0.42, spacing: 0.12, count: 2, centerDepth: 0.07, railDepth: 0.18, startRatio: 0.42, peakRatio: 0.7, endRatio: 0.96 },
    visibleFields: { depth: false, centerDepth: true, railDepth: true, width: true, blend: true, power: true, edge: true, offset: true, spacing: false, count: false },
    limits: { width: [0.2, 0.95, 0.01], blend: [0.1, 4, 0.05], power: [0.6, 4, 0.05], edge: [0, 1, 0.05], offset: [0.15, 0.8, 0.01], centerDepth: [0, BOTTOM_FEATURE_DEPTH_MAX, 0.01], railDepth: [0, BOTTOM_FEATURE_DEPTH_MAX, 0.01] }
  },
  vee: {
    defaults: { depth: 0.14, width: 0.55, blend: 1, power: 1.3, edge: 0.68, offset: 0, spacing: 0.12, count: 1, centerDepth: 0, railDepth: 0, railLockCm: 0.75, startRatio: 0.5, peakRatio: 0.82, endRatio: 1 },
    visibleFields: { depth: true, centerDepth: false, railDepth: false, width: true, blend: true, power: true, edge: true, offset: false, spacing: false, count: false },
    limits: { depth: [0, BOTTOM_FEATURE_DEPTH_MAX, 0.01], width: [0.25, 0.8, 0.01], blend: [0.1, 4, 0.05], power: [0.4, 3.2, 0.05], edge: [0, 1, 0.05] }
  },
  "spiral-vee": {
    defaults: { depth: 0.14, width: 0.58, blend: 1.2, power: 1.45, edge: 0.58, offset: 0.18, spacing: 0.12, count: 1, centerDepth: 0, railDepth: 0, railLockCm: 0.75, startRatio: 0.38, peakRatio: 0.94, endRatio: 1 },
    visibleFields: { depth: true, centerDepth: false, railDepth: false, width: true, blend: true, power: true, edge: true, offset: true, spacing: false, count: false },
    limits: { depth: [0, BOTTOM_FEATURE_DEPTH_MAX, 0.01], width: [0.25, 0.8, 0.01], blend: [0.1, 4, 0.05], power: [0.4, 3.4, 0.05], edge: [0, 1, 0.05], offset: [0, 0.45, 0.01] }
  },
  hull: {
    defaults: { depth: 0.12, width: 0.92, blend: 1, power: 2.2, edge: 0, offset: 0, spacing: 0.12, count: 1, centerDepth: 0, railDepth: 0, startRatio: 0.1, peakRatio: 0.35, endRatio: 0.62 },
    visibleFields: { depth: true, centerDepth: false, railDepth: false, width: true, blend: true, power: true, edge: false, offset: false, spacing: false, count: false },
    limits: { depth: [0, BOTTOM_FEATURE_DEPTH_MAX, 0.01], width: [0.45, 1, 0.01], blend: [0.1, 4, 0.05], power: [0.8, 4, 0.05], edge: [0, 1, 0.05] }
  },
  "displacement-hull": {
    defaults: { depth: 0.14, width: 0.9, blend: 1.12, power: 2.25, edge: 0, offset: 0, spacing: 0.12, count: 1, centerDepth: 0, railDepth: 0.12, startRatio: 0, peakRatio: 0.72, endRatio: 0.96 },
    visibleFields: { depth: true, centerDepth: false, railDepth: false, width: true, blend: true, power: true, edge: false, offset: false, spacing: false, count: false },
    limits: { depth: [0, BOTTOM_FEATURE_DEPTH_MAX, 0.01], width: [0.45, 1, 0.01], blend: [0.1, 4, 0.05], power: [0.8, 4, 0.05], edge: [0, 1, 0.05], railDepth: [0, BOTTOM_FEATURE_DEPTH_MAX, 0.01] }
  },
  channel: {
    defaults: { depth: 0, width: 0.18, blend: 1, power: 1.4, edge: 0.9, offset: 0.62, spacing: 0.1, count: 2, centerDepth: 0, railDepth: 0.12, longitudinalFlat: 0.55, startRatio: 0.72, peakRatio: 0.9, endRatio: 1 },
    visibleFields: { depth: false, centerDepth: false, railDepth: true, width: true, blend: true, power: true, edge: true, offset: true, spacing: true, count: true, longitudinalFlat: true },
    limits: { width: [0.05, 0.35, 0.01], blend: [0.1, 4, 0.05], power: [0.4, 4, 0.05], edge: [0, 1, 0.05], offset: [0.3, 1, 0.01], spacing: [0, 0.25, 0.01], count: [1, 10, 1], railDepth: [0, BOTTOM_FEATURE_DEPTH_MAX, 0.01], longitudinalFlat: [0, 1, 0.05] }
  }
});
const ACTION_KEEP_MENU_OPEN = new Set(["open", "open-ghost"]);
const ACTION_HANDLERS = Object.freeze({
  "new": () => createNewBoard(),
  "open": () => openBoardFilePicker(),
  "open-ghost": () => openGhostBoardFilePicker(),
  "sample": () => loadSelectedSample(),
  "sample-current": () => loadSelectedSample(),
  "sample-direct": target => loadSampleByUrl(target.dataset.sampleUrl),
  "scan-new-board": () => startScanNewBoard(),
  "pdf": () => window.downloadPdf(),
  "template-pdf": () => window.downloadTemplatePdf(),
  "save-brd": () => window.downloadBrd(),
  "save-brd-as": () => window.downloadBrdAs(),
  "export-otl": () => window.downloadOtl(),
  "export-pfl": () => window.downloadPfl(),
  "dxf-outline-spline": () => window.downloadDxfOutlineSpline(),
  "dxf-profile-spline": () => window.downloadDxfProfileSpline(),
  "dxf-section-spline": () => window.downloadDxfCrossSectionSpline(),
  "dxf-outline": () => window.downloadDxfOutline(),
  "dxf-profile": () => window.downloadDxfProfile(),
  "dxf-section": () => window.downloadDxfCrossSection(),
  "laser": () => window.downloadLaserGCode(),
  "cnc": () => window.downloadCncGCode(),
  "generate-probe-scan": () => generateProbeScan(),
  "download-probe-scan": () => downloadProbeScanGCode(),
  "simulate-probe-scan": () => startProbeSimulation(),
  "pause-probe-simulation": () => pauseProbeSimulation(),
  "step-probe-simulation": () => stepProbeSimulation(),
  "reset-probe-simulation": () => resetProbeSimulation(),
  "connect-serial": () => connectSerial(),
  "refresh-serial-ports": () => refreshSerialPorts(),
  "select-serial-port": () => selectSerialPort(),
  "send-probe-scan": () => sendProbeScanGCode(),
  "send-cnc-gcode": () => sendCncGCode(),
  "build-brd-from-scan": () => buildBrdFromScan(),
  "download-probe-measurements": () => downloadProbeMeasurements(),
  "clear-probe-measurements": () => clearProbeMeasurements(),
  "scan-set-nose": () => setScanNosePoint(),
  "scan-set-tail": () => setScanTailPoint(),
  "scan-return-tail": () => returnToScanTail(),
  "request-position": () => requestControllerPosition(),
  "jog": target => jogController(target.dataset.jogAxis, Number(target.dataset.jogDir)),
  "fit-profile-from-scan": () => fitProfileFromScanGhost(),
  "fit-outline-from-scan": () => fitOutlineFromScanGhost(),
  "fit-cross-section-from-scan": () => fitCrossSectionFromScanGhost(),
  "trace-move": target => moveTraceImage(Number(target.dataset.traceDx), Number(target.dataset.traceDy)),
  "trace-center": () => centerTraceImage(),
  "trace-fit": () => fitTraceImageToBoard(),
  "trace-clear": () => clearTraceImage(),
  "fit": () => fitView(),
  "undo": () => undoEdit(),
  "redo": () => redoEdit(),
  "add-controlpoint": () => addControlPoint(),
  "delete-controlpoint": () => deleteSelectedControlPoint(),
  "next-section": () => nextCrossSection(),
  "previous-section": () => previousCrossSection(),
  "add-section": () => promptAddCrossSection(),
  "move-section": () => promptMoveCrossSection(),
  "add-section-panel": () => addCrossSectionFromPanel(),
  "move-section-panel": () => moveCrossSectionFromPanel(),
  "fill-sections-panel": () => fillCrossSectionsFromPanel(),
  "remove-section": () => removeCurrentCrossSection(),
  "copy-section": () => copyCurrentCrossSection(),
  "paste-section": () => pasteCurrentCrossSection(),
  "import-crosssection": () => els.crossSectionInput.click(),
  "export-crosssection": () => exportCurrentCrossSection(),
  "scale-board": () => promptScaleBoard(),
  "scale-ghost": () => scaleGhostToCurrentBoard(),
  "board-info": () => showBoardInfo(),
  "flip-board-view": () => flipBoardView(),
  "show-panel": target => showPanel(target.dataset.panelTarget),
  "set-fins": () => setFinsFromPanel(),
  "set-tail": () => setTailFromPanel(),
  "set-nose": () => setNoseFromPanel(),
  "set-wing": () => setWingFromPanel(),
  "set-rocker": () => setRockerFromPanel(),
  "reset-rocker": () => resetRockerFromPanel(),
  "set-rail": () => setRailFromPanel(),
  "set-edge": () => setEdgeFromPanel(),
  "apply-bottom-preset": () => applyBottomPresetFromPanel(),
  "set-bottom-feature": () => setBottomFeatureFromPanel(),
  "add-bottom-feature": () => addBottomFeatureFromPanel(),
  "duplicate-bottom-feature": () => duplicateBottomFeatureFromPanel(),
  "fill-bottom-feature-sections": () => fillSelectedBottomFeatureSectionsFromPanel(),
  "remove-bottom-feature": () => removeBottomFeatureFromPanel(),
  "reset-bottom-feature": () => resetBottomFeatureFromPanel(),
  "clear-bottom-features": () => clearBottomFeaturesFromPanel(),
  "move-bottom-feature-up": () => moveBottomFeatureFromPanel(-1),
  "move-bottom-feature-down": () => moveBottomFeatureFromPanel(1),
  "add-guidepoint": () => promptAddGuidePoint(),
  "edit-guidepoint": () => editGuidePointFromPanel(),
  "remove-guidepoint": () => removeGuidePoint(),
  "add-section-guidepoint": () => promptSectionGuidePoint("add"),
  "edit-section-guidepoint": () => promptSectionGuidePoint("edit"),
  "remove-section-guidepoint": () => promptSectionGuidePoint("remove"),
  "weight-defaults": () => setWeightDefaults(),
  "weight-calc": () => updateWeightOutput(),
  "settings": () => promptSettings(),
  "set-settings": () => applySettingsFromMenu(),
  "set-language": target => setLanguage(String(target.dataset.lang || "").trim().toLowerCase()),
  "language": () => promptLanguage(),
  "help": () => showHelp(),
  "about": () => showAbout(),
  "bezier-patch": () => approximate3DModel("bezierPatch", true),
  "approximate-closed": () => approximate3DModel("bezier", true),
  "approximate-open": () => approximate3DModel("bezier", false),
  "approximate-outline-rocker": () => approximate3DModel("outlineRocker", false),
  "clear-approximation": () => clear3DApproximation(),
  "view-3d": () => setView("model3d"),
  "edit-nurbs": () => editNurbsSurface(),
  "set-controlpoint": () => setSelectedControlPointFromPanel(),
  "controlpoint-horizontal": () => rotateSelectedControlPointToHorizontal(),
  "controlpoint-vertical": () => rotateSelectedControlPointToVertical(),
  "close-dialog": () => hideAppDialog()
});

els.fileInput.addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  if (/\.crs$/i.test(file.name)) {
    importCrossSectionText(text, file.name);
  } else if (/\.otl$/i.test(file.name)) {
    importOutlineText(text, file.name);
  } else if (/\.pfl$/i.test(file.name)) {
    importProfileText(text, file.name);
  } else if (/\.csv$/i.test(file.name)) {
    importProbeMeasurementsText(text, file.name);
  } else {
    loadBoard(text, file.name);
  }
  event.target.value = "";
  closeMenus();
});

if (els.ghostFileInput) els.ghostFileInput.addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  loadGhostBoard(text, file.name);
  event.target.value = "";
  closeMenus();
});

els.crossSectionInput.addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  importCrossSectionText(text, file.name);
  event.target.value = "";
});

if (els.traceImageInput) els.traceImageInput.addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  loadTraceImage(file);
  event.target.value = "";
});

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    setView(button.dataset.view);
  });
});

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", event => {
    const action = event.currentTarget.dataset.action;
    const handler = ACTION_HANDLERS[action];
    if (handler) handler(event.currentTarget, event);
    if (!ACTION_KEEP_MENU_OPEN.has(action)) closeMenus();
  });
});

document.querySelectorAll(".menu-items [data-view]").forEach(button => {
  button.addEventListener("click", event => {
    setView(event.currentTarget.dataset.view);
    closeMenus();
  });
});

document.querySelectorAll("[data-view-option]").forEach(input => {
  input.addEventListener("change", event => {
    const option = event.currentTarget.dataset.viewOption;
    state.viewOptions[option] = event.currentTarget.checked;
    draw();
    updateCanvasContextMenuState();
    closeMenus();
  });
});

document.querySelectorAll("[data-interpolation]").forEach(input => {
  input.addEventListener("change", event => {
    if (!event.currentTarget.checked) return;
    setCrossSectionInterpolation(event.currentTarget.dataset.interpolation);
    closeMenus();
  });
});

document.querySelectorAll(".menu").forEach(menu => {
  menu.addEventListener("toggle", () => {
    if (!menu.open) return;
    document.querySelectorAll(".menu[open]").forEach(openMenu => {
      if (openMenu !== menu) openMenu.removeAttribute("open");
    });
  });
});

document.querySelectorAll(".menu-submenu").forEach(submenu => {
  submenu.addEventListener("toggle", () => {
    if (!submenu.open) return;
    const parentMenu = submenu.closest(".menu-items");
    if (!parentMenu) return;
    parentMenu.querySelectorAll(".menu-submenu[open]").forEach(openSubmenu => {
      if (openSubmenu !== submenu) openSubmenu.removeAttribute("open");
    });
  });
});

document.addEventListener("pointerdown", event => {
  if (!event.target.closest(".context-menu")) hideCanvasContextMenu(true);
  if (!event.target.closest(".menu")) closeMenus();
});

document.querySelectorAll("[data-context-action]").forEach(button => {
  button.addEventListener("click", event => {
    runCanvasContextAction(event.currentTarget.dataset.contextAction);
  });
});

document.querySelectorAll("[data-context-lock]").forEach(input => {
  input.addEventListener("change", event => {
    const axis = event.currentTarget.dataset.contextLock;
    if (axis && axis in state.editLocks) state.editLocks[axis] = event.currentTarget.checked;
    updateCanvasContextMenuState();
  });
});

document.querySelectorAll("[data-context-view-option]").forEach(input => {
  input.addEventListener("change", event => {
    const option = event.currentTarget.dataset.contextViewOption;
    if (option && option in state.viewOptions) state.viewOptions[option] = event.currentTarget.checked;
    syncViewOptionInputs();
    draw();
    updateCanvasContextMenuState();
  });
});

document.addEventListener("keydown", event => {
  if (preventBrowserNavigationShortcut(event)) return;
  if (event.key === "Escape") {
    if (!els.appDialog?.hidden) hideAppDialog();
    closeMenus();
    hideCanvasContextMenu(true);
  }
  if (toggleGhostCommandFromKeyEvent(event, true)) return;
  handleKeyboardShortcut(event);
});

document.addEventListener("keyup", event => {
  toggleGhostCommandFromKeyEvent(event, false);
});

window.addEventListener("blur", () => {
  if (!state.ghost.active) return;
  state.ghost.active = false;
  draw();
});

window.addEventListener("popstate", event => {
  handleNavigationPopState(event);
});

window.addEventListener("beforeunload", event => {
  handleBeforeUnload(event);
});

document.querySelectorAll(".tool[data-tool]").forEach(button => {
  button.addEventListener("click", () => {
    setActiveTool(button.dataset.tool || "edit");
  });
});

[els.unitSelect, els.feedRate, els.laserPower, els.cncAxes, els.cncSurface, els.cncLengthSteps, els.cncWidthSteps, els.safeZ, els.segments, els.scanMode, els.scanSurface, els.scanXStep, els.scanYStep, els.scanMeasuredLength, els.scanMachineTravelX, els.scanMachineCenterY, els.probeTravel, els.probeFeed].forEach(el => {
  if (el) el.addEventListener("input", () => {
    updateHistoryButtons();
    draw();
  });
});

els.cpContinuous.addEventListener("change", () => {
  if (!state.controlPointPanelUpdating) setSelectedContinuous(els.cpContinuous.checked);
});

if (els.guideTarget) els.guideTarget.addEventListener("change", () => {
  activateGuideTarget(els.guideTarget.value, { preserveSelection: false });
});

if (els.finTemplate) els.finTemplate.addEventListener("change", () => {
  if (els.finTemplate.value && els.finType) els.finType.value = els.finTemplate.value;
  draw();
});

if (els.finSetup) els.finSetup.addEventListener("change", () => {
  applyFinSetupPreset(els.finSetup.value, true);
});

if (els.tailMode) els.tailMode.addEventListener("change", () => {
  const mode = normalizeTailModeKey(els.tailMode.value || "");
  const preset = tailPresetForBoard(mode, state.board);
  if (!preset) {
    if (els.tailLength) els.tailLength.value = fmt(0);
    if (els.tailDepth) els.tailDepth.value = fmt(0);
    if (els.tailShoulderPos) els.tailShoulderPos.value = fmt(0);
    if (els.tailShoulderScale) els.tailShoulderScale.value = fmt(0);
    if (els.tailRailBlend) els.tailRailBlend.value = fmt(0);
    if (els.tailWidthAdjust) els.tailWidthAdjust.value = "0";
    updateTailPanelFields();
    return;
  }
  if (els.tailLength) els.tailLength.value = fmt(preset.length);
  if (els.tailDepth) els.tailDepth.value = fmt(preset.depth);
  if (els.tailShoulderPos) els.tailShoulderPos.value = fmt(preset.shoulderPos);
  if (els.tailShoulderScale) els.tailShoulderScale.value = fmt(preset.shoulderScale);
  if (els.tailRailBlend) els.tailRailBlend.value = fmt(preset.railBlend);
  if (els.tailWidthAdjust) els.tailWidthAdjust.value = fmt(0);
  updateTailPanelFields();
});

if (els.tailWidthAdjust) els.tailWidthAdjust.addEventListener("input", () => {
  updateTailWidthAdjustReadout(els.tailWidthAdjust.value);
});

if (els.noseMode) els.noseMode.addEventListener("change", () => {
  const mode = normalizeNoseModeKey(els.noseMode.value || "");
  const preset = nosePresetForBoard(mode, state.board);
  if (!preset) {
    if (els.noseLength) els.noseLength.value = fmt(0);
    if (els.noseShoulderPos) els.noseShoulderPos.value = fmt(0);
    if (els.noseShoulderScale) els.noseShoulderScale.value = fmt(0);
    if (els.noseRailBlend) els.noseRailBlend.value = fmt(0);
    if (els.noseWidthAdjust) els.noseWidthAdjust.value = "0";
    updateNosePanelFields();
    return;
  }
  if (els.noseLength) els.noseLength.value = fmt(preset.length);
  if (els.noseShoulderPos) els.noseShoulderPos.value = fmt(preset.shoulderPos);
  if (els.noseShoulderScale) els.noseShoulderScale.value = fmt(preset.shoulderScale);
  if (els.noseRailBlend) els.noseRailBlend.value = fmt(preset.railBlend);
  if (els.noseWidthAdjust) els.noseWidthAdjust.value = fmt(0);
  updateNosePanelFields();
});

if (els.noseWidthAdjust) els.noseWidthAdjust.addEventListener("input", () => {
  updateNoseWidthAdjustReadout(els.noseWidthAdjust.value);
});

if (els.wingPreset) els.wingPreset.addEventListener("change", () => {
  const presetKey = normalizeWingPresetKey(els.wingPreset.value);
  if (!presetKey) {
    if (els.wingPosition) els.wingPosition.value = fmt(0);
    if (els.wingWidth) els.wingWidth.value = fmt(0);
    if (els.wingShape) els.wingShape.value = "bump";
    if (els.wingShoulder) els.wingShoulder.value = fmt(0);
    if (els.wingTransition) els.wingTransition.value = fmt(0);
    updateWingPanelFields();
    return;
  }
  if (presetKey === "custom") {
    if (els.wingShape && !normalizeWingShapeKey(els.wingShape.value)) els.wingShape.value = "bump";
    updateWingPanelFields();
    return;
  }
  const preset = wingPresetForBoard(presetKey, state.board);
  if (preset) {
    if (els.wingPosition) els.wingPosition.value = fmt(preset.distance);
    if (els.wingWidth) els.wingWidth.value = fmt(preset.width);
    if (els.wingShape) els.wingShape.value = preset.shape;
    if (els.wingShoulder) els.wingShoulder.value = fmt(preset.shoulder ?? 0);
    if (els.wingTransition) els.wingTransition.value = fmt(preset.transition ?? 0);
  }
  updateWingPanelFields();
});

if (els.wingShape) els.wingShape.addEventListener("change", () => {
  const shape = normalizeWingShapeKey(els.wingShape.value) || "bump";
  if (shape !== "bump") {
    if (els.wingShoulder) els.wingShoulder.value = fmt(0);
    if (els.wingTransition) els.wingTransition.value = fmt(0);
  } else if (normalizeWingPresetKey(els.wingPreset?.value) && normalizeWingPresetKey(els.wingPreset?.value) !== "custom") {
    const preset = wingPresetForBoard(els.wingPreset.value, state.board);
    if (preset) {
      if (els.wingShoulder) els.wingShoulder.value = fmt(preset.shoulder ?? 0);
      if (els.wingTransition) els.wingTransition.value = fmt(preset.transition ?? 1);
    }
  }
  updateWingPanelFields();
});

if (els.rockerPreset) els.rockerPreset.addEventListener("change", () => {
  const preset = rockerPresetOrDefault(els.rockerPreset.value);
  applyRockerPresetToPanel(preset, state.board);
});

if (els.rockerPreserveDeck) els.rockerPreserveDeck.addEventListener("change", () => {
  if (els.rockerPreserveDeck.checked && els.rockerPreserveFoil) els.rockerPreserveFoil.checked = false;
  updateRockerPanelReadout(readRockerConfigFromPanel());
});

if (els.rockerPreserveFoil) els.rockerPreserveFoil.addEventListener("change", () => {
  if (els.rockerPreserveFoil.checked && els.rockerPreserveDeck) els.rockerPreserveDeck.checked = false;
  updateRockerPanelReadout(readRockerConfigFromPanel());
});

[
  els.rockerEnabled, els.rockerNose, els.rockerTail, els.rockerEntryLength, els.rockerEntryLift,
  els.rockerMiddleFlatness, els.rockerTailKickLength, els.rockerTailKick, els.rockerApexShift, els.rockerBlend
].forEach(el => {
  if (el) el.addEventListener("input", () => updateRockerPanelReadout(readRockerConfigFromPanel()));
});

if (els.edgeType) els.edgeType.addEventListener("change", () => {
  const type = normalizeEdgeTypeKey(els.edgeType.value || "");
  const boardLength = Math.max(0, Number(state.board?.length) || 0);
  if (!type) {
    if (els.edgeStrength) els.edgeStrength.value = fmt(0);
    if (els.edgeLength) els.edgeLength.value = fmt(0);
    if (els.edgeFade) els.edgeFade.value = fmt(0);
    updateEdgePanelFields();
    return;
  }
  if (els.edgeStrength && !(Number(els.edgeStrength.value) > 0)) els.edgeStrength.value = fmt(1);
  if (els.edgeLength && !(Number(els.edgeLength.value) > 0)) els.edgeLength.value = fmt(boardLength * 0.38);
  if (els.edgeFade && !(Number(els.edgeFade.value) > 0)) els.edgeFade.value = fmt(Math.min(boardLength * 0.12, (Number(els.edgeLength?.value) || 0) * 0.35));
  updateEdgePanelFields();
});

if (els.bottomFeatureIndex) els.bottomFeatureIndex.addEventListener("change", () => {
  const previousIndex = Number(els.bottomFeatureIndex.dataset.previousIndex);
  if (Number.isInteger(previousIndex) && previousIndex >= 0) {
    persistBottomFeaturePanelSelection(previousIndex);
  }
  syncBottomFeaturePanel();
  draw();
});

if (els.bottomFeaturePreset) els.bottomFeaturePreset.addEventListener("change", () => {
  updateBottomPanelFields();
});

if (els.bottomFeatureType) els.bottomFeatureType.addEventListener("change", () => {
  applyBottomFeatureTypeDefaults(normalizeBottomFeatureType(els.bottomFeatureType.value) || "single-concave", true);
  updateBottomPanelFields();
  updateBottomFeatureSummary(selectedBottomFeaturePreview(state.board));
  draw();
});

if (els.bottomFeatureEnabled) els.bottomFeatureEnabled.addEventListener("change", () => {
  updateBottomPanelFields();
  updateBottomFeatureSummary(selectedBottomFeaturePreview(state.board));
  draw();
});

if (els.miscBridgePreset) els.miscBridgePreset.addEventListener("change", () => {
  apply3DMousePreset(els.miscBridgePreset.value || "generic", false);
  sync3DMouseBridgeSettingsControls();
});

function sanitizeBottomFeaturePanelValues() {
  if (!state.board) return;
  const type = normalizeBottomFeatureType(els.bottomFeatureType?.value) || "single-concave";
  const spec = bottomFeatureTypeSpec(type);
  const visible = spec?.visibleFields || {};
  const defaults = bottomFeatureDefault(type, Math.max(0, bottomFeatureSelectionIndex()), state.board?.length, state.board?.width);
  const length = Math.max(1, state.board?.length || defaults.end);
  const [depthMin, depthMax] = bottomFeatureLimit(type, "depth", 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01);
  const [widthMin, widthMax] = bottomFeatureLimit(type, "width", 0.05, 1, 0.01);
  const [blendMin, blendMax] = bottomFeatureLimit(type, "blend", 0.1, 4, 0.05);
  const [powerMin, powerMax] = bottomFeatureLimit(type, "power", 0.4, 4, 0.05);
  const [edgeMin, edgeMax] = bottomFeatureLimit(type, "edge", 0, 1, 0.05);
  const [offsetMin, offsetMax] = bottomFeatureLimit(type, "offset", 0, 0.95, 0.01);
  const [spacingMin, spacingMax] = bottomFeatureLimit(type, "spacing", 0, 0.5, 0.01);
  const [countMin, countMax] = bottomFeatureLimit(type, "count", 1, 10, 1);
  const [longitudinalFlatMin, longitudinalFlatMax] = bottomFeatureLimit(type, "longitudinalFlat", 0, 1, 0.05);
  const [centerMin, centerMax] = bottomFeatureLimit(type, "centerDepth", 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01);
  const [railMin, railMax] = bottomFeatureLimit(type, "railDepth", 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01);
  const railLockMin = 0;
  const railLockMax = BOTTOM_FEATURE_RAIL_LOCK_CM_MAX;
  const normalized = normalizeBottomFeature({
    type,
    start: clampNumber(els.bottomFeatureStart?.value, 0, length, defaults.start),
    peak: clampNumber(els.bottomFeaturePeak?.value, 0, length, defaults.peak),
    end: clampNumber(els.bottomFeatureEnd?.value, 0, length, defaults.end),
    depth: visible.depth === false ? defaults.depth : clampNumber(els.bottomFeatureDepth?.value, depthMin, depthMax, defaults.depth),
    centerDepth: visible.centerDepth === false ? defaults.centerDepth : clampNumber(els.bottomFeatureCenterDepth?.value, centerMin, centerMax, defaults.centerDepth),
    railDepth: visible.railDepth === false ? defaults.railDepth : clampNumber(els.bottomFeatureRailDepth?.value, railMin, railMax, defaults.railDepth),
    width: clampNumber(els.bottomFeatureWidth?.value, widthMin, widthMax, defaults.width),
    blend: clampNumber(els.bottomFeatureBlend?.value, blendMin, blendMax, defaults.blend),
    power: clampNumber(els.bottomFeaturePower?.value, powerMin, powerMax, defaults.power),
    edge: visible.edge === false ? defaults.edge : clampNumber(els.bottomFeatureEdge?.value, edgeMin, edgeMax, defaults.edge),
    offset: visible.offset === false ? defaults.offset : clampNumber(els.bottomFeatureOffset?.value, offsetMin, offsetMax, defaults.offset),
    spacing: visible.spacing === false ? defaults.spacing : clampNumber(els.bottomFeatureSpacing?.value, spacingMin, spacingMax, defaults.spacing),
    count: visible.count === false ? defaults.count : clampNumber(els.bottomFeatureCount?.value, countMin, countMax, defaults.count),
    longitudinalFlat: visible.longitudinalFlat === true ? clampNumber(els.bottomFeatureLongitudinalFlat?.value, longitudinalFlatMin, longitudinalFlatMax, defaults.longitudinalFlat) : defaults.longitudinalFlat,
    railLockCm: clampNumber(els.bottomFeatureRailLockCm?.value, railLockMin, railLockMax, defaults.railLockCm)
  });
  if (!normalized) return;
  if (els.bottomFeatureStart) els.bottomFeatureStart.value = fmt(normalized.start);
  if (els.bottomFeaturePeak) els.bottomFeaturePeak.value = fmt(normalized.peak);
  if (els.bottomFeatureEnd) els.bottomFeatureEnd.value = fmt(normalized.end);
  if (els.bottomFeatureDepth) els.bottomFeatureDepth.value = fmt(normalized.depth);
  if (els.bottomFeatureCenterDepth) els.bottomFeatureCenterDepth.value = fmt(normalized.centerDepth);
  if (els.bottomFeatureRailDepth) els.bottomFeatureRailDepth.value = fmt(normalized.railDepth);
  if (els.bottomFeatureRailLockCm) els.bottomFeatureRailLockCm.value = fmt(normalized.railLockCm);
  if (els.bottomFeatureWidth) els.bottomFeatureWidth.value = fmt(normalized.width);
  if (els.bottomFeatureBlend) els.bottomFeatureBlend.value = fmt(normalized.blend);
  if (els.bottomFeaturePower) els.bottomFeaturePower.value = fmt(normalized.power);
  if (els.bottomFeatureEdge) els.bottomFeatureEdge.value = fmt(normalized.edge);
  if (els.bottomFeatureOffset) els.bottomFeatureOffset.value = fmt(normalized.offset);
  if (els.bottomFeatureSpacing) els.bottomFeatureSpacing.value = fmt(normalized.spacing);
  if (els.bottomFeatureCount) els.bottomFeatureCount.value = String(normalized.count);
  if (els.bottomFeatureLongitudinalFlat) els.bottomFeatureLongitudinalFlat.value = fmt(normalized.longitudinalFlat);
}

[
  els.bottomFeatureStart, els.bottomFeaturePeak, els.bottomFeatureEnd, els.bottomFeatureDepth,
  els.bottomFeatureCenterDepth, els.bottomFeatureRailDepth, els.bottomFeatureRailLockCm, els.bottomFeatureWidth,
  els.bottomFeatureBlend, els.bottomFeaturePower, els.bottomFeatureEdge, els.bottomFeatureOffset,
  els.bottomFeatureSpacing, els.bottomFeatureCount, els.bottomFeatureLongitudinalFlat
].forEach(el => {
  if (!el) return;
  el.addEventListener("change", () => {
    sanitizeBottomFeaturePanelValues();
    updateBottomPanelFields();
    updateBottomFeatureSummary(selectedBottomFeaturePreview(state.board));
    draw();
  });
});

if (els.traceTarget) els.traceTarget.addEventListener("change", () => {
  syncTracePanel();
  draw();
});

[els.traceVisible, els.traceOpacity, els.traceScale, els.traceRotation, els.traceX, els.traceY, els.traceMoveStep].forEach(el => {
  if (!el) return;
  const eventName = el.type === "checkbox" ? "change" : "input";
  el.addEventListener(eventName, () => {
    updateActiveTraceFromPanel();
    draw();
  });
});

[
  els.weightStringerWidth, els.weightStringerDensity, els.weightFoamDensity,
  els.weightDeckGlass, els.weightDeckLapWidth, els.weightBottomGlass,
  els.weightBottomLapWidth, els.weightResinRatio, els.weightHotcoat, els.weightPlugsFins
].forEach(el => {
  if (el) el.addEventListener("input", updateWeightOutput);
});

window.addEventListener("resize", () => {
  draw();
  scheduleBottomFeatureDomOverlaySync();
});
window.addEventListener("scroll", () => {
  scheduleBottomFeatureDomOverlaySync();
}, { passive: true });

els.canvas.addEventListener("pointerdown", onCanvasPointerDown);
els.canvas.addEventListener("pointermove", onCanvasPointerMove);
els.canvas.addEventListener("pointerleave", onCanvasPointerLeave);
els.canvas.addEventListener("wheel", onCanvasWheel, { passive: false });
els.canvas.addEventListener("contextmenu", onCanvasContextMenu);
window.addEventListener("pointerup", onCanvasPointerUp);

function loadBoard(text, filename) {
  try {
    activateBoard(parseBrd(text, filename), t("status_board_loaded", { filename }));
  } catch (error) {
    console.error(error);
    setStatus("status_load_failed", { message: error.message });
  }
}

function activateBoard(board, status) {
  state.board = board;
  clearRockerRuntimeBase(state.board);
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  state.contextEditPoint = null;
  state.drag = null;
  state.viewDrag = null;
  state.flipped = false;
  state.currentSectionIndex = defaultCurrentSectionIndex(board);
  state.history.undo = [];
  state.history.redo = [];
  markGeometryDirty();
  resetViewState();
  els.downloadScanButton.disabled = true;
  if (status) els.status.textContent = status;
  updateInfo();
  updateSectionInfo();
  updateEditInfo();
  updateHistoryButtons();
  draw();
}

function createNewBoard() {
  const length = 180;
  const outline = splineFromOrderedPoints([
    { x: 0, y: 0 },
    { x: 18, y: 17 },
    { x: 72, y: 25 },
    { x: 142, y: 19 },
    { x: length, y: 0 }
  ]);
  const bottom = splineFromOrderedPoints([
    { x: 0, y: 4.2 },
    { x: 55, y: 0 },
    { x: 140, y: 1.2 },
    { x: length, y: 5.2 }
  ]);
  const deck = splineFromOrderedPoints([
    { x: 0, y: 4.2 },
    { x: 55, y: 6 },
    { x: 140, y: 5.4 },
    { x: length, y: 5.2 }
  ]);
  const sectionAt = (position, halfWidth, thickness) => ({ position, spline: makeScannedCrossSection(halfWidth, thickness), guidePoints: [] });
  activateBoard({
    filename: "Untitled.brd",
    name: "Untitled",
    version: "BoardCAD Web",
    fields: {},
    length,
    width: 50,
    thickness: 6,
    interpolationType: state.crossSectionInterpolation,
    finType: "",
    fins: Array(9).fill(0),
    finSetup: "",
    finToeIn: 0,
    finCant: 0,
    finExtra: [],
    tailMode: "",
    tailLength: 0,
    tailDepth: 0,
    tailShoulderPos: 0,
    tailShoulderScale: 0,
    tailRailBlend: 0,
    tailLinearization: 0,
    tailWidthAdjust: 0,
    noseMode: "",
    noseLength: 0,
    noseShoulderPos: 0,
    noseShoulderScale: 0,
    noseRailBlend: 0,
    noseLinearization: 0,
    noseWidthAdjust: 0,
    wingPreset: "",
    wingPosition: 0,
    wingWidth: 0,
    wingShape: "",
    wingShoulder: 0,
    wingTransition: 0,
    railMode: "",
    railStrength: 1,
    edgeType: "",
    edgeStrength: 0,
    edgeLength: 0,
    edgeFade: 0,
    bottomPreset: "custom",
    bottomFeatures: [],
    outlineGuidePoints: [],
    bottomGuidePoints: [],
    deckGuidePoints: [],
    outline,
    bottom,
    deck,
    sections: [
      sectionAt(0, 0.01, 0.01),
      sectionAt(36, 18, 5),
      sectionAt(90, 25, 6),
      sectionAt(144, 17, 4.8),
      sectionAt(length, 0.01, 0.01)
    ]
  }, t("status_new_board_created"));
}

function loadGhostBoard(text, filename) {
  try {
    const ghostBoard = parseBrd(text, filename);
    state.ghost.board = ghostBoard;
    state.ghost.offsetX = 0;
    state.ghost.offsetY = 0;
    state.ghost.rotation = 0;
    state.ghost.active = false;
    state.viewOptions.showGhostBoard = true;
    syncViewOptionInputs();
    updateInfo();
    updateHistoryButtons();
    draw();
    setStatus("status_ghost_loaded", { filename });
  } catch (error) {
    console.error(error);
    setStatus("status_ghost_load_failed", { message: error.message });
  }
}

function openBoardFilePicker() {
  if (!els.fileInput) return;
  els.fileInput.click();
}

function openGhostBoardFilePicker() {
  if (!els.ghostFileInput) return;
  els.ghostFileInput.click();
}

async function loadSelectedSample() {
  const sampleUrl = els.sampleSelect.value || "./Shortboard.brd";
  await loadSampleByUrl(sampleUrl);
}

function bundledSampleText(sampleUrl) {
  const store = (typeof window !== "undefined" && window.BOARDCAD_SAMPLE_DATA) ? window.BOARDCAD_SAMPLE_DATA : null;
  if (!store || typeof store !== "object") return "";
  const filename = sampleFilenameFromUrl(sampleUrl);
  return typeof store[filename] === "string" ? store[filename] : "";
}

function loadBundledSample(sampleUrl) {
  const resolvedUrl = sampleUrl || "./Shortboard.brd";
  const bundled = bundledSampleText(resolvedUrl);
  if (!bundled) return false;
  const filename = sampleFilenameFromUrl(resolvedUrl);
  loadBoard(bundled, filename);
  applySampleBoardDefaults(filename);
  return true;
}

async function loadSampleByUrl(sampleUrl) {
  const resolvedUrl = sampleUrl || "./Shortboard.brd";
  syncSampleSelectValue(resolvedUrl);
  if (loadBundledSample(resolvedUrl)) return;
  let response;
  try {
    response = await fetch(resolvedUrl);
  } catch (error) {
    console.error(error);
    setStatus("status_sample_fetch_failed_file");
    return;
  }
  if (!response.ok) {
    setStatus("status_sample_fetch_failed_file");
    return;
  }
  const filename = resolvedUrl.split("/").pop() || "sample.brd";
  loadBoard(await response.text(), filename);
  applySampleBoardDefaults(filename);
}

function syncSampleSelectValue(value) {
  if (els.sampleSelect && Array.from(els.sampleSelect.options).some(option => option.value === value)) {
    els.sampleSelect.value = value;
  }
}

function applySampleBoardDefaults(filename) {
  if (!state.board) return;
  if (!/^shortboard\.brd$/i.test(String(filename || ""))) return;
  state.board.tailMode = "squash";
  state.board.tailLength = 0;
  state.board.tailDepth = 0;
  state.board.tailShoulderPos = 0;
  state.board.tailShoulderScale = 0;
  state.board.tailRailBlend = 0;
  state.board.tailLinearization = 0;
  state.board.tailWidthAdjust = 0;
  markGeometryDirty();
  updateInfo();
  updateSectionInfo();
  updateEditInfo();
  updateHistoryButtons();
  draw();
  setStatus("status_sample_defaults_applied", { filename, tail: tailModeLabel("squash") });
}

function sampleFilenameFromUrl(sampleUrl) {
  const filename = String(sampleUrl || "").split("/").pop();
  return filename && /\.brd$/i.test(filename) ? filename : "Shortboard.brd";
}

function loadStartupSampleFromQuery() {
  if (typeof window === "undefined" || !window.location || window.location.protocol === "file:") return;
  const params = new URLSearchParams(window.location.search || "");
  if (!params.has("sample")) return;
  const filename = sampleFilenameFromUrl(params.get("sample"));
  const value = `./${filename}`;
  if (els.sampleSelect && Array.from(els.sampleSelect.options).some(option => option.value === value)) {
    els.sampleSelect.value = value;
  }
  loadSelectedSample();
}

function generateProbeScan() {
  const board = state.board || makeScanReferenceBoard();
  if (!board) {
    setStatus("status_scan_length_required");
    return;
  }
  state.probeScanGCode = makeProbeScanGCode(board);
  els.downloadScanButton.disabled = false;
  els.sendScanButton.disabled = !state.serial.connected;
  resetProbeSimulation(false);
  const simulation = parseProbeSimulation(state.probeScanGCode);
  state.scan.simulation.segments = simulation.segments;
  updateSimulationButtons();
  const lineCount = state.probeScanGCode.split("\n").filter(Boolean).length;
  appendScanLog(t("log_generated_probe_scan", {
    lineCount,
    moveCount: simulation.segments.length
  }));
  setStatus("status_probe_gcode_generated");
  if (state.view === "scan") draw();
}

function downloadProbeScanGCode() {
  if (!state.probeScanGCode) generateProbeScan();
  if (!state.probeScanGCode) return;
  downloadBlob(`${safeName(state.board?.name || "scanned-board")}-probe-scan.nc`, state.probeScanGCode, "text/plain");
}

function startProbeSimulation() {
  if (!state.probeScanGCode) generateProbeScan();
  if (!state.probeScanGCode) return;
  const simulation = parseProbeSimulation(state.probeScanGCode);
  if (!simulation.segments.length) {
    setStatus("status_probe_simulation_empty");
    updateSimulationButtons();
    return;
  }
  cancelProbeSimulationFrame();
  state.scan.simulation = {
    segments: simulation.segments,
    index: 0,
    progress: 0,
    playing: true,
    frame: null,
    lastTime: performance.now()
  };
  setView("scan");
  updateSimulationButtons();
  setStatus("status_probe_simulation_ready", { moves: simulation.segments.length });
  draw();
  state.scan.simulation.frame = requestAnimationFrame(tickProbeSimulation);
}

function pauseProbeSimulation() {
  const sim = state.scan.simulation;
  if (!sim.segments.length) return;
  if (sim.playing) {
    sim.playing = false;
    cancelProbeSimulationFrame();
    setStatus("status_probe_simulation_paused");
  } else {
    sim.playing = true;
    sim.lastTime = performance.now();
    setStatus("status_probe_simulation_resumed");
    sim.frame = requestAnimationFrame(tickProbeSimulation);
  }
  updateSimulationButtons();
  draw();
}

function stepProbeSimulation() {
  if (!state.probeScanGCode && !state.scan.simulation.segments.length) generateProbeScan();
  const sim = state.scan.simulation;
  if (!sim.segments.length && state.probeScanGCode) {
    sim.segments = parseProbeSimulation(state.probeScanGCode).segments;
  }
  if (!sim.segments.length) return;
  sim.playing = false;
  cancelProbeSimulationFrame();
  if (sim.progress < 1) {
    sim.progress = 1;
  } else if (sim.index < sim.segments.length - 1) {
    sim.index += 1;
    sim.progress = 1;
  }
  const segment = sim.segments[sim.index];
  const point = segment?.point ? `P${segment.point.index} ${segment.point.surface}` : `line ${segment?.line || 0}`;
  setStatus("status_probe_simulation_step", { point });
  updateSimulationButtons();
  setView("scan");
  draw();
}

function resetProbeSimulation(clearSegments = true) {
  cancelProbeSimulationFrame();
  const segments = clearSegments ? [] : state.scan.simulation.segments;
  state.scan.simulation = {
    segments,
    index: 0,
    progress: 0,
    playing: false,
    frame: null,
    lastTime: 0
  };
  updateSimulationButtons();
  if (state.view === "scan") draw();
}

function cancelProbeSimulationFrame() {
  const frame = state.scan.simulation?.frame;
  if (frame) cancelAnimationFrame(frame);
  if (state.scan.simulation) state.scan.simulation.frame = null;
}

function tickProbeSimulation(now) {
  const sim = state.scan.simulation;
  if (!sim.playing || !sim.segments.length) return;
  const segment = sim.segments[sim.index];
  if (!segment) {
    sim.playing = false;
    updateSimulationButtons();
    draw();
    return;
  }
  const elapsed = Math.max(0, now - (sim.lastTime || now));
  sim.lastTime = now;
  sim.progress += elapsed / probeSimulationSegmentDuration(segment);
  while (sim.progress >= 1 && sim.playing) {
    sim.progress -= 1;
    sim.index += 1;
    if (sim.index >= sim.segments.length) {
      sim.index = sim.segments.length - 1;
      sim.progress = 1;
      sim.playing = false;
      setStatus("status_probe_simulation_finished");
      break;
    }
  }
  updateSimulationButtons();
  draw();
  if (sim.playing) sim.frame = requestAnimationFrame(tickProbeSimulation);
}

function probeSimulationSegmentDuration(segment) {
  const distance = machineDistance3D(segment.from, segment.to);
  const base = segment.type === "probe" ? 320 : 180;
  const byDistance = distance * (segment.type === "probe" ? 7 : 2.2);
  return clampNumber(base + byDistance, 120, segment.type === "probe" ? 1600 : 900, base);
}

function updateSimulationButtons() {
  const sim = state.scan?.simulation;
  const hasPlan = !!state.probeScanGCode || !!sim?.segments.length;
  const hasSegments = !!sim?.segments.length;
  setDisabled([els.simulateScanButton], !hasPlan);
  setDisabled([els.pauseSimulationButton, els.stepSimulationButton, els.resetSimulationButton], !hasSegments);
  if (els.pauseSimulationButton) els.pauseSimulationButton.textContent = sim?.playing ? "Pause" : "Resume";
}

function parseProbeSimulation(gcode) {
  const centerY = clampNumber(els.scanMachineCenterY?.value, 0, CNC_MACHINE_LIMITS_MM.y, CNC_MACHINE_LIMITS_MM.y / 2);
  let current = { x: 0, y: centerY, z: 0 };
  let feed = Number(els.feedRate?.value) || 800;
  let pendingProbePoint = null;
  let currentPhase = "";
  const segments = [];
  String(gcode || "").split(/\r?\n/).forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (!line) return;
    const phaseMatch = line.match(/^\(PHASE\s+(.+)\)$/i);
    if (phaseMatch) currentPhase = phaseMatch[1];
    const probePoint = parseProbePointComment(line);
    if (probePoint) pendingProbePoint = { ...probePoint, phase: currentPhase };
    const command = line.replace(/\([^)]*\)/g, "").trim();
    if (!command) return;
    const motion = command.match(/^(G0|G00|G1|G01|G38\.2)\b/i);
    if (!motion) return;
    const words = parseGCodeWords(command);
    if (Number.isFinite(words.F)) feed = words.F;
    const next = { ...current };
    if (Number.isFinite(words.X)) next.x = words.X;
    if (Number.isFinite(words.Y)) next.y = words.Y;
    if (Number.isFinite(words.Z)) next.z = words.Z;
    if (Number.isFinite(words.A)) next.a = words.A;
    if (machineDistance3D(current, next) <= 1e-9) return;
    segments.push({
      type: /^G38\.2$/i.test(motion[1]) ? "probe" : "rapid",
      from: { ...current },
      to: { ...next },
      feed,
      line: lineIndex + 1,
      command,
      phase: currentPhase,
      point: pendingProbePoint
    });
    current = next;
  });
  return { segments };
}

function parseProbePointComment(line) {
  const match = line.match(/^\(P\s+(\d+)\s+([^\s]+)\s+BX(-?\d+(?:\.\d+)?)\s+BY(-?\d+(?:\.\d+)?)\s+MX(-?\d+(?:\.\d+)?)\s+MY(-?\d+(?:\.\d+)?)([^)]*)\)/i);
  if (!match) return null;
  const extras = parseGCodeWords(match[7] || "");
  return {
    index: Number(match[1]),
    surface: match[2],
    x: Number(match[3]),
    y: Number(match[4]),
    machineX: Number(match[5]),
    machineY: Number(match[6]),
    z: Number.isFinite(extras.BZ) ? extras.BZ : undefined,
    targetY: Number.isFinite(extras.TY) ? extras.TY : undefined,
    targetZ: Number.isFinite(extras.TZ) ? extras.TZ : undefined,
    a: Number.isFinite(extras.A) ? extras.A : undefined
  };
}

function parseGCodeWords(line) {
  const words = {};
  String(line).replace(/([A-Z][A-Z]?)\s*(-?\d+(?:\.\d+)?)/gi, (_, key, value) => {
    words[key.toUpperCase()] = Number(value);
    return "";
  });
  return words;
}

function machineDistance3D(a, b) {
  return Math.hypot((b.x || 0) - (a.x || 0), (b.y || 0) - (a.y || 0), (b.z || 0) - (a.z || 0));
}

function makeScanReferenceBoard() {
  const scale = unitScale();
  const measuredLength = Number(els.scanMeasuredLength.value);
  if (!Number.isFinite(measuredLength) || measuredLength <= 0) return null;
  const length = measuredLength / scale;
  const machine = probeMachineLimits();
  const width = Math.min(machine.y * 0.72, machine.y - 40) / scale;
  const thickness = 8;
  return {
    filename: "scan-reference.brd",
    name: "Scanned board",
    version: "BoardCAD Web scan reference",
    fields: {},
    length,
    width,
    thickness,
    interpolationType: state.crossSectionInterpolation,
    finType: "",
    fins: Array(9).fill(0),
  finSetup: "",
  finToeIn: 0,
  finCant: 0,
  finExtra: [],
  tailMode: "",
  tailLength: 0,
  tailDepth: 0,
  tailShoulderPos: 0,
  tailShoulderScale: 0,
  tailRailBlend: 0,
  tailLinearization: 0,
  tailWidthAdjust: 0,
  noseMode: "",
  noseLength: 0,
  noseShoulderPos: 0,
  noseShoulderScale: 0,
  noseRailBlend: 0,
  noseLinearization: 0,
  noseWidthAdjust: 0,
  wingPreset: "",
  wingPosition: 0,
  wingWidth: 0,
  wingShape: "",
  wingShoulder: 0,
  wingTransition: 0,
  railMode: "",
  railStrength: 1,
  edgeType: "",
  edgeStrength: 0,
  edgeLength: 0,
  edgeFade: 0,
  bottomFeatures: [],
  outlineGuidePoints: [],
    bottomGuidePoints: [],
    deckGuidePoints: [],
    outline: splineFromPoints([
      { x: 0, y: 0 },
      { x: length * 0.25, y: width / 2 },
      { x: length * 0.75, y: width / 2 },
      { x: length, y: 0 }
    ]),
    bottom: splineFromPoints([
      { x: 0, y: 0 },
      { x: length * 0.5, y: 0 },
      { x: length, y: 0 }
    ]),
    deck: splineFromPoints([
      { x: 0, y: thickness },
      { x: length * 0.5, y: thickness },
      { x: length, y: thickness }
    ]),
    sections: []
  };
}

function startScanNewBoard() {
  state.scan.active = true;
  state.scan.nose = null;
  state.scan.tail = null;
  state.probeMeasurements = [];
  state.probeScanGCode = "";
  resetProbeSimulation(false);
  if (els.scanMeasuredLength) els.scanMeasuredLength.value = "";
  if (els.scanLog) els.scanLog.value = "";
  setView("scan");
  updateScanPositionReadout();
  setStatus("status_scan_start");
}

function currentControllerPosition() {
  return state.scan.currentPosition;
}

function updateScanMeasuredLengthFromEndpoints() {
  if (!state.scan.tail || !state.scan.nose) return 0;
  const measuredLength = Math.abs((state.scan.nose.x ?? 0) - (state.scan.tail.x ?? 0));
  if (measuredLength > 0 && els.scanMeasuredLength) els.scanMeasuredLength.value = fmt(measuredLength);
  return measuredLength;
}

function setScanNosePoint() {
  const pos = currentControllerPosition();
  if (!pos) {
    setStatus("status_scan_position_missing");
    return;
  }
  state.scan.nose = { ...pos };
  state.scan.active = true;
  appendScanLog(t("log_scan_nose", {
    x: fmt(pos.x),
    y: fmt(pos.y),
    z: fmt(pos.z)
  }));
  const measuredLength = updateScanMeasuredLengthFromEndpoints();
  setStatus(
    measuredLength > 0 ? "status_scan_nose_set_with_length" : "status_scan_nose_set_without_length",
    { length: fmt(measuredLength) }
  );
  updateScanPositionReadout();
  updateHistoryButtons();
  draw();
}

function setScanTailPoint() {
  const pos = currentControllerPosition();
  if (!pos) {
    setStatus("status_scan_position_missing");
    return;
  }
  state.scan.tail = { ...pos };
  state.scan.active = true;
  const measuredLength = updateScanMeasuredLengthFromEndpoints();
  appendScanLog(t("log_scan_tail", {
    x: fmt(pos.x),
    y: fmt(pos.y),
    z: fmt(pos.z),
    length: fmt(measuredLength)
  }));
  setStatus(
    measuredLength > 0 ? "status_scan_tail_set_with_length" : "status_scan_tail_set_without_length",
    { length: fmt(measuredLength) }
  );
  updateScanPositionReadout();
  updateHistoryButtons();
  draw();
}

async function returnToScanTail() {
  const targetY = state.scan.tail?.y ?? clampNumber(els.scanMachineCenterY.value, 0, CNC_MACHINE_LIMITS_MM.y, CNC_MACHINE_LIMITS_MM.y / 2);
  const safeZ = Number(els.safeZ.value) || 80;
  await sendManualGCode([
    `G0 Z${fmt(safeZ)}`,
    `G0 X0 Y${fmt(targetY)}`
  ], "return to tail");
}

async function requestControllerPosition() {
  if (!state.serial.connected || !state.serial.writer) {
    appendScanLog(t("serial_not_connected"));
    return;
  }
  const encoder = new TextEncoder();
  await state.serial.writer.write(encoder.encode("?\n"));
}

async function jogController(axis, dir) {
  if (!axis || !dir || !state.serial.connected || !state.serial.writer) {
    appendScanLog(t("serial_not_connected"));
    return;
  }
  const step = clampNumber(els.jogStep.value, 0.01, 100, 10) * dir;
  const feed = clampInt(els.jogFeed.value, 1, 5000, 800);
  await sendManualGCode([`$J=G91 ${axis}${fmt(step)} F${fmt(feed)}`], `jog ${axis}`);
}

async function sendManualGCode(lines, label) {
  if (!state.serial.connected || !state.serial.writer) {
    appendScanLog(t("serial_not_connected"));
    return;
  }
  const encoder = new TextEncoder();
  appendScanLog(t("log_manual", { label }));
  for (const line of lines) {
    appendScanLog(`> ${line}`);
    await state.serial.writer.write(encoder.encode(`${line}\n`));
    if (!line.startsWith("$J=")) await waitForControllerAck(8000);
  }
}

async function connectSerial() {
  if (!("serial" in navigator)) {
    appendScanLog(t("web_serial_unavailable"));
    return;
  }
  try {
    if (state.serial.connected) {
      await disconnectSerial();
      return;
    }
    const baudRate = clampInt(els.serialBaud.value, 9600, 921600, 115200);
    if (!state.serial.availablePorts.length) await refreshSerialPorts();
    const selectedIndex = Number(els.serialPortSelect?.value);
    state.serial.port = Number.isInteger(selectedIndex) && state.serial.availablePorts[selectedIndex]
      ? state.serial.availablePorts[selectedIndex]
      : await navigator.serial.requestPort();
    await refreshSerialPorts(state.serial.port);
    await state.serial.port.open({ baudRate });
    state.serial.writer = state.serial.port.writable.getWriter();
    state.serial.reader = state.serial.port.readable.getReader();
    state.serial.connected = true;
    els.connectSerialButton.textContent = t("disconnect");
    els.sendScanButton.disabled = !state.probeScanGCode;
    els.sendCncButton.disabled = !state.board;
    appendScanLog(t("serial_connected", { baudRate }));
    startPositionPolling();
    readSerialLoop();
  } catch (error) {
    appendScanLog(t("serial_connect_failed", { message: error.message }));
  }
}

async function refreshSerialPorts(selectedPort = null) {
  if (!("serial" in navigator)) {
    appendScanLog(t("web_serial_unavailable_short"));
    return;
  }
  const ports = await navigator.serial.getPorts();
  state.serial.availablePorts = ports;
  if (!els.serialPortSelect) return;
  els.serialPortSelect.innerHTML = "";
  if (!ports.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = `${t("no_authorized_ports")} / ${t("choose_port")}`;
    els.serialPortSelect.appendChild(option);
    return;
  }
  ports.forEach((port, index) => {
    const info = typeof port.getInfo === "function" ? port.getInfo() : {};
    const usb = info.usbVendorId ? ` USB ${info.usbVendorId}:${info.usbProductId || ""}` : "";
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `Port ${index + 1}${usb}`;
    els.serialPortSelect.appendChild(option);
    if (selectedPort && port === selectedPort) els.serialPortSelect.value = String(index);
  });
}

async function selectSerialPort() {
  if (!("serial" in navigator)) {
    appendScanLog(t("web_serial_unavailable_short"));
    return;
  }
  try {
    const port = await navigator.serial.requestPort();
    await refreshSerialPorts(port);
    appendScanLog(t("serial_port_selected"));
  } catch (error) {
    appendScanLog(t("serial_port_selection_cancelled", { message: error.message }));
  }
}

async function disconnectSerial() {
  try {
    state.serial.connected = false;
    resolveSerialAck(false);
    if (state.serial.reader) {
      await state.serial.reader.cancel().catch(() => {});
      state.serial.reader.releaseLock();
    }
    if (state.serial.writer) state.serial.writer.releaseLock();
    if (state.serial.port) await state.serial.port.close().catch(() => {});
  } finally {
    stopPositionPolling();
    state.serial.reader = null;
    state.serial.writer = null;
    state.serial.port = null;
    els.connectSerialButton.textContent = t("connect");
    els.sendScanButton.disabled = true;
    els.sendCncButton.disabled = true;
    updateScanPositionReadout();
    appendScanLog(t("serial_disconnected"));
  }
}

async function readSerialLoop() {
  const decoder = new TextDecoder();
  while (state.serial.connected && state.serial.reader) {
    try {
      const { value, done } = await state.serial.reader.read();
      if (done) break;
      if (value) processSerialText(decoder.decode(value, { stream: true }));
    } catch (error) {
      if (state.serial.connected) appendScanLog(t("serial_read_failed", { message: error.message }));
      break;
    }
  }
}

function processSerialText(text) {
  state.serial.buffer += text;
  const parts = state.serial.buffer.split(/\r?\n/);
  state.serial.buffer = parts.pop() || "";
  parts.forEach(line => {
    const clean = line.trim();
    if (!clean) return;
    recordControllerPosition(clean);
    if (!/^<[^>]+>$/.test(clean)) appendScanLog(`< ${clean}`);
    recordProbeResult(clean);
    if (/^(ok|error:|ALARM:)/i.test(clean)) resolveSerialAck(/^ok$/i.test(clean));
  });
}

function recordControllerPosition(line) {
  const pos = parseControllerPosition(line);
  if (!pos) return;
  state.scan.currentPosition = pos;
  state.scan.lastStatus = line;
  state.scan.lastPositionTime = Date.now();
  updateScanPositionReadout();
  if (state.view === "scan") draw();
}

function parseControllerPosition(line) {
  const statusMatch = line.match(/<([^|>]+)(?:\|[^>]*?(?:WPos|MPos):(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?))?/i);
  if (statusMatch && statusMatch[2] !== undefined) {
    return {
      state: statusMatch[1],
      x: Number(statusMatch[2]),
      y: Number(statusMatch[3]),
      z: Number(statusMatch[4])
    };
  }
  const plain = line.match(/(?:WPos|MPos|POS|POSITION)?[:=]?\s*X(-?\d+(?:\.\d+)?)\s+Y(-?\d+(?:\.\d+)?)\s+Z(-?\d+(?:\.\d+)?)/i);
  if (plain) return { state: "pos", x: Number(plain[1]), y: Number(plain[2]), z: Number(plain[3]) };
  return null;
}

function updateScanPositionReadout() {
  if (!els.scanPositionReadout) return;
  const pos = state.scan.currentPosition;
  const nose = state.scan.nose;
  const tail = state.scan.tail;
  const parts = [];
  if (pos) {
    parts.push(t("scan_position_current", {
      state: pos.state || "",
      x: fmt(pos.x),
      y: fmt(pos.y),
      z: fmt(pos.z)
    }));
  } else {
    parts.push(state.serial.connected ? t("position_waiting") : t("position_not_connected"));
  }
  if (pos && tail) parts.push(t("scan_position_tail_basis", { x: fmt(pos.x - tail.x) }));
  if (nose) parts.push(t("scan_position_nose", { x: fmt(nose.x), y: fmt(nose.y), z: fmt(nose.z) }));
  if (tail) parts.push(t("scan_position_tail_origin", { x: fmt(tail.x), y: fmt(tail.y), z: fmt(tail.z) }));
  if (nose && tail) parts.push(t("scan_position_length", { length: fmt(Math.abs(nose.x - tail.x)) }));
  els.scanPositionReadout.textContent = parts.join(" / ");
}

function startPositionPolling() {
  stopPositionPolling();
  state.serial.statusTimer = window.setInterval(() => {
    if (!state.serial.connected || !state.serial.writer) return;
    requestControllerPosition().catch(() => {});
  }, 500);
}

function stopPositionPolling() {
  if (state.serial.statusTimer) {
    window.clearInterval(state.serial.statusTimer);
    state.serial.statusTimer = null;
  }
}

function updateCurrentProbePointFromLine(line) {
  const detailed = line.match(/^\(P\s+(\d+)\s+([A-Za-z0-9_-]+)\s+BX(-?\d+(?:\.\d+)?)\s+BY(-?\d+(?:\.\d+)?)\s+MX(-?\d+(?:\.\d+)?)\s+MY(-?\d+(?:\.\d+)?)/i);
  if (detailed) {
    state.serial.currentProbePoint = {
      index: Number(detailed[1]),
      surface: detailed[2],
      plannedX: Number(detailed[3]),
      plannedY: Number(detailed[4]),
      machineX: Number(detailed[5]),
      machineY: Number(detailed[6])
    };
    return;
  }
  const legacy = line.match(/^\(P\s+(\d+)\s+([A-Za-z0-9_-]+)\s+X(-?\d+(?:\.\d+)?)\s+Y(-?\d+(?:\.\d+)?)/i);
  if (!legacy) return;
  state.serial.currentProbePoint = {
    index: Number(legacy[1]),
    surface: legacy[2],
    plannedX: Number(legacy[3]),
    plannedY: Number(legacy[4]),
    machineX: Number(legacy[3]),
    machineY: Number(legacy[4])
  };
}

function recordProbeResult(line) {
  const probe = parseProbeLine(line);
  if (!probe || !state.serial.currentProbePoint) return;
  const planned = state.serial.currentProbePoint;
  const measurement = {
    index: planned.index,
    surface: planned.surface,
    plannedX: planned.plannedX,
    plannedY: planned.plannedY,
    machineX: Number.isFinite(probe.x) ? probe.x : planned.machineX,
    machineY: Number.isFinite(probe.y) ? probe.y : planned.machineY,
    x: planned.plannedX,
    y: planned.plannedY,
    z: probe.z,
    basis: "tail"
  };
  state.probeMeasurements.push(measurement);
  updateProbeMeasurementButtons();
  appendScanLog(t("log_measure", {
    surface: measurement.surface,
    x: fmt(measurement.x),
    y: fmt(measurement.y),
    z: fmt(measurement.z),
    machineX: fmt(measurement.machineX),
    machineY: fmt(measurement.machineY)
  }));
}

function parseProbeLine(line) {
  const prb = line.match(/\[?PRB:?\s*\[?(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (prb) return { x: Number(prb[1]), y: Number(prb[2]), z: Number(prb[3]) };
  const measure = line.match(/^MEASURE\s+[A-Za-z0-9_-]+\s+X(-?\d+(?:\.\d+)?)\s+Y(-?\d+(?:\.\d+)?)\s+Z(-?\d+(?:\.\d+)?)/i);
  if (measure) return { x: Number(measure[1]), y: Number(measure[2]), z: Number(measure[3]) };
  return null;
}

async function sendProbeScanGCode() {
  if (!state.serial.connected || !state.serial.writer) {
    appendScanLog(t("serial_not_connected"));
    return;
  }
  if (!state.probeScanGCode) generateProbeScan();
  state.probeMeasurements = [];
  await sendGCodeText(state.probeScanGCode, "probe scan");
  updateProbeMeasurementButtons();
}

async function sendCncGCode() {
  if (!state.serial.connected || !state.serial.writer) {
    appendScanLog(t("serial_not_connected"));
    return;
  }
  if (!state.cncGCode) {
    if (!state.board) return;
    state.cncGCode = makeCncGCode(state.board);
  }
  await sendGCodeText(state.cncGCode, "CNC toolpath");
}

async function sendGCodeText(gcode, label) {
  const encoder = new TextEncoder();
  const lines = gcode.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  appendScanLog(t("log_sending_gcode", { label, lineCount: lines.length }));
  for (const line of lines) {
    if (!state.serial.connected) break;
    updateCurrentProbePointFromLine(line);
    appendScanLog(`> ${line}`);
    await state.serial.writer.write(encoder.encode(`${line}\n`));
    if (!line.startsWith("(")) await waitForControllerAck(8000);
  }
  appendScanLog(t("log_send_complete", { label }));
}

function waitForControllerAck(timeoutMs) {
  return new Promise(resolve => {
    const timer = window.setTimeout(() => resolve(false), timeoutMs);
    state.serial.ackResolvers.push(ok => {
      window.clearTimeout(timer);
      resolve(ok);
    });
  });
}

function resolveSerialAck(ok) {
  const resolver = state.serial.ackResolvers.shift();
  if (resolver) resolver(ok);
}

function appendScanLog(message) {
  if (!els.scanLog) return;
  els.scanLog.value = `${els.scanLog.value}${message}\n`.slice(-12000);
  els.scanLog.scrollTop = els.scanLog.scrollHeight;
}

function buildBrdFromScan() {
  const measurements = state.probeMeasurements.length ? state.probeMeasurements : parseMeasurementsFromLog(els.scanLog.value);
  if (measurements.length < 4) {
    setStatus("status_scan_brd_points_missing");
    return;
  }
  try {
    const board = boardFromProbeMeasurements(measurements);
    loadBoard(makeBrd(board), "scanned-board.brd");
    setStatus("status_scan_brd_built");
  } catch (error) {
    setStatus("status_scan_brd_build_failed", { message: error.message });
    appendScanLog(`Build BRD failed: ${error.message}`);
  }
}

function fitProfileFromScanGhost() {
  const measurements = currentProbeMeasurements();
  const ghost = scanGhostProfile(measurements);
  if (ghost.bottom.length < 2 || ghost.deck.length < 2) {
    setStatus("status_scan_profile_points_missing");
    return;
  }
  if (!state.board) {
    const measuredLength = Math.max(ghost.bottom.at(-1).x, ghost.deck.at(-1).x) * unitScale();
    if (measuredLength > 0 && els.scanMeasuredLength) els.scanMeasuredLength.value = fmt(measuredLength);
    const board = makeScanReferenceBoard();
    if (!board) {
      setStatus("status_scan_temp_board_failed");
      return;
    }
    board.bottom = splineFromPoints(ghost.bottom);
    board.deck = splineFromPoints(ghost.deck);
    alignProfileEndpointsForScanFit(board);
    applyBoardCadDerivedMetrics(board);
    loadBoard(makeBrd(board), "scanned-board.brd");
    setStatus("status_scan_profile_brd_built");
    return;
  }
  const before = cloneBoard(state.board);
  state.board.bottom = splineFromPoints(ghost.bottom);
  state.board.deck = splineFromPoints(ghost.deck);
  alignProfileEndpointsForScanFit(state.board);
  applyBoardCadDerivedMetrics(state.board);
  markGeometryDirty();
  state.history.undo.push(before);
  state.history.redo = [];
  trimHistory();
  setView("profile");
  setStatus("status_scan_profile_fit_applied");
}

function fitOutlineFromScanGhost() {
  const measurements = currentProbeMeasurements();
  const ghost = scanGhostOutline(measurements);
  if (ghost.length < 2) {
    setStatus("status_scan_outline_points_missing");
    return;
  }
  if (!state.board) {
    const measuredLength = ghost.at(-1).x * unitScale();
    if (measuredLength > 0 && els.scanMeasuredLength) els.scanMeasuredLength.value = fmt(measuredLength);
    const board = makeScanReferenceBoard();
    if (!board) {
      setStatus("status_scan_temp_board_failed");
      return;
    }
    board.outline = splineFromPoints(ghost);
    applyBoardCadDerivedMetrics(board);
    loadBoard(makeBrd(board), "scanned-board.brd");
    setView("outline");
    setStatus("status_scan_outline_built");
    return;
  }
  const before = cloneBoard(state.board);
  state.board.outline = splineFromPoints(ghost);
  applyBoardCadDerivedMetrics(state.board);
  markGeometryDirty();
  state.history.undo.push(before);
  state.history.redo = [];
  trimHistory();
  setView("outline");
  setStatus("status_scan_outline_fit_applied");
}

function fitCrossSectionFromScanGhost() {
  const section = currentCrossSection();
  if (!state.board || !section) {
    setStatus("status_scan_section_requires_board");
    return;
  }
  const targetX = section.position * unitScale();
  const ghost = scanGhostCrossSection(currentProbeMeasurements(), targetX);
  if (ghost.points.length < 3) {
    setStatus("status_scan_section_points_missing");
    return;
  }
  const before = cloneBoard(state.board);
  section.position = ghost.x / unitScale();
  section.spline = fitCrossSectionBezierFromScanPoints(ghost.points);
  const error = crossSectionFitError(ghost.points, section.spline);
  applyBoardCadDerivedMetrics(state.board);
  markGeometryDirty();
  state.history.undo.push(before);
  state.history.redo = [];
  trimHistory();
  setView("sections");
  updateInfo();
  updateSectionInfo();
  updateHistoryButtons();
  setStatus("status_scan_section_fit_applied", {
    x: fmt(ghost.x),
    rms: fmt(error.rms),
    max: fmt(error.max)
  });
  draw();
}

function alignProfileEndpointsForScanFit(board) {
  if (!board.bottom.length || !board.deck.length) return;
  const length = board.length;
  const bottomTail = board.bottom[0];
  const bottomNose = board.bottom[board.bottom.length - 1];
  alignKnotEndpoint(bottomTail, 0, bottomTail.p.y);
  alignKnotEndpoint(board.deck[0], 0, bottomTail.p.y);
  alignKnotEndpoint(bottomNose, length, bottomNose.p.y);
  alignKnotEndpoint(board.deck[board.deck.length - 1], length, bottomNose.p.y);
}

function currentProbeMeasurements() {
  return state.probeMeasurements.length ? state.probeMeasurements : parseMeasurementsFromLog(els.scanLog?.value || "");
}

function scanGhostProfile(measurements = currentProbeMeasurements()) {
  const scale = unitScale();
  const cleaned = measurementsToBoardCoordinates(measurements)
    .filter(point => /^(bottom|deck)$/i.test(point.surface))
    .map(point => ({
      surface: point.surface.toLowerCase(),
      x: point.x / scale,
      y: point.y / scale,
      z: point.z / scale
    }));
  const bottom = scanCenterlineBySurface(cleaned, "bottom");
  if (!bottom.length) return { bottom: [], deck: [] };
  const bottomOffset = Math.min(...bottom.map(point => point.y));
  const normalizedBottom = bottom.map(point => ({ x: point.x, y: point.y - bottomOffset }));
  const deck = scanCenterlineBySurface(cleaned, "deck").map(point => ({ x: point.x, y: point.y - bottomOffset }));
  return {
    bottom: normalizedBottom,
    deck
  };
}

function scanGhostOutline(measurements = currentProbeMeasurements()) {
  const scale = unitScale();
  const cleaned = measurementsToBoardCoordinates(measurements)
    .filter(point => /^outline-(right|left)$/i.test(point.surface))
    .map(point => ({
      surface: point.surface.toLowerCase(),
      x: point.x / scale,
      y: point.y / scale,
      z: point.z / scale
    }));
  const grouped = groupPointsByRoundedX(cleaned);
  const outline = [...grouped.entries()].map(([x, group]) => {
    const right = group.filter(point => point.surface === "outline-right").map(point => Math.abs(point.y));
    const left = group.filter(point => point.surface === "outline-left").map(point => Math.abs(point.y));
    const rightWidth = averageFinite(right);
    const leftWidth = averageFinite(left);
    const fallbackWidth = Math.max(0, ...group.map(point => Math.abs(point.y)).filter(Number.isFinite));
    const y = Number.isFinite(rightWidth) && Number.isFinite(leftWidth)
      ? (rightWidth + leftWidth) / 2
      : Number.isFinite(rightWidth)
        ? rightWidth
        : Number.isFinite(leftWidth)
          ? leftWidth
          : fallbackWidth;
    return { x: Number(x), y };
  }).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((a, b) => a.x - b.x);
  if (outline.length >= 2) {
    outline[0].y = 0;
    outline[outline.length - 1].y = 0;
  }
  return removeNearDuplicatePoints(outline);
}

function scanGhostCrossSection(measurements = currentProbeMeasurements(), targetX = null) {
  const scale = unitScale();
  const cleaned = measurementsToBoardCoordinates(measurements)
    .filter(point => /^cross-half$/i.test(point.surface))
    .map(point => ({
      x: point.x,
      y: Math.abs(point.y),
      z: point.z
    }))
    .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
  const grouped = groupPointsByRoundedX(cleaned);
  if (!grouped.size) return { x: 0, points: [] };
  const entries = [...grouped.entries()].map(([x, points]) => ({
    x: Number(x),
    points: points.slice().sort((a, b) => a.z - b.z)
  }));
  const selected = Number.isFinite(targetX)
    ? entries.reduce((best, entry) => Math.abs(entry.x - targetX) < Math.abs(best.x - targetX) ? entry : best, entries[0])
    : entries.reduce((best, entry) => entry.points.length > best.points.length ? entry : best, entries[0]);
  const zMin = Math.min(...selected.points.map(point => point.z));
  const points = selected.points
    .map(point => ({ x: point.y / scale, y: (point.z - zMin) / scale }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  return {
    x: selected.x,
    points: removeNearDuplicatePoints(points)
  };
}

function fitCrossSectionBezierFromScanPoints(points) {
  const cleaned = prepareCrossSectionFitPoints(points);
  if (cleaned.length < 3) return splineFromFreePoints(points);
  return splineFromFreePoints(cleaned);
}

function prepareCrossSectionFitPoints(points) {
  const raw = removeNearDuplicatePoints(points
    .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
    .map(point => ({ x: Math.max(0, point.x), y: point.y }))
    .sort((a, b) => a.y - b.y || a.x - b.x));
  if (raw.length < 3) return raw;
  const smoothed = smoothCrossSectionPoints(raw);
  const reduced = reduceCrossSectionFitPoints(smoothed);
  if (reduced.length) {
    reduced[0].x = 0;
    reduced[reduced.length - 1].x = 0;
  }
  return removeNearDuplicatePoints(reduced);
}

function smoothCrossSectionPoints(points) {
  if (points.length <= 4) return points.slice();
  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return { ...point };
    const prev = points[index - 1];
    const next = points[index + 1];
    return {
      x: (prev.x + point.x * 2 + next.x) / 4,
      y: point.y
    };
  });
}

function reduceCrossSectionFitPoints(points) {
  if (points.length <= 7) return points.slice();
  const adaptive = adaptiveCrossSectionFitPoints(points, 9);
  if (adaptive.length >= 3) return adaptive;
  return points.slice();
}

function adaptiveCrossSectionFitPoints(points, maxPoints = 11) {
  if (points.length <= maxPoints) return points.slice();
  const spanX = Math.max(...points.map(point => point.x)) - Math.min(...points.map(point => point.x));
  const spanY = Math.max(...points.map(point => point.y)) - Math.min(...points.map(point => point.y));
  const tolerance = Math.max(0.015, Math.hypot(spanX, spanY) * 0.018);
  const forced = new Set([0, points.length - 1]);
  const railIndex = points.reduce((best, point, index) => point.x > points[best].x ? index : best, 0);
  forced.add(railIndex);
  rdpCrossSectionRange(points, 0, railIndex, tolerance, forced, maxPoints);
  rdpCrossSectionRange(points, railIndex, points.length - 1, tolerance, forced, maxPoints);
  while (forced.size < maxPoints) {
    const candidate = worstCrossSectionFitIndex(points, forced);
    if (!candidate || candidate.distance <= tolerance * 0.65) break;
    forced.add(candidate.index);
  }
  const selected = [...forced].sort((a, b) => a - b).map(index => ({ ...points[index] }));
  return removeNearDuplicatePoints(selected);
}

function rdpCrossSectionRange(points, start, end, tolerance, selected, maxPoints) {
  if (selected.size >= maxPoints || Math.abs(end - start) <= 1) return;
  let worstIndex = -1;
  let worstDistance = -1;
  const a = points[start];
  const b = points[end];
  const low = Math.min(start, end) + 1;
  const high = Math.max(start, end);
  for (let i = low; i < high; i++) {
    const distance = pointDistanceToSegment(points[i], a, b);
    if (distance > worstDistance) {
      worstDistance = distance;
      worstIndex = i;
    }
  }
  if (worstIndex < 0 || worstDistance <= tolerance) return;
  selected.add(worstIndex);
  rdpCrossSectionRange(points, start, worstIndex, tolerance, selected, maxPoints);
  rdpCrossSectionRange(points, worstIndex, end, tolerance, selected, maxPoints);
}

function worstCrossSectionFitIndex(points, selected) {
  const indices = [...selected].sort((a, b) => a - b);
  let worst = null;
  for (let s = 1; s < indices.length; s++) {
    const start = indices[s - 1];
    const end = indices[s];
    if (end - start <= 1) continue;
    const a = points[start];
    const b = points[end];
    for (let i = start + 1; i < end; i++) {
      if (selected.has(i)) continue;
      const distance = pointDistanceToSegment(points[i], a, b);
      if (!worst || distance > worst.distance) worst = { index: i, distance };
    }
  }
  return worst;
}

function crossSectionFitError(points, spline) {
  const samples = flattenSpline(spline);
  const checked = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!checked.length || samples.length < 2) return { rms: 0, max: 0, count: checked.length };
  let sumSq = 0;
  let max = 0;
  checked.forEach(point => {
    const distance = pointDistanceToPolyline(point, samples);
    sumSq += distance * distance;
    max = Math.max(max, distance);
  });
  return {
    rms: Math.sqrt(sumSq / checked.length),
    max,
    count: checked.length
  };
}

function pointDistanceToPolyline(point, polyline) {
  if (!polyline.length) return Infinity;
  let best = Infinity;
  for (let i = 1; i < polyline.length; i++) {
    best = Math.min(best, pointDistanceToSegment(point, polyline[i - 1], polyline[i]));
  }
  return best;
}

function pointDistanceToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 1e-12) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq));
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
}

function scanCenterlineBySurface(points, surface) {
  const filtered = points.filter(point => point.surface === surface);
  const grouped = groupPointsByRoundedX(filtered);
  return [...grouped.entries()].map(([x, group]) => {
    const center = group.reduce((best, point) => Math.abs(point.y) < Math.abs(best.y) ? point : best, group[0]);
    return { x: Number(x), y: center.z };
  }).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((a, b) => a.x - b.x);
}

function averageFinite(values) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return NaN;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function parseMeasurementsFromLog(log) {
  const basis = probeMeasurementBasisFromText(log);
  return String(log).split(/\r?\n/).map(line => {
    const match = line.match(/MEASURE\s+([A-Za-z0-9_-]+)\s+X(-?\d+(?:\.\d+)?)\s+Y(-?\d+(?:\.\d+)?)\s+Z(-?\d+(?:\.\d+)?)(?:\s+MX(-?\d+(?:\.\d+)?)\s+MY(-?\d+(?:\.\d+)?))?/i);
    if (!match) return null;
    return {
      surface: match[1],
      x: Number(match[2]),
      y: Number(match[3]),
      z: Number(match[4]),
      plannedX: Number(match[2]),
      plannedY: Number(match[3]),
      machineX: match[5] === undefined ? Number(match[2]) : Number(match[5]),
      machineY: match[6] === undefined ? Number(match[3]) : Number(match[6]),
      basis
    };
  }).filter(point => point && Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
}

function importProbeMeasurementsText(text, filename = "probe-measurements.csv") {
  const csvMeasurements = parseProbeMeasurementsCsv(text);
  const logMeasurements = parseMeasurementsFromLog(text);
  const measurements = csvMeasurements.length ? csvMeasurements : logMeasurements;
  if (!measurements.length) {
    setStatus("status_probe_measurements_import_failed", { filename });
    return;
  }
  const normalizedMeasurements = measurementsToBoardCoordinates(measurements);
  state.probeMeasurements = normalizedMeasurements;
  state.serial.currentProbePoint = null;
  const measuredLength = probeMeasurementLength(normalizedMeasurements);
  if (measuredLength > 0 && els.scanMeasuredLength) els.scanMeasuredLength.value = fmt(measuredLength);
  if (els.scanLog) {
    els.scanLog.value = normalizedMeasurements.map(measurementToLogLine).join("\n") + "\n";
  }
  updateProbeMeasurementButtons();
  setView("scan");
  setStatus("status_probe_measurements_imported", { filename, count: normalizedMeasurements.length });
  draw();
}

function parseProbeMeasurementsCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map(header => header.trim().toLowerCase());
  const headerNameOf = names => names.find(name => headers.includes(name)) || "";
  const indexOf = names => {
    const name = headerNameOf(names);
    return name ? headers.indexOf(name) : -1;
  };
  const surfaceIndex = indexOf(["surface"]);
  const xHeader = headerNameOf(["tail_x_mm", "board_x_mm", "x", "bx", "nose_x_mm"]);
  const xIndex = xHeader ? headers.indexOf(xHeader) : -1;
  const yIndex = indexOf(["board_y_mm", "y", "by"]);
  const zIndex = indexOf(["z_mm", "z", "bz"]);
  const mxIndex = indexOf(["machine_x_mm", "machine_x", "mx"]);
  const myIndex = indexOf(["machine_y_mm", "machine_y", "my"]);
  if (surfaceIndex < 0 || xIndex < 0 || yIndex < 0 || zIndex < 0) return [];
  const basis = xHeader === "nose_x_mm" ? "nose" : "tail";
  return rows.slice(1).map((row, index) => {
    const point = {
      index: index + 1,
      surface: row[surfaceIndex],
      x: Number(row[xIndex]),
      y: Number(row[yIndex]),
      z: Number(row[zIndex]),
      plannedX: Number(row[xIndex]),
      plannedY: Number(row[yIndex]),
      machineX: mxIndex >= 0 ? Number(row[mxIndex]) : Number(row[xIndex]),
      machineY: myIndex >= 0 ? Number(row[myIndex]) : Number(row[yIndex]),
      basis
    };
    return point;
  }).filter(point => point.surface && Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = String(text || "");
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === "\"" && source[i + 1] === "\"") {
        cell += "\"";
        i++;
      } else if (char === "\"") {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(value => value.length)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some(value => value.length)) rows.push(row);
  return rows;
}

function measurementToLogLine(measurement) {
  return `MEASURE ${measurement.surface} X${fmt(measurement.x)} Y${fmt(measurement.y)} Z${fmt(measurement.z)} MX${fmt(measurement.machineX ?? measurement.x)} MY${fmt(measurement.machineY ?? measurement.y)}`;
}

function downloadProbeMeasurements() {
  const measurements = state.probeMeasurements.length ? state.probeMeasurements : parseMeasurementsFromLog(els.scanLog.value);
  if (!measurements.length) return;
  downloadBlob("probe-measurements.csv", measurementsToCsv(measurements), "text/csv");
  setStatus("status_probe_measurements_exported");
}

function clearProbeMeasurements() {
  state.probeMeasurements = [];
  state.serial.currentProbePoint = null;
  if (els.scanLog) els.scanLog.value = "";
  updateProbeMeasurementButtons();
  setStatus("status_probe_measurements_cleared");
}

function measurementsToCsv(measurements) {
  const normalized = measurementsToBoardCoordinates(measurements);
  const rows = [["index", "surface", "tail_x_mm", "board_y_mm", "z_mm", "machine_x_mm", "machine_y_mm"]];
  normalized.forEach((point, index) => {
    rows.push([
      point.index ?? index + 1,
      point.surface,
      fmt(point.x),
      fmt(point.y),
      fmt(point.z),
      fmt(point.machineX ?? point.x),
      fmt(point.machineY ?? point.y)
    ]);
  });
  return `${rows.map(row => row.map(csvCell).join(",")).join("\n")}\n`;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function updateProbeMeasurementButtons() {
  const logMeasurements = parseMeasurementsFromLog(els.scanLog?.value || "");
  const count = state.probeMeasurements.length || logMeasurements.length;
  const measurements = state.probeMeasurements.length ? state.probeMeasurements : logMeasurements;
  const ghost = scanGhostProfile(measurements);
  const outlineGhost = scanGhostOutline(measurements);
  const crossGhost = scanGhostCrossSection(measurements, currentCrossSection()?.position * unitScale());
  setDisabled([els.buildBrdFromScanButton], count < 4);
  setDisabled([els.downloadMeasurementsButton, els.clearMeasurementsButton], count < 1);
  setDisabled([els.fitProfileFromScanButton], ghost.bottom.length < 2 || ghost.deck.length < 2);
  setDisabled([els.fitOutlineFromScanButton], outlineGhost.length < 2);
  setDisabled([els.fitCrossSectionFromScanButton], !state.board || crossGhost.points.length < 3);
}

function boardFromProbeMeasurements(measurements) {
  const scale = unitScale();
  const cleaned = measurementsToBoardCoordinates(measurements)
    .filter(point => /^(bottom|deck)$/i.test(point.surface))
    .map(point => ({
      surface: point.surface.toLowerCase(),
      x: point.x / scale,
      y: point.y / scale,
      z: point.z / scale
    }));
  const bottom = cleaned.filter(point => point.surface === "bottom");
  const deck = cleaned.filter(point => point.surface === "deck");
  if (bottom.length < 2 || deck.length < 2) {
    throw new Error("bottom/deck両方の測定点が必要です。");
  }
  const xValues = sortedUnique(cleaned.map(point => point.x), 0.001);
  const length = Math.max(...xValues);
  const bottomOffset = Math.min(...bottom.map(point => point.z));
  const bottomCenter = centerlineByX(bottom, bottomOffset);
  const deckCenter = centerlineByX(deck, bottomOffset);
  const outlinePoints = xValues.map(x => ({
    x,
    y: Math.max(
      maxAbsYAt(bottom, x),
      maxAbsYAt(deck, x)
    )
  })).filter(point => Number.isFinite(point.y));
  if (outlinePoints.length < 2 || bottomCenter.length < 2 || deckCenter.length < 2) {
    throw new Error("中心線またはアウトラインを作る測定点が不足しています。");
  }
  outlinePoints[0].y = 0;
  outlinePoints[outlinePoints.length - 1].y = 0;
  const sectionXs = outlinePoints
    .filter(point => point.x > 0 && point.x < length && point.y > 0.01)
    .map(point => point.x);
  const sections = [
    { position: 0, spline: makeScannedCrossSection(0.01, Math.max(0.01, deckCenter[0].y - bottomCenter[0].y)), guidePoints: [] },
    ...sectionXs.map(x => {
      const halfWidth = interpolatePolyline(outlinePoints, x);
      const bottomY = interpolatePolyline(bottomCenter, x);
      const deckY = interpolatePolyline(deckCenter, x);
      return {
        position: x,
        spline: makeMeasuredCrossSectionAt(cleaned, x, bottomOffset, halfWidth, Math.max(0.01, deckY - bottomY)),
        guidePoints: []
      };
    }),
    { position: length, spline: makeScannedCrossSection(0.01, Math.max(0.01, deckCenter[deckCenter.length - 1].y - bottomCenter[bottomCenter.length - 1].y)), guidePoints: [] }
  ];
  const board = {
    filename: "scanned-board.brd",
    name: "Scanned board",
    version: "BoardCAD Web scan",
    fields: {},
    length,
    width: 0,
    thickness: 0,
    interpolationType: state.crossSectionInterpolation,
    finType: "",
    fins: Array(9).fill(0),
    finSetup: "",
    finToeIn: 0,
    finCant: 0,
    finExtra: [],
    tailMode: "",
    tailLength: 0,
    tailDepth: 0,
    tailShoulderPos: 0,
    tailShoulderScale: 0,
    tailRailBlend: 0,
    tailLinearization: 0,
    tailWidthAdjust: 0,
    noseMode: "",
    noseLength: 0,
    noseShoulderPos: 0,
    noseShoulderScale: 0,
    noseRailBlend: 0,
    noseLinearization: 0,
    noseWidthAdjust: 0,
    wingPreset: "",
    wingPosition: 0,
    wingWidth: 0,
    wingShape: "",
    wingShoulder: 0,
    wingTransition: 0,
    railMode: "",
    railStrength: 1,
    edgeType: "",
    edgeStrength: 0,
    edgeLength: 0,
    edgeFade: 0,
    bottomFeatures: [],
    rockerPreset: "",
    rockerConfig: defaultRockerConfig(),
    outlineGuidePoints: [],
    bottomGuidePoints: [],
    deckGuidePoints: [],
    outline: splineFromPoints(outlinePoints),
    bottom: splineFromPoints(bottomCenter),
    deck: splineFromPoints(deckCenter),
    sections
  };
  applyBoardCadDerivedMetrics(board);
  return board;
}

function measurementsToBoardCoordinates(measurements) {
  const source = Array.isArray(measurements) ? measurements : [];
  const length = probeMeasurementLength(source);
  if (!(length > 0)) {
    return source.map(point => ({
      ...point,
      basis: "tail",
      sourceBasis: normalizeProbeMeasurementBasis(point?.basis)
    }));
  }
  return source.map(point => ({
    ...point,
    sourceX: Number(point.x),
    sourceBasis: normalizeProbeMeasurementBasis(point?.basis),
    basis: "tail",
    x: normalizeProbeMeasurementBasis(point?.basis) === "nose"
      ? length - Number(point.x)
      : Number(point.x)
  })).filter(point => Number.isFinite(point.x));
}

function probeMeasurementLength(measurements) {
  const entered = Number(els.scanMeasuredLength?.value);
  if (Number.isFinite(entered) && entered > 0) return entered;
  const xs = measurements.map(point => Number(point.x)).filter(Number.isFinite);
  if (!xs.length) return 0;
  return Math.max(...xs) - Math.min(0, Math.min(...xs));
}

function normalizeProbeMeasurementBasis(value) {
  return String(value || "").trim().toLowerCase() === "nose" ? "nose" : "tail";
}

function probeMeasurementBasisFromText(text) {
  const source = String(text || "");
  if (/nose_x_mm/i.test(source)) return "nose";
  if (/Return to nose origin|work origin at the board nose|nose origin X0/i.test(source)) return "nose";
  return "tail";
}

function centerlineByX(points, zOffset) {
  const grouped = groupPointsByRoundedX(points);
  return [...grouped.entries()].map(([x, group]) => {
    const center = group.reduce((best, point) => Math.abs(point.y) < Math.abs(best.y) ? point : best, group[0]);
    return { x: Number(x), y: center.z - zOffset };
  }).sort((a, b) => a.x - b.x);
}

function maxAbsYAt(points, x) {
  const near = points.filter(point => Math.abs(point.x - x) < 0.001);
  if (!near.length) return 0;
  return Math.max(...near.map(point => Math.abs(point.y)));
}

function makeMeasuredCrossSectionAt(points, x, bottomOffset, fallbackHalfWidth, fallbackThickness) {
  const bottom = points.filter(point => point.surface === "bottom" && Math.abs(point.x - x) < 0.001);
  const deck = points.filter(point => point.surface === "deck" && Math.abs(point.x - x) < 0.001);
  if (bottom.length < 2 || deck.length < 2) return makeScannedCrossSection(fallbackHalfWidth, fallbackThickness);
  const bottomCenter = nearestCenterPoint(bottom);
  const deckCenter = nearestCenterPoint(deck);
  const localBottom = Number.isFinite(bottomCenter?.z) ? bottomCenter.z : bottomOffset;
  const bottomProfile = profileByAbsY(bottom, localBottom);
  const deckProfile = profileByAbsY(deck, localBottom);
  if (bottomProfile.length < 2 || deckProfile.length < 2) return makeScannedCrossSection(fallbackHalfWidth, fallbackThickness);
  const halfWidth = Math.max(fallbackHalfWidth, bottomProfile.at(-1).x, deckProfile.at(-1).x);
  const thickness = Math.max(0.01, (deckCenter?.z ?? (localBottom + fallbackThickness)) - localBottom);
  ensureProfilePoint(bottomProfile, 0, 0);
  ensureProfilePoint(deckProfile, 0, thickness);
  ensureProfilePoint(bottomProfile, halfWidth, bottomProfile.at(-1).y);
  ensureProfilePoint(deckProfile, halfWidth, deckProfile.at(-1).y);
  const ordered = bottomProfile
    .sort((a, b) => a.x - b.x)
    .concat(deckProfile.sort((a, b) => b.x - a.x));
  return splineFromFreePoints(removeNearDuplicatePoints(ordered));
}

function nearestCenterPoint(points) {
  if (!points.length) return null;
  return points.reduce((best, point) => Math.abs(point.y) < Math.abs(best.y) ? point : best, points[0]);
}

function profileByAbsY(points, zBase) {
  const buckets = new Map();
  points.forEach(point => {
    const key = fmt(Math.abs(point.y));
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(point);
  });
  return [...buckets.entries()].map(([key, bucket]) => ({
    x: Number(key),
    y: bucket.reduce((sum, point) => sum + (point.z - zBase), 0) / bucket.length
  })).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((a, b) => a.x - b.x);
}

function ensureProfilePoint(points, x, y) {
  const existing = points.find(point => Math.abs(point.x - x) < 0.001);
  if (existing) {
    existing.y = y;
  } else {
    points.push({ x, y });
  }
}

function removeNearDuplicatePoints(points) {
  const out = [];
  points.forEach(point => {
    const prev = out[out.length - 1];
    if (!prev || Math.hypot(prev.x - point.x, prev.y - point.y) > 0.001) out.push(point);
  });
  return out;
}

function sortedUnique(values, tolerance) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const out = [];
  sorted.forEach(value => {
    if (!out.length || Math.abs(out[out.length - 1] - value) > tolerance) out.push(value);
  });
  return out;
}

function groupPointsByRoundedX(points) {
  const map = new Map();
  points.forEach(point => {
    const key = fmt(point.x);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(point);
  });
  return map;
}

function interpolatePolyline(points, x) {
  if (!points.length) return 0;
  if (x <= points[0].x) return points[0].y;
  for (let i = 1; i < points.length; i++) {
    if (x <= points[i].x) {
      const span = Math.max(1e-6, points[i].x - points[i - 1].x);
      return lerp(points[i - 1].y, points[i].y, (x - points[i - 1].x) / span);
    }
  }
  return points[points.length - 1].y;
}

function isLocalExtremumPoint(prev, point, next, epsilon = 1e-9) {
  if (!prev || !point || !next) return false;
  const left = Number(point.y) - Number(prev.y);
  const right = Number(next.y) - Number(point.y);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  if (Math.abs(left) <= epsilon || Math.abs(right) <= epsilon) return false;
  return (left > 0 && right < 0) || (left < 0 && right > 0);
}

function splineFromPoints(points, options = {}) {
  const lockExtremaTangents = options?.lockExtremaTangents === true;
  const sorted = points.slice().sort((a, b) => a.x - b.x);
  return sorted.map((point, index) => {
    const prev = sorted[Math.max(0, index - 1)];
    const next = sorted[Math.min(sorted.length - 1, index + 1)];
    const dx = (next.x - prev.x) / 6;
    const dy = lockExtremaTangents && index > 0 && index < (sorted.length - 1) && isLocalExtremumPoint(prev, point, next)
      ? 0
      : ((next.y - prev.y) / 6);
    return {
      p: { x: point.x, y: point.y },
      prev: index === 0 ? { x: point.x, y: point.y } : { x: point.x - dx, y: point.y - dy },
      next: index === sorted.length - 1 ? { x: point.x, y: point.y } : { x: point.x + dx, y: point.y + dy },
      continuous: true,
      other: false
    };
  });
}

function splineFromOrderedPoints(points) {
  const ordered = dedupeConsecutivePoints(points.map(point => ({ x: point.x, y: point.y })));
  return ordered.map((point, index) => {
    const prev = ordered[Math.max(0, index - 1)];
    const next = ordered[Math.min(ordered.length - 1, index + 1)];
    const dx = (next.x - prev.x) / 6;
    const dy = (next.y - prev.y) / 6;
    return {
      p: { x: point.x, y: point.y },
      prev: index === 0 ? { x: point.x, y: point.y } : { x: point.x - dx, y: point.y - dy },
      next: index === ordered.length - 1 ? { x: point.x, y: point.y } : { x: point.x + dx, y: point.y + dy },
      continuous: true,
      other: false
    };
  });
}

function makeScannedCrossSection(halfWidth, thickness) {
  const w = Math.max(0.01, halfWidth);
  const t = Math.max(0.01, thickness);
  return splineFromFreePoints([
    { x: 0, y: 0 },
    { x: w * 0.85, y: t * 0.08 },
    { x: w, y: t * 0.45 },
    { x: w * 0.65, y: t * 0.88 },
    { x: 0, y: t }
  ]);
}

function splineFromFreePoints(points) {
  return points.map((point, index) => {
    const prev = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = (next.x - prev.x) / 6;
    const dy = (next.y - prev.y) / 6;
    return {
      p: { x: point.x, y: point.y },
      prev: index === 0 ? { x: point.x, y: point.y } : { x: point.x - dx, y: point.y - dy },
      next: index === points.length - 1 ? { x: point.x, y: point.y } : { x: point.x + dx, y: point.y + dy },
      continuous: true,
      other: false
    };
  });
}

function setView(view) {
  if (!view) return;
  state.view = view;
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });
  if ((view === "outline" || view === "profile") && els.traceTarget) {
    els.traceTarget.value = view;
    syncTracePanel();
  }
  state.currentSectionIndex = normalizeSectionIndex(state.board, state.currentSectionIndex);
  updateSectionInfo();
  updateEditInfo();
  updateHistoryButtons();
  sync3DMouseBridgeActivity();
  draw();
}

function fitView() {
  if (is3DInteractiveView()) {
    set3DViewPreset("iso", false);
    reset3DViewport();
    setStatus("status_fit_3d");
  } else {
    reset2DViewport();
    setStatus("status_fit_2d");
  }
  draw();
}

function is3DInteractiveView() {
  return state.view === "model3d" || state.view === "toolpath";
}

function bridgeShouldRun() {
  return !!state.model3d?.bridge?.enabled && is3DInteractiveView();
}

function sync3DMouseBridgeActivity() {
  const bridge = state.model3d?.bridge;
  if (!bridge) return;
  if (!bridgeShouldRun()) {
    if (bridge.pollTimer) {
      clearTimeout(bridge.pollTimer);
      bridge.pollTimer = null;
    }
    if (bridge.animationFrame) {
      cancelAnimationFrame(bridge.animationFrame);
      bridge.animationFrame = null;
    }
    bridge.pollInFlight = false;
    bridge.lastButtons = [];
    return;
  }
  schedule3DMouseBridgePoll(10);
  ensure3DMouseBridgeAnimation();
}

function schedule3DMouseBridgePoll(delay = 60) {
  const bridge = state.model3d?.bridge;
  if (!bridge || !bridgeShouldRun()) return;
  if (bridge.pollTimer) clearTimeout(bridge.pollTimer);
  bridge.pollTimer = setTimeout(() => {
    bridge.pollTimer = null;
    poll3DMouseBridge();
  }, delay);
}

async function poll3DMouseBridge() {
  const bridge = state.model3d?.bridge;
  if (!bridge || !bridgeShouldRun() || bridge.pollInFlight) return;
  bridge.pollInFlight = true;
  try {
    const response = await fetch(bridge.url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    bridge.connected = !!data.connected;
    bridge.deviceName = String(data.deviceName || "");
    bridge.lastError = "";
    bridge.lastSampleAt = Number(data.timestamp || Date.now());
    bridge.state = {
      tx: Number(data.tx) || 0,
      ty: Number(data.ty) || 0,
      tz: Number(data.tz) || 0,
      rx: Number(data.rx) || 0,
      ry: Number(data.ry) || 0,
      rz: Number(data.rz) || 0,
      buttons: Array.isArray(data.buttons) ? data.buttons.slice() : []
    };
    handle3DMouseBridgeButtons(bridge.state.buttons);
    ensure3DMouseBridgeAnimation();
  } catch (error) {
    bridge.connected = false;
    bridge.deviceName = "";
    bridge.lastError = error?.message || "bridge unavailable";
    bridge.lastButtons = [];
  } finally {
    bridge.pollInFlight = false;
    if (bridgeShouldRun()) schedule3DMouseBridgePoll(bridge.connected ? 24 : 500);
  }
}

function ensure3DMouseBridgeAnimation() {
  const bridge = state.model3d?.bridge;
  if (!bridge || bridge.animationFrame || !bridgeShouldRun()) return;
  const tick = now => {
    bridge.animationFrame = null;
    if (!bridgeShouldRun()) return;
    const previous = Number(bridge.lastFrameAt) || now;
    const dt = clamp((now - previous) / 1000, 0.001, 0.05);
    bridge.lastFrameAt = now;
    if (apply3DMouseBridgeState(dt)) draw();
    if (bridgeShouldRun()) bridge.animationFrame = requestAnimationFrame(tick);
  };
  bridge.lastFrameAt = performance.now();
  bridge.animationFrame = requestAnimationFrame(tick);
}

function normalize3DMouseAxis(value, deadzone) {
  const v = clamp(Number(value) || 0, -1, 1);
  if (Math.abs(v) <= deadzone) return 0;
  const sign = Math.sign(v);
  const normalized = (Math.abs(v) - deadzone) / Math.max(1e-6, 1 - deadzone);
  return sign * normalized * normalized;
}

function dominantAxisFilteredState(sample) {
  const entries = [
    ["tx", sample.tx], ["ty", sample.ty], ["tz", sample.tz],
    ["rx", sample.rx], ["ry", sample.ry], ["rz", sample.rz]
  ];
  let winner = null;
  entries.forEach(([key, value]) => {
    const abs = Math.abs(value);
    if (!winner || abs > winner.abs) winner = { key, abs };
  });
  if (!winner || winner.abs <= 1e-9) return sample;
  const next = { ...sample };
  entries.forEach(([key]) => {
    if (key !== winner.key) next[key] = 0;
  });
  return next;
}

function apply3DMousePreset(preset, preserveOverrides = false) {
  const bridge = state.model3d?.bridge;
  if (!bridge) return;
  const settings = bridge.settings || (bridge.settings = {});
  const currentFlags = {
    enabled: !!bridge.enabled,
    dominantAxis: !!settings.dominantAxis,
    invertPitch: !!settings.invertPitch,
    invertPanY: !!settings.invertPanY,
    invertZoom: !!settings.invertZoom
  };
  const normalized = String(preset || "generic").trim().toLowerCase();
  const selected = ["generic", "blender", "fusion"].includes(normalized) ? normalized : "generic";
  const presetValues = selected === "blender"
    ? { deadzone: 0.06, rotationSpeed: 2.2, panSpeed: 260, zoomSpeed: 1.05, dominantAxis: false }
    : selected === "fusion"
      ? { deadzone: 0.1, rotationSpeed: 1.75, panSpeed: 210, zoomSpeed: 0.85, dominantAxis: true }
      : { deadzone: 0.08, rotationSpeed: 1.9, panSpeed: 220, zoomSpeed: 0.9, dominantAxis: false };
  settings.preset = selected;
  settings.deadzone = presetValues.deadzone;
  settings.rotationSpeed = presetValues.rotationSpeed;
  settings.panSpeed = presetValues.panSpeed;
  settings.zoomSpeed = presetValues.zoomSpeed;
  settings.dominantAxis = preserveOverrides ? currentFlags.dominantAxis : presetValues.dominantAxis;
  settings.invertPitch = preserveOverrides ? currentFlags.invertPitch : false;
  settings.invertPanY = preserveOverrides ? currentFlags.invertPanY : false;
  settings.invertZoom = preserveOverrides ? currentFlags.invertZoom : false;
  bridge.enabled = preserveOverrides ? currentFlags.enabled : true;
}

function boolValue(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function bridgeButtonActionChoices() {
  return [
    { value: "none", label: t("bridge_button_action_none") },
    { value: "fit", label: t("bridge_button_action_fit") },
    { value: "view-iso", label: t("bridge_button_action_view_iso") },
    { value: "view-top", label: t("bridge_button_action_view_top") },
    { value: "view-outline", label: t("bridge_button_action_view_outline") },
    { value: "view-profile", label: t("bridge_button_action_view_profile") },
    { value: "render-cycle", label: t("bridge_button_action_render_cycle") },
    { value: "render-wire", label: t("bridge_button_action_render_wire") },
    { value: "render-shaded", label: t("bridge_button_action_render_shaded") },
    { value: "render-moire", label: t("bridge_button_action_render_moire") }
  ];
}

function normalizeBridgeButtonAction(action) {
  const value = String(action || "none").trim().toLowerCase();
  return bridgeButtonActionChoices().some(option => option.value === value) ? value : "none";
}

function sync3DMouseBridgeButtonSelect(selectEl, value) {
  if (!selectEl) return;
  const selected = normalizeBridgeButtonAction(value);
  const choices = bridgeButtonActionChoices();
  const currentOptions = Array.from(selectEl.options || selectEl.children || []);
  if (currentOptions.length !== choices.length || currentOptions.some((option, index) => option.value !== choices[index].value || option.textContent !== choices[index].label)) {
    selectEl.innerHTML = "";
    choices.forEach(choice => {
      const option = document.createElement("option");
      option.value = choice.value;
      option.textContent = choice.label;
      selectEl.appendChild(option);
    });
  }
  selectEl.value = selected;
}

function cycle3DRenderMode() {
  const shaded = state.viewOptions.show3DShaded !== false;
  const moire = state.viewOptions.show3DMoire === true;
  if (!shaded && !moire) {
    state.viewOptions.show3DShaded = true;
    state.viewOptions.show3DMoire = false;
  } else if (shaded && !moire) {
    state.viewOptions.show3DShaded = false;
    state.viewOptions.show3DMoire = true;
  } else {
    state.viewOptions.show3DShaded = false;
    state.viewOptions.show3DMoire = false;
  }
}

function perform3DMouseBridgeButtonAction(action) {
  const normalized = normalizeBridgeButtonAction(action);
  if (normalized === "none") return false;
  if (normalized === "fit") {
    fitView();
    return true;
  }
  if (normalized === "view-iso") {
    set3DViewPreset("iso");
    return true;
  }
  if (normalized === "view-top") {
    set3DViewPreset("top");
    return true;
  }
  if (normalized === "view-outline") {
    set3DViewPreset("outline");
    return true;
  }
  if (normalized === "view-profile") {
    set3DViewPreset("profile");
    return true;
  }
  if (normalized === "render-cycle") {
    cycle3DRenderMode();
    draw();
    return true;
  }
  if (normalized === "render-wire") {
    state.viewOptions.show3DShaded = false;
    state.viewOptions.show3DMoire = false;
    draw();
    return true;
  }
  if (normalized === "render-shaded") {
    state.viewOptions.show3DShaded = true;
    state.viewOptions.show3DMoire = false;
    draw();
    return true;
  }
  if (normalized === "render-moire") {
    state.viewOptions.show3DShaded = false;
    state.viewOptions.show3DMoire = true;
    draw();
    return true;
  }
  return false;
}

function handle3DMouseBridgeButtons(buttons) {
  const bridge = state.model3d?.bridge;
  const settings = bridge?.settings;
  if (!bridge || !settings) return;
  const previous = new Set(Array.isArray(bridge.lastButtons) ? bridge.lastButtons : []);
  const current = Array.isArray(buttons) ? buttons.map(value => Number(value)).filter(Number.isFinite) : [];
  const currentSet = new Set(current);
  current.forEach(buttonIndex => {
    if (previous.has(buttonIndex)) return;
    const action = settings.buttonMap?.[String(buttonIndex)] || "none";
    perform3DMouseBridgeButtonAction(action);
  });
  bridge.lastButtons = current.slice();
}

function sync3DMouseBridgeSettingsControls() {
  const bridge = state.model3d?.bridge;
  const settings = bridge?.settings;
  if (!bridge || !settings) return;
  if (els.miscBridgeEnabled) els.miscBridgeEnabled.checked = !!bridge.enabled;
  if (els.miscBridgePreset) els.miscBridgePreset.value = String(settings.preset || "generic");
  if (els.miscBridgeDeadzone) els.miscBridgeDeadzone.value = String(Number(settings.deadzone ?? 0.08).toFixed(2));
  if (els.miscBridgeRotationSpeed) els.miscBridgeRotationSpeed.value = String(Number(settings.rotationSpeed ?? 1.9).toFixed(1));
  if (els.miscBridgePanSpeed) els.miscBridgePanSpeed.value = String(Math.round(Number(settings.panSpeed ?? 220)));
  if (els.miscBridgeZoomSpeed) els.miscBridgeZoomSpeed.value = String(Number(settings.zoomSpeed ?? 0.9).toFixed(2));
  if (els.miscBridgeDominantAxis) els.miscBridgeDominantAxis.checked = !!settings.dominantAxis;
  if (els.miscBridgeInvertPitch) els.miscBridgeInvertPitch.checked = !!settings.invertPitch;
  if (els.miscBridgeInvertPanY) els.miscBridgeInvertPanY.checked = !!settings.invertPanY;
  if (els.miscBridgeInvertZoom) els.miscBridgeInvertZoom.checked = !!settings.invertZoom;
  sync3DMouseBridgeButtonSelect(els.miscBridgeButton1Action, settings.buttonMap?.["1"]);
  sync3DMouseBridgeButtonSelect(els.miscBridgeButton2Action, settings.buttonMap?.["2"]);
  sync3DMouseBridgeButtonSelect(els.miscBridgeButton3Action, settings.buttonMap?.["3"]);
  sync3DMouseBridgeButtonSelect(els.miscBridgeButton4Action, settings.buttonMap?.["4"]);
}

function apply3DMouseBridgeSettingsFromValues(values) {
  const bridge = state.model3d?.bridge;
  const settings = bridge?.settings;
  if (!bridge || !settings) return false;
  const preset = String(values.bridgePreset || settings.preset || "generic").trim().toLowerCase();
  apply3DMousePreset(preset, true);
  bridge.enabled = boolValue(values.bridgeEnabled);
  settings.deadzone = clamp(Number(values.bridgeDeadzone), 0, 0.4);
  settings.rotationSpeed = clamp(Number(values.bridgeRotationSpeed), 0.1, 8);
  settings.panSpeed = clamp(Number(values.bridgePanSpeed), 10, 1200);
  settings.zoomSpeed = clamp(Number(values.bridgeZoomSpeed), 0.05, 4);
  settings.dominantAxis = boolValue(values.bridgeDominantAxis);
  settings.invertPitch = boolValue(values.bridgeInvertPitch);
  settings.invertPanY = boolValue(values.bridgeInvertPanY);
  settings.invertZoom = boolValue(values.bridgeInvertZoom);
  settings.buttonMap = {
    "1": normalizeBridgeButtonAction(values.bridgeButton1Action),
    "2": normalizeBridgeButtonAction(values.bridgeButton2Action),
    "3": normalizeBridgeButtonAction(values.bridgeButton3Action),
    "4": normalizeBridgeButtonAction(values.bridgeButton4Action)
  };
  sync3DMouseBridgeSettingsControls();
  sync3DMouseBridgeActivity();
  return true;
}

function apply3DMouseBridgeState(dt) {
  const bridge = state.model3d?.bridge;
  if (!bridge || !bridge.connected || !bridgeShouldRun()) return false;
  const ageMs = Date.now() - Number(bridge.lastSampleAt || 0);
  if (ageMs > 250) return false;
  const settings = bridge.settings || {};
  let sample = {
    tx: normalize3DMouseAxis(bridge.state.tx, settings.deadzone ?? 0.08),
    ty: normalize3DMouseAxis(bridge.state.ty, settings.deadzone ?? 0.08),
    tz: normalize3DMouseAxis(bridge.state.tz, settings.deadzone ?? 0.08),
    rx: normalize3DMouseAxis(bridge.state.rx, settings.deadzone ?? 0.08),
    ry: normalize3DMouseAxis(bridge.state.ry, settings.deadzone ?? 0.08),
    rz: normalize3DMouseAxis(bridge.state.rz, settings.deadzone ?? 0.08)
  };
  if (settings.dominantAxis) sample = dominantAxisFilteredState(sample);
  if (!sample.tx && !sample.ty && !sample.tz && !sample.rx && !sample.ry && !sample.rz) return false;
  const camera = model3DCamera();
  const rotationSpeed = Number(settings.rotationSpeed) || 1.9;
  const panSpeed = Number(settings.panSpeed) || 220;
  const zoomSpeed = Number(settings.zoomSpeed) || 0.9;
  const invertPitch = !!settings.invertPitch;
  const invertPanY = !!settings.invertPanY;
  const invertZoom = !!settings.invertZoom;
  camera.yaw += sample.ry * rotationSpeed * dt;
  camera.pitch = clamp(
    camera.pitch + sample.rx * rotationSpeed * dt * (invertPitch ? -1 : 1),
    -Math.PI / 2 + 0.02,
    Math.PI / 2 - 0.02
  );
  camera.panX += (-sample.tx * panSpeed) * dt;
  camera.panY += ((invertPanY ? sample.ty : -sample.ty) * panSpeed) * dt;
  camera.zoom = clamp(camera.zoom * Math.exp(sample.tz * zoomSpeed * dt * (invertZoom ? -1 : 1)), 0.12, 16);
  camera.preset = "free";
  scheduleModel3DInteractiveRedraw(120);
  return true;
}

function resetViewState() {
  reset2DViewport();
  set3DViewPreset("iso", false);
  reset3DViewport();
  state.viewDrag = null;
}

function markGeometryDirty() {
  state.geometryRevision += 1;
  state.flowlineCache.revision = -1;
  state.flowlineCache.lines.clear();
  state.parameterCache.revision = -1;
  state.parameterCache.areas.clear();
  state.parameterCache.volumeSamples.clear();
  state.parameterCache.volume = null;
  state.parameterCache.centerOfMass = null;
  state.crossSectionCache.revision = -1;
  state.crossSectionCache.rawByBoard = new WeakMap();
  state.crossSectionCache.displayByBoard = new WeakMap();
  if (state.model3d.worldCache) {
    state.model3d.worldCache.revision = -1;
    state.model3d.worldCache.key = "";
    state.model3d.worldCache.lines = [];
  }
  if (state.model3d.projectedCache) {
    state.model3d.projectedCache.revision = -1;
    state.model3d.projectedCache.key = "";
    state.model3d.projectedCache.lines = [];
  }
  if (state.model3d.surfaceFaceCache) {
    state.model3d.surfaceFaceCache.revision = -1;
    state.model3d.surfaceFaceCache.key = "";
    state.model3d.surfaceFaceCache.faces = [];
  }
  if (state.model3d.shadedProjectionCache) {
    state.model3d.shadedProjectionCache.revision = -1;
    state.model3d.shadedProjectionCache.key = "";
    state.model3d.shadedProjectionCache.faces = [];
    state.model3d.shadedProjectionCache.bounds = null;
  }
  if (state.model3d.moireProjectionCache) {
    state.model3d.moireProjectionCache.revision = -1;
    state.model3d.moireProjectionCache.key = "";
    state.model3d.moireProjectionCache.lines = [];
  }
  state.toolpathPreviewCache.revision = -1;
  state.toolpathPreviewCache.key = "";
  state.toolpathPreviewCache.paths = [];
  state.toolpathPreviewCache.projectedRevision = -1;
  state.toolpathPreviewCache.projectedKey = "";
  state.toolpathPreviewCache.projectedPaths = [];
}

function ensureCrossSectionCache() {
  if (state.crossSectionCache.revision === state.geometryRevision) return;
  state.crossSectionCache.revision = state.geometryRevision;
  state.crossSectionCache.rawByBoard = new WeakMap();
  state.crossSectionCache.displayByBoard = new WeakMap();
  state.crossSectionCache.surfaceByBoard = new WeakMap();
  state.crossSectionCache.angleContextByBoard = new WeakMap();
}

function crossSectionCacheMap(type, board) {
  ensureCrossSectionCache();
  const store = type === "display"
    ? state.crossSectionCache.displayByBoard
    : type === "surface"
      ? state.crossSectionCache.surfaceByBoard
      : type === "angle-context"
        ? state.crossSectionCache.angleContextByBoard
      : state.crossSectionCache.rawByBoard;
  let cache = store.get(board);
  if (!cache) {
    cache = new Map();
    store.set(board, cache);
  }
  return cache;
}

function clearCrossSectionCachesForBoard(board) {
  if (!board) return;
  ensureCrossSectionCache();
  state.crossSectionCache.rawByBoard.delete(board);
  state.crossSectionCache.displayByBoard.delete(board);
  state.crossSectionCache.surfaceByBoard.delete(board);
  state.crossSectionCache.angleContextByBoard.delete(board);
}

function reset2DViewport() {
  state.view2d.zoom = 1;
  state.view2d.panX = 0;
  state.view2d.panY = 0;
}

function reset3DViewport() {
  const camera = model3DCamera();
  camera.zoom = 1;
  camera.panX = 0;
  camera.panY = 0;
}

function model3DIsInteracting() {
  const dragActive = !!state.viewDrag && /^3d-/.test(String(state.viewDrag.type || ""));
  return dragActive || Date.now() < Number(state.model3d.interactionUntil || 0);
}

function scheduleModel3DInteractiveRedraw(duration = 140) {
  state.model3d.interactionUntil = Date.now() + duration;
  if (state.model3d.interactionTimer) clearTimeout(state.model3d.interactionTimer);
  state.model3d.interactionTimer = setTimeout(() => {
    state.model3d.interactionUntil = 0;
    state.model3d.interactionTimer = null;
    if (is3DInteractiveView()) draw();
  }, duration + 10);
}

function model3DCamera() {
  if (!state.model3d.camera) {
    state.model3d.camera = {
      yaw: -0.72,
      pitch: -0.46,
      zoom: 1,
      panX: 0,
      panY: 0,
      preset: "iso"
    };
  }
  return state.model3d.camera;
}

function set3DViewPreset(preset, redraw = true) {
  const camera = model3DCamera();
  const presets = {
    iso: { yaw: -0.72, pitch: -0.46 },
    top: { yaw: -Math.PI / 2, pitch: -Math.PI / 2 },
    profile: { yaw: 0, pitch: 0 },
    outline: { yaw: -Math.PI / 2, pitch: 0 },
    nose: { yaw: -Math.PI / 2, pitch: -0.08 },
    tail: { yaw: Math.PI / 2, pitch: -0.08 }
  };
  const next = presets[preset] || presets.iso;
  camera.yaw = next.yaw;
  camera.pitch = next.pitch;
  camera.preset = presets[preset] ? preset : "iso";
  if (redraw) {
    setStatus("status_3d_view_preset", { preset: camera.preset });
    draw();
  }
}

function closeMenus() {
  document.querySelectorAll(".menu[open]").forEach(menu => menu.removeAttribute("open"));
}

function showPanel(panelId) {
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) {
    updateBoardPanel();
    return;
  }
  panel.open = true;
  updateBoardPanel();
  revealPanelInSidebar(panel);
}

function revealPanelInSidebar(panel) {
  if (!panel) return;
  const container = panel.closest("aside.panel");
  if (!container) return;
  const panelTop = panel.offsetTop;
  const panelBottom = panelTop + panel.offsetHeight;
  const viewTop = container.scrollTop;
  const viewBottom = viewTop + container.clientHeight;
  if (panelTop < viewTop) {
    container.scrollTo({ top: Math.max(0, panelTop - 8), behavior: "smooth" });
    return;
  }
  if (panelBottom > viewBottom) {
    container.scrollTo({ top: Math.max(0, panelBottom - container.clientHeight + 8), behavior: "smooth" });
  }
}

function installNavigationGuard() {
  if (state.navigationGuardInstalled) return;
  state.navigationGuardInstalled = true;
  if (!window.history?.pushState || !window.location?.href) return;
  try {
    window.history.replaceState({ boardcadGuard: true, stage: "root" }, "", window.location.href);
    window.history.pushState({ boardcadGuard: true, stage: "buffer" }, "", window.location.href);
  } catch {
    // ignore platforms that restrict history mutation
  }
}

function handleNavigationPopState(_event) {
  if (!window.history?.pushState || !window.location?.href) return;
  try {
    window.history.pushState({ boardcadGuard: true, stage: "buffer" }, "", window.location.href);
  } catch {
    return;
  }
  setStatus("status_navigation_guard_back");
}

function handleBeforeUnload(event) {
  if (!state.board && !state.history.undo.length && !state.probeMeasurements.length) return;
  event.preventDefault();
  event.returnValue = "";
}

function preventBrowserNavigationShortcut(event) {
  if (shouldIgnoreShortcut(event)) return false;
  const key = String(event.key || "").toLowerCase();
  const meta = !!event.metaKey;
  const ctrl = !!event.ctrlKey;
  const alt = !!event.altKey;
  const blocked = (meta && (key === "[" || key === "]" || key === "arrowleft" || key === "arrowright"))
    || (alt && (key === "arrowleft" || key === "arrowright"));
  if (!blocked) return false;
  event.preventDefault();
  event.stopPropagation();
  setStatus("status_navigation_guard_shortcuts");
  return true;
}

function ghostCommandAvailable() {
  return !!state.board
    && !!state.ghost.board
    && state.view !== "model3d"
    && state.view !== "toolpath"
    && state.view !== "scan";
}

function toggleGhostCommandFromKeyEvent(event, active) {
  if (shouldIgnoreShortcut(event)) return false;
  if ((event.key || "").toLowerCase() !== "g") return false;
  if (event.ctrlKey || event.metaKey) return false;
  if (!ghostCommandAvailable()) return false;
  if (state.ghost.active === active) return true;
  state.ghost.active = active;
  setStatus(active ? "status_ghost_mode_on" : "status_ghost_mode_off", { summary: ghostTransformSummary() });
  draw();
  event.preventDefault();
  return true;
}

function active2DPointerScale() {
  if (state.view === "quad") return Math.max(1e-9, state.pointerTransforms.quad?.transform?.scale || 1);
  if (state.view === "sections") return Math.max(1e-9, state.pointerTransforms.section?.transform?.scale || 1);
  return Math.max(1e-9, state.pointerTransforms[state.view]?.transform?.scale || 1);
}

function moveGhostByKey(key, fine = false) {
  if (!ghostCommandAvailable()) return false;
  const scale = active2DPointerScale();
  const step = (fine ? 0.1 : 1) / scale;
  const rotationStep = (Math.PI / 180) * (fine ? 0.1 : 1) / scale;
  if (key === "arrowleft") state.ghost.offsetX -= step;
  else if (key === "arrowright") state.ghost.offsetX += step;
  else if (key === "arrowup") state.ghost.offsetY += step;
  else if (key === "arrowdown") state.ghost.offsetY -= step;
  else if (key === "q") state.ghost.rotation -= rotationStep;
  else if (key === "w") state.ghost.rotation += rotationStep;
  else return false;
  setStatus("status_ghost_transform", { summary: ghostTransformSummary() });
  draw();
  return true;
}

function ghostTransformSummary() {
  return `dX ${fmt(state.ghost.offsetX)} / dY ${fmt(state.ghost.offsetY)} / Rot ${fmt(state.ghost.rotation * 180 / Math.PI)}deg`;
}

function handleKeyboardShortcut(event) {
  if (!state.board || shouldIgnoreShortcut(event)) return;
  const key = event.key.toLowerCase();
  if (is3DInteractiveView() && (event.ctrlKey || event.metaKey)) {
    const code = String(event.code || "");
    if (code === "Digit7" || code === "Numpad7" || code === "Digit1" || code === "Numpad1" || code === "Digit3" || code === "Numpad3") {
      handle3DKeyboardShortcut(event, key);
      return;
    }
  }
  if (state.ghost.active && moveGhostByKey(key, event.altKey)) {
    event.preventDefault();
    return;
  }
  const viewShortcuts = {
    "1": "outline",
    "2": "profile",
    "3": "sections",
    "4": "quad",
    "5": "toolpath",
    "6": "model3d"
  };
  if (viewShortcuts[key]) {
    event.preventDefault();
    setView(viewShortcuts[key]);
    return;
  }
  if (key === "e" || key === "z" || key === "p") {
    event.preventDefault();
    setActiveTool(key === "e" ? "edit" : key === "z" ? "zoom" : "pan");
    return;
  }
  if (key === "f" || key === "0") {
    event.preventDefault();
    fitView();
    return;
  }
  if (key === "+" || key === "=") {
    event.preventDefault();
    is3DInteractiveView() ? zoom3D(1.12, true) : zoom2D(1.12);
    return;
  }
  if (key === "-" || key === "_") {
    event.preventDefault();
    is3DInteractiveView() ? zoom3D(1 / 1.12, true) : zoom2D(1 / 1.12);
    return;
  }
  if ((key === "delete" || key === "backspace") && canDeleteSelectedGuidePoint()) {
    event.preventDefault();
    deleteSelectedGuidePoint();
    return;
  }
  if ((key === "delete" || key === "backspace") && canDeleteControlPoint()) {
    event.preventDefault();
    deleteSelectedControlPoint();
    return;
  }
  if (is3DInteractiveView()) {
    handle3DKeyboardShortcut(event, key);
  } else {
    handle2DKeyboardShortcut(event, key);
  }
}

function shouldIgnoreShortcut(event) {
  const target = event.target;
  if (!target) return false;
  const tagName = target.tagName ? target.tagName.toLowerCase() : "";
  return target.isContentEditable || tagName === "input" || tagName === "select" || tagName === "textarea";
}

function handle2DKeyboardShortcut(event, key) {
  const step = event.shiftKey ? 50 : 24;
  const editStep = step / 10;
  if (key === "arrowleft" || key === "arrowright" || key === "arrowup" || key === "arrowdown") {
    event.preventDefault();
    if (moveSelectedGuidePointByKey(key, editStep)) return;
    if (moveSelectedControlPointByKey(key, editStep)) return;
    if (key === "arrowleft") state.view2d.panX += step;
    if (key === "arrowright") state.view2d.panX -= step;
    if (key === "arrowup") state.view2d.panY += step;
    if (key === "arrowdown") state.view2d.panY -= step;
    draw();
  }
}

function moveSelectedControlPointByKey(key, screenStep) {
  if (state.tool !== "edit" || !state.selection || !state.selection.transform) return false;
  const handle = state.selection;
  const before = cloneBoard(state.board);
  const original = cloneKnot(handle.knots[handle.knotIndex]);
  const modelStep = screenStep / Math.max(1e-9, handle.transform.scale || 1);
  let dx = key === "arrowleft" ? -modelStep : key === "arrowright" ? modelStep : 0;
  let dy = key === "arrowup" ? modelStep : key === "arrowdown" ? -modelStep : 0;
  if (state.editLocks.x) dx = 0;
  if (state.editLocks.y) dy = 0;
  if (dx === 0 && dy === 0) return true;
  moveKnotPoint(handle.knots[handle.knotIndex], original, handle.which, dx, dy);
  state.lastEditPoint = handle.knots[handle.knotIndex][handle.pointKey];
  commitBoardMutation(before);
  setStatus("status_control_point_moved", { dx: fmt(dx), dy: fmt(dy) });
  return true;
}

function moveSelectedGuidePointByKey(key, screenStep) {
  if (state.tool !== "edit" || !state.guidePointSelection || !state.guidePointSelection.transform) return false;
  const handle = state.guidePointSelection;
  const point = handle.points[handle.index];
  if (!point) return false;
  const before = cloneBoard(state.board);
  const modelStep = screenStep / Math.max(1e-9, handle.transform.scale || 1);
  let dx = key === "arrowleft" ? -modelStep : key === "arrowright" ? modelStep : 0;
  let dy = key === "arrowup" ? modelStep : key === "arrowdown" ? -modelStep : 0;
  if (state.editLocks.x) dx = 0;
  if (state.editLocks.y) dy = 0;
  if (dx === 0 && dy === 0) return true;
  handle.points[handle.index] = { x: point.x + dx, y: point.y + dy };
  state.lastEditPoint = handle.points[handle.index];
  commitBoardMutation(before);
  setStatus("status_guide_point_moved", { dx: fmt(dx), dy: fmt(dy) });
  return true;
}

function handle3DKeyboardShortcut(event, key) {
  const camera = model3DCamera();
  const rotateStep = event.shiftKey ? 0.22 : 0.08;
  const panStep = event.shiftKey ? 50 : 24;
  if (event.ctrlKey || event.metaKey) {
    const code = String(event.code || "");
    if (code === "Digit7" || code === "Numpad7") {
      event.preventDefault();
      set3DViewPreset("top");
      return;
    }
    if (code === "Digit1" || code === "Numpad1") {
      event.preventDefault();
      set3DViewPreset("profile");
      return;
    }
    if (code === "Digit3" || code === "Numpad3") {
      event.preventDefault();
      set3DViewPreset("outline");
      return;
    }
  }
  if (key === "i") {
    event.preventDefault();
    set3DViewPreset("iso");
    return;
  }
  if (key === "t") {
    event.preventDefault();
    set3DViewPreset("top");
    return;
  }
  if (key === "o") {
    event.preventDefault();
    set3DViewPreset("outline");
    return;
  }
  if (key === "r") {
    event.preventDefault();
    set3DViewPreset("profile");
    return;
  }
  if (key === "arrowleft" || key === "arrowright" || key === "arrowup" || key === "arrowdown") {
    event.preventDefault();
    if (key === "arrowleft") camera.yaw -= rotateStep;
    if (key === "arrowright") camera.yaw += rotateStep;
    if (key === "arrowup") camera.pitch = clamp(camera.pitch + rotateStep, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
    if (key === "arrowdown") camera.pitch = clamp(camera.pitch - rotateStep, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
    camera.preset = "free";
    draw();
    return;
  }
  if (key === "a" || key === "d" || key === "w" || key === "s") {
    event.preventDefault();
    if (key === "a") camera.panX += panStep;
    if (key === "d") camera.panX -= panStep;
    if (key === "w") camera.panY += panStep;
    if (key === "s") camera.panY -= panStep;
    draw();
  }
}

function setActiveTool(tool) {
  if (!["edit", "zoom", "pan", "spot"].includes(tool)) return;
  state.tool = tool;
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  document.querySelectorAll(".tool[data-tool]").forEach(button => {
    button.classList.toggle("active", button.dataset.tool === tool);
  });
  if (els.canvas) els.canvas.dataset.tool = tool;
  setStatus(tool === "edit" ? "status_tool_edit" : tool === "zoom" ? "status_tool_zoom" : tool === "pan" ? "status_tool_pan" : "status_tool_spot");
  updateEditInfo();
  updateHistoryButtons();
  draw();
}

function clearGuidePointSelection() {
  state.guidePointSelection = null;
  state.selectedGuidePointIndex = -1;
  state.wingSelection = null;
}

function activateGuideTarget(target, options = {}) {
  if (!els.guideTarget) return;
  const nextTarget = target || "outline";
  els.guideTarget.value = nextTarget;
  if (!options.preserveSelection) clearGuidePointSelection();
  updateGuidePointPanel();
  updateEditInfo();
  updateHistoryButtons();
  if (options.openPanel) showPanel("guidePointPanel");
  else draw();
}

function parseBrd(text, filename) {
  const board = {
    filename,
    name: filename.replace(/\.[^.]+$/, ""),
    version: "",
    fields: {},
    length: 0,
    width: 0,
    thickness: 0,
    interpolationType: state.crossSectionInterpolation,
    finType: "",
    fins: Array(9).fill(0),
    finSetup: "",
    finToeIn: 0,
    finCant: 0,
    finExtra: [],
    tailMode: "",
    tailLength: 0,
    tailDepth: 0,
    tailShoulderPos: 0,
    tailShoulderScale: 0,
    tailRailBlend: 0,
    tailLinearization: 0,
    tailWidthAdjust: 0,
    noseMode: "",
    noseLength: 0,
    noseShoulderPos: 0,
    noseShoulderScale: 0,
    noseRailBlend: 0,
    noseLinearization: 0,
    noseWidthAdjust: 0,
    wingPreset: "",
    wingPosition: 0,
    wingWidth: 0,
    wingShape: "",
    wingShoulder: 0,
    wingTransition: 0,
    railMode: "",
    railStrength: 1,
    edgeType: "",
    edgeStrength: 0,
    edgeLength: 0,
    edgeFade: 0,
    bottomFeatures: [],
    outlineGuidePoints: [],
    bottomGuidePoints: [],
    deckGuidePoints: [],
    outline: [],
    bottom: [],
    deck: [],
    sections: []
  };

  const lines = text.replace(/\r/g, "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const id = parseId(line);
    if (!id) continue;
    if (![32, 33, 34, 35].includes(id.id)) {
      board.fields[id.id] = valueAfterColon(line);
    }
    if (id.id === 1) board.length = numberAfterColon(line);
    if (id.id === 3) board.thickness = numberAfterColon(line);
    if (id.id === 4) board.width = numberAfterColon(line);
    if (id.id === 7) board.version = valueAfterColon(line);
    if (id.id === 8) board.name = valueAfterColon(line) || board.name;
    if (id.id === 50) board.fins = parseNumberArray(valueAfterColon(line), 9);
    if (id.id === 51) board.finType = valueAfterColon(line);
    if (id.id === 58) board.finSetup = valueAfterColon(line);
    if (id.id === 59) board.finToeIn = numberAfterColon(line);
    if (id.id === 60) board.finCant = numberAfterColon(line);
    if (id.id === 61) board.finExtra = parseFinExtra(valueAfterColon(line));
    if (id.id === 62) board.tailMode = normalizeTailModeKey(valueAfterColon(line));
    if (id.id === 63) board.tailLength = numberAfterColon(line);
    if (id.id === 64) board.tailDepth = numberAfterColon(line);
    if (id.id === 65) board.tailShoulderPos = numberAfterColon(line);
    if (id.id === 66) board.tailShoulderScale = numberAfterColon(line);
    if (id.id === 67) board.tailRailBlend = numberAfterColon(line);
    if (id.id === 74) board.tailLinearization = numberAfterColon(line);
    if (id.id === 68) board.wingPreset = valueAfterColon(line);
    if (id.id === 69) board.wingPosition = numberAfterColon(line);
    if (id.id === 70) board.wingWidth = numberAfterColon(line);
    if (id.id === 71) board.wingShape = valueAfterColon(line);
    if (id.id === 72) board.wingShoulder = numberAfterColon(line);
    if (id.id === 73) board.wingTransition = numberAfterColon(line);
    if (id.id === 75) board.noseMode = normalizeNoseModeKey(valueAfterColon(line));
    if (id.id === 76) board.noseLength = numberAfterColon(line);
    if (id.id === 77) board.noseShoulderPos = numberAfterColon(line);
    if (id.id === 78) board.noseShoulderScale = numberAfterColon(line);
    if (id.id === 79) board.noseRailBlend = numberAfterColon(line);
    if (id.id === 80) board.noseLinearization = numberAfterColon(line);
    if (id.id === 81) board.tailWidthAdjust = numberAfterColon(line);
    if (id.id === 82) board.noseWidthAdjust = numberAfterColon(line);
    if (id.id === EDGE_TYPE_FIELD_ID) board.edgeType = normalizeEdgeTypeKey(valueAfterColon(line));
    if (id.id === EDGE_STRENGTH_FIELD_ID) board.edgeStrength = numberAfterColon(line);
    if (id.id === EDGE_LENGTH_FIELD_ID) board.edgeLength = numberAfterColon(line);
    if (id.id === EDGE_FADE_FIELD_ID) board.edgeFade = numberAfterColon(line);
    if (id.id === BOTTOM_FEATURE_FIELD_ID) board.bottomFeatures = parseBottomFeatures(valueAfterColon(line));
    if (id.id === BOTTOM_PRESET_FIELD_ID) board.bottomPreset = normalizeBottomPresetKey(valueAfterColon(line));
    if (id.id === ROCKER_PRESET_FIELD_ID) board.rockerPreset = normalizeRockerPresetKey(valueAfterColon(line));
    if (id.id === ROCKER_CONFIG_FIELD_ID) board.rockerConfig = parseRockerConfig(valueAfterColon(line), board.rockerPreset);
    if (id.id === 32) {
      const block = collectBlock(lines, i);
      const parsed = parseSplineBlock(block.text);
      board.outline = parsed.knots;
      board.outlineGuidePoints = parsed.guidePoints;
      i = block.end;
    }
    if (id.id === 33) {
      const block = collectBlock(lines, i);
      const parsed = parseSplineBlock(block.text);
      board.bottom = parsed.knots;
      board.bottomGuidePoints = parsed.guidePoints;
      i = block.end;
    }
    if (id.id === 34) {
      const block = collectBlock(lines, i);
      const parsed = parseSplineBlock(block.text);
      board.deck = parsed.knots;
      board.deckGuidePoints = parsed.guidePoints;
      i = block.end;
    }
    if (id.id === 35) {
      const block = collectBlock(lines, i);
      board.sections = parseSections(block.text);
      i = block.end;
    }
  }

  if (!board.outline.length && !board.bottom.length && !board.deck.length) {
    throw new Error("対応するp32/p33/p34データが見つかりません。");
  }
  applyBoardCadDerivedMetrics(board);
  normalizeLegacyWingPresetState(board);
  board.edgeType = normalizeEdgeTypeKey(board.edgeType);
  board.edgeStrength = clampNumber(board.edgeStrength, 0, 1, 0);
  board.edgeLength = Math.max(0, Number(board.edgeLength) || 0);
  board.edgeFade = Math.max(0, Number(board.edgeFade) || 0);
  board.bottomPreset = normalizeBottomPresetKey(board.bottomPreset);
  board.bottomFeatures = normalizeBottomFeatures(board.bottomFeatures);
  const parsedRockerPreset = normalizeRockerPresetKey(board.rockerPreset) || normalizeRockerPresetKey(board.rockerConfig?.preset) || "custom";
  board.rockerPreset = parsedRockerPreset;
  board.rockerConfig = normalizeRockerConfig(board.rockerConfig, parsedRockerPreset);
  normalizeLegacyBottomFeatureLayout(board);
  return board;
}

function applyBoardCadDerivedMetrics(board) {
  if (board.outline.length) {
    board.length = boardCadLength(board);
    board.width = boardCadMaxWidth(board);
  }
  if (board.deck.length && board.bottom.length) {
    board.thickness = boardCadMaxThickness(board);
  }
}

function boardCadLength(board) {
  return Math.max(0, ...board.outline.map(k => k.p.x));
}

const TAIL_MODE_PRESETS = {
  square: { length: 5.0, depth: 0, tipRatio: 0, tipScale: 1.0, cornerScale: 0.98, shoulderPos: 0.32, shoulderScale: 0.99, railBlend: 0.7, linearization: 0, tipSlopeFactor: 1, shoulderSlopeFactor: 1, joinSlopeMix: 1, joinSlopeFactor: 1, tipBow: 0, railBow: 0 },
  squash: { length: 8.8, depth: 0, tipRatio: 1.0, tipScale: 0.78, shoulderPos: 0.42, shoulderScale: 0.86, railBlend: 0.88, linearization: 0, tipSlopeFactor: 1.12, shoulderSlopeFactor: 0.92, joinSlopeMix: 0.22, joinSlopeFactor: 0.88, tipBow: 0.05, railBow: 0.1 },
  round: { length: 26.0, depth: 0, tipRatio: 0.88, tipScale: 0.34, shoulderPos: 0.62, shoulderScale: 0.74, railBlend: 0.86, linearization: 0, tipSlopeFactor: 0.96, shoulderSlopeFactor: 1.0, joinSlopeMix: 0.26, joinSlopeFactor: 0.9, tipBow: 0.08, railBow: 0.12 },
  "rounded-square": { length: 6.9, depth: 0, tipRatio: 0.28, tipScale: 0.86, shoulderPos: 0.46, shoulderScale: 0.94, railBlend: 0.78, linearization: 0, tipSlopeFactor: 0.78, shoulderSlopeFactor: 1.0, joinSlopeMix: 0.24, joinSlopeFactor: 0.9, tipBow: 0.07, railBow: 0.1 },
  gun: { length: 22.0, depth: 0, tipRatio: 1.0, tipScale: 0, shoulderPos: 0.82, shoulderScale: 0.66, railBlend: 1.0, linearization: 0, tipSlopeFactor: 0.72, shoulderSlopeFactor: 0.96, joinSlopeMix: 0.85, joinSlopeFactor: 1.0, tipBow: 0, railBow: 0.02 },
  pin: { length: 35.25, depth: 0, tipRatio: 1.0, tipScale: 0, shoulderPos: 0.74, shoulderScale: 0.34, railBlend: 1.0, linearization: 0, tipSlopeFactor: 0.44, shoulderSlopeFactor: 0.76, joinSlopeMix: 0.12, joinSlopeFactor: 0.96, tipBow: 0, railBow: 0 },
  "round-pin": { length: 32.0, depth: 0, tipRatio: 0.82, tipScale: 0, shoulderPos: 0.6, shoulderScale: 0.52, railBlend: 0.92, linearization: 0, tipSlopeFactor: 0.68, shoulderSlopeFactor: 0.72, joinSlopeMix: 0.08, joinSlopeFactor: 0.86, tipBow: 0.14, railBow: 0.12, outerMode: "round-pin" },
  diamond: { length: 7.0, depth: 0, tipRatio: 0.38, tipScale: 0.12, shoulderPos: 0.5, shoulderScale: 0.48, railBlend: 0.8, linearization: 0, tipSlopeFactor: 0.72, shoulderSlopeFactor: 0.44, joinSlopeMix: 0.04, joinSlopeFactor: 0.64, tipBow: 0.01, railBow: 0.02, outerMode: "diamond" },
  "rounded-diamond": { length: 7.2, depth: 0, tipRatio: 0.48, tipScale: 0.3, shoulderPos: 0.56, shoulderScale: 0.62, railBlend: 0.84, linearization: 0, tipSlopeFactor: 0.76, shoulderSlopeFactor: 0.66, joinSlopeMix: 0.1, joinSlopeFactor: 0.78, tipBow: 0.04, railBow: 0.1, outerMode: "rounded-diamond" },
  rocket: { length: 8.0, depth: 0, tipRatio: 0.92, tipScale: 0, shoulderPos: 0.66, shoulderScale: 0.48, railBlend: 0.98, linearization: 0, tipSlopeFactor: 0.72, shoulderSlopeFactor: 0.9, joinSlopeMix: 0.18, joinSlopeFactor: 0.96 },
  "half-moon": { length: 6.8, depth: 1.9, tipRatio: 0.24, tipScale: 0.82, shoulderPos: 0.42, shoulderScale: 0.88, railBlend: 0.8, linearization: 0, tipSlopeFactor: 0.82, shoulderSlopeFactor: 0.92, joinSlopeMix: 0.24, joinSlopeFactor: 0.9, innerPower: 1.6, tipBow: 0.04, railBow: 0.08 },
  swallow: { length: 38.0, cutLength: 16.0, depth: 7.0, tipRatio: 0, tipScale: 1.0, cornerScale: 0.512, shoulderPos: 0.36, shoulderScale: 0.9, railBlend: 0.86, linearization: 0, tipSlopeFactor: 0.68, shoulderSlopeFactor: 0.78, joinSlopeMix: 0.34, joinSlopeFactor: 0.78, innerPower: 1.3, tipBow: 0.03, railBow: 0.18 },
  fish: { length: 42.0, cutLength: 18.0, depth: 12.0, tipRatio: 0, tipScale: 1.0, cornerScale: 0.72, shoulderPos: 0.28, shoulderScale: 0.94, railBlend: 0.82, linearization: 0, tipSlopeFactor: 0.62, shoulderSlopeFactor: 0.78, joinSlopeMix: 0.28, joinSlopeFactor: 0.72, innerPower: 1.08, tipBow: 0.05, railBow: 0.24 },
  split: { length: 8.8, depth: 4.6, tipRatio: 0.34, tipScale: 0.16, shoulderPos: 0.44, shoulderScale: 0.62, railBlend: 0.82, linearization: 0, tipSlopeFactor: 0.92, shoulderSlopeFactor: 0.92, joinSlopeMix: 0.3, joinSlopeFactor: 0.88, innerPower: 1.45, tipBow: 0.06, railBow: 0.12 },
  star: { length: 8.8, depth: 4.6, tipRatio: 0.34, tipScale: 0.16, shoulderPos: 0.44, shoulderScale: 0.62, railBlend: 0.82, linearization: 0, tipSlopeFactor: 0.92, shoulderSlopeFactor: 0.92, joinSlopeMix: 0.3, joinSlopeFactor: 0.88, innerPower: 1.45, tipBow: 0.06, railBow: 0.12 },
  bat: { length: 9.2, depth: 4.2, tipRatio: 0.62, tipScale: 0.42, shoulderPos: 0.56, shoulderScale: 0.68, railBlend: 0.9, linearization: 0, tipSlopeFactor: 0.86, shoulderSlopeFactor: 0.96, joinSlopeMix: 0.34, joinSlopeFactor: 0.92, innerPower: 1.25, tipBow: 0.04, railBow: 0.1 }
};

const EMPIRICAL_TAIL_WIDTH_TARGETS = {
  diamond: { x70Ratio: 0.111, sampleCount: 1 },
  fish: { x70Ratio: 0.145, sampleCount: 3, legacySplitTailEncoding: true },
  gun: { x70Ratio: 0.174, sampleCount: 2 },
  pin: { x70Ratio: 0.133, sampleCount: 4 },
  round: { x70Ratio: 0.143, sampleCount: 2 }
};

const NOSE_MODE_PRESETS = {
  gun: { length: 24.0, shoulderPos: 0.82, shoulderScale: 0.62, railBlend: 1.0, linearization: 0 },
  pin: { length: 18.0, shoulderPos: 0.72, shoulderScale: 0.55, railBlend: 0.96, linearization: 0 },
  "round-point": { length: 13.0, shoulderPos: 0.64, shoulderScale: 0.62, railBlend: 0.9, linearization: 0 },
  wide: { length: 10.0, shoulderPos: 0.58, shoulderScale: 0.78, railBlend: 0.86, linearization: 0 },
  round: { length: 8.0, shoulderPos: 0.5, shoulderScale: 0.84, railBlend: 0.8, linearization: 0 },
  diamond: { length: 6.5, shoulderPos: 0.45, shoulderScale: 0.72, railBlend: 0.72, linearization: 0 },
  snub: { length: 5.5, shoulderPos: 0.4, shoulderScale: 0.78, railBlend: 0.68, linearization: 0 },
  square: { length: 4.5, shoulderPos: 0.34, shoulderScale: 0.82, railBlend: 0.62, linearization: 0 }
};

function normalizeTailModeKey(value) {
  const key = String(value || "").trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  if (!key || key === "none" || key === "bezier" || key === "native" || key === "bezier-native") return "";
  if (key === "round-square" || key === "rounded-square" || key === "roundedsquare" || key === "roundsquare" || key === "round-squash" || key === "roundedsquash" || key === "roundsquash") return "rounded-square";
  if (key === "round-diamond" || key === "rounded-diamond" || key === "roundeddiamond" || key === "rounddiamond") return "rounded-diamond";
  if (key === "round-pin" || key === "rounded-pin" || key === "roundpin" || key === "roundedpin") return "round-pin";
  if (key === "halfmoon") return "half-moon";
  return TAIL_MODE_PRESETS[key] ? key : "";
}

function normalizeNoseModeKey(value) {
  const key = String(value || "").trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  if (!key || key === "none" || key === "bezier" || key === "native" || key === "bezier-native") return "";
  if (key === "point" || key === "point-nose" || key === "gun-nose") return "gun";
  if (key === "pin-nose") return "pin";
  if (key === "round-pointed" || key === "round-pointed-nose" || key === "rounded-point" || key === "rounded-point-nose") return "round-point";
  if (key === "wide-nose") return "wide";
  if (key === "round-nose" || key === "rounded" || key === "rounded-nose") return "round";
  if (key === "diamond-nose") return "diamond";
  if (key === "snub-nose" || key === "round-square" || key === "rounded-square") return "snub";
  if (key === "square-nose") return "square";
  return NOSE_MODE_PRESETS[key] ? key : "";
}

function nosePresetForBoard(mode, board) {
  const key = normalizeNoseModeKey(mode);
  if (!key) return null;
  const preset = NOSE_MODE_PRESETS[key];
  if (!preset) return null;
  const length = Math.max(1, Number(board?.length) || 180);
  return {
    ...preset,
    length: Math.min(preset.length, length * 0.25)
  };
}

function empiricalTailWidthTarget(mode) {
  const key = normalizeTailModeKey(mode);
  return EMPIRICAL_TAIL_WIDTH_TARGETS[key] || null;
}

function normalizeBottomFeatureType(value) {
  const key = String(value || "").trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  if (key === "single" || key === "concave" || key === "singleconcave") return "single-concave";
  if (key === "double" || key === "doubleconcave") return "double-concave";
  if (key === "spiralvee" || key === "spiral-vee-bottom") return "spiral-vee";
  if (key === "displacement" || key === "displacementhull" || key === "displacement-bottom") return "displacement-hull";
  return BOTTOM_FEATURE_TYPES.includes(key) ? key : "";
}

function bottomFeatureDefault(type, index = 0, boardLength = null, boardWidth = null) {
  const key = normalizeBottomFeatureType(type);
  const resolvedLength = Math.max(24, Number.isFinite(Number(boardLength)) ? Number(boardLength) : 180);
  const resolvedWidth = Math.max(30, Number.isFinite(Number(boardWidth)) ? Number(boardWidth) : 52);
  const shortBias = clamp01((220 - resolvedLength) / 70);
  const longBias = clamp01((resolvedLength - 220) / 100);
  const wideBias = clamp01((resolvedWidth - 52) / 12);
  const base = {
    id: `${key || "feature"}-${index + 1}`,
    type: key || "single-concave",
    enabled: true,
    start: 24,
    peak: 90,
    end: 156,
    depth: 0.16,
    width: 0.72,
    blend: 1,
    offset: 0.4,
    spacing: 0.12,
    count: 2,
    longitudinalFlat: 0,
    centerDepth: 0.07,
    railDepth: 0.18,
    railLockCm: BOTTOM_FEATURE_RAIL_LOCK_CM,
    power: 1.6,
    edge: 0.75
  };
  const spec = BOTTOM_FEATURE_TYPE_SPECS[key || "single-concave"];
  if (!spec) return base;
  const defaults = { ...base, ...spec.defaults };
  const startRatio = clampNumber(defaults.startRatio, 0, 0.96, defaults.start / resolvedLength);
  const peakRatio = clampNumber(defaults.peakRatio, startRatio, 0.985, defaults.peak / resolvedLength);
  const endRatio = clampNumber(defaults.endRatio, peakRatio, 1, defaults.end / resolvedLength);
  const scaledStart = clampNumber(resolvedLength * startRatio, 0, resolvedLength, defaults.start);
  const scaledPeak = clampNumber(resolvedLength * peakRatio, scaledStart, resolvedLength, defaults.peak);
  const scaledEnd = clampNumber(resolvedLength * endRatio, scaledPeak, resolvedLength, defaults.end);
  const empirical = {
    ...defaults,
    start: scaledStart,
    peak: scaledPeak,
    end: scaledEnd
  };
  if (key === "single-concave") {
    empirical.depth = clampNumber(empirical.depth + (0.04 * shortBias) - (0.02 * longBias), 0, BOTTOM_FEATURE_DEPTH_MAX, empirical.depth);
    empirical.width = clampNumber(empirical.width - (0.08 * shortBias) + (0.06 * longBias) + (0.04 * wideBias), 0.2, 1, empirical.width);
    empirical.power = clampNumber(empirical.power - (0.2 * longBias), 0.6, 4, empirical.power);
  } else if (key === "double-concave") {
    empirical.centerDepth = clampNumber(empirical.centerDepth + (0.02 * shortBias), 0, BOTTOM_FEATURE_DEPTH_MAX, empirical.centerDepth);
    empirical.railDepth = clampNumber(empirical.railDepth + (0.05 * shortBias) - (0.02 * longBias), 0, BOTTOM_FEATURE_DEPTH_MAX, empirical.railDepth);
    empirical.width = clampNumber(empirical.width - (0.06 * shortBias) + (0.05 * wideBias), 0.2, 0.95, empirical.width);
    empirical.offset = clampNumber(empirical.offset + (0.05 * shortBias), 0.15, 0.8, empirical.offset);
  } else if (key === "vee") {
    empirical.depth = clampNumber(empirical.depth + (0.03 * longBias) - (0.02 * shortBias), 0, BOTTOM_FEATURE_DEPTH_MAX, empirical.depth);
    empirical.width = clampNumber(empirical.width - (0.08 * shortBias), 0.4, 1, empirical.width);
    empirical.start = clampNumber(empirical.start - (resolvedLength * 0.05 * longBias), 0, empirical.peak, empirical.start);
  } else if (key === "spiral-vee") {
    empirical.depth = clampNumber(empirical.depth + (0.02 * longBias), 0, BOTTOM_FEATURE_DEPTH_MAX, empirical.depth);
    empirical.width = clampNumber(empirical.width - (0.08 * shortBias), 0.35, 1, empirical.width);
    empirical.offset = clampNumber(empirical.offset + (0.05 * shortBias), 0, 0.45, empirical.offset);
    empirical.start = clampNumber(empirical.start - (resolvedLength * 0.02 * longBias), 0, empirical.peak, empirical.start);
    empirical.peak = clampNumber(empirical.peak + (resolvedLength * 0.04 * longBias), empirical.start, empirical.end, empirical.peak);
    empirical.end = clampNumber(empirical.end + (resolvedLength * 0.05 * longBias), empirical.peak, resolvedLength, empirical.end);
  } else if (key === "hull") {
    empirical.depth = clampNumber(empirical.depth - (0.03 * longBias) + (0.01 * shortBias), 0, BOTTOM_FEATURE_DEPTH_MAX, empirical.depth);
    empirical.width = clampNumber(empirical.width + (0.05 * longBias) + (0.04 * wideBias), 0.45, 1, empirical.width);
    empirical.power = clampNumber(empirical.power + (0.2 * longBias), 0.8, 4, empirical.power);
  } else if (key === "displacement-hull") {
    empirical.depth = clampNumber(empirical.depth - (0.02 * longBias) + (0.01 * shortBias), 0, BOTTOM_FEATURE_DEPTH_MAX, empirical.depth);
    empirical.railDepth = clampNumber(empirical.railDepth + (0.02 * longBias), 0, BOTTOM_FEATURE_DEPTH_MAX, empirical.railDepth);
    empirical.width = clampNumber(empirical.width + (0.02 * longBias) + (0.02 * wideBias), 0.45, 1, empirical.width);
    empirical.power = clampNumber(empirical.power + (0.2 * longBias), 0.8, 4, empirical.power);
  } else if (key === "channel") {
    empirical.railDepth = clampNumber(empirical.railDepth + (0.05 * shortBias) - (0.02 * longBias), 0, BOTTOM_FEATURE_DEPTH_MAX, empirical.railDepth);
    empirical.width = clampNumber(empirical.width - (0.03 * shortBias), 0.05, 0.35, empirical.width);
    empirical.offset = clampNumber(empirical.offset + (0.04 * shortBias), 0.3, 1, empirical.offset);
    empirical.spacing = clampNumber(empirical.spacing - (0.02 * shortBias), 0, 0.25, empirical.spacing);
  }
  return empirical;
}

function bottomFeatureTypeSpec(type) {
  return BOTTOM_FEATURE_TYPE_SPECS[normalizeBottomFeatureType(type) || "single-concave"] || BOTTOM_FEATURE_TYPE_SPECS["single-concave"];
}

function bottomFeatureLimit(type, field, fallbackMin, fallbackMax, fallbackStep) {
  const spec = bottomFeatureTypeSpec(type);
  const limit = spec?.limits?.[field];
  if (!Array.isArray(limit)) return [fallbackMin, fallbackMax, fallbackStep];
  return [
    Number.isFinite(limit[0]) ? limit[0] : fallbackMin,
    Number.isFinite(limit[1]) ? limit[1] : fallbackMax,
    Number.isFinite(limit[2]) ? limit[2] : fallbackStep
  ];
}

function normalizeBottomFeature(feature, index = 0) {
  const type = normalizeBottomFeatureType(feature?.type);
  if (!type) return null;
  const defaults = bottomFeatureDefault(type, index);
  const spec = bottomFeatureTypeSpec(type);
  const readNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const start = Math.max(0, readNumber(feature?.start, defaults.start));
  const peak = Math.max(start, readNumber(feature?.peak, defaults.peak));
  const end = Math.max(peak, readNumber(feature?.end, defaults.end));
  const visible = spec?.visibleFields || {};
  const [depthMin, depthMax] = bottomFeatureLimit(type, "depth", 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01);
  const [widthMin, widthMax] = bottomFeatureLimit(type, "width", 0.05, 1, 0.01);
  const [blendMin, blendMax] = bottomFeatureLimit(type, "blend", 0.1, 4, 0.05);
  const [powerMin, powerMax] = bottomFeatureLimit(type, "power", 0.4, 4, 0.05);
  const [edgeMin, edgeMax] = bottomFeatureLimit(type, "edge", 0, 1, 0.05);
  const [offsetMin, offsetMax] = bottomFeatureLimit(type, "offset", 0, 0.95, 0.01);
  const [spacingMin, spacingMax] = bottomFeatureLimit(type, "spacing", 0, 0.5, 0.01);
  const [countMin, countMax] = bottomFeatureLimit(type, "count", 1, 10, 1);
  const [longitudinalFlatMin, longitudinalFlatMax] = bottomFeatureLimit(type, "longitudinalFlat", 0, 1, 0.05);
  const [centerMin, centerMax] = bottomFeatureLimit(type, "centerDepth", 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01);
  const [railMin, railMax] = bottomFeatureLimit(type, "railDepth", 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01);
  const railLockCm = clampNumber(feature?.railLockCm, 0, BOTTOM_FEATURE_RAIL_LOCK_CM_MAX, defaults.railLockCm);
  return {
    id: String(feature?.id || defaults.id),
    type,
    enabled: feature?.enabled !== false,
    start,
    peak,
    end,
    depth: visible.depth === false ? defaults.depth : clampNumber(feature?.depth, depthMin, depthMax, defaults.depth),
    width: clampNumber(feature?.width, widthMin, widthMax, defaults.width),
    blend: clampNumber(feature?.blend, blendMin, blendMax, defaults.blend),
    offset: visible.offset === false ? defaults.offset : clampNumber(feature?.offset, offsetMin, offsetMax, defaults.offset),
    spacing: visible.spacing === false ? defaults.spacing : clampNumber(feature?.spacing, spacingMin, spacingMax, defaults.spacing),
    count: visible.count === false ? defaults.count : Math.max(countMin, Math.min(countMax, Math.round(readNumber(feature?.count, defaults.count)))),
    longitudinalFlat: visible.longitudinalFlat === true ? clampNumber(feature?.longitudinalFlat, longitudinalFlatMin, longitudinalFlatMax, defaults.longitudinalFlat) : defaults.longitudinalFlat,
    centerDepth: visible.centerDepth === false ? defaults.centerDepth : clampNumber(feature?.centerDepth, centerMin, centerMax, defaults.centerDepth),
    railDepth: visible.railDepth === false ? defaults.railDepth : clampNumber(feature?.railDepth, railMin, railMax, defaults.railDepth),
    railLockCm,
    power: clampNumber(feature?.power, powerMin, powerMax, defaults.power),
    edge: visible.edge === false ? defaults.edge : clampNumber(feature?.edge, edgeMin, edgeMax, defaults.edge)
  };
}

function normalizeBottomFeatures(features = []) {
  if (!Array.isArray(features)) return [];
  return features.map((feature, index) => normalizeBottomFeature(feature, index)).filter(Boolean);
}

function distributeBottomFeatureRangesEvenly(features = [], board = state.board) {
  const normalized = normalizeBottomFeatures(features);
  const count = normalized.length;
  if (!count) return normalized;
  if (count === 1) return normalized;
  const length = Math.max(1, Number(board?.length) || 1);
  return normalized.map((feature, index) => {
    const start = length * ((count - index - 1) / count);
    const end = length * ((count - index) / count);
    return normalizeBottomFeature({
      ...feature,
      start,
      peak: (start + end) * 0.5,
      end
    }, index);
  });
}

function bottomFeaturesNeedLegacyRedistribution(features = [], board = state.board) {
  const normalized = normalizeBottomFeatures(features);
  if (normalized.length < 2) return false;
  const length = Math.max(1, Number(board?.length) || 1);
  const ordered = normalized
    .map(feature => ({
      feature,
      center: (Number(feature.start) + Number(feature.end)) * 0.5
    }))
    .sort((a, b) => b.center - a.center);
  let heavilyOverlappedPairs = 0;
  let identicalPairs = 0;
  for (let i = 0; i < ordered.length - 1; i++) {
    const current = ordered[i].feature;
    const next = ordered[i + 1].feature;
    const currentRange = Math.max(1e-9, Number(current.end) - Number(current.start));
    const nextRange = Math.max(1e-9, Number(next.end) - Number(next.start));
    const overlap = Math.min(Number(current.end), Number(next.end)) - Math.max(Number(current.start), Number(next.start));
    const overlapRatio = overlap / Math.max(1e-9, Math.min(currentRange, nextRange));
    const identical =
      Math.abs(Number(current.start) - Number(next.start)) <= (length * 0.001) &&
      Math.abs(Number(current.peak) - Number(next.peak)) <= (length * 0.001) &&
      Math.abs(Number(current.end) - Number(next.end)) <= (length * 0.001);
    if (identical) identicalPairs++;
    if (overlapRatio >= 0.45) heavilyOverlappedPairs++;
  }
  return identicalPairs === (ordered.length - 1) || heavilyOverlappedPairs === (ordered.length - 1);
}

function normalizeLegacyBottomFeatureLayout(board) {
  if (!board) return board;
  const normalized = normalizeBottomFeatures(board.bottomFeatures);
  board.bottomFeatures = bottomFeaturesNeedLegacyRedistribution(normalized, board)
    ? distributeBottomFeatureRangesEvenly(normalized, board)
    : normalized;
  return board;
}

function parseBottomFeatures(value) {
  const text = String(value || "").trim();
  if (!text.length) return [];
  try {
    return normalizeBottomFeatures(JSON.parse(text));
  } catch {
    return [];
  }
}

function serializeBottomFeatures(features) {
  const normalized = normalizeBottomFeatures(features);
  return normalized.length ? JSON.stringify(normalized) : "";
}

function normalizeRockerPresetKey(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (!raw) return "";
  const aliases = {
    continuous: "continuous-neutral",
    neutral: "continuous-neutral",
    relaxed: "relaxed-drive",
    drive: "relaxed-drive",
    performance: "performance-curve",
    curvy: "performance-curve",
    staged: "staged-speed",
    speed: "staged-speed",
    fish: "fish-retro-flat",
    retro: "fish-retro-flat",
    gun: "gun-continuous",
    longboard: "longboard-glide",
    glide: "longboard-glide"
  };
  const key = aliases[raw] || raw;
  return ROCKER_PRESET_KEYS.includes(key) ? key : "custom";
}

function rockerPresetOrDefault(value) {
  return normalizeRockerPresetKey(value) || "custom";
}

function defaultRockerConfig(preset = "custom") {
  const normalizedPreset = rockerPresetOrDefault(preset);
  const presetDefaults = ROCKER_PRESET_PARAMETER_DEFAULTS[normalizedPreset] || {};
  return {
    ...ROCKER_CONFIG_DEFAULTS,
    ...presetDefaults,
    preset: normalizedPreset
  };
}

function normalizeRockerConfig(config = {}, preset = "") {
  const source = (config && typeof config === "object" && !Array.isArray(config)) ? config : {};
  const normalizedPreset = normalizeRockerPresetKey(preset) || normalizeRockerPresetKey(source.preset) || "custom";
  const preserveDeck = source.preserveDeck === true || source.preserveDeck === "true";
  return {
    preset: normalizedPreset,
    enabled: source.enabled === true || source.enabled === "true",
    noseRocker: Number.isFinite(Number(source.noseRocker)) ? Number(source.noseRocker) : 0,
    tailRocker: Number.isFinite(Number(source.tailRocker)) ? Number(source.tailRocker) : 0,
    entryLengthRatio: clampNumber(source.entryLengthRatio, 0.05, 0.5, ROCKER_CONFIG_DEFAULTS.entryLengthRatio),
    entryLift: Number.isFinite(Number(source.entryLift)) ? Number(source.entryLift) : 0,
    middleFlatness: clampNumber(source.middleFlatness, -1, 1, 0),
    tailKickLengthRatio: clampNumber(source.tailKickLengthRatio, 0.05, 0.5, ROCKER_CONFIG_DEFAULTS.tailKickLengthRatio),
    tailKick: Number.isFinite(Number(source.tailKick)) ? Number(source.tailKick) : 0,
    apexShift: clampNumber(source.apexShift, -1, 1, 0),
    blend: clampNumber(source.blend, 0.1, 4, ROCKER_CONFIG_DEFAULTS.blend),
    preserveFoil: preserveDeck ? false : source.preserveFoil !== false && source.preserveFoil !== "false",
    preserveDeck
  };
}

function parseRockerConfig(value, preset = "") {
  const text = String(value || "").trim();
  if (!text.length) return defaultRockerConfig(preset);
  try {
    return normalizeRockerConfig(JSON.parse(text), preset);
  } catch {
    return defaultRockerConfig(preset);
  }
}

function serializeRockerConfig(config, preset = "") {
  const normalized = normalizeRockerConfig(config, preset);
  const defaults = defaultRockerConfig(normalized.preset);
  const keys = Object.keys(defaults);
  const changed = keys.some(key => normalized[key] !== defaults[key]);
  return changed ? JSON.stringify(normalized) : "";
}

function smoothStep01(value) {
  const t = clamp01(value);
  return t * t * (3 - (2 * t));
}

function hermiteInterpolate01(y0, y1, m0, m1, u) {
  const t = clamp01(u);
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = (2 * t3) - (3 * t2) + 1;
  const h10 = t3 - (2 * t2) + t;
  const h01 = (-2 * t3) + (3 * t2);
  const h11 = t3 - t2;
  return (h00 * y0) + (h10 * m0) + (h01 * y1) + (h11 * m1);
}

function rockerCenterFlatWindow(length, apexX, flatness) {
  const flatSpanRatio = clampNumber(0.08 + (clampNumber(flatness, -1, 1, 0) * 0.12), 0, 0.28, 0.08);
  const flatHalfSpan = Math.max(0, length * flatSpanRatio * 0.5);
  const start = clampNumber(apexX - flatHalfSpan, 0, apexX, apexX);
  const end = clampNumber(apexX + flatHalfSpan, apexX, length, apexX);
  return {
    start,
    end,
    halfSpan: flatHalfSpan,
    active: end > start + 1e-6
  };
}

function straightenSplineWindow(knots, startX, endX) {
  if (!Array.isArray(knots) || knots.length < 2) return knots;
  const start = Math.min(startX, endX);
  const end = Math.max(startX, endX);
  const indices = [];
  for (let i = 0; i < knots.length; i++) {
    const x = Number(knots[i]?.p?.x);
    if (Number.isFinite(x) && x >= start - 1e-6 && x <= end + 1e-6) indices.push(i);
  }
  if (indices.length < 2) return knots;
  const setLinearSegment = (left, right) => {
    if (!left || !right) return;
    const dx = right.p.x - left.p.x;
    const dy = right.p.y - left.p.y;
    left.next = {
      x: left.p.x + (dx / 3),
      y: left.p.y + (dy / 3)
    };
    right.prev = {
      x: right.p.x - (dx / 3),
      y: right.p.y - (dy / 3)
    };
    left.continuous = true;
    right.continuous = true;
  };
  const firstIndex = indices[0];
  const lastIndex = indices[indices.length - 1];
  if (firstIndex > 0) setLinearSegment(knots[firstIndex - 1], knots[firstIndex]);
  for (let i = 0; i < indices.length - 1; i++) {
    setLinearSegment(knots[indices[i]], knots[indices[i + 1]]);
  }
  if (lastIndex < knots.length - 1) setLinearSegment(knots[lastIndex], knots[lastIndex + 1]);
  return knots;
}

function bottomFeatureBlendRamp01(value, blend = 1) {
  const shaped = smoothStep01(value);
  const exponent = clampNumber(blend, 0.1, 4, 1);
  if (Math.abs(exponent - 1) < 1e-9) return shaped;
  return Math.pow(shaped, exponent);
}

function bottomFeatureEnvelopeAt(feature, rawX) {
  const start = Number(feature?.start) || 0;
  const peak = Math.max(start, Number(feature?.peak) || start);
  const end = Math.max(peak, Number(feature?.end) || peak);
  const blend = Number(feature?.blend);
  const type = normalizeBottomFeatureType(feature?.type);
  if (rawX <= start || rawX >= end) return 0;
  if (rawX === peak) return 1;
  if (type === "channel") {
    const flatness = clampNumber(feature?.longitudinalFlat, 0, 1, 0);
    const minRamp = Math.max(0.25, (end - start) * 0.04);
    const leftSpan = Math.max(1e-9, peak - start);
    const rightSpan = Math.max(1e-9, end - peak);
    const leftRamp = Math.max(minRamp, leftSpan * (1 - (flatness * 0.92)));
    const rightRamp = Math.max(minRamp, rightSpan * (1 - (flatness * 0.92)));
    const leftFull = Math.min(peak, start + leftRamp);
    const rightFull = Math.max(peak, end - rightRamp);
    if (rawX < leftFull) return bottomFeatureBlendRamp01((rawX - start) / Math.max(1e-9, leftFull - start), blend);
    if (rawX > rightFull) return bottomFeatureBlendRamp01((end - rawX) / Math.max(1e-9, end - rightFull), blend);
    return 1;
  }
  if (rawX < peak) return bottomFeatureBlendRamp01((rawX - start) / Math.max(1e-9, peak - start), blend);
  return bottomFeatureBlendRamp01((end - rawX) / Math.max(1e-9, end - peak), blend);
}

function activeBottomFeaturesAt(board, rawX) {
  return normalizeBottomFeatures(board?.bottomFeatures)
    .filter(feature => feature.enabled !== false)
    .map(feature => ({ feature, envelope: bottomFeatureEnvelopeAt(feature, rawX) }))
    .filter(item => item.envelope > 1e-3);
}

function gaussian01(distance, radius, power = 2) {
  const d = Math.abs(distance) / Math.max(1e-9, radius);
  if (d >= 1) return 0;
  return Math.pow(1 - (d * d), Math.max(0.4, power));
}

function plateauGroove01(distance, halfWidth, flatRatio = 0.3, power = 1.4) {
  const width = Math.max(1e-9, Number(halfWidth) || 0);
  const absDistance = Math.abs(Number(distance) || 0);
  if (absDistance >= width) return 0;
  const flatWidth = clampNumber(width * flatRatio, 0, width * 0.92, width * 0.3);
  if (absDistance <= flatWidth) return 1;
  const t = clamp01((absDistance - flatWidth) / Math.max(1e-9, width - flatWidth));
  return Math.pow(1 - smoothStep01(t), clampNumber(power, 0.4, 4, 1.4));
}

function blendPositiveProfiles(...values) {
  const power = 4;
  const total = values.reduce((sum, value) => {
    const v = Math.max(0, Number(value) || 0);
    return sum + Math.pow(v, power);
  }, 0);
  return Math.pow(total, 1 / power);
}

function bottomFeatureAnchorInsetCm(feature) {
  const type = normalizeBottomFeatureType(feature?.type);
  if (type !== "single-concave" && type !== "double-concave" && type !== "vee" && type !== "spiral-vee" && type !== "hull" && type !== "displacement-hull") return BOTTOM_FEATURE_ANCHOR_INSET_STANDARD_CM;
  if (type === "vee" || type === "spiral-vee") {
    const railLock = clampNumber(feature?.railLockCm, 0, BOTTOM_FEATURE_RAIL_LOCK_CM_MAX, 0.75);
    return clampNumber(railLock, 0.35, 1.2, 0.75);
  }
  const width = clamp01(Number(feature?.width));
  return BOTTOM_FEATURE_ANCHOR_INSET_NARROW_CM
    - (width * (BOTTOM_FEATURE_ANCHOR_INSET_NARROW_CM - BOTTOM_FEATURE_ANCHOR_INSET_WIDE_CM));
}

function bottomFeatureReferenceHalfWidth(feature, board) {
  if (!feature || !board) return Math.max(0, Number(board?.width) || 0) * 0.5;
  const peak = clampNumber(Number(feature.peak) || 0, 0, Number(board.length) || 0, 0);
  return Math.max(0, boardCadWidthAtPos(board, peak) * 0.5);
}

function bottomFeatureReferenceDistanceX(feature, board, ratio, localHalfWidth = Infinity) {
  const referenceHalfWidth = Math.max(0, bottomFeatureReferenceHalfWidth(feature, board));
  const normalizedRatio = clampNumber(Number(ratio) || 0, 0, 1, 0);
  const absoluteX = referenceHalfWidth * normalizedRatio;
  const limit = Number.isFinite(localHalfWidth) ? Math.max(0, Number(localHalfWidth) || 0) : Infinity;
  return clampNumber(absoluteX, 0, limit, absoluteX);
}

function bottomFeatureWidthAnchorX(feature, halfWidth, board = null) {
  const type = normalizeBottomFeatureType(feature?.type);
  if (type === "single-concave" || type === "hull" || type === "displacement-hull") {
    return Math.max(0.05, bottomFeatureReferenceDistanceX(feature, board, feature?.width, halfWidth));
  }
  if (type === "double-concave") {
    const offsetRatio = clampNumber(feature?.offset, 0.15, 0.8, 0.42);
    const spreadRatio = clampNumber(
      offsetRatio + (clampNumber(feature?.width, 0.05, 1, 0.7) * 0.5),
      offsetRatio,
      1,
      Math.min(1, offsetRatio + 0.5)
    );
    return Math.max(0.15, bottomFeatureReferenceDistanceX(feature, board, spreadRatio, halfWidth));
  }
  return bottomFeatureRailAnchorX(feature, halfWidth, board);
}

function bottomFeatureRailAnchorX(feature, halfWidth, board = null) {
  const type = normalizeBottomFeatureType(feature?.type);
  if (type !== "single-concave" && type !== "double-concave" && type !== "vee" && type !== "spiral-vee" && type !== "hull" && type !== "displacement-hull") return halfWidth;
  const anchorInset = bottomFeatureAnchorInsetCm(feature);
  const localHalfWidth = Math.max(0, Number(halfWidth) || 0);
  return Math.max(0, localHalfWidth - Math.min(anchorInset, localHalfWidth));
}

function bottomFeatureRailInsetFade(feature, pointX, halfWidth, board = null) {
  const type = normalizeBottomFeatureType(feature?.type);
  if (type !== "double-concave") return 1;
  const anchorX = bottomFeatureRailAnchorX(feature, halfWidth, board);
  const absX = Math.abs(pointX);
  if (absX >= anchorX) return 0;
  const fade = (anchorX - absX) / Math.max(1e-9, BOTTOM_FEATURE_ANCHOR_TRANSITION_CM);
  return Math.pow(clamp01(fade), 1.8);
}

function bottomFeatureRailLockFade(pointX, halfWidth, lockCm = BOTTOM_FEATURE_RAIL_LOCK_CM) {
  const localHalfWidth = Math.max(0, Number(halfWidth) || 0);
  const absX = Math.abs(Number(pointX) || 0);
  const band = Math.max(0, Math.min(localHalfWidth, Number(lockCm) || 0));
  if (band <= 1e-9) return 1;
  const unlockedLimit = Math.max(0, localHalfWidth - band);
  return absX < unlockedLimit ? 1 : 0;
}

function bottomFeatureUsesRailBandLock(feature) {
  const type = normalizeBottomFeatureType(feature?.type);
  return type !== "hull" && type !== "displacement-hull";
}

function bottomFeatureChannelCenterRatios(feature) {
  const count = Math.max(1, Math.round(Number(feature?.count) || 1));
  const center = clamp01(Number(feature?.offset) || 0);
  const spacing = Math.max(0, Number(feature?.spacing) || 0);
  const mid = (count - 1) * 0.5;
  const ratios = [];
  for (let i = 0; i < count; i++) {
    ratios.push(clamp01(center + ((i - mid) * spacing)));
  }
  return ratios;
}

function bottomFeatureChannelOuterRatio(feature) {
  const centers = bottomFeatureChannelCenterRatios(feature);
  const width = Math.max(0, Number(feature?.width) || 0);
  const outerCenter = centers.length ? Math.max(...centers) : clamp01(Number(feature?.offset) || 0);
  return clamp01(outerCenter + (width * 0.5));
}

function anchoredSmoothDelta(absX, anchorX, centerDelta, anchorDelta = 0) {
  if (anchorX <= 1e-9) return anchorDelta;
  const t = clamp01(absX / anchorX);
  return anchorDelta + ((centerDelta - anchorDelta) * (1 - smoothStep01(t)));
}

function anchoredTransitionToRail(absX, anchorX, anchorDelta, halfWidth) {
  const transitionX = Math.min(halfWidth, anchorX + BOTTOM_FEATURE_ANCHOR_TRANSITION_CM);
  if (absX <= anchorX) return anchorDelta;
  if (absX >= transitionX) return 0;
  const t = clamp01((absX - anchorX) / Math.max(1e-9, transitionX - anchorX));
  return anchorDelta * (1 - smoothStep01(t));
}

function bottomFeatureHullConvexGain(feature) {
  const type = normalizeBottomFeatureType(feature?.type);
  if (type !== "hull" && type !== "displacement-hull") return 1;
  const power = clampNumber(feature?.power, 0.8, 4, type === "hull" ? 2.2 : 2.25);
  const powerT = clamp01((power - 0.8) / 3.2);
  return type === "hull"
    ? lerp(1.12, 1.42, powerT)
    : lerp(1.08, 1.3, powerT);
}

function bottomFeatureLateralProfile(feature, lateralRatio, pointX = 0, halfWidth = 1, board = null) {
  const type = normalizeBottomFeatureType(feature?.type);
  const u = clamp01(Math.abs(lateralRatio));
  if (type === "single-concave") {
    const absX = Math.abs(pointX);
    const grooveX = Math.max(0.05, bottomFeatureReferenceDistanceX(feature, board, feature?.width, halfWidth));
    if (absX >= grooveX) return 0;
    return anchoredSmoothDelta(absX, grooveX, feature.depth, 0);
  }
  if (type === "vee") {
    const anchorX = bottomFeatureRailAnchorX(feature, halfWidth, board);
    const absX = Math.abs(pointX);
    if (absX <= anchorX) return anchoredSmoothDelta(absX, anchorX, 0, feature.depth);
    return anchoredTransitionToRail(absX, anchorX, feature.depth, halfWidth);
  }
  if (type === "spiral-vee") {
    const anchorX = bottomFeatureRailAnchorX(feature, halfWidth, board);
    const absX = Math.abs(pointX);
    const onsetRatio = clampNumber(feature?.offset, 0, 0.45, 0.18);
    const onsetX = anchorX * onsetRatio;
    if (absX <= onsetX) return 0;
    if (absX <= anchorX) {
      const normalized = clamp01((absX - onsetX) / Math.max(1e-9, anchorX - onsetX));
      return feature.depth * bottomFeatureBlendRamp01(normalized, feature?.power || feature?.blend || 1.45);
    }
    return anchoredTransitionToRail(absX, anchorX, feature.depth, halfWidth);
  }
  if (type === "hull") {
    const absX = Math.abs(pointX);
    const bellyX = bottomFeatureWidthAnchorX(feature, halfWidth, board);
    if (absX >= bellyX) return 0;
    const gain = bottomFeatureHullConvexGain(feature);
    const normalized = clamp01(absX / Math.max(1e-9, bellyX));
    const profile = Math.max(0, 1 - (normalized * normalized));
    const exponent = lerp(1.08, 0.72, clamp01((clampNumber(feature?.power, 0.8, 4, 2.2) - 0.8) / 3.2));
    return -feature.depth * gain * Math.pow(profile, exponent);
  }
  if (type === "double-concave") {
    const center = feature.centerDepth * Math.pow(Math.max(0, 1 - Math.pow(u / Math.max(0.05, feature.width), 2)), Math.max(0.4, feature.power * 0.8));
    const lobe = feature.railDepth * gaussian01(u - feature.offset, Math.max(0.04, feature.width * 0.26), feature.power);
    return blendPositiveProfiles(center, lobe);
  }
  if (type === "channel") {
    let total = 0;
    const grooveHalfWidth = Math.max(0.012, feature.width * 0.5);
    const powerT = clamp01((clampNumber(feature.power, 0.4, 4, 1.4) - 0.4) / 3.6);
    const flatRatio = lerp(0.22, 0.42, powerT);
    const shoulderPower = lerp(1.55, 0.72, powerT);
    const channelOffsets = bottomFeatureChannelCenterRatios(feature);
    for (const channelOffset of channelOffsets) {
      total += -feature.railDepth * plateauGroove01(u - channelOffset, grooveHalfWidth, flatRatio, shoulderPower);
    }
    return total;
  }
  return 0;
}

function subdivideSplineCurves(knots) {
  const source = boardCadCloneKnots(knots || []);
  if (source.length < 2) return source;
  const curves = boardCadCurves(source);
  const result = [];
  curves.forEach((curve, index) => {
    const split = boardCadSplitCurveKnot(curve, 0.5);
    const start = cloneKnot(curve.start);
    start.next = { ...split.startNext };
    const middle = cloneKnot(split.knot);
    if (index === 0) result.push(start);
    else result[result.length - 1] = start;
    result.push(middle);
    if (index === curves.length - 1) {
      const end = cloneKnot(curve.end);
      end.prev = { ...split.endPrev };
      result.push(end);
    } else {
      const nextStart = cloneKnot(curve.end);
      nextStart.prev = { ...split.endPrev };
      result.push(nextStart);
    }
  });
  return result;
}

function densifyBottomFeatureLowerHalfKnots(knots) {
  let cloned = boardCadCloneKnots(knots || []);
  if (cloned.length >= 17) return cloned;
  let guard = 0;
  while (cloned.length < 17 && guard++ < 6) {
    const railIndex = findSplineMaxXKnotIndex(cloned);
    if (railIndex <= 0) break;
    const targets = [];
    for (let index = 0; index < railIndex; index++) {
      const leftX = Number(cloned[index]?.p?.x);
      const rightX = Number(cloned[index + 1]?.p?.x);
      if (!Number.isFinite(leftX) || !Number.isFinite(rightX)) continue;
      const midX = (leftX + rightX) * 0.5;
      if (midX > leftX + 0.05 && midX < rightX - 0.05) targets.push(midX);
    }
    if (!targets.length) break;
    let next = cloned;
    targets.forEach(targetX => {
      next = insertHalfSplineKnotAtX(next, targetX);
    });
    if (next.length <= cloned.length) break;
    cloned = next;
  }
  return cloned;
}

function bottomFeaturesNeedDenseKnots(features) {
  return (features || []).some(feature => {
    const type = normalizeBottomFeatureType(feature?.type);
    return type === "single-concave" || type === "double-concave" || type === "channel" || type === "spiral-vee";
  });
}

function bottomFeatureVerticalFade(feature, heightFromBottom, localAmplitude, thickness) {
  const type = normalizeBottomFeatureType(feature?.type);
  const amplitude = Math.abs(Number(localAmplitude) || 0);
  const thicknessLimit = Math.max(0.04, Math.min(0.28, thickness * 0.14));
  const amplitudeBand = amplitude * (type === "channel" ? 2.4 : 1.8);
  const band = clampNumber(amplitudeBand, 0.05, thicknessLimit, 0.12);
  return Math.pow(clamp01(1 - (heightFromBottom / Math.max(1e-9, band))), type === "channel" ? 2.4 : 2.9);
}

function lockBottomFeatureRailBand(knots, referenceKnots, lockCm = BOTTOM_FEATURE_RAIL_LOCK_CM) {
  const target = boardCadCloneKnots(knots || []);
  const reference = boardCadCloneKnots(referenceKnots || []);
  if (!target.length || !reference.length) return target;
  const targetRailIndex = findSplineMaxXKnotIndex(target);
  const referenceRailIndex = findSplineMaxXKnotIndex(reference);
  if (targetRailIndex <= 0 || referenceRailIndex <= 0) return target;
  const lowerTarget = target.slice(0, targetRailIndex + 1);
  const lowerReference = reference.slice(0, referenceRailIndex + 1);
  const upperReference = reference.slice(referenceRailIndex + 1);
  const halfWidth = Math.max(1e-9, boardCadSplineMaxX(lowerReference));
  const lockStartX = Math.max(0, halfWidth - Math.max(0, Number(lockCm) || 0));
  if (lockStartX <= 1e-9 || lockStartX >= halfWidth - 1e-9) return target;
  const unlockedSpline = trimLowerHalfSplineToX(lowerTarget, lockStartX);
  const lockedRailSpline = trimLowerHalfSplineFromX(lowerReference, lockStartX);
  const mergedLower = spliceTailSplineIntoBase(unlockedSpline, lockedRailSpline);
  const merged = mergedLower.concat(boardCadCloneKnots(upperReference));
  const joinIndex = Math.max(0, unlockedSpline.length - 1);
  if (merged[joinIndex]) {
    merged[joinIndex].prev = { ...merged[joinIndex].p };
    merged[joinIndex].continuous = false;
  }
  const prevIndex = joinIndex - 1;
  if (prevIndex >= 0 && merged[prevIndex]?.next) {
    merged[prevIndex].next = {
      x: Math.min(merged[prevIndex].next.x, merged[joinIndex].p.x),
      y: merged[prevIndex].next.y
    };
  }
  return merged;
}

function preserveBottomFeatureUpperHalf(knots, referenceKnots) {
  const target = boardCadCloneKnots(knots || []);
  const reference = boardCadCloneKnots(referenceKnots || []);
  if (!target.length || !reference.length) return target;
  const targetRailIndex = findSplineMaxXKnotIndex(target);
  const referenceRailIndex = findSplineMaxXKnotIndex(reference);
  if (targetRailIndex < 0 || referenceRailIndex < 0) return target;
  return target.slice(0, targetRailIndex + 1).concat(reference.slice(referenceRailIndex + 1));
}

function finalizeBottomFeatureSection(knots, referenceKnots, lockCm = BOTTOM_FEATURE_RAIL_LOCK_CM) {
  const protectedHalf = preserveBottomFeatureUpperHalf(knots, referenceKnots);
  return lockBottomFeatureRailBand(protectedHalf, referenceKnots, lockCm);
}

function applyBottomFeaturesToSectionKnots(knots, board, rawX) {
  const features = normalizeBottomFeatures(board?.bottomFeatures).filter(feature => feature.enabled !== false);
  const base = boardCadCloneKnots(knots || []);
  if (!base.length || !features.length) return base;
  const shapedBase = features.reduce((acc, feature) => {
    const start = Number(feature?.start) || 0;
    const end = Math.max(start, Number(feature?.end) || start);
    if (rawX < start - 1e-6 || rawX > end + 1e-6) return acc;
    const envelope = bottomFeatureEnvelopeAt(feature, rawX);
    if (envelope <= 1e-9) return insertBottomFeatureAnchorKnots(acc, board, feature);
    const type = normalizeBottomFeatureType(feature?.type);
    if (usesExplicitBottomFeatureControlPoints(type)) {
      return applyExplicitBottomFeatureControlPoints(acc, board, feature, envelope, rawX);
    }
    return insertBottomFeatureAnchorKnots(acc, board, feature);
  }, base);
  const residualFeatures = features.filter(feature => {
    const start = Number(feature?.start) || 0;
    const end = Math.max(start, Number(feature?.end) || start);
    if (rawX < start - 1e-6 || rawX > end + 1e-6) return false;
    if (bottomFeatureEnvelopeAt(feature, rawX) <= 1e-9) return false;
    return !usesExplicitBottomFeatureControlPoints(normalizeBottomFeatureType(feature?.type));
  });
  const activeFeatures = features.filter(feature => {
    const start = Number(feature?.start) || 0;
    const end = Math.max(start, Number(feature?.end) || start);
    if (rawX < start - 1e-6 || rawX > end + 1e-6) return false;
    return bottomFeatureEnvelopeAt(feature, rawX) > 1e-9;
  });
  const sectionUsesRailBandLock = activeFeatures.some(bottomFeatureUsesRailBandLock);
  const activeLockCm = features.reduce((maxLock, feature) => {
    const start = Number(feature?.start) || 0;
    const end = Math.max(start, Number(feature?.end) || start);
    if (rawX < start - 1e-6 || rawX > end + 1e-6) return maxLock;
    if (bottomFeatureEnvelopeAt(feature, rawX) <= 1e-9) return maxLock;
    if (!bottomFeatureUsesRailBandLock(feature)) return maxLock;
    return Math.max(maxLock, clampNumber(feature?.railLockCm, 0, BOTTOM_FEATURE_RAIL_LOCK_CM_MAX, BOTTOM_FEATURE_RAIL_LOCK_CM));
  }, 0);
  if (!residualFeatures.length) {
    return sectionUsesRailBandLock
      ? finalizeBottomFeatureSection(shapedBase, base, activeLockCm)
      : preserveBottomFeatureUpperHalf(shapedBase, base);
  }
  const cloned = bottomFeaturesNeedDenseKnots(residualFeatures)
    ? densifyBottomFeatureLowerHalfKnots(shapedBase)
    : boardCadCloneKnots(shapedBase);
  const railIndex = findSplineMaxXKnotIndex(cloned);
  const halfWidth = Math.max(1e-6, boardCadSplineMaxX(cloned));
  const bottomY = cloned[0]?.p?.y ?? 0;
  const thickness = Math.max(1e-6, boardCadCrossSectionCenterThickness(cloned));
  const pointDelta = point => {
    const heightFromBottom = point.y - bottomY;
    const lateralRatio = point.x / halfWidth;
    let delta = 0;
    for (const feature of residualFeatures) {
      const envelope = bottomFeatureEnvelopeAt(feature, rawX);
      if (envelope <= 1e-9) continue;
      const railInsetFade = bottomFeatureRailInsetFade(feature, point.x, halfWidth, board);
      if (railInsetFade <= 1e-9) continue;
      const railLockFade = bottomFeatureUsesRailBandLock(feature)
        ? bottomFeatureRailLockFade(point.x, halfWidth, feature.railLockCm)
        : 1;
      if (railLockFade <= 1e-9) continue;
      const localAmplitude = bottomFeatureLateralProfile(feature, lateralRatio, point.x, halfWidth, board) * envelope * railInsetFade * railLockFade;
      const lowerFade = bottomFeatureVerticalFade(feature, heightFromBottom, localAmplitude, thickness);
      if (lowerFade <= 1e-9) continue;
      delta += localAmplitude * lowerFade;
    }
    return delta;
  };
  cloned.forEach((knot, index) => {
    if (index > railIndex) return;
    const delta = pointDelta(knot.p);
    ["p", "prev", "next"].forEach(key => {
      if (!knot[key]) return;
      if (index === railIndex && key === "next") return;
      knot[key].y += delta;
    });
  });
  return sectionUsesRailBandLock
    ? finalizeBottomFeatureSection(cloned, base, activeLockCm)
    : preserveBottomFeatureUpperHalf(cloned, base);
}

function drawBottomFeatureDeltaOverlay(baseSpline, displaySpline, transform, board, rawX, rect = null) {
  const active = activeBottomFeaturesAt(board, rawX);
  if (!active.length) return;
  const baseFull = fullCrossSectionPoints(baseSpline);
  const displayFull = fullCrossSectionPoints(displaySpline);
  if (baseFull.length < 3 || displayFull.length < 3) return;

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.beginPath();
  baseFull.forEach((point, index) => {
    const x = transform.x(point.x);
    const y = transform.y(point.y);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  for (let i = displayFull.length - 1; i >= 0; i--) {
    const point = displayFull[i];
    ctx.lineTo(transform.x(point.x), transform.y(point.y));
  }
  ctx.closePath();
  ctx.fillStyle = "#5ac8fa";
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.setLineDash([4, 4]);
  drawPath(baseFull, transform, "#8e8e93", 0.9);
  ctx.setLineDash([]);
  if (rect) {
    const summary = active
      .map(item => `${bottomFeatureLabel(item.feature.type)} ${fmt(item.envelope)}`)
      .join(" / ");
    label(summary, rect.left + 16, rect.top + 60, "#5ac8fa");
  }
  ctx.restore();
}

function bottomFeatureDisplayColor(type) {
  const key = normalizeBottomFeatureType(type);
  if (key === "vee" || key === "spiral-vee") return "#ff9f0a";
  if (key === "hull" || key === "displacement-hull") return "#bf5af2";
  if (key === "channel") return "#64d2ff";
  return "#5ac8fa";
}

function bottomFeatureOutlineBandLayout(rect, transform = null) {
  const rectTop = Number.isFinite(rect?.top) ? rect.top : 0;
  const rectHeight = Number(rect?.height) || 0;
  const bandHeight = Math.max(12, Math.min(18, rectHeight * 0.06));
  const centerY = transform?.y ? transform.y(0) : rectTop + (rectHeight * 0.5);
  const bandTop = centerY - (bandHeight * 0.5);
  const bandBottom = centerY + (bandHeight * 0.5);
  const laneTop = bandTop + 2;
  const laneBottom = bandBottom - 2;
  return {
    bandHeight,
    bandTop,
    bandBottom,
    laneTop,
    laneBottom,
    laneMid: (laneTop + laneBottom) * 0.5,
    laneHeightPx: Math.max(6, laneBottom - laneTop)
  };
}

function orderedBottomFeatureOutlineFeatures(board, features) {
  const normalized = normalizeBottomFeatures(board?.bottomFeatures);
  return (features || [])
    .map((feature, originalIndex) => {
      const foundIndex = feature.previewOnly
        ? -1
        : normalized.findIndex(item => item.id === feature.id);
      const actualIndex = feature.previewOnly
        ? -1
        : (foundIndex >= 0 ? foundIndex : originalIndex);
      const centerRaw = (Number(feature.start) + Number(feature.end)) * 0.5;
      const centerDisplayX = boardCadDisplayXFromRawX(board, centerRaw);
      return {
        feature,
        originalIndex,
        actualIndex,
        centerRaw,
        centerDisplayX
      };
    })
    .sort((a, b) => {
      if (Math.abs(b.centerDisplayX - a.centerDisplayX) > 1e-6) return b.centerDisplayX - a.centerDisplayX;
      return a.originalIndex - b.originalIndex;
    })
    .map((item, trackIndex, items) => ({
      ...item,
      trackIndex,
      trackCount: items.length
    }));
}

function bottomFeatureOutlineTrackMetrics(layout, trackCount, trackIndex) {
  const count = Math.max(1, Number(trackCount) || 1);
  const index = clampNumber(Number(trackIndex) || 0, 0, count - 1, 0);
  const gap = count > 1 ? 1 : 0;
  const totalGap = gap * Math.max(0, count - 1);
  const trackHeight = Math.max(3, (layout.laneHeightPx - totalGap) / count);
  const top = layout.laneTop + (index * (trackHeight + gap));
  const bottom = Math.min(layout.laneBottom, top + trackHeight);
  return {
    top,
    bottom,
    mid: (top + bottom) * 0.5,
    height: Math.max(6, bottom - top)
  };
}

function drawOutlineBottomFeatureRanges(board, transform, rect) {
  const rectLeft = Number.isFinite(rect?.left) ? rect.left : 0;
  const rectRight = Number.isFinite(rect?.right) ? rect.right : rectLeft + (Number(rect?.width) || 0);
  const features = normalizeBottomFeatures(board?.bottomFeatures).filter(feature => feature.enabled !== false);
  const selectedIndex = bottomFeatureSelectionIndex();
  const outlineHalf = rawOutlineHalfPoints(board, getSegments());
  const orderedFeatures = orderedBottomFeatureOutlineFeatures(board, features);
  ctx.save();
  if (!features.length) {
    ctx.restore();
    return;
  }
  const boardStartX = transform.x(boardCadDisplayXFromRawX(board, 0));
  const boardEndX = transform.x(boardCadDisplayXFromRawX(board, Math.max(1, Number(board.length) || 1)));
  const centerScreenY = transform.y(0);
  label("TAIL", Math.min(boardStartX, boardEndX) + 4, centerScreenY + 18, "#9fdcff");
  ctx.textAlign = "right";
  label("NOSE", Math.max(boardStartX, boardEndX) - 4, centerScreenY + 18, "#9fdcff");
  ctx.textAlign = "left";
  orderedFeatures.forEach(item => {
    const { feature, actualIndex } = item;
    const selected = (actualIndex >= 0 && actualIndex === selectedIndex) || !!feature.previewOnly;
    const boardLength = Math.max(1, Number(board.length) || 1);
    const startRaw = clampNumber(feature.start, 0, boardLength, 0);
    const endRaw = clampNumber(feature.end, startRaw, boardLength, boardLength);
    const peakRaw = clampNumber(feature.peak, startRaw, endRaw, (startRaw + endRaw) * 0.5);
    const color = bottomFeatureDisplayColor(feature.type);
    const widthVisible = bottomFeatureTypeSpec(feature.type)?.visibleFields?.width === true;
    const depthField = bottomFeatureOutlineDepthField(feature.type);
    const [widthMin, widthMax] = bottomFeatureLimit(feature.type, "width", 0.05, 1, 0.01);
    const widthNorm = widthVisible
      ? clampNumber((feature.width - widthMin) / Math.max(1e-9, widthMax - widthMin), 0, 1, 1)
      : 1;
    const [depthMin, depthMax] = depthField
      ? bottomFeatureLimit(feature.type, depthField, 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01)
      : [0, 1];
    const depthNorm = depthField
      ? clampNumber((Number(feature[depthField]) - depthMin) / Math.max(1e-9, depthMax - depthMin), 0, 1, 0)
      : 0.35;
    const fillAlpha = lerp(selected ? 0.22 : 0.14, selected ? 0.58 : 0.42, depthNorm);
    const strokeAlpha = lerp(selected ? 0.7 : 0.55, 1, depthNorm);
    const samples = Math.max(8, Math.ceil((endRaw - startRaw) / Math.max(1, (Number(board.length) || 1) / 36)));
    const centerPoints = [];
    const lowerPoints = [];
    for (let i = 0; i <= samples; i++) {
      const rawX = lerp(startRaw, endRaw, i / samples);
      const displayX = boardCadDisplayXFromRawX(board, rawX);
      const halfWidth = Math.max(0, interpolatePolyline(outlineHalf, rawX));
      const lowerY = -halfWidth * widthNorm;
      centerPoints.push({ x: transform.x(displayX), y: transform.y(0) });
      lowerPoints.push({ x: transform.x(displayX), y: transform.y(lowerY) });
    }
    ctx.globalAlpha = fillAlpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    centerPoints.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    for (let i = lowerPoints.length - 1; i >= 0; i--) {
      ctx.lineTo(lowerPoints[i].x, lowerPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = strokeAlpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = selected ? 2.2 : 1.5;
    ctx.stroke();
    const startX = transform.x(boardCadDisplayXFromRawX(board, startRaw));
    const peakX = transform.x(boardCadDisplayXFromRawX(board, peakRaw));
    const endX = transform.x(boardCadDisplayXFromRawX(board, endRaw));
    const startHalf = Math.max(0, interpolatePolyline(outlineHalf, startRaw)) * widthNorm;
    const peakHalf = Math.max(0, interpolatePolyline(outlineHalf, peakRaw)) * widthNorm;
    const endHalf = Math.max(0, interpolatePolyline(outlineHalf, endRaw)) * widthNorm;
    ctx.setLineDash([4, 4]);
    line(startX, transform.y(0), startX, transform.y(-startHalf));
    line(endX, transform.y(0), endX, transform.y(-endHalf));
    ctx.setLineDash([]);
    ctx.globalAlpha = selected ? 1 : 0.9;
    ctx.lineWidth = selected ? 2 : 1.35;
    line(peakX, transform.y(0), peakX, transform.y(-peakHalf));
    if (selected) {
      const labelX = clampNumber((startX + endX) * 0.5, rectLeft + 72, rectRight - 72, (startX + endX) * 0.5);
      label(
        `${bottomFeatureLabel(feature.type)}  S${fmt(feature.start)} M${fmt(feature.peak)} E${fmt(feature.end)}`,
        labelX,
        transform.y(-peakHalf) + 14,
        "#dff4ff"
      );
    }
  });
  ctx.restore();
}

function bottomFeatureHandleKey(handle) {
  if (!handle) return "";
  return [
    handle.mode || "outline",
    Number(handle.featureIndex),
    handle.action || "",
    handle.field || "",
    handle.kind || ""
  ].join(":");
}

function bottomFeatureOutlineDepthField(type) {
  const visible = bottomFeatureTypeSpec(type)?.visibleFields || {};
  if (visible.depth === true) return "depth";
  if (visible.centerDepth === true) return "centerDepth";
  return "";
}

function bottomFeatureDepthPolarity(type, field = "depth") {
  const normalizedType = normalizeBottomFeatureType(type);
  const normalizedField = String(field || "depth");
  const isCenterField =
    normalizedField === "depth" ||
    normalizedField === "centerDepth" ||
    normalizedField === "center-depth";
  if (!isCenterField) return 1;
  if (
    normalizedType === "vee" ||
    normalizedType === "spiral-vee" ||
    normalizedType === "hull" ||
    normalizedType === "displacement-hull"
  ) {
    return -1;
  }
  return 1;
}

function setBottomFeatureHandles(board, transform, mode = "outline", rect = null) {
  state.bottomFeatureHandles = [];
  const outlineMode = state.view === "outline" || (state.view === "quad" && state.quadActivePane === "outline");
  const profileMode = state.view === "profile" || (state.view === "quad" && state.quadActivePane === "profile");
  if (mode === "outline" && !outlineMode) return;
  if (mode === "profile" && !profileMode) return;
  const rectLeft = rect ? (Number.isFinite(rect.left) ? rect.left : 0) : 0;
  const rectTop = rect ? (Number.isFinite(rect.top) ? rect.top : 0) : 0;
  const rectRight = rect
    ? (Number.isFinite(rect.right) ? rect.right : rectLeft + (Number.isFinite(rect.width) ? rect.width : 0))
    : 0;
  const rectBottom = rect
    ? (Number.isFinite(rect.bottom) ? rect.bottom : rectTop + (Number.isFinite(rect.height) ? rect.height : 0))
    : 0;
  const featureIndex = bottomFeatureSelectionIndex();
  const features = mode === "outline"
    ? normalizeBottomFeatures(board?.bottomFeatures).filter(feature => feature.enabled !== false)
    : [currentBottomFeature()].filter(Boolean);
  if (!board || !features.length) return;
  const outlineHalf = rawOutlineHalfPoints(board, getSegments());
  const profile = mode === "profile" ? tailAdjustedProfileGeometry(board) : null;
  const maxY = outlineHalf.reduce((best, point) => Math.max(best, Number(point?.y) || 0), 0);
  const offsetY = Math.max(0.8, maxY * 0.06);
  const outlineBand = rect ? bottomFeatureOutlineBandLayout(rect, transform) : null;
  const orderedOutlineFeatures = mode === "outline"
    ? orderedBottomFeatureOutlineFeatures(board, features)
    : [];
  const bandBottom = outlineBand?.bandBottom ?? null;
  const bandTop = outlineBand?.bandTop ?? null;
  const bandMidY = (bandTop !== null && bandBottom !== null && transform?.invY)
    ? transform.invY((bandTop + bandBottom) * 0.5)
    : null;
  const lineTopY = bandTop !== null && transform?.invY ? transform.invY(bandTop) : null;
  const lineBottomY = rect && transform?.invY ? transform.invY(rectBottom - 12) : null;
  (mode === "outline" ? orderedOutlineFeatures : features.map((feature, index) => ({
    feature,
    actualIndex: featureIndex,
    originalIndex: index,
    trackIndex: index,
    trackCount: features.length
  }))).forEach(item => {
    const feature = item.feature;
    const actualFeatureIndex = mode === "outline" ? item.actualIndex : item.actualIndex;
    if (actualFeatureIndex < 0 && !feature.previewOnly) return;
    const selectedFeature = !!feature.previewOnly || Number(item.originalIndex) === Number(featureIndex);
    const track = mode === "outline" && outlineBand
      ? bottomFeatureOutlineTrackMetrics(outlineBand, item.trackCount, item.trackIndex)
      : null;
    const laneScreenTop = mode === "outline" && bandTop !== null && bandBottom !== null
      ? track.top
      : null;
    const laneScreenBottom = mode === "outline" && bandTop !== null && bandBottom !== null
      ? track.bottom
      : null;
    const laneScreenMid = Number.isFinite(laneScreenTop) && Number.isFinite(laneScreenBottom)
      ? (laneScreenTop + laneScreenBottom) * 0.5
      : null;
    const bandLeftX = boardCadDisplayXFromRawX(board, feature.start);
    const bandRightX = boardCadDisplayXFromRawX(board, feature.end);
    if (mode === "outline" && bandMidY !== null) {
      const displayBandLeftX = bandLeftX;
      const displayBandRightX = bandRightX;
      const rangeScreenLeft = transform.x(displayBandLeftX);
      const rangeScreenRight = transform.x(displayBandRightX);
      const rangeScreenTop = Number.isFinite(laneScreenTop) ? laneScreenTop : bandTop + 2;
      const rangeScreenBottom = Number.isFinite(laneScreenBottom) ? laneScreenBottom : bandBottom - 2;
      const nextHandle = {
        kind: "range",
        action: "translate-range",
        field: "range",
        label: "MOVE",
        mode,
        x: (bandLeftX + bandRightX) * 0.5,
        rawX: (feature.start + feature.end) * 0.5,
        y: bandMidY,
        baseY: bandMidY,
        screenX: (rangeScreenLeft + rangeScreenRight) * 0.5,
        screenY: laneScreenMid,
        screenRect: {
          left: Math.min(rangeScreenLeft, rangeScreenRight),
          right: Math.max(rangeScreenLeft, rangeScreenRight),
          top: rangeScreenTop,
          bottom: rangeScreenBottom
        },
        visualIndex: item.trackIndex,
        hitBandLeftX: displayBandLeftX,
        hitBandRightX: displayBandRightX,
        hitLineTopY: lineTopY,
        hitLineBottomY: lineBottomY,
        featureIndex: actualFeatureIndex,
        listIndex: item.originalIndex,
        feature: { ...feature },
        transform
      };
      nextHandle.handleKey = bottomFeatureHandleKey(nextHandle);
      state.bottomFeatureHandles.push(nextHandle);
      if (!selectedFeature) return;
      [
        { kind: "start", field: "start", label: "S", x: feature.start },
        { kind: "peak", field: "peak", label: "M", x: feature.peak },
        { kind: "end", field: "end", label: "E", x: feature.end }
      ].forEach(handleSpec => {
        const displayX = boardCadDisplayXFromRawX(board, handleSpec.x);
        const baseY = Math.max(0, interpolatePolyline(outlineHalf, handleSpec.x));
        const outlineHandleScreenY = Number.isFinite(laneScreenTop) && Number.isFinite(laneScreenBottom)
          ? (handleSpec.kind === "start" || handleSpec.kind === "end"
            ? laneScreenBottom - 12
            : laneScreenTop + 12)
          : null;
        const screenX = transform.x(displayX);
        const screenY = outlineHandleScreenY;
        const nextEditHandle = {
          kind: handleSpec.kind,
          action: "position",
          field: handleSpec.field,
          label: handleSpec.label,
          mode,
          x: displayX,
          rawX: handleSpec.x,
          y: bandMidY,
          baseY,
          screenX,
          screenY,
          screenBaseY: lineBottomY !== null ? transform.y(lineBottomY) : null,
          screenRect: Number.isFinite(laneScreenTop) && Number.isFinite(laneScreenBottom)
            ? {
              left: screenX - 16,
              right: screenX + 16,
              top: screenY - 14,
              bottom: screenY + 14
            }
            : null,
          visualIndex: item.trackIndex,
          hitBandLeftX: bandLeftX,
          hitBandRightX: bandRightX,
          hitLineTopY: lineTopY,
          hitLineBottomY: lineBottomY,
          featureIndex: actualFeatureIndex,
          listIndex: item.originalIndex,
          feature: { ...feature },
          transform
        };
        nextEditHandle.handleKey = bottomFeatureHandleKey(nextEditHandle);
        state.bottomFeatureHandles.push(nextEditHandle);
      });

      const widthVisible = bottomFeatureTypeSpec(feature.type)?.visibleFields?.width === true;
      if (widthVisible) {
        const [widthMin, widthMax] = bottomFeatureLimit(feature.type, "width", 0.05, 1, 0.01);
        const widthNorm = clampNumber(
          (feature.width - widthMin) / Math.max(1e-9, widthMax - widthMin),
          0,
          1,
          0
        );
        const widthScreenX = rect ? Math.max(rangeScreenRight + 12, rectRight - 74) : (rangeScreenRight + 12);
        const widthTrackTop = rangeScreenTop + 8;
        const widthTrackBottom = rangeScreenBottom - 8;
        const widthScreenY = widthTrackBottom - ((widthTrackBottom - widthTrackTop) * widthNorm);
        const widthDisplayX = transform.invX(widthScreenX);
        const widthHandle = {
          kind: "width",
          action: "set-width",
          field: "width",
          label: "W",
          mode,
          x: widthDisplayX,
          rawX: widthDisplayX,
          y: transform.invY(widthScreenY),
          baseY: transform.invY(widthScreenY),
          screenX: widthScreenX,
          screenY: widthScreenY,
          screenBaseY: widthScreenY,
          screenRect: {
            left: widthScreenX - 18,
            right: widthScreenX + 18,
            top: widthScreenY - 14,
            bottom: widthScreenY + 14
          },
          visualIndex: item.trackIndex,
          hitBandLeftX: bandLeftX,
          hitBandRightX: bandRightX,
          hitLineTopY: null,
          hitLineBottomY: null,
          featureIndex: actualFeatureIndex,
          listIndex: item.originalIndex,
          feature: { ...feature },
          transform,
          minValue: widthMin,
          maxValue: widthMax,
          dragRangeTop: widthTrackTop,
          dragRangeBottom: widthTrackBottom
        };
        widthHandle.handleKey = bottomFeatureHandleKey(widthHandle);
        state.bottomFeatureHandles.push(widthHandle);
      }

      const depthField = bottomFeatureOutlineDepthField(feature.type);
      if (depthField && selectedFeature) {
        const [depthMin, depthMax] = bottomFeatureLimit(feature.type, depthField, 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01);
        const depthValue = clampNumber(feature[depthField], depthMin, depthMax, 0);
        const depthNorm = clampNumber(
          (depthValue - depthMin) / Math.max(1e-9, depthMax - depthMin),
          0,
          1,
          0
        );
        const depthScreenX = rect
          ? Math.max(rangeScreenRight + 48, rectRight - 36)
          : (rangeScreenRight + 48);
        const depthTrackTop = rangeScreenTop + 8;
        const depthTrackBottom = rangeScreenTop + Math.max(26, (rangeScreenBottom - rangeScreenTop) * 0.55);
        const depthScreenY = depthTrackBottom - ((depthTrackBottom - depthTrackTop) * depthNorm);
        const depthHandle = {
          kind: "depth",
          action: "set-depth",
          field: depthField,
          label: "D",
          mode,
          x: transform.invX(depthScreenX),
          rawX: transform.invX(depthScreenX),
          y: transform.invY(depthScreenY),
          baseY: transform.invY(depthScreenY),
          screenX: depthScreenX,
          screenY: depthScreenY,
          screenBaseY: depthScreenY,
          screenRect: {
            left: depthScreenX - 18,
            right: depthScreenX + 18,
            top: depthScreenY - 14,
            bottom: depthScreenY + 14
          },
          visualIndex: item.trackIndex,
          hitBandLeftX: bandLeftX,
          hitBandRightX: bandRightX,
          hitLineTopY: null,
          hitLineBottomY: null,
          featureIndex: actualFeatureIndex,
          listIndex: item.originalIndex,
          feature: { ...feature },
          transform,
          minValue: depthMin,
          maxValue: depthMax,
          dragRangeTop: depthTrackTop,
          dragRangeBottom: depthTrackBottom
        };
        depthHandle.handleKey = bottomFeatureHandleKey(depthHandle);
        state.bottomFeatureHandles.push(depthHandle);
      }
      return;
    }
    if (!selectedFeature) return;
    [
      { kind: "start", field: "start", label: "S", x: feature.start },
      { kind: "peak", field: "peak", label: "M", x: feature.peak },
      { kind: "end", field: "end", label: "E", x: feature.end }
    ].forEach(handleSpec => {
      const displayX = boardCadDisplayXFromRawX(board, handleSpec.x);
      const baseY = profileYAt(profile?.bottom || [], displayX);
      const handleY = baseY - Math.max(0.7, (board.thickness || 1) * 0.18);
      const nextHandle = {
        kind: handleSpec.kind,
        action: "position",
        field: handleSpec.field,
        label: handleSpec.label,
        mode,
        x: displayX,
        rawX: handleSpec.x,
        y: handleY,
        baseY,
        screenX: null,
        screenY: null,
        screenBaseY: null,
        screenRect: null,
        visualIndex: item.trackIndex,
        hitBandLeftX: null,
        hitBandRightX: null,
        hitLineTopY: null,
        hitLineBottomY: null,
        featureIndex: actualFeatureIndex,
        listIndex: item.originalIndex,
        feature: { ...feature },
        transform
      };
      nextHandle.handleKey = bottomFeatureHandleKey(nextHandle);
      state.bottomFeatureHandles.push(nextHandle);
    });
  });
}

function sameBottomFeatureHandle(a, b) {
  return !!a && !!b && bottomFeatureHandleKey(a) === bottomFeatureHandleKey(b);
}

function bottomFeaturePositionHandleLabel(kind) {
  if (kind === "start") return "S";
  if (kind === "peak") return "M";
  if (kind === "end") return "E";
  return "";
}

function drawBottomFeatureHandles(board, transform) {
  if (!state.bottomFeatureHandles.length) {
    bottomFeatureOverlaySignature = "";
    scheduleBottomFeatureDomOverlaySync();
    return;
  }
  const hasCanvasHandles = state.bottomFeatureHandles.some(handle => handle.mode !== "outline");
  if (!hasCanvasHandles) {
    scheduleBottomFeatureDomOverlaySync();
    return;
  }
  const drawHandleTag = (text, x, y, selected) => {
    ctx.font = "11px sans-serif";
    const width = Math.max(18, ctx.measureText(text).width + 10);
    const height = 16;
    const left = x - (width / 2);
    const top = y - (height / 2);
    ctx.fillStyle = selected ? "#ff6b6b" : "#0b0f17";
    ctx.strokeStyle = selected ? "#ff453a" : "#9fdcff";
    ctx.lineWidth = selected ? 2 : 1.4;
    ctx.beginPath();
    ctx.roundRect(left, top, width, height, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = selected ? "#1c1c1e" : "#dff4ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y + 0.5);
  };
  ctx.save();
  state.bottomFeatureHandles.forEach(handle => {
    if (handle.mode === "outline") return;
    const sx = handle.mode === "outline" && Number.isFinite(handle.screenX) ? handle.screenX : handle.transform.x(handle.x);
    const sy = handle.mode === "outline" && Number.isFinite(handle.screenY) ? handle.screenY : handle.transform.y(handle.y);
    const baseSY = handle.mode === "outline" && Number.isFinite(handle.screenBaseY) ? handle.screenBaseY : handle.transform.y(handle.baseY);
    const selected = sameBottomFeatureHandle(handle, state.bottomFeatureSelection);
    if (handle.kind === "range") {
      const left = handle.screenRect ? handle.screenRect.left : handle.transform.x(handle.hitBandLeftX);
      const right = handle.screenRect ? handle.screenRect.right : handle.transform.x(handle.hitBandRightX);
      const top = handle.screenRect ? handle.screenRect.top : handle.transform.y(handle.hitLineTopY);
      const bottom = handle.screenRect ? handle.screenRect.bottom : handle.transform.y(handle.hitLineBottomY);
      ctx.strokeStyle = selected ? "#ff6b6b" : "#9fdcff";
      ctx.lineWidth = selected ? 2.4 : 1.6;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(Math.min(left, right) + 1, Math.min(top, bottom) + 1, Math.max(8, Math.abs(right - left) - 2), Math.max(8, Math.abs(bottom - top) - 2));
      ctx.setLineDash([]);
      drawHandleTag(handle.label || "MOVE", sx, sy, selected);
      return;
    }
    ctx.strokeStyle = selected ? "#ff6b6b" : "#9fdcff";
    ctx.fillStyle = selected ? "#ff6b6b" : "#9fdcff";
    ctx.lineWidth = selected ? 2.2 : 1.4;
    ctx.setLineDash([3, 4]);
    line(sx, sy, sx, baseSY);
    ctx.setLineDash([]);
    drawHandleTag(handle.label || bottomFeaturePositionHandleLabel(handle.kind), sx, sy, selected);
  });
  ctx.restore();
  scheduleBottomFeatureDomOverlaySync();
}

function setBottomFeatureSectionHandles(board, transform, section) {
  state.bottomFeatureSectionHandles = [];
  if (state.tool !== "edit") return;
  const sectionMode = state.view === "sections" || (state.view === "quad" && state.quadActivePane === "cross-section");
  if (!sectionMode) return;
  const featureIndex = bottomFeatureSelectionIndex();
  const feature = currentBottomFeature();
  if (!board || !section?.spline?.length || featureIndex < 0 || !feature) return;
  const envelope = bottomFeatureEnvelopeAt(feature, section.position);
  if (envelope <= 1e-4) return;
  const type = normalizeBottomFeatureType(feature.type);
  const displaySpline = applyBottomFeaturesToSectionKnots(section.spline, board, section.position);
  const halfWidth = Math.max(1e-6, boardCadSplineMaxX(displaySpline));
  const referenceHalfWidth = Math.max(1e-6, bottomFeatureReferenceHalfWidth(feature, board));
  const makeHandle = (kind, x, y, baseY, extra = {}) => {
    const nextHandle = {
      kind,
      mode: "section",
      x,
      y,
      baseY,
      featureIndex,
      feature: { ...feature },
      featureType: type,
      envelope,
      halfWidth,
      sectionPosition: section.position,
      sectionSpline: section.spline,
      transform,
      ...extra
    };
    nextHandle.field = kind;
    nextHandle.action = "section-parameter";
    nextHandle.label = kind === "center-depth" ? "D" : kind === "rail-depth" ? "R" : "W";
    nextHandle.handleKey = bottomFeatureHandleKey(nextHandle);
    state.bottomFeatureSectionHandles.push(nextHandle);
  };
  if (type === "single-concave" || type === "vee" || type === "spiral-vee" || type === "hull" || type === "displacement-hull" || type === "double-concave") {
    makeHandle(
      "center-depth",
      0,
      boardCadCrossSectionBottomAt(displaySpline, 0),
      boardCadCrossSectionBottomAt(section.spline, 0)
    );
  }
  if (type === "single-concave" || type === "vee" || type === "spiral-vee" || type === "hull" || type === "displacement-hull") {
    const x = type === "single-concave" || type === "hull" || type === "displacement-hull"
      ? bottomFeatureReferenceDistanceX(feature, board, feature.width, halfWidth)
      : (halfWidth * clampNumber(feature.width, 0.05, 1, 1));
    makeHandle(
      "width",
      x,
      boardCadCrossSectionBottomAt(displaySpline, x),
      boardCadCrossSectionBottomAt(section.spline, x),
      { referenceHalfWidth }
    );
  }
  if (type === "double-concave" || type === "channel") {
    const offsetRatio = clampNumber(feature.offset, 0, 1, 0.4);
    const railX = type === "double-concave"
      ? bottomFeatureReferenceDistanceX(feature, board, offsetRatio, halfWidth)
      : (halfWidth * offsetRatio);
    makeHandle(
      "rail-depth",
      railX,
      boardCadCrossSectionBottomAt(displaySpline, railX),
      boardCadCrossSectionBottomAt(section.spline, railX),
      { referenceHalfWidth }
    );
    const spreadRatio = type === "double-concave"
      ? clampNumber(offsetRatio + (feature.width * 0.5), offsetRatio, 1, Math.min(1, offsetRatio + 0.5))
      : bottomFeatureChannelOuterRatio(feature);
    const spreadX = type === "double-concave"
      ? bottomFeatureReferenceDistanceX(feature, board, spreadRatio, halfWidth)
      : (halfWidth * spreadRatio);
    makeHandle(
      "spread",
      spreadX,
      boardCadCrossSectionBottomAt(displaySpline, spreadX),
      boardCadCrossSectionBottomAt(section.spline, spreadX),
      { anchorRatio: offsetRatio, referenceHalfWidth }
    );
  }
}

function sameBottomFeatureSectionHandle(a, b) {
  return !!a && !!b && a.mode === "section" && b.mode === "section" && bottomFeatureHandleKey(a) === bottomFeatureHandleKey(b);
}

function normalizedBottomFeatureSelection(handle, featureOverride = null) {
  if (!handle) return null;
  return {
    kind: handle.kind,
    action: handle.action || "",
    field: handle.field || "",
    label: handle.label || "",
    handleKey: handle.handleKey || bottomFeatureHandleKey(handle),
    mode: handle.mode || "outline",
    featureIndex: Number(handle.featureIndex),
    listIndex: Number(handle.listIndex),
    feature: featureOverride ? { ...featureOverride } : (handle.feature ? { ...handle.feature } : null)
  };
}

function drawBottomFeatureSectionHandles() {
  if (state.tool !== "edit" || !state.bottomFeatureSectionHandles.length) {
    scheduleBottomFeatureDomOverlaySync();
    return;
  }
  ctx.save();
  state.bottomFeatureSectionHandles.forEach(handle => {
    const sx = handle.transform.x(handle.x);
    const sy = handle.transform.y(handle.y);
    const baseSY = handle.transform.y(handle.baseY);
    const selected = sameBottomFeatureSectionHandle(handle, state.bottomFeatureSelection);
    const color = handle.kind === "center-depth" ? "#5ac8fa" : handle.kind === "rail-depth" ? "#64d2ff" : "#ff9f0a";
    ctx.strokeStyle = selected ? "#ff6b6b" : color;
    ctx.fillStyle = selected ? "#ff6b6b" : color;
    ctx.lineWidth = selected ? 2 : 1.2;
    ctx.setLineDash([3, 4]);
    line(sx, sy, sx, baseSY);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const tag = handle.label || (handle.kind === "center-depth" ? "D" : handle.kind === "rail-depth" ? "R" : "W");
    label(tag, sx + 8, sy - 8, selected ? "#ff6b6b" : color);
  });
  ctx.restore();
  scheduleBottomFeatureDomOverlaySync();
}

function moveBottomFeatureDrag(handle, originalFeature, nextDisplayX, nextScreenY = null) {
  if (!state.board || !handle || !originalFeature) return;
  const features = normalizeBottomFeatures(state.board.bottomFeatures);
  const index = Number(handle.featureIndex);
  const boardLength = Math.max(1, Number(state.board.length) || 1);
  const epsilon = 0.01;
  const nextRawX = clampNumber(boardCadRawXFromDisplayX(state.board, nextDisplayX), 0, boardLength, 0);
  const feature = { ...originalFeature };
  const action = handle.action || (
    handle.kind === "range"
      ? "translate-range"
      : ["start", "peak", "end"].includes(handle.kind)
        ? "position"
        : ""
    );
  const field = handle.field || handle.kind || "";
  if (action === "position" && field === "start") {
    feature.start = clampNumber(nextRawX, 0, Math.max(0, originalFeature.peak - epsilon), originalFeature.start);
  } else if (action === "position" && field === "peak") {
    feature.peak = clampNumber(nextRawX, Math.min(originalFeature.start + epsilon, boardLength), Math.max(originalFeature.end - epsilon, 0), originalFeature.peak);
  } else if (action === "position" && field === "end") {
    feature.end = clampNumber(nextRawX, Math.min(boardLength, originalFeature.peak + epsilon), boardLength, originalFeature.end);
  } else if (action === "translate-range") {
    const deltaRaw = nextRawX - handle.rawX;
    const spanStartToPeak = originalFeature.peak - originalFeature.start;
    const spanPeakToEnd = originalFeature.end - originalFeature.peak;
    let nextStart = originalFeature.start + deltaRaw;
    let nextPeak = originalFeature.peak + deltaRaw;
    let nextEnd = originalFeature.end + deltaRaw;
    if (nextStart < 0) {
      const shift = -nextStart;
      nextStart += shift;
      nextPeak += shift;
      nextEnd += shift;
    }
    if (nextEnd > boardLength) {
      const shift = nextEnd - boardLength;
      nextStart -= shift;
      nextPeak -= shift;
      nextEnd -= shift;
    }
    feature.start = clampNumber(nextStart, 0, Math.max(0, boardLength - (spanStartToPeak + spanPeakToEnd)), originalFeature.start);
    feature.peak = clampNumber(feature.start + spanStartToPeak, feature.start + epsilon, boardLength - spanPeakToEnd, originalFeature.peak);
    feature.end = clampNumber(feature.peak + spanPeakToEnd, feature.peak + epsilon, boardLength, originalFeature.end);
  } else if (action === "set-width") {
    const ratio = Number.isFinite(handle.dragRangeTop) && Number.isFinite(handle.dragRangeBottom) && Number.isFinite(nextScreenY)
      ? clampNumber(
        (handle.dragRangeBottom - Number(nextScreenY)) / Math.max(1e-9, handle.dragRangeBottom - handle.dragRangeTop),
        0,
        1,
        0
      )
      : clampNumber(
        (nextDisplayX - Math.min(handle.hitBandLeftX, handle.hitBandRightX)) /
          Math.max(1e-9, Math.max(handle.hitBandLeftX, handle.hitBandRightX) - Math.min(handle.hitBandLeftX, handle.hitBandRightX)),
        0,
        1,
        0
      );
    const minValue = Number.isFinite(handle.minValue) ? handle.minValue : bottomFeatureLimit(feature.type, "width", 0.05, 1, 0.01)[0];
    const maxValue = Number.isFinite(handle.maxValue) ? handle.maxValue : bottomFeatureLimit(feature.type, "width", 0.05, 1, 0.01)[1];
    feature.width = clampNumber(minValue + ((maxValue - minValue) * ratio), minValue, maxValue, originalFeature.width);
  } else if (action === "set-depth") {
    const dragTop = Number.isFinite(handle.dragRangeTop) ? handle.dragRangeTop : (Number.isFinite(handle.screenRect?.top) ? handle.screenRect.top : 0);
    const dragBottom = Number.isFinite(handle.dragRangeBottom) ? handle.dragRangeBottom : (Number.isFinite(handle.screenRect?.bottom) ? handle.screenRect.bottom : dragTop + 1);
    const ratio = clampNumber(
      (Number(nextScreenY) - dragTop) / Math.max(1e-9, dragBottom - dragTop),
      0,
      1,
      0
    );
    const polarity = bottomFeatureDepthPolarity(feature.type, field);
    const depthRatio = polarity < 0 ? (1 - ratio) : ratio;
    const minValue = Number.isFinite(handle.minValue) ? handle.minValue : bottomFeatureLimit(feature.type, field, 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01)[0];
    const maxValue = Number.isFinite(handle.maxValue) ? handle.maxValue : bottomFeatureLimit(feature.type, field, 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01)[1];
    feature[field] = clampNumber(minValue + ((maxValue - minValue) * depthRatio), minValue, maxValue, originalFeature[field]);
  }
  if (!Number.isInteger(index) || index < 0 || !features[index]) {
    syncBottomFeatureFormFields(feature);
    updateBottomFeatureSummary(feature, -1);
    return;
  }
  markBottomPresetCustom(state.board);
  features[index] = normalizeBottomFeature(feature, index);
  state.board.bottomFeatures = normalizeBottomFeatures(features);
  markGeometryDirty();
}

function moveBottomFeatureSectionDrag(handle, originalFeature, currentPoint) {
  if (!state.board || !handle || !originalFeature || !currentPoint) return;
  const features = normalizeBottomFeatures(state.board.bottomFeatures);
  const index = Number(handle.featureIndex);
  if (!Number.isInteger(index) || !features[index]) return;
  const feature = { ...originalFeature };
  markBottomPresetCustom(state.board);
  const sectionSpline = handle.sectionSpline;
  const type = normalizeBottomFeatureType(handle.featureType || originalFeature.type);
  const envelope = Math.max(1e-6, Number(handle.envelope) || 1);
  const halfWidth = Math.max(1e-6, Number(handle.halfWidth) || 1);
  const referenceHalfWidth = Math.max(1e-6, Number(handle.referenceHalfWidth) || bottomFeatureReferenceHalfWidth(originalFeature, state.board));
  const limitDepth = (field, fallback) => bottomFeatureLimit(type, field, 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01);
  const xRatio = clampNumber(Math.abs(currentPoint.x) / halfWidth, 0, 1, 0);
  if (handle.kind === "center-depth") {
    const baseY = boardCadCrossSectionBottomAt(sectionSpline, 0);
    if (type === "double-concave") {
      const delta = baseY - currentPoint.y;
      const [min, max] = limitDepth("centerDepth", originalFeature.centerDepth);
      feature.centerDepth = clampNumber(delta / envelope, min, max, originalFeature.centerDepth);
    } else {
      const polarity = bottomFeatureDepthPolarity(type, "depth");
      const delta = polarity < 0 ? (currentPoint.y - baseY) : (baseY - currentPoint.y);
      const [min, max] = limitDepth("depth", originalFeature.depth);
      feature.depth = clampNumber(delta / envelope, min, max, originalFeature.depth);
    }
  } else if (handle.kind === "width") {
    const [min, max] = bottomFeatureLimit(type, "width", 0.05, 1, 0.01);
    const nextRatio = type === "single-concave"
      ? clampNumber(Math.abs(currentPoint.x) / referenceHalfWidth, 0, 1, originalFeature.width)
      : xRatio;
    feature.width = clampNumber(nextRatio, min, max, originalFeature.width);
  } else if (handle.kind === "rail-depth") {
    const [offsetMin, offsetMax] = bottomFeatureLimit(type, "offset", 0, 1, 0.01);
    const nextOffsetRatio = type === "double-concave"
      ? clampNumber(Math.abs(currentPoint.x) / referenceHalfWidth, 0, 1, originalFeature.offset)
      : xRatio;
    feature.offset = clampNumber(nextOffsetRatio, offsetMin, offsetMax, originalFeature.offset);
    const baseY = boardCadCrossSectionBottomAt(sectionSpline, Math.abs(currentPoint.x));
    const delta = baseY - currentPoint.y;
    const [min, max] = bottomFeatureLimit(type, "railDepth", 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01);
    feature.railDepth = clampNumber(delta / envelope, min, max, originalFeature.railDepth);
  } else if (handle.kind === "spread") {
    if (type === "channel") {
      const count = Math.max(1, Math.round(Number(originalFeature.count) || 1));
      const outerRatio = xRatio;
      const [spacingMin, spacingMax] = bottomFeatureLimit(type, "spacing", 0, 0.5, 0.01);
      if (count <= 1) {
        const [widthMin, widthMax] = bottomFeatureLimit(type, "width", 0.05, 1, 0.01);
        const nextWidth = Math.max(0, (outerRatio - clamp01(Number(originalFeature.offset) || 0)) * 2);
        feature.width = clampNumber(nextWidth, widthMin, widthMax, originalFeature.width);
      } else {
        const centerRatio = clamp01(Number(originalFeature.offset) || 0);
        const halfWidthRatio = Math.max(0, (Number(originalFeature.width) || 0) * 0.5);
        const usableOuter = Math.max(centerRatio + halfWidthRatio, outerRatio);
        const spacing = ((usableOuter - centerRatio - halfWidthRatio) * 2) / Math.max(1, count - 1);
        feature.spacing = clampNumber(spacing, spacingMin, spacingMax, originalFeature.spacing);
      }
    } else {
      const [min, max] = bottomFeatureLimit(type, "width", 0.05, 1, 0.01);
      const anchor = clampNumber(Number(handle.anchorRatio), 0, 1, 0);
      const nextRatio = type === "double-concave"
        ? clampNumber(Math.abs(currentPoint.x) / referenceHalfWidth, 0, 1, originalFeature.width)
        : xRatio;
      const spread = Math.max(0, nextRatio - anchor) * 2;
      feature.width = clampNumber(spread, min, max, originalFeature.width);
    }
  }
  features[index] = normalizeBottomFeature(feature, index);
  state.board.bottomFeatures = normalizeBottomFeatures(features);
  markGeometryDirty();
}

function updateBottomFeatureDragUI(selectedIndex = bottomFeatureSelectionIndex(), options = {}) {
  const includeInfo = options.includeInfo === true;
  const includeSectionInfo = options.includeSectionInfo === true;
  const includeEditInfo = options.includeEditInfo !== false;
  const liveDrag = options.liveDrag === true;
  const features = normalizeBottomFeatures(state.board?.bottomFeatures);
  const index = Number.isInteger(selectedIndex) ? selectedIndex : bottomFeatureSelectionIndex();
  const feature = (index >= 0 && index < features.length) ? normalizeBottomFeature(features[index], index) : null;
  if (!liveDrag) syncBottomPresetPanel();
  if (els.bottomFeatureIndex) {
    els.bottomFeatureIndex.value = String(feature ? index : (features.length ? 0 : -1));
  }
  if (feature) {
    if (state.bottomFeatureSelection && Number(state.bottomFeatureSelection.featureIndex) === index) {
      state.bottomFeatureSelection = normalizedBottomFeatureSelection(state.bottomFeatureSelection, feature);
    }
    syncBottomFeatureFormFields(feature);
    if (!liveDrag) {
      syncBottomFeatureListSelection(index, feature);
      updateBottomFeatureSummary(feature, index);
    }
  } else {
    if (state.bottomFeatureSelection) state.bottomFeatureSelection = null;
    if (!liveDrag) {
      syncBottomFeatureListSelection(-1, null);
      updateBottomFeatureSummary(null);
    }
  }
  if (!liveDrag) updateBottomPanelFields();
  if (includeInfo) updateInfo();
  if (includeSectionInfo) updateSectionInfo();
  if (includeEditInfo) updateEditInfo();
}

const WING_PRESETS = {
  stinger: { distanceRatioFromTail: 1 / 3, width: 2.5, shape: "bump", blendLength: 5.2, shoulder: 0.16, transition: 0.8 },
  wing: { distance: 30, width: 1.45, shape: "bump", blendLength: 6.4, shoulder: 0.26, transition: 1.0 },
  "wing-pin": { distance: 23, width: 1.15, shape: "bump", blendLength: 5.0, shoulder: 0.18, transition: 0.88 }
};

function tailModeUsesDepth(mode) {
  const key = normalizeTailModeKey(mode);
  return key === "half-moon" || key === "swallow" || key === "fish" || key === "split" || key === "star" || key === "bat";
}

function normalizeWingPresetKey(value) {
  const key = String(value || "").trim().toLowerCase();
  if (!key || key === "none") return "";
  if (key === "wingpin" || key === "wing-pin-tail" || key === "wingpintail" || key === "wing pin tail") return "wing-pin";
  return key === "custom" || WING_PRESETS[key] ? key : "";
}

function normalizeWingShapeKey(value) {
  const key = String(value || "").trim().toLowerCase();
  if (key === "stepno") return "step";
  return key === "bump" || key === "step" ? key : "";
}

function wingMaxInsetAt(baseHalfPoints, distance) {
  const breakY = Math.max(0, interpolatePolyline(baseHalfPoints || [], distance));
  return Math.max(0.1, breakY * 0.96);
}

function wingPresetForBoard(presetKey, board, baseHalfPoints = null) {
  const key = normalizeWingPresetKey(presetKey);
  const preset = WING_PRESETS[key];
  if (!preset) return null;
  const boardLength = Math.max(1, Number(board?.length) || (board?.outline?.length ? boardCadLength(board) : 0));
  const rawPresetDistance = Number.isFinite(preset.distanceRatioFromTail)
    ? boardLength * preset.distanceRatioFromTail
    : Number.isFinite(preset.distanceRatio)
      ? boardLength * preset.distanceRatio
      : preset.distance;
  const distance = clampNumber(rawPresetDistance, 2, Math.max(2, boardLength - 1), rawPresetDistance);
  const halfPoints = baseHalfPoints || rawOutlineHalfPoints(board);
  const maxInset = wingMaxInsetAt(halfPoints, distance);
  return {
    ...preset,
    distance,
    width: clampNumber(preset.width, 0.1, maxInset, Math.min(preset.width, maxInset))
  };
}

function normalizeLegacyWingPresetState(board) {
  if (!board) return;
  const presetKey = normalizeWingPresetKey(board.wingPreset);
  if (presetKey !== "stinger") return;
  const rawDistance = Number(board.wingPosition);
  if (!(rawDistance > 0)) return;
  const boardLength = Math.max(1, Number(board.length) || (board.outline?.length ? boardCadLength(board) : 0));
  const legacyDistance = boardLength * (2 / 3);
  const correctedDistance = boardLength / 3;
  const tolerance = Math.max(0.5, boardLength * 0.005);
  if (Math.abs(rawDistance - legacyDistance) <= tolerance && Math.abs(rawDistance - correctedDistance) > tolerance) {
    board.wingPosition = correctedDistance;
  }
}

function tailPresetForBoard(mode, board, baseHalfPoints = null) {
  const key = normalizeTailModeKey(mode);
  const preset = TAIL_MODE_PRESETS[key];
  if (!preset) return null;
  const boardLength = Math.max(1, Number(board?.length) || (board?.outline?.length ? boardCadLength(board) : 0));
  const maxLength = Math.max(1, boardLength * 0.25);
  const length = clampNumber(preset.length, 0.5, maxLength, preset.length);
  const maxDepth = Math.max(0.2, length * 0.95);
  const depth = tailModeUsesDepth(mode)
    ? clampNumber(preset.depth, 0.2, maxDepth, preset.depth)
    : 0;
  return {
    ...preset,
    length,
    depth
  };
}

function curvePointAt(curve, t) {
  return {
    x: boardCadCurveX(curve, t),
    y: boardCadCurveY(curve, t)
  };
}

function curveDerivativeAt(curve, t) {
  return {
    x: boardCadCurveXDerivative(curve, t),
    y: boardCadCurveYDerivative(curve, t)
  };
}

function findGunTailRoot(board) {
  const curves = boardCadCurves(board?.outline || []);
  if (!curves.length) return null;
  const first = curves.find((curve, index) => {
    const startY = boardCadCurveY(curve, 0);
    const endY = boardCadCurveY(curve, 1);
    return index > 0 && startY > 0.25 && endY >= startY;
  }) || curves[0];
  const curveIndex = curves.indexOf(first);
  const startY = boardCadCurveY(first, 0);
  if (startY < 0) return { curveIndex, t: 0, x: boardCadCurveX(first, 0), y: startY };
  let low = 0;
  let high = 0;
  let found = false;
  for (let step = 1; step <= 160; step++) {
    const t = -step / 6;
    const y = boardCadCurveY(first, t);
    if (y <= 0) {
      low = t;
      high = -(step - 1) / 6;
      found = true;
      break;
    }
  }
  if (!found) return null;
  for (let i = 0; i < 36; i++) {
    const mid = (low + high) / 2;
    if (boardCadCurveY(first, mid) <= 0) low = mid;
    else high = mid;
  }
  const t = (low + high) / 2;
  return { curveIndex, t, x: boardCadCurveX(first, t), y: boardCadCurveY(first, t) };
}

function smoothstep01(value) {
  const t = clamp01(value);
  return t * t * (3 - (2 * t));
}

function normalizedWingConfig(board, baseHalfPoints = null) {
  const presetKey = normalizeWingPresetKey(board?.wingPreset);
  const rawDistance = Number(board?.wingPosition);
  const rawWidth = Number(board?.wingWidth);
  const hasManualValues = Number.isFinite(rawDistance) && rawDistance > 0 && Number.isFinite(rawWidth) && rawWidth > 0;
  if (!(presetKey || hasManualValues)) {
    return {
      active: false,
      presetKey: "",
      distance: 0,
      width: 0,
      shape: "",
      shoulder: 0,
      transition: 0,
      baseBlendLength: 0,
      blendLength: 0,
      maxBlendLength: 0,
      shoulderX: 0,
      endX: 0
    };
  }
  const halfPoints = baseHalfPoints || rawOutlineHalfPoints(board);
  const preset = presetKey && presetKey !== "custom" ? wingPresetForBoard(presetKey, board, halfPoints) : null;
  const presetDefined = !!preset && presetKey !== "custom";
  const boardLength = Math.max(1, Number(board?.length) || 0);
  const minDistance = 2;
  const maxDistance = Math.max(minDistance, boardLength - 1);
  const defaultDistance = preset?.distance ?? Math.min(Math.max(24, boardLength * 0.16), maxDistance);
  const useDefaultDistance = !Number.isFinite(rawDistance)
    || (presetDefined && rawDistance <= 0);
  const distance = useDefaultDistance
    ? defaultDistance
    : clampNumber(rawDistance, minDistance, maxDistance, defaultDistance);
  const maxInset = wingMaxInsetAt(halfPoints, distance);
  const defaultWidth = Math.min(preset?.width ?? 1.5, maxInset);
  const useDefaultWidth = !Number.isFinite(rawWidth)
    || (presetDefined && rawWidth <= 0);
  const width = useDefaultWidth
    ? defaultWidth
    : clampNumber(rawWidth, 0.1, maxInset, defaultWidth);
  const shape = normalizeWingShapeKey(board?.wingShape) || preset?.shape || "bump";
  const defaultShoulder = shape === "bump"
    ? clampNumber(preset?.shoulder ?? 0.22, 0, 0.75, preset?.shoulder ?? 0.22)
    : 0;
  const rawShoulder = Number(board?.wingShoulder);
  const useDefaultShoulder = !Number.isFinite(rawShoulder)
    || (presetDefined && rawShoulder <= 0 && defaultShoulder > 0);
  const shoulder = shape === "bump"
    ? (useDefaultShoulder ? defaultShoulder : clampNumber(rawShoulder, 0, 0.75, defaultShoulder))
    : 0;
  const defaultTransition = shape === "bump"
    ? clampNumber(preset?.transition ?? 1, 0.25, 2.5, preset?.transition ?? 1)
    : 0;
  const rawTransition = Number(board?.wingTransition);
  const useDefaultTransition = !Number.isFinite(rawTransition) || rawTransition <= 0;
  const transition = shape === "bump"
    ? (useDefaultTransition ? defaultTransition : clampNumber(rawTransition, 0.25, 2.5, defaultTransition))
    : 0;
  const baseBlendLength = preset?.blendLength ?? Math.max(1.4, width * 2.8);
  const rawBlendLength = shape === "bump" ? baseBlendLength * transition : 0;
  const maxBlendLength = Math.max(1.2, Math.min(boardLength - distance, distance * 0.75));
  const blendLength = shape === "bump"
    ? clampNumber(rawBlendLength, 1.2, maxBlendLength, rawBlendLength)
    : 0;
  if (!(distance > 0.1) || !(width > 0.01)) {
    return {
      active: false,
      presetKey: "",
      distance: 0,
      width: 0,
      shape: "",
      shoulder: 0,
      transition: 0,
      baseBlendLength: 0,
      blendLength: 0,
      maxBlendLength: 0,
      shoulderX: 0,
      endX: 0
    };
  }
  return {
    active: true,
    presetKey: presetKey || "custom",
    distance,
    width,
    shape,
    shoulder,
    transition,
    baseBlendLength,
    blendLength,
    maxBlendLength,
    shoulderX: Math.min(boardLength, distance + (blendLength * shoulder)),
    endX: Math.min(boardLength, distance + blendLength)
  };
}

function wingOffsetAtX(wing, x) {
  if (!wing?.active) return 0;
  if (x <= wing.distance) return wing.width;
  if (wing.shape !== "bump" || x >= wing.endX) return 0;
  if (x <= wing.shoulderX) return wing.width;
  return wing.width * (1 - smoothstep01((x - wing.shoulderX) / Math.max(1e-9, wing.endX - wing.shoulderX)));
}

function wingAdjustedOutlineHalfPoints(board, segments = getSegments()) {
  const rawHalf = rawOutlineHalfPoints(board, segments);
  const wing = normalizedWingConfig(board, rawHalf);
  if (!wing.active) return rawHalf;
  const sampleXs = rawHalf.map(point => point.x);
  sampleXs.push(wing.distance);
  if (wing.shape === "bump" && wing.endX > wing.distance + 1e-9) {
    sampleXs.push(wing.endX);
    const blendSamples = 6;
    for (let i = 1; i < blendSamples; i++) {
      sampleXs.push(lerp(wing.distance, wing.endX, i / blendSamples));
    }
  }
  sampleXs.sort((a, b) => a - b);
  const xs = [];
  sampleXs.forEach(x => {
    if (!xs.length || Math.abs(xs[xs.length - 1] - x) > 1e-6) xs.push(x);
  });
  const adjusted = [];
  xs.forEach(x => {
    const baseY = Math.max(0, interpolatePolyline(rawHalf, x));
    adjusted.push({
      x,
      y: Math.max(0, baseY - wingOffsetAtX(wing, x))
    });
    if (wing.shape === "step" && Math.abs(x - wing.distance) <= 1e-6) {
      adjusted.push({ x, y: baseY });
    }
  });
  return dedupeConsecutivePoints(adjusted);
}

function cubicHermite(y0, y1, m0, m1, t) {
  const u = clamp01(t);
  const h00 = (2 * u * u * u) - (3 * u * u) + 1;
  const h10 = (u * u * u) - (2 * u * u) + u;
  const h01 = (-2 * u * u * u) + (3 * u * u);
  const h11 = (u * u * u) - (u * u);
  return (h00 * y0) + (h10 * m0) + (h01 * y1) + (h11 * m1);
}

function boardCadSplineSlopeAt(knots, pos) {
  const curves = boardCadCurves(knots);
  const index = boardCadFindMatchingBezierSegment(curves, pos);
  if (index < 0) return 0;
  const curve = curves[index];
  const t = boardCadCurveTForX(curve, pos);
  const dx = boardCadCurveXDerivative(curve, t);
  const dy = boardCadCurveYDerivative(curve, t);
  if (Math.abs(dx) <= 1e-9) return 0;
  return dy / dx;
}

function positiveHarmonicMean(a, b) {
  if (!(a > 1e-9) || !(b > 1e-9)) return 0;
  return 2 / ((1 / a) + (1 / b));
}

function clampMonotoneHermiteSegmentSlopes(secant, startSlope, endSlope) {
  if (!(secant > 1e-9)) return [0, 0];
  let alpha = Math.max(0, startSlope / secant);
  let beta = Math.max(0, endSlope / secant);
  const radiusSquared = (alpha * alpha) + (beta * beta);
  if (radiusSquared > 9) {
    const tau = 3 / Math.sqrt(radiusSquared);
    alpha *= tau;
    beta *= tau;
  }
  return [alpha * secant, beta * secant];
}

function widthAdjustScale(value) {
  return Math.pow(4, clampNumber(value, -1, 1, 0));
}

function widthAdjustPercent(value) {
  return Math.round(widthAdjustScale(value) * 100);
}

function normalizedTailConfig(board, baseHalfPoints = null) {
  const mode = normalizeTailModeKey(board?.tailMode);
  if (!TAIL_MODE_PRESETS[mode]) {
    return {
      active: false,
      mode: "",
      length: 0,
      depth: 0,
      joinY: 0,
      innerPower: 1.55,
      notched: false,
      capMode: false,
      tipLength: 0,
      tipScale: 0,
      shift: 0,
      shoulderPos: 0,
      shoulderScale: 0,
      railBlend: 0,
      linearization: 0,
      widthAdjust: 0,
      widthScale: 1,
      cornerScale: 1,
      outerMode: "hermite",
      innerMode: "power",
      tipSlopeFactor: 1,
      shoulderSlopeFactor: 1,
      joinSlopeMix: 1,
      joinSlopeFactor: 1,
      tipBow: 0,
      railBow: 0,
      joinSlope: 0,
      cutLength: 0,
      rawJoinX: 0
    };
  }
  const preset = tailPresetForBoard(mode, board, baseHalfPoints);
  const maxLength = Math.max(1, (Number(board?.length) || 0) * 0.25);
  const rawLength = Number(board?.tailLength);
  const length = Number.isFinite(rawLength) && rawLength >= 0.5
    ? clampNumber(rawLength, 0.5, maxLength, preset.length)
    : preset.length;
  const halfPoints = baseHalfPoints || wingAdjustedOutlineHalfPoints(board);
  const maxDepth = Math.max(0.2, length * 0.95);
  const rawDepth = Number(board?.tailDepth);
  const depth = tailModeUsesDepth(mode)
    ? (Number.isFinite(rawDepth) && rawDepth >= 0.2 ? clampNumber(rawDepth, 0.2, maxDepth, preset.depth) : preset.depth)
    : 0;
  const rawShoulderPos = Number(board?.tailShoulderPos);
  const shoulderPos = Number.isFinite(rawShoulderPos) && rawShoulderPos >= 0.12
    ? clampNumber(rawShoulderPos, 0.12, 0.88, preset.shoulderPos)
    : preset.shoulderPos;
  const rawShoulderScale = Number(board?.tailShoulderScale);
  const baseShoulderScale = Number.isFinite(rawShoulderScale) && rawShoulderScale >= 0.05
    ? clampNumber(rawShoulderScale, 0.05, 1.35, preset.shoulderScale)
    : preset.shoulderScale;
  const widthAdjust = clampNumber(board?.tailWidthAdjust, -1, 1, 0);
  const widthScale = widthAdjustScale(widthAdjust);
  const shoulderScale = clampNumber(baseShoulderScale * widthScale, 0.01, 5.4, baseShoulderScale);
  const rawRailBlend = Number(board?.tailRailBlend);
  const railBlend = Number.isFinite(rawRailBlend)
    ? clampNumber(rawRailBlend, 0, 2.5, preset.railBlend)
    : preset.railBlend;
  const rawLinearization = Number(board?.tailLinearization);
  const linearization = Number.isFinite(rawLinearization)
    ? clampNumber(rawLinearization, 0, 1, preset.linearization ?? 0)
    : clampNumber(preset.linearization ?? 0, 0, 1, 0);
  const rawTipRatio = clampNumber(preset.tipRatio ?? 0, 0, 2, preset.tipRatio ?? 0);
  const capMode = rawTipRatio > 0;
  let gunRoot = mode === "gun" ? findGunTailRoot(board) : null;
  if (mode === "gun") {
    const minimumGunExtension = Math.max(10, length * 0.75);
    if (!gunRoot || gunRoot.x > -minimumGunExtension) {
      gunRoot = {
        curveIndex: 0,
        t: 0,
        x: -minimumGunExtension,
        y: 0,
        synthetic: true
      };
    }
  }
  const openNotched = tailModeUsesDepth(mode) && !capMode;
  const rawCutLength = Number(board?.tailCutLength);
  const presetCutLength = preset.cutLength ?? length;
  const cutLength = openNotched
    ? (Number.isFinite(rawCutLength) && rawCutLength >= 0 ? clampNumber(rawCutLength, 0, maxLength, presetCutLength) : clampNumber(presetCutLength, 0, maxLength, presetCutLength))
    : 0;
  const rawJoinX = openNotched ? clampNumber(cutLength + length, 0.5, maxLength * 2, cutLength + length) : length;
  const joinY = Math.max(0, interpolatePolyline(halfPoints, rawJoinX));
  if (!(joinY > 0.001)) {
    return {
      active: false,
      mode: "",
      length: 0,
      depth: 0,
      joinY: 0,
      innerPower: 1.55,
      notched: false,
      capMode: false,
      tipLength: 0,
      tipScale: 0,
      shift: 0,
      shoulderPos: 0,
      shoulderScale: 0,
      railBlend: 0,
      linearization: 0,
      widthAdjust: 0,
      widthScale: 1,
      cornerScale: 1,
      outerMode: "hermite",
      innerMode: "power",
      tipSlopeFactor: 1,
      shoulderSlopeFactor: 1,
      joinSlopeMix: 1,
      joinSlopeFactor: 1,
      tipBow: 0,
      railBow: 0,
      joinSlope: 0,
      cutLength: 0,
      rawJoinX: 0
    };
  }
  const tipLength = gunRoot
    ? Math.max(0.001, length - gunRoot.x)
    : clampNumber(length * rawTipRatio, 0, length * 2, length * rawTipRatio);
  const tipScale = capMode ? clampNumber((preset.tipScale ?? 0) * widthScale, 0, Math.max(0, shoulderScale - 0.002), preset.tipScale ?? 0) : 1;
  const cornerScale = !capMode
    ? clampNumber((preset.cornerScale ?? 1) * widthScale, 0.01, Math.max(0.01, shoulderScale), preset.cornerScale ?? 1)
    : tipScale;
  const shift = gunRoot ? gunRoot.x : (openNotched ? cutLength : (length - tipLength));
  const joinSlope = Math.max(0, boardCadSplineSlopeAt(board?.outline || [], rawJoinX));
  return {
    active: true,
    mode,
    length,
    depth,
    joinY,
    innerPower: clampNumber(preset.innerPower ?? (mode === "fish" ? 1.15 : 1.55), 0.8, 2.5, mode === "fish" ? 1.15 : 1.55),
    notched: tailModeUsesDepth(mode),
    capMode,
    tipLength,
    tipScale,
    shift,
    shoulderPos,
    shoulderScale,
    railBlend,
    linearization,
    widthAdjust,
    widthScale,
    cornerScale,
    outerMode: String(preset.outerMode || "hermite").trim().toLowerCase(),
    innerMode: String(preset.innerMode || "power").trim().toLowerCase(),
    tipSlopeFactor: clampNumber(preset.tipSlopeFactor ?? 1, 0.2, 1.5, 1),
    shoulderSlopeFactor: clampNumber(preset.shoulderSlopeFactor ?? 1, 0.2, 1.5, 1),
    joinSlopeMix: clampNumber(preset.joinSlopeMix ?? 1, 0, 1, 1),
    joinSlopeFactor: clampNumber(preset.joinSlopeFactor ?? 1, 0.2, 1.5, 1),
    tipBow: clampNumber(preset.tipBow ?? 0, 0, 0.45, 0),
    railBow: clampNumber(preset.railBow ?? 0, 0, 0.45, 0),
    joinSlope,
    gunRoot,
    cutLength,
    rawJoinX
  };
}

function boardCadPlanformAt(board, pos) {
  const x = clampNumber(pos, 0, Number(board?.length) || 0, 0);
  const planform = boardCadTailPlanform(board);
  const rawOuter = Math.max(0, interpolatePolyline(planform.baseHalf || rawOutlineHalfPoints(board), x));
  const tail = planform.tail;
  const rawJoinX = Number.isFinite(tail.rawJoinX) && tail.rawJoinX > 0 ? tail.rawJoinX : tail.length;
  if (!tail.active || x >= rawJoinX) return { innerY: 0, outerY: rawOuter };
  const displayX = x - tail.shift;
  const splineOuter = maxPolylineYAtX(planform.positive, displayX);
  const outerY = splineOuter > 1e-9 ? splineOuter : ((tail.capMode || tail.notched)
    ? tailOuterHalfWidthAt(tail, x, tail.length)
    : rawOuter);
  if (!tail.notched) return { innerY: 0, outerY };
  let innerY = 0;
  if (displayX >= 0 && displayX <= tail.depth) {
    const innerT = clamp01(1 - displayX / Math.max(1e-9, tail.depth));
    innerY = tail.joinY * Math.pow(innerT, tail.innerPower);
  }
  return { innerY: Math.min(innerY, outerY), outerY: Math.max(innerY, outerY) };
}

function boardCadDisplayPlanformAt(board, pos) {
  const x = clampNumber(pos, 0, boardCadTailDisplayLength(board), 0);
  const planform = boardCadTailPlanform(board);
  const tail = planform.tail;
  const outerY = Math.max(0, maxPolylineYAtX(planform.positive, x));
  let innerY = 0;
  if (tail.active && tail.notched && x <= tail.depth) innerY = tailInnerHalfWidthAt(tail, x);
  return { innerY: Math.min(innerY, outerY), outerY: Math.max(innerY, outerY) };
}

function boardCadDisplayWidthAtPos(board, pos) {
  return boardCadDisplayPlanformAt(board, pos).outerY * 2;
}

function boardCadDisplayInnerWidthAtPos(board, pos) {
  return boardCadDisplayPlanformAt(board, pos).innerY * 2;
}

function boardCadTailWidthLandmarks(board, ratios = [0.5, 0.6, 0.7, 0.8]) {
  const displayLength = boardCadTailDisplayLength(board);
  const maxWidth = Math.max(
    0,
    ...Array.from({ length: 81 }, (_, index) => boardCadDisplayWidthAtPos(board, displayLength * (index / 80)))
  );
  const step = Math.max(0.25, Math.min(1, displayLength / 240));
  const samples = [];
  for (let x = 0; x <= displayLength + 1e-9; x += step) {
    samples.push({
      x,
      ratio: maxWidth > 1e-9 ? boardCadDisplayWidthAtPos(board, x) / maxWidth : 0
    });
  }
  const landmarks = {};
  ratios.forEach(ratio => {
    let found = null;
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1];
      const b = samples[i];
      if (a.ratio <= ratio && b.ratio >= ratio) {
        const t = (ratio - a.ratio) / Math.max(1e-9, b.ratio - a.ratio);
        found = a.x + ((b.x - a.x) * t);
        break;
      }
    }
    landmarks[`x${Math.round(ratio * 100)}`] = found;
  });
  return {
    displayLength,
    maxWidth,
    target: empiricalTailWidthTarget(board?.tailMode),
    ...landmarks
  };
}

function boardCadMaxWidth(board) {
  let maxWidth = boardCadSplineMaxY(board.outline) * 2;
  const planform = boardCadTailPlanform(board);
  if (planform.tail.active || planform.nose?.active || normalizedWingConfig(board).active) {
    const samples = 96;
    for (let i = 0; i <= samples; i++) {
      const x = (Number(board?.length) || 0) * (i / samples);
      maxWidth = Math.max(maxWidth, boardCadPlanformAt(board, x).outerY * 2);
    }
  }
  return maxWidth;
}

function boardCadWidthAtPos(board, pos) {
  return boardCadPlanformAt(board, pos).outerY * 2;
}

function boardCadInnerWidthAtPos(board, pos) {
  return boardCadPlanformAt(board, pos).innerY * 2;
}

function boardCadRockerAtPos(board, pos) {
  return boardCadSplineValueAt(board.bottom, pos);
}

function boardCadDeckAtPos(board, pos) {
  return boardCadSplineValueAt(board.deck, pos);
}

function boardCadThicknessAtPos(board, pos) {
  return boardCadDeckAtPos(board, pos) - boardCadRockerAtPos(board, pos);
}

function boardCadMaxRawWidthPos(board) {
  if (!board || !(Number(board.length) > 0)) return 0;
  let best = { x: 0, width: -Infinity };
  const steps = 160;
  for (let i = 0; i <= steps; i++) {
    const x = board.length * (i / steps);
    const width = boardCadWidthAtPos(board, x);
    if (width > best.width) best = { x, width };
  }
  return best.x;
}

function boardCadRockerApex(board) {
  if (!board || !(Number(board.length) > 0) || !board.bottom?.length) {
    return { x: 0, rocker: 0 };
  }
  const length = Number(board.length) || 0;
  let minimumRocker = Infinity;
  const candidateXs = [];
  const pushCandidate = value => {
    const x = clampNumber(value, 0, length, 0);
    if (Number.isFinite(x)) candidateXs.push(x);
  };
  board.bottom.forEach(knot => {
    pushCandidate(Number(knot?.p?.x));
  });
  const steps = 1200;
  for (let i = 0; i <= steps; i++) {
    pushCandidate(length * (i / steps));
  }
  const uniqueXs = sortedUnique(candidateXs, 1e-6);
  const samples = uniqueXs.map(x => {
    const rocker = boardCadRockerAtPos(board, x);
    minimumRocker = Math.min(minimumRocker, rocker);
    return { x, rocker };
  });
  const plateauTolerance = 1e-7;
  const minima = samples.filter(sample => Math.abs(sample.rocker - minimumRocker) <= plateauTolerance);
  if (!minima.length) return { x: 0, rocker: 0 };
  return {
    x: (minima[0].x + minima[minima.length - 1].x) * 0.5,
    rocker: minimumRocker
  };
}

function boardCadRockerApexPos(board) {
  return boardCadRockerApex(board).x;
}

function captureRockerRuntimeBase(board) {
  if (!board) return;
  if (!Array.isArray(board.rockerRuntimeBaseBottom) || !board.rockerRuntimeBaseBottom.length) {
    board.rockerRuntimeBaseBottom = boardCadCloneKnots(board.bottom);
  }
  if (!Array.isArray(board.rockerRuntimeBaseDeck) || !board.rockerRuntimeBaseDeck.length) {
    board.rockerRuntimeBaseDeck = boardCadCloneKnots(board.deck);
  }
}

function clearRockerRuntimeBase(board) {
  if (!board) return;
  board.rockerRuntimeBaseBottom = null;
  board.rockerRuntimeBaseDeck = null;
}

function restoreRockerRuntimeBase(board) {
  if (!board) return false;
  if (!Array.isArray(board.rockerRuntimeBaseBottom) || !board.rockerRuntimeBaseBottom.length) return false;
  board.bottom = boardCadCloneKnots(board.rockerRuntimeBaseBottom);
  if (Array.isArray(board.rockerRuntimeBaseDeck) && board.rockerRuntimeBaseDeck.length) {
    board.deck = boardCadCloneKnots(board.rockerRuntimeBaseDeck);
  }
  clearRockerRuntimeBase(board);
  return true;
}

function rockerMeasurementStations(board) {
  const length = Number(board?.length) || 0;
  if (!(length > 0)) return [];
  const stations = [];
  const push = (key, label, position, reference = "") => {
    if (!Number.isFinite(position)) return;
    const x = clampNumber(position, 0, length, 0);
    stations.push({
      key,
      label,
      position: x,
      fromTail: x,
      fromNose: length - x,
      reference
    });
  };
  push("tail", "Tail", 0, "tail");
  push("tail-12", "Tail 12in", ROCKER_STATION_12_INCH_CM, "tail");
  push("tail-24", "Tail 24in", ROCKER_STATION_24_INCH_CM, "tail");
  push("wide-point", "Wide point", boardCadMaxRawWidthPos(board), "shape");
  push("rocker-apex", "Rocker apex", boardCadRockerApexPos(board), "profile");
  push("center", "Center", length / 2, "center");
  push("nose-24", "Nose 24in", length - ROCKER_STATION_24_INCH_CM, "nose");
  push("nose-12", "Nose 12in", length - ROCKER_STATION_12_INCH_CM, "nose");
  push("nose", "Nose", length, "nose");
  return stations.sort((a, b) => a.position - b.position || a.key.localeCompare(b.key));
}

function rockerStationMeasurements(board) {
  return rockerMeasurementStations(board).map(station => {
    const rocker = boardCadRockerAtPos(board, station.position);
    const deck = boardCadDeckAtPos(board, station.position);
    return {
      ...station,
      rocker,
      deck,
      thickness: deck - rocker,
      width: boardCadWidthAtPos(board, station.position)
    };
  });
}

function rockerTargetEndpointValue(value, fallback) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && Math.abs(numeric) > 1e-9) return numeric;
  return Number.isFinite(fallback) ? fallback : 0;
}

function rockerTargetCurvePoints(board, config = null, segments = 160) {
  if (!board || !(Number(board.length) > 0)) return [];
  const normalized = normalizeRockerConfig(config || board.rockerConfig, board.rockerPreset || config?.preset);
  const length = Number(board.length) || 0;
  const tailMeasured = boardCadRockerAtPos(board, 0);
  const noseMeasured = boardCadRockerAtPos(board, length);
  const baseApex = boardCadRockerApex(board);
  const apexX = clampNumber(
    baseApex.x + (normalized.apexShift * length * 0.18),
    length * 0.12,
    length * 0.88,
    length * 0.5
  );
  const apexY = baseApex.rocker;
  const tailTarget = rockerTargetEndpointValue(normalized.tailRocker, tailMeasured);
  const noseTarget = rockerTargetEndpointValue(normalized.noseRocker, noseMeasured);
  const flatness = clampNumber(normalized.middleFlatness, -1, 1, 0);
  const blend = clampNumber(normalized.blend, 0.1, 4, 1);
  const flatWindow = rockerCenterFlatWindow(length, apexX, flatness);
  const flatStart = flatWindow.start;
  const flatEnd = flatWindow.end;
  const leftSpan = Math.max(1e-9, flatStart);
  const rightSpan = Math.max(1e-9, length - flatEnd);
  const slopeScale = clampNumber(0.92 + ((1 - clamp01((flatness + 1) * 0.5)) * 0.8) + ((blend - 1) * 0.2), 0.45, 2.2, 1);
  const tailSlope = -((tailTarget - apexY) / leftSpan) * slopeScale;
  const noseSlope = ((noseTarget - apexY) / rightSpan) * slopeScale;
  const tailKickLength = Math.max(1e-9, length * clampNumber(normalized.tailKickLengthRatio, 0.05, 0.5, 0.18));
  const entryLength = Math.max(1e-9, length * clampNumber(normalized.entryLengthRatio, 0.05, 0.5, 0.18));
  const tailKick = Number(normalized.tailKick) || 0;
  const entryLift = Number(normalized.entryLift) || 0;
  const points = [];
  const count = Math.max(12, Math.floor(segments));
  for (let i = 0; i <= count; i++) {
    const x = length * (i / count);
    let y;
    if (x <= flatStart) {
      const u = clampNumber(x / leftSpan, 0, 1, 0);
      y = hermiteInterpolate01(tailTarget, apexY, tailSlope * leftSpan, 0, u);
    } else if (x >= flatEnd) {
      const u = clampNumber((x - flatEnd) / rightSpan, 0, 1, 0);
      y = hermiteInterpolate01(apexY, noseTarget, 0, noseSlope * rightSpan, u);
    } else {
      y = apexY;
    }
    if (tailKick > 0 && x <= tailKickLength) {
      y += tailKick * Math.pow(1 - smoothStep01(x / tailKickLength), 1.35);
    }
    if (entryLift > 0 && x >= length - entryLength) {
      y += entryLift * Math.pow(smoothStep01((x - (length - entryLength)) / entryLength), 1.35);
    }
    points.push({ x, y });
  }
  return points;
}

function applyRockerConfigToBoard(board, config = null) {
  if (!board || !Array.isArray(board.bottom) || board.bottom.length < 2) return false;
  const normalized = normalizeRockerConfig(config || board.rockerConfig, board.rockerPreset || config?.preset);
  const length = Number(board.length) || 0;
  if (!(length > 0)) return false;
  const sourceBottom = Array.isArray(board.rockerRuntimeBaseBottom) && board.rockerRuntimeBaseBottom.length
    ? boardCadCloneKnots(board.rockerRuntimeBaseBottom)
    : boardCadCloneKnots(board.bottom);
  const sourceDeck = Array.isArray(board.rockerRuntimeBaseDeck) && board.rockerRuntimeBaseDeck.length
    ? boardCadCloneKnots(board.rockerRuntimeBaseDeck)
    : (Array.isArray(board.deck) ? boardCadCloneKnots(board.deck) : []);
  const sourceBoard = {
    ...board,
    bottom: sourceBottom,
    deck: sourceDeck
  };
  const originalBottom = sourceBottom;
  const originalDeck = sourceDeck;
  const baseApex = boardCadRockerApex(sourceBoard);
  const apexX = clampNumber(
    baseApex.x + (normalized.apexShift * length * 0.18),
    length * 0.12,
    length * 0.88,
    length * 0.5
  );
  const targetPoints = rockerTargetCurvePoints(sourceBoard, normalized, 240);
  if (targetPoints.length < 2) return false;
  const targetAt = x => {
    const clampedX = clampNumber(Number(x), 0, length, 0);
    return interpolatePolyline(targetPoints, clampedX);
  };
  const originalThicknessAt = x => boardCadSplineValueAt(originalDeck, x) - boardCadSplineValueAt(originalBottom, x);
  const sampleXs = [];
  originalBottom.forEach((knot, index) => {
    const x = Number(knot?.p?.x) || 0;
    sampleXs.push(x);
    if (index < originalBottom.length - 1) {
      const nextX = Number(originalBottom[index + 1]?.p?.x) || x;
      sampleXs.push((x + nextX) * 0.5);
    }
  });
  sampleXs.push(apexX);
  const flatWindow = rockerCenterFlatWindow(length, apexX, normalized.middleFlatness);
  if (flatWindow.active) {
    sampleXs.push(flatWindow.start, flatWindow.end);
    sampleXs.push((flatWindow.start + apexX) * 0.5, (apexX + flatWindow.end) * 0.5);
  }
  const uniqueXs = sortedUnique(sampleXs, 0.001);
  board.bottom = splineFromPoints(uniqueXs.map(x => ({
    x,
    y: targetAt(x)
  })), { lockExtremaTangents: true });
  if (flatWindow.active) straightenSplineWindow(board.bottom, flatWindow.start, flatWindow.end);
  if (normalized.preserveFoil && !normalized.preserveDeck && originalDeck.length >= 2) {
    board.deck = splineFromPoints(uniqueXs.map(x => ({
      x,
      y: targetAt(x) + originalThicknessAt(x)
    })), { lockExtremaTangents: true });
    if (flatWindow.active) straightenSplineWindow(board.deck, flatWindow.start, flatWindow.end);
  }
  board.rockerPreset = normalized.preset;
  board.rockerConfig = normalized;
  return true;
}

function boardCadMaxThickness(board) {
  if (!board || !board.length) return 0;
  let max = -Number.MAX_VALUE;
  const steps = Math.max(1, Math.floor(board.length * 10));
  for (let i = 0; i < steps; i++) {
    const pos = i / 10;
    max = Math.max(max, boardCadThicknessAtPos(board, pos));
  }
  return max === -Number.MAX_VALUE ? 0 : max;
}

function boardCadNearestCrossSectionIndex(board, pos) {
  let nearest = -1;
  let nearestPos = -300000;
  for (let i = 1; i < board.sections.length - 1; i++) {
    const current = board.sections[i];
    if (nearest === -1 || Math.abs(nearestPos - pos) > Math.abs(current.position - pos)) {
      nearest = i;
      nearestPos = current.position;
    }
  }
  return nearest;
}

function boardCadPreviousCrossSectionIndex(board, pos) {
  let index = boardCadNearestCrossSectionIndex(board, pos);
  if (index < 0) return -1;
  if (board.sections[index].position >= pos) index -= 1;
  if (index === 0) index = 1;
  if (index > board.sections.length - 2) index = board.sections.length - 2;
  return index;
}

function boardCadNextCrossSectionIndex(board, pos) {
  let index = boardCadNearestCrossSectionIndex(board, pos);
  if (index < 0) return -1;
  if (board.sections[index].position < pos) index += 1;
  if (index === 0) index = 1;
  if (index > board.sections.length - 2) index = board.sections.length - 2;
  return index;
}

function boardCadPreviousCrossSectionPos(board, pos) {
  let index = boardCadNearestCrossSectionIndex(board, pos);
  if (index < 0) return 0;
  if (board.sections[index].position >= pos) index -= 1;
  return board.sections[Math.max(0, index)].position;
}

function boardCadNextCrossSectionPos(board, pos) {
  let index = boardCadNearestCrossSectionIndex(board, pos);
  if (index < 0) return board.length;
  if (board.sections[index].position < pos) index += 1;
  return board.sections[Math.min(board.sections.length - 1, index)].position;
}

function boardCadInterpolatedCrossSectionBaseKnots(board, x, options = {}) {
  const sections = interpolationSourceSections(board);
  if (!Array.isArray(sections) || sections.length < 3 || x < 0 || x > board.length) return [];
  const clampedX = clampNumber(x, 0, board.length, 0);
  const forceControlPoints = options.preferControlPoints === true;
  const rawCacheKey = `${state.crossSectionInterpolation}:${forceControlPoints ? "cp" : "auto"}:${clampedX.toFixed(4)}`;
  const rawCache = crossSectionCacheMap("raw", board);
  if (rawCache.has(rawCacheKey)) return rawCache.get(rawCacheKey);
  let index = boardCadNearestCrossSectionIndex({ sections }, x);
  if (index < 0) return [];
  if (sections[index].position > x) index -= 1;
  let nextIndex = index + 1;
  const firstPos = sections[Math.max(0, index)]?.position ?? 0;
  const secondPos = sections[Math.min(sections.length - 1, nextIndex)]?.position ?? firstPos;
  let t = (x - firstPos) / (secondPos - firstPos);
  if (!Number.isFinite(t)) t = 0;

  if (index < 1) index = 1;
  if (nextIndex > sections.length - 2) {
    index = sections.length - 2;
    nextIndex = index;
  }

  const c1 = sections[index];
  const c2 = sections[nextIndex];
  const preferControlPoints = forceControlPoints
    || explicitBottomFeatureAffectsInterval(board, c1?.position ?? firstPos, c2?.position ?? secondPos);
  const interpolated = boardCadCrossSectionInterpolatePair(c1, c2, t, { preferControlPoints });
  if (!interpolated.length) {
    rawCache.set(rawCacheKey, []);
    return [];
  }

  const thickness = Math.max(0.5, boardCadThicknessAtPos(board, x));
  const width = Math.max(0.5, boardCadWidthAtPos(board, x));
  const scaled = boardCadCrossSectionScaleTo(interpolated, thickness, width);
  rawCache.set(rawCacheKey, scaled);
  return scaled;
}

function boardCadCanPreferControlPointSectionInterpolation(board, x) {
  const sections = interpolationSourceSections(board);
  if (!board || !Array.isArray(sections) || sections.length < 3) return false;
  let index = boardCadNearestCrossSectionIndex({ sections }, x);
  if (index < 0) return false;
  if ((sections[index]?.position ?? 0) > x) index -= 1;
  let nextIndex = index + 1;
  if (index < 1) index = 1;
  if (nextIndex > sections.length - 2) {
    index = sections.length - 2;
    nextIndex = index;
  }
  const c1 = sections[index];
  const c2 = sections[nextIndex];
  if (!c1?.spline?.length || !c2?.spline?.length) return false;
  if (isPointOnlySpline(c1.spline) || isPointOnlySpline(c2.spline)) return false;
  return c1.spline.length === c2.spline.length;
}

function boardCadInterpolatedCrossSectionKnots(board, x) {
  const clampedX = clampNumber(x, 0, board.length, 0);
  const raw = boardCadInterpolatedCrossSectionBaseKnots(board, clampedX);
  if (!raw.length) return [];
  return applyBottomFeaturesToSectionKnots(raw, board, clampedX);
}

function boardCadCrossSectionInterpolatePair(a, b, t, options = {}) {
  const aKnots = boardCadCloneKnots(a.spline);
  const targetKnots = boardCadCrossSectionScaleTo(boardCadCloneKnots(b.spline), boardCadCrossSectionCenterThickness(aKnots), boardCadCrossSectionWidth(aKnots));
  const preferControlPoints = options.preferControlPoints === true;
  if (!preferControlPoints && state.crossSectionInterpolation === "sblend") return boardCadResampledSectionInterpolate(aKnots, targetKnots, t);
  if (aKnots.length !== targetKnots.length) return boardCadResampledSectionInterpolate(aKnots, targetKnots, t);
  return aKnots.map((knot, index) => boardCadLerpKnot(knot, targetKnots[index], t));
}

function boardCadCrossSectionInterpolate(a, b, t) {
  return boardCadCrossSectionInterpolatePair(a, b, t);
}

function boardCadResampledSectionInterpolate(aKnots, bKnots, t) {
  const aPoints = flattenSpline(aKnots);
  const bPoints = flattenSpline(bKnots);
  return blendPolylines(aPoints, bPoints, t).map(point => ({
    p: { ...point },
    prev: { ...point },
    next: { ...point },
    continuous: false,
    other: false
  }));
}

function boardCadCrossSectionScaleTo(knots, newThickness, newWidth) {
  let oldWidth = boardCadCrossSectionWidth(knots);
  let oldThickness = boardCadCrossSectionCenterThickness(knots);
  if (oldWidth < 0.1) oldWidth = 0.1;
  if (oldThickness < 0.1) oldThickness = 0.1;
  const verticalScale = Math.abs(newThickness / oldThickness);
  const horizontalScale = Math.abs(newWidth / oldWidth);
  if ((oldThickness * verticalScale) <= 0.1) return knots;
  if ((oldWidth * horizontalScale) <= 0.1) return knots;
  return knots.map(knot => boardCadScaleKnot(knot, horizontalScale, verticalScale));
}

function boardCadCrossSectionScaleGuidePoints(points, sourceKnots, newThickness, newWidth) {
  let oldWidth = boardCadCrossSectionWidth(sourceKnots);
  let oldThickness = boardCadCrossSectionCenterThickness(sourceKnots);
  if (oldWidth < 0.1) oldWidth = 0.1;
  if (oldThickness < 0.1) oldThickness = 0.1;
  const scaleX = Math.abs(newWidth / oldWidth);
  const scaleY = Math.abs(newThickness / oldThickness);
  return clonePoints(points).map(point => ({ x: point.x * scaleX, y: point.y * scaleY }));
}

function boardCadCrossSectionCenterThickness(knots) {
  if (!knots.length) return 0;
  return knots[knots.length - 1].p.y - knots[0].p.y;
}

function boardCadCrossSectionWidth(knots) {
  return boardCadSplineMaxX(knots) * 2;
}

function boardCadCrossSectionReleaseAngle(knots) {
  const s = boardCadSByNormalReverse(knots, BOARD_CAD_TUCK_UNDER_DEFINITION_ANGLE, true);
  const pos = boardCadPointByS(knots, s);
  const knot = boardCadFindBestMatchingKnot(knots, pos);
  if (!knot || Math.hypot(knot.p.x - pos.x, knot.p.y - pos.y) > 0.9) return 0;
  return boardCadKnotAngleBetweenTangents(knot);
}

function boardCadCrossSectionTuckRadius(knots) {
  const sForApex = boardCadSByNormalReverse(knots, BOARD_CAD_APEX_DEFINITION_ANGLE, true);
  const sForTuck = boardCadSByNormalReverse(knots, BOARD_CAD_TUCK_UNDER_DEFINITION_ANGLE, true);
  const apexPos = boardCadPointByS(knots, sForApex);
  const tuckPos = boardCadPointByS(knots, sForTuck);
  if ((apexPos.x - tuckPos.x) < 0.18) return 0;
  const steps = 5;
  const step = (sForTuck - sForApex) / steps;
  let curvatureSum = 0;
  for (let i = 0; i < steps; i++) {
    curvatureSum += boardCadCurvatureByS(knots, sForApex + (i * step));
  }
  const averageCurvature = curvatureSum / steps;
  return Math.abs(averageCurvature) > 1e-9 ? 1 / averageCurvature : 0;
}

function boardCadFindBestMatchingKnot(knots, point) {
  if (!knots.length || !point) return null;
  let best = null;
  let bestDistance = Infinity;
  for (const knot of knots) {
    const distance = Math.hypot(knot.p.x - point.x, knot.p.y - point.y);
    if (distance < bestDistance) {
      best = knot;
      bestDistance = distance;
    }
  }
  return best;
}

function boardCadKnotAngleBetweenTangents(knot) {
  const v1 = { x: knot.prev.x - knot.p.x, y: knot.prev.y - knot.p.y };
  const v2 = { x: knot.next.x - knot.p.x, y: knot.next.y - knot.p.y };
  const len = Math.max(1e-12, Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y));
  return Math.acos(clamp((v1.x * v2.x + v1.y * v2.y) / len, -1, 1));
}

function boardCadSplineMaxX(knots) {
  const curves = boardCadCurves(knots);
  let max = -Number.MAX_VALUE;
  for (let i = 0; i < curves.length; i++) {
    max = Math.max(max, boardCadCurveMinMax(curves[i], BOARD_CAD_BEZIER.X, BOARD_CAD_BEZIER.MAX));
  }
  return max === -Number.MAX_VALUE ? 0 : max;
}

function boardCadCloneKnots(knots) {
  return knots.map(knot => ({
    p: { ...knot.p },
    prev: { ...knot.prev },
    next: { ...knot.next },
    continuous: knot.continuous,
    other: knot.other
  }));
}

function boardCadScaleKnot(knot, scaleX, scaleY) {
  return {
    ...knot,
    p: { x: knot.p.x * scaleX, y: knot.p.y * scaleY },
    prev: { x: knot.prev.x * scaleX, y: knot.prev.y * scaleY },
    next: { x: knot.next.x * scaleX, y: knot.next.y * scaleY }
  };
}

function boardCadLerpKnot(a, b, t) {
  return {
    p: { x: lerp(a.p.x, b.p.x, t), y: lerp(a.p.y, b.p.y, t) },
    prev: { x: lerp(a.prev.x, b.prev.x, t), y: lerp(a.prev.y, b.prev.y, t) },
    next: { x: lerp(a.next.x, b.next.x, t), y: lerp(a.next.y, b.next.y, t) },
    continuous: t < 0.5 ? a.continuous : b.continuous,
    other: t < 0.5 ? a.other : b.other
  };
}

function parseId(line) {
  const match = line.match(/^p\s*(\d+)\s*:/);
  return match ? { id: Number(match[1]) } : null;
}

function valueAfterColon(line) {
  const index = line.indexOf(":");
  return index >= 0 ? line.slice(index + 1).trim() : "";
}

function numberAfterColon(line) {
  const value = Number(valueAfterColon(line));
  return Number.isFinite(value) ? value : 0;
}

function collectBlock(lines, start) {
  let depth = 0;
  const parts = [];
  let seenOpen = false;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    for (const char of line) {
      if (char === "(") {
        depth++;
        seenOpen = true;
      } else if (char === ")") {
        depth--;
      }
    }
    parts.push(line);
    if (seenOpen && depth <= 0) return { text: parts.join("\n"), end: i };
  }
  return { text: parts.join("\n"), end: lines.length - 1 };
}

function parseSpline(text) {
  return [...text.matchAll(/\(cp\s*\[([^\]]+)\]\s+(true|false)\s+(true|false)\)/g)]
    .map(match => {
      const n = match[1].split(",").map(v => Number(v.trim()));
      return {
        p: { x: n[0], y: n[1] },
        prev: { x: n[2], y: n[3] },
        next: { x: n[4], y: n[5] },
        continuous: match[2] === "true",
        other: match[3] === "true"
      };
    })
    .filter(k => Number.isFinite(k.p.x) && Number.isFinite(k.p.y));
}

function parseSplineBlock(text) {
  return {
    knots: parseSpline(text),
    guidePoints: [...text.matchAll(/\(gp\s*\[([^\]]+)\]\)/g)]
      .map(match => {
        const n = match[1].split(",").map(v => Number(v.trim()));
        return { x: n[0], y: n[1] };
      })
      .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
  };
}

function parseSections(text) {
  const sections = [];
  const sectionRegex = /\(p36\s+([^\s]+)([\s\S]*?)(?=\n\(p36|\n\)$)/g;
  for (const match of text.matchAll(sectionRegex)) {
    const parsed = parseSplineBlock(match[2]);
    sections.push({
      position: Number(match[1]),
      spline: parsed.knots,
      guidePoints: parsed.guidePoints
    });
  }
  return sections.filter(s => Number.isFinite(s.position));
}

function parseCrossSectionText(text, fallbackPosition) {
  const section = parseSections(text)[0];
  if (section && section.spline.length) return section;
  const parsed = parseSplineBlock(text);
  const positionMatch = text.match(/\(p36\s+([^\s]+)/);
  const position = positionMatch ? Number(positionMatch[1]) : fallbackPosition;
  return {
    position: Number.isFinite(position) ? position : fallbackPosition,
    spline: parsed.knots,
    guidePoints: parsed.guidePoints
  };
}

function parseSplineBlockById(text, targetId) {
  const lines = text.replace(/\r/g, "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const id = parseId(lines[i].trim());
    if (!id || id.id !== targetId) continue;
    return parseSplineBlock(collectBlock(lines, i).text);
  }
  return { knots: [], guidePoints: [] };
}

function parseNumberArray(value, expectedLength) {
  const match = value.match(/\[([^\]]*)\]/);
  const values = (match ? match[1] : value).split(",").map(v => Number(v.trim()));
  const result = Array(expectedLength).fill(0);
  values.forEach((number, index) => {
    if (index < expectedLength && Number.isFinite(number)) result[index] = number;
  });
  return result;
}

function flattenSpline(knots, segments = getSegments()) {
  if (!knots || !knots.length) return [];
  const points = [{ ...knots[0].p }];
  for (let i = 0; i < knots.length - 1; i++) {
    const a = knots[i];
    const b = knots[i + 1];
    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      points.push(cubic(a.p, a.next, b.prev, b.p, t));
    }
  }
  return points;
}

function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
  };
}

const BOARD_CAD_BEZIER = {
  ZERO: 0.0000000001,
  ONE: 0.9999999999,
  POS_TOLERANCE: 0.003,
  POS_MAX_ITERATIONS: 30,
  MIN_MAX_TOLERANCE: 0.0001,
  MIN_MAX_SPLITS: 96,
  X: 0,
  Y: 1,
  MIN: 0,
  MAX: 1
};

const BOARD_CAD_APEX_DEFINITION_ANGLE = 90;
const BOARD_CAD_TUCK_UNDER_DEFINITION_ANGLE = 175;
const BOARD_CAD_ANGLE_TOLERANCE = 0.001;

function boardCadSplineValueAt(knots, pos) {
  const curves = boardCadCurves(knots);
  const index = boardCadFindMatchingBezierSegment(curves, pos, false);
  if (index < 0) return 0;
  return boardCadCurveYForX(curves[index], pos);
}

function boardCadSplineMaxY(knots) {
  const curves = boardCadCurves(knots);
  let max = -Number.MAX_VALUE;
  for (let i = 0; i < curves.length; i++) {
    max = Math.max(max, boardCadCurveMinMax(curves[i], BOARD_CAD_BEZIER.Y, BOARD_CAD_BEZIER.MAX));
  }
  return max === -Number.MAX_VALUE ? 0 : max;
}

function boardCadCurves(knots) {
  const curves = [];
  for (let i = 0; i < knots.length - 1; i++) {
    curves.push({
      start: knots[i],
      end: knots[i + 1],
      coeff: boardCadCurveCoeff(knots[i], knots[i + 1])
    });
  }
  return curves;
}

function boardCadCurveCoeff(start, end) {
  const p0 = start.p;
  const t1 = start.next;
  const t2 = end.prev;
  const p3 = end.p;
  return {
    c0: p3.x + (3 * (-t2.x + t1.x)) - p0.x,
    c1: 3 * (t2.x - (2 * t1.x) + p0.x),
    c2: 3 * (t1.x - p0.x),
    c3: p0.x,
    c4: p3.y + (3 * (-t2.y + t1.y)) - p0.y,
    c5: 3 * (t2.y - (2 * t1.y) + p0.y),
    c6: 3 * (t1.y - p0.y),
    c7: p0.y
  };
}

function boardCadCurveX(curve, t) {
  const c = curve.coeff;
  return (((c.c0 * t + c.c1) * t + c.c2) * t) + c.c3;
}

function boardCadCurveY(curve, t) {
  const c = curve.coeff;
  return (((c.c4 * t + c.c5) * t + c.c6) * t) + c.c7;
}

function boardCadCurveXDerivative(curve, t) {
  const c = curve.coeff;
  return (((3 * c.c0) * t) + (2 * c.c1)) * t + c.c2;
}

function boardCadCurveClosestT(curve, point) {
  return boardCadCurveClosestTRecursive(curve, 0, 1, 32, point.x, point.y);
}

function boardCadCurveClosestTRecursive(curve, t0, t1, splits, x, y) {
  let bestT = 0;
  let minDist = 1000000000;
  const segment = (t1 - t0) / splits;
  for (let i = 0; i < splits; i++) {
    const currentT = segment * i + t0;
    if (currentT < 0 || currentT > 1) continue;
    const currentX = boardCadCurveX(curve, currentT);
    const currentY = boardCadCurveY(curve, currentT);
    const currentDist = Math.hypot(currentX - x, currentY - y);
    if (currentDist <= minDist) {
      minDist = currentDist;
      bestT = currentT;
    }
  }
  if ((t1 - t0) < 0.001) return bestT;
  if (splits <= 2) return bestT;
  return boardCadCurveClosestTRecursive(curve, bestT - segment, bestT + segment, splits / 2, x, y);
}

function boardCadSplitCurveKnot(curve, t) {
  const p0 = curve.start.p;
  const p1 = curve.start.next;
  const p2 = curve.end.prev;
  const p3 = curve.end.p;
  const q1 = lerpPoint(p0, p1, t);
  const q2 = lerpPoint(p1, p2, t);
  const q3 = lerpPoint(p2, p3, t);
  const r2 = lerpPoint(q1, q2, t);
  const r3 = lerpPoint(q2, q3, t);
  const r1 = lerpPoint(r2, r3, t);
  return {
    knot: {
      p: r1,
      prev: r2,
      next: r3,
      continuous: false,
      other: false
    },
    startNext: q1,
    endPrev: q3
  };
}

function boardCadCurveYForX(curve, x) {
  const denom = curve.end.p.x - curve.start.p.x;
  let t = Math.abs(denom) > 1e-12 ? (x - curve.start.p.x) / denom : 0;
  t = boardCadCurveTForXInternal(curve, x, t);
  return boardCadCurveY(curve, t);
}

function boardCadCurveTForX(curve, x) {
  const denom = curve.end.p.x - curve.start.p.x;
  const startT = Math.abs(denom) > 1e-12 ? (x - curve.start.p.x) / denom : 0;
  return boardCadCurveTForXInternal(curve, x, startT);
}

function boardCadCurveTForXInternal(curve, x, startT) {
  let t = startT;
  let xNow = boardCadCurveX(curve, t);
  let error = x - xNow;
  let iterations = 0;
  while (Math.abs(error) > BOARD_CAD_BEZIER.POS_TOLERANCE && iterations++ < BOARD_CAD_BEZIER.POS_MAX_ITERATIONS) {
    const derivative = boardCadCurveXDerivative(curve, t);
    if (Math.abs(derivative) < 1e-12) break;
    t = t + error * (1 / derivative);
    xNow = boardCadCurveX(curve, t);
    error = x - xNow;
  }
  if (t < 0 || t > 1 || Number.isNaN(t) || iterations >= BOARD_CAD_BEZIER.POS_MAX_ITERATIONS || Math.abs(error) > BOARD_CAD_BEZIER.POS_TOLERANCE) {
    t = boardCadCurveTForXRecursive(curve, x, 0, 1, BOARD_CAD_BEZIER.MIN_MAX_SPLITS);
  }
  return t;
}

function boardCadCurveTForXRecursive(curve, x, t0, t1, splits) {
  let bestT = 0;
  let bestError = Number.MAX_VALUE;
  const segment = (t1 - t0) / splits;
  for (let i = 1; i < splits; i++) {
    const currentT = segment * i + t0;
    if (currentT < 0 || currentT > 1) continue;
    const error = Math.abs(x - boardCadCurveX(curve, currentT));
    if (error < bestError) {
      bestError = error;
      bestT = currentT;
    }
  }
  if (bestError < BOARD_CAD_BEZIER.POS_TOLERANCE) return bestT;
  if ((t1 - t0) < BOARD_CAD_BEZIER.MIN_MAX_TOLERANCE) return bestT;
  if (splits <= 2) return bestT;
  return boardCadCurveTForXRecursive(curve, x, bestT - segment, bestT + segment, splits / 2);
}

function boardCadCurveMinMax(curve, axis, mode) {
  // Closed form: the axis extreme of a cubic p(t)=a3·t³+a2·t²+a1·t+a0 on
  // [0,1] lies at an endpoint or at a root of p'(t)=3a3·t²+2a2·t+a1.
  // Exact and O(1) — replaces the former recursive sampler, which consumed
  // ~46% of total CPU (profiled) and used a dimensionally wrong stop
  // condition (bestT − intervalWidth/2 < tolerance).
  const c = curve.coeff;
  const isX = axis === BOARD_CAD_BEZIER.X;
  const a3 = isX ? c.c0 : c.c4;
  const a2 = isX ? c.c1 : c.c5;
  const a1 = isX ? c.c2 : c.c6;
  const a0 = isX ? c.c3 : c.c7;
  const evalAt = t => ((a3 * t + a2) * t + a1) * t + a0;
  const wantMax = mode === BOARD_CAD_BEZIER.MAX;
  let best = evalAt(0);
  const consider = v => {
    if (wantMax ? v > best : v < best) best = v;
  };
  consider(evalAt(1));
  const A = 3 * a3, B = 2 * a2, C = a1;
  if (Math.abs(A) < 1e-12) {
    if (Math.abs(B) > 1e-12) {
      const t = -C / B;
      if (t > 0 && t < 1) consider(evalAt(t));
    }
  } else {
    const disc = B * B - 4 * A * C;
    if (disc >= 0) {
      const sq = Math.sqrt(disc);
      const tA = (-B + sq) / (2 * A);
      const tB = (-B - sq) / (2 * A);
      if (tA > 0 && tA < 1) consider(evalAt(tA));
      if (tB > 0 && tB < 1) consider(evalAt(tB));
    }
  }
  return best;
}

function boardCadFindMatchingBezierSegment(curves, pos) {
  let index = boardCadFindMatchingBezierSegmentSimple(curves, pos);
  if (index < 0) index = boardCadFindMatchingBezierSegmentMinMax(curves, pos);
  return index;
}

function boardCadFindMatchingBezierSegmentSimple(curves, pos) {
  for (let i = 0; i < curves.length; i++) {
    const lowX = curves[i].start.p.x;
    const highX = curves[i].end.p.x;
    if (lowX <= pos && highX >= pos) return i;
  }
  return -1;
}

function boardCadFindMatchingBezierSegmentMinMax(curves, pos) {
  for (let i = 0; i < curves.length; i++) {
    const lowX = boardCadCurveMinMax(curves[i], BOARD_CAD_BEZIER.X, BOARD_CAD_BEZIER.MIN);
    const highX = boardCadCurveMinMax(curves[i], BOARD_CAD_BEZIER.X, BOARD_CAD_BEZIER.MAX);
    if ((lowX <= pos && highX >= pos) || (highX <= pos && lowX >= pos)) return i;
  }
  return -1;
}

function draw() {
  const profileDraw = typeof window !== "undefined" && window.__boardcadProfileDraw;
  const drawNow = () => {
    if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
    if (typeof Date !== "undefined" && typeof Date.now === "function") return Date.now();
    return 0;
  };
  const drawStart = profileDraw ? drawNow() : 0;
  const board = state.board;
  const ghostBoard = currentGhostBoard(board);
  const displayBoard = board || ghostBoard || null;
  state.pointerTransforms = {};
  state.guidePointHandles = [];
  state.editHandles = [];
  state.finHandles = [];
  state.wingHandles = [];
  state.bottomFeatureHandles = [];
  state.bottomFeatureSectionHandles = [];
  state.drawingCanvas = true;
  const rect = els.canvas.getBoundingClientRect();
  const canvasRect = { left: 0, top: 0, width: rect.width, height: rect.height };
  const dpr = window.devicePixelRatio || 1;
  els.canvas.width = Math.max(800, Math.floor(rect.width * dpr));
  els.canvas.height = Math.max(420, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  if (state.viewOptions.showGrid) drawGrid(rect.width, rect.height);
  try {
    if (state.view === "scan") {
      drawScanView(board, canvasRect);
      if (profileDraw && typeof console !== "undefined" && typeof console.log === "function") {
        console.log(`[draw-profile] view=${state.view} total=${(drawNow() - drawStart).toFixed(2)}ms`);
      }
      return;
    }
    if (!displayBoard) {
      if (profileDraw && typeof console !== "undefined" && typeof console.log === "function") {
        console.log(`[draw-profile] view=${state.view} total=${(drawNow() - drawStart).toFixed(2)}ms`);
      }
      return;
    }
    if (state.view === "outline") drawOutline(displayBoard, canvasRect);
    if (state.view === "profile") drawProfile(displayBoard, canvasRect);
    if (state.view === "sections") drawSections(displayBoard, canvasRect);
    if (state.view === "quad") drawQuad(displayBoard, canvasRect);
    if (state.view === "toolpath") drawToolpath(displayBoard, canvasRect);
    if (state.view === "model3d") drawModel3D(displayBoard, canvasRect);
  } finally {
    if (profileDraw && typeof console !== "undefined" && typeof console.log === "function") {
      console.log(`[draw-profile] view=${state.view} total=${(drawNow() - drawStart).toFixed(2)}ms`);
    }
    state.drawingCanvas = false;
  }
}

function drawGrid(width, height) {
  ctx.strokeStyle = "#34363a";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) line(x, 0, x, height);
  for (let y = 0; y < height; y += 40) line(0, y, width, y);
}

function currentGhostBoard(referenceBoard = null) {
  const ghostBoard = (!state.viewOptions.viewBlank && state.viewOptions.showGhostBoard) ? state.ghost.board : null;
  return ghostBoard && ghostBoard !== referenceBoard ? ghostBoard : null;
}

function rotateGhostPoint(point, rotation = state.ghost.rotation || 0) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos
  };
}

function transformGhostPoint(point) {
  const rotated = rotateGhostPoint(point);
  return {
    x: rotated.x + (state.ghost.offsetX || 0),
    y: rotated.y + (state.ghost.offsetY || 0)
  };
}

function transformGhostPoints(points) {
  if (!points?.length) return [];
  return points.map(transformGhostPoint);
}

function rawOutlineHalfPoints(board, segments = getSegments()) {
  return flattenSpline(board.outline, segments);
}

function monotonicPolylineFromX(points, startX) {
  if (!points?.length) return [];
  const result = [{ x: startX, y: interpolatePolyline(points, startX) }];
  points.forEach(point => {
    if (point.x > startX + 1e-9) result.push({ x: point.x, y: point.y });
  });
  return dedupeConsecutivePoints(result);
}

function dedupeConsecutivePoints(points) {
  const result = [];
  points.forEach(point => {
    const previous = result[result.length - 1];
    if (!previous || Math.hypot(previous.x - point.x, previous.y - point.y) > 1e-9) result.push(point);
  });
  return result;
}

function tailOuterLinearScaleAt(tail, u) {
  const shoulderPos = clampNumber(tail.shoulderPos, 0.12, 0.88, 0.4);
  const maxScale = tail.mode === "square" ? 1 : 0.985;
  const shoulderScale = clampNumber(tail.shoulderScale, 0.05, maxScale, 0.5);
  const tipScaleSource = tail.capMode ? (tail.tipScale ?? 0) : (tail.cornerScale ?? 1);
  const tipScaleMax = tail.mode === "square" ? shoulderScale : Math.max(0, shoulderScale - 0.02);
  const tipScale = clampNumber(tipScaleSource, 0, tipScaleMax, tipScaleSource);
  if (u <= shoulderPos) {
    return lerp(tipScale, shoulderScale, u / Math.max(1e-9, shoulderPos));
  }
  return lerp(shoulderScale, 1, (u - shoulderPos) / Math.max(1e-9, 1 - shoulderPos));
}

function tailCurvatureLift(baseScale, startScale, endScale, u, bowAmount) {
  if (!(bowAmount > 1e-9) || !(endScale > startScale + 1e-9)) return baseScale;
  const envelope = Math.pow(Math.sin(Math.PI * clamp01(u)), 1.35);
  const lifted = baseScale + ((endScale - startScale) * bowAmount * envelope);
  return clampNumber(lifted, startScale, endScale, baseScale);
}

function tailOuterDiamondScaleAt(tail, u) {
  const shoulderPos = clampNumber(tail.shoulderPos, 0.12, 0.88, 0.4);
  const shoulderScale = clampNumber(tail.shoulderScale, 0.05, 0.985, 0.5);
  const tipScale = clampNumber(tail.tipScale ?? 0, 0, Math.max(0, shoulderScale - 0.02), tail.tipScale ?? 0);
  const isRoundedDiamond = tail.outerMode === "rounded-diamond";
  const roundedness = isRoundedDiamond ? 0.82 : 0.22;
  const lineA = t => lerp(tipScale, shoulderScale, t / Math.max(1e-9, shoulderPos));
  const lineB = t => lerp(shoulderScale, 1, (t - shoulderPos) / Math.max(1e-9, 1 - shoulderPos));
  const tipRound = isRoundedDiamond ? shoulderPos * lerp(0.06, 0.22, roundedness) : 0;
  const shoulderSpanLeft = shoulderPos * lerp(0.05, 0.16, roundedness);
  const shoulderSpanRight = (1 - shoulderPos) * lerp(0.08, 0.2, roundedness);
  const shoulderLeft = Math.max(tipRound, shoulderPos - shoulderSpanLeft);
  const shoulderRight = Math.min(1, shoulderPos + shoulderSpanRight);
  const slopeA = Math.max(1e-9, (shoulderScale - tipScale) / Math.max(1e-9, shoulderPos));
  const slopeB = Math.max(1e-9, (1 - shoulderScale) / Math.max(1e-9, 1 - shoulderPos));
  if (u <= tipRound) {
    const end = lineA(tipRound);
    const local = clamp01(u / Math.max(1e-9, tipRound));
    const scale = cubicHermite(
      tipScale,
      end,
      slopeA * tipRound * lerp(0.12, 0.3, roundedness),
      slopeA * tipRound * lerp(0.72, 0.88, roundedness),
      local
    );
    return clampNumber(scale, tipScale, end, tipScale);
  }
  if (u < shoulderLeft) return lineA(u);
  if (u <= shoulderRight) {
    const y0 = lineA(shoulderLeft);
    const y1 = lineB(shoulderRight);
    const span = Math.max(1e-9, shoulderRight - shoulderLeft);
    const local = clamp01((u - shoulderLeft) / span);
    const scale = cubicHermite(
      y0,
      y1,
      slopeA * span * lerp(0.34, 0.58, roundedness),
      slopeB * span * lerp(0.34, 0.58, roundedness),
      local
    );
    return clampNumber(scale, y0, y1, y0);
  }
  return lineB(u);
}

function tailOuterRoundPinScaleAt(tail, u) {
  const shoulderPos = clampNumber(tail.shoulderPos, 0.12, 0.88, 0.4);
  const shoulderScale = clampNumber(tail.shoulderScale, 0.05, 0.985, 0.5);
  const tipScale = clampNumber(tail.tipScale ?? 0, 0, Math.max(0, shoulderScale - 0.02), tail.tipScale ?? 0);
  const tipPower = lerp(0.58, 0.82, clamp01(shoulderPos));
  const railPower = lerp(0.74, 0.56, clamp01(shoulderPos));
  if (u <= shoulderPos) {
    const local = clamp01(u / Math.max(1e-9, shoulderPos));
    const eased = 1 - Math.pow(1 - local, tipPower);
    return lerp(tipScale, shoulderScale, eased);
  }
  const local = clamp01((u - shoulderPos) / Math.max(1e-9, 1 - shoulderPos));
  const eased = Math.pow(local, railPower);
  return lerp(shoulderScale, 1, eased);
}

function tailOuterCurvedScaleAt(tail, u, capLength) {
  const shoulderPos = clampNumber(tail.shoulderPos, 0.12, 0.88, 0.4);
  const maxScale = tail.mode === "square" ? 1 : 0.985;
  const shoulderScale = clampNumber(tail.shoulderScale, 0.05, maxScale, 0.5);
  const tipScaleSource = tail.capMode ? (tail.tipScale ?? 0) : (tail.cornerScale ?? 1);
  const tipScaleMax = tail.mode === "square" ? shoulderScale : Math.max(0, shoulderScale - 0.02);
  const tipScale = clampNumber(tipScaleSource, 0, tipScaleMax, tipScaleSource);
  if (tail.outerMode === "diamond" || tail.outerMode === "rounded-diamond") {
    return tailOuterDiamondScaleAt(tail, u);
  }
  if (tail.outerMode === "round-pin") {
    return tailOuterRoundPinScaleAt(tail, u);
  }
  const firstSecant = Math.max(1e-9, (shoulderScale - tipScale) / Math.max(1e-9, shoulderPos));
  const secondSecant = Math.max(1e-9, (1 - shoulderScale) / Math.max(1e-9, 1 - shoulderPos));
  const rawJoinSlope = clampNumber((tail.joinSlope * capLength / Math.max(1e-9, tail.joinY)) * tail.railBlend, 0, 6, 0);
  let tipSlope = firstSecant * clampNumber(tail.tipSlopeFactor ?? 1, 0.2, 1.5, 1);
  let shoulderSlope = positiveHarmonicMean(firstSecant, secondSecant) * clampNumber(tail.shoulderSlopeFactor ?? 1, 0.2, 1.5, 1);
  if (tail.mode === "diamond") shoulderSlope = Math.min(firstSecant, shoulderSlope);
  let joinSlope = lerp(secondSecant, rawJoinSlope, clampNumber(tail.joinSlopeMix ?? 1, 0, 1, 1)) * clampNumber(tail.joinSlopeFactor ?? 1, 0.2, 1.5, 1);
  [tipSlope, shoulderSlope] = clampMonotoneHermiteSegmentSlopes(firstSecant, tipSlope, shoulderSlope);
  [shoulderSlope, joinSlope] = clampMonotoneHermiteSegmentSlopes(secondSecant, shoulderSlope, joinSlope);
  if (u <= shoulderPos) {
    const local = clamp01(u / Math.max(1e-9, shoulderPos));
    const scale = cubicHermite(tipScale, shoulderScale, tipSlope * shoulderPos, shoulderSlope * shoulderPos, local);
    return tailCurvatureLift(
      clampNumber(scale, tipScale, shoulderScale, tipScale),
      tipScale,
      shoulderScale,
      local,
      clampNumber(tail.tipBow ?? 0, 0, 0.45, 0)
    );
  }
  const local = clamp01((u - shoulderPos) / Math.max(1e-9, 1 - shoulderPos));
  const scale = cubicHermite(shoulderScale, 1, shoulderSlope * (1 - shoulderPos), joinSlope * (1 - shoulderPos), local);
  return tailCurvatureLift(
    clampNumber(scale, shoulderScale, 1, shoulderScale),
    shoulderScale,
    1,
    local,
    clampNumber(tail.railBow ?? 0, 0, 0.45, 0)
  );
}

function tailOuterHalfWidthAt(tail, x, capLength = tail.tipLength || tail.length) {
  if (!tail.active || capLength <= 1e-9 || x >= capLength) return tail.joinY;
  const u = clamp01(x / capLength);
  const curvedScale = tailOuterCurvedScaleAt(tail, u, capLength);
  const linearScale = tailOuterLinearScaleAt(tail, u);
  const scale = lerp(curvedScale, linearScale, clampNumber(tail.linearization ?? 0, 0, 1, 0));
  return tail.joinY * scale;
}

function tailInnerHalfWidthAt(tail, x) {
  if (!tail.active || !tail.notched) return 0;
  if (x < 0 || x > tail.depth) return 0;
  const tipWidth = tail.capMode
    ? tailOuterHalfWidthAt(tail, 0, tail.tipLength || tail.length)
    : tailOuterHalfWidthAt(tail, 0, tail.length);
  const t = clamp01(1 - x / Math.max(1e-9, tail.depth));
  const curved = tipWidth * Math.pow(t, tail.innerPower);
  const linear = tipWidth * t;
  return lerp(curved, linear, clampNumber(tail.linearization ?? 0, 0, 1, 0));
}

function makeSplineKnot(point) {
  return {
    p: { x: point.x, y: point.y },
    prev: { x: point.x, y: point.y },
    next: { x: point.x, y: point.y },
    continuous: true,
    other: false
  };
}

function samePoint(a, b, tolerance = 1e-6) {
  return !!a && !!b && Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}

function cubic1d(a, b, c, d, t) {
  const mt = 1 - t;
  return (mt * mt * mt * a) + (3 * mt * mt * t * b) + (3 * mt * t * t * c) + (t * t * t * d);
}

function fitBezierSegmentToSamples(start, end, sampleFn, options = {}) {
  const dx = end.x - start.x;
  if (Math.abs(dx) <= 1e-9) {
    return {
      start,
      end,
      c1: { ...start },
      c2: { ...end }
    };
  }
  const direction = dx >= 0 ? 1 : -1;
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  const sampleCount = Math.max(3, Math.floor(options.samples || 7));
  const candidates = Array.isArray(options.xCandidates) && options.xCandidates.length
    ? options.xCandidates
    : [[1 / 3, 2 / 3]];
  let best = null;
  candidates.forEach(candidate => {
    const c1u = clampNumber(candidate[0], 0.05, 0.45, 1 / 3);
    const c2u = clampNumber(candidate[1], c1u + 0.05, 0.95, 2 / 3);
    const c1x = lerp(start.x, end.x, c1u);
    const c2x = lerp(start.x, end.x, c2u);
    let a11 = 0;
    let a12 = 0;
    let a22 = 0;
    let b1 = 0;
    let b2 = 0;
    const samples = [];
    for (let i = 1; i <= sampleCount; i++) {
      const t = i / (sampleCount + 1);
      const mt = 1 - t;
      const b0 = mt * mt * mt;
      const b1w = 3 * mt * mt * t;
      const b2w = 3 * mt * t * t;
      const b3 = t * t * t;
      const x = cubic1d(start.x, c1x, c2x, end.x, t);
      const target = sampleFn(x);
      const residual = target - (b0 * start.y + b3 * end.y);
      a11 += b1w * b1w;
      a12 += b1w * b2w;
      a22 += b2w * b2w;
      b1 += b1w * residual;
      b2 += b2w * residual;
      samples.push({ t, target, b0, b1w, b2w, b3 });
    }
    const det = (a11 * a22) - (a12 * a12);
    let c1y = lerp(start.y, end.y, c1u);
    let c2y = lerp(start.y, end.y, c2u);
    if (Math.abs(det) > 1e-9) {
      c1y = ((b1 * a22) - (b2 * a12)) / det;
      c2y = ((a11 * b2) - (a12 * b1)) / det;
    }
    c1y = clampNumber(c1y, minY, maxY, c1y);
    c2y = clampNumber(c2y, minY, maxY, c2y);
    if (!options.keepYOrder) {
      if (direction > 0 && c1y > c2y) [c1y, c2y] = [c2y, c1y];
      if (direction < 0 && c1y < c2y) [c1y, c2y] = [c2y, c1y];
    }
    let error = 0;
    let maxError = 0;
    samples.forEach(sample => {
      const actual = (sample.b0 * start.y) + (sample.b1w * c1y) + (sample.b2w * c2y) + (sample.b3 * end.y);
      const diff = actual - sample.target;
      error += diff * diff;
      maxError = Math.max(maxError, Math.abs(diff));
    });
    if (!best || maxError < best.maxError - 1e-9 || (Math.abs(maxError - best.maxError) <= 1e-9 && error < best.error)) {
      best = { c1x, c2x, c1y, c2y, error, maxError };
    }
  });
  return {
    start,
    end,
    c1: {
      x: best.c1x,
      y: best.c1y
    },
    c2: {
      x: best.c2x,
      y: best.c2y
    }
  };
}

function clampBezierSegmentVertical(segment) {
  const minY = Math.min(segment.start.y, segment.end.y);
  const maxY = Math.max(segment.start.y, segment.end.y);
  segment.c1.y = clampNumber(segment.c1.y, minY, maxY, segment.c1.y);
  segment.c2.y = clampNumber(segment.c2.y, minY, maxY, segment.c2.y);
  return segment;
}

function lerpPoint(a, b, t) {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t)
  };
}

function lineBezierSegment(start, end) {
  return {
    start,
    c1: lerpPoint(start, end, 1 / 3),
    c2: lerpPoint(start, end, 2 / 3),
    end
  };
}

function tangentBezierSegment(start, end, startSlope, endSlope, options = {}) {
  const c1Ratio = clampNumber(options.c1Ratio ?? 1 / 3, 0.04, 0.48, 1 / 3);
  const c2Ratio = clampNumber(options.c2Ratio ?? 2 / 3, c1Ratio + 0.04, 0.96, 2 / 3);
  const line = lineBezierSegment(start, end);
  const c1x = lerp(start.x, end.x, c1Ratio);
  const c2x = lerp(start.x, end.x, c2Ratio);
  const fallbackSlope = Math.abs(end.x - start.x) > 1e-9 ? (end.y - start.y) / (end.x - start.x) : 0;
  const s0 = Number.isFinite(startSlope) ? startSlope : fallbackSlope;
  const s1 = Number.isFinite(endSlope) ? endSlope : fallbackSlope;
  const curved = {
    start,
    c1: {
      x: c1x,
      y: start.y + (s0 * (c1x - start.x))
    },
    c2: {
      x: c2x,
      y: end.y - (s1 * (end.x - c2x))
    },
    end
  };
  const linearization = clampNumber(options.linearization ?? 0, 0, 1, 0);
  curved.c1 = lerpPoint(curved.c1, line.c1, linearization);
  curved.c2 = lerpPoint(curved.c2, line.c2, linearization);
  return clampBezierSegmentVertical(curved);
}

function singleArcBezierSegment(start, end, endSlope, options = {}) {
  const c1Ratio = clampNumber(options.c1Ratio ?? 0.2, 0.04, 0.48, 0.2);
  const c2Ratio = clampNumber(options.c2Ratio ?? 0.88, c1Ratio + 0.04, 0.96, 0.88);
  const dx = end.x - start.x;
  const averageSlope = Math.abs(dx) > 1e-9 ? (end.y - start.y) / dx : 0;
  const startSlopeFactor = clampNumber(options.startSlopeFactor ?? 1.1, 0.2, 2.4, 1.1);
  const fallbackEndSlope = Number.isFinite(endSlope) ? endSlope : averageSlope;
  const line = lineBezierSegment(start, end);
  const curved = {
    start,
    c1: {
      x: lerp(start.x, end.x, c1Ratio),
      y: start.y + (averageSlope * dx * c1Ratio * startSlopeFactor)
    },
    c2: {
      x: lerp(start.x, end.x, c2Ratio),
      y: end.y - (fallbackEndSlope * dx * (1 - c2Ratio))
    },
    end
  };
  const linearization = clampNumber(options.linearization ?? 0, 0, 1, 0);
  curved.c1 = lerpPoint(curved.c1, line.c1, linearization);
  curved.c2 = lerpPoint(curved.c2, line.c2, linearization);
  return clampBezierSegmentVertical(curved);
}

function exponentialTailBezierSegments(start, end, endSlope, options = {}) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (!(Math.abs(dx) > 1e-9) || !(Math.abs(dy) > 1e-9)) {
    return [lineBezierSegment(start, end)];
  }
  const tipHandleRatio = clampNumber(options.tipHandleRatio ?? 0.12, 0.03, 0.4, 0.12);
  const endHandleRatio = clampNumber(options.endHandleRatio ?? 0.26, 0.08, 0.46, 0.26);
  const fallbackEndSlope = Number.isFinite(endSlope) && Math.abs(endSlope) > 1e-9
    ? endSlope
    : dy / dx;
  const segment = {
    start,
    c1: {
      x: start.x,
      y: start.y + (dy * tipHandleRatio)
    },
    c2: {
      x: end.x - ((dy / fallbackEndSlope) * endHandleRatio),
      y: end.y - (dy * endHandleRatio)
    },
    end
  };
  const line = lineBezierSegment(start, end);
  const linearization = clampNumber(options.linearization ?? 0, 0, 1, 0);
  if (linearization > 0) {
    segment.c1 = lerpPoint(segment.c1, line.c1, linearization);
    segment.c2 = lerpPoint(segment.c2, line.c2, linearization);
  }
  return [clampBezierSegmentVertical(segment)];
}

function pointedTailBezierSegments(start, end, endSlope, tail) {
  return exponentialTailBezierSegments(start, end, endSlope, {
    tipHandleRatio: 0.12,
    endHandleRatio: 0.26,
    linearization: tail.linearization
  });
}

function squashTailBezierSegments(start, end, endSlope, tail) {
  const capLength = Math.max(1e-9, end.x - start.x);
  const joinY = Math.max(1e-9, end.y);
  const anchor = {
    x: start.x + capLength * 0.1588,
    y: joinY * 0.542
  };
  const first = {
    start,
    c1: { x: start.x, y: joinY * 0.287 },
    c2: {
      x: start.x + capLength * 0.0105,
      y: joinY * 0.426
    },
    end: anchor
  };
  const second = tangentBezierSegment(anchor, end, (joinY * 0.79) / Math.max(1e-9, capLength), endSlope, {
    c1Ratio: 0.35,
    c2Ratio: 0.92,
    linearization: tail.linearization
  });
  if ((tail.linearization ?? 0) > 0) {
    const line = lineBezierSegment(start, end);
    first.c1 = lerpPoint(first.c1, line.c1, tail.linearization);
    first.c2 = lerpPoint(first.c2, line.c2, tail.linearization);
  }
  return [
    clampBezierSegmentVertical(first),
    clampBezierSegmentVertical(second)
  ];
}

function applyBezierWidthAdjust(segments, amount) {
  const widthScale = widthAdjustScale(amount);
  if (Math.abs(widthScale - 1) <= 1e-9) return segments;
  segments.forEach(segment => {
    segment.c1.y = segment.start.y + ((segment.c1.y - segment.start.y) * widthScale);
    clampBezierSegmentVertical(segment);
  });
  return segments;
}

function maxPolylineYAtX(points, x) {
  if (!Array.isArray(points) || !points.length) return 0;
  let found = false;
  let maxY = -Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const minX = Math.min(a.x, b.x) - 1e-8;
    const maxX = Math.max(a.x, b.x) + 1e-8;
    if (x < minX || x > maxX) continue;
    let y;
    if (Math.abs(b.x - a.x) <= 1e-9) {
      y = Math.max(a.y, b.y);
    } else {
      const t = clamp01((x - a.x) / (b.x - a.x));
      y = lerp(a.y, b.y, t);
    }
    if (Number.isFinite(y)) {
      maxY = Math.max(maxY, y);
      found = true;
    }
  }
  return found ? Math.max(0, maxY) : Math.max(0, interpolatePolyline(points, x));
}

function enforceBezierSegmentStartSlope(segment, slope) {
  if (!Number.isFinite(slope)) return segment;
  const dx = segment.c1.x - segment.start.x;
  if (Math.abs(dx) <= 1e-9) return segment;
  segment.c1.y = segment.start.y + (slope * dx);
  return clampBezierSegmentVertical(segment);
}

function enforceBezierSegmentEndSlope(segment, slope) {
  if (!Number.isFinite(slope)) return segment;
  const dx = segment.end.x - segment.c2.x;
  if (Math.abs(dx) <= 1e-9) return segment;
  segment.c2.y = segment.end.y - (slope * dx);
  return clampBezierSegmentVertical(segment);
}

function splineFromBezierSegments(segments) {
  if (!segments.length) return [];
  const knots = [];
  segments.forEach(segment => {
    if (!knots.length || !samePoint(knots[knots.length - 1].p, segment.start)) {
      knots.push(makeSplineKnot(segment.start));
    }
    const start = knots[knots.length - 1];
    start.next = { ...segment.c1 };
    if (!samePoint(start.p, segment.end)) knots.push(makeSplineKnot(segment.end));
    const end = knots[knots.length - 1];
    end.prev = { ...segment.c2 };
  });
  return knots;
}

function spliceTailSplineIntoBase(tailSpline, baseSpline) {
  if (!tailSpline.length) return boardCadCloneKnots(baseSpline);
  if (!baseSpline.length) return boardCadCloneKnots(tailSpline);
  const merged = boardCadCloneKnots(tailSpline);
  const base = boardCadCloneKnots(baseSpline);
  const tailEnd = merged[merged.length - 1];
  const baseStart = base[0];
  if (Math.abs((tailEnd?.p?.x ?? 0) - (baseStart?.p?.x ?? 0)) <= 1e-2) {
    tailEnd.p = { ...baseStart.p };
    tailEnd.prev = tailEnd.prev ? { ...tailEnd.prev } : { ...baseStart.prev };
    tailEnd.next = { ...baseStart.next };
    tailEnd.continuous = baseStart.continuous;
    tailEnd.other = baseStart.other;
    return merged.concat(base.slice(1));
  }
  return merged.concat(base);
}

function buildGunTailSpline(board, tail, forwardBase) {
  if (tail.mode !== "gun" || !tail.gunRoot || !forwardBase.length) return null;
  const tipPoint = { x: 0, y: 0 };
  const joinPoint = { ...forwardBase[0] };
  const joinSlope = Number.isFinite(tail.joinSlope) ? tail.joinSlope : joinPoint.y / Math.max(1e-9, joinPoint.x);
  const c2Ratio = 0.62;
  if (tail.gunRoot.synthetic) {
    const line = lineBezierSegment(tipPoint, joinPoint);
    const segment = {
      start: tipPoint,
      c1: { x: 0, y: joinPoint.y * 0.2 },
      c2: {
        x: joinPoint.x * c2Ratio,
        y: joinPoint.y - (joinSlope * joinPoint.x * (1 - c2Ratio))
      },
      end: joinPoint
    };
    segment.c1 = lerpPoint(segment.c1, line.c1, tail.linearization);
    segment.c2 = lerpPoint(segment.c2, line.c2, tail.linearization);
    return spliceTailSplineIntoBase(splineFromBezierSegments(applyBezierWidthAdjust([segment], tail.widthAdjust)), splineFromOrderedPoints(forwardBase));
  }
  const line = lineBezierSegment(tipPoint, joinPoint);
  const singleArc = {
    start: tipPoint,
    c1: { x: 0, y: joinPoint.y * 0.2 },
    c2: {
      x: joinPoint.x * c2Ratio,
      y: joinPoint.y - (joinSlope * joinPoint.x * (1 - c2Ratio))
    },
    end: joinPoint
  };
  singleArc.c1 = lerpPoint(singleArc.c1, line.c1, tail.linearization);
  singleArc.c2 = lerpPoint(singleArc.c2, line.c2, tail.linearization);
  return spliceTailSplineIntoBase(splineFromBezierSegments(applyBezierWidthAdjust([singleArc], tail.widthAdjust)), splineFromOrderedPoints(forwardBase));
}

function buildCapTailSpline(tail, forwardBase) {
  if (!tail.capMode || tail.notched || !forwardBase.length) return null;
  const capLength = Math.max(0, tail.tipLength || tail.length);
  if (!(capLength > 1e-6)) return null;
  const outer = x => tailOuterHalfWidthAt(tail, x, capLength);
  const joinPoint = { ...forwardBase[0] };
  const tipPoint = { x: 0, y: outer(0) };
  let segments;
  const averageSlope = (joinPoint.y - tipPoint.y) / Math.max(1e-9, joinPoint.x - tipPoint.x);
  if (tail.mode === "pin") {
    segments = pointedTailBezierSegments(tipPoint, joinPoint, tail.joinSlope, tail);
  } else if (tail.mode === "squash") {
    segments = squashTailBezierSegments({ x: 0, y: 0 }, joinPoint, tail.joinSlope, tail);
  } else if (tail.mode === "round-pin") {
    segments = pointedTailBezierSegments(tipPoint, joinPoint, tail.joinSlope, tail);
  } else if (tail.mode === "rocket") {
    segments = pointedTailBezierSegments(tipPoint, joinPoint, tail.joinSlope, tail);
  } else if (tail.mode === "round") {
    const roundStart = { x: 0, y: 0 };
    const line = lineBezierSegment(roundStart, joinPoint);
    const roundSegment = {
      start: roundStart,
      c1: {
        x: 0,
        y: joinPoint.y * 0.46
      },
      c2: {
        x: joinPoint.x * 0.74,
        y: joinPoint.y - (tail.joinSlope * joinPoint.x * 0.26)
      },
      end: joinPoint
    };
    roundSegment.c1 = lerpPoint(roundSegment.c1, line.c1, tail.linearization);
    roundSegment.c2 = lerpPoint(roundSegment.c2, line.c2, tail.linearization);
    segments = [
      clampBezierSegmentVertical(roundSegment)
    ];
  } else if (tail.mode === "rounded-square") {
    segments = [
      singleArcBezierSegment(tipPoint, joinPoint, tail.joinSlope, {
        c1Ratio: 0.14,
        c2Ratio: 0.72,
        startSlopeFactor: 1.38,
        linearization: tail.linearization
      })
    ];
  } else if (tail.outerMode === "diamond" || tail.outerMode === "rounded-diamond") {
    const shoulderX = capLength * clampNumber(tail.shoulderPos, 0.12, 0.88, 0.4);
    const shoulderPoint = { x: shoulderX, y: outer(shoulderX) };
    if (tail.outerMode === "diamond") {
      const railC2X = lerp(shoulderPoint.x, joinPoint.x, 0.88);
      segments = [
        lineBezierSegment(tipPoint, shoulderPoint),
        {
          start: shoulderPoint,
          c1: {
            x: lerp(shoulderPoint.x, joinPoint.x, 0.12),
            y: lerp(shoulderPoint.y, joinPoint.y, 0.135)
          },
          c2: {
            x: railC2X,
            y: joinPoint.y - (tail.joinSlope * (joinPoint.x - railC2X))
          },
          end: joinPoint
        }
      ];
      if ((tail.linearization ?? 0) > 1e-9) {
        const railLine = lineBezierSegment(shoulderPoint, joinPoint);
        segments[1].c1 = lerpPoint(segments[1].c1, railLine.c1, tail.linearization);
        segments[1].c2 = lerpPoint(segments[1].c2, railLine.c2, tail.linearization);
      }
    } else {
      const shoulderSlope = (joinPoint.y - tipPoint.y) / Math.max(1e-9, joinPoint.x - tipPoint.x);
      const railC2X = lerp(shoulderPoint.x, joinPoint.x, 0.88);
      segments = [
        tangentBezierSegment(tipPoint, shoulderPoint, shoulderSlope * 0.55, shoulderSlope * 1.05, {
          c1Ratio: 0.3,
          c2Ratio: 0.7,
          linearization: tail.linearization
        }),
        {
          start: shoulderPoint,
          c1: {
            x: lerp(shoulderPoint.x, joinPoint.x, 0.14),
            y: lerp(shoulderPoint.y, joinPoint.y, 0.18)
          },
          c2: {
            x: railC2X,
            y: joinPoint.y - (tail.joinSlope * (joinPoint.x - railC2X))
          },
          end: joinPoint
        }
      ];
      if ((tail.linearization ?? 0) > 1e-9) {
        const railLine = lineBezierSegment(shoulderPoint, joinPoint);
        segments[1].c1 = lerpPoint(segments[1].c1, railLine.c1, tail.linearization);
        segments[1].c2 = lerpPoint(segments[1].c2, railLine.c2, tail.linearization);
      }
    }
  } else {
    const xCandidates = tail.mode === "round-pin"
        ? [[0.18, 0.62], [0.18, 0.7], [0.22, 0.72], [0.26, 0.76], [0.3, 0.8], [0.38, 0.82], [0.44, 0.84]]
        : tail.mode === "round"
          ? [[0.22, 0.58], [0.26, 0.62], [1 / 3, 2 / 3], [0.34, 0.72], [0.4, 0.88], [0.44, 0.94]]
          : [[1 / 3, 2 / 3]];
    segments = [
      fitBezierSegmentToSamples(tipPoint, joinPoint, outer, { samples: 7, xCandidates })
    ];
  }
  if (segments.length) {
    applyBezierWidthAdjust(segments, tail.widthAdjust);
    enforceBezierSegmentEndSlope(segments[segments.length - 1], tail.joinSlope);
  }
  return spliceTailSplineIntoBase(splineFromBezierSegments(segments), splineFromOrderedPoints(forwardBase));
}

function buildFishNoseTemplateInnerSegment(board, tail, notchPoint, cornerPoint) {
  const boardLength = Number(board?.length) || 0;
  if (!(boardLength > 1e-6) || !(tail.depth > 1e-6) || !(cornerPoint.y > 1e-6)) return null;
  const segment = {
    start: notchPoint,
    c1: {
      x: lerp(notchPoint.x, cornerPoint.x, 0.1),
      y: cornerPoint.y * 0.25
    },
    c2: {
      x: lerp(notchPoint.x, cornerPoint.x, 0.5),
      y: cornerPoint.y * 0.95
    },
    end: cornerPoint
  };
  if ((tail.linearization ?? 0) > 1e-9) {
    const line = lineBezierSegment(notchPoint, cornerPoint);
    segment.c1 = lerpPoint(segment.c1, line.c1, tail.linearization);
    segment.c2 = lerpPoint(segment.c2, line.c2, tail.linearization);
  }
  return segment;
}

function buildFishNoseTemplateOuterSegment(board, tail, cornerPoint, joinPoint) {
  const boardLength = Number(board?.length) || 0;
  if (!(boardLength > 1e-6) || !(tail.length > 1e-6) || !(joinPoint.y > cornerPoint.y + 1e-6)) return null;
  const noseSpan = Math.min(tail.length, boardLength * 0.35);
  const noseReferenceY = Math.max(1e-6, boardCadSplineValueAt(board.outline || [], boardLength - noseSpan));
  const sample = x => {
    const localX = clampNumber(x, 0, tail.length, 0);
    const noseDistance = noseSpan * (localX / Math.max(1e-9, tail.length));
    const noseY = Math.max(0, boardCadSplineValueAt(board.outline || [], boardLength - noseDistance));
    return cornerPoint.y + ((joinPoint.y - cornerPoint.y) * clamp01(noseY / noseReferenceY));
  };
  const segment = fitBezierSegmentToSamples(cornerPoint, joinPoint, sample, {
    samples: 12,
    keepYOrder: true,
    xCandidates: [[0.18, 0.58], [0.22, 0.64], [0.26, 0.7], [0.3, 0.76], [0.34, 0.82]]
  });
  if ((tail.linearization ?? 0) > 1e-9) {
    const line = lineBezierSegment(cornerPoint, joinPoint);
    segment.c1 = lerpPoint(segment.c1, line.c1, tail.linearization);
    segment.c2 = lerpPoint(segment.c2, line.c2, tail.linearization);
  }
  return segment;
}

function buildOpenNotchedTailSpline(tail, forwardBase, board = null) {
  if (!tail.notched || tail.capMode || !forwardBase.length) return null;
  const cornerWidth = tailOuterHalfWidthAt(tail, 0, tail.length);
  if (!(cornerWidth > 1e-6)) return null;
  const notchPoint = { x: tail.depth, y: 0 };
  const cornerPoint = { x: 0, y: cornerWidth };
  const joinPoint = { ...forwardBase[0] };
  const inner = x => tailInnerHalfWidthAt(tail, x + tail.length);
  const outer = x => tailOuterHalfWidthAt(tail, x + tail.length, tail.length);
  const innerCandidates = tail.mode === "fish"
    ? [[0.06, 0.14], [0.08, 0.18], [0.1, 0.22], [0.12, 0.28], [0.16, 0.36]]
    : [[0.06, 0.24], [0.08, 0.28], [0.1, 0.32], [0.14, 0.38], [0.18, 0.46]];
  const outerCandidates = tail.mode === "fish"
    ? [[0.16, 0.26], [0.18, 0.28], [0.22, 0.3], [0.24, 0.34], [0.28, 0.38]]
    : [[0.08, 0.16], [0.1, 0.18], [0.12, 0.22], [0.16, 0.28], [0.2, 0.34]];
  let segments;
  if (tail.mode === "swallow") {
    const innerDx = cornerPoint.x - notchPoint.x;
    const outerDx = joinPoint.x - cornerPoint.x;
    const innerSlope = (cornerPoint.y - notchPoint.y) / (Math.abs(innerDx) > 1e-9 ? innerDx : -1e-9);
    const outerSlope = (joinPoint.y - cornerPoint.y) / (Math.abs(outerDx) > 1e-9 ? outerDx : 1e-9);
    segments = [
      tangentBezierSegment(notchPoint, cornerPoint, innerSlope * 0.86, innerSlope * 1.06, {
        c1Ratio: 0.28,
        c2Ratio: 0.72,
        linearization: tail.linearization
      }),
      fitBezierSegmentToSamples(cornerPoint, joinPoint, outer, {
        samples: 8,
        xCandidates: [[0.12, 0.5], [0.16, 0.58], [0.2, 0.66], [0.24, 0.74], [0.28, 0.82]]
      })
    ];
    enforceBezierSegmentEndSlope(segments[1], tail.joinSlope);
  } else if (tail.mode === "fish") {
    const outerAverageSlope = (joinPoint.y - cornerPoint.y) / Math.max(1e-9, joinPoint.x - cornerPoint.x);
    const fishInnerCurve = buildFishNoseTemplateInnerSegment(board, tail, notchPoint, cornerPoint)
      || tangentBezierSegment(notchPoint, cornerPoint, -cornerPoint.y / Math.max(1e-9, tail.depth), 0, {
        c1Ratio: 0.24,
        c2Ratio: 0.72,
        linearization: tail.linearization
      });
    segments = [
      fishInnerCurve,
      buildFishNoseTemplateOuterSegment(board, tail, cornerPoint, joinPoint) || tangentBezierSegment(cornerPoint, joinPoint, outerAverageSlope * 0.34, tail.joinSlope, {
        c1Ratio: 0.22,
        c2Ratio: 0.68,
        linearization: tail.linearization
      })
    ];
    enforceBezierSegmentEndSlope(segments[1], tail.joinSlope);
  } else {
    segments = [
      fitBezierSegmentToSamples(notchPoint, cornerPoint, inner, { samples: 7, xCandidates: innerCandidates }),
      fitBezierSegmentToSamples(cornerPoint, joinPoint, outer, { samples: 8, xCandidates: outerCandidates })
    ];
    enforceBezierSegmentStartSlope(segments[0], 0);
    enforceBezierSegmentEndSlope(segments[1], tail.joinSlope);
  }
  return spliceTailSplineIntoBase(splineFromBezierSegments(segments), splineFromOrderedPoints(forwardBase));
}

function buildBatTailSpline(tail, forwardBase) {
  if (tail.mode !== "bat" || !tail.notched || !tail.capMode || !forwardBase.length) return null;
  const tipWidth = tailOuterHalfWidthAt(tail, 0, tail.tipLength || tail.length);
  if (!(tail.depth > 1e-6) || !(tipWidth > 1e-6)) return null;
  const joinPoint = { ...forwardBase[0] };
  const lobeWidth = Math.max(tipWidth, joinPoint.y * 0.94);
  const centerTip = { x: 0, y: 0 };
  const scoopPoint = { x: tail.depth, y: lobeWidth * 0.5 };
  const lobePoint = { x: 0, y: lobeWidth };
  const centerToScoop = verticalWaveBezierSegment(centerTip, scoopPoint, tail.depth);
  const scoopToLobe = verticalWaveBezierSegment(scoopPoint, lobePoint, tail.depth);
  const outerSegment = {
    start: lobePoint,
    c1: { x: tail.depth * 0.2, y: lerp(lobePoint.y, joinPoint.y, 0.28) },
    c2: {
      x: lerp(lobePoint.x, joinPoint.x, 0.7),
      y: joinPoint.y - (tail.joinSlope * joinPoint.x * 0.3)
    },
    end: joinPoint
  };
  if ((tail.linearization ?? 0) > 1e-9) {
    const centerLine = lineBezierSegment(centerTip, scoopPoint);
    const lobeLine = lineBezierSegment(scoopPoint, lobePoint);
    centerToScoop.c1 = lerpPoint(centerToScoop.c1, centerLine.c1, tail.linearization);
    centerToScoop.c2 = lerpPoint(centerToScoop.c2, centerLine.c2, tail.linearization);
    scoopToLobe.c1 = lerpPoint(scoopToLobe.c1, lobeLine.c1, tail.linearization);
    scoopToLobe.c2 = lerpPoint(scoopToLobe.c2, lobeLine.c2, tail.linearization);
  }
  return spliceTailSplineIntoBase(splineFromBezierSegments([
    clampBezierSegmentVertical(centerToScoop),
    clampBezierSegmentVertical(scoopToLobe),
    outerSegment
  ]), splineFromOrderedPoints(forwardBase));
}

function buildSplitTailSpline(tail, forwardBase) {
  if (tail.mode !== "split" || !tail.notched || !tail.capMode || !forwardBase.length) return null;
  const tipWidth = tailOuterHalfWidthAt(tail, 0, tail.tipLength || tail.length);
  if (!(tail.depth > 1e-6) || !(tipWidth > 1e-6)) return null;
  const joinPoint = { ...forwardBase[0] };
  const notchPoint = { x: tail.depth, y: 0 };
  const cornerPoint = { x: 0, y: tipWidth };
  const innerSegment = {
    start: notchPoint,
    c1: {
      x: lerp(notchPoint.x, cornerPoint.x, 0.1),
      y: cornerPoint.y * 0.25
    },
    c2: {
      x: lerp(notchPoint.x, cornerPoint.x, 0.5),
      y: cornerPoint.y * 0.95
    },
    end: cornerPoint
  };
  if ((tail.linearization ?? 0) > 1e-9) {
    const line = lineBezierSegment(notchPoint, cornerPoint);
    innerSegment.c1 = lerpPoint(innerSegment.c1, line.c1, tail.linearization);
    innerSegment.c2 = lerpPoint(innerSegment.c2, line.c2, tail.linearization);
  }
  const outerSegment = fitBezierSegmentToSamples(cornerPoint, joinPoint, x => tailOuterHalfWidthAt(tail, x, tail.tipLength || tail.length), {
    samples: 8,
    xCandidates: [[0.14, 0.54], [0.18, 0.62], [0.22, 0.7], [0.26, 0.78]]
  });
  enforceBezierSegmentEndSlope(outerSegment, tail.joinSlope);
  return spliceTailSplineIntoBase(splineFromBezierSegments([
    clampBezierSegmentVertical(innerSegment),
    outerSegment
  ]), splineFromOrderedPoints(forwardBase));
}

function buildHalfMoonTailSpline(tail, forwardBase) {
  if (tail.mode !== "half-moon" || !tail.notched || !tail.capMode || !forwardBase.length) return null;
  const tipWidth = tailOuterHalfWidthAt(tail, 0, tail.tipLength || tail.length);
  if (!(tail.depth > 1e-6) || !(tipWidth > 1e-6)) return null;
  const joinPoint = { ...forwardBase[0] };
  const notchPoint = { x: tail.depth, y: 0 };
  const cornerPoint = { x: 0, y: tipWidth };
  const innerSegment = {
    start: notchPoint,
    c1: {
      x: notchPoint.x,
      y: tipWidth * 0.52
    },
    c2: {
      x: tail.depth * 0.52,
      y: tipWidth * 0.96
    },
    end: cornerPoint
  };
  if ((tail.linearization ?? 0) > 1e-9) {
    const line = lineBezierSegment(notchPoint, cornerPoint);
    innerSegment.c1 = lerpPoint(innerSegment.c1, line.c1, tail.linearization);
    innerSegment.c2 = lerpPoint(innerSegment.c2, line.c2, tail.linearization);
  }
  const outerSegment = fitBezierSegmentToSamples(cornerPoint, joinPoint, x => tailOuterHalfWidthAt(tail, x, tail.tipLength || tail.length), {
    samples: 8,
    xCandidates: [[0.14, 0.52], [0.18, 0.6], [0.22, 0.68], [0.26, 0.76]]
  });
  enforceBezierSegmentEndSlope(outerSegment, tail.joinSlope);
  return spliceTailSplineIntoBase(splineFromBezierSegments([
    clampBezierSegmentVertical(innerSegment),
    outerSegment
  ]), splineFromOrderedPoints(forwardBase));
}

function verticalWaveBezierSegment(start, end, depth) {
  const tailHandleX = Math.max(0.001, depth * 0.2);
  return {
    start,
    c1: { x: Math.abs(start.x) <= 1e-9 ? tailHandleX : start.x, y: lerp(start.y, end.y, 1 / 3) },
    c2: { x: Math.abs(end.x) <= 1e-9 ? tailHandleX : end.x, y: lerp(start.y, end.y, 2 / 3) },
    end
  };
}

function buildStarTailSpline(tail, forwardBase) {
  if (tail.mode !== "star" || !tail.notched || !tail.capMode || !forwardBase.length) return null;
  const joinPoint = { ...forwardBase[0] };
  if (!(tail.depth > 1e-6) || !(joinPoint.y > 1e-6)) return null;
  const lobeWidth = joinPoint.y * 0.94;
  const points = [
    { x: tail.depth, y: 0 },
    { x: 0, y: lobeWidth * 0.34 },
    { x: tail.depth * 0.9, y: lobeWidth * 0.66 },
    { x: 0, y: lobeWidth }
  ];
  const segments = [];
  for (let i = 1; i < points.length; i++) segments.push(verticalWaveBezierSegment(points[i - 1], points[i], tail.depth));
  const outerLobe = points[points.length - 1];
  segments.push({
    start: outerLobe,
    c1: { x: tail.depth * 0.2, y: lerp(outerLobe.y, joinPoint.y, 0.28) },
    c2: {
      x: lerp(outerLobe.x, joinPoint.x, 0.7),
      y: joinPoint.y - (tail.joinSlope * joinPoint.x * 0.3)
    },
    end: joinPoint
  });
  return spliceTailSplineIntoBase(splineFromBezierSegments(segments), splineFromOrderedPoints(forwardBase));
}

function shiftOutlinePoints(points, shift) {
  if (Math.abs(shift) <= 1e-9) return points.map(point => ({ x: point.x, y: point.y }));
  return points.map(point => ({ x: point.x - shift, y: point.y }));
}

function flattenOutlineSplines(upperSpline, lowerSpline, segments = getSegments()) {
  const splitCount = Math.max(12, segments);
  const upper = flattenSpline(upperSpline, splitCount);
  const lower = flattenSpline(lowerSpline, splitCount);
  const upperNose = upper[upper.length - 1];
  const lowerNose = lower[0];
  const sharedNosePoint = upperNose && lowerNose && samePoint(upperNose, lowerNose);
  const full = dedupeConsecutivePoints(upper.concat(lower.slice(sharedNosePoint ? 1 : 0)));
  if (full.length && Math.hypot(full[full.length - 1].x - full[0].x, full[full.length - 1].y - full[0].y) > 1e-9) {
    full.push({ ...full[0] });
  }
  return full;
}

function boardCadTailOnlyPlanform(board, segments = getSegments()) {
  const cacheKey = [
    state.geometryRevision,
    segments,
    Number(board?.length || 0).toFixed(4),
    board?.outline?.length || 0,
    String(board?.wingPreset || ""),
    Number(board?.wingPosition || 0).toFixed(4),
    Number(board?.wingWidth || 0).toFixed(4),
    String(board?.wingShape || ""),
    String(normalizeTailModeKey(board?.tailMode || "")),
    Number(board?.tailLength || 0).toFixed(4),
    Number(board?.tailDepth || 0).toFixed(4),
    Number(board?.tailShoulderPos || 0).toFixed(4),
    Number(board?.tailShoulderScale || 0).toFixed(4),
    Number(board?.tailRailBlend || 0).toFixed(4),
    Number(board?.tailLinearization || 0).toFixed(4),
    Number(board?.tailWidthAdjust || 0).toFixed(4)
  ].join(":");
  const cached = board && state.tailOnlyPlanformCache.get(board);
  if (cached && cached.key === cacheKey) return cached.value;
  const baseHalf = wingAdjustedOutlineHalfPoints(board, segments);
  const tail = normalizedTailConfig(board, baseHalf);
  let result;
  if (!tail.active) {
    const positiveSpline = splineFromOrderedPoints(baseHalf);
    const mirroredSpline = mirrorSplineYReverse(positiveSpline);
    result = {
      active: false,
      tail,
      baseHalf,
      forwardBase: baseHalf,
      positive: baseHalf,
      positiveSpline,
      mirroredSpline,
      full: flattenOutlineSplines(positiveSpline, mirroredSpline, segments)
    };
    if (board) state.tailOnlyPlanformCache.set(board, { key: cacheKey, value: result });
    return result;
  }

  const rawJoinX = Number.isFinite(tail.rawJoinX) && tail.rawJoinX > 0 ? tail.rawJoinX : tail.length;
  const forwardBase = shiftOutlinePoints(monotonicPolylineFromX(baseHalf, rawJoinX), tail.shift);
  const lowKnotGunSpline = buildGunTailSpline(board, tail, forwardBase);
  const lowKnotSpline = lowKnotGunSpline || buildCapTailSpline(tail, forwardBase);
  const lowKnotOpenNotchedSpline = buildOpenNotchedTailSpline(tail, forwardBase, board);
  const lowKnotHalfMoonSpline = buildHalfMoonTailSpline(tail, forwardBase);
  const lowKnotSplitSpline = buildSplitTailSpline(tail, forwardBase);
  const lowKnotBatSpline = buildBatTailSpline(tail, forwardBase);
  const lowKnotStarSpline = buildStarTailSpline(tail, forwardBase);
  const lowKnotPlanformSpline = lowKnotSpline || lowKnotOpenNotchedSpline || lowKnotHalfMoonSpline || lowKnotSplitSpline || lowKnotBatSpline || lowKnotStarSpline;
  if (lowKnotPlanformSpline) {
    const mirroredSpline = mirrorSplineYReverse(lowKnotPlanformSpline);
    const full = flattenOutlineSplines(lowKnotPlanformSpline, mirroredSpline, segments);
    result = {
      active: true,
      tail,
      baseHalf,
      forwardBase,
      positive: dedupeConsecutivePoints(flattenSpline(lowKnotPlanformSpline, Math.max(8, segments))),
      positiveSpline: lowKnotPlanformSpline,
      mirroredSpline,
      full
    };
    if (board) state.tailOnlyPlanformCache.set(board, { key: cacheKey, value: result });
    return result;
  }

  const positive = [];
  if (tail.capMode && !tail.notched) {
    const steps = Math.max(24, Math.min(48, Math.ceil((tail.tipLength || tail.length) * 3)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = tail.tipLength * t;
      positive.push({
        x,
        y: tailOuterHalfWidthAt(tail, x, tail.tipLength)
      });
    }
  } else if (tail.capMode && tail.notched) {
    const innerSteps = Math.max(12, Math.min(28, Math.ceil(tail.depth * 2.5)));
    const outerSteps = Math.max(18, Math.min(42, Math.ceil((tail.tipLength || tail.length) * 3)));
    positive.push({ x: tail.depth, y: 0 });
    for (let i = 1; i <= innerSteps; i++) {
      const t = i / innerSteps;
      const x = lerp(tail.depth, 0, t);
      positive.push({
        x,
        y: tailInnerHalfWidthAt(tail, x)
      });
    }
    for (let i = 1; i <= outerSteps; i++) {
      const t = i / outerSteps;
      const x = tail.tipLength * t;
      positive.push({
        x,
        y: tailOuterHalfWidthAt(tail, x, tail.tipLength)
      });
    }
  } else if (!tail.notched) {
    positive.push({ x: 0, y: tailOuterHalfWidthAt(tail, 0, tail.length) });
  } else {
    const innerSteps = 18;
    const outerSteps = Math.max(18, Math.min(42, Math.ceil(tail.length * 3)));
    positive.push({ x: tail.depth, y: 0 });
    for (let i = 1; i <= innerSteps; i++) {
      const t = i / innerSteps;
      const x = lerp(tail.depth, 0, t);
      positive.push({
        x,
        y: tailInnerHalfWidthAt(tail, x)
      });
    }
    positive.push({ x: 0, y: tailOuterHalfWidthAt(tail, 0, tail.length) });
    for (let i = 1; i <= outerSteps; i++) {
      const t = i / outerSteps;
      const x = tail.length * t;
      positive.push({
        x,
        y: tailOuterHalfWidthAt(tail, x, tail.length)
      });
    }
  }
  // Tag the junction point between the tail shape and the forward outline so
  // splineFromOrderedPoints can produce a corner (C0) instead of a smooth
  // tangent (C1).  A smooth join forces a single averaged tangent across the
  // shape boundary where the curvature changes abruptly, which causes the
  // cubic Bézier to overshoot and produce a visible spike on the rail.
  const joinX = positive.length > 0 ? positive[positive.length - 1].x : -1;
  forwardBase.slice(1).forEach(point => positive.push(point));
  const cleanPositive = dedupeConsecutivePoints(positive);
  const positiveSpline = splineFromOrderedPoints(cleanPositive);
  // Break C1 continuity at the tail→outline join point.
  // Keep each side's original control-point handles (set by
  // splineFromOrderedPoints); only mark as non-continuous so the
  // Bézier evaluator treats prev/next as independent.
  if (joinX >= 0) {
    for (let ki = 0; ki < positiveSpline.length; ki++) {
      if (Math.abs(positiveSpline[ki].p.x - joinX) < 0.5) {
        positiveSpline[ki].continuous = false;
        break;
      }
    }
  }
  const mirroredSpline = mirrorSplineYReverse(positiveSpline);
  const full = flattenOutlineSplines(positiveSpline, mirroredSpline, segments);
  result = {
    active: true,
    tail,
    baseHalf,
    forwardBase,
    positive: cleanPositive,
    positiveSpline,
    mirroredSpline,
    full
  };
  if (board) state.tailOnlyPlanformCache.set(board, { key: cacheKey, value: result });
  return result;
}

function noseTailModeKey(mode) {
  const key = normalizeNoseModeKey(mode);
  if (key === "gun") return "gun";
  if (key === "pin") return "pin";
  if (key === "round-point") return "round-pin";
  if (key === "wide") return "round-pin";
  if (key === "round") return "round";
  if (key === "diamond") return "diamond";
  if (key === "snub") return "rounded-square";
  if (key === "square") return "square";
  return "";
}

function reverseSplineAcrossLength(knots, length) {
  return boardCadCloneKnots(knots || []).reverse().map(knot => ({
    ...knot,
    p: { x: length - knot.p.x, y: knot.p.y },
    prev: { x: length - knot.next.x, y: knot.next.y },
    next: { x: length - knot.prev.x, y: knot.prev.y }
  }));
}

function normalizedNoseConfig(board) {
  const mode = normalizeNoseModeKey(board?.noseMode);
  const tailMode = noseTailModeKey(mode);
  const preset = nosePresetForBoard(mode, board);
  if (!mode || !tailMode || !preset) {
    return {
      active: false,
      mode: "",
      tailMode: "",
      length: 0,
      shoulderPos: 0,
      shoulderScale: 0,
      railBlend: 0,
      linearization: 0,
      widthAdjust: 0,
      widthScale: 1
    };
  }
  const maxLength = Math.max(1, (Number(board?.length) || 0) * 0.25);
  const rawLength = Number(board?.noseLength);
  const rawShoulderPos = Number(board?.noseShoulderPos);
  const rawShoulderScale = Number(board?.noseShoulderScale);
  const rawRailBlend = Number(board?.noseRailBlend);
  const rawLinearization = Number(board?.noseLinearization);
  const widthAdjust = clampNumber(board?.noseWidthAdjust, -1, 1, 0);
  return {
    active: true,
    mode,
    tailMode,
    length: Number.isFinite(rawLength) && rawLength >= 0.5 ? clampNumber(rawLength, 0.5, maxLength, preset.length) : preset.length,
    shoulderPos: Number.isFinite(rawShoulderPos) && rawShoulderPos >= 0.12 ? clampNumber(rawShoulderPos, 0.12, 0.88, preset.shoulderPos) : preset.shoulderPos,
    shoulderScale: Number.isFinite(rawShoulderScale) && rawShoulderScale >= 0.05 ? clampNumber(rawShoulderScale, 0.05, 1.35, preset.shoulderScale) : preset.shoulderScale,
    railBlend: Number.isFinite(rawRailBlend) && rawRailBlend > 0 ? clampNumber(rawRailBlend, 0, 2.5, preset.railBlend) : preset.railBlend,
    linearization: Number.isFinite(rawLinearization) ? clampNumber(rawLinearization, 0, 1, preset.linearization ?? 0) : preset.linearization ?? 0,
    widthAdjust,
    widthScale: widthAdjustScale(widthAdjust)
  };
}

/**
 * Merge a tail spline, a mid-outline section and a nose spline into one
 * continuous planform spline.  The two join points (tailJoinX, noseJoinX)
 * are marked as C0 corners (no tangent averaging) so neither the tail nor
 * the nose shape overshoot the outline at the join.
 *
 * @param {Array}  tailSpline  - positiveSpline from boardCadTailOnlyPlanform
 * @param {Array}  baseHalf    - sampled outline half-points (board coords)
 * @param {Array}  noseSpline  - spline from boardCadNoseOnlyPlanform
 * @param {number} tailJoinX   - board-coord X where tail shape ends
 * @param {number} noseJoinX   - board-coord X where nose shape begins
 */
function mergeOutlineWithCorners(tailSpline, baseHalf, noseSpline, tailJoinX, noseJoinX) {
  const beforeNose = tailSpline.filter(k => k.p.x < noseJoinX - 0.5);
  const noseKnots  = noseSpline.filter(k => k.p.x >= noseJoinX - 0.5);
  if (noseKnots.length === 0) return tailSpline;

  // At the join, preserve each spline's own control-point handles:
  // - beforeNose's last knot keeps its original "next" handle (from the
  //   tail+base spline — its tangent points along the outline rail).
  // - noseKnots' first knot keeps its original "prev" handle (from the
  //   nose builder — its tangent follows the nose shape's entry curve).
  // Only break C1 continuity (set continuous = false) so the Bézier
  // evaluator doesn't try to mirror the handles across the join.
  if (beforeNose.length > 0) {
    beforeNose[beforeNose.length - 1].continuous = false;
    // .next handle already set by splineFromOrderedPoints — keep as-is.
  }
  if (noseKnots.length > 0) {
    noseKnots[0].continuous = false;
    // .prev handle already set by boardCadNoseOnlyPlanform — keep as-is.
  }

  return [...beforeNose, ...noseKnots];
}

/**
 * Compute the nose portion of the outline planform directly, without
 * the "flip–tail–unflip" path used by the old implementation.
 *
 * The strategy:
 *   1. Express the nose zone in a local coordinate system where
 *      the nose tip is at x=0 and x increases toward the tail.
 *      In board coordinates noseLocalX = boardLength − x.
 *   2. Build a synthetic tail-style config from normalizedNoseConfig so
 *      all existing shape builders (buildCapTailSpline etc.) can be
 *      reused without modification.
 *   3. Re-map the resulting spline back to board coordinates.
 *   4. Return a result object shaped like boardCadTailOnlyPlanform's
 *      result but covering only the nose zone, so the caller can merge
 *      it at noseJoinX without any reversal.
 *
 * Returns null when no nose mode is active.
 */
function boardCadNoseOnlyPlanform(board, segments, baseHalf) {
  const nose = normalizedNoseConfig(board);
  if (!nose.active) return null;

  const boardLength = Number(board?.length) || 0;

  // ── 1. Build a tail-style config in the local (flipped) frame ──────
  // baseHalf is already in board coords (x from tail end toward nose end).
  // joinX in board coords = boardLength − nose.length.
  const noseJoinX = boardLength - nose.length;
  if (noseJoinX < 0) return null;

  const widthScale = widthAdjustScale(nose.widthAdjust);

  // joinY: outline half-width at the nose join point, scaled by widthAdjust.
  const joinY = Math.max(0, interpolatePolyline(baseHalf, noseJoinX)) * widthScale;
  if (joinY < 1e-6) return null;

  // The preset for the mapped tail mode.
  const tailModeKey = noseTailModeKey(nose.mode);
  if (!tailModeKey) return null;
  const tailPreset = TAIL_MODE_PRESETS[tailModeKey];
  if (!tailPreset) return null;

  const shoulderScale = clampNumber(
    (nose.shoulderScale || tailPreset.shoulderScale) * widthScale,
    0.01, 5.4, nose.shoulderScale || tailPreset.shoulderScale
  );
  const capLength = nose.length;
  const tipScale  = clampNumber(
    (tailPreset.tipScale ?? 0) * widthScale,
    0, Math.max(0, shoulderScale - 0.002), tailPreset.tipScale ?? 0
  );
  const tipRatio  = tailPreset.tipRatio ?? 0;
  const tipLength = capLength * tipRatio;

  // Slope at the join point (re-used from buildCapTailSpline convention).
  // We use the outline slope at noseJoinX in local coords.
  const joinSlopeMix    = tailPreset.joinSlopeMix ?? 1;
  const joinSlopeFactor = tailPreset.joinSlopeFactor ?? 1;
  // Approximate outline slope at the join (board coords, dy/dx).
  const slopeProbeOffset = Math.min(2, capLength * 0.05);
  const slopeY0 = Math.max(0, interpolatePolyline(baseHalf, noseJoinX - slopeProbeOffset));
  const slopeY1 = Math.max(0, interpolatePolyline(baseHalf, noseJoinX + slopeProbeOffset));
  // In local coords x goes the other way, so slope sign flips.
  const rawJoinSlope = Math.abs(slopeY1 - slopeY0) / Math.max(1e-9, slopeProbeOffset * 2);
  const joinSlope    = clampNumber(rawJoinSlope * joinSlopeFactor, 0, 2, rawJoinSlope);

  const noseTail = {
    active: true,
    mode: tailModeKey,
    outerMode: tailPreset.outerMode || "hermite",
    length: capLength,
    depth: 0,
    tipLength,
    tipScale,
    tipRatio,
    capMode: tipRatio > 0,
    notched: false,
    joinY,
    joinSlope,
    joinSlopeMix,
    joinSlopeFactor,
    shoulderPos:    nose.shoulderPos   || tailPreset.shoulderPos,
    shoulderScale,
    railBlend:      nose.railBlend     || tailPreset.railBlend,
    linearization:  nose.linearization ?? tailPreset.linearization ?? 0,
    widthAdjust:    nose.widthAdjust,
    widthScale,
    cornerScale:    tailPreset.cornerScale  ?? 1,
    tipSlopeFactor: tailPreset.tipSlopeFactor ?? 1,
    shoulderSlopeFactor: tailPreset.shoulderSlopeFactor ?? 1,
    tipBow:   tailPreset.tipBow  ?? 0,
    railBow:  tailPreset.railBow ?? 0,
    shift: 0,
    rawJoinX: capLength,
    innerPower: 1.55,
    cutLength: 0
  };

  // forwardBase in local coords: from joinX (=capLength) toward tip (=0).
  // Only the first point matters for the builders; they read forwardBase[0]
  // as the "rail" anchor.
  const localForwardBase = [{ x: capLength, y: joinY }];

  // ── 2. Build the shape in local coords using existing builders ──────
  const localSpline =
    buildGunTailSpline({ ...board, tailMode: tailModeKey }, noseTail, localForwardBase)
    || buildCapTailSpline(noseTail, localForwardBase);

  if (!localSpline || !localSpline.length) return null;

  // ── 3. Map local coords back to board coords ─────────────────────────
  // Local x=0 → board x=boardLength (nose tip)
  // Local x=capLength → board x=noseJoinX
  // y is unchanged; the spline direction reverses so we reverse the array.
  const boardSpline = localSpline
    .map(knot => ({
      ...knot,
      p:    { x: boardLength - knot.p.x,    y: knot.p.y },
      // prev/next are control handles; reversing x direction means
      // prev↔next swap AND x is negated relative to p.
      prev: { x: boardLength - knot.next.x, y: knot.next.y },
      next: { x: boardLength - knot.prev.x, y: knot.prev.y },
      continuous: knot.continuous
    }))
    .reverse();

  return {
    noseTail,
    noseJoinX,
    joinY,
    spline: boardSpline
  };
}

function boardCadTailPlanform(board, segments = getSegments()) {
  const nose = normalizedNoseConfig(board);
  const cacheKey = [
    state.geometryRevision,
    segments,
    String(normalizeTailModeKey(board?.tailMode || "")),
    Number(board?.tailLength || 0).toFixed(4),
    Number(board?.tailDepth || 0).toFixed(4),
    Number(board?.tailShoulderPos || 0).toFixed(4),
    Number(board?.tailShoulderScale || 0).toFixed(4),
    Number(board?.tailRailBlend || 0).toFixed(4),
    Number(board?.tailLinearization || 0).toFixed(4),
    Number(board?.tailWidthAdjust || 0).toFixed(4),
    String(board?.wingPreset || ""),
    Number(board?.wingPosition || 0).toFixed(4),
    Number(board?.wingWidth || 0).toFixed(4),
    nose.mode,
    nose.length.toFixed(4),
    nose.shoulderPos.toFixed(4),
    nose.shoulderScale.toFixed(4),
    nose.railBlend.toFixed(4),
    nose.linearization.toFixed(4),
    nose.widthAdjust.toFixed(4)
  ].join(":");
  const cached = board && state.tailPlanformCache.get(board);
  if (cached && cached.key === cacheKey) return cached.value;

  const base = boardCadTailOnlyPlanform(board, segments);
  if (!nose.active || !base.positiveSpline.length) {
    const result = { ...base, nose };
    if (board) state.tailPlanformCache.set(board, { key: cacheKey, value: result });
    return result;
  }

  const baseHalf = base.baseHalf || wingAdjustedOutlineHalfPoints(board, segments);
  const noseResult = boardCadNoseOnlyPlanform(board, segments, baseHalf);

  let positiveSpline, mirroredSpline, positive, noseInfo;

  if (!noseResult) {
    // Fallback to reverse-flip path for unsupported nose modes.
    const baseLength = Math.max(0, ...base.positiveSpline.map(knot => knot.p.x));
    const reversedOutline = reverseSplineAcrossLength(base.positiveSpline, baseLength);
    const noseBoard = {
      ...board,
      length: baseLength,
      outline: reversedOutline,
      outlineGuidePoints: [],
      wingPreset: "", wingPosition: 0, wingWidth: 0,
      wingShape: "", wingShoulder: 0, wingTransition: 0,
      bottomFeatures: normalizeBottomFeatures(board.bottomFeatures),
      tailMode: nose.tailMode,
      tailLength: nose.length, tailDepth: 0,
      tailShoulderPos: nose.shoulderPos, tailShoulderScale: nose.shoulderScale,
      tailRailBlend: nose.railBlend, tailLinearization: nose.linearization,
      tailWidthAdjust: nose.widthAdjust
    };
    const reversedPlanform = boardCadTailOnlyPlanform(noseBoard, segments);
    const finalLength = Math.max(0, ...reversedPlanform.positiveSpline.map(knot => knot.p.x));
    positiveSpline = reverseSplineAcrossLength(reversedPlanform.positiveSpline, finalLength);
    noseInfo = { ...nose, tail: reversedPlanform.tail, sourceLength: baseLength, displayLength: finalLength };
  } else {
    positiveSpline = mergeOutlineWithCorners(
      base.positiveSpline,
      baseHalf,
      noseResult.spline,
      base.tail.rawJoinX || base.tail.length,
      noseResult.noseJoinX
    );
    const boardLength = Number(board?.length) || 0;
    noseInfo = { ...nose, tail: noseResult.noseTail, sourceLength: noseResult.noseJoinX, displayLength: boardLength };
  }

  mirroredSpline = mirrorSplineYReverse(positiveSpline);
  positive = dedupeConsecutivePoints(flattenSpline(positiveSpline, Math.max(8, segments)));
  const result = {
    ...base,
    active: true,
    nose: noseInfo,
    positive,
    positiveSpline,
    mirroredSpline,
    full: flattenOutlineSplines(positiveSpline, mirroredSpline, segments)
  };
  if (board) state.tailPlanformCache.set(board, { key: cacheKey, value: result });
  return result;
}

function outlineFullPoints(board) {
  return boardCadTailPlanform(board).full;
}

function outlineSplineParts(board, segments = getSegments()) {
  const planform = boardCadTailPlanform(board, segments);
  return {
    upper: planform.positiveSpline,
    lower: planform.mirroredSpline
  };
}

function boardCadTailDisplayShift(board) {
  const tail = boardCadTailPlanform(board).tail;
  return tail.active ? tail.shift : 0;
}

function boardCadTailDisplayLength(board) {
  const planform = boardCadTailPlanform(board);
  return Math.max(0, ...((planform.positiveSpline || []).map(knot => knot.p.x)));
}

function boardCadDisplayBoard(board) {
  if (!board) return board;
  const displayLength = boardCadTailDisplayLength(board);
  return Math.abs(displayLength - (Number(board.length) || 0)) <= 1e-9 ? board : { ...board, length: displayLength };
}

function boardCadRawXFromDisplayX(board, x) {
  const displayLength = Math.max(0, boardCadTailDisplayLength(board));
  const clampedX = clampNumber(x, 0, displayLength, 0);
  return clampNumber(clampedX + boardCadTailDisplayShift(board), 0, Number(board?.length) || displayLength, 0);
}

function boardCadDisplayXFromRawX(board, x) {
  return clampNumber(x - boardCadTailDisplayShift(board), 0, boardCadTailDisplayLength(board), 0);
}

function shiftPointsX(points = [], shift = 0) {
  if (!(shift > 1e-9)) return points.map(point => ({ x: point.x, y: point.y }));
  return points.map(point => ({ x: point.x - shift, y: point.y }));
}

function shiftTransformX(transform, shift = 0) {
  if (!(shift > 1e-9)) return transform;
  return {
    x: x => transform.x(x - shift),
    y: transform.y,
    invX: typeof transform.invX === "function" ? x => transform.invX(x) + shift : undefined,
    invY: typeof transform.invY === "function" ? transform.invY : undefined,
    scale: transform.scale
  };
}

function trimSplineFromX(knots, startX = 0) {
  return startX > 1e-9 ? trimHalfSplineFromX(knots, startX) : boardCadCloneKnots(knots);
}

function shiftSplineKnotsX(knots, shift = 0) {
  const shifted = boardCadCloneKnots(knots);
  if (!(shift > 1e-9)) return shifted;
  shifted.forEach(knot => {
    ["p", "prev", "next"].forEach(key => {
      if (knot[key]) knot[key].x -= shift;
    });
  });
  return shifted;
}

function boardCadSampleXPair(board, x) {
  const rawLength = Math.max(0, Number(board?.length) || 0);
  const rawMax = Math.max(0.1, rawLength - 0.1);
  const rawX = clampNumber(boardCadRawXFromDisplayX(board, x), 0.1, rawMax, Math.min(rawMax, Math.max(0.1, rawLength * 0.5)));
  return {
    rawX,
    displayX: boardCadDisplayXFromRawX(board, rawX)
  };
}

function boardCadInterpolatedDisplayCrossSectionKnots(board, x) {
  const { rawX, displayX } = boardCadSampleXPair(board, x);
  const displayCacheKey = `${state.crossSectionInterpolation}:${displayX.toFixed(4)}`;
  const displayCache = crossSectionCacheMap("display", board);
  if (displayCache.has(displayCacheKey)) return displayCache.get(displayCacheKey);
  const knots = boardCadInterpolatedCrossSectionKnots(board, rawX);
  if (!knots.length) return [];
  const scaled = boardCadCrossSectionScaleTo(
    knots,
    Math.max(0.5, boardCadThicknessAtPos(board, rawX)),
    Math.max(0.5, boardCadDisplayWidthAtPos(board, displayX))
  );
  displayCache.set(displayCacheKey, scaled);
  return scaled;
}

function boardCadBezierDisplayCrossSectionKnotsAt(board, x) {
  const { rawX, displayX } = boardCadSampleXPair(board, x);
  const knots = boardCadBezierCrossSectionKnotsAt(board, rawX);
  if (!knots.length) return [];
  return boardCadCrossSectionScaleTo(
    knots,
    Math.max(0.5, boardCadThicknessAtPos(board, rawX)),
    Math.max(0.5, boardCadDisplayWidthAtPos(board, displayX))
  );
}

function tailAdjustedProfileGeometry(board) {
  const shift = boardCadTailDisplayShift(board);
  const bottomKnots = trimSplineFromX(board.bottom, shift);
  const deckKnots = trimSplineFromX(board.deck, shift);
  const bottomRaw = flattenSpline(bottomKnots);
  const deckRaw = flattenSpline(deckKnots);
  return {
    shift,
    displayLength: boardCadTailDisplayLength(board),
    displayBoard: boardCadDisplayBoard(board),
    bottomKnots,
    deckKnots,
    bottomDisplayKnots: shiftSplineKnotsX(bottomKnots, shift),
    deckDisplayKnots: shiftSplineKnotsX(deckKnots, shift),
    bottomRaw,
    deckRaw,
    bottom: shiftPointsX(bottomRaw, shift),
    deck: shiftPointsX(deckRaw, shift)
  };
}

function profileSurfacePoints(board) {
  if (!board) return { bottom: [], deck: [] };
  const profile = tailAdjustedProfileGeometry(board);
  return {
    bottom: profile.bottom,
    deck: profile.deck
  };
}

function ghostDisplayPoints(board, points = []) {
  if (!board || !points?.length) return [];
  return points.map(point => ({
    x: boardCadDisplayXFromRawX(board, point.x),
    y: point.y
  }));
}

function transformedGhostOutlinePoints(board) {
  return transformGhostPoints(ghostDisplayPoints(board, outlineFullPoints(board)));
}

function transformedGhostProfilePoints(board) {
  const profile = profileSurfacePoints(board);
  return {
    bottom: transformGhostPoints(ghostDisplayPoints(board, profile.bottom)),
    deck: transformGhostPoints(ghostDisplayPoints(board, profile.deck))
  };
}

function nearestGhostSection(board, position) {
  if (!board?.sections?.length) return null;
  let nearest = board.sections[0];
  let bestDistance = Math.abs(nearest.position - position);
  for (let i = 1; i < board.sections.length; i++) {
    const distance = Math.abs(board.sections[i].position - position);
    if (distance < bestDistance) {
      nearest = board.sections[i];
      bestDistance = distance;
    }
  }
  return nearest;
}

function drawGhostPath(points, transform, color = "#8e8e93", width = 1.1, close = false) {
  if (!points?.length) return;
  ctx.save();
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = transform.x(point.x);
    const y = transform.y(point.y);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  if (close) ctx.closePath();
  ctx.setLineDash([7, 4]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = 0.96;
  ctx.stroke();
  ctx.restore();
}

function drawOutline(board, rect) {
  const profile = typeof window !== "undefined" && window.__boardcadProfileDraw;
  const now = () => {
    if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
    if (typeof Date !== "undefined" && typeof Date.now === "function") return Date.now();
    return 0;
  };
  const marks = [];
  const mark = label => {
    if (!profile) return;
    marks.push([label, now()]);
  };
  const flush = () => {
    if (!profile || typeof console === "undefined" || typeof console.log !== "function" || !marks.length) return;
    const parts = [];
    let prev = marks[0][1];
    parts.push(`${marks[0][0]}=0.00ms`);
    for (let i = 1; i < marks.length; i++) {
      const [label, ts] = marks[i];
      parts.push(`${label}=${(ts - prev).toFixed(2)}ms`);
      prev = ts;
    }
    console.log(`[outline-profile] ${parts.join(" ")}`);
  };
  mark("start");
  const renderBoard = boardWithPendingBottomFeaturePreview(board);
  mark("pending-preview");
  const planform = boardCadTailPlanform(renderBoard);
  mark("planform");
  const full = planform.full;
  const outlineShift = boardCadTailDisplayShift(renderBoard);
  const displayBoard = boardCadDisplayBoard(renderBoard);
  const ghostBoard = currentGhostBoard(renderBoard);
  const ghostBoardPoints = ghostBoard ? transformedGhostOutlinePoints(ghostBoard) : [];
  const ghost = scanGhostOutline();
  const ghostMirrored = ghost.slice().reverse().map(p => ({ x: p.x, y: -p.y }));
  mark("ghost");
  const points = full.concat(ghostBoardPoints, ghost, ghostMirrored);
  const fitPoints = (state.tool === "edit" && state.viewOptions.showControlPoints)
    ? points.concat(splineAnchorPoints(renderBoard.outline))
    : points;
  const transform = boardViewTransform(displayBoard, fitPoints, rect, 32, -Math.min(88, rect.height * 0.12));
  const rawTransform = shiftTransformX(transform, outlineShift);
  mark("transform");
  registerPointerTransform("outline", rawTransform, rect);
  drawTraceImage("outline", transform);
  mark("trace-image");
  if (!state.viewOptions.viewBlank) {
    drawPointSet(full, rect, { stroke: "#5ac8fa", fill: "rgba(90,200,250,.08)" }, transform);
    drawTailTransomLine(planform, transform, "#5ac8fa", 2);
  }
  mark("main-shape");
  if (ghostBoard) drawGhostPath(ghostBoardPoints, transform, "#b8c7d9", 1.35, true);
  drawContextToolpaths(renderBoard, transform, "outline");
  drawScanGhostOutline(ghost, transform);
  mark("ghost-and-toolpath");
  if (state.viewOptions.showCenterLine) drawCenterLine(boardCadTailDisplayLength(renderBoard), rect, points, transform);
  drawOutlineBottomFeatureRanges(renderBoard, transform, rect);
  mark("bottom-ranges");
  if (state.viewOptions.showCrossSectionPositions) drawCrossSectionPositionMarkers(renderBoard, transform, "outline");
  mark("cross-sections");
  if (state.viewOptions.showFlowlines) drawSurfaceAngleLines(renderBoard, transform, "outline", [10, 27.5, 45], "#5ac8fa");
  mark("flowlines");
  if (state.viewOptions.showApexLine) drawSurfaceAngleLines(renderBoard, transform, "outline", [90], "#30d158");
  mark("apex");
  if (state.viewOptions.showTuckUnderLine) drawSurfaceAngleLines(renderBoard, transform, "outline", [175], "#ff9f0a");
  mark("tuck");
  if (state.viewOptions.showCurvature) drawCurvatureComb(renderBoard.outline, rawTransform, 18, "#bf5af2");
  mark("curvature");
  if (state.viewOptions.showSlidingInfo) drawOutlineSlidingInfo(renderBoard, transform, rect);
  mark("sliding-info");
  if (state.viewOptions.showVolumeDistribution) drawVolumeDistribution(renderBoard, transform, "outline");
  mark("volume");
  if (state.viewOptions.showCenterOfMass) drawCenterOfMass(renderBoard, transform, "outline");
  mark("center-of-mass");
  if (state.viewOptions.showFootMarks) drawFootMarks(renderBoard, transform, "outline");
  mark("footmarks");
  if (state.viewOptions.showGuidePoints) {
    const visibleGuides = filterGuidePointsByX(renderBoard.outlineGuidePoints, outlineShift);
    drawGuidePoints(visibleGuides.points, rawTransform, "Outline", renderBoard.outlineGuidePoints, visibleGuides.indexMap);
  }
  mark("guide-points");
  setWingHandles(renderBoard, rawTransform);
  setBottomFeatureHandles(renderBoard, transform, "outline", rect);
  mark("set-handles");
  drawFins(renderBoard, rawTransform);
  drawWingHandles();
  if (state.viewOptions.showSlidingCrossSection) drawSlidingCrossSectionOnBoard(renderBoard, transform, "outline");
  mark("fins-wing-sliding");
  if (!state.viewOptions.viewBlank) {
    setEditHandles([{ label: "Outline", knots: renderBoard.outline }], rawTransform);
    drawEditHandles();
  }
  mark("edit-handles");
  drawBottomFeatureHandles(renderBoard, transform);
  mark("bottom-handles");
  flush();
}

function drawProfile(board, rect) {
  const renderBoard = boardWithPendingBottomFeaturePreview(board);
  const profile = tailAdjustedProfileGeometry(renderBoard);
  const bottom = profile.bottom;
  const deck = profile.deck;
  const rockerConfig = normalizeRockerConfig(renderBoard.rockerConfig, renderBoard.rockerPreset || renderBoard.rockerConfig?.preset);
  const rockerTargetRaw = rockerConfig.enabled ? rockerTargetCurvePoints(renderBoard, rockerConfig, getSegments()) : [];
  const rockerTargetDisplay = shiftPointsX(rockerTargetRaw, profile.shift)
    .filter(point => point.x >= -1e-9 && point.x <= profile.displayLength + 1e-9);
  const ghostBoard = currentGhostBoard(renderBoard);
  const ghostProfile = ghostBoard ? transformedGhostProfilePoints(ghostBoard) : { bottom: [], deck: [] };
  const ghost = scanGhostProfile();
  const points = bottom.concat(deck, rockerTargetDisplay, ghostProfile.bottom, ghostProfile.deck, ghost.bottom, ghost.deck);
  const fitPoints = (state.tool === "edit" && state.viewOptions.showControlPoints)
    ? points.concat(splineAnchorPoints(renderBoard.bottom), splineAnchorPoints(renderBoard.deck))
    : points;
  const transform = boardViewTransform(profile.displayBoard, fitPoints, rect, 36, -Math.min(88, rect.height * 0.12));
  const rawTransform = shiftTransformX(transform, profile.shift);
  registerPointerTransform("profile", rawTransform, rect);
  drawTraceImage("profile", rawTransform);
  if (!state.viewOptions.viewBlank) {
    drawPath(profile.bottomRaw, rawTransform, "#d1d1d6", 2);
    drawPath(profile.deckRaw, rawTransform, "#f0a35f", 2);
  }
  drawRockerTargetPreview(renderBoard, transform, profile, rockerTargetDisplay, rockerConfig);
  if (ghostBoard) {
    drawGhostPath(ghostProfile.bottom, transform, "#b8c7d9", 1.25);
    drawGhostPath(ghostProfile.deck, transform, "#b8c7d9", 1.25);
  }
  drawContextToolpaths(renderBoard, rawTransform, "profile");
  drawScanGhostProfile(ghost, transform);
  if (state.viewOptions.showBaseLine) drawBaseline(profile.displayBoard, transform);
  if (state.viewOptions.showCrossSectionPositions) drawCrossSectionPositionMarkers(renderBoard, transform, "profile");
  if (state.viewOptions.showFlowlines) drawSurfaceAngleLines(renderBoard, transform, "profile", [10, 27.5, 45], "#5ac8fa");
  if (state.viewOptions.showApexLine) drawSurfaceAngleLines(renderBoard, transform, "profile", [90], "#30d158");
  if (state.viewOptions.showTuckUnderLine) drawSurfaceAngleLines(renderBoard, transform, "profile", [175], "#ff9f0a");
  if (state.viewOptions.showCurvature) {
    drawCurvatureComb(profile.bottomKnots, rawTransform, 15, "#bf5af2");
    drawCurvatureComb(profile.deckKnots, rawTransform, 15, "#bf5af2");
  }
  if (state.viewOptions.showSlidingInfo) drawProfileSlidingInfo(renderBoard, transform, rect);
  if (state.viewOptions.showVolumeDistribution) drawVolumeDistribution(renderBoard, transform, "profile");
  if (state.viewOptions.showCenterOfMass) drawCenterOfMass(renderBoard, transform, "profile");
  if (state.viewOptions.showFootMarks) drawFootMarks(renderBoard, transform, "profile");
  if (state.viewOptions.showGuidePoints) {
    const visibleBottomGuides = filterGuidePointsByX(renderBoard.bottomGuidePoints, profile.shift);
    const visibleDeckGuides = filterGuidePointsByX(renderBoard.deckGuidePoints, profile.shift);
    drawGuidePoints(visibleBottomGuides.points, rawTransform, "Bottom", renderBoard.bottomGuidePoints, visibleBottomGuides.indexMap);
    drawGuidePoints(visibleDeckGuides.points, rawTransform, "Deck", renderBoard.deckGuidePoints, visibleDeckGuides.indexMap);
  }
  setBottomFeatureHandles(renderBoard, rawTransform, "profile");
  drawBottomFeatureHandles(renderBoard, rawTransform);
  if (state.viewOptions.showSlidingCrossSection) drawSlidingCrossSectionOnBoard(renderBoard, transform, "profile");
  label("Bottom", transform.x(8), transform.y(bottom[0]?.y || 0) - 12, "#d1d1d6");
  label("Deck", transform.x(8), transform.y((deck[0]?.y || 0) + 1), "#f0a35f");
  if (!state.viewOptions.viewBlank) {
    setEditHandles([
      { label: "Bottom", knots: renderBoard.bottom },
      { label: "Deck", knots: renderBoard.deck }
    ], rawTransform);
    drawEditHandles();
  }
}

function drawRockerTargetPreview(board, transform, profile, points = null, config = null) {
  const normalized = normalizeRockerConfig(config || board?.rockerConfig, board?.rockerPreset || config?.preset);
  if (!board || !normalized.enabled) return;
  const targetPoints = Array.isArray(points) ? points : shiftPointsX(rockerTargetCurvePoints(board, normalized, getSegments()), profile?.shift || 0);
  const visiblePoints = targetPoints.filter(point => point.x >= -1e-9 && point.x <= (profile?.displayLength || boardCadTailDisplayLength(board)) + 1e-9);
  if (visiblePoints.length < 2) return;
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.setLineDash([8, 5]);
  drawPath(visiblePoints, transform, "#64d2ff", 1.45);
  ctx.setLineDash([]);
  const mid = visiblePoints[Math.floor(visiblePoints.length * 0.55)];
  if (mid) label(rockerPresetLabel(normalized.preset), transform.x(mid.x) + 6, transform.y(mid.y) - 8, "#64d2ff");
  ctx.restore();
}

function contextToolpathSurfaces() {
  const surfaces = [];
  if (state.viewOptions.showBottomToolpath) surfaces.push("bottom");
  if (state.viewOptions.showDeckToolpath) surfaces.push("deck");
  return surfaces;
}

function activeTraceKey() {
  if ((state.view === "outline" || state.view === "profile") && els.traceTarget && els.traceTarget.value !== state.view) {
    els.traceTarget.value = state.view;
  }
  const value = els.traceTarget?.value;
  if (value === "profile") return "profile";
  return "outline";
}

function activeTraceImage() {
  return state.traceImages[activeTraceKey()] || null;
}

function defaultTracePlacement(key, image) {
  const board = state.board;
  const length = Math.max(1, board?.length || image.naturalWidth || 1);
  const scale = length / Math.max(1, image.naturalWidth || 1);
  let y = 0;
  if (key === "profile" && board) {
    const x = board.length * 0.5;
    y = (boardCadSplineValueAt(board.bottom, x) + boardCadSplineValueAt(board.deck, x)) * 0.5;
  }
  return {
    x: board ? board.length * 0.5 : length * 0.5,
    y,
    scale,
    rotation: 0,
    opacity: 0.45,
    visible: true
  };
}

function loadTraceImage(file) {
  if (!file || typeof Image === "undefined") return;
  const key = activeTraceKey();
  const url = window.URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    const previous = state.traceImages[key];
    if (previous?.url) window.URL.revokeObjectURL(previous.url);
    state.traceImages[key] = {
      key,
      name: file.name,
      url,
      image,
      naturalWidth: image.naturalWidth || image.width,
      naturalHeight: image.naturalHeight || image.height,
      ...defaultTracePlacement(key, image)
    };
    syncTracePanel();
    draw();
    setStatus("status_trace_image_loaded", { target: key, filename: file.name });
  };
  image.onerror = () => {
    window.URL.revokeObjectURL(url);
    setStatus("status_trace_image_load_failed");
  };
  image.src = url;
}

function fitTraceImageToBoard() {
  const trace = activeTraceImage();
  if (!trace || !trace.image) return;
  Object.assign(trace, defaultTracePlacement(activeTraceKey(), trace.image), {
    opacity: trace.opacity,
    visible: trace.visible
  });
  syncTracePanel();
  draw();
  setStatus("status_trace_image_fit");
}

function traceMoveStep() {
  return Math.max(0.001, numberOrZero(els.traceMoveStep?.value) || 1);
}

function moveTraceImage(dxSign, dySign) {
  const trace = activeTraceImage();
  if (!trace) return;
  const step = traceMoveStep();
  trace.x += (Number.isFinite(dxSign) ? dxSign : 0) * step;
  trace.y += (Number.isFinite(dySign) ? dySign : 0) * step;
  syncTracePanel();
  draw();
  setStatus("status_trace_image_moved", { x: fmt(trace.x), y: fmt(trace.y) });
}

function centerTraceImage() {
  const trace = activeTraceImage();
  if (!trace) return;
  const placement = defaultTracePlacement(activeTraceKey(), trace.image);
  trace.x = placement.x;
  trace.y = placement.y;
  syncTracePanel();
  draw();
  setStatus("status_trace_image_centered");
}

function clearTraceImage() {
  const key = activeTraceKey();
  const trace = state.traceImages[key];
  if (trace?.url) window.URL.revokeObjectURL(trace.url);
  state.traceImages[key] = null;
  syncTracePanel();
  draw();
  setStatus("status_trace_image_cleared");
}

function updateActiveTraceFromPanel() {
  const trace = activeTraceImage();
  if (!trace) {
    syncTracePanel();
    return;
  }
  trace.visible = !!els.traceVisible?.checked;
  trace.opacity = clampNumber(Number(els.traceOpacity?.value), 0, 1, 0.45);
  trace.scale = Math.max(0.0001, numberOrZero(els.traceScale?.value));
  trace.rotation = numberOrZero(els.traceRotation?.value) * Math.PI / 180;
  trace.x = numberOrZero(els.traceX?.value);
  trace.y = numberOrZero(els.traceY?.value);
  updateTraceInfo();
}

function syncTracePanel() {
  const trace = activeTraceImage();
  const disabled = !trace;
  [
    els.traceVisible, els.traceOpacity, els.traceScale, els.traceRotation, els.traceX, els.traceY,
    els.traceMoveStep, els.traceMoveUpButton, els.traceMoveDownButton, els.traceMoveLeftButton,
    els.traceMoveRightButton, els.traceCenterButton, els.traceFitButton, els.traceClearButton
  ].forEach(el => {
    if (el) el.disabled = disabled;
  });
  if (trace) {
    if (els.traceVisible) els.traceVisible.checked = !!trace.visible;
    if (els.traceOpacity) els.traceOpacity.value = String(trace.opacity);
    if (els.traceScale) els.traceScale.value = fmt(trace.scale);
    if (els.traceRotation) els.traceRotation.value = fmt(trace.rotation * 180 / Math.PI);
    if (els.traceX) els.traceX.value = fmt(trace.x);
    if (els.traceY) els.traceY.value = fmt(trace.y);
  }
  updateTraceInfo();
}

function updateTraceInfo() {
  if (!els.traceInfo) return;
  const trace = activeTraceImage();
  els.traceInfo.textContent = trace
    ? `${activeTraceKey()}: ${trace.name} / ${trace.naturalWidth} x ${trace.naturalHeight}px`
    : "No image loaded";
}

function drawTraceImage(key, transform) {
  const trace = state.traceImages[key];
  if (!trace?.visible || !trace.image || !trace.naturalWidth || !trace.naturalHeight) return;
  const width = trace.naturalWidth * trace.scale;
  const height = trace.naturalHeight * trace.scale;
  ctx.save();
  ctx.globalAlpha = clampNumber(trace.opacity, 0, 1, 0.45);
  ctx.translate(transform.x(trace.x), transform.y(trace.y));
  ctx.scale(transform.scale, -transform.scale);
  ctx.rotate(trace.rotation || 0);
  ctx.drawImage(
    trace.image,
    -width * 0.5,
    -height * 0.5,
    width,
    height
  );
  ctx.globalAlpha = Math.min(1, clampNumber(trace.opacity, 0, 1, 0.45) + 0.25);
  ctx.strokeStyle = "#ffcc66";
  ctx.lineWidth = 1 / Math.max(1e-9, transform.scale);
  ctx.strokeRect(-width * 0.5, -height * 0.5, width, height);
  ctx.restore();
}

function drawContextToolpaths(board, transform, mode = "outline") {
  const surfaces = contextToolpathSurfaces();
  if (!surfaces.length || !board?.sections?.length) return;
  const model = makeCncModel(board);
  const lengthSteps = clampInt(els.cncLengthSteps?.value, 8, 240, 48);
  const widthSteps = clampInt(els.cncWidthSteps?.value, 2, 80, 8);
  ctx.save();
  surfaces.forEach(surface => {
    [1, -1].forEach(side => {
      const passes = buildCncPasses(model, surface, side, lengthSteps, widthSteps);
      passes.forEach(pass => {
        const points = pass
          .map(point => mode === "profile"
            ? { x: point.x, y: point.z }
            : { x: point.x, y: point.y })
          .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
        if (!points.length) return;
        ctx.globalAlpha = side > 0 ? 0.82 : 0.46;
        drawPath(points, transform, surface === "deck" ? "#f0a35f" : "#5ac8fa", 1.05);
      });
    });
  });
  ctx.restore();
}

function drawScanGhostProfile(ghost, transform) {
  if (!ghost || (!ghost.bottom.length && !ghost.deck.length)) return;
  ctx.save();
  ctx.setLineDash([3, 4]);
  if (ghost.bottom.length) {
    drawPath(ghost.bottom, transform, "#64b5ff", 1.1);
    drawScanGhostPoints(ghost.bottom, transform, "#64b5ff");
  }
  if (ghost.deck.length) {
    drawPath(ghost.deck, transform, "#ff9f0a", 1.1);
    drawScanGhostPoints(ghost.deck, transform, "#ff9f0a");
  }
  ctx.setLineDash([]);
  label(t("scan_ghost"), transform.x(ghost.bottom[0]?.x ?? ghost.deck[0]?.x ?? 0) + 8, transform.y(ghost.bottom[0]?.y ?? ghost.deck[0]?.y ?? 0) - 18, "#a1a1aa");
  ctx.restore();
}

function drawScanGhostOutline(ghost, transform) {
  if (!ghost || ghost.length < 2) return;
  const mirrored = ghost.slice().reverse().map(point => ({ x: point.x, y: -point.y }));
  ctx.save();
  ctx.setLineDash([3, 4]);
  drawPath(ghost, transform, "#64b5ff", 1.1);
  drawPath(mirrored, transform, "#64b5ff", 1.1);
  drawScanGhostPoints(ghost, transform, "#64b5ff");
  drawScanGhostPoints(mirrored, transform, "#64b5ff");
  ctx.setLineDash([]);
  label(t("scan_ghost"), transform.x(ghost[0].x) + 8, transform.y(ghost[0].y) - 18, "#a1a1aa");
  ctx.restore();
}

function drawScanGhostPoints(points, transform, color) {
  ctx.save();
  ctx.fillStyle = color;
  points.forEach(point => {
    ctx.beginPath();
    ctx.arc(transform.x(point.x), transform.y(point.y), 2.8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawSections(board, rect) {
  state.editHandles = [];
  state.sectionCells = [];
  if (!board.sections.length) {
    label(t("no_section_data"), 28, 36, "#a1a1aa");
    return;
  }
  state.currentSectionIndex = normalizeSectionIndex(board, state.currentSectionIndex);
  const top = { left: rect.left, top: rect.top, width: rect.width, height: rect.height * 0.68 };
  const bottom = { left: rect.left, top: rect.top + top.height + 4, width: rect.width, height: rect.height - top.height - 4 };
  drawCurrentCrossSectionPane(board, top);
  drawCrossSectionPositionPane(board, bottom);
}

function drawCurrentCrossSectionPane(board, rect) {
  const renderBoard = boardWithPendingBottomFeaturePreview(board);
  const section = currentCrossSection(board);
  if (!section || !section.spline.length) {
    label(t("no_current_cross_section"), rect.left + 28, rect.top + 36, "#a1a1aa");
    return;
  }
  const displaySpline = applyBottomFeaturesToSectionKnots(section.spline, renderBoard, section.position);
  const currentFull = fullCrossSectionPoints(displaySpline);
  const ghostBoard = currentGhostBoard(renderBoard);
  const ghostSection = ghostBoard ? nearestGhostSection(ghostBoard, section.position) : null;
  const ghostBoardFull = ghostSection?.spline?.length ? transformGhostPoints(fullCrossSectionPoints(ghostSection.spline)) : [];
  const ghost = scanGhostCrossSection(currentProbeMeasurements(), section.position * unitScale());
  const ghostFull = ghost.points.length >= 3 ? fullCrossSectionPoints(splineFromFreePoints(ghost.points)) : [];
  const fitPoints = (state.tool === "edit" && state.viewOptions.showControlPoints)
    ? currentFull.concat(ghostBoardFull, ghostFull, splineAnchorPoints(section.spline))
    : currentFull.concat(ghostBoardFull, ghostFull);
  const transform = fitTransform(fitPoints, insetRect(rect, 36, 48, 28, 30), 8);
  registerPointerTransform("section", transform, rect);

  if (state.viewOptions.showNonActiveCrossSections) {
    renderBoard.sections.forEach((other, index) => {
      if (index === state.currentSectionIndex || !other.spline.length) return;
      const otherDisplaySpline = applyBottomFeaturesToSectionKnots(other.spline, renderBoard, other.position);
      const pts = fullCrossSectionPoints(otherDisplaySpline);
      ctx.setLineDash([7, 5]);
      drawPath(pts, transform, "#5e5e63", 0.8);
      ctx.setLineDash([]);
    });
  }

  if (!state.viewOptions.viewBlank) drawPath(currentFull, transform, "#ff6b6b", 2);
  if (normalizeRailModeKey(renderBoard.railMode)) drawRailBandGuides(displaySpline, transform, renderBoard.railMode);
  if (ghostBoardFull.length) drawGhostPath(ghostBoardFull, transform, "#b8c7d9", 1.25, true);
  drawScanGhostCrossSection(ghostFull, transform);
  if (state.viewOptions.showSlidingCrossSection) drawSlidingCrossSectionShape(renderBoard, transform, rect);
  drawBottomFeatureDeltaOverlay(section.spline, displaySpline, transform, renderBoard, section.position, rect);
  setBottomFeatureSectionHandles(renderBoard, transform, section);
  drawBottomFeatureSectionHandles();
  if (state.viewOptions.showCenterLine) {
    ctx.strokeStyle = "#8e8e93";
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 7]);
    line(transform.x(0), rect.top + 32, transform.x(0), rect.top + rect.height - 20);
    ctx.setLineDash([]);
  }
  if (state.viewOptions.showBaseLine) drawCrossSectionBaseline(currentFull, transform);
  if (state.viewOptions.showFlowlines) drawCrossSectionAngleMarkers(displaySpline, transform, [10, 27.5, 45], "#5ac8fa");
  if (state.viewOptions.showApexLine) drawCrossSectionAngleMarkers(displaySpline, transform, [90], "#30d158");
  if (state.viewOptions.showTuckUnderLine) drawCrossSectionAngleMarkers(displaySpline, transform, [175], "#ff9f0a");
  if (state.viewOptions.showCurvature) drawCurvatureComb(displaySpline, transform, 20, "#bf5af2");
  if (state.viewOptions.showSlidingInfo) drawCrossSectionSlidingInfo(section, transform, rect);
  if (state.viewOptions.showGuidePoints) drawGuidePoints(section.guidePoints, transform, "CrossSection");
  const pos = fmt(section.position);
  const width = fmt(boardCadCrossSectionWidth(displaySpline));
  const thickness = fmt(boardCadCrossSectionCenterThickness(displaySpline));
  const release = fmt(boardCadCrossSectionReleaseAngle(displaySpline) * 180 / Math.PI);
  const tuck = fmt(boardCadCrossSectionTuckRadius(displaySpline));
  label(t("cross_section_summary", {
    index: state.currentSectionIndex,
    pos,
    width,
    thickness,
    release,
    tuck
  }), rect.left + 16, rect.top + 24, "#d1d1d6");
  if (ghost.points.length >= 3) {
    const error = crossSectionFitError(ghost.points, section.spline);
    label(t("scan_fit_summary", {
      rms: fmt(error.rms),
      max: fmt(error.max),
      count: error.count
    }), rect.left + 16, rect.top + 44, "#64b5ff");
  }
  if (!state.viewOptions.viewBlank) {
    setEditHandles([{ label: "CrossSection", knots: section.spline }], transform);
    drawEditHandles();
  }
}

function drawScanGhostCrossSection(points, transform) {
  if (!points.length) return;
  ctx.save();
  ctx.setLineDash([3, 4]);
  drawPath(points, transform, "#64b5ff", 1.1);
  ctx.setLineDash([]);
  drawScanGhostPoints(points, transform, "#64b5ff");
  const first = points[0];
  label(t("scan_ghost"), transform.x(first.x) + 8, transform.y(first.y) - 12, "#a1a1aa");
  ctx.restore();
}

function drawCrossSectionPositionPane(board, rect) {
  ctx.strokeStyle = "#5e5e63";
  ctx.lineWidth = 1;
  ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, rect.width - 1, rect.height - 1);

  const outline = outlineFullPoints(board);
  const bottom = flattenSpline(board.bottom);
  const deck = flattenSpline(board.deck);
  const profileOffset = Math.max(board.width / 2, board.thickness, 1) + Math.max(2, board.thickness);
  const profile = bottom.concat(deck).map(p => ({ x: p.x, y: p.y - profileOffset }));
  const points = outline.concat(profile);
  const transform = fitTransform(points, insetRect(rect, 22, 30, 18, 18), 6);

  drawPath(outline, transform, "#5ac8fa", 1.2);
  drawPath(bottom.map(p => ({ x: p.x, y: p.y - profileOffset })), transform, "#d1d1d6", 1.1);
  drawPath(deck.map(p => ({ x: p.x, y: p.y - profileOffset })), transform, "#f0a35f", 1.1);

  if (!state.viewOptions.showCrossSectionPositions) return;

  const affected = bottomFeatureAffectedSections(board);
  if (affected.affectedCount) {
    const feature = affected.feature;
    const startX = transform.x(feature.start);
    const peakX = transform.x(feature.peak);
    const endX = transform.x(feature.end);
    const left = Math.min(startX, endX);
    const right = Math.max(startX, endX);
    const color = bottomFeatureDisplayColor(feature.type);
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = color;
    ctx.fillRect(left, rect.top + 8, Math.max(2, right - left), rect.height - 16);
    ctx.globalAlpha = 0.18;
    ctx.fillRect(Math.min(peakX, right), rect.top + 8, 2, rect.height - 16);
    ctx.restore();
  }

  board.sections.forEach((section, index) => {
    if (!section.spline.length || index === 0 || index === board.sections.length - 1) return;
    const x = transform.x(section.position);
    const halfWidth = Math.max(0, boardCadWidthAtPos(board, section.position) / 2);
    const y1 = transform.y(-halfWidth);
    const y2 = transform.y(halfWidth);
    const active = index === state.currentSectionIndex;
    const influence = affected.sections.find(item => item.index === index);
    ctx.strokeStyle = active ? "#ff6b6b" : (influence ? bottomFeatureDisplayColor(affected.feature.type) : "#a1a1aa");
    ctx.lineWidth = active ? 2 : (influence ? 1.4 : 1);
    line(x, y1, x, y2);
    line(x, transform.y(boardCadRockerAtPos(board, section.position) - profileOffset), x, transform.y(boardCadDeckAtPos(board, section.position) - profileOffset));
    if (active) label(`${fmt(section.position)}`, x + 5, rect.top + 18, "#ff6b6b");
    else if (influence) label(`${Math.round(influence.envelope * 100)}%`, x + 3, rect.bottom - 10, ctx.strokeStyle);
    state.sectionCells.push({
      rect: {
        left: x - 8,
        top: rect.top,
        width: 16,
        height: rect.height
      },
      sectionIndex: index
    });
  });
}

function fullCrossSectionPoints(spline) {
  const pts = isPointOnlySpline(spline) ? spline.map(knot => ({ ...knot.p })) : flattenSpline(spline);
  return pts.slice().reverse().map(p => ({ x: -p.x, y: p.y })).concat(pts);
}

function isPointOnlySpline(spline) {
  return spline.length > 2 && spline.every(knot =>
    Math.abs(knot.prev.x - knot.p.x) < 1e-9 &&
    Math.abs(knot.prev.y - knot.p.y) < 1e-9 &&
    Math.abs(knot.next.x - knot.p.x) < 1e-9 &&
    Math.abs(knot.next.y - knot.p.y) < 1e-9
  );
}

function drawToolpath(board, rect) {
  state.editHandles = [];
  if (!board.sections.length) {
    label("CNC表示に必要な断面データがありません", 28, 36, "#a1a1aa");
    return;
  }
  const outputLengthSteps = clampInt(els.cncLengthSteps.value, 8, 240, 48);
  const outputWidthSteps = clampInt(els.cncWidthSteps.value, 2, 80, 8);
  const lengthSteps = Math.min(64, outputLengthSteps);
  const widthSteps = Math.min(12, outputWidthSteps);
  const surfaceMode = els.cncSurface.value || "bottom";
  const projectedPaths = getProjectedToolpathPreviewPaths(board, surfaceMode, lengthSteps, widthSteps);
  const projectedPoints = projectedPaths.flatMap(path => path.points);
  const transform = fitTransform(projectedPoints, rect, 44);
  projectedPaths.forEach(path => {
    const color = path.surface === "deck" ? "#f0a35f" : "#5ac8fa";
    ctx.globalAlpha = path.side > 0 ? 0.82 : 0.46;
    drawPath(path.points, transform, color, 1.2);
    ctx.globalAlpha = 1;
  });
  label(`CNC 3D Toolpath / ${els.cncAxes.value}軸 / ${surfaceLabel(surfaceMode)} / preview ${lengthSteps} x ${widthSteps} / output ${outputLengthSteps} x ${outputWidthSteps}`, 28, 34, "#d1d1d6");
  label("Drag: rotate / Shift+drag: pan / Wheel: zoom", 28, 52, "#a1a1aa");
}

function getToolpathPreviewPaths(board, surfaceMode, lengthSteps, widthSteps) {
  const cache = state.toolpathPreviewCache;
  const key = `${surfaceMode}:${lengthSteps}:${widthSteps}:${state.crossSectionInterpolation}`;
  if (cache.revision === state.geometryRevision && cache.key === key) return cache.paths;
  const model = makeCncModel(board);
  const surfaces = surfaceMode === "both" ? ["bottom", "deck"] : [surfaceMode];
  const paths = [];
  surfaces.forEach(surface => {
    [1, -1].forEach(side => {
      buildCncPasses(model, surface, side, lengthSteps, widthSteps).forEach(pass => {
        if (pass.length) paths.push({ surface, side, pass });
      });
    });
  });
  cache.revision = state.geometryRevision;
  cache.key = key;
  cache.paths = paths;
  return paths;
}

function cameraProjectionCacheKey(board) {
  const camera = model3DCamera();
  return [
    state.geometryRevision,
    state.view,
    camera.yaw.toFixed(6),
    camera.pitch.toFixed(6),
    camera.zoom.toFixed(6),
    camera.panX.toFixed(3),
    camera.panY.toFixed(3),
    boardCadTailDisplayLength(board).toFixed(4),
    Number(board.thickness || 0).toFixed(4)
  ].join(":");
}

function projectBezierKnots(bezierKnots, board) {
  return bezierKnots.map(knot => ({
    p: projectBoardPoint(knot.p, board),
    prev: projectBoardPoint(knot.prev, board),
    next: projectBoardPoint(knot.next, board)
  }));
}

function getProjectedToolpathPreviewPaths(board, surfaceMode, lengthSteps, widthSteps) {
  const cache = state.toolpathPreviewCache;
  const paths = getToolpathPreviewPaths(board, surfaceMode, lengthSteps, widthSteps);
  const key = `${surfaceMode}:${lengthSteps}:${widthSteps}:${cameraProjectionCacheKey(board)}`;
  if (cache.projectedRevision === state.geometryRevision && cache.projectedKey === key) return cache.projectedPaths;
  const projectedPaths = paths.map(path => ({
    surface: path.surface,
    side: path.side,
    depth: path.pass.reduce((sum, point) => sum + rotateBoardPoint(point, board).depth, 0) / Math.max(1, path.pass.length),
    points: path.pass.map(point => projectBoardPoint(point, board))
  })).sort((a, b) => a.depth - b.depth);
  cache.projectedRevision = state.geometryRevision;
  cache.projectedKey = key;
  cache.projectedPaths = projectedPaths;
  return projectedPaths;
}

function drawScanView(board, rect) {
  const machine = probeMachineLimits();
  const centerY = clampNumber(els.scanMachineCenterY.value, 0, machine.y, machine.y / 2);
  const measuredLength = board
    ? measuredProbeLengthMm(board, unitScale())
    : Math.max(1, Number(els.scanMeasuredLength.value) || machine.x);
  const viewPoints = [
    { x: 0, y: 0 },
    { x: measuredLength, y: 0 },
    { x: 0, y: machine.y },
    { x: measuredLength, y: machine.y }
  ];
  const transform = fitTransform(viewPoints, rect, 48);
  label("Scan New Board", rect.left + 24, rect.top + 32, "#d1d1d6");
  label("Left: tail origin X0 / Right: nose. Jog to nose, set measured length, then generate probe scan.", rect.left + 24, rect.top + 52, "#a1a1aa");
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#5e5e63";
  ctx.setLineDash([8, 6]);
  line(transform.x(0), transform.y(0), transform.x(measuredLength), transform.y(0));
  line(transform.x(0), transform.y(centerY), transform.x(measuredLength), transform.y(centerY));
  ctx.setLineDash([]);
  ctx.strokeStyle = "#64b5ff";
  ctx.lineWidth = 2;
  line(transform.x(0), transform.y(centerY), transform.x(measuredLength), transform.y(centerY));
  drawScanMarker(transform, { x: 0, y: centerY }, "Tail X0", "#ff9f0a");
  drawScanMarker(transform, { x: measuredLength, y: centerY }, `Nose ${fmt(measuredLength)}mm`, "#30d158");
  if (state.scan.nose) drawScanMarker(transform, scanDisplayPoint(state.scan.nose, measuredLength), "Set Nose", "#30d158");
  if (state.scan.tail) drawScanMarker(transform, scanDisplayPoint(state.scan.tail, measuredLength), "Set Tail", "#ff9f0a");
  if (state.scan.currentPosition) {
    const currentDisplay = scanDisplayPoint(state.scan.currentPosition, measuredLength);
    drawScanMarker(transform, currentDisplay, "Current", "#ff6b6b");
    label(`X${fmt(state.scan.currentPosition.x)} Y${fmt(state.scan.currentPosition.y)} Z${fmt(state.scan.currentPosition.z)}`, transform.x(currentDisplay.x) + 10, transform.y(currentDisplay.y) + 18, "#ff6b6b");
  }
  if (board) {
    const scale = unitScale();
    const displayLength = boardCadTailDisplayLength(board);
    const outline = boardCadTailPlanform(board).positive.map(point => ({
      x: point.x * scale * (measuredLength / Math.max(1e-6, displayLength * scale)),
      y: point.y * scale + centerY
    }));
    drawPath(outline, transform, "#5ac8fa", 1.2);
    drawPath(outline.map(point => ({ x: point.x, y: centerY - (point.y - centerY) })), transform, "#5ac8fa", 1.2);
  }
  drawProbeSimulation(transform, measuredLength);
  ctx.restore();
}

function scanDisplayPoint(point, measuredLength) {
  return {
    ...point,
    x: point.x
  };
}

function drawScanMarker(transform, point, text, color) {
  const x = transform.x(point.x);
  const y = transform.y(point.y);
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#1c1c1e";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  label(text, x + 8, y - 8, color);
  ctx.restore();
}

function drawProbeSimulation(transform, measuredLength) {
  const sim = state.scan.simulation;
  if (!sim?.segments?.length) return;
  const visibleSegments = sim.segments.slice(0, Math.min(sim.segments.length, 1200));
  ctx.save();
  ctx.lineWidth = 1;
  visibleSegments.forEach((segment, index) => {
    const from = scanDisplayPoint(segment.from, measuredLength);
    const to = scanDisplayPoint(segment.to, measuredLength);
    ctx.strokeStyle = segment.type === "probe"
      ? (index <= sim.index ? "rgba(255,159,10,.72)" : "rgba(255,159,10,.25)")
      : (index <= sim.index ? "rgba(174,174,178,.46)" : "rgba(174,174,178,.16)");
    ctx.setLineDash(segment.type === "probe" ? [] : [4, 5]);
    line(transform.x(from.x), transform.y(from.y), transform.x(to.x), transform.y(to.y));
  });
  ctx.setLineDash([]);
  const current = currentProbeSimulationPosition(sim);
  if (current) {
    const display = scanDisplayPoint(current, measuredLength);
    const active = sim.segments[sim.index];
    const color = active?.type === "probe" ? "#ff9f0a" : "#64b5ff";
    ctx.fillStyle = color;
    ctx.strokeStyle = "#1c1c1e";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(transform.x(display.x), transform.y(display.y), active?.type === "probe" ? 7 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const pointLabel = active?.point ? `P${active.point.index} ${active.point.surface}` : `L${active?.line || 0}`;
    const modeLabel = active?.type === "probe" ? "Probe" : "Move";
    const aLabel = Number.isFinite(current.a) ? ` A${fmt(current.a)}` : "";
    label(`${modeLabel} ${pointLabel} Z${fmt(current.z)}${aLabel}`, transform.x(display.x) + 10, transform.y(display.y) - 12, color);
  }
  const completed = Math.min(sim.index + (sim.progress >= 1 ? 1 : 0), sim.segments.length);
  label(`Simulation ${completed}/${sim.segments.length}`, 28, 74, "#a1a1aa");
  drawProbeSimulationZProfile(sim);
  drawCrossHalfSimulationInset(sim);
  ctx.restore();
}

function drawProbeSimulationZProfile(sim) {
  const rect = {
    left: 24,
    top: Math.max(96, els.canvas.getBoundingClientRect().height - 112),
    width: Math.max(220, els.canvas.getBoundingClientRect().width - 48),
    height: 82
  };
  const points = probeSimulationTimelinePoints(sim.segments);
  if (points.length < 2) return;
  const zValues = points.map(point => point.z);
  const zMin = Math.min(...zValues);
  const zMax = Math.max(...zValues);
  const zSpan = Math.max(1, zMax - zMin);
  const xMax = Math.max(1, points.at(-1).d);
  const x = value => rect.left + (value / xMax) * rect.width;
  const y = value => rect.top + rect.height - ((value - zMin) / zSpan) * rect.height;
  ctx.save();
  ctx.fillStyle = "rgba(28,28,30,.78)";
  ctx.strokeStyle = "rgba(94,94,99,.85)";
  ctx.lineWidth = 1;
  ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
  ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, rect.width - 1, rect.height - 1);
  ctx.strokeStyle = "rgba(174,174,178,.25)";
  ctx.setLineDash([3, 5]);
  line(rect.left, y(zMin), rect.left + rect.width, y(zMin));
  line(rect.left, y(zMax), rect.left + rect.width, y(zMax));
  ctx.setLineDash([]);
  ctx.beginPath();
  points.forEach((point, index) => {
    const px = x(point.d);
    const py = y(point.z);
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = "#64b5ff";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  sim.segments.forEach((segment, index) => {
    if (segment.type !== "probe") return;
    const start = points[index];
    const end = points[index + 1];
    if (!start || !end) return;
    ctx.strokeStyle = index <= sim.index ? "#ff9f0a" : "rgba(255,159,10,.35)";
    ctx.lineWidth = 2.4;
    line(x(start.d), y(start.z), x(end.d), y(end.z));
  });
  const current = currentProbeSimulationTimelinePoint(sim, points);
  if (current) {
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.arc(x(current.d), y(current.z), 4, 0, Math.PI * 2);
    ctx.fill();
  }
  label(`Z profile ${fmt(zMin)}..${fmt(zMax)} mm`, rect.left + 8, rect.top + 16, "#d1d1d6");
  ctx.restore();
}

function probeSimulationTimelinePoints(segments) {
  if (!segments.length) return [];
  const points = [{ d: 0, z: segments[0].from.z }];
  let distance = 0;
  segments.forEach(segment => {
    distance += machineDistance3D(segment.from, segment.to);
    points.push({ d: distance, z: segment.to.z });
  });
  return points;
}

function currentProbeSimulationTimelinePoint(sim, points = probeSimulationTimelinePoints(sim.segments)) {
  if (!sim?.segments?.length || points.length < 2) return null;
  const index = Math.min(sim.index, sim.segments.length - 1);
  const start = points[index];
  const end = points[index + 1];
  if (!start || !end) return null;
  const t = clampNumber(sim.progress, 0, 1, 0);
  return {
    d: start.d + (end.d - start.d) * t,
    z: start.z + (end.z - start.z) * t
  };
}

function drawCrossHalfSimulationInset(sim) {
  const active = sim.segments[sim.index];
  const phase = active?.point?.phase || active?.phase || "";
  if (!/^cross-section-/i.test(phase)) return;
  const points = sim.segments
    .filter(segment => segment.type === "probe" && segment.point?.surface === "cross-half" && segment.point.phase === phase)
    .map(segment => ({ y: Math.abs(segment.point.y), z: segment.point.z ?? segment.to.z, index: segment.point.index }));
  if (points.length < 3) return;
  const canvasRect = els.canvas.getBoundingClientRect();
  const rect = {
    left: Math.max(24, canvasRect.width - 284),
    top: 96,
    width: 260,
    height: 150
  };
  const yMax = Math.max(1, ...points.map(point => point.y));
  const zMin = Math.min(...points.map(point => point.z));
  const zMax = Math.max(...points.map(point => point.z));
  const zSpan = Math.max(1, zMax - zMin);
  const sx = value => rect.left + 18 + (value / yMax) * (rect.width - 36);
  const sy = value => rect.top + rect.height - 20 - ((value - zMin) / zSpan) * (rect.height - 42);
  ctx.save();
  ctx.fillStyle = "rgba(28,28,30,.82)";
  ctx.strokeStyle = "rgba(94,94,99,.9)";
  ctx.lineWidth = 1;
  ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
  ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, rect.width - 1, rect.height - 1);
  ctx.strokeStyle = "rgba(174,174,178,.25)";
  ctx.setLineDash([4, 5]);
  line(sx(0), sy(zMin), sx(yMax), sy(zMin));
  line(sx(0), sy(zMax), sx(yMax), sy(zMax));
  ctx.setLineDash([]);
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = sx(point.y);
    const y = sy(point.z);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#ff9f0a";
  ctx.lineWidth = 2;
  ctx.stroke();
  points.forEach(point => {
    ctx.fillStyle = point.index <= (active?.point?.index || 0) ? "#ff9f0a" : "rgba(255,159,10,.35)";
    ctx.beginPath();
    ctx.arc(sx(point.y), sy(point.z), 3, 0, Math.PI * 2);
    ctx.fill();
  });
  const current = currentProbeSimulationPosition(sim);
  if (current) {
    const activeY = Math.abs(active?.point?.y ?? current.y);
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.arc(sx(activeY), sy(current.z), 5, 0, Math.PI * 2);
    ctx.fill();
  }
  label("Half cross-section Y-Z", rect.left + 8, rect.top + 16, "#d1d1d6");
  const aText = Number.isFinite(active?.point?.a) ? ` A${fmt(active.point.a)}` : "";
  label(`normal probe${aText}`, rect.left + 8, rect.top + 34, "#a1a1aa");
  ctx.restore();
}

function currentProbeSimulationPosition(sim) {
  if (!sim?.segments?.length) return null;
  const segment = sim.segments[sim.index] || sim.segments.at(-1);
  const t = clampNumber(sim.progress, 0, 1, 0);
  return {
    x: segment.from.x + (segment.to.x - segment.from.x) * t,
    y: segment.from.y + (segment.to.y - segment.from.y) * t,
    z: segment.from.z + (segment.to.z - segment.from.z) * t,
    a: Number.isFinite(segment.to.a)
      ? segment.to.a
      : Number.isFinite(segment.from.a)
        ? segment.from.a
        : undefined
  };
}

function drawQuad(board, rect) {
  state.editHandles = [];
  const gap = 3;
  const halfW = (rect.width - gap) / 2;
  const halfH = (rect.height - gap) / 2;
  const panes = [
    { id: "outline", title: "Outline", rect: { left: 0, top: 0, width: halfW, height: halfH }, draw: drawQuadOutline },
    { id: "profile", title: "Profile", rect: { left: halfW + gap, top: 0, width: halfW, height: halfH }, draw: drawQuadProfile },
    { id: "cross-section", title: t("pane_cross_section"), rect: { left: 0, top: halfH + gap, width: halfW, height: halfH }, draw: drawQuadCurrentSection },
    { id: "wire", title: "3D wire", rect: { left: halfW + gap, top: halfH + gap, width: halfW, height: halfH }, draw: drawQuadWireframe }
  ];
  state.quadPanes = panes;
  panes.forEach(pane => {
    const active = state.quadActivePane === pane.id;
    const contentRect = insetRect(pane.rect, 26, 28, 16, 16);
    drawQuadPaneFrame(pane.rect, pane.title, active);
    pane.draw(board, contentRect);
    registerQuadEditHandles(board, pane.id, contentRect, active);
  });
  if (!state.viewOptions.viewBlank) drawEditHandles();
}

function drawQuadPaneFrame(rect, title, active) {
  ctx.fillStyle = "#242426";
  ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
  ctx.strokeStyle = active ? "#5ac8fa" : "#5e5e63";
  ctx.lineWidth = active ? 2 : 1;
  ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, rect.width - 1, rect.height - 1);
  label(title, rect.left + 10, rect.top + 18, active ? "#64b5ff" : "#d1d1d6");
}

function drawQuadOutline(board, rect) {
  const renderBoard = boardWithPendingBottomFeaturePreview(board);
  const outlineShift = boardCadTailDisplayShift(renderBoard);
  const points = outlineFullPoints(renderBoard);
  const ghostBoard = currentGhostBoard(renderBoard);
  const ghostPoints = ghostBoard ? transformedGhostOutlinePoints(ghostBoard) : [];
  const fitPoints = (state.tool === "edit" && state.quadActivePane === "outline" && state.viewOptions.showControlPoints)
    ? points.concat(ghostPoints, splineAnchorPoints(renderBoard.outline))
    : points.concat(ghostPoints);
  const transform = boardViewTransform(boardCadDisplayBoard(renderBoard), fitPoints, rect, 16);
  const rawTransform = shiftTransformX(transform, outlineShift);
  if (state.quadActivePane === "outline") registerPointerTransform("quad", rawTransform, rect);
  if (!state.viewOptions.viewBlank) {
    drawPath(points, transform, "#5ac8fa", 1.4);
    drawTailTransomLine(boardCadTailPlanform(renderBoard), transform, "#5ac8fa", 1.6);
  }
  if (ghostPoints.length) drawGhostPath(ghostPoints, transform, "#b8c7d9", 1.15, true);
  drawContextToolpaths(renderBoard, transform, "outline");
  if (state.viewOptions.showCenterLine) drawCenterLine(boardCadTailDisplayLength(renderBoard), rect, points, transform);
  drawOutlineBottomFeatureRanges(renderBoard, transform, rect);
  if (state.viewOptions.showCrossSectionPositions) drawCrossSectionPositionMarkers(renderBoard, transform, "outline");
  if (state.viewOptions.showFlowlines) drawSurfaceAngleLines(renderBoard, transform, "outline", [10, 27.5, 45], "#5ac8fa");
  if (state.viewOptions.showApexLine) drawSurfaceAngleLines(renderBoard, transform, "outline", [90], "#30d158");
  if (state.viewOptions.showTuckUnderLine) drawSurfaceAngleLines(renderBoard, transform, "outline", [175], "#ff9f0a");
  if (state.viewOptions.showCurvature) drawCurvatureComb(renderBoard.outline, rawTransform, 10, "#bf5af2");
  if (state.viewOptions.showVolumeDistribution) drawVolumeDistribution(renderBoard, transform, "outline");
  if (state.viewOptions.showCenterOfMass) drawCenterOfMass(renderBoard, transform, "outline");
  if (state.viewOptions.showFootMarks) drawFootMarks(renderBoard, transform, "outline");
  if (state.viewOptions.showGuidePoints) {
    const visibleGuides = filterGuidePointsByX(renderBoard.outlineGuidePoints, outlineShift);
    drawGuidePoints(visibleGuides.points, rawTransform, "Outline", renderBoard.outlineGuidePoints, visibleGuides.indexMap);
  }
  if (state.quadActivePane === "outline") {
    setWingHandles(renderBoard, rawTransform);
    setBottomFeatureHandles(renderBoard, transform, "outline", rect);
  }
  drawFins(renderBoard, rawTransform);
  if (state.quadActivePane === "outline") drawWingHandles();
  if (state.quadActivePane === "outline") drawBottomFeatureHandles(renderBoard, transform);
  if (state.viewOptions.showSlidingCrossSection) drawSlidingCrossSectionOnBoard(renderBoard, transform, "outline");
}

function drawQuadProfile(board, rect) {
  const renderBoard = boardWithPendingBottomFeaturePreview(board);
  const profile = tailAdjustedProfileGeometry(renderBoard);
  const bottom = profile.bottom;
  const deck = profile.deck;
  const ghostBoard = currentGhostBoard(renderBoard);
  const ghostProfile = ghostBoard ? transformedGhostProfilePoints(ghostBoard) : { bottom: [], deck: [] };
  const fitPoints = (state.tool === "edit" && state.quadActivePane === "profile" && state.viewOptions.showControlPoints)
    ? bottom.concat(deck, ghostProfile.bottom, ghostProfile.deck, splineAnchorPoints(renderBoard.bottom), splineAnchorPoints(renderBoard.deck))
    : bottom.concat(deck, ghostProfile.bottom, ghostProfile.deck);
  const transform = boardViewTransform(profile.displayBoard, fitPoints, rect, 16);
  const rawTransform = shiftTransformX(transform, profile.shift);
  if (state.quadActivePane === "profile") registerPointerTransform("quad", rawTransform, rect);
  if (!state.viewOptions.viewBlank) {
    drawPath(profile.bottomRaw, rawTransform, "#d1d1d6", 1.3);
    drawPath(profile.deckRaw, rawTransform, "#f0a35f", 1.3);
  }
  if (ghostBoard) {
    drawGhostPath(ghostProfile.bottom, transform, "#b8c7d9", 1.15);
    drawGhostPath(ghostProfile.deck, transform, "#b8c7d9", 1.15);
  }
  drawContextToolpaths(renderBoard, rawTransform, "profile");
  if (state.viewOptions.showBaseLine) drawBaseline(profile.displayBoard, transform);
  if (state.viewOptions.showCrossSectionPositions) drawCrossSectionPositionMarkers(renderBoard, transform, "profile");
  if (state.viewOptions.showFlowlines) drawSurfaceAngleLines(renderBoard, transform, "profile", [10, 27.5, 45], "#5ac8fa");
  if (state.viewOptions.showApexLine) drawSurfaceAngleLines(renderBoard, transform, "profile", [90], "#30d158");
  if (state.viewOptions.showTuckUnderLine) drawSurfaceAngleLines(renderBoard, transform, "profile", [175], "#ff9f0a");
  if (state.viewOptions.showCurvature) {
    drawCurvatureComb(profile.bottomKnots, rawTransform, 9, "#bf5af2");
    drawCurvatureComb(profile.deckKnots, rawTransform, 9, "#bf5af2");
  }
  if (state.viewOptions.showVolumeDistribution) drawVolumeDistribution(renderBoard, transform, "profile");
  if (state.viewOptions.showCenterOfMass) drawCenterOfMass(renderBoard, transform, "profile");
  if (state.viewOptions.showFootMarks) drawFootMarks(renderBoard, transform, "profile");
  if (state.viewOptions.showGuidePoints) {
    const visibleBottomGuides = filterGuidePointsByX(renderBoard.bottomGuidePoints, profile.shift);
    const visibleDeckGuides = filterGuidePointsByX(renderBoard.deckGuidePoints, profile.shift);
    drawGuidePoints(visibleBottomGuides.points, rawTransform, "Bottom", renderBoard.bottomGuidePoints, visibleBottomGuides.indexMap);
    drawGuidePoints(visibleDeckGuides.points, rawTransform, "Deck", renderBoard.deckGuidePoints, visibleDeckGuides.indexMap);
  }
  if (state.quadActivePane === "profile") setBottomFeatureHandles(renderBoard, rawTransform, "profile");
  if (state.quadActivePane === "profile") drawBottomFeatureHandles(renderBoard, rawTransform);
  if (state.viewOptions.showSlidingCrossSection) drawSlidingCrossSectionOnBoard(renderBoard, transform, "profile");
}

function registerQuadEditHandles(board, paneId, rect, active) {
  if (!active || state.tool !== "edit" || state.viewOptions.viewBlank) return;
  if (paneId === "outline") {
    const points = outlineFullPoints(board);
    const ghostBoard = currentGhostBoard(board);
    const ghostPoints = ghostBoard ? transformedGhostOutlinePoints(ghostBoard) : [];
    const transform = boardViewTransform(boardCadDisplayBoard(board), points.concat(ghostPoints, splineAnchorPoints(board.outline)), rect, 16);
    setEditHandles([{ label: "Outline", knots: board.outline }], shiftTransformX(transform, boardCadTailDisplayShift(board)));
  } else if (paneId === "profile") {
    const profile = tailAdjustedProfileGeometry(board);
    const ghostBoard = currentGhostBoard(board);
    const ghostProfile = ghostBoard ? transformedGhostProfilePoints(ghostBoard) : { bottom: [], deck: [] };
    setEditHandles([
      { label: "Bottom", knots: board.bottom },
      { label: "Deck", knots: board.deck }
    ], shiftTransformX(boardViewTransform(profile.displayBoard, profile.bottom.concat(profile.deck, ghostProfile.bottom, ghostProfile.deck, splineAnchorPoints(board.bottom), splineAnchorPoints(board.deck)), rect, 16), profile.shift));
  } else if (paneId === "cross-section") {
    const section = currentQuadCrossSection(board);
    if (!section || !section.spline.length) return;
    const half = flattenSpline(section.spline);
    const full = half.slice().reverse().map(p => ({ x: -p.x, y: p.y })).concat(half);
    const ghostBoard = currentGhostBoard(board);
    const ghostSection = ghostBoard ? nearestGhostSection(ghostBoard, section.position) : null;
    const ghostFull = ghostSection?.spline?.length ? transformGhostPoints(fullCrossSectionPoints(ghostSection.spline)) : [];
    setEditHandles([{ label: "CrossSection", knots: section.spline }], fitTransform(full.concat(ghostFull, splineAnchorPoints(section.spline)), rect, 18));
  }
}

function currentQuadCrossSection(board) {
  if (!board.sections.length) return null;
  const index = normalizeSectionIndex(board, state.currentSectionIndex);
  return index >= 0 ? board.sections[index] : null;
}

function drawQuadCurrentSection(board, rect) {
  const renderBoard = boardWithPendingBottomFeaturePreview(board);
  const section = currentQuadCrossSection(board);
  if (!section || !section.spline.length) {
    label("No section", rect.left + 8, rect.top + 20, "#a1a1aa");
    return;
  }
  const displaySpline = applyBottomFeaturesToSectionKnots(section.spline, renderBoard, section.position);
  const half = flattenSpline(displaySpline);
  const full = half.slice().reverse().map(p => ({ x: -p.x, y: p.y })).concat(half);
  const ghostBoard = currentGhostBoard(renderBoard);
  const ghostSection = ghostBoard ? nearestGhostSection(ghostBoard, section.position) : null;
  const ghostFull = ghostSection?.spline?.length ? transformGhostPoints(fullCrossSectionPoints(ghostSection.spline)) : [];
  const transform = fitTransform(full.concat(ghostFull), rect, 18);
  if (state.quadActivePane === "cross-section") registerPointerTransform("quad", transform, rect);
  if (!state.viewOptions.viewBlank) drawPath(full, transform, "#d1d1d6", 1.4);
  if (normalizeRailModeKey(renderBoard.railMode)) drawRailBandGuides(displaySpline, transform, renderBoard.railMode);
  if (ghostFull.length) drawGhostPath(ghostFull, transform, "#b8c7d9", 1.2, true);
  if (state.viewOptions.showSlidingCrossSection) drawSlidingCrossSectionShape(renderBoard, transform, rect);
  drawBottomFeatureDeltaOverlay(section.spline, displaySpline, transform, renderBoard, section.position, rect);
  setBottomFeatureSectionHandles(renderBoard, transform, section);
  drawBottomFeatureSectionHandles();
  if (state.viewOptions.showBaseLine) drawCrossSectionBaseline(full, transform);
  if (state.viewOptions.showFlowlines) drawCrossSectionAngleMarkers(displaySpline, transform, [10, 27.5, 45], "#5ac8fa");
  if (state.viewOptions.showApexLine) drawCrossSectionAngleMarkers(displaySpline, transform, [90], "#30d158");
  if (state.viewOptions.showTuckUnderLine) drawCrossSectionAngleMarkers(displaySpline, transform, [175], "#ff9f0a");
  if (state.viewOptions.showCenterLine) {
    ctx.strokeStyle = "#8e8e93";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    line(transform.x(0), rect.top + 6, transform.x(0), rect.top + rect.height - 6);
    ctx.setLineDash([]);
  }
  if (state.viewOptions.showCurvature) drawCurvatureComb(displaySpline, transform, 10, "#bf5af2");
  if (state.viewOptions.showGuidePoints) drawGuidePoints(section.guidePoints, transform, "CrossSection");
  label(`${fmt(section.position)}`, rect.left + 8, rect.top + rect.height - 8, "#a1a1aa");
}

function drawQuadWireframe(board, rect) {
  if (!board.sections.length) {
    label("No surface", rect.left + 8, rect.top + 20, "#a1a1aa");
    return;
  }
  const lengthSteps = 18;
  const lines = getModel3DWorldLines(board, lengthSteps, 10)
    .map(lineItem => ({
      kind: lineItem.kind,
      points: lineItem.points.map(point => projectBoardPoint(point, board))
    }));
  const all = lines.flatMap(lineItem => lineItem.points);
  const transform = fitTransform(all, rect, 18);
  lines.forEach((lineItem, index) => {
    const color = index < lengthSteps + 1 ? "#6e6e73" : "#8e8e93";
    if (lineItem.kind === "stringer") drawSmoothProjectedPath(lineItem.points, transform, color, 0.8);
    else drawPath(lineItem.points, transform, color, 0.8);
  });
}

function drawModel3D(board, rect) {
  state.editHandles = [];
  if (!board.sections.length) {
    label("3D model requires cross sections", rect.left + 28, rect.top + 36, "#a1a1aa");
    return;
  }
  const lengthSteps = Math.max(6, Math.min(80, state.model3d.segmentCount || 18));
  const widthSteps = Math.max(6, Math.min(48, state.model3d.pointCount * 2 || 12));
  const shaded = state.viewOptions.show3DShaded !== false;
  const moire = state.viewOptions.show3DMoire === true;
  const interactive3D = model3DIsInteracting() && is3DInteractiveView();
  let transform;
  if (moire) {
    const baseLines = getProjectedModel3DLines(board, lengthSteps, widthSteps);
    const all = baseLines.flatMap(lineItem => lineItem.linePoints);
    transform = fitTransform(all, rect, 44);
    const moireLines = getProjectedModel3DMoireLines(board, lengthSteps, widthSteps, interactive3D);
    drawModel3DMoire(moireLines, transform, interactive3D);
  } else if (shaded) {
    const shadedFaces = getProjectedModel3DShadedFaces(board, lengthSteps, widthSteps, interactive3D);
    const bounds = shadedFaces.bounds || { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    transform = fitTransform([
      { x: bounds.minX, y: bounds.minY },
      { x: bounds.minX, y: bounds.maxY },
      { x: bounds.maxX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.maxY }
    ], rect, 44);
    drawModel3DShaded(shadedFaces.faces, transform);
  } else {
    const lines = getProjectedModel3DLines(board, lengthSteps, widthSteps);
    const all = lines.flatMap(lineItem => lineItem.linePoints);
    transform = fitTransform(all, rect, 44);
    lines.forEach(lineItem => {
      const color = lineItem.surface === "deck" ? "#f0a35f" : "#5ac8fa";
      if (lineItem.kind === "rib" && lineItem.projectedBezierKnots?.length) {
        drawProjectedBezierKnots(lineItem.projectedBezierKnots, transform, color, 0.95);
      } else if (lineItem.kind === "stringer") {
        drawSmoothProjectedPath(lineItem.linePoints, transform, color, 0.85);
      } else {
        drawPath(lineItem.linePoints, transform, color, 0.85);
      }
    });
  }
  drawModel3DCenterTracks(board, rect, transform, lengthSteps, widthSteps);
  drawModel3DBottomFeatureGuides(board, transform, lengthSteps);
  const mode = state.model3d.active ? state.model3d.mode : "not approximated";
  const renderMode = moire ? "moire" : shaded ? "shaded" : "wire";
  const bridge = state.model3d?.bridge;
  const presetLabel = bridge?.settings?.preset ? `/${bridge.settings.preset}` : "";
  const bridgeLabel = bridgeShouldRun()
    ? ` / bridge:${bridge?.connected ? (bridge.deviceName || "connected") : (bridge?.lastError ? "offline" : "searching")}${presetLabel}`
    : "";
  label(`3D Model: ${mode} / ${state.model3d.closed ? "closed" : "open"} / ${lengthSteps} x ${widthSteps} / ${renderMode}${interactive3D ? " / preview" : ""}${bridgeLabel}`, rect.left + 24, rect.top + 32, "#d1d1d6");
  label(`Interpolation: ${interpolationLabel(state.crossSectionInterpolation)}`, rect.left + 24, rect.top + 50, "#a1a1aa");
}

function vec3Sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vec3Cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function vec3Dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function vec3Normalize(v) {
  const len = Math.hypot(v.x, v.y, v.z);
  if (len <= 1e-9) return { x: 0, y: 0, z: 1 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function averageFaceDepth(points, board) {
  if (!Array.isArray(points) || !points.length) return -Infinity;
  return points.reduce((sum, point) => sum + rotateBoardPoint(point, board).depth, 0) / points.length;
}

function rotatedVec3(point, board) {
  const rotated = rotateBoardPoint(point, board);
  return {
    x: rotated.x,
    y: rotated.depth,
    z: rotated.z
  };
}

function model3DShadedStepCounts(lengthSteps, widthSteps, interactive = false) {
  if (interactive) {
    return {
      renderLengthSteps: Math.max(24, Math.min(120, Math.round(lengthSteps * 1.8))),
      renderWidthSteps: Math.max(14, Math.min(64, Math.round(widthSteps * 1.8)))
    };
  }
  return {
    renderLengthSteps: Math.max(72, Math.min(320, Math.round(lengthSteps * 4))),
    renderWidthSteps: Math.max(36, Math.min(144, Math.round(widthSteps * 4)))
  };
}

function model3DMoireDensityFactor() {
  const camera = model3DCamera();
  const zoom = clamp(Number(camera?.zoom) || 1, 0.12, 16);
  return clamp(Math.pow(zoom, 0.68), 1, 4.2);
}

function model3DMoireStepCounts(lengthSteps, widthSteps, interactive = false) {
  const density = model3DMoireDensityFactor();
  if (interactive) {
    const base = Math.round(lengthSteps * 1.4 * Math.min(1.25, density));
    return {
      stripeLengthSteps: Math.max(18, Math.min(128, base)),
      stripeWidthSteps: 4
    };
  }
  const base = Math.round(lengthSteps * 8 * density);
  return {
    stripeLengthSteps: Math.max(220, Math.min(1800, base)),
    stripeWidthSteps: 4
  };
}

function buildModel3DFaces(board, renderLengthSteps, renderWidthSteps) {
  const faces = [];
  ["bottom", "deck"].forEach(surface => {
    const rows = [];
    for (let i = 0; i <= renderLengthSteps; i++) {
      rows.push(boardCadSurfaceRowAt(board, boardCadTailDisplayLength(board) * (i / renderLengthSteps), surface, renderWidthSteps));
    }
    [1, -1].forEach(side => {
      for (let i = 0; i < renderLengthSteps; i++) {
        const rowA = rows[i];
        const rowB = rows[i + 1];
        if (!rowA?.length || !rowB?.length) continue;
        for (let j = 0; j < renderWidthSteps; j++) {
          const p00 = rowA[j];
          const p01 = rowA[j + 1];
          const p10 = rowB[j];
          const p11 = rowB[j + 1];
          if (!p00 || !p01 || !p10 || !p11) continue;
          faces.push({
            surface,
            side,
            points: [
              { x: p00.x, y: side * Math.abs(p00.y), z: p00.z },
              { x: p10.x, y: side * Math.abs(p10.y), z: p10.z },
              { x: p11.x, y: side * Math.abs(p11.y), z: p11.z },
              { x: p01.x, y: side * Math.abs(p01.y), z: p01.z }
            ]
          });
        }
      }
    });
  });
  return faces;
}

function getModel3DShadedFaces(board, lengthSteps, widthSteps, interactive = false) {
  const cache = state.model3d.surfaceFaceCache;
  const { renderLengthSteps, renderWidthSteps } = model3DShadedStepCounts(lengthSteps, widthSteps, interactive);
  const key = [
    renderLengthSteps,
    renderWidthSteps,
    interactive ? 1 : 0,
    boardCadTailDisplayLength(board).toFixed(4),
    boardCadTailDisplayShift(board).toFixed(4)
  ].join(":");
  if (cache.revision === state.geometryRevision && cache.key === key) return cache.faces;
  const faces = buildModel3DFaces(board, renderLengthSteps, renderWidthSteps);
  cache.revision = state.geometryRevision;
  cache.key = key;
  cache.faces = faces;
  return faces;
}

function getProjectedModel3DShadedFaces(board, lengthSteps, widthSteps, interactive = false) {
  const cache = state.model3d.shadedProjectionCache;
  const { renderLengthSteps, renderWidthSteps } = model3DShadedStepCounts(lengthSteps, widthSteps, interactive);
  const key = `${renderLengthSteps}:${renderWidthSteps}:${interactive ? 1 : 0}:${cameraProjectionCacheKey(board)}`;
  if (cache.revision === state.geometryRevision && cache.key === key) {
    return { faces: cache.faces, bounds: cache.bounds };
  }
  const faces = getModel3DShadedFaces(board, lengthSteps, widthSteps, interactive);
  const light = vec3Normalize({ x: -0.96, y: 0.14, z: 0.12 });
  const view = vec3Normalize({ x: 0, y: 1, z: 0 });
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const projectedFaces = faces.map(face => {
    const projected = face.points.map(point => projectBoardPoint(point, board));
    projected.forEach(point => {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    });
    const rotated = face.points.map(point => rotatedVec3(point, board));
    let normal = vec3Normalize(vec3Cross(
      vec3Sub(rotated[1], rotated[0]),
      vec3Sub(rotated[3], rotated[0])
    ));
    let facing = vec3Dot(normal, view);
    if (facing < 0) {
      normal = { x: -normal.x, y: -normal.y, z: -normal.z };
      facing = -facing;
    }
    if (facing <= 1e-4) return null;
    const diffuse = Math.max(0, vec3Dot(normal, light));
    const depth = averageFaceDepth(face.points, board);
    const curvature = Math.abs(normal.z) * 0.55 + Math.abs(normal.x) * 0.25;
    return { projected, diffuse, depth, facing, curvature };
  }).filter(Boolean).sort((a, b) => a.depth - b.depth);
  const bounds = Number.isFinite(minX) && Number.isFinite(minY)
    ? { minX, maxX, minY, maxY }
    : { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  cache.revision = state.geometryRevision;
  cache.key = key;
  cache.faces = projectedFaces;
  cache.bounds = bounds;
  return { faces: projectedFaces, bounds };
}

function drawModel3DShaded(projectedFaces, transform) {
  if (!projectedFaces.length) return;
  ctx.save();
  projectedFaces.forEach(face => {
    const lit = clamp(0.18 + face.diffuse * 0.82 + face.curvature * 0.22, 0, 1);
    const toneBase = 68 + (180 * lit);
    const tone = clamp(Math.round(toneBase), 48, 248);
    ctx.beginPath();
    face.projected.forEach((point, index) => {
      const x = transform.x(point.x);
      const y = transform.y(point.y);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = `rgb(${tone}, ${tone}, ${tone})`;
    ctx.fill();
  });
  ctx.restore();
}

function getProjectedModel3DMoireLines(board, lengthSteps, widthSteps, interactive = false) {
  const cache = state.model3d.moireProjectionCache;
  const { stripeLengthSteps, stripeWidthSteps } = model3DMoireStepCounts(lengthSteps, widthSteps, interactive);
  const key = `${stripeLengthSteps}:${stripeWidthSteps}:${interactive ? 1 : 0}:${cameraProjectionCacheKey(board)}`;
  if (cache.revision === state.geometryRevision && cache.key === key) return cache.lines;
  const projectedLines = getProjectedModel3DLines(board, stripeLengthSteps, stripeWidthSteps)
    .filter(lineItem => lineItem.kind === "rib" && lineItem.projectedBezierKnots?.length)
    .map(lineItem => ({
      points: lineItem.linePoints,
      knots: lineItem.projectedBezierKnots
    }));
  cache.revision = state.geometryRevision;
  cache.key = key;
  cache.lines = projectedLines;
  return projectedLines;
}

function drawModel3DMoire(projectedLines, transform, interactive = false) {
  if (!projectedLines.length) return;
  const color = interactive ? "rgba(235,235,235,0.86)" : "rgba(245,245,245,0.96)";
  const width = interactive ? 1.05 : 0.72;
  ctx.save();
  projectedLines.forEach(projected => {
    if (projected?.knots?.length) {
      drawProjectedBezierKnots(projected.knots, transform, color, width);
    }
  });
  ctx.restore();
}

function getModel3DWorldLines(board, lengthSteps, widthSteps) {
  const cache = state.model3d.worldCache;
  const displayLength = boardCadTailDisplayLength(board);
  const key = [
    state.crossSectionInterpolation,
    lengthSteps,
    widthSteps,
    displayLength.toFixed(4),
    boardCadTailDisplayShift(board).toFixed(4),
    board.sections.length,
    String(normalizeTailModeKey(board.tailMode || "")),
    Number(board.tailLength || 0).toFixed(4),
    Number(board.tailDepth || 0).toFixed(4)
  ].join(":");
  if (cache.revision === state.geometryRevision && cache.key === key) return cache.lines;
  const lines = [];
  for (let i = 0; i <= lengthSteps; i++) {
    const x = displayLength * (i / lengthSteps);
    [1, -1].forEach(side => {
      const bezierKnots = boardCadRibBezierWorldKnots(board, x, side);
      if (!bezierKnots.length) return;
      lines.push({
        surface: "rib",
        kind: "rib",
        side,
        points: boardCadRibBezierWorldPoints(bezierKnots),
        bezierKnots
      });
    });
  }
  ["bottom", "deck"].forEach(surface => {
    const rows = [];
    for (let i = 0; i <= lengthSteps; i++) {
      rows.push(boardCadSurfaceRowAt(board, displayLength * (i / lengthSteps), surface, widthSteps));
    }
    for (let j = 0; j <= widthSteps; j++) {
      [1, -1].forEach(side => {
        const points = [];
        rows.forEach(row => {
          const point = row[j];
          if (point) points.push({ x: point.x, y: side * Math.abs(point.y), z: point.z });
        });
        lines.push({ surface, kind: "stringer", side, trackIndex: j, points });
      });
    }
  });
  cache.revision = state.geometryRevision;
  cache.key = key;
  cache.lines = lines;
  return lines;
}

function getProjectedModel3DLines(board, lengthSteps, widthSteps) {
  const cache = state.model3d.projectedCache;
  const worldLines = getModel3DWorldLines(board, lengthSteps, widthSteps);
  const key = `${lengthSteps}:${widthSteps}:${cameraProjectionCacheKey(board)}`;
  if (cache.revision === state.geometryRevision && cache.key === key) return cache.lines;
  const lines = worldLines.map(lineItem => ({
    surface: lineItem.surface,
    kind: lineItem.kind,
    side: lineItem.side,
    trackIndex: lineItem.trackIndex,
    linePoints: lineItem.points.map(point => projectBoardPoint(point, board)),
    projectedBezierKnots: lineItem.bezierKnots?.length ? projectBezierKnots(lineItem.bezierKnots, board) : null
  }));
  cache.revision = state.geometryRevision;
  cache.key = key;
  cache.lines = lines;
  return lines;
}

function getModel3DCenterTrackLines(board, lengthSteps, widthSteps, projected = false) {
  const source = projected
    ? getProjectedModel3DLines(board, lengthSteps, widthSteps)
    : getModel3DWorldLines(board, lengthSteps, widthSteps);
  const result = {};
  source.forEach(lineItem => {
    if (lineItem?.kind !== "stringer") return;
    if ((lineItem.trackIndex ?? -1) !== 0) return;
    if ((lineItem.side ?? 0) !== 1) return;
    const surface = lineItem.surface === "deck" ? "deck" : lineItem.surface === "bottom" ? "bottom" : null;
    if (!surface) return;
    result[surface] = lineItem;
  });
  return result;
}

function activeBottomFeatureGuideSpecs(feature, board) {
  const type = normalizeBottomFeatureType(feature?.type);
  if (!feature || !board) return [];
  if (type === "single-concave") {
    return [{
      label: "edge",
      distance: bottomFeatureReferenceDistanceX(feature, board, feature.width, Infinity),
      color: "#ffd60a"
    }];
  }
  if (type === "double-concave") {
    const offsetRatio = clampNumber(feature.offset, 0.15, 0.8, 0.42);
    const spreadRatio = clampNumber(offsetRatio + (feature.width * 0.5), offsetRatio, 1, Math.min(1, offsetRatio + 0.5));
    return [
      {
        label: "trough",
        distance: bottomFeatureReferenceDistanceX(feature, board, offsetRatio, Infinity),
        color: "#64d2ff"
      },
      {
        label: "edge",
        distance: bottomFeatureReferenceDistanceX(feature, board, spreadRatio, Infinity),
        color: "#ffd60a"
      }
    ];
  }
  if (type === "channel") {
    const centerRatio = clamp01(Number(feature.offset) || 0);
    const outerRatio = bottomFeatureChannelOuterRatio(feature);
    return [
      {
        label: "center",
        distance: bottomFeatureReferenceDistanceX(feature, board, centerRatio, Infinity),
        color: "#64d2ff"
      },
      {
        label: "edge",
        distance: bottomFeatureReferenceDistanceX(feature, board, outerRatio, Infinity),
        color: "#ffd60a"
      }
    ];
  }
  return [];
}

function sampleModel3DBottomGuideSegments(board, feature, guideDistance, side = 1, lengthSteps = 18, projected = false) {
  if (!board || !feature || !Number.isFinite(guideDistance) || guideDistance <= 1e-6) return [];
  const displayLength = boardCadTailDisplayLength(board);
  const start = Number(feature.start) || 0;
  const end = Math.max(start, Number(feature.end) || start);
  const segments = [];
  let current = [];
  for (let i = 0; i <= lengthSteps; i++) {
    const displayX = displayLength * (i / Math.max(1, lengthSteps));
    const { rawX } = boardCadSampleXPair(board, displayX);
    if (rawX < start - 1e-6 || rawX > end + 1e-6) {
      if (current.length >= 2) segments.push(current);
      current = [];
      continue;
    }
    const rocker = boardCadRockerAtPos(board, rawX);
    const knots = boardCadInterpolatedDisplayCrossSectionKnots(board, displayX);
    const planform = boardCadDisplayPlanformAt(board, displayX);
    if (!knots.length || guideDistance < planform.innerY - 1e-6 || guideDistance > planform.outerY + 1e-6) {
      if (current.length >= 2) segments.push(current);
      current = [];
      continue;
    }
    const point = boardCadSurfaceSectionSampleAt(knots, "bottom", guideDistance);
    if (!point) {
      if (current.length >= 2) segments.push(current);
      current = [];
      continue;
    }
    const worldPoint = {
      x: displayX,
      y: side * Math.abs(point.x),
      z: point.y + rocker
    };
    current.push(projected ? projectBoardPoint(worldPoint, board) : worldPoint);
  }
  if (current.length >= 2) segments.push(current);
  return segments;
}

function drawModel3DBottomFeatureGuides(board, transform, lengthSteps) {
  if (!state.viewOptions.showCenterLine) return;
  const feature = currentBottomFeature();
  if (!feature) return;
  const guides = activeBottomFeatureGuideSpecs(feature, board);
  if (!guides.length) return;
  ctx.save();
  guides.forEach(guide => {
    [1, -1].forEach(side => {
      const segments = sampleModel3DBottomGuideSegments(board, feature, guide.distance, side, lengthSteps, true);
      segments.forEach(points => {
        drawSmoothProjectedPath(points, transform, guide.color, 1.15);
      });
    });
  });
  ctx.restore();
}

function centerTrackChordDeviation(points) {
  if (!Array.isArray(points) || points.length < 3) return { maxDeviation: 0, maxAbsY: 0 };
  const start = points[0];
  const end = points[points.length - 1];
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const denom = Math.abs(dx) > 1e-9 ? dx : 0;
  let maxDeviation = 0;
  let maxAbsY = 0;
  points.forEach(point => {
    const expectedZ = Math.abs(denom) > 1e-9
      ? start.z + (((point.x - start.x) / denom) * dz)
      : start.z;
    const deviation = Math.abs(point.z - expectedZ);
    if (deviation > maxDeviation) maxDeviation = deviation;
    const absY = Math.abs(point.y);
    if (absY > maxAbsY) maxAbsY = absY;
  });
  return { maxDeviation, maxAbsY };
}

function drawModel3DCenterTracks(board, rect, transform, lengthSteps, widthSteps) {
  if (!state.viewOptions.showCenterLine) return;
  const projectedTracks = getModel3DCenterTrackLines(board, lengthSteps, widthSteps, true);
  const worldTracks = getModel3DCenterTrackLines(board, lengthSteps, widthSteps, false);
  const specs = [
    { surface: "deck", color: "#f0a35f" },
    { surface: "bottom", color: "#5ac8fa" }
  ];
  ctx.save();
  specs.forEach(spec => {
    const projected = projectedTracks[spec.surface];
    if (!projected?.linePoints?.length) return;
    drawSmoothProjectedPath(projected.linePoints, transform, spec.color, 1.4);
    projected.linePoints.forEach(point => {
      const x = transform.x(point.x);
      const y = transform.y(point.y);
      ctx.beginPath();
      ctx.arc(x, y, 1.7, 0, Math.PI * 2);
      ctx.fillStyle = spec.color;
      ctx.fill();
    });
  });
  ctx.restore();

  const diagnostics = specs.map(spec => {
    const world = worldTracks[spec.surface];
    if (!world?.points?.length) return null;
    const stats = centerTrackChordDeviation(world.points);
    return `${spec.surface === "deck" ? "Deck" : "Bottom"} dZ=${fmt(stats.maxDeviation)} y=${fmt(stats.maxAbsY)}`;
  }).filter(Boolean);
  if (diagnostics.length) {
    label(`3D center tracks(actual): ${diagnostics.join(" / ")}`, rect.left + 24, rect.top + 68, "#a1a1aa");
  }
}

function rotateBoardPoint(point, board) {
  const camera = model3DCamera();
  const x = point.x - boardCadTailDisplayLength(board) / 2;
  const y = point.y;
  const z = point.z - board.thickness / 2;
  const cosYaw = Math.cos(camera.yaw);
  const sinYaw = Math.sin(camera.yaw);
  const cosPitch = Math.cos(camera.pitch);
  const sinPitch = Math.sin(camera.pitch);
  const yawX = x * cosYaw - y * sinYaw;
  const yawY = x * sinYaw + y * cosYaw;
  const pitchY = yawY * cosPitch - z * sinPitch;
  const pitchZ = yawY * sinPitch + z * cosPitch;
  return {
    x: yawX,
    depth: pitchY,
    z: pitchZ
  };
}

function projectBoardPoint(point, board) {
  const rotated = rotateBoardPoint(point, board);
  return {
    x: rotated.x,
    y: rotated.z + rotated.depth * 0.1
  };
}

function averageModelLineDepth(line, board) {
  if (!line?.points?.length) return -Infinity;
  return line.points.reduce((sum, point) => sum + rotateBoardPoint(point, board).depth, 0) / line.points.length;
}

function filterVisibleModelLines(lines, board) {
  if (!Array.isArray(lines) || !lines.length) return [];
  const visible = new Set();
  const stringerGroups = new Map();
  lines.forEach((line, index) => {
    if (line.kind !== "stringer") {
      visible.add(index);
      return;
    }
    const key = `${line.surface}:${line.trackIndex ?? 0}`;
    const depth = averageModelLineDepth(line, board);
    const current = stringerGroups.get(key);
    if (!current || depth > current.depth + 1e-9 || (Math.abs(depth - current.depth) <= 1e-9 && (line.side || 0) > (current.line.side || 0))) {
      stringerGroups.set(key, { index, depth, line });
    }
  });
  stringerGroups.forEach(entry => visible.add(entry.index));
  return lines.filter((_line, index) => visible.has(index));
}

function boardCadRibBezierWorldKnots(board, x, side) {
  const { rawX, displayX } = boardCadSampleXPair(board, x);
  const baseKnots = boardCadBezierDisplayCrossSectionKnotsAt(board, displayX);
  let knots = applyBottomFeaturesToSectionKnots(baseKnots, board, rawX);
  const planform = boardCadDisplayPlanformAt(board, displayX);
  if (planform.innerY > 1e-6) {
    knots = trimFullCrossSectionSplineFromX(knots, planform.innerY);
  }
  const rocker = boardCadRockerAtPos(board, rawX);
  return knots.map(knot => ({
    p: ribPointToWorld(knot.p, displayX, rocker, side),
    prev: ribPointToWorld(knot.prev, displayX, rocker, side),
    next: ribPointToWorld(knot.next, displayX, rocker, side)
  }));
}

function boardCadBezierCrossSectionKnotsAt(board, x) {
  const sections = interpolationSourceSections(board);
  if (!Array.isArray(sections) || sections.length < 3 || x < 0 || x > board.length) return [];
  let index = boardCadNearestCrossSectionIndex({ sections }, x);
  if (index < 0) return [];
  if (sections[index].position > x) index -= 1;
  let nextIndex = index + 1;
  const firstPos = sections[Math.max(0, index)]?.position ?? 0;
  const secondPos = sections[Math.min(sections.length - 1, nextIndex)]?.position ?? firstPos;
  let t = (x - firstPos) / (secondPos - firstPos);
  if (!Number.isFinite(t)) t = 0;
  if (index < 1) index = 1;
  if (nextIndex > sections.length - 2) {
    index = sections.length - 2;
    nextIndex = index;
  }
  const c1 = sections[index];
  const c2 = sections[nextIndex];
  const c1Knots = boardCadCloneKnots(c1.spline);
  const targetKnots = boardCadCrossSectionScaleTo(
    boardCadCloneKnots(c2.spline),
    boardCadCrossSectionCenterThickness(c1Knots),
    boardCadCrossSectionWidth(c1Knots)
  );
  const preferControlPoints = explicitBottomFeatureAffectsInterval(board, firstPos, secondPos);
  const interpolated = (preferControlPoints || c1Knots.length === targetKnots.length)
    ? boardCadCrossSectionInterpolatePair(c1, c2, t, { preferControlPoints })
    : boardCadCrossSectionInterpolate(c1, c2, t);
  const thickness = Math.max(0.5, boardCadThicknessAtPos(board, x));
  const width = Math.max(0.5, boardCadWidthAtPos(board, x));
  return boardCadCrossSectionScaleTo(interpolated, thickness, width);
}

function ribPointToWorld(point, x, rocker, side) {
  return {
    x,
    y: side * Math.abs(point.x),
    z: point.y + rocker
  };
}

function boardCadRibBezierWorldPoints(bezierKnots) {
  const points = [];
  for (let i = 0; i < bezierKnots.length; i++) {
    const knot = bezierKnots[i];
    points.push(knot.p);
    if (i > 0) {
      points.push(bezierKnots[i - 1].next, knot.prev);
    }
  }
  return points;
}

function trimHalfSplineFromX(knots, startX) {
  if (!Array.isArray(knots) || knots.length < 2) return [];
  const targetX = Math.max(0, startX);
  if (targetX <= knots[0].p.x + 1e-9) return boardCadCloneKnots(knots);
  const maxX = boardCadSplineMaxX(knots);
  if (targetX >= maxX - 1e-9) {
    const end = cloneKnot(knots[knots.length - 1]);
    end.prev = { ...end.p };
    end.next = { ...end.p };
    return [end];
  }

  const curves = boardCadCurves(knots);
  const index = boardCadFindMatchingBezierSegment(curves, targetX);
  if (index < 0) return boardCadCloneKnots(knots);
  const t = boardCadCurveTForX(curves[index], targetX);
  const split = boardCadSplitCurveKnot(curves[index], t);
  const first = {
    p: { ...split.knot.p },
    prev: { ...split.knot.p },
    next: { ...split.knot.next },
    continuous: split.knot.continuous,
    other: split.knot.other
  };
  const rest = boardCadCloneKnots(knots.slice(index + 1));
  if (!rest.length) return [first];
  rest[0].prev = { ...split.endPrev };
  return [first, ...rest];
}

function trimFullCrossSectionSplineFromX(knots, startX) {
  if (!Array.isArray(knots) || knots.length < 2 || !(startX > 1e-9)) return boardCadCloneKnots(knots);
  const lowerTrimmed = trimHalfSplineFromX(knots, startX);
  const reversed = reverseSpline(lowerTrimmed);
  return reverseSpline(trimHalfSplineFromX(reversed, startX));
}

function insetRect(rect, left, top, right, bottom) {
  return {
    left: rect.left + left,
    top: rect.top + top,
    width: Math.max(1, rect.width - left - right),
    height: Math.max(1, rect.height - top - bottom)
  };
}

function surfaceLabel(value) {
  if (value === "deck") return "デッキ";
  if (value === "both") return "ハル+デッキ";
  return "ハル";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fitTransform(points, rect, pad = 24) {
  if (!points.length) {
    return {
      x: x => x,
      y: y => y,
      invX: x => x,
      invY: y => y,
      scale: 1
    };
  }
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = Math.max(1e-6, maxX - minX);
  const h = Math.max(1e-6, maxY - minY);
  const baseScale = Math.min((rect.width - pad * 2) / w, (rect.height - pad * 2) / h);
  const viewport = interactiveViewport();
  const scale = baseScale * viewport.zoom;
  const centerX = (rect.left || 0) + rect.width / 2 + viewport.panX;
  const centerY = (rect.top || 0) + rect.height / 2 + viewport.panY;
  const modelCenterX = minX + w / 2;
  const modelCenterY = minY + h / 2;
  return {
    x: x => centerX + (x - modelCenterX) * scale,
    y: y => centerY - (y - modelCenterY) * scale,
    invX: x => modelCenterX + (x - centerX) / scale,
    invY: y => modelCenterY - (y - centerY) / scale,
    scale
  };
}

function interactiveViewport() {
  if (!state.drawingCanvas) return { zoom: 1, panX: 0, panY: 0 };
  if (is3DInteractiveView()) {
    const camera = model3DCamera();
    return {
      zoom: clamp(camera.zoom || 1, 0.12, 16),
      panX: camera.panX || 0,
      panY: camera.panY || 0
    };
  }
  return {
    zoom: clamp(state.view2d.zoom || 1, 0.12, 16),
    panX: state.view2d.panX || 0,
    panY: state.view2d.panY || 0
  };
}

function boardViewTransform(board, points, rect, pad = 24, yOffset = 0) {
  let transform = fitTransform(points, rect, pad);
  if (yOffset) transform = offsetTransform(transform, 0, yOffset);
  if (!state.flipped || !board || !Number.isFinite(board.length)) return transform;
  return {
    x: x => transform.x(board.length - x),
    y: transform.y,
    invX: x => board.length - transform.invX(x),
    invY: transform.invY,
    scale: transform.scale
  };
}

function offsetTransform(transform, dx, dy) {
  return {
    x: x => transform.x(x) + dx,
    y: y => transform.y(y) + dy,
    invX: x => transform.invX(x - dx),
    invY: y => transform.invY(y - dy),
    scale: transform.scale
  };
}

function drawPointSet(points, rect, style, existingTransform) {
  if (!points.length) return;
  const transform = existingTransform || fitTransform(points, rect, 32);
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = transform.x(p.x);
    const y = transform.y(p.y);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  if (state.viewOptions.useFill) {
    ctx.fillStyle = style.fill;
    ctx.fill();
  }
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function splineAnchorPoints(knots = []) {
  return knots.flatMap(knot => ([
    { x: knot.p.x, y: knot.p.y },
    { x: knot.prev.x, y: knot.prev.y },
    { x: knot.next.x, y: knot.next.y }
  ]));
}

function setEditHandles(splines, transform) {
  state.editHandles = [];
  if (state.tool !== "edit") return;
  splines.forEach((spline, splineIndex) => {
    spline.knots.forEach((knot, knotIndex) => {
      state.editHandles.push({ splineIndex, splineLabel: spline.label, knots: spline.knots, knotIndex, pointKey: "p", which: 0, transform });
      state.editHandles.push({ splineIndex, splineLabel: spline.label, knots: spline.knots, knotIndex, pointKey: "prev", which: 1, transform });
      state.editHandles.push({ splineIndex, splineLabel: spline.label, knots: spline.knots, knotIndex, pointKey: "next", which: 2, transform });
    });
  });
}

function drawEditHandles() {
  if (state.tool !== "edit" || !state.viewOptions.showControlPoints || !state.editHandles.length) return;
  ctx.save();
  state.editHandles.forEach(handle => {
    const knot = handle.knots[handle.knotIndex];
    if (!knot) return;
    const point = knot[handle.pointKey];
    const center = knot.p;
    const sx = handle.transform.x(point.x);
    const sy = handle.transform.y(point.y);
    const selected = sameHandle(handle, state.selection);
    if (handle.which !== 0) {
      ctx.beginPath();
      ctx.moveTo(handle.transform.x(center.x), handle.transform.y(center.y));
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = selected ? "#ff6b6b" : "#8e8e93";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(sx, sy, handle.which === 0 ? 4.5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = selected ? "#ff6b6b" : handle.which === 0 ? "#f2f2f7" : "#8ecbff";
    ctx.strokeStyle = handle.which === 0 ? "#1c1c1e" : "#64b5ff";
    ctx.lineWidth = selected ? 2 : 1;
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}

function sameHandle(a, b) {
  return !!a && !!b && a.knots === b.knots && a.knotIndex === b.knotIndex && a.pointKey === b.pointKey;
}

function sameGuidePointHandle(a, b) {
  return !!a && !!b && a.points === b.points && a.index === b.index;
}

function hitEditHandle(screenPoint) {
  let best = null;
  let bestDistance = 10;
  for (const handle of state.editHandles) {
    const knot = handle.knots[handle.knotIndex];
    if (!knot) continue;
    const point = knot[handle.pointKey];
    const distance = Math.hypot(handle.transform.x(point.x) - screenPoint.x, handle.transform.y(point.y) - screenPoint.y);
    if (distance < bestDistance) {
      best = handle;
      bestDistance = distance;
    }
  }
  return best;
}

function hitGuidePoint(screenPoint) {
  if (!state.viewOptions.showGuidePoints) return null;
  let best = null;
  let bestDistance = 10;
  for (const handle of state.guidePointHandles) {
    const point = handle.points[handle.index];
    if (!point) continue;
    const distance = Math.hypot(handle.transform.x(point.x) - screenPoint.x, handle.transform.y(point.y) - screenPoint.y);
    if (distance < bestDistance) {
      best = handle;
      bestDistance = distance;
    }
  }
  return best;
}

function hitFinHandle(screenPoint) {
  if (state.tool !== "edit") return null;
  if (!(state.view === "outline" || (state.view === "quad" && state.quadActivePane === "outline"))) return null;
  let best = null;
  let bestDistance = 12;
  for (const handle of state.finHandles) {
    const rear = { x: handle.transform.x(handle.rear.x), y: handle.transform.y(handle.rear.y) };
    const front = { x: handle.transform.x(handle.front.x), y: handle.transform.y(handle.front.y) };
    const rearDistance = Math.hypot(screenPoint.x - rear.x, screenPoint.y - rear.y);
    const frontDistance = Math.hypot(screenPoint.x - front.x, screenPoint.y - front.y);
    const endpointThreshold = (handle.kind === "side" || handle.kind === "extra") ? 10 : 0;
    let distance = distancePointToSegment(screenPoint, rear, front);
    let dragMode = "move";
    if (endpointThreshold && rearDistance <= endpointThreshold) {
      distance = rearDistance;
      dragMode = "rear";
    } else if (endpointThreshold && frontDistance <= endpointThreshold) {
      distance = frontDistance;
      dragMode = "front";
    }
    if (distance < bestDistance) {
      best = { ...handle, dragMode };
      bestDistance = distance;
    }
  }
  return best;
}

function hitWingHandle(screenPoint) {
  if (state.tool !== "edit") return null;
  if (!(state.view === "outline" || (state.view === "quad" && state.quadActivePane === "outline"))) return null;
  let best = null;
  let bestDistance = 12;
  for (const handle of state.wingHandles) {
    const sx = handle.transform.x(handle.x);
    const sy = handle.transform.y(handle.y);
    const distance = Math.hypot(screenPoint.x - sx, screenPoint.y - sy);
    if (distance < bestDistance) {
      best = handle;
      bestDistance = distance;
    }
  }
  return best;
}

function hitBottomFeatureHandle(screenPoint) {
  if (state.tool !== "edit") return null;
  const bottomFeatureEditable =
    state.view === "outline" ||
    state.view === "sections" ||
    (state.view === "quad" && (state.quadActivePane === "outline" || state.quadActivePane === "cross-section"));
  if (!bottomFeatureEditable) return null;
  const handles = state.bottomFeatureHandles.concat(state.bottomFeatureSectionHandles);

  for (const handle of handles) {
    if (handle.mode === "outline") continue;
    if (!(handle.mode === "outline" && (handle.kind === "depth" || handle.kind === "width"))) continue;
    const sx = Number.isFinite(handle.screenX) ? handle.screenX : handle.transform.x(handle.x);
    const top = Number.isFinite(handle.dragRangeTop) ? handle.dragRangeTop - 10 : (handle.screenRect?.top ?? 0);
    const bottom = Number.isFinite(handle.dragRangeBottom) ? handle.dragRangeBottom + 10 : (handle.screenRect?.bottom ?? top + 1);
    const left = handle.screenRect ? handle.screenRect.left - 10 : sx - 24;
    const right = handle.screenRect ? handle.screenRect.right + 10 : sx + 24;
    if (
      screenPoint.x >= left &&
      screenPoint.x <= right &&
      screenPoint.y >= top &&
      screenPoint.y <= bottom
    ) {
      return handle;
    }
  }

  let best = null;
  let bestDistance = 14;
  for (const handle of handles) {
    if (handle.mode === "outline") continue;
    const sx = handle.mode === "outline" && Number.isFinite(handle.screenX) ? handle.screenX : handle.transform.x(handle.x);
    const sy = handle.mode === "outline" && Number.isFinite(handle.screenY) ? handle.screenY : handle.transform.y(handle.y);
    let distance = Math.hypot(screenPoint.x - sx, screenPoint.y - sy);
    if (handle.mode === "outline" && handle.screenRect && handle.kind !== "range") {
      if (
        screenPoint.x >= handle.screenRect.left - 3 &&
        screenPoint.x <= handle.screenRect.right + 3 &&
        screenPoint.y >= handle.screenRect.top - 3 &&
        screenPoint.y <= handle.screenRect.bottom + 3
      ) {
        distance = 0;
      }
    }
    if (handle.mode === "outline" && handle.kind === "range" && handle.hitBandLeftX !== null && handle.hitBandRightX !== null && handle.hitLineTopY !== null && handle.hitLineBottomY !== null) {
      const left = handle.screenRect ? handle.screenRect.left : Math.min(handle.transform.x(handle.hitBandLeftX), handle.transform.x(handle.hitBandRightX));
      const right = handle.screenRect ? handle.screenRect.right : Math.max(handle.transform.x(handle.hitBandLeftX), handle.transform.x(handle.hitBandRightX));
      const top = handle.screenRect ? handle.screenRect.top : Math.min(handle.transform.y(handle.hitLineTopY), handle.transform.y(handle.hitLineBottomY));
      const bottom = handle.screenRect ? handle.screenRect.bottom : Math.max(handle.transform.y(handle.hitLineTopY), handle.transform.y(handle.hitLineBottomY));
      if (screenPoint.x >= left - 6 && screenPoint.x <= right + 6 && screenPoint.y >= top - 6 && screenPoint.y <= bottom + 6) {
        distance = 0;
      }
    }
    if (distance < bestDistance) {
      best = handle;
      bestDistance = distance;
    }
  }
  return best;
}

function distancePointToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq <= 1e-12) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1);
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
}

function setGuidePointTargetForHandle(handle) {
  if (!handle) return;
  if (handle.label === "Bottom") activateGuideTarget("bottom", { preserveSelection: true });
  else if (handle.label === "Deck") activateGuideTarget("deck", { preserveSelection: true });
  else if (handle.label === "CrossSection") activateGuideTarget("section", { preserveSelection: true });
  else activateGuideTarget("outline", { preserveSelection: true });
}

function canvasPoint(event) {
  const rect = els.canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function registerPointerTransform(key, transform, rect) {
  state.pointerTransforms[key] = { transform, rect };
}

function activePointerTransform(screenPoint) {
  if (state.view === "quad") {
    return state.pointerTransforms.quad || null;
  }
  if (state.view === "sections") return state.pointerTransforms.section || null;
  return state.pointerTransforms[state.view] || null;
}

function updateCursorPoint(event) {
  if (!state.board) return;
  const screen = canvasPoint(event);
  const entry = activePointerTransform(screen);
  state.cursorScreen = screen;
  if (!entry || !pointInRect(screen, entry.rect)) return;
  state.cursorPoint = {
    x: entry.transform.invX(screen.x),
    y: entry.transform.invY(screen.y)
  };
}

function onCanvasPointerDown(event) {
  if (!state.board) return;
  if (event.button === 2) return;
  hideCanvasContextMenu();
  state.contextEditPoint = null;
  updateCursorPoint(event);
  const screenPoint = canvasPoint(event);
  if (is3DInteractiveView()) {
    start3DViewDrag(event, screenPoint);
    return;
  }
  if (state.tool === "pan") {
    start2DViewDrag(event, screenPoint);
    return;
  }
  if (state.tool === "zoom") {
    event.preventDefault();
    zoom2D(event.shiftKey || event.altKey ? 1 / 1.18 : 1.18);
    return;
  }
  if (state.tool === "spot") {
    event.preventDefault();
    showSpotCheck(screenPoint);
    return;
  }
  if (state.tool !== "edit") return;
  const hit = hitEditHandle(screenPoint);
  const bottomFeatureHit = hitBottomFeatureHandle(screenPoint);
  if (bottomFeatureHit) {
    event.preventDefault();
    state.selection = null;
    clearGuidePointSelection();
    state.wingSelection = null;
    state.bottomFeatureSelection = normalizedBottomFeatureSelection(bottomFeatureHit);
    state.lastEditPoint = boardPointFromHandleEvent(bottomFeatureHit, event);
    syncBottomFeaturePanel(bottomFeatureHit.featureIndex);
    state.drag = {
      type: bottomFeatureHit.mode === "section" ? "bottom-feature-section" : "bottom-feature",
      handle: bottomFeatureHit,
      before: cloneBoard(state.board),
      start: boardPointFromHandleEvent(bottomFeatureHit, event),
      originalFeature: { ...bottomFeatureHit.feature },
      moved: false
    };
    els.canvas.setPointerCapture?.(event.pointerId);
    updateBoardPanel();
    updateEditInfo();
    updateHistoryButtons();
    draw();
    return;
  }
  if (state.view === "sections" && setCurrentSectionFromPoint(screenPoint)) {
    event.preventDefault();
    state.selection = null;
    state.lastEditPoint = null;
    updateSectionInfo();
    updateEditInfo();
    updateHistoryButtons();
    draw();
    return;
  }
  if (state.view === "quad" && setQuadActivePaneFromPoint(screenPoint)) {
    event.preventDefault();
    state.selection = null;
    state.lastEditPoint = null;
    updateEditInfo();
    updateHistoryButtons();
    draw();
    return;
  }
  if (hit) {
    event.preventDefault();
    state.selection = hit;
    clearGuidePointSelection();
    state.wingSelection = null;
    state.bottomFeatureSelection = null;
    state.lastEditPoint = boardPointFromHandleEvent(hit, event);
    state.drag = {
      type: "controlpoint",
      handle: hit,
      before: cloneBoard(state.board),
      originalKnot: cloneKnot(hit.knots[hit.knotIndex]),
      start: boardPointFromHandleEvent(hit, event),
      moved: false
    };
    els.canvas.setPointerCapture?.(event.pointerId);
    updateEditInfo();
    updateHistoryButtons();
    draw();
    return;
  }
  const guideHit = hitGuidePoint(screenPoint);
  if (guideHit) {
    event.preventDefault();
    state.selection = null;
    state.wingSelection = null;
    state.bottomFeatureSelection = null;
    state.guidePointSelection = guideHit;
    state.selectedGuidePointIndex = guideHit.index;
    setGuidePointTargetForHandle(guideHit);
    state.lastEditPoint = boardPointFromHandleEvent(guideHit, event);
    state.drag = {
      type: "guidepoint",
      handle: guideHit,
      before: cloneBoard(state.board),
      start: boardPointFromHandleEvent(guideHit, event),
      originalPoint: { ...guideHit.points[guideHit.index] },
      moved: false
    };
    els.canvas.setPointerCapture?.(event.pointerId);
    updateGuidePointPanel();
    updateEditInfo();
    updateHistoryButtons();
    draw();
    return;
  }
  const wingHit = hitWingHandle(screenPoint);
  if (wingHit) {
    event.preventDefault();
    state.selection = null;
    clearGuidePointSelection();
    state.wingSelection = wingHit;
    state.bottomFeatureSelection = null;
    state.lastEditPoint = boardPointFromHandleEvent(wingHit, event);
    const currentWing = normalizedWingConfig(state.board);
    state.drag = {
      type: "wing",
      handle: wingHit,
      before: cloneBoard(state.board),
      start: boardPointFromHandleEvent(wingHit, event),
      originalWing: {
        preset: normalizeWingPresetKey(state.board.wingPreset) || "custom",
        position: Number(state.board.wingPosition) || 0,
        width: Number(state.board.wingWidth) || 0,
        shape: currentWing.shape || normalizeWingShapeKey(state.board.wingShape) || "bump",
        shoulder: currentWing.shoulder,
        transition: currentWing.transition,
        rawHalf: rawOutlineHalfPoints(state.board, getSegments())
      },
      moved: false
    };
    els.canvas.setPointerCapture?.(event.pointerId);
    updateBoardPanel();
    updateEditInfo();
    updateHistoryButtons();
    draw();
    return;
  }
  const finHit = hitFinHandle(screenPoint);
  if (finHit) {
    event.preventDefault();
    state.selection = null;
    clearGuidePointSelection();
    state.wingSelection = null;
    state.bottomFeatureSelection = null;
    state.lastEditPoint = boardPointFromHandleEvent(finHit, event);
    state.drag = {
      type: "fin",
      handle: finHit,
      before: cloneBoard(state.board),
      start: boardPointFromHandleEvent(finHit, event),
      originalFins: normalizedFins(state.board.fins),
      originalFinExtra: normalizeFinExtra(state.board.finExtra),
      moved: false
    };
    els.canvas.setPointerCapture?.(event.pointerId);
    updateGuidePointPanel();
    updateEditInfo();
    updateHistoryButtons();
    draw();
    return;
  }
  if (!hit) {
    const fallbackHandle = state.editHandles[0];
    if (fallbackHandle) state.lastEditPoint = boardPointFromHandleEvent(fallbackHandle, event);
    state.selection = null;
    clearGuidePointSelection();
    state.wingSelection = null;
    state.bottomFeatureSelection = null;
    updateGuidePointPanel();
    updateEditInfo();
    updateHistoryButtons();
    draw();
    return;
  }
}

function onCanvasContextMenu(event) {
  event.preventDefault();
  if (!state.board) {
    hideCanvasContextMenu();
    return;
  }
  closeMenus();
  updateCursorPoint(event);
  const screenPoint = canvasPoint(event);
  const entry = activePointerTransform(screenPoint);
  const editable = state.tool === "edit" && entry && pointInRect(screenPoint, entry.rect) && getActiveEditableSplines().length > 0;
  state.contextEditPoint = editable ? {
    x: entry.transform.invX(screenPoint.x),
    y: entry.transform.invY(screenPoint.y)
  } : null;
  const guideHit = editable ? hitGuidePoint(screenPoint) : null;
  const hit = editable && !guideHit ? hitEditHandle(screenPoint) : null;
  if (hit) {
    state.selection = hit;
    clearGuidePointSelection();
    state.lastEditPoint = state.contextEditPoint;
    updateEditInfo();
    updateHistoryButtons();
    draw();
  } else if (guideHit) {
    state.selection = null;
    state.wingSelection = null;
    state.guidePointSelection = guideHit;
    state.selectedGuidePointIndex = guideHit.index;
    setGuidePointTargetForHandle(guideHit);
    state.lastEditPoint = state.contextEditPoint;
    updateGuidePointPanel();
    updateEditInfo();
    updateHistoryButtons();
    draw();
  } else {
    const wingHit = editable ? hitWingHandle(screenPoint) : null;
    if (wingHit) {
      state.selection = null;
      clearGuidePointSelection();
      state.wingSelection = wingHit;
      state.lastEditPoint = state.contextEditPoint;
      updateBoardPanel();
      updateEditInfo();
      updateHistoryButtons();
      draw();
    } else if (editable) {
      state.lastEditPoint = state.contextEditPoint;
      state.selection = null;
      clearGuidePointSelection();
      updateEditInfo();
      updateHistoryButtons();
      draw();
    }
  }
  showCanvasContextMenu(event.clientX, event.clientY, editable);
}

function showCanvasContextMenu(clientX, clientY, editable) {
  const menu = els.canvasContextMenu;
  if (!menu) return;
  updateCanvasContextMenuState(editable);
  menu.hidden = false;
  const menuRect = menu.getBoundingClientRect();
  const margin = 6;
  const left = Math.min(clientX, window.innerWidth - menuRect.width - margin);
  const top = Math.min(clientY, window.innerHeight - menuRect.height - margin);
  menu.style.left = `${Math.max(margin, left)}px`;
  menu.style.top = `${Math.max(margin, top)}px`;
}

function hideCanvasContextMenu(clearPoint = false) {
  if (els.canvasContextMenu) els.canvasContextMenu.hidden = true;
  if (clearPoint) state.contextEditPoint = null;
}

function updateCanvasContextMenuState(editable = null) {
  const canEdit = editable ?? (state.tool === "edit" && !!state.board && !!state.contextEditPoint && getActiveEditableSplines().length > 0);
  if (els.contextAddControlPoint) els.contextAddControlPoint.disabled = !canEdit || !canAddControlPoint();
  if (els.contextDeleteControlPoint) els.contextDeleteControlPoint.disabled = !canEdit || !canDeleteControlPoint();
  if (els.contextMakeContinuous) els.contextMakeContinuous.disabled = !canEdit || !canMakeSelectedContinuous();
  if (els.contextAddGuidePoint) els.contextAddGuidePoint.disabled = !canEdit || !contextGuidePoints();
  if (els.contextEditGuidePoint) els.contextEditGuidePoint.disabled = !canDeleteSelectedGuidePoint();
  if (els.contextDeleteGuidePoint) els.contextDeleteGuidePoint.disabled = !canDeleteSelectedGuidePoint();
  if (els.contextLockX) els.contextLockX.checked = !!state.editLocks.x;
  if (els.contextLockY) els.contextLockY.checked = !!state.editLocks.y;
  if (els.contextLockZ) els.contextLockZ.checked = !!state.editLocks.z;
  if (els.contextViewBlank) els.contextViewBlank.checked = !!state.viewOptions.viewBlank;
  if (els.contextViewDeckToolpath) els.contextViewDeckToolpath.checked = !!state.viewOptions.showDeckToolpath;
  if (els.contextViewBottomToolpath) els.contextViewBottomToolpath.checked = !!state.viewOptions.showBottomToolpath;
}

function runCanvasContextAction(action) {
  if (!action) return;
  if (action === "fit") fitView();
  if (action === "spot-check" && state.cursorScreen) showSpotCheck(state.cursorScreen);
  if (action === "toggle-deck-bottom") flipBoardView();
  if (action === "add-guidepoint") addGuidePointAtContext();
  if (action === "guide-points") showContextGuidePoints();
  if (action === "edit-guidepoint") editSelectedGuidePoint();
  if (action === "delete-guidepoint") deleteSelectedGuidePoint();
  if (action === "add-controlpoint") addControlPoint();
  if (action === "delete-controlpoint") deleteSelectedControlPoint();
  if (action === "make-continuous") makeSelectedContinuousFromContext();
  if (action === "cross-sections") setView("sections");
  hideCanvasContextMenu(true);
}

function syncViewOptionInputs() {
  document.querySelectorAll("[data-view-option]").forEach(input => {
    const option = input.dataset.viewOption;
    if (option in state.viewOptions) input.checked = !!state.viewOptions[option];
  });
}

function showContextGuidePoints() {
  if (!state.board) return;
  if (!state.viewOptions.showGuidePoints) {
    state.viewOptions.showGuidePoints = true;
    syncViewOptionInputs();
  }
  activateGuideTarget(contextGuideTarget() || currentGuideTargetValue(), { openPanel: true });
  updateBoardPanel();
  setStatus("status_guide_points_shown");
}

function contextGuidePoints() {
  if (!state.board) return null;
  const target = contextGuideTarget();
  if (target === "outline") return state.board.outlineGuidePoints;
  if (target === "bottom") return state.board.bottomGuidePoints;
  if (target === "deck") return state.board.deckGuidePoints;
  if (target === "section") {
    const section = currentCrossSection();
    if (section && !section.guidePoints) section.guidePoints = [];
    return section ? section.guidePoints : null;
  }
  return null;
}

function contextGuideTarget() {
  if (state.view === "outline" || (state.view === "quad" && state.quadActivePane === "outline")) return "outline";
  if (state.view === "sections" || (state.view === "quad" && state.quadActivePane === "cross-section")) return "section";
  if (state.view === "profile" || (state.view === "quad" && state.quadActivePane === "profile")) {
    if (!state.contextEditPoint) return "bottom";
    return nearestProfileSplineLabel(state.contextEditPoint).toLowerCase();
  }
  return null;
}

function nearestProfileSplineLabel(point) {
  if (!state.board || !point) return "Bottom";
  const x = clamp(point.x, 0, state.board.length);
  const bottomDistance = Math.abs(boardCadSplineValueAt(state.board.bottom, x) - point.y);
  const deckDistance = Math.abs(boardCadSplineValueAt(state.board.deck, x) - point.y);
  return deckDistance < bottomDistance ? "Deck" : "Bottom";
}

function addGuidePointAtContext() {
  const points = contextGuidePoints();
  if (!points || !state.contextEditPoint) return;
  const before = cloneBoard(state.board);
  const index = points.length;
  points.push({ ...state.contextEditPoint });
  state.selectedGuidePointIndex = index;
  activateGuideTarget(contextGuideTarget() || currentGuideTargetValue(), { preserveSelection: true });
  commitBoardMutation(before);
  selectGuidePoint(points, index);
  updateGuidePointPanel();
  updateEditInfo();
  setStatus("status_guide_point_added");
}

function selectGuidePoint(points, index) {
  state.guidePointSelection = null;
  state.selectedGuidePointIndex = index;
  const handle = state.guidePointHandles.find(item => item.points === points && item.index === index);
  if (handle) {
    state.guidePointSelection = handle;
    setGuidePointTargetForHandle(handle);
    state.lastEditPoint = handle.points[handle.index] || state.lastEditPoint;
  }
}

function showSpotCheck(screenPoint) {
  const entry = activePointerTransform(screenPoint);
  if (!entry || !pointInRect(screenPoint, entry.rect)) {
    setStatus("status_spot_click_inside");
    return;
  }
  const x = entry.transform.invX(screenPoint.x);
  const y = entry.transform.invY(screenPoint.y);
  if (state.view === "outline" || (state.view === "quad" && state.quadActivePane === "outline")) {
    const rawPos = Math.max(0, Math.min(state.board.length, x));
    const displayPos = boardCadDisplayXFromRawX(state.board, rawPos);
    setStatus("status_spot_outline", {
      x: fmt(displayPos),
      y: fmt(y),
      width: fmt(boardCadDisplayWidthAtPos(state.board, displayPos))
    });
    return;
  }
  if (state.view === "profile" || (state.view === "quad" && state.quadActivePane === "profile")) {
    const rawPos = Math.max(0, Math.min(state.board.length, x));
    const displayPos = boardCadDisplayXFromRawX(state.board, rawPos);
    const rocker = boardCadRockerAtPos(state.board, rawPos);
    const deck = boardCadDeckAtPos(state.board, rawPos);
    setStatus("status_spot_profile", {
      x: fmt(displayPos),
      y: fmt(y),
      rocker: fmt(rocker),
      deck: fmt(deck),
      thickness: fmt(deck - rocker)
    });
    return;
  }
  if (state.view === "sections" || (state.view === "quad" && state.quadActivePane === "cross-section")) {
    const section = state.view === "quad" ? currentQuadCrossSection(state.board) : currentCrossSection();
    if (!section) return;
    const halfWidth = boardCadCrossSectionWidth(section.spline) / 2;
    const pos = Math.max(0, Math.min(halfWidth, Math.abs(x)));
    const bottom = boardCadCrossSectionBottomAt(section.spline, pos);
    const deck = boardCadCrossSectionDeckAt(section.spline, pos);
    setStatus("status_spot_cross_section", {
      x: fmt(pos),
      y: fmt(y),
      bottom: fmt(bottom),
      deck: fmt(deck),
      thickness: fmt(deck - bottom)
    });
    return;
  }
  setStatus("status_spot_generic", { x: fmt(x), y: fmt(y) });
}

function start2DViewDrag(event, screenPoint) {
  event.preventDefault();
  state.viewDrag = {
    type: "2d-pan",
    startScreen: screenPoint,
    startPanX: state.view2d.panX,
    startPanY: state.view2d.panY
  };
  els.canvas.setPointerCapture?.(event.pointerId);
}

function start3DViewDrag(event, screenPoint) {
  event.preventDefault();
  const camera = model3DCamera();
  state.viewDrag = {
    type: event.shiftKey || event.button === 1 || event.button === 2 ? "3d-pan" : "3d-rotate",
    startScreen: screenPoint,
    startYaw: camera.yaw,
    startPitch: camera.pitch,
    startPanX: camera.panX,
    startPanY: camera.panY
  };
  els.canvas.setPointerCapture?.(event.pointerId);
}

function setQuadActivePaneFromPoint(point) {
  if (state.view !== "quad") return false;
  const pane = state.quadPanes.find(item => pointInRect(point, item.rect));
  if (!pane || pane.id === state.quadActivePane) return false;
  state.quadActivePane = pane.id;
  return true;
}

function pointInRect(point, rect) {
  return point.x >= rect.left && point.x <= rect.left + rect.width && point.y >= rect.top && point.y <= rect.top + rect.height;
}

function setCurrentSectionFromPoint(point) {
  const cell = state.sectionCells.find(item => pointInRect(point, {
    left: item.rect.left - 12,
    top: item.rect.top - 22,
    width: item.rect.width + 24,
    height: item.rect.height + 40
  }));
  if (!cell || cell.sectionIndex === state.currentSectionIndex) return false;
  state.currentSectionIndex = cell.sectionIndex;
  return true;
}

function onCanvasPointerMove(event) {
  updateCursorPoint(event);
  if (state.viewDrag) {
    event.preventDefault();
    updateViewDrag(event);
    return;
  }
  if (!state.drag) {
    if (state.viewOptions.showSlidingInfo || state.viewOptions.showSlidingCrossSection) draw();
    return;
  }
  event.preventDefault();
  if (state.drag.type === "guidepoint") {
    const current = boardPointFromHandleEvent(state.drag.handle, event);
    state.lastEditPoint = current;
    const dx = state.editLocks.x ? 0 : current.x - state.drag.start.x;
    const dy = state.editLocks.y ? 0 : current.y - state.drag.start.y;
    if (Math.hypot(dx, dy) > 1e-6) state.drag.moved = true;
    state.drag.handle.points[state.drag.handle.index] = {
      x: state.drag.originalPoint.x + dx,
      y: state.drag.originalPoint.y + dy
    };
    updateGuidePointPanel();
    draw();
    return;
  }
  if (state.drag.type === "fin") {
    const current = boardPointFromHandleEvent(state.drag.handle, event);
    state.lastEditPoint = current;
    const dx = state.editLocks.x ? 0 : current.x - state.drag.start.x;
    const dy = state.editLocks.y ? 0 : current.y - state.drag.start.y;
    if (Math.hypot(dx, dy) > 1e-6) state.drag.moved = true;
    moveFinDrag(state.drag.handle, state.drag.originalFins, dx, dy, state.drag.originalFinExtra);
    updateBoardPanel();
    updateInfo();
    draw();
    return;
  }
  if (state.drag.type === "wing") {
    const current = boardPointFromHandleEvent(state.drag.handle, event);
    state.lastEditPoint = current;
    const dx = current.x - state.drag.start.x;
    const dy = current.y - state.drag.start.y;
    if (Math.hypot(dx, dy) > 1e-6) state.drag.moved = true;
    moveWingDrag(state.drag.handle, state.drag.originalWing, dx, dy);
    markGeometryDirty();
    updateBoardPanel();
    updateEditInfo();
    draw();
    return;
  }
  if (state.drag.type === "bottom-feature") {
    if (state.drag.handle?.action === "set-depth" || state.drag.handle?.action === "set-width") {
      const overlayScreenY = Number.isFinite(event?.clientY)
        ? Number(event.clientY)
        : canvasPoint(event).y;
      state.lastEditPoint = boardPointFromHandleEvent(state.drag.handle, event);
      if (Math.abs(overlayScreenY - (state.drag.startScreenY ?? overlayScreenY)) > 1e-6) state.drag.moved = true;
      moveBottomFeatureDrag(
        state.drag.handle,
        state.drag.originalFeature,
        state.drag.handle.x,
        overlayScreenY
      );
      updateBottomFeatureDragUI(Number.isFinite(state.drag.handle?.listIndex) ? state.drag.handle.listIndex : state.drag.handle?.featureIndex, { includeEditInfo: true, liveDrag: true });
      draw();
      return;
    }
    const current = boardPointFromHandleEvent(state.drag.handle, event);
    state.lastEditPoint = current;
    const baseX = Number.isFinite(state.drag.overlayAnchorBoardX)
      ? state.drag.overlayAnchorBoardX
      : state.drag.start.x;
    const dx = current.x - baseX;
    if (Math.abs(dx) > 1e-6) state.drag.moved = true;
    const nextDisplayX = Number.isFinite(state.drag.handleBoardX)
      ? state.drag.handleBoardX + dx
      : state.drag.start.x + dx;
    moveBottomFeatureDrag(state.drag.handle, state.drag.originalFeature, nextDisplayX, canvasPoint(event).y);
    updateBottomFeatureDragUI(Number.isFinite(state.drag.handle?.listIndex) ? state.drag.handle.listIndex : state.drag.handle?.featureIndex, { includeEditInfo: true, liveDrag: true });
    draw();
    return;
  }
  if (state.drag.type === "bottom-feature-section") {
    const current = boardPointFromHandleEvent(state.drag.handle, event);
    state.lastEditPoint = current;
    const dx = current.x - state.drag.start.x;
    const dy = current.y - state.drag.start.y;
    if (Math.hypot(dx, dy) > 1e-6) state.drag.moved = true;
    moveBottomFeatureSectionDrag(state.drag.handle, state.drag.originalFeature, current);
    updateBottomFeatureDragUI(Number.isFinite(state.drag.handle?.listIndex) ? state.drag.handle.listIndex : state.drag.handle?.featureIndex, { includeEditInfo: true, liveDrag: true });
    draw();
    return;
  }
  const current = boardPointFromHandleEvent(state.drag.handle, event);
  state.lastEditPoint = current;
  const dx = state.editLocks.x ? 0 : current.x - state.drag.start.x;
  const dy = state.editLocks.y ? 0 : current.y - state.drag.start.y;
  if (Math.hypot(dx, dy) > 1e-6) state.drag.moved = true;
  moveKnotPoint(state.drag.handle.knots[state.drag.handle.knotIndex], state.drag.originalKnot, state.drag.handle.which, dx, dy);
  markGeometryDirty();
  updateEditInfo();
  draw();
}

function updateViewDrag(event) {
  const screen = canvasPoint(event);
  const drag = state.viewDrag;
  const dx = screen.x - drag.startScreen.x;
  const dy = screen.y - drag.startScreen.y;
  if (drag.type === "2d-pan") {
    state.view2d.panX = drag.startPanX + dx;
    state.view2d.panY = drag.startPanY + dy;
  } else {
    const camera = model3DCamera();
    if (drag.type === "3d-pan") {
      camera.panX = drag.startPanX + dx;
      camera.panY = drag.startPanY + dy;
    } else {
      camera.yaw = drag.startYaw + dx * 0.008;
      camera.pitch = clamp(drag.startPitch - dy * 0.008, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
      camera.preset = "free";
    }
  }
  draw();
}

function onCanvasPointerUp() {
  if (state.viewDrag) {
    state.viewDrag = null;
    return;
  }
  if (!state.drag) return;
  if (state.drag.moved) {
    let handledSummaryUpdate = false;
    applyBoardCadDerivedMetrics(state.board);
    markGeometryDirty();
    state.history.undo.push(state.drag.before);
    state.history.redo = [];
    trimHistory();
    if (state.drag.type === "guidepoint") {
      state.selectedGuidePointIndex = state.drag.handle.index;
      updateGuidePointPanel();
      updateEditInfo();
    } else if (state.drag.type === "wing") {
      updateBoardPanel();
      updateInfo();
      updateEditInfo();
    } else if (state.drag.type === "bottom-feature" || state.drag.type === "bottom-feature-section") {
      state.bottomFeatureSelection = normalizedBottomFeatureSelection(state.drag.handle);
      updateBottomFeatureDragUI(Number.isFinite(state.drag.handle?.listIndex) ? state.drag.handle.listIndex : state.drag.handle?.featureIndex, {
        includeInfo: true,
        includeSectionInfo: true,
        includeEditInfo: true
      });
      handledSummaryUpdate = true;
    } else if (state.drag.type === "fin") {
      updateBoardPanel();
    }
    if (!handledSummaryUpdate) {
      updateInfo();
      updateSectionInfo();
    }
  }
  state.drag = null;
  updateHistoryButtons();
  draw();
}

function onCanvasPointerLeave() {
  state.cursorPoint = null;
  state.cursorScreen = null;
  if (state.viewDrag) {
    state.viewDrag = null;
    return;
  }
  if (state.viewOptions.showSlidingInfo || state.viewOptions.showSlidingCrossSection) draw();
}

function onCanvasWheel(event) {
  if (!state.board) return;
  event.preventDefault();
  const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
  if (is3DInteractiveView()) zoom3D(factor, true);
  else zoom2D(factor);
}

function zoom2D(factor) {
  state.view2d.zoom = clamp((state.view2d.zoom || 1) * factor, 0.12, 16);
  draw();
}

function zoom3D(factor, interactive = false) {
  const camera = model3DCamera();
  camera.zoom = clamp((camera.zoom || 1) * factor, 0.12, 16);
  if (interactive) scheduleModel3DInteractiveRedraw(160);
  draw();
}

function boardPointFromHandleEvent(handle, event) {
  const point = canvasPoint(event);
  return {
    x: handle.transform.invX(point.x),
    y: handle.transform.invY(point.y)
  };
}

function moveKnotPoint(knot, original, which, dx, dy) {
  if (which === 0) {
    knot.p = { x: original.p.x + dx, y: original.p.y + dy };
    knot.prev = { x: original.prev.x + dx, y: original.prev.y + dy };
    knot.next = { x: original.next.x + dx, y: original.next.y + dy };
    return;
  }
  const movingKey = which === 1 ? "prev" : "next";
  const oppositeKey = which === 1 ? "next" : "prev";
  knot[movingKey] = {
    x: original[movingKey].x + dx,
    y: original[movingKey].y + dy
  };
  if (knot.continuous) {
    const vx = knot[movingKey].x - knot.p.x;
    const vy = knot[movingKey].y - knot.p.y;
    const len = Math.hypot(vx, vy);
    const oppositeLen = Math.hypot(original[oppositeKey].x - original.p.x, original[oppositeKey].y - original.p.y);
    if (len > 1e-9) {
      knot[oppositeKey] = {
        x: knot.p.x - (vx / len) * oppositeLen,
        y: knot.p.y - (vy / len) * oppositeLen
      };
    }
  }
}

function drawPath(points, transform, color, width) {
  if (!points.length) return;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = transform.x(p.x);
    const y = transform.y(p.y);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawTailTransomLine(planform, transform, color = "#5ac8fa", width = 1.4) {
  const first = planform?.positive?.[0];
  if (!first || Math.abs(first.x) > 1e-6 || !(first.y > 1e-6)) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(transform.x(first.x), transform.y(first.y));
  ctx.lineTo(transform.x(first.x), transform.y(-first.y));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function drawProjectedBezierKnots(bezierKnots, transform, color, width) {
  if (!bezierKnots.length) return;
  ctx.beginPath();
  const first = bezierKnots[0].p;
  ctx.moveTo(transform.x(first.x), transform.y(first.y));
  for (let i = 1; i < bezierKnots.length; i++) {
    const previous = bezierKnots[i - 1];
    const current = bezierKnots[i];
    const c1 = previous.next;
    const c2 = current.prev;
    const end = current.p;
    ctx.bezierCurveTo(
      transform.x(c1.x), transform.y(c1.y),
      transform.x(c2.x), transform.y(c2.y),
      transform.x(end.x), transform.y(end.y)
    );
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawSmoothProjectedPath(points, transform, color, width) {
  const filtered = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (filtered.length < 3) {
    drawPath(filtered, transform, color, width);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(transform.x(filtered[0].x), transform.y(filtered[0].y));
  for (let i = 0; i < filtered.length - 1; i++) {
    const p0 = filtered[Math.max(0, i - 1)];
    const p1 = filtered[i];
    const p2 = filtered[i + 1];
    const p3 = filtered[Math.min(filtered.length - 1, i + 2)];
    const controls = smoothPathSegmentControls(p0, p1, p2, p3);
    const c1 = controls.c1;
    const c2 = controls.c2;
    ctx.bezierCurveTo(
      transform.x(c1.x), transform.y(c1.y),
      transform.x(c2.x), transform.y(c2.y),
      transform.x(p2.x), transform.y(p2.y)
    );
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function smoothPathSegmentControls(p0, p1, p2, p3) {
  const segment = { x: p2.x - p1.x, y: p2.y - p1.y };
  const prev = { x: p1.x - p0.x, y: p1.y - p0.y };
  const next = { x: p3.x - p2.x, y: p3.y - p2.y };
  const len = Math.hypot(segment.x, segment.y);
  const lenPrev = Math.hypot(prev.x, prev.y);
  const lenNext = Math.hypot(next.x, next.y);
  if (len <= 1e-9) return { c1: { ...p1 }, c2: { ...p2 } };
  const segDir = normalizePoint(segment, { x: 1, y: 0 });
  const dir1 = averageSegmentDirection(prev, segment, segDir);
  const dir2 = averageSegmentDirection(segment, next, segDir);
  const bbox = {
    minX: Math.min(p0.x, p1.x, p2.x, p3.x),
    maxX: Math.max(p0.x, p1.x, p2.x, p3.x),
    minY: Math.min(p0.y, p1.y, p2.y, p3.y),
    maxY: Math.max(p0.y, p1.y, p2.y, p3.y)
  };
  const scales = [1, 0.6, 0.35, 0];
  for (const scale of scales) {
    const handle1 = Math.min(len, lenPrev || len) * 0.35 * scale;
    const handle2 = Math.min(len, lenNext || len) * 0.35 * scale;
    const c1 = {
      x: p1.x + dir1.x * handle1,
      y: p1.y + dir1.y * handle1
    };
    const c2 = {
      x: p2.x - dir2.x * handle2,
      y: p2.y - dir2.y * handle2
    };
    if (scale === 0 || smoothPathControlsAreStable(p1, c1, c2, p2, bbox, len)) {
      return { c1, c2 };
    }
  }
  return { c1: { ...p1 }, c2: { ...p2 } };
}

function normalizePoint(vector, fallback = { x: 0, y: 0 }) {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= 1e-9) return { ...fallback };
  return { x: vector.x / length, y: vector.y / length };
}

function averageSegmentDirection(a, b, fallback) {
  const na = normalizePoint(a, fallback);
  const nb = normalizePoint(b, fallback);
  const sum = { x: na.x + nb.x, y: na.y + nb.y };
  let dir = normalizePoint(sum, fallback);
  if ((dir.x * fallback.x + dir.y * fallback.y) < 0.15) dir = { ...fallback };
  return dir;
}

function smoothPathControlsAreStable(p1, c1, c2, p2, bbox, segmentLength) {
  const mid = cubicBezierPoint(p1, c1, c2, p2, 0.5);
  const margin = Math.max(0.25, segmentLength * 0.12);
  if (mid.x < bbox.minX - margin || mid.x > bbox.maxX + margin || mid.y < bbox.minY - margin || mid.y > bbox.maxY + margin) return false;
  const deviation = pointDistanceToSegment(mid, p1, p2);
  return deviation <= Math.max(0.35, segmentLength * 0.3);
}

function cubicBezierPoint(p0, c1, c2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: (mt2 * mt * p0.x) + (3 * mt2 * t * c1.x) + (3 * mt * t2 * c2.x) + (t2 * t * p3.x),
    y: (mt2 * mt * p0.y) + (3 * mt2 * t * c1.y) + (3 * mt * t2 * c2.y) + (t2 * t * p3.y)
  };
}

function filterGuidePointsByX(points = [], minX = 0) {
  const visiblePoints = [];
  const indexMap = [];
  points.forEach((point, index) => {
    if (!point || point.x < minX - 1e-9) return;
    visiblePoints.push(point);
    indexMap.push(index);
  });
  return { points: visiblePoints, indexMap };
}

function drawGuidePoints(points = [], transform, labelName = "GuidePoints", sourcePoints = points, indexMap = null) {
  if (!points.length) return;
  ctx.save();
  ctx.fillStyle = "#ff9f0a";
  ctx.strokeStyle = "#bf7b1a";
  ctx.lineWidth = 1;
  points.forEach((point, index) => {
    const sourceIndex = Array.isArray(indexMap) ? indexMap[index] : index;
    const x = transform.x(point.x);
    const y = transform.y(point.y);
    const selected = sameGuidePointHandle({ points: sourcePoints, index: sourceIndex }, state.guidePointSelection);
    state.guidePointHandles.push({ points: sourcePoints, index: sourceIndex, label: labelName, transform });
    ctx.beginPath();
    ctx.arc(x, y, selected ? 5.5 : 4, 0, Math.PI * 2);
    ctx.fillStyle = selected ? "#ff6b6b" : "#ff9f0a";
    ctx.strokeStyle = selected ? "#ff453a" : "#bf7b1a";
    ctx.lineWidth = selected ? 2 : 1;
    ctx.fill();
    ctx.stroke();
    label(String(index), x + 6, y - 5, "#f0a35f");
  });
  ctx.restore();
}

function outlineWingHandleGeometry(board) {
  const wing = normalizedWingConfig(board);
  if (!wing.active) return null;
  const rawHalf = rawOutlineHalfPoints(board, getSegments());
  const baseY = Math.max(0, interpolatePolyline(rawHalf, wing.distance));
  const widthY = Math.max(0, baseY - wing.width);
  const shoulderBaseY = Math.max(0, interpolatePolyline(rawHalf, wing.shoulderX) - wingOffsetAtX(wing, wing.shoulderX));
  const transitionBaseY = Math.max(0, interpolatePolyline(rawHalf, wing.endX) - wingOffsetAtX(wing, wing.endX));
  const handleOffsetY = Math.max(0.45, wing.width * 0.28);
  return {
    wing,
    rawHalf,
    baseY,
    widthY,
    shoulderBaseY,
    transitionBaseY,
    handleOffsetY
  };
}

function setWingHandles(board, transform) {
  state.wingHandles = [];
  if (state.tool !== "edit") return;
  if (!(state.view === "outline" || (state.view === "quad" && state.quadActivePane === "outline"))) return;
  const geometry = outlineWingHandleGeometry(board);
  if (!geometry) return;
  state.wingHandles.push({
    kind: "position",
    label: "Wing position",
    x: geometry.wing.distance,
    y: 0,
    baseY: geometry.baseY,
    widthY: geometry.widthY,
    transform
  });
  state.wingHandles.push({
    kind: "width",
    label: "Wing width",
    x: geometry.wing.distance,
    y: geometry.widthY,
    baseY: geometry.baseY,
    widthY: geometry.widthY,
    transform
  });
  if (geometry.wing.shape === "bump") {
    state.wingHandles.push({
      kind: "shoulder",
      label: "Wing shoulder",
      x: geometry.wing.shoulderX,
      y: Math.max(0, geometry.shoulderBaseY - geometry.handleOffsetY),
      anchorX: geometry.wing.shoulderX,
      anchorY: geometry.shoulderBaseY,
      baseY: geometry.baseY,
      widthY: geometry.widthY,
      transform
    });
    state.wingHandles.push({
      kind: "transition",
      label: "Wing transition",
      x: geometry.wing.endX,
      y: Math.max(0, geometry.transitionBaseY - geometry.handleOffsetY),
      anchorX: geometry.wing.endX,
      anchorY: geometry.transitionBaseY,
      baseY: geometry.baseY,
      widthY: geometry.widthY,
      transform
    });
  }
}

function sameWingHandle(a, b) {
  return !!a && !!b && a.kind === b.kind;
}

function drawWingHandles() {
  if (state.tool !== "edit" || !state.wingHandles.length) return;
  ctx.save();
  state.wingHandles.forEach(handle => {
    const sx = handle.transform.x(handle.x);
    const sy = handle.transform.y(handle.y);
    const baseSY = handle.transform.y(handle.baseY);
    const selected = sameWingHandle(handle, state.wingSelection);
    if (handle.kind === "position") {
      ctx.beginPath();
      ctx.moveTo(sx, handle.transform.y(-0.8));
      ctx.lineTo(sx, baseSY);
      ctx.strokeStyle = selected ? "#ff6b6b" : "#ffd166";
      ctx.lineWidth = selected ? 2 : 1.3;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(sx, sy - 7);
      ctx.lineTo(sx + 7, sy);
      ctx.lineTo(sx, sy + 7);
      ctx.lineTo(sx - 7, sy);
      ctx.closePath();
      ctx.fillStyle = selected ? "#ff6b6b" : "#ffd166";
      ctx.strokeStyle = selected ? "#ff453a" : "#8c6a13";
      ctx.lineWidth = selected ? 2 : 1;
      ctx.fill();
      ctx.stroke();
    } else if (handle.kind === "width") {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, baseSY);
      ctx.strokeStyle = selected ? "#ff6b6b" : "#ffd166";
      ctx.lineWidth = selected ? 2 : 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(sx - 5, sy - 5, 10, 10);
      ctx.fillStyle = selected ? "#ff6b6b" : "#f2f2f7";
      ctx.strokeStyle = selected ? "#ff453a" : "#ffd166";
      ctx.lineWidth = selected ? 2 : 1.2;
      ctx.fill();
      ctx.stroke();
    } else if (handle.kind === "shoulder") {
      const anchorSX = handle.transform.x(handle.anchorX);
      const anchorSY = handle.transform.y(handle.anchorY);
      ctx.beginPath();
      ctx.moveTo(anchorSX, anchorSY);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = selected ? "#ff6b6b" : "#7bdff2";
      ctx.lineWidth = selected ? 2 : 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, selected ? 5.5 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = selected ? "#ff6b6b" : "#7bdff2";
      ctx.strokeStyle = selected ? "#ff453a" : "#2ea3b0";
      ctx.lineWidth = selected ? 2 : 1.2;
      ctx.fill();
      ctx.stroke();
    } else {
      const anchorSX = handle.transform.x(handle.anchorX);
      const anchorSY = handle.transform.y(handle.anchorY);
      ctx.beginPath();
      ctx.moveTo(anchorSX, anchorSY);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = selected ? "#ff6b6b" : "#9b8cff";
      ctx.lineWidth = selected ? 2 : 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx, sy - 6);
      ctx.lineTo(sx + 6, sy + 5);
      ctx.lineTo(sx - 6, sy + 5);
      ctx.closePath();
      ctx.fillStyle = selected ? "#ff6b6b" : "#9b8cff";
      ctx.strokeStyle = selected ? "#ff453a" : "#6b5cff";
      ctx.lineWidth = selected ? 2 : 1.2;
      ctx.fill();
      ctx.stroke();
    }
  });
  ctx.restore();
}

function drawFins(board, transform) {
  const fins = board.fins || [];
  const hasPrimary = fins.length >= 9 && !fins.every(value => Math.abs(value) < 1e-9);
  const hasExtra = normalizeFinExtra(board.finExtra).length > 0;
  if (!hasPrimary && !hasExtra) return;
  ctx.save();
  ctx.strokeStyle = "#f0a35f";
  ctx.fillStyle = "rgba(255,159,10,.12)";
  ctx.lineWidth = 1.3;
  let labelX = board.length || 0;
  if (hasPrimary) {
    const sideRear = { x: fins[0], y: fins[1] };
    const sideFront = { x: fins[2], y: fins[3] };
    const centerRear = { x: fins[4], y: 0 };
    const centerFront = { x: fins[5], y: 0 };
    if (Math.abs(sideRear.x) > 1e-9 || Math.abs(sideRear.y) > 1e-9 || Math.abs(sideFront.x) > 1e-9 || Math.abs(sideFront.y) > 1e-9) {
      drawFinPair(sideRear, sideFront, transform);
      registerFinHandle("side", 1, sideRear, sideFront, transform);
      registerFinHandle("side", -1, { x: sideRear.x, y: -sideRear.y }, { x: sideFront.x, y: -sideFront.y }, transform);
      drawFinTemplatePair(board.finType, sideRear, sideFront, transform);
      labelX = sideFront.x || labelX;
    }
    if (Math.abs(centerRear.x) > 1e-9 || Math.abs(centerFront.x) > 1e-9) {
      drawFinMarker(centerRear, centerFront, transform);
      registerFinHandle("center", 0, centerRear, centerFront, transform);
      drawFinTemplate(board.finType, centerRear, centerFront, transform, 1);
      labelX = centerFront.x || labelX;
    }
  }
  drawExtraFins(board, transform);
  label(finSetupLabel(board.finSetup || board.finType || "Fins"), transform.x(labelX), transform.y(0) - 12, "#f0a35f");
  ctx.restore();
}

function registerFinHandle(kind, side, rear, front, transform, extraIndex = -1) {
  state.finHandles.push({
    kind,
    side,
    extraIndex,
    rear: { ...rear },
    front: { ...front },
    transform
  });
}

function drawExtraFins(board, transform) {
  const extra = normalizeFinExtra(board.finExtra);
  extra.forEach((fin, index) => {
    const rear = { x: fin.rearX, y: fin.rearY };
    const front = { x: fin.frontX, y: fin.frontY };
    if (Math.abs(rear.y) < 1e-9 && Math.abs(front.y) < 1e-9) {
      drawFinMarker(rear, front, transform);
      registerFinHandle("extra", 0, rear, front, transform, index);
      drawFinTemplate(fin.template || board.finType, rear, front, transform, 1);
    } else {
      drawFinPair(rear, front, transform);
      registerFinHandle("extra", 1, rear, front, transform, index);
      registerFinHandle("extra", -1, { x: rear.x, y: -rear.y }, { x: front.x, y: -front.y }, transform, index);
      drawFinTemplatePair(fin.template || board.finType, rear, front, transform);
    }
  });
}

function normalizedFins(fins) {
  const values = Array.isArray(fins) ? fins.slice(0, 9) : [];
  while (values.length < 9) values.push(0);
  return values.map(value => Number.isFinite(Number(value)) ? Number(value) : 0);
}

function normalizeFinExtra(extra) {
  if (!Array.isArray(extra)) return [];
  return extra.map(item => ({
    role: String(item?.role || "extra"),
    template: finTemplateKey(item?.template) || "",
    rearX: Number(item?.rearX) || 0,
    rearY: Math.abs(Number(item?.rearY) || 0),
    frontX: Number(item?.frontX) || 0,
    frontY: Math.abs(Number(item?.frontY) || 0),
    toeIn: Number(item?.toeIn) || 0,
    cant: Number(item?.cant) || 0
  })).filter(item => item.rearX || item.rearY || item.frontX || item.frontY);
}

function parseFinExtra(value) {
  const text = String(value || "").replace(/\\n/g, "\n").trim();
  if (!text) return [];
  try {
    return normalizeFinExtra(JSON.parse(text));
  } catch {
    return [];
  }
}

function serializeFinExtra(extra) {
  const normalized = normalizeFinExtra(extra);
  return normalized.length ? JSON.stringify(normalized) : "";
}

function moveFinDrag(handle, originalFins, dx, dy, originalFinExtra = null) {
  if (!state.board || !handle) return;
  const fins = normalizedFins(originalFins);
  if (handle.kind === "center") {
    fins[4] = originalFins[4] + dx;
    fins[5] = originalFins[5] + dx;
  } else if (handle.kind === "side") {
    const side = handle.side < 0 ? -1 : 1;
    if (handle.dragMode === "rear") {
      fins[0] = originalFins[0] + dx;
      fins[1] = Math.max(0, originalFins[1] + dy * side);
    } else if (handle.dragMode === "front") {
      fins[2] = originalFins[2] + dx;
      fins[3] = Math.max(0, originalFins[3] + dy * side);
    } else {
      fins[0] = originalFins[0] + dx;
      fins[2] = originalFins[2] + dx;
      fins[1] = Math.max(0, originalFins[1] + dy * side);
      fins[3] = Math.max(0, originalFins[3] + dy * side);
    }
  } else if (handle.kind === "extra") {
    moveExtraFinDrag(handle, originalFinExtra, dx, dy);
    return;
  }
  state.board.fins = fins;
  state.board.finToeIn = finToeInFromFins(fins);
  markGeometryDirty();
}

function moveExtraFinDrag(handle, originalFinExtra, dx, dy) {
  const extra = normalizeFinExtra(originalFinExtra || state.board.finExtra);
  const index = Number(handle.extraIndex);
  if (!Number.isInteger(index) || !extra[index]) return;
  const fin = { ...extra[index] };
  const side = handle.side < 0 ? -1 : 1;
  const mappedDy = handle.side === 0 ? dy : dy * side;
  if (handle.dragMode === "rear") {
    fin.rearX += dx;
    fin.rearY = Math.max(0, fin.rearY + mappedDy);
  } else if (handle.dragMode === "front") {
    fin.frontX += dx;
    fin.frontY = Math.max(0, fin.frontY + mappedDy);
  } else {
    fin.rearX += dx;
    fin.frontX += dx;
    fin.rearY = Math.max(0, fin.rearY + mappedDy);
    fin.frontY = Math.max(0, fin.frontY + mappedDy);
  }
  fin.toeIn = finToeInFromSegment(fin.rearX, fin.rearY, fin.frontX, fin.frontY);
  extra[index] = fin;
  state.board.finExtra = extra;
  markGeometryDirty();
}

function moveWingDrag(handle, originalWing, dx, dy) {
  if (!state.board || !handle || !originalWing) return;
  const rawHalf = Array.isArray(originalWing.rawHalf) ? originalWing.rawHalf : rawOutlineHalfPoints(state.board, getSegments());
  const boardLength = Math.max(2, Number(state.board.length) || 2);
  const minDistance = 2;
  const maxDistance = Math.max(minDistance, boardLength - 1);
  const originalConfig = normalizedWingConfig({
    ...state.board,
    wingPreset: originalWing.preset || state.board.wingPreset || "custom",
    wingPosition: originalWing.position,
    wingWidth: originalWing.width,
    wingShape: originalWing.shape,
    wingShoulder: originalWing.shoulder,
    wingTransition: originalWing.transition
  }, rawHalf);
  let nextPosition = clampNumber(originalWing.position, minDistance, maxDistance, originalWing.position);
  if (handle.kind === "position") {
    nextPosition = clampNumber(originalWing.position + dx, minDistance, maxDistance, originalWing.position);
  }
  const maxInset = wingMaxInsetAt(rawHalf, nextPosition);
  let nextWidth = clampNumber(originalWing.width, 0.1, maxInset, Math.min(originalWing.width, maxInset));
  if (handle.kind === "width") {
    nextWidth = clampNumber(originalWing.width - dy, 0.1, maxInset, originalWing.width);
  }
  let nextShoulder = originalConfig.shape === "bump" ? originalConfig.shoulder : 0;
  let nextTransition = originalConfig.shape === "bump" ? originalConfig.transition : 0;
  if (handle.kind === "shoulder" && originalConfig.shape === "bump" && originalConfig.blendLength > 1e-9) {
    const minShoulderX = nextPosition;
    const maxShoulderX = Math.min(
      boardLength,
      nextPosition + (originalConfig.blendLength * 0.75),
      originalConfig.endX - 0.05
    );
    const nextShoulderX = clampNumber(originalConfig.shoulderX + dx, minShoulderX, Math.max(minShoulderX, maxShoulderX), originalConfig.shoulderX);
    nextShoulder = clampNumber((nextShoulderX - nextPosition) / Math.max(1e-9, originalConfig.blendLength), 0, 0.75, originalConfig.shoulder);
  }
  if (handle.kind === "transition" && originalConfig.shape === "bump" && originalConfig.baseBlendLength > 1e-9) {
    const nextEndX = clampNumber(
      originalConfig.endX + dx,
      nextPosition + 1.2,
      Math.min(boardLength, nextPosition + originalConfig.maxBlendLength),
      originalConfig.endX
    );
    const nextBlendLength = nextEndX - nextPosition;
    nextTransition = clampNumber(nextBlendLength / originalConfig.baseBlendLength, 0.25, 2.5, originalConfig.transition);
    const shoulderLimit = Math.max(0, Math.min(0.75, (nextBlendLength - 0.05) / Math.max(1e-9, nextBlendLength)));
    nextShoulder = clampNumber(nextShoulder, 0, shoulderLimit, Math.min(nextShoulder, shoulderLimit));
  }
  state.board.wingPreset = "custom";
  state.board.wingPosition = nextPosition;
  state.board.wingWidth = nextWidth;
  state.board.wingShape = originalConfig.shape || originalWing.shape || "bump";
  state.board.wingShoulder = state.board.wingShape === "bump"
    ? nextShoulder
    : 0;
  state.board.wingTransition = state.board.wingShape === "bump"
    ? nextTransition
    : 0;
}

function finToeInFromFins(fins) {
  const values = normalizedFins(fins);
  return finToeInFromSegment(values[0], values[1], values[2], values[3]);
}

function finToeInFromSegment(rearX, rearY, frontX, frontY) {
  const dx = frontX - rearX;
  const dy = frontY - rearY;
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return 0;
  return Math.abs(Math.atan2(dy, dx)) * 180 / Math.PI;
}

function finTemplateKey(value) {
  const key = String(value || "").trim().toUpperCase().replace(/[\s_-]/g, "");
  if (key === "FCSII" || key === "FSCII") return "FCSII";
  if (key === "FCS") return "FCS";
  if (key === "FINBOX" || key === "BOX" || key === "SINGLE") return "FINBOX";
  return "";
}

function finSetupKey(value) {
  const key = String(value || "").trim().toLowerCase();
  if (key === "twin") return "twin-performance";
  return key;
}

function finSetupLabel(value) {
  const key = finSetupKey(value);
  const labels = {
    "": "Fins",
    single: "Single fin",
    "2plus1": "2+1",
    "twin-fish": "Twin fish",
    "twin-performance": "Twin performance",
    thruster: "Thruster",
    quad: t("quad_fin"),
    "5fin": "5 fin",
    bonzer: "Bonzer"
  };
  return labels[key] || value || "Fins";
}

function drawFinTemplatePair(type, rear, front, transform) {
  [1, -1].forEach(side => {
    drawFinTemplate(type, { x: rear.x, y: rear.y * side }, { x: front.x, y: front.y * side }, transform, side);
  });
}

function drawFinTemplate(type, rear, front, transform, side = 1) {
  const template = finTemplateKey(type);
  if (!template) return;
  const angle = Math.atan2(front.y - rear.y, front.x - rear.x);
  const center = { x: (rear.x + front.x) * 0.5, y: (rear.y + front.y) * 0.5 };
  ctx.save();
  ctx.translate(transform.x(center.x), transform.y(center.y));
  ctx.rotate(-angle);
  ctx.strokeStyle = "#ffd60a";
  ctx.fillStyle = "rgba(255,214,10,.08)";
  ctx.lineWidth = 1;
  const scale = transform.scale;
  const drawBox = (length, width) => {
    ctx.beginPath();
    ctx.rect(-length * scale * 0.5, -width * scale * 0.5, length * scale, width * scale);
    ctx.fill();
    ctx.stroke();
  };
  const drawCircle = (x, radius) => {
    ctx.beginPath();
    ctx.arc(x * scale, 0, radius * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  if (template === "FCS") {
    drawCircle(-1.65, 1.55);
    drawCircle(1.65, 1.55);
  } else if (template === "FCSII") {
    drawBox(10.8, 3.0);
  } else if (template === "FINBOX") {
    drawBox(26.7, 2.6);
  }
  ctx.restore();
  if (template && side !== 0) {
    const toe = Math.abs(Math.atan2(front.y - rear.y, front.x - rear.x)) * 180 / Math.PI;
    label(`${template} ${fmt(toe)}deg`, transform.x(center.x), transform.y(center.y) + 14 * side, "#ffd60a");
  }
}

function drawFinPair(rear, front, transform) {
  [1, -1].forEach(side => {
    const a = { x: rear.x, y: rear.y * side };
    const b = { x: front.x, y: front.y * side };
    drawFinMarker(a, b, transform);
  });
}

function drawFinMarker(rear, front, transform) {
  ctx.beginPath();
  ctx.moveTo(transform.x(rear.x), transform.y(rear.y));
  ctx.lineTo(transform.x(front.x), transform.y(front.y));
  ctx.stroke();
  [rear, front].forEach(point => {
    ctx.beginPath();
    ctx.arc(transform.x(point.x), transform.y(point.y), 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function drawBaseline(board, transform) {
  if (!board || !board.length) return;
  ctx.strokeStyle = "#8e8e93";
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 7]);
  line(transform.x(0), transform.y(0), transform.x(board.length), transform.y(0));
  ctx.setLineDash([]);
}

function drawCrossSectionBaseline(points, transform) {
  if (!points.length) return;
  const xs = points.map(p => p.x);
  ctx.strokeStyle = "#8e8e93";
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 7]);
  line(transform.x(Math.min(...xs)), transform.y(0), transform.x(Math.max(...xs)), transform.y(0));
  ctx.setLineDash([]);
}

function drawCrossSectionPositionMarkers(board, transform, mode) {
  if (!board || !board.sections.length) return;
  board.sections.forEach((section, index) => {
    if (index === 0 || index === board.sections.length - 1) return;
    const rawX = section.position;
    const x = boardCadDisplayXFromRawX(board, rawX);
    const active = index === state.currentSectionIndex;
    ctx.strokeStyle = active ? "#ff6b6b" : "#8e8e93";
    ctx.lineWidth = active ? 1.8 : 1;
    if (!active) ctx.setLineDash([5, 3]);
    if (mode === "outline") {
      const halfWidth = Math.max(0, boardCadDisplayWidthAtPos(board, x) / 2);
      line(transform.x(x), transform.y(-halfWidth), transform.x(x), transform.y(halfWidth));
    } else {
      line(transform.x(x), transform.y(boardCadRockerAtPos(board, rawX)), transform.x(x), transform.y(boardCadDeckAtPos(board, rawX)));
    }
    ctx.setLineDash([]);
  });
}

function drawSlidingCrossSectionOnBoard(board, transform, mode) {
  if (!board || board.sections.length < 3) return;
  const rawPos = slidingBoardX(board, mode);
  const pos = boardCadDisplayXFromRawX(board, rawPos);
  ctx.save();
  ctx.strokeStyle = "#64b5ff";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 4]);
  if (mode === "outline") {
    const halfWidth = Math.max(0, boardCadDisplayWidthAtPos(board, pos) / 2);
    line(transform.x(pos), transform.y(-halfWidth), transform.x(pos), transform.y(halfWidth));
  } else {
    line(transform.x(pos), transform.y(boardCadRockerAtPos(board, rawPos)), transform.x(pos), transform.y(boardCadDeckAtPos(board, rawPos)));
  }
  ctx.setLineDash([]);
  label(`Sliding CS ${fmt(pos)}`, transform.x(pos) + 6, mode === "outline" ? transform.y(0) - 8 : transform.y(boardCadDeckAtPos(board, rawPos)) - 8, "#64b5ff");
  ctx.restore();
}

function drawSlidingCrossSectionShape(board, transform, rect) {
  const pos = slidingBoardX(board);
  const knots = boardCadInterpolatedDisplayCrossSectionKnots(board, boardCadDisplayXFromRawX(board, pos));
  if (!knots.length) return;
  const full = fullCrossSectionPoints(knots);
  ctx.save();
  ctx.setLineDash([6, 4]);
  drawPath(full, transform, "#64b5ff", 1.4);
  ctx.setLineDash([]);
  label(`Sliding cross section ${fmt(boardCadDisplayXFromRawX(board, pos))}`, rect.left + 16, rect.top + 42, "#64b5ff");
  ctx.restore();
}

function drawVolumeDistribution(board, transform, mode) {
  if (!board || board.sections.length < 3) return;
  const samples = boardCadVolumeDistributionSamples(board, 20);
  if (!samples.length) return;
  const maxArea = Math.max(...samples.map(sample => sample.area));
  if (!(maxArea > 0)) return;
  const graphHeight = mode === "outline" ? Math.max(1, board.width * 0.22) : Math.max(1, board.thickness * 0.85);
  const points = samples.map(sample => ({
    x: sample.x,
    y: mode === "outline"
      ? sample.area / maxArea * graphHeight
      : boardCadRockerAtPos(board, sample.rawX) + sample.area / maxArea * graphHeight
  }));
  ctx.setLineDash([3, 3]);
  drawPath(points, transform, "#bf5af2", 1.2);
  ctx.setLineDash([]);
  const volume = boardCadApproxVolumeFromSamples(samples);
  label(`Volume: ${fmt(volume / 1000)} L`, transform.x(boardCadTailDisplayLength(board) * 0.02), transform.y(points[points.length - 1].y), "#bf5af2");
}

function drawCenterOfMass(board, transform, mode) {
  if (!board || board.sections.length < 3) return;
  const samples = boardCadVolumeDistributionSamples(board, 20);
  const center = boardCadApproxCenterOfMassFromSamples(samples);
  if (!(center > 0)) return;
  const rawCenter = boardCadRawXFromDisplayX(board, center);
  const y0 = mode === "outline" ? -board.width / 2 : boardCadRockerAtPos(board, rawCenter);
  const y1 = mode === "outline" ? board.width / 2 : boardCadDeckAtPos(board, rawCenter);
  ctx.strokeStyle = "#ff375f";
  ctx.lineWidth = 1.7;
  ctx.setLineDash([9, 4]);
  line(transform.x(center), transform.y(y0), transform.x(center), transform.y(y1));
  ctx.setLineDash([]);
  label(`CM ${fmt(center)}`, transform.x(center) + 5, transform.y(y1), "#ff375f");
}

function drawFootMarks(board, transform, mode) {
  if (!board || !board.length) return;
  const profile = tailAdjustedProfileGeometry(board);
  const displayLength = boardCadTailDisplayLength(board);
  const foot = 12;
  const inch = 1;
  const bottomLength = boardCadSplineLength(profile.bottomKnots);
  const maxWidthPos = boardCadMaxWidthPos(board);
  const marks = [
    { pos: inch, oc: inch, label: fmt(inch) },
    { pos: foot, oc: foot, label: fmt(foot) },
    { pos: foot * 2, oc: foot * 2, label: fmt(foot * 2) },
    { pos: mode === "profile" ? displayLength / 2 : maxWidthPos, oc: boardCadLengthByX(profile.bottomKnots, boardCadRawXFromDisplayX(board, mode === "profile" ? displayLength / 2 : maxWidthPos)), label: mode === "profile" ? `Center ${fmt(displayLength / 2)}` : `W.P ${fmt(maxWidthPos - displayLength / 2)}` },
    { pos: displayLength - foot * 2, oc: bottomLength - foot * 2, label: fmt(-foot * 2) },
    { pos: displayLength - foot, oc: bottomLength - foot, label: fmt(-foot) },
    { pos: displayLength - inch, oc: bottomLength - inch, label: fmt(-inch) }
  ].filter(mark => mark.pos > 0 && mark.pos < displayLength);
  marks.forEach(mark => {
    const rawPos = state.viewOptions.showOverBottomCurveMeasurements
      ? boardCadXByLength(profile.bottomKnots, Math.max(0, Math.min(bottomLength, mark.oc)))
      : boardCadRawXFromDisplayX(board, mark.pos);
    const pos = state.viewOptions.showOverBottomCurveMeasurements ? boardCadDisplayXFromRawX(board, rawPos) : mark.pos;
    const labelText = state.viewOptions.showOverBottomCurveMeasurements ? `${mark.label} O.C` : mark.label;
    ctx.strokeStyle = "#8e8e93";
    ctx.lineWidth = 1;
    if (mode === "outline") {
      const width = boardCadDisplayWidthAtPos(board, pos);
      line(transform.x(pos), transform.y(-width / 2), transform.x(pos), transform.y(width / 2));
      label(labelText, transform.x(pos) - 12, transform.y(0) - 6, "#d1d1d6");
      label(fmt(width), transform.x(pos) - 12, transform.y(width / 2) + 14, "#64b5ff");
    } else {
      const rocker = boardCadRockerAtPos(board, rawPos);
      const deck = boardCadDeckAtPos(board, rawPos);
      line(transform.x(pos), transform.y(rocker), transform.x(pos), transform.y(deck));
      label(labelText, transform.x(pos) - 14, transform.y(rocker) + 14, "#d1d1d6");
      label(fmt(deck - rocker), transform.x(pos) - 12, transform.y(deck) - 6, "#64b5ff");
    }
  });
}

function boardCadVolumeDistributionSamples(board, segments) {
  ensureParameterCache();
  const key = `${segments}:${boardCadTailDisplayShift(board).toFixed(4)}:${boardCadTailDisplayLength(board).toFixed(4)}`;
  if (state.parameterCache.volumeSamples.has(key)) return state.parameterCache.volumeSamples.get(key);
  const samples = [];
  const displayLength = boardCadTailDisplayLength(board);
  for (let i = 0; i <= segments; i++) {
    const x = displayLength * (i / segments);
    const rawX = boardCadRawXFromDisplayX(board, x);
    samples.push({ x, rawX, area: boardCadDisplayCrossSectionAreaAt(board, x) });
  }
  state.parameterCache.volumeSamples.set(key, samples);
  return samples;
}

function boardCadVolume(board) {
  if (!board || board.sections.length < 3) return 0;
  ensureParameterCache();
  if (state.parameterCache.volume !== null) return state.parameterCache.volume;
  const displayLength = boardCadTailDisplayLength(board);
  const a = 0.01;
  const b = displayLength - 0.01;
  if (!(b > a)) {
    state.parameterCache.volume = 0;
    return 0;
  }
  state.parameterCache.volume = simpsonIntegral(x => boardCadDisplayCrossSectionAreaAt(board, x), a, b, 40);
  return state.parameterCache.volume;
}

function boardCadCenterOfMass(board) {
  if (!board || board.sections.length < 3) return 0;
  ensureParameterCache();
  if (state.parameterCache.centerOfMass !== null) return state.parameterCache.centerOfMass;
  const displayLength = boardCadTailDisplayLength(board);
  const a = 0.01;
  const b = displayLength - 0.01;
  if (!(b > a)) {
    state.parameterCache.centerOfMass = 0;
    return 0;
  }
  const segments = 40;
  const step = (b - a) / segments;
  let momentSum = 0;
  let weightSum = 0;
  let x0 = boardCadDisplayCrossSectionAreaAt(board, a);
  for (let i = 0; i < segments; i++) {
    const x = a + i * step;
    const x1 = boardCadDisplayCrossSectionAreaAt(board, x + step / 2);
    const x2 = boardCadDisplayCrossSectionAreaAt(board, x + step);
    const area0 = Number.isFinite(x0) ? x0 : 0;
    const area1 = Number.isFinite(x1) ? x1 : 0;
    const area2 = Number.isFinite(x2) ? x2 : 0;
    const integral = (step / 6) * (area0 + 4 * area1 + area2);
    momentSum += (x + step / 2) * integral;
    weightSum += integral;
    x0 = x2;
  }
  state.parameterCache.centerOfMass = weightSum > 0 ? momentSum / weightSum : 0;
  return state.parameterCache.centerOfMass;
}

function boardCadApproxVolumeFromSamples(samples) {
  if (!Array.isArray(samples) || samples.length < 2) return 0;
  let volume = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    const dx = Math.max(0, b.x - a.x);
    volume += ((a.area + b.area) * 0.5) * dx;
  }
  return volume;
}

function boardCadApproxCenterOfMassFromSamples(samples) {
  if (!Array.isArray(samples) || samples.length < 2) return 0;
  let moment = 0;
  let volume = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    const dx = Math.max(0, b.x - a.x);
    const segmentVolume = ((a.area + b.area) * 0.5) * dx;
    const segmentCenter = (a.x + b.x) * 0.5;
    volume += segmentVolume;
    moment += segmentCenter * segmentVolume;
  }
  return volume > 1e-9 ? moment / volume : 0;
}

function boardCadMomentOfInertia(board, x, y) {
  if (!board || board.sections.length < 3) return 0;
  const samples = boardCadVolumeDistributionSamples(board, 24);
  if (samples.length < 2) return 0;
  const density = 3.0 / 30.0;
  let moment = 0;
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const next = samples[i];
    const dxSpan = Math.max(0, next.x - prev.x);
    const volume = (((prev.area + next.area) * 0.5) * dxSpan) / 1000;
    const pos = (prev.x + next.x) * 0.5;
    const dx = pos - x;
    const dy = y || 0;
    const r = Math.hypot(dx, dy) / 100;
    moment += volume * density * r * r;
  }
  return moment;
}

function boardCadDisplayCrossSectionAreaAt(board, x) {
  ensureParameterCache();
  const clampedX = clampNumber(x, 0.01, Math.max(0.01, boardCadTailDisplayLength(board) - 0.01), 0.01);
  const key = `display:${clampedX.toFixed(4)}`;
  if (state.parameterCache.areas.has(key)) return state.parameterCache.areas.get(key);
  const knots = boardCadInterpolatedDisplayCrossSectionKnots(board, clampedX);
  const points = fullCrossSectionPoints(knots);
  const area = points.length < 3 ? 0 : Math.max(0, Math.abs(polygonArea(points)));
  state.parameterCache.areas.set(key, area);
  return area;
}

function boardCadCrossSectionAreaAt(board, x) {
  ensureParameterCache();
  const clampedX = Math.max(0.01, Math.min(board.length - 0.01, x));
  const key = clampedX.toFixed(4);
  if (state.parameterCache.areas.has(key)) return state.parameterCache.areas.get(key);
  const knots = boardCadInterpolatedCrossSectionKnots(board, clampedX);
  const points = fullCrossSectionPoints(knots);
  const area = points.length < 3 ? 0 : Math.max(0, Math.abs(polygonArea(points)));
  state.parameterCache.areas.set(key, area);
  return area;
}

function parameterScalarCacheGet(key, compute) {
  ensureParameterCache();
  if (state.parameterCache.scalar.has(key)) return state.parameterCache.scalar.get(key);
  const value = compute();
  state.parameterCache.scalar.set(key, value);
  return value;
}

function ensureParameterCache() {
  if (state.parameterCache.revision === state.geometryRevision) return;
  state.parameterCache.revision = state.geometryRevision;
  state.parameterCache.areas.clear();
  state.parameterCache.volumeSamples.clear();
  state.parameterCache.scalar.clear();
  state.parameterCache.volume = null;
  state.parameterCache.centerOfMass = null;
}

function simpsonIntegral(fn, a, b, segments) {
  const n = segments % 2 === 0 ? segments : segments + 1;
  const h = (b - a) / n;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < n; i++) {
    sum += fn(a + i * h) * (i % 2 === 0 ? 2 : 4);
  }
  return (h / 3) * sum;
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += (a.x * b.y) - (b.x * a.y);
  }
  return area / 2;
}

function boardCadSplineLength(knots, stepsPerCurve = 32) {
  let length = 0;
  boardCadCurves(knots).forEach(curve => {
    let prev = { x: boardCadCurveX(curve, 0), y: boardCadCurveY(curve, 0) };
    for (let i = 1; i <= stepsPerCurve; i++) {
      const t = i / stepsPerCurve;
      const point = { x: boardCadCurveX(curve, t), y: boardCadCurveY(curve, t) };
      length += Math.hypot(point.x - prev.x, point.y - prev.y);
      prev = point;
    }
  });
  return length;
}

function boardCadLengthByX(knots, pos, stepsPerCurve = 32) {
  let length = 0;
  for (const curve of boardCadCurves(knots)) {
    const minX = boardCadCurveMinMax(curve, BOARD_CAD_BEZIER.X, BOARD_CAD_BEZIER.MIN);
    const maxX = boardCadCurveMinMax(curve, BOARD_CAD_BEZIER.X, BOARD_CAD_BEZIER.MAX);
    const targetInside = (minX <= pos && pos <= maxX) || (maxX <= pos && pos <= minX);
    const endT = targetInside ? boardCadCurveTForX(curve, pos) : 1;
    let prev = { x: boardCadCurveX(curve, 0), y: boardCadCurveY(curve, 0) };
    for (let i = 1; i <= stepsPerCurve; i++) {
      const t = endT * (i / stepsPerCurve);
      const point = { x: boardCadCurveX(curve, t), y: boardCadCurveY(curve, t) };
      length += Math.hypot(point.x - prev.x, point.y - prev.y);
      prev = point;
    }
    if (targetInside) break;
  }
  return length;
}

function boardCadXByLength(knots, targetLength, stepsPerCurve = 32) {
  let length = 0;
  let previous = null;
  for (const curve of boardCadCurves(knots)) {
    for (let i = 0; i <= stepsPerCurve; i++) {
      const t = i / stepsPerCurve;
      const point = { x: boardCadCurveX(curve, t), y: boardCadCurveY(curve, t) };
      if (previous) {
        const segment = Math.hypot(point.x - previous.x, point.y - previous.y);
        if (length + segment >= targetLength) {
          const ratio = segment > 1e-9 ? (targetLength - length) / segment : 0;
          return lerp(previous.x, point.x, ratio);
        }
        length += segment;
      }
      previous = point;
    }
  }
  return knots[knots.length - 1]?.p.x || 0;
}

function boardCadMaxWidthPos(board) {
  let best = { x: 0, width: -Infinity };
  const steps = 120;
  const displayLength = boardCadTailDisplayLength(board);
  for (let i = 0; i <= steps; i++) {
    const x = displayLength * (i / steps);
    const width = boardCadDisplayWidthAtPos(board, x);
    if (width > best.width) best = { x, width };
  }
  return best.x;
}

function drawSurfaceAngleLines(board, transform, mode, angles, color) {
  if (!board || board.sections.length < 3) return;
  angles.forEach((angle, angleIndex) => {
    const right = [];
    const left = [];
    const points = boardCadSurfaceAngleLine(board, angle);
    for (const point of points) {
      if (mode === "outline") {
        right.push({ x: point.x, y: point.y });
        left.push({ x: point.x, y: -point.y });
      } else {
        right.push({ x: point.x, y: point.z });
        left.push({ x: point.x, y: point.z });
      }
    }
    ctx.globalAlpha = Math.max(0.42, 0.86 - angleIndex * 0.16);
    drawPath(right, transform, color, angleIndex === 0 ? 1.1 : 0.9);
    if (mode === "outline") drawPath(left, transform, color, angleIndex === 0 ? 1.1 : 0.9);
    ctx.globalAlpha = 1;
  });
}

function drawCrossSectionAngleMarkers(knots, transform, angles, color) {
  if (!knots || knots.length < 2) return;
  angles.forEach((angle, index) => {
    const p = boardCadPointByNormalReverse(knots, angle);
    if (!p) return;
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.max(0.52, 0.9 - index * 0.14);
    ctx.beginPath();
    ctx.arc(transform.x(p.x), transform.y(p.y), 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(transform.x(-p.x), transform.y(p.y), 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawOutlineSlidingInfo(board, transform, rect) {
  const profile = tailAdjustedProfileGeometry(board);
  const rawPos = slidingBoardX(board, "outline");
  const pos = boardCadDisplayXFromRawX(board, rawPos);
  const displayLength = boardCadTailDisplayLength(board);
  const width = boardCadDisplayWidthAtPos(board, pos);
  if (!(width > 0)) return;
  const lines = [
    `Width: ${fmt(width)}`,
    `From tail: ${fmt(pos)}`,
    `From nose: ${fmt(displayLength - pos)}`
  ];
  if (state.viewOptions.showOverBottomCurveMeasurements) {
    const bottomLength = parameterScalarCacheGet("profile-bottom-length", () => boardCadSplineLength(profile.bottomKnots));
    const curvePos = parameterScalarCacheGet(`profile-bottom-oc:${rawPos.toFixed(4)}`, () => boardCadLengthByX(profile.bottomKnots, rawPos));
    lines.push(`O.C. tail: ${fmt(curvePos)}`);
    lines.push(`O.C. nose: ${fmt(bottomLength - curvePos)}`);
  }
  if (state.viewOptions.showMomentOfInertia) {
    const momentY = state.cursorPoint?.y ?? state.lastEditPoint?.y ?? 0;
    const moment = parameterScalarCacheGet(`moment:${pos.toFixed(3)}:${Number(momentY).toFixed(3)}`, () => boardCadMomentOfInertia(board, pos, momentY));
    lines.push(`Moment: ${fmt(moment)}`);
  }
  drawSlidingLabel(lines, rect);
  ctx.strokeStyle = "#64b5ff";
  ctx.lineWidth = 1.2;
  line(transform.x(pos), transform.y(-width / 2), transform.x(pos), transform.y(width / 2));
}

function drawProfileSlidingInfo(board, transform, rect) {
  const profile = tailAdjustedProfileGeometry(board);
  const rawPos = slidingBoardX(board, "profile");
  const pos = boardCadDisplayXFromRawX(board, rawPos);
  const displayLength = boardCadTailDisplayLength(board);
  const thickness = boardCadThicknessAtPos(board, rawPos);
  if (!(thickness > 0)) return;
  const rocker = boardCadRockerAtPos(board, rawPos);
  const deck = boardCadDeckAtPos(board, rawPos);
  const curvature = boardCadSplineCurvatureAt(profile.bottomKnots, rawPos);
  const radius = Math.abs(curvature) > 1e-9 ? 1 / curvature : 0;
  const lines = [
    `Thickness: ${fmt(thickness)}`,
    `Rocker: ${fmt(rocker)}`,
    `Radius: ${fmt(radius)}`,
    `From tail: ${fmt(pos)}`,
    `From nose: ${fmt(displayLength - pos)}`
  ];
  if (state.viewOptions.showOverBottomCurveMeasurements) {
    const bottomLength = parameterScalarCacheGet("profile-bottom-length", () => boardCadSplineLength(profile.bottomKnots));
    const curvePos = parameterScalarCacheGet(`profile-bottom-oc:${rawPos.toFixed(4)}`, () => boardCadLengthByX(profile.bottomKnots, rawPos));
    lines.push(`O.C. tail: ${fmt(curvePos)}`);
    lines.push(`O.C. nose: ${fmt(bottomLength - curvePos)}`);
  }
  drawSlidingLabel(lines, rect);
  ctx.strokeStyle = "#64b5ff";
  ctx.lineWidth = 1.2;
  line(transform.x(pos), transform.y(rocker), transform.x(pos), transform.y(deck));
  ctx.strokeStyle = "#ff6b6b";
  line(transform.x(pos), transform.y(0), transform.x(pos), transform.y(rocker));
}

function drawCrossSectionSlidingInfo(section, transform, rect) {
  const pos = Math.abs(state.cursorPoint?.x ?? state.lastEditPoint?.x ?? 0);
  const halfWidth = Math.max(0, boardCadCrossSectionWidth(section.spline) / 2);
  const x = Math.min(halfWidth, pos);
  const bottom = boardCadCrossSectionBottomAt(section.spline, x);
  const deck = boardCadCrossSectionDeckAt(section.spline, x);
  const thickness = deck - bottom;
  if (!(thickness > 0)) return;
  const centerThickness = boardCadCrossSectionCenterThickness(section.spline);
  const percent = centerThickness > 0 ? Math.round((thickness * 100) / centerThickness) : 0;
  drawSlidingLabel([
    `Thickness: ${fmt(thickness)} (${percent}%)`,
    `Bottom: ${fmt(bottom)}`,
    `From rail: ${fmt(halfWidth - x)}`,
    `From center: ${fmt(x)}`
  ], rect);
  ctx.strokeStyle = "#64b5ff";
  ctx.lineWidth = 1.2;
  line(transform.x(x), transform.y(bottom), transform.x(x), transform.y(deck));
  line(transform.x(-x), transform.y(bottom), transform.x(-x), transform.y(deck));
}

function drawSlidingLabel(lines, rect) {
  const cursorX = Number.isFinite(state.cursorScreen?.x) ? state.cursorScreen.x - 72 : rect.left + 12;
  let x = Math.max(rect.left + 10, Math.min(rect.left + rect.width - 205, cursorX));
  let y = rect.top + rect.height - (lines.length * 15) - 10;
  ctx.fillStyle = "rgba(36,36,38,.88)";
  ctx.fillRect(x - 6, y - 13, 190, lines.length * 15 + 8);
  lines.forEach((text, index) => {
    label(text, x, y + index * 15, index === 0 ? "#64b5ff" : "#d1d1d6");
  });
}

function slidingBoardX(board, mode = (state.view === "quad" ? state.quadActivePane : state.view)) {
  const x = state.cursorPoint?.x ?? state.lastEditPoint?.x;
  if (Number.isFinite(x)) {
    return clampNumber(x, 0.1, Math.max(0.1, board.length - 0.1), Math.max(0.1, board.length * 0.5));
  }
  const section = currentCrossSection();
  if (section) return clampNumber(section.position, 0.1, Math.max(0.1, board.length - 0.1), Math.max(0.1, board.length * 0.5));
  return clampNumber(boardCadRawXFromDisplayX(board, boardCadTailDisplayLength(board) * 0.5), 0.1, Math.max(0.1, board.length - 0.1), Math.max(0.1, board.length * 0.5));
}

function boardCadSplineCurvatureAt(knots, pos) {
  const curves = boardCadCurves(knots);
  const index = boardCadFindMatchingBezierSegment(curves, pos, false);
  if (index < 0) return 0;
  const t = boardCadCurveTForX(curves[index], pos);
  return boardCadCurveCurvature(curves[index], t);
}

function boardCadCrossSectionBottomAt(knots, pos) {
  if (Math.abs(Number(pos) || 0) <= 1e-9) return Number(knots?.[0]?.p?.y) || 0;
  return boardCadSplineValueAt(knots, Math.abs(pos));
}

function boardCadCrossSectionDeckAt(knots, pos) {
  if (Math.abs(Number(pos) || 0) <= 1e-9) return Number(knots?.[knots.length - 1]?.p?.y) || 0;
  return boardCadSplineValueAtReverse(knots, Math.abs(pos));
}

function boardCadCrossSectionSurfaceSlopeAt(knots, pos, surface = "bottom") {
  if (!Array.isArray(knots) || knots.length < 2) return 0;
  const maxX = Math.max(1e-6, boardCadSplineMaxX(knots));
  const targetX = clampNumber(Math.abs(Number(pos) || 0), 0, maxX, 0);
  const epsilon = Math.min(0.25, Math.max(0.02, maxX / 400));
  const x0 = Math.max(0, targetX - epsilon);
  const x1 = Math.min(maxX, targetX + epsilon);
  if (x1 - x0 <= 1e-9) return 0;
  const sampleAt = surface === "deck" ? boardCadCrossSectionDeckAt : boardCadCrossSectionBottomAt;
  const y0 = sampleAt(knots, x0);
  const y1 = sampleAt(knots, x1);
  return (y1 - y0) / (x1 - x0);
}

function boardCadSplineValueAtReverse(knots, pos) {
  const curves = boardCadCurves(knots);
  let found = false;
  let bestY = -Infinity;
  for (let i = curves.length - 1; i >= 0; i--) {
    const lowX = boardCadCurveMinMax(curves[i], BOARD_CAD_BEZIER.X, BOARD_CAD_BEZIER.MIN);
    const highX = boardCadCurveMinMax(curves[i], BOARD_CAD_BEZIER.X, BOARD_CAD_BEZIER.MAX);
    if ((lowX <= pos && highX >= pos) || (highX <= pos && lowX >= pos)) {
      const y = boardCadCurveYForX(curves[i], pos);
      if (Number.isFinite(y)) {
        bestY = Math.max(bestY, y);
        found = true;
      }
    }
  }
  if (found) return bestY;
  return 0;
}

function boardCadSurfacePointAtAngle(board, x, angle) {
  if (!board || board.sections.length < 3) return null;
  const angleCache = crossSectionCacheMap("angle-context", board);
  const { rawX, displayX } = boardCadSampleXPair(board, x);
  const cacheKey = `${state.crossSectionInterpolation}:${rawX.toFixed(4)}:${displayX.toFixed(4)}`;
  let cached = angleCache.get(cacheKey);
  if (!cached) {
    cached = { rawX, displayX, interpolation: state.crossSectionInterpolation };
    if (state.crossSectionInterpolation === "controlpoint") {
      cached.knots = boardCadInterpolatedDisplayCrossSectionKnots(board, displayX);
      cached.knotSamples = cached.knots.length ? boardCadSplineSamples(cached.knots, 24) : [];
      cached.sByAngle = new Map();
    } else {
      const c1Index = boardCadPreviousCrossSectionIndex(board, rawX);
      const c2Index = boardCadNextCrossSectionIndex(board, rawX);
      if (c1Index >= 0 && c2Index >= 0) {
        const c1 = board.sections[c1Index];
        const c2 = board.sections[c2Index];
        const targetWidth = Math.max(0.5, boardCadDisplayWidthAtPos(board, displayX));
        const targetThickness = Math.max(0.5, boardCadThicknessAtPos(board, rawX));
        cached.c1Knots = boardCadCrossSectionScaleTo(boardCadCloneKnots(c1.spline), targetThickness, targetWidth);
        cached.c2Knots = boardCadCrossSectionScaleTo(boardCadCloneKnots(c2.spline), targetThickness, targetWidth);
        cached.c1Samples = boardCadSplineSamples(cached.c1Knots, 24);
        cached.c2Samples = boardCadSplineSamples(cached.c2Knots, 24);
        cached.pos1 = boardCadPreviousCrossSectionPos(board, rawX);
        cached.pos2 = boardCadNextCrossSectionPos(board, rawX);
        cached.t = Math.abs(cached.pos2 - cached.pos1) > 1e-9 ? clamp01((rawX - cached.pos1) / (cached.pos2 - cached.pos1)) : 0;
        cached.s1ByAngle = new Map();
        cached.s2ByAngle = new Map();
      }
    }
    angleCache.set(cacheKey, cached);
  }
  if (state.crossSectionInterpolation === "controlpoint") {
    const knots = cached.knots || boardCadInterpolatedDisplayCrossSectionKnots(board, displayX);
    const samples = cached.knotSamples?.length ? cached.knotSamples : boardCadSplineSamples(knots, 24);
    cached.knotSamples = samples;
    if (!cached.sByAngle.has(angle)) {
      const s = samples.length
        ? boardCadSByNormalReverseFromSamples(samples, angle)
        : boardCadSByNormalReverse(knots, angle, true);
      cached.sByAngle.set(angle, s);
    }
    const point = samples.length
      ? boardCadPointBySFromSamples(samples, cached.sByAngle.get(angle))
      : boardCadPointByS(knots, cached.sByAngle.get(angle));
    return point ? {
      x: displayX,
      y: point.x,
      z: point.y + boardCadRockerAtPos(board, rawX)
    } : null;
  }
  if (!cached.c1Knots || !cached.c2Knots) return null;
  if (!cached.s1ByAngle.has(angle)) {
    const s1 = cached.c1Samples?.length
      ? boardCadSByNormalReverseFromSamples(cached.c1Samples, angle)
      : boardCadSByNormalReverse(cached.c1Knots, angle, true);
    cached.s1ByAngle.set(angle, s1);
  }
  if (!cached.s2ByAngle.has(angle)) {
    const s2 = cached.c2Samples?.length
      ? boardCadSByNormalReverseFromSamples(cached.c2Samples, angle)
      : boardCadSByNormalReverse(cached.c2Knots, angle, true);
    cached.s2ByAngle.set(angle, s2);
  }
  const s1 = cached.s1ByAngle.get(angle);
  const s2 = cached.s2ByAngle.get(angle);
  const p1 = cached.c1Samples?.length
    ? boardCadPointBySFromSamples(cached.c1Samples, s1)
    : boardCadPointByS(cached.c1Knots, s1);
  const p2 = cached.c2Samples?.length
    ? boardCadPointBySFromSamples(cached.c2Samples, s2)
    : boardCadPointByS(cached.c2Knots, s2);
  const point = {
    x: lerp(p1.x, p2.x, cached.t),
    y: lerp(p1.y, p2.y, cached.t)
  };
  return {
    x: displayX,
    y: point.x,
    z: point.y + boardCadRockerAtPos(board, rawX)
  };
}

function boardCadSurfaceSectionSampleAt(knots, surface, targetY) {
  if (!Array.isArray(knots) || knots.length < 2) return null;
  // Clamp to the section's actual half-width.  The outline planform width
  // and the interpolated cross-section width can differ by a fraction of
  // a mm due to independent Bézier evaluation; without this clamp the
  // lookup falls outside the spline range and returns 0, creating a
  // visible rail-line kink in the 3D view.
  const sectionMaxX = boardCadSplineMaxX(knots);
  const x = Math.min(sectionMaxX, Math.max(0, Math.abs(Number(targetY) || 0)));
  const y = surface === "deck"
    ? boardCadCrossSectionDeckAt(knots, x)
    : boardCadCrossSectionBottomAt(knots, x);
  if (!Number.isFinite(y)) return null;
  return { x, y };
}

function boardCadSurfacePointAtFraction(board, x, surface, fraction, side = 1) {
  const { rawX, displayX } = boardCadSampleXPair(board, x);
  const rocker = boardCadRockerAtPos(board, rawX);
  const knots = boardCadInterpolatedDisplayCrossSectionKnots(board, displayX);
  if (!knots.length) return null;
  const planform = boardCadDisplayPlanformAt(board, displayX);
  const targetY = lerp(planform.innerY, planform.outerY, clamp01(fraction));
  const point = boardCadSurfaceSectionSampleAt(knots, surface, targetY);
  if (!point) return null;
  return {
    x: displayX,
    y: side * Math.abs(point.x),
    z: point.y + rocker
  };
}

function boardCadSurfaceRowAt(board, x, surface, widthSteps) {
  const { rawX, displayX } = boardCadSampleXPair(board, x);
  const rocker = boardCadRockerAtPos(board, rawX);
  const knots = boardCadInterpolatedDisplayCrossSectionKnots(board, displayX);
  if (!knots.length) return [];
  const planform = boardCadDisplayPlanformAt(board, displayX);
  const points = [];
  for (let j = 0; j <= widthSteps; j++) {
    const fraction = widthSteps <= 0 ? 0 : (j / widthSteps);
    const targetY = lerp(planform.innerY, planform.outerY, fraction);
    const point = boardCadSurfaceSectionSampleAt(knots, surface, targetY);
    if (!point) continue;
    points.push({
      x: displayX,
      y: Math.abs(point.x),
      z: point.y + rocker
    });
  }
  return points;
}

function boardCadSurfacePointByAngleRange(board, x, fraction, minAngle, maxAngle) {
  if (!board || board.sections.length < 3) return null;
  const { rawX, displayX } = boardCadSampleXPair(board, x);
  // Reuse the same per-(interpolation,rawX,displayX) cache entry that
  // boardCadSurfacePointAtAngle builds, so the knot clone + 18-point
  // spline sampling below happens once per section pair per geometry
  // revision instead of once per (x, fraction) call — this function is
  // invoked in tight x×width loops during mesh/toolpath generation.
  const angleCache = crossSectionCacheMap("angle-context", board);
  const cacheKey = `${state.crossSectionInterpolation}:${rawX.toFixed(4)}:${displayX.toFixed(4)}`;
  let cached = angleCache.get(cacheKey);
  if (!cached) {
    cached = { rawX, displayX, interpolation: state.crossSectionInterpolation };
    if (state.crossSectionInterpolation === "controlpoint") {
      cached.knots = boardCadInterpolatedDisplayCrossSectionKnots(board, displayX);
      cached.knotSamples = cached.knots.length ? boardCadSplineSamples(cached.knots, 24) : [];
      cached.knotSamples18 = cached.knots.length ? boardCadSplineSamples(cached.knots, 18) : [];
      cached.sByAngle = new Map();
    } else {
      const c1Index = boardCadPreviousCrossSectionIndex(board, rawX);
      const c2Index = boardCadNextCrossSectionIndex(board, rawX);
      if (c1Index >= 0 && c2Index >= 0) {
        const c1 = board.sections[c1Index];
        const c2 = board.sections[c2Index];
        const targetWidth = Math.max(0.5, boardCadDisplayWidthAtPos(board, displayX));
        const targetThickness = Math.max(0.5, boardCadThicknessAtPos(board, rawX));
        cached.c1Knots = boardCadCrossSectionScaleTo(boardCadCloneKnots(c1.spline), targetThickness, targetWidth);
        cached.c2Knots = boardCadCrossSectionScaleTo(boardCadCloneKnots(c2.spline), targetThickness, targetWidth);
        cached.c1Samples = boardCadSplineSamples(cached.c1Knots, 24);
        cached.c2Samples = boardCadSplineSamples(cached.c2Knots, 24);
        cached.c1Samples18 = boardCadSplineSamples(cached.c1Knots, 18);
        cached.c2Samples18 = boardCadSplineSamples(cached.c2Knots, 18);
        cached.pos1 = boardCadPreviousCrossSectionPos(board, rawX);
        cached.pos2 = boardCadNextCrossSectionPos(board, rawX);
        cached.t = Math.abs(cached.pos2 - cached.pos1) > 1e-9 ? clamp01((rawX - cached.pos1) / (cached.pos2 - cached.pos1)) : 0;
        cached.s1ByAngle = new Map();
        cached.s2ByAngle = new Map();
      }
    }
    angleCache.set(cacheKey, cached);
  }

  if (state.crossSectionInterpolation === "controlpoint") {
    const knots = cached.knots || boardCadInterpolatedDisplayCrossSectionKnots(board, displayX);
    const samples18 = cached.knotSamples18?.length ? cached.knotSamples18 : boardCadSplineSamples(knots, 18);
    cached.knotSamples18 = samples18;
    const point = boardCadPointInAngleRangeFromSamples(samples18, knots, fraction, minAngle, maxAngle);
    return point ? { x: displayX, y: point.x, z: point.y + boardCadRockerAtPos(board, rawX) } : null;
  }

  if (!cached.c1Knots || !cached.c2Knots) return null;
  const p1 = boardCadPointInAngleRangeFromSamples(cached.c1Samples18, cached.c1Knots, fraction, minAngle, maxAngle);
  const p2 = boardCadPointInAngleRangeFromSamples(cached.c2Samples18, cached.c2Knots, fraction, minAngle, maxAngle);
  if (!p1 || !p2) return null;
  return {
    x: displayX,
    y: lerp(p1.x, p2.x, cached.t),
    z: lerp(p1.y, p2.y, cached.t) + boardCadRockerAtPos(board, rawX)
  };
}

/** Same result as boardCadPointInAngleRange, but accepts pre-computed
 *  24-point samples from the cross-section cache instead of re-sampling
 *  the spline at 18 points on every call.  Falls back to a fresh 18-point
 *  sample only if no cache entry is available (defensive; should not
 *  happen on the cached call path above). */
function boardCadPointInAngleRangeFromSamples(samples, knots, fraction, minAngle, maxAngle) {
  const s = (samples && samples.length) ? samples : (knots ? boardCadSplineSamples(knots, 18) : null);
  if (!s || !s.length) return null;
  const { minS, maxS } = boardCadSRangeByNormalAngles(s, minAngle, maxAngle);
  const sVal = lerp(minS, maxS, clamp01(fraction));
  return boardCadPointBySFromSamples(s, sVal);
}

function boardCadPointInAngleRange(knots, fraction, minAngle, maxAngle) {
  if (!knots || knots.length < 2) return null;
  const samples = boardCadSplineSamples(knots, 18);
  const { minS, maxS } = boardCadSRangeByNormalAngles(samples, minAngle, maxAngle);
  const s = lerp(minS, maxS, clamp01(fraction));
  return boardCadPointBySFromSamples(samples, s);
}

function boardCadPointByNormalReverse(knots, angleDegrees) {
  const s = boardCadSByNormalReverse(knots, angleDegrees, true);
  if (!Number.isFinite(s)) return null;
  return boardCadPointByS(knots, s);
}

function boardCadSurfaceAngleLine(board, angle) {
  if (state.flowlineCache.revision !== state.geometryRevision) {
    state.flowlineCache.revision = state.geometryRevision;
    state.flowlineCache.lines.clear();
  }
  const key = `${state.crossSectionInterpolation}:${angle}:${board.sections.length}:${boardCadTailDisplayLength(board).toFixed(4)}:${boardCadTailDisplayShift(board).toFixed(4)}`;
  if (state.flowlineCache.lines.has(key)) return state.flowlineCache.lines.get(key);
  const points = [];
  const segmentsPerSpan = angle === 175 ? 10 : 6;
  for (let i = 0; i < board.sections.length; i++) {
    const previous = i === 0 ? 0 : boardCadDisplayXFromRawX(board, board.sections[i - 1].position);
    const current = boardCadDisplayXFromRawX(board, board.sections[i].position);
    const step = (current - previous) / segmentsPerSpan;
    const start = i === 0 ? 0 : 1;
    for (let k = start; k <= segmentsPerSpan; k++) {
      const point = boardCadSurfacePointAtAngle(board, previous + k * step, angle);
      if (point) points.push(point);
    }
  }
  state.flowlineCache.lines.set(key, points);
  return points;
}

function boardCadSByNormalReverse(knots, angleDegrees, useMinimumAngleOnSharpCorners = true) {
  if (!knots || knots.length < 2) return null;
  const curves = boardCadCurves(knots);
  const totalLength = boardCadSplineLength(knots, 48);
  if (!curves.length || totalLength <= 1e-9) return 0;
  const targetTangent = normalizeAngleRad((angleDegrees - 90) * Math.PI / 180);
  let best = { error: Infinity, curveIndex: curves.length - 1, t: 1 };
  let found = null;

  for (let i = curves.length - 1; i >= 0; i--) {
    const match = boardCadCurveTForTangent(curves[i], targetTangent, useMinimumAngleOnSharpCorners);
    if (match.error < best.error) best = { ...match, curveIndex: i };
    if (match.error <= BOARD_CAD_ANGLE_TOLERANCE) {
      found = { ...match, curveIndex: i };
      break;
    }
  }

  const result = found || best;
  const length = boardCadLengthToCurve(knots, result.curveIndex, result.t, 48);
  return clamp01(length / totalLength);
}

function boardCadSRangeByNormalAngles(samples, minAngle, maxAngle) {
  let minS = 1;
  let maxS = 0;
  if (minAngle > 0) minS = boardCadSByNormalReverseFromSamples(samples, minAngle);
  if (maxAngle < 270) maxS = boardCadSByNormalReverseFromSamples(samples, maxAngle);
  return { minS, maxS };
}

function boardCadSByNormalReverseFromSamples(samples, angleDegrees) {
  if (!samples.length) return 0;
  const target = normalizeAngleRad((angleDegrees - 90) * Math.PI / 180);
  let best = null;
  let bestError = Infinity;
  for (let i = samples.length - 1; i >= 0; i--) {
    const error = angleDistance(samples[i].tangent, target);
    if (error < bestError) {
      bestError = error;
      best = samples[i];
    }
    const prev = samples[i - 1];
    if (prev) {
      const currentDelta = normalizeAngleRad(samples[i].tangent - target);
      const prevDelta = normalizeAngleRad(prev.tangent - target);
      if (Math.sign(currentDelta) !== Math.sign(prevDelta) && Math.abs(currentDelta - prevDelta) < Math.PI) {
        const span = Math.abs(currentDelta) + Math.abs(prevDelta);
        const t = span > 1e-9 ? Math.abs(prevDelta) / span : 0;
        const lengthAtTarget = lerp(prev.length, samples[i].length, clamp01(t));
        const total = samples[samples.length - 1].length;
        return total > 1e-9 ? clamp01(lengthAtTarget / total) : 0;
      }
    }
  }
  const totalLength = samples[samples.length - 1].length;
  return totalLength > 1e-9 && best ? clamp01(best.length / totalLength) : 0;
}

function boardCadSplineSamples(knots, stepsPerCurve) {
  const samples = [];
  let length = 0;
  let previous = null;
  boardCadCurves(knots).forEach(curve => {
    for (let i = 0; i <= stepsPerCurve; i++) {
      const t = i / stepsPerCurve;
      const x = boardCadCurveX(curve, t);
      const y = boardCadCurveY(curve, t);
      if (previous) length += Math.hypot(x - previous.x, y - previous.y);
      const dx = boardCadCurveXDerivative(curve, t);
      const dy = boardCadCurveYDerivative(curve, t);
      samples.push({ x, y, length, tangent: normalizeAngleRad(Math.atan2(dy, dx)) });
      previous = { x, y };
    }
  });
  return samples;
}

function boardCadPointByS(knots, s) {
  const samples = boardCadSplineSamples(knots, 24);
  return boardCadPointBySFromSamples(samples, s);
}

function boardCadPointBySFromSamples(samples, s) {
  if (!samples.length) return { x: 0, y: 0 };
  const target = clamp01(s) * samples[samples.length - 1].length;
  for (let i = 1; i < samples.length; i++) {
    if (target <= samples[i].length) {
      const span = Math.max(1e-9, samples[i].length - samples[i - 1].length);
      const t = (target - samples[i - 1].length) / span;
      return {
        x: lerp(samples[i - 1].x, samples[i].x, t),
        y: lerp(samples[i - 1].y, samples[i].y, t)
      };
    }
  }
  const last = samples[samples.length - 1];
  return { x: last.x, y: last.y };
}

function boardCadCurvatureByS(knots, s) {
  const curves = boardCadCurves(knots);
  const targetLength = clamp01(s) * boardCadSplineLength(knots, 48);
  let length = 0;
  for (const curve of curves) {
    const curveLength = boardCadCurveLength(curve, 0, 1, 48);
    if (targetLength <= length + curveLength) {
      const t = boardCadCurveTAtLength(curve, Math.max(0, targetLength - length), curveLength);
      return boardCadCurveCurvature(curve, t);
    }
    length += curveLength;
  }
  return 0;
}

function boardCadCurveTAtLength(curve, targetLength, totalLength) {
  if (totalLength <= 1e-9) return 0;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 14; i++) {
    const mid = (low + high) / 2;
    const length = boardCadCurveLength(curve, 0, mid, 24);
    if (length < targetLength) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

function normalizeAngleRad(angle) {
  // Closed-form: one fmod + branch instead of potentially many while-loop
  // iterations for large angles (e.g. accumulated rotation values).
  let out = angle % (Math.PI * 2);
  if (out <= -Math.PI) out += Math.PI * 2;
  else if (out > Math.PI) out -= Math.PI * 2;
  return out;
}

function angleDistance(a, b) {
  return Math.abs(normalizeAngleRad(a - b));
}

function drawCurvatureComb(knots, transform, scale, color) {
  if (!knots || knots.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.78;
  boardCadCurves(knots).forEach(curve => {
    for (let i = 2; i < 18; i += 3) {
      const t = i / 18;
      const p = { x: boardCadCurveX(curve, t), y: boardCadCurveY(curve, t) };
      const normal = boardCadCurveNormal(curve, t);
      const curvature = boardCadCurveCurvature(curve, t);
      if (!Number.isFinite(curvature)) continue;
      const length = Math.max(-scale, Math.min(scale, curvature * scale * 120));
      line(transform.x(p.x), transform.y(p.y), transform.x(p.x + normal.x * length / transform.scale), transform.y(p.y + normal.y * length / transform.scale));
    }
  });
  ctx.restore();
}

function boardCadCurveNormal(curve, t) {
  const dx = boardCadCurveXDerivative(curve, t);
  const dy = boardCadCurveYDerivative(curve, t);
  const len = Math.hypot(dx, dy);
  if (len <= 1e-9) return { x: 0, y: 1 };
  return { x: -dy / len, y: dx / len };
}

function boardCadCurveCurvature(curve, t) {
  const dx = boardCadCurveXDerivative(curve, t);
  const dy = boardCadCurveYDerivative(curve, t);
  const ddx = boardCadCurveXSecondDerivative(curve, t);
  const ddy = boardCadCurveYSecondDerivative(curve, t);
  const denom = Math.pow((dx * dx) + (dy * dy), 1.5);
  if (denom <= 1e-9) return 0;
  return ((dx * ddy) - (dy * ddx)) / denom;
}

function boardCadCurveYDerivative(curve, t) {
  const c = curve.coeff;
  return (((3 * c.c4) * t) + (2 * c.c5)) * t + c.c6;
}

function boardCadCurveTangent(curve, t) {
  return normalizeAngleRad(Math.atan2(boardCadCurveYDerivative(curve, t), boardCadCurveXDerivative(curve, t)));
}

function boardCadCurveTForTangent(curve, targetTangent, useMinimumAngleOnSharpCorners = true) {
  const divisions = 48;
  let bestT = 1;
  let bestError = Infinity;
  let previousT = 1;
  let previousDelta = normalizeAngleRad(boardCadCurveTangent(curve, previousT) - targetTangent);
  for (let i = divisions; i >= 0; i--) {
    const t = i / divisions;
    const tangent = boardCadCurveTangent(curve, t);
    const delta = normalizeAngleRad(tangent - targetTangent);
    const error = Math.abs(delta);
    if (error < bestError) {
      bestError = error;
      bestT = t;
    }
    if (i < divisions && Math.sign(delta) !== Math.sign(previousDelta) && Math.abs(delta - previousDelta) < Math.PI) {
      const span = Math.abs(delta) + Math.abs(previousDelta);
      const crossingT = span > 1e-9 ? lerp(t, previousT, Math.abs(delta) / span) : t;
      const refined = boardCadRefineCurveTangent(curve, targetTangent, crossingT, 1 / divisions);
      return { t: refined.t, error: refined.error };
    }
    previousT = t;
    previousDelta = delta;
  }
  if (!useMinimumAngleOnSharpCorners) {
    const endError = angleDistance(boardCadCurveTangent(curve, 0.95), targetTangent);
    if (endError < bestError) return { t: 0.95, error: endError };
  }
  return boardCadRefineCurveTangent(curve, targetTangent, bestT, 1 / divisions);
}

function boardCadRefineCurveTangent(curve, targetTangent, centerT, radius) {
  let low = clamp01(centerT - radius);
  let high = clamp01(centerT + radius);
  let bestT = clamp01(centerT);
  let bestError = angleDistance(boardCadCurveTangent(curve, bestT), targetTangent);
  for (let iteration = 0; iteration < 8; iteration++) {
    const step = (high - low) / 8;
    for (let i = 0; i <= 8; i++) {
      const t = low + step * i;
      const error = angleDistance(boardCadCurveTangent(curve, t), targetTangent);
      if (error < bestError) {
        bestError = error;
        bestT = t;
      }
    }
    low = clamp01(bestT - step);
    high = clamp01(bestT + step);
  }
  return { t: bestT, error: bestError };
}

function boardCadCurveLength(curve, t0 = 0, t1 = 1, steps = 32) {
  const start = clamp01(Math.min(t0, t1));
  const end = clamp01(Math.max(t0, t1));
  if (end <= start) return 0;
  let length = 0;
  let previous = { x: boardCadCurveX(curve, start), y: boardCadCurveY(curve, start) };
  for (let i = 1; i <= steps; i++) {
    const t = lerp(start, end, i / steps);
    const point = { x: boardCadCurveX(curve, t), y: boardCadCurveY(curve, t) };
    length += Math.hypot(point.x - previous.x, point.y - previous.y);
    previous = point;
  }
  return length;
}

function boardCadLengthToCurve(knots, curveIndex, t, stepsPerCurve = 32) {
  const curves = boardCadCurves(knots);
  let length = 0;
  for (let i = 0; i < curves.length; i++) {
    if (i < curveIndex) {
      length += boardCadCurveLength(curves[i], 0, 1, stepsPerCurve);
    } else if (i === curveIndex) {
      length += boardCadCurveLength(curves[i], 0, t, stepsPerCurve);
      break;
    }
  }
  return length;
}

function boardCadCurveXSecondDerivative(curve, t) {
  const c = curve.coeff;
  return (6 * c.c0 * t) + (2 * c.c1);
}

function boardCadCurveYSecondDerivative(curve, t) {
  const c = curve.coeff;
  return (6 * c.c4 * t) + (2 * c.c5);
}

function drawCenterLine(length, rect, points, existingTransform) {
  if (!points.length) return;
  const transform = existingTransform || fitTransform(points, rect, 32);
  ctx.setLineDash([8, 7]);
  ctx.strokeStyle = "#8e8e93";
  ctx.lineWidth = 1;
  line(transform.x(0), transform.y(0), transform.x(length), transform.y(0));
  ctx.setLineDash([]);
}

function line(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function label(text, x, y, color) {
  ctx.fillStyle = color;
  ctx.font = "13px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(text, x, y);
}

function updateInfo() {
  const board = state.board;
  if (!board) {
    if (els.boardName) els.boardName.textContent = state.ghost.board ? t("ghost_only_loaded") : t("board_unloaded");
    if (els.boardMeta) els.boardMeta.textContent = state.ghost.board ? `${state.ghost.board.name || state.ghost.board.filename} / Ghost` : "";
    if (els.summary) {
      const items = [];
      if (state.ghost.board) {
        items.push(t("summary_ghost_entry", {
          label: t("summary_ghost"),
          name: state.ghost.board.name || state.ghost.board.filename
        }));
      }
      els.summary.innerHTML = items.map(text => `<span>${text}</span>`).join("");
    }
    updateBoardPanel();
    return;
  }
  els.boardName.textContent = board.name || board.filename;
  els.boardMeta.textContent = `${boardCadTailDisplayLength(board).toFixed(2)} x ${boardCadMaxWidth(board).toFixed(2)} / ${board.version || "BRD"}`;
  const summaryItems = [
    `${t("summary_outline")}: ${board.outline.length}${t("summary_points")}`,
    `${t("summary_bottom")}: ${board.bottom.length}${t("summary_points")}`,
    `${t("summary_deck")}: ${board.deck.length}${t("summary_points")}`,
    `${t("summary_sections")}: ${board.sections.length}`
  ];
  const tail = normalizedTailConfig(board);
  const nose = normalizedNoseConfig(board);
  const wing = normalizedWingConfig(board);
  if (tail.active) {
    summaryItems.push(t("summary_tail_entry", {
      label: t("summary_tail"),
      shape: tailModeLabel(tail.mode),
      length: fmt(tail.length),
      depthPart: tailModeUsesDepth(tail.mode) ? t("summary_depth_part", { depth: fmt(tail.depth) }) : "",
      shoulder: fmt(tail.shoulderPos),
      width: fmt(tail.shoulderScale),
      blend: fmt(tail.railBlend),
      widthAdjust: widthAdjustPercent(tail.widthAdjust)
    }));
  }
  if (nose.active) {
    summaryItems.push(t("summary_nose_entry", {
      label: t("summary_nose"),
      shape: noseModeLabel(nose.mode),
      length: fmt(nose.length),
      shoulder: fmt(nose.shoulderPos),
      width: fmt(nose.shoulderScale),
      blend: fmt(nose.railBlend),
      widthAdjust: widthAdjustPercent(nose.widthAdjust)
    }));
  }
  if (wing.active) {
    summaryItems.push(t("summary_wing_entry", {
      label: t("summary_wing"),
      preset: wingPresetLabel(wing.presetKey),
      shape: wingShapeLabel(wing.shape),
      position: fmt(wing.distance),
      width: fmt(wing.width),
      bumpPart: wing.shape === "bump" ? t("summary_bump_part", {
        shoulder: fmt(wing.shoulder),
        transition: fmt(wing.transition)
      }) : ""
    }));
  }
  if (state.ghost.board) {
    summaryItems.push(t("summary_ghost_entry", {
      label: t("summary_ghost"),
      name: state.ghost.board.name || state.ghost.board.filename
    }));
  }
  els.summary.innerHTML = summaryItems.map(text => `<span>${text}</span>`).join("");
  updateBoardPanel();
}

function updateSectionInfo() {
  if (!els.sectionSummary) return;
  const section = currentCrossSection();
  if (!state.board || !section) {
    els.sectionSummary.textContent = t("section_unselected");
    if (els.sectionPosition) {
      els.sectionPosition.value = "";
      els.sectionPosition.disabled = true;
    }
    return;
  }
  const width = boardCadCrossSectionWidth(section.spline);
  const thickness = boardCadCrossSectionCenterThickness(section.spline);
  const release = boardCadCrossSectionReleaseAngle(section.spline) * 180 / Math.PI;
  const tuck = boardCadCrossSectionTuckRadius(section.spline);
  let summaryText = t("section_summary", {
    index: state.currentSectionIndex,
    position: fmt(section.position),
    width: fmt(width),
    thickness: fmt(thickness),
    release: fmt(release),
    tuck: fmt(tuck)
  });
  if (normalizeRailModeKey(state.board.railMode)) {
    summaryText += ` / ${railModeLabel(state.board.railMode)} ${fmt(clampNumber(state.board.railStrength, 0, 1, 1))}`;
  }
  const edge = normalizedEdgeConfig(state.board);
  const edgeStrength = edgeEffectAtSection(state.board, section, edge);
  if (edgeStrength > 1e-6) {
    summaryText += ` / ${edgeTypeLabel(edge.type)} ${fmt(edgeStrength)}`;
  }
  els.sectionSummary.textContent = summaryText;
  if (els.sectionPosition) {
    els.sectionPosition.value = fmt(section.position);
    els.sectionPosition.max = fmt(state.board.length - 0.001);
    els.sectionPosition.disabled = false;
  }
}

function updateEditInfo() {
  if (!els.editSummary) return;
  if (state.guidePointSelection && state.board) {
    const point = state.guidePointSelection.points[state.guidePointSelection.index];
    const target = state.view === "quad" ? ` / ${quadPaneLabel(state.quadActivePane)}` : "";
    els.editSummary.innerHTML = point
      ? `<span>${t("edit_selected_guide_point", { prefix: t("edit_prefix"), label: state.guidePointSelection.label, index: state.guidePointSelection.index, target })}</span><span>${t("edit_selected_guide_point_coords", { x: fmt(point.x), y: fmt(point.y) })}</span>`
      : `<span>${t("edit_prefix")}: ${t("guide_point_none")}${target}</span>`;
    updateControlPointPanel();
    updateGuidePointPanel();
    return;
  }
  if (state.wingSelection && state.board) {
    const wing = normalizedWingConfig(state.board);
    const target = state.view === "quad" ? ` / ${quadPaneLabel(state.quadActivePane)}` : "";
    els.editSummary.innerHTML = wing.active
      ? `<span>${t("edit_selected_wing", { prefix: t("edit_prefix"), kind: state.wingSelection.kind, target })}</span><span>${t("edit_selected_wing_values", {
          position: fmt(wing.distance),
          width: fmt(wing.width),
          bumpPart: wing.shape === "bump" ? t("edit_wing_bump_part", {
            shoulder: fmt(wing.shoulder),
            transition: fmt(wing.transition)
          }) : "",
          shape: wingShapeLabel(wing.shape)
        })}</span>`
      : `<span>${t("edit_prefix")}: ${t("wing_none")}${target}</span>`;
    updateControlPointPanel();
    updateGuidePointPanel();
    return;
  }
  if (!state.selection || !state.board) {
    const target = state.view === "quad" ? ` / ${quadPaneLabel(state.quadActivePane)}` : "";
    els.editSummary.innerHTML = `<span>${t("edit_prefix")}: ${t("edit_none")}${target}</span>`;
    updateControlPointPanel();
    return;
  }
  const knot = state.selection.knots[state.selection.knotIndex];
  const point = knot[state.selection.pointKey];
  const part = state.selection.which === 0 ? t("endpoint") : state.selection.which === 1 ? t("tangent_prev") : t("tangent_next");
  els.editSummary.innerHTML = [
    `${t("edit_prefix")}: ${state.selection.splineLabel}`,
    `${part} #${state.selection.knotIndex}`,
    `X ${fmt(point.x)} / Y ${fmt(point.y)}`,
    t("edit_selection_continuous", {
      value: knot.continuous ? t("continuous_true_label") : t("continuous_false_label")
    })
  ].map(text => `<span>${text}</span>`).join("");
  updateControlPointPanel();
}

function quadPaneLabel(paneId) {
  if (paneId === "outline") return t("pane_outline");
  if (paneId === "profile") return t("pane_profile");
  if (paneId === "cross-section") return t("pane_cross_section");
  if (paneId === "wire") return t("pane_wire");
  return paneId || "";
}

function updateControlPointPanel() {
  const inputs = [els.cpEndX, els.cpEndY, els.cpPrevX, els.cpPrevY, els.cpNextX, els.cpNextY];
  state.controlPointPanelUpdating = true;
  if (!state.selection || !state.board) {
    inputs.forEach(input => {
      input.value = "";
      input.disabled = true;
    });
    els.cpContinuous.checked = false;
    els.cpContinuous.disabled = true;
    els.cpSetButton.disabled = true;
    els.cpHorizontalButton.disabled = true;
    els.cpVerticalButton.disabled = true;
    state.controlPointPanelUpdating = false;
    return;
  }
  const knot = state.selection.knots[state.selection.knotIndex];
  els.cpEndX.value = fmt(knot.p.x);
  els.cpEndY.value = fmt(knot.p.y);
  els.cpPrevX.value = fmt(knot.prev.x);
  els.cpPrevY.value = fmt(knot.prev.y);
  els.cpNextX.value = fmt(knot.next.x);
  els.cpNextY.value = fmt(knot.next.y);
  inputs.forEach(input => {
    input.disabled = false;
  });
  els.cpContinuous.checked = !!knot.continuous;
  els.cpContinuous.disabled = false;
  els.cpSetButton.disabled = false;
  els.cpHorizontalButton.disabled = false;
  els.cpVerticalButton.disabled = false;
  state.controlPointPanelUpdating = false;
}

function undoEdit() {
  if (!state.history.undo.length) return;
  state.history.redo.push(cloneBoard(state.board));
  state.board = state.history.undo.pop();
  state.selection = null;
  clearGuidePointSelection();
  state.drag = null;
  applyBoardCadDerivedMetrics(state.board);
  state.currentSectionIndex = normalizeSectionIndex(state.board, state.currentSectionIndex);
  updateInfo();
  updateSectionInfo();
  updateEditInfo();
  updateBoardPanel();
  updateHistoryButtons();
  draw();
}

function redoEdit() {
  if (!state.history.redo.length) return;
  state.history.undo.push(cloneBoard(state.board));
  state.board = state.history.redo.pop();
  state.selection = null;
  clearGuidePointSelection();
  state.drag = null;
  applyBoardCadDerivedMetrics(state.board);
  state.currentSectionIndex = normalizeSectionIndex(state.board, state.currentSectionIndex);
  updateInfo();
  updateSectionInfo();
  updateEditInfo();
  updateHistoryButtons();
  draw();
}

function nextCrossSection() {
  if (!state.board || !state.board.sections.length) return;
  const last = lastEditableSectionIndex(state.board);
  if (last < 0) return;
  state.currentSectionIndex = Math.min(last, Math.max(firstEditableSectionIndex(state.board), state.currentSectionIndex + 1));
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  setStatus("status_cross_section_next");
  updateSectionInfo();
  updateEditInfo();
  updateHistoryButtons();
  draw();
}

function previousCrossSection() {
  if (!state.board || !state.board.sections.length) return;
  const first = firstEditableSectionIndex(state.board);
  if (first < 0) return;
  state.currentSectionIndex = Math.max(first, Math.min(lastEditableSectionIndex(state.board), state.currentSectionIndex - 1));
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  setStatus("status_cross_section_previous");
  updateSectionInfo();
  updateEditInfo();
  updateHistoryButtons();
  draw();
}

function promptAddCrossSection() {
  if (!state.board) return;
  const current = currentCrossSection();
  const fallback = current ? current.position : state.board.length / 2;
  showFormDialog(t("dialog_cross_section_add_title"), [
    {
      name: "position",
      label: t("position_from_tail"),
      type: "number",
      step: "any",
      min: 0.001,
      max: Math.max(0.001, state.board.length - 0.001),
      value: fmt(fallback)
    }
  ], {
    submitLabel: t("add"),
    closeLabel: t("close"),
    keepOpenOnSuccess: true,
    onSubmit: values => {
      const pos = Number(values.position);
      if (!Number.isFinite(pos) || !state.board || pos <= 0 || pos >= state.board.length) {
        setStatus("status_cross_section_prompt_invalid");
        return false;
      }
      addCrossSectionAt(pos, { redraw: false });
      return true;
    }
  });
}

function promptMoveCrossSection() {
  const section = currentCrossSection();
  if (!state.board || !section || !canMoveCrossSection()) return;
  showFormDialog(t("dialog_cross_section_move_title"), [
    {
      name: "position",
      label: t("position_from_tail"),
      type: "number",
      step: "any",
      min: 0.001,
      max: Math.max(0.001, state.board.length - 0.001),
      value: fmt(section.position)
    }
  ], {
    submitLabel: t("move"),
    onSubmit: values => {
      const pos = Number(values.position);
      if (!Number.isFinite(pos) || !state.board || pos <= 0 || pos >= state.board.length) {
        setStatus("status_cross_section_prompt_invalid");
        return false;
      }
      moveCurrentCrossSectionTo(pos);
      return true;
    }
  });
}

function panelCrossSectionPosition() {
  const pos = Number(String(els.sectionPosition?.value ?? "").trim());
  if (!Number.isFinite(pos) || !state.board || pos <= 0 || pos >= state.board.length) {
    setStatus("status_cross_section_panel_invalid");
    return null;
  }
  return pos;
}

function panelCrossSectionInterval() {
  const interval = Number(String(els.sectionInterval?.value ?? "").trim());
  if (!Number.isFinite(interval) || !state.board || interval <= 0 || interval >= state.board.length) {
    setStatus("status_cross_section_panel_invalid");
    return null;
  }
  return interval;
}

function addCrossSectionFromPanel() {
  if (!state.board) return;
  const pos = panelCrossSectionPosition();
  if (pos !== null) addCrossSectionAt(pos);
}

function moveCrossSectionFromPanel() {
  if (!state.board || !canMoveCrossSection()) return;
  const pos = panelCrossSectionPosition();
  if (pos !== null) moveCurrentCrossSectionTo(pos);
}

function normalizedCrossSectionInterval(board, interval = null) {
  const step = Number(interval ?? els.sectionInterval?.value);
  if (!board || !Number.isFinite(step) || step <= 0 || step >= board.length) return null;
  return step;
}

function crossSectionIntervalPositions(board, start, end, interval, options = {}) {
  const step = normalizedCrossSectionInterval(board, interval);
  if (!step) return [];
  const tolerance = Math.max(0.001, Number(options.tolerance) || 0.25);
  const positions = [];
  const minPos = clampNumber(start, 0, board.length, 0);
  const maxPos = clampNumber(end, 0, board.length, board.length);
  if (!(maxPos - minPos > tolerance)) return [];
  const firstStep = Math.ceil((minPos - tolerance) / step) * step;
  for (let pos = firstStep; pos <= maxPos + tolerance; pos += step) {
    if (pos <= tolerance || pos >= board.length - tolerance) continue;
    if (pos < minPos - tolerance || pos > maxPos + tolerance) continue;
    positions.push(pos);
  }
  return positions;
}

function dedupeSectionPositions(positions, tolerance = 0.25) {
  const sorted = positions
    .map(value => Number(value))
    .filter(value => Number.isFinite(value))
    .sort((a, b) => a - b);
  const deduped = [];
  sorted.forEach(pos => {
    if (!deduped.length || Math.abs(deduped[deduped.length - 1] - pos) > tolerance) deduped.push(pos);
  });
  return deduped;
}

function fillCrossSectionsByInterval(board, interval, options = {}) {
  if (!board || !Array.isArray(board.sections)) return [];
  const tolerance = Math.max(0.001, Number(options.tolerance) || 0.25);
  const positions = crossSectionIntervalPositions(board, 0, board.length, interval, { tolerance });
  return ensureCrossSectionsAtPositions(board, positions, { tolerance });
}

function subdividePositionGaps(positions, maxGap, tolerance = 0.25) {
  const gapLimit = Math.max(tolerance * 2, Number(maxGap) || 0);
  if (!(gapLimit > tolerance)) return dedupeSectionPositions(positions, tolerance);
  const deduped = dedupeSectionPositions(positions, tolerance);
  if (deduped.length < 2) return deduped;
  const filled = [deduped[0]];
  for (let i = 1; i < deduped.length; i++) {
    const left = deduped[i - 1];
    const right = deduped[i];
    const gap = right - left;
    if (gap > gapLimit + tolerance) {
      const segments = Math.ceil(gap / gapLimit);
      for (let step = 1; step < segments; step++) {
        filled.push(lerp(left, right, step / segments));
      }
    }
    filled.push(right);
  }
  return dedupeSectionPositions(filled, tolerance);
}

function bottomFeatureAutoSectionGap(board, feature) {
  const type = normalizeBottomFeatureType(feature?.type);
  const start = Number(feature?.start) || 0;
  const end = Math.max(start, Number(feature?.end) || start);
  const span = Math.max(0, end - start);
  if (!(span > 0)) return 12.5;
  if (usesExplicitBottomFeatureControlPoints(type)) {
    return clampNumber(span / 8, 8, 12.5, 12.5);
  }
  return clampNumber(span / 6, 10, 18, 14);
}

function bottomFeatureSectionPositions(board, feature, options = {}) {
  if (!board || !feature) return [];
  const tolerance = Math.max(0.001, Number(options.tolerance) || 0.25);
  const start = Number(feature.start) || 0;
  const peak = Number(feature.peak) || start;
  const end = Number(feature.end) || peak;
  const type = normalizeBottomFeatureType(feature?.type);
  const anchors = [start, peak, end];
  if (usesExplicitBottomFeatureControlPoints(type)) {
    anchors.push(
      lerp(start, peak, 0.5),
      lerp(peak, end, 0.5)
    );
  }
  const grid = crossSectionIntervalPositions(board, start, end, options.interval, { tolerance });
  const seed = dedupeSectionPositions([...anchors, ...grid], tolerance);
  const autoGap = bottomFeatureAutoSectionGap(board, feature);
  return subdividePositionGaps(seed, autoGap, tolerance);
}

function insertHalfSplineKnotAtX(knots, targetX, tolerance = 0.05) {
  if (!Array.isArray(knots) || knots.length < 2) return boardCadCloneKnots(knots || []);
  const cloned = boardCadCloneKnots(knots);
  const maxX = boardCadSplineMaxX(cloned);
  const x = clampNumber(targetX, 0, maxX, 0);
  if (x <= cloned[0].p.x + tolerance || x >= maxX - tolerance) return cloned;
  if (cloned.some(knot => Math.abs(knot.p.x - x) <= tolerance)) return cloned;
  const curves = boardCadCurves(cloned);
  const index = boardCadFindMatchingBezierSegment(curves, x);
  if (index < 0) return cloned;
  const t = boardCadCurveTForX(curves[index], x);
  const split = boardCadSplitCurveKnot(curves[index], t);
  const left = boardCadCloneKnots(cloned.slice(0, index + 1));
  const right = boardCadCloneKnots(cloned.slice(index + 1));
  left[left.length - 1].next = { ...split.startNext };
  const middle = cloneKnot(split.knot);
  if (right.length) right[0].prev = { ...split.endPrev };
  return [...left, middle, ...right];
}

function insertLowerHalfSplineKnotAtX(knots, targetX, tolerance = 0.05) {
  if (!Array.isArray(knots) || knots.length < 2) return boardCadCloneKnots(knots || []);
  const cloned = boardCadCloneKnots(knots);
  const railIndex = findSplineMaxXKnotIndex(cloned);
  if (railIndex <= 0 || railIndex >= cloned.length - 1) return insertHalfSplineKnotAtX(cloned, targetX, tolerance);
  const lower = cloned.slice(0, railIndex + 1);
  const upper = cloned.slice(railIndex + 1);
  const lowerInserted = insertHalfSplineKnotAtX(lower, targetX, tolerance);
  return lowerInserted.concat(upper);
}

function trimLowerHalfSplineToX(knots, endX, tolerance = 0.05) {
  if (!Array.isArray(knots) || knots.length < 2) return boardCadCloneKnots(knots || []);
  const cloned = boardCadCloneKnots(knots);
  const maxX = boardCadSplineMaxX(cloned);
  const targetX = clampNumber(endX, 0, maxX, 0);
  if (targetX >= maxX - tolerance) return cloned;
  const inserted = insertHalfSplineKnotAtX(cloned, targetX, tolerance);
  const endIndex = inserted.findIndex(knot => Math.abs((Number(knot?.p?.x) || 0) - targetX) <= tolerance);
  if (endIndex < 0) return inserted.filter(knot => (Number(knot?.p?.x) || 0) <= targetX + tolerance);
  return boardCadCloneKnots(inserted.slice(0, endIndex + 1));
}

function trimLowerHalfSplineFromX(knots, startX, tolerance = 0.05) {
  if (!Array.isArray(knots) || knots.length < 2) return boardCadCloneKnots(knots || []);
  const cloned = boardCadCloneKnots(knots);
  const maxX = boardCadSplineMaxX(cloned);
  const targetX = clampNumber(startX, 0, maxX, 0);
  if (targetX <= tolerance) return cloned;
  const inserted = insertHalfSplineKnotAtX(cloned, targetX, tolerance);
  const startIndex = inserted.findIndex(knot => Math.abs((Number(knot?.p?.x) || 0) - targetX) <= tolerance);
  if (startIndex < 0) return inserted.filter(knot => (Number(knot?.p?.x) || 0) >= targetX - tolerance);
  return boardCadCloneKnots(inserted.slice(startIndex));
}

function shouldAnchorBottomFeatureType(type) {
  return type === "single-concave" || type === "vee" || type === "spiral-vee" || type === "double-concave" || type === "hull" || type === "displacement-hull";
}

function usesExplicitBottomFeatureControlPoints(type) {
  return type === "vee" || type === "spiral-vee" || type === "double-concave" || type === "hull" || type === "displacement-hull" || type === "channel";
}

function explicitBottomFeatureAffectsInterval(board, startX, endX) {
  const minX = Math.min(startX, endX);
  const maxX = Math.max(startX, endX);
  return normalizeBottomFeatures(board?.bottomFeatures).some(feature => {
    if (feature.enabled === false) return false;
    if (!usesExplicitBottomFeatureControlPoints(normalizeBottomFeatureType(feature.type))) return false;
    const featureStart = Number(feature.start) || 0;
    const featureEnd = Math.max(featureStart, Number(feature.end) || featureStart);
    return featureEnd >= minX - 1e-6 && featureStart <= maxX + 1e-6;
  });
}

function insertBottomFeatureAnchorKnots(knots, board, feature) {
  const type = normalizeBottomFeatureType(feature?.type);
  if (!shouldAnchorBottomFeatureType(type)) return boardCadCloneKnots(knots || []);
  let anchored = boardCadCloneKnots(knots || []);
  if (anchored.length < 2) return anchored;
  const halfWidth = Math.max(1e-6, boardCadSplineMaxX(anchored));
  const offsetRatio = clampNumber(feature?.offset, 0.15, 0.8, 0.42);
  const spreadRatio = clampNumber(offsetRatio + (clampNumber(feature?.width, 0.05, 1, 0.7) * 0.5), offsetRatio, 1, Math.min(1, offsetRatio + 0.5));
  const anchorX = bottomFeatureWidthAnchorX(feature, halfWidth, board);
  if (type === "double-concave") {
    const troughX = clampNumber(
      bottomFeatureReferenceDistanceX(feature, board, offsetRatio, halfWidth),
      0.1,
      Math.max(0.1, anchorX - 0.1),
      Math.min(halfWidth * 0.42, anchorX - 0.1)
    );
    anchored = insertLowerHalfSplineKnotAtX(anchored, troughX);
  }
  anchored = insertLowerHalfSplineKnotAtX(anchored, anchorX);
  return anchored;
}

function cloneSectionBottomFeatureBaseSpline(section) {
  return Array.isArray(section?.bottomFeatureBaseSpline)
    ? boardCadCloneKnots(section.bottomFeatureBaseSpline)
    : null;
}

function cloneSectionsForBottomFeatureBase(sections = []) {
  return (sections || [])
    .filter(section => section?.generatedByBottomFeature !== true)
    .map(section => ({
    position: section.position,
    spline: boardCadCloneKnots(section.spline),
    guidePoints: clonePoints(section.guidePoints)
  }));
}

function interpolationSourceSections(board) {
  if (Array.isArray(board?.bottomFeatureBaseSections) && board.bottomFeatureBaseSections.length) return board.bottomFeatureBaseSections;
  return board?.sections;
}

function findSectionIndexNearInArray(sections, pos, tolerance = 0.25) {
  if (!Array.isArray(sections)) return -1;
  return sections.findIndex(section => Math.abs((Number(section?.position) || 0) - pos) <= tolerance);
}

function sortSectionsArray(sections) {
  if (!Array.isArray(sections)) return sections;
  sections.sort((a, b) => (Number(a?.position) || 0) - (Number(b?.position) || 0));
  return sections;
}

function syncBottomFeatureBaseSection(board, position, spline, guidePoints = [], options = {}) {
  if (!board || !Array.isArray(board.bottomFeatureBaseSections)) return;
  if (options.generatedByBottomFeature === true) return;
  const tolerance = 0.01;
  const existingIndex = findSectionIndexNearInArray(board.bottomFeatureBaseSections, position, tolerance);
  const nextSection = {
    position,
    spline: boardCadCloneKnots(spline),
    guidePoints: clonePoints(guidePoints)
  };
  if (existingIndex >= 0) board.bottomFeatureBaseSections[existingIndex] = nextSection;
  else board.bottomFeatureBaseSections.push(nextSection);
  sortSectionsArray(board.bottomFeatureBaseSections);
}

function choosePreferredCrossSectionSection(a, b) {
  if (!a) return b;
  if (!b) return a;
  const aGuideCount = Array.isArray(a.guidePoints) ? a.guidePoints.length : 0;
  const bGuideCount = Array.isArray(b.guidePoints) ? b.guidePoints.length : 0;
  if (bGuideCount > aGuideCount) return b;
  if (aGuideCount > bGuideCount) return a;
  const aSplineCount = Array.isArray(a.spline) ? a.spline.length : 0;
  const bSplineCount = Array.isArray(b.spline) ? b.spline.length : 0;
  if (bSplineCount > aSplineCount) return b;
  return a;
}

function dedupeCrossSectionsByPosition(board, tolerance = 0.01) {
  if (!board || !Array.isArray(board.sections) || board.sections.length < 2) return false;
  sortCrossSections(board);
  const deduped = [];
  let changed = false;
  board.sections.forEach(section => {
    const previous = deduped[deduped.length - 1];
    if (previous && Math.abs((Number(previous.position) || 0) - (Number(section.position) || 0)) <= tolerance) {
      const preferred = choosePreferredCrossSectionSection(previous, section);
      deduped[deduped.length - 1] = preferred === previous ? previous : preferred;
      changed = true;
      return;
    }
    deduped.push(section);
  });
  if (changed) board.sections = deduped;
  return changed;
}

function stashBoardBottomFeatureBaseSections(board) {
  if (!board || Array.isArray(board.bottomFeatureBaseSections)) return;
  dedupeCrossSectionsByPosition(board);
  board.bottomFeatureBaseSections = cloneSectionsForBottomFeatureBase(board.sections);
}

function restoreBoardBottomFeatureBaseSections(board, dropStash = false) {
  if (!board || !Array.isArray(board.bottomFeatureBaseSections)) return false;
  board.sections = cloneSectionsForBottomFeatureBase(board.bottomFeatureBaseSections);
  if (dropStash) delete board.bottomFeatureBaseSections;
  return true;
}

function stashSectionBottomFeatureBaseSpline(section) {
  if (!section) return;
  if (Array.isArray(section.bottomFeatureBaseSpline)) return;
  section.bottomFeatureBaseSpline = boardCadCloneKnots(section.spline || []);
}

function restoreSectionBottomFeatureBaseSpline(section, dropStash = false) {
  if (!section || !Array.isArray(section.bottomFeatureBaseSpline)) return false;
  section.spline = boardCadCloneKnots(section.bottomFeatureBaseSpline);
  if (dropStash) delete section.bottomFeatureBaseSpline;
  return true;
}

function restoreBoardBottomFeatureBaseSplines(board, dropStash = false) {
  if (!board || !Array.isArray(board.sections)) return false;
  let changed = false;
  board.sections.forEach(section => {
    if (restoreSectionBottomFeatureBaseSpline(section, dropStash)) changed = true;
  });
  return changed;
}

function ensureBottomFeatureAnchorsOnSections(board, feature, options = {}) {
  if (!board || !feature || !Array.isArray(board.sections)) return false;
  const type = normalizeBottomFeatureType(feature?.type);
  if (!shouldAnchorBottomFeatureType(type)) return false;
  const tolerance = Math.max(0.001, Number(options.tolerance) || 0.25);
  const start = Number(feature.start) || 0;
  const end = Math.max(start, Number(feature.end) || start);
  let changed = false;
  board.sections.forEach(section => {
    const pos = Number(section?.position);
    if (!Number.isFinite(pos)) return;
    if (!usesExplicitBottomFeatureControlPoints(type) && (pos < start - tolerance || pos > end + tolerance)) return;
    const anchored = insertBottomFeatureAnchorKnots(section.spline, board, feature);
    if (anchored.length !== (section.spline?.length || 0)) {
      stashSectionBottomFeatureBaseSpline(section);
      section.spline = anchored;
      changed = true;
    }
  });
  return changed;
}

function findSplineMaxXKnotIndex(knots) {
  let bestIndex = 0;
  let bestX = -Infinity;
  (knots || []).forEach((knot, index) => {
    const x = Number(knot?.p?.x);
    if (x > bestX) {
      bestX = x;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function findKnotIndexNearX(knots, targetX, tolerance = 0.05, maxIndex = knots.length - 1) {
  let bestIndex = -1;
  let bestDistance = Infinity;
  for (let index = 0; index <= maxIndex && index < knots.length; index++) {
    const distance = Math.abs((Number(knots[index]?.p?.x) || 0) - targetX);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return bestDistance <= tolerance ? bestIndex : -1;
}

function shiftKnotVertical(knot, deltaY) {
  if (!knot || Math.abs(deltaY) <= 1e-9) return;
  ["p", "prev", "next"].forEach(key => {
    if (!knot[key]) return;
    knot[key].y += deltaY;
  });
}

function clampKnotHandleXToNeighbors(knots, knotIndex, margin = 0.001) {
  if (!Array.isArray(knots) || knotIndex < 0 || knotIndex >= knots.length) return;
  const knot = knots[knotIndex];
  if (!knot?.p) return;
  const prevKnot = knotIndex > 0 ? knots[knotIndex - 1] : null;
  const nextKnot = knotIndex < knots.length - 1 ? knots[knotIndex + 1] : null;
  const minPrevX = prevKnot?.p ? prevKnot.p.x + margin : knot.p.x;
  const maxPrevX = knot.p.x - margin;
  const minNextX = knot.p.x + margin;
  const maxNextX = nextKnot?.p ? nextKnot.p.x - margin : knot.p.x;
  if (knot.prev) {
    knot.prev.x = clampNumber(knot.prev.x, Math.min(minPrevX, maxPrevX), Math.max(minPrevX, maxPrevX), Math.min(knot.p.x, knot.prev.x));
  }
  if (knot.next) {
    knot.next.x = clampNumber(knot.next.x, Math.min(minNextX, maxNextX), Math.max(minNextX, maxNextX), Math.max(knot.p.x, knot.next.x));
  }
}

function enforceKnotContinuous(knot, sourceKey = "prev") {
  if (!knot?.p || !knot?.prev || !knot?.next) return;
  const which = sourceKey === "next" ? 2 : 1;
  knot.continuous = true;
  alignOppositeTangent(knot, which);
}

function scaleKnotHandleLength(knot, key, scale) {
  if (!knot?.p || !knot?.[key]) return;
  const sx = knot[key].x - knot.p.x;
  const sy = knot[key].y - knot.p.y;
  knot[key] = {
    x: knot.p.x + (sx * scale),
    y: knot.p.y + (sy * scale)
  };
}

function applyKnotEdgeStyle(knot, sourceKey = "prev", edgeStrength = 0) {
  if (!knot?.p || !knot?.prev || !knot?.next) return;
  const strength = clampNumber(edgeStrength, 0, 1, 0);
  if (strength < 0.1) {
    enforceKnotContinuous(knot, sourceKey);
    return;
  }
  const oppositeKey = sourceKey === "next" ? "prev" : "next";
  const sourceScale = lerp(1, 0.72, strength);
  const oppositeScale = lerp(1, 0.08, strength);
  scaleKnotHandleLength(knot, sourceKey, sourceScale);
  scaleKnotHandleLength(knot, oppositeKey, oppositeScale);
  knot.continuous = false;
}

function shapeExplicitConcaveSegment(knots, anchorIndex, edgeStrength = 0) {
  if (!Array.isArray(knots) || anchorIndex <= 0 || anchorIndex >= knots.length) return;
  const stringer = knots[0];
  const anchor = knots[anchorIndex];
  if (!stringer?.p || !anchor?.p) return;
  const dx = Math.max(0.05, anchor.p.x - stringer.p.x);
  const strength = clampNumber(edgeStrength, 0, 1, 0);
  const handle = dx * lerp(CIRCULAR_ARC_HANDLE, 0.44, strength);
  stringer.prev = { ...stringer.p };
  stringer.next = { x: stringer.p.x + handle, y: stringer.p.y };
  anchor.prev = { x: anchor.p.x - handle, y: anchor.p.y };
  if (strength >= 0.1) {
    applyKnotEdgeStyle(anchor, "prev", strength);
  } else {
    anchor.continuous = false;
  }
}

function shapeExplicitDoubleConcaveSegment(knots, troughIndex, anchorIndex, edgeStrength = 0) {
  if (!Array.isArray(knots) || troughIndex <= 0 || anchorIndex <= troughIndex || anchorIndex >= knots.length) return;
  const stringer = knots[0];
  const trough = knots[troughIndex];
  const anchor = knots[anchorIndex];
  if (!stringer?.p || !trough?.p || !anchor?.p) return;
  const dx1 = Math.max(0.05, trough.p.x - stringer.p.x);
  const dx2 = Math.max(0.05, anchor.p.x - trough.p.x);
  const smoothStrength = clampNumber(edgeStrength, 0, 1, 0);
  const arch = lerp(CIRCULAR_ARC_HANDLE, 0.47, smoothStrength * 0.75);
  stringer.prev = { ...stringer.p };
  stringer.next = {
    x: stringer.p.x + (dx1 * arch),
    y: stringer.p.y
  };
  trough.prev = {
    x: trough.p.x - (dx1 * arch),
    y: trough.p.y
  };
  trough.next = {
    x: trough.p.x + (dx2 * arch),
    y: trough.p.y
  };
  anchor.prev = {
    x: anchor.p.x - (dx2 * arch),
    y: anchor.p.y
  };
  stringer.continuous = false;
  trough.continuous = false;
  anchor.continuous = false;
  if (edgeStrength > 0.05) {
    applyKnotEdgeStyle(trough, "prev", edgeStrength);
    applyKnotEdgeStyle(anchor, "prev", edgeStrength * 0.7);
  }
  clampKnotHandleXToNeighbors(knots, 0);
  clampKnotHandleXToNeighbors(knots, troughIndex);
  clampKnotHandleXToNeighbors(knots, anchorIndex);
}

function simplifyExplicitDoubleConcaveKnots(knots, troughIndex, anchorIndex, railIndex) {
  if (!Array.isArray(knots) || troughIndex <= 0 || anchorIndex <= troughIndex || railIndex <= anchorIndex || railIndex >= knots.length) {
    return {
      knots: boardCadCloneKnots(knots || []),
      troughIndex,
      anchorIndex,
      railIndex
    };
  }
  const lower = [
    cloneKnot(knots[0]),
    cloneKnot(knots[troughIndex]),
    cloneKnot(knots[anchorIndex]),
    cloneKnot(knots[railIndex])
  ];
  const upper = boardCadCloneKnots(knots.slice(railIndex + 1));
  const simplified = lower.concat(upper);
  return {
    knots: simplified,
    troughIndex: 1,
    anchorIndex: 2,
    railIndex: 3
  };
}

function simplifyExplicitVeeKnots(knots, boundaryIndex, railIndex) {
  if (!Array.isArray(knots) || boundaryIndex <= 0 || railIndex < boundaryIndex || railIndex >= knots.length) {
    return {
      knots: boardCadCloneKnots(knots || []),
      boundaryIndex,
      railIndex
    };
  }
  const lower = [
    cloneKnot(knots[0]),
    cloneKnot(knots[boundaryIndex])
  ];
  const outer = boardCadCloneKnots(knots.slice(boundaryIndex + 1));
  const simplified = lower.concat(outer);
  return {
    knots: simplified,
    boundaryIndex: 1,
    railIndex: railIndex - boundaryIndex + 1
  };
}

function shapeExplicitProtectedVeeSegment(knots, boundaryIndex, edgeStrength = 0) {
  if (!Array.isArray(knots) || boundaryIndex <= 0 || boundaryIndex >= knots.length) return;
  const stringer = knots[0];
  const boundary = knots[boundaryIndex];
  if (!stringer?.p || !boundary?.p) return;

  const dx = Math.max(0.05, boundary.p.x - stringer.p.x);
  const slope = (boundary.p.y - stringer.p.y) / dx;
  const handle = dx * 0.42;
  stringer.prev = { ...stringer.p };
  stringer.next = {
    x: stringer.p.x + handle,
    y: stringer.p.y + (slope * handle)
  };
  boundary.prev = {
    x: boundary.p.x - handle,
    y: boundary.p.y - (slope * handle)
  };

  if (edgeStrength >= 0.1) {
    applyKnotEdgeStyle(boundary, "prev", edgeStrength * 0.7);
  } else {
    boundary.continuous = false;
  }
  clampKnotHandleXToNeighbors(knots, 0);
  clampKnotHandleXToNeighbors(knots, boundaryIndex);
}

function explicitChannelGrooveSpecs(feature, board, halfWidth) {
  const grooveHalfWidth = Math.max(
    0.08,
    bottomFeatureReferenceDistanceX(feature, board, clampNumber((Number(feature?.width) || 0) * 0.5, 0.01, 0.5, 0.09), halfWidth)
  );
  const powerT = clamp01((clampNumber(feature?.power, 0.4, 4, 1.4) - 0.4) / 3.6);
  const floorHalfWidth = grooveHalfWidth * lerp(0.16, 0.3, powerT);
  const minGap = Math.max(0.03, floorHalfWidth * 0.7);
  const grooves = [];
  bottomFeatureChannelCenterRatios(feature)
    .map(ratio => bottomFeatureReferenceDistanceX(feature, board, ratio, halfWidth))
    .sort((a, b) => a - b)
    .forEach(centerX => {
      const leftShoulder = clampNumber(centerX - grooveHalfWidth, 0.05, halfWidth - 0.05, centerX - grooveHalfWidth);
      const rightShoulder = clampNumber(centerX + grooveHalfWidth, 0.05, halfWidth - 0.05, centerX + grooveHalfWidth);
      const leftFloor = clampNumber(centerX - floorHalfWidth, leftShoulder + 0.02, rightShoulder - minGap, centerX - floorHalfWidth);
      const rightFloor = clampNumber(centerX + floorHalfWidth, leftFloor + minGap, rightShoulder - 0.02, centerX + floorHalfWidth);
      if (!(rightShoulder - leftShoulder > 0.08) || !(rightFloor - leftFloor > 0.03)) return;
      grooves.push({
        leftShoulder,
        leftFloor,
        center: clampNumber(centerX, leftFloor + 0.01, rightFloor - 0.01, centerX),
        rightFloor,
        rightShoulder
      });
    });
  return grooves;
}

function insertExplicitChannelGrooveKnots(knots, feature, board) {
  let shaped = boardCadCloneKnots(knots || []);
  const halfWidth = Math.max(1e-6, boardCadSplineMaxX(shaped));
  const grooves = explicitChannelGrooveSpecs(feature, board, halfWidth);
  grooves.forEach(groove => {
    [
      groove.leftShoulder,
      groove.leftFloor,
      groove.center,
      groove.rightFloor,
      groove.rightShoulder
    ].forEach(targetX => {
      shaped = insertLowerHalfSplineKnotAtX(shaped, targetX);
    });
  });
  return { knots: shaped, grooves };
}

function shapeExplicitChannelGroove(knots, groove, depth = 0, edgeStrength = 0.9) {
  if (!Array.isArray(knots) || !groove || !(depth > 1e-9)) return;
  const railIndex = findSplineMaxXKnotIndex(knots);
  const leftShoulderIndex = findKnotIndexNearX(knots, groove.leftShoulder, 0.08, railIndex);
  const leftFloorIndex = findKnotIndexNearX(knots, groove.leftFloor, 0.08, railIndex);
  const centerIndex = findKnotIndexNearX(knots, groove.center, 0.08, railIndex);
  const rightFloorIndex = findKnotIndexNearX(knots, groove.rightFloor, 0.08, railIndex);
  const rightShoulderIndex = findKnotIndexNearX(knots, groove.rightShoulder, 0.08, railIndex);
  if ([leftShoulderIndex, leftFloorIndex, centerIndex, rightFloorIndex, rightShoulderIndex].some(index => index < 0)) return;
  const leftShoulder = knots[leftShoulderIndex];
  const leftFloor = knots[leftFloorIndex];
  const center = knots[centerIndex];
  const rightFloor = knots[rightFloorIndex];
  const rightShoulder = knots[rightShoulderIndex];
  if (!leftShoulder?.p || !leftFloor?.p || !center?.p || !rightFloor?.p || !rightShoulder?.p) return;

  shiftKnotVertical(leftFloor, depth * 0.94);
  shiftKnotVertical(center, depth);
  shiftKnotVertical(rightFloor, depth * 0.94);

  const shoulderStrength = clampNumber(edgeStrength, 0, 1, 0.9);
  const shoulderHandleRatio = lerp(0.18, 0.05, shoulderStrength);
  const floorHandleRatio = lerp(0.34, 0.22, shoulderStrength);

  const dxShoulderLeft = Math.max(0.03, leftFloor.p.x - leftShoulder.p.x);
  const dxFloorLeft = Math.max(0.03, center.p.x - leftFloor.p.x);
  const dxFloorRight = Math.max(0.03, rightFloor.p.x - center.p.x);
  const dxShoulderRight = Math.max(0.03, rightShoulder.p.x - rightFloor.p.x);

  leftShoulder.prev = { ...leftShoulder.p };
  leftShoulder.next = {
    x: leftShoulder.p.x + (dxShoulderLeft * shoulderHandleRatio),
    y: leftShoulder.p.y
  };
  leftShoulder.continuous = false;

  leftFloor.prev = {
    x: leftFloor.p.x - (dxShoulderLeft * floorHandleRatio),
    y: leftFloor.p.y
  };
  leftFloor.next = {
    x: leftFloor.p.x + (dxFloorLeft * 0.34),
    y: leftFloor.p.y
  };
  leftFloor.continuous = true;
  enforceKnotContinuous(leftFloor, "prev");

  center.prev = {
    x: center.p.x - (dxFloorLeft * 0.32),
    y: center.p.y
  };
  center.next = {
    x: center.p.x + (dxFloorRight * 0.32),
    y: center.p.y
  };
  center.continuous = true;
  enforceKnotContinuous(center, "prev");

  rightFloor.prev = {
    x: rightFloor.p.x - (dxFloorRight * 0.34),
    y: rightFloor.p.y
  };
  rightFloor.next = {
    x: rightFloor.p.x + (dxShoulderRight * floorHandleRatio),
    y: rightFloor.p.y
  };
  rightFloor.continuous = true;
  enforceKnotContinuous(rightFloor, "prev");

  rightShoulder.prev = {
    x: rightShoulder.p.x - (dxShoulderRight * shoulderHandleRatio),
    y: rightShoulder.p.y
  };
  rightShoulder.next = { ...rightShoulder.p };
  rightShoulder.continuous = false;

  clampKnotHandleXToNeighbors(knots, leftShoulderIndex);
  clampKnotHandleXToNeighbors(knots, leftFloorIndex);
  clampKnotHandleXToNeighbors(knots, centerIndex);
  clampKnotHandleXToNeighbors(knots, rightFloorIndex);
  clampKnotHandleXToNeighbors(knots, rightShoulderIndex);
}

function shapeDisplacementHullRail(knots, anchorIndex, railIndex, strength = 0.08) {
  if (!Array.isArray(knots) || anchorIndex <= 0 || railIndex <= anchorIndex || railIndex >= knots.length) return;
  const anchor = knots[anchorIndex];
  const rail = knots[railIndex];
  if (!anchor?.p || !rail?.p) return;
  const sharpen = clampNumber(strength, 0, BOTTOM_FEATURE_DEPTH_MAX, 0.08) / BOTTOM_FEATURE_DEPTH_MAX;
  const lowerSpan = Math.max(0.05, rail.p.x - anchor.p.x);
  const lowerDrop = rail.p.y - anchor.p.y;
  const maxLift = lowerDrop * lerp(0.24, 0.82, sharpen);
  const anchorLift = maxLift * lerp(0.38, 0.58, sharpen);
  const handleLift = maxLift * lerp(0.68, 0.92, sharpen);
  const liftedAnchorY = Math.min(rail.p.y - 0.02, anchor.p.y + anchorLift);
  const anchorDeltaY = liftedAnchorY - anchor.p.y;
  if (anchorDeltaY <= 1e-9) return;
  shiftKnotVertical(anchor, anchorDeltaY);
  if (anchor.next) {
    anchor.next = {
      x: anchor.next.x,
      y: Math.min(rail.p.y - 0.015, anchor.next.y + Math.max(0, handleLift - anchorLift))
    };
  }
  if (rail.prev) {
    rail.prev = {
      x: rail.prev.x,
      y: Math.min(rail.p.y - 0.01, Math.max(rail.prev.y, anchor.p.y + Math.max(0, handleLift - anchorLift * 0.25)))
    };
  }
  enforceKnotContinuous(anchor, "next");
  enforceKnotContinuous(rail, "prev");
}

function applyExplicitBottomFeatureControlPoints(knots, board, feature, envelope = 1, rawX = null) {
  const type = normalizeBottomFeatureType(feature?.type);
  if (!usesExplicitBottomFeatureControlPoints(type)) return boardCadCloneKnots(knots || []);
  const explicit = type === "channel"
    ? insertExplicitChannelGrooveKnots(knots, feature, board).knots
    : insertBottomFeatureAnchorKnots(knots, board, feature);
  if (explicit.length < 3) return explicit;
  const railIndex = findSplineMaxXKnotIndex(explicit);
  if (railIndex <= 0) return explicit;
  const halfWidth = Math.max(1e-6, boardCadSplineMaxX(explicit));
  const clampedEnvelope = clamp01(envelope);
  if (type === "channel") {
    const { knots: shaped, grooves } = insertExplicitChannelGrooveKnots(knots, feature, board);
    grooves.forEach(groove => {
      shapeExplicitChannelGroove(
        shaped,
        groove,
        Math.max(0, Number(feature?.railDepth) || 0) * clampedEnvelope,
        clampNumber(feature?.edge, 0, 1, 0.9)
      );
    });
    return shaped;
  }
  const offsetRatio = clampNumber(feature?.offset, 0.15, 0.8, 0.42);
  const anchorX = bottomFeatureWidthAnchorX(feature, halfWidth, board);
  const anchorIndex = findKnotIndexNearX(explicit, anchorX, 0.1, railIndex - 1);
  if (anchorIndex < 0) return explicit;
  const boardLength = Math.max(1e-6, Number(board?.length) || 0);
  const rawPos = clampNumber(Number.isFinite(rawX) ? rawX : (Number(feature?.peak) || 0), 0, boardLength, 0);
  const edgeStrength = clampNumber(feature?.edge, 0, 1, 0);
  if (type === "double-concave") {
    const troughX = clampNumber(
      bottomFeatureReferenceDistanceX(feature, board, offsetRatio, halfWidth),
      0.1,
      Math.max(0.1, anchorX - 0.1),
      Math.min(halfWidth * 0.8, anchorX - 0.1)
    );
    const troughIndex = findKnotIndexNearX(explicit, troughX, 0.1, anchorIndex - 1);
    if (troughIndex < 0) return explicit;
    const simplified = simplifyExplicitDoubleConcaveKnots(explicit, troughIndex, anchorIndex, railIndex);
    shiftKnotVertical(simplified.knots[0], feature.centerDepth * clampedEnvelope);
    shiftKnotVertical(simplified.knots[simplified.troughIndex], feature.railDepth * clampedEnvelope * DOUBLE_CONCAVE_TROUGH_GAIN);
    shapeExplicitDoubleConcaveSegment(simplified.knots, simplified.troughIndex, simplified.anchorIndex, edgeStrength * clampedEnvelope);
    return simplified.knots;
  } else if (type === "vee" || type === "spiral-vee") {
    const boundaryIndex = findKnotIndexNearX(explicit, anchorX, 0.1, railIndex);
    if (boundaryIndex < 0) return explicit;
    const simplified = simplifyExplicitVeeKnots(explicit, boundaryIndex, railIndex);
    shiftKnotVertical(simplified.knots[simplified.boundaryIndex], feature.depth * clampedEnvelope);
    shapeExplicitProtectedVeeSegment(simplified.knots, simplified.boundaryIndex, edgeStrength * clampedEnvelope);
    return simplified.knots;
  } else if (type === "hull" || type === "displacement-hull") {
    if (type === "hull") {
      shiftKnotVertical(explicit[0], -feature.depth * clampedEnvelope * bottomFeatureHullConvexGain(feature));
      shapeExplicitConcaveSegment(explicit, anchorIndex, 0);
    } else {
      const featureStart = clampNumber(Number(feature?.start) || 0, 0, boardLength, 0);
      const featurePeak = clampNumber(Math.max(featureStart, Number(feature?.peak) || featureStart), featureStart, boardLength, featureStart);
      const bellyStart = lerp(featureStart, featurePeak, 0.55);
      const bellyEnvelope = rawPos <= bellyStart
        ? 0
        : bottomFeatureBlendRamp01((rawPos - bellyStart) / Math.max(1e-9, featurePeak - bellyStart), feature.blend);
      if (bellyEnvelope > 1e-6) {
        shiftKnotVertical(explicit[0], -feature.depth * Math.min(clampedEnvelope, bellyEnvelope) * bottomFeatureHullConvexGain(feature));
        shapeExplicitConcaveSegment(explicit, anchorIndex, 0);
      }
      const tailLimit = boardLength * 0.5;
      const tailRailEnvelope = rawPos >= tailLimit
        ? 0
        : bottomFeatureBlendRamp01((tailLimit - rawPos) / Math.max(1e-9, tailLimit), feature.blend);
      if (tailRailEnvelope > 1e-6) {
        shapeDisplacementHullRail(explicit, anchorIndex, railIndex, feature.railDepth * tailRailEnvelope);
      }
    }
  }
  return explicit;
}

function preferredStoredSectionControlCount(board, position, fallback = 5) {
  if (!board || !Array.isArray(board.sections)) return fallback;
  let bestDistance = Infinity;
  let bestCount = fallback;
  board.sections.forEach(section => {
    const spline = Array.isArray(section?.spline) ? section.spline : [];
    if (!spline.length || isPointOnlySpline(spline)) return;
    const count = spline.length;
    if (!Number.isFinite(count) || count < 3 || count > 12) return;
    const pos = Number(section.position);
    if (!Number.isFinite(pos)) return;
    const distance = Math.abs(pos - position);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCount = count;
    }
  });
  return bestCount;
}

function rebuildExplicitBottomFeatureSections(board, feature, options = {}) {
  if (!board || !feature || !Array.isArray(board.sections)) return false;
  const type = normalizeBottomFeatureType(feature?.type);
  if (!usesExplicitBottomFeatureControlPoints(type)) return false;
  const tolerance = Math.max(0.001, Number(options.tolerance) || 0.25);
  const start = Number(feature.start) || 0;
  const end = Math.max(start, Number(feature.end) || start);
  let changed = false;
  board.sections.forEach(section => {
    const pos = Number(section?.position);
    if (!Number.isFinite(pos)) return;
    if (pos < start - tolerance || pos > end + tolerance) return;
    const anchored = insertBottomFeatureAnchorKnots(section.spline, board, feature);
    if (!anchored.length) return;
    stashSectionBottomFeatureBaseSpline(section);
    section.spline = anchored;
    changed = true;
  });
  return changed;
}

function rebuildBoardBottomFeatureSections(board) {
  if (!board || !Array.isArray(board.sections)) return false;
  dedupeCrossSectionsByPosition(board);
  clearCrossSectionCachesForBoard(board);
  const features = normalizeBottomFeatures(board.bottomFeatures);
  if (!features.length) {
    if (restoreBoardBottomFeatureBaseSections(board, true)) return true;
    restoreBoardBottomFeatureBaseSplines(board, true);
    return true;
  }
  stashBoardBottomFeatureBaseSections(board);
  restoreBoardBottomFeatureBaseSections(board, false);
  clearCrossSectionCachesForBoard(board);
  features.forEach(feature => {
    clearCrossSectionCachesForBoard(board);
    ensureCrossSectionsForBottomFeature(board, feature);
  });
  clearCrossSectionCachesForBoard(board);
  return true;
}

function ensureCrossSectionsForBottomFeature(board, feature, options = {}) {
  const tolerance = Math.max(0.001, Number(options.tolerance) || 0.25);
  const positions = bottomFeatureSectionPositions(board, feature, options);
  const added = ensureCrossSectionsAtPositions(board, positions, {
    tolerance,
    preferControlPoints: true,
    generatedByBottomFeature: true
  });
  ensureBottomFeatureAnchorsOnSections(board, feature, { tolerance });
  rebuildExplicitBottomFeatureSections(board, feature, { tolerance });
  return added;
}

function fillCrossSectionsFromPanel() {
  if (!state.board) return;
  const interval = panelCrossSectionInterval();
  if (interval === null) return;
  const before = cloneBoard(state.board);
  const added = fillCrossSectionsByInterval(state.board, interval);
  if (!added.length) {
    setStatus("status_cross_section_panel_invalid");
    return;
  }
  const lastAdded = added[added.length - 1];
  const addedIndex = findCrossSectionIndexNear(state.board, lastAdded, 0.25);
  if (addedIndex >= 0) state.currentSectionIndex = addedIndex;
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  commitBoardMutation(before, { recomputeMetrics: false });
  setStatus("status_cross_section_added");
}

function findCrossSectionIndexNear(board, pos, tolerance = 0.25) {
  if (!board || !Array.isArray(board.sections)) return -1;
  return board.sections.findIndex(section => Math.abs((Number(section.position) || 0) - pos) <= tolerance);
}

function ensureCrossSectionsAtPositions(board, positions, options = {}) {
  if (!board || !Array.isArray(board.sections)) return [];
  const tolerance = Math.max(0.001, Number(options.tolerance) || 0.25);
  const added = [];
  const railBaseBoard = boardForRailBaseInterpolation(board);
  positions.forEach(rawPos => {
    const pos = clampNumber(rawPos, 0, board.length || rawPos || 0, rawPos);
    if (!Number.isFinite(pos) || pos <= tolerance || pos >= ((board.length || 0) - tolerance)) return;
    if (findCrossSectionIndexNear(board, pos, tolerance) >= 0) return;
    const preferControlPoints = options.preferControlPoints === true
      || (options.preferControlPoints !== false && boardCadCanPreferControlPointSectionInterpolation(board, pos));
    const spline = boardCadInterpolatedCrossSectionBaseKnots(railBaseBoard, pos, { preferControlPoints });
    if (!spline.length) return;
    const targetCount = preferredStoredSectionControlCount(board, pos, 5);
    const normalizedSpline = boardCadNormalizeSectionKnotsForStorage(spline, targetCount);
    const generatedByBottomFeature = options.generatedByBottomFeature === true;
    const section = {
      position: pos,
      spline: normalizedSpline,
      guidePoints: [],
      generatedByBottomFeature
    };
    applyBoardRailAndEdgeToSection(board, section);
    board.sections.push(section);
    syncBottomFeatureBaseSection(board, pos, normalizedSpline, [], { generatedByBottomFeature });
    added.push(pos);
  });
  if (added.length) sortCrossSections(board);
  return added;
}

function ensureCrossSectionsForBottomFeatures(board, features, options = {}) {
  const all = [];
  normalizeBottomFeatures(features).forEach(feature => {
    all.push(...ensureCrossSectionsForBottomFeature(board, feature, options));
  });
  return all;
}

function addCrossSectionAt(pos, options = {}) {
  if (!state.board) return;
  const existingIndex = findCrossSectionIndexNear(state.board, pos, 0.01);
  if (existingIndex >= 0) {
    state.currentSectionIndex = existingIndex;
    state.selection = null;
    clearGuidePointSelection();
    state.lastEditPoint = null;
    if (options.redraw !== false) draw();
    updateInfo();
    updateHistoryButtons();
    return;
  }
  const preferControlPoints = options.preferControlPoints === true
    || (options.preferControlPoints !== false && boardCadCanPreferControlPointSectionInterpolation(state.board, pos));
  const railBaseBoard = boardForRailBaseInterpolation(state.board);
  const spline = boardCadInterpolatedCrossSectionBaseKnots(railBaseBoard, pos, { preferControlPoints });
  if (!spline.length) {
    setStatus("status_cross_section_interpolate_failed");
    return;
  }
  const before = cloneBoard(state.board);
  const targetCount = preferredStoredSectionControlCount(state.board, pos, 5);
  const normalizedSpline = boardCadNormalizeSectionKnotsForStorage(spline, targetCount);
  const section = { position: pos, spline: normalizedSpline, guidePoints: [], generatedByBottomFeature: false };
  applyBoardRailAndEdgeToSection(state.board, section);
  state.board.sections.push(section);
  syncBottomFeatureBaseSection(state.board, pos, normalizedSpline, []);
  sortCrossSections(state.board);
  state.currentSectionIndex = state.board.sections.indexOf(section);
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  commitBoardMutation(before, { recomputeMetrics: false, redraw: options.redraw !== false });
  setStatus("status_cross_section_added");
}

function sampleSplineKnotAtX(knots, x, tolerance = 0.05) {
  const source = Array.isArray(knots) ? knots : [];
  if (!source.length) return null;
  if (Math.abs((Number(source[0]?.p?.x) || 0) - x) <= tolerance) return cloneKnot(source[0]);
  if (Math.abs((Number(source[source.length - 1]?.p?.x) || 0) - x) <= tolerance) return cloneKnot(source[source.length - 1]);
  const curves = boardCadCurves(source);
  const index = boardCadFindMatchingBezierSegment(curves, x);
  if (index < 0) return null;
  const t = boardCadCurveTForX(curves[index], x);
  const split = boardCadSplitCurveKnot(curves[index], t);
  return {
    ...cloneKnot(split.knot),
    continuous: true
  };
}

function normalizeSplineKnotXs(source, targetCount = 5) {
  const flattened = isPointOnlySpline(source)
    ? source.map(knot => ({ x: knot.p.x, y: knot.p.y }))
    : flattenSpline(source, Math.max(getSegments(), 24));
  const points = removeNearDuplicatePoints(flattened);
  if (points.length <= targetCount) return points.map(point => point.x);
  const sampled = [];
  let previousIndex = -1;
  for (let i = 0; i < targetCount; i++) {
    const remaining = (targetCount - 1) - i;
    const rawIndex = Math.round(((points.length - 1) * i) / Math.max(1, targetCount - 1));
    const minIndex = Math.max(previousIndex + 1, 0);
    const maxIndex = Math.max(minIndex, (points.length - 1) - remaining);
    const index = Math.max(minIndex, Math.min(maxIndex, rawIndex));
    sampled.push(points[index].x);
    previousIndex = index;
  }
  return sampled;
}

function boardCadNormalizeSectionKnotsForStorage(knots, targetCount = 5) {
  const source = Array.isArray(knots) ? knots : [];
  if (!source.length) return [];
  const sourceThickness = Math.max(0.001, boardCadCrossSectionCenterThickness(source));
  const sourceWidth = Math.max(0.001, boardCadCrossSectionWidth(source));
  if (!isPointOnlySpline(source) && source.length <= targetCount) return boardCadCloneKnots(source);
  const sampledXs = normalizeSplineKnotXs(source, targetCount);
  let normalized = sampledXs
    .map(x => sampleSplineKnotAtX(source, x))
    .filter(knot => !!knot);
  if (normalized.length < 2) {
    const fallbackPoints = normalizeSplineKnotXs(source, targetCount).map(x => ({
      x,
      y: boardCadSplineValueAt(source, x)
    }));
    normalized = splineFromFreePoints(fallbackPoints);
  }
  return boardCadCrossSectionScaleTo(normalized, sourceThickness, sourceWidth);
}

function moveCurrentCrossSectionTo(pos) {
  if (!state.board || !canMoveCrossSection()) return;
  const section = currentCrossSection();
  const before = cloneBoard(state.board);
  section.position = pos;
  sortCrossSections(state.board);
  state.currentSectionIndex = state.board.sections.indexOf(section);
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  commitBoardMutation(before, { recomputeMetrics: false });
  setStatus("status_cross_section_moved");
}

function removeCurrentCrossSection() {
  if (!state.board || !canRemoveCrossSection()) return;
  const before = cloneBoard(state.board);
  const index = state.currentSectionIndex;
  state.board.sections.splice(index, 1);
  state.currentSectionIndex = normalizeSectionIndex(state.board, Math.min(index, lastEditableSectionIndex(state.board)));
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  commitBoardMutation(before, { recomputeMetrics: false });
  setStatus("status_cross_section_removed");
}

function copyCurrentCrossSection() {
  const section = currentCrossSection();
  if (!section) return;
  state.copiedCrossSection = cloneCrossSection(section);
  setStatus("status_cross_section_copied");
  updateHistoryButtons();
}

function pasteCurrentCrossSection() {
  const section = currentCrossSection();
  if (!state.board || !section || !state.copiedCrossSection) return;
  const before = cloneBoard(state.board);
  section.spline = boardCadCrossSectionScaleTo(
    boardCadCloneKnots(state.copiedCrossSection.spline),
    boardCadThicknessAtPos(state.board, section.position),
    boardCadWidthAtPos(state.board, section.position)
  );
  if (normalizeRailModeKey(state.board.railMode) || normalizedEdgeConfig(state.board).active) {
    if (Array.isArray(state.copiedCrossSection.railBaseSpline)) {
      section.railBaseSpline = boardCadCrossSectionScaleTo(
        boardCadCloneKnots(state.copiedCrossSection.railBaseSpline),
        boardCadThicknessAtPos(state.board, section.position),
        boardCadWidthAtPos(state.board, section.position)
      );
    } else {
      stashSectionRailBaseSpline(section);
    }
    applyBoardRailAndEdgeToSection(state.board, section);
  } else {
    delete section.railBaseSpline;
  }
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  commitBoardMutation(before, { recomputeMetrics: false });
  setStatus("status_cross_section_pasted");
}

function importCrossSectionText(text, filename = "") {
  const section = currentCrossSection();
  if (!state.board || !section) {
    setStatus("status_cross_section_import_requires_board");
    return;
  }
  const parsed = parseCrossSectionText(text, section.position);
  if (!parsed.spline.length) {
    setStatus("status_cross_section_import_failed", { filename: filename || ".crs" });
    return;
  }
  const before = cloneBoard(state.board);
  const targetThickness = boardCadThicknessAtPos(state.board, section.position);
  const targetWidth = boardCadWidthAtPos(state.board, section.position);
  section.spline = boardCadCrossSectionScaleTo(boardCadCloneKnots(parsed.spline), targetThickness, targetWidth);
  section.guidePoints = boardCadCrossSectionScaleGuidePoints(parsed.guidePoints, parsed.spline, targetThickness, targetWidth);
  if (normalizeRailModeKey(state.board.railMode) || normalizedEdgeConfig(state.board).active) {
    stashSectionRailBaseSpline(section);
    applyBoardRailAndEdgeToSection(state.board, section);
  } else {
    delete section.railBaseSpline;
  }
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  commitBoardMutation(before, { recomputeMetrics: false });
  setStatus("status_cross_section_imported", { filename: filename || ".crs" });
}

function exportCurrentCrossSection() {
  const section = currentCrossSection();
  if (!state.board || !section) return;
  const pos = fmt(section.position).replace(".", "_");
  downloadBlob(
    `${safeName(state.board.name)}-cross-section-${pos}.crs`,
    serializeCrossSection(section),
    "text/plain"
  );
  setStatus("status_cross_section_exported");
}

function importOutlineText(text, filename = ".otl") {
  const parsed = parseSplineBlockById(text, 32);
  if (!parsed.knots.length) {
    setStatus("status_outline_import_failed", { filename });
    return;
  }
  if (!state.board) {
    const board = parseBrd(text, filename);
    state.board = board;
    loadBoard(makeBrd(board), filename.replace(/\.otl$/i, ".brd"));
    return;
  }
  const before = cloneBoard(state.board);
  state.board.outline = boardCadCloneKnots(parsed.knots);
  state.board.outlineGuidePoints = clonePoints(parsed.guidePoints);
  applyBoardCadDerivedMetrics(state.board);
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  commitBoardMutation(before);
  setStatus("status_outline_imported", { filename });
}

function importProfileText(text, filename = ".pfl") {
  const bottom = parseSplineBlockById(text, 33);
  const deck = parseSplineBlockById(text, 34);
  if (!bottom.knots.length && !deck.knots.length) {
    setStatus("status_profile_import_failed", { filename });
    return;
  }
  if (!state.board) {
    setStatus("status_profile_import_requires_board");
    return;
  }
  const before = cloneBoard(state.board);
  if (bottom.knots.length) {
    state.board.bottom = boardCadCloneKnots(bottom.knots);
    state.board.bottomGuidePoints = clonePoints(bottom.guidePoints);
  }
  if (deck.knots.length) {
    state.board.deck = boardCadCloneKnots(deck.knots);
    state.board.deckGuidePoints = clonePoints(deck.guidePoints);
  }
  fixProfileEndpointJunctions(state.board);
  applyBoardCadDerivedMetrics(state.board);
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  commitBoardMutation(before);
  setStatus("status_profile_imported", { filename });
}

function serializeCrossSection(section) {
  return `(p36 ${serializeNumber(section.position)}\n${serializeSplineKnots(section.spline)}${serializeGuidePoints(section.guidePoints)})\n`;
}

function serializeSplineKnots(knots = []) {
  return knots.map(knot => {
    const values = [knot.p.x, knot.p.y, knot.prev.x, knot.prev.y, knot.next.x, knot.next.y].map(serializeNumber).join(",");
    return `(cp [${values}] ${Boolean(knot.continuous)} ${Boolean(knot.other)})\n`;
  }).join("");
}

function serializeGuidePoints(points = []) {
  if (!points.length) return "";
  const body = points
    .map(point => `(gp [${serializeNumber(point.x)},${serializeNumber(point.y)}])\n`)
    .join("");
  return `gps : (\n${body})\n`;
}

function serializeNumber(value) {
  return Number.isFinite(value) ? String(Number(value)) : "0";
}

function promptScaleBoard() {
  if (!state.board) return;
  const board = state.board;
  showFormDialog(t("dialog_scale_board_title"), [
    {
      name: "length",
      label: t("prompt_scale_board_length"),
      type: "number",
      step: 0.001,
      min: 0.001,
      value: fmt(board.length)
    },
    {
      name: "width",
      label: t("prompt_scale_board_width"),
      type: "number",
      step: 0.001,
      min: 0.001,
      value: fmt(boardCadMaxWidth(board))
    },
    {
      name: "thickness",
      label: t("prompt_scale_board_thickness"),
      type: "number",
      step: 0.001,
      min: 0.001,
      value: fmt(boardCadMaxThickness(board))
    },
    {
      name: "scaleBottomRocker",
      label: t("scale_bottom_rocker_option"),
      type: "checkbox",
      checked: false
    },
    {
      name: "scaleFins",
      label: t("scale_fins_option"),
      type: "checkbox",
      checked: false
    }
  ], {
    submitLabel: t("scale_current_board"),
    onSubmit: values => {
      const length = Number(values.length);
      const width = Number(values.width);
      const thickness = Number(values.thickness);
      if (![length, width, thickness].every(Number.isFinite) || length <= 0 || width <= 0 || thickness <= 0) {
        setStatus("status_scale_positive_required");
        return false;
      }
      scaleBoardTo(length, width, thickness, {
        scaleBottomRocker: values.scaleBottomRocker === "true",
        scaleFins: values.scaleFins === "true"
      });
      return true;
    }
  });
}

function scaleGhostToCurrentBoard() {
  if (!state.board || !state.ghost.board) {
    setStatus("status_scale_ghost_requires_both");
    return;
  }
  scaleBoardGeometry(
    state.ghost.board,
    state.board.length,
    Number(state.board.width) || boardCadMaxWidth(state.board),
    Number(state.board.thickness) || boardCadMaxThickness(state.board),
    { scaleBottomRocker: false, scaleFins: false }
  );
  draw();
  updateInfo();
  updateHistoryButtons();
  setStatus("status_scale_ghost_done");
}

function scaleBoardTo(newLength, newWidth, newThickness, options = {}) {
  if (!state.board) return;
  const before = cloneBoard(state.board);
  scaleBoardGeometry(state.board, newLength, newWidth, newThickness, options);

  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  commitBoardMutation(before);
  const mode = options.scaleBottomRocker ? t("mode_scale_accordingly") : t("mode_regular_scale");
  const fins = options.scaleFins ? t("mode_fins_scaled_suffix") : "";
  setStatus("status_scale_board_done", {
    length: fmt(newLength),
    width: fmt(newWidth),
    thickness: fmt(newThickness),
    mode,
    fins
  });
}

function scaleBoardGeometry(board, newLength, newWidth, newThickness, options = {}) {
  if (!board) return false;
  const oldLength = Math.max(BOARD_CAD_BEZIER.ZERO, board.length);
  const oldWidth = Math.max(BOARD_CAD_BEZIER.ZERO, boardCadMaxWidth(board));
  const oldThickness = Math.max(BOARD_CAD_BEZIER.ZERO, boardCadMaxThickness(board));
  const lengthScale = newLength / oldLength;
  const widthScale = newWidth / oldWidth;
  const thicknessScale = newThickness / oldThickness;
  if (![lengthScale, widthScale, thicknessScale].every(Number.isFinite)) return false;
  if (options.scaleBottomRocker) {
    applyScaleAccordingly(board, newLength, newWidth, newThickness, oldLength, oldWidth, oldThickness);
  } else {
    applyRegularScale(board, newLength, lengthScale, widthScale, thicknessScale);
  }
  if (options.scaleFins) scaleFins(board, newLength / oldLength, newWidth / oldWidth);
  applyBoardCadDerivedMetrics(board);
  return true;
}

function applyRegularScale(board, newLength, lengthScale, widthScale, thicknessScale) {
  board.outline = board.outline.map(knot => boardCadScaleKnot(knot, lengthScale, widthScale));
  board.deck = board.deck.map(knot => boardCadScaleKnot(knot, lengthScale, thicknessScale));
  board.bottom = board.bottom.map(knot => boardCadScaleKnot(knot, lengthScale, thicknessScale));
  if (Number(board.tailLength)) board.tailLength *= lengthScale;
  if (Number(board.tailDepth)) board.tailDepth *= lengthScale;
  if (Number(board.wingPosition)) board.wingPosition *= lengthScale;
  if (Number(board.wingWidth)) board.wingWidth *= widthScale;

  for (let i = 1; i < board.sections.length - 1; i++) {
    board.sections[i].position *= lengthScale;
  }
  if (board.sections.length) board.sections[board.sections.length - 1].position = newLength;
  adjustCrossSectionsToThicknessAndWidth(board);
}

function applyScaleAccordingly(board, newLength, newWidth, newThickness, oldLength, oldWidth, oldThickness) {
  const lengthScale = newLength / oldLength;
  const widthScale = newWidth / oldWidth;
  const thicknessScale = newThickness / oldThickness;
  const thicknessDiff = newThickness - oldThickness;
  const maxThicknessPos = Math.max(BOARD_CAD_BEZIER.ZERO, boardCadMaxThicknessPos(board));
  const scaledMaxThicknessPos = Math.max(BOARD_CAD_BEZIER.ZERO, maxThicknessPos * lengthScale);
  const deckInteriorThicknesses = board.deck.slice(1, -1).map(knot => {
    const x = Math.max(BOARD_CAD_BEZIER.ZERO, Math.min(oldLength - BOARD_CAD_BEZIER.ZERO, knot.p.x));
    return knot.p.y - boardCadSplineValueAt(board.bottom, x);
  });

  board.outline = board.outline.map(knot => boardCadScaleKnot(knot, lengthScale, widthScale));
  board.deck = board.deck.map(knot => boardCadScaleKnot(knot, lengthScale, 1));
  board.bottom = board.bottom.map(knot => boardCadScaleKnot(knot, lengthScale, lengthScale));
  if (Number(board.tailLength)) board.tailLength *= lengthScale;
  if (Number(board.tailDepth)) board.tailDepth *= lengthScale;
  if (Number(board.wingPosition)) board.wingPosition *= lengthScale;
  if (Number(board.wingWidth)) board.wingWidth *= widthScale;

  const angle = Math.atan2(thicknessDiff, maxThicknessPos);
  for (let i = 1; i < board.deck.length - 1; i++) {
    const knot = board.deck[i];
    const x = Math.max(BOARD_CAD_BEZIER.ZERO, Math.min(newLength - BOARD_CAD_BEZIER.ZERO, knot.p.x));
    const targetThickness = deckInteriorThicknesses[i - 1] * thicknessScale;
    const actualThickness = knot.p.y - boardCadSplineValueAt(board.bottom, x);
    translateKnot(knot, 0, targetThickness - actualThickness);
    const usedAngle = angle * ((scaledMaxThicknessPos - x) / scaledMaxThicknessPos);
    rotateKnotTangent(knot, "next", usedAngle);
    rotateKnotTangent(knot, "prev", usedAngle);
  }

  for (let i = 1; i < board.sections.length - 1; i++) {
    board.sections[i].position *= lengthScale;
  }
  if (board.sections.length) board.sections[board.sections.length - 1].position = newLength;
  adjustCrossSectionsToThicknessAndWidth(board);
}

function boardCadMaxThicknessPos(board) {
  if (!board || !board.length) return 0;
  let max = -Number.MAX_VALUE;
  let maxPos = 0;
  const steps = Math.max(1, Math.floor(board.length * 10));
  for (let i = 0; i <= steps; i++) {
    const pos = Math.min(board.length, i / 10);
    const thickness = boardCadThicknessAtPos(board, pos);
    if (thickness > max) {
      max = thickness;
      maxPos = pos;
    }
  }
  return maxPos;
}

function translateKnot(knot, dx, dy) {
  translatePoint(knot.p, dx, dy);
  translatePoint(knot.prev, dx, dy);
  translatePoint(knot.next, dx, dy);
}

function rotateKnotTangent(knot, key, angle) {
  const tangent = knot[key];
  const sx = tangent.x - knot.p.x;
  const sy = tangent.y - knot.p.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  tangent.x = knot.p.x + cos * sx - sin * sy;
  tangent.y = knot.p.y + sin * sx + cos * sy;
}

function scaleFins(board, straightXRatio, yRatio) {
  if (!board.fins || board.fins.length < 9) return;
  [0, 2, 4, 5].forEach(index => { board.fins[index] *= straightXRatio; });
  [1, 3].forEach(index => { board.fins[index] *= yRatio; });
}

function adjustCrossSectionsToThicknessAndWidth(board) {
  for (let i = 1; i < board.sections.length - 1; i++) {
    const section = board.sections[i];
    section.spline = boardCadCrossSectionScaleTo(
      section.spline,
      boardCadThicknessAtPos(board, section.position),
      boardCadWidthAtPos(board, section.position)
    );
  }
}

function showBoardInfo() {
  if (!state.board) return;
  const board = state.board;
  const volume = boardCadVolume(board);
  const center = boardCadCenterOfMass(board);
  showAppDialog(t("info"), [
    `${t("board_info_name")}: ${board.name || board.filename}`,
    `${t("board_info_file")}: ${board.filename || "-"}`,
    `${t("board_info_length")}: ${fmt(board.length)}`,
    `${t("board_info_max_width")}: ${fmt(boardCadMaxWidth(board))}`,
    `${t("board_info_center_width")}: ${fmt(boardCadWidthAtPos(board, board.length / 2))}`,
    `${t("board_info_max_thickness")}: ${fmt(boardCadMaxThickness(board))}`,
    `${t("board_info_center_thickness")}: ${fmt(boardCadThicknessAtPos(board, board.length / 2))}`,
    `${t("board_info_volume")}: ${fmt(volume)}`,
    `${t("board_info_center_of_mass")}: ${fmt(center)}`,
    `${t("board_info_outline_cp")}: ${board.outline.length}`,
    `${t("board_info_bottom_cp")}: ${board.bottom.length}`,
    `${t("board_info_deck_cp")}: ${board.deck.length}`,
    `${t("board_info_cross_sections")}: ${board.sections.length}`
  ]);
}

function flipBoardView() {
  if (!state.board) return;
  state.flipped = !state.flipped;
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  setStatus(state.flipped ? "status_flip_on" : "status_flip_off");
  updateEditInfo();
  draw();
}

function promptSettings() {
  const bridge = state.model3d?.bridge;
  const bridgeSettings = bridge?.settings || {};
  showFormDialog(t("dialog_settings_title"), [
    {
      name: "segments",
      label: t("curve_segments_setting"),
      type: "number",
      step: 1,
      min: 4,
      max: 80,
      value: String(Math.max(4, Math.min(80, Math.round(getSegments()))))
    },
    {
      name: "modelSegments",
      label: t("model_length_segments_setting"),
      type: "number",
      step: 1,
      min: 6,
      max: 80,
      value: String(Math.max(6, Math.min(80, Math.round(state.model3d.segmentCount || 14))))
    },
    {
      name: "modelPoints",
      label: t("model_width_points_setting"),
      type: "number",
      step: 1,
      min: 3,
      max: 40,
      value: String(Math.max(3, Math.min(40, Math.round(state.model3d.pointCount || 6))))
    },
    {
      name: "bridgeEnabled",
      label: t("bridge_enabled_setting"),
      type: "checkbox",
      checked: !!bridge?.enabled
    },
    {
      name: "bridgePreset",
      label: t("bridge_preset_setting"),
      type: "select",
      value: String(bridgeSettings.preset || "generic"),
      options: [
        { value: "generic", label: t("bridge_preset_generic") },
        { value: "blender", label: t("bridge_preset_blender") },
        { value: "fusion", label: t("bridge_preset_fusion") }
      ]
    },
    {
      name: "bridgeDeadzone",
      label: t("bridge_deadzone_setting"),
      type: "number",
      step: 0.01,
      min: 0,
      max: 0.4,
      value: String(Number(bridgeSettings.deadzone ?? 0.08).toFixed(2))
    },
    {
      name: "bridgeRotationSpeed",
      label: t("bridge_rotation_speed_setting"),
      type: "number",
      step: 0.1,
      min: 0.1,
      max: 8,
      value: String(Number(bridgeSettings.rotationSpeed ?? 1.9).toFixed(1))
    },
    {
      name: "bridgePanSpeed",
      label: t("bridge_pan_speed_setting"),
      type: "number",
      step: 10,
      min: 10,
      max: 1200,
      value: String(Math.round(Number(bridgeSettings.panSpeed ?? 220)))
    },
    {
      name: "bridgeZoomSpeed",
      label: t("bridge_zoom_speed_setting"),
      type: "number",
      step: 0.05,
      min: 0.05,
      max: 4,
      value: String(Number(bridgeSettings.zoomSpeed ?? 0.9).toFixed(2))
    },
    {
      name: "bridgeDominantAxis",
      label: t("bridge_dominant_axis_setting"),
      type: "checkbox",
      checked: !!bridgeSettings.dominantAxis
    },
    {
      name: "bridgeInvertPitch",
      label: t("bridge_invert_pitch_setting"),
      type: "checkbox",
      checked: !!bridgeSettings.invertPitch
    },
    {
      name: "bridgeInvertPanY",
      label: t("bridge_invert_pan_y_setting"),
      type: "checkbox",
      checked: !!bridgeSettings.invertPanY
    },
    {
      name: "bridgeInvertZoom",
      label: t("bridge_invert_zoom_setting"),
      type: "checkbox",
      checked: !!bridgeSettings.invertZoom
    },
    {
      name: "bridgeButton1Action",
      label: t("bridge_button1_setting"),
      type: "select",
      value: String(bridgeSettings.buttonMap?.["1"] || "fit"),
      options: bridgeButtonActionChoices()
    },
    {
      name: "bridgeButton2Action",
      label: t("bridge_button2_setting"),
      type: "select",
      value: String(bridgeSettings.buttonMap?.["2"] || "view-iso"),
      options: bridgeButtonActionChoices()
    },
    {
      name: "bridgeButton3Action",
      label: t("bridge_button3_setting"),
      type: "select",
      value: String(bridgeSettings.buttonMap?.["3"] || "render-cycle"),
      options: bridgeButtonActionChoices()
    },
    {
      name: "bridgeButton4Action",
      label: t("bridge_button4_setting"),
      type: "select",
      value: String(bridgeSettings.buttonMap?.["4"] || "view-top"),
      options: bridgeButtonActionChoices()
    }
  ], {
    submitLabel: t("apply_settings"),
    onSubmit: values => {
      const segments = Number(values.segments);
      const modelSegments = Number(values.modelSegments);
      const modelPoints = Number(values.modelPoints);
      const bridgeDeadzone = Number(values.bridgeDeadzone);
      const bridgeRotationSpeed = Number(values.bridgeRotationSpeed);
      const bridgePanSpeed = Number(values.bridgePanSpeed);
      const bridgeZoomSpeed = Number(values.bridgeZoomSpeed);
      if (![segments, modelSegments, modelPoints, bridgeDeadzone, bridgeRotationSpeed, bridgePanSpeed, bridgeZoomSpeed].every(Number.isFinite)) return false;
      if (els.segments) els.segments.value = String(Math.max(4, Math.min(80, Math.round(segments))));
      state.model3d.segmentCount = Math.max(6, Math.min(80, Math.round(modelSegments)));
      state.model3d.pointCount = Math.max(3, Math.min(40, Math.round(modelPoints)));
      apply3DMouseBridgeSettingsFromValues({
        bridgeEnabled: values.bridgeEnabled,
        bridgePreset: values.bridgePreset,
        bridgeDeadzone,
        bridgeRotationSpeed,
        bridgePanSpeed,
        bridgeZoomSpeed,
        bridgeDominantAxis: values.bridgeDominantAxis,
        bridgeInvertPitch: values.bridgeInvertPitch,
        bridgeInvertPanY: values.bridgeInvertPanY,
        bridgeInvertZoom: values.bridgeInvertZoom,
        bridgeButton1Action: values.bridgeButton1Action,
        bridgeButton2Action: values.bridgeButton2Action,
        bridgeButton3Action: values.bridgeButton3Action,
        bridgeButton4Action: values.bridgeButton4Action
      });
      setStatus("status_settings_updated");
      refreshAfterMiscChange();
      return true;
    }
  });
}

function syncSettingsControls() {
  if (els.miscCurveSegments) els.miscCurveSegments.value = String(Math.max(4, Math.min(80, Math.round(getSegments()))));
  if (els.miscModelLengthSegments) els.miscModelLengthSegments.value = String(Math.max(6, Math.min(80, Math.round(state.model3d.segmentCount || 14))));
  if (els.miscModelWidthPoints) els.miscModelWidthPoints.value = String(Math.max(3, Math.min(40, Math.round(state.model3d.pointCount || 6))));
  sync3DMouseBridgeSettingsControls();
}

function applySettingsFromMenu() {
  const segments = Math.max(4, Math.min(80, Math.round(Number(els.miscCurveSegments?.value) || getSegments())));
  const modelSegments = Math.max(6, Math.min(80, Math.round(Number(els.miscModelLengthSegments?.value) || state.model3d.segmentCount || 14)));
  const modelPoints = Math.max(3, Math.min(40, Math.round(Number(els.miscModelWidthPoints?.value) || state.model3d.pointCount || 6)));
  if (els.segments) els.segments.value = String(segments);
  if (els.miscCurveSegments) els.miscCurveSegments.value = String(segments);
  if (els.miscModelLengthSegments) els.miscModelLengthSegments.value = String(modelSegments);
  if (els.miscModelWidthPoints) els.miscModelWidthPoints.value = String(modelPoints);
  state.model3d.segmentCount = modelSegments;
  state.model3d.pointCount = modelPoints;
  apply3DMouseBridgeSettingsFromValues({
    bridgeEnabled: !!els.miscBridgeEnabled?.checked,
    bridgePreset: els.miscBridgePreset?.value || "generic",
    bridgeDeadzone: Number(els.miscBridgeDeadzone?.value),
    bridgeRotationSpeed: Number(els.miscBridgeRotationSpeed?.value),
    bridgePanSpeed: Number(els.miscBridgePanSpeed?.value),
    bridgeZoomSpeed: Number(els.miscBridgeZoomSpeed?.value),
    bridgeDominantAxis: !!els.miscBridgeDominantAxis?.checked,
    bridgeInvertPitch: !!els.miscBridgeInvertPitch?.checked,
    bridgeInvertPanY: !!els.miscBridgeInvertPanY?.checked,
    bridgeInvertZoom: !!els.miscBridgeInvertZoom?.checked,
    bridgeButton1Action: els.miscBridgeButton1Action?.value || "fit",
    bridgeButton2Action: els.miscBridgeButton2Action?.value || "view-iso",
    bridgeButton3Action: els.miscBridgeButton3Action?.value || "render-cycle",
    bridgeButton4Action: els.miscBridgeButton4Action?.value || "view-top"
  });
  setStatus("status_settings_updated");
  refreshAfterMiscChange();
}

function promptLanguage() {
  showFormDialog(t("dialog_language_title"), [
    {
      name: "language",
      label: t("language"),
      type: "select",
      value: state.language,
      options: [
        { value: "ja", label: t("language_japanese") },
        { value: "en", label: t("language_english") }
      ]
    }
  ], {
    submitLabel: t("apply_settings"),
    onSubmit: values => setLanguage(String(values.language || "").trim().toLowerCase())
  });
}

function setLanguage(lang) {
  if (!["en", "ja"].includes(lang)) {
    setStatus("status_language_invalid");
    return false;
  }
  state.language = lang;
  applyLanguageToStaticUI();
  setStatus(lang === "ja" ? "status_language_ja" : "status_language_en");
  refreshAfterMiscChange();
  return true;
}

function showHelp() {
  showAppDialog(t("help_title"), [
    t("help_edit"),
    t("help_zoom"),
    t("help_pan"),
    t("help_fit"),
    t("help_spot"),
    t("help_context"),
    t("help_keys")
  ]);
  setStatus("status_help_shown");
}

function showAbout() {
  showAppDialog(t("about_boardcad"), String(t("about_text")).split("\n"));
  setStatus("status_about");
}

function showAppDialog(title, lines, options = {}) {
  if (!els.appDialog || !els.appDialogTitle || !els.appDialogBody) return;
  lockDialogScroll();
  state.dialog.mode = "message";
  state.dialog.onSubmit = null;
  state.dialog.keepOpenOnSuccess = false;
  state.dialog.pendingDraw = false;
  els.appDialogTitle.textContent = title || "";
  els.appDialogBody.innerHTML = "";
  const items = Array.isArray(lines) ? lines : [String(lines ?? "")];
  items.filter(Boolean).forEach((line, index) => {
    const div = document.createElement("div");
    div.className = `app-dialog-line${options.mutedFirst && index === 0 ? " muted" : ""}`;
    div.textContent = String(line);
    els.appDialogBody.appendChild(div);
  });
  els.appDialog.hidden = false;
  els.appDialog.setAttribute("aria-hidden", "false");
  document.body.classList.add("dialog-open");
  focusWithoutScroll(els.appDialogCloseButton);
}

function showFormDialog(title, fields, options = {}) {
  if (!els.appDialog || !els.appDialogTitle || !els.appDialogBody) return;
  lockDialogScroll();
  state.dialog.mode = "form";
  state.dialog.onSubmit = typeof options.onSubmit === "function" ? options.onSubmit : null;
  state.dialog.keepOpenOnSuccess = !!options.keepOpenOnSuccess;
  els.appDialogTitle.textContent = title || "";
  els.appDialogBody.innerHTML = "";

  const form = document.createElement("form");
  form.className = "app-dialog-form";

  fields.forEach(field => {
    const label = document.createElement("label");
    const caption = document.createElement("span");
    caption.textContent = field.label || "";
    label.appendChild(caption);
    const input = document.createElement(field.type === "select" ? "select" : "input");
    input.name = field.name;
    if (field.type && field.type !== "select") input.type = field.type;
    if (field.type === "checkbox") input.value = "true";
    if (field.step != null) input.step = String(field.step);
    if (field.min != null) input.min = String(field.min);
    if (field.max != null) input.max = String(field.max);
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.value != null) input.value = String(field.value);
    if (field.type === "checkbox") input.checked = !!field.checked;
    if (field.type === "select" && Array.isArray(field.options)) {
      field.options.forEach(option => {
        const node = document.createElement("option");
        node.value = String(option.value);
        node.textContent = String(option.label);
        if (String(option.value) === String(field.value)) node.selected = true;
        input.appendChild(node);
      });
    }
    label.appendChild(input);
    form.appendChild(label);
  });

  const actions = document.createElement("div");
  actions.className = "app-dialog-actions";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = options.closeLabel || t("cancel");
  closeButton.addEventListener("click", hideAppDialog);
  actions.appendChild(closeButton);

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = options.submitLabel || t("apply_settings");
  actions.appendChild(submitButton);
  form.appendChild(actions);

  form.addEventListener("submit", event => {
    event.preventDefault();
    const values = {};
    form.querySelectorAll("[name]").forEach(input => {
      if (input instanceof HTMLInputElement && input.type === "checkbox") values[input.name] = input.checked ? "true" : "false";
      else values[input.name] = String(input.value);
    });
    submitDialogValues(values, form, submitButton);
  });

  els.appDialogBody.appendChild(form);
  els.appDialog.hidden = false;
  els.appDialog.setAttribute("aria-hidden", "false");
  document.body.classList.add("dialog-open");
  const firstInput = typeof form.querySelector === "function"
    ? form.querySelector("input, select, textarea, button[type='submit']")
    : submitButton;
  focusWithoutScroll(firstInput);
}

function submitDialogValues(values, form = null, submitButton = null) {
  if (typeof state.dialog.onSubmit !== "function") return false;
  const handled = state.dialog.onSubmit(values);
  if (handled === false) return false;
  if (state.dialog.keepOpenOnSuccess) {
    const firstInput = form && typeof form.querySelector === "function"
      ? form.querySelector("input, select, textarea")
      : submitButton;
    focusWithoutScroll(firstInput);
    if (firstInput && typeof firstInput.select === "function") firstInput.select();
    return true;
  }
  hideAppDialog();
  return true;
}

function hideAppDialog() {
  if (!els.appDialog) return;
  state.dialog.mode = "message";
  state.dialog.onSubmit = null;
  state.dialog.keepOpenOnSuccess = false;
  const needsDraw = !!state.dialog.pendingDraw;
  state.dialog.pendingDraw = false;
  els.appDialog.hidden = true;
  els.appDialog.setAttribute("aria-hidden", "true");
  if (document.body?.classList?.remove) document.body.classList.remove("dialog-open");
  unlockDialogScroll();
  if (needsDraw) draw();
}

function lockDialogScroll() {
  if (document.body?.classList?.contains?.("dialog-open")) return;
  state.dialog.scrollX = typeof window.scrollX === "number" ? window.scrollX : 0;
  state.dialog.scrollY = typeof window.scrollY === "number" ? window.scrollY : 0;
  if (!document.body?.style) return;
  document.body.style.position = "fixed";
  document.body.style.left = `-${state.dialog.scrollX}px`;
  document.body.style.top = `-${state.dialog.scrollY}px`;
  document.body.style.width = "100%";
}

function unlockDialogScroll() {
  const x = state.dialog.scrollX || 0;
  const y = state.dialog.scrollY || 0;
  if (document.body?.style) {
    document.body.style.position = "";
    document.body.style.left = "";
    document.body.style.top = "";
    document.body.style.width = "";
  }
  if (typeof window.scrollTo === "function") window.scrollTo(x, y);
}

function focusWithoutScroll(element) {
  if (!element || typeof element.focus !== "function") return;
  try {
    element.focus({ preventScroll: true });
  } catch (_error) {
    element.focus();
  }
}

function setCrossSectionInterpolation(type) {
  state.crossSectionInterpolation = type === "controlpoint" ? "controlpoint" : "sblend";
  if (els.controlPointInterpolation) els.controlPointInterpolation.checked = state.crossSectionInterpolation === "controlpoint";
  if (els.sBlendInterpolation) els.sBlendInterpolation.checked = state.crossSectionInterpolation === "sblend";
  if (state.board) state.board.interpolationType = state.crossSectionInterpolation;
  state.model3d.active = false;
  markGeometryDirty();
  setStatus("status_interpolation", { label: interpolationLabel(state.crossSectionInterpolation) });
  refreshAfterMiscChange();
}

function refreshAfterMiscChange() {
  applyLanguageToStaticUI();
  syncSettingsControls();
  updateInfo();
  updateSectionInfo();
  updateEditInfo();
  updateHistoryButtons();
  draw();
}

function interpolationLabel(type) {
  return type === "controlpoint" ? t("interpolation_controlpoint") : t("interpolation_sblend");
}

function approximate3DModel(mode, closed) {
  if (!state.board) return;
  if (mode === "bezierPatch" && !canCreateBezierPatch(state.board)) {
    setStatus("status_bezier_patch_requires_4_or_5");
    return;
  }
  state.model3d.active = true;
  state.model3d.mode = mode;
  state.model3d.closed = !!closed;
  setView("model3d");
  setStatus("status_3d_model_approximated", {
    mode,
    closedSuffix: closed ? " / closed" : " / open"
  });
}

function canCreateBezierPatch(board) {
  return board.sections
    .filter((section, index) => index > 0 && index < board.sections.length - 1)
    .every(section => section.spline.length === 4 || section.spline.length === 5);
}

function clear3DApproximation() {
  state.model3d.active = false;
  state.model3d.mode = "none";
  setStatus("status_3d_approximation_cleared");
  draw();
}

function editNurbsSurface() {
  if (!state.board) return;
  approximate3DModel("nurbsEditPreview", true);
  setStatus("status_nurbs_preview_only");
}

function boardPanelInputs() {
  return [
    els.finType, els.finTemplate, els.finSetup, els.finSideRearX, els.finSideRearY, els.finSideFrontX, els.finSideFrontY,
    els.finCenterRear, els.finCenterFront, els.finCenterDepth, els.finSideDepth, els.finSideSplay, els.finToeIn, els.finCant,
    els.tailMode, els.tailLength, els.tailDepth, els.tailShoulderPos, els.tailShoulderScale, els.tailRailBlend, els.tailWidthAdjust,
    els.noseMode, els.noseLength, els.noseShoulderPos, els.noseShoulderScale, els.noseRailBlend, els.noseWidthAdjust,
    els.wingPreset, els.wingPosition, els.wingWidth, els.wingShape, els.wingShoulder, els.wingTransition,
    els.rockerPreset, els.rockerEnabled, els.rockerNose, els.rockerTail, els.rockerEntryLength, els.rockerEntryLift,
    els.rockerMiddleFlatness, els.rockerTailKickLength, els.rockerTailKick, els.rockerApexShift, els.rockerBlend,
    els.rockerPreserveFoil, els.rockerPreserveDeck, els.setRockerButton, els.resetRockerButton,
    els.railMode, els.railStrength, els.setRailButton,
    els.edgeType, els.edgeStrength, els.edgeLength, els.edgeFade, els.setEdgeButton,
    els.bottomFeaturePreset, els.applyBottomPresetButton,
    els.bottomFeatureIndex, els.bottomFeatureEnabled, els.bottomFeatureType, els.bottomFeatureStart, els.bottomFeaturePeak, els.bottomFeatureEnd,
    els.bottomFeatureDepth, els.bottomFeatureCenterDepth, els.bottomFeatureRailDepth, els.bottomFeatureWidth, els.bottomFeatureBlend, els.bottomFeaturePower, els.bottomFeatureOffset,
    els.bottomFeatureSpacing, els.bottomFeatureCount, els.duplicateBottomFeatureButton, els.resetBottomFeatureButton, els.clearBottomFeaturesButton,
    els.weightStringerWidth, els.weightStringerDensity, els.weightFoamDensity, els.weightDeckGlass,
    els.weightDeckLapWidth, els.weightBottomGlass, els.weightBottomLapWidth, els.weightResinRatio,
    els.weightHotcoat, els.weightPlugsFins
  ];
}

function updateBoardPanel(options = {}) {
  if (!els.boardPanelSummary) return;
  if (!state.board) {
    els.boardPanelSummary.textContent = t("panel_unloaded");
    updateTailPanelFields();
    updateNosePanelFields();
    updateWingPanelFields();
    updateRockerPanelFields();
    updateRailPanelFields();
    updateEdgePanelFields();
    syncBottomFeaturePanel(-1);
    return;
  }
  const board = state.board;
  const tail = normalizedTailConfig(board);
  const wing = normalizedWingConfig(board);
  const noseMode = normalizeNoseModeKey(board.noseMode);
  const tailText = tail.active
    ? t("board_panel_tail", {
        shape: tailModeLabel(tail.mode),
        length: fmt(tail.length),
        depthPart: tailModeUsesDepth(tail.mode) ? t("board_panel_depth_part", { depth: fmt(tail.depth) }) : "",
        shoulder: fmt(tail.shoulderPos),
        width: fmt(tail.shoulderScale),
        blend: fmt(tail.railBlend),
        widthAdjust: widthAdjustPercent(tail.widthAdjust)
      })
    : "";
  const noseText = noseMode
    ? t("board_panel_nose", {
        shape: noseModeLabel(noseMode),
        length: fmt(Number(board.noseLength) || nosePresetForBoard(noseMode, board)?.length || 0),
        widthAdjust: widthAdjustPercent(board.noseWidthAdjust)
      })
    : "";
  const wingText = wing.active
    ? t("board_panel_wing", {
        preset: wingPresetLabel(wing.presetKey),
        shape: wingShapeLabel(wing.shape),
        position: fmt(wing.distance),
        width: fmt(wing.width),
        bumpPart: wing.shape === "bump" ? t("board_panel_bump_part", {
          shoulder: fmt(wing.shoulder),
          transition: fmt(wing.transition)
        }) : ""
      })
    : "";
  els.boardPanelSummary.textContent = t("board_panel_summary", {
    length: fmt(boardCadTailDisplayLength(board)),
    width: fmt(boardCadMaxWidth(board)),
    thickness: fmt(boardCadMaxThickness(board)),
    tailText,
    noseText,
    wingText
  });
  const fins = board.fins || Array(9).fill(0);
  els.finType.value = board.finType || "";
  if (els.finTemplate) els.finTemplate.value = finTemplateKey(board.finType || "");
  if (els.finSetup) els.finSetup.value = finSetupKey(board.finSetup || "");
  els.finSideRearX.value = fmt(fins[0] || 0);
  els.finSideRearY.value = fmt(fins[1] || 0);
  els.finSideFrontX.value = fmt(fins[2] || 0);
  els.finSideFrontY.value = fmt(fins[3] || 0);
  els.finCenterRear.value = fmt(fins[4] || 0);
  els.finCenterFront.value = fmt(fins[5] || 0);
  els.finCenterDepth.value = fmt(fins[6] || 0);
  els.finSideDepth.value = fmt(fins[7] || 0);
  els.finSideSplay.value = fmt(fins[8] || 0);
  if (els.finToeIn) els.finToeIn.value = fmt(Number(board.finToeIn) || finToeInFromFins(fins));
  if (els.finCant) els.finCant.value = fmt(Number(board.finCant) || 0);
  if (els.tailMode) els.tailMode.value = normalizeTailModeKey(board.tailMode);
  const tailDefaults = normalizedTailConfig(board);
  if (els.tailLength) els.tailLength.value = fmt(Number(board.tailLength) || tailDefaults.length || 0);
  if (els.tailDepth) els.tailDepth.value = fmt(Number(board.tailDepth) || tailDefaults.depth || 0);
  if (els.tailShoulderPos) els.tailShoulderPos.value = fmt(Number(board.tailShoulderPos) || tailDefaults.shoulderPos || 0);
  if (els.tailShoulderScale) els.tailShoulderScale.value = fmt(Number(board.tailShoulderScale) || tailDefaults.shoulderScale || 0);
  if (els.tailRailBlend) {
    const rawTailRailBlend = Number(board.tailRailBlend);
    els.tailRailBlend.value = fmt(Number.isFinite(rawTailRailBlend) ? rawTailRailBlend : (tailDefaults.railBlend || 0));
  }
  if (els.tailWidthAdjust) els.tailWidthAdjust.value = String(clampNumber(board.tailWidthAdjust, -1, 1, 0));
  if (els.noseMode) els.noseMode.value = normalizeNoseModeKey(board.noseMode);
  const noseDefaults = nosePresetForBoard(board.noseMode, board) || { length: 0, shoulderPos: 0, shoulderScale: 0, railBlend: 0, linearization: 0 };
  if (els.noseLength) els.noseLength.value = fmt(Number(board.noseLength) || noseDefaults.length || 0);
  if (els.noseShoulderPos) els.noseShoulderPos.value = fmt(Number(board.noseShoulderPos) || noseDefaults.shoulderPos || 0);
  if (els.noseShoulderScale) els.noseShoulderScale.value = fmt(Number(board.noseShoulderScale) || noseDefaults.shoulderScale || 0);
  if (els.noseRailBlend) {
    const rawNoseRailBlend = Number(board.noseRailBlend);
    els.noseRailBlend.value = fmt(Number.isFinite(rawNoseRailBlend) ? rawNoseRailBlend : (noseDefaults.railBlend || 0));
  }
  if (els.noseWidthAdjust) els.noseWidthAdjust.value = String(clampNumber(board.noseWidthAdjust, -1, 1, 0));
  if (els.wingPreset) {
    const rawWingPreset = normalizeWingPresetKey(board.wingPreset);
    els.wingPreset.value = rawWingPreset || (wing.active ? "custom" : "");
  }
  if (els.wingPosition) {
    const rawWingPosition = Number(board.wingPosition);
    els.wingPosition.value = fmt((Number.isFinite(rawWingPosition) && rawWingPosition > 0) ? rawWingPosition : (wing.distance || 0));
  }
  if (els.wingWidth) {
    const rawWingWidth = Number(board.wingWidth);
    els.wingWidth.value = fmt((Number.isFinite(rawWingWidth) && rawWingWidth > 0) ? rawWingWidth : (wing.width || 0));
  }
  if (els.wingShape) els.wingShape.value = normalizeWingShapeKey(board.wingShape) || wing.shape || "bump";
  if (els.wingShoulder) {
    const rawWingShoulder = Number(board.wingShoulder);
    const presetWing = normalizeWingPresetKey(board.wingPreset);
    const displayShoulder = (Number.isFinite(rawWingShoulder) && !(presetWing && presetWing !== "custom" && rawWingShoulder <= 0 && (wing.shoulder || 0) > 0))
      ? rawWingShoulder
      : (wing.shoulder || 0);
    els.wingShoulder.value = fmt(displayShoulder);
  }
  if (els.wingTransition) {
    const rawWingTransition = Number(board.wingTransition);
    const displayTransition = (Number.isFinite(rawWingTransition) && rawWingTransition > 0)
      ? rawWingTransition
      : (wing.transition || 0);
    els.wingTransition.value = fmt(displayTransition);
  }
  if (els.railMode) els.railMode.value = normalizeRailModeKey(board.railMode);
  if (els.railStrength) els.railStrength.value = fmt(clampNumber(board.railStrength, 0, 1, 1));
  const edge = normalizedEdgeConfig(board);
  if (els.edgeType) els.edgeType.value = edge.type;
  if (els.edgeStrength) els.edgeStrength.value = fmt(edge.strength);
  if (els.edgeLength) els.edgeLength.value = fmt(edge.length);
  if (els.edgeFade) els.edgeFade.value = fmt(edge.fade);
  updateTailPanelFields();
  updateNosePanelFields();
  updateWingPanelFields();
  updateRockerPanelFields();
  updateRailPanelFields();
  updateEdgePanelFields();
  syncBottomFeaturePanel();
  if (!state.weightInputs) setWeightDefaults(false);
  updateGuidePointPanel();
  if (options.forceWeight === true || els.weightPanel?.open) updateWeightOutput();
}

function setFinsFromPanel() {
  if (!state.board) return;
  const before = cloneBoard(state.board);
  state.board.finType = els.finTemplate?.value || els.finType.value || "";
  state.board.finSetup = finSetupKey(els.finSetup?.value || "");
  state.board.fins = [
    numberOrZero(els.finSideRearX.value), numberOrZero(els.finSideRearY.value),
    numberOrZero(els.finSideFrontX.value), numberOrZero(els.finSideFrontY.value),
    numberOrZero(els.finCenterRear.value), numberOrZero(els.finCenterFront.value),
    numberOrZero(els.finCenterDepth.value), numberOrZero(els.finSideDepth.value),
    numberOrZero(els.finSideSplay.value)
  ];
  state.board.finToeIn = numberOrZero(els.finToeIn?.value);
  state.board.finCant = numberOrZero(els.finCant?.value);
  if (!state.board.finToeIn) state.board.finToeIn = finToeInFromFins(state.board.fins);
  state.board.finExtra = normalizeFinExtra(state.board.finExtra);
  commitBoardMutation(before, { recomputeMetrics: false });
  setStatus("status_fins_updated");
}

function tailModeLabel(mode) {
  const key = normalizeTailModeKey(mode);
  if (key === "square") return t("tail_mode_square");
  if (key === "squash") return t("tail_mode_squash");
  if (key === "round") return t("tail_mode_round");
  if (key === "rounded-square") return t("tail_mode_rounded_square");
  if (key === "gun") return t("tail_mode_gun");
  if (key === "pin") return t("tail_mode_pin");
  if (key === "round-pin") return t("tail_mode_round_pin");
  if (key === "diamond") return t("tail_mode_diamond");
  if (key === "rounded-diamond") return t("tail_mode_rounded_diamond");
  if (key === "rocket") return t("tail_mode_rocket");
  if (key === "half-moon") return t("tail_mode_half_moon");
  if (key === "swallow") return t("tail_mode_swallow");
  if (key === "fish") return t("tail_mode_fish");
  if (key === "split") return t("tail_mode_split");
  if (key === "star") return t("tail_mode_star");
  if (key === "bat") return t("tail_mode_bat");
  return t("bezier_native");
}

function noseModeLabel(mode) {
  const key = normalizeNoseModeKey(mode);
  if (key === "gun") return t("nose_mode_gun");
  if (key === "pin") return t("nose_mode_pin");
  if (key === "round-point") return t("nose_mode_round_point");
  if (key === "wide") return t("nose_mode_wide");
  if (key === "round") return t("nose_mode_round");
  if (key === "diamond") return t("nose_mode_diamond");
  if (key === "snub") return t("nose_mode_snub");
  if (key === "square") return t("nose_mode_square");
  return t("bezier_native");
}

function wingPresetLabel(presetKey) {
  if (presetKey === "stinger") return t("wing_preset_stinger");
  if (presetKey === "wing") return t("wing_preset_wing");
  if (presetKey === "wing-pin") return t("wing_preset_wing_pin");
  if (presetKey === "custom") return t("wing_preset_custom");
  return t("none");
}

function wingShapeLabel(shape) {
  return shape === "step" ? t("wing_shape_step") : t("wing_shape_bump");
}

function rockerPresetLabel(preset) {
  const key = rockerPresetOrDefault(preset);
  if (key === "continuous-neutral") return t("rocker_preset_continuous_neutral");
  if (key === "relaxed-drive") return t("rocker_preset_relaxed_drive");
  if (key === "performance-curve") return t("rocker_preset_performance_curve");
  if (key === "staged-speed") return t("rocker_preset_staged_speed");
  if (key === "fish-retro-flat") return t("rocker_preset_fish_retro_flat");
  if (key === "gun-continuous") return t("rocker_preset_gun_continuous");
  if (key === "longboard-glide") return t("rocker_preset_longboard_glide");
  return t("custom");
}

function updateRockerPanelFields() {
  const board = state.board;
  const config = normalizeRockerConfig(board?.rockerConfig, board?.rockerPreset || board?.rockerConfig?.preset);
  const currentMeasurement = board ? rockerStationMeasurements(board) : [];
  const tail = currentMeasurement.find(station => station.key === "tail");
  const nose = currentMeasurement.find(station => station.key === "nose");
  if (els.rockerPreset) els.rockerPreset.value = config.preset;
  if (els.rockerEnabled) els.rockerEnabled.checked = !!config.enabled;
  if (els.rockerNose) els.rockerNose.value = fmt(config.noseRocker || nose?.rocker || 0);
  if (els.rockerTail) els.rockerTail.value = fmt(config.tailRocker || tail?.rocker || 0);
  if (els.rockerEntryLength) els.rockerEntryLength.value = fmt(config.entryLengthRatio);
  if (els.rockerEntryLift) els.rockerEntryLift.value = fmt(config.entryLift);
  if (els.rockerMiddleFlatness) els.rockerMiddleFlatness.value = fmt(config.middleFlatness);
  if (els.rockerTailKickLength) els.rockerTailKickLength.value = fmt(config.tailKickLengthRatio);
  if (els.rockerTailKick) els.rockerTailKick.value = fmt(config.tailKick);
  if (els.rockerApexShift) els.rockerApexShift.value = fmt(config.apexShift);
  if (els.rockerBlend) els.rockerBlend.value = fmt(config.blend);
  if (els.rockerPreserveDeck) els.rockerPreserveDeck.checked = !!config.preserveDeck;
  if (els.rockerPreserveFoil) els.rockerPreserveFoil.checked = !config.preserveDeck && config.preserveFoil !== false;
  updateRockerPanelReadout(config, currentMeasurement);
}

function rockerPresetConfigForBoard(preset, board) {
  const normalizedPreset = rockerPresetOrDefault(preset);
  const current = normalizeRockerConfig(board?.rockerConfig, board?.rockerPreset || board?.rockerConfig?.preset);
  const measurementBoard = board && Array.isArray(board.rockerRuntimeBaseBottom) && board.rockerRuntimeBaseBottom.length
    ? { ...board, bottom: boardCadCloneKnots(board.rockerRuntimeBaseBottom), deck: Array.isArray(board.rockerRuntimeBaseDeck) ? boardCadCloneKnots(board.rockerRuntimeBaseDeck) : boardCadCloneKnots(board.deck) }
    : board;
  const currentMeasurement = measurementBoard ? rockerStationMeasurements(measurementBoard) : [];
  const tail = currentMeasurement.find(station => station.key === "tail");
  const nose = currentMeasurement.find(station => station.key === "nose");
  return normalizeRockerConfig({
    ...defaultRockerConfig(normalizedPreset),
    enabled: true,
    noseRocker: Number.isFinite(Number(current.noseRocker)) && current.noseRocker > 0 ? current.noseRocker : (nose?.rocker || 0),
    tailRocker: Number.isFinite(Number(current.tailRocker)) && current.tailRocker > 0 ? current.tailRocker : (tail?.rocker || 0)
  }, normalizedPreset);
}

function applyRockerPresetToPanel(preset, board = state.board) {
  const config = rockerPresetConfigForBoard(preset, board);
  if (els.rockerPreset) els.rockerPreset.value = config.preset;
  if (els.rockerEnabled) els.rockerEnabled.checked = !!config.enabled;
  if (els.rockerNose) els.rockerNose.value = fmt(config.noseRocker);
  if (els.rockerTail) els.rockerTail.value = fmt(config.tailRocker);
  if (els.rockerEntryLength) els.rockerEntryLength.value = fmt(config.entryLengthRatio);
  if (els.rockerEntryLift) els.rockerEntryLift.value = fmt(config.entryLift);
  if (els.rockerMiddleFlatness) els.rockerMiddleFlatness.value = fmt(config.middleFlatness);
  if (els.rockerTailKickLength) els.rockerTailKickLength.value = fmt(config.tailKickLengthRatio);
  if (els.rockerTailKick) els.rockerTailKick.value = fmt(config.tailKick);
  if (els.rockerApexShift) els.rockerApexShift.value = fmt(config.apexShift);
  if (els.rockerBlend) els.rockerBlend.value = fmt(config.blend);
  if (els.rockerPreserveDeck) els.rockerPreserveDeck.checked = !!config.preserveDeck;
  if (els.rockerPreserveFoil) els.rockerPreserveFoil.checked = !config.preserveDeck && config.preserveFoil !== false;
  updateRockerPanelReadout(config);
}

function updateRockerPanelReadout(config = normalizeRockerConfig(), measurements = null) {
  const board = state.board;
  const currentMeasurement = Array.isArray(measurements)
    ? measurements
    : (board ? rockerStationMeasurements(board) : []);
  const tail = currentMeasurement.find(station => station.key === "tail");
  const nose = currentMeasurement.find(station => station.key === "nose");
  if (els.rockerSummary) {
    els.rockerSummary.textContent = board
      ? t("rocker_summary", {
          preset: rockerPresetLabel(config.preset),
          nose: fmt(nose?.rocker || 0),
          tail: fmt(tail?.rocker || 0)
        })
      : t("rocker_summary_empty");
  }
  if (els.rockerStationList) {
    els.rockerStationList.textContent = currentMeasurement.length
      ? currentMeasurement.map(station => t("rocker_station_row", {
          label: station.label,
          x: fmt(station.position),
          rocker: fmt(station.rocker),
          deck: fmt(station.deck),
          thickness: fmt(station.thickness)
        })).join("\n")
      : t("rocker_station_empty");
  }
}

function readRockerConfigFromPanel() {
  const current = normalizeRockerConfig(state.board?.rockerConfig, state.board?.rockerPreset || state.board?.rockerConfig?.preset);
  const preset = rockerPresetOrDefault(els.rockerPreset?.value || current.preset);
  const preserveDeck = !!els.rockerPreserveDeck?.checked;
  return normalizeRockerConfig({
    preset,
    enabled: !!els.rockerEnabled?.checked,
    noseRocker: Number(els.rockerNose?.value),
    tailRocker: Number(els.rockerTail?.value),
    entryLengthRatio: Number(els.rockerEntryLength?.value),
    entryLift: Number(els.rockerEntryLift?.value),
    middleFlatness: Number(els.rockerMiddleFlatness?.value),
    tailKickLengthRatio: Number(els.rockerTailKickLength?.value),
    tailKick: Number(els.rockerTailKick?.value),
    apexShift: Number(els.rockerApexShift?.value),
    blend: Number(els.rockerBlend?.value),
    preserveFoil: preserveDeck ? false : !!els.rockerPreserveFoil?.checked,
    preserveDeck
  }, preset);
}

function setRockerFromPanel() {
  if (!state.board) return;
  const before = cloneBoard(state.board);
  captureRockerRuntimeBase(state.board);
  const config = readRockerConfigFromPanel();
  applyRockerConfigToBoard(state.board, config);
  commitBoardMutation(before);
  setStatus("status_rocker_updated", { preset: rockerPresetLabel(config.preset) });
}

function resetRockerFromPanel() {
  if (!state.board) return;
  const before = cloneBoard(state.board);
  restoreRockerRuntimeBase(state.board);
  state.board.rockerPreset = "custom";
  state.board.rockerConfig = defaultRockerConfig("custom");
  commitBoardMutation(before);
  setStatus("status_rocker_reset");
}

function normalizeRailModeKey(value) {
  const key = String(value || "").trim().toLowerCase();
  if (!key) return "";
  if (key === "50/50" || key === "5050" || key === "50-50") return "5050";
  if (key === "60/40" || key === "6040" || key === "60-40") return "6040";
  if (key === "70/30" || key === "7030" || key === "70-30") return "7030";
  if (key === "80/20" || key === "8020" || key === "80-20") return "8020";
  if (key === "egg" || key === "eggrail" || key === "egg-rail") return "egg";
  if (key === "full" || key === "fullsoft" || key === "full-soft" || key === "fullsoftrail" || key === "full-soft-rail" || key === "soft") return "full-soft";
  if (key === "boxy" || key === "boxyrail" || key === "boxy-rail" || key === "box") return "boxy";
  if (key === "down" || key === "downrail" || key === "down-rail") return "down";
  if (key === "pinched" || key === "pinchedrail" || key === "pinched-rail") return "pinched";
  if (key === "knifey" || key === "knife" || key === "kniferail" || key === "knife-rail" || key === "knifeyrail" || key === "knifey-rail") return "knifey";
  if (key === "chine" || key === "chined" || key === "chinedrail" || key === "chined-rail" || key === "bevel" || key === "beveled" || key === "beveledrail" || key === "beveled-rail") return "chine";
  if (key === "tucked" || key === "tuck" || key === "tuckededge" || key === "tucked-edge" || key === "tucked-edge-rail") return "tucked-edge";
  if (key === "hard" || key === "hardedge" || key === "hard-edge" || key === "hard-edge-rail") return "hard-edge";
  return "";
}

function normalizeEdgeTypeKey(value) {
  const key = String(value || "").trim().toLowerCase();
  if (!key || key === "none" || key === "off" || key === "false") return "";
  if (key === "soft" || key === "softedge" || key === "soft-edge") return "soft";
  if (key === "tuck" || key === "tucked" || key === "tuckededge" || key === "tucked-edge") return "tucked";
  if (key === "hard" || key === "hardedge" || key === "hard-edge" || key === "release") return "hard";
  return "";
}

function railModeLabel(mode) {
  const key = normalizeRailModeKey(mode);
  if (key === "5050") return t("rail_mode_5050");
  if (key === "6040") return t("rail_mode_6040");
  if (key === "7030") return t("rail_mode_7030");
  if (key === "8020") return t("rail_mode_8020");
  if (key === "egg") return t("rail_mode_egg");
  if (key === "full-soft") return t("rail_mode_full_soft");
  if (key === "boxy") return t("rail_mode_boxy");
  if (key === "down") return t("rail_mode_down");
  if (key === "pinched") return t("rail_mode_pinched");
  if (key === "knifey") return t("rail_mode_knifey");
  if (key === "chine") return t("rail_mode_chine");
  if (key === "tucked-edge") return t("rail_mode_tucked_edge");
  if (key === "hard-edge") return t("rail_mode_hard_edge");
  return t("bezier_native");
}

function edgeTypeLabel(type) {
  const key = normalizeEdgeTypeKey(type);
  if (key === "soft") return t("edge_type_soft");
  if (key === "tucked") return t("edge_type_tucked");
  if (key === "hard") return t("edge_type_hard");
  return t("none");
}

function normalizedEdgeConfig(board = state.board) {
  if (!board) return { type: "", active: false, strength: 0, length: 0, fade: 0 };
  const type = normalizeEdgeTypeKey(board.edgeType);
  const boardLength = Math.max(0, Number(board.length) || 0);
  const rawStrength = clampNumber(board.edgeStrength, 0, 1, type ? 1 : 0);
  const defaultLength = boardLength > 0 ? boardLength * 0.38 : 0;
  const length = type
    ? clampNumber(board.edgeLength, 0, boardLength || defaultLength, Number(board.edgeLength) > 0 ? Number(board.edgeLength) : defaultLength)
    : 0;
  const defaultFade = length > 0 ? Math.min(length * 0.35, boardLength * 0.12) : 0;
  const fade = type ? clampNumber(board.edgeFade, 0, length, Number(board.edgeFade) > 0 ? Number(board.edgeFade) : defaultFade) : 0;
  const strength = type ? rawStrength : 0;
  return {
    type,
    active: !!type && strength > 1e-6 && length > 1e-6,
    strength,
    length,
    fade
  };
}

function edgeEffectAtSection(board, section, config = normalizedEdgeConfig(board)) {
  if (!config?.active || !section) return 0;
  const pos = Number(section.position);
  if (!Number.isFinite(pos) || pos < -1e-9 || pos > config.length + 1e-9) return 0;
  const fade = Math.max(0, Number(config.fade) || 0);
  let factor = 1;
  if (fade > 1e-9 && pos > config.length - fade) {
    factor = clampNumber((config.length - pos) / fade, 0, 1, 1);
  }
  return clampNumber(config.strength * factor, 0, 1, 0);
}

function railModeSpec(mode) {
  const key = normalizeRailModeKey(mode);
  if (key === "5050") return {
    railMarkInches: 1.42,
    tuckInches: 0.10,
    deckMarksInches: [0.95, 1.7, 2.35],
    lowerLift: 0.14,
    lowerGuideLift: 0.025,
    upperShape: [0.28, 0.64, 0.94]
  };
  if (key === "6040") return {
    railMarkInches: 1.35,
    tuckInches: 0.14,
    deckMarksInches: [0.95, 1.7, 2.45],
    lowerLift: 0.18,
    lowerGuideLift: 0.03,
    upperShape: [0.28, 0.65, 0.95]
  };
  if (key === "7030") return {
    railMarkInches: 1.18,
    tuckInches: 0.20,
    deckMarksInches: [1.10, 1.95, 2.80],
    lowerLift: 0.24,
    lowerGuideLift: 0.04,
    upperShape: [0.24, 0.58, 0.92]
  };
  if (key === "8020") return {
    railMarkInches: 1.0,
    tuckInches: 0.26,
    deckMarksInches: [1.25, 2.15, 3.1],
    lowerLift: 0.30,
    lowerGuideLift: 0.05,
    upperShape: [0.20, 0.52, 0.90]
  };
  if (key === "egg") return {
    railMarkInches: 1.25,
    tuckInches: 0.12,
    deckMarksInches: [1.15, 1.95, 2.65],
    lowerLift: 0.20,
    lowerGuideLift: 0.025,
    upperShape: [0.24, 0.62, 0.96]
  };
  if (key === "full-soft") return {
    railMarkInches: 1.50,
    tuckInches: 0.08,
    deckMarksInches: [1.10, 1.75, 2.35],
    lowerLift: 0.16,
    lowerGuideLift: 0.02,
    upperShape: [0.30, 0.68, 0.98]
  };
  if (key === "boxy") return {
    railMarkInches: 1.50,
    tuckInches: 0.10,
    deckMarksInches: [1.45, 2.20, 3.00],
    lowerLift: 0.13,
    lowerGuideLift: 0.02,
    upperShape: [0.20, 0.48, 0.84]
  };
  if (key === "down") return {
    railMarkInches: 0.875,
    tuckInches: 0.375,
    deckMarksInches: [1.75, 2.375, 3.0],
    lowerLift: 0.12,
    lowerGuideLift: 0.03,
    upperShape: [0.18, 0.46, 0.88]
  };
  if (key === "pinched") return {
    railMarkInches: 1.125,
    tuckInches: 0.08,
    deckMarksInches: [2.0, 3.0, null],
    lowerLift: 0.14,
    lowerGuideLift: 0.02,
    upperShape: [0.14, 0.58, 0.97]
  };
  if (key === "knifey") return {
    railMarkInches: 0.95,
    tuckInches: 0.06,
    deckMarksInches: [2.0, 3.5, null],
    lowerLift: 0.10,
    lowerGuideLift: 0.015,
    upperShape: [0.10, 0.50, 0.96]
  };
  if (key === "chine") return {
    railMarkInches: 1.10,
    tuckInches: 0.24,
    deckMarksInches: [1.35, 2.25, 3.00],
    lowerLift: 0.08,
    lowerGuideLift: 0.01,
    upperShape: [0.18, 0.50, 0.90]
  };
  if (key === "tucked-edge") return {
    railMarkInches: 1.05,
    tuckInches: 0.32,
    deckMarksInches: [1.20, 2.05, 2.90],
    lowerLift: 0.12,
    lowerGuideLift: 0.015,
    upperShape: [0.18, 0.48, 0.88]
  };
  if (key === "hard-edge") return {
    railMarkInches: 0.85,
    tuckInches: 0.42,
    deckMarksInches: [1.25, 2.15, 3.10],
    lowerLift: 0.06,
    lowerGuideLift: 0.005,
    upperShape: [0.16, 0.44, 0.86]
  };
  return null;
}

function railModeDeformSpec(mode) {
  const key = normalizeRailModeKey(mode);
  if (key === "5050") return {
    apexRatio: 0.47,
    apexPrevScale: 0.44,
    apexNextScale: 0.44,
    innerTowardScale: 0.34,
    innerAwayScale: 0.48
  };
  if (key === "6040") return {
    apexRatio: 0.43,
    apexPrevScale: 0.52,
    apexNextScale: 0.46,
    innerTowardScale: 0.44,
    innerAwayScale: 0.68
  };
  if (key === "7030") return {
    apexRatio: 0.36,
    apexPrevScale: 0.57,
    apexNextScale: 0.43,
    innerTowardScale: 0.51,
    innerAwayScale: 0.80
  };
  if (key === "8020") return {
    apexRatio: 0.28,
    apexPrevScale: 0.62,
    apexNextScale: 0.4,
    innerTowardScale: 0.58,
    innerAwayScale: 0.92
  };
  if (key === "egg") return {
    apexRatio: 0.42,
    apexPrevScale: 0.50,
    apexNextScale: 0.50,
    innerTowardScale: 0.40,
    innerAwayScale: 0.58
  };
  if (key === "full-soft") return {
    apexRatio: 0.46,
    apexPrevScale: 0.46,
    apexNextScale: 0.52,
    innerTowardScale: 0.32,
    innerAwayScale: 0.46
  };
  if (key === "boxy") return {
    apexRatio: 0.45,
    apexPrevScale: 0.32,
    apexNextScale: 0.34,
    innerTowardScale: 0.24,
    innerAwayScale: 0.36
  };
  if (key === "down") return {
    apexRatio: 0.24,
    apexPrevScale: 0.56,
    apexNextScale: 0.34,
    innerTowardScale: 0.52,
    innerAwayScale: 0.9
  };
  if (key === "pinched") return {
    apexRatio: 0.36,
    apexPrevScale: 0.46,
    apexNextScale: 0.5,
    innerTowardScale: 0.48,
    innerAwayScale: 0.82
  };
  if (key === "knifey") return {
    apexRatio: 0.34,
    apexPrevScale: 0.34,
    apexNextScale: 0.38,
    innerTowardScale: 0.62,
    innerAwayScale: 0.96
  };
  if (key === "chine") return {
    apexRatio: 0.36,
    apexPrevScale: 0.24,
    apexNextScale: 0.38,
    innerTowardScale: 0.58,
    innerAwayScale: 0.88
  };
  if (key === "tucked-edge") return {
    apexRatio: 0.30,
    apexPrevScale: 0.22,
    apexNextScale: 0.34,
    innerTowardScale: 0.62,
    innerAwayScale: 0.90
  };
  if (key === "hard-edge") return {
    apexRatio: 0.24,
    apexPrevScale: 0.12,
    apexNextScale: 0.30,
    innerTowardScale: 0.68,
    innerAwayScale: 1.0
  };
  return null;
}

function sampleBoardFromEmbeddedData(filename) {
  const key = String(filename || "").trim();
  if (!key) return null;
  const cacheKey = `sample-board:${key}`;
  if (railTemplateCache.has(cacheKey)) return railTemplateCache.get(cacheKey);
  const store = (typeof window !== "undefined" && window.BOARDCAD_SAMPLE_DATA) ? window.BOARDCAD_SAMPLE_DATA : null;
  const text = store?.[key] || null;
  if (!text) {
    railTemplateCache.set(cacheKey, null);
    return null;
  }
  try {
    const board = parseBrd(text, key);
    railTemplateCache.set(cacheKey, board);
    return board;
  } catch {
    railTemplateCache.set(cacheKey, null);
    return null;
  }
}

function nearestSectionToPosition(board, targetX) {
  if (!board || !Array.isArray(board.sections) || !board.sections.length) return null;
  let best = board.sections[0] || null;
  let bestDistance = Number.POSITIVE_INFINITY;
  board.sections.forEach(section => {
    const distance = Math.abs((Number(section?.position) || 0) - targetX);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = section;
    }
  });
  return best;
}

function normalizedTemplateFromSectionSpline(spline, fractions) {
  if (!Array.isArray(spline) || spline.length < 2) return null;
  const halfWidth = Math.max(0.01, boardCadCrossSectionWidth(spline) / 2);
  const thickness = Math.max(0.01, boardCadCrossSectionCenterThickness(spline));
  const normalized = [{ x: 0, y: 0, half: "lower" }];
  fractions.forEach(fraction => {
    const clamped = clampNumber(fraction, 0, 1, 0);
    const sampleX = halfWidth * clamped;
    normalized.push({
      x: clamped,
      y: clampNumber(boardCadSplineValueAt(spline, sampleX) / thickness, 0, 1, 0),
      half: "lower"
    });
  });
  normalized.push({ x: 1, y: clampNumber(boardCadSplineValueAt(spline, halfWidth) / thickness, 0, 1, 0.5), half: "rail" });
  fractions.slice().reverse().forEach(fraction => {
    const clamped = clampNumber(fraction, 0, 1, 0);
    const sampleX = halfWidth * clamped;
    normalized.push({
      x: clamped,
      y: clampNumber(boardCadSplineValueAtReverse(spline, sampleX) / thickness, 0, 1, 1),
      half: "upper"
    });
  });
  normalized.push({ x: 0, y: 1, half: "upper" });
  return normalized;
}

function normalizedTemplateSplineFromSectionSpline(spline) {
  if (!Array.isArray(spline) || spline.length < 2) return null;
  const halfWidth = Math.max(0.01, boardCadCrossSectionWidth(spline) / 2);
  const thickness = Math.max(0.01, boardCadCrossSectionCenterThickness(spline));
  return boardCadCloneKnots(spline).map(knot => ({
    p: { x: knot.p.x / halfWidth, y: knot.p.y / thickness },
    prev: { x: knot.prev.x / halfWidth, y: knot.prev.y / thickness },
    next: { x: knot.next.x / halfWidth, y: knot.next.y / thickness },
    continuous: knot.continuous,
    other: knot.other
  }));
}

function scaleNormalizedTemplateSpline(template, halfWidth, thickness) {
  if (!Array.isArray(template) || template.length < 2) return null;
  const w = Math.max(0.01, halfWidth);
  const t = Math.max(0.01, thickness);
  return template.map(knot => ({
    p: { x: knot.p.x * w, y: knot.p.y * t },
    prev: { x: knot.prev.x * w, y: knot.prev.y * t },
    next: { x: knot.next.x * w, y: knot.next.y * t },
    continuous: knot.continuous,
    other: knot.other
  }));
}

function longboard6040Template() {
  const cacheKey = "rail-template:longboard-6040";
  if (railTemplateCache.has(cacheKey)) return railTemplateCache.get(cacheKey);
  const board = sampleBoardFromEmbeddedData("Longboard.brd");
  const section = board ? nearestSectionToPosition(board, (Number(board.length) || 0) * 0.5) : null;
  const template = section?.spline
    ? normalizedTemplateFromSectionSpline(section.spline, [0.18, 0.40, 0.64, 0.86])
    : null;
  const finalTemplate = template || null;
  railTemplateCache.set(cacheKey, finalTemplate);
  return finalTemplate;
}

function longboard6040TemplateSpline() {
  const cacheKey = "rail-template-spline:longboard-6040";
  if (railTemplateCache.has(cacheKey)) return railTemplateCache.get(cacheKey);
  const board = sampleBoardFromEmbeddedData("Longboard.brd");
  const section = board ? nearestSectionToPosition(board, (Number(board.length) || 0) * 0.5) : null;
  const template = section?.spline
    ? normalizedTemplateSplineFromSectionSpline(section.spline)
    : null;
  railTemplateCache.set(cacheKey, template || null);
  return template || null;
}

function shortboardTailBoxyTemplateSpline() {
  const cacheKey = "rail-template-spline:shortboard-tail-boxy";
  if (railTemplateCache.has(cacheKey)) return railTemplateCache.get(cacheKey);
  const board = sampleBoardFromEmbeddedData("Shortboard.brd");
  const sections = Array.isArray(board?.sections)
    ? board.sections.slice().sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0))
    : [];
  const section = sections.length >= 2 ? sections[1] : null;
  const template = section?.spline
    ? normalizedTemplateSplineFromSectionSpline(section.spline)
    : null;
  railTemplateCache.set(cacheKey, template || null);
  return template || null;
}

function synthetic5050TemplateSpline() {
  const cacheKey = "rail-template-spline:synthetic-5050";
  if (railTemplateCache.has(cacheKey)) return railTemplateCache.get(cacheKey);
  const k = 0.5522847498;
  const template = [
    {
      p: { x: 0, y: 0 },
      prev: { x: -0.35, y: 0 },
      next: { x: 0.38, y: 0 },
      continuous: true,
      other: false
    },
    {
      p: { x: 0.82, y: 0.16 },
      prev: { x: 0.62, y: 0.04 },
      next: { x: 0.95, y: 0.26 },
      continuous: true,
      other: false
    },
    {
      p: { x: 1, y: 0.5 },
      prev: { x: 1, y: 0.5 - (0.34 * k) },
      next: { x: 1, y: 0.5 + (0.34 * k) },
      continuous: true,
      other: false
    },
    {
      p: { x: 0.82, y: 0.84 },
      prev: { x: 0.95, y: 0.74 },
      next: { x: 0.62, y: 0.96 },
      continuous: true,
      other: false
    },
    {
      p: { x: 0, y: 1 },
      prev: { x: 0.38, y: 1 },
      next: { x: -0.35, y: 1 },
      continuous: true,
      other: false
    }
  ];
  railTemplateCache.set(cacheKey, template);
  return template;
}

function alignSyntheticRailUpperDeckTangent(template) {
  if (!Array.isArray(template) || template.length < 5) return template;
  const upper = template[3];
  const deck = template[4];
  if (!upper?.p || !upper?.prev || !deck?.p) return template;
  const inX = upper.p.x - upper.prev.x;
  const inY = upper.p.y - upper.prev.y;
  const inLength = Math.hypot(inX, inY);
  const deckSpan = Math.hypot(deck.p.x - upper.p.x, deck.p.y - upper.p.y);
  if (!(inLength > 1e-6) || !(deckSpan > 1e-6)) return template;
  const handleLength = Math.min(deckSpan * 0.48, Math.max(deckSpan * 0.24, inLength * 0.82));
  const outX = (inX / inLength) * handleLength;
  const outY = (inY / inLength) * handleLength;
  upper.next = {
    x: clampNumber(upper.p.x + outX, 0, 1.05, upper.next?.x ?? upper.p.x),
    y: clampNumber(upper.p.y + outY, 0, 1, upper.next?.y ?? upper.p.y)
  };
  deck.prev = {
    x: Math.min(0.42, Math.max(0.20, upper.p.x * 0.48)),
    y: 1
  };
  return template;
}

function syntheticRailTemplateSpline(key) {
  const normalizedKey = normalizeRailModeKey(key);
  if (normalizedKey === "5050") return synthetic5050TemplateSpline();
  const cacheKey = `rail-template-spline:synthetic-${normalizedKey}`;
  if (railTemplateCache.has(cacheKey)) return railTemplateCache.get(cacheKey);
  const configs = {
    "7030": {
      lower1: { x: 0.77, y: 0.05 },
      apex: { x: 1, y: 0.305 },
      upper1: { x: 0.74, y: 0.79 },
      lowerHandles: [{ x: 0.50, y: 0.00 }, { x: 0.94, y: 0.13 }],
      apexHandle: 0.285,
      upperHandles: [{ x: 0.94, y: 0.54 }, { x: 0.43, y: 0.96 }]
    },
    "8020": {
      lower1: { x: 0.76, y: 0.035 },
      apex: { x: 1, y: 0.30 },
      upper1: { x: 0.72, y: 0.78 },
      lowerHandles: [{ x: 0.50, y: 0.00 }, { x: 0.94, y: 0.12 }],
      apexHandle: 0.28,
      upperHandles: [{ x: 0.94, y: 0.53 }, { x: 0.44, y: 0.96 }]
    },
    egg: {
      lower1: { x: 0.76, y: 0.11 },
      apex: { x: 1, y: 0.42 },
      upper1: { x: 0.76, y: 0.81 },
      lowerHandles: [{ x: 0.46, y: 0.02 }, { x: 0.94, y: 0.24 }],
      apexHandle: 0.26,
      upperHandles: [{ x: 0.94, y: 0.62 }, { x: 0.46, y: 0.96 }]
    },
    "full-soft": {
      lower1: { x: 0.88, y: 0.15 },
      apex: { x: 1, y: 0.46 },
      upper1: { x: 0.88, y: 0.84 },
      lowerHandles: [{ x: 0.54, y: 0.02 }, { x: 0.98, y: 0.28 }],
      apexHandle: 0.27,
      upperHandles: [{ x: 0.98, y: 0.64 }, { x: 0.54, y: 0.98 }]
    },
    boxy: {
      lower1: { x: 0.93, y: 0.13 },
      apex: { x: 1, y: 0.45 },
      upper1: { x: 0.93, y: 0.83 },
      lowerHandles: [{ x: 0.66, y: 0.03 }, { x: 1.00, y: 0.27 }],
      apexHandle: 0.24,
      upperHandles: [{ x: 1.00, y: 0.63 }, { x: 0.66, y: 0.97 }]
    },
    down: {
      lower1: { x: 0.82, y: 0.025 },
      apex: { x: 1, y: 0.24 },
      upper1: { x: 0.68, y: 0.76 },
      lowerHandles: [{ x: 0.55, y: 0.00 }, { x: 0.96, y: 0.10 }],
      apexHandle: 0.24,
      upperHandles: [{ x: 0.93, y: 0.46 }, { x: 0.38, y: 0.96 }]
    },
    pinched: {
      lower1: { x: 0.70, y: 0.09 },
      apex: { x: 1, y: 0.40 },
      upper1: { x: 0.66, y: 0.76 },
      lowerHandles: [{ x: 0.46, y: 0.015 }, { x: 0.88, y: 0.21 }],
      apexHandle: 0.20,
      upperHandles: [{ x: 0.88, y: 0.58 }, { x: 0.38, y: 0.96 }]
    },
    knifey: {
      lower1: { x: 0.58, y: 0.10 },
      apex: { x: 1, y: 0.34 },
      upper1: { x: 0.58, y: 0.73 },
      lowerHandles: [{ x: 0.34, y: 0.03 }, { x: 0.86, y: 0.20 }],
      apexHandle: 0.18,
      upperHandles: [{ x: 0.86, y: 0.50 }, { x: 0.30, y: 0.94 }]
    },
    chine: {
      lower1: { x: 0.78, y: 0.045 },
      apex: { x: 1, y: 0.36 },
      upper1: { x: 0.72, y: 0.78 },
      lowerHandles: [{ x: 0.54, y: 0.00 }, { x: 0.96, y: 0.12 }],
      apexHandle: 0.22,
      upperHandles: [{ x: 0.94, y: 0.55 }, { x: 0.42, y: 0.96 }],
      lowerContinuous: false,
      apexContinuous: false
    },
    "tucked-edge": {
      lower1: { x: 0.86, y: 0.02 },
      apex: { x: 1, y: 0.27 },
      upper1: { x: 0.70, y: 0.76 },
      lowerHandles: [{ x: 0.62, y: 0.00 }, { x: 0.98, y: 0.08 }],
      apexHandle: 0.20,
      upperHandles: [{ x: 0.92, y: 0.50 }, { x: 0.40, y: 0.96 }],
      lowerContinuous: false
    },
    "hard-edge": {
      lower1: { x: 0.92, y: 0.00 },
      apex: { x: 1, y: 0.22 },
      upper1: { x: 0.68, y: 0.74 },
      lowerHandles: [{ x: 0.70, y: 0.00 }, { x: 1.00, y: 0.035 }],
      apexHandle: 0.18,
      upperHandles: [{ x: 0.92, y: 0.44 }, { x: 0.38, y: 0.96 }],
      lowerContinuous: false,
      apexContinuous: false
    }
  };
  const cfg = configs[normalizedKey];
  if (!cfg) return null;
  const template = [
    {
      p: { x: 0, y: 0 },
      prev: { x: -0.35, y: 0 },
      next: { x: cfg.lowerHandles[0].x, y: cfg.lowerHandles[0].y },
      continuous: true,
      other: false
    },
    {
      p: { ...cfg.lower1 },
      prev: { x: Math.max(0, cfg.lower1.x - 0.24), y: Math.max(0, cfg.lower1.y - 0.045) },
      next: { ...cfg.lowerHandles[1] },
      continuous: cfg.lowerContinuous !== false,
      other: false
    },
    {
      p: { ...cfg.apex },
      prev: { x: cfg.apex.x, y: cfg.apex.y - cfg.apexHandle },
      next: { x: cfg.apex.x, y: cfg.apex.y + cfg.apexHandle },
      continuous: cfg.apexContinuous !== false,
      other: false
    },
    {
      p: { ...cfg.upper1 },
      prev: { ...cfg.upperHandles[0] },
      next: { ...cfg.upperHandles[1] },
      continuous: true,
      other: false
    },
    {
      p: { x: 0, y: 1 },
      prev: { x: 0.36, y: 1 },
      next: { x: -0.35, y: 1 },
      continuous: true,
      other: false
    }
  ];
  alignSyntheticRailUpperDeckTangent(template);
  railTemplateCache.set(cacheKey, template);
  return template;
}

function railTemplateSplineNormalized(mode) {
  const key = normalizeRailModeKey(mode);
  if (key === "5050") return synthetic5050TemplateSpline();
  if (key === "6040") return longboard6040TemplateSpline();
  if (key === "boxy") return shortboardTailBoxyTemplateSpline() || syntheticRailTemplateSpline(key);
  if (key === "7030" || key === "8020" || key === "egg" || key === "full-soft" || key === "boxy" || key === "down" || key === "pinched" || key === "knifey" || key === "chine" || key === "tucked-edge" || key === "hard-edge") return syntheticRailTemplateSpline(key);
  return null;
}

function railTemplateNormalized(mode) {
  const key = normalizeRailModeKey(mode);
  if (key === "5050") return [
    { x: 0.0, y: 0.0, half: "lower" },
    { x: 0.18, y: 0.005, half: "lower" },
    { x: 0.40, y: 0.035, half: "lower" },
    { x: 0.64, y: 0.105, half: "lower" },
    { x: 0.86, y: 0.28, half: "lower" },
    { x: 1.0, y: 0.50, half: "rail" },
    { x: 0.86, y: 0.72, half: "upper" },
    { x: 0.64, y: 0.895, half: "upper" },
    { x: 0.40, y: 0.965, half: "upper" },
    { x: 0.18, y: 0.995, half: "upper" },
    { x: 0.0, y: 1.0, half: "upper" }
  ];
  if (key === "6040") return longboard6040Template() || [
    { x: 0.0, y: 0.0, half: "lower" },
    { x: 0.30, y: 0.015, half: "lower" },
    { x: 0.62, y: 0.10, half: "lower" },
    { x: 0.88, y: 0.28, half: "lower" },
    { x: 1.0, y: 0.43, half: "rail" },
    { x: 0.84, y: 0.62, half: "upper" },
    { x: 0.56, y: 0.83, half: "upper" },
    { x: 0.26, y: 0.96, half: "upper" },
    { x: 0.0, y: 1.0, half: "upper" }
  ];
  if (key === "8020") return [
    { x: 0.0, y: 0.0, half: "lower" },
    { x: 0.34, y: 0.0, half: "lower" },
    { x: 0.70, y: 0.05, half: "lower" },
    { x: 0.92, y: 0.18, half: "lower" },
    { x: 1.0, y: 0.30, half: "rail" },
    { x: 0.84, y: 0.54, half: "upper" },
    { x: 0.54, y: 0.80, half: "upper" },
    { x: 0.22, y: 0.95, half: "upper" },
    { x: 0.0, y: 1.0, half: "upper" }
  ];
  if (key === "down") return [
    { x: 0.0, y: 0.0, half: "lower" },
    { x: 0.38, y: 0.0, half: "lower" },
    { x: 0.74, y: 0.04, half: "lower" },
    { x: 0.94, y: 0.16, half: "lower" },
    { x: 1.0, y: 0.24, half: "rail" },
    { x: 0.84, y: 0.50, half: "upper" },
    { x: 0.52, y: 0.79, half: "upper" },
    { x: 0.20, y: 0.95, half: "upper" },
    { x: 0.0, y: 1.0, half: "upper" }
  ];
  if (key === "pinched") return [
    { x: 0.0, y: 0.0, half: "lower" },
    { x: 0.24, y: 0.02, half: "lower" },
    { x: 0.54, y: 0.12, half: "lower" },
    { x: 0.84, y: 0.28, half: "lower" },
    { x: 1.0, y: 0.40, half: "rail" },
    { x: 0.86, y: 0.55, half: "upper" },
    { x: 0.60, y: 0.78, half: "upper" },
    { x: 0.30, y: 0.94, half: "upper" },
    { x: 0.0, y: 1.0, half: "upper" }
  ];
  return null;
}

function railProfilePointsForMode(baseSpline, halfWidth, thickness, mode, strength = 1) {
  const key = normalizeRailModeKey(mode);
  const template = railTemplateNormalized(key);
  if (!template) return null;
  const w = Math.max(0.01, halfWidth);
  const t = Math.max(0.01, thickness);
  const s = clampNumber(strength, 0, 1, 1);
  if (s <= 1e-6) return null;
  return template.map(point => {
    const sampleX = clampNumber(point.x * w, 0, w, 0);
    const targetY = clampNumber(point.y * t, 0, t, 0);
    const baseY = point.half === "upper"
      ? boardCadSplineValueAtReverse(baseSpline, sampleX)
      : boardCadSplineValueAt(baseSpline, sampleX);
    return {
      x: sampleX,
      y: lerp(baseY, targetY, s),
      half: point.half
    };
  });
}

function sanitizeRailSplineKnots(knots) {
  if (!Array.isArray(knots) || knots.length < 2) return Array.isArray(knots) ? knots : [];
  const sanitized = knots.map(knot => ({
    ...knot,
    p: { ...knot.p },
    prev: { ...knot.prev },
    next: { ...knot.next }
  }));
  for (let i = 0; i < sanitized.length - 1; i += 1) {
    const start = sanitized[i];
    const end = sanitized[i + 1];
    const minX = Math.min(start.p.x, end.p.x);
    const maxX = Math.max(start.p.x, end.p.x);
    const minY = Math.min(start.p.y, end.p.y);
    const maxY = Math.max(start.p.y, end.p.y);
    start.next.x = clampNumber(start.next.x, minX, maxX, start.next.x);
    end.prev.x = clampNumber(end.prev.x, minX, maxX, end.prev.x);
    start.next.y = clampNumber(start.next.y, minY, maxY, start.next.y);
    end.prev.y = clampNumber(end.prev.y, minY, maxY, end.prev.y);
    const dx = end.p.x - start.p.x;
    const dy = end.p.y - start.p.y;
    const segmentLen = Math.hypot(dx, dy);
    if (segmentLen <= 1e-9) {
      start.next = { ...start.p };
      end.prev = { ...end.p };
      continue;
    }
    const maxHandleLen = segmentLen * 0.48;
    const clampHandleLen = (anchor, handle) => {
      const hx = handle.x - anchor.x;
      const hy = handle.y - anchor.y;
      const len = Math.hypot(hx, hy);
      if (len <= maxHandleLen) return handle;
      const scale = maxHandleLen / len;
      return {
        x: anchor.x + (hx * scale),
        y: anchor.y + (hy * scale)
      };
    };
    start.next = clampHandleLen(start.p, start.next);
    end.prev = clampHandleLen(end.p, end.prev);
  }
  sanitized[0].prev = { ...sanitized[0].p };
  sanitized[sanitized.length - 1].next = { ...sanitized[sanitized.length - 1].p };
  return sanitized;
}

function sanitizeKnotHandleReflex(knot) {
  if (!knot?.p || !knot?.prev || !knot?.next) return;
  const prevVec = { x: knot.prev.x - knot.p.x, y: knot.prev.y - knot.p.y };
  const nextVec = { x: knot.next.x - knot.p.x, y: knot.next.y - knot.p.y };
  const prevLen = Math.hypot(prevVec.x, prevVec.y);
  const nextLen = Math.hypot(nextVec.x, nextVec.y);
  if (prevLen <= 1e-9 || nextLen <= 1e-9) return;
  const prevAngle = Math.atan2(prevVec.y, prevVec.x);
  const nextAngle = Math.atan2(nextVec.y, nextVec.x);
  let delta = nextAngle - prevAngle;
  while (delta < 0) delta += Math.PI * 2;
  while (delta >= Math.PI * 2) delta -= Math.PI * 2;
  if (delta <= Math.PI) return;
  if (prevLen <= nextLen) {
    knot.prev = {
      x: knot.p.x - (nextVec.x / nextLen) * prevLen,
      y: knot.p.y - (nextVec.y / nextLen) * prevLen
    };
  } else {
    knot.next = {
      x: knot.p.x - (prevVec.x / prevLen) * nextLen,
      y: knot.p.y - (prevVec.y / prevLen) * nextLen
    };
  }
}

function sanitizeKnotPathReversal(prevKnot, knot, nextKnot) {
  if (!knot?.p) return;
  if (prevKnot?.p && knot.prev) {
    const segVec = { x: prevKnot.p.x - knot.p.x, y: prevKnot.p.y - knot.p.y };
    const segLen = Math.hypot(segVec.x, segVec.y);
    const handleVec = { x: knot.prev.x - knot.p.x, y: knot.prev.y - knot.p.y };
    const handleLen = Math.hypot(handleVec.x, handleVec.y);
    if (segLen > 1e-9 && handleLen > 1e-9) {
      const dot = (segVec.x * handleVec.x) + (segVec.y * handleVec.y);
      if (dot <= 0) {
        const ux = segVec.x / segLen;
        const uy = segVec.y / segLen;
        const len = Math.min(handleLen, segLen * 0.48);
        knot.prev = {
          x: knot.p.x + (ux * len),
          y: knot.p.y + (uy * len)
        };
      }
    }
  }
  if (nextKnot?.p && knot.next) {
    const segVec = { x: nextKnot.p.x - knot.p.x, y: nextKnot.p.y - knot.p.y };
    const segLen = Math.hypot(segVec.x, segVec.y);
    const handleVec = { x: knot.next.x - knot.p.x, y: knot.next.y - knot.p.y };
    const handleLen = Math.hypot(handleVec.x, handleVec.y);
    if (segLen > 1e-9 && handleLen > 1e-9) {
      const dot = (segVec.x * handleVec.x) + (segVec.y * handleVec.y);
      if (dot <= 0) {
        const ux = segVec.x / segLen;
        const uy = segVec.y / segLen;
        const len = Math.min(handleLen, segLen * 0.48);
        knot.next = {
          x: knot.p.x + (ux * len),
          y: knot.p.y + (uy * len)
        };
      }
    }
  }
}

function sanitizeRailSectionHandles(knots) {
  if (!Array.isArray(knots) || knots.length < 3) return knots;
  const railX = knots.reduce((max, knot) => Math.max(max, Number(knot?.p?.x) || 0), 0);
  for (let i = 1; i < knots.length - 1; i += 1) {
    sanitizeKnotPathReversal(knots[i - 1], knots[i], knots[i + 1]);
    sanitizeKnotHandleReflex(knots[i]);
  }
  if (railX > 0) {
    knots.forEach(knot => {
      if (knot?.prev) knot.prev.x = Math.min(railX, knot.prev.x);
      if (knot?.next) knot.next.x = Math.min(railX, knot.next.x);
    });
  }
  return knots;
}

function deformRailSplineFromProfile(baseSpline, profilePoints, strength = 1, mode = "") {
  if (!Array.isArray(baseSpline) || !baseSpline.length || !Array.isArray(profilePoints) || profilePoints.length < 2) {
    return Array.isArray(baseSpline) ? boardCadCloneKnots(baseSpline) : [];
  }
  const s = clampNumber(strength, 0, 1, 1);
  if (s <= 1e-6) return boardCadCloneKnots(baseSpline);
  const result = boardCadCloneKnots(baseSpline);
  const key = normalizeRailModeKey(mode);
  const deformSpec = railModeDeformSpec(key);
  const baseRailIndex = result.reduce((best, knot, index) => knot.p.x > result[best].p.x ? index : best, 0);
  const apex = result[baseRailIndex];
  const sourceApex = baseSpline[baseRailIndex];
  if (!apex || !sourceApex) return result;
  const lower1Index = baseRailIndex - 1;
  const upper1Index = baseRailIndex + 1;
  const lower1 = lower1Index >= 0 ? result[lower1Index] : null;
  const upper1 = upper1Index < result.length ? result[upper1Index] : null;
  const sourceLower1 = lower1Index >= 0 ? baseSpline[lower1Index] : null;
  const sourceUpper1 = upper1Index < baseSpline.length ? baseSpline[upper1Index] : null;
  const sectionThickness = thicknessForSection(baseSpline);
  const profileRailIndex = profilePoints.reduce((best, point, index) => point.x > profilePoints[best].x ? index : best, 0);
  const profileTargetY = Number.isFinite(profilePoints?.[profileRailIndex]?.y)
    ? profilePoints[profileRailIndex].y
    : sourceApex.p.y;
  const ratioTargetY = deformSpec
    ? clampNumber(sectionThickness * deformSpec.apexRatio, 0.05, sectionThickness - 0.05, sourceApex.p.y)
    : profileTargetY;
  const targetApexY = key === "5050"
    ? clampNumber(profileTargetY, 0.05, sectionThickness - 0.05, profileTargetY)
    : deformSpec
      ? lerp(profileTargetY, ratioTargetY, 0.82)
      : profileTargetY;
  apex.p = {
    x: sourceApex.p.x,
    y: lerp(sourceApex.p.y, targetApexY, s)
  };
  const lowerDy = lower1 ? Math.max(0.05, apex.p.y - lower1.p.y) : Math.max(0.05, sourceApex.p.y);
  const upperDy = upper1 ? Math.max(0.05, upper1.p.y - apex.p.y) : Math.max(0.05, sectionThickness - sourceApex.p.y);
  const apexPrevLen = Math.max(0.05, lerp(
    Math.hypot(sourceApex.prev.x - sourceApex.p.x, sourceApex.prev.y - sourceApex.p.y),
    lowerDy * (deformSpec?.apexPrevScale ?? 0.62),
    s
  ));
  const apexNextLen = Math.max(0.05, lerp(
    Math.hypot(sourceApex.next.x - sourceApex.p.x, sourceApex.next.y - sourceApex.p.y),
    upperDy * (deformSpec?.apexNextScale ?? 0.62),
    s
  ));
  apex.prev = { x: apex.p.x, y: apex.p.y - apexPrevLen };
  apex.next = { x: apex.p.x, y: apex.p.y + apexNextLen };

  if (key === "5050" || key === "6040") {
    if (key === "6040") {
      apex.p.y = sourceApex.p.y + ((apex.p.y - sourceApex.p.y) * 0.92);
    }
    const meanLen = (apexPrevLen + apexNextLen) * 0.5;
    const prevLen = key === "5050" ? meanLen : lerp(meanLen, apexPrevLen, 0.65);
    const nextLen = key === "5050" ? meanLen : lerp(meanLen, apexNextLen, 0.65);
    apex.prev = { x: apex.p.x, y: apex.p.y - prevLen };
    apex.next = { x: apex.p.x, y: apex.p.y + nextLen };
  }

  const applyInnerHandle = (knot, sourceKnot, branch) => {
    if (!knot || !sourceKnot) return;
    const dx = Math.max(0.05, apex.p.x - knot.p.x);
    const dy = branch === "lower"
      ? Math.max(0.05, apex.p.y - knot.p.y)
      : Math.max(0.05, knot.p.y - apex.p.y);
    const dist = Math.hypot(dx, dy);
    const towardHandle = branch === "lower" ? sourceKnot.next : sourceKnot.prev;
    const awayHandle = branch === "lower" ? sourceKnot.prev : sourceKnot.next;
    const ux = dx / dist;
    const uy = (branch === "lower" ? dy : -dy) / dist;
    const towardLenSource = Math.abs(projectedHandleLengthOnAxis(towardHandle, sourceKnot.p, ux, uy))
      || Math.hypot(towardHandle.x - sourceKnot.p.x, towardHandle.y - sourceKnot.p.y);
    const awayLenSource = Math.abs(projectedHandleLengthOnAxis(awayHandle, sourceKnot.p, -ux, -uy))
      || Math.hypot(awayHandle.x - sourceKnot.p.x, awayHandle.y - sourceKnot.p.y);
    const towardLen = Math.max(0.05, Math.min(
      dist * 0.7,
      lerp(towardLenSource, dist * (deformSpec?.innerTowardScale ?? 0.58), s)
    ));
    const awayLen = Math.max(0.05, Math.min(
      dist * 0.7,
      lerp(awayLenSource, dist * (deformSpec?.innerAwayScale ?? 0.88), s * 0.65)
    ));
    if (branch === "lower") {
      knot.next = {
        x: knot.p.x + (ux * towardLen),
        y: knot.p.y + (uy * towardLen)
      };
      knot.prev = {
        x: knot.p.x - (ux * awayLen),
        y: knot.p.y - (uy * awayLen)
      };
    } else {
      knot.prev = {
        x: knot.p.x + (ux * towardLen),
        y: knot.p.y - (uy * towardLen)
      };
      knot.next = {
        x: knot.p.x - (ux * awayLen),
        y: knot.p.y + (uy * awayLen)
      };
    }
    if (key === "5050" || key === "6040") {
      const towardKey = branch === "lower" ? "next" : "prev";
      const awayKey = branch === "lower" ? "prev" : "next";
      const tangent = {
        x: knot[towardKey].x - knot.p.x,
        y: knot[towardKey].y - knot.p.y
      };
      const tangentLen = Math.hypot(tangent.x, tangent.y);
      if (tangentLen > 1e-9) {
        const ux2 = tangent.x / tangentLen;
        const uy2 = tangent.y / tangentLen;
        const lockedAwayLen = Math.min(
          Math.hypot(knot[awayKey].x - knot.p.x, knot[awayKey].y - knot.p.y),
          towardLen * (key === "5050" ? 1.0 : 1.18)
        );
        knot[awayKey] = {
          x: knot.p.x - (ux2 * lockedAwayLen),
          y: knot.p.y - (uy2 * lockedAwayLen)
        };
      }
    }
  };
  applyInnerHandle(lower1, sourceLower1, "lower");
  applyInnerHandle(upper1, sourceUpper1, "upper");

  const lower2 = lower1Index - 1 >= 0 ? result[lower1Index - 1] : null;
  const upper2 = upper1Index + 1 < result.length ? result[upper1Index + 1] : null;
  const sourceLower2 = lower1Index - 1 >= 0 ? baseSpline[lower1Index - 1] : null;
  const sourceUpper2 = upper1Index + 1 < baseSpline.length ? baseSpline[upper1Index + 1] : null;

  if (lower1 && sourceLower1) {
    const tangent = localTangentUnit(lower2?.p, lower1.p, apex.p);
    const prevLen = Math.abs(projectedHandleLengthOnAxis(sourceLower1.prev, sourceLower1.p, -tangent.x, -tangent.y))
      || Math.hypot(sourceLower1.prev.x - sourceLower1.p.x, sourceLower1.prev.y - sourceLower1.p.y);
    const nextLen = Math.abs(projectedHandleLengthOnAxis(sourceLower1.next, sourceLower1.p, tangent.x, tangent.y))
      || Math.hypot(sourceLower1.next.x - sourceLower1.p.x, sourceLower1.next.y - sourceLower1.p.y);
    const prevScale = key === "5050" ? 0.72 : 0.82;
    const nextScale = deformSpec?.innerTowardScale ?? 0.58;
    setKnotHandlesOnAxis(
      lower1,
      tangent.x,
      tangent.y,
      lerp(prevLen, Math.hypot(apex.p.x - lower1.p.x, apex.p.y - lower1.p.y) * prevScale, s * 0.75),
      lerp(nextLen, Math.hypot(apex.p.x - lower1.p.x, apex.p.y - lower1.p.y) * nextScale, s)
    );
  }

  if (upper1 && sourceUpper1) {
    const tangent = localTangentUnit(apex.p, upper1.p, upper2?.p);
    const prevLen = Math.abs(projectedHandleLengthOnAxis(sourceUpper1.prev, sourceUpper1.p, -tangent.x, -tangent.y))
      || Math.hypot(sourceUpper1.prev.x - sourceUpper1.p.x, sourceUpper1.prev.y - sourceUpper1.p.y);
    const nextLen = Math.abs(projectedHandleLengthOnAxis(sourceUpper1.next, sourceUpper1.p, tangent.x, tangent.y))
      || Math.hypot(sourceUpper1.next.x - sourceUpper1.p.x, sourceUpper1.next.y - sourceUpper1.p.y);
    const prevScale = deformSpec?.innerTowardScale ?? 0.58;
    const nextScale = key === "5050" ? 0.72 : 0.82;
    setKnotHandlesOnAxis(
      upper1,
      tangent.x,
      tangent.y,
      lerp(prevLen, Math.hypot(apex.p.x - upper1.p.x, apex.p.y - upper1.p.y) * prevScale, s),
      lerp(nextLen, Math.hypot(apex.p.x - upper1.p.x, apex.p.y - upper1.p.y) * nextScale, s * 0.75)
    );
  }

  if (key === "5050" && lower1 && upper1) harmonize5050RailCluster(apex, lower1, upper1, lower2, upper2);
  if (key === "6040" && lower1 && upper1) harmonize6040RailCluster(apex, lower1, upper1, lower2, upper2);

  // Keep deck-side control point positions from dropping below the source profile.
  // We still allow handle reshaping, but the deck-side knot coordinates themselves
  // should not move downward when applying rail presets.
  for (let i = baseRailIndex + 1; i < result.length; i += 1) {
    const sourceKnot = baseSpline[i];
    const knot = result[i];
    if (!sourceKnot?.p || !knot?.p) continue;
    if (knot.p.y < sourceKnot.p.y) {
      knot.p.y = sourceKnot.p.y;
    }
  }

  for (let i = 1; i < result.length - 1; i += 1) {
    sanitizeKnotPathReversal(result[i - 1], result[i], result[i + 1]);
    sanitizeKnotHandleReflex(result[i]);
    sanitizeKnotPathReversal(result[i - 1], result[i], result[i + 1]);
  }
  return result;
}

function thicknessForSection(knots) {
  return Math.max(0.01, boardCadCrossSectionCenterThickness(knots));
}

function projectedHandleLengthOnAxis(handlePoint, anchorPoint, axisX, axisY) {
  if (!handlePoint || !anchorPoint) return 0;
  return ((handlePoint.x - anchorPoint.x) * axisX) + ((handlePoint.y - anchorPoint.y) * axisY);
}

function localTangentUnit(prevPoint, point, nextPoint) {
  if (!point) return { x: 1, y: 0 };
  const vx = (nextPoint?.x ?? point.x) - (prevPoint?.x ?? point.x);
  const vy = (nextPoint?.y ?? point.y) - (prevPoint?.y ?? point.y);
  const len = Math.hypot(vx, vy);
  if (len <= 1e-9) return { x: 1, y: 0 };
  return { x: vx / len, y: vy / len };
}

function setKnotHandlesOnAxis(knot, axisX, axisY, prevLen, nextLen) {
  if (!knot?.p) return;
  knot.prev = {
    x: knot.p.x - (axisX * Math.max(0.05, prevLen)),
    y: knot.p.y - (axisY * Math.max(0.05, prevLen))
  };
  knot.next = {
    x: knot.p.x + (axisX * Math.max(0.05, nextLen)),
    y: knot.p.y + (axisY * Math.max(0.05, nextLen))
  };
}

function harmonizeRailCluster(apex, lower1, upper1, lower2, upper2, options = {}) {
  if (!apex || !lower1 || !upper1) return;
  const apexPrevFactor = Number.isFinite(options.apexPrevFactor) ? options.apexPrevFactor : 0.52;
  const apexNextFactor = Number.isFinite(options.apexNextFactor) ? options.apexNextFactor : apexPrevFactor;
  const lowerPrevFactor = Number.isFinite(options.lowerPrevFactor) ? options.lowerPrevFactor : 0.34;
  const lowerNextFactor = Number.isFinite(options.lowerNextFactor) ? options.lowerNextFactor : lowerPrevFactor;
  const upperPrevFactor = Number.isFinite(options.upperPrevFactor) ? options.upperPrevFactor : lowerNextFactor;
  const upperNextFactor = Number.isFinite(options.upperNextFactor) ? options.upperNextFactor : lowerPrevFactor;
  const lowerSpan = Math.hypot(apex.p.x - lower1.p.x, apex.p.y - lower1.p.y);
  const upperSpan = Math.hypot(apex.p.x - upper1.p.x, apex.p.y - upper1.p.y);
  const span = Math.max(0.05, Math.min(lowerSpan, upperSpan));
  apex.prev = { x: apex.p.x, y: apex.p.y - (span * apexPrevFactor) };
  apex.next = { x: apex.p.x, y: apex.p.y + (span * apexNextFactor) };
  const lowerTangent = localTangentUnit(lower2?.p, lower1.p, apex.p);
  const upperTangent = localTangentUnit(apex.p, upper1.p, upper2?.p);
  setKnotHandlesOnAxis(lower1, lowerTangent.x, lowerTangent.y, span * lowerPrevFactor, span * lowerNextFactor);
  setKnotHandlesOnAxis(upper1, upperTangent.x, upperTangent.y, span * upperPrevFactor, span * upperNextFactor);
}

function harmonize5050RailCluster(apex, lower1, upper1, lower2, upper2) {
  harmonizeRailCluster(apex, lower1, upper1, lower2, upper2, {
    apexPrevFactor: 0.48,
    apexNextFactor: 0.7423416,
    lowerPrevFactor: 0.31,
    lowerNextFactor: 0.31,
    upperPrevFactor: 0.31,
    upperNextFactor: 0.31
  });
}

function harmonize6040RailCluster(apex, lower1, upper1, lower2, upper2) {
  harmonizeRailCluster(apex, lower1, upper1, lower2, upper2, {
    apexPrevFactor: 0.50,
    apexNextFactor: 0.44,
    lowerPrevFactor: 0.36,
    lowerNextFactor: 0.32,
    upperPrevFactor: 0.32,
    upperNextFactor: 0.38
  });
}

function railBandGuideGeometry(knots, mode) {
  const spec = railModeSpec(mode);
  if (!spec || !Array.isArray(knots) || !knots.length) return null;
  const key = normalizeRailModeKey(mode);
  const halfWidth = Math.max(0.01, boardCadCrossSectionWidth(knots) / 2);
  const thickness = Math.max(0.01, boardCadCrossSectionCenterThickness(knots));
  const inchScaled = valueInches => {
    if (!Number.isFinite(valueInches)) return null;
    return Math.min(halfWidth * 0.96, Math.max(0.02, thickness * (valueInches / 2.5)));
  };
  const tuckInset = inchScaled(spec.tuckInches) ?? (halfWidth * 0.12);
  const railMarkY = clampNumber(inchScaled(spec.railMarkInches), thickness * 0.14, thickness * 0.82, thickness * 0.5);
  const deckMarks = (spec.deckMarksInches || [])
    .map(value => inchScaled(value))
    .filter(value => Number.isFinite(value) && value > 0.04 && value < halfWidth * 0.98);
  const bottomMarks = (key === "5050"
    ? (spec.bottomMarksInches || spec.deckMarksInches || [])
    : [spec.tuckInches]
  )
    .map(value => inchScaled(value))
    .filter(value => Number.isFinite(value) && value > 0.04 && value < halfWidth * 0.98);
  const mirrored = point => ({ x: -point.x, y: point.y });
  const mirrorLine = linePts => [mirrored(linePts[1]), mirrored(linePts[0])];
  const upperCurveYAtInset = inset => {
    const sampleX = clampNumber(halfWidth - inset, 0, halfWidth, halfWidth);
    return clampNumber(
      boardCadSplineValueAtReverse(knots, sampleX),
      0,
      thickness,
      thickness
    );
  };
  const lowerCurveYAtInset = inset => {
    const sampleX = clampNumber(halfWidth - inset, 0, halfWidth, halfWidth);
    return clampNumber(
      boardCadSplineValueAt(knots, sampleX),
      0,
      thickness,
      0
    );
  };
  const midpoint = linePts => ({
    x: (linePts[0].x + linePts[1].x) * 0.5,
    y: (linePts[0].y + linePts[1].y) * 0.5
  });
  const railMark = { x: halfWidth, y: railMarkY };
  const buildRecursiveBands = (marks, yAtInset) => {
    const bands = [];
    let target = railMark;
    marks.slice(0, 3).forEach(mark => {
      const line = [
        { x: halfWidth - mark, y: yAtInset(mark) },
        { x: target.x, y: target.y }
      ];
      bands.push(line);
      target = midpoint(line);
    });
    return bands;
  };
  const rightDeckBands = buildRecursiveBands(deckMarks, upperCurveYAtInset);
  const rightBottomBands = key === "5050"
    ? buildRecursiveBands(bottomMarks, lowerCurveYAtInset)
    : bottomMarks.slice(0, 1).map(mark => [
      { x: halfWidth - mark, y: lowerCurveYAtInset(mark) },
      railMark
    ]);
  return {
    primary: rightBottomBands.flatMap(linePts => [linePts, mirrorLine(linePts)]),
    bottomBands: rightBottomBands.flatMap(linePts => [linePts, mirrorLine(linePts)]),
    deckBands: rightDeckBands.flatMap(linePts => [linePts, mirrorLine(linePts)]),
    railMarkY,
    tuckInset,
    railMark,
    rightDeckBands,
    rightBottomBands
  };
}

function drawRailBandGuides(knots, transform, mode) {
  const geometry = railBandGuideGeometry(knots, mode);
  if (!geometry) return;
  const drawGuide = (points, color, dash = [6, 6], width = 1) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    drawPath(points, transform, color, width);
    ctx.restore();
  };
  const bottomBands = Array.isArray(geometry.bottomBands) ? geometry.bottomBands : geometry.primary;
  bottomBands.forEach(points => drawGuide(points, "rgba(255, 105, 180, 0.85)", [5, 5], 1.1));
  geometry.deckBands.forEach((points, index) => {
    const color = index < 2
      ? "rgba(64, 196, 255, 0.82)"
      : "rgba(92, 214, 141, 0.82)";
    drawGuide(points, color, [7, 5], 1);
  });
  ctx.setLineDash([]);
}

function cloneSectionRailBaseSpline(section) {
  return Array.isArray(section?.railBaseSpline)
    ? boardCadCloneKnots(section.railBaseSpline)
    : null;
}

function stashSectionRailBaseSpline(section) {
  if (!section || Array.isArray(section.railBaseSpline)) return;
  section.railBaseSpline = boardCadCloneKnots(section.spline || []);
}

function restoreSectionRailBaseSpline(section, dropStash = false) {
  if (!section || !Array.isArray(section.railBaseSpline)) return false;
  section.spline = boardCadCloneKnots(section.railBaseSpline);
  if (dropStash) delete section.railBaseSpline;
  return true;
}

function boardForRailBaseInterpolation(board) {
  if (!board || !Array.isArray(board.sections)) return board;
  const hasRailBase = board.sections.some(section => Array.isArray(section?.railBaseSpline));
  if (!hasRailBase) return board;
  return {
    ...board,
    sections: board.sections.map(section => ({
      ...section,
      spline: Array.isArray(section?.railBaseSpline)
        ? boardCadCloneKnots(section.railBaseSpline)
        : boardCadCloneKnots(section?.spline || [])
    }))
  };
}

function applyRailModeToSection(section, mode, strength = 1) {
  if (!section?.spline?.length) return;
  const key = normalizeRailModeKey(mode);
  if (!key) {
    restoreSectionRailBaseSpline(section, true);
    return;
  }
  stashSectionRailBaseSpline(section);
  const baseSpline = cloneSectionRailBaseSpline(section) || boardCadCloneKnots(section.spline);
  const s = clampNumber(strength, 0, 1, 1);
  if (s <= 1e-6) {
    section.spline = boardCadCloneKnots(baseSpline);
    return;
  }
  const halfWidth = Math.max(0.01, boardCadCrossSectionWidth(baseSpline) / 2);
  const thickness = Math.max(0.01, boardCadCrossSectionCenterThickness(baseSpline));
  const templateSpline = railTemplateSplineNormalized(key);
  if (Array.isArray(templateSpline) && templateSpline.length) {
    const scaledTemplate = scaleNormalizedTemplateSpline(templateSpline, halfWidth, thickness);
    if (Array.isArray(scaledTemplate) && scaledTemplate.length === baseSpline.length) {
      section.spline = sanitizeRailSectionHandles(baseSpline.map((knot, index) => boardCadLerpKnot(knot, scaledTemplate[index], s)));
      return;
    }
    if (Array.isArray(scaledTemplate) && s >= 0.999) {
      section.spline = sanitizeRailSectionHandles(scaledTemplate);
      return;
    }
  }
  const profile = railProfilePointsForMode(baseSpline, halfWidth, thickness, key, 1);
  if (!profile) return;
  section.spline = sanitizeRailSectionHandles(deformRailSplineFromProfile(baseSpline, profile, s, key));
}

function applyEdgeModeToSection(section, type, strength = 1) {
  if (!section?.spline?.length) return;
  const key = normalizeEdgeTypeKey(type);
  const s = clampNumber(strength, 0, 1, 0);
  if (!key || s <= 1e-6) return;
  const knots = section.spline;
  const railIndex = knots.reduce((best, knot, index) => (
    Number(knot?.p?.x) > Number(knots[best]?.p?.x) ? index : best
  ), 0);
  const lowerIndex = railIndex - 1;
  const lowerInnerIndex = lowerIndex - 1;
  const upperIndex = railIndex + 1;
  if (lowerIndex < 1 || upperIndex >= knots.length) return;
  const apex = knots[railIndex];
  const lower = knots[lowerIndex];
  const lowerInner = knots[lowerInnerIndex];
  const upper = knots[upperIndex];
  if (!apex?.p || !lower?.p || !lowerInner?.p || !upper?.p) return;
  const halfWidth = Math.max(0.01, boardCadCrossSectionWidth(knots) / 2);
  const thickness = Math.max(0.01, boardCadCrossSectionCenterThickness(knots));
  const typeFactor = key === "hard" ? 1 : key === "tucked" ? 0.7 : 0.35;
  const amount = clampNumber(s * typeFactor, 0, 1, 0);
  const tuckedY = lowerInner.p.y + thickness * (key === "soft" ? 0.045 : key === "tucked" ? 0.018 : 0.004);
  const edgeX = apex.p.x - Math.max(halfWidth * (key === "hard" ? 0.045 : key === "tucked" ? 0.07 : 0.1), 0.015);
  const lowerTargetY = lerp(lower.p.y, tuckedY, amount);
  const lowerTargetX = lerp(lower.p.x, edgeX, amount * (key === "soft" ? 0.45 : 0.8));
  const lowerDx = lowerTargetX - lower.p.x;
  const lowerDy = lowerTargetY - lower.p.y;
  translatePoint(lower.p, lowerDx, lowerDy);
  translatePoint(lower.prev, lowerDx, lowerDy);
  translatePoint(lower.next, lowerDx, lowerDy);
  const prevLen = Math.max(0.01, Math.hypot(lower.p.x - lowerInner.p.x, lower.p.y - lowerInner.p.y) * (key === "soft" ? 0.34 : 0.22));
  const nextLen = Math.max(0.01, Math.hypot(apex.p.x - lower.p.x, apex.p.y - lower.p.y) * (key === "hard" ? 0.18 : 0.3));
  lower.prev = {
    x: lerp(lower.prev.x, lower.p.x - prevLen, amount),
    y: lerp(lower.prev.y, lower.p.y, amount)
  };
  lower.next = {
    x: lerp(lower.next.x, lower.p.x + nextLen, amount),
    y: lerp(lower.next.y, lower.p.y + thickness * (key === "soft" ? 0.025 : 0.008), amount)
  };
  const apexPrevLen = Math.max(0.01, Math.hypot(apex.p.x - lower.p.x, apex.p.y - lower.p.y) * (key === "hard" ? 0.16 : 0.25));
  apex.prev = {
    x: lerp(apex.prev.x, apex.p.x - apexPrevLen, amount),
    y: lerp(apex.prev.y, apex.p.y - thickness * (key === "hard" ? 0.01 : 0.02), amount)
  };
  if (key === "hard") {
    lower.continuous = false;
    apex.continuous = false;
  } else if (key === "tucked") {
    lower.continuous = false;
  }
  [lowerInnerIndex, lowerIndex, railIndex, upperIndex].forEach(index => {
    sanitizeKnotPathReversal(knots[index - 1], knots[index], knots[index + 1]);
    sanitizeKnotHandleReflex(knots[index]);
  });
}

function applyBoardRailAndEdgeToSection(board, section) {
  if (!board || !section?.spline?.length) return;
  const baseSpline = cloneSectionRailBaseSpline(section);
  if (baseSpline) section.spline = baseSpline;
  const railMode = normalizeRailModeKey(board.railMode);
  const railStrength = clampNumber(board.railStrength, 0, 1, 1);
  const edgeConfig = normalizedEdgeConfig(board);
  const edgeStrength = edgeEffectAtSection(board, section, edgeConfig);
  if (railMode) {
    applyRailModeToSection(section, railMode, railStrength);
  } else if (edgeStrength > 1e-6) {
    stashSectionRailBaseSpline(section);
  } else if (baseSpline) {
    restoreSectionRailBaseSpline(section, true);
  }
  if (edgeStrength > 1e-6) applyEdgeModeToSection(section, edgeConfig.type, edgeStrength);
}

function updateTailWidthAdjustReadout(value) {
  if (!els.tailWidthAdjustReadout) return;
  els.tailWidthAdjustReadout.textContent = `${widthAdjustPercent(value)}%`;
}

function updateNoseWidthAdjustReadout(value) {
  if (!els.noseWidthAdjustReadout) return;
  els.noseWidthAdjustReadout.textContent = `${widthAdjustPercent(value)}%`;
}

function updateTailPanelFields() {
  const boardActive = !!state.board;
  const mode = normalizeTailModeKey(els.tailMode?.value || state.board?.tailMode || "");
  if (els.tailDepth) {
    els.tailDepth.disabled = !boardActive || !tailModeUsesDepth(mode);
  }
  if (els.tailShoulderPos) els.tailShoulderPos.disabled = !boardActive || !mode;
  if (els.tailShoulderScale) els.tailShoulderScale.disabled = !boardActive || !mode;
  if (els.tailRailBlend) els.tailRailBlend.disabled = !boardActive || !mode;
  if (els.tailWidthAdjust) els.tailWidthAdjust.disabled = !boardActive || !mode;
  updateTailWidthAdjustReadout(els.tailWidthAdjust?.value || state.board?.tailWidthAdjust || 0);
}

function updateNosePanelFields() {
  const boardActive = !!state.board;
  const mode = normalizeNoseModeKey(els.noseMode?.value || state.board?.noseMode || "");
  const enabled = boardActive && !!mode;
  if (els.noseLength) els.noseLength.disabled = !enabled;
  if (els.noseShoulderPos) els.noseShoulderPos.disabled = !enabled;
  if (els.noseShoulderScale) els.noseShoulderScale.disabled = !enabled;
  if (els.noseRailBlend) els.noseRailBlend.disabled = !enabled;
  if (els.noseWidthAdjust) els.noseWidthAdjust.disabled = !enabled;
  updateNoseWidthAdjustReadout(els.noseWidthAdjust?.value || state.board?.noseWidthAdjust || 0);
}

function updateWingPanelFields() {
  const boardActive = !!state.board;
  const presetKey = normalizeWingPresetKey(els.wingPreset?.value || state.board?.wingPreset || "");
  const enabled = boardActive && !!presetKey;
  const bumpShape = (normalizeWingShapeKey(els.wingShape?.value || state.board?.wingShape || "") || "bump") === "bump";
  if (els.wingPosition) els.wingPosition.disabled = !enabled;
  if (els.wingWidth) els.wingWidth.disabled = !enabled;
  if (els.wingShape) els.wingShape.disabled = !enabled;
  if (els.wingShoulder) els.wingShoulder.disabled = !enabled || !bumpShape;
  if (els.wingTransition) els.wingTransition.disabled = !enabled || !bumpShape;
}

function updateRailPanelFields() {
  const boardActive = !!state.board;
  if (els.railMode) els.railMode.disabled = !boardActive;
  if (els.railStrength) els.railStrength.disabled = !boardActive;
  if (els.setRailButton) els.setRailButton.disabled = !boardActive;
}

function updateEdgePanelFields() {
  const boardActive = !!state.board;
  const type = normalizeEdgeTypeKey(els.edgeType?.value || state.board?.edgeType || "");
  const enabled = boardActive && !!type;
  if (els.edgeType) els.edgeType.disabled = !boardActive;
  if (els.edgeStrength) els.edgeStrength.disabled = !enabled;
  if (els.edgeLength) els.edgeLength.disabled = !enabled;
  if (els.edgeFade) els.edgeFade.disabled = !enabled;
  if (els.setEdgeButton) els.setEdgeButton.disabled = !boardActive;
}

function setTailFromPanel() {
  if (!state.board) return;
  const before = cloneBoard(state.board);
  const mode = normalizeTailModeKey(els.tailMode?.value || "");
  const preset = tailPresetForBoard(mode, state.board) || { length: 0, depth: 0, shoulderPos: 0, shoulderScale: 0, railBlend: 0 };
  state.board.tailMode = mode;
  state.board.tailLength = mode ? clampNumber(els.tailLength?.value, 0.5, Math.max(1, state.board.length * 0.25), preset.length) : 0;
  state.board.tailDepth = tailModeUsesDepth(mode)
    ? clampNumber(els.tailDepth?.value, 0.2, Math.max(0.2, state.board.tailLength * 0.95), preset.depth)
    : 0;
  state.board.tailShoulderPos = mode ? clampNumber(els.tailShoulderPos?.value, 0.12, 0.88, preset.shoulderPos) : 0;
  state.board.tailShoulderScale = mode ? clampNumber(els.tailShoulderScale?.value, 0.05, 1.35, preset.shoulderScale) : 0;
  state.board.tailRailBlend = mode ? clampNumber(els.tailRailBlend?.value, 0, 2.5, preset.railBlend) : 0;
  state.board.tailLinearization = 0;
  state.board.tailWidthAdjust = mode ? clampNumber(els.tailWidthAdjust?.value, -1, 1, 0) : 0;
  commitBoardMutation(before);
  if (mode) {
    setStatus("status_tail_shape_applied", {
      shape: tailModeLabel(mode),
      length: fmt(state.board.tailLength),
      depthPart: tailModeUsesDepth(mode) ? t("tail_depth_part", { depth: fmt(state.board.tailDepth) }) : "",
      shoulder: fmt(state.board.tailShoulderPos),
      width: fmt(state.board.tailShoulderScale),
      blend: fmt(state.board.tailRailBlend),
      widthAdjust: widthAdjustPercent(state.board.tailWidthAdjust)
    });
  } else {
    setStatus("status_tail_shape_reset");
  }
}

function setNoseFromPanel() {
  if (!state.board) return;
  const before = cloneBoard(state.board);
  const mode = normalizeNoseModeKey(els.noseMode?.value || "");
  const preset = nosePresetForBoard(mode, state.board) || { length: 0, shoulderPos: 0, shoulderScale: 0, railBlend: 0, linearization: 0 };
  state.board.noseMode = mode;
  state.board.noseLength = mode ? clampNumber(els.noseLength?.value, 0.5, Math.max(1, state.board.length * 0.25), preset.length) : 0;
  state.board.noseShoulderPos = mode ? clampNumber(els.noseShoulderPos?.value, 0.12, 0.88, preset.shoulderPos) : 0;
  state.board.noseShoulderScale = mode ? clampNumber(els.noseShoulderScale?.value, 0.05, 1.35, preset.shoulderScale) : 0;
  state.board.noseRailBlend = mode ? clampNumber(els.noseRailBlend?.value, 0, 2.5, preset.railBlend) : 0;
  state.board.noseLinearization = 0;
  state.board.noseWidthAdjust = mode ? clampNumber(els.noseWidthAdjust?.value, -1, 1, 0) : 0;
  commitBoardMutation(before);
  if (mode) {
    setStatus("status_nose_shape_applied", {
      shape: noseModeLabel(mode),
      length: fmt(state.board.noseLength),
      shoulder: fmt(state.board.noseShoulderPos),
      width: fmt(state.board.noseShoulderScale),
      blend: fmt(state.board.noseRailBlend),
      widthAdjust: widthAdjustPercent(state.board.noseWidthAdjust)
    });
  } else {
    setStatus("status_nose_shape_reset");
  }
}

function setWingFromPanel() {
  if (!state.board) return;
  const before = cloneBoard(state.board);
  const presetKey = normalizeWingPresetKey(els.wingPreset?.value || "");
  const rawHalf = rawOutlineHalfPoints(state.board);
  const preset = presetKey && presetKey !== "custom"
    ? wingPresetForBoard(presetKey, state.board, rawHalf)
    : null;
  const active = !!presetKey;
  const rawShape = normalizeWingShapeKey(els.wingShape?.value) || preset?.shape || "bump";
  const rawDistance = active
    ? clampNumber(els.wingPosition?.value, 2, Math.max(2, state.board.length - 1), preset?.distance ?? Math.min(Math.max(24, state.board.length * 0.16), Math.max(2, state.board.length - 1)))
    : 0;
  const maxInset = active ? wingMaxInsetAt(rawHalf, rawDistance) : 0;
  state.board.wingPreset = active ? presetKey : "";
  state.board.wingPosition = active ? rawDistance : 0;
  state.board.wingWidth = active
    ? clampNumber(els.wingWidth?.value, 0.1, maxInset, Math.min(preset?.width ?? 1.5, maxInset))
    : 0;
  state.board.wingShape = active ? rawShape : "";
  state.board.wingShoulder = active && rawShape === "bump"
    ? clampNumber(els.wingShoulder?.value, 0, 0.75, preset?.shoulder ?? 0.22)
    : 0;
  state.board.wingTransition = active && rawShape === "bump"
    ? clampNumber(els.wingTransition?.value, 0.25, 2.5, preset?.transition ?? 1)
    : 0;
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  commitBoardMutation(before);
  if (active) {
    setStatus("status_wing_applied", {
      preset: wingPresetLabel(state.board.wingPreset || "custom"),
      position: fmt(state.board.wingPosition),
      width: fmt(state.board.wingWidth),
      shape: wingShapeLabel(state.board.wingShape),
      bumpPart: rawShape === "bump"
        ? t("wing_bump_part", {
            shoulder: fmt(state.board.wingShoulder),
            transition: fmt(state.board.wingTransition)
          })
        : ""
    });
  } else {
    setStatus("status_wing_disabled");
  }
}

function setRailFromPanel() {
  if (!state.board || !Array.isArray(state.board.sections)) return;
  const before = cloneBoard(state.board);
  const mode = normalizeRailModeKey(els.railMode?.value || "");
  const strength = clampNumber(els.railStrength?.value, 0, 1, Number(state.board.railStrength) || 1);
  state.board.railMode = mode;
  state.board.railStrength = strength;
  state.board.sections.forEach(section => {
    applyBoardRailAndEdgeToSection(state.board, section);
  });
  commitBoardMutation(before);
  if (mode) {
    setStatus("status_rail_applied", {
      shape: railModeLabel(mode),
      strength: fmt(strength)
    });
  } else {
    setStatus("status_rail_reset");
  }
}

function setEdgeFromPanel() {
  if (!state.board || !Array.isArray(state.board.sections)) return;
  const before = cloneBoard(state.board);
  const type = normalizeEdgeTypeKey(els.edgeType?.value || "");
  const defaultLength = Math.max(0, (Number(state.board.length) || 0) * 0.38);
  const strength = type ? clampNumber(els.edgeStrength?.value, 0, 1, Number(state.board.edgeStrength) || 1) : 0;
  const length = type ? clampNumber(els.edgeLength?.value, 0, Number(state.board.length) || defaultLength, Number(state.board.edgeLength) || defaultLength) : 0;
  const fade = type ? clampNumber(els.edgeFade?.value, 0, length, Number(state.board.edgeFade) || Math.min(length * 0.35, (Number(state.board.length) || 0) * 0.12)) : 0;
  state.board.edgeType = type;
  state.board.edgeStrength = strength;
  state.board.edgeLength = length;
  state.board.edgeFade = fade;
  state.board.sections.forEach(section => {
    applyBoardRailAndEdgeToSection(state.board, section);
  });
  commitBoardMutation(before);
  if (type) {
    setStatus("status_edge_applied", {
      type: edgeTypeLabel(type),
      strength: fmt(strength),
      length: fmt(length),
      fade: fmt(fade)
    });
  } else {
    setStatus("status_edge_reset");
  }
}

function bottomFeatureLabel(type) {
  const key = normalizeBottomFeatureType(type);
  if (key === "single-concave") return t("bottom_type_single_concave");
  if (key === "double-concave") return t("bottom_type_double_concave");
  if (key === "vee") return t("bottom_type_vee");
  if (key === "spiral-vee") return t("bottom_type_spiral_vee");
  if (key === "hull") return t("bottom_type_hull");
  if (key === "displacement-hull") return t("bottom_type_displacement_hull");
  if (key === "channel") return t("bottom_type_channel");
  return t("none");
}

function bottomPresetLabel(key) {
  if (key === "displacement-hull") return t("bottom_preset_displacement_hull");
  if (key === "longboard-rolled-vee") return t("bottom_preset_longboard_rolled_vee");
  if (key === "shortboard-single-to-double") return t("bottom_preset_shortboard_single_to_double");
  if (key === "shortboard-single-to-vee") return t("bottom_preset_shortboard_single_to_vee");
  if (key === "performance-channel-quad") return t("bottom_preset_performance_channel_quad");
  return t("custom");
}

function normalizeBottomPresetKey(value) {
  const key = String(value || "").trim().toLowerCase();
  return BOTTOM_PRESET_KEYS.includes(key) ? key : "custom";
}

function bottomPresetContext(board = state.board) {
  const length = Math.max(1, Number(board?.length) || 0);
  const width = Math.max(1, Number(board?.width) || 0);
  const lengthT = clamp01((length - 185) / 115);
  const widthT = clamp01((width - 48) / 12);
  return {
    length,
    width,
    lengthT,
    widthT,
    shortness: 1 - lengthT,
    narrowness: 1 - widthT,
    longness: lengthT,
    wideness: widthT
  };
}

function bottomPresetFeatures(key, board = state.board) {
  if (!board) return [];
  const preset = normalizeBottomPresetKey(key);
  const { length, width, shortness, narrowness, longness, wideness } = bottomPresetContext(board);
  const feature = (type, overrides = {}, index = 0) => ({
    ...bottomFeatureDefault(type, index, length, width),
    ...overrides
  });
  const presetFeatures = features => normalizeBottomFeatures(features);
  if (preset === "displacement-hull") {
    return presetFeatures([
      feature("displacement-hull", {
        start: 0,
        peak: length * (0.7 + (longness * 0.02)),
        end: length * (0.95 + (longness * 0.015)),
        depth: 0.11 + (shortness * 0.03) + (narrowness * 0.01),
        railDepth: 0.12 + (longness * 0.03),
        width: Math.min(1, 0.9 - (narrowness * 0.04)),
        blend: 1.08 + (longness * 0.1),
        power: 2.15 + (longness * 0.25)
      }, 0)
    ]);
  }
  if (preset === "longboard-rolled-vee") {
    return presetFeatures([
      feature("hull", {
        start: length * (0.07 + (longness * 0.015)),
        peak: length * (0.24 + (longness * 0.03)),
        end: length * (0.48 + (longness * 0.06)),
        depth: 0.08 + (narrowness * 0.015),
        width: Math.min(1, 0.98 - (narrowness * 0.04)),
        blend: 1.05 + (longness * 0.08),
        power: 2.05 + (longness * 0.15)
      }, 0),
      feature("vee", {
        start: length * (0.56 - (longness * 0.04)),
        peak: length * (0.78 + (longness * 0.04)),
        end: length,
        depth: 0.1 + (narrowness * 0.02) + (shortness * 0.015),
        width: 1,
        blend: 1.05 + (longness * 0.08),
        power: 1.12 + (longness * 0.12)
      }, 1)
    ]);
  }
  if (preset === "shortboard-single-to-double") {
    return presetFeatures([
      feature("single-concave", {
        start: length * (0.17 + (longness * 0.02)),
        peak: length * (0.46 + (longness * 0.03)),
        end: length * (0.68 + (longness * 0.03)),
        depth: 0.16 + (shortness * 0.04) + (narrowness * 0.02),
        width: 0.8 - (narrowness * 0.08),
        blend: 0.96 + (longness * 0.06),
        power: 1.82 + (shortness * 0.12)
      }, 0),
      feature("double-concave", {
        start: length * (0.49 + (longness * 0.02)),
        peak: length * (0.73 + (longness * 0.02)),
        end: length,
        centerDepth: 0.05 + (shortness * 0.015),
        railDepth: 0.16 + (shortness * 0.03) + (narrowness * 0.015),
        width: 0.7 - (narrowness * 0.05),
        offset: 0.42 + (wideness * 0.02),
        blend: 0.98 + (longness * 0.04),
        power: 1.62 + (shortness * 0.1)
      }, 1)
    ]);
  }
  if (preset === "shortboard-single-to-vee") {
    return presetFeatures([
      feature("single-concave", {
        start: length * (0.17 + (longness * 0.02)),
        peak: length * (0.48 + (longness * 0.03)),
        end: length * (0.7 + (longness * 0.03)),
        depth: 0.15 + (shortness * 0.04) + (narrowness * 0.02),
        width: 0.8 - (narrowness * 0.06),
        blend: 0.96 + (longness * 0.06),
        power: 1.78 + (shortness * 0.12)
      }, 0),
      feature("vee", {
        start: length * (0.55 + (longness * 0.02)),
        peak: length * (0.82 + (longness * 0.02)),
        end: length,
        depth: 0.1 + (shortness * 0.02) + (narrowness * 0.015),
        width: 1,
        blend: 1.02 + (longness * 0.05),
        power: 1.08 + (shortness * 0.08)
      }, 1)
    ]);
  }
  if (preset === "performance-channel-quad") {
    return presetFeatures([
      feature("single-concave", {
        start: length * (0.17 + (longness * 0.015)),
        peak: length * (0.42 + (longness * 0.025)),
        end: length * (0.6 + (longness * 0.025)),
        depth: 0.15 + (shortness * 0.03) + (narrowness * 0.015),
        width: 0.78 - (narrowness * 0.06),
        blend: 0.92 + (longness * 0.05),
        power: 1.82 + (shortness * 0.12)
      }, 0),
      feature("double-concave", {
        start: length * (0.47 + (longness * 0.015)),
        peak: length * (0.67 + (longness * 0.015)),
        end: length * (0.83 + (longness * 0.015)),
        centerDepth: 0.05 + (shortness * 0.015),
        railDepth: 0.14 + (shortness * 0.03) + (narrowness * 0.015),
        width: 0.68 - (narrowness * 0.04),
        offset: 0.42 + (wideness * 0.015),
        blend: 0.98 + (longness * 0.04),
        power: 1.58 + (shortness * 0.1)
      }, 1),
      feature("channel", {
        start: length * (0.69 + (longness * 0.01)),
        peak: length * (0.87 + (longness * 0.01)),
        end: length,
        railDepth: 0.1 + (shortness * 0.025) + (narrowness * 0.012),
        width: 0.14 - (narrowness * 0.02),
        offset: 0.57 + (wideness * 0.02),
        spacing: 0.06 + (wideness * 0.015),
        count: width < 50 ? 2 : 3,
        blend: 1.02 + (longness * 0.05),
        power: 1.22 + (shortness * 0.08)
      }, 2)
    ]);
  }
  return normalizeBottomFeatures(board.bottomFeatures || []);
}

function syncBottomPresetPanel() {
  if (!els.bottomFeaturePreset) return;
  els.bottomFeaturePreset.value = normalizeBottomPresetKey(state.board?.bottomPreset);
}

function markBottomPresetCustom(board = state.board) {
  if (!board) return;
  board.bottomPreset = "custom";
  syncBottomPresetPanel();
}

function bottomFeatureMetaText(feature) {
  const type = normalizeBottomFeatureType(feature?.type);
  const parts = [];
  if (type === "double-concave") {
    parts.push(t("bottom_feature_meta_center_rail", {
      center: fmt(feature.centerDepth),
      rail: fmt(feature.railDepth)
    }));
  } else if (type === "channel") {
    parts.push(t("bottom_feature_meta_rail", { rail: fmt(feature.railDepth) }));
    parts.push(t("bottom_feature_meta_spacing_count", {
      spacing: fmt(feature.spacing),
      count: String(feature.count)
    }));
    parts.push(t("bottom_feature_meta_longitudinal", { value: fmt(feature.longitudinalFlat) }));
  } else {
    parts.push(t("bottom_feature_meta_depth", { value: fmt(feature.depth) }));
  }
  parts.push(t("bottom_feature_meta_width", { value: fmt(feature.width) }));
  if (Number.isFinite(Number(feature.edge)) && Number(feature.edge) > 0) {
    parts.push(t("bottom_feature_meta_edge", { value: fmt(feature.edge) }));
  }
  if (type === "double-concave" || type === "channel" || type === "spiral-vee") {
    parts.push(t("bottom_feature_meta_offset", { value: fmt(feature.offset) }));
  }
  return parts.join(" / ");
}

function bottomFeatureSelectionIndex() {
  const index = Math.round(Number(els.bottomFeatureIndex?.value));
  if (!Number.isFinite(index) || index < 0) return -1;
  const count = Array.isArray(state.board?.bottomFeatures) ? state.board.bottomFeatures.length : 0;
  return index < count ? index : -1;
}

function currentBottomFeature() {
  const index = bottomFeatureSelectionIndex();
  if (!state.board || index < 0) return null;
  return normalizeBottomFeature(state.board.bottomFeatures[index], index);
}

function activeBottomFeatureCount(features = state.board?.bottomFeatures) {
  return normalizeBottomFeatures(features).filter(feature => feature.enabled !== false).length;
}

function selectedBottomFeaturePreview(board = state.board) {
  if (!board || board !== state.board) return currentBottomFeature();
  const index = bottomFeatureSelectionIndex();
  if (index < 0) {
    return normalizeBottomFeatures(board.bottomFeatures).length ? null : readBottomFeatureFromPanel(-1);
  }
  const features = normalizeBottomFeatures(board.bottomFeatures);
  if (index >= features.length) return null;
  return readBottomFeatureFromPanel(index);
}

function bottomFeatureAffectedSections(board, feature = selectedBottomFeaturePreview(board)) {
  const sections = Array.isArray(board?.sections) ? board.sections : [];
  if (!board || !feature || feature.enabled === false) {
    return {
      feature: feature || null,
      sections: [],
      affectedCount: 0,
      first: null,
      last: null,
      rangeLabel: "-"
    };
  }
  const affected = sections
    .map((section, index) => ({
      section,
      index,
      envelope: bottomFeatureEnvelopeAt(feature, section?.position)
    }))
    .filter(item => item.section?.spline?.length && item.envelope > 1e-3);
  const first = affected[0] || null;
  const last = affected[affected.length - 1] || null;
  return {
    feature,
    sections: affected,
    affectedCount: affected.length,
    first,
    last,
    rangeLabel: first && last ? `${fmt(first.section.position)}-${fmt(last.section.position)}` : "-"
  };
}

function updateBottomFeatureSummary(feature = currentBottomFeature(), selectedIndex = bottomFeatureSelectionIndex()) {
  if (!els.bottomFeatureSummary) return;
  if (!feature || !state.board) {
    els.bottomFeatureSummary.textContent = t("bottom_feature_none");
    return;
  }
  const affected = bottomFeatureAffectedSections(state.board, feature);
  els.bottomFeatureSummary.textContent = t("bottom_feature_summary", {
    count: String(normalizeBottomFeatures(state.board?.bottomFeatures).length),
    activeCount: String(activeBottomFeatureCount(state.board?.bottomFeatures)),
    preset: bottomPresetLabel(state.board?.bottomPreset),
    selected: t("bottom_feature_selected", {
      index: String(selectedIndex + 1),
      label: bottomFeatureLabel(feature.type)
    }),
    affectedCount: String(affected.affectedCount),
    range: affected.rangeLabel
  });
}

function bottomFeatureListItemMarkup(feature, index) {
  const meta = [
    `${fmt(feature.start)}-${fmt(feature.peak)}-${fmt(feature.end)}`,
    bottomFeatureMetaText(feature),
    feature.enabled === false ? "off" : "on"
  ].join(" / ");
  return `<span class="bottom-feature-item"><strong>${index + 1}. ${bottomFeatureLabel(feature.type)}</strong><span class="meta">${meta}</span></span>`;
}

function syncBottomFeatureIndexOptions(selectedIndex = bottomFeatureSelectionIndex()) {
  if (!els.bottomFeatureIndex) return;
  const features = normalizeBottomFeatures(state.board?.bottomFeatures);
  els.bottomFeatureIndex.innerHTML = "";
  const noneOption = document.createElement("option");
  noneOption.value = "-1";
  noneOption.textContent = t("none");
  els.bottomFeatureIndex.appendChild(noneOption);
  features.forEach((feature, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${bottomFeatureLabel(feature.type)}`;
    els.bottomFeatureIndex.appendChild(option);
  });
  els.bottomFeatureIndex.value = String((selectedIndex >= 0 && selectedIndex < features.length) ? selectedIndex : (features.length ? 0 : -1));
}

function syncBottomFeatureList(selectedIndex = bottomFeatureSelectionIndex()) {
  if (!els.bottomFeatureList) return;
  const features = normalizeBottomFeatures(state.board?.bottomFeatures);
  els.bottomFeatureList.innerHTML = "";
  if (!features.length) {
    els.bottomFeatureList.textContent = t("bottom_feature_none");
    return;
  }
  features.forEach((feature, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `guide-list-item${index === selectedIndex ? " active" : ""}`;
    button.dataset.bottomFeatureIndex = String(index);
    button.addEventListener("click", () => syncBottomFeaturePanel(index));
    button.innerHTML = bottomFeatureListItemMarkup(feature, index);
    els.bottomFeatureList.appendChild(button);
  });
}

function syncBottomFeatureListSelection(selectedIndex = bottomFeatureSelectionIndex(), featureOverride = null) {
  if (!els.bottomFeatureList) return;
  const buttons = Array.from(els.bottomFeatureList.querySelectorAll("[data-bottom-feature-index]"));
  buttons.forEach(button => {
    const index = Number(button.dataset.bottomFeatureIndex);
    button.classList.toggle("active", index === selectedIndex);
    if (index === selectedIndex) {
      const feature = featureOverride || normalizeBottomFeature(state.board?.bottomFeatures?.[index], index);
      if (feature) button.innerHTML = bottomFeatureListItemMarkup(feature, index);
    }
  });
}

function syncBottomFeatureFormFields(feature) {
  if (!feature) return;
  if (els.bottomFeatureEnabled) els.bottomFeatureEnabled.checked = feature.enabled !== false;
  if (els.bottomFeatureType) els.bottomFeatureType.value = feature.type;
  if (els.bottomFeatureStart) els.bottomFeatureStart.value = fmt(feature.start);
  if (els.bottomFeaturePeak) els.bottomFeaturePeak.value = fmt(feature.peak);
  if (els.bottomFeatureEnd) els.bottomFeatureEnd.value = fmt(feature.end);
  if (els.bottomFeatureDepth) els.bottomFeatureDepth.value = fmt(feature.depth);
  if (els.bottomFeatureCenterDepth) els.bottomFeatureCenterDepth.value = fmt(feature.centerDepth);
  if (els.bottomFeatureRailDepth) els.bottomFeatureRailDepth.value = fmt(feature.railDepth);
  if (els.bottomFeatureRailLockCm) els.bottomFeatureRailLockCm.value = fmt(feature.railLockCm);
  if (els.bottomFeatureWidth) els.bottomFeatureWidth.value = fmt(feature.width);
  if (els.bottomFeatureBlend) els.bottomFeatureBlend.value = fmt(feature.blend);
  if (els.bottomFeaturePower) els.bottomFeaturePower.value = fmt(feature.power);
  if (els.bottomFeatureEdge) els.bottomFeatureEdge.value = fmt(feature.edge);
  if (els.bottomFeatureOffset) els.bottomFeatureOffset.value = fmt(feature.offset);
  if (els.bottomFeatureSpacing) els.bottomFeatureSpacing.value = fmt(feature.spacing);
  if (els.bottomFeatureCount) els.bottomFeatureCount.value = String(feature.count);
  if (els.bottomFeatureLongitudinalFlat) els.bottomFeatureLongitudinalFlat.value = fmt(feature.longitudinalFlat);
}

function applyBottomFeatureTypeDefaults(type, preserveRange = false) {
  if (!els.bottomFeatureType) return;
  const index = Math.max(0, bottomFeatureSelectionIndex());
  const defaults = bottomFeatureDefault(type, index, state.board?.length, state.board?.width);
  const current = preserveRange ? {
    start: Number(els.bottomFeatureStart?.value),
    peak: Number(els.bottomFeaturePeak?.value),
    end: Number(els.bottomFeatureEnd?.value)
  } : null;
  els.bottomFeatureType.value = defaults.type;
  if (els.bottomFeatureStart) els.bottomFeatureStart.value = fmt(Number.isFinite(current?.start) ? current.start : defaults.start);
  if (els.bottomFeaturePeak) els.bottomFeaturePeak.value = fmt(Number.isFinite(current?.peak) ? current.peak : defaults.peak);
  if (els.bottomFeatureEnd) els.bottomFeatureEnd.value = fmt(Number.isFinite(current?.end) ? current.end : defaults.end);
  if (els.bottomFeatureDepth) els.bottomFeatureDepth.value = fmt(defaults.depth);
  if (els.bottomFeatureCenterDepth) els.bottomFeatureCenterDepth.value = fmt(defaults.centerDepth);
  if (els.bottomFeatureRailDepth) els.bottomFeatureRailDepth.value = fmt(defaults.railDepth);
  if (els.bottomFeatureRailLockCm) els.bottomFeatureRailLockCm.value = fmt(defaults.railLockCm);
  if (els.bottomFeatureWidth) els.bottomFeatureWidth.value = fmt(defaults.width);
  if (els.bottomFeatureBlend) els.bottomFeatureBlend.value = fmt(defaults.blend);
  if (els.bottomFeaturePower) els.bottomFeaturePower.value = fmt(defaults.power);
  if (els.bottomFeatureEdge) els.bottomFeatureEdge.value = fmt(defaults.edge);
  if (els.bottomFeatureOffset) els.bottomFeatureOffset.value = fmt(defaults.offset);
  if (els.bottomFeatureSpacing) els.bottomFeatureSpacing.value = fmt(defaults.spacing);
  if (els.bottomFeatureCount) els.bottomFeatureCount.value = String(defaults.count);
  if (els.bottomFeatureLongitudinalFlat) els.bottomFeatureLongitudinalFlat.value = fmt(defaults.longitudinalFlat);
}

function applyBottomPresetFromPanel() {
  if (!state.board) return;
  const presetKey = normalizeBottomPresetKey(els.bottomFeaturePreset?.value);
  if (!presetKey || presetKey === "custom") return;
  const before = cloneBoard(state.board);
  state.board.bottomPreset = presetKey;
  state.board.bottomFeatures = bottomPresetFeatures(presetKey, state.board);
  rebuildBoardBottomFeatureSections(state.board);
  commitBoardMutation(before, { redraw: false });
  syncBottomPresetPanel();
  syncBottomFeaturePanel(0);
  draw();
  setStatus("status_bottom_feature_updated", { label: bottomPresetLabel(presetKey) });
}

function syncBottomFeaturePanel(selectedIndex = bottomFeatureSelectionIndex(), options = {}) {
  const persistCurrent = options.persistCurrent !== false;
  const currentIndex = bottomFeatureSelectionIndex();
  if (persistCurrent && state.board && Number.isInteger(currentIndex) && currentIndex >= 0 && selectedIndex !== currentIndex) {
    persistBottomFeaturePanelSelection(currentIndex);
  }
  syncBottomPresetPanel();
  syncBottomFeatureIndexOptions(selectedIndex);
  if (els.bottomFeatureIndex) els.bottomFeatureIndex.dataset.previousIndex = String(bottomFeatureSelectionIndex());
  syncBottomFeatureList(selectedIndex);
  const feature = currentBottomFeature();
  if (!feature) {
    applyBottomFeatureTypeDefaults(normalizeBottomFeatureType(els.bottomFeatureType?.value) || "single-concave");
    if (els.bottomFeatureEnabled) els.bottomFeatureEnabled.checked = true;
    updateBottomFeatureSummary(null);
    updateBottomPanelFields();
    return;
  }
  syncBottomFeatureFormFields(feature);
  updateBottomFeatureSummary(feature, selectedIndex);
  updateBottomPanelFields();
}

function updateBottomPanelFields() {
  const boardActive = !!state.board;
  const hasSelection = !!currentBottomFeature();
  const selectedIndex = bottomFeatureSelectionIndex();
  const featureCount = normalizeBottomFeatures(state.board?.bottomFeatures).length;
  const presetKey = normalizeBottomPresetKey(els.bottomFeaturePreset?.value);
  const type = normalizeBottomFeatureType(els.bottomFeatureType?.value) || "single-concave";
  const spec = bottomFeatureTypeSpec(type);
  const visible = spec?.visibleFields || {};
  const setNumericInputSpec = (el, field, fallbackMin, fallbackMax, fallbackStep) => {
    if (!el) return;
    const [min, max, step] = bottomFeatureLimit(type, field, fallbackMin, fallbackMax, fallbackStep);
    el.min = String(min);
    el.max = String(max);
    el.step = String(step);
  };
  const setFieldVisibility = (el, isVisible) => {
    if (!el) return;
    if (el.parentElement) el.parentElement.hidden = !isVisible;
    el.dataset.fieldVisible = isVisible ? "1" : "0";
  };
  const fieldIsVisible = el => !!el && el.dataset.fieldVisible !== "0";
  if (els.bottomFeaturePreset) els.bottomFeaturePreset.disabled = !boardActive;
  if (els.bottomFeatureIndex) els.bottomFeatureIndex.disabled = !boardActive;
  if (els.bottomFeatureEnabled) els.bottomFeatureEnabled.disabled = !boardActive || !hasSelection;
  [
    els.bottomFeatureType, els.bottomFeatureStart, els.bottomFeaturePeak, els.bottomFeatureEnd,
    els.bottomFeatureRailLockCm, els.bottomFeatureWidth, els.bottomFeatureBlend, els.bottomFeaturePower, els.bottomFeatureEdge
  ].forEach(el => {
    if (el) el.disabled = !boardActive;
  });
  setFieldVisibility(els.bottomFeatureDepth, visible.depth !== false);
  setFieldVisibility(els.bottomFeatureCenterDepth, visible.centerDepth === true);
  setFieldVisibility(els.bottomFeatureRailDepth, visible.railDepth === true);
  setFieldVisibility(els.bottomFeatureEdge, visible.edge === true);
  setFieldVisibility(els.bottomFeatureOffset, visible.offset === true);
  setFieldVisibility(els.bottomFeatureSpacing, visible.spacing === true);
  setFieldVisibility(els.bottomFeatureCount, visible.count === true);
  setFieldVisibility(els.bottomFeatureLongitudinalFlat, visible.longitudinalFlat === true);
  if (els.bottomFeatureDepth) els.bottomFeatureDepth.disabled = !boardActive || !fieldIsVisible(els.bottomFeatureDepth);
  if (els.bottomFeatureCenterDepth) els.bottomFeatureCenterDepth.disabled = !boardActive || !fieldIsVisible(els.bottomFeatureCenterDepth);
  if (els.bottomFeatureRailDepth) els.bottomFeatureRailDepth.disabled = !boardActive || !fieldIsVisible(els.bottomFeatureRailDepth);
  if (els.bottomFeatureEdge) els.bottomFeatureEdge.disabled = !boardActive || !fieldIsVisible(els.bottomFeatureEdge);
  if (els.bottomFeatureOffset) els.bottomFeatureOffset.disabled = !boardActive || !fieldIsVisible(els.bottomFeatureOffset);
  if (els.bottomFeatureSpacing) els.bottomFeatureSpacing.disabled = !boardActive || !fieldIsVisible(els.bottomFeatureSpacing);
  if (els.bottomFeatureCount) els.bottomFeatureCount.disabled = !boardActive || !fieldIsVisible(els.bottomFeatureCount);
  if (els.bottomFeatureLongitudinalFlat) els.bottomFeatureLongitudinalFlat.disabled = !boardActive || !fieldIsVisible(els.bottomFeatureLongitudinalFlat);
  if (els.bottomFeatureRailLockCm) els.bottomFeatureRailLockCm.disabled = !boardActive;
  setNumericInputSpec(els.bottomFeatureDepth, "depth", 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01);
  setNumericInputSpec(els.bottomFeatureCenterDepth, "centerDepth", 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01);
  setNumericInputSpec(els.bottomFeatureRailDepth, "railDepth", 0, BOTTOM_FEATURE_DEPTH_MAX, 0.01);
  setNumericInputSpec(els.bottomFeatureRailLockCm, "railLockCm", 0, BOTTOM_FEATURE_RAIL_LOCK_CM_MAX, 0.5);
  setNumericInputSpec(els.bottomFeatureWidth, "width", 0.05, 1, 0.01);
  setNumericInputSpec(els.bottomFeatureBlend, "blend", 0.1, 4, 0.05);
  setNumericInputSpec(els.bottomFeaturePower, "power", 0.4, 4, 0.05);
  setNumericInputSpec(els.bottomFeatureEdge, "edge", 0, 1, 0.05);
  setNumericInputSpec(els.bottomFeatureOffset, "offset", 0, 0.95, 0.01);
  setNumericInputSpec(els.bottomFeatureSpacing, "spacing", 0, 0.5, 0.01);
  setNumericInputSpec(els.bottomFeatureCount, "count", 1, 10, 1);
  setNumericInputSpec(els.bottomFeatureLongitudinalFlat, "longitudinalFlat", 0, 1, 0.05);
  if (els.setBottomFeatureButton) els.setBottomFeatureButton.disabled = !boardActive || !hasSelection;
  if (els.addBottomFeatureButton) els.addBottomFeatureButton.disabled = !boardActive;
  if (els.applyBottomPresetButton) els.applyBottomPresetButton.disabled = !boardActive || presetKey === "custom";
  if (els.duplicateBottomFeatureButton) els.duplicateBottomFeatureButton.disabled = !boardActive || !hasSelection;
  if (els.fillBottomFeatureSectionsButton) els.fillBottomFeatureSectionsButton.disabled = !boardActive || !hasSelection;
  if (els.removeBottomFeatureButton) els.removeBottomFeatureButton.disabled = !boardActive || !hasSelection;
  if (els.resetBottomFeatureButton) els.resetBottomFeatureButton.disabled = !boardActive || !hasSelection;
  if (els.clearBottomFeaturesButton) els.clearBottomFeaturesButton.disabled = !boardActive || featureCount === 0;
  if (els.moveBottomFeatureUpButton) els.moveBottomFeatureUpButton.disabled = !boardActive || !hasSelection || selectedIndex <= 0;
  if (els.moveBottomFeatureDownButton) els.moveBottomFeatureDownButton.disabled = !boardActive || !hasSelection || selectedIndex < 0 || selectedIndex >= featureCount - 1;
}

function readBottomFeatureFromPanel(index = bottomFeatureSelectionIndex()) {
  const type = normalizeBottomFeatureType(els.bottomFeatureType?.value) || "single-concave";
  const defaults = bottomFeatureDefault(type, Math.max(0, index), state.board?.length, state.board?.width);
  const existing = Number.isInteger(index) && index >= 0
    ? normalizeBottomFeature(state.board?.bottomFeatures?.[index], index)
    : null;
  return normalizeBottomFeature({
    id: existing?.id || defaults.id,
    type,
    enabled: !!els.bottomFeatureEnabled?.checked,
    start: clampNumber(els.bottomFeatureStart?.value, 0, Math.max(1, state.board?.length || defaults.end), defaults.start),
    peak: clampNumber(els.bottomFeaturePeak?.value, 0, Math.max(1, state.board?.length || defaults.end), defaults.peak),
    end: clampNumber(els.bottomFeatureEnd?.value, 0, Math.max(1, state.board?.length || defaults.end), defaults.end),
    depth: clampNumber(els.bottomFeatureDepth?.value, 0, BOTTOM_FEATURE_DEPTH_MAX, defaults.depth),
    centerDepth: clampNumber(els.bottomFeatureCenterDepth?.value, 0, BOTTOM_FEATURE_DEPTH_MAX, defaults.centerDepth),
    railDepth: clampNumber(els.bottomFeatureRailDepth?.value, 0, BOTTOM_FEATURE_DEPTH_MAX, defaults.railDepth),
    railLockCm: clampNumber(els.bottomFeatureRailLockCm?.value, 0, BOTTOM_FEATURE_RAIL_LOCK_CM_MAX, defaults.railLockCm),
    width: clampNumber(els.bottomFeatureWidth?.value, 0.05, 1, defaults.width),
    blend: clampNumber(els.bottomFeatureBlend?.value, 0.1, 4, defaults.blend),
    power: clampNumber(els.bottomFeaturePower?.value, 0.4, 4, defaults.power),
    edge: clampNumber(els.bottomFeatureEdge?.value, 0, 1, defaults.edge),
    offset: clampNumber(els.bottomFeatureOffset?.value, 0, 0.95, defaults.offset),
    spacing: clampNumber(els.bottomFeatureSpacing?.value, 0, 0.5, defaults.spacing),
    count: clampNumber(els.bottomFeatureCount?.value, 1, 10, defaults.count),
    longitudinalFlat: clampNumber(els.bottomFeatureLongitudinalFlat?.value, 0, 1, defaults.longitudinalFlat),
  }, Math.max(0, index));
}

function persistBottomFeaturePanelSelection(index = bottomFeatureSelectionIndex()) {
  if (!state.board) return null;
  const features = normalizeBottomFeatures(state.board.bottomFeatures);
  if (!Number.isInteger(index) || index < 0 || index >= features.length) return null;
  const nextFeature = readBottomFeatureFromPanel(index);
  if (!nextFeature) return null;
  const previousFeature = normalizeBottomFeature(features[index], index);
  const changed = JSON.stringify(previousFeature) !== JSON.stringify(nextFeature);
  if (changed) {
    markBottomPresetCustom(state.board);
    features[index] = nextFeature;
    state.board.bottomFeatures = normalizeBottomFeatures(features);
    markGeometryDirty();
  }
  if (state.bottomFeatureSelection && Number(state.bottomFeatureSelection.featureIndex) === index) {
    state.bottomFeatureSelection = normalizedBottomFeatureSelection(state.bottomFeatureSelection, nextFeature);
  }
  return nextFeature;
}

function boardWithPendingBottomFeaturePreview(board) {
  if (!board || board !== state.board) return board;
  const index = bottomFeatureSelectionIndex();
  const features = normalizeBottomFeatures(board.bottomFeatures);
  if (index < 0) return board;
  if (index >= features.length) return board;
  const previewFeature = readBottomFeatureFromPanel(index);
  if (!previewFeature) return board;
  const nextFeatures = features.slice();
  nextFeatures[index] = previewFeature;
  return {
    ...board,
    bottomFeatures: normalizeBottomFeatures(nextFeatures)
  };
}

function addBottomFeatureFromPanel() {
  if (!state.board) return;
  const before = cloneBoard(state.board);
  const features = normalizeBottomFeatures(state.board.bottomFeatures);
  const nextIndex = features.length;
  const feature = readBottomFeatureFromPanel(nextIndex);
  markBottomPresetCustom(state.board);
  features.push(feature);
  state.board.bottomFeatures = distributeBottomFeatureRangesEvenly(features, state.board);
  rebuildBoardBottomFeatureSections(state.board);
  commitBoardMutation(before, { redraw: false });
  syncBottomFeaturePanel(nextIndex, { persistCurrent: false });
  draw();
  setStatus("status_bottom_feature_added", { label: bottomFeatureLabel(feature.type) });
}

function duplicateBottomFeatureFromPanel() {
  if (!state.board) return;
  const index = bottomFeatureSelectionIndex();
  if (index < 0) return;
  const before = cloneBoard(state.board);
  const features = normalizeBottomFeatures(state.board.bottomFeatures);
  const source = features[index];
  if (!source) return;
  markBottomPresetCustom(state.board);
  const duplicated = normalizeBottomFeature({
    ...source,
    id: `${source.id || "bottom"}-copy-${features.length + 1}`
  }, index + 1);
  features.splice(index + 1, 0, duplicated);
  state.board.bottomFeatures = distributeBottomFeatureRangesEvenly(features, state.board);
  rebuildBoardBottomFeatureSections(state.board);
  commitBoardMutation(before, { redraw: false });
  syncBottomFeaturePanel(index + 1, { persistCurrent: false });
  draw();
  setStatus("status_bottom_feature_added", { label: bottomFeatureLabel(duplicated.type) });
}

function setBottomFeatureFromPanel() {
  if (!state.board) return;
  const index = bottomFeatureSelectionIndex();
  if (index < 0) return;
  const before = cloneBoard(state.board);
  const features = normalizeBottomFeatures(state.board.bottomFeatures);
  markBottomPresetCustom(state.board);
  features[index] = readBottomFeatureFromPanel(index);
  state.board.bottomFeatures = normalizeBottomFeatures(features);
  rebuildBoardBottomFeatureSections(state.board);
  commitBoardMutation(before, { redraw: false });
  syncBottomFeaturePanel(index);
  draw();
  setStatus("status_bottom_feature_updated", { label: bottomFeatureLabel(features[index].type) });
}

function fillSelectedBottomFeatureSectionsFromPanel() {
  if (!state.board) return;
  const index = bottomFeatureSelectionIndex();
  if (index < 0) return;
  const interval = panelCrossSectionInterval();
  if (interval === null) return;
  const feature = readBottomFeatureFromPanel(index);
  if (!feature) return;
  const before = cloneBoard(state.board);
  const added = ensureCrossSectionsForBottomFeature(state.board, feature, { interval });
  if (!added.length) {
    setStatus("status_cross_section_panel_invalid");
    return;
  }
  const lastAdded = added[added.length - 1];
  const addedIndex = findCrossSectionIndexNear(state.board, lastAdded, 0.25);
  if (addedIndex >= 0) state.currentSectionIndex = addedIndex;
  state.selection = null;
  clearGuidePointSelection();
  state.lastEditPoint = null;
  commitBoardMutation(before, { recomputeMetrics: false });
  syncBottomFeaturePanel(index);
  setStatus("status_bottom_feature_sections_added", {
    label: bottomFeatureLabel(feature.type),
    count: String(added.length)
  });
}

function resetBottomFeatureFromPanel() {
  if (!state.board) return;
  const index = bottomFeatureSelectionIndex();
  if (index < 0) return;
  const before = cloneBoard(state.board);
  const features = normalizeBottomFeatures(state.board.bottomFeatures);
  const current = features[index];
  if (!current) return;
  markBottomPresetCustom(state.board);
  const defaults = bottomFeatureDefault(current.type, index, state.board.length, state.board.width);
  features[index] = normalizeBottomFeature({
    ...defaults,
    id: current.id || defaults.id,
    enabled: current.enabled !== false
  }, index);
  state.board.bottomFeatures = normalizeBottomFeatures(features);
  rebuildBoardBottomFeatureSections(state.board);
  commitBoardMutation(before, { redraw: false });
  syncBottomFeaturePanel(index);
  draw();
  setStatus("status_bottom_feature_updated", { label: bottomFeatureLabel(features[index].type) });
}

function clearBottomFeaturesFromPanel() {
  if (!state.board) return;
  const features = normalizeBottomFeatures(state.board.bottomFeatures);
  if (!features.length) return;
  const before = cloneBoard(state.board);
  state.board.bottomPreset = "custom";
  state.board.bottomFeatures = [];
  rebuildBoardBottomFeatureSections(state.board);
  commitBoardMutation(before);
  syncBottomFeaturePanel(-1, { persistCurrent: false });
  setStatus("status_bottom_feature_removed");
}

function removeBottomFeatureFromPanel() {
  if (!state.board) return;
  const index = bottomFeatureSelectionIndex();
  if (index < 0) return;
  const before = cloneBoard(state.board);
  const features = normalizeBottomFeatures(state.board.bottomFeatures);
  markBottomPresetCustom(state.board);
  features.splice(index, 1);
  state.board.bottomFeatures = normalizeBottomFeatures(features);
  rebuildBoardBottomFeatureSections(state.board);
  commitBoardMutation(before);
  syncBottomFeaturePanel(Math.min(index, features.length - 1), { persistCurrent: false });
  setStatus("status_bottom_feature_removed");
}

function moveBottomFeatureFromPanel(direction) {
  if (!state.board) return;
  const index = bottomFeatureSelectionIndex();
  if (index < 0) return;
  const features = normalizeBottomFeatures(state.board.bottomFeatures);
  const targetIndex = index + Math.sign(direction || 0);
  if (targetIndex < 0 || targetIndex >= features.length || targetIndex === index) return;
  const before = cloneBoard(state.board);
  markBottomPresetCustom(state.board);
  const [feature] = features.splice(index, 1);
  features.splice(targetIndex, 0, feature);
  state.board.bottomFeatures = normalizeBottomFeatures(features);
  rebuildBoardBottomFeatureSections(state.board);
  commitBoardMutation(before);
  syncBottomFeaturePanel(targetIndex);
  setStatus("status_bottom_feature_updated", { label: bottomFeatureLabel(feature.type) });
}

function applyFinSetupPreset(setup, commit = false) {
  if (!state.board) return;
  const key = finSetupKey(setup || "");
  if (!key) {
    state.board.finSetup = "";
    state.board.finExtra = [];
    if (commit) {
      updateBoardPanel();
      draw();
    }
    return;
  }
  const preset = finSetupPreset(key, state.board);
  if (!preset) return;
  const before = commit ? cloneBoard(state.board) : null;
  state.board.finSetup = key;
  state.board.finType = preset.finType;
  state.board.fins = preset.fins;
  state.board.finToeIn = preset.toeIn;
  state.board.finCant = preset.cant;
  state.board.finExtra = normalizeFinExtra(preset.extra);
  if (commit) {
    commitBoardMutation(before, { recomputeMetrics: false });
    setStatus("status_fin_setup_applied", { label: preset.label });
  } else {
    markGeometryDirty();
    updateBoardPanel();
    draw();
  }
}

function finSetupPreset(setup, board) {
  const key = finSetupKey(setup);
  const length = Number(board?.length) || 180;
  const width = Math.max(40, Number(board?.width) || boardCadMaxWidth(board) || 50);
  const x = value => Math.max(0, Math.min(length, value));
  const fallbackHalfWidth = width * 0.5;
  const halfWidthAt = pos => {
    const localWidth = board?.outline?.length ? boardCadWidthAtPos(board, x(pos)) : NaN;
    const halfWidth = Number.isFinite(localWidth) && localWidth > 0 ? localWidth * 0.5 : fallbackHalfWidth;
    return Math.max(2, halfWidth);
  };
  const railInsetY = (pos, offRailCm) => Math.max(1.5, halfWidthAt(pos) - Math.max(0, offRailCm));
  const side = (rearFromTail, frontFromTail, offRailCm, toeOffsetCm, role = "side", template = "FCSII", cant = 6) => {
    const rearX = x(rearFromTail);
    const frontX = x(frontFromTail);
    const anchorX = (rearX + frontX) * 0.5;
    const rearY = railInsetY(anchorX, offRailCm);
    const frontY = Math.max(1, rearY - Math.max(0, toeOffsetCm));
    return {
      role,
      template,
      rearX,
      rearY,
      frontX,
      frontY,
      toeIn: finToeInFromSegment(rearX, rearY, frontX, frontY),
      cant
    };
  };
  const center = (rearFromTail, frontFromTail, template = "FINBOX") => ({
    role: "center",
    template,
    rearX: x(rearFromTail),
    rearY: 0,
    frontX: x(frontFromTail),
    frontY: 0,
    toeIn: 0,
    cant: 0
  });
  const setPrimary = (primarySide, primaryCenter, label, finType = "FCSII", toeIn = NaN, cant = NaN, extra = []) => ({
    label,
    finType,
    toeIn: Number.isFinite(toeIn) ? toeIn : (primarySide ? finToeInFromSegment(primarySide.rearX, primarySide.rearY, primarySide.frontX, primarySide.frontY) : 0),
    cant: Number.isFinite(cant) ? cant : Number(primarySide?.cant) || 0,
    fins: [
      primarySide?.rearX || 0, primarySide?.rearY || 0,
      primarySide?.frontX || 0, primarySide?.frontY || 0,
      primaryCenter?.rearX || 0, primaryCenter?.frontX || 0,
      0, 0, 0
    ],
    extra
  });
  const singleCenter = center(15, 42, "FINBOX");
  const trailer = center(18, 35, "FINBOX");
  const bonzerCenter = center(14.6, 35, "FINBOX");
  const thrusterSide = side(30, 41, 3.2, 0.64, "side", "FCSII", 6);
  const sideBite = side(39.5, 49.5, 3.2, 0.4, "2plus1-sidebite", "FCSII", 4);
  const twinFishSide = side(17, 30, 2.6, 0.35, "twin-fish", "FCS", 5);
  const twinPerformanceSide = side(22, 34, 3.2, 0.55, "twin-performance", "FCSII", 6);
  const quadRear = side(16, 26, 4.4, 0.32, "quad-rear", "FCSII", 4);
  const quadFront = side(30, 41, 3.2, 0.64, "quad-front", "FCSII", 6);
  const bonzerFront = side(39.5, 48.5, 3.3, 0.64, "bonzer-front", "FCS", 18);
  const bonzerRear = side(27.5, 36.5, 3.5, 0.32, "bonzer-rear", "FCS", 18);
  const presets = {
    single: setPrimary(null, singleCenter, "Single fin", "FINBOX", 0, 0),
    "2plus1": setPrimary(sideBite, trailer, "2+1", "FCSII", NaN, 4),
    "twin-fish": setPrimary(twinFishSide, null, "Twin fish", "FCS", NaN, 5),
    "twin-performance": setPrimary(twinPerformanceSide, null, "Twin performance", "FCSII", NaN, 6),
    thruster: setPrimary(thrusterSide, center(21, 32, "FCSII"), "Thruster", "FCSII"),
    quad: setPrimary(quadFront, null, "Quad", "FCSII", NaN, 6, [quadRear]),
    "5fin": setPrimary(quadFront, center(21, 32, "FCSII"), "5 fin", "FCSII", NaN, 6, [quadRear]),
    bonzer: setPrimary(bonzerFront, bonzerCenter, "Bonzer", "FCS", NaN, 18, [bonzerRear])
  };
  return presets[key] || null;
}

function currentGuidePoints() {
  if (!state.board || !els.guideTarget) return null;
  if (els.guideTarget.value === "bottom") return state.board.bottomGuidePoints;
  if (els.guideTarget.value === "deck") return state.board.deckGuidePoints;
  if (els.guideTarget.value === "section") {
    const section = currentCrossSection();
    if (section && !section.guidePoints) section.guidePoints = [];
    return section ? section.guidePoints : null;
  }
  return state.board.outlineGuidePoints;
}

function currentGuideTargetValue() {
  return els.guideTarget?.value || "outline";
}

function guideTargetOptions() {
  return [
    { value: "outline", label: t("outline") },
    { value: "bottom", label: t("profile") },
    { value: "deck", label: t("deck_label") },
    { value: "section", label: t("current_cross_section_short") }
  ];
}

function updateGuidePointPanel() {
  if (!els.guideList) return;
  const points = currentGuidePoints() || [];
  if (state.selectedGuidePointIndex >= points.length) state.selectedGuidePointIndex = points.length - 1;
  els.guideList.innerHTML = "";
  if (!points.length) {
    els.guideList.textContent = t("guide_list_empty");
    return;
  }
  points.forEach((point, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `guide-list-item${index === state.selectedGuidePointIndex ? " active" : ""}`;
    button.textContent = t("guide_list_item", {
      marker: index === state.selectedGuidePointIndex ? "> " : "  ",
      index,
      x: fmt(point.x),
      y: fmt(point.y)
    });
    button.addEventListener("click", () => {
      selectGuidePoint(points, index);
      updateGuidePointPanel();
      updateEditInfo();
      updateHistoryButtons();
      draw();
    });
    button.addEventListener("dblclick", () => {
      selectGuidePoint(points, index);
      updateGuidePointPanel();
      updateEditInfo();
      editGuidePointAt(points, index);
    });
    els.guideList.appendChild(button);
  });
}

function promptAddGuidePoint() {
  const points = currentGuidePoints();
  if (!state.board || !points) return;
  showFormDialog(t("dialog_guide_point_add_title"), [
    {
      name: "target",
      label: t("guide_point_target"),
      type: "select",
      value: currentGuideTargetValue(),
      options: guideTargetOptions()
    },
    {
      name: "x",
      label: t("prompt_guide_point_x"),
      type: "number",
      step: 0.001,
      value: fmt(state.lastEditPoint?.x || 0)
    },
    {
      name: "y",
      label: t("prompt_guide_point_y"),
      type: "number",
      step: 0.001,
      value: fmt(state.lastEditPoint?.y || 0)
    }
  ], {
    submitLabel: t("add"),
    onSubmit: values => {
      if (!state.board || !els.guideTarget) return false;
      const x = Number(values.x);
      const y = Number(values.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        setStatus("status_number_required");
        return false;
      }
      activateGuideTarget(String(values.target || currentGuideTargetValue()));
      const targetPoints = currentGuidePoints();
      if (!targetPoints) return false;
      const before = cloneBoard(state.board);
      targetPoints.push({ x, y });
      state.selectedGuidePointIndex = targetPoints.length - 1;
      commitBoardMutation(before, { recomputeMetrics: false });
      selectGuidePoint(targetPoints, state.selectedGuidePointIndex);
      updateGuidePointPanel();
      updateEditInfo();
      setStatus("status_guide_point_added");
      return true;
    }
  });
}

function promptSectionGuidePoint(mode) {
  if (!currentCrossSection()) return;
  activateGuideTarget("section", { openPanel: true });
  if (mode === "add") promptAddGuidePoint();
  if (mode === "edit") promptEditGuidePoint();
  if (mode === "remove") removeGuidePoint();
}

function promptEditGuidePoint() {
  const points = currentGuidePoints();
  if (!state.board || !points || !points.length) return;
  const defaultIndex = state.guidePointSelection?.points === points
    ? state.guidePointSelection.index
    : Math.max(0, state.selectedGuidePointIndex);
  showFormDialog(t("dialog_guide_point_edit_title"), [
    {
      name: "target",
      label: t("guide_point_target"),
      type: "select",
      value: currentGuideTargetValue(),
      options: guideTargetOptions()
    },
    {
      name: "index",
      label: t("guide_point_index_label"),
      type: "number",
      step: 1,
      min: 0,
      max: Math.max(0, points.length - 1),
      value: String(defaultIndex)
    }
  ], {
    submitLabel: t("edit"),
    onSubmit: values => {
      if (!state.board || !els.guideTarget) return false;
      activateGuideTarget(String(values.target || currentGuideTargetValue()));
      const targetPoints = currentGuidePoints();
      if (!targetPoints || !targetPoints.length) return false;
      const index = Number(values.index);
      if (!Number.isInteger(index) || index < 0 || index >= targetPoints.length) {
        setStatus("status_guide_point_index_out_of_range");
        return false;
      }
      return editGuidePointAt(targetPoints, index);
    }
  });
}

function editGuidePointFromPanel() {
  const points = currentGuidePoints();
  if (!state.board || !points || !points.length) return;
  if (state.guidePointSelection?.points === points) {
    editGuidePointAt(points, state.guidePointSelection.index);
    return;
  }
  if (state.selectedGuidePointIndex >= 0 && state.selectedGuidePointIndex < points.length) {
    editGuidePointAt(points, state.selectedGuidePointIndex);
    return;
  }
  promptEditGuidePoint();
}

function editGuidePointAt(points, index) {
  if (!state.board || !points || index < 0 || index >= points.length) return false;
  showFormDialog(t("dialog_guide_point_edit_title"), [
    {
      name: "x",
      label: t("prompt_guide_point_x"),
      type: "number",
      step: 0.001,
      value: fmt(points[index].x)
    },
    {
      name: "y",
      label: t("prompt_guide_point_y"),
      type: "number",
      step: 0.001,
      value: fmt(points[index].y)
    }
  ], {
    submitLabel: t("edit"),
    onSubmit: values => {
      if (!state.board) return false;
      const x = Number(values.x);
      const y = Number(values.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        setStatus("status_number_required");
        return false;
      }
      const before = cloneBoard(state.board);
      points[index] = { x, y };
      state.selectedGuidePointIndex = index;
      commitBoardMutation(before, { recomputeMetrics: false });
      selectGuidePoint(points, index);
      updateGuidePointPanel();
      updateEditInfo();
      setStatus("status_guide_point_updated");
      return true;
    }
  });
  return true;
}

function editSelectedGuidePoint() {
  const handle = state.guidePointSelection;
  if (!canDeleteSelectedGuidePoint()) return false;
  return editGuidePointAt(handle.points, handle.index);
}

function removeGuidePoint() {
  const points = currentGuidePoints();
  if (!state.board || !points || !points.length) return;
  const selected = state.guidePointSelection?.points === points
    && state.guidePointSelection.index >= 0
    && state.guidePointSelection.index < points.length
    ? state.guidePointSelection.index
    : null;
  const defaultIndex = selected ?? Math.max(0, state.selectedGuidePointIndex);
  showFormDialog(t("dialog_guide_point_remove_title"), [
    {
      name: "target",
      label: t("guide_point_target"),
      type: "select",
      value: currentGuideTargetValue(),
      options: guideTargetOptions()
    },
    {
      name: "index",
      label: t("guide_point_index_label"),
      type: "number",
      step: 1,
      min: 0,
      max: Math.max(0, points.length - 1),
      value: String(defaultIndex)
    }
  ], {
    submitLabel: t("remove"),
    onSubmit: values => {
      if (!state.board || !els.guideTarget) return false;
      activateGuideTarget(String(values.target || currentGuideTargetValue()));
      const targetPoints = currentGuidePoints();
      if (!targetPoints || !targetPoints.length) return false;
      const index = Number(values.index);
      if (!Number.isInteger(index) || index < 0 || index >= targetPoints.length) {
        setStatus("status_guide_point_index_out_of_range");
        return false;
      }
      const before = cloneBoard(state.board);
      targetPoints.splice(index, 1);
      state.selectedGuidePointIndex = Math.min(index, targetPoints.length - 1);
      state.guidePointSelection = null;
      commitBoardMutation(before, { recomputeMetrics: false });
      if (state.selectedGuidePointIndex >= 0) selectGuidePoint(targetPoints, state.selectedGuidePointIndex);
      else clearGuidePointSelection();
      updateGuidePointPanel();
      updateEditInfo();
      setStatus("status_guide_point_removed");
      return true;
    }
  });
}

function canDeleteSelectedGuidePoint() {
  const handle = state.guidePointSelection;
  return !!state.board && state.tool === "edit" && !!handle && !!handle.points && handle.index >= 0 && handle.index < handle.points.length;
}

function deleteSelectedGuidePoint() {
  if (!canDeleteSelectedGuidePoint()) return;
  const handle = state.guidePointSelection;
  const before = cloneBoard(state.board);
  handle.points.splice(handle.index, 1);
  state.selectedGuidePointIndex = Math.min(handle.index, handle.points.length - 1);
  state.guidePointSelection = null;
  state.lastEditPoint = null;
  commitBoardMutation(before, { recomputeMetrics: false });
  if (state.selectedGuidePointIndex >= 0) selectGuidePoint(handle.points, state.selectedGuidePointIndex);
  updateGuidePointPanel();
  updateEditInfo();
  setStatus("status_selected_guide_point_removed");
}

function setWeightDefaults(update = true) {
  if (!state.board) return;
  const foot = 30.48;
  const long = state.board.length > foot * 7.0;
  state.weightInputs = {
    stringerWidth: long ? 0.5 : 0.3,
    stringerDensity: 0.4,
    foamDensity: 0.045,
    deckGlass: long ? 0.4 : 0.27,
    deckLapWidth: 5.0,
    bottomGlass: long ? 0.2 : 0.135,
    bottomLapWidth: 5.0,
    resinRatio: 1.0,
    hotcoat: 0.03 * (state.board.length / foot),
    plugsFins: 0.2
  };
  syncWeightInputs();
  if (update) updateWeightOutput();
}

function syncWeightInputs() {
  const w = state.weightInputs;
  if (!w) return;
  els.weightStringerWidth.value = fmt(w.stringerWidth);
  els.weightStringerDensity.value = fmt(w.stringerDensity);
  els.weightFoamDensity.value = fmt(w.foamDensity);
  els.weightDeckGlass.value = fmt(w.deckGlass);
  els.weightDeckLapWidth.value = fmt(w.deckLapWidth);
  els.weightBottomGlass.value = fmt(w.bottomGlass);
  els.weightBottomLapWidth.value = fmt(w.bottomLapWidth);
  els.weightResinRatio.value = fmt(w.resinRatio);
  els.weightHotcoat.value = fmt(w.hotcoat);
  els.weightPlugsFins.value = fmt(w.plugsFins);
}

function readWeightInputs() {
  state.weightInputs = {
    stringerWidth: numberOrZero(els.weightStringerWidth.value),
    stringerDensity: numberOrZero(els.weightStringerDensity.value),
    foamDensity: numberOrZero(els.weightFoamDensity.value),
    deckGlass: numberOrZero(els.weightDeckGlass.value),
    deckLapWidth: numberOrZero(els.weightDeckLapWidth.value),
    bottomGlass: numberOrZero(els.weightBottomGlass.value),
    bottomLapWidth: numberOrZero(els.weightBottomLapWidth.value),
    resinRatio: numberOrZero(els.weightResinRatio.value),
    hotcoat: numberOrZero(els.weightHotcoat.value),
    plugsFins: numberOrZero(els.weightPlugsFins.value)
  };
  return state.weightInputs;
}

function updateWeightOutput() {
  if (!state.board || !els.weightOutput || !els.weightStringerWidth) return;
  const w = readWeightInputs();
  const result = boardCadWeightEstimate(state.board, w);
  els.weightOutput.textContent = [
    t("weight_output_foam_volume", { value: fmt(result.foamVolume) }),
    t("weight_output_stringer_volume", { value: fmt(result.stringerVolume) }),
    t("weight_output_deck_area", { value: fmt(result.deckArea) }),
    t("weight_output_bottom_area", { value: fmt(result.bottomArea) }),
    t("weight_output_glass", { value: fmt(result.totalGlassWeight) }),
    t("weight_output_resin", { value: fmt(result.resinWeight) }),
    t("weight_output_total", { value: fmt(result.totalWeight) })
  ].join("\n");
}

function boardCadWeightEstimate(board, w) {
  const cubicCentimeterPerLiter = 1000.0;
  const squareCentimeterPerMeter = 10000.0;
  const stringerArea = boardCadSplineIntegral(board.deck, 0, board.length, 80) - boardCadSplineIntegral(board.bottom, 0, board.length, 80);
  const stringerVolume = stringerArea * w.stringerWidth;
  const stringerWeight = (stringerVolume / cubicCentimeterPerLiter) * w.stringerDensity;
  const foamVolume = Math.max(0, boardCadVolume(board) - stringerVolume);
  const foamWeight = (foamVolume / cubicCentimeterPerLiter) * w.foamDensity;
  const deckArea = boardCadSurfaceAreaApprox(board, "deck");
  const bottomArea = boardCadSurfaceAreaApprox(board, "bottom");
  const outlineLength = boardCadSplineLength(board.outline) * 2.0;
  const deckLapArea = outlineLength * w.deckLapWidth;
  const bottomLapArea = outlineLength * w.bottomLapWidth;
  const deckGlassWeight = (deckArea / squareCentimeterPerMeter) * w.deckGlass;
  const deckLapWeight = (deckLapArea / squareCentimeterPerMeter) * w.deckGlass;
  const bottomGlassWeight = (bottomArea / squareCentimeterPerMeter) * w.bottomGlass;
  const bottomLapWeight = (bottomLapArea / squareCentimeterPerMeter) * w.bottomGlass;
  const totalGlassWeight = deckGlassWeight + deckLapWeight + bottomGlassWeight + bottomLapWeight;
  const resinWeight = totalGlassWeight * w.resinRatio;
  const totalWeight = stringerWeight + foamWeight + totalGlassWeight + resinWeight + w.hotcoat + w.plugsFins;
  return { stringerVolume, foamVolume, deckArea, bottomArea, totalGlassWeight, resinWeight, totalWeight };
}

function boardCadSurfaceAreaApprox(board, surface) {
  const steps = 80;
  let area = 0;
  for (let i = 0; i < steps; i++) {
    const x0 = board.length * (i / steps);
    const x1 = board.length * ((i + 1) / steps);
    const w0 = boardCadWidthAtPos(board, x0);
    const w1 = boardCadWidthAtPos(board, x1);
    const z0 = surface === "deck" ? boardCadDeckAtPos(board, x0) : boardCadRockerAtPos(board, x0);
    const z1 = surface === "deck" ? boardCadDeckAtPos(board, x1) : boardCadRockerAtPos(board, x1);
    area += Math.hypot(x1 - x0, z1 - z0) * ((w0 + w1) / 2);
  }
  return area;
}

function boardCadSplineIntegral(knots, start, end, steps) {
  let area = 0;
  const h = (end - start) / steps;
  for (let i = 0; i <= steps; i++) {
    const x = start + h * i;
    const coeff = i === 0 || i === steps ? 1 : i % 2 === 0 ? 2 : 4;
    area += coeff * boardCadSplineValueAt(knots, x);
  }
  return area * h / 3;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function canAddControlPoint() {
  return !!state.board && state.tool === "edit" && !state.viewOptions.viewBlank && (state.selection || state.contextEditPoint || state.lastEditPoint) && getActiveEditableSplines().length > 0;
}

function canDeleteControlPoint() {
  if (!state.board || state.tool !== "edit" || state.viewOptions.viewBlank || !state.selection) return false;
  if (state.selection.which !== 0) return false;
  return state.selection.knotIndex > 0 && state.selection.knotIndex < state.selection.knots.length - 1 && state.selection.knots.length > 2;
}

function canMakeSelectedContinuous() {
  if (!state.board || state.tool !== "edit" || state.viewOptions.viewBlank || !state.selection) return false;
  const knot = state.selection.knots?.[state.selection.knotIndex];
  if (!knot?.p || !knot?.prev || !knot?.next) return false;
  const prevLength = Math.hypot(knot.prev.x - knot.p.x, knot.prev.y - knot.p.y);
  const nextLength = Math.hypot(knot.next.x - knot.p.x, knot.next.y - knot.p.y);
  return prevLength > 1e-9 || nextLength > 1e-9;
}

function addControlPoint() {
  if (!canAddControlPoint()) return;
  const nearPoint = state.contextEditPoint || (state.selection ? state.selection.knots[state.selection.knotIndex][state.selection.pointKey] : state.lastEditPoint);
  const target = findBestSplitTarget(nearPoint);
  if (!target) return;
  const before = cloneBoard(state.board);
  const split = boardCadSplitCurveKnot(target.curve, target.t);
  target.knots[target.index].next = split.startNext;
  target.knots[target.index + 1].prev = split.endPrev;
  target.knots.splice(target.index + 1, 0, split.knot);
  state.selection = {
    splineIndex: target.splineIndex,
    splineLabel: target.splineLabel,
    knots: target.knots,
    knotIndex: target.index + 1,
    pointKey: "p",
    which: 0,
    transform: editTransformForKnots(target.knots)
  };
  state.lastEditPoint = split.knot.p;
  state.contextEditPoint = null;
  commitBoardMutation(before);
  setStatus("status_control_point_added");
}

function editTransformForKnots(knots) {
  return state.editHandles.find(handle => handle.knots === knots)?.transform || state.editHandles[0]?.transform || null;
}

function deleteSelectedControlPoint() {
  if (!canDeleteControlPoint()) return;
  const handle = state.selection;
  const knots = handle.knots;
  const index = handle.knotIndex;
  const before = cloneBoard(state.board);
  const prev = knots[index - 1];
  const deleted = knots[index];
  const next = knots[index + 1];
  const bridgeCurve = {
    start: prev,
    end: next,
    coeff: boardCadCurveCoeff(prev, next)
  };
  const t = boardCadCurveClosestT(bridgeCurve, deleted.p);
  if (t !== 0 && t !== 1) {
    const prevVec = { x: prev.next.x - prev.p.x, y: prev.next.y - prev.p.y };
    prev.next = {
      x: prev.p.x + prevVec.x * (1 / t),
      y: prev.p.y + prevVec.y * (1 / t)
    };
    const nextVec = { x: next.prev.x - next.p.x, y: next.prev.y - next.p.y };
    next.prev = {
      x: next.p.x + nextVec.x * (1 / (1 - t)),
      y: next.p.y + nextVec.y * (1 / (1 - t))
    };
  }
  knots.splice(index, 1);
  state.selection = null;
  state.lastEditPoint = deleted.p;
  state.contextEditPoint = null;
  commitBoardMutation(before);
  setStatus("status_control_point_removed");
}

function setSelectedControlPointFromPanel() {
  if (!state.selection || !state.board) return;
  const knot = state.selection.knots[state.selection.knotIndex];
  const endpoint = inputPoint(els.cpEndX, els.cpEndY);
  const previous = inputPoint(els.cpPrevX, els.cpPrevY);
  const next = inputPoint(els.cpNextX, els.cpNextY);
  if (!endpoint || !previous || !next) {
    setStatus("status_control_point_all_coords_required");
    return;
  }
  const before = cloneBoard(state.board);
  knot.p = endpoint;
  knot.prev = previous;
  knot.next = next;
  if (knot.continuous && state.selection.which !== 0) alignOppositeTangent(knot, state.selection.which);
  state.lastEditPoint = knot[state.selection.pointKey];
  commitBoardMutation(before);
  setStatus("status_control_point_coords_set");
}

function inputPoint(xInput, yInput) {
  const x = Number(xInput.value);
  const y = Number(yInput.value);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function setSelectedContinuous(continuous) {
  if (!state.selection || !state.board) return;
  const knot = state.selection.knots[state.selection.knotIndex];
  const before = cloneBoard(state.board);
  knot.continuous = continuous;
  if (continuous) {
    const which = state.selection.which === 0 ? 1 : state.selection.which;
    alignOppositeTangent(knot, which);
  }
  commitBoardMutation(before);
  setStatus("status_continuous_set", { value: continuous ? t("continuous_true") : t("continuous_false") });
}

function makeSelectedContinuousFromContext() {
  if (!canMakeSelectedContinuous()) return;
  const knot = state.selection.knots[state.selection.knotIndex];
  const before = cloneBoard(state.board);
  if (knot.continuous) {
    knot.continuous = false;
    commitBoardMutation(before);
    setStatus("status_continuous_set", { value: t("continuous_false") });
    return;
  }
  knot.continuous = true;
  let which = state.selection.which;
  if (which === 0) {
    const prevLength = Math.hypot(knot.prev.x - knot.p.x, knot.prev.y - knot.p.y);
    const nextLength = Math.hypot(knot.next.x - knot.p.x, knot.next.y - knot.p.y);
    which = nextLength >= prevLength ? 2 : 1;
  }
  alignOppositeTangent(knot, which === 1 ? 1 : 2);
  commitBoardMutation(before);
  setStatus("status_continuous_set", { value: t("continuous_true") });
}

function rotateSelectedControlPointToHorizontal() {
  rotateSelectedControlPoint("horizontal");
}

function rotateSelectedControlPointToVertical() {
  rotateSelectedControlPoint("vertical");
}

function rotateSelectedControlPoint(axis) {
  if (!state.selection || !state.board) return;
  const knot = state.selection.knots[state.selection.knotIndex];
  const before = cloneBoard(state.board);
  const nextLength = Math.hypot(knot.next.x - knot.p.x, knot.next.y - knot.p.y);
  const prevLength = Math.hypot(knot.prev.x - knot.p.x, knot.prev.y - knot.p.y);
  const prevSign = axis === "horizontal"
    ? (knot.prev.x - knot.p.x > 0 ? 1 : -1)
    : (knot.prev.y - knot.p.y > 0 ? 1 : -1);
  const nextSign = axis === "horizontal"
    ? (knot.next.x - knot.p.x >= 0 ? 1 : -1)
    : (knot.next.y - knot.p.y >= 0 ? 1 : -1);

  if (state.selection.which === 0 || state.selection.which === 1) {
    setTangentOnAxis(knot, "prev", axis, prevLength, prevSign);
    if (knot.continuous) setTangentOnAxis(knot, "next", axis, nextLength, -prevSign);
  }
  if (state.selection.which === 0 || state.selection.which === 2) {
    setTangentOnAxis(knot, "next", axis, nextLength, nextSign);
    if (knot.continuous) setTangentOnAxis(knot, "prev", axis, prevLength, -nextSign);
  }
  commitBoardMutation(before);
  setStatus(axis === "horizontal" ? "status_control_point_horizontal" : "status_control_point_vertical");
}

function setTangentOnAxis(knot, key, axis, length, sign) {
  if (axis === "horizontal") {
    knot[key] = { x: knot.p.x + length * sign, y: knot.p.y };
  } else {
    knot[key] = { x: knot.p.x, y: knot.p.y + length * sign };
  }
}

function alignOppositeTangent(knot, which) {
  const movingKey = which === 1 ? "prev" : "next";
  const oppositeKey = which === 1 ? "next" : "prev";
  const vx = knot[movingKey].x - knot.p.x;
  const vy = knot[movingKey].y - knot.p.y;
  const len = Math.hypot(vx, vy);
  const oppositeLen = Math.hypot(knot[oppositeKey].x - knot.p.x, knot[oppositeKey].y - knot.p.y);
  if (len <= 1e-9) return;
  knot[oppositeKey] = {
    x: knot.p.x - (vx / len) * oppositeLen,
    y: knot.p.y - (vy / len) * oppositeLen
  };
}

function findBestSplitTarget(point) {
  let best = null;
  getActiveEditableSplines().forEach((spline, splineIndex) => {
    const curves = boardCadCurves(spline.knots);
    curves.forEach((curve, index) => {
      const t = boardCadCurveClosestT(curve, point);
      const x = boardCadCurveX(curve, t);
      const y = boardCadCurveY(curve, t);
      const distance = Math.hypot(x - point.x, y - point.y);
      if (!best || distance < best.distance) {
        best = {
          splineIndex,
          splineLabel: spline.label,
          knots: spline.knots,
          curve,
          index,
          t,
          distance
        };
      }
    });
  });
  return best;
}

function getActiveEditableSplines() {
  if (!state.board) return [];
  if (state.view === "outline") return [{ label: "Outline", knots: state.board.outline }];
  if (state.view === "profile") {
    return [
      { label: "Bottom", knots: state.board.bottom },
      { label: "Deck", knots: state.board.deck }
    ];
  }
  if (state.view === "sections") {
    const section = currentCrossSection();
    return section ? [{ label: "CrossSection", knots: section.spline }] : [];
  }
  if (state.view === "quad") {
    if (state.quadActivePane === "outline") return [{ label: "Outline", knots: state.board.outline }];
    if (state.quadActivePane === "profile") {
      return [
        { label: "Bottom", knots: state.board.bottom },
        { label: "Deck", knots: state.board.deck }
      ];
    }
    if (state.quadActivePane === "cross-section") {
      const section = currentQuadCrossSection(state.board);
      return section ? [{ label: "CrossSection", knots: section.spline }] : [];
    }
  }
  return [];
}

function commitBoardMutation(before, options = {}) {
  const now = () => {
    if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
    if (typeof Date !== "undefined" && typeof Date.now === "function") return Date.now();
    return 0;
  };
  const profiler = typeof window !== "undefined" && window.__boardcadProfileCommit ? {
    start: now(),
    marks: []
  } : null;
  const mark = label => {
    if (!profiler) return;
    profiler.marks.push([label, now()]);
  };
  if (options.recomputeMetrics !== false) applyBoardCadDerivedMetrics(state.board);
  mark("derived");
  markGeometryDirty();
  mark("geometry-dirty");
  state.currentSectionIndex = normalizeSectionIndex(state.board, state.currentSectionIndex);
  mark("section-index");
  state.history.undo.push(before);
  state.history.redo = [];
  trimHistory();
  mark("history");
  updateInfo();
  mark("info");
  updateSectionInfo();
  mark("section-info");
  updateEditInfo();
  mark("edit-info");
  updateHistoryButtons();
  mark("history-buttons");
  if (options.redraw === false) {
    state.dialog.pendingDraw = true;
    if (profiler && typeof console !== "undefined" && typeof console.log === "function") {
      const parts = [];
      let prev = profiler.start;
      for (const [label, now] of profiler.marks) {
        parts.push(`${label}=${(now - prev).toFixed(2)}ms`);
        prev = now;
      }
      parts.push(`total=${(prev - profiler.start).toFixed(2)}ms`);
      console.log(`[commit-profile] ${parts.join(" ")}`);
    }
    return;
  }
  state.dialog.pendingDraw = false;
  draw();
  mark("draw");
  if (profiler && typeof console !== "undefined" && typeof console.log === "function") {
    const parts = [];
    let prev = profiler.start;
    for (const [label, now] of profiler.marks) {
      parts.push(`${label}=${(now - prev).toFixed(2)}ms`);
      prev = now;
    }
    parts.push(`total=${(prev - profiler.start).toFixed(2)}ms`);
    console.log(`[commit-profile] ${parts.join(" ")}`);
  }
}

function updateHistoryButtons() {
  const activeSection = currentCrossSection();
  const guidePoints = currentGuidePoints();
  const hasGuidePoints = !!guidePoints && guidePoints.length > 0;
  const sectionGuidePoints = activeSection?.guidePoints || [];
  if (els.undoButton) els.undoButton.disabled = !state.history.undo.length;
  if (els.redoButton) els.redoButton.disabled = !state.history.redo.length;
  setDisabled([
    els.saveBrdButton, els.saveBrdAsButton, els.exportOtlButton, els.exportPflButton, els.pdfButton, els.templatePdfButton,
    els.dxfOutlineSplineButton, els.dxfProfileSplineButton, els.dxfOutlineButton, els.dxfProfileButton,
    els.gcodeButton, els.cncButton
  ], !state.board);
  setDisabled([els.generateScanButton], !state.board && !(Number(els.scanMeasuredLength?.value) > 0));
  setDisabled([els.downloadScanButton], !state.board || !state.probeScanGCode);
  setDisabled([els.sendScanButton], !state.serial.connected || !state.probeScanGCode);
  setDisabled([els.sendCncButton], !state.serial.connected || !state.board);
  updateSimulationButtons();
  updateProbeMeasurementButtons();
  setDisabled([els.dxfSectionSplineButton, els.dxfSectionButton], !activeSection);
  if (els.addControlPointButton) els.addControlPointButton.disabled = !canAddControlPoint();
  if (els.deleteControlPointButton) els.deleteControlPointButton.disabled = !canDeleteControlPoint();
  setDisabled([els.nextSectionButton, els.nextSectionPanelButton], !canStepCrossSection(1));
  setDisabled([els.previousSectionButton, els.previousSectionPanelButton], !canStepCrossSection(-1));
  setDisabled([els.addSectionButton, els.addSectionPanelButton], !canAddCrossSection());
  if (els.sectionPosition) els.sectionPosition.disabled = !activeSection;
  if (els.sectionInterval) els.sectionInterval.disabled = !state.board;
  setDisabled([els.moveSectionButton, els.moveSectionPanelButton], !canMoveCrossSection());
  setDisabled([els.removeSectionButton, els.removeSectionPanelButton], !canRemoveCrossSection());
  setDisabled([els.fillSectionsPanelButton], !state.board);
  setDisabled([els.copySectionButton, els.copySectionPanelButton], !activeSection);
  setDisabled([els.pasteSectionButton, els.pasteSectionPanelButton], !activeSection || !state.copiedCrossSection);
  setDisabled([els.importSectionButton, els.importSectionPanelButton, els.exportSectionButton, els.exportSectionPanelButton], !activeSection);
  setDisabled([els.addSectionGuidePointButton], !activeSection);
  setDisabled([els.editSectionGuidePointButton, els.removeSectionGuidePointButton], !activeSection || !sectionGuidePoints.length);
  setDisabled([els.railMode, els.railStrength, els.setRailButton, els.edgeType, els.edgeStrength, els.edgeLength, els.edgeFade, els.setEdgeButton], !state.board);
  setDisabled([
    els.scaleBoardButton, els.boardInfoButton, els.flipBoardViewButton,
    els.tailButton, els.noseButton, els.wingButton, els.rockerButton, els.bottomButton, els.finsButton, els.guidePointsButton, els.weightCalcButton,
    els.setFinsButton, els.setTailButton, els.setNoseButton, els.setWingButton, els.setRockerButton, els.resetRockerButton, els.setBottomFeatureButton,
    els.addBottomFeatureButton, els.removeBottomFeatureButton, els.finTemplate, els.guideTarget, els.addGuidePointButton,
    els.weightDefaultsButton, els.weightCalcPanelButton
  ], !state.board);
  setDisabled([els.scaleGhostButton], !state.board || !state.ghost.board);
  setDisabled([els.editGuidePointButton, els.removeGuidePointButton], !state.board || !hasGuidePoints);
  setDisabled([
    els.bezierPatchButton, els.approxClosedButton, els.approxOpenButton,
    els.approxOutlineRockerButton, els.clearApproxButton, els.view3dButton,
    els.editNurbsButton
  ], !state.board);
  setDisabled(boardPanelInputs(), !state.board);
  updateTailPanelFields();
  updateRailPanelFields();
  updateEdgePanelFields();
  updateBottomPanelFields();
  updateWingPanelFields();
}

function setDisabled(elements, disabled) {
  elements.forEach(element => {
    if (element) element.disabled = disabled;
  });
}

function trimHistory() {
  const max = 80;
  if (state.history.undo.length > max) state.history.undo.splice(0, state.history.undo.length - max);
}

function cloneBoard(board) {
  return {
    filename: board.filename,
    name: board.name,
    version: board.version,
    fields: { ...(board.fields || {}) },
    length: board.length,
    width: board.width,
    thickness: board.thickness,
    finType: board.finType || "",
    fins: (board.fins || Array(9).fill(0)).slice(),
    finSetup: board.finSetup || "",
    finToeIn: Number(board.finToeIn) || 0,
    finCant: Number(board.finCant) || 0,
    finExtra: normalizeFinExtra(board.finExtra),
    tailMode: normalizeTailModeKey(board.tailMode),
    tailLength: Number(board.tailLength) || 0,
    tailDepth: Number(board.tailDepth) || 0,
    tailShoulderPos: Number(board.tailShoulderPos) || 0,
    tailShoulderScale: Number(board.tailShoulderScale) || 0,
    tailRailBlend: Number(board.tailRailBlend) || 0,
    tailLinearization: Number(board.tailLinearization) || 0,
    tailWidthAdjust: Number(board.tailWidthAdjust) || 0,
    noseMode: normalizeNoseModeKey(board.noseMode),
    noseLength: Number(board.noseLength) || 0,
    noseShoulderPos: Number(board.noseShoulderPos) || 0,
    noseShoulderScale: Number(board.noseShoulderScale) || 0,
    noseRailBlend: Number(board.noseRailBlend) || 0,
    noseLinearization: Number(board.noseLinearization) || 0,
    noseWidthAdjust: Number(board.noseWidthAdjust) || 0,
    wingPreset: board.wingPreset || "",
    wingPosition: Number(board.wingPosition) || 0,
    wingWidth: Number(board.wingWidth) || 0,
    wingShape: board.wingShape || "",
    wingShoulder: Number(board.wingShoulder) || 0,
    wingTransition: Number(board.wingTransition) || 0,
    railMode: normalizeRailModeKey(board.railMode),
    railStrength: Number.isFinite(Number(board.railStrength)) ? clampNumber(board.railStrength, 0, 1, 1) : 1,
    edgeType: normalizeEdgeTypeKey(board.edgeType),
    edgeStrength: Number.isFinite(Number(board.edgeStrength)) ? clampNumber(board.edgeStrength, 0, 1, 0) : 0,
    edgeLength: Number(board.edgeLength) || 0,
    edgeFade: Number(board.edgeFade) || 0,
    bottomPreset: normalizeBottomPresetKey(board.bottomPreset),
    bottomFeatures: normalizeBottomFeatures(board.bottomFeatures),
    rockerPreset: rockerPresetOrDefault(board.rockerPreset || board.rockerConfig?.preset),
    rockerConfig: normalizeRockerConfig(board.rockerConfig, board.rockerPreset || board.rockerConfig?.preset),
    rockerRuntimeBaseBottom: Array.isArray(board.rockerRuntimeBaseBottom) ? boardCadCloneKnots(board.rockerRuntimeBaseBottom) : null,
    rockerRuntimeBaseDeck: Array.isArray(board.rockerRuntimeBaseDeck) ? boardCadCloneKnots(board.rockerRuntimeBaseDeck) : null,
    bottomFeatureBaseSections: Array.isArray(board.bottomFeatureBaseSections)
      ? cloneSectionsForBottomFeatureBase(board.bottomFeatureBaseSections)
      : null,
    outlineGuidePoints: clonePoints(board.outlineGuidePoints),
    bottomGuidePoints: clonePoints(board.bottomGuidePoints),
    deckGuidePoints: clonePoints(board.deckGuidePoints),
    outline: boardCadCloneKnots(board.outline),
    bottom: boardCadCloneKnots(board.bottom),
    deck: boardCadCloneKnots(board.deck),
    sections: board.sections.map(section => ({
      position: section.position,
      spline: boardCadCloneKnots(section.spline),
      railBaseSpline: cloneSectionRailBaseSpline(section),
      bottomFeatureBaseSpline: cloneSectionBottomFeatureBaseSpline(section),
      guidePoints: clonePoints(section.guidePoints),
      generatedByBottomFeature: section.generatedByBottomFeature === true
    }))
  };
}

function clonePoints(points = []) {
  return points.map(point => ({ x: point.x, y: point.y }));
}

function cloneCrossSection(section) {
  return {
    position: section.position,
    spline: boardCadCloneKnots(section.spline),
    railBaseSpline: cloneSectionRailBaseSpline(section),
    bottomFeatureBaseSpline: cloneSectionBottomFeatureBaseSpline(section),
    guidePoints: clonePoints(section.guidePoints),
    generatedByBottomFeature: section.generatedByBottomFeature === true
  };
}

function currentCrossSection(board = state.board) {
  if (!board) return null;
  const index = normalizeSectionIndex(board, state.currentSectionIndex);
  return index >= 0 ? board.sections[index] : null;
}

function defaultCurrentSectionIndex(board) {
  if (!board || !board.sections.length) return -1;
  return normalizeSectionIndex(board, boardCadNearestCrossSectionIndex(board, board.length / 2));
}

function normalizeSectionIndex(board, index) {
  if (!board || !board.sections.length) return -1;
  const first = firstEditableSectionIndex(board);
  const last = lastEditableSectionIndex(board);
  if (first < 0 || last < 0) return Math.min(board.sections.length - 1, Math.max(0, index));
  if (!Number.isFinite(index) || index < first) return first;
  if (index > last) return last;
  return index;
}

function firstEditableSectionIndex(board) {
  if (!board || board.sections.length < 3) return board && board.sections.length ? 0 : -1;
  return 1;
}

function lastEditableSectionIndex(board) {
  if (!board || board.sections.length < 3) return board && board.sections.length ? board.sections.length - 1 : -1;
  return board.sections.length - 2;
}

function canStepCrossSection(direction) {
  if (!state.board || !state.board.sections.length) return false;
  const current = normalizeSectionIndex(state.board, state.currentSectionIndex);
  if (current < 0) return false;
  return direction > 0 ? current < lastEditableSectionIndex(state.board) : current > firstEditableSectionIndex(state.board);
}

function canAddCrossSection() {
  return !!state.board && state.board.sections.length >= 3 && state.board.length > 0;
}

function canMoveCrossSection() {
  return !!state.board && currentCrossSection() && state.currentSectionIndex > 0 && state.currentSectionIndex < state.board.sections.length - 1;
}

function canRemoveCrossSection() {
  return !!state.board && currentCrossSection() && state.board.sections.length > 3 && state.currentSectionIndex > 0 && state.currentSectionIndex < state.board.sections.length - 1;
}

function sortCrossSections(board) {
  board.sections.sort((a, b) => a.position - b.position);
}

function cloneKnot(knot) {
  return {
    p: { ...knot.p },
    prev: { ...knot.prev },
    next: { ...knot.next },
    continuous: knot.continuous,
    other: knot.other
  };
}

function getSegments() {
  return Math.max(4, Math.min(80, Number(els.segments.value) || 24));
}

function unitScale() {
  return Number(els.unitSelect.value) || 10;
}

const DXF_SCALE_TO_SI = 0.01;
const DXF_SPLITS_PER_CURVE = 100;

const BRD_WRITE_ORDER = [
  1, 2, 3, 4, 7, 8, 45, 54, 55, 56, 57, 43, 11, 12, 13, 14, 15, 16,
  17, 18, 99, 19, 20, 21, 22, 23, 24, 25, 42, 26, 44, 46, 47, 38, 53,
  41, 48, 49, 51, 50, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 74, 68, 69, 70, 71, 72, 73, 75, 76, 77, 78, 79, 80, 81, 82,
  EDGE_TYPE_FIELD_ID, EDGE_STRENGTH_FIELD_ID, EDGE_LENGTH_FIELD_ID, EDGE_FADE_FIELD_ID,
  BOTTOM_FEATURE_FIELD_ID, BOTTOM_PRESET_FIELD_ID, ROCKER_PRESET_FIELD_ID, ROCKER_CONFIG_FIELD_ID, 27, 28, 29, 30, 31
];
const BRD_STRING_FIELDS = new Set([7, 8, 43, 45, 48, 49, 51, 54, 55, 56, 57, 58, 61, 62, 68, 71, 75, EDGE_TYPE_FIELD_ID, BOTTOM_FEATURE_FIELD_ID, BOTTOM_PRESET_FIELD_ID, ROCKER_PRESET_FIELD_ID, ROCKER_CONFIG_FIELD_ID]);
const BRD_ARRAY_FIELDS = new Set([50]);
const BRD_BOOLEAN_FIELDS = new Set([41]);

function makeBrd(board) {
  const exportBoard = prepareBoardForBrdExport(board);
  const lines = [];
  for (const id of BRD_WRITE_ORDER) {
    const value = brdExportValue(exportBoard, id);
    if (BRD_STRING_FIELDS.has(id)) {
      writeBrdString(lines, id, value);
    } else if (BRD_ARRAY_FIELDS.has(id)) {
      writeBrdArray(lines, id, value);
    } else if (BRD_BOOLEAN_FIELDS.has(id)) {
      writeBrdBoolean(lines, id, value);
    } else {
      writeBrdNumber(lines, id, value);
    }
  }
  lines.push(serializeSplineBlock("p32 : (\n", exportBoard.outline, exportBoard.outlineGuidePoints).trimEnd());
  lines.push(serializeSplineBlock("p33 : (\n", exportBoard.bottom, exportBoard.bottomGuidePoints).trimEnd());
  lines.push(serializeSplineBlock("p34 : (\n", exportBoard.deck, exportBoard.deckGuidePoints).trimEnd());
  lines.push(serializeBrdCrossSections(exportBoard.sections).trimEnd());
  return `${lines.join("\n")}\n`;
}

function makeOtl(board) {
  const exportBoard = prepareBoardForBrdExport(board);
  return serializeSplineBlock("p32 : (\n", exportBoard.outline, exportBoard.outlineGuidePoints);
}

function makePfl(board) {
  const exportBoard = prepareBoardForBrdExport(board);
  const profile = tailAdjustedProfileGeometry(exportBoard);
  const shift = profile.shift;
  const bottomGuides = (exportBoard.bottomGuidePoints || [])
    .filter(point => point.x >= shift - 1e-9)
    .map(point => ({ ...point, x: point.x - shift }));
  const deckGuides = (exportBoard.deckGuidePoints || [])
    .filter(point => point.x >= shift - 1e-9)
    .map(point => ({ ...point, x: point.x - shift }));
  return [
    serializeSplineBlock("p33 : (\n", profile.bottomDisplayKnots, bottomGuides).trimEnd(),
    serializeSplineBlock("p34 : (\n", profile.deckDisplayKnots, deckGuides).trimEnd()
  ].join("\n") + "\n";
}

const PROCEDURAL_OUTLINE_FIELD_IDS = [62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82];

function proceduralOutlineExportActive(board) {
  return normalizedTailConfig(board).active || normalizedNoseConfig(board).active || normalizedWingConfig(board).active;
}

function shiftGuidePointsForExport(points = [], shift = 0) {
  if (!(shift > 1e-9)) return clonePoints(points);
  return points
    .filter(point => point.x >= shift - 1e-9)
    .map(point => ({ ...point, x: point.x - shift }));
}

function uniqueDisplaySectionPositions(board, displayLength) {
  const positions = [];
  const push = value => {
    const clamped = clampNumber(value, 0, displayLength, 0);
    if (!positions.length || Math.abs(positions[positions.length - 1] - clamped) > 1e-6) positions.push(clamped);
  };
  const mapped = (board.sections || [])
    .map(section => boardCadDisplayXFromRawX(board, section.position))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  push(0);
  mapped.forEach(push);
  push(displayLength);
  return positions;
}

function bakedSectionsForExport(board, displayLength) {
  return uniqueDisplaySectionPositions(board, displayLength).map(position => ({
    position,
    spline: boardCadInterpolatedDisplayCrossSectionKnots(board, position),
    guidePoints: []
  })).filter(section => section.spline.length >= 2);
}

function bakeProceduralOutlineForExport(board) {
  if (!proceduralOutlineExportActive(board)) return board;
  const displayLength = boardCadTailDisplayLength(board);
  const outline = outlineSplineParts(board);
  const profile = tailAdjustedProfileGeometry(board);
  const bakedSections = bakedSectionsForExport(board, displayLength);
  board.outline = boardCadCloneKnots(outline.upper);
  board.outlineGuidePoints = [];
  board.bottom = boardCadCloneKnots(profile.bottomDisplayKnots);
  board.deck = boardCadCloneKnots(profile.deckDisplayKnots);
  board.bottomGuidePoints = shiftGuidePointsForExport(board.bottomGuidePoints, profile.shift);
  board.deckGuidePoints = shiftGuidePointsForExport(board.deckGuidePoints, profile.shift);
  board.sections = bakedSections;
  board.length = displayLength;
  board.tailMode = "";
  board.tailLength = 0;
  board.tailDepth = 0;
  board.tailShoulderPos = 0;
  board.tailShoulderScale = 0;
  board.tailRailBlend = 0;
  board.tailLinearization = 0;
  board.tailWidthAdjust = 0;
  board.noseMode = "";
  board.noseLength = 0;
  board.noseShoulderPos = 0;
  board.noseShoulderScale = 0;
  board.noseRailBlend = 0;
  board.noseLinearization = 0;
  board.noseWidthAdjust = 0;
  board.wingPreset = "";
  board.wingPosition = 0;
  board.wingWidth = 0;
  board.wingShape = "";
  board.wingShoulder = 0;
  board.wingTransition = 0;
  board.bottomPreset = "custom";
  PROCEDURAL_OUTLINE_FIELD_IDS.forEach(id => {
    if (board.fields) delete board.fields[id];
  });
  return board;
}

function prepareBoardForBrdExport(board) {
  const exportBoard = cloneBoard(board);
  bakeProceduralOutlineForExport(exportBoard);
  fixProfileEndpointJunctions(exportBoard);
  applyBoardCadDerivedMetrics(exportBoard);
  return exportBoard;
}

function fixProfileEndpointJunctions(board) {
  const length = Number.isFinite(board.length) && board.length > 0 ? board.length : boardCadLength(board);
  if (board.outline.length) {
    snapEndpointNear(board.outline[0], { x: 0, y: 0 }, endpointSnapTolerance(length));
    snapEndpointNear(board.outline[board.outline.length - 1], { x: length, y: 0 }, endpointSnapTolerance(length));
  }
  if (!board.bottom.length || !board.deck.length) return;
  const bottomTail = board.bottom[0];
  const bottomNose = board.bottom[board.bottom.length - 1];
  alignKnotEndpoint(bottomTail, 0, bottomTail.p.y);
  alignKnotEndpoint(board.deck[0], 0, bottomTail.p.y);
  alignKnotEndpoint(bottomNose, length, bottomNose.p.y);
  alignKnotEndpoint(board.deck[board.deck.length - 1], length, bottomNose.p.y);
}

function endpointSnapTolerance(length) {
  return Math.max(0.05, length * 0.0005);
}

function snapEndpointNear(knot, target, tolerance) {
  if (!knot) return;
  if (Math.hypot(knot.p.x - target.x, knot.p.y - target.y) > tolerance) return;
  alignKnotEndpoint(knot, target.x, target.y);
}

function alignKnotEndpoint(knot, x, y) {
  if (!knot) return;
  const dx = x - knot.p.x;
  const dy = y - knot.p.y;
  translatePoint(knot.p, dx, dy);
  translatePoint(knot.prev, dx, dy);
  translatePoint(knot.next, dx, dy);
}

function translatePoint(point, dx, dy) {
  if (!point) return;
  point.x += dx;
  point.y += dy;
}

function brdExportValue(board, id) {
  const fields = board.fields || {};
  if (id === 1) return board.length;
  if (id === 2) return boardCadSplineLength(board.bottom || [], 64);
  if (id === 3) return board.thickness;
  if (id === 4) return boardCadWidthAtPos(board, board.length / 2);
  if (id === 7) return board.version || fields[id] || "";
  if (id === 8) return board.name || fields[id] || "";
  if (id === 50) return board.fins || parseNumberArray(fields[id] || "", 9);
  if (id === 51) return board.finType || fields[id] || "";
  if (id === 58) return board.finSetup || fields[id] || "";
  if (id === 59) return Number(board.finToeIn) || 0;
  if (id === 60) return Number(board.finCant) || 0;
  if (id === 61) return serializeFinExtra(board.finExtra);
  if (id === 62) return normalizeTailModeKey(board.tailMode) || normalizeTailModeKey(fields[id]) || "";
  if (id === 63) return Number(board.tailLength) || 0;
  if (id === 64) return Number(board.tailDepth) || 0;
  if (id === 65) return Number(board.tailShoulderPos) || 0;
  if (id === 66) return Number(board.tailShoulderScale) || 0;
  if (id === 67) return Number(board.tailRailBlend) || 0;
  if (id === 74) return Number(board.tailLinearization) || 0;
  if (id === 68) return board.wingPreset || fields[id] || "";
  if (id === 69) return Number(board.wingPosition) || 0;
  if (id === 70) return Number(board.wingWidth) || 0;
  if (id === 71) return board.wingShape || fields[id] || "";
  if (id === 72) return Number(board.wingShoulder) || 0;
  if (id === 73) return Number(board.wingTransition) || 0;
  if (id === 75) return normalizeNoseModeKey(board.noseMode) || normalizeNoseModeKey(fields[id]) || "";
  if (id === 76) return Number(board.noseLength) || 0;
  if (id === 77) return Number(board.noseShoulderPos) || 0;
  if (id === 78) return Number(board.noseShoulderScale) || 0;
  if (id === 79) return Number(board.noseRailBlend) || 0;
  if (id === 80) return Number(board.noseLinearization) || 0;
  if (id === 81) return Number(board.tailWidthAdjust) || 0;
  if (id === 82) return Number(board.noseWidthAdjust) || 0;
  if (id === EDGE_TYPE_FIELD_ID) return normalizeEdgeTypeKey(board.edgeType) || "";
  if (id === EDGE_STRENGTH_FIELD_ID) return clampNumber(board.edgeStrength, 0, 1, 0);
  if (id === EDGE_LENGTH_FIELD_ID) return Number(board.edgeLength) || 0;
  if (id === EDGE_FADE_FIELD_ID) return Number(board.edgeFade) || 0;
  if (id === BOTTOM_FEATURE_FIELD_ID) return serializeBottomFeatures(board.bottomFeatures);
  if (id === BOTTOM_PRESET_FIELD_ID) return normalizeBottomPresetKey(board.bottomPreset);
  if (id === ROCKER_PRESET_FIELD_ID) return rockerPresetOrDefault(board.rockerPreset || board.rockerConfig?.preset);
  if (id === ROCKER_CONFIG_FIELD_ID) return serializeRockerConfig(board.rockerConfig, board.rockerPreset || board.rockerConfig?.preset);
  return fields[id] ?? defaultBrdValue(id);
}

function defaultBrdValue(id) {
  if (BRD_STRING_FIELDS.has(id)) return "";
  if (BRD_ARRAY_FIELDS.has(id)) return Array(9).fill(0);
  if (BRD_BOOLEAN_FIELDS.has(id)) return false;
  return 0;
}

function writeBrdString(lines, id, value) {
  const str = String(value ?? "");
  if (!str.length) return;
  lines.push(`${brdId(id)}${str.replace(/\n/g, "\\n")}`);
}

function writeBrdNumber(lines, id, value) {
  const number = Number(value);
  lines.push(`${brdId(id)}${serializeNumber(number)}`);
}

function writeBrdBoolean(lines, id, value) {
  const bool = value === true || String(value).toLowerCase() === "true";
  lines.push(`${brdId(id)}${bool}`);
}

function writeBrdArray(lines, id, value) {
  const values = Array.isArray(value) ? value : parseNumberArray(String(value ?? ""), 9);
  lines.push(`${brdId(id)}[${values.map(serializeNumber).join(",")}]`);
}

function brdId(id) {
  return `p${String(id).padStart(2, "0")} : `;
}

function serializeSplineBlock(header, knots = [], guidePoints = []) {
  return `${header}${serializeSplineKnots(knots)}${serializeGuidePoints(guidePoints)})\n`;
}

function serializeBrdCrossSections(sections = []) {
  return `p35 : (\n${sections.map(serializeCrossSection).join("")})\n`;
}

function makeDxfOutlineSpline(board) {
  const exportBoard = prepareBoardForBrdExport(board);
  if (proceduralOutlineExportActive(exportBoard)) {
    const splines = outlineSplineParts(exportBoard);
    return makeDxfSplineFromSplines([splines.upper, splines.lower], "Dxf export from BoardCAD (tail-adjusted)");
  }
  const mirrored = mirrorSplineYReverse(exportBoard.outline);
  return makeDxfSplineFromSplines([exportBoard.outline, mirrored], "Dxf export from BoardCAD");
}

function makeDxfProfileSpline(board) {
  const exportBoard = prepareBoardForBrdExport(board);
  const profile = tailAdjustedProfileGeometry(exportBoard);
  const deckReverse = reverseSpline(profile.deckDisplayKnots);
  return makeDxfSplineFromSplines([profile.bottomDisplayKnots, deckReverse], "Dxf export from BoardCAD");
}

function makeDxfCrossSectionSpline(section) {
  const mirrored = mirrorSplineXReverse(section.spline);
  return makeDxfSplineFromSplines([section.spline, mirrored], "Dxf export from BoardCAD");
}

function makeDxfSplineFromSplines(splines, comment = "Dxf export from BoardCAD") {
  const lines = [
    "999",
    comment,
    "0",
    "SECTION",
    "2",
    "ENTITIES",
    "0"
  ];
  let handle = 100;
  for (const spline of splines) {
    for (let i = 0; i < spline.length - 1; i++) {
      writeDxfBezierSpline(lines, spline[i], spline[i + 1], handle++);
    }
  }
  lines.push("ENDSEC", "0", "EOF");
  return `${lines.join("\n")}\n`;
}

function writeDxfBezierSpline(lines, start, end, handle) {
  lines.push(
    "SPLINE",
    " 5",
    String(handle).toUpperCase(),
    " 8",
    "0",
    " 62",
    "9",
    " 70",
    "8",
    " 71",
    "3",
    " 72",
    "8",
    " 73",
    "4",
    " 74",
    "0"
  );
  for (const knot of [0, 0, 0, 0, 1, 1, 1, 1]) {
    lines.push(" 40", String(knot));
  }
  writeDxfControlPoint(lines, start.p);
  writeDxfControlPoint(lines, start.next);
  writeDxfControlPoint(lines, end.prev);
  writeDxfControlPoint(lines, end.p);
  lines.push(" 0");
}

function writeDxfControlPoint(lines, point) {
  lines.push(
    " 10",
    serializeNumber(point.x * DXF_SCALE_TO_SI),
    " 20",
    serializeNumber(point.y * DXF_SCALE_TO_SI),
    " 30",
    "0"
  );
}

function makeDxfOutline(board) {
  if (proceduralOutlineExportActive(board)) {
    return makeDxfPolylineFromPoints(outlineFullPoints(board), "BoardCAD Web outline polyline (tail-adjusted)");
  }
  const mirrored = mirrorSplineYReverse(board.outline);
  return makeDxfPolylineFromSplines([board.outline, mirrored], "BoardCAD Web outline polyline");
}

function makeDxfProfile(board) {
  const exportBoard = prepareBoardForBrdExport(board);
  const profile = tailAdjustedProfileGeometry(exportBoard);
  const deckReverse = reverseSpline(profile.deckDisplayKnots);
  return makeDxfPolylineFromSplines([profile.bottomDisplayKnots, deckReverse], "BoardCAD Web profile polyline");
}

function makeDxfCrossSection(section) {
  const mirrored = mirrorSplineXReverse(section.spline);
  return makeDxfPolylineFromSplines([section.spline, mirrored], "BoardCAD Web cross section polyline");
}

function makeDxfPolylineFromSplines(splines, comment) {
  const points = [];
  splines.forEach(spline => {
    boardCadCurves(spline).forEach(curve => {
      for (let i = 0; i < DXF_SPLITS_PER_CURVE; i++) {
        const t = i / DXF_SPLITS_PER_CURVE;
        points.push({ x: boardCadCurveX(curve, t), y: boardCadCurveY(curve, t) });
      }
    });
  });
  return makeDxfPolyline(points, comment);
}

function makeDxfPolylineFromPoints(points, comment = "Dxf export from BoardCAD") {
  return makeDxfPolyline(dedupeConsecutivePoints(points || []), comment);
}

function makeDxfPolyline(points, comment = "Dxf export from BoardCAD") {
  const out = [
    "999",
    comment,
    "0",
    "SECTION",
    "2",
    "ENTITIES",
    "0",
    "POLYLINE",
    " 62",
    "9",
    " 66",
    "1",
    " 8",
    "0",
    " 6",
    "CONTINUOUS",
    " 0"
  ];
  points.forEach(point => {
    out.push(
      "VERTEX",
      " 62",
      "9",
      " 8",
      "0",
      " 6",
      "CONTINUOUS",
      "10",
      String(point.x * DXF_SCALE_TO_SI),
      "20",
      String(point.y * DXF_SCALE_TO_SI),
      "0"
    );
  });
  out.push("SEQEND", " 0", "ENDSEC", "0", "EOF", "");
  return out.join("\n");
}

function reverseSpline(knots) {
  return boardCadCloneKnots(knots).reverse().map(knot => ({
    p: { ...knot.p },
    prev: { ...knot.next },
    next: { ...knot.prev },
    continuous: knot.continuous,
    other: knot.other
  }));
}

function mirrorSplineYReverse(knots) {
  return reverseSpline(knots).map(knot => mirrorKnot(knot, 1, -1));
}

function mirrorSplineXReverse(knots) {
  return reverseSpline(knots).map(knot => mirrorKnot(knot, -1, 1));
}

function mirrorKnot(knot, sx, sy) {
  return {
    p: { x: knot.p.x * sx, y: knot.p.y * sy },
    prev: { x: knot.prev.x * sx, y: knot.prev.y * sy },
    next: { x: knot.next.x * sx, y: knot.next.y * sy },
    continuous: knot.continuous,
    other: knot.other
  };
}

function makeLaserGCode(board) {
  const scale = unitScale();
  const feed = Number(els.feedRate.value) || 1200;
  const power = Number(els.laserPower.value) || 300;
  const points = outlineFullPoints(board);
  const out = [
    "(BoardCAD Web laser outline)",
    `(${board.name || board.filename})`,
    "G21",
    "G90",
    "G17",
    "M5"
  ];
  if (points.length) {
    out.push(`G0 X${fmt(points[0].x * scale)} Y${fmt(points[0].y * scale)}`);
    out.push(`M3 S${fmt(power)}`);
    out.push(`G1 F${fmt(feed)}`);
    for (const p of points.slice(1)) {
      out.push(`G1 X${fmt(p.x * scale)} Y${fmt(p.y * scale)}`);
    }
    out.push(`G1 X${fmt(points[0].x * scale)} Y${fmt(points[0].y * scale)}`);
    out.push("M5");
  }
  out.push("G0 X0 Y0", "M2", "");
  return out.join("\n");
}

function makeCncGCode(board) {
  const axes = Number(els.cncAxes.value) || 4;
  const surfaceMode = els.cncSurface.value || "bottom";
  const scale = unitScale();
  const feed = Number(els.feedRate.value) || 1200;
  const safeZ = Number(els.safeZ.value) || 80;
  const lengthSteps = clampInt(els.cncLengthSteps.value, 8, 240, 48);
  const widthSteps = clampInt(els.cncWidthSteps.value, 2, 80, 8);
  const surfaces = surfaceMode === "both" ? ["bottom", "deck"] : [surfaceMode];
  const machine = probeMachineLimits();
  const model = makeCncModel(board);
  const out = [
    "(BoardCAD Web CNC toolpath)",
    `(${board.name || board.filename})`,
    `(${axes}-axis ${surfaces.join("+")})`,
    `(machine limits ${machine.x} x ${machine.y} x ${machine.z} mm)`,
    "(Coordinates are emitted in millimeters after the selected unit scale.)",
    "G21",
    "G90",
    `G0 Z${fmt(safeZ)}`
  ];

  surfaces.forEach(surface => {
    out.push(`(${surface})`);
    for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
      const side = sideIndex === 0 ? 1 : -1;
      out.push(side > 0 ? "(right side)" : "(left side)");
      const passes = buildCncPasses(model, surface, side, lengthSteps, widthSteps);
      passes.forEach(pass => {
        if (!pass.length) return;
        const first = machinePoint(pass[0], scale, axes);
        out.push(`G0 Z${fmt(safeZ)}`);
        out.push(`G0 X${fmt(first.x)} Y${fmt(first.y)}`);
        out.push(`G1 Z${fmt(first.z)} F${fmt(feed)}`);
        pass.forEach(point => {
          const mp = machinePoint(point, scale, axes);
          const rotary = axes >= 5 ? ` A${fmt(mp.a)} B${fmt(mp.b)}` : ` A${fmt(mp.a)}`;
          out.push(`G1 X${fmt(mp.x)} Y${fmt(mp.y)} Z${fmt(mp.z)}${rotary}`);
        });
      });
    }
  });

  out.push(`G0 Z${fmt(safeZ)}`, "G0 X0 Y0", "M2", "");
  return out.join("\n");
}

const CNC_MACHINE_LIMITS_MM = { x: 2900, y: 750, z: 300 };

function makeProbeScanGCode(board) {
  const scale = unitScale();
  const mode = els.scanMode.value || "ribs";
  const surfaceMode = els.scanSurface.value || "bottom";
  const xStep = clampInt(els.scanXStep.value, 5, 300, 100);
  const yStep = clampInt(els.scanYStep.value, 5, 200, 50);
  const machine = probeMachineLimits();
  const measuredLength = measuredProbeLengthMm(board, scale);
  const machineCenterY = clampNumber(els.scanMachineCenterY.value, 0, machine.y, machine.y / 2);
  const safeZ = Number(els.safeZ.value) || 80;
  const probeTravel = clampInt(els.probeTravel.value, 1, machine.z, 120);
  const probeFeed = clampInt(els.probeFeed.value, 1, 1000, 80);
  const points = buildProbeScanPoints(board, mode, surfaceMode, scale, measuredLength, machine, xStep, yStep);
  const machinePoints = points.map(point => machineProbePoint(point, machineCenterY, machine, mode, probeTravel));
  const warnings = probeScanWarnings(board, scale, machinePoints, safeZ, probeTravel, machineCenterY, measuredLength, machine);
  const out = [
    "(BoardCAD Web probe scan)",
    "(Set the work origin at the board tail before running this file.)",
    "(Jog from tail to nose first, then enter that distance as measured board length.)",
    `(mode ${mode})`,
    `(surface ${surfaceMode})`,
    `(probe axis ${probeAxisForMode(mode)})`,
    `(measured board length ${fmt(measuredLength)} mm)`,
    `(board centerline maps to machine Y${fmt(machineCenterY)})`,
    `(machine limits ${machine.x} x ${machine.y} x ${machine.z} mm)`,
    ...warnings.map(warning => `(WARNING ${warning})`),
    "G21",
    "G90",
    "G94",
    `G0 Z${fmt(safeZ)}`,
    `G0 X0 Y${fmt(machineCenterY)}`,
    "(Each G38.2 result should be captured from controller PRB/status responses)"
  ];
  let currentSurface = "";
  let currentPhase = "";
  machinePoints.forEach((point, index) => {
    if (point.surface !== currentSurface) {
      currentSurface = point.surface;
      out.push(`(SURFACE ${currentSurface})`);
      currentPhase = "";
    }
    if (point.phase !== currentPhase) {
      currentPhase = point.phase;
      if (point.phase === "rib") {
        out.push("(Return to tail origin before rib-direction scan)");
        out.push(`G0 Z${fmt(safeZ)}`);
        out.push(`G0 X0 Y${fmt(machineCenterY)}`);
      }
      out.push(`(PHASE ${point.phase})`);
    }
    out.push(probePointComment(index + 1, point));
    out.push(`G0 Z${fmt(safeZ)}`);
    out.push(`G0 X${fmt(point.machineX)} Y${fmt(point.machineY)}${Number.isFinite(point.machineA) ? ` A${fmt(point.machineA)}` : ""}`);
    if (Number.isFinite(point.machineZ)) out.push(`G0 Z${fmt(point.machineZ)}`);
    out.push(probeCommandForPoint(point, mode, safeZ, probeTravel, probeFeed, machineCenterY, machine));
  });
  out.push(`G0 Z${fmt(safeZ)}`, "M2", "");
  return out.join("\n");
}

function probeAxisForMode(mode) {
  if (mode === "cross-half") return "normal probe using Y/Z move and A-axis orientation";
  if (mode === "outline") return "Y side probe with A90 fixture";
  return "Z vertical probe";
}

function probePointComment(index, point) {
  const extras = [];
  if (Number.isFinite(point.z)) extras.push(`BZ${fmt(point.z)}`);
  if (Number.isFinite(point.probeTargetY)) extras.push(`TY${fmt(point.probeTargetY)}`);
  if (Number.isFinite(point.probeTargetZ)) extras.push(`TZ${fmt(point.probeTargetZ)}`);
  if (Number.isFinite(point.machineA)) extras.push(`A${fmt(point.machineA)}`);
  return `(P ${index} ${point.surface} BX${fmt(point.x)} BY${fmt(point.y)} MX${fmt(point.machineX)} MY${fmt(point.machineY)}${extras.length ? ` ${extras.join(" ")}` : ""})`;
}

function probeCommandForPoint(point, mode, safeZ, probeTravel, probeFeed, machineCenterY, machine) {
  if (mode === "cross-half") {
    const targetY = Number.isFinite(point.probeTargetY)
      ? point.probeTargetY
      : clampMachineY(machineCenterY + point.y, machine);
    const targetZ = Number.isFinite(point.probeTargetZ)
      ? point.probeTargetZ
      : clampMachineZ(point.z ?? safeZ, machine);
    return `G38.2 Y${fmt(targetY)} Z${fmt(targetZ)} F${fmt(probeFeed)}`;
  }
  if (mode === "outline") {
    const targetY = Number.isFinite(point.probeTargetY)
      ? point.probeTargetY
      : clampMachineY(machineCenterY + point.y, machine);
    return `G38.2 Y${fmt(targetY)} F${fmt(probeFeed)}`;
  }
  return `G38.2 Z${fmt(safeZ - probeTravel)} F${fmt(probeFeed)}`;
}

function probeMachineLimits() {
  return {
    x: clampNumber(els.scanMachineTravelX.value, 1, 3000, CNC_MACHINE_LIMITS_MM.x),
    y: CNC_MACHINE_LIMITS_MM.y,
    z: CNC_MACHINE_LIMITS_MM.z
  };
}

function measuredProbeLengthMm(board, scale) {
  const measured = Number(els.scanMeasuredLength.value);
  return Number.isFinite(measured) && measured > 0 ? measured : board.length * scale;
}

function machineProbePoint(point, machineCenterY, machine, mode = "ribs", probeTravel = 0) {
  if (mode === "cross-half") {
    const surfaceY = clampMachineY(point.y + machineCenterY, machine);
    const surfaceZ = clampMachineZ(point.z ?? 0, machine);
    const normal = normalizedVector(point.normalY ?? 1, point.normalZ ?? 0);
    const clearance = crossHalfProbeClearance(probeTravel);
    const overtravel = crossHalfProbeOvertravel(probeTravel);
    const targetY = clampMachineY(surfaceY - normal.y * overtravel, machine);
    const targetZ = clampMachineZ(surfaceZ - normal.z * overtravel, machine);
    return {
      ...point,
      machineX: clampMachineX(point.x, machine),
      machineY: clampMachineY(surfaceY + normal.y * clearance, machine),
      machineZ: clampMachineZ(surfaceZ + normal.z * clearance, machine),
      machineA: Number.isFinite(point.normalAngle) ? point.normalAngle : vectorAngleDeg(normal.y, normal.z),
      probeTargetY: targetY,
      probeTargetZ: targetZ
    };
  }
  if (mode === "outline") {
    const dir = point.y >= 0 ? 1 : -1;
    const targetY = clampMachineY(point.y + machineCenterY, machine);
    return {
      ...point,
      machineX: clampMachineX(point.x, machine),
      machineY: clampMachineY(targetY + dir * probeTravel, machine),
      probeTargetY: targetY,
      machineZ: Number.isFinite(point.z) ? clampMachineZ(point.z, machine) : undefined
    };
  }
  return {
    ...point,
    machineX: clampMachineX(point.x, machine),
    machineY: clampMachineY(point.y + machineCenterY, machine),
    machineZ: Number.isFinite(point.z) ? clampMachineZ(point.z, machine) : undefined
  };
}

function normalizedVector(y, z) {
  const length = Math.hypot(y, z);
  if (length <= 1e-9) return { y: 1, z: 0 };
  return { y: y / length, z: z / length };
}

function vectorAngleDeg(y, z) {
  return Math.atan2(z, y) * 180 / Math.PI;
}

function crossHalfProbeClearance(probeTravel) {
  return clampNumber(probeTravel * 0.18, 6, 20, 12);
}

function crossHalfProbeOvertravel(probeTravel) {
  return clampNumber(probeTravel * 0.08, 3, 12, 6);
}

function buildProbeScanPoints(board, mode, surfaceMode, scale, measuredLength, machine, xStep, yStep) {
  const surfaces = surfaceMode === "both" ? ["bottom", "deck"] : [surfaceMode];
  const points = [];
  if (mode === "outline") return buildOutlineSideProbePoints(board, measuredLength, xStep);
  if (mode === "cross-half") return buildHalfCrossSectionProbePoints(board, measuredLength, xStep, yStep, machine);
  surfaces.forEach(surface => {
    if (mode === "mesh") {
      points.push(...buildMeshProbePoints(board, surface, measuredLength, machine, xStep, yStep));
    } else {
      points.push(...buildRibProbePoints(board, surface, measuredLength, machine, xStep, yStep));
    }
  });
  return points;
}

function buildOutlineSideProbePoints(board, measuredLength, xStep) {
  const points = [];
  for (const x of probeXPositions(measuredLength, xStep)) {
    const half = boardCadWidthAtMeasuredX(board, x, measuredLength) / 2;
    const z = boardCadRockerZAtMeasuredX(board, x, measuredLength);
    points.push({ surface: "outline-right", phase: "outline-side", x, y: half, z });
  }
  return uniqueProbePoints(points);
}

function buildHalfCrossSectionProbePoints(board, measuredLength, xStep, yStep, machine) {
  const points = [];
  const xPositions = probeXPositions(measuredLength, xStep).filter((x, index, arr) =>
    index > 0 && index < arr.length - 1
  );
  for (const x of xPositions) {
    const half = boardCadWidthAtMeasuredX(board, x, measuredLength) / 2;
    const rocker = boardCadRockerZAtMeasuredX(board, x, measuredLength);
    const deck = boardCadDeckZAtMeasuredX(board, x, measuredLength);
    const thickness = Math.max(1, deck - rocker);
    const steps = Math.max(3, Math.ceil(half / Math.max(1, yStep)));
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const y = half * Math.sin(ratio * Math.PI);
      const z = deck - thickness * ratio;
      const normal = crossHalfOutwardNormal(half, thickness, ratio);
      points.push({
        surface: "cross-half",
        phase: `cross-section-${fmt(x)}`,
        x,
        y,
        z,
        normalY: normal.y,
        normalZ: normal.z,
        normalAngle: vectorAngleDeg(normal.y, normal.z)
      });
    }
  }
  return uniqueProbePoints(points);
}

function crossHalfOutwardNormal(half, thickness, ratio) {
  const tangentY = half * Math.PI * Math.cos(ratio * Math.PI);
  const tangentZ = -thickness;
  return normalizedVector(-tangentZ, tangentY);
}

function buildRibProbePoints(board, surface, measuredLength, machine, xStep, yStep) {
  const points = [];
  const xPositions = probeXPositions(measuredLength, xStep);
  for (const x of xPositions) {
    points.push({ surface, phase: "stringer", x, y: 0 });
  }
  for (const x of xPositions) {
    const half = boardCadWidthAtMeasuredX(board, x, measuredLength) / 2;
    const ys = symmetricOffsets(half, yStep, machine).filter(y => Math.abs(y) > 1e-6);
    ys.forEach(y => points.push({ surface, phase: "rib", x, y }));
  }
  return uniqueProbePoints(points);
}

function buildMeshProbePoints(board, surface, measuredLength, machine, xStep, yStep) {
  const points = [];
  for (const x of probeXPositions(measuredLength, xStep)) {
    const half = boardCadWidthAtMeasuredX(board, x, measuredLength) / 2;
    symmetricOffsets(half, yStep, machine).forEach(y => points.push({ surface, phase: "mesh", x, y }));
  }
  return uniqueProbePoints(points);
}

function probeXPositions(length, step) {
  const positions = [];
  for (let x = 0; x <= length + 1e-6; x += step) positions.push(Math.min(length, x));
  if (!positions.length || Math.abs(positions[positions.length - 1] - length) > 0.001) positions.push(length);
  return positions;
}

function boardCadWidthAtMeasuredX(board, xMm, measuredLength) {
  const ratio = measuredLength > 0 ? xMm / measuredLength : 0;
  const boardX = Math.max(0, Math.min(board.length, ratio * board.length));
  return boardCadWidthAtPos(board, boardX) * (measuredLength / Math.max(1e-6, board.length));
}

function boardCadRockerZAtMeasuredX(board, xMm, measuredLength) {
  const ratio = measuredLength > 0 ? xMm / measuredLength : 0;
  const boardX = Math.max(0, Math.min(board.length, ratio * board.length));
  return boardCadRockerAtPos(board, boardX) * (measuredLength / Math.max(1e-6, board.length));
}

function boardCadDeckZAtMeasuredX(board, xMm, measuredLength) {
  const ratio = measuredLength > 0 ? xMm / measuredLength : 0;
  const boardX = Math.max(0, Math.min(board.length, ratio * board.length));
  return boardCadDeckAtPos(board, boardX) * (measuredLength / Math.max(1e-6, board.length));
}

function symmetricOffsets(halfWidth, step, machine) {
  const half = Math.max(0, Math.min(machine.y / 2, halfWidth));
  const offsets = [0];
  for (let y = step; y <= half + 1e-6; y += step) {
    offsets.push(y, -y);
  }
  if (!offsets.some(y => Math.abs(Math.abs(y) - half) < 1e-6)) offsets.push(half, -half);
  return offsets.sort((a, b) => a - b);
}

function uniqueProbePoints(points) {
  const seen = new Set();
  return points.filter(point => {
    const key = `${point.surface}:${point.phase}:${fmt(point.x)}:${fmt(point.y)}:${Number.isFinite(point.z) ? fmt(point.z) : ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clampMachineX(x, machine = CNC_MACHINE_LIMITS_MM) {
  return Math.max(0, Math.min(machine.x, x));
}

function clampMachineY(y, machine = CNC_MACHINE_LIMITS_MM) {
  return Math.max(0, Math.min(machine.y, y));
}

function clampMachineZ(z, machine = CNC_MACHINE_LIMITS_MM) {
  return Math.max(-machine.z, Math.min(machine.z, z));
}

function probeScanWarnings(board, scale, points, safeZ, probeTravel, machineCenterY, measuredLength, machine) {
  const warnings = [];
  const length = measuredLength;
  const width = boardCadMaxWidth(board) * scale;
  if (length > machine.x) warnings.push(`measured board length ${fmt(length)}mm exceeds X travel`);
  if (width > machine.y) warnings.push(`board width ${fmt(width)}mm exceeds Y travel`);
  if (safeZ > machine.z) warnings.push(`safeZ ${fmt(safeZ)}mm exceeds Z travel`);
  if (safeZ - probeTravel < -machine.z) warnings.push("probe travel may exceed negative Z range");
  if (points.some(point => Math.abs(point.machineX - point.x) > 0.001)) warnings.push("some probe X points were clamped to machine travel");
  if (points.some(point => Math.abs((point.probeTargetY ?? point.machineY) - (point.y + machineCenterY)) > 0.001)) warnings.push("some probe target Y points were clamped to machine travel");
  if (points.some(point => Math.abs(point.machineY - clampMachineY(point.machineY, machine)) > 0.001)) warnings.push("some probe start Y points were clamped to machine travel");
  if (!points.length) warnings.push("no probe points generated");
  return warnings;
}

function makeCncModel(board) {
  const displayLength = boardCadTailDisplayLength(board);
  let maxHalfWidth = 0;
  for (let i = 0; i <= 80; i++) {
    maxHalfWidth = Math.max(maxHalfWidth, boardCadDisplayWidthAtPos(board, displayLength * (i / 80)) * 0.5);
  }
  return {
    board,
    displayLength,
    maxHalfWidth,
    outline: flattenSpline(board.outline),
    bottom: flattenSpline(board.bottom),
    surfaceSamples: new Map(),
    surfaceStepSamples: new Map(),
    rowCache: new Map(),
    passCache: new Map(),
    sections: board.sections
      .filter(section => section.spline.length >= 3)
      .sort((a, b) => a.position - b.position)
  };
}

function buildCncPasses(model, surface, side, lengthSteps, widthSteps) {
  const cacheKey = `${surface}:${side}:${lengthSteps}:${widthSteps}`;
  const cached = model.passCache.get(cacheKey);
  if (cached) return cached;
  if (side < 0) {
    const positive = buildCncPasses(model, surface, 1, lengthSteps, widthSteps);
    const mirrored = positive.map(pass => pass.map(point => ({
      x: point.x,
      y: -point.y,
      z: point.z,
      a: -point.a,
      b: -point.b
    })));
    model.passCache.set(cacheKey, mirrored);
    return mirrored;
  }
  const passes = [];
  const rows = getCncRows(model, surface, lengthSteps, widthSteps, side);
  for (let passIndex = 0; passIndex <= widthSteps; passIndex++) {
    const pass = [];
    for (let i = 0; i <= lengthSteps; i++) {
      const rowIndex = passIndex % 2 === 0 ? i : (lengthSteps - i);
      const sample = rows[rowIndex]?.[passIndex] || null;
      if (sample) pass.push(sample);
    }
    passes.push(pass);
  }
  model.passCache.set(cacheKey, passes);
  return passes;
}

function getCncRows(model, surface, lengthSteps, widthSteps, side) {
  const cacheKey = `${surface}:${side}:${lengthSteps}:${widthSteps}`;
  const cached = model.rowCache.get(cacheKey);
  if (cached) return cached;
  if (side < 0) {
    const positive = getCncRows(model, surface, lengthSteps, widthSteps, 1);
    const mirrored = positive.map(row => row.map(point => ({
      x: point.x,
      y: -point.y,
      z: point.z,
      a: -point.a,
      b: -point.b
    })));
    model.rowCache.set(cacheKey, mirrored);
    return mirrored;
  }
  const rows = [];
  for (let i = 0; i <= lengthSteps; i++) {
    const x = model.displayLength * (i / lengthSteps);
    rows.push(sampleSurfaceRow(model, x, surface, widthSteps, side));
  }
  model.rowCache.set(cacheKey, rows);
  return rows;
}

function sampleSurfaceBase(model, x, surface) {
  const { rawX, displayX } = boardCadSampleXPair(model.board, x);
  const sampleKey = `${surface}:${rawX.toFixed(4)}`;
  let cached = model.surfaceSamples.get(sampleKey);
  if (!cached) {
    const sectionKnots = boardCadInterpolatedCrossSectionKnots(model.board, rawX);
    if (!sectionKnots.length) return null;
    cached = {
      displayX,
      rocker: boardCadRockerAtPos(model.board, rawX),
      sectionKnots,
      localHalfWidth: Math.max(1e-6, boardCadSplineMaxX(sectionKnots))
    };
    model.surfaceSamples.set(sampleKey, cached);
  }
  return cached;
}

function sampleSurfaceRow(model, x, surface, widthSteps, side) {
  const base = sampleSurfaceBase(model, x, surface);
  if (!base) return [];
  const sampleKey = `${surface}:${base.displayX.toFixed(4)}:${widthSteps}`;
  let stepped = model.surfaceStepSamples.get(sampleKey);
  if (!stepped) {
    stepped = [];
    const globalHalfWidth = Math.max(1e-6, Number(model.maxHalfWidth) || 0);
    const localHalfWidth = Math.max(1e-6, Number(base.localHalfWidth) || 0);
    const sampleHeightAt = surface === "deck" ? boardCadCrossSectionDeckAt : boardCadCrossSectionBottomAt;
    for (let widthIndex = 0; widthIndex <= widthSteps; widthIndex++) {
      const fraction = widthIndex / Math.max(1, widthSteps);
      const targetY = Math.min(localHalfWidth, globalHalfWidth * fraction);
      const point = {
        x: targetY,
        y: sampleHeightAt(base.sectionKnots, targetY)
      };
      const tangent = {
        x: 1,
        y: boardCadCrossSectionSurfaceSlopeAt(base.sectionKnots, targetY, surface)
      };
      stepped.push({ point, tangent });
    }
    model.surfaceStepSamples.set(sampleKey, stepped);
  }
  return stepped.map(({ point, tangent }) => sampleSurfacePoint(model, base, point, tangent, side));
}

function sampleSurfacePoint(model, base, point, tangent, side) {
  const y = side * Math.abs(point.x);
  const z = base.rocker + point.y;
  const slope = tangent ? Math.atan2(tangent.y, Math.max(1e-6, Math.abs(tangent.x))) : 0;
  return {
    x: base.displayX,
    y,
    z,
    a: rotaryA(y, z, model.board.thickness),
    b: side * radToDeg(slope)
  };
}

function surfaceProfile(section, surface) {
  if (!section.length) return [];
  let maxIndex = 0;
  for (let i = 1; i < section.length; i++) {
    if (Math.abs(section[i].x) > Math.abs(section[maxIndex].x)) maxIndex = i;
  }
  if (surface === "deck") {
    return section.slice(maxIndex).reverse();
  }
  return section.slice(0, maxIndex + 1);
}

function blendPolylines(a, b, t) {
  const count = Math.max(a.length, b.length);
  const out = [];
  // Precompute once: pointAtPolylineFraction otherwise recomputes the full
  // cumulative-length array from scratch on every call (O(n) per point,
  // O(n²) total). Passing the same array in is bit-identical since the
  // arrays are read-only within pointAtPolylineFraction.
  const lengthsA = cumulativeLengths(a);
  const lengthsB = cumulativeLengths(b);
  for (let i = 0; i < count; i++) {
    const f = count <= 1 ? 0 : i / (count - 1);
    const pa = pointAtPolylineFraction(a, f, lengthsA);
    const pb = pointAtPolylineFraction(b, f, lengthsB);
    out.push({
      x: lerp(pa.x, pb.x, t),
      y: lerp(pa.y, pb.y, t)
    });
  }
  return out;
}

function pointAtPolylineFraction(points, fraction, lengths = null) {
  if (!points.length) return { x: 0, y: 0 };
  if (points.length === 1) return { ...points[0] };
  const pathLengths = lengths || cumulativeLengths(points);
  const target = clamp01(fraction) * pathLengths[pathLengths.length - 1];
  for (let i = 1; i < pathLengths.length; i++) {
    if (target <= pathLengths[i]) {
      const span = Math.max(1e-6, pathLengths[i] - pathLengths[i - 1]);
      const t = (target - pathLengths[i - 1]) / span;
      return {
        x: lerp(points[i - 1].x, points[i].x, t),
        y: lerp(points[i - 1].y, points[i].y, t)
      };
    }
  }
  return { ...points[points.length - 1] };
}

function cumulativeLengths(points) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  }
  if (lengths[lengths.length - 1] <= 1e-6) {
    return points.map((_, i) => i);
  }
  return lengths;
}

function profileYAt(points, x) {
  if (!points.length) return 0;
  if (x <= points[0].x) return points[0].y;
  for (let i = 1; i < points.length; i++) {
    if (x <= points[i].x) {
      const t = (x - points[i - 1].x) / Math.max(1e-6, points[i].x - points[i - 1].x);
      return lerp(points[i - 1].y, points[i].y, t);
    }
  }
  return points[points.length - 1].y;
}

function machinePoint(point, scale, axes) {
  return {
    x: point.x * scale,
    y: point.y * scale,
    z: point.z * scale,
    a: axes >= 4 ? point.a : 0,
    b: axes >= 5 ? point.b : 0
  };
}

function rotaryA(y, z, thickness) {
  const centerZ = Math.max(0, thickness || 0) / 2;
  return radToDeg(Math.atan2(y, z - centerZ));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function radToDeg(value) {
  return value * 180 / Math.PI;
}

function makePdf(board) {
  const width = 842;
  const height = 595;
  const margin = 36;
  const exportBoard = prepareBoardForBrdExport(board);
  const outline = outlineFullPoints(exportBoard);
  const profile = tailAdjustedProfileGeometry(exportBoard);
  const bottom = profile.bottom;
  const deck = profile.deck;
  const title = asciiPdfText(exportBoard.name || exportBoard.filename);
  const pages = [
    makePdfPage(
      `Outline - ${title}`,
      drawPdfOutline(outline, width, height, margin),
      width,
      height
    ),
    makePdfPage(
      `Rocker - ${title}`,
      drawPdfRocker(bottom, deck, width, height, margin),
      width,
      height
    ),
    makePdfPage(
      `Sections - ${title}`,
      drawPdfSections(exportBoard.sections, width, height, margin),
      width,
      height
    )
  ];
  return buildPdf(pages, width, height);
}

const PDF_POINTS_PER_CM = 72 / 2.54;

function makeTemplatePdf(board) {
  const width = 842;
  const height = 595;
  const margin = 36;
  const title = asciiPdfText(board.name || board.filename);
  const exportBoard = prepareBoardForBrdExport(board);
  const profile = tailAdjustedProfileGeometry(exportBoard);
  const pages = [];
  const outline = outlineFullPoints(exportBoard);
  pages.push(...makeTiledPdfPages(
    `Outline template - ${title}`,
    outline,
    (t, pageLabel) => [
      "0.05 0.46 0.43 RG 0.8 w",
      pdfPath(outline, t, true),
      "0.58 0.64 0.72 RG 0.35 w",
      pdfLine(t.x(0), t.y(0), t.x(boardCadTailDisplayLength(exportBoard)), t.y(0)),
      textPdf(pageLabel, margin, height - 52, 8)
    ].join("\n"),
    width,
    height,
    margin
  ));

  const deckReverse = reverseSpline(profile.deckDisplayKnots);
  const profilePoints = profile.bottom.concat(profile.deck);
  pages.push(...makeTiledPdfPages(
    `Profile template - ${title}`,
    profilePoints,
    (t, pageLabel) => [
      "0.12 0.16 0.22 RG 0.8 w",
      pdfSplinePath(profile.bottomDisplayKnots, t, false),
      "0.70 0.32 0.04 RG 0.8 w",
      pdfSplinePath(deckReverse, t, false),
      "0.58 0.64 0.72 RG 0.35 w",
      pdfLine(t.x(0), t.y(0), t.x(profile.displayBoard.length), t.y(0)),
      textPdf(pageLabel, margin, height - 52, 8)
    ].join("\n"),
    width,
    height,
    margin
  ));

  exportBoard.sections.filter(section => section.spline.length >= 2).forEach((section, index) => {
    const right = section.spline;
    const left = mirrorSplineXReverse(right);
    const points = flattenSpline(right).concat(flattenSpline(left));
    pages.push(...makeTiledPdfPages(
      t("pdf_cross_section_title", {
        index: index + 1,
        position: fmt(section.position),
        title
      }),
      points,
      (t, pageLabel) => [
        "0.20 0.25 0.33 RG 0.8 w",
        pdfSplinePath(left, t, false),
        pdfSplinePath(right, t, false),
        "0.58 0.64 0.72 RG 0.35 w",
        pdfLine(t.x(0), t.y(0), t.x(0), t.y(boardCadCrossSectionMaxY(right))),
        textPdf(pageLabel, margin, height - 52, 8)
      ].join("\n"),
      width,
      height,
      margin
    ));
  });
  return buildPdf(pages, width, height);
}

function makeTiledPdfPages(title, points, drawBody, width, height, margin) {
  if (!points.length) return [makePdfPage(title, textPdf("No data", margin, height - 64, 10), width, height)];
  const bounds = pointBounds(points);
  const usableW = width - margin * 2;
  const usableH = height - margin * 2 - 24;
  const tileWorldW = usableW / PDF_POINTS_PER_CM;
  const tileWorldH = usableH / PDF_POINTS_PER_CM;
  const cols = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) / tileWorldW));
  const rows = Math.max(1, Math.ceil((bounds.maxY - bounds.minY) / tileWorldH));
  const pages = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tile = {
        minX: bounds.minX + col * tileWorldW,
        minY: bounds.minY + row * tileWorldH
      };
      const transform = fixedPdfTransform(tile, margin, margin, PDF_POINTS_PER_CM);
      const pageLabel = `${title} page ${row * cols + col + 1}/${rows * cols}`;
      const body = [
        drawPdfTemplateGrid(transform, tile, tileWorldW, tileWorldH),
        drawBody(transform, pageLabel),
        drawPdfTemplateMarks(transform, tile, tileWorldW, tileWorldH)
      ].join("\n");
      pages.push(makePdfPage(pageLabel, body, width, height));
    }
  }
  return pages;
}

function fixedPdfTransform(tile, left, bottom, scale) {
  return {
    x: x => left + (x - tile.minX) * scale,
    y: y => bottom + (y - tile.minY) * scale,
    scale
  };
}

function pointBounds(points) {
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}

function boardCadCrossSectionMaxY(knots) {
  const points = flattenSpline(knots);
  return points.length ? Math.max(...points.map(point => point.y)) : 0;
}

function drawPdfTemplateGrid(t, tile, tileWorldW, tileWorldH) {
  const lines = ["0.88 0.90 0.94 RG 0.25 w"];
  const startX = Math.ceil(tile.minX / 10) * 10;
  for (let x = startX; x <= tile.minX + tileWorldW; x += 10) {
    lines.push(pdfLine(t.x(x), t.y(tile.minY), t.x(x), t.y(tile.minY + tileWorldH)));
  }
  const startY = Math.ceil(tile.minY / 10) * 10;
  for (let y = startY; y <= tile.minY + tileWorldH; y += 10) {
    lines.push(pdfLine(t.x(tile.minX), t.y(y), t.x(tile.minX + tileWorldW), t.y(y)));
  }
  return lines.join("\n");
}

function drawPdfTemplateMarks(t, tile, tileWorldW, tileWorldH) {
  const x0 = t.x(tile.minX);
  const y0 = t.y(tile.minY);
  const x1 = t.x(tile.minX + tileWorldW);
  const y1 = t.y(tile.minY + tileWorldH);
  return [
    "0 0 0 RG 0.35 w",
    pdfLine(x0, y0, x0 + 14, y0),
    pdfLine(x0, y0, x0, y0 + 14),
    pdfLine(x1, y0, x1 - 14, y0),
    pdfLine(x1, y0, x1, y0 + 14),
    pdfLine(x0, y1, x0 + 14, y1),
    pdfLine(x0, y1, x0, y1 - 14),
    pdfLine(x1, y1, x1 - 14, y1),
    pdfLine(x1, y1, x1, y1 - 14)
  ].join("\n");
}

function makePdfPage(title, body, width, height) {
  return [
    `0.95 0.97 0.98 rg 0 0 ${width} ${height} re f`,
    "0 0 0 RG 1 w",
    textPdf(`BoardCAD Web - ${title}`, 36, height - 30, 14),
    body
  ].join("\n");
}

function drawPdfOutline(outline, width, height, margin) {
  const t = fitPdfTransform(outline, width, height, margin, 42);
  return [
    "0.05 0.46 0.43 RG 1.2 w",
    pdfPath(outline, t, true),
    drawPdfScaleBar(outline, t, margin, margin - 8),
    textPdf("Top outline", margin, height - 52, 10)
  ].join("\n");
}

function drawPdfRocker(bottom, deck, width, height, margin) {
  const all = bottom.concat(deck);
  const t = fitPdfTransform(all, width, height, margin, 42);
  return [
    "0.12 0.16 0.22 RG 1 w",
    pdfPath(bottom, t, false),
    "0.70 0.32 0.04 RG 1 w",
    pdfPath(deck, t, false),
    "0.58 0.64 0.72 RG 0.6 w",
    pdfLine(t.x(bottom[0]?.x || 0), t.y(0), t.x(bottom[bottom.length - 1]?.x || 1), t.y(0)),
    textPdf("Bottom", margin, height - 52, 10),
    textPdf("Deck", margin + 72, height - 52, 10),
    drawPdfScaleBar(all, t, margin, margin - 8)
  ].join("\n");
}

function drawPdfSections(sections, width, height, margin) {
  const usable = sections.filter(section => section.spline.length >= 3);
  if (!usable.length) return textPdf("No section data", margin, height - 64, 10);
  const cols = 3;
  const rows = Math.ceil(usable.length / cols);
  const cellW = (width - margin * 2) / cols;
  const cellH = (height - margin * 2 - 28) / rows;
  return usable.map((section, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const rect = {
      left: margin + col * cellW + 8,
      top: margin + row * cellH + 8,
      width: cellW - 16,
      height: cellH - 26
    };
    const half = flattenSpline(section.spline);
    const full = half.slice().reverse().map(p => ({ x: -p.x, y: p.y })).concat(half);
    const t = fitRectTransform(full, rect);
    return [
      "0.20 0.25 0.33 RG 0.8 w",
      pdfPath(full, t, true),
      textPdf(`${fmt(section.position)}`, rect.left, rect.top + rect.height + 12, 8)
    ].join("\n");
  }).join("\n");
}

function fitPdfTransform(points, width, height, margin, headerSpace = 34) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = Math.min((width - margin * 2) / Math.max(1e-6, maxX - minX), (height - margin * 2 - headerSpace) / Math.max(1e-6, maxY - minY));
  return {
    x: x => margin + (x - minX) * scale,
    y: y => margin + (y - minY) * scale
  };
}

function fitRectTransform(points, rect) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = Math.min(rect.width / Math.max(1e-6, maxX - minX), rect.height / Math.max(1e-6, maxY - minY));
  return {
    x: x => rect.left + (rect.width - (maxX - minX) * scale) / 2 + (x - minX) * scale,
    y: y => rect.top + (rect.height - (maxY - minY) * scale) / 2 + (y - minY) * scale
  };
}

function pdfPath(points, t, close) {
  if (!points.length) return "";
  const parts = [`${fmt(t.x(points[0].x))} ${fmt(t.y(points[0].y))} m`];
  for (const p of points.slice(1)) parts.push(`${fmt(t.x(p.x))} ${fmt(t.y(p.y))} l`);
  if (close) parts.push("h");
  parts.push("S");
  return parts.join("\n");
}

function pdfSplinePath(knots, t, close) {
  if (!knots || !knots.length) return "";
  const parts = [`${fmt(t.x(knots[0].p.x))} ${fmt(t.y(knots[0].p.y))} m`];
  for (let i = 0; i < knots.length - 1; i++) {
    const a = knots[i];
    const b = knots[i + 1];
    parts.push([
      fmt(t.x(a.next.x)),
      fmt(t.y(a.next.y)),
      fmt(t.x(b.prev.x)),
      fmt(t.y(b.prev.y)),
      fmt(t.x(b.p.x)),
      fmt(t.y(b.p.y)),
      "c"
    ].join(" "));
  }
  if (close) parts.push("h");
  parts.push("S");
  return parts.join("\n");
}

function pdfLine(x1, y1, x2, y2) {
  return `${fmt(x1)} ${fmt(y1)} m ${fmt(x2)} ${fmt(y2)} l S`;
}

function drawPdfScaleBar(points, transform, x, y) {
  if (!points.length) return "";
  const xs = points.map(p => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const drawingLength = Math.max(1, maxX - minX);
  const barLength = drawingLength >= 100 ? 50 : 10;
  const x1 = transform.x(minX);
  const x2 = transform.x(minX + barLength);
  return [
    "0 0 0 RG 0.8 w",
    pdfLine(x1, y, x2, y),
    pdfLine(x1, y - 3, x1, y + 3),
    pdfLine(x2, y - 3, x2, y + 3),
    textPdf(`${barLength} input units`, x1, y + 8, 8)
  ].join("\n");
}

function textPdf(text, x, y, size) {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${escapePdf(text)}) Tj ET`;
}

function buildPdf(pages, width, height) {
  const pageCount = pages.length;
  const kids = pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`
  ];
  pages.forEach((content, index) => {
    const pageObj = 3 + index * 2;
    const contentObj = pageObj + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${3 + pageCount * 2} 0 R >> >> /Contents ${contentObj} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function escapePdf(text) {
  return String(text).replace(/[\\()]/g, "\\$&");
}

function asciiPdfText(text) {
  return String(text).replace(/[^\x20-\x7e]/g, "_");
}

function fmt(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, "");
}

function safeName(name) {
  return (name || "board").replace(/[^\w.-]+/g, "_");
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

window.boardcadWeb = {
  state,
  parseBrd,
  makeBrd,
  makeOtl,
  makePfl,
  makePdf,
  makeTemplatePdf,
  makeDxfOutlineSpline,
  makeDxfProfileSpline,
  makeDxfCrossSectionSpline,
  makeDxfOutline,
  makeDxfProfile,
  makeDxfCrossSection,
  makeLaserGCode,
  makeCncGCode,
  makeProbeScanGCode,
  boardFromProbeMeasurements,
  fmt,
  _test: {
    boardCadCurveCoeff,
    boardCadSplitCurveKnot,
    boardCadCurveClosestT,
    boardCadSplineValueAt,
    addCrossSectionAt,
    nextCrossSection,
    previousCrossSection,
    moveCurrentCrossSectionTo,
    removeCurrentCrossSection,
    copyCurrentCrossSection,
    pasteCurrentCrossSection,
    boardCadCrossSectionAreaAt,
    boardCadCrossSectionWidth,
    boardCadCrossSectionCenterThickness,
    boardCadCrossSectionBottomAt,
    boardCadCrossSectionDeckAt,
    boardCadVolume,
    boardCadCenterOfMass,
    boardCadMaxThickness,
    boardCadWeightEstimate,
    boardCadWidthAtPos,
    findCrossSectionIndexNear,
    normalizedCrossSectionInterval,
    crossSectionIntervalPositions,
    dedupeSectionPositions,
    ensureCrossSectionsAtPositions,
    bottomFeatureSectionPositions,
    ensureCrossSectionsForBottomFeature,
    ensureCrossSectionsForBottomFeatures,
    fillCrossSectionsByInterval,
    boardCadInnerWidthAtPos,
    boardCadDisplayWidthAtPos,
    boardCadDisplayInnerWidthAtPos,
    empiricalTailWidthTarget,
    bottomPresetContext,
    normalizeBottomPresetKey,
    bottomPresetFeatures,
    bottomFeatureMetaText,
    bottomFeatureDefault,
    applyBottomFeatureTypeDefaults,
    normalizeBottomFeatureType,
    normalizeBottomFeatures,
    normalizeRockerPresetKey,
    rockerPresetOrDefault,
    defaultRockerConfig,
    normalizeRockerConfig,
    parseRockerConfig,
    serializeRockerConfig,
    rockerMeasurementStations,
    rockerStationMeasurements,
    rockerTargetCurvePoints,
    applyRockerConfigToBoard,
    boardCadMaxRawWidthPos,
    boardCadRockerApexPos,
    distributeBottomFeatureRangesEvenly,
    bottomFeaturesNeedLegacyRedistribution,
    normalizeLegacyBottomFeatureLayout,
    parseBottomFeatures,
    serializeBottomFeatures,
    bottomFeatureEnvelopeAt,
    bottomFeatureAffectedSections,
    activeBottomFeaturesAt,
    drawOutlineBottomFeatureRanges,
    bottomFeatureRailAnchorX,
    insertLowerHalfSplineKnotAtX,
    insertBottomFeatureAnchorKnots,
    ensureBottomFeatureAnchorsOnSections,
    rebuildBoardBottomFeatureSections,
    bottomFeatureLateralProfile,
    applyBottomFeaturesToSectionKnots,
    sanitizeBottomFeaturePanelValues,
    setBottomFeatureHandles,
    setBottomFeatureSectionHandles,
    moveBottomFeatureDrag,
    moveBottomFeatureSectionDrag,
    boardCadTailWidthLandmarks,
    normalizedWingConfig,
    normalizeTailModeKey,
    normalizeNoseModeKey,
    nosePresetForBoard,
    normalizedNoseConfig,
    normalizedTailConfig,
    boardCadTailPlanform,
    boardCadSampleXPair,
    boardCadThicknessAtPos,
    boardCadRockerAtPos,
    boardCadInterpolatedDisplayCrossSectionKnots,
    boardCadCrossSectionBottomAt,
    boardCadNoseOnlyPlanform,
    mergeOutlineWithCorners,
    boardCadTailOnlyPlanform,
    outlineSplineParts,
    wingAdjustedOutlineHalfPoints,
    tailOuterHalfWidthAt,
    tailInnerHalfWidthAt,
    boardCadTailDisplayShift,
    boardCadTailDisplayLength,
    boardCadRawXFromDisplayX,
    boardCadDisplayXFromRawX,
    outlineFullPoints,
    tailAdjustedProfileGeometry,
    scaleBoardTo,
    makeBrd,
    makeOtl,
    makePfl,
    makeTemplatePdf,
    makeDxfOutlineSpline,
    makeDxfProfileSpline,
    makeDxfCrossSectionSpline,
    setCrossSectionInterpolation,
    approximate3DModel,
    clear3DApproximation,
    boardCadSurfaceAngleLine,
    boardCadSurfacePointAtAngle,
    boardCadSurfacePointAtFraction,
    boardCadSurfaceRowAt,
    getToolpathPreviewPaths,
    getProjectedToolpathPreviewPaths,
    makeCncModel,
    buildCncPasses,
    sampleSurfaceBase,
    sampleSurfaceRow,
    makeDxfOutline,
    makeDxfProfile,
    makeDxfCrossSection,
    makeProbeScanGCode,
    boardFromProbeMeasurements,
    measurementsToBoardCoordinates,
    probeMeasurementLength,
    parseProbeSimulation,
    boardCadSurfacePointByAngleRange,
    getModel3DWorldLines,
    getProjectedModel3DLines,
    boardCadRibBezierWorldKnots,
    trimHalfSplineFromX,
    boardCadSByNormalReverse,
    boardCadPointByNormalReverse,
    boardCadSplineSamples,
    boardCadCrossSectionScaleTo,
    boardCadCloneKnots,
    scanGhostProfile,
    scanGhostOutline,
    scanGhostCrossSection,
    fitCrossSectionBezierFromScanPoints,
    prepareCrossSectionFitPoints,
    adaptiveCrossSectionFitPoints,
    crossSectionFitError,
    defaultTracePlacement,
    drawTraceImage,
    syncTracePanel,
    moveTraceImage,
    centerTraceImage,
    finTemplateKey,
    finSetupKey,
    finSetupLabel,
    normalizedFins,
    moveFinDrag,
    finToeInFromFins,
    finToeInFromSegment,
    finSetupPreset,
    applyFinSetupPreset,
    normalizeFinExtra,
    moveWingDrag,
    syncBottomFeaturePanel,
    activeBottomFeatureCount,
    syncBottomFeatureList,
    normalizeRailModeKey,
    normalizeEdgeTypeKey,
    normalizedEdgeConfig,
    edgeEffectAtSection,
    railModeSpec,
    applyRailModeToSection,
    applyEdgeModeToSection,
    applyBoardRailAndEdgeToSection,
    railProfilePointsForMode,
    railBandGuideGeometry,
    addBottomFeatureFromPanel,
    setBottomFeatureFromPanel,
    fillSelectedBottomFeatureSectionsFromPanel,
    removeBottomFeatureFromPanel,
    moveBottomFeatureFromPanel,
    boardWithPendingBottomFeaturePreview,
    loadGhostBoard,
    scaleGhostToCurrentBoard,
    moveGhostByKey,
    ghostCommandAvailable,
    transformGhostPoint,
    transformGhostPoints,
    ghostTransformSummary,
    rotateBoardPoint,
    projectBoardPoint,
    filterVisibleModelLines,
    smoothPathSegmentControls,
    cubicBezierPoint,
    parseMeasurementsFromLog,
    parseProbeMeasurementsCsv,
    measurementsToCsv,
    parseCrossSectionText,
    serializeCrossSection,
    importCrossSectionText,
    importOutlineText,
    importProfileText,
    importProbeMeasurementsText,
    createNewBoard,
    openBoardFilePicker,
    openGhostBoardFilePicker,
    loadSelectedSample,
    loadBundledSample,
    loadSampleByUrl,
    sampleFilenameFromUrl,
    applySampleBoardDefaults,
    promptSettings,
    applySettingsFromMenu,
    syncSettingsControls,
    promptLanguage,
    setLanguage,
    VALID_VIEWS,
    VIEW_OPTION_KEYS,
    ACTION_HANDLERS,
    promptScaleBoard,
    promptAddCrossSection,
    showBoardInfo,
    showHelp,
    showAbout,
    hideAppDialog,
    submitDialogValues,
    setView,
    setActiveTool,
    fitView,
    draw,
    commitBoardMutation,
    updateInfo,
    updateSectionInfo,
    updateEditInfo,
    applyBoardCadDerivedMetrics,
    undoEdit,
    redoEdit,
    syncViewOptionInputs,
    setFinsFromPanel,
    promptAddGuidePoint,
    promptEditGuidePoint,
    removeGuidePoint,
    editSelectedGuidePoint,
    editGuidePointFromPanel,
    addControlPoint,
    deleteSelectedControlPoint,
    setSelectedControlPointFromPanel,
    addCrossSectionFromPanel,
    moveCrossSectionFromPanel,
    fillCrossSectionsFromPanel,
    updateControlPointPanel,
    updateSectionInfo,
    addGuidePointAtContext,
    deleteSelectedGuidePoint,
    moveSelectedControlPointByKey,
    moveSelectedGuidePointByKey,
    draw
  }
};

const railTemplateCache = new Map();

let bottomFeatureOverlaySyncQueued = false;
let bottomFeatureOverlaySignature = "";
let bottomFeatureOverlayDrag = null;
let bottomFeatureOverlayHandleId = 1;
let bottomFeatureOverlaySliderActive = false;
let bottomFeatureOverlayDrawQueued = false;
let bottomFeatureOverlayControlsCollapsed = false;
let bottomFeatureOverlayControlsPosition = null;
let bottomFeatureOverlayControlsDrag = null;
const bottomFeatureOverlayHandleMap = new Map();

function removeBottomFeatureDomOverlay() {
  if (typeof document === "undefined") return;
  stopBottomFeatureOverlayDrag();
  document.getElementById("bottom-feature-dom-overlay")?.remove();
  bottomFeatureOverlayHandleMap.clear();
  bottomFeatureOverlaySignature = "";
}

function stopBottomFeatureOverlayDrag() {
  if (!bottomFeatureOverlayDrag || typeof window === "undefined") return;
  if (bottomFeatureOverlayDrag.move) window.removeEventListener("pointermove", bottomFeatureOverlayDrag.move);
  if (bottomFeatureOverlayDrag.up) window.removeEventListener("pointerup", bottomFeatureOverlayDrag.up);
  if (bottomFeatureOverlayDrag.cancel) window.removeEventListener("pointercancel", bottomFeatureOverlayDrag.cancel);
  bottomFeatureOverlayDrag = null;
}

function stopBottomFeatureOverlayControlsDrag() {
  if (!bottomFeatureOverlayControlsDrag || typeof window === "undefined") return;
  if (bottomFeatureOverlayControlsDrag.move) window.removeEventListener("pointermove", bottomFeatureOverlayControlsDrag.move);
  if (bottomFeatureOverlayControlsDrag.up) window.removeEventListener("pointerup", bottomFeatureOverlayControlsDrag.up);
  if (bottomFeatureOverlayControlsDrag.cancel) window.removeEventListener("pointercancel", bottomFeatureOverlayControlsDrag.cancel);
  bottomFeatureOverlayControlsDrag = null;
}

function startBottomFeatureOverlayControlsDrag(event, canvasRect) {
  if (typeof window === "undefined") return;
  event.preventDefault();
  event.stopPropagation();
  stopBottomFeatureOverlayControlsDrag();
  const startX = Number(event.clientX) || 0;
  const startY = Number(event.clientY) || 0;
  const currentLeft = Number.isFinite(bottomFeatureOverlayControlsPosition?.left)
    ? bottomFeatureOverlayControlsPosition.left
    : (canvasRect.left + 14);
  const currentTop = Number.isFinite(bottomFeatureOverlayControlsPosition?.top)
    ? bottomFeatureOverlayControlsPosition.top
    : (canvasRect.top + 14);
  const width = 252;
  const move = moveEvent => {
    const dx = (Number(moveEvent.clientX) || 0) - startX;
    const dy = (Number(moveEvent.clientY) || 0) - startY;
    bottomFeatureOverlayControlsPosition = {
      left: Math.max(8, currentLeft + dx),
      top: Math.max(8, currentTop + dy)
    };
    bottomFeatureOverlaySignature = "";
    scheduleBottomFeatureDomOverlaySync();
  };
  const up = () => {
    stopBottomFeatureOverlayControlsDrag();
  };
  const cancel = () => {
    stopBottomFeatureOverlayControlsDrag();
  };
  bottomFeatureOverlayControlsDrag = { move, up, cancel, width };
  window.addEventListener("pointermove", move, { passive: false });
  window.addEventListener("pointerup", up, { passive: false });
  window.addEventListener("pointercancel", cancel, { passive: false });
}

function startBottomFeatureOverlayDrag(handle, event) {
  if (!state.board || !handle || typeof window === "undefined") return;
  const panelIndex = Number.isFinite(Number(handle.listIndex)) ? Number(handle.listIndex) : Number(handle.featureIndex);
  if (handle.mode === "outline" && handle.kind === "range") {
    event.preventDefault();
    event.stopPropagation();
    stopBottomFeatureOverlayDrag();
    persistBottomFeaturePanelSelection(bottomFeatureSelectionIndex());
    state.selection = null;
    clearGuidePointSelection();
    state.wingSelection = null;
    state.bottomFeatureSelection = normalizedBottomFeatureSelection(handle);
    syncBottomFeaturePanel(panelIndex);
    updateBoardPanel();
    updateEditInfo();
    draw();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  stopBottomFeatureOverlayDrag();
  state.selection = null;
  clearGuidePointSelection();
  state.wingSelection = null;
  const handleFeatureIndex = Number(handle.featureIndex);
  const liveFeature = Number.isInteger(handleFeatureIndex) && handleFeatureIndex >= 0
    ? normalizeBottomFeature(state.board?.bottomFeatures?.[handleFeatureIndex], handleFeatureIndex)
    : null;
  const currentHandle = {
    ...handle,
    feature: liveFeature ? { ...liveFeature } : (handle.feature ? { ...handle.feature } : null)
  };
  state.bottomFeatureSelection = normalizedBottomFeatureSelection(currentHandle);
  state.lastEditPoint = boardPointFromHandleEvent(currentHandle, event);
  syncBottomFeaturePanel(panelIndex);
  state.drag = {
    type: currentHandle.mode === "section" ? "bottom-feature-section" : "bottom-feature",
    handle: currentHandle,
    before: cloneBoard(state.board),
    start: boardPointFromHandleEvent(currentHandle, event),
    overlayAnchorBoardX: Number.isFinite(currentHandle.overlayScreenX) ? currentHandle.transform.invX(currentHandle.overlayScreenX) : null,
    handleBoardX: Number.isFinite(currentHandle.x) ? currentHandle.x : null,
    startScreenY: Number.isFinite(event?.clientY) ? Number(event.clientY) : canvasPoint(event).y,
    originalFeature: currentHandle.feature ? { ...currentHandle.feature } : null,
    moved: false
  };
  const move = moveEvent => onCanvasPointerMove(moveEvent);
  const up = upEvent => {
    stopBottomFeatureOverlayDrag();
    onCanvasPointerUp(upEvent);
  };
  const cancel = () => {
    stopBottomFeatureOverlayDrag();
    state.drag = null;
    draw();
  };
  bottomFeatureOverlayDrag = { move, up, cancel };
  window.addEventListener("pointermove", move, { passive: false });
  window.addEventListener("pointerup", up, { passive: false });
  window.addEventListener("pointercancel", cancel, { passive: false });
  updateBoardPanel();
  updateEditInfo();
  updateHistoryButtons();
  draw();
}

function bottomFeatureOverlayPointerDown(event) {
  const target = event.target?.closest?.("[data-bottom-feature-overlay-handle]");
  if (!target) return;
  const handle = bottomFeatureOverlayHandleMap.get(target.dataset.bottomFeatureOverlayHandle);
  if (!handle) return;
  startBottomFeatureOverlayDrag(handle, event);
}

function scheduleBottomFeatureDomOverlaySync() {
  if (typeof window === "undefined") return;
  if (bottomFeatureOverlaySyncQueued) return;
  bottomFeatureOverlaySyncQueued = true;
  window.requestAnimationFrame(() => {
    bottomFeatureOverlaySyncQueued = false;
    syncBottomFeatureDomOverlay();
  });
}

function scheduleBottomFeatureOverlayDraw() {
  if (typeof window === "undefined") {
    draw();
    return;
  }
  if (bottomFeatureOverlayDrawQueued) return;
  bottomFeatureOverlayDrawQueued = true;
  window.requestAnimationFrame(() => {
    bottomFeatureOverlayDrawQueued = false;
    draw();
  });
}

function applyBottomFeatureOverlayInput(input, value) {
  if (!input) return "";
  input.value = String(value);
  sanitizeBottomFeaturePanelValues();
  const selectedIndex = bottomFeatureSelectionIndex();
  persistBottomFeaturePanelSelection(selectedIndex);
  if (els.bottomFeatureIndex) els.bottomFeatureIndex.dataset.previousIndex = String(selectedIndex);
  updateBottomFeatureDragUI(selectedIndex, { includeEditInfo: false, liveDrag: true });
  updateBottomFeatureSummary(selectedBottomFeaturePreview(state.board));
  scheduleBottomFeatureOverlayDraw();
  return input.value;
}

function appendBottomFeatureOverlaySlider(parent, options) {
  if (typeof document === "undefined" || !parent || !options?.input) return;
  const row = document.createElement("label");
  row.style.display = "grid";
  row.style.gridTemplateColumns = "24px minmax(0,1fr) 56px";
  row.style.alignItems = "center";
  row.style.gap = "8px";

  const tag = document.createElement("span");
  tag.textContent = options.shortLabel || "";
  tag.title = options.label || options.shortLabel || "";
  tag.style.color = "#dff4ff";
  tag.style.font = "700 12px sans-serif";
  tag.style.textAlign = "center";
  row.appendChild(tag);

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = String(options.min);
  slider.max = String(options.max);
  slider.step = String(options.step);
  slider.value = String(options.value);
  slider.style.width = "100%";
  slider.style.margin = "0";
  slider.style.accentColor = options.accent || "#5ac8fa";
  slider.addEventListener("pointerdown", event => {
    event.stopPropagation();
    bottomFeatureOverlaySliderActive = true;
    const finish = () => {
      bottomFeatureOverlaySliderActive = false;
      bottomFeatureOverlaySignature = "";
      scheduleBottomFeatureDomOverlaySync();
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", finish);
    }
  });
  const value = document.createElement("span");
  value.textContent = fmt(options.value);
  value.style.color = "#9fdcff";
  value.style.font = "600 11px ui-monospace, SFMono-Regular, Menlo, monospace";
  value.style.textAlign = "right";
  slider.addEventListener("input", event => {
    event.stopPropagation();
    const sanitizedValue = applyBottomFeatureOverlayInput(options.input, slider.value);
    if (sanitizedValue !== "") {
      slider.value = sanitizedValue;
      value.textContent = fmt(sanitizedValue);
    } else {
      value.textContent = fmt(slider.value);
    }
  });
  row.appendChild(slider);

  row.appendChild(value);
  parent.appendChild(row);
}

function syncBottomFeatureDomOverlay() {
  if (typeof document === "undefined") return;
  const selectedFeaturePreview = currentBottomFeature();
  const outlineVisible =
    state.view === "outline" ||
    (state.view === "quad" && state.quadActivePane === "outline");
  const sectionVisible =
    state.view === "sections" ||
    (state.view === "quad" && state.quadActivePane === "cross-section");
  const overlayVisible = outlineVisible || sectionVisible;
  const hasOutlineHandles =
    Array.isArray(state.bottomFeatureHandles) &&
    state.bottomFeatureHandles.some(handle => handle.mode === "outline");
  if (!overlayVisible || !selectedFeaturePreview || !els.canvas) {
    removeBottomFeatureDomOverlay();
    return;
  }
  let overlay = document.getElementById("bottom-feature-dom-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "bottom-feature-dom-overlay";
    overlay.style.position = "fixed";
    overlay.style.left = "0";
    overlay.style.top = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.zIndex = "9998";
    overlay.style.pointerEvents = "none";
    overlay.style.touchAction = "none";
    overlay.addEventListener("pointerdown", bottomFeatureOverlayPointerDown);
    document.body.appendChild(overlay);
  }
  if (bottomFeatureOverlaySliderActive && overlay.childElementCount > 0) return;
  const canvasRect = els.canvas.getBoundingClientRect();
  const outlineHandles = state.bottomFeatureHandles.filter(handle => handle.mode === "outline");
  if (outlineVisible && !outlineHandles.length) return;
  const activeListIndex = bottomFeatureSelectionIndex();
  const dragLockedListIndex =
    state.drag?.type === "bottom-feature" && state.drag?.handle?.mode === "outline"
      ? (Number.isFinite(Number(state.drag.handle.listIndex)) ? Number(state.drag.handle.listIndex) : Number(state.drag.handle.featureIndex))
      : null;
  const rangeHandles = outlineHandles.filter(handle => handle.kind === "range");
  const rangeByFeature = new Map(rangeHandles.map(handle => [Number(handle.listIndex), handle]));
  const featureCount = Math.max(1, rangeHandles.length);
  const bandTop = rangeHandles.length
    ? Math.min(...rangeHandles.map(handle => Number(handle.screenRect?.top) || 0))
    : (canvasRect.top + (canvasRect.height * 0.5) - 8);
  const bandBottom = rangeHandles.length
    ? Math.max(...rangeHandles.map(handle => Number(handle.screenRect?.bottom) || 0))
    : (canvasRect.top + (canvasRect.height * 0.5) + 8);
  const laneTop = bandTop;
  const laneBottom = bandBottom;
  const layout = {
    bandHeight: Math.max(10, bandBottom - bandTop),
    bandTop,
    bandBottom,
    laneTop,
    laneBottom,
    laneMid: (laneTop + laneBottom) * 0.5,
    laneHeightPx: Math.max(6, laneBottom - laneTop)
  };
  const selectionKey = state.bottomFeatureSelection
    ? `${state.bottomFeatureSelection.mode || "outline"}:${state.bottomFeatureSelection.featureIndex}:${state.bottomFeatureSelection.kind}`
    : "none";
  const signatureParts = [
    Math.round(canvasRect.left),
    Math.round(canvasRect.top),
    Math.round(canvasRect.width),
    Math.round(canvasRect.height),
    state.view,
    state.quadActivePane || "",
    selectionKey,
    bottomFeatureOverlayControlsCollapsed ? "collapsed" : "expanded",
    Number.isFinite(bottomFeatureOverlayControlsPosition?.left) ? Math.round(bottomFeatureOverlayControlsPosition.left) : "auto-left",
    Number.isFinite(bottomFeatureOverlayControlsPosition?.top) ? Math.round(bottomFeatureOverlayControlsPosition.top) : "auto-top"
  ];
  outlineHandles.forEach(handle => {
    signatureParts.push(
      handle.kind,
      Number(handle.listIndex) || 0,
      Number(handle.visualIndex) || 0,
      Number.isFinite(handle.screenX) ? Math.round(handle.screenX * 10) : "x",
      Number.isFinite(handle.screenY) ? Math.round(handle.screenY * 10) : "y",
      handle.screenRect ? Math.round(handle.screenRect.left * 10) : "l",
      handle.screenRect ? Math.round(handle.screenRect.right * 10) : "r",
      handle.screenRect ? Math.round(handle.screenRect.top * 10) : "t",
      handle.screenRect ? Math.round(handle.screenRect.bottom * 10) : "b",
      handle.feature ? [
        fmt(handle.feature.start),
        fmt(handle.feature.peak),
        fmt(handle.feature.end),
        fmt(handle.feature.width),
        fmt(handle.feature.depth),
        fmt(handle.feature.centerDepth),
        fmt(handle.feature.railDepth)
      ].join(",") : "-"
    );
  });
  const nextSignature = signatureParts.join("|");
  const forceRefresh = !!state.drag || outlineHandles.some(handle => handle.kind === "width" || handle.kind === "depth");
  if (!forceRefresh && nextSignature === bottomFeatureOverlaySignature) return;
  bottomFeatureOverlaySignature = nextSignature;
  bottomFeatureOverlayHandleMap.clear();
  overlay.innerHTML = "";

  if (state.board && selectedFeaturePreview) {
    const controls = document.createElement("div");
    const controlsLeft = Number.isFinite(bottomFeatureOverlayControlsPosition?.left)
      ? bottomFeatureOverlayControlsPosition.left
      : (canvasRect.left + 14);
    const controlsTop = Number.isFinite(bottomFeatureOverlayControlsPosition?.top)
      ? bottomFeatureOverlayControlsPosition.top
      : (canvasRect.top + 14);
    controls.style.position = "fixed";
    controls.style.left = `${controlsLeft}px`;
    controls.style.top = `${controlsTop}px`;
    controls.style.width = "252px";
    controls.style.padding = "10px 12px";
    controls.style.borderRadius = "10px";
    controls.style.background = "rgba(11,15,23,.92)";
    controls.style.border = "1px solid rgba(159,220,255,.28)";
    controls.style.boxShadow = "0 10px 28px rgba(0,0,0,.32)";
    controls.style.pointerEvents = "auto";
    controls.style.zIndex = "6";
    controls.style.display = "grid";
    controls.style.gap = "8px";
    controls.addEventListener("pointerdown", event => {
      event.stopPropagation();
    });

    const heading = document.createElement("div");
    heading.style.display = "grid";
    heading.style.gridTemplateColumns = "1fr auto";
    heading.style.alignItems = "center";
    heading.style.gap = "8px";
    heading.style.cursor = "grab";
    heading.style.userSelect = "none";
    heading.addEventListener("pointerdown", event => startBottomFeatureOverlayControlsDrag(event, canvasRect));

    const headingTitle = document.createElement("div");
    headingTitle.textContent = `${bottomFeatureLabel(selectedFeaturePreview.type)} controls`;
    headingTitle.style.color = "#dff4ff";
    headingTitle.style.font = "700 12px sans-serif";
    heading.appendChild(headingTitle);

    const collapseButton = document.createElement("button");
    collapseButton.type = "button";
    collapseButton.textContent = bottomFeatureOverlayControlsCollapsed ? "\u25bc" : "\u25b2";
    collapseButton.style.pointerEvents = "auto";
    collapseButton.style.width = "28px";
    collapseButton.style.height = "24px";
    collapseButton.style.padding = "0";
    collapseButton.style.borderRadius = "6px";
    collapseButton.style.border = "1px solid rgba(159,220,255,.25)";
    collapseButton.style.background = "rgba(255,255,255,.08)";
    collapseButton.style.color = "#dff4ff";
    collapseButton.style.font = "600 11px sans-serif";
    collapseButton.addEventListener("pointerdown", event => {
      event.stopPropagation();
    });
    collapseButton.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      bottomFeatureOverlayControlsCollapsed = !bottomFeatureOverlayControlsCollapsed;
      bottomFeatureOverlaySignature = "";
      scheduleBottomFeatureDomOverlaySync();
    });
    heading.appendChild(collapseButton);

    controls.appendChild(heading);

    if (bottomFeatureOverlayControlsCollapsed) {
      overlay.appendChild(controls);
      return;
    }

    const boardLength = Math.max(1, Number(state.board.length) || 1);
    appendBottomFeatureOverlaySlider(controls, {
      shortLabel: "S",
      label: "Start",
      input: els.bottomFeatureStart,
      min: 0,
      max: boardLength,
      step: 0.01,
      value: Number(els.bottomFeatureStart?.value ?? selectedFeaturePreview.start),
      accent: "#ff6b6b"
    });
    appendBottomFeatureOverlaySlider(controls, {
      shortLabel: "M",
      label: "Max effect",
      input: els.bottomFeaturePeak,
      min: 0,
      max: boardLength,
      step: 0.01,
      value: Number(els.bottomFeaturePeak?.value ?? selectedFeaturePreview.peak),
      accent: "#ff9f0a"
    });
    appendBottomFeatureOverlaySlider(controls, {
      shortLabel: "E",
      label: "End",
      input: els.bottomFeatureEnd,
      min: 0,
      max: boardLength,
      step: 0.01,
      value: Number(els.bottomFeatureEnd?.value ?? selectedFeaturePreview.end),
      accent: "#ffd60a"
    });

    const maybeAddVisibleSlider = (input, shortLabel, labelText, accent) => {
      if (!input || input.disabled || input.dataset.fieldVisible === "0" || input.parentElement?.hidden) return;
      appendBottomFeatureOverlaySlider(controls, {
        shortLabel,
        label: labelText,
        input,
        min: Number(input.min || 0),
        max: Number(input.max || 1),
        step: Number(input.step || 0.01),
        value: Number(input.value || 0),
        accent
      });
    };
    maybeAddVisibleSlider(els.bottomFeatureWidth, "W", "Width", "#ffb340");
    maybeAddVisibleSlider(els.bottomFeatureDepth, "D", "Depth", "#5ac8fa");
    maybeAddVisibleSlider(els.bottomFeatureCenterDepth, "CD", "Center depth", "#64d2ff");
    maybeAddVisibleSlider(els.bottomFeatureRailDepth, "RD", "Rail depth", "#30b0ff");
    maybeAddVisibleSlider(els.bottomFeatureOffset, "O", "Offset", "#c084fc");
    maybeAddVisibleSlider(els.bottomFeatureSpacing, "SP", "Spacing", "#f472b6");
    maybeAddVisibleSlider(els.bottomFeatureEdge, "G", "Edge", "#34d399");
    maybeAddVisibleSlider(els.bottomFeatureLongitudinalFlat, "LF", "Longitudinal", "#22c55e");
    overlay.appendChild(controls);
  }
}

if (typeof navigator !== "undefined" && "serial" in navigator) refreshSerialPorts().catch(() => {});
installNavigationGuard();
if (els.canvas) els.canvas.dataset.tool = state.tool;
syncAppBuildVersion();
applyLanguageToStaticUI();
syncSettingsControls();
draw();
loadStartupSampleFromQuery();
