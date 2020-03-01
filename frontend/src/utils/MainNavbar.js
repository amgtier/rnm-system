import React from 'react';
import { Link }  from "react-router-dom";
import {
  Container,
  Navbar, NavbarBrand, 
  Nav, NavItem, NavLink,
  UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem,
  Button,
} from 'reactstrap';
import * as CONSTANTS from "../Constants";

export default function MainNavbar(props) {
  let username = (props.is_logged_in) ? (
    <NavItem className="text-light">
      <NavLink>{ props.username }</NavLink>
    </NavItem>) 
  : '';

  let logout   = (props.is_logged_in) ? (
    <Button onClick={ props.logoutHandler }>
      { CONSTANTS._logout }
    </Button>
  ) : (
    <NavLink tag={Link} to="/login">
      <Button outline>
        { CONSTANTS._not_logged_in }
      </Button>
    </NavLink>
  );
  
  let role = (props.is_logged_in) ? props.role : '';

  return (
    <Navbar className="navbar-dark bg-dark" color="faded" expand="md">
      <Container>
        {props.is_logged_in ? (
          <Nav navbar>
            <NavbarBrand tag={ Link } to="/" className="text-light">
              { CONSTANTS._title_short }
            </NavbarBrand>

            <NavItem>
              <NavLink tag={ Link } to="/search">{CONSTANTS._search_record}</NavLink>
            </NavItem>
            {["superuser", "leader"].includes(role) ? (
              <NavItem>
                 <NavLink tag={ Link } to="/add">{ CONSTANTS._add_record }</NavLink>
              </NavItem>
            ) : ''}
            {["superuser", "leader"].includes(role) ? (
              <NavItem>
                <NavLink tag={ Link } to="/import">{ CONSTANTS._import_record }</NavLink>
              </NavItem>
            ) : ''}

            { (role == 'superuser' ? (
            <UncontrolledDropdown nav inNavbar>
              <DropdownToggle nav caret>{ CONSTANTS._admin_options }</DropdownToggle>
              <DropdownMenu className="bg-dark">
                <DropdownItem className="text-light" onClick={ props.navHandler }>
                  <NavLink tag={ Link } to="/usradmin">{ CONSTANTS._user_admin }</NavLink>
                </DropdownItem>
                <DropdownItem className="text-light" onClick={ props.navHandler }>
                  <NavLink tag={ Link } to="/sysadmin">{ CONSTANTS._system_settings }</NavLink>
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
            ) : (
            <NavItem>
              <NavLink tag={ Link } to="/usradmin">{ CONSTANTS._user_admin }</NavLink>
            </NavItem>
            ))}
            
          </Nav>
        ) : (
        <Nav navbar>
            <NavbarBrand tag={ Link } to="/" className="text-light">{ CONSTANTS._title }</NavbarBrand>
        </Nav>
        ) }
        <Nav right="true">
          { username }
          { logout }
        </Nav>
      </Container>
    </Navbar>
  );
}