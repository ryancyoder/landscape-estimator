import { useRef, useState } from 'react';
import { PLANT_TYPES } from './PlanCanvas';

const PLANT_SYMBOL_MAP = Object.fromEntries(PLANT_TYPES.map(pt => [pt.key, pt]));

function ShapeItem({ shape, availableGroups, onUpdate, onRemove, onAddGroup }) {
  const [naming, setNaming] = useState(false);
  const [newName, setNewName] = useState('');

  function handleSelectChange(e) {
    if (e.target.value === '__new__') {
      setNaming(true);
      setNewName('');
    } else {
      onUpdate(shape.id, { groupId: e.target.value || null });
    }
  }

  function handleConfirmNew() {
    const name = newName.trim() || 'New Take Off';
    const groupId = onAddGroup(name);
    onUpdate(shape.id, { groupId });
    setNaming(false);
  }

  const header = (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: shape.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700 truncate">
          {shape.type === 'area'
            ? `${Math.round(shape.measurement).toLocaleString()} sq ft`
            : `${Math.round(shape.measurement).toLocaleString()} lin ft`}
        </p>
        <p className="text-[10px] text-gray-400">{shape.type === 'area' ? 'Area' : 'Linear'}</p>
      </div>
      <button
        onClick={() => onRemove(shape.id)}
        className="shrink-0 p-0.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Remove shape"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  if (naming) {
    return (
      <div className="rounded-lg border border-indigo-300 bg-indigo-50 p-2 flex flex-col gap-1.5">
        {header}
        <input
          autoFocus
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleConfirmNew(); if (e.key === 'Escape') setNaming(false); }}
          placeholder="Group name…"
          className="w-full text-xs border border-indigo-300 rounded px-1.5 py-1 bg-white text-gray-800
                     focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <div className="flex gap-1">
          <button
            onClick={handleConfirmNew}
            className="flex-1 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors"
          >
            Create
          </button>
          <button
            onClick={() => setNaming(false)}
            className="flex-1 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 flex flex-col gap-1.5">
      {header}
      <select
        value={shape.groupId || ''}
        onChange={handleSelectChange}
        className="w-full text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-700
                   focus:outline-none focus:ring-1 focus:ring-indigo-400"
      >
        <option value="">Unlinked</option>
        {availableGroups.map(g => (
          <option key={g.id} value={g.id}>{g.label}</option>
        ))}
        <option value="__new__">＋ New group…</option>
      </select>
    </div>
  );
}

export default function PlanShapeList({
  plan, groups, catalogPlants, calPending, calPoints,
  onSetPlanImage, onSetScale, onResetScale,
  onUpdateShape, onRemoveShape, onAddGroup,
}) {
  const fileInputRef = useRef(null);
  const [calDistance, setCalDistance] = useState('');

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        onSetPlanImage({ imageDataUrl: ev.target.result, imageWidth: img.naturalWidth, imageHeight: img.naturalHeight });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleSetScale() {
    const distance = parseFloat(calDistance);
    if (!distance || distance <= 0 || !calPoints[0] || !calPoints[1]) return;
    const dx = calPoints[1].x - calPoints[0].x;
    const dy = calPoints[1].y - calPoints[0].y;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);
    onSetScale(pixelDist / distance, `${distance} ft`);
    setCalDistance('');
  }

  return (
    <div className="w-60 shrink-0 border-l border-gray-700 overflow-y-auto bg-gray-900 flex flex-col text-white">

      {/* Image upload */}
      {!plan.imageDataUrl && (
        <div className="p-3 border-b border-gray-700">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-medium transition-colors"
          >
            Upload Plan Image
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {/* Scale status */}
      <div className="p-3 border-b border-gray-700">
        {plan.scale ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-300">
              1 ft = {plan.scale.pixelsPerFoot.toFixed(1)} px
            </span>
            <button
              onClick={onResetScale}
              className="text-xs text-red-400 hover:text-red-300 underline shrink-0"
            >
              Reset
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-500">No scale set — use Calibrate tool</p>
        )}
      </div>

      {/* Calibration distance input */}
      {calPending && (
        <div className="p-3 border-b border-gray-700 bg-yellow-900/30">
          <p className="text-xs font-semibold text-yellow-300 mb-2">Enter distance between points:</p>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={calDistance}
              onChange={e => setCalDistance(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSetScale()}
              placeholder="e.g. 20"
              autoFocus
              className="flex-1 min-w-0 border border-gray-600 rounded px-2 py-1 text-sm bg-gray-800
                         text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-yellow-400"
            />
            <span className="text-xs text-gray-400 shrink-0">ft</span>
          </div>
          <button
            onClick={handleSetScale}
            className="mt-2 w-full py-1.5 bg-yellow-500 hover:bg-yellow-400 text-white rounded text-sm font-medium transition-colors"
          >
            Set Scale
          </button>
        </div>
      )}

      {/* Plant count summary */}
      {(plan.plants ?? []).length > 0 && (
        <div className="px-3 py-2 border-b border-gray-700">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Plants</p>
          <div className="flex flex-col gap-1">
            {(catalogPlants ?? []).map(cat => {
              const count = (plan.plants ?? []).filter(p => p.catalogId === cat.id).length;
              if (!count) return null;
              const sym = PLANT_SYMBOL_MAP[cat.planSymbol];
              return (
                <div key={cat.id} className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">{sym?.symbol ?? '🌱'} {cat.name}</span>
                  <span className="text-xs font-bold text-white bg-gray-700 px-1.5 py-0.5 rounded-full min-w-[1.4rem] text-center">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shape list */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {plan.imageDataUrl && plan.shapes.length === 0 && (
          <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
            No shapes yet.<br />Use Area or Linear tools.
          </p>
        )}
        {plan.shapes.map(shape => {
          // Only show groups not already linked to another shape of the same type
          const availableGroups = groups.filter(g =>
            g.id === shape.groupId ||
            !plan.shapes.some(s => s.id !== shape.id && s.groupId === g.id && s.type === shape.type)
          );
          return (
            <ShapeItem
              key={shape.id}
              shape={shape}
              availableGroups={availableGroups}
              onUpdate={onUpdateShape}
              onRemove={onRemoveShape}
              onAddGroup={onAddGroup}
            />
          );
        })}
      </div>

      {/* Change image (when image exists) */}
      {plan.imageDataUrl && (
        <div className="p-2 border-t border-gray-700">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
          >
            Replace Image
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      )}
    </div>
  );
}
