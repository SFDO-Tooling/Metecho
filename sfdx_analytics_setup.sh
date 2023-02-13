#!/bin/bash
sfdx plugins:install @salesforce/analytics 
sfdx plugins:install sfdmu
echo y | sfdx plugins:install shane-sfdx-plugins
sfdx plugins 
whoami
pwd