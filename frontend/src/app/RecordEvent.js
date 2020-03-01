import React from 'react';
import { Redirect } from 'react-router-dom';
import { 
  Container, Row, Col,
  Button,
  Form, Input,
  Table,
 } from 'reactstrap';
import EventTypeSelector from '../utils/EventTypeSelector';
import BtnSelect from '../utils/BtnSelect';
import ErrorMsg  from '../utils/ErrorMsg';
import * as API from '../APIs';
import * as CONSTANTS from '../Constants';

export default class RecordInfo extends React.Component {
  constructor(props) {
    super(props);
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    this.today = `${yyyy}-${mm}-${dd}`;
  
    this.state = {
      sid: null,
      info: null,
      connection: "A",
      eventDate: this.today,
      eventType: 1,
      role: props.role,
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
    this.loadRecord();
    this.loadEvent();
  }

  render(){
    let disabled = this.state.role == "reader" ? true : false;
    return (
      <Container className="my-2 record-info">
      { this.state.role == null ? (<Redirect to="/" />) : "" }
      <ErrorMsg>{ this.state.error }</ErrorMsg>
        <Row>
          <Button color="success" onClick={()=>this.props.history.push(`/record/${this.state.sid}`)}>{ CONSTANTS._roster_list }</Button>
        </Row>
        <Row className="my-2">
          <Table borderless>
            <tbody>
              <tr>
                <th>{ CONSTANTS._name }</th>
                <td className="text-left">
                  <Input 
                  value={ this.state.info ? this.state.info.name : '' }
                  disabled
                  />
                </td>
              </tr>
              <tr>
                <th>{ CONSTANTS._phone }</th>
                <td className="text-left">
                  <Input 
                  value={ this.state.info ? this.state.info.phone1 : ''}
                  disabled
                  />
                </td>
              </tr>
              <tr>
                <th>{ CONSTANTS._connection }</th>
                <td className="text-left">
                  <BtnSelect 
                  color="primary" 
                  active={ this.state.connection }
                  onClick={(e) => {
                    this.setState({connection: e.target.innerHTML});
                    }
                  }
                  tabIndex="4"
                  disabled={ disabled }
                  >
                    <option>A</option>
                    <option>B</option>
                    <option>C</option>
                    <option>D</option>
                    <option>E</option>
                  </BtnSelect>
                </td>
              </tr>
            </tbody>
          </Table>
        </Row>
        <Row>
          <Form onSubmit={ this.addEvent }>
            <Row className="my-1">
              <Col className="text-left" xs="4">{ CONSTANTS._event_date }</Col>
              <Col>
                <Input 
                  type="date" 
                  ref="event-date" 
                  className="text-center" 
                  defaultValue={this.today} 
                  onChange={ (e) => this.setState({eventDate: e.target.value}) } 
                  disabled={ disabled }
                  />
              </Col>
            </Row>
            <Row className="my-1">
              <Col className="text-left" xs="4">{ CONSTANTS._event_type }</Col>
              <Col className="text-left">
                <EventTypeSelector 
                active={ this.state.eventType } 
                setEventType={(eType) => { this.setState({eventType: eType}) }} 
                disabled={ disabled }
                />
              </Col>
            </Row>
            <Row><Button type="submit" color="success" hidden={ disabled }>{ CONSTANTS._add }</Button></Row>
          </Form>
        </Row>
        <Row className="my-2">
          <Col xs="6">
            <Table bordered className="col-xs-6">
              <thead>
                <tr>
                <th>{ CONSTANTS._event_date }</th>
                <th>{ CONSTANTS._event_type }</th>
                <th>{ CONSTANTS._delete }</th>
                </tr>
              </thead>
              { this.state['event-list'] }
            </Table>
          </Col>
        </Row>
      </Container>
    );
  }

  loadRecord = () => {
    let data = new FormData();
    data.append('sid', this.props.match.params.id)
    fetch(API.SEARCH, {
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
      let parsed = JSON.parse(json);
      this.load_info = true;
      this.setState({
        info: {
          name: parsed.roster[0].name ? parsed.roster[0].name : undefined,
          phone1: parsed.roster[0].phone1 ? parsed.roster[0].phone1 : undefined,
          connection: parsed.roster[0].connection ? parsed.roster[0].connection : undefined,
          },
        sid: this.props.match.params.id,
        connection: parsed.roster[0].connection ? parsed.roster[0].connection : undefined,
      });
    })
    .catch(err => {console.log(err)});
  }

  loadEvent = (e) => {
    let data = new FormData();
    data.append('sid', this.props.match.params.id)
    fetch(API.RECORD_EVENT, {
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
      this.setState({
        'event-list': this.handleEventList(json.events),
      });
    })
    .catch(err => {console.log(err)});
  }

  removeEventRecord = (e, event) => {
    e.preventDefault();
    let data = new FormData();
    data.append("sid", this.state.sid);
    data.append("event_date", event.event_date);
    data.append("event_type__name", event.event_type__name);

    fetch(API.RECORD_EVENT, {
      method: 'DELETE',
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
      body: data,
    })
    .then(res => {
      if (res.status >= 400 && res.status < 500){
        // window.location.reload();
      }
      return res.json()
    })
    .then(json => {
      if (json.result == "done"){
        this.loadEvent();
      }
    })
    .catch(err => {console.log(err)});
  }

  handleEventList = (events)=>{
    return (<tbody>
      { events.map((_e, k) => 
        (<tr key={ k }>
          <td>{ _e.event_date }</td>
          <td>{ _e.event_type__name }</td>
          <td><a href="#" onClick={ (e)=> this.removeEventRecord(e, _e) }>x</a></td>
        </tr>)
      ) }
    </tbody>);
  }

  addEvent = (e)=>{
    e.preventDefault();
    let data = new FormData();
    data.append('sid', this.state.sid)
    data.append('event_date', this.state.eventDate)
    data.append('event_type', this.state.eventType)
    fetch(API.RECORD_ADD_EVENT, {
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
      this.loadEvent();
    })
    .catch(err => {console.log(err)});
  }
}