import React from 'react';

export default class ErrorMsg extends React.Component {
  render = () => {
    return (
      <p className="position-fixed" style={{right: 10, top: 70}}>
        { this.props.children }
      </p>
    );
  }
}