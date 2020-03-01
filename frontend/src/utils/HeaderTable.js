import React from 'react';
import {
  Table,
} from 'reactstrap';

export function RosterHeaderTable(){
  return (
    <Table className="header-table">
      <tbody>
        <tr>
          <td>1.<hr/>Name</td>
          <td>2.<hr/>Gender</td>
          <td>3.<hr/>Phone</td>
          <td>4.<hr/>Landline</td>
          <td>5.<hr/>Email</td>
          <td>6.<hr/>City</td>
          <td>7.<hr/>Township</td>
          <td>8.<hr/>Village</td>
          <td>9.<hr/>Address</td>
          <td>10.<hr/>Building</td>
        </tr>
        <tr>
          <td>11.<hr/>Res. Address</td>
          <td>12.<hr/>Birthday<hr/><span style={{"whiteSpace": "nowrap"}}>yyyy-mm-dd</span></td>
          <td>13.<hr/>Introducer</td>
          <td>14.<hr/>Introducer Phone</td>
          <td>15.<hr/>Spouse</td>
          <td>16.<hr/>Spouse Phone</td>
          <td>17.<hr/>Label 1</td>
          <td>18.<hr/>Label 2</td>
          <td>19.<hr/>Label 3</td>
          <td>20.<hr/>Label 4</td>
        </tr>
        <tr>
          <td>21.<hr/>Label 5</td>
          <td>22.<hr/>Label 6</td>
          <td>23.<hr/>Exp. Year</td>
          <td>24.<hr/>Exp. Name</td>
        </tr>
      </tbody>
    </Table>
    );
}

export function EventHeaderTable(){
  return (
    <div>
      <Table bordered className="header-table">
        <tbody>
          <tr>
            <td>1.<hr/>Name</td>
            <td>2.<hr/>Phone</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}