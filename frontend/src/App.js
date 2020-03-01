import React from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch } from "react-router-dom";
import Search         from './app/Search';
import NotFound       from './app/NotFound';
import Register       from './app/user/Register';
import UserAdmin      from './app/UserAdmin';
import LoginForm      from './app/user/LoginForm';
import RosterUpload   from './app/RosterUpload';
import SystemAdmin    from './app/SystemAdmin';
import RecordDetail  from './app/RecordDetail';
import ResetPassword  from './app/user/ResetPassword';
import RecordEvent from './app/RecordEvent';
import ForgetPassword from './app/user/ForgetPassword';
import MainNavbar     from './utils/MainNavbar';
import ErrorMsg       from './utils/ErrorMsg';

import * as CONSTANTS from './Constants';
import './App.css';
import './style.css';

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      username: null,
      role: null,
      search_result: null,
      error: null,

      is_logged_in: localStorage.getItem('token') ? true : false,
    }
    this.onMouseMove = this.onMouseMove.bind(this);
    this.idle_timeout = null;
  }

  render(){
    return (
    <div className="App" onMouseMove={ this.onMouseMove }>
      <ErrorMsg>{ this.state.error }</ErrorMsg>
      
      <Router>
        <MainNavbar  
          logoutHandler={ this.logoutHandler }
          is_logged_in ={ this.state.is_logged_in }
          username     ={ this.state.username }
          role         ={ this.state.role }
          >
        </MainNavbar>

        {/* If not is_logged_in and is not reset_password, go to log_in page */}
        { this.state.is_logged_in || window.location.pathname.includes("reset_password")? null : <Redirect to="/login"/>}

        <Switch>
          <Route exact path="/" render={ this.state.is_logged_in ? (()=> <Redirect to={ CONSTANTS.DEFAULT_REDIRECT } />) : (()=> <Redirect to="/login" />) } />
          <Route path="/login"  render={(e) => <LoginForm loginHandler={ this.loginHandler } history={ e.history } />} />
          <Route path="/forget_password"      component={ ForgetPassword } />
          <Route path="/reset_password/:hash" component={ ResetPassword } /> } />
          <Route path="/reset_password"       component={ ResetPassword } /> } />
          <Route path="/register"             component={ Register } />
          
          <Route path="/search" render={(e)=> <Search history={ e.history } result={ this.state.search_result } />} />
          <Route path="/add"    render={(e)=> <RecordDetail action="add" role={ this.state.role } {...e} />} />
          <Route path="/record/:id" key={(e)=> e.match.params.id } render={(e)=> <RecordDetail  role={ this.state.role } {...e} action="edit" />} />
          <Route path="/event/:id"     key={(e)=> e.match.params.id } render={(e)=> <RecordEvent role={ this.state.role } {...e} />}/>
          <Route path="/import"   component={ RosterUpload } />
          <Route path="/sysadmin" component={ SystemAdmin } />
          <Route path="/usradmin" component={ UserAdmin } />
          <Route component={ NotFound } />
        </Switch>

      </Router>
    </div>
    );
  }

  componentDidMount() {
    
    document.title = CONSTANTS._title;

    /* Verify login status from server. If failed, log out. */
    if (this.state.is_logged_in){
      fetch(`${CONSTANTS.DOMAIN}/a/current_user/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      })
      .then(res  => res.json())
      .then(json => {
        if (json.username){
          this.setState({username: json.username, role: json.role});
        }
        else{
          this.logoutHandler();
        }
      })
      .then(()=>{ /* to do after logged in. */ });
    }
  }

  onMouseMove = (e) => {
    /* logout when no mouse movement (idle) for 30 mins */
    let max_idle = 30 * 60; /* in second */
    clearTimeout(this.idle_timeout);
    this.idle_timeout = setTimeout(()=>{
      this.logoutHandler();
    }, max_idle * 1000);
  };

  loginHandler = (e, data, history) => {
    e.preventDefault();
    this.setState({error: null});
    fetch(`${CONSTANTS.DOMAIN}/a/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    })
    .then(res => res.json())
    .then(json => {
      if (json.username){
        localStorage.setItem('token', json.token);
        this.setState({
          is_logged_in: true,
          username: json.username,
          role: json.role,
        });
        history.push("/");
      }
      else{
        /* login failed */
        this.setState({error: '帳號或密碼錯誤'});
      }
    })
    .catch(err => {
      this.setState({error: '系統錯誤'});
      console.log({err: err});
    });
  };

  logoutHandler = () => {
    localStorage.removeItem('token');
    this.setState({
      username: null,
      is_logged_in: false,
      role: null,
    });
  };

}