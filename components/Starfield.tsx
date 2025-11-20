import React, { useEffect, useState } from 'react';
import './Starfield.css';

const Starfield: React.FC = () => {
  const [stars, setStars] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      const numStars = 200;
      for (let i = 0; i < numStars; i++) {
        const size = Math.random() * 2 + 1;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const animationDuration = Math.random() * 5 + 2;
        const animationDelay = Math.random() * 5;
        newStars.push(
          <div
            key={i}
            className="star"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${x}%`,
              top: `${y}%`,
              animationDuration: `${animationDuration}s`,
              animationDelay: `${animationDelay}s`,
            }}
          />
        );
      }
      setStars(newStars);
    };

    generateStars();
  }, []);

  return <div className="starfield">{stars}</div>;
};

export default Starfield;