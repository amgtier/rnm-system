import React from 'react';
import { 
  Row, Col,
 } from 'reactstrap';
import RowInput          from '../utils/RowInput';
import BtnSelect         from '../utils/BtnSelect'; 
import * as API from '../APIs';
import * as CONSTANTS from '../Constants';

export default class SearchCriteria extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      labels: null,
      src: new Set(),
    }
    this.setStateLabels();
  }

  render(){
    return (
      <div className="search-criteria">
        <RowInput
          className="col-12 col-md-4 d-inline-block float-left"
          labelName={ CONSTANTS._name }
          labelClassName="float-left d-inline-block"
          inputProps={ {
            type: "search",
            name: "name",
            id: "name",
            className: "col-8 float-right"
          } }
        />
        <RowInput
          className="col-12 col-md-4 d-inline-block float-left"
          labelName={ CONSTANTS._city }
          labelClassName="float-left d-inline-block"
          inputProps={ {
            type: "search",
            name: "city",
            id: "city",
            className: "col-8 float-right"
          } }
        />
        <RowInput
          className="col-12 col-md-4 d-inline-block float-left"
          labelName={ CONSTANTS._phone }
          labelClassName="float-left d-inline-block"
          inputProps={ {
            type: "search",
            name: "phone",
            id: "phone",
            maxLength: 10,
            className: "col-8 float-right"
          } }
        />

        <RowInput
          className="col-12 col-md-4 d-inline-block float-left"
          labelName={ CONSTANTS._township }
          labelClassName="float-left d-inline-block"
          inputProps={ {
            type: "search",
            name: "township",
            id: "township",
            className: "col-8 float-right"
          } }
        />
        <RowInput
          className="col-12 col-md-4 d-inline-block float-left"
          labelName={ CONSTANTS._village }
          labelClassName="float-left d-inline-block"
          inputProps={ {
            type: "search",
            name: "village",
            id: "village",
            className: "col-8 float-right"
          } }
        />
        <RowInput
          className="col-12 col-md-4 d-inline-block float-left"
          labelName={ CONSTANTS._building }
          labelClassName="float-left d-inline-block"
          inputProps={ {
            type: "search",
            name: "building",
            id: "building",
            className: "col-8 float-right"
          } }
        />

        <RowInput
          className="col-12 d-inline-block float-left"
          labelName={ CONSTANTS._address }
          labelClassName="float-left d-inline-block"
          inputProps={ {
            type: "search",
            name: "address",
            id: "address",
            className: "float-right",
          } }
        />


        <RowInput
          className="col-12 col-md-4 d-inline-block float-left"
          labelName={ CONSTANTS._introducer }
          labelClassName="float-left d-inline-block"
          inputProps={ {
            type: "search",
            name: "introducer_name",
            id: "introducer_name",
            className: "col-8 float-right"
          } }
        />
        <RowInput
          className="col-12 col-md-4 d-inline-block float-left"
          labelName={ CONSTANTS._experience }
          labelClassName="float-left d-inline-block"
          inputProps={ {
            type: "search",
            name: "exp_name",
            id: "exp_name",
            className: "col-8 float-right"
          } }
        />

        <RowInput
          className="col-12 col-md-6 d-inline-block float-left"
          labelName={ CONSTANTS._event }
          inputProps={ [{
            type: "search",
            name: "event_name1",
            id: "event_name1",
            className: "col-5 d-inline-block"
          },
          {
            type: "date",
            name: "event_date1",
            id: "event_date1",
            className: "col-5 d-inline-block"
          },
          ] }
        />
        <RowInput
          className="col-12 col-md-6 d-inline-block float-left"
          labelName={ CONSTANTS._event }
          inputProps={ [{
            type: "search",
            name: "event_name2",
            id: "event_name2",
            className: "col-5 d-inline-block"
          },
          {
            type: "date",
            name: "event_date2",
            id: "event_date2",
            className: "col-5 d-inline-block"
          },
          ] }
        />


        <Row className="col-12 d-inline-block float-left">
          <Col xs="auto" md="2" className="font-weight-bold text-left float-left d-inline-block">
            { CONSTANTS._labels }
          </Col>
          <Col xs="12" md="10" className="text-left float-left d-inline-block">
            <BtnSelect
              onClick={async (e) => {
                console.log(this.state.src)
                let active = e.target.className.includes("active");
                let obj = this.state.src;
                if (active){
                  obj.delete(e.target.value);
                }
                else{
                  obj.add(e.target.value);
                }
                console.log(active)
                console.log(obj)
                console.log(e.target.value)
                await this.setState({src: obj});
                this.props.estSrcHandler({target: {
                  name: 'label', 
                  value: Array.from(this.state.src).join(","),
                }, }, this.state.src);
              }}
            >
              { this.state.labels ? this.state.labels.map((label, k) => {
                return (
                  <option 
                    key={ k } 
                    value={ label.id } 
                    size="sm"
                    className="my-1 mx-1"
                    color="primary"
                    active={ this.state.src ? this.state.src.has(String(label.id)) : false }
                  >
                    { label.name }
                  </option>
                  );
              }) : '' }
            </BtnSelect>
          </Col>
        </Row>

      </div>
      );
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
}