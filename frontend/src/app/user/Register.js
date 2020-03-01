import React from 'react';
import { Link } from "react-router-dom";
import { 
  Container, Row, Col,
  Form, Input, Label,
  Button,
} from 'reactstrap';
import * as API from '../../APIs';
import * as CONSTANTS from '../../Constants';
import ErrorMsg from '../../utils/ErrorMsg';

export default class Register extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      username: '',
      password: '',
      email: '',
      result: null,
      error: null,
    }
    if (localStorage.getItem('token')){ this.props.history.push("/"); }
  }

  render() {
    return (
      <Container>
        <ErrorMsg>{ this.state.error }</ErrorMsg>
        <h4 className="my-3">{ CONSTANTS._register }</h4>
        <hr />
        { this.state.result == null ? this.fillRegister() :
          this.state.result == "done" ? this.showResult("success") : 
          this.showResult("fail") }
      </Container>
        );
  }

  showResult = (msg) => {
    let content, btn;
    if (msg == "success"){
      content = (<Col><h5>{ CONSTANTS._account_created } <strong>{ this.state.username }</strong></h5><h5>{ CONSTANTS._notify_admin }</h5></Col>);
      btn = (<Button tag={Link} color="success" to="/login">{ CONSTANTS._go_to_login_page }</Button>);
    }
    return (
      <Container>
        <Row>
          <Col>
            { content }
          </Col>
        </Row>
        <Row>
          <Col>
            { btn }
          </Col>
        </Row>
      </Container>
      );
  }

  fillRegister = () => {
    return (
      <Form onSubmit={ this.sendRegister }>
        <Row>
          <Col>
            <Label htmlFor="username">{ CONSTANTS._username }</Label>
            <Input
              className="w-30 mx-1 d-inline"
              type="text"
              name="username"
              id="username"
              value={this.state.username}
              required
              onChange={(e) => this.setState({username: e.target.value})}
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
              minLength="6"
              id="password"
              value={this.state.password}
              required
              onChange={(e) => this.setState({password: e.target.value})}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <Label htmlFor="email">Email</Label>
            <Input
              className="w-30 mx-1 d-inline"
              type="email"
              name="email"
              id="email"
              value={this.state.email}
              required
              onChange={(e) => this.setState({email: e.target.value})}
            />
          </Col>
        </Row>
        <Button className="my-3" type="submit" color="success" >{ CONSTANTS._submit }</Button>
      </Form>
      );
  }

  setMessage = (msg, timeout=5) => {
    this.setState({error: msg}, ()=>{
      setTimeout(()=>this.setState({error: ''}), timeout * 1000)
    })
  }

  sendRegister = (e) => {
    e.preventDefault();
    let data = new FormData(e.target);
    fetch(API.REGISTER, {
          method: 'POST',
          body: data,
        })
        .then(res => {
          if (res.status >= 400 && res.status < 500){
            this.setMessage(CONSTANTS._server_error+res.status);
          }
          else if (res.status >= 500){
            this.setMessage(CONSTANTS._server_error);
          }
          return res.json()
        })
        .then(json => {
          if (json.result == "done"){
            this.setState({result: 'done'});
          }
          else{
            if (Object.keys(json.msg).includes("username")){
              this.setMessage(CONSTANTS._duplicate_username, 999);
            }
            else if (Object.keys(json.msg).includes("email")){
              this.setMessage(CONSTANTS._duplicate_email, 999);
            }
          }
        })
        .catch(err => {console.log(err)});
  }
}