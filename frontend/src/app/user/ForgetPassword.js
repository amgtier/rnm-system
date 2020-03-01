import React from 'react';
import { Link } from "react-router-dom";
import { 
  Container, Row, Col,
  Form, Input, Label,
  Button,
} from 'reactstrap';
import ErrorMsg from '../../utils/ErrorMsg';
import * as API from '../../APIs';
import * as CONSTANTS from '../../Constants';

export default class ForgetPassword extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      email: '',
      result: null,
    }
    if (localStorage.getItem('token')){ this.props.history.push("/"); }
  }

  /************************************************************/
  setMessage = (msg, timeout=5) => {
    this.setState({error: msg}, ()=>{
      setTimeout(()=>this.setState({error: ''}), timeout * 1000)
    })
  }
  /************************************************************/

  render() {
    return (
      <Container>
        <ErrorMsg>{ this.state.error }</ErrorMsg>
        <h4 className="my-3">{ CONSTANTS._forget_password }</h4>
        <hr />
        { this.state.result == null || this.state.result == "pending" ? this.fillEmail() :
          this.state.result == "done" ? this.showResult("success") : 
          this.showResult("fail") }
      </Container>
        );
  }

  showResult = (msg) => {
    let content, btn;
    if (msg == "success"){
      content = (<Col><h5>{ CONSTANTS._reset_mail_has_been_sent }</h5><h5> { this.state.email } </h5><h5>{ CONSTANTS._reset_mail_go_and_check }</h5></Col>);
      btn = (<Button tag={Link} color="success" to="/login">{ CONSTANTS._go_to_login_page }</Button>);
    }
    else{
      content = (<Col><h5>{ CONSTANTS._record_not_found }</h5><h5> { this.state.email } </h5><h5>{ CONSTANTS._please_verify }</h5></Col>);
      btn = (<Button color="success" onClick={()=>this.setState({result: null})}>{ CONSTANTS._try_again }</Button>);
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

  fillEmail = () => {
    return (
      <Form onSubmit={ this.sendForgetPassword }>
        <Row>
          <Col>
            <Label tag="h5" htmlFor="email">{ CONSTANTS._send_the_pwd_reset_mail_to }</Label>
            <Input
              className="w-30 mx-5 my-3 d-inline text-center"
              type="email"
              name="email"
              id="email"
              required
              value={this.state.email}
              onChange={(e) => { this.setState({email: e.target.value}) }}
              placeholder={ CONSTANTS._input_your_email }
            />
          </Col>
        </Row>
        <Button 
        type="submit" 
        color="success" 
        disabled={this.state.result == "pending" ? true : false}
        >{ CONSTANTS._send }</Button>
      </Form>
      );
  }

  sendForgetPassword = (e) => {
    e.preventDefault();
    this.setState({result: "pending"});
    let data = new FormData(e.target);
    fetch(API.FORGET_PASSWORD, {
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
            this.setState({result: 'failed'});
          }
        })
        .catch(err => {console.log(err)});

  }

}