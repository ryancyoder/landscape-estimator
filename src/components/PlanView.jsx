import { useState } from 'react';
import PlanCanvas, { PLANT_TYPES } from './PlanCanvas';
import PlanShapeList from './PlanShapeList';
import { genId, SHAPE_COLORS } from '../hooks/useEstimate';

const PLANT_SYMBOL_MAP = Object.fromEntries(PLANT_TYPES.map(pt => [pt.key, pt]));

function ToolBtn({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
        ${active ? 'bg-white text-gray-900' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
    >
      {icon}{label}
    </button>
  );
}

export default function PlanView({
  estimate,
  catalogPlants,
  onSetPlanImage, onSetPlanScale,
  onAddShape, onUpdateShape, onRemoveShape,
  onAddPlant, onRemovePlant,
  onAddGroup,
  onClose,
}) {
  const [activeTool, setActiveTool] = useState('select');
  const [selectedPlantId, setSelectedPlantId] = useState(null);
  const [calPoints, setCalPoints] = useState([]);

  const plantable = (catalogPlants ?? []).filter(c => c.planSymbol);

  const calPending = calPoints.length === 2;
  const groups = estimate.rows.filter(r => r.type === 'group');

  function handleCalibrationPointsSet(p1, p2) { setCalPoints([p1, p2]); }

  function handleShapeComplete(type, vertices) {
    const color = SHAPE_COLORS[estimate.plan.shapes.length % SHAPE_COLORS.length];
    onAddShape({ id: genId('shape'), type, groupId: null, vertices, measurement: 0, color });
    setActiveTool('select');
  }

  function handleSetScale(pixelsPerFoot, label) {
    onSetPlanScale({ pixelsPerFoot, p1: calPoints[0], p2: calPoints[1], label });
    setCalPoints([]);
    setActiveTool('select');
  }

  function handleResetScale() { onSetPlanScale(null); setCalPoints([]); }

  function handleAddPlant(partialPlant) {
    onAddPlant({ id: genId('plant'), ...partialPlant });
  }

  // Toolbar icons
  const icons = {
    calibrate: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>,
    area: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 0 3 18L2 21z"/></svg>,
    linear: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20L20 4"/></svg>,
    select: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>,
    plant: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22V12m0 0C12 7 7 4 3 6c4 1 7 4 9 6zm0 0c0-5 5-8 9-6-4 1-7 4-9 6"/></svg>,
  };

  const toolHints = {
    area: 'Click to add vertices · Click first vertex or Enter to close',
    linear: 'Click to add vertices · Double-click or Enter to finish',
    calibrate: 'Click two points on a known distance',
    select: 'Click a shape or plant to select · Delete to remove',
    plant: plantable.length > 0
      ? 'Click to place · 1–' + plantable.length + ' or Tab to switch plant'
      : 'Assign plan symbols to plants in Catalog Settings first',
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Main toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 bg-gray-900 shrink-0 border-b border-gray-700">
        <ToolBtn label="← Back" icon={null} active={false} onClick={onClose} />
        <div className="w-px h-5 bg-gray-700 mx-1" />
        <ToolBtn label="Calibrate" icon={icons.calibrate} active={activeTool === 'calibrate'} onClick={() => setActiveTool('calibrate')} />
        <ToolBtn label="Area"      icon={icons.area}      active={activeTool === 'area'}      onClick={() => setActiveTool('area')} />
        <ToolBtn label="Linear"    icon={icons.linear}    active={activeTool === 'linear'}    onClick={() => setActiveTool('linear')} />
        <ToolBtn label="Plant"     icon={icons.plant}     active={activeTool === 'plant'}     onClick={() => setActiveTool('plant')} />
        <ToolBtn label="Select"    icon={icons.select}    active={activeTool === 'select'}    onClick={() => setActiveTool('select')} />
        <div className="flex-1" />
        <span className="text-xs text-gray-500 hidden sm:block">{toolHints[activeTool]}</span>
      </div>

      {/* Plant sub-toolbar */}
      {activeTool === 'plant' && (
        <div className="flex items-center gap-1 px-4 py-1.5 bg-gray-800 border-b border-gray-700 shrink-0">
          <span className="text-xs text-gray-500 mr-2">Plant:</span>
          {plantable.length === 0 ? (
            <span className="text-xs text-gray-500 italic">
              Open Catalog Settings → Plants and assign Plan Symbols
            </span>
          ) : (
            plantable.map((cat, i) => {
              const sym = PLANT_SYMBOL_MAP[cat.planSymbol];
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedPlantId(cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors
                    ${selectedPlantId === cat.id ? 'bg-white text-gray-900' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                >
                  <span>{sym?.symbol ?? '🌱'}</span>
                  <span>{cat.name}</span>
                  <span className="opacity-40 text-[10px]">[{i + 1}]</span>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <PlanCanvas
          plan={estimate.plan}
          groups={groups}
          activeTool={activeTool}
          catalogPlants={catalogPlants}
          selectedPlantId={selectedPlantId}
          onPlantIdChange={setSelectedPlantId}
          onAddPlant={handleAddPlant}
          onRemovePlant={onRemovePlant}
          onCalibrationPointsSet={handleCalibrationPointsSet}
          onShapeComplete={handleShapeComplete}
          onUpdateShape={onUpdateShape}
          onRemoveShape={onRemoveShape}
        />
        <PlanShapeList
          plan={estimate.plan}
          groups={groups}
          catalogPlants={catalogPlants}
          calPending={calPending}
          calPoints={calPoints}
          onSetPlanImage={onSetPlanImage}
          onSetScale={handleSetScale}
          onResetScale={handleResetScale}
          onUpdateShape={onUpdateShape}
          onRemoveShape={onRemoveShape}
          onAddGroup={onAddGroup}
        />
      </div>
    </div>
  );
}
