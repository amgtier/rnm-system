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

export default class ResetPassword extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      username: props.location.username,
      target: props.location.target,
      oldpassword: '',
      newpassword: '',
      newpassword2: '',
      result: null,
      hash: props.match.params.hash,
    }
    if((props.location.target == null && props.match.params.hash == undefined) || (props.location.target != null && props.match.params.hash != undefined)){
      props.history.push("/");
    }
  }

  /************************************************************/
  setMessage = (msg, timeout=5) => {
    this.setState({error: msg}, ()=>{
      setTimeout(()=>this.setState({error: ''}), timeout * 1000)
    })
  }
  /************************************************************/

  componentDidMount(){
    if (this.props.match.params.hash != undefined){
      // additional error detection
      if (this.props.location.target != undefined || localStorage.getItem('token')){ this.props.history.push("/"); }
      
      let data = new FormData();
      data.append("hash", this.state.hash);
      
      fetch(API.RESET_PASSWORD_HASH, {
        method: 'PUT',
        body: data,
      })
      .then(res => {
        if (res.status >= 400 && res.status < 500){
          this.setMessage(CONSTANTS._server_error);
        }
        return res.json()
      })
      .then(json => {
        if (json.result == 'done'){
          this.setState({target: json.target.user__username});
        }
        else {
          this.setMessage(json.msg);
          this.setState({result: CONSTANTS._resend_password_reset})
        }
      })
      .catch(err => {console.log(err)});
    }
  }

  render() {
    return (
      <Container>
        <ErrorMsg>{ this.state.error }</ErrorMsg>
        <h4 className="my-3">{ CONSTANTS._reset_password }</h4>
        <hr />
        { this.state.result == null ? this.fillPassword() :
          this.state.result == "done" ? this.showResult("success") : 
          this.showResult(this.state.result) }
      </Container>
        );
  }

  fillPassword = () => {
    return (
      <Form onSubmit={ this.sendResetPassword }>
        <Input name="username" defaultValue={this.state.target} hidden />

        { this.state.username == this.state.target ?(
        <Row>
          <Col>
            <Label htmlFor="oldpassword">{ CONSTANTS._old_password }</Label>
            <Input
              className="w-30 mx-1 d-inline"
              type="password"
              name="oldpassword"
              id="oldpassword"
              required
              value={this.state.oldpassword}
              onChange={(e) => this.setState({oldpassword: e.target.value})}
            />
          </Col>
        </Row>
        ) : 
        '' }

        <Row>
          <Col>
            <Label htmlFor="newpassword">{ CONSTANTS._new_password }</Label>
            <Input
              className="w-30 mx-1 d-inline"
              type="password"
              name="password"
              id="password"
              minLength="6"
              required
              value={this.state.newpassword}
              onChange={(e) => this.setState({newpassword: e.target.value})}
            />
          </Col>
        </Row>
        
        <Row>
          <Col>
            <Label htmlFor="newpassword2">{ CONSTANTS._confirm_new_password }</Label>
            <Input
              className="w-30 mx-1 d-inline"
              type="password"
              name="password2"
              id="password2"
              minLength="6"
              required
              value={this.state.newpassword2}
              onChange={(e) => this.setState({newpassword2: e.target.value})}
            />
          </Col>
        </Row>
        
        <Button className="my-3" type="submit" color="success">{ CONSTANTS._submit }</Button>
      </Form>
      );
  }

  showResult = (msg) => {
    let content, btn;
    if (msg == "success"){
      content = (<Col><h5><strong>{ this.state.target } { CONSTANTS._password_updated }</strong></h5></Col>);
      if (this.state.hash){
        btn = (<Button color="success" onClick={(e)=>{this.props.history.goBack()}} >{ CONSTANTS._go_back }</Button>);
      }
      else{
        btn = (<Button tag={ Link } color="success" to="/" >{ CONSTANTS._go_home }</Button>);
      }
    }
    else{
      content = (<Col><h5>{ msg }</h5></Col>);
      btn = (<Button tag={ Link } color="success" to="/" >{ CONSTANTS._go_home }</Button>);
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

  sendResetPassword = (e) => {
    e.preventDefault();
    let data = new FormData(e.target);
    if(this.state.username){
      fetch(API.RESET_PASSWORD, {
        method: 'POST',
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
        },
        body: data,
      })
      .then(res => {
        if (res.status >= 400 && res.status < 500){
          window.location.reload();
        }
        return res.json()
      })
      .then(json => {
        if (json.result == 'done'){
          this.setState({result: 'done'});
        }
        else {
          if (Object.keys(json.msg).includes("oldpassword")){
            this.setMessage(CONSTANTS._incorrect_old_password);
          }
          else if (Object.keys(json.msg).includes("password2")){
            this.setMessage(CONSTANTS._incorrect_confirm_new_password);
          }
        }
      })
      .catch(err => {console.log(err)});
    }
    else{
      data.append("hash", this.state.hash);
      fetch(API.RESET_PASSWORD_HASH, {
        method: 'POST',
        headers: {
        },
        body: data,
      })
      .then(res => {
        if (res.status >= 400 && res.status < 500){
          window.location.reload();
        }
        return res.json()
      })
      .then(json => {
        if (json.result == 'done'){
          this.setState({result: 'done'});
        }
        else {
          if (Object.keys(json.msg).includes("oldpassword")){
            this.setMessage(CONSTANTS._incorrect_old_password);
          }
          else if (Object.keys(json.msg).includes("password2")){
            this.setMessage(CONSTANTS._incorrect_confirm_new_password);
          }
        }
      })
      .catch(err => {console.log(err)});
    }
  }

}