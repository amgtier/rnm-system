import React from 'react';
import {
  Container,
  Row, Col,
  ListGroup, ListGroupItem,
  Input, Label,
  Button,
  Table,
} from 'reactstrap';
import GetToday from '../utils/GetToday';
import ErrorMsg from '../utils/ErrorMsg';
import EventTypeSelector from '../utils/EventTypeSelector';
import { RosterHeaderTable, EventHeaderTable} from '../utils/HeaderTable';
import * as API from '../APIs';
import * as CONSTANTS from '../Constants';

export default class RosterUpload extends React.Component {
  constructor() {
    super()
    this.state = {
      roster: true,
      eventDate: this.today,
      eventType: 1,
      hash: null,
      bufferedRosterTable: '',
      btnConfirmImport: null,
      'select-file': CONSTANTS._upload_file,
    };
    this.uploadStatus = {
      c: CONSTANTS._record_conflict,
      a: CONSTANTS._record_event_added,
      u: CONSTANTS._record_updated,
      n: CONSTANTS._record_added,
    }
    this.today = GetToday();
  }

  /************************************************************/
  setMessage = (msg, timeout=5) => {
    this.setState({error: msg}, ()=>{
      setTimeout(()=>this.setState({error: ''}), timeout * 1000)
    })
  }
  /************************************************************/

  render(){
    let headerFormat = this.state.roster ? CONSTANTS.DOMAIN + CONSTANTS._roster_template_url : CONSTANTS.DOMAIN + CONSTANTS._event_roster_template_url;
    let eventDetails = this.state.roster ? '' : (
    <div>
      <Row className="my-1">
        <Col className="text-left" xs="2">{ CONSTANTS._event_date }</Col>
        <Col lg="3">
          <Input 
            type        ="date" 
            ref         ="event_date" 
            className   ="text-center col" 
            defaultValue={ this.today }
            onChange    ={ (e) => this.setState({eventDate: e.target.value}) } 
          />
        </Col>
      </Row>
      <Row className="my-1">
        <Col className="text-left" xs="2">{ CONSTANTS._event_name }</Col>
        <Col className="text-left">
          <EventTypeSelector 
            active={ this.state.eventType } 
            setEventType={ (eType) => { this.setState({eventType: eType}) } }
          />
        </Col>
      </Row>
    </div>
    );

    return (
    <div>
      <Container>
        <ErrorMsg>{ this.state.error }</ErrorMsg>
        <Row className="mx-5 my-1">
          <h2 className="text-left">{ CONSTANTS._select_upload_type }</h2>
        </Row>

        <Row className="mx-5">
          <Col xs="2">
            <ListGroup>
              <ListGroupItem 
                className={ this.state.roster ? 'active' : null }
                tag="a" 
                href="#" 
                onClick={ ()=>{this.setState({'roster': true})} }
              >{ CONSTANTS._roster }</ListGroupItem>
              <ListGroupItem 
                className={ !this.state.roster ? 'active' : null }
                tag="a" 
                href="#" 
                onClick={ ()=>{this.setState({'roster': false})} }
              >{ CONSTANTS._event_roster }</ListGroupItem>
            </ListGroup>
          </Col>
          <Col>
            {eventDetails}
          </Col>
        </Row>

        <Row className="mx-5 my-5">
          <Col className="text-left"><h2>{ CONSTANTS._file_columns }</h2></Col>
        </Row>

        <Row className="mx-5 my-1 header-table">
          { this.state.roster ? (<RosterHeaderTable></RosterHeaderTable>) : (<EventHeaderTable></EventHeaderTable>) }
        </Row>

        <Row>
          <Label className="my-0">
            <span className="btn btn-success" style={{cursor: "pointer"}}>{ this.state['select-file'] }</span>
            <Input 
              ref={ ref => this.fileUpload = ref } 
              type="file" 
              name="xlsfile" 
              id="xlsfile" 
              onChange={
                async (e) => {
                  this.setMessage('');
                  this.setState({
                    'select-file': CONSTANTS._uploading,
                    'bufferedRosterTable': null,
                  });

                  let tableBufferedRoster = this.tableBufferedRoster.bind(this)

                  /* check file extension */
                  let ext = e.target.files[0].name.split(".");
                  ext = ext[ext.length - 1];
                  if (ext !== "xlsx" && ext !== "xls"){
                    this.setMessage(CONSTANTS._extension_error);
                    return;
                  }

                  const data = new FormData();
                  data.append('file', e.target.files[0]);
                  if (!this.state.roster){
                    data.append('event_date', this.state.eventDate);
                    data.append('event_type', this.state.eventType);
                  }
                  fetch(API.UPLOAD_XLSX,{
                    method: "POST",
                    headers: {
                      Authorization: `JWT ${localStorage.getItem('token')}`,
                    },
                    body: data,
                  })
                  .then(res => res.json())
                  .then(
                    async (result) => {
                      if (result.result == 'ok'){
                        await this.setState({btnConfirmImport: CONSTANTS.CONFIRM_IMPORT,});
                        this.setState({
                          hash: result.hash,
                          bufferedRosterTable: tableBufferedRoster(result, this.confirmImport.bind(this)),
                          'select-file': CONSTANTS._upload_again,
                        });
                      }
                      else if (result.message == CONSTANTS.COLUMNS_INCONSISTENT){
                        if (this.state.roster){
                          this.setState({'select-file': `${CONSTANTS._roster} ${CONSTANTS._column_error}`});
                        }
                        else{
                          this.setState({'select-file': `${CONSTANTS._event_roster} ${CONSTANTS._column_error}`});
                        }
                      }
                      else{
                        throw result.message;
                      }
                    }
                  )
                  .catch(err => {
                    this.setState({'select-file': CONSTANTS._server_error});
                    console.log(err);
                  });
                }
              } 
              onClick={(e)=>{ e.target.value = null }} 
              hidden
            />
          </Label>
          <Button className="mx-1" color="success" tag="a" href={ headerFormat }>
            { CONSTANTS._downalod_tempalte }
          </Button>
        </Row>
      </Container>

      <Container fluid={ true }>
        <Row className="my-5">
          <Col>
            { this.state.bufferedRosterTable }
          </Col>
        </Row>
        <Row className="my-5">
          <Col>
            { (this.state.btnConfirmImport) ? (
            <Row className="text-left">
              <Button 
              onClick={ this.confirmImport } 
              color={this.state.btnConfirmImport == CONSTANTS.CONFIRM_IMPORT ? "success" : "default"}
              disabled={this.state.btnConfirmImport == CONSTANTS.CONFIRM_IMPORT ? false : true}
              >
              { this.state.btnConfirmImport }
              </Button>
            </Row>
            ) : '' }
          </Col>
        </Row>
      </Container>
    </div>
    );
  }

  confirmImport = async (e) => {
    this.setState({btnConfirmImport: CONSTANTS._importing})
    const data = new FormData();
    data.append('hash', this.state.hash);

    fetch(API.CONFIM_IMPORT, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
      body: data,
    })
    .then(res => res.json())
    .then(
      (result) => {
        let _msg = `${CONSTANTS._record_imported}: ${result.len.success} / ${result.len.total}`;
        this.setState({btnConfirmImport: _msg});
        this.setMessage(_msg, 600);
        return;
    })
    .catch(err => {
      this.setState({
        btnConfirmImport: CONSTANTS._import_failed,
        'select-file': CONSTANTS._import_failed,
      })
      this.setMessage(CONSTANTS._import_failed, 600);
    });
  }

  tableBufferedRoster(returnedJson, clickHandler){
    if (returnedJson == null){
      return;
    }
    else{
      let roster = JSON.parse(returnedJson.roster);
      let headers = Object.keys(roster[0]);
      return (
        <div>
          <Table className="text-nowrap">
            <thead>
              <tr>
                <th></th>
                {headers.map((k) => { return (<th key={ k }>{ CONSTANTS.header_name[k] }</th>); })}
              </tr>
            </thead>
            <tbody>
              {roster.map((item, key) => {
                return (
                  <tr key={ key }>
                    <td>{ key + 1 }</td>
                    { headers.map((k) =>{
                      if (k === 'status'){
                        return (<td key={ k } className="text-danger"> { this.uploadStatus[item[k]] } </td>)
                      }
                      else{ return ( <td key={ k }>{ item[k] }</td> ); }
                    }) }
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      );
    }
  }
}