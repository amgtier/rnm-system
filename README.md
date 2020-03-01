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


End with an example of getting some data out of the system or using it for a little demo

## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc
