function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function EstimateSummary({ subtotal, taxAmount, total, taxRate, onTaxRateChange, totalLoads, totalDelivery }) {
  return (
    <div className="mt-4 flex justify-end">
      <div className="w-72 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 space-y-2">
          {/* Subtotal */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Materials</span>
            <span className="font-medium text-gray-800">${fmt(subtotal)}</span>
          </div>

          {/* Delivery */}
          {totalLoads > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery ({totalLoads} load{totalLoads !== 1 ? 's' : ''})</span>
              <span className="font-medium text-gray-800">${fmt(totalDelivery)}</span>
            </div>
          )}

          {/* Tax rate */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <span>Tax</span>
              <div className="relative w-14">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={e => onTaxRateChange(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs text-right border border-gray-200 rounded px-1.5 pr-4 py-0.5
                             focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
              </div>
            </div>
            <span className="font-medium text-gray-800">${fmt(taxAmount)}</span>
          </div>
        </div>

        {/* Grand total */}
        <div className="px-4 py-3 bg-green-700 flex justify-between items-center">
          <span className="text-sm font-bold text-white uppercase tracking-wide">Total</span>
          <span className="text-xl font-bold text-white">${fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}
