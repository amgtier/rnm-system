import React from 'react';
import {
  Button, Row, Col,
} from 'reactstrap';
import * as CONSTANTS from '../Constants';

export default class BtnSelectMulti extends React.Component {
  constructor(props){
    super(props);
    this.props = props;
  }

  componentDidMount = () => {  }

  render = () => {
    this.options = this.props.children;
    return (
      <div>
      <Row>
        { (this.options) ? this.options.map((opt, k)=>{
          return (
            <Col xs="auto" key={ k } className="mx-0 px-0">
              <Button 
                key={ k } 
                type="button"
                active={ opt.props.active }
                outline={ !opt.props.active }
                className={ opt.props.className ? opt.props.className : this.props.className }
                value={ opt.props.value ? opt.props.value : opt.props.children }
                color={ opt.props.color ? opt.props.color : this.props.color }
                size={ opt.props.size ? opt.props.size : this.props.size }
                disabled={ opt.props.disabled || this.props.disabled }
                onClick={ opt.props.onClick ? opt.props.onClick : this.props.onClick }
              >
                { opt.props.children }
              </Button>
            </Col>
            );
        }) : ''}
      </Row>
      </div>
    );
  }
}