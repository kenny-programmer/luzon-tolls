import { useState } from 'react';
import { TOLL_SYSTEM } from '../lib/toll-data';

type VehicleClass = 1 | 2 | 3;

function getRateForPair(key: string, from: string, to: string, vehicleClass: VehicleClass): number | null {
  const expressway = TOLL_SYSTEM[key];
  const rate = expressway.rates.find(
    r => (r.from === from && r.to === to) || (r.from === to && r.to === from)
  );
  if (!rate) return null;
  if (vehicleClass === 1) return rate.class1;
  if (vehicleClass === 2) return rate.class2;
  return rate.class3;
}

export default function TollMatrix() {
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>(1);

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Toll Matrix/Table</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">All rates in PHP. Select vehicle class below.</p>
          </div>
          <div className="flex gap-1.5">
            {([1, 2, 3] as VehicleClass[]).map(cls => (
              <button
                key={cls}
                onClick={() => setVehicleClass(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  vehicleClass === cls
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Class {cls}
              </button>
            ))}
          </div>
        </div>
      </div>

      {Object.keys(TOLL_SYSTEM).map((key) => {
        const expressway = TOLL_SYSTEM[key];
        const exits = expressway.exits;

        return (
          <div key={key} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3">
              <h3 className="text-white font-bold text-sm">{expressway.name}</h3>
              <p className="text-slate-400 text-xs">{expressway.fullName}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-800 px-3 py-2.5 text-left text-xs font-bold text-cyan-400 border-b border-r border-slate-700 min-w-[130px] whitespace-nowrap">
                      EXIT/ENTRY
                    </th>
                    {exits.map((exit, idx) => (
                      <th
                        key={idx}
                        className="bg-slate-800 border-b border-r border-slate-700 last:border-r-0 min-w-[70px]"
                      >
                        <div className="px-2 py-1 h-24 flex items-end justify-center pb-2">
                          <span
                            className="text-slate-300 font-semibold whitespace-nowrap text-[11px] leading-tight"
                            style={{
                              writingMode: 'vertical-rl',
                              transform: 'rotate(180deg)',
                            }}
                          >
                            {exit}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-slate-900">
                  {exits.map((rowExit, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40 transition-colors">
                      <td className="sticky left-0 z-10 bg-slate-800 hover:bg-slate-700 px-3 py-2 font-semibold text-white border-r border-slate-700 whitespace-nowrap text-[11px] transition-colors">
                        {rowExit}
                      </td>
                      {exits.map((colExit, colIdx) => {
                        if (rowIdx === colIdx) {
                          return (
                            <td
                              key={colIdx}
                              className="px-2 py-2 text-center text-slate-700 border-r border-slate-800 last:border-r-0 bg-slate-800/50"
                            >
                              —
                            </td>
                          );
                        }
                        const rate = getRateForPair(key, rowExit, colExit, vehicleClass);
                        return (
                          <td
                            key={colIdx}
                            className="px-2 py-2 text-center border-r border-slate-800 last:border-r-0"
                          >
                            {rate !== null && rate > 0 ? (
                              <span className="text-cyan-400 font-semibold">{rate}</span>
                            ) : rate === 0 ? (
                              <span className="text-emerald-400 font-semibold text-[10px]">FREE</span>
                            ) : (
                              <span className="text-slate-700">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
