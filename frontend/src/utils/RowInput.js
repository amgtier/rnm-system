import React from 'react';
import {
  Row, Col, Input,
} from 'reactstrap';

export default class RowInput extends React.Component {
  constructor(props){
    super(props);
    this.props = props;
    this.state = {
    }
    this.ratio = {label: 1, input: 4};
  }

  render = () => {
    if (this.props.inputProps == undefined){ return; }
    if (this.props.inputProps.length == undefined ||
      this.props.labelName == undefined || 
        (typeof this.props.labelName == typeof String() || this.props.labelName.length == 1) 
        && this.props.inputProps.length != undefined){
      /* one input only */
      let span_label = parseInt(12 / (this.ratio.label + this.ratio.input) * this.ratio.label);
      let span_input = 12 - span_label;
      return (
        <Row className={ this.props.className }>
          <Col
            xs="auto"
            md={ span_label }
            className={ this.props.labelClassName ? 
                this.props.labelClassName + " font-weight-bold text-left d-inline-block" :
                "font-weight-bold text-left d-inline-block" } >
              { this.props.labelName }
          </Col>
          <Col
            xs="12"
            md={ span_input }
            className="text-left text-nowrap d-inline-block"
          >{ this.props.inputProps.length == undefined ?(
            <Input 
              { ...this.props.inputProps }  
              className={
                this.props.inputProps ?
                this.props.inputProps.className + " mx-1" : "mx-1"
              }
            />
          ) : this.props.inputProps.map((props, idx) => 
            <Input
              key={ idx }
              { ...props }
              className={
                props.className ? 
                props.className + " mx-1" : "mx-1"
              } 
            />
          )
          }
            <span>{ this.props.appendix }</span>
          </Col>
        </Row>
      );
    }
    else{
      let span_each = 12 / this.props.inputProps.length;
      return (
        <Row>
          { this.props.inputProps.map((props, idx) => {
            let span_label = parseInt(12 / (this.ratio.label + this.ratio.input) * this.ratio.label);
            let span_input = parseInt(12 / (this.ratio.label + this.ratio.input) * this.ratio.input);
            return(
              <Col 
                xs="12" 
                md={ span_each } 
                className="text-left mx-0 px-0 d-inline-block"
              >
                { idx == 0 && this.props.labelName.length > 0
                  || (typeof this.props.labelName == typeof Array() 
                    && this.props.labelName.length > idx) ?(
                  <Col 
                    xs="auto" 
                    md={ span_label }

                    className={ this.props.labelClassName ? 
                      this.props.labelClassName + " font-weight-bold text-left d-inline-block" :
                      "font-weight-bold text-left d-inline-block" }
                  >
                      { this.props.labelName[idx] }
                  </Col>
                ) : "" }
                <Col 
                  xs="12" md={ span_input } className="text-left d-inline-block">
                    <Input
                      key={ idx }
                      { ...props }
                      className={
                        props.className ? 
                        props.className + " mx-1" : "mx-1"
                      }
                    />
                </Col>
              <span>{ idx == this.props.inputProps.length - 1 ? this.props.appendix : "" }</span>
              </Col>
            );
          }) }
        </Row>
      );
    }
  }
}