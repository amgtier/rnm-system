import React from 'react';
import {
  Row, Col, Input,
  Button,
} from 'reactstrap';
import RowInput from './RowInput';

export default class AddableRowInput extends React.Component {
  constructor(props){
    super(props);
    this.props = props;
    this.state = {  };
    this.tmp_value = new Object();
    this.tmp_props = new Array();
    this.props.inputProps.map((val, idx) =>{ 
      this.tmp_props[idx] = {...val};
      this.tmp_props[idx]["idx"] = this.props.values.length;
      this.tmp_props[idx].onChange = (e) => {
        this.tmp_value[val.value_key] = e.target.value;
      };
    });

  }

  render = () => {
    return (
      <div>
        { this.props.values.map((value, idx) =>{

          let valued_props = new Array();
          this.props.inputProps.map((val, j) =>{
            valued_props[j] = {...val};
          });
          valued_props.map((p, k)=>{
            /* todo: possible to combine these to funciton? */
            /* note: set props for each input here. */
            valued_props[k]["value"] = this.props.values[idx][p.value_key];
            valued_props[k]["idx"] = idx;
            valued_props[k]["disabled"] = this.props.disabled ?
              this.props.disabled : valued_props[k].disabled;
          });

          return ( 
              <RowInput
                labelName={ idx == 0 ? this.props.labelName : ""}
                inputProps={ valued_props }
                appendix={ this.rowAppendix(idx) }
              />
            );
          }
          )
        }
        { !this.props.disabled ? <RowInput
          labelName={ this.props.values.length == 0 ? this.props.labelName : ""}
          inputProps={ this.tmp_props }
          appendix={ this.addButton() }
        /> : null }
      </div>
    );
  }

  rowAppendix = (idx) => {
    return (
      <div className="d-inline-block">
        { this.removeButton(idx) }
        { this.props.appendix ? this.props.appendix(idx) : null }
      </div>
      );
  }

  removeButton = (idx) => {
    return (
      <a
        href="#"
        idx={ idx }
        className="mx-1"
        onClick={(e)=>{
          e.preventDefault();
          this.props.onRemove(e);
        }}
      >x</a>
    );
  }

  addButton = () => {
    return (
      <Button
        type="button"
        color="success"
        onClick={(e)=>{
          e.preventDefault();
          if (Object.keys(this.tmp_value).length > 0){
            this.props.onAdd(this.tmp_value);
            this.tmp_value = new Object();
            /* todo: bug; input not cleared after add button clicked */
          }
        }}
      >+</Button>
    );
  }
}