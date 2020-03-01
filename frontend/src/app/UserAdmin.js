import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Container,
	Row, Col,
	Button,
  Form, Input,
  Table,
 } from 'reactstrap';
import ErrorMsg from '../utils/ErrorMsg';
import * as API from '../APIs';
import * as CONSTANTS from '../Constants';

export default class UserAdmin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: null,
      role: null,

      user_list: null,
      user_in_edit: null,
    };
  }

  /************************************************************/
  setMessage = (msg, timeout=5) => {
    this.setState({error: msg}, ()=>{
      setTimeout(()=>this.setState({error: ''}), timeout * 1000)
    })
  }
  /************************************************************/

  componentDidMount = () => {
    /* checks user role again */
    fetch(API.USERS, {
      method: 'GET',
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
    .then(res => {
      if (res.status >= 400 && res.status < 500){
        this.setMessage(CONSTANTS._server_error, 9999);
      }
      return res.json()
    })
    .then(async (json) => {
      this.setState({
        username: json.username,
        role: json.role,

        user_list: json.users,
      });
      json.users.map((u, k) => {
        if (u.role == CONSTANTS._leader) {
          u.jur = u.jur.concat({id: -1, city: null, township: null, village: null});
        }
        /* starts with the user's own information */
        if (u.username == this.state.username){ this.setState({user_in_edit: u})}
      })
    });
  }

  render(){
    return (
    <Container className="my-2 record-info">
      <ErrorMsg>{ this.state.error }</ErrorMsg>
      <Row>
        <h2>{ CONSTANTS._user_admin }</h2>
      </Row>
      <Row>
        { this.state.role === "superuser" && this.state.user_list ? this.makeUserList(this.state.user_list) : ''}
      </Row>
      <Row>
        { this.state.user_in_edit ? this.makeEditUser(this.state.user_in_edit) : '' }
      </Row>
    </Container>
    );
  }

  makeUserList = (users) => {
    return (
      <Table bordered>
        <thead>
          <tr>
            <th>{ CONSTANTS._username }</th>
            <th>{ CONSTANTS._email }</th>
            <th>{ CONSTANTS._role }</th>
            <th>{ CONSTANTS._last_login }</th>
          </tr>
        </thead>
        <tbody>
          { users.map((i, k)=>{
          return (
          <tr key={ k } onClick={() => this.setState({user_in_edit: i})}>
            <td> { i.username } </td>
            <td> { i.email } </td>
            <td> { CONSTANTS._role_name[i.role] } </td>
            <td> { i.last_login } </td>
          </tr>
          );
          }) }
        </tbody>
      </Table>
    );
  }

  makeEditUser = (u) => {
    if (!u) return;
    /* Disallowed to edit self and uid == 1 (default superadmin) */
    let disabled = (u.id == 1 || u.username == this.state.username) ? true : false;
    return (
      <div>
        <Form id="edit-user" onSubmit={ this.submitEditUser }>
        <Input name="uid" value={ u.id } hidden />
        <Row>
          <Table>
            <tbody>
              <tr>
                <th>{ CONSTANTS._username }</th>
                <td><Input value={ u.username } disabled /></td>
              </tr>
              <tr>
                <th>{ CONSTANTS._email }</th>
                <td>
                  <Input 
                    type    ="email"
                    value   ={ u.email }
                    name    ="email"
                    onChange={(e) => {
                      let editable = u;
                      editable.email = e.target.value;
                      this.setState({user_in_edit: editable});
                    }}
                  />
                </td>
              </tr>
              <tr>
                <th>{ CONSTANTS._role }</th>
                <td>
                  <Input 
                    type     ="select" 
                    name     ="role"
                    value    ={ u.role }
                    disabled ={ disabled }
                    onChange ={(e) => {
                      let editable = u;
                      editable.role = e.target.value;
                      this.setState({user_in_edit: editable});
                    }} 
                  >
                    <option value={ CONSTANTS._leader }>{ CONSTANTS._role_name[CONSTANTS._nobody] }</option>
                    <option value={ CONSTANTS._leader }>{ CONSTANTS._role_name[CONSTANTS._leader] }</option>
                    <option value={ CONSTANTS._leader }>{ CONSTANTS._role_name[CONSTANTS._reader] }</option>
                    <option value={ CONSTANTS._leader }>{ CONSTANTS._role_name[CONSTANTS._admin] }</option>
                  </Input>
                </td>
              </tr>
            </tbody>
          </Table>
        </Row>

        {u.role == CONSTANTS._leader ? u.jur.map((t, k) => {
          return (
            <Row key={ k }>
              <Input name="jid" value={ t.id } hidden />
              <Input 
                className="w-30" 
                type     ="text" 
                name     ="city"
                placeholder={ CONSTANTS._city }
                value    ={ t.city ? t.city : '' }
                disabled ={ disabled }
                onChange ={(e) => {
                  let editable = u;
                  editable.jur[k].city = e.target.value;
                  this.setState({user_in_edit: editable});
                }}
              />
              <Input 
                className="w-30" 
                type     ="text" 
                name     ="township"
                placeholder={ CONSTANTS._township }
                value    ={ t.township ? t.township : '' }
                disabled ={ disabled }
                onChange ={(e) => {
                  let editable = u;
                  editable.jur[k].township = e.target.value;
                  this.setState({user_in_edit: editable});
                }}
              />
              <Input 
                className="w-30" 
                type     ="text" 
                name     ="village"
                placeholder={ CONSTANTS._village }
                value    ={ t.village ? t.village : '' }
                disabled ={ disabled }
                onChange ={(e) => {
                  let editable = u;
                  editable.jur[k].village = e.target.value;
                  this.setState({user_in_edit: editable});
                }}
              />
              { !disabled ? <a href="#" onClick={(e)=>{
                  e.preventDefault();

                  let editable = u;
                  editable.jur = editable.jur.filter((_n, _k) => { return k != _k });
                  this.setState({user_in_edit: editable});
                }}>x</a> 
              : '' }
            </Row>
            );
        }) : ''}
        <Button className="float-left mx-3" color="success" type="submit" >{ CONSTANTS._save }</Button>
        <Button 
          tag={ Link } 
          to={{pathname: "/reset_password", target: u.username, username: this.state.username}} 
          className="float-left" 
          color="success" 
          type="submit" >{ CONSTANTS._reset_password }
        </Button>
        </Form>
      </div>
      );
  }

  submitEditUser = (e) => {
    e.preventDefault();

    let data = new FormData(e.target);
    fetch(API.USERS, {
      method: 'PUT',
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
      body: data,
    })
    .then(res => {
      if (res.status >= 400 && res.status < 500){
        this.setMessage(CONSTANTS._server_error, 9999);
      }
      return res.json()
    })
    .then(json => {
      if (json.result == "done"){
        window.location.reload();
      }
      else{
        this.setMessage(CONSTANTS._server_error, 9999);
      }
    });
  }
}