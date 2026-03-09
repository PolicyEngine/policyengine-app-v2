import { useCallback, useEffect, useMemo, useRef } from 'react';
import { colors } from '@/designTokens';

const NODE_COUNT = 10000;
const NODE_SIZE = 1.5;
const HOVER_RADIUS = 110;

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

interface Node {
  id: number;
  x: number;
  y: number;
  baseOpacity: number;
  baseSize: number;
  driftDuration: number;
  driftDelay: number;
  driftVariant: number;
}

export interface NodeImpact {
  polarity: 'positive' | 'negative' | 'neutral';
  magnitude: number;
}

export type ImpactState = Map<number, NodeImpact>;

/**
 * Assign winner/loser/neutral impact with mostly-uniform distribution
 * plus a soft spatial bias so each prompt has a distinct visual pattern.
 * Cluster centres are random (not geographic) to avoid implying location.
 */
export function generateImpactForPrompt(
  promptIndex: number,
  nodes: { id: number; x: number; y: number }[],
  winnerPct: number,
  loserPct: number
): ImpactState {
  const impact: ImpactState = new Map();
  const totalAffected = winnerPct + loserPct;

  if (totalAffected === 0) {
    for (const node of nodes) {
      impact.set(node.id, { polarity: 'neutral', magnitude: 0 });
    }
    return impact;
  }

  // 2-3 random cluster centres per prompt for soft spatial bias
  const numClusters = 2 + Math.floor(seededRandom(promptIndex * 13) * 2);
  const winnerShare = winnerPct / totalAffected;
  const numWinnerClusters = Math.max(winnerPct > 0 ? 1 : 0, Math.round(numClusters * winnerShare));

  const clusters: { cx: number; cy: number; polarity: 'positive' | 'negative' }[] = [];
  for (let c = 0; c < numClusters; c++) {
    const seed = promptIndex * 100 + c;
    clusters.push({
      cx: 0.1 + seededRandom(seed) * 0.8,
      cy: 0.1 + seededRandom(seed + 1) * 0.8,
      polarity: c < numWinnerClusters ? 'positive' : 'negative',
    });
  }

  // Score: 70% random + 30% spatial proximity to nearest cluster
  const scored = nodes.map((node) => {
    let minPosDist = Infinity;
    let minNegDist = Infinity;
    for (const cl of clusters) {
      const dx = node.x - cl.cx;
      const dy = node.y - cl.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (cl.polarity === 'positive') {
        minPosDist = Math.min(minPosDist, dist);
      } else {
        minNegDist = Math.min(minNegDist, dist);
      }
    }
    const noise = seededRandom(promptIndex * 1000 + node.id) * 0.7;
    return { id: node.id, posScore: minPosDist * 0.3 + noise, negScore: minNegDist * 0.3 + noise };
  });

  const targetWinners = Math.round(nodes.length * winnerPct);
  const targetLosers = Math.round(nodes.length * loserPct);

  if (targetWinners > 0) {
    const byPos = [...scored].sort((a, b) => a.posScore - b.posScore);
    for (let i = 0; i < targetWinners && i < byPos.length; i++) {
      impact.set(byPos[i].id, {
        polarity: 'positive',
        magnitude: 0.7 + seededRandom(byPos[i].id * 3 + promptIndex) * 0.3,
      });
    }
  }

  if (targetLosers > 0) {
    const byNeg = [...scored]
      .filter((s) => !impact.has(s.id))
      .sort((a, b) => a.negScore - b.negScore);
    for (let i = 0; i < targetLosers && i < byNeg.length; i++) {
      impact.set(byNeg[i].id, {
        polarity: 'negative',
        magnitude: 0.7 + seededRandom(byNeg[i].id * 3 + promptIndex + 1) * 0.3,
      });
    }
  }

  for (const node of nodes) {
    if (!impact.has(node.id)) {
      impact.set(node.id, { polarity: 'neutral', magnitude: 0 });
    }
  }

  return impact;
}

// Population centers from WorldPop 2020 1km gridded data
// [x, y, weight] in normalized 0-1 canvas space; weight = population in thousands
const US_CENTERS: [number, number, number][] = [
  [0.8479, 0.3632, 18707.4],
  [0.1372, 0.6109, 12314.5],
  [0.6263, 0.3249, 7677.9],
  [0.801, 0.4296, 7271.4],
  [0.0695, 0.4703, 6658.5],
  [0.5009, 0.7684, 6478.9],
  [0.834, 0.3921, 5462.0],
  [0.7459, 0.9078, 5201.6],
  [0.124, 0.6051, 4890.8],
  [0.8098, 0.4021, 4681.5],
  [0.6991, 0.2979, 4471.5],
  [0.8758, 0.33, 4328.8],
  [0.6779, 0.6107, 4261.6],
  [0.1447, 0.6335, 4162.5],
  [0.5349, 0.2021, 3405.6],
  [0.7118, 0.8367, 3400.8],
  [0.7304, 0.8105, 3387.0],
  [0.2292, 0.6291, 3352.7],
  [0.346, 0.3989, 3345.9],
  [0.6679, 0.3999, 3286.0],
  [0.8978, 0.3007, 3223.7],
  [0.4821, 0.646, 3202.7],
  [0.7377, 0.5671, 3095.4],
  [0.884, 0.301, 3088.4],
  [0.7425, 0.3652, 3006.2],
  [0.0786, 0.4385, 2964.3],
  [0.4527, 0.7754, 2920.3],
  [0.7721, 0.5401, 2886.0],
  [0.1798, 0.5318, 2768.1],
  [0.073, 0.4935, 2722.2],
  [0.623, 0.3046, 2683.4],
  [0.7308, 0.337, 2644.9],
  [0.7032, 0.3928, 2532.8],
  [0.7423, 0.8794, 2438.3],
  [0.4633, 0.7439, 2319.1],
  [0.8488, 0.3375, 2290.7],
  [0.4705, 0.6613, 2253.4],
  [0.0651, 0.1017, 2214.7],
  [0.6666, 0.4611, 2186.0],
  [0.7432, 0.5378, 2154.6],
  [0.6769, 0.6299, 2147.2],
  [0.8118, 0.3711, 2135.9],
  [0.8091, 0.5014, 2102.4],
  [0.5879, 0.4383, 2041.9],
  [0.4723, 0.6475, 2027.3],
  [0.6418, 0.5343, 2026.3],
  [0.0549, 0.1914, 2014.5],
  [0.6949, 0.6056, 2011.0],
  [0.2367, 0.6365, 1943.3],
  [0.6742, 0.4267, 1904.4],
  [0.0652, 0.1205, 1885.8],
  [0.5178, 0.427, 1882.3],
  [0.4878, 0.6641, 1872.6],
  [0.6674, 0.2943, 1807.4],
  [0.6243, 0.2724, 1642.5],
  [0.149, 0.6585, 1638.2],
  [0.5933, 0.57, 1615.5],
  [0.7105, 0.5729, 1598.9],
  [0.4595, 0.8998, 1540.0],
  [0.4977, 0.7461, 1536.4],
  [0.5672, 0.7438, 1533.8],
  [0.7, 0.5363, 1496.8],
  [0.797, 0.4715, 1439.9],
  [0.7018, 0.3327, 1434.1],
  [0.7354, 0.8385, 1398.5],
  [0.7257, 0.7473, 1391.9],
  [0.6393, 0.6335, 1379.4],
  [0.7718, 0.5679, 1363.8],
  [0.8045, 0.2732, 1362.0],
  [0.6307, 0.7375, 1348.9],
  [0.865, 0.3586, 1342.2],
  [0.1051, 0.5071, 1316.2],
  [0.5706, 0.4357, 1307.3],
  [0.4661, 0.561, 1275.6],
  [0.7378, 0.6078, 1273.5],
  [0.7136, 0.81, 1244.9],
  [0.6385, 0.397, 1222.7],
  [0.2486, 0.6751, 1221.6],
  [0.2359, 0.3698, 1204.7],
  [0.4948, 0.5341, 1201.8],
  [0.6689, 0.5714, 1196.9],
  [0.7027, 0.6342, 1170.7],
  [0.7697, 0.3688, 1156.5],
  [0.6646, 0.3332, 1143.7],
  [0.6057, 0.2995, 1133.7],
  [0.3193, 0.5694, 1095.8],
  [0.6022, 0.2691, 1074.7],
  [0.8497, 0.2922, 1068.9],
  [0.6664, 0.2695, 1058.1],
  [0.4915, 0.3419, 1020.8],
  [0.2315, 0.3637, 1016.6],
  [0.775, 0.6051, 1016.5],
  [0.7441, 0.642, 1012.7],
  [0.6683, 0.3652, 981.8],
  [0.114, 0.5641, 970.6],
  [0.737, 0.6729, 957.4],
  [0.5975, 0.7409, 947.5],
  [0.7042, 0.3669, 936.5],
  [0.53, 0.4985, 935.3],
  [0.7772, 0.2753, 916.1],
  [0.6386, 0.5755, 907.0],
  [0.7733, 0.2916, 897.5],
  [0.7774, 0.4015, 880.2],
  [0.9018, 0.3248, 875.6],
  [0.0619, 0.1855, 874.4],
  [0.7436, 0.4978, 873.9],
  [0.6948, 0.2703, 866.4],
  [0.5001, 0.4279, 862.4],
  [0.6039, 0.3285, 849.9],
  [0.5307, 0.3298, 848.4],
  [0.3231, 0.6932, 847.0],
  [0.3489, 0.4316, 846.1],
  [0.1116, 0.5319, 842.0],
  [0.8093, 0.3002, 838.7],
  [0.5552, 0.5753, 831.2],
  [0.6725, 0.7412, 821.7],
  [0.7423, 0.3992, 814.6],
  [0.4664, 0.7107, 813.8],
  [0.5335, 0.2234, 813.2],
  [0.8141, 0.3368, 812.1],
  [0.6731, 0.5374, 801.7],
  [0.5924, 0.6715, 784.0],
  [0.6358, 0.5063, 775.0],
  [0.1594, 0.2558, 771.2],
  [0.1466, 0.1029, 770.9],
  [0.5873, 0.7611, 770.3],
  [0.8832, 0.2676, 741.0],
  [0.4687, 0.4726, 740.5],
  [0.9042, 0.2629, 738.9],
  [0.5992, 0.3657, 738.8],
  [0.717, 0.8734, 737.4],
  [0.523, 0.5294, 732.1],
  [0.7764, 0.4665, 728.1],
  [0.5273, 0.668, 721.3],
  [0.706, 0.4366, 718.2],
  [0.6674, 0.6672, 713.9],
  [0.5695, 0.3285, 712.1],
  [0.3469, 0.373, 701.0],
  [0.7309, 0.7747, 697.9],
  [0.7798, 0.4336, 690.0],
  [0.7136, 0.7752, 673.8],
  [0.6389, 0.6017, 662.1],
  [0.6332, 0.4666, 644.1],
  [0.8425, 0.2722, 643.4],
  [0.6058, 0.2309, 635.0],
  [0.1058, 0.4067, 627.2],
  [0.5301, 0.7468, 625.4],
  [0.0529, 0.1278, 617.4],
  [0.7062, 0.5055, 616.5],
  [0.0498, 0.2315, 614.8],
  [0.6993, 0.6687, 603.0],
  [0.7979, 0.572, 591.2],
  [0.7694, 0.4987, 577.8],
  [0.5995, 0.3983, 566.2],
  [0.9144, 0.233, 557.3],
  [0.4671, 0.8413, 550.9],
  [0.1126, 0.16, 545.4],
  [0.6239, 0.2281, 540.1],
  [0.6688, 0.7062, 528.8],
  [0.6383, 0.4311, 521.1],
  [0.563, 0.3002, 511.6],
  [0.4666, 0.542, 492.7],
  [0.5978, 0.4668, 487.7],
  [0.4858, 0.3611, 486.2],
  [0.5258, 0.5636, 483.3],
  [0.602, 0.5386, 481.1],
  [0.6379, 0.3694, 480.8],
  [0.0556, 0.4411, 478.7],
  [0.6704, 0.5005, 474.9],
  [0.597, 0.7057, 470.8],
  [0.5601, 0.2352, 467.6],
  [0.7026, 0.7393, 453.9],
  [0.2313, 0.3427, 449.5],
  [0.8032, 0.5372, 437.3],
  [0.733, 0.4359, 435.7],
  [0.6438, 0.6695, 426.4],
  [0.6024, 0.6016, 423.8],
  [0.4861, 0.2619, 423.4],
  [0.8707, 0.228, 423.0],
  [0.7024, 0.707, 422.9],
  [0.6007, 0.5002, 422.3],
  [0.704, 0.4672, 421.3],
  [0.5703, 0.7661, 415.6],
  [0.4569, 0.6017, 402.8],
  [0.3949, 0.629, 391.2],
  [0.5608, 0.2023, 386.9],
  [0.7351, 0.4674, 377.0],
  [0.5681, 0.5374, 370.2],
  [0.0732, 0.4009, 366.6],
  [0.5663, 0.4651, 361.6],
  [0.5602, 0.6681, 357.7],
  [0.8307, 0.434, 352.9],
  [0.0508, 0.3019, 345.5],
  [0.1842, 0.6594, 344.5],
  [0.5586, 0.5986, 340.1],
  [0.528, 0.636, 339.0],
  [0.3187, 0.678, 338.6],
  [0.4863, 0.133, 335.0],
  [0.3898, 0.6767, 334.8],
  [0.0522, 0.1659, 329.7],
  [0.2268, 0.6053, 316.1],
  [0.0545, 0.0977, 316.0],
  [0.4353, 0.8499, 314.4],
  [0.6668, 0.2271, 313.5],
  [0.5588, 0.7076, 312.3],
  [0.5251, 0.7045, 304.3],
  [0.3958, 0.5685, 298.0],
  [0.1359, 0.5812, 291.3],
  [0.091, 0.5666, 288.0],
  [0.6015, 0.6357, 286.6],
  [0.5328, 0.4687, 275.3],
  [0.7683, 0.3321, 274.6],
  [0.5344, 0.5989, 273.2],
  [0.29, 0.4287, 271.2],
  [0.5969, 0.2016, 269.4],
  [0.5306, 0.3041, 266.6],
  [0.5643, 0.3638, 266.4],
  [0.5048, 0.4025, 260.2],
  [0.5221, 0.4067, 260.0],
  [0.4921, 0.5683, 257.9],
  [0.4913, 0.2977, 255.2],
  [0.0624, 0.0664, 253.7],
  [0.566, 0.2595, 252.1],
  [0.0675, 0.3701, 251.4],
  [0.0807, 0.2343, 250.9],
  [0.08, 0.1588, 239.7],
  [0.7266, 0.7033, 239.6],
  [0.7662, 0.6274, 238.5],
  [0.4961, 0.7025, 232.8],
  [0.5645, 0.3989, 231.5],
  [0.2076, 0.4959, 227.6],
  [0.5547, 0.1351, 226.4],
  [0.239, 0.3916, 226.0],
  [0.3284, 0.5425, 225.8],
  [0.1056, 0.124, 223.2],
  [0.5277, 0.1628, 221.8],
  [0.2932, 0.5024, 220.2],
  [0.428, 0.6681, 217.6],
  [0.7511, 0.3114, 217.1],
  [0.4994, 0.5044, 216.3],
  [0.5328, 0.2636, 214.7],
  [0.4656, 0.8032, 214.2],
  [0.2295, 0.2622, 212.8],
  [0.1052, 0.4246, 204.0],
  [0.3526, 0.4552, 203.3],
  [0.8443, 0.2228, 199.2],
  [0.6353, 0.7077, 199.0],
  [0.4944, 0.7976, 196.9],
  [0.4895, 0.6099, 193.1],
  [0.0423, 0.2662, 192.5],
];

const UK_CENTERS: [number, number, number][] = [
  [0.6521, 0.8159, 7850.0],
  [0.5698, 0.7363, 2542.8],
  [0.6676, 0.8158, 2479.5],
  [0.5526, 0.6616, 1955.3],
  [0.6317, 0.8197, 1801.3],
  [0.528, 0.662, 1535.8],
  [0.5889, 0.6332, 1527.4],
  [0.6068, 0.7074, 1324.9],
  [0.5729, 0.6337, 1305.6],
  [0.5509, 0.6396, 1265.7],
  [0.5934, 0.665, 1205.8],
  [0.588, 0.5293, 1090.8],
  [0.632, 0.7812, 1086.9],
  [0.6881, 0.8197, 1080.7],
  [0.651, 0.8604, 981.7],
  [0.5914, 0.7049, 922.7],
  [0.5106, 0.8124, 914.1],
  [0.5913, 0.554, 886.9],
  [0.5105, 0.4487, 883.2],
  [0.6501, 0.7868, 870.8],
  [0.5903, 0.741, 862.9],
  [0.4679, 0.4561, 837.1],
  [0.5317, 0.6372, 818.9],
  [0.5469, 0.8211, 797.4],
  [0.5317, 0.8189, 732.1],
  [0.6119, 0.8221, 729.9],
  [0.6099, 0.8667, 727.5],
  [0.3866, 0.5608, 709.4],
  [0.5945, 0.8595, 707.1],
  [0.567, 0.7121, 679.2],
  [0.6066, 0.6692, 591.9],
  [0.6112, 0.7437, 585.8],
  [0.5524, 0.704, 572.9],
  [0.5154, 0.667, 538.7],
  [0.5642, 0.6616, 528.4],
  [0.7111, 0.7783, 519.7],
  [0.4537, 0.4569, 503.7],
  [0.6483, 0.6358, 494.6],
  [0.6094, 0.631, 491.5],
  [0.556, 0.7434, 491.2],
  [0.6713, 0.8574, 474.1],
  [0.6286, 0.7465, 467.4],
  [0.6307, 0.8597, 451.8],
  [0.6893, 0.7871, 449.3],
  [0.4692, 0.4683, 445.9],
  [0.4896, 0.4497, 443.6],
  [0.5714, 0.8786, 440.4],
  [0.5723, 0.8148, 438.3],
  [0.4942, 0.8924, 427.9],
  [0.6503, 0.7397, 415.1],
  [0.5534, 0.7855, 411.5],
  [0.4682, 0.9042, 395.5],
  [0.6075, 0.7876, 391.2],
  [0.6056, 0.5636, 389.3],
  [0.6685, 0.7501, 388.0],
  [0.67, 0.7849, 377.2],
  [0.4492, 0.4789, 348.7],
  [0.4907, 0.8094, 341.8],
  [0.6332, 0.6362, 323.0],
  [0.6898, 0.8566, 322.3],
  [0.7158, 0.7183, 309.9],
  [0.6314, 0.6731, 296.5],
  [0.5663, 0.7804, 294.4],
  [0.4734, 0.8042, 281.9],
  [0.5296, 0.8549, 281.0],
  [0.593, 0.7833, 263.0],
  [0.5188, 0.6293, 259.6],
  [0.3701, 0.5597, 252.3],
  [0.6513, 0.7078, 250.8],
  [0.7352, 0.7373, 249.5],
  [0.5264, 0.4078, 246.1],
  [0.5734, 0.8598, 242.2],
  [0.5097, 0.7927, 240.8],
  [0.5291, 0.7067, 225.2],
  [0.5293, 0.5996, 218.0],
  [0.5122, 0.8573, 210.9],
  [0.7107, 0.8306, 209.5],
  [0.5899, 0.6002, 207.6],
  [0.7124, 0.8482, 207.4],
  [0.5932, 0.8167, 206.9],
  [0.711, 0.7429, 200.8],
  [0.6917, 0.7467, 195.3],
  [0.3668, 0.5881, 192.1],
  [0.6309, 0.7046, 189.4],
  [0.5512, 0.8532, 184.0],
  [0.5328, 0.7792, 176.5],
  [0.4115, 0.9242, 160.4],
  [0.672, 0.7148, 160.2],
  [0.5617, 0.3546, 153.4],
  [0.7291, 0.718, 148.2],
  [0.4687, 0.853, 145.2],
  [0.575, 0.5302, 145.1],
  [0.4896, 0.6699, 144.8],
  [0.3492, 0.5591, 144.3],
  [0.5551, 0.36, 139.2],
  [0.7247, 0.8277, 134.4],
  [0.4699, 0.79, 130.4],
  [0.5157, 0.7016, 127.2],
  [0.5912, 0.8789, 126.1],
  [0.3247, 0.5291, 124.9],
  [0.5756, 0.5499, 121.7],
  [0.4318, 0.9053, 121.4],
  [0.5468, 0.8857, 120.7],
  [0.5108, 0.4114, 118.2],
  [0.5265, 0.5454, 117.0],
  [0.4489, 0.8981, 116.5],
  [0.4952, 0.563, 105.5],
  [0.6522, 0.6681, 102.0],
  [0.5111, 0.5985, 101.6],
  [0.6343, 0.5953, 101.0],
  [0.4246, 0.9216, 99.4],
  [0.5062, 0.8833, 97.1],
  [0.5267, 0.4462, 95.2],
  [0.4666, 0.6765, 93.6],
  [0.3515, 0.522, 93.5],
  [0.3878, 0.5883, 89.0],
  [0.4926, 0.8602, 88.6],
  [0.4658, 0.3266, 87.9],
  [0.6466, 0.5987, 87.2],
  [0.6102, 0.6053, 86.7],
  [0.6063, 0.8825, 84.6],
  [0.4346, 0.452, 84.4],
  [0.6903, 0.7103, 82.4],
  [0.4891, 0.7934, 80.1],
  [0.4289, 0.7912, 79.8],
  [0.5312, 0.7466, 78.6],
  [0.6708, 0.6744, 77.0],
  [0.5511, 0.3387, 76.6],
  [0.4495, 0.782, 74.6],
  [0.4935, 0.4132, 74.5],
  [0.3519, 0.5873, 71.6],
  [0.5685, 0.3321, 71.2],
  [0.4909, 0.5233, 63.6],
  [0.3258, 0.5608, 61.4],
  [0.5309, 0.4846, 59.6],
  [0.3111, 0.5553, 57.0],
  [0.4852, 0.473, 56.7],
  [0.4352, 0.4744, 56.5],
  [0.5081, 0.5527, 52.3],
  [0.5091, 0.7426, 52.1],
  [0.4706, 0.7439, 51.4],
  [0.3084, 0.5858, 46.5],
  [0.4514, 0.6688, 45.8],
  [0.5752, 0.588, 42.7],
  [0.7233, 0.7739, 40.8],
  [0.671, 0.8758, 39.9],
  [0.3673, 0.5246, 39.6],
  [0.7242, 0.8399, 38.5],
  [0.526, 0.5326, 38.4],
  [0.5087, 0.5257, 37.1],
  [0.4702, 0.702, 37.1],
  [0.4881, 0.3255, 34.2],
  [0.5089, 0.3191, 33.8],
  [0.5488, 0.4782, 31.8],
  [0.5309, 0.3313, 31.1],
  [0.5297, 0.8786, 31.1],
  [0.569, 0.4765, 29.3],
  [0.4528, 0.3241, 29.2],
  [0.4033, 0.5655, 29.1],
  [0.4686, 0.3034, 28.4],
  [0.4522, 0.8685, 27.1],
  [0.5068, 0.3104, 24.2],
  [0.5492, 0.5992, 24.0],
  [0.6294, 0.5719, 21.2],
  [0.5114, 0.4759, 21.1],
  [0.5438, 0.3929, 21.0],
  [0.5661, 0.3104, 20.2],
  [0.4519, 0.7015, 19.5],
  [0.4303, 0.5236, 19.3],
  [0.4316, 0.8017, 19.3],
  [0.318, 0.5305, 18.9],
  [0.4484, 0.5135, 18.4],
  [0.5483, 0.56, 18.3],
  [0.5338, 0.3694, 18.0],
  [0.5263, 0.3107, 18.0],
  [0.4913, 0.7393, 17.5],
  [0.4848, 0.9163, 16.8],
  [0.5514, 0.5277, 16.6],
  [0.3655, 0.2639, 16.1],
  [0.4077, 0.4113, 15.2],
  [0.5824, 0.4936, 15.1],
  [0.6237, 0.8779, 15.0],
  [0.5453, 0.4505, 14.4],
  [0.4241, 0.3791, 14.2],
  [0.6054, 0.1079, 14.1],
  [0.5133, 0.2492, 13.5],
  [0.4904, 0.7062, 12.8],
  [0.5233, 0.2068, 12.3],
  [0.5446, 0.3119, 11.4],
  [0.3264, 0.5825, 10.9],
  [0.4748, 0.5295, 10.0],
  [0.4957, 0.2362, 9.9],
  [0.4025, 0.5815, 9.1],
  [0.4083, 0.4459, 9.1],
  [0.5089, 0.2163, 8.5],
  [0.4283, 0.5415, 8.5],
  [0.3965, 0.9294, 8.1],
  [0.6618, 0.6349, 7.8],
  [0.4704, 0.5423, 7.1],
  [0.369, 0.3302, 6.5],
];

// Box-Muller transform for gaussian jitter (seeded)
function gaussianJitter(seed: number, sigma: number): number {
  const u1 = Math.max(1e-10, seededRandom(seed));
  const u2 = seededRandom(seed + 1);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma;
}

function createNode(nodeId: number, cx: number, cy: number, sigma: number): Node {
  const seed = nodeId * 7 + 42;
  return {
    id: nodeId,
    x: Math.max(0.01, Math.min(0.99, cx + gaussianJitter(seed, sigma))),
    y: Math.max(0.01, Math.min(0.99, cy + gaussianJitter(seed + 2, sigma))),
    baseOpacity: 0.08,
    baseSize: NODE_SIZE * (0.2 + seededRandom(seed + 9) * 1.8),
    driftDuration: 10 + seededRandom(seed + 6) * 14,
    driftDelay: seededRandom(seed + 7) * -20,
    driftVariant: Math.floor(seededRandom(seed + 8) * 4),
  };
}

export function generateGraph(countryId: string = 'us'): Node[] {
  const centers = countryId === 'uk' ? UK_CENTERS : US_CENTERS;
  const totalWeight = centers.reduce((sum, c) => sum + c[2], 0);
  const nodes: Node[] = [];

  // Distribute NODE_COUNT dots proportionally across population centers
  let nodeId = 0;
  for (const [cx, cy, weight] of centers) {
    const count = Math.round((weight / totalWeight) * NODE_COUNT);
    // Jitter radius scales with weight (bigger cities spread more)
    const sigma = 0.008 + (weight / totalWeight) * 0.04;
    for (let j = 0; j < count && nodeId < NODE_COUNT; j++) {
      nodes.push(createNode(nodeId, cx, cy, sigma));
      nodeId++;
    }
  }

  // Fill remaining dots (rounding leftovers) near random centers
  while (nodeId < NODE_COUNT) {
    const ci = Math.floor(seededRandom(nodeId * 7 + 42 + 99) * centers.length);
    const [cx, cy] = centers[ci];
    nodes.push(createNode(nodeId, cx, cy, 0.03));
    nodeId++;
  }

  return nodes;
}

// --- Canvas renderer ---

// Drift keyframe waypoints matching the original CSS animations
const DRIFT_KEYFRAMES: [number, number][][] = [
  [
    [0, 0],
    [3, -2],
    [-1, 3],
    [-3, -1],
  ],
  [
    [0, 0],
    [-2, 3],
    [3, 1],
    [1, -3],
  ],
  [
    [0, 0],
    [2, 2],
    [-3, -1],
    [1, -2],
  ],
  [
    [0, 0],
    [-1, -3],
    [2, -1],
    [-2, 2],
  ],
];

function getDrift(variant: number, t: number): [number, number] {
  const kf = DRIFT_KEYFRAMES[variant];
  const n = kf.length;
  const scaled = (((t % 1) + 1) % 1) * n; // ensure positive
  const i = Math.floor(scaled) % n;
  const frac = scaled - Math.floor(scaled);
  const next = (i + 1) % n;
  // Cosine ease between waypoints
  const ease = (1 - Math.cos(frac * Math.PI)) * 0.5;
  return [kf[i][0] + (kf[next][0] - kf[i][0]) * ease, kf[i][1] + (kf[next][1] - kf[i][1]) * ease];
}

function parseHex(hex: string): [number, number, number] {
  if (hex.length === 4) {
    return [
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
      parseInt(hex[3] + hex[3], 16),
    ];
  }
  return [
    parseInt(hex.substring(1, 3), 16),
    parseInt(hex.substring(3, 5), 16),
    parseInt(hex.substring(5, 7), 16),
  ];
}

// Precomputed colour RGB tuples
const COLOR_GRAY: [number, number, number] = parseHex(colors.gray[300]);
const COLOR_PRIMARY: [number, number, number] = parseHex(colors.primary[500]);
const COLOR_PRIMARY_400: [number, number, number] = parseHex(colors.primary[400]);
const COLOR_NEGATIVE: [number, number, number] = parseHex(colors.gray[600]);

// Per-node mutable animation state (lives outside React)
interface AnimState {
  r: number;
  g: number;
  b: number;
  opacity: number;
  size: number;
  // Wave delay for impact transitions (ms from centre)
  waveDelay: number;
}

interface HouseholdGraphProps {
  nodes: Node[];
  impact: ImpactState | null;
  countryId?: string;
}

export default function HouseholdGraph({ nodes, impact, countryId = 'us' }: HouseholdGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const impactRef = useRef<ImpactState | null>(null);
  const impactChangeTimeRef = useRef(0);
  const prevImpactIdentityRef = useRef<ImpactState | null>(null);

  // Update impact ref; track when it changes for wave timing
  useEffect(() => {
    prevImpactIdentityRef.current = impact;
    impactRef.current = impact;
    impactChangeTimeRef.current = performance.now();
  }, [impact]);

  // Build per-node animation state once and precompute wave delays
  const animStates = useMemo(() => {
    return nodes.map((node): AnimState => {
      const dx = node.x - 0.5;
      const dy = node.y - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return {
        r: COLOR_GRAY[0],
        g: COLOR_GRAY[1],
        b: COLOR_GRAY[2],
        opacity: 0, // start invisible for pop-in
        size: 0,
        waveDelay: (dist / 0.7) * 600, // 0-600ms radial wave
      };
    });
  }, [nodes]);

  // Pop-in start times (radial from centre)
  const popStartTimes = useMemo(() => {
    const base = performance.now();
    return nodes.map((node) => {
      const dx = node.x - 0.5;
      const dy = node.y - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return base + (dist / 0.7) * 800;
    });
  }, [nodes]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    let raf = 0;
    let lastFrame = performance.now();
    const startTime = performance.now();
    let cachedW = 0;
    let cachedH = 0;

    // Resize handler with DPR support; caches dimensions to avoid layout reads per frame
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      cachedW = rect.width;
      cachedH = rect.height;
      canvas.width = cachedW * dpr;
      canvas.height = cachedH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const animate = (now: number) => {
      const w = cachedW;
      const h = cachedH;
      const dpr = window.devicePixelRatio || 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Frame-rate independent lerp factor
      const dt = Math.min((now - lastFrame) / 16.667, 4);
      lastFrame = now;
      const lerpFast = 1 - 0.82 ** dt; // ~0.18 per frame, mouse hover
      const lerpMedium = 1 - 0.92 ** dt; // ~0.08 per frame, impact colours

      const elapsed = (now - startTime) / 1000;
      const mouse = mouseRef.current;
      const currentImpact = impactRef.current;
      const impactAge = now - impactChangeTimeRef.current;

      const cx = w * 0.5;
      const cy = h * 0.5;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const state = animStates[i];

        // Pop-in: easeOutBack timing
        const popElapsed = now - popStartTimes[i];
        if (popElapsed <= 0) {
          continue;
        }
        const popT = Math.min(popElapsed / 500, 1);
        // easeOutBack with moderate overshoot
        const c1 = 2.2;
        const c3 = c1 + 1;
        const popScale = popT >= 1 ? 1 : 1 + c3 * (popT - 1) ** 3 + c1 * (popT - 1) ** 2;

        // Drift
        const driftT = (elapsed - node.driftDelay) / node.driftDuration;
        const [driftX, driftY] = getDrift(node.driftVariant, driftT);

        const px = node.x * w + driftX;
        const py = node.y * h + driftY;

        // Determine target colour, opacity, and size
        let tr = COLOR_GRAY[0];
        let tg = COLOR_GRAY[1];
        let tb = COLOR_GRAY[2];
        let tOpacity = node.baseOpacity;
        let tSize = node.baseSize;
        let useFastLerp = false;

        // Impact colouring (with radial wave delay)
        if (currentImpact && impactAge >= state.waveDelay) {
          const info = currentImpact.get(node.id);
          if (info && info.polarity !== 'neutral') {
            [tr, tg, tb] = info.polarity === 'positive' ? COLOR_PRIMARY : COLOR_NEGATIVE;
            tOpacity = 0.15 + info.magnitude * 0.1;
            tSize = NODE_SIZE * (1 + info.magnitude * 0.8);
          }
        }

        // Mouse proximity (overrides impact colours for nearby nodes)
        if (mouse) {
          const dx = px - mouse.x;
          const dy = py - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < HOVER_RADIUS) {
            const prox = 1 - dist / HOVER_RADIUS;
            if (prox > 0.7) {
              [tr, tg, tb] = COLOR_PRIMARY;
            } else {
              [tr, tg, tb] = COLOR_PRIMARY_400;
            }
            tOpacity = node.baseOpacity + prox * 0.5;
            tSize = NODE_SIZE * (1 + prox * 0.8);
            useFastLerp = true;
          }
        }

        // Lerp current values toward targets
        const lf = useFastLerp ? lerpFast : lerpMedium;
        state.r += (tr - state.r) * lf;
        state.g += (tg - state.g) * lf;
        state.b += (tb - state.b) * lf;
        state.opacity += (tOpacity - state.opacity) * lf;
        state.size += (tSize - state.size) * lf;

        // Draw
        const size = state.size * popScale;
        if (size < 0.5) {
          continue;
        } // skip sub-pixel nodes
        const half = size * 0.5;
        const alpha = state.opacity * Math.min(popScale, 1);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${state.r | 0},${state.g | 0},${state.b | 0})`;
        ctx.beginPath();
        ctx.arc(px, py, half, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [nodes, animStates, popStartTimes, countryId]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'all',
      }}
    />
  );
}
