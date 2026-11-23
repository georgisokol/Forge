const planchePose = { t: 0, arm: [90, 90], leg: [180, 180], foot: 180 }
const tuckPlanche = { t: 8, arm: [100, 100], leg: [50, 175], foot: 175 }
const advTuckPlanche = { t: 3, arm: [98, 98], leg: [30, 160], foot: 160 }
const leanPose = { t: -25, arm: [100, 100], leg: [150, 155] }

// Top-down hold seen from above: hands = [left, right], feet = [left, right] ground points.
const topView = (hands, feet, faceUp = false) => ({ kind: 'top', faceUp, sw: 22, hw: 12, sy: 30, hy: 58, headY: 19, feet, arms: [{ h: hands[0] }, { h: hands[1] }] })
const NEAR = [[52, 56], [78, 56]]
const WIDE = [[10, 38], [120, 38]]
const MID = [[26, 44], [104, 44]]
const TOGETHER = [[61, 86], [69, 86]]
const SPLIT = [[40, 86], [90, 86]]

const flTuck = { t: 0, arm: [-90, -90], leg: [-50, 170], foot: 170, anchor: 'bar' }
const flAdv = { t: 0, arm: [-90, -90], leg: [-20, 160], foot: 160, anchor: 'bar' }
const flOne = { t: 0, arm: [-90, -90], leg: [180, 180], foot: 180, leg2: [-50, 170], foot2: 170, anchor: 'bar' }
const flStraddle = { view: 'front', t: -90, torso: 0.25, arm: [-70, -70], leg: [15, 15], foot: 0, anchor: 'bar' }
const flFull = { t: 0, arm: [-90, -90], leg: [180, 180], foot: 180, anchor: 'bar' }

const blTuck = { t: 0, arm: [-105, -105], leg: [50, 170], foot: 170, anchor: 'bar' }
const blAdv = { t: 0, arm: [-105, -105], leg: [30, 150], foot: 150, anchor: 'bar' }
const blStraddle = { view: 'front', t: -90, torso: 0.25, arm: [-70, -70], leg: [15, 15], foot: 0, anchor: 'bar' }
const blFull = { t: 0, arm: [-105, -105], leg: [180, 180], foot: 180, anchor: 'bar' }
const sit = { armLen: [1.2, 1.2] }
const flag = { view: 'front', t: 180, arm: [180, 180], arm2: [-150, -120], lift: 28, posts: true }

const handstand = { t: 90, arm: [90, 90], leg: [-90, -90], foot: -90 }

export default [
  {
    id: 'straddle-planche',
    name: 'Straddle Planche',
    blurb: 'Body horizontal on straight arms, legs wide',
    muscles: 'Front delts, chest, core, wrists',
    steps: [
      { title: 'Planche lean', text: 'From a plank, shift your shoulders far past your hands with straight arms and posterior pelvic tilt. Hold the lean.', tip: 'Push the floor away and round your upper back; do not sag.', pose: leanPose, timer: 15 },
      { title: 'Tuck planche', text: 'Lean forward, lift your feet and pull your knees to your chest, back rounded, arms locked. Hold with hips near shoulder height.', tip: 'Warm up wrists and shoulders first; stop if wrists hurt.', pose: tuckPlanche, timer: 10 },
      { title: 'Advanced tuck', text: 'Flatten your back and open your hips so your knees move away from your chest. Keep shoulders far forward over the hands.', tip: 'Hips must not rise above shoulder level.', pose: advTuckPlanche, timer: 8 },
      { title: 'Straddle hold', text: 'Extend your legs wide, toes pointed, with your whole body horizontal. Keep arms straight and shoulders protracted.', tip: 'A wider straddle is easier; narrow it over weeks.', pose: topView(NEAR, SPLIT), timer: 5 },
      { title: 'Train safely', text: 'Hold 10-15 s tuck planches for several sets before advancing. Condition wrists and elbows 3 times a week and never skip a step.', pose: tuckPlanche },
    ],
  },
  {
    id: 'full-planche',
    name: 'Full Planche',
    blurb: 'Straight body floating on straight arms',
    muscles: 'Shoulders, chest, core, biceps tendon',
    steps: [
      { title: 'Planche push-ups', text: 'Do pseudo planche push-ups with hands by your hips and fingers pointing back or out. Control every rep.', tip: 'Elbows stay tight to your sides.', pose: leanPose, pose2: { t: -25, arm: [120, 40], leg: [150, 155] }, reps: 6 },
      { title: 'Advanced tuck', text: 'Hold an advanced tuck planche with a flat back and straight arms. Build to 10-15 s before going further.', pose: advTuckPlanche, timer: 10 },
      { title: 'Straddle planche', text: 'Hold a straddle planche with your hips level with your shoulders. Squeeze glutes and point your toes.', pose: topView(NEAR, SPLIT), timer: 8 },
      { title: 'Close the legs', text: 'Bring your legs together gradually, one leg then the other, keeping the body line level. Shorten the straddle over weeks.', tip: 'Do not let hips pike up.', pose: { ...planchePose, leg: [180, 180], leg2: [160, 160], foot2: 160 }, timer: 5 },
      { title: 'Full planche', text: 'Hold a straight body parallel to the floor, shoulders far forward of hands, arms locked, legs together. Keep glutes, core and quads tight.', tip: 'Your head stays neutral, looking at the floor ahead.', pose: planchePose, timer: 5 },
    ],
  },
  {
    id: 'front-lever',
    name: 'Front Lever',
    blurb: 'Face up, body straight under the bar',
    muscles: 'Lats, core, rear delts, biceps',
    steps: [
      { title: 'Tuck lever', text: 'Hang, pull your hips up and knees to chest until your back is horizontal. Keep arms straight and shoulders pushed down.', tip: 'Pull the bar toward your hips, not your chest.', pose: flTuck, timer: 10 },
      { title: 'Advanced tuck', text: 'Open your hips so your thighs point away from your chest, back flat and horizontal. Keep arms locked.', pose: flAdv, timer: 8 },
      { title: 'One leg out', text: 'Extend one leg straight while the other stays tucked. Alternate sides.', tip: 'Do not let your hips drop.', pose: flOne, timer: 6 },
      { title: 'Straddle lever', text: 'Extend both legs in a wide straddle, body flat. Hold with your shoulders depressed.', pose: flStraddle, timer: 6 },
      { title: 'Full lever', text: 'Hold a straight body parallel to the floor with legs together and arms straight. Squeeze lats, glutes and core.', tip: 'Build with negatives and tuck holds first; protect your elbows.', pose: flFull, timer: 5 },
    ],
  },
  {
    id: 'back-lever',
    name: 'Back Lever',
    blurb: 'Face down, body straight under the bar',
    muscles: 'Chest, front delts, lats, biceps, core',
    steps: [
      { title: 'Skin the cat', text: 'From a hang, tuck your knees up and rotate backward through the bar until you hang with arms behind you. Return slowly.', tip: 'Go only as far as your shoulders feel comfortable.', pose: { t: -100, arm: [-82, -82], leg: [90, 90], anchor: 'bar' }, pose2: { t: -135, arm: [-82, -82], leg: [-60, -130], anchor: 'bar' }, reps: 5 },
      { title: 'Tuck lever', text: 'Hold your body horizontal, face down, with knees tucked and arms straight. Keep your hips at shoulder height.', pose: blTuck, timer: 10 },
      { title: 'Advanced tuck', text: 'Open your hips so your thighs extend back, back flat. Keep arms straight.', pose: blAdv, timer: 8 },
      { title: 'Straddle lever', text: 'Straighten your legs in a wide straddle, body horizontal. Squeeze glutes and point your toes.', pose: blStraddle, timer: 6 },
      { title: 'Full lever', text: 'Hold a straight horizontal body, legs together, arms straight. Do not arch your lower back.', tip: 'Warm up shoulders and elbows well; the biceps tendon takes the load.', pose: blFull, timer: 5 },
    ],
  },
  {
    id: 'human-flag',
    name: 'Human Flag',
    blurb: 'Body horizontal, sideways off a pole',
    muscles: 'Obliques, lats, shoulders, core',
    steps: [
      { title: 'Prerequisites', text: 'Be able to do 8+ pull-ups, 15+ dips and a 45 s side plank before starting. Warm up wrists, elbows and shoulders.', pose: { view: 'front', arm: [-62, -62], leg: [90, 90], anchor: 'bar' } },
      { title: 'Hips up diagonal', text: 'Grip a vertical pole, top hand pushing and bottom hand pulling. Lift your hips so your body slants out from the pole with legs hanging.', tip: 'Keep the bottom arm straight.', pose: { ...flag, t: 150, leg: [75, 80], leg2: [75, 80] }, timer: 8 },
      { title: 'Tuck flag', text: 'Push and pull to lift your hips high, knees tucked to your chest. Hold your torso horizontal.', pose: { ...flag, leg: [30, 110], leg2: [30, 110] }, timer: 6 },
      { title: 'Straddle flag', text: 'Extend your legs in a wide straddle while your torso stays horizontal. Use your obliques to hold the line.', pose: { ...flag, leg: [-12, -12], leg2: [12, 12] }, timer: 5 },
      { title: 'Full flag', text: 'Hold your body horizontal, legs together, with straight bottom arm and pushing top arm. Keep your body in one line.', tip: 'Do not twist; shoulders stay stacked.', pose: { ...flag, leg: [0, 0], leg2: [0, 0] }, timer: 5 },
    ],
  },
  {
    id: 'one-arm-push-up',
    name: 'One-arm Push-up',
    blurb: 'Push-up on a single hand',
    muscles: 'Chest, triceps, core, obliques',
    steps: [
      { title: 'Strong base', text: 'Do 30+ strict push-ups and archer push-ups before moving on. Warm up your wrist and elbow.', pose: { t: -10, arm: [90, 90], leg: [150, 155] }, pose2: { t: -5, arm: [120, 30], leg: [165, 168] }, reps: 10 },
      { title: 'Pseudo planche push-up', text: 'Place your hands by your hips with fingers pointing back, lean your shoulders past your hands and lower in a push-up. Keep the lean throughout.', tip: 'Elbows stay tight to your sides.', pose: { t: -25, arm: [100, 100], leg: [150, 155] }, pose2: { t: -20, arm: [125, 45], leg: [150, 155] }, reps: 5 },
      { title: 'Wide-leg negatives', text: 'On the floor with feet very wide, lower slowly on one arm in 5 seconds, then reset with two hands.', pose: { t: -10, arm: [90, 90], arm2: [170, 170], leg: [150, 155] }, pose2: { t: -5, arm: [120, 30], arm2: [170, 170], leg: [165, 168] }, reps: 3 },
      { title: 'Full one-arm', text: 'Press up on one hand with feet shoulder-width, elbow close to your body. Keep your body straight and chest square.', tip: 'Spread fingers and brace your core to avoid twisting.', pose: { t: -8, arm: [90, 90], arm2: [170, 170], leg: [160, 163] }, pose2: { t: -5, arm: [120, 30], arm2: [170, 170], leg: [165, 168] }, reps: 3 },
    ],
  },
  {
    id: 'one-arm-pull-up',
    name: 'One-arm Pull-up',
    blurb: 'Pull your chin over the bar with one arm',
    muscles: 'Lats, biceps, forearms, core',
    steps: [
      { title: 'Strong pull base', text: 'Do 15+ strict pull-ups and 5+ weighted pull-ups before starting. Warm up elbows and shoulders.', pose: { view: 'front', arm: [-62, -62], leg: [90, 90], anchor: 'bar' }, pose2: { view: 'front', arm: [50, -80], leg: [90, 90], anchor: 'bar' }, reps: 8 },
      { title: 'Archer pull-up', text: 'Pull toward one hand while the other arm stays straight out to the side. Alternate sides.', pose: { view: 'front', arm: [-45, -45], leg: [90, 90], anchor: 'bar' }, pose2: { view: 'front', arm: [-8, -8], arm2: [130, -100], leg: [90, 90], anchor: 'bar', headDx: -6 }, reps: 5 },
      { title: 'Wrist-assist pull-up', text: 'Hold the bar with one hand and grip that wrist with the other hand. Pull up using mostly the top arm.', pose: { view: 'front', arm: [-62, -62], arm2: [-100, -100], leg: [90, 90], anchor: 'bar' }, pose2: { view: 'front', arm: [50, -80], arm2: [100, 60], leg: [90, 90], anchor: 'bar' }, reps: 4 },
      { title: 'One-arm negatives', text: 'Jump to the top and lower yourself in 5 seconds on one arm. Keep your shoulder active and body still.', tip: 'Never let go and drop; lower under control.', pose: { view: 'front', arm: [50, -80], arm2: [100, 100], leg: [90, 90], anchor: 'bar' }, pose2: { view: 'front', arm: [-62, -62], arm2: [100, 100], leg: [90, 90], anchor: 'bar' }, reps: 3 },
      { title: 'Full one-arm', text: 'Hang on one arm and pull until your chin clears the bar. Keep your free arm relaxed at your side.', pose: { view: 'front', arm: [-62, -62], arm2: [100, 100], leg: [90, 90], anchor: 'bar' }, pose2: { view: 'front', arm: [50, -80], arm2: [100, 100], leg: [90, 90], anchor: 'bar' }, reps: 1 },
    ],
  },
  {
    id: 'weighted-muscle-up',
    name: 'Weighted Muscle-up',
    blurb: 'Muscle-up with added weight',
    muscles: 'Lats, chest, triceps, core',
    // The steps teach one movement; the weekly plan progresses it by load instead.
    planStages: [
      { title: 'Strict muscle-up', reps: 3 },
      { title: 'Muscle-up +2.5 kg', reps: 3 },
      { title: 'Muscle-up +5 kg', reps: 3 },
      { title: 'Muscle-up +7.5 kg', reps: 3 },
      { title: 'Muscle-up +10 kg', reps: 3 },
    ],
    steps: [
      { title: 'Prerequisites', text: 'Be able to do 5+ clean strict muscle-ups and 10+ weighted dips. Warm up wrists and shoulders.', pose: { view: 'front', arm: [-62, -62], leg: [90, 90], anchor: 'bar' } },
      { title: 'Add the weight', text: 'Wear a belt or vest with 2-5 kg and hang with a false grip. Keep your body tight before you pull.', pose: { view: 'front', arm: [-62, -62], leg: [90, 90], anchor: 'bar' } },
      { title: 'Explosive pull', text: 'Pull hard, driving the bar toward your lower chest while leaning back slightly.', tip: 'Pull the bar to your belly, not your chin.', pose: { view: 'front', arm: [-62, -62], leg: [90, 90], anchor: 'bar' }, pose2: { view: 'front', arm: [50, -80], leg: [90, 90], anchor: 'bar' }, reps: 3 },
      { title: 'Transition', text: 'Lean your chest forward over the bar with elbows high and close. Rotate your wrists quickly over the bar.', pose: { t: -80, arm: [100, 20], leg: [95, 110], anchor: 'hands', bar: true }, pose2: { t: -75, arm: [125, 30], leg: [95, 110], anchor: 'hands', bar: true }, reps: 3 },
      { title: 'Press to lockout', text: 'Press up until your arms are straight with the bar at your hips. Lower back down under control.', pose: { t: -75, arm: [125, 30], leg: [95, 110], anchor: 'hands', bar: true }, pose2: { t: -85, arm: [95, 95], leg: [95, 110], anchor: 'hands', bar: true }, reps: 3 },
    ],
  },
  {
    id: 'ninety-degree-handstand-push-up',
    name: '90° Handstand Push-up',
    blurb: 'Push from horizontal body to handstand',
    muscles: 'Shoulders, triceps, chest, core',
    steps: [
      { title: 'Wall HSPU', text: 'Kick up to a wall handstand and do strict handstand push-ups to a head touch. Build to 10 reps.', pose: { ...handstand, wall: true }, pose2: { t: 90, arm: [120, 40], leg: [-90, -90], foot: -90, wall: true }, reps: 8 },
      { title: 'Free handstand', text: 'Hold a freestanding handstand with straight body, hands shoulder-width. Squeeze glutes and push the floor away.', pose: handstand, timer: 15 },
      { title: 'Planche lean', text: 'Lean far forward in a plank with straight arms to load your front delts. Warm up your wrists first.', pose: leanPose, timer: 15 },
      { title: 'Straddle planche', text: 'Hold a straddle planche as the base strength for the bottom position.', pose: topView(NEAR, SPLIT), timer: 5 },
      { title: 'Planche to handstand', text: 'Press from a horizontal bottom position with bent arms up to a handstand. Keep the body straight and lower slowly.', tip: 'Start with negatives only, lowering from handstand.', pose: { t: 0, arm: [135, 45], leg: [180, 180], foot: 180 }, pose2: handstand, reps: 1 },
    ],
  },
  {
    id: 'victorian',
    name: 'Victorian',
    blurb: 'Face-up planche, arms wide and straight',
    muscles: 'Shoulders, biceps, lats, core',
    steps: [
      { title: 'Strong planche', text: 'Master the full planche and the front lever first. Warm up wrists, elbows and shoulders thoroughly.', pose: planchePose, timer: 8 },
      { title: 'Reverse lean', text: 'Sit with hands behind you, fingers pointing back. Lift your hips, keeping arms straight, and lean slightly.', tip: 'Warm up your wrists and shoulders gently.', pose: { t: -145, arm: [95, 95], leg: [-10, 20] }, timer: 10 },
      { title: 'Tuck Victorian', text: 'Lift face up with knees tucked and arms straight. Keep your hips level with your shoulders.', pose: { t: 0, arm: [95, 95], leg: [-45, -170], foot: -170 }, timer: 5 },
      { title: 'Straddle Victorian', text: 'Extend your legs wide while staying face up and horizontal. Keep arms straight.', pose: topView(MID, SPLIT, true), timer: 5 },
      { title: 'Full Victorian', text: 'Hold a straight horizontal body, face up, arms straight out wide. Legs together, toes pointed.', pose: topView(MID, TOGETHER, true), timer: 3 },
    ],
  },
  {
    id: 'v-sit',
    name: 'V-Sit',
    blurb: 'Seated on hands, legs high in a V',
    muscles: 'Hip flexors, abs, triceps, shoulders',
    steps: [
      { title: 'Tuck support', text: 'Support yourself on straight arms beside your hips with knees pulled to your chest. Push down and lift your hips.', pose: { t: -95, arm: [85, 85], leg: [-30, 60], foot: 60, ...sit }, timer: 15 },
      { title: 'L-sit', text: 'Straighten your legs forward, parallel to the floor, with locked arms. Push shoulders down.', pose: { t: -95, arm: [85, 85], leg: [0, 0], foot: -20, ...sit }, timer: 15 },
      { title: 'Compression lifts', text: 'From an L-sit, raise your legs higher while leaning your torso back. Keep your legs straight and toes pointed.', pose: { t: -95, arm: [85, 85], leg: [0, 0], foot: -20, ...sit }, pose2: { t: -105, arm: [80, 80], leg: [-25, -25], foot: -25, ...sit }, reps: 5 },
      { title: 'Low V-sit', text: 'Lean back and raise your legs about 30 degrees above horizontal. Push down through your hands.', pose: { t: -110, arm: [78, 78], leg: [-30, -30], foot: -30, ...sit }, timer: 6 },
      { title: 'Full V-sit', text: 'Lean back and lift your legs to about 45 degrees with your hips off the floor. Keep arms straight and legs locked.', tip: 'Strengthen hip flexors and hamstring flexibility first.', pose: { t: -115, arm: [75, 75], leg: [-45, -45], foot: -45, ...sit }, timer: 5 },
    ],
  },
  {
    id: 'maltese',
    name: 'Maltese',
    blurb: 'Planche with arms spread wide',
    muscles: 'Shoulders, chest, biceps, core',
    steps: [
      { title: 'Strong planche', text: 'Hold a full planche for 10 s and build wide-arm push strength first. Condition elbows and wrists for months.', pose: planchePose, timer: 8 },
      { title: 'Wide lean', text: 'In a plank, place your hands wide at hip level and lean forward with straight arms. Hold the lean.', tip: 'Never force the width; widen it a little each week.', pose: leanPose, timer: 10 },
      { title: 'Tuck Maltese', text: 'Lift your feet with knees tucked and hands wide. Keep arms straight.', pose: tuckPlanche, timer: 5 },
      { title: 'Straddle Maltese', text: 'Extend your legs wide with hands in line at hip level. Squeeze glutes and point your toes.', pose: topView(WIDE, SPLIT), timer: 3 },
      { title: 'Full Maltese', text: 'Hold a straight body horizontal with arms fully extended out wide and legs together. Keep your body in one line.', pose: topView(WIDE, TOGETHER), timer: 3 },
    ],
  },
]
