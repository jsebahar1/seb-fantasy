// Jake's personal round-by-round draft guide.
// Edit targets/decent/avoids arrays to fill in rounds 2–16.
// Round 1: ranked pool (take best available).
// Rounds 17–19: special picks.

const emptyPositions = () => ({
  QB: { targets: [], fallbacks: [], avoids: [] },
  RB: { targets: [], fallbacks: [], avoids: [] },
  WR: { targets: [], fallbacks: [], avoids: [] },
  TE: { targets: [], fallbacks: [], avoids: [] },
});

export const JAKE_DRAFT = [
  // ── Round 1: pool ──────────────────────────────────────────────────────────
  {
    round: 1,
    type: 'pool',
    strategy: 'Take the highest-ranked player still on the board. This is a deep class at the top — any of these 12 is a safe pick 1.',
    players: [
      { rank: 1,  name: 'Jahmyr Gibbs',         pos: 'RB', team: 'DET' },
      { rank: 2,  name: 'Bijan Robinson',         pos: 'RB', team: 'ATL' },
      { rank: 3,  name: 'Puka Nacua',             pos: 'WR', team: 'LAR' },
      { rank: 4,  name: "Ja'Marr Chase",          pos: 'WR', team: 'CIN' },
      { rank: 5,  name: 'Christian McCaffrey',    pos: 'RB', team: 'SF'  },
      { rank: 6,  name: 'Jaxon Smith-Njigba',     pos: 'WR', team: 'SEA' },
      { rank: 7,  name: 'Jonathan Taylor',        pos: 'RB', team: 'IND' },
      { rank: 8,  name: 'Amon-Ra St. Brown',      pos: 'WR', team: 'DET' },
      { rank: 9,  name: 'CeeDee Lamb',            pos: 'WR', team: 'DAL' },
      { rank: 10, name: 'James Cook',             pos: 'RB', team: 'BUF' },
      { rank: 11, name: 'Saquon Barkley',         pos: 'RB', team: 'PHI' },
      { rank: 12, name: 'Jettas',                 pos: 'RB', team: 'MIN' },
    ],
  },

  // ── Rounds 2–15: tiered by position ───────────────────────────────────────
  // Targets  = ADP in range, Jake rank is BETTER (undervalued — a steal)
  // Fallbacks = ADP and Jake rank both agree on the round
  // Avoids   = ADP in range, Jake rank is WORSE (overvalued by the market)
  {
    round: 2, // ADP 13–24
    type: 'tiered',
    strategy: 'Took an RB in Round 1? Take the best player available. Took a WR? Lock in your RB1 here — the drop-off after this tier is steep.',
    positions: {
      QB: {
        targets:   [],
        fallbacks: [],
        avoids:    ['Josh Allen'], // ADP 16, Jake rank 37 — market overvalues him here
      },
      RB: {
        targets:   [],
        fallbacks: ["De'Von Achane", 'Ashton Jeanty', 'Kenneth Walker', 'Omarion Hampton', 'Chase Brown', 'Derrick Henry'],
        avoids:    [],
      },
      WR: {
        targets:   [],
        fallbacks: ['Drake London', 'George Pickens', 'AJ Brown'],
        avoids:    [],
      },
      TE: {
        targets:   [],
        fallbacks: ['Brock Bowers'],
        avoids:    ['Trey McBride'], // ADP 22, Jake rank 30
      },
    },
  },
  {
    round: 3, // ADP 25–36
    type: 'tiered',
    strategy: 'Lean RB, but peek at TE and WR. If you are sitting at 1 RB / 1 WR you have flexibility — grab the best value, with a slight tilt toward securing your RB2.',
    positions: {
      QB: {
        targets:   [],
        fallbacks: [],
        avoids:    ['Lamar Jackson'], // ADP 29, Jake rank 57
      },
      RB: {
        targets:   ['Breece Hall'],
        fallbacks: ['Jeremiyah Love', 'Kyren Williams', 'Javonte Williams'],
        avoids:    [],
      },
      WR: {
        targets:   ['Malik Nabers', 'George Pickens', 'AJ Brown', 'Nico Collins', 'Chris Olave'],
        fallbacks: ['Rashee Rice', 'Tee Higgins'],
        avoids:    ['Tetairoa McMillan'], // ADP 33, Jake rank 41
      },
      TE: {
        targets:   ['Brock Bowers'], // ADP 21/Jake 23 — fell from R2
        fallbacks: [],
        avoids:    ['Colston Loveland'], // ADP 35, Jake rank 45
      },
    },
  },
  {
    round: 4, // ADP 37–48
    type: 'tiered',
    strategy: 'Starting to get hot. If Josh Allen somehow fell this far take him. Otherwise grab someone who fell from the previous round. Huge WR value available if nobody dropped.',
    positions: {
      QB: {
        targets:   [],
        fallbacks: [],
        avoids:    ['Drake Maye', 'Joe Burrow'], // Maye ADP 41 / Jake 69, Burrow ADP 47 / Jake 73
      },
      RB: {
        targets:   ['Javonte Williams', 'Travis Etienne'], // Williams ADP 34/Jake 29 — fell from R3; Etienne ADP 46/Jake 28
        fallbacks: ['Bucky Irving', 'Cam Skattebo'],
        avoids:    ['Josh Jacobs'], // never draft
      },
      WR: {
        targets:   ['Tee Higgins', 'Terry McLaurin', 'DeVonta Smith', 'Zay Flowers', 'Garrett Wilson'], // Higgins ADP 36/Jake 32 — fell from R3; McLaurin user pick; Smith/Flowers/Wilson round 3 value
        fallbacks: ['Emeka Egbuka', 'Ladd McConkey', 'Jaylen Waddle'],
        avoids:    [],
      },
      TE: {
        targets:   [],
        fallbacks: [],
        avoids:    [],
      },
    },
  },
  {
    round: 5, // ADP 49–60
    type: 'tiered',
    strategy: 'Look for fallers at RB and WR first. If nobody dropped, this is the spot to grab a QB — solid options still available here.',
    positions: {
      QB: {
        targets:   [],
        fallbacks: [],
        avoids:    ['Jalen Hurts'], // ADP 55, Jake rank 64
      },
      RB: {
        targets:   ['Travis Etienne', "D'Andre Swift", 'David Montgomery'], // Etienne ADP 46/Jake 28 — fell from R4; Swift ADP 50/Jake 40, Montgomery ADP 52/Jake 47
        fallbacks: ['Quinshon Judkins', 'TreVeyon Henderson'],
        avoids:    [],
      },
      WR: {
        targets:   ['Garrett Wilson', 'Jaylen Waddle', 'Terry McLaurin'], // Wilson ADP 45/Jake 33 — fell from R4; Waddle ADP 48/Jake 43 — fell from R4; McLaurin ADP 59/Jake 42
        fallbacks: ['Davante Adams', 'Luther Burden', 'Jameson Williams', 'DJ Moore'],
        avoids:    [],
      },
      TE: {
        targets:   [],
        fallbacks: [],
        avoids:    ['Tyler Warren', 'Sam LaPorta'], // Warren ADP 49/Jake 65, LaPorta ADP 56/Jake 84
      },
    },
  },
  {
    round: 6, // ADP 61–72
    type: 'tiered',
    strategy: 'Fill out your roster and grab the best player at value. No strong positional lean here — just take whoever fell.',
    positions: {
      QB: {
        targets:   [],
        fallbacks: ['Jayden Daniels'], // ADP 61, Jake rank 62
        avoids:    ['Caleb Williams'], // Williams ADP 64/Jake 75 — Herbert moved to R7 target
      },
      RB: {
        targets:   ['Bhayshul Tuten', 'Jadarian Price'], // Tuten ADP 62/Jake 53, Price ADP 69/Jake 58
        fallbacks: [],
        avoids:    [],
      },
      WR: {
        targets:   ['Luther Burden', 'Jameson Williams', 'Terry McLaurin', 'DJ Moore', 'Mike Evans', 'Christian Watson'], // Burden ADP 57/Jake 49, Williams ADP 58/Jake 52 — fell from R5; McLaurin ADP 59/Jake 42, Moore ADP 60/Jake 55 — fell from R5; Evans ADP 65/Jake 51, Watson ADP 71/Jake 60
        fallbacks: ['Rome Odunze', 'Carnell Tate'],
        avoids:    [],
      },
      TE: {
        targets:   [],
        fallbacks: [],
        avoids:    ['Tucker Kraft', 'Kyle Pitts', 'Harold Fannin'], // Kraft/Jake 78, Pitts/Jake 96, Fannin/Jake 98
      },
    },
  },
  {
    round: 7, // ADP 73–84
    type: 'tiered',
    strategy: "Really think QB if you haven't taken one yet. Don't be afraid to reach for Mahomes or Dak if you're still without a QB.",
    positions: {
      QB: {
        targets:   ['Justin Herbert'], // ADP 72/Jake 74 — user pick; fell from R6
        fallbacks: [],
        avoids:    ['Dak Prescott','Patrick Mahomes'], // ADP 76, Jake rank 91
      },
      RB: {
        targets:   ['Jadarian Price', 'Jaylen Warren', 'Rhamondre Stevenson', 'Tony Pollard'], // Price ADP 69/Jake 58 — fell from R6; all others Jake round 6 value
        fallbacks: ['Marshawn Lloyd'],
        avoids:    ['RJ Harvey'], // ADP 74, Jake rank 90
      },
      WR: {
        targets:   ['Christian Watson', 'DK Metcalf', 'Brian Thomas Jr', 'Parker Washington'], // Watson ADP 71/Jake 60 — fell from R6; Metcalf Jake 68, Thomas Jake 66, Washington Jake 54
        fallbacks: ['Marvin Harrison', 'Courtland Sutton'],
        avoids:    [],
      },
      TE: {
        targets:   [],
        fallbacks: [],
        avoids:    ['Dalton Kincaid', 'Travis Hunter'], // neither in Jake's top 100
      },
    },
  },
  {
    round: 8, // ADP 85–96
    type: 'tiered',
    strategy: 'This is really where QB needs to be locked in even if were reaching, if you already have one enjoy some good value elsewhere at tight end or the two skill positions',
    positions: {
      QB: {
        targets:   [],
        fallbacks: ['Patrick Mahomes'], // ADP 93, Jake rank 94
        avoids:    ['Jaxson Dart', 'Matthew Stafford', 'Trevor Lawrence', 'Bo Nix'], // none in Jake's top 100
      },
      RB: {
        targets:   ['Marshawn Lloyd', 'Rhamondre Stevenson', 'Tony Pollard', 'Rico Dowdle'], // Lloyd — fell from R7; Stevenson/Pollard/Dowdle all round 6-7 value
        fallbacks: ['Chuba Hubbard', 'JK Dobbins'],
        avoids:    [],
      },
      WR: {
        targets:   ['Jayden Reed', 'Courtland Sutton'], // Reed R8 target per Jake; Sutton ADP 82/Jake 79
        fallbacks: ['Makai Lemon', 'Michael Wilson'],
        avoids:    [],
      },
      TE: {
        targets:   [],
        fallbacks: [],
        avoids:    ['George Kittle', 'Travis Kelce'], // name-brand picks, neither in Jake's top 100
      },
    },
  },
  {
    round: 9, // ADP 97–108
    type: 'tiered',
    strategy: 'Without a TE at this point, it needs to be a priority. Goedert is a good option or anyone who has fallen, I dont mind Fergeson or anyone else in that camp',
    positions: {
      QB: {
        targets:   ['Patrick Mahomes'], // ADP 93/Jake 94 — fell from R8
        fallbacks: [],
        avoids:    ['Brock Purdy'], // not in Jake's top 100
      },
      RB: {
        targets:   ['Crowley Merret', 'JK Dobbins', 'Jonathon Brooks', 'Blake Corum', 'Jordan Mason'],
        fallbacks: [],
        avoids:    ['Kyle Monangai'], // not in Jake's top 100
      },
      WR: {
        targets:   ['Michael Wilson', 'Chris Godwin', 'Jayden Reed', 'Jordan Addison'], // Wilson ADP 94/Jake 86 — fell from R8; Godwin/Reed/Addison all Jake rank 76-85
        fallbacks: ['Alec Pierce'],
        avoids:    ['Jordyn Tyson'], // not in Jake's top 100
      },
      TE: {
        targets:   [],
        fallbacks: ['Dallas Goedert'],
        avoids:    ['Jake Ferguson', 'Isaiah Likely'], // neither in Jake's top 100
      },
    },
  },
  {
    round: 10,
    type: 'tiered',
    strategy: '',
    positions: {
      QB: { targets: [], fallbacks: [], avoids: [] },
      RB: { targets: ['Crowley Merret', 'Jordan Mason', 'Blake Corum'], fallbacks: [], avoids: [] },
      WR: { targets: ['Josh Downs'], fallbacks: [], avoids: [] },
      TE: { targets: [], fallbacks: [], avoids: [] },
    },
  },
  {
    round: 11,
    type: 'tiered',
    strategy: '',
    positions: {
      QB: { targets: [], fallbacks: [], avoids: [] },
      RB: { targets: ['Jonah Coleman', 'Tyler Allgeier'], fallbacks: [], avoids: [] },
      WR: { targets: ['KC Concepcion'], fallbacks: [], avoids: [] },
      TE: { targets: [], fallbacks: [], avoids: [] },
    },
  },
  {
    round: 12,
    type: 'tiered',
    strategy: '',
    positions: {
      QB: { targets: ['Baker Mayfield', 'Kyler Murray'], fallbacks: [], avoids: [] },
      RB: { targets: ['Jonah Coleman', 'Rachaad White', 'Zach Charbonnet'], fallbacks: [], avoids: [] },
      WR: { targets: ['Deebo Samuel'], fallbacks: [], avoids: [] },
      TE: { targets: [], fallbacks: [], avoids: [] },
    },
  },
  {
    round: 13,
    type: 'tiered',
    strategy: '',
    positions: {
      QB: { targets: [], fallbacks: [], avoids: [] },
      RB: { targets: ['Rachaad White', 'Zach Charbonnet', 'Kaelon Black'], fallbacks: [], avoids: [] },
      WR: { targets: ["Ja'Kobi Lane"], fallbacks: [], avoids: [] },
      TE: { targets: [], fallbacks: [], avoids: [] },
    },
  },
  {
    round: 14,
    type: 'tiered',
    strategy: '',
    positions: {
      QB: { targets: ['Daniel Jones'], fallbacks: [], avoids: [] },
      RB: { targets: ['Kaelon Black'], fallbacks: [], avoids: [] },
      WR: { targets: [], fallbacks: [], avoids: [] },
      TE: { targets: ['Juwan Johnson'], fallbacks: [], avoids: [] },
    },
  },
  {
    round: 15,
    type: 'tiered',
    strategy: 'Preferably snag a backup tight end here, unless you want to wait and jump the gun on defense or kicker. Heres some good flyers and bakcup tight ends:',
    positions: {
      QB: { targets: [], fallbacks: [], avoids: [] },
      RB: { targets: ['Nick Singleton', 'Emmett Johnson'], fallbacks: [], avoids: [] },
      WR: { targets: ['Malachi Fields'], fallbacks: [], avoids: [] },
      TE: { targets: [], fallbacks: [], avoids: [] },
    },
  },
  // ── Round 16: Kicker ───────────────────────────────────────────────────────
  {
    round: 16,
    type: 'special',
    label: 'K',
    heading: 'Kicker',
    strategy: 'Grab any kicker on a high-powered offense in a dome or warm-weather city. Do not use a pick before Round 16 on a kicker.',
    players: [
      { rank: 1,  name: 'Brandon Aubrey',    team: 'DAL', score: 151.4 },
      { rank: 2,  name: 'Jason Myers',       team: 'SEA', score: 150.4 },
      { rank: 3,  name: "Ka'imi Fairbairn",  team: 'HOU', score: 144.5 },
      { rank: 4,  name: 'Cameron Dicker',    team: 'LAC', score: 142.7 },
      { rank: 5,  name: 'Harrison Mevis',    team: 'LAR', score: 136.8 },
      { rank: 6,  name: 'Jake Bates',        team: 'DET', score: 136.0 },
      { rank: 7,  name: 'Spencer Shrader',   team: 'IND', score: 135.2 },
      { rank: 8,  name: 'Cairo Santos',      team: 'CHI', score: 133.3 },
      { rank: 9,  name: 'Chase McLaughlin',  team: 'TB',  score: 132.9 },
      { rank: 10, name: 'Eddy Pineiro',      team: 'SF',  score: 132.1 },
      { rank: 11, name: 'Cam Little',        team: 'JAC', score: 132.0 },
      { rank: 12, name: 'Tyler Loop',        team: 'BAL', score: 132.0 },
      { rank: 13, name: 'Harrison Butker',   team: 'KC',  score: 131.9 },
      { rank: 14, name: 'Will Reichard',     team: 'MIN', score: 130.8 },
      { rank: 15, name: 'Evan McPherson',    team: 'CIN', score: 128.6 },
    ],
    targets: [], fallbacks: [], avoids: [],
  },

  // ── Round 17: Defense ──────────────────────────────────────────────────────
  {
    round: 17,
    type: 'special',
    label: 'D/ST',
    heading: 'Defense',
    strategy: 'Stream defense. Take a unit with an easy schedule in Weeks 1–4, not the best defense in the league. Elite defenses get taken before they are worth reaching for.',
    players: [
      { rank: 1, name: 'Jaguars D/ST',  team: 'JAX', opp: 'vs CLE' },
      { rank: 2, name: 'Steelers D/ST', team: 'PIT', opp: 'vs ATL' },
      { rank: 3, name: 'Chargers D/ST', team: 'LAC', opp: 'vs ARI' },
      { rank: 4, name: 'Seahawks D/ST', team: 'SEA', opp: 'vs NE'  },
      { rank: 5, name: 'Lions D/ST',    team: 'DET', opp: 'vs NO'  },
      { rank: 6, name: 'Ravens D/ST',   team: 'BAL', opp: '@IND'   },
      { rank: 7, name: 'Eagles D/ST',   team: 'PHI', opp: 'vs WSH' },
    ],
    targets: [], fallbacks: [], avoids: [],
  },

  // ── Round 18: IDP ─────────────────────────────────────────────────────────
  {
    round: 18,
    type: 'idp',
    label: 'IDP',
    heading: 'Defensive Player',
    strategy: 'Aidan Hutchinson if he is still there. Jack Campbell if Hutchinson is gone.',
    targets: [
      { name: 'Aidan Hutchinson', pos: 'DE', team: 'DET', note: 'First choice' },
    ],
    fallback: { name: 'Jack Campbell', pos: 'LB', team: 'DET', note: 'If Hutchinson is gone' },
  },
];
