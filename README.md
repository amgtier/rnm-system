# Relationship Networking Management System

A database scheme that features:
- Multiple-role access to the web user interface
- Merging records (of people) from Excel, which is a naive but always sufficiently useful solution applied by most people
- Actively and passively link the records

## Getting Started

The following instructions describe the prerequisites and implementation details.
This project utilizes Django Rest Framework (DRF) as the backend API server and ReactJS as the frontend framework.
(Tested with Python 3.7.3, Django v.2.2.4, DRF v.3.10.2, React v.16.8.6)

### Prerequisites

1. Frontend - Make sure that npm or yarn is installed. ([install npm](https://www.npmjs.com/get-npm)) ([install yarn](https://classic.yarnpkg.com/en/docs/install/))
The instructions utilises npm as package manager.
2. Backend - Make sure that you have Python v.3.7 and pip3 installed.


### Installing

Clone this project:
```
git clone https://github.com/amgtier/rnm-system
```

a) Backend
1. It is recommended for you to install the modules in a ```virtualenv```. 
2. Run ```pip3 install -r requirements.txt``` to install the required modules.

b) Frontend
1. go to frontend (```cd ./rnm-system/frontend```) and ```npm install --save package.json``` installs the needed packages.
2. run ```npm start``` then you can access your server at ```localhost:3000```.
