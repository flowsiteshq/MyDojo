/**
 * Kai Camp Operations — Hourly Staff SMS + 6 PM Daily Summary
 *
 * Summer camp runs June 1 – Aug 10, Mon–Fri, 8 AM arrival, 9 AM start, 6 PM end (CDT)
 * No field trips weeks 1–2 (June 1–14)
 *
 * Two endpoints:
 *   POST /api/scheduled/kai-camp-hourly   — fires every hour 9 AM–5 PM CDT (14:00–22:00 UTC)
 *   POST /api/scheduled/kai-camp-summary  — fires at 6 PM CDT (23:00 UTC)
 *
 * CDT = UTC-5
 */

import { Request, Response } from "express";
import { invokeLLM } from "./_core/llm";
import { sendSms } from "./sms800";

// ── Staff phone numbers ──────────────────────────────────────────────────────
const STAFF_PHONES = [
  { name: "Vincent", phone: "+12818189288" },
  { name: "Debbie", phone: "+12812369283" },
  { name: "Hector", phone: "+18187454612" },
  { name: "Dominique", phone: "+12406011818" },
  { name: "Clover", phone: "+17034997761" },
];

// ── Weekly themes with detailed activity plans ───────────────────────────────
const THEME_WEEKS = [
  {
    start: "2026-06-01", end: "2026-06-05",
    theme: "Ninja Warrior Week",
    fieldTrip: false,
    hourlyPlan: {
      9: {
        title: "Morning Assembly & Ninja Oath",
        instructions: `Gather ALL kids on the main mat in a circle. Do a 5-min warm-up: 10 jumping jacks, 10 high knees, 5 ninja rolls each side. Introduce the week theme: tell kids they are training to become NINJA WARRIORS. Have them repeat the Ninja Oath: 'I am strong, I am fast, I am a ninja!' Split into age groups: Little Ninjas (3-5) to the small mat, Dragon Kids (6-11) to main mat, Teens (12+) to the heavy bag area. Each group does 10 min of basic kicks and punches with their instructor.`,
      },
      10: {
        title: "Martial Arts Training Block 1 — Speed & Agility",
        instructions: `LITTLE NINJAS (3-5): Instructor leads 'Ninja Freeze' game — kids run around mat, freeze on command in a martial arts stance. 3 rounds. Then practice front kicks into the pad, 10 each leg.\n\nDRAGON KIDS (6-11): Set up 4 agility ladder stations on main mat. Station 1: ladder footwork. Station 2: cone weave sprint. Station 3: jump rope 30 sec. Station 4: 5 front kicks + 5 roundhouse kicks on bag. Rotate every 3 min.\n\nTEENS (12+): Partner drills — one holds pad, other throws 3-combo (jab-cross-roundhouse) x10 rounds, then switch. Focus on speed and snapping technique.`,
      },
      11: {
        title: "Ninja Obstacle Course — Station Rotation",
        instructions: `Set up 5 obstacle stations around the dojo before this hour:\n1. CRAWL TUNNEL: crawl under 3 chairs lined up\n2. BALANCE BEAM: walk across a taped line on floor heel-to-toe without stepping off\n3. JUMP PADS: jump on/off 3 foam pads in sequence\n4. NINJA ROLL: forward roll on mat, stand up, punch the air\n5. SPEED WALL: 10 rapid palm strikes on the wall pad\n\nAll age groups rotate through all 5 stations. Timer: 2 min per station. Staff at each station cheering and timing. Award a 'Ninja Star' sticker to kids who complete all 5 without stopping.`,
      },
      12: {
        title: "Lunch Break + Quiet Time",
        instructions: `Have kids wash hands (2 at a time to bathroom). Set up lunch area — kids sit in rows on the mat or at tables. Staff eat with kids, keep energy calm. No running during lunch. After eating (approx 30 min), 15 min quiet time: kids can read, draw, or rest on their mat. Put on calm background music. Staff check in with each child — ask about their favorite station so far today. Clean up all food trash before 1 PM.`,
      },
      13: {
        title: "Ninja Team Challenge — Capture the Flag",
        instructions: `Split ALL kids into 2 teams regardless of age (mix ages intentionally for teamwork). Set up Capture the Flag on the main mat:\n- Each team has a 'flag' (a colored belt) on their side\n- Kids must cross the center line to grab opponent's flag and return it to their base\n- If tagged on opponent's side, go to 'ninja jail' (corner of mat) until a teammate tags you free\n- Play 3 rounds of 5 min each\n\nStaff: one referee in center, one watching each jail corner. After each round, gather teams and give a 30-sec strategy tip. Award winning team a group high-five line.`,
      },
      14: {
        title: "Martial Arts Training Block 2 — Power Strikes",
        instructions: `LITTLE NINJAS: Instructor does 'Ninja Says' (like Simon Says but with martial arts moves). 'Ninja says front kick!' 'Ninja says bow!' Kids who do a move without 'Ninja says' sit down. Last 3 standing win a sticker.\n\nDRAGON KIDS: Board breaking prep — each kid gets a rebreakable board. Practice palm heel strike technique: chamber hand at hip, drive heel of palm through board. Staff hold boards. Each kid gets 5 attempts. Celebrate every break loudly.\n\nTEENS: Sparring prep — review rules (light contact, no head shots for under 14). Gear up. 2-min sparring rounds, rotate partners. Staff watch for technique, call out good moves.`,
      },
      15: {
        title: "Snack + Ninja Trivia Cool-Down",
        instructions: `Distribute snacks (check for allergies first — no nuts). While kids eat, run Ninja Trivia:\n- Q: 'What country did ninjas come from?' A: Japan\n- Q: 'What is the name of the ninja training school?' A: Ninjutsu dojo\n- Q: 'What does a ninja use to climb walls?' A: Rope/grappling hook\n- Q: 'Name 3 martial arts moves we learned today' (open answer)\n- Q: 'What is the #1 ninja rule?' A: Discipline\n\nKids who answer get a point for their team from the Capture the Flag game. Announce running team score. Clean up snack area completely before 4 PM.`,
      },
      16: {
        title: "Ninja Warrior Final Challenge — Timed Obstacle Run",
        instructions: `This is the BIG event of the day. Set up the full obstacle course again (same 5 stations from 11 AM). This time it is a TIMED individual run:\n- Each kid runs the full course as fast as possible\n- Staff member with phone timer at start/finish\n- Announce each kid's time out loud — cheer for everyone\n- Post times on a whiteboard so kids can see the leaderboard\n- Top 3 times in each age group win a 'Ninja Warrior' certificate (print or write by hand)\n\nWhile waiting their turn, other kids do: 10 pushups, 10 sit-ups, hold plank 20 sec — repeat cycle.`,
      },
      17: {
        title: "Wind-Down, Cleanup & Parent Pickup Prep",
        instructions: `5:00 PM SHARP — stop all activities. Gather all kids on main mat.\n1. Cool-down stretch: seated forward fold, butterfly stretch, lying twist each side — hold 20 sec each\n2. Circle up: each kid says ONE thing they learned or liked today (go around fast)\n3. Ninja Warrior chant together: 'Strong body, sharp mind, ninja warrior!' x3\n4. Assign cleanup jobs: 2 kids fold mats, 2 kids pick up equipment, 2 kids wipe down bags\n5. Kids sit in pickup area by 5:15 PM with their bags packed\n6. Staff check kids out ONLY to authorized adults — verify name on pickup list\n7. Do NOT release any child without confirmation. Text parent if pickup is late by 5:30 PM.`,
      },
    },
    tomorrowEquipment: [
      "Set up 5 obstacle course stations (chairs for crawl tunnel, foam pads, tape for balance beam)",
      "Charge all phone timers for timed obstacle run",
      "Prepare rebreakable boards for Dragon Kids power strike drill",
      "Print or write 3 Ninja Warrior certificates for top times",
      "Bring 2 colored belts for Capture the Flag flags",
      "Stock snack area — check for nut allergies on enrollment list",
      "Set up agility ladders and cones for 10 AM training block",
      "Prepare Ninja Trivia question cards (can write on index cards)",
    ],
  },
  {
    start: "2026-06-08", end: "2026-06-12",
    theme: "Water War Week",
    fieldTrip: false,
    hourlyPlan: {
      9: {
        title: "Morning Assembly & Water Safety Briefing",
        instructions: `Gather all kids on main mat. Warm-up: 10 jumping jacks, arm circles, hip rotations. Introduce Water War Week — explain the rules: no water inside the dojo building, all water activities are OUTSIDE in the back area only. Review safety rules: no running on wet surfaces, no water in anyone's face without consent, no water near electronics. Split into age groups for 10 min of basic kicks and punches warm-up before heading outside.`,
      },
      10: {
        title: "Martial Arts Training Block 1 — Footwork & Defense",
        instructions: `INSIDE on the mat — keep this dry before water activities begin.\n\nLITTLE NINJAS: Mirror drill — instructor faces kids, does slow movements (step left, step right, duck, kick) and kids mirror. 5 min. Then practice blocking: high block, low block, middle block x10 each.\n\nDRAGON KIDS: Footwork ladder drills — in-in-out-out, lateral shuffle, crossover step. 3 rounds each. Then 1-on-1 partner defense drill: one partner throws slow jab, other slips left or right. 10 reps each side, switch.\n\nTEENS: Combination work on bags: jab-cross-hook-roundhouse x5 rounds. Focus on footwork between combos — step off center line after each combo.`,
      },
      11: {
        title: "Water Balloon Toss & Dodge",
        instructions: `OUTSIDE only. Pre-fill 50+ water balloons before camp (assign this to first staff in at 8 AM).\n\nACTIVITY 1 — Partner Toss: Kids pair up, start 3 feet apart, toss balloon back and forth. Each successful catch, step back 1 foot. Last pair with unpopped balloon wins.\n\nACTIVITY 2 — Balloon Dodge: One staff member throws balloons at group of kids who try to dodge. Kids who get hit sit down. Last 3 standing win.\n\nACTIVITY 3 — Balloon Stomp: Each kid ties a balloon to their ankle. On 'GO' everyone tries to stomp others' balloons while protecting their own. Last balloon intact wins.\n\nHave towels ready. Collect all balloon pieces — no litter.`,
      },
      12: {
        title: "Lunch Break + Dry Off",
        instructions: `Bring all kids inside. Have towels available at the door — dry off before entering. Kids change into dry clothes if they brought them (remind parents on Monday to pack a change of clothes all week). Lunch routine: wash hands, sit in rows, eat calmly. Staff eat with kids. After lunch, 15 min quiet rest. Check in with each child. Clean up all food trash before 1 PM.`,
      },
      13: {
        title: "Water Relay Races",
        instructions: `OUTSIDE. Split into 4 teams of equal size (mix ages).\n\nRELAY 1 — Sponge Race: Each team has a bucket of water and a large sponge. Kids soak sponge, run to empty bucket 20 feet away, squeeze water in, run back, pass sponge. Team that fills their bucket first wins.\n\nRELAY 2 — Cup Balance: Each kid balances a cup of water on their head and walks to the finish line. Spill = restart from beginning. Fastest team wins.\n\nRELAY 3 — Water Gun Tag: Each team has 2 water guns. One kid from each team is 'it' and tries to tag opponents with water. Tagged kids freeze until a teammate runs and tags them free. Team with most kids unfrozen after 3 min wins.\n\nAward team points on the whiteboard.`,
      },
      14: {
        title: "Martial Arts Training Block 2 — Grappling Basics",
        instructions: `INSIDE — dry off before coming in. This block focuses on ground techniques.\n\nLITTLE NINJAS: Tumbling and rolling — forward roll, backward roll, side roll. Staff spot each child. 5 min. Then 'Crab Walk' race across the mat — builds core strength.\n\nDRAGON KIDS: Basic takedown defense — stance, sprawl technique. Partner drill: one partner attempts a grab, other sprawls and gets back to standing. 10 reps each, switch. Then review: what do you do if someone grabs you from behind? (Stomp, elbow, turn and run.)\n\nTEENS: Ground-and-pound basics — mount position, safe fall technique, bridge-and-roll escape. Drill: partner in mount, bottom person bridges and rolls to escape. 10 reps each side, switch.`,
      },
      15: {
        title: "Snack + Water War Stories",
        instructions: `Snacks inside. While eating, each kid shares their BEST moment from today's water activities. Staff share a funny story too — keep it light and fun. Then do a quick 'What did we learn today?' recap:\n- What martial arts move did we practice this morning?\n- What is the safety rule for water activities?\n- What does 'sprawl' mean in grappling?\n\nKids who answer correctly get a team point. Update leaderboard. Clean up snack area before 4 PM.`,
      },
      16: {
        title: "Slip N Slide Championship",
        instructions: `OUTSIDE — the big finale activity of the day. Set up slip n slide on the grass area. Rules: one at a time, feet first only, no diving headfirst, staff at the end to help kids up.\n\nWhile waiting in line, other kids do: 10 squats, 10 lunges, 10 mountain climbers — repeat cycle to stay warm and active.\n\nAward style points: most creative slide, fastest slide, biggest splash. Kids vote for each category — winner gets a 'Water Warrior' sticker.\n\nBring all kids inside by 4:45 PM to dry off and change before 5 PM wind-down.`,
      },
      17: {
        title: "Wind-Down, Cleanup & Parent Pickup Prep",
        instructions: `5:00 PM SHARP — all kids inside, dry, bags packed.\n1. Cool-down stretch: seated forward fold, butterfly, lying twist — 20 sec each\n2. Circle up: each kid says one thing they learned or liked today\n3. Team chant: 'Water Warriors, never quit!' x3\n4. Cleanup: collect all water equipment outside, deflate/store slip n slide, collect all balloon pieces\n5. Kids in pickup area by 5:15 PM with bags\n6. Check out ONLY to authorized adults on pickup list\n7. Text parents if pickup is late by 5:30 PM`,
      },
    },
    tomorrowEquipment: [
      "Pre-fill 50+ water balloons before 8 AM (assign to first staff in)",
      "Set up slip n slide on grass — check for rocks/debris first",
      "Bring 4 large sponges and 8 buckets for relay race",
      "Charge water guns — bring 4 water guns minimum",
      "Extra towels for each child (ask parents to send towel daily)",
      "Remind parents: pack change of dry clothes every day this week",
      "Set up agility ladders inside for 10 AM training block",
      "Check snack supply — restock if needed",
    ],
  },
  {
    start: "2026-06-15", end: "2026-06-19",
    theme: "Board Breaking Week",
    fieldTrip: true,
    hourlyPlan: {
      9: { title: "Morning Assembly & Board Breaking Safety", instructions: `Gather all kids on main mat. Warm-up: 10 jumping jacks, wrist circles, shoulder rolls, hip rotations. Introduce Board Breaking Week — explain that breaking boards is about FOCUS and TECHNIQUE, not strength. Safety rules: always break with a staff member holding the board, never try to break without supervision, follow the instructor's hand placement instructions exactly. Demonstrate a proper palm heel strike break. Split into age groups for 10 min of basic strikes warm-up.` },
      10: { title: "Strike Technique Training", instructions: `LITTLE NINJAS: Palm heel strike practice on foam pad held by instructor. 10 strikes each hand. Focus: fingers bent back, heel of palm makes contact. Chant 'Kiai!' on each strike.\n\nDRAGON KIDS: Three strike options — palm heel, knife hand (karate chop), front kick. Each kid picks their technique for today's break. Practice on bag: 20 reps of chosen technique. Staff correct form — elbow alignment, follow-through, hip rotation.\n\nTEENS: Advanced combo before break: jab-cross-palm heel on bag x10 rounds. Then choose break technique: palm heel, elbow strike, or jumping front kick (teens only). Practice on bag 20 reps.` },
      11: { title: "Board Breaking Station 1 — Little Ninjas & Dragon Kids", instructions: `Set up 3 breaking stations with staff holding boards:\nStation 1: Little Ninjas — palm heel strike through 1 thin board (easiest). Staff hold board at chest height for each child. Each child gets 3 attempts. Celebrate EVERY break with the whole group cheering.\nStation 2: Dragon Kids Level 1 — palm heel or knife hand through 1 standard board. Staff hold at solar plexus height. 3 attempts each.\nStation 3: Dragon Kids Level 2 (for kids who broke Level 1) — 2 boards stacked. 3 attempts.\n\nWhile waiting: kids do 10 pushups, 10 sit-ups, hold plank 20 sec — repeat.` },
      12: { title: "Lunch Break", instructions: `Wash hands, sit in rows, eat calmly. Staff eat with kids. Discuss: how did it feel to break a board? What technique did you use? What would you do differently? After lunch, 15 min quiet rest. Clean up all food trash before 1 PM.` },
      13: { title: "Board Breaking Station 2 — Teens & Advanced Dragon Kids", instructions: `TEENS: Breaking options by skill level:\n- Beginner: 1 board palm heel or elbow\n- Intermediate: 2 boards stacked palm heel\n- Advanced: Jumping front kick through 1 board (staff hold board at waist height, teen jumps and kicks through)\n\nADVANCED DRAGON KIDS (11-12): 2-board break or speed break (1 board, fastest time wins).\n\nAll other kids: partner pad work — one holds pad, other throws 10-combo, switch. Keep energy high while teens break.` },
      14: { title: "Martial Arts Training Block 2 — Power & Conditioning", instructions: `LITTLE NINJAS: 'Dragon Kicks' game — kids line up, each runs to instructor and throws a front kick into the pad, runs back. First team to have all kids kick wins. 3 rounds.\n\nDRAGON KIDS: Power circuit — 10 pushups, 10 squats, 5 burpees, 10 bag strikes, rest 30 sec. Repeat 3 rounds. Staff count reps and encourage.\n\nTEENS: Sparring with board-breaking combos — after each sparring round, both partners do a board break attempt. Connects sparring to breaking technique.` },
      15: { title: "Snack + Board Breaking Certificates", instructions: `Snacks inside. While eating, staff write out 'Board Breaker' certificates for every child who broke a board today (write name + technique used). Present certificates one by one — call each child up, announce their name and technique, lead group in applause. Kids who didn't break today get an 'In Training' certificate and get another attempt tomorrow. Update team leaderboard. Clean up before 4 PM.` },
      16: { title: "Team Board Breaking Relay", instructions: `TEAM CHALLENGE: Split into 2 teams. Each team lines up. One at a time, each kid runs to the breaking station, breaks their board (staff hold), runs back and tags next teammate. Team that finishes first wins.\n\nFor kids who already broke today: they can attempt a harder break (more boards or different technique).\nFor kids still working on their first break: staff give extra coaching — check stance, chamber position, follow-through.\n\nEnd with a group photo of all kids holding their broken boards.` },
      17: { title: "Wind-Down, Cleanup & Parent Pickup Prep", instructions: `5:00 PM SHARP — gather on main mat.\n1. Cool-down stretch: seated forward fold, butterfly, lying twist — 20 sec each\n2. Each kid shows their broken board piece and says their technique\n3. Group chant: 'Break barriers, break boards, break limits!' x3\n4. Cleanup: collect all board pieces (save for kids to take home), store rebreakable boards, wipe down mats\n5. Kids in pickup area by 5:15 PM with bags and broken board pieces to show parents\n6. Check out ONLY to authorized adults` },
    },
    tomorrowEquipment: [
      "Rebreakable boards — check all for cracks, replace damaged ones",
      "Extra thin boards for Little Ninjas (easiest break)",
      "Print Board Breaker certificates for all kids",
      "Set up 3 breaking stations with clear floor space around each",
      "Bring extra pads for partner drills during wait time",
      "Prepare power circuit equipment: mats clear, bags accessible",
      "Camera/phone charged for group photo with broken boards",
      "Check snack supply",
    ],
  },
  {
    start: "2026-06-22", end: "2026-06-26",
    theme: "Nerf Battle Week",
    fieldTrip: true,
    hourlyPlan: {
      9: { title: "Morning Assembly & Nerf Rules Briefing", instructions: `Gather all kids on main mat. Warm-up: 10 jumping jacks, 10 high knees, arm circles. Nerf Battle Week rules: NO headshots (aim at body only), no point-blank shots (must be 5+ feet away), if hit — freeze and count to 5 then back in, no hoarding all the darts, respect the referee's call. Demonstrate safe handling of Nerf guns. Split into age groups for 10 min of basic martial arts warm-up before Nerf activities.` },
      10: { title: "Martial Arts Training Block 1 — Tactical Movement", instructions: `Connect martial arts to Nerf strategy today.\n\nLITTLE NINJAS: 'Duck and Cover' drill — on command, kids drop to a crouch (like dodging a dart). Practice 10 times. Then low crawl across the mat (like sneaking). Combine: crawl, stand, kick, crawl.\n\nDRAGON KIDS: Tactical footwork — side shuffle behind cover (use foam blocks as 'walls'), peek and strike, retreat. Partner drill: one 'shoots' (points finger), other dodges left or right. 10 reps each side, switch.\n\nTEENS: Combo + movement — throw jab-cross combo on bag, then immediately sprint to the next bag station. 5 stations, 30 sec rest between rounds. Builds the burst-and-move skill used in Nerf battles.` },
      11: { title: "Nerf Team Battle 1 — Capture the Flag", instructions: `Set up Nerf arena using foam blocks, chairs, and mats as cover. Two teams, each defends a flag (colored belt) at their base.\n\nRULES: Get hit = freeze, count to 5, back in. Grab opponent's flag and return it to your base to score. First to 3 captures wins.\n\nStaff: 2 referees (one per side), call out hits fairly. Keep energy high, cheer good moves. After each round, give 1 tactical tip to each team: 'Try sending 2 players left while 1 goes right' or 'Use cover — don't stand in the open'.\n\nPlay 3 rounds of 5 min each. Award winning team points on leaderboard.` },
      12: { title: "Lunch Break", instructions: `Collect ALL Nerf darts before lunch — assign 2 kids to dart collection duty. Wash hands, sit in rows, eat calmly. Discuss: what strategy worked best in Capture the Flag? What would you do differently? After lunch, 15 min quiet rest. Clean up all food trash before 1 PM.` },
      13: { title: "Nerf Team Battle 2 — Last Team Standing", instructions: `New game mode: Last Team Standing. 4 teams of equal size. All teams start in corners of the arena. On 'GO' — teams battle. If hit, sit down where you are. Last team with any standing player wins the round.\n\nPlay 5 rounds. Track wins on whiteboard. After each round, teams have 60 sec strategy huddle — staff circulate and give one tip per team.\n\nBonus rule for rounds 3-5: 'Medic Mode' — each team has 1 medic (designated kid). Medic can unfreeze 1 teammate by tagging them, but if medic gets hit, they're out for good.` },
      14: { title: "Martial Arts Training Block 2 — Defense & Evasion", instructions: `LITTLE NINJAS: 'Ninja Dodge' — staff gently tosses a soft ball at kids who practice dodging left or right. 10 tosses each. Then practice: if someone grabs your wrist, pull sharply toward their thumb to escape. Practice 5 times each wrist.\n\nDRAGON KIDS: Evasion circuit — 4 stations: (1) slip the jab drill with partner, (2) duck under a swinging pool noodle, (3) lateral shuffle through cones, (4) sprawl and stand up 5 times. Rotate every 3 min.\n\nTEENS: Sparring with evasion focus — no blocking allowed, only slipping, ducking, and footwork to avoid contact. 2-min rounds, rotate partners. Builds head movement and ring awareness.` },
      15: { title: "Snack + Nerf Strategy Session", instructions: `Snacks inside. While eating, run a team strategy session: each team draws their battle plan on paper (30 sec) and presents it to the group. Other teams can ask 1 question. Staff award 'Best Strategy' bonus points. Then quick physical quiz: staff calls a Nerf scenario ('You're hit, what do you do?') and kids answer. Correct answers = team points. Update leaderboard. Clean up before 4 PM.` },
      16: { title: "Nerf Grand Championship", instructions: `THE BIG BATTLE — all previous team points determine seeding. Top 2 teams face off in the Grand Championship match.\n\nFORMAT: Best of 3 rounds, Capture the Flag rules. Other kids are the audience and can cheer (no interference). Staff are referees — calls are FINAL.\n\nWhile audience waits: run a 'Fastest Dart Reload' contest — who can pick up 10 darts and reload their gun fastest? Time each kid.\n\nPresent Grand Championship team with a group high-five line from all staff and kids. Announce final leaderboard standings.` },
      17: { title: "Wind-Down, Cleanup & Parent Pickup Prep", instructions: `5:00 PM SHARP — stop all battles. Collect ALL darts (count them — you should have the same number you started with).\n1. Cool-down stretch on mat — 20 sec each position\n2. Each kid shares their best Nerf moment of the day\n3. Group chant: 'Aim true, move fast, never quit!' x3\n4. Cleanup: store all Nerf guns and darts in labeled bins, disassemble arena, wipe down mats\n5. Kids in pickup area by 5:15 PM\n6. Check out ONLY to authorized adults` },
    },
    tomorrowEquipment: [
      "Count and bag all Nerf darts — sort by color/team",
      "Check all Nerf guns for jams or broken parts",
      "Set up arena with foam blocks, chairs, mats as cover walls",
      "Prepare 4 team-colored flags (colored belts)",
      "Bring whiteboard and markers for leaderboard",
      "Print or write Grand Championship bracket",
      "Set up 4 stations for evasion circuit (pool noodle, cones, pads)",
      "Check snack supply",
    ],
  },
  {
    start: "2026-06-29", end: "2026-07-03",
    theme: "Glow Night Week",
    fieldTrip: true,
    hourlyPlan: {
      9: { title: "Morning Assembly & Glow Setup", instructions: `Gather all kids on main mat. Warm-up: 10 jumping jacks, 10 high knees, arm circles. Introduce Glow Night Week — explain that the dojo will be transformed with blacklights and glow gear for special activities. Distribute glow bracelets to each child (one per wrist). Safety: do not break glow sticks open, do not put glow liquid near eyes or mouth. Split into age groups for 10 min martial arts warm-up.` },
      10: { title: "Martial Arts Training Block 1 — Glow Strikes", instructions: `Set up blacklights in the training area. Turn off overhead lights.\n\nALL AGES: Practice strikes with glow bracelets on wrists — every punch and kick lights up! This makes technique visible and exciting.\n\nLITTLE NINJAS: 10 front kicks each leg, 10 punches each hand — count out loud together.\nDRAGON KIDS: Combo drill — jab-cross-front kick x10 rounds. Staff watch for proper form using the glow to track hand paths.\nTEENS: Shadow boxing with glow — 3-min rounds, focus on smooth combinations. Staff film 30-sec clips for kids to review their technique.` },
      11: { title: "Glow Obstacle Course", instructions: `Set up glow-themed obstacle course (use glow tape to mark boundaries, glow sticks as markers):\n1. GLOW CRAWL: crawl under a rope strung with glow sticks\n2. GLOW JUMP: jump over a line of glow sticks on the floor\n3. GLOW BALANCE: walk along a glow-tape line\n4. GLOW STRIKE: hit a glow-tape target on the bag\n5. GLOW ROLL: forward roll on mat, stand up\n\nTimed individual runs — announce each time. Top 3 in each age group win extra glow bracelets. Keep blacklights on for full effect.` },
      12: { title: "Lunch Break", instructions: `Turn overhead lights back on for lunch. Collect any broken glow sticks safely. Wash hands, sit in rows, eat calmly. Discuss: what was coolest about the glow activities? After lunch, 15 min quiet rest. Clean up all food trash before 1 PM.` },
      13: { title: "Glow Freeze Dance & Ninja Tag", instructions: `GLOW FREEZE DANCE: Blacklights on, music on. Kids dance freely. When music stops — freeze in a martial arts stance. Staff judge best stance — winner picks the next song style (fast, slow, hip hop, etc.). 5 rounds.\n\nGLOW NINJA TAG: One kid is 'It' (wears a different color glow bracelet). Tags other kids by touching their glow bracelet. Tagged kids become 'It' too. Last kid with original bracelet color wins.\n\nKeep energy high — staff participate in both games.` },
      14: { title: "Martial Arts Training Block 2 — Glow Belt Ceremony Prep", instructions: `Prepare kids for a mini glow belt ceremony at the end of the week.\n\nLITTLE NINJAS: Practice their bow, stance, and receiving a belt with both hands. Run through the ceremony 3 times.\nDRAGON KIDS: Review all techniques learned this week. Staff quiz: 'Show me a roundhouse kick. Show me a front kick. Show me a block.' Correct any form issues.\nTEENS: Combination review — each teen demonstrates their best 5-move combo to the group. Group gives feedback: 1 compliment + 1 suggestion each.` },
      15: { title: "Snack + Glow Art", instructions: `Snacks inside with lights on. After eating, glow art activity: give each kid a piece of black paper and glow-in-the-dark paint sticks (or regular neon markers). Kids draw their 'ninja symbol' or write their name in glow style. Hold papers under blacklight to see them glow. Display on the wall. Staff write each child's name on their artwork to take home. Clean up art supplies before 4 PM.` },
      16: { title: "Glow Dodgeball Championship", instructions: `Use glow-tape-wrapped foam balls for dodgeball under blacklights. Two teams. Standard dodgeball rules: hit by ball = out, catch a ball = thrower is out and one of your out teammates comes back in.\n\nPlay 5 rounds. Track wins on leaderboard. Award winning team glow bracelets.\n\nSpecial round: 'Glow Blindfold' — one player per team is blindfolded and their teammates shout directions to help them dodge. Crowd goes wild for this one.` },
      17: { title: "Wind-Down, Cleanup & Parent Pickup Prep", instructions: `5:00 PM SHARP — lights on, collect glow equipment.\n1. Cool-down stretch — 20 sec each position\n2. Each kid shares their glow highlight of the day\n3. Group chant: 'Shine bright, fight right, glow warriors!' x3\n4. Cleanup: collect all glow sticks/bracelets, store blacklights safely, wipe down mats\n5. Kids take home their glow art\n6. Kids in pickup area by 5:15 PM\n7. Check out ONLY to authorized adults` },
    },
    tomorrowEquipment: [
      "Set up blacklights in training area — test all bulbs",
      "Distribute glow bracelets (2 per child minimum)",
      "Glow tape for obstacle course boundaries and targets",
      "Glow-in-the-dark paint sticks or neon markers for art activity",
      "Black paper for glow art (1 sheet per child)",
      "Glow-tape-wrapped foam balls for dodgeball (4 minimum)",
      "Blindfolds for special dodgeball round (2 minimum)",
      "Check snack supply",
    ],
  },
  {
    start: "2026-07-07", end: "2026-07-11",
    theme: "Leadership Week",
    fieldTrip: true,
    hourlyPlan: {
      9: { title: "Morning Assembly & Leadership Intro", instructions: `Gather all kids on main mat. Warm-up: 10 jumping jacks, 10 high knees, arm circles. Leadership Week theme: this week kids learn to LEAD, not just follow. Introduce the 3 leadership rules: (1) Lead by example, (2) Lift others up, (3) Never quit. Ask: 'Who is a leader you admire and why?' Take 3-4 answers. Assign Leadership Roles for the day: Line Leader, Encouragement Captain, Equipment Manager, Cleanup Chief. Rotate roles daily.` },
      10: { title: "Martial Arts Training Block 1 — Led by Senior Students", instructions: `TEEN LEADERS lead the warm-up for Dragon Kids and Little Ninjas today.\n\nTEENS: Each teen is assigned a group of 3-4 younger kids. They lead: 10 jumping jacks, 5 front kicks each leg, 5 punches each hand. Staff observe teens for leadership skills — are they patient? Clear? Encouraging?\n\nAfter warm-up: teens teach their group ONE technique of their choice. Staff support but do not take over. This builds confidence and communication skills in teen leaders.` },
      11: { title: "Team Building Challenge — Human Knot & Tower Build", instructions: `HUMAN KNOT: Group of 8-10 kids stand in a circle, reach across and grab 2 different people's hands. Without letting go, untangle into a circle. Staff time them — try to beat 3 minutes. If group gets stuck, they can use 1 'lifeline' (ask staff for 1 hint).\n\nTOWER BUILD: Teams of 4 build the tallest tower possible using only foam blocks and mats. 5 min build time. Measure heights. Discuss: what made some towers taller? What is the leadership lesson? (Answer: plan before you build, listen to all ideas, assign roles.)` },
      12: { title: "Lunch Break", instructions: `Leadership Captain leads the lunch setup today — they direct other kids to set up the eating area, assign hand-washing order, and lead the cleanup after. Staff observe and give feedback after lunch. Discuss: what was hard about being in charge? What did you learn? 15 min quiet rest after eating. Clean up before 1 PM.` },
      13: { title: "Community Service Project", instructions: `Leadership means serving others. Today's project: DOJO IMPROVEMENT.\n\nAssign teams:\n- Team 1: Deep clean the mat area (wipe down mats with cleaning solution, staff supervise)\n- Team 2: Organize equipment room — sort pads, bags, and gear into labeled areas\n- Team 3: Write thank-you notes to staff members (give each kid a notecard and marker)\n- Team 4: Create a 'Dojo Rules' poster for the wall (large paper, markers)\n\nRotate teams every 15 min. Each team presents their completed work to the group.` },
      14: { title: "Martial Arts Training Block 2 — Teaching Drill", instructions: `Each Dragon Kid and Teen teaches a Little Ninja ONE martial arts technique.\n\nPROCESS: (1) Older kid demonstrates the technique slowly, (2) Little Ninja tries it, (3) Older kid gives one piece of positive feedback and one correction, (4) Little Ninja tries again.\n\nTechniques to choose from: front kick, roundhouse kick, jab-cross combo, high block, low block.\n\nStaff observe and grade older kids on: patience, clarity of instruction, encouragement given. Share feedback at 3 PM snack.` },
      15: { title: "Snack + Leadership Awards", instructions: `Snacks inside. Staff announce Leadership Awards based on observations throughout the day:\n- Best Teacher Award (most patient and clear)\n- Best Encourager Award (lifted others up most)\n- Best Problem Solver Award (found creative solutions)\n- Best Effort Award (never gave up)\n\nEvery kid gets recognized for something specific. Be genuine — mention a real moment you observed. Clean up before 4 PM.` },
      16: { title: "Leadership Challenge — Blindfold Obstacle Course", instructions: `BLINDFOLD CHALLENGE: Pairs of kids — one is blindfolded, one is the guide. Guide uses ONLY verbal instructions (no touching) to lead blindfolded partner through a simple obstacle course (step over, turn left, duck under).\n\nAfter each pair completes: switch roles. Debrief: 'What was it like to trust someone? What made a good guide? How does this connect to being a leader?'\n\nFinal activity: group problem-solving challenge — staff present a scenario ('The dojo is flooding, you have 2 min to save 5 things, what do you save and why?'). Teams discuss and present answers.` },
      17: { title: "Wind-Down, Cleanup & Parent Pickup Prep", instructions: `5:00 PM SHARP — gather on main mat.\n1. Cool-down stretch — 20 sec each position\n2. Each kid completes: 'Today I led by ______'\n3. Group chant: 'Lead with heart, lead with strength, lead always!' x3\n4. Cleanup: Leadership Captain directs the cleanup — staff step back and let them lead it\n5. Kids in pickup area by 5:15 PM with their thank-you notes and artwork\n6. Check out ONLY to authorized adults` },
    },
    tomorrowEquipment: [
      "Notecards and markers for thank-you notes to staff",
      "Large paper and markers for Dojo Rules poster",
      "Cleaning solution and cloths for mat cleaning project",
      "Foam blocks for tower building challenge",
      "Blindfolds for blindfold obstacle course (5 minimum)",
      "Prepare Leadership Award certificates (4 awards)",
      "Set up equipment room for organizing project",
      "Check snack supply",
    ],
  },
  {
    start: "2026-07-14", end: "2026-07-18",
    theme: "Tournament Prep Week",
    fieldTrip: true,
    hourlyPlan: {
      9: { title: "Morning Assembly & Tournament Rules", instructions: `Gather all kids on main mat. Warm-up: 10 jumping jacks, 10 high knees, dynamic stretching. Tournament Prep Week: kids learn how real martial arts tournaments work. Explain scoring: points for clean techniques, deductions for stepping out of bounds or illegal moves. Review rules: light contact only, bow before and after each match, respect the referee's decision. Demonstrate a tournament bow-in ceremony.` },
      10: { title: "Martial Arts Training Block 1 — Tournament Techniques", instructions: `Focus on the 3 highest-scoring tournament techniques:\n\n1. FRONT KICK TO BODY (2 pts): Practice 20 reps each leg. Key: chamber knee high, snap kick out and back fast, land in fighting stance.\n2. ROUNDHOUSE KICK TO BODY (2 pts): Practice 20 reps each leg. Key: pivot on standing foot, hip rotation drives the kick, snap back.\n3. REVERSE PUNCH (1 pt): Practice 20 reps each hand. Key: rotate hip into punch, full extension, snap back to guard.\n\nAll age groups practice all 3. Staff correct form — tournament judges look for clean technique, not power.` },
      11: { title: "Forms (Kata) Practice", instructions: `Each age group practices their forms:\n\nLITTLE NINJAS: Basic 8-move form — staff lead, kids follow. Practice 5 times through. Focus on remembering the sequence.\nDRAGON KIDS: Their current belt-level form. Run through 3 times slowly, then 2 times at full speed. Staff correct stances and transitions.\nTEENS: Advanced form — run through 3 times. Then each teen performs solo while others watch. Group gives 1 compliment + 1 suggestion each.\n\nForms count for 30% of tournament scores — this matters.` },
      12: { title: "Lunch Break", instructions: `Wash hands, sit in rows, eat calmly. Discuss: what is the hardest part of tournament competition? How do you handle nerves? Share a story about competition nerves and how to channel them into energy. After lunch, 15 min quiet rest — this is important for afternoon sparring. Clean up before 1 PM.` },
      13: { title: "Sparring Drills — Point Fighting", instructions: `GEAR UP: all sparring participants need headgear, chest protector, gloves, shin guards, mouthguard. Check that all kids have proper gear before sparring begins.\n\nPOINT FIGHTING FORMAT: First to 5 points wins. Stop after each point, reset to center, continue. Referee calls points.\n\nLITTLE NINJAS: Light touch sparring with foam noodles only (no contact sparring for under 6).\nDRAGON KIDS: Light contact point fighting. Staff referee each match.\nTEENS: Full point fighting with all techniques. Staff referee, track scores on whiteboard.` },
      14: { title: "Martial Arts Training Block 2 — Weak Side Training", instructions: `Tournament fighters who can attack from both sides are harder to defend against.\n\nALL AGES: Switch to non-dominant side for all drills today.\n- If you kick with right leg, practice left leg kicks x20\n- If you punch with right hand, practice left hand punches x20\n- Shadow box for 2 min using only non-dominant side\n\nThis is hard and frustrating — that is the point. Discuss: why do we train our weak side? (Answer: in a real tournament or self-defense situation, you may not get to choose which side to use.)` },
      15: { title: "Snack + Tournament Bracket", instructions: `Snacks inside. While eating, staff set up the in-house tournament bracket on the whiteboard. Explain how brackets work: win = advance, lose = go to consolation bracket (everyone gets to compete twice minimum). Answer questions about the format. Kids can see who they might face. Keep it fun — remind everyone the goal is to compete your best, not just to win. Clean up before 4 PM.` },
      16: { title: "Mini In-House Tournament — Round 1", instructions: `RUN THE TOURNAMENT. Follow the bracket. Each match: 2 min time limit or first to 5 points.\n\nCEREMONY: Before each match, both competitors bow to the referee, bow to each other, take fighting stance. After match, bow to each other, bow to referee, shake hands.\n\nStaff roles: 1 referee per match, 1 scorekeeper, 1 managing waiting area (kids do pushups/kicks while waiting).\n\nAnnounce results after each match. Keep energy high — cheer for everyone.` },
      17: { title: "Wind-Down, Cleanup & Parent Pickup Prep", instructions: `5:00 PM SHARP — gather on main mat.\n1. Cool-down stretch — 20 sec each position\n2. Each kid shares: 'What I will work on before tomorrow's tournament'\n3. Group chant: 'Train hard, compete hard, respect always!' x3\n4. Cleanup: store all sparring gear, wipe down mats\n5. Kids in pickup area by 5:15 PM\n6. Check out ONLY to authorized adults\n7. Remind parents: bring all sparring gear tomorrow — tournament continues` },
    },
    tomorrowEquipment: [
      "Check all sparring gear — headgear, chest protectors, gloves, shin guards",
      "Set up tournament bracket on whiteboard",
      "Prepare tournament score sheets (one per match)",
      "Ensure all kids have mouthguards — check enrollment list",
      "Set up forms competition area with clear floor space",
      "Prepare tournament medals or certificates for top 3 per age group",
      "Charge phone for filming tournament matches",
      "Check snack supply",
    ],
  },
  {
    start: "2026-07-21", end: "2026-07-25",
    theme: "Water Gun Fun Week",
    fieldTrip: true,
    hourlyPlan: {
      9: { title: "Morning Assembly & Water Safety", instructions: `Gather all kids on main mat. Warm-up: 10 jumping jacks, 10 high knees, arm circles. Water Gun Fun Week rules: no headshots, minimum 5-foot distance before firing, no water inside the dojo building, respect when someone says stop. Distribute water guns — one per child. Show proper filling technique at the outdoor spigot. Split into age groups for 10 min martial arts warm-up before heading outside.` },
      10: { title: "Martial Arts Training Block 1 — Evasion & Speed", instructions: `INSIDE — dry block before water activities.\n\nFocus: speed and evasion (connects to dodging water gun shots).\n\nLITTLE NINJAS: Speed drill — on 'GO' kids sprint to the wall and back. First back wins. 5 rounds. Then: dodge the noodle — staff swings pool noodle slowly, kids duck or jump over.\nDRAGON KIDS: Lateral shuffle relay — 4 cones in a line, shuffle left-right between them as fast as possible. Time each kid. Then: reaction drill — staff holds up colored cards, kids do the matching move (red = front kick, blue = punch, yellow = duck).\nTEENS: Agility ladder + bag combo — full ladder sequence then immediately 5 strikes on bag. 5 rounds, 30 sec rest.` },
      11: { title: "Water Gun Team Battle 1 — Territory Control", instructions: `OUTSIDE. Divide the outdoor area into 4 zones with cones. 2 teams start in opposite corners.\n\nRULES: Get hit = go to your team's base and count to 10, then back in. Control a zone by having more teammates in it than opponents. After 5 min, count zones controlled — team with more zones wins the round.\n\nPlay 3 rounds. Give 60-sec strategy huddle between rounds. Staff give one tactical tip per team. Award winning team points on leaderboard.` },
      12: { title: "Lunch Break + Dry Off", instructions: `Bring all kids inside. Towels at the door — dry off before entering. Kids change into dry clothes if available. Wash hands, sit in rows, eat calmly. Discuss: what strategy worked best? After lunch, 15 min quiet rest. Clean up all food trash before 1 PM.` },
      13: { title: "Water Gun Obstacle Course Race", instructions: `OUTSIDE. Set up obstacle course with water gun challenges:\n1. FILL STATION: fill water gun at bucket before starting\n2. CRAWL ZONE: crawl under rope while opponents try to hit you with water guns\n3. SPRINT ZONE: sprint 20 feet to cover\n4. SHOOT TARGETS: hit 3 paper targets with water gun before advancing\n5. FINISH LINE: sprint to finish\n\nTimed individual runs. Announce each time. Top 3 in each age group win extra water gun ammo (pre-filled water balloons). Keep energy high.` },
      14: { title: "Martial Arts Training Block 2 — Conditioning", instructions: `INSIDE — dry off before coming in.\n\nConditioning circuit — 3 rounds:\nStation 1: 10 pushups\nStation 2: 10 squats\nStation 3: 10 bag strikes (alternating hands)\nStation 4: 20-sec plank\nStation 5: 5 burpees\n\nRest 30 sec between rounds. Staff count reps and encourage. Little Ninjas do modified versions (knee pushups, 10-sec plank). Keep music on to maintain energy.` },
      15: { title: "Snack + Water Gun Trivia", instructions: `Snacks inside. Water gun trivia game:\n- Q: 'What is the safe minimum distance before firing?' A: 5 feet\n- Q: 'Name 3 martial arts moves we practiced this week'\n- Q: 'What does evasion mean?' A: moving to avoid being hit\n- Q: 'What is the #1 rule of Water Gun Week?' A: no headshots\n\nTeam points for correct answers. Update leaderboard. Clean up before 4 PM.` },
      16: { title: "Water Gun Grand Battle — All vs All", instructions: `THE BIG ONE. All kids vs all kids — every person for themselves. Last person dry (least hits) wins.\n\nRULES: Count your hits on honor system. After 5 min, everyone reports their hit count honestly. Lowest count wins. Staff observe and verify.\n\nAFTER: Team relay race — fill a bucket using only water guns (shoot into the bucket from 10 feet away). Team that fills their bucket first wins.\n\nBring all kids inside by 4:45 PM to dry off before 5 PM wind-down.` },
      17: { title: "Wind-Down, Cleanup & Parent Pickup Prep", instructions: `5:00 PM SHARP — all kids inside, dry, bags packed.\n1. Cool-down stretch — 20 sec each position\n2. Each kid shares their water gun highlight\n3. Group chant: 'Fast feet, sharp eyes, water warriors!' x3\n4. Cleanup: collect all water guns, drain and store, collect all cones and targets outside\n5. Kids in pickup area by 5:15 PM\n6. Check out ONLY to authorized adults` },
    },
    tomorrowEquipment: [
      "Fill all water guns before 8 AM (assign to first staff in)",
      "Set up outdoor territory zones with cones (4 zones)",
      "Prepare obstacle course targets (paper targets x3, rope for crawl zone)",
      "Extra towels for each child",
      "Remind parents: pack change of dry clothes every day this week",
      "Buckets for relay race (4 buckets)",
      "Check snack supply",
      "Agility ladders and cones for 10 AM training block",
    ],
  },
  {
    start: "2026-07-28", end: "2026-08-01",
    theme: "Black Belt Bootcamp",
    fieldTrip: true,
    hourlyPlan: {
      9: { title: "Morning Assembly & Bootcamp Mindset", instructions: `Gather all kids on main mat. Bootcamp warm-up: 20 jumping jacks, 10 pushups, 10 squats, 10 high knees — no stopping, no complaining. This week is the hardest week of camp — that is the point. Introduce the Black Belt mindset: (1) Never quit, (2) Push past your limit, (3) Discipline over motivation. Ask: 'What is the difference between a black belt and a white belt?' (Answer: a black belt is a white belt who never quit.) Split into age groups for intense warm-up.` },
      10: { title: "Martial Arts Training Block 1 — Intensity Drills", instructions: `FULL INTENSITY today — push every kid to their limit safely.\n\nLITTLE NINJAS: 3 rounds of: 10 kicks, 10 punches, 10 jumping jacks. Rest 20 sec between rounds. Staff cheer loudly for every rep.\nDRAGON KIDS: Bag circuit — 30 sec max strikes on bag, 10 sec rest, repeat 5 rounds. Count total strikes — try to beat your own score each round.\nTEENS: Sparring gauntlet — one teen faces a fresh opponent every 1 min for 5 consecutive rounds. No rest between rounds. Builds mental toughness and endurance.` },
      11: { title: "Board Breaking — Advanced Techniques", instructions: `ADVANCED BOARD BREAKING for all ages:\n\nLITTLE NINJAS: First-time breakers get their first break today. Staff hold board at chest height. Celebrate every break.\nDRAGON KIDS: Multi-board breaks — 2 boards minimum. Advanced kids attempt 3 boards. Staff hold boards securely.\nTEENS: Advanced breaks — options: (1) jumping front kick, (2) spinning back kick, (3) elbow strike through 2 boards. Each teen attempts their chosen technique. Staff spot for safety on jumping techniques.\n\nEvery break is celebrated with the whole group. Kids who don't break on first attempt get coaching and try again.` },
      12: { title: "Lunch Break", instructions: `Wash hands, sit in rows, eat calmly. Bootcamp rule: eat everything on your plate — fuel your body. Discuss: what was the hardest thing you did today? How did you push through it? After lunch, 10 min quiet rest (shorter than usual — bootcamp schedule). Clean up before 1 PM.` },
      13: { title: "Conditioning Circuit — Black Belt Standard", instructions: `This is the Black Belt fitness test circuit. All ages do modified versions:\n\nROUND 1: 20 pushups (Little Ninjas: 10 knee pushups)\nROUND 2: 20 squats\nROUND 3: 20 sit-ups\nROUND 4: 1-min plank (Little Ninjas: 30 sec)\nROUND 5: 20 burpees (Little Ninjas: 10 jump squats)\n\nRest 1 min between rounds. Staff do the circuit WITH the kids — lead by example. Track who completes all 5 rounds — they earn a 'Black Belt Bootcamp' sticker.` },
      14: { title: "Martial Arts Training Block 2 — Combinations & Sparring", instructions: `DRAGON KIDS & TEENS: Advanced combination work:\n- Combo 1: jab-cross-hook-front kick\n- Combo 2: roundhouse-spinning back kick (teens only)\n- Combo 3: double leg takedown defense + counter strike\n\nPractice each combo 10 times on bag. Then light sparring — focus on using the combos in a live situation.\n\nLITTLE NINJAS: 'Black Belt Obstacle Course' — run, jump over pad, front kick the bag, forward roll, stand up, punch the air. Repeat 5 times. Time each run.` },
      15: { title: "Snack + Mental Toughness Talk", instructions: `Snacks inside. Staff lead a discussion on mental toughness:\n- 'Tell me about a time you wanted to quit but didn't. What happened?'\n- 'What does it mean to have a black belt mindset OFF the mat?'\n- 'Name one thing you will do this week that scares you a little'\n\nShare a real story about perseverance. Keep it authentic. Kids who share get a team point. Clean up before 4 PM.` },
      16: { title: "Black Belt Bootcamp Final Challenge", instructions: `THE FINAL CHALLENGE — complete all of these to earn the 'Black Belt Bootcamp' certificate:\n1. Break a board (any technique)\n2. Complete 10 consecutive pushups without stopping\n3. Hold a plank for 30 seconds\n4. Demonstrate 3 different kicks with correct form\n5. Spar for 1 full minute without quitting\n\nStaff track each kid's completion on a checklist. Kids who complete all 5 get their certificate NOW. Kids who don't complete all 5 have until Friday to finish.\n\nPresent completed certificates with a formal bow ceremony.` },
      17: { title: "Wind-Down, Cleanup & Parent Pickup Prep", instructions: `5:00 PM SHARP — gather on main mat.\n1. Cool-down stretch — 30 sec each position (longer today — bodies worked hard)\n2. Each kid completes: 'Today I proved I am ______'\n3. Group chant: 'Black belt mind, black belt body, black belt life!' x3\n4. Cleanup: store all equipment, wipe down mats and bags\n5. Kids in pickup area by 5:15 PM with certificates\n6. Check out ONLY to authorized adults` },
    },
    tomorrowEquipment: [
      "Rebreakable boards — check all, replace damaged ones",
      "Sparring gear for all teens and advanced Dragon Kids",
      "Black Belt Bootcamp certificates (print one per child)",
      "Completion checklist for final challenge (one per child)",
      "Agility ladders and cones for training blocks",
      "Extra pads for combination drills",
      "Stickers for kids who complete the full conditioning circuit",
      "Check snack supply",
    ],
  },
  {
    start: "2026-08-04", end: "2026-08-08",
    theme: "Summer Finale",
    fieldTrip: true,
    hourlyPlan: {
      9: { title: "Morning Assembly & Finale Week Intro", instructions: `Gather all kids on main mat. Warm-up: 10 jumping jacks, 10 high knees, arm circles. Welcome to the LAST week of summer camp! This week we celebrate everything we've learned and accomplished. Introduce the week: awards ceremony on Friday, pizza party, showcase for parents. Ask: 'What was your favorite week of camp? What did you learn this summer?' Take 5-6 answers. Assign kids to showcase groups — each group will perform a demonstration for parents on Friday.` },
      10: { title: "Martial Arts Training Block 1 — Showcase Prep", instructions: `Each age group prepares their showcase demonstration:\n\nLITTLE NINJAS: 8-move form + board break + 'Ninja Oath' recitation. Practice 3 times through. Staff help with spacing and timing.\nDRAGON KIDS: Combination demonstration — each kid performs their best 5-move combo for the group. Then group forms demonstration. Practice 3 times.\nTEENS: Sparring demonstration (light contact, choreographed to look impressive) + board breaking. Choreograph a 60-sec sparring sequence — plan it together, practice 3 times.` },
      11: { title: "Summer Camp Olympics — Event 1 & 2", instructions: `SUMMER CAMP OLYMPICS — all week we run Olympic events and track team scores.\n\nEVENT 1 — SPEED KICK CONTEST: Each kid does as many front kicks as possible in 30 sec. Count and record. Top 3 per age group advance to finals on Friday.\n\nEVENT 2 — PUSHUP CHALLENGE: Max pushups without stopping. Count and record. Top 3 per age group advance to finals.\n\nPost all scores on the leaderboard. Cheer for every kid — celebrate personal bests, not just top scores.` },
      12: { title: "Lunch Break", instructions: `Wash hands, sit in rows, eat calmly. Discuss: what are you most proud of from this summer? What skill improved the most? After lunch, 15 min quiet rest. Clean up all food trash before 1 PM.` },
      13: { title: "Summer Camp Olympics — Event 3 & 4", instructions: `EVENT 3 — OBSTACLE COURSE RACE: Full obstacle course timed run (same course from Week 1 Ninja Warrior). Each kid runs once. Record times. Top 3 per age group advance to finals.\n\nEVENT 4 — BOARD BREAKING SPEED: Each kid has 3 attempts to break their board. Time from 'GO' to break. Fastest break per age group wins.\n\nUpdate leaderboard. Announce running team totals. Build excitement for Friday's finals.` },
      14: { title: "Martial Arts Training Block 2 — Best of Summer Review", instructions: `Staff lead a 'Best of Summer' review — teach the BEST drill from each week:\n- Week 1 Ninja: Obstacle course stations\n- Week 2 Water War: Evasion drill\n- Week 3 Board Breaking: Palm heel technique\n- Week 4 Nerf: Tactical movement\n- Week 5 Glow: Glow strike combos\n- Week 6 Leadership: Teaching drill\n- Week 7 Tournament: Point fighting\n- Week 8 Water Gun: Territory control\n- Week 9 Bootcamp: Conditioning circuit\n\nKids vote for their #1 favorite drill — run it for 10 min at the end.` },
      15: { title: "Snack + Memory Book", instructions: `Snacks inside. Give each kid a 'Summer Camp Memory Book' page (blank paper with their name at top). They draw/write: (1) favorite week, (2) best friend made at camp, (3) hardest thing they did, (4) what they'll remember forever. Staff write a personal note on each child's page. These go home on Friday. Clean up before 4 PM.` },
      16: { title: "Showcase Rehearsal — Full Run-Through", instructions: `Full rehearsal of Friday's parent showcase. Run it exactly as it will happen on Friday:\n1. All kids line up by age group\n2. Staff introduce each group\n3. Each group performs their demonstration\n4. Board breaking finale — all kids who want to break, break\n5. Awards ceremony preview — practice receiving awards (bow, both hands, thank you)\n\nTime the full rehearsal — should be 30-40 min. Adjust if too long. Give feedback after each group: 1 thing to improve before Friday.` },
      17: { title: "Wind-Down, Cleanup & Parent Pickup Prep", instructions: `5:00 PM SHARP — gather on main mat.\n1. Cool-down stretch — 20 sec each position\n2. Each kid shares: 'One thing I will remember from this summer'\n3. Group chant: 'MyDojo, all day, every day!' x3\n4. Cleanup: store all equipment, wipe down mats\n5. Kids in pickup area by 5:15 PM\n6. Check out ONLY to authorized adults\n7. Remind kids: FRIDAY is the big showcase — invite your family!` },
    },
    tomorrowEquipment: [
      "Print Summer Camp Memory Book pages (one per child)",
      "Set up Olympic leaderboard on whiteboard",
      "Obstacle course equipment for Event 3",
      "Rebreakable boards for Event 4 speed breaking",
      "Prepare showcase performance order list",
      "Awards and certificates for Friday ceremony",
      "Pizza order for Friday party — confirm count and dietary restrictions",
      "Check snack supply",
    ],
  },
];

function getCurrentTheme(dateStr: string) {
  return THEME_WEEKS.find(w => dateStr >= w.start && dateStr <= w.end) ?? THEME_WEEKS[0];
}

function getCdtDateStr(now: Date): string {
  // CDT = UTC-5
  const cdt = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return cdt.toISOString().slice(0, 10);
}

function getCdtHour(now: Date): number {
  const cdt = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return cdt.getUTCHours();
}

function getDayOfWeek(now: Date): number {
  const cdt = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return cdt.getUTCDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
}

// ── Hourly handler ───────────────────────────────────────────────────────────
export async function handleKaiCampHourly(req: Request, res: Response) {
  try {
    const now = new Date();
    const dow = getDayOfWeek(now);
    const cdtHour = getCdtHour(now);
    const dateStr = getCdtDateStr(now);

    // Only Mon–Fri
    if (dow < 1 || dow > 5) {
      return res.json({ ok: true, skipped: "weekend" });
    }
    // Only during camp hours 9 AM–5 PM CDT
    if (cdtHour < 9 || cdtHour > 17) {
      return res.json({ ok: true, skipped: "outside-camp-hours" });
    }
    // Only during camp season June 1 – Aug 10
    if (dateStr < "2026-06-01" || dateStr > "2026-08-10") {
      return res.json({ ok: true, skipped: "outside-camp-season" });
    }

    const week = getCurrentTheme(dateStr);
    const hourPlan = (week.hourlyPlan as Record<number, { title: string; instructions: string }>)[cdtHour];
    const hourLabel = cdtHour <= 12 ? `${cdtHour}:00 AM` : `${cdtHour - 12}:00 PM`;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNames[dow];

    let message: string;

    if (hourPlan) {
      // Use LLM to format the detailed plan into a crisp, actionable SMS
      const systemPrompt = `You are Kai, the AI operations assistant for MyDojo Martial Arts & Fitness Summer Camp in Tomball, TX.
You send hourly staff instructions via SMS. Be direct, specific, and energetic.

Today: ${dayName}, ${dateStr}
Current time: ${hourLabel} CDT
Week theme: ${week.theme}
No field trips this week: ${!week.fieldTrip ? "YES, stay at dojo all day" : "Field trips may be scheduled"}

The activity plan for this hour is:
TITLE: ${hourPlan.title}
INSTRUCTIONS: ${hourPlan.instructions}

Write a staff SMS (max 600 chars) that:
1. Starts with "[Kai] ${hourLabel} — ${hourPlan.title}"
2. Gives the 2-3 most critical action items staff need to do RIGHT NOW
3. Mentions any age-group splits if relevant
4. Ends with "— Kai"

Be specific. Use action verbs. No fluff. Staff need to read this and know exactly what to do immediately.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate the ${hourLabel} staff SMS.` }
        ]
      });

      message = (response as any)?.choices?.[0]?.message?.content ??
        `[Kai] ${hourLabel} — ${hourPlan.title}: ${hourPlan.instructions.slice(0, 400)} — Kai`;
    } else {
      message = `[Kai] ${hourLabel} — ${week.theme}: Keep energy high, check in with each age group, stay on schedule. — Kai`;
    }

    // Send to all staff
    const results = await Promise.allSettled(
      STAFF_PHONES.map(s => sendSms({ to: s.phone, message: String(message).slice(0, 600) }))
    );

    const sent = results.filter(r => r.status === "fulfilled" && (r as any).value?.success).length;
    console.log(`[Kai Camp Hourly] ${hourLabel} ${dateStr} — Sent to ${sent}/${STAFF_PHONES.length} staff. Message: ${String(message).slice(0, 100)}...`);

    return res.json({ ok: true, hour: hourLabel, theme: week.theme, activity: hourPlan?.title, sent, total: STAFF_PHONES.length, message: String(message).slice(0, 200) });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[Kai Camp Hourly] Error:", error);
    return res.status(500).json({ error, timestamp: new Date().toISOString() });
  }
}

// ── Daily summary handler ────────────────────────────────────────────────────
export async function handleKaiCampSummary(req: Request, res: Response) {
  try {
    const now = new Date();
    const dow = getDayOfWeek(now);
    const dateStr = getCdtDateStr(now);

    // Only Mon–Fri
    if (dow < 1 || dow > 5) {
      return res.json({ ok: true, skipped: "weekend" });
    }
    // Only during camp season
    if (dateStr < "2026-06-01" || dateStr > "2026-08-10") {
      return res.json({ ok: true, skipped: "outside-camp-season" });
    }
    // Only fire between 5:30 PM and 6:30 PM CDT (22:30–23:30 UTC)
    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const utcMinutes = utcHour * 60 + utcMin;
    if (utcMinutes < 22 * 60 + 30 || utcMinutes > 23 * 60 + 30) {
      return res.json({ ok: true, skipped: "outside-summary-window", utcHour, utcMin });
    }

    const week = getCurrentTheme(dateStr);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNames[dow];
    const isFriday = dow === 5;

    // Get tomorrow's info
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDow = getDayOfWeek(tomorrowDate);
    const tomorrowDateStr = getCdtDateStr(tomorrowDate);
    const tomorrowWeek = getCurrentTheme(tomorrowDateStr);

    // Build tomorrow's plan preview
    const tomorrowHourPlan9 = (tomorrowWeek.hourlyPlan as Record<number, { title: string; instructions: string }>)[9];

    const systemPrompt = `You are Kai, the AI operations assistant for MyDojo Martial Arts & Fitness Summer Camp in Tomball, TX.
It is 6 PM CDT — end of camp day. Write the daily summary SMS for staff.

Today: ${dayName}, ${dateStr}
Today's theme: ${week.theme}
${isFriday ? "Tomorrow is Saturday — no camp. Next camp day is Monday." : `Tomorrow: ${dayNames[tomorrowDow]}, ${tomorrowDateStr}, Theme: ${tomorrowWeek.theme}`}

Today's activities ran:
- 9 AM: ${(week.hourlyPlan as any)[9]?.title ?? "Morning Assembly"}
- 10 AM: ${(week.hourlyPlan as any)[10]?.title ?? "Training Block 1"}
- 11 AM: ${(week.hourlyPlan as any)[11]?.title ?? "Activity Block 1"}
- 12 PM: Lunch Break
- 1 PM: ${(week.hourlyPlan as any)[13]?.title ?? "Activity Block 2"}
- 2 PM: ${(week.hourlyPlan as any)[14]?.title ?? "Training Block 2"}
- 3 PM: ${(week.hourlyPlan as any)[15]?.title ?? "Snack + Cool-Down"}
- 4 PM: ${(week.hourlyPlan as any)[16]?.title ?? "Final Challenge"}
- 5 PM: Wind-Down & Pickup

Tomorrow's equipment needed:
${(isFriday ? tomorrowWeek : week).tomorrowEquipment.map((e: string, i: number) => `${i + 1}. ${e}`).join("\n")}

Write a 2-part SMS (max 600 chars total):
PART 1 — "DAILY WRAP: [2-3 sentences recapping today's highlights and energy level]"
PART 2 — "TOMORROW'S PREP: [bullet list of the 5 most critical equipment/setup items for tomorrow]"
${isFriday ? "Since tomorrow is the weekend, give Monday's prep list." : ""}
Sign off as "— Kai | MyDojo Camp"`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the 6 PM end-of-day summary for ${week.theme} on ${dateStr}.` }
      ]
    });

    const message = (response as any)?.choices?.[0]?.message?.content ??
      `[Kai] DAILY WRAP: Great day of ${week.theme}! Kids pushed hard and had fun. TOMORROW'S PREP: ${week.tomorrowEquipment.slice(0, 3).join(", ")}. — Kai | MyDojo Camp`;

    // Send to all staff
    const results = await Promise.allSettled(
      STAFF_PHONES.map(s => sendSms({ to: s.phone, message: String(message).slice(0, 600) }))
    );

    const sent = results.filter(r => r.status === "fulfilled" && (r as any).value?.success).length;
    console.log(`[Kai Camp Summary] ${dateStr} — Sent to ${sent}/${STAFF_PHONES.length} staff`);

    return res.json({ ok: true, date: dateStr, theme: week.theme, sent, total: STAFF_PHONES.length, message: String(message).slice(0, 200) });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[Kai Camp Summary] Error:", error);
    return res.status(500).json({ error, timestamp: new Date().toISOString() });
  }
}
