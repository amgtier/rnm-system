import React from 'react';
import { Container } from 'reactstrap';

export default class NotFound extends React.Component {
  render(){
    return (
      <Container>
        <p>path is not found.</p>
      </Container>
    );
  }
}