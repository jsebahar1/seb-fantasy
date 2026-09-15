// ── 2026 FBS conference alignment ─────────────────────────────────────────────
// Realignment moved a lot of programs for 2026: the Pac-12 rebuilt itself by
// taking five schools from the Mountain West plus Texas State, and the Mountain
// West backfilled with UTEP and Northern Illinois (football only).
//
// Independents and FCS are separate groups. FCS is a single pooled entry that
// stands in for every FCS opponent faced, so it ranks last by construction and
// its record is the sum of all those games.
//
// Every name must match TEAMS in cfbGames.js exactly. A team missing from this
// map will be reported by the page rather than silently dropped.

export const CONFERENCES = {
  ACC: [
    'Boston College', 'California', 'Clemson', 'Duke', 'Florida State',
    'Georgia Tech', 'Louisville', 'Miami (FL)', 'NC State', 'North Carolina',
    'Pittsburgh', 'SMU', 'Stanford', 'Syracuse', 'Virginia', 'Virginia Tech',
    'Wake Forest',
  ],
  'Big Ten': [
    'Illinois', 'Indiana', 'Iowa', 'Maryland', 'Michigan', 'Michigan State',
    'Minnesota', 'Nebraska', 'Northwestern', 'Ohio State', 'Oregon',
    'Penn State', 'Purdue', 'Rutgers', 'UCLA', 'USC', 'Washington', 'Wisconsin',
  ],
  'Big 12': [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado',
    'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU',
    'Texas Tech', 'UCF', 'Utah', 'West Virginia',
  ],
  SEC: [
    'Alabama', 'Arkansas', 'Auburn', 'Florida', 'Georgia', 'Kentucky', 'LSU',
    'Mississippi State', 'Missouri', 'Oklahoma', 'Ole Miss', 'South Carolina',
    'Tennessee', 'Texas', 'Texas A&M', 'Vanderbilt',
  ],
  'Pac-12': [
    'Boise State', 'Colorado State', 'Fresno State', 'Oregon State',
    'San Diego State', 'Texas State', 'Utah State', 'Washington State',
  ],
  American: [
    'Army', 'Charlotte', 'East Carolina', 'Florida Atlantic', 'Memphis', 'Navy',
    'North Texas', 'Rice', 'South Florida', 'Temple', 'Tulane', 'Tulsa', 'UAB',
    'UTSA',
  ],
  'Mountain West': [
    'Air Force', 'Hawaii', 'Nevada', 'New Mexico', 'North Dakota State', 'Northern Illinois',
    'San Jose State', 'UNLV', 'UTEP', 'Wyoming',
  ],
  'Conference USA': [
    'Delaware', 'FIU', 'Jacksonville State', 'Kennesaw State', 'Liberty',
    'Louisiana Tech', 'Middle Tennessee', 'Missouri State', 'New Mexico State',
    'Sam Houston', 'Western Kentucky',
  ],
  MAC: [
    'Akron', 'Ball State', 'Bowling Green', 'Buffalo', 'Central Michigan',
    'Eastern Michigan', 'Kent State', 'Miami (OH)', 'Ohio', 'Toledo', 'UMass',
    'Western Michigan', 'Sacramento State',
  ],
  'Sun Belt': [
    'Appalachian State', 'Arkansas State', 'Coastal Carolina',
    'Georgia Southern', 'Georgia State', 'James Madison', 'Louisiana',
    'Louisiana Monroe', 'Marshall', 'Old Dominion', 'South Alabama',
    'Southern Miss', 'Troy',
  ],
  Independent: [
    'Notre Dame', 'UConn',
  ],
  // A single pooled entry standing in for every FCS opponent faced, so it
  // carries one rank and the accumulated record of all those games.
  FCS: [
    'FCS',
  ],
};

/** team name -> conference name */
export const TEAM_CONFERENCE = Object.fromEntries(
  Object.entries(CONFERENCES).flatMap(([conf, teams]) => teams.map(t => [t, conf])),
);
