// Stick-figure illustrations. Angles are degrees in screen space: 0 = right, 90 = down, -90 = up.
// t = hip→shoulder direction, arm/leg = [upper, lower] segment angles, foot = foot angle.
// "2" variants are the far-side limbs (side view) or the screen-left limbs (front view); front view mirrors them when omitted.
// Scale options (legLen, legLen2, armLen, torso) foreshorten limbs that point at the viewer.
// kind:'top' poses are drawn from above with explicit coordinates.

const TORSO = 18
const UPPER_ARM = 10
const FOREARM = 10
const THIGH = 13
const SHIN = 13
const FOOT = 5
const HEAD_R = 5

const GROUND_Y = 88
const BAR_Y = 22
const HANDS_Y = 58

const rad = (d) => (d * Math.PI) / 180
const step = ([x, y], angle, len) => [x + Math.cos(rad(angle)) * len, y + Math.sin(rad(angle)) * len]
const round = ([x, y]) => [+x.toFixed(1), +y.toFixed(1)]

function limb(origin, [a, b], [l1, l2], foot) {
  const mid = step(origin, a, l1)
  const end = step(mid, b, l2)
  return foot == null ? [origin, mid, end] : [origin, mid, end, step(end, foot, FOOT)]
}

function buildSide(pose) {
  const { view = 'side', t = -90, arm = [90, 90], leg = [90, 90], foot = 0, anchor = 'ground', lift = 0, raise = 0, torso = 1, headDx = 0 } = pose
  const legLen = pose.legLen ?? [1, 1]
  const legLen2 = pose.legLen2 ?? legLen
  const armLen = pose.armLen ?? [1, 1]
  const front = view === 'front'
  const mirror = (pair) => pair.map((a) => 180 - a)
  const arm2 = pose.arm2 ?? (front ? mirror(arm) : arm)
  const leg2 = pose.leg2 ?? (front ? mirror(leg) : leg)
  const foot2 = pose.foot2 ?? (front ? 180 - foot : foot)
  const thighs = (k) => [THIGH * k[0], SHIN * k[1]]
  const arms = [UPPER_ARM * armLen[0], FOREARM * armLen[1]]

  const hip = [0, 0]
  const shoulder = step(hip, t, TORSO * torso)
  const head = step(shoulder, t, HEAD_R + 3)
  head[0] += headDx
  const hipR = front ? [2.5, 0] : hip
  const hipL = front ? [-2.5, 0] : hip
  const shR = front ? [shoulder[0] + 3, shoulder[1]] : shoulder
  const shL = front ? [shoulder[0] - 3, shoulder[1]] : shoulder

  const lines = [
    { pts: [hip, shoulder] },
    { pts: limb(hipL, leg2, thighs(legLen2), foot2), far: !front },
    { pts: limb(shL, arm2, arms), far: !front },
    { pts: limb(hipR, leg, thighs(legLen), foot) },
    { pts: limb(shR, arm, arms) },
  ]

  const hands = [lines[2], lines[4]].map((l) => l.pts.at(-1))
  const all = [...lines.flatMap((l) => l.pts), head]
  const bodyPoints = all.filter((p) => p !== head)
  let dy
  let bar = null
  if (anchor === 'bar') {
    dy = BAR_Y - Math.min(...hands.map((p) => p[1]))
    bar = BAR_Y
  } else if (anchor === 'hands') {
    dy = HANDS_Y - (hands[0][1] + hands[1][1]) / 2
  } else {
    dy = GROUND_Y - Math.max(...bodyPoints.map((p) => p[1])) - lift - raise
  }
  const dx = 65 - (Math.min(...all.map((p) => p[0])) + Math.max(...all.map((p) => p[0]))) / 2
  const move = ([x, y]) => round([x + dx, y + dy])

  const movedHands = hands.map(move)
  const moved = lines.map((l) => ({ ...l, pts: l.pts.map(move) }))
  const shapes = []
  const handY = movedHands[0][1]
  if (pose.bar && bar == null) bar = handY
  if (pose.posts) movedHands.forEach(([x, y]) => shapes.push({ t: 'rect', x: x - 1.5, y, w: 3, h: GROUND_Y + 2 - y }))
  if (pose.bench) {
    const xs = movedHands.map((p) => p[0])
    shapes.push({ t: 'rect', x: Math.min(...xs) - 12, y: handY + 2, w: Math.abs(xs[0] - xs[1]) + 24, h: GROUND_Y + 2 - handY - 2 })
  }
  if (pose.boxUnder) {
    const [fx, fy] = moved[3].pts[2]
    shapes.push({ t: 'rect', x: fx - 12, y: fy + 1, w: 24, h: GROUND_Y + 2 - fy - 1 })
  }
  if (pose.arrows) moved.filter((_, i) => i === 1 || i === 3).forEach((l) => { const [x, y] = l.pts.at(-1); shapes.push({ t: 'chev', x, y: y - 10 }) })

  return {
    lines: moved,
    head: move(head),
    headR: HEAD_R,
    bar,
    ground: anchor === 'ground' ? GROUND_Y : null,
    wall: pose.wall ? Math.min(...all.map((p) => p[0])) + dx - 6 : null,
    shapes,
  }
}

function buildTop(pose) {
  const { sw = 20, hw = 12, sy = 24, hy = 54, shift = 0, arms = [], feet = [[59, 84], [71, 84]], knees = [], extras = [] } = pose
  const cx = 65 + shift
  const headY = pose.headY ?? sy - 12
  const shoulders = [[cx - sw / 2, sy], [cx + sw / 2, sy]]
  const hips = [[65 + shift / 2 - hw / 2, hy], [65 + shift / 2 + hw / 2, hy]]
  const lines = [
    { pts: shoulders },
    { pts: [[cx, sy], [65 + shift / 2, hy]] },
    { pts: hips },
    ...hips.map((h, i) => ({ pts: [h, ...(knees[i] ? [knees[i]] : []), feet[i]] })),
  ]
  const shapes = [...extras]
  arms.forEach((a, i) => {
    if (!a) return
    lines.push({ pts: [shoulders[i], ...(a.e ? [a.e] : []), a.h] })
    shapes.push({ t: 'hand', x: a.h[0], y: a.h[1] })
  })
  return { lines, head: [cx, headY], headR: HEAD_R, bar: null, ground: null, wall: null, shapes }
}

export const buildFigure = (pose) => (pose.kind === 'top' ? buildTop(pose) : buildSide(pose))

const top = (o) => ({ kind: 'top', ...o })
const barLine = (y) => ({ t: 'line', x1: 20, y1: y, x2: 110, y2: y })
const box = (x, y, w, h) => ({ t: 'rect', x, y, w, h })
const diamond = (x, y) => ({ t: 'diamond', x, y, s: 6 })

const POSES = {
  // ---- side views
  stand: { t: -90, arm: [90, 90], leg: [90, 90] },
  standArmsFwd: { t: -90, arm: [0, 0], leg: [90, 90] },
  squatDown: { t: -60, arm: [0, 0], leg: [0, 100] },
  wallSit: { t: -90, arm: [90, 90], leg: [0, 90], wall: true },
  splitUp: { t: -90, arm: [90, 90], leg: [90, 90], leg2: [115, 105] },
  splitDown: { t: -85, arm: [90, 90], leg: [20, 90], leg2: [110, 170] },
  kneeDrive: { t: -90, arm: [60, 120], leg: [0, 90], leg2: [90, 90] },
  calfFlat: { t: -90, arm: [90, 90], leg: [90, 90] },
  calfUp: { t: -90, arm: [90, 90], leg: [90, 90], foot: 50 },
  tibFlat: { t: -80, arm: [90, 90], leg: [90, 90], wall: true },
  tibUp: { t: -80, arm: [90, 90], leg: [90, 90], foot: -40, wall: true },
  cossackSideDown: { t: -60, arm: [0, 0], leg: [0, 100], leg2: [0, 0], legLen2: [0.35, 0.35] },
  pistolUp: { t: -90, arm: [0, 0], leg: [90, 90], leg2: [0, 0] },
  pistolDown: { t: -50, arm: [0, 0], leg: [0, 100], leg2: [0, 0] },

  bridgeDown: { t: 180, arm: [0, 0], leg: [-50, 70] },
  bridgeUp: { t: 150, arm: [0, 0], leg: [-10, 80] },
  quadruped: { t: 0, arm: [90, 90], leg: [95, 175], leg2: [95, 175] },
  kickBack: { t: 0, arm: [90, 90], leg: [95, 175], leg2: [190, 190] },
  hingeUp: { t: -90, arm: [90, 90], leg: [90, 90], leg2: [90, 90] },
  hingeDown: { t: -5, arm: [90, 90], leg: [90, 90], leg2: [180, 180] },
  kneelUp: { t: -90, arm: [90, 90], leg: [90, 180] },
  kneelDown: { t: -15, arm: [30, 30], leg: [100, 180] },

  pushUp: { t: -10, arm: [90, 90], leg: [150, 155] },
  pushDown: { t: -5, arm: [120, 30], leg: [165, 168] },
  pseudoPlanche: { t: -25, arm: [90, 90], leg: [150, 155] },
  pikeUp: { t: 60, arm: [90, 90], leg: [120, 125] },
  pikeDown: { t: 70, arm: [120, 40], leg: [120, 125] },
  dipUp: { t: -85, arm: [95, 95], leg: [95, 110], anchor: 'hands', bar: true },
  dipDown: { t: -75, arm: [125, 30], leg: [95, 110], anchor: 'hands', bar: true },
  sbDipUp: { t: -70, arm: [100, 100], leg: [100, 150], anchor: 'hands', bar: true },
  sbDipDown: { t: -55, arm: [130, 40], leg: [100, 150], anchor: 'hands', bar: true },
  benchDipUp: { t: -90, arm: [100, 100], leg: [10, 20] },
  benchDipDown: { t: -90, arm: [130, 40], leg: [10, 20] },
  inclineUp: { t: -30, arm: [90, 90], leg: [150, 150] },
  inclineDown: { t: -30, arm: [130, 40], leg: [150, 150] },

  hang: { t: -100, arm: [-82, -82], leg: [90, 90], anchor: 'bar' },
  pullTop: { t: -100, arm: [115, -60], leg: [90, 100], anchor: 'bar' },
  hangL: { t: -100, arm: [-82, -82], leg: [0, 90], anchor: 'bar' },
  pullTopL: { t: -100, arm: [115, -60], leg: [0, 90], anchor: 'bar' },
  rowDown: { t: -25, arm: [-85, -85], leg: [160, 160], bar: true },
  rowUp: { t: -25, arm: [100, -60], leg: [160, 160], bar: true },

  lieFlat: { t: 180, arm: [0, 0], leg: [-50, 70] },
  crunchUp: { t: -160, arm: [-120, -170], leg: [-50, 70] },
  legsFlat: { t: 180, arm: [180, 180], leg: [0, 0] },
  legsUp: { t: 180, arm: [180, 180], leg: [-90, -90] },
  bikeA: { t: -155, arm: [-120, -170], leg: [-80, 10], leg2: [-20, -20] },
  bikeB: { t: -155, arm: [-120, -170], leg: [-20, -20], leg2: [-80, 10] },
  deadBugA: { t: 180, arm: [-90, -90], leg: [-90, 0], leg2: [-90, 0] },
  deadBugB: { t: 180, arm: [-90, -90], arm2: [180, 180], leg: [-90, 0], leg2: [-15, -15] },
  hollow: { t: -160, arm: [-165, -165], leg: [-20, -20] },
  plank: { t: -8, arm: [90, 0], leg: [165, 168] },
  sidePlankDown: { t: -12, arm: [90, 0], arm2: [-90, -90], leg: [170, 172] },
  sidePlankUp: { t: -28, arm: [90, 0], arm2: [-90, -90], leg: [152, 155] },
  birdDogA: { t: 0, arm: [90, 90], leg: [95, 175], leg2: [95, 175] },
  birdDogB: { t: 0, arm: [90, 90], arm2: [0, 0], leg: [95, 175], leg2: [180, 180] },

  jackSideDown: { t: -90, arm: [90, 90], leg: [90, 90] },
  jackSideUp: { t: -90, arm: [-90, -90], leg: [80, 90] },
  highKneeA: { t: -85, arm: [60, 140], arm2: [120, 40], leg: [0, 90], leg2: [90, 90] },
  highKneeB: { t: -85, arm: [120, 40], arm2: [60, 140], leg: [90, 90], leg2: [0, 90] },
  jumpUp: { t: -90, arm: [-90, -90], leg: [90, 90], lift: 14 },
  skaterSideA: { t: -70, arm: [30, 60], leg: [95, 80], leg2: [30, 70] },
  skaterSideB: { t: -110, arm: [150, 120], leg: [85, 100], leg2: [150, 110] },
  mountainA: { t: -10, arm: [90, 90], leg: [165, 168], leg2: [50, 140] },
  mountainB: { t: -10, arm: [90, 90], leg: [50, 140], leg2: [165, 168] },
  jumpLungeUp: { t: -90, arm: [90, 90], leg: [30, 90], leg2: [110, 150], lift: 14 },

  // ---- front views
  fSquatUp: { view: 'front', arm: [80, 80], leg: [78, 85] },
  fSquatDown: { view: 'front', arm: [60, 70], leg: [35, 95] },
  fSumoUp: { view: 'front', arm: [85, 85], leg: [45, 80], foot: 25 },
  fSumoDown: { view: 'front', arm: [60, 70], leg: [25, 85], foot: 25 },
  fWallSit: { view: 'front', arm: [90, 90], leg: [85, 90], legLen: [0.3, 1] },
  fSplitUp: { view: 'front', arm: [90, 90], leg: [80, 85], leg2: [100, 95] },
  fSplitDown: { view: 'front', arm: [90, 90], leg: [80, 88], legLen: [0.35, 1], leg2: [100, 95], legLen2: [1, 0.4] },
  fStepA: { view: 'front', arm: [90, 90], leg: [30, 105], leg2: [100, 90], boxUnder: true },
  fStepB: { view: 'front', arm: [90, 90], leg: [85, 90], leg2: [90, 90], legLen2: [0.3, 1], boxUnder: true, raise: 8 },
  fTibA: { view: 'front', arm: [90, 90], leg: [80, 88], wall: true },
  fTibB: { view: 'front', arm: [90, 90], leg: [80, 88], arrows: true },
  fCossackUp: { view: 'front', arm: [60, 60], leg: [45, 80], foot: 25 },
  fCossackDown: { view: 'front', arm: [30, 90], leg: [15, 95], leg2: [100, 100], foot: 25 },
  fPistolUp: { view: 'front', arm: [60, 70], leg: [85, 90], leg2: [90, 90], legLen2: [0.3, 0.3] },
  fPistolDown: { view: 'front', arm: [60, 70], leg: [30, 100], leg2: [90, 90], legLen2: [0.3, 0.3] },
  fCalfFlat: { view: 'front', arm: [85, 85], leg: [85, 88] },
  fCalfUp: { view: 'front', arm: [85, 85], leg: [85, 88], lift: 5, arrows: true },
  fHingeUp: { view: 'front', arm: [85, 85], leg: [85, 90], leg2: [90, 90], legLen2: [0.3, 0.3] },
  fHingeDown: { view: 'front', arm: [85, 85], leg: [85, 90], leg2: [90, 90], legLen2: [0.3, 0.3], torso: 0.45 },
  fNordicUp: { view: 'front', arm: [85, 85], leg: [88, 90], legLen: [1, 0.3] },
  fNordicDown: { view: 'front', arm: [60, 40], armLen: [0.5, 0.5], leg: [88, 90], legLen: [1, 0.3], torso: 0.45 },

  fPushHang: { view: 'front', t: -90, arm: [90, 90] },
  fDipUp: { view: 'front', arm: [65, 65], leg: [90, 100], legLen: [0.3, 1], anchor: 'hands', posts: true },
  fDipDown: { view: 'front', arm: [5, 100], leg: [90, 100], legLen: [0.3, 1], anchor: 'hands', posts: true },
  fSbDipUp: { view: 'front', arm: [70, 70], leg: [90, 100], legLen: [0.3, 1], anchor: 'hands', bar: true },
  fSbDipDown: { view: 'front', arm: [5, 100], leg: [90, 100], legLen: [0.3, 1], anchor: 'hands', bar: true },
  fBenchUp: { view: 'front', arm: [85, 85], leg: [80, 85], legLen: [0.4, 1], anchor: 'hands', bench: true },
  fBenchDown: { view: 'front', arm: [20, 95], leg: [80, 85], legLen: [0.4, 1], anchor: 'hands', bench: true },

  fHang: { view: 'front', arm: [-62, -62], leg: [90, 90], anchor: 'bar' },
  fTop: { view: 'front', arm: [50, -80], leg: [90, 90], anchor: 'bar' },
  fHangWide: { view: 'front', arm: [-45, -45], leg: [90, 90], anchor: 'bar' },
  fTopWide: { view: 'front', arm: [30, -65], leg: [90, 90], anchor: 'bar' },
  fHangClose: { view: 'front', arm: [-80, -80], leg: [90, 90], anchor: 'bar' },
  fTopClose: { view: 'front', arm: [75, -85], leg: [90, 90], anchor: 'bar' },
  fHangChin: { view: 'front', arm: [-72, -72], leg: [90, 90], anchor: 'bar' },
  fTopChin: { view: 'front', arm: [60, -80], leg: [90, 90], anchor: 'bar' },
  fHangL: { view: 'front', arm: [-62, -62], leg: [90, 95], legLen: [0.3, 1], anchor: 'bar' },
  fTopL: { view: 'front', arm: [50, -80], leg: [90, 95], legLen: [0.3, 1], anchor: 'bar' },
  fHeadL: { view: 'front', arm: [50, -80], leg: [90, 90], anchor: 'bar', headDx: -9 },
  fHeadR: { view: 'front', arm: [50, -80], leg: [90, 90], anchor: 'bar', headDx: 9 },
  fTypeL: { view: 'front', arm: [-8, -8], arm2: [130, -100], leg: [90, 90], anchor: 'bar', headDx: -6 },
  fTypeR: { view: 'front', arm: [50, -80], arm2: [188, 188], leg: [90, 90], anchor: 'bar', headDx: 6 },

  fSidePlankDown: { view: 'front', t: 160, arm: [90, 90], arm2: [-90, -90], leg: [20, 20], leg2: [20, 20], foot: 0 },
  fSidePlankUp: { view: 'front', t: 145, arm: [90, 90], arm2: [-90, -90], leg: [30, 30], leg2: [30, 30], foot: 0 },
  fCopenA: { view: 'front', t: 160, arm: [90, 90], arm2: [-90, -90], leg: [5, 5], leg2: [60, 60], boxUnder: true },
  fCopenB: { view: 'front', t: 160, arm: [90, 90], arm2: [-90, -90], leg: [5, 5], leg2: [10, 10], boxUnder: true },

  fJackDown: { view: 'front', arm: [90, 90], leg: [90, 90] },
  fJackUp: { view: 'front', arm: [-45, -45], leg: [65, 70] },
  fHighKneeA: { view: 'front', arm: [60, 120], arm2: [120, 60], leg: [90, 90], legLen: [0.3, 1], leg2: [90, 90] },
  fHighKneeB: { view: 'front', arm: [120, 60], arm2: [60, 120], leg: [90, 90], leg2: [90, 90], legLen2: [0.3, 1] },
  fJumpDown: { view: 'front', arm: [60, 70], leg: [35, 95] },
  fJumpUp: { view: 'front', arm: [-60, -60], leg: [85, 88], lift: 14 },
  fBurpeeDown: { view: 'front', t: -60, arm: [90, 90], leg: [35, 95] },
  fSkaterA: { view: 'front', t: -75, arm: [30, 60], leg: [95, 80], leg2: [30, 70], lift: 0 },
  fSkaterB: { view: 'front', t: -105, arm: [150, 120], leg: [85, 100], leg2: [150, 110], lift: 0 },
  fLungeDown: { view: 'front', arm: [90, 90], leg: [80, 88], legLen: [0.35, 1], leg2: [100, 95], legLen2: [1, 0.4] },
  fLungeUp: { view: 'front', arm: [90, 90], leg: [85, 88], legLen: [0.35, 1], leg2: [100, 95], legLen2: [1, 0.4], lift: 14 },

  // ---- top views
  tPushA: top({ arms: [{ h: [55, 22] }, { h: [75, 22] }] }),
  tPushB: top({ arms: [{ e: [43, 34], h: [56, 26] }, { e: [87, 34], h: [74, 26] }] }),
  tWideA: top({ arms: [{ h: [38, 24] }, { h: [92, 24] }] }),
  tWideB: top({ arms: [{ e: [32, 34], h: [40, 26] }, { e: [98, 34], h: [90, 26] }] }),
  tDiamondA: top({ arms: [{ h: [61, 32] }, { h: [69, 32] }], extras: [diamond(65, 33)] }),
  tDiamondB: top({ arms: [{ e: [43, 38], h: [61, 32] }, { e: [87, 38], h: [69, 32] }], extras: [diamond(65, 33)] }),
  tArcherA: top({ arms: [{ h: [34, 24] }, { h: [96, 24] }] }),
  tArcherB: top({ shift: -8, arms: [{ e: [36, 36], h: [46, 26] }, { h: [100, 26] }] }),
  tPikeA: top({ hy: 40, feet: [[59, 62], [71, 62]], arms: [{ h: [55, 22] }, { h: [75, 22] }] }),
  tPikeB: top({ hy: 40, feet: [[59, 62], [71, 62]], arms: [{ e: [45, 32], h: [56, 26] }, { e: [85, 32], h: [74, 26] }] }),
  tPikeElevA: top({ hy: 40, feet: [[59, 62], [71, 62]], arms: [{ h: [55, 22] }, { h: [75, 22] }], extras: [box(50, 60, 30, 10)] }),
  tPikeElevB: top({ hy: 40, feet: [[59, 62], [71, 62]], arms: [{ e: [45, 32], h: [56, 26] }, { e: [85, 32], h: [74, 26] }], extras: [box(50, 60, 30, 10)] }),
  tPlancheA: top({ arms: [{ h: [53, 46] }, { h: [77, 46] }] }),
  tPlancheB: top({ arms: [{ e: [42, 38], h: [53, 46] }, { e: [88, 38], h: [77, 46] }] }),
  tTriExtA: top({ arms: [{ h: [60, 30] }, { h: [70, 30] }] }),
  tTriExtB: top({ arms: [{ e: [50, 38], h: [60, 30] }, { e: [80, 38], h: [70, 30] }] }),
  tRowA: top({ sy: 38, hy: 62, headY: 28, feet: [[59, 88], [71, 88]], arms: [{ h: [55, 14] }, { h: [75, 14] }], extras: [barLine(14)] }),
  tRowB: top({ sy: 22, hy: 48, headY: 14, feet: [[59, 78], [71, 78]], arms: [{ e: [47, 30], h: [55, 14] }, { e: [83, 30], h: [75, 14] }], extras: [barLine(14)] }),
  tCommandoL: top({ shift: -14, sy: 40, hy: 66, headY: 28, feet: [[45, 90], [57, 90]], arms: [{ h: [61, 20] }, { h: [69, 20] }], extras: [barLine(20)] }),
  tCommandoR: top({ shift: 14, sy: 40, hy: 66, headY: 28, feet: [[73, 90], [85, 90]], arms: [{ h: [61, 20] }, { h: [69, 20] }], extras: [barLine(20)] }),

  tCrunchA: top({ hy: 52, arms: [{ e: [44, 18], h: [58, 14] }, { e: [86, 18], h: [72, 14] }], knees: [[59, 62], [71, 62]], feet: [[59, 72], [71, 72]] }),
  tCrunchB: top({ sy: 28, hy: 52, headY: 20, arms: [{ e: [44, 22], h: [58, 20] }, { e: [86, 22], h: [72, 20] }], knees: [[59, 62], [71, 62]], feet: [[59, 72], [71, 72]] }),
  tLegRaiseA: top({ arms: [{ h: [57, 52] }, { h: [73, 52] }], feet: [[61, 88], [69, 88]] }),
  tLegRaiseB: top({ arms: [{ h: [57, 52] }, { h: [73, 52] }], feet: [[61, 60], [69, 60]] }),
  tBikeA: top({ sy: 28, hy: 52, headY: 18, arms: [{ e: [42, 20], h: [57, 17] }, { e: [88, 20], h: [73, 17] }], knees: [[55, 44], null], feet: [[56, 56], [70, 88]] }),
  tBikeB: top({ sy: 28, hy: 52, headY: 18, arms: [{ e: [42, 20], h: [57, 17] }, { e: [88, 20], h: [73, 17] }], knees: [null, [75, 44]], feet: [[60, 88], [74, 56]] }),
  tDeadA: top({ arms: [{ h: [55, 24] }, { h: [75, 24] }], knees: [[59, 62], [71, 62]], feet: [[59, 72], [71, 72]] }),
  tDeadB: top({ arms: [{ h: [55, 24] }, { e: [78, 14], h: [82, 2] }], knees: [null, [71, 62]], feet: [[59, 90], [71, 72]] }),
  tHollowA: top({ arms: [{ h: [54, 54] }, { h: [76, 54] }], feet: [[57, 88], [73, 88]] }),
  tHollowB: top({ arms: [{ h: [61, 2] }, { h: [69, 2] }], feet: [[63, 88], [67, 88]] }),
  tPlank: top({ arms: [{ e: [55, 24], h: [57, 10] }, { e: [75, 24], h: [73, 10] }], feet: [[60, 84], [70, 84]] }),
  tBirdA: top({ arms: [{ h: [55, 26] }, { h: [75, 26] }], knees: [[59, 56], [71, 56]], feet: [[59, 68], [71, 68]] }),
  tBirdB: top({ arms: [{ h: [55, 26] }, { h: [80, 2] }], knees: [null, [71, 56]], feet: [[59, 90], [71, 68]] }),
  tBridgeA: top({ hy: 46, arms: [{ h: [53, 48] }, { h: [77, 48] }], knees: [[58, 56], [72, 56]], feet: [[57, 66], [73, 66]] }),
  tBridgeB: top({ hy: 46, arms: [{ h: [53, 48] }, { h: [77, 48] }], knees: [[57, 62], [73, 62]], feet: [[57, 66], [73, 66]] }),
  tThrustA: top({ hy: 46, arms: [{ h: [50, 38] }, { h: [80, 38] }], knees: [[58, 56], [72, 56]], feet: [[57, 66], [73, 66]], extras: [box(35, 20, 60, 8)] }),
  tThrustB: top({ hy: 46, arms: [{ h: [50, 38] }, { h: [80, 38] }], knees: [[57, 62], [73, 62]], feet: [[57, 66], [73, 66]], extras: [box(35, 20, 60, 8)] }),
  tKickA: top({ sy: 24, hy: 54, arms: [{ h: [55, 26] }, { h: [75, 26] }], knees: [[59, 56], [71, 56]], feet: [[59, 68], [71, 68]] }),
  tKickB: top({ sy: 24, hy: 54, arms: [{ h: [55, 26] }, { h: [75, 26] }], knees: [[59, 56], null], feet: [[59, 68], [71, 90]] }),
  tSideKickB: top({ sy: 24, hy: 54, arms: [{ h: [55, 26] }, { h: [75, 26] }], knees: [[59, 56], null], feet: [[59, 68], [104, 62]] }),

  tMountainA: top({ arms: [{ h: [55, 26] }, { h: [75, 26] }], knees: [null, [71, 66]], feet: [[59, 88], [71, 58]] }),
  tMountainB: top({ arms: [{ h: [55, 26] }, { h: [75, 26] }], knees: [[59, 66], null], feet: [[59, 58], [71, 88]] }),
  tJackA: top({ arms: [{ e: [55, 24], h: [57, 10] }, { e: [75, 24], h: [73, 10] }], feet: [[62, 84], [68, 84]] }),
  tJackB: top({ arms: [{ e: [55, 24], h: [57, 10] }, { e: [75, 24], h: [73, 10] }], feet: [[44, 86], [86, 86]] }),
}

const P = POSES
const view = (label, a, b) => ({ label, poses: [P[a], P[b]] })
const side = (a, b) => view('Side', a, b)
const front = (a, b) => view('Front', a, b)
const topV = (a, b) => view('Top', a, b)
const art = (v1, v2, note) => ({ views: [v1, v2], note })

const pushUps = (a, b, note) => art(side('pushUp', 'pushDown'), topV(a, b), note)

const ART = {
  'Push-ups': pushUps('tPushA', 'tPushB', 'Hands under shoulders, elbows about 45° from your body.'),
  'Wide Push-ups': pushUps('tWideA', 'tWideB', 'Hands clearly wider than your shoulders.'),
  'Diamond Push-ups': pushUps('tDiamondA', 'tDiamondB', 'Hands together under your chest, thumbs and index fingers forming a diamond.'),
  'Archer Push-ups': pushUps('tArcherA', 'tArcherB', 'Hands wide. Shift over one arm and bend it while the other arm stays straight.'),
  'Pike Push-ups': art(side('pikeUp', 'pikeDown'), topV('tPikeA', 'tPikeB'), 'Hips high, hands shoulder width, lower your head between your hands.'),
  'Elevated Pike Push-ups': art(side('pikeUp', 'pikeDown'), topV('tPikeElevA', 'tPikeElevB'), 'Feet on a box or chair, hips high, lower your head between your hands.'),
  'Pseudo Planche Push-ups': art(side('pseudoPlanche', 'pushDown'), topV('tPlancheA', 'tPlancheB'), 'Hands next to your hips, fingers turned out, shoulders far in front of your hands.'),
  'Tricep Dips (bench)': art(side('benchDipUp', 'benchDipDown'), front('fBenchUp', 'fBenchDown'), 'Hands on the bench beside your hips, elbows point straight back.'),
  'Tricep Extensions': art(side('inclineUp', 'inclineDown'), topV('tTriExtA', 'tTriExtB'), 'Hands close together on a raised surface, keep your elbows tucked.'),
  Dips: art(side('dipUp', 'dipDown'), front('fDipUp', 'fDipDown'), 'Parallel bars: body between the bars, lean slightly forward.'),
  'Straight Bar Dips': art(side('sbDipUp', 'sbDipDown'), front('fSbDipUp', 'fSbDipDown'), 'One straight bar: hands on top of it, body in front of the bar, lean forward.'),

  'Australian Pull-ups': art(side('rowDown', 'rowUp'), topV('tRowA', 'tRowB'), 'Overhand grip just outside shoulder width, body straight, pull your chest to the bar.'),
  'Negative Pull-ups': art(side('pullTop', 'hang'), front('fTop', 'fHang'), 'Start with chin over the bar, then lower yourself as slowly as you can.'),
  'Chin-ups': art(side('hang', 'pullTop'), front('fHangChin', 'fTopChin'), 'Underhand grip (palms toward you), hands shoulder width.'),
  'Wide Chin-ups': art(side('hang', 'pullTop'), front('fHangWide', 'fTopWide'), 'Underhand grip (palms toward you), hands wider than your shoulders.'),
  'Close Grip Pull-ups': art(side('hang', 'pullTop'), front('fHangClose', 'fTopClose'), 'Overhand grip with hands close together, almost touching.'),
  'Commando Pull-ups': art(side('hang', 'pullTop'), topV('tCommandoL', 'tCommandoR'), 'Stand sideways to the bar, one hand in front of the other. Pull your head to one side of the bar, then the other.'),
  'Pull-ups': art(side('hang', 'pullTop'), front('fHang', 'fTop'), 'Overhand grip (palms away), hands slightly wider than your shoulders.'),
  'Wide Pull-ups': art(side('hang', 'pullTop'), front('fHangWide', 'fTopWide'), 'Overhand grip, hands much wider than your shoulders.'),
  'Headbanger Pull-ups': art(side('hang', 'pullTop'), front('fHeadL', 'fHeadR'), 'Pull up with your head to the left of the bar, lower, then pull up to the right.'),
  'L-Knee Sit Pull-ups/Chin-ups': art(side('hangL', 'pullTopL'), front('fHangL', 'fTopL'), 'Keep your knees raised at 90° the whole rep.'),
  '1s Pause Pull-up': art(side('hang', 'pullTop'), front('fHang', 'fTop'), 'Pull up and hold for 1 second with your chin over the bar.'),
  'Typewriter Pull-ups': art(side('hang', 'pullTop'), front('fTypeL', 'fTypeR'), 'At the top, slide side to side along the bar with one arm bent and the other straight.'),

  Squats: art(side('standArmsFwd', 'squatDown'), front('fSquatUp', 'fSquatDown'), 'Feet shoulder width, knees track over your toes.'),
  'Sumo Squats': art(side('standArmsFwd', 'squatDown'), front('fSumoUp', 'fSumoDown'), 'Wide stance, toes turned out, knees pushed out over your toes.'),
  'Wall Sit': art(side('wallSit', 'wallSit'), front('fWallSit', 'fWallSit'), 'Back flat on the wall, thighs parallel to the floor, knees at 90°.'),
  'Split Squats': art(side('splitUp', 'splitDown'), front('fSplitUp', 'fSplitDown'), 'Long stride, feet hip width apart, lower your back knee toward the floor.'),
  'Poliquin Step-ups': art(side('stand', 'kneeDrive'), front('fStepA', 'fStepB'), 'Step up onto a low step and drive the other knee up.'),
  'Tibialis Raises': art(side('tibFlat', 'tibUp'), front('fTibA', 'fTibB'), 'Back against a wall, feet forward, lift your toes up toward your shins.'),
  'Cossack Squats': art(side('standArmsFwd', 'cossackSideDown'), front('fCossackUp', 'fCossackDown'), 'Very wide stance, squat deep onto one leg while the other leg stays straight.'),
  'Pistol Squats': art(side('pistolUp', 'pistolDown'), front('fPistolUp', 'fPistolDown'), 'One leg squat, other leg held out in front.'),
  'One-Leg Squats': art(side('pistolUp', 'pistolDown'), front('fPistolUp', 'fPistolDown'), 'Squat on one leg, other leg held out in front.'),

  'Glute Bridges': art(side('bridgeDown', 'bridgeUp'), topV('tBridgeA', 'tBridgeB'), 'Feet hip width, heels close to your glutes, push your hips up.'),
  'Calf Raises': art(side('calfFlat', 'calfUp'), front('fCalfFlat', 'fCalfUp'), 'Rise up onto your toes, pause at the top, lower slowly.'),
  'Hip Thrust': art(side('bridgeDown', 'bridgeUp'), topV('tThrustA', 'tThrustB'), 'Upper back on a bench, feet hip width, drive your hips up.'),
  'Leg Kicks (glute)': art(side('quadruped', 'kickBack'), topV('tKickA', 'tKickB'), 'On all fours, kick one leg straight back and squeeze the glute.'),
  'Side Kicks (glute)': art(side('quadruped', 'kickBack'), topV('tKickA', 'tSideKickB'), 'On all fours, lift one leg out to the side.'),
  'Romanian Deadlift (single-leg)': art(side('hingeUp', 'hingeDown'), front('fHingeUp', 'fHingeDown'), 'Hinge at the hips, back flat, one leg reaching straight behind you.'),
  'Nordic Curl': art(side('kneelUp', 'kneelDown'), front('fNordicUp', 'fNordicDown'), 'Feet anchored, body straight from knees to head, lower forward as slowly as you can.'),

  Crunches: art(side('lieFlat', 'crunchUp'), topV('tCrunchA', 'tCrunchB'), 'Hands lightly behind your head, curl your shoulders off the floor.'),
  'Leg Raises': art(side('legsFlat', 'legsUp'), topV('tLegRaiseA', 'tLegRaiseB'), 'Hands under your hips, legs straight, lower back pressed down.'),
  'Bicycle Crunches': art(side('bikeA', 'bikeB'), topV('tBikeA', 'tBikeB'), 'Bring your elbow to the opposite knee while the other leg extends.'),
  'Dead Bug (alternating)': art(side('deadBugA', 'deadBugB'), topV('tDeadA', 'tDeadB'), 'Lower the opposite arm and leg together, lower back flat.'),
  'Hollow Hold': art(side('legsFlat', 'hollow'), topV('tHollowA', 'tHollowB'), 'Arms overhead, legs together, lower back pressed into the floor.'),
  Plank: art(side('plank', 'plank'), topV('tPlank', 'tPlank'), 'Forearms parallel, elbows under shoulders, body in a straight line.'),
  'Side Plank (left)': art(side('sidePlankDown', 'sidePlankUp'), front('fSidePlankDown', 'fSidePlankUp'), 'Elbow under shoulder, lift your hips so your body is a straight line.'),
  'Side Plank (right)': art(side('sidePlankDown', 'sidePlankUp'), front('fSidePlankDown', 'fSidePlankUp'), 'Elbow under shoulder, lift your hips so your body is a straight line.'),
  'Bird Dog (alternating)': art(side('birdDogA', 'birdDogB'), topV('tBirdA', 'tBirdB'), 'Reach the opposite arm and leg straight out, keep your hips level.'),
  'Copenhagen Raises': art(side('sidePlankDown', 'sidePlankUp'), front('fCopenA', 'fCopenB'), 'Top leg on a bench, lift the bottom leg up to meet it.'),

  'Jumping Jacks': art(front('fJackDown', 'fJackUp'), side('jackSideDown', 'jackSideUp'), 'Jump your feet apart while your arms swing overhead.'),
  'High Knees': art(side('highKneeA', 'highKneeB'), front('fHighKneeA', 'fHighKneeB'), 'Run in place, drive your knees up to hip height.'),
  'Squat Jumps': art(side('squatDown', 'jumpUp'), front('fJumpDown', 'fJumpUp'), 'Squat down, then explode up with your arms overhead.'),
  Burpees: art(side('pushUp', 'jumpUp'), front('fBurpeeDown', 'fJumpUp'), 'Squat, hands down, jump back to a plank, jump in, then jump up.'),
  'Mountain Climbers': art(side('mountainA', 'mountainB'), topV('tMountainA', 'tMountainB'), 'In a plank, drive your knees toward your chest, alternating fast.'),
  'Skater Jumps': art(front('fSkaterA', 'fSkaterB'), side('skaterSideA', 'skaterSideB'), 'Bound sideways from one leg to the other, swinging your back leg behind.'),
  'Jump Lunges': art(side('splitDown', 'jumpLungeUp'), front('fLungeDown', 'fLungeUp'), 'Lunge, then jump and switch legs in the air.'),
  'Plank Jacks': art(side('plank', 'plank'), topV('tJackA', 'tJackB'), 'In a plank, jump your feet wide and back together.'),
}

// Views of an exercise as drawable figures: [{ label, figures: [start, end] }], plus a short form note.
export function exerciseArt(name) {
  const a = ART[name]
  if (!a) return null
  return { note: a.note, views: a.views.map((v) => ({ label: v.label, figures: v.poses.map(buildFigure) })) }
}
