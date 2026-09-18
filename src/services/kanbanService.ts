import { db } from '@/db/database';
import { syncService } from './syncService';
import { taskService } from './taskService';
import { KanbanBoard, KanbanCard, KanbanColumn, KanbanChecklistItem } from '@/types';
import { getInitialRank, getRankBetween } from '@/lib/lexorank';
import { COLUMN_THEMES } from '@/lib/tagStyles';
import { getDuePresetIso } from '@/lib/dateTimeUtils';
import { getTodayDateString } from '@/lib/utils';

export const KANBAN_DEFAULT_COLUMNS: KanbanColumn[] = [
  {
    id: 'planned',
    title: 'Planned',
    bgTint: 'bg-[#FAF7F0]',
    dotColor: '#D4C5A9',
    colorAccent: '#FCFCE8',
    orderIndex: 0,
  },
  {
    id: 'in_progress',
    title: 'In progress',
    bgTint: 'bg-[#F0F3FF]',
    dotColor: '#818CF8',
    colorAccent: '#EBE7FF',
    orderIndex: 1,
  },
  {
    id: 'review',
    title: 'Review',
    bgTint: 'bg-[#F5F0FF]',
    dotColor: '#C084FC',
    colorAccent: '#EBE9FE',
    orderIndex: 2,
  },
  {
    id: 'done',
    title: 'Complete',
    bgTint: 'bg-[#ECFDF5]',
    dotColor: '#34D399',
    colorAccent: '#D1FAE5',
    orderIndex: 3,
  },
];

export class KanbanService {
  private seedingPromise: Promise<void> | null = null;

  async getBoards(): Promise<KanbanBoard[]> {
    const boards = await db.select<any>('SELECT * FROM kanban_boards ORDER BY position_rank ASC');
    if (
      boards.length === 0 ||
      (boards.length === 1 && boards[0].title === 'Productivity OS Roadmap')
    ) {
      if (!this.seedingPromise) {
        this.seedingPromise = this.seedDefaultBoards().finally(() => {
          this.seedingPromise = null;
        });
      }
      await this.seedingPromise;
      return await this.fetchBoards();
    }

    return await this.fetchBoards();
  }

  async fetchBoards(): Promise<KanbanBoard[]> {
    const boards = await db.select<any>('SELECT * FROM kanban_boards ORDER BY position_rank ASC');
    const cards = await db.select<any>('SELECT * FROM kanban_cards ORDER BY position_rank ASC');

    return boards.map((b) => {
      const boardCards = cards
        .filter((c) => c.board_id === b.id)
        .map((c) => {
          let checklist: KanbanChecklistItem[] = [];
          if (c.checklist) {
            try {
              checklist = typeof c.checklist === 'string' ? JSON.parse(c.checklist) : c.checklist;
            } catch {
              checklist = [];
            }
          }

          // Handle column aliasing: normalize 'complete' to 'done' or vice versa
          const colId = c.column_id === 'complete' ? 'done' : c.column_id;

          return {
            id: c.id,
            boardId: b.id,
            columnId: colId,
            title: c.title,
            description: c.description || '',
            tagLabel: c.tag_label || undefined,
            tagColor: c.tag_color || undefined,
            tags: c.tag_label ? [c.tag_label] : [],
            dueDate: c.due_date || undefined,
            positionRank: c.position_rank || '1000.000000',
            orderIndex: parseFloat(c.position_rank || '1000'),
            checklist,
            commentsCount: typeof c.comments_count === 'number' ? c.comments_count : 0,
            completedAt: c.completed_at || undefined,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
          } as KanbanCard;
        });

      let columns: KanbanColumn[] = KANBAN_DEFAULT_COLUMNS;
      if (b.columns_config) {
        try {
          const parsed =
            typeof b.columns_config === 'string' ? JSON.parse(b.columns_config) : b.columns_config;
          if (Array.isArray(parsed) && parsed.length > 0) {
            columns = parsed;
          }
        } catch {
          columns = KANBAN_DEFAULT_COLUMNS;
        }
      }

      return {
        id: b.id,
        title: b.title,
        colorTag: b.color_tag || '#818CF8',
        linkedCanvasId: b.linked_canvas_id || 'canvas_1',
        linkedCanvasTitle: b.linked_canvas_title || 'CANVAS A',
        positionRank: b.position_rank || '1000.000000',
        columns,
        cards: boardCards,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      };
    });
  }

  async seedDefaultBoards(): Promise<void> {
    const now = new Date().toISOString();
    const defaultColsJson = JSON.stringify(KANBAN_DEFAULT_COLUMNS);

    // Board 1: Project A (matches Figma Kanban Board)
    const boardAId = 'board_default';
    await db.execute(
      `INSERT OR REPLACE INTO kanban_boards (id, title, color_tag, linked_canvas_id, linked_canvas_title, position_rank, columns_config, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        boardAId,
        'Project A',
        '#818CF8',
        'canvas_1',
        'CANVAS A',
        '1000.000000',
        defaultColsJson,
        now,
        now,
      ]
    );

    // Board 2: Project B
    const boardBId = 'board_b';
    await db.execute(
      `INSERT OR REPLACE INTO kanban_boards (id, title, color_tag, linked_canvas_id, linked_canvas_title, position_rank, columns_config, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        boardBId,
        'Project B',
        '#34D399',
        'canvas_2',
        'CANVAS B',
        '2000.000000',
        defaultColsJson,
        now,
        now,
      ]
    );

    // Board 3: Project C
    const boardCId = 'board_c';
    await db.execute(
      `INSERT OR REPLACE INTO kanban_boards (id, title, color_tag, linked_canvas_id, linked_canvas_title, position_rank, columns_config, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        boardCId,
        'Project C',
        '#60A5FA',
        'canvas_3',
        'CANVAS C',
        '3000.000000',
        defaultColsJson,
        now,
        now,
      ]
    );

    // Seed Project A Cards (Exhaustively matching Figma Design/Kanban Board.png)
    const projectACards = [
      // Planned
      {
        id: 'c_planned_1',
        board_id: boardAId,
        column_id: 'planned',
        title: 'Finalize API module contract',
        description: 'Define JSON endpoints, query params, and error schemas.',
        tag_label: null,
        tag_color: null,
        due_date: getDuePresetIso('this_friday'),
        comments_count: 4,
        position_rank: '1000.000000',
        checklist: JSON.stringify([
          { id: 'chk_1', title: 'Define REST & WebSocket endpoints', completed: true },
          { id: 'chk_2', title: 'Draft error schemas and status codes', completed: true },
          { id: 'chk_3', title: 'Review with frontend lead', completed: true },
          { id: 'chk_4', title: 'Benchmark serialization overhead', completed: false },
          { id: 'chk_5', title: 'Finalize OpenAPI 3.1 YAML', completed: false },
        ]),
        completed_at: null,
      },
      {
        id: 'c_planned_2',
        board_id: boardAId,
        column_id: 'planned',
        title: 'User interview synthesis',
        description: 'Extract cited insights from 8 user onboarding interviews.',
        tag_label: null,
        tag_color: null,
        due_date: getDuePresetIso('next_monday'),
        comments_count: 2,
        position_rank: '2000.000000',
        checklist: JSON.stringify([
          { id: 'chk_6', title: 'Transcribe 8 interview recordings', completed: true },
          { id: 'chk_7', title: 'Cluster pain points by theme', completed: false },
          { id: 'chk_8', title: 'Share synthesis doc in workspace', completed: false },
        ]),
        completed_at: null,
      },
      {
        id: 'c_planned_3',
        board_id: boardAId,
        column_id: 'planned',
        title: 'Security audit checklist',
        description: 'Audit auth token storage, CSP headers, and SQLite permissions.',
        tag_label: null,
        tag_color: null,
        due_date: getDuePresetIso('this_friday'),
        comments_count: 0,
        position_rank: '3000.000000',
        checklist: JSON.stringify([]),
        completed_at: null,
      },

      // In progress
      {
        id: 'c_prog_1',
        board_id: boardAId,
        column_id: 'in_progress',
        title: 'Design tokens sync engine',
        description: 'Bridge Figma tokens into Tailwind CSS and Aura UI.',
        tag_label: null,
        tag_color: null,
        due_date: getDuePresetIso('today_eod'),
        comments_count: 1,
        position_rank: '1000.000000',
        checklist: JSON.stringify([
          { id: 'chk_9', title: 'Map Tailwind color tokens', completed: true },
          { id: 'chk_10', title: 'Extract typography scale', completed: true },
          { id: 'chk_11', title: 'Build token validation script', completed: false },
          { id: 'chk_12', title: 'Generate CSS variable fallbacks', completed: false },
        ]),
        completed_at: null,
      },
      {
        id: 'c_prog_2',
        board_id: boardAId,
        column_id: 'in_progress',
        title: 'Tauri v2 migration & plugins',
        description: 'Upgrade core desktop plugins to v2 stable APIs.',
        tag_label: null,
        tag_color: null,
        due_date: getDuePresetIso('this_friday'),
        comments_count: 3,
        position_rank: '2000.000000',
        checklist: JSON.stringify([
          { id: 'chk_13', title: 'Upgrade Cargo.toml dependencies', completed: true },
          { id: 'chk_14', title: 'Migrate window management APIs', completed: true },
          { id: 'chk_15', title: 'Update SQL plugin configuration', completed: true },
          { id: 'chk_16', title: 'Audit notification IPC', completed: true },
          { id: 'chk_17', title: 'Run cross-platform smoke tests', completed: false },
        ]),
        completed_at: null,
      },
      {
        id: 'c_prog_3',
        board_id: boardAId,
        column_id: 'in_progress',
        title: 'Spatial canvas bezier curve rendering',
        description: 'Smooth directional connector arrows with labels.',
        tag_label: null,
        tag_color: null,
        due_date: getDuePresetIso('this_friday'),
        comments_count: 0,
        position_rank: '3000.000000',
        checklist: JSON.stringify([
          { id: 'chk_18', title: 'Implement smooth bezier handles', completed: true },
          { id: 'chk_19', title: 'Render directional arrowheads', completed: true },
        ]),
        completed_at: null,
      },

      // Review
      {
        id: 'c_rev_1',
        board_id: boardAId,
        column_id: 'review',
        title: 'Offline SQLite mutation queue',
        description: 'Transactional rollback and idempotent replay.',
        tag_label: null,
        tag_color: null,
        due_date: getDuePresetIso('today_eod'),
        comments_count: 5,
        position_rank: '1000.000000',
        checklist: JSON.stringify([
          { id: 'chk_20', title: 'Write mutation queue unit tests', completed: true },
          { id: 'chk_21', title: 'Verify LWW conflict resolver', completed: true },
          { id: 'chk_22', title: 'Test reconnect idempotency', completed: true },
        ]),
        completed_at: null,
      },
      {
        id: 'c_rev_2',
        board_id: boardAId,
        column_id: 'review',
        title: 'Pomodoro focus dock integration',
        description: 'Unified countdown bar and bound task indicators.',
        tag_label: null,
        tag_color: null,
        due_date: getDuePresetIso('tomorrow_morning'),
        comments_count: 2,
        position_rank: '2000.000000',
        checklist: JSON.stringify([
          { id: 'chk_23', title: 'Test 25m/5m/15m cycle transitions', completed: true },
          { id: 'chk_24', title: 'Verify audio chime triggers', completed: true },
        ]),
        completed_at: null,
      },

      // Complete
      {
        id: 'c_done_1',
        board_id: boardAId,
        column_id: 'done',
        title: 'Set up synced task status',
        description: 'Bidirectional status bridge between desktop and cloud database.',
        tag_label: null,
        tag_color: null,
        due_date: undefined,
        comments_count: 1,
        position_rank: '1000.000000',
        checklist: JSON.stringify([]),
        completed_at: 'Completed today',
      },
      {
        id: 'c_done_2',
        board_id: boardAId,
        column_id: 'done',
        title: 'Draft weekly delivery plan',
        description: 'Organize sprint goals and deliverables.',
        tag_label: null,
        tag_color: null,
        due_date: undefined,
        comments_count: 0,
        position_rank: '2000.000000',
        checklist: JSON.stringify([]),
        completed_at: 'Completed yesterday',
      },
      {
        id: 'c_done_3',
        board_id: boardAId,
        column_id: 'done',
        title: 'Initial PRD and architecture specification',
        description: 'Author comprehensive project blueprint.',
        tag_label: null,
        tag_color: null,
        due_date: undefined,
        comments_count: 4,
        position_rank: '3000.000000',
        checklist: JSON.stringify([]),
        completed_at: 'Completed 2d ago',
      },
      {
        id: 'c_done_4',
        board_id: boardAId,
        column_id: 'done',
        title: 'Aura UI component library setup',
        description: 'Create button, pill, chip, and modal primitives.',
        tag_label: null,
        tag_color: null,
        due_date: undefined,
        comments_count: 0,
        position_rank: '4000.000000',
        checklist: JSON.stringify([]),
        completed_at: 'Completed 3d ago',
      },
    ];

    for (const c of projectACards) {
      await db.execute(
        `INSERT OR REPLACE INTO kanban_cards (id, board_id, column_id, title, description, tag_label, tag_color, due_date, comments_count, position_rank, checklist, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.board_id,
          c.column_id,
          c.title,
          c.description,
          c.tag_label,
          c.tag_color,
          c.due_date || null,
          c.comments_count,
          c.position_rank,
          c.checklist,
          c.completed_at,
          now,
          now,
        ]
      );
    }

    // Seed Project B Cards
    const projectBCards = [
      {
        id: 'cb_1',
        board_id: boardBId,
        column_id: 'planned',
        title: 'Cloudflare Worker Telegram webhook',
        description: 'grammY framework edge handler with secret verification.',
        tag_label: null,
        tag_color: null,
        due_date: getDuePresetIso('next_monday'),
        comments_count: 1,
        position_rank: '1000.000000',
        checklist: JSON.stringify([]),
        completed_at: null,
      },
      {
        id: 'cb_2',
        board_id: boardBId,
        column_id: 'in_progress',
        title: 'Mobile responsive web bundle',
        description: 'PWA manifest and touch drag gestures.',
        tag_label: null,
        tag_color: null,
        due_date: getDuePresetIso('tomorrow_morning'),
        comments_count: 0,
        position_rank: '1000.000000',
        checklist: JSON.stringify([]),
        completed_at: null,
      },
    ];

    for (const c of projectBCards) {
      await db.execute(
        `INSERT OR REPLACE INTO kanban_cards (id, board_id, column_id, title, description, tag_label, tag_color, due_date, comments_count, position_rank, checklist, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.board_id,
          c.column_id,
          c.title,
          c.description,
          c.tag_label,
          c.tag_color,
          c.due_date || null,
          c.comments_count,
          c.position_rank,
          c.checklist,
          c.completed_at,
          now,
          now,
        ]
      );
    }

    // Seed Project C Cards
    const projectCCards = [
      {
        id: 'cc_1',
        board_id: boardCId,
        column_id: 'planned',
        title: 'Developer SDK & CLI documentation',
        description: 'Publish documentation for extensions and custom plugins.',
        tag_label: null,
        tag_color: null,
        due_date: getDuePresetIso('this_friday'),
        comments_count: 0,
        position_rank: '1000.000000',
        checklist: JSON.stringify([]),
        completed_at: null,
      },
    ];

    for (const c of projectCCards) {
      await db.execute(
        `INSERT OR REPLACE INTO kanban_cards (id, board_id, column_id, title, description, tag_label, tag_color, due_date, comments_count, position_rank, checklist, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.board_id,
          c.column_id,
          c.title,
          c.description,
          c.tag_label,
          c.tag_color,
          c.due_date || null,
          c.comments_count,
          c.position_rank,
          c.checklist,
          c.completed_at,
          now,
          now,
        ]
      );
    }
  }

  // --- Multi-Board CRUD ---

  async createBoard(
    title: string = 'Untitled Board',
    colorTag: string = '#818CF8',
    linkedCanvasId: string = 'canvas_1',
    linkedCanvasTitle: string = 'CANVAS A'
  ): Promise<KanbanBoard> {
    const boardId = `board_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const existing = await db.select<any>(
      'SELECT position_rank FROM kanban_boards ORDER BY position_rank DESC LIMIT 1'
    );
    const lastRank = existing[0]?.position_rank;
    const positionRank = getRankBetween(lastRank, null);

    const columnsJson = JSON.stringify(KANBAN_DEFAULT_COLUMNS);
    await db.execute(
      `INSERT INTO kanban_boards (id, title, color_tag, linked_canvas_id, linked_canvas_title, position_rank, columns_config, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        boardId,
        title,
        colorTag,
        linkedCanvasId,
        linkedCanvasTitle,
        positionRank,
        columnsJson,
        now,
        now,
      ]
    );

    const board: KanbanBoard = {
      id: boardId,
      title,
      colorTag,
      linkedCanvasId,
      linkedCanvasTitle,
      positionRank,
      columns: KANBAN_DEFAULT_COLUMNS,
      cards: [],
      createdAt: now,
      updatedAt: now,
    };

    await syncService.enqueueMutation('kanban_boards', boardId, 'INSERT', board);
    return board;
  }

  async renameBoard(boardId: string, newTitle: string): Promise<void> {
    const now = new Date().toISOString();
    await db.execute(`UPDATE kanban_boards SET title = ?, updated_at = ? WHERE id = ?`, [
      newTitle,
      now,
      boardId,
    ]);

    await syncService.enqueueMutation('kanban_boards', boardId, 'UPDATE', {
      title: newTitle,
      updated_at: now,
    });
  }

  async deleteBoard(boardId: string): Promise<void> {
    // Check total boards — prevent deleting the last board
    const boards = await db.select<any>('SELECT id FROM kanban_boards');
    if (boards.length <= 1) {
      throw new Error('Cannot delete the only remaining Kanban board.');
    }

    // Delete cards belonging to board
    await db.execute(`DELETE FROM kanban_cards WHERE board_id = ?`, [boardId]);
    await db.execute(`DELETE FROM kanban_boards WHERE id = ?`, [boardId]);

    await syncService.enqueueMutation('kanban_boards', boardId, 'DELETE', { id: boardId });
  }

  // --- Multi-Column Customization CRUD ---

  async addColumn(boardId: string, title: string, themeId: string = 'blue'): Promise<KanbanColumn> {
    let boards: any[] = [];
    try {
      boards = await db.select<any>('SELECT * FROM kanban_boards WHERE id = ?', [boardId]);
    } catch {
      boards = [];
    }

    if (!boards[0]) {
      try {
        await this.seedDefaultBoards();
        boards = await db.select<any>('SELECT * FROM kanban_boards WHERE id = ?', [boardId]);
      } catch {
        // continue
      }
    }

    const boardRow = boards[0] || {};
    let columns: KanbanColumn[] = KANBAN_DEFAULT_COLUMNS;
    if (boardRow.columns_config) {
      try {
        const parsed =
          typeof boardRow.columns_config === 'string'
            ? JSON.parse(boardRow.columns_config)
            : boardRow.columns_config;
        if (Array.isArray(parsed) && parsed.length > 0) columns = parsed;
      } catch {
        columns = KANBAN_DEFAULT_COLUMNS;
      }
    }

    const theme = COLUMN_THEMES.find((t) => t.id === themeId) || COLUMN_THEMES[1];
    const newColId = `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newColumn: KanbanColumn = {
      id: newColId,
      title: title.trim(),
      bgTint: `${theme.bgTint} ${theme.borderClass}`,
      dotColor: theme.dotColor,
      colorAccent: theme.colorAccent,
      orderIndex: columns.length,
    };

    const updatedColumns = [...columns, newColumn];
    const now = new Date().toISOString();
    try {
      await db.execute('UPDATE kanban_boards SET columns_config = ?, updated_at = ? WHERE id = ?', [
        JSON.stringify(updatedColumns),
        now,
        boardId,
      ]);
    } catch (err) {
      console.warn('[KanbanService] Failed to persist updated columns to DB:', err);
    }

    try {
      await syncService.enqueueMutation('kanban_boards', boardId, 'UPDATE', {
        columns_config: JSON.stringify(updatedColumns),
        updated_at: now,
      });
    } catch {
      // ignore
    }

    return newColumn;
  }

  async renameColumn(boardId: string, columnId: string, newTitle: string): Promise<void> {
    const boards = await db.select<any>('SELECT * FROM kanban_boards WHERE id = ?', [boardId]);
    if (!boards[0]) return;

    const boardRow = boards[0];
    let columns: KanbanColumn[] = KANBAN_DEFAULT_COLUMNS;
    if (boardRow.columns_config) {
      try {
        const parsed =
          typeof boardRow.columns_config === 'string'
            ? JSON.parse(boardRow.columns_config)
            : boardRow.columns_config;
        if (Array.isArray(parsed) && parsed.length > 0) columns = parsed;
      } catch {
        columns = KANBAN_DEFAULT_COLUMNS;
      }
    }

    const updatedColumns = columns.map((col) =>
      col.id === columnId ? { ...col, title: newTitle.trim() } : col
    );
    const now = new Date().toISOString();

    await db.execute('UPDATE kanban_boards SET columns_config = ?, updated_at = ? WHERE id = ?', [
      JSON.stringify(updatedColumns),
      now,
      boardId,
    ]);

    await syncService.enqueueMutation('kanban_boards', boardId, 'UPDATE', {
      columns_config: JSON.stringify(updatedColumns),
      updated_at: now,
    });
  }

  async deleteColumn(boardId: string, columnId: string, fallbackColumnId?: string): Promise<void> {
    const boards = await db.select<any>('SELECT * FROM kanban_boards WHERE id = ?', [boardId]);
    if (!boards[0]) return;

    const boardRow = boards[0];
    let columns: KanbanColumn[] = KANBAN_DEFAULT_COLUMNS;
    if (boardRow.columns_config) {
      try {
        const parsed =
          typeof boardRow.columns_config === 'string'
            ? JSON.parse(boardRow.columns_config)
            : boardRow.columns_config;
        if (Array.isArray(parsed) && parsed.length > 0) columns = parsed;
      } catch {
        columns = KANBAN_DEFAULT_COLUMNS;
      }
    }

    if (columns.length <= 1) {
      throw new Error('A board must have at least one column.');
    }

    const updatedColumns = columns.filter((col) => col.id !== columnId);
    const targetFallback =
      fallbackColumnId && updatedColumns.some((c) => c.id === fallbackColumnId)
        ? fallbackColumnId
        : updatedColumns[0].id;

    const now = new Date().toISOString();

    // Reassign any existing cards in this column to the fallback column
    await db.execute(
      'UPDATE kanban_cards SET column_id = ?, updated_at = ? WHERE board_id = ? AND column_id = ?',
      [targetFallback, now, boardId, columnId]
    );

    await db.execute('UPDATE kanban_boards SET columns_config = ?, updated_at = ? WHERE id = ?', [
      JSON.stringify(updatedColumns),
      now,
      boardId,
    ]);

    await syncService.enqueueMutation('kanban_boards', boardId, 'UPDATE', {
      columns_config: JSON.stringify(updatedColumns),
      updated_at: now,
    });
  }

  // --- Card CRUD & Reordering ---

  async addCard(
    boardIdOrParams:
      | string
      | {
          boardId: string;
          columnId: string;
          title: string;
          description?: string;
          tagLabel?: string;
          tagColor?: string;
          dueDate?: string;
          checklist?: KanbanChecklistItem[];
        },
    columnIdArg?: string,
    titleArg?: string,
    tagArg?: string
  ): Promise<KanbanCard> {
    let boardId: string;
    let columnId: string;
    let title: string;
    let description = '';
    let tagLabel: string | undefined = undefined;
    let tagColor: string | undefined = undefined;
    let dueDate: string | undefined = undefined;
    let checklist: KanbanChecklistItem[] = [];

    if (typeof boardIdOrParams === 'object') {
      boardId = boardIdOrParams.boardId;
      columnId = boardIdOrParams.columnId;
      title = boardIdOrParams.title;
      description = boardIdOrParams.description || '';
      tagLabel = boardIdOrParams.tagLabel;
      tagColor = boardIdOrParams.tagColor;
      dueDate = boardIdOrParams.dueDate;
      checklist = boardIdOrParams.checklist || [];
    } else {
      boardId = boardIdOrParams;
      columnId = columnIdArg || 'planned';
      title = titleArg || 'Untitled Card';
      tagLabel = tagArg;
    }

    // Ensure board exists in DB before inserting card
    try {
      const boards = await db.select<any>('SELECT id FROM kanban_boards WHERE id = ?', [boardId]);
      if (!boards[0]) {
        await this.seedDefaultBoards();
      }
    } catch {
      // ignore
    }

    // Determine position rank at end of target column
    let positionRank = getInitialRank(0);
    try {
      const existingCards = await db.select<any>(
        `SELECT position_rank FROM kanban_cards WHERE board_id = ? AND column_id = ? ORDER BY position_rank DESC LIMIT 1`,
        [boardId, columnId]
      );
      const lastRank = existingCards[0]?.position_rank;
      positionRank = lastRank ? getRankBetween(lastRank, null) : getInitialRank(0);
    } catch {
      positionRank = getInitialRank(0);
    }

    const cardId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const checklistJson = JSON.stringify(checklist);

    try {
      await db.execute(
        `INSERT INTO kanban_cards (id, board_id, column_id, title, description, tag_label, tag_color, due_date, comments_count, position_rank, checklist, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cardId,
          boardId,
          columnId,
          title,
          description,
          tagLabel || null,
          tagColor || null,
          dueDate || null,
          0,
          positionRank,
          checklistJson,
          columnId === 'done' ? 'Completed today' : null,
          now,
          now,
        ]
      );
    } catch (insertErr) {
      console.warn('[KanbanService] Failed to insert kanban card into DB:', insertErr);
    }

    const card: KanbanCard = {
      id: cardId,
      boardId,
      columnId,
      title,
      description,
      tagLabel,
      tagColor,
      tags: tagLabel ? [tagLabel] : [],
      dueDate,
      positionRank,
      orderIndex: parseFloat(positionRank) || 1000,
      checklist,
      commentsCount: 0,
      completedAt: columnId === 'done' ? 'Completed today' : undefined,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await syncService.enqueueMutation('kanban_cards', cardId, 'INSERT', card);
    } catch {
      // ignore
    }
    return card;
  }

  async updateCard(cardId: string, updates: Partial<KanbanCard>): Promise<void> {
    const now = new Date().toISOString();
    const existing = await db.select<any>('SELECT * FROM kanban_cards WHERE id = ?', [cardId]);
    if (!existing[0]) return;

    const current = existing[0];
    const newTitle = updates.title ?? current.title;
    const newDesc = updates.description ?? current.description;
    const newTagLabel = updates.tagLabel !== undefined ? updates.tagLabel : current.tag_label;
    const newTagColor = updates.tagColor !== undefined ? updates.tagColor : current.tag_color;
    const newDueDate = updates.dueDate !== undefined ? updates.dueDate : current.due_date;
    const newColumnId = updates.columnId ?? current.column_id;
    const newRank = updates.positionRank ?? current.position_rank;
    const newChecklist = updates.checklist ? JSON.stringify(updates.checklist) : current.checklist;
    const newCompletedAt =
      updates.completedAt !== undefined
        ? updates.completedAt
        : newColumnId === 'done' && !current.completed_at
          ? 'Completed today'
          : newColumnId !== 'done'
            ? null
            : current.completed_at;

    await db.execute(
      `UPDATE kanban_cards SET column_id = ?, title = ?, description = ?, tag_label = ?, tag_color = ?, due_date = ?, position_rank = ?, checklist = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
      [
        newColumnId,
        newTitle,
        newDesc,
        newTagLabel || null,
        newTagColor || null,
        newDueDate || null,
        newRank,
        newChecklist,
        newCompletedAt,
        now,
        cardId,
      ]
    );

    await syncService.enqueueMutation('kanban_cards', cardId, 'UPDATE', {
      ...updates,
      updated_at: now,
    });
  }

  async moveCard(cardId: string, targetColumnId: string, newRank?: string): Promise<void> {
    const now = new Date().toISOString();
    const isDone = targetColumnId === 'done' || targetColumnId === 'complete';
    const completedAtVal = isDone ? 'Completed today' : null;

    if (newRank) {
      await db.execute(
        `UPDATE kanban_cards SET column_id = ?, position_rank = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
        [targetColumnId, newRank, completedAtVal, now, cardId]
      );
      await syncService.enqueueMutation('kanban_cards', cardId, 'UPDATE', {
        column_id: targetColumnId,
        position_rank: newRank,
        completed_at: completedAtVal,
        updated_at: now,
      });
    } else {
      await db.execute(
        `UPDATE kanban_cards SET column_id = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
        [targetColumnId, completedAtVal, now, cardId]
      );
      await syncService.enqueueMutation('kanban_cards', cardId, 'UPDATE', {
        column_id: targetColumnId,
        completed_at: completedAtVal,
        updated_at: now,
      });
    }
  }

  async deleteCard(cardId: string): Promise<void> {
    await db.execute(`DELETE FROM kanban_cards WHERE id = ?`, [cardId]);
    await syncService.enqueueMutation('kanban_cards', cardId, 'DELETE', { id: cardId });
  }

  // --- Checklist Subtask Operations ---

  async toggleChecklistItem(cardId: string, itemId: string): Promise<void> {
    const existing = await db.select<any>('SELECT checklist FROM kanban_cards WHERE id = ?', [
      cardId,
    ]);
    if (!existing[0]) return;

    let list: KanbanChecklistItem[] = [];
    try {
      list = JSON.parse(existing[0].checklist || '[]');
    } catch {
      list = [];
    }

    const updated = list.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    await this.updateCard(cardId, { checklist: updated });
  }

  async addChecklistItem(cardId: string, itemTitle: string): Promise<void> {
    if (!itemTitle.trim()) return;
    const existing = await db.select<any>('SELECT checklist FROM kanban_cards WHERE id = ?', [
      cardId,
    ]);
    if (!existing[0]) return;

    let list: KanbanChecklistItem[] = [];
    try {
      list = JSON.parse(existing[0].checklist || '[]');
    } catch {
      list = [];
    }

    const newItem: KanbanChecklistItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      title: itemTitle.trim(),
      completed: false,
    };

    list.push(newItem);
    await this.updateCard(cardId, { checklist: list });
  }

  async deleteChecklistItem(cardId: string, itemId: string): Promise<void> {
    const existing = await db.select<any>('SELECT checklist FROM kanban_cards WHERE id = ?', [
      cardId,
    ]);
    if (!existing[0]) return;

    let list: KanbanChecklistItem[] = [];
    try {
      list = JSON.parse(existing[0].checklist || '[]');
    } catch {
      list = [];
    }

    const filtered = list.filter((item) => item.id !== itemId);
    await this.updateCard(cardId, { checklist: filtered });
  }

  // --- Cockpit Bridge ---

  async sendToTodayQueue(cardId: string): Promise<{ taskId: string; taskTitle: string }> {
    const rows = await db.select<any>('SELECT * FROM kanban_cards WHERE id = ?', [cardId]);
    if (!rows[0]) throw new Error(`Kanban card with ID ${cardId} not found.`);

    const card = rows[0];
    let cardSubtasks: any[] = [];
    try {
      const parsed = JSON.parse(card.checklist || '[]');
      cardSubtasks = parsed.map((item: any) => ({
        id: item.id,
        title: item.title,
        completed: item.completed,
      }));
    } catch {
      cardSubtasks = [];
    }

    const task = await taskService.createTask({
      title: card.title,
      description: card.description || undefined,
      category: card.tag_label || undefined,
      iconType: 'code',
      scheduledDate: getTodayDateString(),
      sourceKanbanCardId: card.id,
      subtasks: cardSubtasks,
    });

    return { taskId: task.id, taskTitle: task.title };
  }
}

export const kanbanService = new KanbanService();
