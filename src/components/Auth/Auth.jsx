import styled from 'styled-components';
import { Card, CardBody } from '@paljs/ui/Card';
import { breakpointDown } from '@paljs/ui/breakpoints';
import React from 'react';

const AuthStyle = styled.div`
  margin: auto;
  display: block;
  width: 100%;
  max-width: 35rem;

  a {
    font-weight: 600;
  }

  h1 {
    margin-bottom: ${(props) => (props.subTitle ? '0.75rem' : '2rem')};
    margin-top: 0;
    text-align: center;
  }

  p {
    margin-bottom: 2rem;
    text-align: center;
  }

  form {
    width: 100%;
    & > *:not(:last-child) {
      margin-bottom: 2rem;
    }
  }
`;

export const Group = styled.div`
  margin: 2rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardAuth = styled(Card)`
  margin-bottom: 0;
  height: calc(100vh - 5rem);

  ${breakpointDown('sm')`
    height: 100vh;
  `}

  ${CardBody} {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
`;

const Auth = ({ subTitle, title, children }) => {
  return (
    <CardAuth>
      <CardBody>
        <AuthStyle subTitle={subTitle}>
          <h1>{title}</h1>
          {subTitle && <p>{subTitle}</p>}
          {children}
        </AuthStyle>
      </CardBody>
    </CardAuth>
  );
};

export default Auth;
