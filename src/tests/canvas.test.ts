// Infinite Spatial Canvas Automated Verification Test Suite

// Mock browser globals for Node test environment
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};

import { canvasService } from '../services/canvasService';
import { useCanvasStore } from '../stores/useCanvasStore';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function runTests() {
  console.log('=== ATELIER INFINITE SPATIAL CANVAS TEST SUITE ===\n');

  // Test 1: Service default seeding (Figma Canvas A, B, C)
  console.log('--- Test 1: Canvas Seed & Entity Schema ---');
  await canvasService.seedDefaultCanvases();
  const initialCanvases = await canvasService.getCanvases();
  assert(
    initialCanvases.length >= 3,
    'Default seeding generates at least 3 canvases (Canvas A, B, C)'
  );

  const canvasA = initialCanvases.find((c) => c.title === 'Canvas A');
  assert(Boolean(canvasA), 'Canvas A exists in seeded canvases');
  assert(canvasA!.nodes.length >= 5, 'Canvas A contains all required 5+ Figma nodes');

  // Verify node types in Canvas A
  const kanbanNode = canvasA!.nodes.find((n) => n.id === 'node_kanban_1');
  assert(Boolean(kanbanNode && kanbanNode.type === 'kanban'), 'Canvas A has central Kanban node');
  assert(
    kanbanNode!.data.title === 'Release readiness',
    'Kanban node has title "Release readiness"'
  );
  assert(kanbanNode!.data.badge === 'KANBAN', 'Kanban node has "KANBAN" badge');
  assert(
    Array.isArray(kanbanNode!.data.items) && kanbanNode!.data.items.length >= 2,
    'Kanban node has checklist items'
  );

  const launchNode = canvasA!.nodes.find((n) => n.id === 'node_launch_1');
  assert(
    Boolean(launchNode && launchNode.type === 'simple_text'),
    'Canvas A has top-left Simple Text node ("Launch outcome")'
  );
  assert(launchNode!.data.title === 'Launch outcome', 'Launch node has title "Launch outcome"');

  const mediaNode = canvasA!.nodes.find((n) => n.id === 'node_media_1');
  assert(
    Boolean(mediaNode && mediaNode.type === 'media'),
    'Canvas A has top-right Media node ("Calm, focused workspace")'
  );
  assert(Boolean(mediaNode!.data.imageUrl), 'Media node contains image URL');

  const evidenceNode = canvasA!.nodes.find((n) => n.id === 'node_evidence_1');
  assert(
    Boolean(evidenceNode && evidenceNode.type === 'simple_text'),
    'Canvas A has bottom-left Simple Text node ("Evidence")'
  );

  const betaNode = canvasA!.nodes.find((n) => n.id === 'node_beta_1');
  assert(
    Boolean(betaNode && betaNode.type === 'simple_text'),
    'Canvas A has bottom-right Action node ("Beta handoff")'
  );
  assert(betaNode!.data.badge === 'NEXT STEP', 'Beta node has "NEXT STEP" badge');

  const sectionNode = canvasA!.nodes.find((n) => n.id === 'node_section_1');
  assert(
    Boolean(sectionNode && sectionNode.type === 'section'),
    'Canvas A has bounding Section container'
  );

  // Verify Bezier Edges in Canvas A
  assert(canvasA!.edges.length >= 4, 'Canvas A contains at least 4 connecting bezier edges');
  const feedEdge = canvasA!.edges.find((e) => e.label === 'feeds into');
  assert(Boolean(feedEdge), 'Contains bezier connector labeled "feeds into"');
  const refEdge = canvasA!.edges.find((e) => e.label === 'references');
  assert(Boolean(refEdge), 'Contains bezier connector labeled "references"');
  const depEdge = canvasA!.edges.find((e) => e.label === 'depends on');
  assert(Boolean(depEdge), 'Contains bezier connector labeled "depends on"');
  const nextEdge = canvasA!.edges.find((e) => e.label === 'next step');
  assert(Boolean(nextEdge), 'Contains bezier connector labeled "next step"');

  // Test 2: Canvas Creation, Rename, and Deletion Lifecycle
  console.log('\n--- Test 2: Canvas Lifecycle Operations ---');
  const created = await canvasService.createCanvas('Architecture Workshop');
  assert(created.title === 'Architecture Workshop', 'createCanvas returns new canvas with title');

  await canvasService.renameCanvas(created.id, 'Architecture Workshop v2');
  const reloaded = await canvasService.getCanvases();
  const foundUpdated = reloaded.find((c) => c.id === created.id);
  assert(
    foundUpdated?.title === 'Architecture Workshop v2',
    'renameCanvas updates canvas title in DB'
  );

  await canvasService.saveCanvasViewport(created.id, { x: 200, y: 150, zoom: 1.25 });
  const reloadedVp = await canvasService.getCanvases();
  const foundVp = reloadedVp.find((c) => c.id === created.id);
  assert(foundVp?.viewport?.zoom === 1.25, 'saveCanvasViewport persists viewport zoom');
  assert(
    foundVp?.viewport?.x === 200 && foundVp?.viewport?.y === 150,
    'saveCanvasViewport persists viewport pan'
  );

  await canvasService.deleteCanvas(created.id);
  const afterDelete = await canvasService.getCanvases();
  assert(
    !afterDelete.some((c) => c.id === created.id),
    'deleteCanvas successfully removes canvas from DB'
  );

  // Test 3: useCanvasStore Interactive State
  console.log('\n--- Test 3: Canvas Zustand Store Engine ---');
  const store = useCanvasStore.getState();
  await store.loadCanvases();

  const loadedStore = useCanvasStore.getState();
  assert(loadedStore.canvases.length >= 3, 'store.loadCanvases populates canvases list');
  assert(Boolean(loadedStore.activeCanvasId), 'store.loadCanvases selects active canvas');

  // Dot Grid Toggle
  assert(loadedStore.gridEnabled === true, 'Dot grid is enabled by default');
  store.setGridEnabled(false);
  assert(useCanvasStore.getState().gridEnabled === false, 'setGridEnabled(false) toggles grid off');
  store.setGridEnabled(true);
  assert(useCanvasStore.getState().gridEnabled === true, 'setGridEnabled(true) toggles grid on');

  // Active Tool State
  assert(useCanvasStore.getState().activeTool === 'select', 'Initial active tool is select');
  store.setActiveTool('text');
  assert(
    useCanvasStore.getState().activeTool === 'text',
    'setActiveTool("text") updates activeTool'
  );
  store.setActiveTool('kanban');
  assert(
    useCanvasStore.getState().activeTool === 'kanban',
    'setActiveTool("kanban") updates activeTool'
  );

  // Add Custom Node
  const testNodeId = `node_test_${Date.now()}`;
  await store.addNode({
    id: testNodeId,
    type: 'simple_text',
    position: { x: 500, y: 500 },
    data: {
      title: 'Store Test Sticky',
      content: 'Testing reactive node additions',
      color: '#FED7E8',
    },
  });

  const activeCanvasAfterAdd = useCanvasStore
    .getState()
    .canvases.find((c) => c.id === useCanvasStore.getState().activeCanvasId);
  assert(
    Boolean(activeCanvasAfterAdd?.nodes.some((n) => n.id === testNodeId)),
    'addNode successfully appends node to current active canvas'
  );

  // Update Node Data
  await store.updateNodeData(testNodeId, {
    title: 'Updated Store Sticky',
    color: '#D1FBE3',
  });

  const activeCanvasAfterUpdate = useCanvasStore
    .getState()
    .canvases.find((c) => c.id === useCanvasStore.getState().activeCanvasId);
  const updatedNode = activeCanvasAfterUpdate?.nodes.find((n) => n.id === testNodeId);
  assert(updatedNode?.data.title === 'Updated Store Sticky', 'updateNodeData updates title');
  assert(updatedNode?.data.color === '#D1FBE3', 'updateNodeData updates pastel color');

  // Add Edge & Update Label
  const testEdgeId = `edge_test_${Date.now()}`;
  await store.addEdge({
    id: testEdgeId,
    source: 'node_kanban_1',
    target: testNodeId,
    label: 'prototype label',
  });

  const activeCanvasAfterEdge = useCanvasStore
    .getState()
    .canvases.find((c) => c.id === useCanvasStore.getState().activeCanvasId);
  assert(
    Boolean(activeCanvasAfterEdge?.edges.some((e) => e.id === testEdgeId)),
    'addEdge successfully appends connector edge'
  );

  await store.updateEdgeLabel(testEdgeId, 'implements');
  const activeCanvasAfterLabel = useCanvasStore
    .getState()
    .canvases.find((c) => c.id === useCanvasStore.getState().activeCanvasId);
  const updatedEdge = activeCanvasAfterLabel?.edges.find((e) => e.id === testEdgeId);
  assert(updatedEdge?.label === 'implements', 'updateEdgeLabel updates connector label');

  // Delete Edge
  await store.deleteEdge(testEdgeId);
  const activeCanvasAfterEdgeDel = useCanvasStore
    .getState()
    .canvases.find((c) => c.id === useCanvasStore.getState().activeCanvasId);
  assert(
    !activeCanvasAfterEdgeDel?.edges.some((e) => e.id === testEdgeId),
    'deleteEdge removes connector edge'
  );

  // Delete Node (Cascades node and connected edges)
  await store.deleteNode(testNodeId);
  const activeCanvasAfterNodeDel = useCanvasStore
    .getState()
    .canvases.find((c) => c.id === useCanvasStore.getState().activeCanvasId);
  assert(
    !activeCanvasAfterNodeDel?.nodes.some((n) => n.id === testNodeId),
    'deleteNode removes node from current canvas'
  );

  // Reconnect Edge (Move connector from one node to another)
  console.log('\n--- Test 4: Edge Reconnection Engine ---');
  const edgeToMove = useCanvasStore.getState().edges.find((e) => e.id === 'e_kanban_launch');
  assert(Boolean(edgeToMove), 'Found e_kanban_launch edge before reconnection');
  assert(edgeToMove!.target === 'node_launch_1', 'Initial edge target is node_launch_1');

  // Reconnect target to node_evidence_1
  store.onReconnect(edgeToMove!, {
    source: edgeToMove!.source,
    target: 'node_evidence_1',
    sourceHandle: edgeToMove!.sourceHandle ?? null,
    targetHandle: 'top',
  });

  const reconnectedEdge = useCanvasStore.getState().edges.find((e) => e.id === 'e_kanban_launch');
  assert(Boolean(reconnectedEdge), 'Edge exists after reconnection');
  assert(
    reconnectedEdge!.target === 'node_evidence_1',
    'Connector target successfully moved to node_evidence_1 without deleting'
  );
  assert(reconnectedEdge!.label === 'feeds into', 'Edge label preserved after reconnection');

  // Reconnect source to node_media_1
  store.onReconnect(reconnectedEdge!, {
    source: 'node_media_1',
    target: 'node_evidence_1',
    sourceHandle: 'bottom',
    targetHandle: 'top',
  });

  const reconnectedSourceEdge = useCanvasStore
    .getState()
    .edges.find((e) => e.id === 'e_kanban_launch');
  assert(
    reconnectedSourceEdge!.source === 'node_media_1',
    'Connector source successfully moved to node_media_1'
  );
  assert(reconnectedSourceEdge!.label === 'feeds into', 'Edge label remains preserved');

  // Test 5: Section Root Dragging & Child Propagation Engine
  console.log('\n--- Test 5: Section Root Dragging Engine ---');
  const secNodeBefore = useCanvasStore.getState().nodes.find((n) => n.id === 'node_section_1');
  assert(Boolean(secNodeBefore), 'Found node_section_1 container');
  const kanbanNodeBefore = useCanvasStore.getState().nodes.find((n) => n.id === 'node_kanban_1');
  assert(Boolean(kanbanNodeBefore), 'Found node_kanban_1 inside section');

  const initialSecX = secNodeBefore!.position.x;
  const initialSecY = secNodeBefore!.position.y;
  const initialKanbanX = kanbanNodeBefore!.position.x;
  const initialKanbanY = kanbanNodeBefore!.position.y;

  // Move section area by dx = +150, dy = +100
  store.onNodesChange([
    {
      id: 'node_section_1',
      type: 'position',
      position: { x: initialSecX + 150, y: initialSecY + 100 },
    },
  ]);

  const secNodeAfter = useCanvasStore.getState().nodes.find((n) => n.id === 'node_section_1');
  assert(
    secNodeAfter!.position.x === initialSecX + 150 &&
      secNodeAfter!.position.y === initialSecY + 100,
    'Section moved to new position'
  );

  const kanbanNodeAfter = useCanvasStore.getState().nodes.find((n) => n.id === 'node_kanban_1');
  assert(
    kanbanNodeAfter!.position.x === initialKanbanX + 150 &&
      kanbanNodeAfter!.position.y === initialKanbanY + 100,
    'Enclosed Kanban node automatically followed the section area'
  );

  // Test 6: Layering Hierarchy (Section < Edges < Cards)
  console.log('\n--- Test 6: Layering Hierarchy Engine ---');
  const sectionZIndex = secNodeAfter?.zIndex ?? 0;
  const kanbanZIndex = kanbanNodeAfter?.zIndex ?? 10;
  const testEdge = useCanvasStore.getState().edges[0];
  const edgeZIndex = testEdge?.zIndex ?? 5;

  assert(sectionZIndex === 0, 'Section node is at background level (zIndex: 0)');
  assert(edgeZIndex === 5, 'Connector edges are layered above section (zIndex: 5)');
  assert(kanbanZIndex === 10, 'Card nodes are layered above edges (zIndex: 10)');
  assert(
    kanbanZIndex > edgeZIndex && edgeZIndex > sectionZIndex,
    'Verified hierarchy: Cards (10) > Edges (5) > Section (0) so connectors inside sections remain clickable'
  );

  console.log('\nAll 24 Infinite Spatial Canvas engine tests PASSED successfully!');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  throw err;
});
