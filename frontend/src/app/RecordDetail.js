import React from 'react'; 
import { Redirect } from 'react-router-dom'; 
import{  
  Container, Row, Col, 
  Button, Form, Input, 
  Label, Table,
  Collapse, Card, CardHeader, CardBody, CardText,
  } from 'reactstrap'; 
import BtnSelect from '../utils/BtnSelect'; 
import ErrorMsg from '../utils/ErrorMsg';
import RowInput from '../utils/RowInput';
import AddableRowInput from '../utils/AddableRowInput';
import * as API from '../APIs'; 
import * as CONSTANTS from '../Constants'; 

export default class RecordDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      role: props.role,
      'event-list': this.props.action === 'add' ? false : true ,
      
      info: null,
      sid: null,
      disabled: null,

      gender: 'm',
      connection: 'A',
      label_selected: new Set(),
      networking: new Array(),
      exp: new Array(),

      labels: null,
    };

    this.timeout = null;
    this.load_info = false;
    this.getRole();
  }

  /************************************************************/
  setMessage = (msg, timeout=5) => {
    this.setState({error: msg}, ()=>{
      setTimeout(()=>this.setState({error: ''}), timeout * 1000)
    })
  }
  /************************************************************/

  componentDidMount = () => {
    this.setStateLabels();
    if (this.props.action === "edit"){
      if (this.props.match.params.id !== null){
        this.setStateRecordDetail(this.props.match.params.id);
      }  
    }
  }

  render(){
    if (this.state.role == null){
      setTimeout(()=>{
        if (this.state.role == null){
          this.getRole();
          if (this.state.role == null){
            window.location.reload();
          }
        }
      }, 3000);
    }

    /* commented for DISABLING testing */
    let disabled;
    if (this.state.role == null){ disabled = true; }
    else { disabled = this.state.role == "reader" ? true : false; }
    if (disabled != this.state.disabled){ this.setState({disabled: disabled}) }
    /* ******************************* */

    let add_or_save_btn;
    if (!this.state.disabled){
      add_or_save_btn = this.props.action === "add" ? (
        <Button type="submit" className="float-left" color="success">{ CONSTANTS._create }</Button>
      ) : (
        <Button type="submit" className="float-left" color="success">{ CONSTANTS._update }</Button>
      )
    }
    else{
      add_or_save_btn = '';
    }

    let event_list_btn = (this.state['event-list']) ? (
      <Button 
        color="success" 
        className="mx-1" 
        onClick={ () => this.props.history.push(`/event/${this.state.sid}`) }
      >
        { CONSTANTS._event_list }
      </Button>
    ) : '';
    let del_record_btn = (this.state['event-list'] && !this.state.disabled && this.state.role == "superuser") ? (

      <Button color="danger" className="float-right" onClick={ this.removeRecord }>{ CONSTANTS._delete }</Button>
    ) : '';

    let record_img;
    if (this.state.info){ /* no image allowed at create */
      if (this.state.info.img){
        record_img = (
          <div 
            className="record-img"
            style={{
              width: "300px", 
              height: "300px", 
              "backgroundSize": "300px auto",
              "backgroundImage": (this.load_info) ? `url(${API.FILES}/${this.state.info.img})` : '',
            }}
          />
        );
      }
    }
    let self_introducer = (this.load_info && this.state.info && this.state.info.introducer_name == this.state.info.name) 
      ? "self-introducer" : "";
    let test_button = this.testButton() && false;
    return (
      <Container className="my-2 record-info">
        <ErrorMsg>{ this.state.error }</ErrorMsg>
        { test_button ? test_button : null }
        <Form onSubmit={ this.props.action == 'add' ? this.addRecordHandler : this.saveChangesHandler } inline>
          <Row>
            <Col>
            <Row>
              <Col xs="12">
                { event_list_btn }
                { add_or_save_btn }
              </Col>
            </Row>

            <Row>
              <Col xs="auto" md="2" className="font-weight-bold text-left">{ CONSTANTS._name }</Col>
              <Col xs="12" md="6" className="text-left">
                <Input 
                type="text"
                className="required mx-1"
                name="name" 
                placeholder={ CONSTANTS._required }
                tabIndex="1" 
                defaultValue={(this.load_info) ? this.state.info.name : ''} 
                required
                disabled={ this.props.action == 'add' ? false : true }
                />
              </Col>
              <Col xs="12" md="4" className="text-left">
                {this.props.action=="edit"?
                  (<div>
                    <Label htmlFor="uploadImage">
                      <Button 
                        tag="span" 
                        color="secondary" 
                        hidden={this.state.disabled}
                      >
                        { CONSTANTS._upload_image }
                      </Button>
                    </Label>
                    { record_img }
                  </div>)
                  : ''}
              </Col>
            </Row>
            <RowInput
              labelName={ CONSTANTS._phone }
              inputProps={ {
                type: "text",
                name: "phone1",
                placeholder: CONSTANTS._required,
                maxLength: 10,
                tabIndex: 2,
                defaultValue: (this.load_info) ? this.state.info.phone1 : '',
                onChange: this.updateRecord,
                disabled: this.state.disabled,
                className: "required",
                required: true,
              } }
            />
            <RowInput
              labelName={ CONSTANTS._phone2 }
              inputProps={ {
                type: "text",
                name: "phone2",
                maxLength: 10,
                tabIndex: 3,
                defaultValue: (this.load_info) ? this.state.info.phone2 : '',
                onChange: this.updateRecord,
                disabled: this.state.disabled,
              } }
            />
            <RowInput
              labelName={ CONSTANTS._landline }
              inputProps={ {
                type: "text",
                name: "landline",
                maxLength: 10,
                tabIndex: 4,
                defaultValue: (this.load_info) ? this.state.info.phone2 : '',
                onChange: this.updateRecord,
                disabled: this.state.disabled,
              } }
            />

            <Row>
              <Col xs="auto" md="2" className="font-weight-bold text-left">{ CONSTANTS._connection }</Col>
              <Col xs="12" md="6" className="text-left">
                <BtnSelect 
                  color="primary" 
                  tabIndex="4"
                  disabled={ this.state.disabled }
                  size="sm"
                  onClick={(e) => {
                      this.setState({connection: e.target.value});
                    }
                  }
                >
                  { ["A", "B", "C", "D", "E"].map((val, k) => {
                    return (
                      <option 
                        key={ k } 
                        active={ this.state.connection == val }
                        class="mx-1"
                      >
                        { val }
                      </option>
                    );
                  })}
                </BtnSelect>
              </Col>
            </Row>

            <Row>
              <Col xs="auto" md="2" className="font-weight-bold text-left">{ CONSTANTS._gender }</Col>
              <Col xs="12" md="6" className="text-left">
                <BtnSelect 
                  color="primary" 
                  active={ this.state.gender } 
                  onClick={ (e)=>{
                      this.setState({gender: e.target.value});
                    }
                  }
                  tabIndex="6"
                  disabled={this.state.disabled}
                >
                  <option 
                    value="m" 
                    size="md" 
                    active={ this.state.gender == "m" }
                  >
                      { CONSTANTS._male }
                    </option>
                  <option 
                    value="f" 
                    size="md" 
                    active={ this.state.gender == "f" }
                  >
                      { CONSTANTS._female }
                    </option>
                </BtnSelect>
              </Col>
            </Row>

            <RowInput
              labelName={ [CONSTANTS._city, CONSTANTS._township] }
              inputProps={ [
                {
                  type: "text",
                  name: "city",
                  maxLength: 10,
                  tabIndex: 7,
                  defaultValue: (this.load_info) ? this.state.info.city : '',
                  onChange: this.updateRecord,
                  disabled: this.state.disabled,
                  placeholder: CONSTANTS._required,
                  className: "required",
                  required: true,
                },
                {
                  type: "text",
                  name: "township",
                  maxLength: 10,
                  tabIndex: 8,
                  defaultValue: (this.load_info) ? this.state.info.township : '',
                  onChange: this.updateRecord,
                  disabled: this.state.disabled,
                  placeholder: CONSTANTS._required,
                  className: "required",
                  required: true,
                },
              ]
               }
            />
            <RowInput
              labelName={ [CONSTANTS._village, CONSTANTS._building] }
              inputProps={ [
                {
                  type: "text",
                  name: "village",
                  maxLength: 10,
                  tabIndex: 9,
                  defaultValue: (this.load_info) ? this.state.info.village : '',
                  onChange: this.updateRecord,
                  disabled: this.state.disabled,
                  placeholder: CONSTANTS._required,
                  className: "required",
                  required: true,
                },
                {
                  type: "text",
                  name: "building",
                  maxLength: 10,
                  tabIndex: 10,
                  defaultValue: (this.load_info) ? this.state.info.building : '',
                  onChange: this.updateRecord,
                  disabled: this.state.disabled,
                  placeholder: CONSTANTS._required,
                  className: "required",
                  required: true,
                },
              ]
               }
            />
            <RowInput
              labelName={ CONSTANTS._address }
              inputProps={ {
                type: "text",
                name: "address",
                tabIndex: 11,
                defaultValue: (this.load_info) ? this.state.info.address : '',
                onChange: this.updateRecord,
                disabled: this.state.disabled,
              } }
            />
            <RowInput
              labelName={ CONSTANTS._res_address }
              inputProps={ {
                type: "text",
                name: "res_address",
                tabIndex: 12,
                defaultValue: (this.load_info) ? this.state.info.res_address : '',
                onChange: this.updateRecord,
                disabled: this.state.disabled,
              } }
            />
            <RowInput
              labelName={ [CONSTANTS._introducer] }
              inputProps={ [
                {
                  type: "text",
                  name: "introducer_name",
                  tabIndex: 13,
                  placeholder: CONSTANTS._name,
                  className: self_introducer,
                  defaultValue: (this.load_info) ? this.state.info.introducer_name : '',
                  onChange: this.updateRecord,
                  disabled: this.state.disabled,
                },
                {
                  type: "text",
                  name: "introducer_phone",
                  maxLength: 10,
                  tabIndex: 13,
                  className: self_introducer,
                  defaultValue: (this.load_info) ? this.state.info.introducer_phone : '',
                  onChange: this.updateRecord,
                  disabled: this.state.disabled,
                },
              ] }
            />

            <Row>
              <Col xs="auto" md="2" className="font-weight-bold text-left">{ CONSTANTS._labels }</Col>
              <Col xs="12" md="6" className="text-left">
                <BtnSelect
                  disabled={this.state.disabled}
                  tabIndex="13"
                  onClick={(e) => {
                    let active = e.target.className.includes("active");
                    let obj = this.state.label_selected;
                    if (active){
                      obj.delete(String(e.target.value))
                      this.setState({label_selected: obj});
                    }
                    else{
                      obj.add(String(e.target.value))
                      this.setState({label_selected: obj});
                    }
                    e.target.value = this.setToString(this.state.label_selected);
                  }}
                >
                  { this.state.labels ? this.state.labels.map((label, k) => {
                    return (
                      <option 
                        key={ k } 
                        value={ label.id } 
                        size="sm"
                        className="my-1"
                        color="primary"
                        active={ this.state.label_selected ? this.state.label_selected.has(String(label.id)) : false }
                      >
                        { label.name }
                      </option>
                      );
                  }) : '' }
                </BtnSelect>
              </Col>
            </Row>

            <AddableRowInput
              labelName={ CONSTANTS._experiences }
              values={ this.state.exp }
              onRemove={ (e) => {
                let idx = e.target.getAttribute("idx");
                this.setState({exp: this.state.exp.filter((_, _k)=> idx != _k)})
              }}
              onAdd={(val) => {
                let obj = this.state.exp;
                obj.push({id: null, year: val.year, name: val.name});
                this.setState({exp: obj});
              }}
              disabled={ this.state.disabled }
              inputProps={ [
                {
                  name: "exp_id",
                  value_key: "id",
                  hidden: true,
                },
                {
                  name: "exp_year" ,
                  value_key: "year",
                  type: "text" ,
                  placeholder: CONSTANTS._year,
                  className: "w-30" ,
                  maxLength: "4",
                  tabIndex: "14" ,
                  onChange: (e) => {
                    let idx = e.target.getAttribute("idx");
                    let exp = this.state.exp;
                    exp[idx].year = e.target.value;
                    this.setState({exp: exp});
                  },
                  onKeyDown: (e) => { },
                },
                {
                  className: "w-30" ,
                  type: "text" ,
                  name: "exp_name" ,
                  placeholder: CONSTANTS._exp_name,
                  value_key: "name",
                  tabIndex: "14",
                  onChange: (e) => {
                    let idx = e.target.getAttribute("idx");
                    let exp = this.state.exp;
                    exp[idx].name = e.target.value;
                    this.setState({exp: exp});
                  },
                },
              ] }
            />

            <RowInput
              labelName={ CONSTANTS._birthday }
              inputProps={ {
                type: "date",
                name: "birthday",
                maxLength: 10,
                tabIndex: 16,
                defaultValue: (this.load_info) ? this.state.info.birthday : '',
                onChange: this.updateRecord,
                disabled: this.state.disabled,
              } }
            />
            <RowInput
              labelName={ [CONSTANTS._spouse] }
              inputProps={ [
                {
                  type: "text",
                  name: "spouse_name",
                  tabIndex: 17,
                  placeholder: CONSTANTS._name,
                  defaultValue: (this.load_info) ? this.state.info.spouse_name : '',
                  onChange: this.updateRecord,
                  disabled: this.state.disabled,
                },
                {
                  type: "text",
                  name: "spouse_phone",
                  maxLength: 10,
                  tabIndex: 18,
                  defaultValue: (this.load_info) ? this.state.info.spouse_phone : '',
                  onChange: this.updateRecord,
                  disabled: this.state.disabled,
                },
              ] }
            />


            <AddableRowInput
              labelName={ CONSTANTS._networking }
              values={ this.state.networking }
              onRemove={ (e) => {
                let idx = e.target.getAttribute("idx");
                this.setState({networking: this.state.networking.filter((_, _k)=> idx != _k)})
              }}
              onAdd={(val) => {
                let obj = this.state.networking;
                obj.push({name: val.name, phone: val.year, rel: val.rel, result: val.result});
                this.setState({networking: obj});
              }}
              appendix={ this.showNetworkingResult } 
              disabled={ this.state.disabled }
              inputProps={ [
                {
                  name: "networking_name" ,
                  value_key: "name",
                  type: "text" ,
                  placeholder: CONSTANTS._name,
                  className: "w-25" ,
                  tabIndex: "19" ,
                  onChange: (e) => {
                    let idx = e.target.getAttribute("idx");
                    let networking = this.state.networking;
                    networking[idx].name = e.target.value;
                    this.setState({networking: networking});
                    this.linkNetworking(idx);
                  },
                  onKeyDown: (e) => { },
                },
                {
                  name: "networking_phone" ,
                  value_key: "phone",
                  type: "text" ,
                  placeholder: CONSTANTS._phone,
                  className: "w-25" ,
                  maxLength: 10,
                  tabIndex: 19,
                  onChange: (e) => {
                    let idx = e.target.getAttribute("idx");
                    let networking = this.state.networking;
                    networking[idx].phone = e.target.value;
                    this.setState({networking: networking});
                    this.linkNetworking(idx);
                  },
                },
                {
                  name: "networking_rel" ,
                  value_key: "rel",
                  type: "text" ,
                  placeholder: CONSTANTS._relationship,
                  className: "w-25" ,
                  tabIndex: 19,
                  onChange: (e) => {
                    let idx = e.target.getAttribute("idx");
                    let networking = this.state.networking;
                    networking[idx].rel = e.target.value;
                    this.setState({networking: networking});
                  },
                },
              ] }
            />

            <RowInput
              labelName={ CONSTANTS._memo }
              inputProps={ {
                type: "textarea",
                name: "memo",
                maxLength: 10,
                tabIndex: 200,
                value: (this.load_info) ? this.state.info.memo : this.state.memo,
                style: {width: "100%"},
                onChange: (e) => {
                  if (this.load_info){
                    let info = this.state.info;
                    info.memo = e.target.value;
                    this.setState({info: info});
                    this.updateRecord(e);
                  }
                  else{ this.setState({memo: e.target.value}); }
                },
                disabled: this.state.disabled,
              } }
            />

            <RowInput
              labelName={ CONSTANTS._conflict_record }
              inputProps={ {
                type: "textarea",
                name: "conflict",
                maxLength: 10,
                tabIndex: 200,
                value: (this.load_info) ? this.state.info.conflict : this.state.conflict,
                style: {width: "100%"},
                classNmae: "conflict",
                onChange: (e) => {
                  if (this.load_info){
                    let info = this.state.info;
                    info.conflict = e.target.value;
                    this.setState({info: info});
                    this.updateRecord(e);
                  }
                  else{ this.setState({memo: e.target.value}); }
                },
                disabled: this.state.disabled,
              } }
            />
            <div className="col-12">
              { add_or_save_btn }
              { del_record_btn }
            </div>

            { this.state.redirect ? <Redirect to={`/record/${this.state.redirect}`} /> : null}
            </Col>
          </Row>
        </Form>
        <Form id="img_form">
          <Input type="file" name="img" id="uploadImage" hidden onChange={ this.uploadImage }/>
        </Form>
      </Container>
    );
  }

  getRole = () => {
    fetch(API.CURRENT_USER, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.json())
    .then(json => {
      if (json.username != null){
        this.setState({username: json.username, role: json.role});
      }
      else{
        this.setState({
          username: null,
          logged_in: false,
          permission: null,
          role: null,
        });
        localStorage.removeItem('token');
      }
    });
  }

  addRecordHandler = (e) => {
    e.preventDefault();
    let data = new FormData(e.target);
    data.append('gender', this.state.gender);
    data.append('connection', this.state.connection);
    data.append('label', Array.from(this.state.label_selected).join(",")); /* label */
    this.state.exp.map((v, k)=>{
      if (v.name.length > 0 || v.year.length > 0){
        data.append('exp', [v.id, v.name, v.year]);
      }
      return null;
    });
    this.state.networking.map((n, k)=>{ /* label */
      if (n.name.length > 0 || n.phone.length > 0){
        data.append('networking', [n.id, n.name, n.phone, n.rel, n.result ? n.result.sid : null]);
      }
      return null;
    });
    fetch(API.RECORD_ADD, {
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
      if (json.status === "error"){
        this.setMessage(this.msg_dict[json.msg]);
      }
      else{
        this.setState({redirect: json.sid})
      }
    })
    .catch(err => {console.log(err)});
  }

  updateRecord = (e) => {
    /* for read-time update without Save Button click */
  }

  saveChangesHandler = (e) => {
    e.preventDefault();
    let data = new FormData(e.target);
    data.append('id', this.state.sid);
    data.append('gender', this.state.gender);
    data.append('connection', this.state.connection);
    data.append('label', this.setToString(this.state.label_selected)); /* label */

    this.state.exp.map((v, k)=>{ /* memo */
      if (v.name.length > 0 || v.year.length > 0){
        data.append('exp', [v.id, v.name, v.year]);
      }
      return null;
    });

    this.state.networking.map((n, k)=>{ /* label */
      if (n.name.length > 0 || n.phone.length > 0){
        data.append('networking', [n.id, n.name, n.phone, n.rel, n.result ? n.result.sid : null]);
      }
      return null;
    });

    fetch(API.RECORD_SAVE, {
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
      if (json.status === "error"){
        this.setMessage(this.msg_dict[json.msg]);
      }
      else{
        this.setMessage(CONSTANTS._saved);
        window.location.reload();
      }
    })
    .catch(err => {console.log(err)});
  }

  uploadImage = (e)=>{
    e.preventDefault();

    let data = new FormData();
    data.append('img', e.target.files[0]);
    data.append('name', this.state.info.name);
    data.append('phone1', this.state.info.phone1);
    
    fetch(API.RECORD_IMAGE, {
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
      if (json.result == 'done'){
        window.location.reload();
      }
    })
    .catch(err => {console.log(err)});
  }

  removeRecord = () => {
    if (!this.state.sid){ return; }
    let data = new FormData();
    data.append('sid', this.state.sid);
    fetch(API.RECORD_REMOVE, {
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
      if (json.result == 'done'){
        this.props.history.push("/");
      }
    })
    .catch(err => {console.log(err)});
  }

  toStateInfo = (parsed_roster) => {
    return(
      { info: {
        name: parsed_roster.name ? parsed_roster.name : undefined,
        phone1: parsed_roster.phone1 ? parsed_roster.phone1 : undefined,
        phone2: parsed_roster.phone2 ? parsed_roster.phone2 : undefined,
        landline: parsed_roster.landline ? parsed_roster.landline : undefined,
        email: parsed_roster.email ? parsed_roster.email : undefined,
        gender: parsed_roster.gender ? parsed_roster.gender : undefined,
        city: parsed_roster.city ? parsed_roster.city : undefined,
        township: parsed_roster.township ? parsed_roster.township : undefined,
        village: parsed_roster.village ? parsed_roster.village : undefined,
        address: parsed_roster.address ? parsed_roster.address : undefined,
        building: parsed_roster.building ? parsed_roster.building : undefined,
        res_address: parsed_roster.res_address ? parsed_roster.res_address : undefined,
        birthday: parsed_roster.birthday ? parsed_roster.birthday : undefined,
        connection: parsed_roster.connection ? parsed_roster.connection : undefined,
        conflict: parsed_roster.conflict ? parsed_roster.conflict : undefined,
        memo: parsed_roster.memo ? parsed_roster.memo : undefined,
        introducer_name: parsed_roster.introducer_name ? parsed_roster.introducer_name : undefined,
        introducer_phone: parsed_roster.introducer_phone ? parsed_roster.introducer_phone : undefined,
        spouse_name: parsed_roster.spouse_name ? parsed_roster.spouse_name : undefined,
        spouse_phone: parsed_roster.spouse_phone ? parsed_roster.spouse_phone : undefined,
        label: parsed_roster.label ? parsed_roster.label : undefined,
        exp: parsed_roster.exp ? parsed_roster.exp : undefined,
        img: parsed_roster.img ? parsed_roster.img : undefined,
      }
    });
  }

  setStateRecordDetail = (sid) => {
    let data = new FormData();
    data.append('sid', sid)
    fetch(API.SEARCH, {
      method: 'POST',
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
      body: data,
    })
    .then(res => {
      if (res.status >= 400 && res.status < 500){
        /* reload to prevent data loss */
        window.location.reload();
      }
      return res.json()
    })
    .then(json => {
      let parsed = JSON.parse(json);
      this.load_info = true;
      this.setState(this.toStateInfo(parsed.roster[0]));

      let label_selected = this.state.label_selected;
      parsed.roster[0].label.map(i=>label_selected.add(String(i)));
      
      let exp = [];
      parsed.roster[0].exp.map(i=>exp.push({id: i[0], year: i[1], name: i[2]}));
      
      /* networking */
      let networking = [];
      parsed.roster[0].networking.map(i=>networking.push({
        id: i[0], 
        name: i[1], 
        phone: i[2], 
        rel: i[3], 
        result: i[4] ? {status: CONSTANTS._linked, sid: i[4]} : null,
      }));
      parsed.roster[0].networking_passive.map(i=>networking.push({
        id: -1,
        name: i[0], 
        phone: i[1], 
        rel: i[2] + CONSTANTS._be_linked, 
        result: i[3] ? {status: CONSTANTS._be_linked, sid: i[3]} : null,
      }));

      this.setState({
        sid: parsed.roster[0].id,
        label_selected: label_selected,
        connection: parsed.roster[0].connection ? parsed.roster[0].connection : undefined,
        gender: parsed.roster[0].gender ? parsed.roster[0].gender : undefined,
        exp: exp,
        networking: networking,
      });
    })
    .catch(err => { console.log(err); });
  }

  setStateLabels = () => {
    var json_labels = null;
    fetch(API.GET_LABELS)
    .then(res=>res.json())
    .then(json=>{
      json_labels = JSON.parse(json)["label"];
      json_labels = json_labels;
      this.setState({labels: json_labels});
    });
  }

  stringToSet = (str, sep=",") => {
    let _s = new Set(str.split(sep));
    _s.map((val)=> parseInt(val) );
    return _s;
  }

  setToString = (set, sep=",") => {
    return Array.from(set).join(",");
  }

  linkNetworking = (idx) => {
    let networking = this.state.networking;
    if ((networking[idx].name.length + networking[idx].phone.length) == 0){ return; }

    let data = new FormData();
    data.append('name', networking[idx].name);
    data.append('phone', networking[idx].phone);
    data.append('show-city', true);
    data.append('show-phone1', true);
    fetch(API.SEARCH, {
      method: 'POST',
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
      body: data,
    })
    .then(res => {
      if (res.status >= 400 && res.status < 500){
        console.log('authentication error')
      }
      return res.json()
    })
    .then(json => {
      let parsed = JSON.parse(json);
      console.log(parsed)
      this.setNetworkingResult(idx, parsed);
    })
    .catch(err => {console.log(err)});
  }

  showNetworkingResult = (idx) => {
    if (this.state.networking[idx].result){
      if (this.state.networking[idx].result.status == CONSTANTS._record_cadidates){
        return (
          <div className="d-inline-block">
            <Button
              color="success"
              onClick={(e)=>{
                e.preventDefault();
                let networking = this.state.networking;
                networking[idx].result.collapse = !networking[idx].result.collapse;
                /* close others */
                networking.map((_, _k)=> {
                  if (idx != _k && networking[_k].result != null){
                    if (networking[_k].result.status == CONSTANTS._record_cadidates){
                      networking[_k].result.collapse = true;
                    }
                  }
                  return null;
                });
                console.log(this.state.networking)
                this.setState({networking: networking});
              }}
            >{ CONSTANTS._record_cadidates }</Button>
            <div className="d-inline">{ this.state.networking[idx].result.roster() }</div>
          </div>
          );
      }
      else{
        return this.state.networking[idx].result.status;
      }
    }
  }

  setNetworkingResult = (idx, parsed) => {
    let result = {status: null}
    let networking = this.state.networking;
    if (parsed.roster.length === 0){
      /* new record (to be created) */
      result.status = CONSTANTS._new_record;
      result.sid = -1;
    }
    else if (parsed.roster.length === 1){
      /* record connected */
      /* regex removes hyphens */
      if (parsed.roster[0].name == networking[idx].name 
        && parsed.roster[0].phone1.replace(new RegExp("-", "g"), "")
          == networking[idx].phone){
        result.status = CONSTANTS._linked;
        result.sid = parsed.roster[0].id;
      }
    }
    else{
      /* record candidates (to be selected) */
      result.status = CONSTANTS._record_cadidates;
      result.collapse = true;
      result.roster = () => {
        return (
          <Collapse isOpen={!networking[idx].result.collapse} style={{position: "absolute", "z-index": "1"}}>
            <Card>
              <CardHeader>{networking[idx].name}/{networking[idx].phone}</CardHeader>
              <CardBody>
                <CardText>
                  { parsed.roster.map((r, _k) => (
                    <p><a href="#" onClick={e=>{
                      e.preventDefault();
                      let networking = this.state.networking;
                      networking[idx].result.sid = r.id;
                      networking[idx].result.status = CONSTANTS._linked;
                      networking[idx].name = r.name;
                      /* regex removes hyphens */
                      networking[idx].phone = r.phone1.replace(new RegExp("-", "g"), "");
                      this.setState({networking: networking})
                    }}>{r.name} {r.city} {r.phone1}</a></p>
                    )) }
                </CardText>
              </CardBody>
            </Card>
          </Collapse>
          );
      }
    }
    networking[idx].result = result;
    console.log(result.status)
    this.setState({networking: networking});
  }

  testButton = () => {
    /* cute test button to DISABLED mode.                        */
    /* need to comment out some lines of code as commented above */
    return (
      <Button 
        type="button"
        color="danger"
        onClick={ e=>{
          this.setState({disabled: !this.state.disabled});
          console.log(this.state)
        }}
      >
        Test disabled
      </Button>
    );
  }
}