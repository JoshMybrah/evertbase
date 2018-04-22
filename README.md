# Evert

![Travis CI Build](https://travis-ci.org/evert-platform/evertbase.svg?branch=master "Travis CI Build")
[![Code Health](https://landscape.io/github/evert-platform/evertbase/master/landscape.svg?style=flat)](https://landscape.io/github/evert-platform/evertbase/master)

This is the base code for the Evert project. The aim of the project is to make a
pluggable web interface for the analysis of time series data.
The application is written primarily in Python using the Flask web-framework.

Current features:
* File uploads
* Plotting
* Dataviewer

With more features coming soon.


### Setting up conda environment
It is recommened to set up a `conda` environment containing all the packages required to run the application, to ensure working versions are used.

Clone the `master` branch of the repository to get the latest stable version of the application, then navigate to the folder in the command line.

Create a virtual environment for the app using the following command:

`conda env create --file environment.yml python=x.x`

Replacing the `x.x` with the python version. Evert currently supports `Python 3.4`, `Python 3.5` and `Python 3.6`.

Activate the environment using one of the following commands in the command line:
* Windows: `activate Evert`
* Linux/OSX: `source activate Evert`

The environment will need to be activated every time you wish to run the application. 

### Running the application
The application can be started in an IDE or in the command line using the following command:

`python manage.py`

Open your browser and go to: http://127.0.0.1:5000/
This may take a while. Keep refreshing the browser tab.
