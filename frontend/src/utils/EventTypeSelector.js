import React from 'react';
import {
  Button,
} from 'reactstrap';
import * as API from '../APIs';
import * as CONSTANTS from '../Constants';

export default class EventTypeSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      eventType: props.active,
      eventTypeList: null,
      disabled: props.disabled,
    }
  }

  componentDidMount = () => {
    /* get event tabs */
    fetch(API.G_EVENT_TYPE)
    .then(res=>res.json())
    .then(json=>{
      json = JSON.parse(json);
      this.setState({'eventTypeList': json["event_type"]});
    });
  }

  render() {
    let types = this.state["eventTypeList"];
    return (
      <div>
      { (types) ? types.map((eventType, k)=>{
        if (this.state.eventType == eventType.id){
          return (<Button key={'et'+k} className="mx-1" color="primary" size="sm" disabled={ this.state.disabled }>{eventType.name}</Button>);
        }
        else{
          return (<Button className="mx-1" key={ eventType.id } outline color="primary" size="sm" data-key={ eventType.id } disabled={ this.state.disabled } onClick={ (e) => {
            this.setState({eventType: e.target.getAttribute('data-key')});
            this.props.setEventType(e.target.getAttribute('data-key'));
          } }>{eventType.name}</Button>);
        }
      }) : ''}
      </div>
    );
  }
}