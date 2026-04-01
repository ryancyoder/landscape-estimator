import { useState, useEffect, useRef } from 'react';

export default function AssemblyKitModal({ groupLabel, itemCount, onSave, onClose }) {
  const [name, setName] = useState(groupLabel ?? '');
  const [description, setDescription] = useState('');
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, description.trim());
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
        <h2 className="text-base font-bold text-gray-800 mb-1">Save as Assembly Kit</h2>
        <p className="text-xs text-gray-400 mb-4">
          Saves {itemCount} item{itemCount !== 1 ? 's' : ''} and their assembly relationships to your kit library.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Kit Name *</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Lawn Installation"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Full lawn install per sq ft — seed, topsoil, erosion blanket"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent
                         placeholder:text-gray-300"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400
                         text-white font-semibold text-sm py-2 rounded-lg transition-colors"
            >
              Save Kit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600
                         font-semibold text-sm py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
