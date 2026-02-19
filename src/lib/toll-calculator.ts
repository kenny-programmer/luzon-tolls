import { TOLL_SYSTEM } from './toll-data';

export interface TollLeg {
  expressway: string;
  expresswayFullName: string;
  entry: string;
  exit: string;
  cost: number;
  rfid: 'Autosweep' | 'Easytrip';
}

export interface TripSummary {
  legs: TollLeg[];
  totalCost: number;
  autosweepTotal: number;
  easytripTotal: number;
}

function getDirectRate(expresswayKey: string, from: string, to: string, vehicleClass: 1 | 2 | 3): number | null {
  const expressway = TOLL_SYSTEM[expresswayKey];
  if (!expressway) return null;

  const rate = expressway.rates.find(
    r => (r.from === from && r.to === to) || (r.from === to && r.to === from)
  );

  if (!rate) return null;
  return vehicleClass === 1 ? rate.class1 : vehicleClass === 2 ? rate.class2 : rate.class3;
}

function findExpresswayForExit(exit: string): string | null {
  for (const [key, data] of Object.entries(TOLL_SYSTEM)) {
    if (data.exits.includes(exit)) return key;
  }
  return null;
}

function findAllExpresswaysForExit(exit: string): string[] {
  const result: string[] = [];
  for (const [key, data] of Object.entries(TOLL_SYSTEM)) {
    if (data.exits.includes(exit)) result.push(key);
  }
  return result;
}

interface Junction {
  exitOnA: string;
  exitOnB: string;
}

const EXPRESSWAY_JUNCTIONS: Record<string, Record<string, Junction>> = {
  NLEX: {
    SKYWAY3: { exitOnA: 'Balintawak', exitOnB: 'Balintawak' },
    TPLEX: { exitOnA: 'SCTEX Tarlac', exitOnB: 'La Paz' },
    NLEX_CONNECTOR: { exitOnA: 'Balintawak', exitOnB: 'Magsaysay' },
    HARBOR_LINK: { exitOnA: 'Karuhatan', exitOnB: 'Karuhatan/Valenzuela' },
  },
  SKYWAY3: {
    NLEX: { exitOnA: 'Balintawak', exitOnB: 'Balintawak' },
    SLEX: { exitOnA: 'Buendia', exitOnB: 'Magallanes (Skyway)' },
    NLEX_CONNECTOR: { exitOnA: 'Balintawak', exitOnB: 'Magsaysay' },
  },
  SLEX: {
    SKYWAY3: { exitOnA: 'Magallanes (Skyway)', exitOnB: 'Buendia' },
    STAR: { exitOnA: 'Sto. Tomas', exitOnB: 'Sto. Tomas' },
    CALAX: { exitOnA: 'ABI/Greenfield', exitOnB: 'Greenfield' },
    NAIAX: { exitOnA: 'Magallanes (Skyway)', exitOnB: 'Skyway' },
  },
  STAR: {
    SLEX: { exitOnA: 'Sto. Tomas', exitOnB: 'Sto. Tomas' },
  },
  CALAX: {
    SLEX: { exitOnA: 'Greenfield', exitOnB: 'ABI/Greenfield' },
    CAVITEX: { exitOnA: 'Silang Interchange', exitOnB: 'Bacoor/Zapote' },
  },
  CAVITEX: {
    CALAX: { exitOnA: 'Bacoor/Zapote', exitOnB: 'Silang Interchange' },
    NAIAX: { exitOnA: 'Parañaque', exitOnB: 'CAVITEX' },
  },
  NAIAX: {
    SLEX: { exitOnA: 'Skyway', exitOnB: 'Magallanes (Skyway)' },
    CAVITEX: { exitOnA: 'CAVITEX', exitOnB: 'Parañaque' },
  },
  NLEX_CONNECTOR: {
    NLEX: { exitOnA: 'Magsaysay', exitOnB: 'Balintawak' },
    SKYWAY3: { exitOnA: 'Magsaysay', exitOnB: 'Balintawak' },
  },
  HARBOR_LINK: {
    NLEX: { exitOnA: 'Karuhatan/Valenzuela', exitOnB: 'Karuhatan' },
  },
  TPLEX: {
    NLEX: { exitOnA: 'La Paz', exitOnB: 'SCTEX Tarlac' },
  },
};

function getJunction(fromExpressway: string, toExpressway: string): Junction | null {
  return EXPRESSWAY_JUNCTIONS[fromExpressway]?.[toExpressway] ?? null;
}

function bfsRoute(startExpressway: string, endExpressway: string): string[] | null {
  if (startExpressway === endExpressway) return [startExpressway];

  const queue: string[][] = [[startExpressway]];
  const visited = new Set<string>([startExpressway]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];

    const neighbors = Object.keys(EXPRESSWAY_JUNCTIONS[current] || {});
    for (const neighbor of neighbors) {
      if (neighbor === endExpressway) {
        return [...path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return null;
}

export const calculateTrip = (
  origin: string,
  destination: string,
  vehicleClass: 1 | 2 | 3
): TripSummary | null => {
  const originExpressways = findAllExpresswaysForExit(origin);
  const destinationExpressways = findAllExpresswaysForExit(destination);

  if (originExpressways.length === 0 || destinationExpressways.length === 0) return null;

  let bestRoute: string[] | null = null;
  let bestOriginEW = '';
  let bestDestEW = '';

  for (const originEW of originExpressways) {
    for (const destEW of destinationExpressways) {
      const route = bfsRoute(originEW, destEW);
      if (route && (!bestRoute || route.length < bestRoute.length)) {
        bestRoute = route;
        bestOriginEW = originEW;
        bestDestEW = destEW;
      }
    }
  }

  if (!bestRoute) return null;

  const legs: TollLeg[] = [];
  let currentEntry = origin;
  let currentExpressway = bestOriginEW;

  for (let i = 0; i < bestRoute.length; i++) {
    const ew = bestRoute[i];
    const ewData = TOLL_SYSTEM[ew];
    if (!ewData) continue;

    let exitPoint: string;

    if (i === bestRoute.length - 1) {
      exitPoint = destination;
    } else {
      const nextEW = bestRoute[i + 1];
      const junction = getJunction(ew, nextEW);
      if (!junction) continue;
      exitPoint = junction.exitOnA;
    }

    if (currentEntry === exitPoint) {
      if (i < bestRoute.length - 1) {
        const nextEW = bestRoute[i + 1];
        const junction = getJunction(ew, nextEW);
        if (junction) currentEntry = junction.exitOnB;
      }
      continue;
    }

    const cost = getDirectRate(ew, currentEntry, exitPoint, vehicleClass);

    if (cost !== null && cost > 0) {
      legs.push({
        expressway: ewData.name,
        expresswayFullName: ewData.fullName,
        entry: currentEntry,
        exit: exitPoint,
        cost,
        rfid: ewData.rfid,
      });
    }

    if (i < bestRoute.length - 1) {
      const nextEW = bestRoute[i + 1];
      const junction = getJunction(ew, nextEW);
      if (junction) {
        currentEntry = junction.exitOnB;
      }
    }
  }

  if (legs.length === 0) return null;

  const autosweepTotal = legs
    .filter(leg => leg.rfid === 'Autosweep')
    .reduce((sum, leg) => sum + leg.cost, 0);

  const easytripTotal = legs
    .filter(leg => leg.rfid === 'Easytrip')
    .reduce((sum, leg) => sum + leg.cost, 0);

  return {
    legs,
    totalCost: legs.reduce((sum, leg) => sum + leg.cost, 0),
    autosweepTotal,
    easytripTotal,
  };
};

export const calculateTollLeg = (
  expressway: string,
  entry: string,
  exit: string,
  vehicleClass: 1 | 2 | 3
): TollLeg | null => {
  const expresswayData = TOLL_SYSTEM[expressway];
  if (!expresswayData) return null;

  const cost = getDirectRate(expressway, entry, exit, vehicleClass);
  if (cost === null) return null;

  return {
    expressway: expresswayData.name,
    expresswayFullName: expresswayData.fullName,
    entry,
    exit,
    cost,
    rfid: expresswayData.rfid,
  };
};
