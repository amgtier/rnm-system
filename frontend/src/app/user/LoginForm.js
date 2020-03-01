import React from 'react';
import { Link } from "react-router-dom";
import { 
  Container, Row, Col,
  Form, Input, Label,
  Button,
} from 'reactstrap';
import * as CONSTANTS from '../../Constants';

export default class LoginForm extends React.Component {
  constructor(props) {
    super(props)
    this.state  ={
        username: '',
        password: '',
    }
    // if (localStorage.getItem('token')){ this.props.history.push("/"); }
}

  render() {
    return (
      <Container>
      <Form onSubmit={(e) => {this.props.loginHandler(e, this.state, this.props.history)}}>
        <h4 className="my-3">{ CONSTANTS._user_login }</h4>
        <Row>
          <Col>
            <Label htmlFor="username">{ CONSTANTS._username }</Label>
            <Input
              className="w-30 mx-1 d-inline"
              type="text"
              name="username"
              id="username"
              value={this.state.username}
              onChange={(e) => {this.setState({username: e.target.value})}}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <Label htmlFor="password">{ CONSTANTS._password }</Label>
            <Input
              className="w-30 mx-1 d-inline"
              type="password"
              name="password"
              id="password"
              value={this.state.password}
              onChange={(e) => {this.setState({password: e.target.value})}}
            />
          </Col>
        </Row>
        <Button type="submit" className="my-3" color="success">{ CONSTANTS._login }</Button>
      </Form>
        <Row>
          <Col>
            <Link className="mx-3" to="/register">{ CONSTANTS._register }</Link>
            <Link className="mx-3" to="/forget_password">{ CONSTANTS._forget_password }</Link>
          </Col>
        </Row>
      </Container>
        );
  }
}