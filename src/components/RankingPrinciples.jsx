/**
 * The case for the rankings: everyone starts at zero, and only results move
 * anyone. Shown on both the college and NFL ranking pages.
 */
export default function RankingPrinciples({ league }) {
  const isCollege = league === 'college';

  return (
    <section className="pr-principles">
      <div className="pr-zero">
        <div className="pr-zero-mark" aria-hidden="true">
          <span className="pr-zero-num">0.00</span>
          <span className="pr-zero-label">Week 0 rating, every team</span>
        </div>
        <div className="pr-zero-copy">
          <h2 className="pr-zero-title">Nobody starts ranked</h2>
          <p className="pr-zero-lead">
            Every team opens the season at zero. Not a projection, not a guess at how
            good they might be. Zero.
          </p>
          <p className="pr-zero-lead">
            From there, the only thing that moves a team is playing. Win and you climb.
            Lose and you fall. How far depends on who you played and by how much. That
            is the entire system.
          </p>
        </div>
      </div>

      <div className="pr-principle-grid">
        <div className="pr-principle">
          <span className="pr-principle-num" aria-hidden="true">01</span>
          <h3 className="pr-principle-title">No preseason poll</h3>
          <p className="pr-principle-body">
            Preseason rankings are guesses made before anyone plays a snap. They run on
            last year's record, returning starters, and name recognition. Then they
            stick, because a team ranked in August has to lose several times to fall,
            while a team left off has to win a pile of games to climb. A head start
            nobody earned turns into a ranking nobody questions.
          </p>
          <p className="pr-principle-body">
            Starting everyone at zero deletes that. {isCollege
              ? 'A Group of Five team and a blue blood are the same thing in Week 1.'
              : 'Last year\'s Super Bowl team and a 4-13 roster are the same thing in Week 1.'}{' '}
            Both have to go prove it.
          </p>
        </div>

        <div className="pr-principle">
          <span className="pr-principle-num" aria-hidden="true">02</span>
          <h3 className="pr-principle-title">No votes, no committee</h3>
          <p className="pr-principle-body">
            No person decides anything here. The only input is the final score of games
            that have been played. There is no adjustment for conference, brand, market
            size, or what a team did last season.
          </p>
          <p className="pr-principle-body">
            {isCollege
              ? 'A one-point win counts as a win whether it happened in the SEC or the MAC. What separates them is who you beat, not the logo on your helmet.'
              : 'A one-point win counts the same in prime time as it does at one in the afternoon. What separates teams is who they beat, not who gets the national broadcast.'}
          </p>
        </div>

        <div className="pr-principle">
          <span className="pr-principle-num" aria-hidden="true">03</span>
          <h3 className="pr-principle-title">You can check every number</h3>
          <p className="pr-principle-body">
            The formula is written out below in full. Click any team and you get every
            game it played, the rank of each opponent, and the exact points that game
            was worth.
          </p>
          <p className="pr-principle-body">
            Add those up and you get the rating in the table. Nothing is hidden, and
            nothing gets nudged by hand. If a team is ranked somewhere you disagree
            with, you can go find the game that put it there.
          </p>
        </div>
      </div>

      {isCollege && (
        <p className="pr-principles-foot">
          Conferences work the same way. A league is ranked on the average of all its
          teams, so it gets no credit for being called a power conference and no penalty
          for being called a small one. Depth counts as much as the team at the top.
        </p>
      )}
    </section>
  );
}
