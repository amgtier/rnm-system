import React from 'react';
import { 
  Container,
	Row, Col,
	Button,
  Form, Input,
  Table,
  Badge,
 } from 'reactstrap';
import ErrorMsg from '../utils/ErrorMsg';
import * as API from '../APIs';
import * as CONSTANTS from '../Constants';

export default class SystemAdmin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      label_btns: null,
      event_btns: null,
      error: null,
    };
  }

  /************************************************************/
  setMessage = (msg, timeout=5) => {
    this.setState({error: msg}, ()=>{
      setTimeout(()=>this.setState({error: ''}), timeout * 1000)
    })
  }
  /************************************************************/

  componentDidMount = () => {
    fetch(API.EVENT_TYPE, {
      method: 'GET',
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
    .then(res => {
      if (res.status >= 400 && res.status < 500){
        this.setMessage(CONSTANTS._server_error);
      }
      return res.json()
    })
    .then(json => {
      this.setState({event_btns: this.makeBtns('event_type', json.event_type)});
    });

    fetch(API.LABEL, {
      method: 'GET',
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
    .then(res => {
      if (res.status >= 400 && res.status < 500){
        this.setMessage(CONSTANTS._server_error);
      }
      return res.json()
    })
    .then(json => {
      this.setState({label_btns: this.makeBtns('label', json.label)});
    });
  }

  render(){
    return (
      <Container className="my-2 record-info">
        <ErrorMsg>{ this.state.error }</ErrorMsg>
        <Row>
          <Col className="text-left"><h2>{ CONSTANTS._tag_names }</h2></Col>
        </Row>
        <Row>
          { this.state.label_btns }
        </Row>
        <Form id="add-est-src-class" onSubmit={(e)=>{this.addThis(e, 'label')}}>
          <Row className="my-2">
            <Input 
              name="name" 
              placeholder={ CONSTANTS._input_a_new_name } 
              className="float-left w-25 d-inline-block mx-1" 
            />
            <Button type="submit" color="success">{ CONSTANTS._create }</Button>
          </Row>
        </Form>
        <Row>
        <hr />
        </Row>
        <Row>
          <Col className="text-left"><h2>{ CONSTANTS._event_names }</h2></Col>
        </Row>
        <Row>
          { this.state.event_btns }
        </Row>
        <Form id="add-event-class" onSubmit={(e)=>{this.addThis(e, 'event_type')}}>
          <Row className="my-2">
            <Input 
              name="name" 
              placeholder={ CONSTANTS._input_a_new_name } 
              className="float-left w-25 d-inline-block mx-1" 
            />
            <Button type="submit" color="success">{ CONSTANTS._create }</Button>
          </Row>
        </Form>
      </Container>
    );
  }

  makeBtns = (type, srcs) => {
    return (
      <div>
        { srcs.map((i, k)=>{
          return (
            <div className="d-inline mx-2" key={ k }>
              <Button color="primary" outline disabled>{ i.name }</Button>
              { i.removable ? 
              <Button 
                className="btn-sm mx-1" 
                color="success" 
                onClick={()=> {this.removeThis(type, i.id)}}
              >x</Button> 
                : null }
            </div>
            );
        }) }
      </div>
    );
  }

  addThis = (e, type) => {
    e.preventDefault();
    let url;
    if (type == "event_type") { url = API.EVENT_TYPE; }
    else if (type == "label") { url = API.LABEL; }

    let data = new FormData(e.target);
    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
      body: data,
    })
    .then(res => {
      if (res.status >= 400 && res.status < 500){
        this.setMessage(CONSTANTS._server_error);
      }
      return res.json()
    })
    .then(json => {
      if (json.result == "done"){
        window.location.reload();
      }
      else{
        this.setMessage(CONSTANTS._failed_on_create);
      }
    });
  }

  removeThis = (type, id) => {
    let url;
    if (type == "event_type") { url = API.EVENT_TYPE; }
    else if (type == "label") { url = API.LABEL; }

    let data = new FormData();
    data.append("id", id);
    fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
      body: data,
    })
    .then(res => {
      if (res.status >= 400 && res.status < 500){
        this.setMessage(CONSTANTS._server_error);
      }
      return res.json()
    })
    .then(json => {
      if (json.result == "done"){
        window.location.reload();
      }
    });
  }
}