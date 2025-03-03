import styled from 'styled-components';
import React from 'react';
import { EvaIcon } from '@paljs/ui/Icon';

const SocialsStyle = styled.section`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;

  p {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .links {
    display: flex;
    gap: 1rem;
    font-size: 2.5rem;

    a {
      color: inherit; /* Usa el color del tema */
      transition: color 0.3s ease-in-out;

      &:hover {
        color: #007bff; /* Color al pasar el mouse */
      }
    }
  }
`;

export default function Socials() {
  return (
    <SocialsStyle>
      <p>Or enter with:</p>
      <div className="links">
        <a href="https://github.com/AhmedElywa" target="_blank" rel="noopener noreferrer">
          <EvaIcon name="github" />
        </a>
        <a href="https://www.facebook.com/AhmedElywa" target="_blank" rel="noopener noreferrer">
          <EvaIcon name="facebook" />
        </a>
        <a href="https://twitter.com/AhmedElywa" target="_blank" rel="noopener noreferrer">
          <EvaIcon name="twitter" />
        </a>
      </div>
    </SocialsStyle>
  );
}
