import { METACATEGORIES } from '../data/catalog';

const META_LABELS = {
  MATERIAL:  'Material',
  LABOR:     'Labor',
  EQUIPMENT: 'Equipment',
  LOGISTICS: 'Logistics',
};

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function itemLineTotal(item) {
  if (item.isWallAssembly) {
    return (item.faceFt * item.pricePerFaceFt) + (item.linearFt * item.pricePerLinearFt);
  }
  return item.quantity * item.unitPrice;
}

function renderItemRows(item, idx) {
  const lineTotal = itemLineTotal(item);
  const loads = (!item.isWallAssembly && item.unitsPerLoad && item.quantity > 0)
    ? Math.ceil(item.quantity / item.unitsPerLoad) : 0;
  const bg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';

  const rows = [
    <tr key={item.id} className={bg}>
      <td className="px-4 py-2 font-medium">{item.name}</td>
      <td className="px-4 py-2 text-center text-gray-600">
        {item.isWallAssembly ? 'LF × H'
          : item.isAssembly ? item.takeoffUnit
          : item.unit}
      </td>
      <td className="px-4 py-2 text-center">
        {item.isWallAssembly ? (
          <>
            {item.linearFt} LF × {item.height} ft
            <span className="block text-xs text-gray-400">= {fmt(item.faceFt)} face ft</span>
          </>
        ) : item.isAssembly ? (
          <>
            {item.takeoffQty}
            <span className="block text-xs text-gray-400">= {item.quantity.toFixed(2)} {item.unit}</span>
            {loads > 0 && <span className="block text-xs text-gray-400">{loads} load{loads !== 1 ? 's' : ''}</span>}
          </>
        ) : item.quantity}
      </td>
      <td className="px-4 py-2 text-right">
        {item.isWallAssembly ? (
          <>
            <span className="block">${fmt(item.pricePerFaceFt)}<span className="text-gray-400 text-xs">/ff</span></span>
            <span className="block">${fmt(item.pricePerLinearFt)}<span className="text-gray-400 text-xs">/lf</span></span>
          </>
        ) : `$${fmt(item.unitPrice)}`}
      </td>
      <td className="px-4 py-2 text-right font-semibold">${fmt(lineTotal)}</td>
    </tr>,
  ];

  if (item.notes) {
    rows.push(
      <tr key={`${item.id}-notes`} className={bg}>
        <td colSpan={5} className="px-4 pb-2 text-xs text-gray-400 italic">
          {item.notes}
        </td>
      </tr>
    );
  }

  return rows;
}

export default function PrintView({ estimate, subtotal, metacategoryTotals, totalLoads, taxAmount, total }) {
  const allItems = estimate.rows.flatMap(row =>
    row.type === 'group' ? row.items : row.type === 'item' ? [row] : []
  );
  const activeMetas = METACATEGORIES.filter(m => (metacategoryTotals?.[m] ?? 0) > 0);

  return (
    <div className="hidden print:block p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-green-800">Landscape Estimate</h1>
          <p className="text-gray-500 mt-1">Prepared for: <strong>{estimate.clientName || '—'}</strong></p>
          <p className="text-gray-500">Project: <strong>{estimate.projectName || '—'}</strong></p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-800">Your Company Name</p>
          <p className="text-gray-500 text-sm">Date: {estimate.date}</p>
        </div>
      </div>

      {/* Line items table */}
      <table className="w-full text-sm border-collapse mb-10">
        <thead>
          <tr className="bg-green-800 text-white">
            <th className="text-left px-4 py-2 rounded-tl">Item</th>
            <th className="text-center px-4 py-2">Unit</th>
            <th className="text-center px-4 py-2">Qty</th>
            <th className="text-right px-4 py-2">Unit Price</th>
            <th className="text-right px-4 py-2 rounded-tr">Total</th>
          </tr>
        </thead>
        <tbody>
          {estimate.rows.flatMap((row, rowIdx) => {
            if (row.type === 'group') {
              const groupTotal = row.items.reduce((sum, item) => sum + itemLineTotal(item), 0);
              return [
                <tr key={`group-${row.id}`} className="bg-indigo-50">
                  <td colSpan={4} className="px-4 py-1.5 border-t-2 border-indigo-200">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-indigo-800 text-sm">
                        {row.label || 'Take Off Group'}
                      </span>
                      {row.sqFt > 0 && (
                        <span className="text-xs text-indigo-600">{row.sqFt.toLocaleString()} sq ft</span>
                      )}
                      {row.linearFt > 0 && (
                        <span className="text-xs text-indigo-600">{row.linearFt.toLocaleString()} ln ft</span>
                      )}
                      {row.linearFt > 0 && row.height > 0 && (
                        <span className="text-xs text-indigo-600">
                          {(row.linearFt * row.height).toLocaleString()} face ft
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-1.5 border-t-2 border-indigo-200 text-right font-bold text-indigo-800">
                    ${fmt(groupTotal)}
                  </td>
                </tr>,
                ...(row.notes ? [
                  <tr key={`group-${row.id}-notes`} className="bg-indigo-50">
                    <td colSpan={5} className="px-4 pb-2 text-xs text-indigo-500 italic">
                      {row.notes}
                    </td>
                  </tr>
                ] : []),
                ...row.items.flatMap((item, idx) => renderItemRows(item, idx)),
              ];
            }
            return renderItemRows(row, rowIdx);
          })}
        </tbody>
      </table>

      {/* Cost summary by category + totals side by side */}
      <div className="flex justify-between items-start gap-8 mb-8">

        {/* Metacategory breakdown */}
        <div className="flex-1">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
            Cost Summary by Type
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-3 py-1.5 text-gray-600 font-semibold">Type</th>
                <th className="text-right px-3 py-1.5 text-gray-600 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {activeMetas.map(meta => (
                <tr key={meta} className="border-t border-gray-100">
                  <td className="px-3 py-1.5 text-gray-700">
                    {META_LABELS[meta]}
                    {meta === 'LOGISTICS' && totalLoads > 0 && (
                      <span className="ml-2 text-xs text-gray-400">({totalLoads} delivery load{totalLoads !== 1 ? 's' : ''})</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium">${fmt(metacategoryTotals[meta])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="w-60 shrink-0">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
            &nbsp;
          </h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2 flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">${fmt(subtotal)}</span>
            </div>
            <div className="px-4 py-2 flex justify-between text-sm border-t border-gray-100">
              <span className="text-gray-600">Tax ({estimate.taxRate}%)</span>
              <span className="font-medium">${fmt(taxAmount)}</span>
            </div>
            <div className="px-4 py-3 flex justify-between bg-green-800 text-white">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">${fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 text-center border-t pt-4">
        This estimate is valid for 30 days. Thank you for your business.
      </p>
    </div>
  );
}
