import React from 'react';
import { 
  Container,
	Row, Col,
	Button,
  Form, Label, Input,
  Table,
 } from 'reactstrap';
import RowInput          from '../utils/RowInput';
import BtnSelect         from '../utils/BtnSelect'; 
import SelectInfo        from '../utils/SelectInfo.js';
import SearchCriteria    from '../utils/SearchCriteria.js';
import * as API from '../APIs';
import * as CONSTANTS from '../Constants';
import { saveAs } from 'file-saver';
import ErrorMsg from '../utils/ErrorMsg';
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default class Search extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      search_result: null,
      label_selected: {target: {name: "label", value:""}},
      select_info: new Set(""),
      'export-btn': null,
      error: null,
      status: null,
    };
  }

  /************************************************************/
  setMessage = (msg, timeout=5) => {
    this.setState({error: msg}, ()=>{
      setTimeout(()=>this.setState({error: ''}), timeout * 1000)
    })
  }
  /************************************************************/

  render(){
    return (
      <Container>
        <ErrorMsg>{ this.state.error }</ErrorMsg>
        <Form id="search-form" onSubmit={ this.searchSubmitHandler }>
            <Row>
              <Col className="text-left font-weight-bold">{ CONSTANTS._search_criteria }</Col>
            </Row>
            <Row>
              <Col>
                <SearchCriteria 
                  estSrcHandler = {this.estSrcHandler}
                />
              </Col>
            </Row>
            <Row>
              <Col className="text-left px-0 my-1 font-weight-bold">{ CONSTANTS._output_data }</Col>
            </Row>
            <Row>
              <Col>
                <SelectInfo />
              </Col>
            </Row>
            <Row>
              <Col xs="auto">
                <Button type="submit" color="success" form="search-form">{ CONSTANTS._search }</Button>
              </Col>
              <Col xs="auto">
                { this.state["export-btn"] }
              </Col>
            </Row>
            <hr />
            <Row>
              <Col className="text-left font-weight-bold">{ this.state.status }</Col>
            </Row>
            <Row>
              { this.state.search_result }
            </Row>
        </Form>
      </Container>
    );
  }

  tableRoster(roster){
    if (roster == null){
      return;
    }
    else{
      if (roster.length === 0){ return; }
      let headers = Object.keys(roster[0]);
      return (
        <div>
          <Table className="text-nowrap">
            <thead>
              <tr>
                <th></th>
                {headers.map((k) => {
                  if (k !== "id" && k !== "img"){
                    return (
                      <th key={k}>{ CONSTANTS.header_name[k] }</th>
                      );
                  }
                  return null;
                })}
              </tr>
            </thead>
            <tbody>
              {roster.map((item, key) => {
                return (
                  <tr className="record-roster" key={ key } >
                    <td 
                      className="cursor-pointer" 
                      onClick={()=> {
                        /* Go to RecordDetail */
                        this.props.history.push(`/record/${item.id}`)
                      }}
                    >
                      <span className="text-danger">
                        { CONSTANTS.remarks[item.remark] }
                      </span>
                      <FontAwesomeIcon icon={ faEye }/>
                    </td>
                    { headers.map((k) =>{
                      if (k === 'status'){
                        return (
                          <td className="text-danger"> 
                            { this.uploadStatus[item[k]] } 
                          </td>
                          )
                      }
                      else if (k !== "id" && k !== "img" && k != "remark"){
                        return (
                          <td key={k}>{ item[k] }</td>
                          )
                      }
                      return null;
                    }) }
                    <td>
                      <div 
                        style={{
                          float: "right",
                          width: "80px", 
                          height: "80px", 
                          "backgroundImage": `url(${API.FILES}/${item.img})`,
                          "backgroundPosition": "center center",
                          "backgroundRepeat": "no-repeat",
                          "backgroundSize": "100px auto",
                        }}
                      ></div>
                    </td>
                  </tr>
                  );
              })}
            </tbody>
          </Table>
        </div>
        );
    }
  }

  exportBtn = (criteria) => {
    return (
      <Button 
        href="#"
        color="success"
        data-criteria={criteria}
        onClick={(e)=>{
          e.preventDefault();
          let data = new FormData();
          data.append('criteria', e.target.getAttribute('data-criteria'));
          fetch(API.EXPORT_XLSX, {
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
            else if (res.status >= 500){
              this.setMessage(CONSTANTS._server_error_on_download);
            }
            return res.blob()
          })
          .then(blob => {
            saveAs(blob, CONSTANTS._export_file_name);
          })
          .catch(err => {console.log(err)});
        }}
      >
        { CONSTANTS._export_excel }
      </Button>
      );
  }

  searchSubmitHandler = (e) => {
    e.preventDefault();
    let data = new FormData(e.target);
    data.append('label', this.state.label_selected.target.value);
    data.append('select-info', Array.from(this.state.select_info).join(","));
    
    this.searchSubmit(data);
  }

  searchSubmit = (data) => {
    this.setState({status: CONSTANTS._searching});
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
      this.setState({
        search_result: this.tableRoster(parsed.roster),
        'export-btn': this.exportBtn(parsed.criteria),
        status: CONSTANTS._search_result,
      });
    })
    .catch(err => {console.log(err)});
  }

  estSrcHandler = (label_selected) => { this.setState({'label_selected': label_selected}); }

}

