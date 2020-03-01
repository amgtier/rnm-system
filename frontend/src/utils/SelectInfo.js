import React from 'react';
import {
  Input, Label, Button,
  Row, Col
} from 'reactstrap';
import * as CONSTANTS from '../Constants';

var PREFIX = "info-"

export default class SelectInfo extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      fields: [
      {'key': 'gender', 'name': CONSTANTS.header_name['gender'], 'checked': 'checked'}, 
      {'key': 'phone1', 'name': CONSTANTS.header_name['phone1'], 'checked': 'checked'}, 
      {'key': 'landline', 'name': CONSTANTS.header_name['landline'], 'checked': 'checked'}, 
      {'key': 'email', 'name': CONSTANTS.header_name['email'], 'checked': 'checked'}, 
      {'key': 'city', 'name': CONSTANTS.header_name['city'], 'checked': 'checked'}, 
      {'key': 'township', 'name': CONSTANTS.header_name['township'], 'checked': 'checked'}, 
      {'key': 'village', 'name': CONSTANTS.header_name['village']}, 
      {'key': 'address', 'name': CONSTANTS.header_name['address']}, 
      {'key': 'building', 'name': CONSTANTS.header_name['building']}, 
      {'key': 'birthday', 'name': CONSTANTS.header_name['birthday']}, 
      {'key': 'introducer_name', 'name': CONSTANTS.header_name['introducer_name']}, 
      {'key': 'spouse_name', 'name': CONSTANTS.header_name['spouse_name']}, 
      {'key': 'est_src', 'name': CONSTANTS.header_name['est_src']}, 
      {'key': 'exp_name', 'name': CONSTANTS.header_name['exp_name']}, 
      {'key': 'event', 'name': CONSTANTS.header_name['event']},
      {'key': 'created_by', 'name': CONSTANTS.header_name['created_by']},
      {'key': 'create_time', 'name': CONSTANTS.header_name['create_time']},
      ],
    }
  }

  render = () => {
    return (
      <div>
        <Row>
          <Button 
            className="float-left" 
            color="primary" 
            outline 
            onClick={ this.selectAll }
          >
            { CONSTANTS._select_all }
          </Button>
        </Row>
        <Row>
          <Col xs={{size: 10, offset: 1}} md={{size: 10, offset: 1}}>
            <Row>
            { this.state.fields.map((f, k) => {
              return (
                <Col xs="4" md="2" key={ k } className="text-left">
                  <Label>
                    <Input
                      type="checkbox"
                      id={ `${PREFIX}${k}` }
                      key={ `${PREFIX}${f.key}` }
                      name={ `show-${f.key}` }
                      checked={(f.checked) ? true : false}
                      onChange={ this.handleCheck }
                      disabled={(f.disabled) ? true : false}
                    />
                    {f.name}
                  </Label>
                </Col>
                );
            }) }
            </Row>
          </Col>
        </Row>
      </div>
      );
  }

  selectAll = () => {
    var editable = this.state.fields;

    let all_checked = true;
    editable.map((f, k)=>{
      if (!f.checked){ all_checked = false; }
    });

    editable.map((f, k)=>{
      f.checked = !all_checked;
    });
    this.setState({fields: editable});
  }

  handleCheck = (e) => {
    let k = e.target.id.substring(PREFIX.length, e.target.id.length);
    var editable = this.state.fields;
    editable[k].checked = !editable[k].checked;
    this.setState({fields: editable});
  }
}