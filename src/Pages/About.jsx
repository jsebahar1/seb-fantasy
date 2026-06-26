import React from 'react';

const About = () => {
  return (
    <div className="page container">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">About SEB Fantasy</span>
          <h1 className="hero-title">Meet the Analyst</h1>
          <p className="hero-text">
            Hi, I'm the creator of SEB Fantasy. I am passionate about 
            merging data science with fantasy sports to find the edges 
            that others miss.
          </p>
        </div>
        <div className="hero-panel">
          {/* Ensure Gradphoto.JPG is in the public folder */}
          <img src="/Gradphoto.JPG" alt="Analyst" className="hero-logo" />
        </div>
      </section>

      <section className="grid-two">
        <div className="card">
          <h3>About Me</h3>
          <p>
            [Insert your personal bio here: your background, why you 
            started this, and your professional/academic connection to data.]
          </p>
        </div>
        
        <div className="card">
          <h3>Sports Background & Interests</h3>
          <p>
            [Insert your sports history: whether you are a lifelong fan, 
            a former player, or a dedicated fantasy sports strategist. 
            Highlight what sports you cover best.]
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;