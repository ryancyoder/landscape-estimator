import { useState, useRef, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useEstimate } from './hooks/useEstimate';
import { useCatalog } from './hooks/useCatalog';
import CatalogPanel from './components/CatalogPanel';
import CatalogEditor from './components/CatalogEditor';
import ImportModal from './components/ImportModal';
import QuickPicker from './components/QuickPicker';
import EstimatePanel from './components/EstimatePanel';
import PlanView from './components/PlanView';
import PrintView from './components/PrintView';
import { CATEGORY_COLORS } from './data/catalog';

export default function App() {
  const { catalogItems, updateCatalogItem, addCatalogItem, removeCatalogItem, saveCatalog } = useCatalog();

  const {
    estimate,
    updateField,
    addGroup,
    updateGroup,
    toggleGroupCollapse,
    addItem,
    removeRow,
    updateItem,
    updateTakeoff,
    updateWallDimensions,
    reorderRows,
    importEstimate,
    resetEstimate,
    setPlanImage,
    setPlanScale,
    addShape,
    updateShape,
    removeShape,
    addPlant,
    removePlant,
    subtotal,
    taxAmount,
    total,
  } = useEstimate();

  // activeDrag: { type: 'catalog', item } | { type: 'takeoff-group' } | null
  const [activeDrag, setActiveDrag] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [planOpen, setPlanOpen] = useState(false);
  const loadInputRef = useRef(null);

  const activeGroup = estimate.rows.find(r => r.type === 'group' && r.id === activeGroupId) ?? null;

  const openPicker = useCallback(() => setPickerOpen(true), []);

  useEffect(() => {
    function onKeyDown(e) {
      // g → new Take Off Group (when not typing in an input)
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        const id = addGroup();
        setActiveGroupId(id);
        setTimeout(() => {
          const input = document.querySelector(`[data-group-label="${id}"]`);
          if (input) { input.focus(); input.select(); }
        }, 0);
        return;
      }
      // / → open picker (when not typing in an input)
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        setPickerOpen(true);
        return;
      }
      // Cmd+K → open picker from anywhere
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPickerOpen(true);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [addGroup]);

  function handleSaveEstimate() {
    const name = (estimate.projectName?.trim() || 'estimate')
      .replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `${name}-${estimate.date || 'draft'}.json`;
    const blob = new Blob([JSON.stringify(estimate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLoadFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data.rows)) throw new Error('Not a valid estimate file');
        importEstimate(data);
      } catch (err) {
        alert('Could not load file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  function handleDragStart(event) {
    const data = event.active.data.current;
    if (data?.type === 'catalog') {
      setActiveDrag({ type: 'catalog', item: data.catalogItem });
    } else if (data?.type === 'takeoff-group') {
      setActiveDrag({ type: 'takeoff-group' });
    } else {
      setActiveDrag(null);
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveDrag(null);

    if (!over) return;

    const activeData = active.data.current;

    if (activeData?.type === 'takeoff-group') {
      addGroup();
    } else if (activeData?.type === 'catalog') {
      // Check if dropped directly on a group header
      const overRow = estimate.rows.find(r => r.id === over.id);
      if (overRow?.type === 'group') {
        addItem(activeData.catalogItem, overRow.id);
      } else {
        // Check if dropped on an item that is inside a group
        const parentGroup = estimate.rows.find(
          r => r.type === 'group' && r.items.some(i => i.id === over.id)
        );
        addItem(activeData.catalogItem, parentGroup ? parentGroup.id : null);
      }
    } else {
      // Reordering estimate rows
      if (active.id !== over.id) {
        reorderRows(active.id, over.id);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Screen layout */}
      <div className="flex flex-col h-screen overflow-hidden print:hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 bg-green-800 text-white shrink-0 shadow">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌿</span>
            <h1 className="text-lg font-bold tracking-tight">Landscape Estimator</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('Start a new estimate? All current work will be cleared.')) resetEstimate();
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-700 hover:bg-green-600
                         rounded-lg text-sm font-medium transition-colors"
              title="New estimate"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
            <button
              onClick={() => setPlanOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-700 hover:bg-green-600
                         rounded-lg text-sm font-medium transition-colors"
              title="Open plan view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Plan
            </button>
            <button
              onClick={() => setEditorOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-700 hover:bg-green-600
                         rounded-lg text-sm font-medium transition-colors"
              title="Edit catalog"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Catalog
            </button>
            {/* Quick picker */}
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-700 hover:bg-green-600
                         rounded-lg text-sm font-medium transition-colors"
              title="Quick add item (/ or Cmd+K)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Quick Add
            </button>

            {/* Save estimate to file */}
            <button
              onClick={handleSaveEstimate}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-700 hover:bg-green-600
                         rounded-lg text-sm font-medium transition-colors"
              title="Save estimate to file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Save
            </button>

            {/* Load estimate from file */}
            <button
              onClick={() => loadInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-700 hover:bg-green-600
                         rounded-lg text-sm font-medium transition-colors"
              title="Load estimate from file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Load
            </button>
            <input
              ref={loadInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleLoadFile}
            />

            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-700 hover:bg-green-600
                         rounded-lg text-sm font-medium transition-colors"
              title="Import from transcript"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-1.5 bg-white text-green-800
                         rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Estimate
            </button>
          </div>
        </header>

        {/* Main content */}
        {planOpen ? (
          <PlanView
            estimate={estimate}
            catalogPlants={catalogItems.filter(c => c.category === 'plants')}
            onSetPlanImage={setPlanImage}
            onSetPlanScale={setPlanScale}
            onAddShape={addShape}
            onUpdateShape={updateShape}
            onRemoveShape={removeShape}
            onAddPlant={(plant) => addPlant(plant, catalogItems)}
            onRemovePlant={(plantId) => removePlant(plantId, catalogItems)}
            onAddGroup={addGroup}
            onClose={() => setPlanOpen(false)}
          />
        ) : (
          <main className="flex flex-1 overflow-hidden">
            <CatalogPanel catalogItems={catalogItems} />
            <EstimatePanel
              estimate={estimate}
              planShapes={estimate.plan?.shapes ?? []}
              onUpdateField={updateField}
              onUpdateGroup={updateGroup}
              onToggleGroupCollapse={toggleGroupCollapse}
              onUpdateItem={updateItem}
              onUpdateTakeoff={updateTakeoff}
              onUpdateWallDimensions={updateWallDimensions}
              onRemoveRow={removeRow}
              activeGroupId={activeGroupId}
              onSetActiveGroup={setActiveGroupId}
              subtotal={subtotal}
              taxAmount={taxAmount}
              total={total}
            />
          </main>
        )}
      </div>

      {/* Print-only view */}
      <PrintView
        estimate={estimate}
        subtotal={subtotal}
        taxAmount={taxAmount}
        total={total}
      />

      {/* Drag overlay */}
      <DragOverlay>
        {activeDrag?.type === 'takeoff-group' ? (
          <TakeOffGroupDragOverlay />
        ) : activeDrag?.type === 'catalog' ? (
          <CatalogDragOverlay item={activeDrag.item} />
        ) : null}
      </DragOverlay>

      {/* Quick picker */}
      {pickerOpen && (
        <QuickPicker
          catalogItems={catalogItems}
          activeGroup={activeGroup}
          onAdd={(item, groupId) => addItem(item, groupId)}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {/* Import modal */}
      {importOpen && (
        <ImportModal
          catalogItems={catalogItems}
          onImport={(data) => { importEstimate(data); setImportOpen(false); }}
          onClose={() => setImportOpen(false)}
        />
      )}

      {/* Catalog editor modal */}
      {editorOpen && (
        <CatalogEditor
          items={catalogItems}
          onUpdate={updateCatalogItem}
          onAdd={addCatalogItem}
          onRemove={removeCatalogItem}
          onSave={() => saveCatalog(catalogItems)}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </DndContext>
  );
}

function TakeOffGroupDragOverlay() {
  return (
    <div className="rounded-xl border border-indigo-300 bg-indigo-50 shadow-xl px-3 py-2.5 w-72 opacity-90">
      <div className="flex items-center gap-2.5">
        <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="text-sm font-semibold text-indigo-800">New Take Off Group</span>
      </div>
    </div>
  );
}

function CatalogDragOverlay({ item }) {
  const colors = CATEGORY_COLORS[item.category];
  return (
    <div className={`
      rounded-lg border p-3 shadow-2xl cursor-grabbing w-60
      ${colors.bg} ${colors.border} border
    `}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`font-medium text-sm leading-tight ${colors.text}`}>
            {item.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-xs font-semibold ${colors.text}`}>
            ${item.unitPrice.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">{item.unit}</p>
        </div>
      </div>
    </div>
  );
}
